import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * ChatPanel — real-time chat with the MedLens AI agent.
 * Uses Stream Chat channel to display agent messages and accept user text input.
 */
export default function ChatPanel({ chatClient, channelId, agentConnected }) {
    const [messages, setMessages] = useState([])
    const [inputText, setInputText] = useState('')
    const [channel, setChannel] = useState(null)
    const messagesEndRef = useRef(null)

    // Initialize channel and listen for messages
    useEffect(() => {
        if (!chatClient || !channelId) return

        let ch = null
        let handler = null

        const init = async () => {
            try {
                ch = chatClient.channel('messaging', channelId)
                await ch.watch()
                setChannel(ch)

                // Load existing messages
                const existing = ch.state.messages || []
                setMessages(
                    existing.map((m) => ({
                        id: m.id,
                        text: m.text || '',
                        user: m.user?.id || 'unknown',
                        name: m.user?.name || m.user?.id || 'Unknown',
                        isAgent: m.user?.id === 'medlens-agent',
                        time: new Date(m.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                    }))
                )

                // Listen for new messages
                handler = ch.on('message.new', (event) => {
                    const m = event.message
                    if (!m || !m.text) return
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: m.id,
                            text: m.text,
                            user: m.user?.id || 'unknown',
                            name: m.user?.name || m.user?.id || 'Unknown',
                            isAgent: m.user?.id === 'medlens-agent',
                            time: new Date(m.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            }),
                        },
                    ])
                })
            } catch (err) {
                console.error('Chat init error:', err)
            }
        }

        init()

        return () => {
            if (handler) handler.unsubscribe()
        }
    }, [chatClient, channelId])

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Send text message
    const sendMessage = useCallback(
        async (e) => {
            e.preventDefault()
            if (!inputText.trim() || !channel) return

            try {
                await channel.sendMessage({ text: inputText.trim() })
                setInputText('')
            } catch (err) {
                console.error('Failed to send message:', err)
            }
        },
        [inputText, channel]
    )

    return (
        <div className="chat-panel">
            <div className="chat-header">
                <span className="chat-header__icon">💬</span>
                <span className="chat-header__title">Chat</span>
                {agentConnected && (
                    <span className="chat-header__status">
                        <span className="status-dot status-dot--active" style={{ background: '#22c55e', width: 6, height: 6 }}></span>
                        AI Online
                    </span>
                )}
            </div>

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="chat-empty">
                        <span className="chat-empty__icon">🩺</span>
                        <p>Chat with MedLens AI</p>
                        <p className="chat-empty__hint">
                            Type a question or speak — the agent can see your camera and hear you.
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`chat-msg ${msg.isAgent ? 'chat-msg--agent' : 'chat-msg--user'}`}
                        >
                            <div className="chat-msg__header">
                                <span className="chat-msg__name">
                                    {msg.isAgent ? '🤖 MedLens AI' : '👤 You'}
                                </span>
                                <span className="chat-msg__time">{msg.time}</span>
                            </div>
                            <div className="chat-msg__text">{msg.text}</div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input" onSubmit={sendMessage}>
                <input
                    type="text"
                    className="chat-input__field"
                    placeholder="Ask MedLens AI a question..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={!channel}
                />
                <button
                    type="submit"
                    className="chat-input__send"
                    disabled={!inputText.trim() || !channel}
                >
                    ➤
                </button>
            </form>
        </div>
    )
}
