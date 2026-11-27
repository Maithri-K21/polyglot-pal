import { useState } from 'react'
import './ChatScreen.css'

const conversationStarters = [
  'Teach me a basic greeting',
  "Let's practice a conversation",
  'Correct my sentence',
]

const CHAT_API_URL =
  import.meta.env.VITE_CHAT_API_URL || 'http://127.0.0.1:5000/api/chat'

async function sendMessageToBackend(message, language) {
  let response
  try {
    response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language }),
      signal: AbortSignal.timeout(30_000),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error('The request timed out. Please try again.', { cause: error })
    }
    throw new Error('Could not reach the chat service. Please check that the backend is running.', { cause: error })
  }

  let result
  try {
    result = await response.json()
  } catch {
    if (!response.ok) {
      throw new Error(`The chat service returned status ${response.status}.`)
    }
    throw new Error('The chat service returned an invalid response.')
  }

  if (!response.ok) {
    const detail = typeof result?.error === 'string'
      ? result.error
      : `The chat service returned status ${response.status}.`
    throw new Error(detail)
  }

  return result
}

function ChatScreen({ language, onBack }) {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([])
  const [statusMessage, setStatusMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const apiIsConfigured = Boolean(CHAT_API_URL)

  function chooseStarter(starter) {
    setDraft(starter)
    setStatusMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const message = draft.trim()

    if (!message || isSending) {
      return
    }

    setIsSending(true)
    setStatusMessage('')

    try {
      const result = await sendMessageToBackend(message, language.name)
      const reply = typeof result?.reply === 'string' ? result.reply.trim() : ''

      if (!reply) {
        throw new Error('The chat service response did not include a reply.')
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'user', text: message },
        { role: 'tutor', text: reply },
      ])
      setDraft('')
    } catch (error) {
      const detail = error instanceof Error && error.message
        ? error.message
        : 'Please try again.'
      setStatusMessage(`Your message could not be sent. ${detail}`)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className="chat-page">
      <header className="chat-topbar">
        <button className="back-button" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span> Back to home
        </button>
        <a className="chat-brand" href="#home" onClick={onBack} aria-label="Polyglot Pal home">
          <span className="chat-brand-mark" aria-hidden="true">P</span>
          <span>polyglot<span>pal</span></span>
        </a>
        <span className="language-pill">
          <span className={`language-pill-dot ${language.color}`} />
          {language.nativeName} <span>{language.name}</span>
        </span>
      </header>

      <section className="chat-content" aria-labelledby="chat-title">
        <div className="tutor-heading">
          <div className="tutor-mark" aria-hidden="true">
            <svg viewBox="0 0 40 40" fill="none">
              <path d="M7 10.5A4.5 4.5 0 0 1 11.5 6h17a4.5 4.5 0 0 1 4.5 4.5v13a4.5 4.5 0 0 1-4.5 4.5H18l-7 6v-6.7a4.5 4.5 0 0 1-4-4.3v-12.5Z" fill="currentColor" />
              <path d="M14 15h13M14 20h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="tutor-heading-copy">
            <p className="tutor-kicker">YOUR LANGUAGE LEARNING SPACE</p>
            <h1 id="chat-title">Your {language.name} practice</h1>
            <p>Take it one word, one conversation at a time.</p>
          </div>
          <span className={`connection-badge${apiIsConfigured ? ' configured' : ''}`}>
            <span /> {apiIsConfigured ? 'API configured' : 'Setup in progress'}
          </span>
        </div>

        <div className="chat-panel">
          <div className="tutor-bar">
            <div className="tutor-avatar-small" aria-hidden="true">P</div>
            <div>
              <strong>Polyglot Pal tutor</strong>
              <span>AI language companion · {language.name}</span>
            </div>
            <span className="tutor-language-label">{language.nativeName}</span>
          </div>

          <div className="chat-transcript" role="log" aria-live="polite" aria-label="Conversation">
            {messages.length === 0 ? (
              <div className="chat-empty-state">
                <div className="empty-state-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48" fill="none">
                    <path d="M8 12.5A5.5 5.5 0 0 1 13.5 7h21a5.5 5.5 0 0 1 5.5 5.5v14a5.5 5.5 0 0 1-5.5 5.5H22l-9 7v-8.1A5.5 5.5 0 0 1 8 26.5v-14Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M17 18h14M17 24h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <h2>Every great conversation starts somewhere.</h2>
                <p>Choose a starter below or write your own message in {language.name}.</p>
              </div>
            ) : (
              <div className="message-list">
                {messages.map((item, index) => (
                  <div className={`chat-message ${item.role}`} key={`${item.role}-${index}`}>
                    {item.role === 'tutor' && <span className="message-avatar" aria-hidden="true">P</span>}
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!apiIsConfigured && (
            <div className="integration-notice" role="note">
              <span className="notice-icon" aria-hidden="true">i</span>
              <p><strong>AI chat isn&apos;t connected yet.</strong> Messages won&apos;t be sent until the backend is integrated.</p>
            </div>
          )}

          <div className="starter-area">
            <p className="starter-label">NEED A PLACE TO START?</p>
            <div className="starter-list">
              {conversationStarters.map((starter) => (
                <button
                  className="starter-button"
                  type="button"
                  key={starter}
                  onClick={() => chooseStarter(starter)}
                >
                  {starter} <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
          </div>

          <form className="chat-composer" onSubmit={handleSubmit}>
            <label className="visually-hidden" htmlFor="chat-message">Your message</label>
            <input
              id="chat-message"
              type="text"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value)
                setStatusMessage('')
              }}
              placeholder={`Write a message in ${language.name}...`}
              autoComplete="off"
            />
            <button type="submit" disabled={!draft.trim() || isSending}>
              {isSending ? 'Sending...' : 'Send'} <span aria-hidden="true">→</span>
            </button>
          </form>

          {statusMessage && <p className="chat-status" role="alert">{statusMessage}</p>}
          <p className="chat-footnote">A gentle space to learn. Mistakes are part of the conversation.</p>
        </div>
      </section>
    </main>
  )
}

export default ChatScreen
