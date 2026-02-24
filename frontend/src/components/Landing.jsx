import { useState } from 'react'

/**
 * Landing page — shown before connecting to a call.
 * User enters Stream API key, user token, user ID, and call ID.
 */
export default function Landing({ onConnect, connectionState }) {
    const [apiKey, setApiKey] = useState('')
    const [token, setToken] = useState('')
    const [userId, setUserId] = useState('')
    const [callId, setCallId] = useState('')

    const isConnecting = connectionState === 'connecting'
    const canSubmit = apiKey && token && userId && callId && !isConnecting

    const handleSubmit = (e) => {
        e.preventDefault()
        if (canSubmit) {
            onConnect({ apiKey, token, userId, callId })
        }
    }

    return (
        <div className="landing">
            <div className="landing__hero">
                <div className="landing__logo">🏥</div>
                <h1 className="landing__title">MedLens AI</h1>
                <p className="landing__desc">
                    Real-time medical emergency triage & first-aid coaching.
                    Point your camera at any injury or emergency — MedLens AI will guide you
                    with calm, step-by-step voice instructions.
                </p>
            </div>

            <form className="landing__form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="connect-input"
                    placeholder="Stream API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    autoComplete="off"
                />
                <input
                    type="text"
                    className="connect-input"
                    placeholder="User Token (from backend)"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    autoComplete="off"
                />
                <input
                    type="text"
                    className="connect-input"
                    placeholder="User ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    autoComplete="off"
                />
                <input
                    type="text"
                    className="connect-input"
                    placeholder="Call ID (e.g. medlens-session-1)"
                    value={callId}
                    onChange={(e) => setCallId(e.target.value)}
                    autoComplete="off"
                />
                <button
                    type="submit"
                    className="connect-btn"
                    disabled={!canSubmit}
                >
                    {isConnecting ? '⏳ Connecting...' : '🔗 Connect to MedLens AI'}
                </button>
            </form>

            <div className="landing__features">
                <div className="feature-chip">
                    <span className="feature-chip__icon">👁️</span>
                    Real-Time Vision
                </div>
                <div className="feature-chip">
                    <span className="feature-chip__icon">🎙️</span>
                    Voice Guided
                </div>
                <div className="feature-chip">
                    <span className="feature-chip__icon">🏥</span>
                    Medical Triage
                </div>
                <div className="feature-chip">
                    <span className="feature-chip__icon">🚨</span>
                    Emergency Alerts
                </div>
                <div className="feature-chip">
                    <span className="feature-chip__icon">🤖</span>
                    YOLO Detection
                </div>
            </div>
        </div>
    )
}
