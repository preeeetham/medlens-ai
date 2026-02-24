import { useState, useCallback } from 'react'

/**
 * EmergencyPanel V2 — side panel with triage, activity log, and training mode.
 */
export default function EmergencyPanel({
    triageLevel = 'none',
    logs = [],
    agentConnected = false,
}) {
    const [isTrainingMode, setIsTrainingMode] = useState(false)

    const triageConfig = {
        none: { label: 'Awaiting Assessment', icon: '⏳', class: 'triage-badge--none', desc: 'Point your camera at a situation' },
        green: { label: 'GREEN — Minor', icon: '🟢', class: 'triage-badge--green', desc: 'Self-treatable injury detected' },
        yellow: { label: 'YELLOW — Delayed', icon: '🟡', class: 'triage-badge--yellow', desc: 'Needs attention but stable' },
        red: { label: 'RED — Immediate', icon: '🔴', class: 'triage-badge--red', desc: 'Life-threatening — urgent care needed' },
        black: { label: 'BLACK — Expectant', icon: '⚫', class: 'triage-badge--black', desc: 'Requires advanced medical intervention' },
    }

    const triage = triageConfig[triageLevel] || triageConfig.none
    const isUrgent = triageLevel === 'red' || triageLevel === 'black'

    return (
        <>
            {/* Emergency Alert Banner */}
            {isUrgent && (
                <div className="emergency-banner">
                    <span className="emergency-banner__icon">🚨</span>
                    <div className="emergency-banner__text">
                        <strong>EMERGENCY DETECTED</strong>
                        <span>{triage.desc}</span>
                    </div>
                </div>
            )}

            {/* Triage Status */}
            <div className="triage-section">
                <div className={`triage-badge ${triage.class}`}>
                    <span className="triage-icon">{triage.icon}</span>
                    <div className="triage-info">
                        <span className="triage-label">{triage.label}</span>
                        <span className="triage-desc">{triage.desc}</span>
                    </div>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="mode-toggle">
                <button
                    className={`mode-btn ${!isTrainingMode ? 'mode-btn--active' : ''}`}
                    onClick={() => setIsTrainingMode(false)}
                >
                    🏥 Triage
                </button>
                <button
                    className={`mode-btn ${isTrainingMode ? 'mode-btn--active' : ''}`}
                    onClick={() => setIsTrainingMode(true)}
                >
                    💪 CPR Training
                </button>
            </div>

            {/* Training Mode Panel */}
            {isTrainingMode && (
                <div className="training-panel">
                    <div className="training-header">CPR Training Mode</div>
                    <div className="training-tips">
                        <div className="training-tip">
                            <span className="training-tip__icon">🤲</span>
                            <span>Hands center of chest</span>
                        </div>
                        <div className="training-tip">
                            <span className="training-tip__icon">💪</span>
                            <span>Lock elbows straight</span>
                        </div>
                        <div className="training-tip">
                            <span className="training-tip__icon">📏</span>
                            <span>2 inches deep</span>
                        </div>
                        <div className="training-tip">
                            <span className="training-tip__icon">⏱️</span>
                            <span>100-120 per minute</span>
                        </div>
                        <div className="training-tip">
                            <span className="training-tip__icon">🔄</span>
                            <span>30 compressions → 2 breaths</span>
                        </div>
                    </div>
                    <p className="training-cta">
                        Say <strong>"practice CPR"</strong> to begin
                    </p>
                </div>
            )}

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
