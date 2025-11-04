import { useState, useRef, useEffect } from 'react'
import { apiService } from '../services/api'
import type { VerificationResult } from '../services/verification'
import { getState } from '../store-mongodb'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface TweetChatbotProps {
  tweetContent: string
  verificationResult: VerificationResult
  tweetId?: string
  imageUrl?: string
  chatId?: string | null
}

export default function TweetChatbot({ tweetContent, verificationResult,chatId }: TweetChatbotProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `👋 Hello! I'm your dedicated assistant for this tweet. I can answer questions about the verification analysis, provide more context, explain the verdict, and help you understand why this information matters. What would you like to know?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFirstMessage, setIsFirstMessage] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current && messages.length > 0) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, messages])

  // Load chat history when chatId is available
  useEffect(() => {
    if (chatId) {
      const loadHistory = async () => {
        try {
          const historyResponse = await apiService.getChatHistory(chatId)
          if (historyResponse.data && historyResponse.data.length > 0) {
            // Convert history to Message format and add to messages
            const historyMessages: Message[] = historyResponse.data.map((entry: any, index: number) => {
              // Assuming the history entries have query and response fields
              return [
                {
                  id: `history-user-${index}`,
                  text: entry.query || entry.message || '',
                  sender: 'user' as const,
                  timestamp: new Date(entry.createdAt || Date.now())
                },
                {
                  id: `history-bot-${index}`,
                  text: entry.response || entry.llmResponse || '',
                  sender: 'bot' as const,
                  timestamp: new Date(entry.createdAt || Date.now())
                }
              ]
            }).flat()

            // Only add history messages if we don't have them already
            setMessages(prev => {
              // Check if we already have history loaded
              if (prev.length > 1) return prev
              
              // Skip the initial bot greeting and add history
              const botGreeting = prev[0]
              setIsFirstMessage(false)
              return [botGreeting, ...historyMessages]
            })
          }
        } catch (error) {
          console.error('Failed to load chat history:', error)
        }
      }
      loadHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  const handleSend = async () => {
    if (!input.trim() || isLoading || !chatId) return

    const state = getState()
    const currentUser = state.currentUserId ? state.users[state.currentUserId] : null
    const userName = currentUser?.handle || 'unknown'
    const platformId = 1

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
      // For first message, include the analysis in the query
      let queryText = userMessage.text
      if (isFirstMessage) {
        const analysisText = `Verification Analysis:
Verdict: ${verificationResult.verdict}
Confidence: ${verificationResult.confidence * 100}%
Reason: ${verificationResult.reason}
${verificationResult.awareness_factor ? `Why this matters: ${verificationResult.awareness_factor}` : ''}

Tweet Content: ${tweetContent}

User Query: ${userMessage.text}`
        queryText = analysisText
      }

      const response = await apiService.sendChatMessage(chatId, userName, platformId, queryText)
      
      // Parse response - it should be JSON with a response field
      let responseText = response.response
      try {
        const parsed = typeof responseText === 'string' ? JSON.parse(responseText.replace(/```json/g,"").replace(/```/g,"").trim()) : responseText
        responseText = parsed.response || responseText
      } catch (e) {
        // If parsing fails, use as is
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText || 'I apologize, but I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
      setIsFirstMessage(false)

      // Fetch chat history after sending message
      try {
        const historyResponse = await apiService.getChatHistory(chatId)
        // History is stored on backend, we don't need to update UI with it
        // but we can log for debugging
        console.log('Chat history updated:', historyResponse)
      } catch (historyError) {
        console.error('Failed to fetch chat history:', historyError)
      }
    } catch (error) {
      console.error('Tweet chatbot error:', error)
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

  const handleQuickQuestion = async (question: string) => {
    if (isLoading || !chatId) return

    const state = getState()
    const currentUser = state.currentUserId ? state.users[state.currentUserId] : null
    const userName = currentUser?.handle || 'unknown'
    const platformId = 1
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // For first message, include the analysis in the query
      let queryText = question
      if (isFirstMessage) {
        const analysisText = `Verification Analysis:
Verdict: ${verificationResult.verdict}
Confidence: ${verificationResult.confidence * 100}%
Reason: ${verificationResult.reason}
${verificationResult.awareness_factor ? `Why this matters: ${verificationResult.awareness_factor}` : ''}

Tweet Content: ${tweetContent}

User Query: ${question}`
        queryText = analysisText
      }

      const response = await apiService.sendChatMessage(chatId, userName, platformId, queryText)
      
      // Parse response - it should be JSON with a response field
      let responseText = response.response
      try {
        const parsed = typeof responseText === 'string' ? JSON.parse(responseText.replace(/```json/g,"").replace(/```/g,"").trim()) : responseText
        responseText = parsed.response || responseText
      } catch (e) {
        // If parsing fails, use as is
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText || 'I apologize, but I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
      setIsFirstMessage(false)

      // Fetch chat history after sending message
      try {
        const historyResponse = await apiService.getChatHistory(chatId)
        console.log('Chat history updated:', historyResponse)
      } catch (historyError) {
        console.error('Failed to fetch chat history:', historyError)
      }
    } catch (error) {
      console.error('Tweet chatbot error:', error)
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

  return (
    <div className="tweet-chatbot-inline-container">
      {/* Collapsible Header */}
      <button
        className="tweet-chatbot-toggle-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Collapse chat' : 'Expand chat'}
      >
        <div className="tweet-chatbot-toggle-header-content">
          <div className="tweet-chatbot-toggle-avatar">
            <span>💬</span>
          </div>
          <div className="tweet-chatbot-toggle-text">
            <span className="tweet-chatbot-toggle-title">Ask Questions About This Verification</span>
            <span className="tweet-chatbot-toggle-subtitle">Get instant answers about this tweet's analysis</span>
          </div>
        </div>
        <div className={`tweet-chatbot-toggle-arrow ${isOpen ? 'open' : ''}`}>
          <span>▼</span>
        </div>
      </button>

      {/* Chat Interface - Always rendered but collapsed/expanded */}
      <div className={`tweet-chatbot-inline-content ${isOpen ? 'expanded' : 'collapsed'}`}>
        {/* Messages */}
        <div className="tweet-chatbot-messages-inline">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`tweet-chatbot-message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
            >
              {message.sender === 'bot' && (
                <div className="tweet-message-avatar bot-avatar">
                  <span>🔍</span>
                </div>
              )}
              <div className="tweet-message-content">
                <div className="tweet-message-text">{message.text}</div>
                <div className="tweet-message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {message.sender === 'user' && (
                <div className="tweet-message-avatar user-avatar">
                  <span>👤</span>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="tweet-chatbot-message bot-message">
              <div className="tweet-message-avatar bot-avatar">
                <span>🔍</span>
              </div>
              <div className="tweet-message-content">
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

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div className="tweet-chatbot-quick-questions">
            <div className="quick-questions-label">Quick questions:</div>
            <div className="quick-questions-buttons">
              <button
                className="quick-question-btn"
                onClick={() => handleQuickQuestion("Why was this marked as " + String(verificationResult?.verdict ?? '').toLowerCase() + "?")}
              >
                Why {String(verificationResult?.verdict ?? '').toLowerCase()}?
              </button>
              <button
                className="quick-question-btn"
                onClick={() => handleQuickQuestion("Explain the confidence level")}
              >
                Explain confidence
              </button>
              <button
                className="quick-question-btn"
                onClick={() => handleQuickQuestion("What should I know about this news?")}
              >
                What should I know?
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="tweet-chatbot-input-area">
          <input
            ref={inputRef}
            type="text"
            className="tweet-chatbot-input"
            placeholder="Ask about this tweet's verification..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button
            className="tweet-chatbot-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            <span className="send-icon">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
