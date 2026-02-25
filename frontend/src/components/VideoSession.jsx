import { useEffect, useState, useCallback, useRef } from 'react'
import {
    StreamCall,
    useCall,
    useCallStateHooks,
    ParticipantView,
} from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'
import { StreamChat } from 'stream-chat'
import EmergencyPanel from './EmergencyPanel'
import ChatPanel from './ChatPanel'
import Header from './Header'

/**
 * VideoSession — the main call view after connecting.
 * Manages the Stream call lifecycle, displays video, and the side panel with chat.
 */
export default function VideoSession({ client, callInfo, onDisconnect }) {
    const [call, setCall] = useState(null)
    const [joined, setJoined] = useState(false)
    const [chatClient, setChatClient] = useState(null)

    useEffect(() => {
        const c = client.call(callInfo.callType, callInfo.callId)

        c.join({ create: true })
            .then(() => {
                setCall(c)
                setJoined(true)
            })
            .catch((err) => {
                console.error('Failed to join call:', err)
            })

        // Initialize Stream Chat client (same API key, same user)
        const initChat = async () => {
            try {
                const chat = new StreamChat(callInfo.apiKey)
                await chat.connectUser(
                    { id: callInfo.userId, name: callInfo.userName || 'User' },
                    callInfo.token
                )
                setChatClient(chat)
            } catch (err) {
                console.error('Chat connect error:', err)
            }
        }
        initChat()

        return () => {
            c.leave().catch(() => { })
            setJoined(false)
            if (chatClient) {
                chatClient.disconnectUser().catch(() => { })
            }
        }
    }, [client, callInfo])

    const handleLeave = useCallback(async () => {
        if (call) {
            await call.leave()
        }
        if (chatClient) {
            await chatClient.disconnectUser().catch(() => { })
        }
        onDisconnect()
    }, [call, chatClient, onDisconnect])

    if (!call || !joined) {
        return (
            <>
                <Header connected={false} />
                <div className="main-content">
                    <div className="video-section">
                        <div className="video-placeholder">
                            <div className="video-placeholder__icon">⏳</div>
                            <div className="video-placeholder__text">
                                <h2 className="video-placeholder__title">Joining Session...</h2>
                                <p className="video-placeholder__desc">
                                    Connecting to the MedLens AI agent. This may take a moment.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="side-panel">
                        <EmergencyPanel />
                    </div>
                </div>
            </>
        )
    }

    return (
        <StreamCall call={call}>
            <CallUI
                onLeave={handleLeave}
                chatClient={chatClient}
                channelId={callInfo.callId}
            />
        </StreamCall>
    )
}

/**
 * CallUI — rendered inside StreamCall context.
 * Has access to call state hooks. Includes video, controls, triage panel, and chat.
 */
function CallUI({ onLeave, chatClient, channelId }) {
    const call = useCall()
    const {
        useParticipants,
        useCameraState,
        useMicrophoneState,
    } = useCallStateHooks()
    const participants = useParticipants()
    const { camera, isMute: isCameraMute } = useCameraState()
    const { microphone, isMute: isMicMute } = useMicrophoneState()

    const [logs, setLogs] = useState([])
    const [triageLevel, setTriageLevel] = useState('none')
    const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'triage'

    const addLog = useCallback((icon, text) => {
        const time = new Date().toLocaleTimeString()
        setLogs((prev) => [{ icon, text, time, id: Date.now() }, ...prev].slice(0, 50))
    }, [])

    // Log when participants join/leave
    useEffect(() => {
        if (participants.length > 0) {
            const agentParticipant = participants.find(
                (p) => p.userId === 'medlens-agent'
            )
            if (agentParticipant) {
                addLog('🤖', 'MedLens AI agent connected')
                setTriageLevel('none')
            }
        }
    }, [participants.length])

    // Get local and remote participants
    const localParticipant = participants.find((p) => p.isLocalParticipant)
    const remoteParticipants = participants.filter((p) => !p.isLocalParticipant)
    const agentConnected = remoteParticipants.length > 0

    const toggleCamera = () => camera.toggle()
    const toggleMic = () => microphone.toggle()

    return (
        <>
            <Header connected={true} participantCount={participants.length} />
            <div className="main-content">
                <div className="video-section">
                    {localParticipant ? (
                        <div className="video-container">
                            <ParticipantView
                                participant={localParticipant}
                                trackType="videoTrack"
                                mirror={true}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                    ) : (
                        <div className="video-placeholder">
                            <div className="video-placeholder__icon">📷</div>
                            <div className="video-placeholder__text">
                                <h2 className="video-placeholder__title">Camera Starting...</h2>
                                <p className="video-placeholder__desc">
                                    Enable your camera to let MedLens AI see the situation.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Video controls overlay */}
                    <div className="video-overlay">
                        <button
                            className={`control-btn ${isMicMute ? 'control-btn--primary' : 'control-btn--active'}`}
                            onClick={toggleMic}
                            title={isMicMute ? 'Unmute' : 'Mute'}
                        >
                            {isMicMute ? '🔇' : '🎙️'}
                        </button>
                        <button
                            className={`control-btn ${isCameraMute ? 'control-btn--primary' : 'control-btn--active'}`}
                            onClick={toggleCamera}
                            title={isCameraMute ? 'Start Camera' : 'Stop Camera'}
                        >
                            {isCameraMute ? '📷' : '🎥'}
                        </button>
                        <button
                            className="control-btn control-btn--danger"
                            onClick={onLeave}
                            title="Leave Session"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="side-panel">
                    {/* Tab switcher */}
                    <div className="panel-tabs">
                        <button
                            className={`panel-tab ${activeTab === 'chat' ? 'panel-tab--active' : ''}`}
                            onClick={() => setActiveTab('chat')}
                        >
                            💬 Chat
                        </button>
                        <button
                            className={`panel-tab ${activeTab === 'triage' ? 'panel-tab--active' : ''}`}
                            onClick={() => setActiveTab('triage')}
                        >
                            🏥 Triage
                        </button>
                    </div>

                    {activeTab === 'chat' ? (
                        <ChatPanel
                            chatClient={chatClient}
                            channelId={channelId}
                            agentConnected={agentConnected}
                        />
                    ) : (
                        <EmergencyPanel
                            triageLevel={triageLevel}
                            logs={logs}
                            agentConnected={agentConnected}
                        />
                    )}
                </div>
            </div>
        </>
    )
}
