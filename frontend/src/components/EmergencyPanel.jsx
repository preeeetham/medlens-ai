/**
 * EmergencyPanel — side panel showing triage status and activity log.
 */
export default function EmergencyPanel({
    triageLevel = 'none',
    logs = [],
    agentConnected = false,
}) {
    const triageConfig = {
        none: { label: 'Awaiting Assessment', icon: '⏳', class: 'triage-badge--none' },
        green: { label: 'GREEN — Minor', icon: '🟢', class: 'triage-badge--green' },
        yellow: { label: 'YELLOW — Delayed', icon: '🟡', class: 'triage-badge--yellow' },
        red: { label: 'RED — Immediate', icon: '🔴', class: 'triage-badge--red' },
        black: { label: 'BLACK — Expectant', icon: '⚫', class: 'triage-badge--black' },
    }

    const triage = triageConfig[triageLevel] || triageConfig.none

    return (
        <>
            {/* Triage Status */}
            <div className="triage-section">
                <div className={`triage-badge ${triage.class}`}>
                    <span className="triage-icon">{triage.icon}</span>
                    {triage.label}
                </div>
            </div>

            {/* Activity Log */}
            <div className="activity-section">
                <div className="activity-header">Activity Log</div>
                <div className="activity-log">
                    {logs.length === 0 ? (
                        <div className="log-entry">
                            <span className="log-icon">💡</span>
                            <div className="log-content">
                                <div className="log-text">
                                    {agentConnected
                                        ? 'MedLens AI is watching. Point your camera at the situation.'
                                        : 'Waiting for MedLens AI agent to connect...'}
                                </div>
                            </div>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div className="log-entry" key={log.id}>
                                <span className="log-icon">{log.icon}</span>
                                <div className="log-content">
                                    <div className="log-text">{log.text}</div>
                                    <div className="log-time">{log.time}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    )
}
