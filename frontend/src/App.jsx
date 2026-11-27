import { useState } from 'react'
import './App.css'
import ChatScreen from './ChatScreen.jsx'

const languages = [
  { name: 'Hindi', nativeName: 'हिन्दी', greeting: 'नमस्ते', color: 'saffron' },
  { name: 'Kannada', nativeName: 'ಕನ್ನಡ', greeting: 'ನಮಸ್ಕಾರ', color: 'blue' },
  { name: 'Tamil', nativeName: 'தமிழ்', greeting: 'வணக்கம்', color: 'coral' },
]

const features = [
  {
    number: '01',
    title: 'Practice real conversations',
    description:
      'Build confidence with everyday chats that feel natural, useful, and easy to come back to.',
    icon: 'chat',
  },
  {
    number: '02',
    title: 'Get instant corrections',
    description:
      'Learn from gentle, helpful feedback that makes every sentence a step forward.',
    icon: 'spark',
  },
  {
    number: '03',
    title: 'Try interactive roleplay',
    description:
      'Practice ordering chai, meeting a friend, and more in fun, low-pressure scenarios.',
    icon: 'play',
  },
]

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <path d="M8 11.5A4.5 4.5 0 0 1 12.5 7h15a4.5 4.5 0 0 1 4.5 4.5v10a4.5 4.5 0 0 1-4.5 4.5H18l-7 6v-6.7a4.5 4.5 0 0 1-3-4.3v-9.5Z" fill="currentColor" />
        <path d="M15 16h10M15 20h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="30.5" cy="29.5" r="5.5" fill="#F3AF69" stroke="#FFF9F2" strokeWidth="2" />
      </svg>
    </span>
  )
}

function FeatureIcon({ name }) {
  if (name === 'chat') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.2-3.1A7.5 7.5 0 1 1 20 11.5Z" />
        <path d="M8.5 11.5h7M8.5 14.5h4" />
      </svg>
    )
  }

  if (name === 'spark') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
        <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 9 9" />
      <path d="M10 8.5v7l6-3.5-6-3.5Z" fill="currentColor" stroke="none" />
      <path d="M16 3h5v5" />
      <path d="m21 3-6 6" />
    </svg>
  )
}

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('Hindi')
  const [isChatOpen, setIsChatOpen] = useState(false)

  function startLearning() {
    setIsChatOpen(true)
  }

  if (isChatOpen) {
    const activeLanguage = languages.find((language) => language.name === selectedLanguage)
    return <ChatScreen language={activeLanguage} onBack={() => setIsChatOpen(false)} />
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Polyglot AI home">
          <BrandMark />
          <span>polyglot<span className="brand-ai">ai</span></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#languages">Languages</a>
          <a href="#features">How it works</a>
        </nav>
        <a className="header-cta" href="#languages">
          Find your words <span aria-hidden="true">↗</span>
        </a>
      </header>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> A little practice. A lot more connection.</p>
            <h1>Speak a New Language. <span>Make a New Connection.</span></h1>
            <p className="hero-description">
              Meet your friendly AI language-learning companion. Practice Hindi, Kannada, or Tamil at your own pace, one conversation at a time.
            </p>
            <a className="text-link" href="#languages">
              Find a language to love <span aria-hidden="true">↓</span>
            </a>
            <div className="social-proof">
              <div className="avatar-stack" aria-hidden="true">
                <span>आ</span><span>ಕ</span><span>த</span>
              </div>
              <p><strong>Every word opens a door.</strong><br />Start with a simple hello.</p>
            </div>
          </div>

          <div className="hero-art" aria-label="A preview of a Hindi vocabulary card">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="floating-note note-top"><span>✦</span> Learn at your pace</div>
            <div className="practice-card">
              <div className="practice-card-head">
                <span className="practice-card-label">A WORD WORTH KNOWING</span>
                <span className="practice-card-count">01 <span>/ 05</span></span>
              </div>
              <div className="practice-word" lang="hi">नमस्ते</div>
              <p className="practice-transliteration">na-ma-ste</p>
              <div className="practice-meaning">
                <span>MEANS</span>
                <strong>Hello, a warm greeting</strong>
              </div>
              <div className="practice-card-footer"><span>HINDI · EVERYDAY WORDS</span><span className="practice-next">↗</span></div>
            </div>
            <div className="floating-note note-bottom"><span className="note-spark">✳</span> Little wins, every day</div>
            <div className="art-sun" aria-hidden="true">✳</div>
          </div>
        </section>

        <section className="language-section" id="languages">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR NEXT HELLO</p>
              <h2>Which language feels like <em>you?</em></h2>
            </div>
            <p className="section-intro">Choose a language to start exploring. You can always switch things up later.</p>
          </div>
          <div className="language-grid" role="group" aria-label="Choose a language">
            {languages.map((language) => (
              <button
                className={`language-card ${language.color}${selectedLanguage === language.name ? ' selected' : ''}`}
                key={language.name}
                type="button"
                aria-pressed={selectedLanguage === language.name}
                onClick={() => {
                  setSelectedLanguage(language.name)
                }}
              >
                <span className="language-script" lang={language.name === 'Hindi' ? 'hi' : language.name === 'Kannada' ? 'kn' : 'ta'}>{language.nativeName}</span>
                <span className="language-name">{language.name}<span className="card-arrow" aria-hidden="true">↗</span></span>
                <span className="language-caption">Say hello in {language.name}</span>
                <span className="selection-check" aria-hidden="true">✓</span>
              </button>
            ))}
          </div>
          <div className="start-row">
            <div className="start-prompt"><span className="tiny-spark">✦</span> Your first step is the best one.</div>
            <div className="start-action">
              <button className="start-button" type="button" onClick={startLearning}>
                Start Learning <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="features-heading">
            <p className="eyebrow">MADE FOR REAL LIFE</p>
            <h2>Learning that feels like <em>living.</em></h2>
            <p>Less memorizing. More moments that make a language yours.</p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.number}>
                <div className={`feature-icon feature-icon-${feature.icon}`}><FeatureIcon name={feature.icon} /></div>
                <span className="feature-number">{feature.number}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <span className="feature-line" />
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#home">
          <BrandMark />
          <span>polyglot<span className="brand-ai">ai</span></span>
        </a>
        <p>Made with curiosity, for the words that bring us closer.</p>
        <a className="back-to-top" href="#home">Back to top ↑</a>
      </footer>
    </div>
  )
}

export default App
