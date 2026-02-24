/**
 * Header — top bar with branding and connection status.
 */
export default function Header({ connected, participantCount = 0 }) {
    const statusClass = connected ? 'status-badge--connected' : 'status-badge--disconnected'
    const statusText = connected ? 'LIVE' : 'OFFLINE'

    return (
        <header className="header">
            <div className="header__brand">
                <div className="header__logo">🏥</div>
                <div>
                    <div className="header__title">MedLens AI</div>
                    <div className="header__subtitle">Real-Time First Aid Assistant</div>
                </div>
            </div>

            <div className="header__status">
                {connected && participantCount > 0 && (
                    <span className="status-badge status-badge--connected">
                        <span className="status-dot status-dot--active" />
                        {participantCount} in session
                    </span>
                )}
                <span className={`status-badge ${statusClass}`}>
                    <span className={`status-dot ${connected ? 'status-dot--active' : ''}`} />
                    {statusText}
                </span>
            </div>
        </header>
    )
}
