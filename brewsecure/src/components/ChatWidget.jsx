import { useState, useRef, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useConversation } from '@elevenlabs/react'

const AGENT_ID = 'agent_5501ks0p98cxex3a60tkfw4ahh8d'

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hi! I'm Brew, your BrewSecure coffee guide. Ask me anything — roast profiles, brewing tips, or help finding your next favorite bag. ☕",
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('text') // 'text' | 'voice'
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [voiceError, setVoiceError] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const conversation = useConversation({
    onConnect: () => setVoiceError(null),
    onDisconnect: () => {},
    onError: (err) => setVoiceError('Voice connection failed. Please try again.'),
  })

  useEffect(() => {
    if (open && mode === 'text') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [open, messages, mode])

  useEffect(() => {
    if (!open && conversation.status === 'connected') {
      conversation.endSession()
    }
  }, [open])

  function handleClose() {
    setOpen(false)
    if (conversation.status === 'connected') conversation.endSession()
  }

  function switchMode(m) {
    if (m === 'text' && conversation.status === 'connected') {
      conversation.endSession()
    }
    setMode(m)
    setVoiceError(null)
  }

  async function startVoice() {
    setVoiceError(null)
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      await conversation.startSession({ agentId: AGENT_ID, connectionType: 'webrtc' })
    } catch (e) {
      setVoiceError('Microphone access denied or connection failed.')
    }
  }

  async function stopVoice() {
    await conversation.endSession()
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''
      let firstToken = true

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice('data: '.length).trim()
          if (data === '[DONE]') break

          try {
            const json = JSON.parse(data)
            if (json.token) {
              assistantMessage += json.token
              flushSync(() => {
                if (firstToken) {
                  firstToken = false
                  setLoading(false)
                  setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }])
                } else {
                  setMessages(prev => [
                    ...prev.slice(0, -1),
                    { role: 'assistant', content: assistantMessage },
                  ])
                }
              })
            }
          } catch (e) {
            // skip malformed chunk
          }
        }
      }
    } catch {
      setError('Something went wrong. The AI may be warming up — please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const voiceConnected = conversation.status === 'connected'
  const voiceConnecting = conversation.status === 'connecting'

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[360px] flex flex-col rounded-2xl shadow-2xl border border-[#E8DDD5] bg-[#FAF7F2] overflow-hidden"
          style={{ maxHeight: mode === 'voice' ? '420px' : '520px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#1C0F0A]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#C4602A] flex items-center justify-center text-white text-sm font-bold">
                B
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-none">Brew</p>
                <p className="text-white/50 text-[11px] mt-0.5">BrewSecure AI</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Mode toggle */}
              <div className="flex items-center bg-white/10 rounded-full p-0.5">
                <button
                  onClick={() => switchMode('text')}
                  title="Text chat"
                  className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                    mode === 'text' ? 'bg-[#C4602A] text-white' : 'text-white/50 hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </button>
                <button
                  onClick={() => switchMode('voice')}
                  title="Voice chat"
                  className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                    mode === 'voice' ? 'bg-[#C4602A] text-white' : 'text-white/50 hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>

              <button
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {mode === 'text' ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-[#C4602A] text-white rounded-br-sm'
                          : 'bg-white border border-[#E8DDD5] text-[#1C0F0A] rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[#E8DDD5] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C4602A]/60 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C4602A]/60 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C4602A]/60 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-xs text-[#C4602A] bg-[#C4602A]/8 border border-[#C4602A]/20 rounded-xl px-3 py-2">
                    {error}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-[#E8DDD5] bg-white flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about coffee…"
                  rows={1}
                  disabled={loading}
                  className="flex-1 resize-none text-sm text-[#1C0F0A] placeholder-[#3D2314]/30 bg-transparent outline-none leading-relaxed max-h-24 overflow-y-auto disabled:opacity-50"
                  style={{ field_sizing: 'content' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-[#C4602A] text-white disabled:opacity-40 hover:bg-[#A8501F] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            /* Voice mode */
            <div className="flex flex-col items-center justify-center flex-1 px-6 py-8 gap-6">
              {/* Orb */}
              <div className="relative flex items-center justify-center">
                {voiceConnected && (
                  <>
                    <span className={`absolute w-28 h-28 rounded-full bg-[#C4602A]/20 ${conversation.isSpeaking ? 'animate-ping' : 'animate-pulse'}`} />
                    <span className="absolute w-20 h-20 rounded-full bg-[#C4602A]/15 animate-pulse" />
                  </>
                )}
                <button
                  onClick={voiceConnected ? stopVoice : startVoice}
                  disabled={voiceConnecting}
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    voiceConnected
                      ? 'bg-[#C4602A] hover:bg-[#A8501F] text-white'
                      : voiceConnecting
                      ? 'bg-[#C4602A]/50 text-white cursor-not-allowed'
                      : 'bg-[#1C0F0A] hover:bg-[#3D2314] text-white'
                  }`}
                >
                  {voiceConnected ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Status */}
              <div className="text-center">
                {voiceConnecting && (
                  <p className="text-sm text-[#3D2314]/60">Connecting…</p>
                )}
                {voiceConnected && (
                  <p className="text-sm font-medium text-[#1C0F0A]">
                    {conversation.isSpeaking ? 'Brew is speaking…' : 'Listening…'}
                  </p>
                )}
                {!voiceConnected && !voiceConnecting && (
                  <p className="text-sm text-[#3D2314]/60">Tap the mic to start a voice conversation</p>
                )}
              </div>

              {voiceError && (
                <p className="text-xs text-[#C4602A] bg-[#C4602A]/8 border border-[#C4602A]/20 rounded-xl px-3 py-2 text-center">
                  {voiceError}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-14 h-14 rounded-full bg-[#C4602A] text-white shadow-lg hover:bg-[#A8501F] transition-colors flex items-center justify-center"
        aria-label="Open chat"
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </div>
  )
}
