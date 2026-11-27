import os
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

from google.genai import errors
from google.genai._interactions_errors import APIConnectionError, APITimeoutError, InternalServerError, RateLimitError

from app import DEFAULT_MODEL, app


class ChatApiTests(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_health_check(self):
        response = self.client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"status": "ok"})

    def test_allows_local_vite_origins(self):
        for origin in ("http://localhost:5173", "http://127.0.0.1:5173"):
            with self.subTest(origin=origin):
                response = self.client.get(
                    "/api/health",
                    headers={"Origin": origin},
                )
                self.assertEqual(
                    response.headers.get("Access-Control-Allow-Origin"),
                    origin,
                )

    def test_rejects_unsupported_language_without_calling_gemini(self):
        with patch("app.genai.Client") as client_factory:
            response = self.client.post(
                "/api/chat",
                json={"message": "Hello", "language": "French"},
            )

        self.assertEqual(response.status_code, 400)
        client_factory.assert_not_called()

    def test_returns_gemini_reply_in_frontend_format(self):
        interaction = SimpleNamespace(output_text="नमस्ते means hello.")
        fake_client = SimpleNamespace(
            interactions=SimpleNamespace(create=Mock(return_value=interaction))
        )

        with (
            patch.dict(os.environ, {"GEMINI_API_KEY": "test-key", "GEMINI_MODEL": "test-model"}),
            patch("app.genai.Client", return_value=fake_client),
        ):
            response = self.client.post(
                "/api/chat",
                json={"message": "Teach me a basic greeting", "language": "Hindi"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"reply": "नमस्ते means hello."})
        request_args = fake_client.interactions.create.call_args.kwargs
        self.assertEqual(request_args["model"], "test-model")
        self.assertEqual(request_args["input"], "Teach me a basic greeting")
        self.assertEqual(request_args["store"], False)
        self.assertIn("Hindi", request_args["system_instruction"])

    def test_reports_missing_api_key(self):
        with (
            patch.dict(os.environ, {"GEMINI_API_KEY": ""}),
            patch("app.genai.Client") as client_factory,
        ):
            response = self.client.post(
                "/api/chat",
                json={"message": "Hello", "language": "Kannada"},
            )

        self.assertEqual(response.status_code, 503)
        self.assertIn("GEMINI_API_KEY", response.get_json()["error"])
        client_factory.assert_not_called()

    def test_uses_default_gemini_3_8_flash_when_model_unset(self):
        interaction = SimpleNamespace(output_text="ನಮಸ್ಕಾರ means hello.")
        fake_client = SimpleNamespace(
            interactions=SimpleNamespace(create=Mock(return_value=interaction))
        )

        with (
            patch.dict(os.environ, {"GEMINI_API_KEY": "test-key", "GEMINI_MODEL": ""}),
            patch("app.genai.Client", return_value=fake_client),
        ):
            response = self.client.post(
                "/api/chat",
                json={"message": "Hello", "language": "Kannada"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(DEFAULT_MODEL, "gemini-3.8-flash")
        request_args = fake_client.interactions.create.call_args.kwargs
        self.assertEqual(request_args["model"], "gemini-3.8-flash")

    def test_returns_503_json_on_gemini_503_high_demand_error(self):
        response_503 = SimpleNamespace(request=None, status_code=503)
        service_error = InternalServerError(
            "Model overloaded",
            response=response_503,
            body={"error": {"code": 503, "message": "High demand"}},
        )
        fake_client = SimpleNamespace(
            interactions=SimpleNamespace(create=Mock(side_effect=service_error))
        )

        with (
            patch.dict(os.environ, {"GEMINI_API_KEY": "secret-key-should-not-leak"}),
            patch("app.genai.Client", return_value=fake_client),
        ):
            response = self.client.post(
                "/api/chat",
                json={"message": "Hello", "language": "Tamil"},
            )

        self.assertEqual(response.status_code, 503)
        payload = response.get_json()
        self.assertIn("high demand", payload["error"].lower())
        self.assertNotIn("secret-key-should-not-leak", payload["error"])

    def test_returns_503_json_on_genai_api_error_503(self):
        api_error = errors.ServerError(
            503,
            {"error": {"code": 503, "message": "Unavailable", "status": "UNAVAILABLE"}},
        )
        fake_client = SimpleNamespace(
            interactions=SimpleNamespace(create=Mock(side_effect=api_error))
        )

        with (
            patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}),
            patch("app.genai.Client", return_value=fake_client),
        ):
            response = self.client.post(
                "/api/chat",
                json={"message": "Hello", "language": "Hindi"},
            )

        self.assertEqual(response.status_code, 503)
        self.assertIn("high demand", response.get_json()["error"].lower())

    def test_returns_429_json_on_rate_limit_error(self):
        response_429 = SimpleNamespace(request=None, status_code=429)
        rate_error = RateLimitError("Too many requests", response=response_429, body={})
        fake_client = SimpleNamespace(
            interactions=SimpleNamespace(create=Mock(side_effect=rate_error))
        )

        with (
            patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}),
            patch("app.genai.Client", return_value=fake_client),
        ):
            response = self.client.post(
                "/api/chat",
                json={"message": "Hello", "language": "Hindi"},
            )

        self.assertEqual(response.status_code, 429)
        self.assertIn("too many requests", response.get_json()["error"].lower())

    def test_returns_504_json_on_timeout_error(self):
        timeout_error = APITimeoutError(request=None)
        fake_client = SimpleNamespace(
            interactions=SimpleNamespace(create=Mock(side_effect=timeout_error))
        )

        with (
            patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}),
            patch("app.genai.Client", return_value=fake_client),
        ):
            response = self.client.post(
                "/api/chat",
                json={"message": "Hello", "language": "Hindi"},
            )

        self.assertEqual(response.status_code, 504)
        self.assertIn("too long", response.get_json()["error"].lower())

    def test_returns_502_json_on_connection_or_unexpected_error(self):
        conn_error = APIConnectionError(request=None)
        fake_client = SimpleNamespace(
            interactions=SimpleNamespace(create=Mock(side_effect=conn_error))
        )

        with (
            patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}),
            patch("app.genai.Client", return_value=fake_client),
        ):
            response = self.client.post(
                "/api/chat",
                json={"message": "Hello", "language": "Kannada"},
            )

        self.assertEqual(response.status_code, 502)
        self.assertIn("could not generate a reply", response.get_json()["error"].lower())


if __name__ == "__main__":
    unittest.main()
