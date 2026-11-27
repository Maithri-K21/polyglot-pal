import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, current_app, jsonify, request
from flask_cors import CORS
from google import genai
from google.genai import errors

BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")

DEFAULT_MODEL = "gemini-3.8-flash"
SUPPORTED_LANGUAGES = {"Hindi", "Kannada", "Tamil"}
FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": FRONTEND_ORIGINS}})


def build_tutor_instructions(language):
    return f"""You are Polyglot Pal, a friendly and patient AI language-learning tutor.
The learner is practicing {language}; focus on teaching that language.

Help the learner with natural conversation practice, sentence corrections,
beginner-friendly explanations, and interactive roleplay. Keep replies concise,
warm, and encouraging. Use simple {language} examples with transliteration and
clear English meanings when helpful. When correcting a sentence, show the
natural correction and briefly explain why. In roleplay, stay in character and
invite the learner to take the next turn. Adapt to the learner's level, and
gently guide unrelated requests back toward practicing {language}."""


def get_gemini_api_key():
    return (os.getenv("GEMINI_API_KEY") or "").strip()


def get_gemini_model():
    return (os.getenv("GEMINI_MODEL") or "").strip() or DEFAULT_MODEL


def get_error_status_code(error):
    for candidate in (error, getattr(error, "__cause__", None)):
        if candidate is None:
            continue
        for attr in ("status_code", "code"):
            value = getattr(candidate, attr, None)
            if isinstance(value, int):
                return value
    return None


def map_gemini_error(error):
    cause = getattr(error, "__cause__", None)
    if (
        isinstance(error, TimeoutError)
        or isinstance(cause, TimeoutError)
        or type(error).__name__ == "APITimeoutError"
        or type(cause).__name__ == "APITimeoutError"
    ):
        return 504, "The AI tutor took too long to respond. Please try again."

    status_code = get_error_status_code(error)
    if status_code == 503:
        return 503, "The AI tutor is currently experiencing high demand. Please try again in a moment."
    if status_code == 429:
        return 429, "The AI tutor is receiving too many requests right now. Please wait a moment and try again."
    if status_code in (401, 403):
        return 502, "The AI tutor could not authenticate with Gemini. Check the server API key configuration."
    if status_code in (400, 404):
        return 502, "The configured Gemini model or request could not be processed. Check GEMINI_MODEL in backend/.env."
    if status_code == 504:
        return 504, "The AI tutor timed out while generating a reply. Please try again."

    return 502, "The AI tutor could not generate a reply. Please try again."


def generate_tutor_reply(message, language):
    client = genai.Client(api_key=get_gemini_api_key())
    interaction = client.interactions.create(
        model=get_gemini_model(),
        system_instruction=build_tutor_instructions(language),
        input=message,
        store=False,
        generation_config={"max_output_tokens": 800},
    )
    return interaction.output_text


@app.get("/api/health")
def health_check():
    return jsonify(status="ok")


@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="Request body must be a JSON object."), 400

    message = data.get("message")
    language = data.get("language")

    if not isinstance(message, str) or not message.strip():
        return jsonify(error="A non-empty message is required."), 400
    if len(message) > 2000:
        return jsonify(error="Messages must be 2000 characters or fewer."), 400
    if not isinstance(language, str) or language not in SUPPORTED_LANGUAGES:
        return jsonify(error="Choose Hindi, Kannada, or Tamil."), 400
    if not get_gemini_api_key():
        return jsonify(error="Gemini is not configured. Add GEMINI_API_KEY to backend/.env."), 503

    try:
        reply = generate_tutor_reply(message.strip(), language)
    except Exception as exc:
        # Interactions errors (e.g. InternalServerError) do not inherit from errors.APIError.
        current_app.logger.exception("Gemini API request failed")
        status_code, error_message = map_gemini_error(exc)
        return jsonify(error=error_message), status_code

    if not isinstance(reply, str) or not reply.strip():
        current_app.logger.error("Gemini returned an empty text response")
        return jsonify(error="The AI tutor returned an empty reply. Please try again."), 502

    return jsonify(reply=reply.strip())


if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="127.0.0.1", port=5000, debug=debug_mode)
