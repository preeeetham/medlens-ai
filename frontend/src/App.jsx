import { useState, useCallback } from 'react'
import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk'
import Landing from './components/Landing'
import VideoSession from './components/VideoSession'

/**
 * MedLens AI — Main App
 *
 * States:
 *   1. Landing — user enters Stream credentials & call ID
 *   2. VideoSession — connected to agent call with live video
 */
function App() {
  const [client, setClient] = useState(null)
  const [callInfo, setCallInfo] = useState(null)
  const [connectionState, setConnectionState] = useState('disconnected') // disconnected | connecting | connected

  const handleConnect = useCallback(async ({ apiKey, token, userId, callId }) => {
    setConnectionState('connecting')
    try {
      const user = { id: userId }
      const videoClient = new StreamVideoClient({
        apiKey,
        user,
        token,
      })
      setClient(videoClient)
      setCallInfo({ callId, callType: 'default', apiKey, userId, userName: userId, token })
      setConnectionState('connected')
    } catch (err) {
      console.error('Failed to connect:', err)
      setConnectionState('disconnected')
    }
  }, [])

  const handleDisconnect = useCallback(async () => {
    if (client) {
      await client.disconnectUser()
      setClient(null)
    }
    setCallInfo(null)
    setConnectionState('disconnected')
  }, [client])

  // Landing page — not yet connected
  if (!client || !callInfo) {
    return (
      <div className="app">
        <Landing
          onConnect={handleConnect}
          connectionState={connectionState}
        />
      </div>
    )
  }

  // Connected — show video session
  return (
    <div className="app">
      <StreamVideo client={client}>
        <VideoSession
          client={client}
          callInfo={callInfo}
          onDisconnect={handleDisconnect}
        />
      </StreamVideo>
    </div>
  )
}

export default App
