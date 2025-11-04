import { useState, useRef, useEffect } from 'react'
import { apiService } from '../services/api'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export default function GlobalChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "👋 Hello! I'm your global assistant. I can help you search for news, information, and answer questions about anything. What would you like to know?",
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await apiService.chatbotQuery(userMessage.text)
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response || 'I apologize, but I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Chatbot error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again later or check your connection.',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="global-chatbot-container">
      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window animate-slide-in-up">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-content">
              <div className="chatbot-avatar">
                <span className="chatbot-icon">🤖</span>
              </div>
              <div className="chatbot-header-text">
                <h3 className="chatbot-title">Global Assistant</h3>
                <p className="chatbot-subtitle">Ask me anything</p>
              </div>
            </div>
            <button
              className="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <span>×</span>
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot-message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
              >
                {message.sender === 'bot' && (
                  <div className="message-avatar bot-avatar">
                    <span>🤖</span>
                  </div>
                )}
                <div className="message-content">
                  <div className="message-text">{message.text}</div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {message.sender === 'user' && (
                  <div className="message-avatar user-avatar">
                    <span>👤</span>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="chatbot-message bot-message">
                <div className="message-avatar bot-avatar">
                  <span>🤖</span>
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chatbot-input-area">
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className="chatbot-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <span className="send-icon">→</span>
            </button>
          </div>
        </div>
      )}

      {/* Chat Toggle Button */}
      <button
        className={`chatbot-toggle-btn ${isOpen ? 'open' : ''} hover-lift hover-glow`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <span className="chatbot-toggle-icon">×</span>
        ) : (
          <span className="chatbot-toggle-icon">💬</span>
        )}
      </button>
    </div>
  )
}
