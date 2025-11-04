import { getState, toggleLike, toggleRetweet, addReply, deleteTweet } from '../store-mongodb'
import type { Tweet } from '../store-mongodb'
import { useEffect, useState } from 'react'
import { subscribe } from '../store-mongodb'
import { verifyTweetContent, type VerificationResult } from '../services/verification'
import VerificationSidebar from './VerificationSidebar'
import { apiService } from '../services/api'

// Helper function to convert relative URLs to full URLs
function getFullImageUrl(imageUrl: string | null | undefined): string | undefined {
  if (!imageUrl) return undefined
  
  // If already a full URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  
  // If relative URL, build full URL using API base URL
  // Extract base URL from environment or use default
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
  const baseUrl = API_BASE_URL.replace('/api', '')
  return `${baseUrl}${imageUrl}`
}

function formatTime(timestamp: number | string): string {
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp
  const diff = Date.now() - time
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export default function TweetCard({ tweet }: { tweet: Tweet }) {
  const [state, setState] = useState(getState())
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [showVerificationSidebar, setShowVerificationSidebar] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  
  useEffect(() => {
    return subscribe(() => setState(getState()))
  }, [])

  // Handle both MongoDB format (author as object) and old format (authorId as string)
  const author = tweet.author
  const isReply = !!tweet.parentTweet
  const likedByMe = state.currentUserId ? tweet.likes.includes(state.currentUserId) : false
  const retweetedByMe = state.currentUserId ? tweet.retweets.some(r => r.user === state.currentUserId) : false
  const isMyTweet = state.currentUserId && author._id === state.currentUserId

  function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyText.trim()) return
    addReply(tweet._id, replyText.trim())
    setReplyText('')
    setShowReply(false)
  }

  async function handleDelete() {
    if (window.confirm('Are you sure you want to delete this tweet? This action cannot be undone.')) {
      try {
        await deleteTweet(tweet._id)
      } catch (error) {
        console.error('Failed to delete tweet:', error)
      }
    }
  }

  async function handleVerify() {
    const id = (tweet as any)._id || (tweet as any).id
    const username = author?.handle || 'unknown'
    // Build full image URL if image exists
    const imageUrl = getFullImageUrl(tweet.imageUrl)
    console.log('[TweetCard] Starting verification for tweet:', id, tweet.content, username, 'image:', imageUrl)
    setIsVerifying(true)
    setVerificationError(null)
    setVerificationResult(null)
    
    try {
      const result = await verifyTweetContent(id, tweet.content || '', username, 'twitter', imageUrl)
      if (result) {
        setVerificationResult(result)
        setIsVerified(true)
      } else {
        console.log('[TweetCard] No result received, setting error')
        setVerificationError('Unable to verify this tweet. Please try again.')
      }
    } catch (error) {
      console.error('[TweetCard] Verification error:', error)
      setVerificationError('Failed to verify tweet. Please check your connection and try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  function closeVerificationResults() {
    setVerificationResult(null)
    setVerificationError(null)
  }

  async function handleExpandVerification() {
    if (!verificationResult) return
    
    // Create chat session when Details button is clicked
    try {
      const currentUser = state.currentUserId ? state.users[state.currentUserId] : null
      const userName = currentUser?.handle || 'unknown'
      const platformId = 1
      
      const sessionResponse = await apiService.createChatSession(userName, platformId)
      setChatId(sessionResponse.chatId)
      setShowVerificationSidebar(true)
    } catch (error) {
      console.error('Failed to create chat session:', error)
      // Still show sidebar even if chat session creation fails
      setShowVerificationSidebar(true)
    }
  }

  function handleCloseVerificationSidebar() {
    setShowVerificationSidebar(false)
  }

  // Helper functions for verification display
  // function getVerificationBannerStyle(verdict: string) {
  //   const lowerVerdict = verdict.toLowerCase()
  //   if (lowerVerdict.includes('true') || lowerVerdict.includes('accurate') || lowerVerdict.includes('real')) {
  //     return {
  //       backgroundColor: '#10b981',
  //       color: 'white',
  //       borderColor: '#059669'
  //     }
  //   } else if (lowerVerdict.includes('false') || lowerVerdict.includes('misinformation') || lowerVerdict.includes('fake')) {
  //     return {
  //       backgroundColor: '#ef4444',
  //       color: 'white',
  //       borderColor: '#dc2626'
  //     }
  //   } else {
  //     return {
  //       backgroundColor: '#f59e0b',
  //       color: 'white',
  //       borderColor: '#d97706'
  //     }
  //   }
  // }

  function getVerificationIcon(verdict: string) {
    const lowerVerdict = verdict.toLowerCase()
    if (lowerVerdict.includes('true') || lowerVerdict.includes('accurate') || lowerVerdict.includes('real')) {
      return '✅'
    } else if (lowerVerdict.includes('false') || lowerVerdict.includes('misinformation') || lowerVerdict.includes('fake')) {
      return '❌'
    } else {
      return '⚠️'
    }
  }

  // function getVerificationTitle(verdict: string) {
  //   const lowerVerdict = verdict.toLowerCase()
  //   if (lowerVerdict.includes('true') || lowerVerdict.includes('accurate') || lowerVerdict.includes('real')) {
  //     return 'Verified as TRUE'
  //   } else if (lowerVerdict.includes('false') || lowerVerdict.includes('misinformation') || lowerVerdict.includes('fake')) {
  //     return 'Verified as FALSE'
  //   } else {
  //     return 'Verification UNCERTAIN'
  //   }
  // }

  function getConfidenceText(confidence: number) {
    if (confidence >= 0.8) {
      return 'High Confidence'
    } else if (confidence >= 0.6) {
      return 'Medium Confidence'
    } else {
      return 'Low Confidence'
    }
  }

  // Generate summary from full analysis (first 2-3 sentences, max 200 chars)
  function generateSummary(reason: string): string {
    if (!reason) return ''
    
    // Split by sentences
    const sentences = reason.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    // Take first 2-3 sentences or limit to 200 characters
    let summary = sentences.slice(0, 3).join('. ')
    if (summary.length > 200) {
      summary = summary.substring(0, 197) + '...'
    } else if (sentences.length > 3) {
      summary += '...'
    }
    
    return summary.trim()
  }

  // Get verification styling based on result
  const getVerificationStyles = () => {
    if (!isVerified || !verificationResult) {
      return {
        borderColor: 'var(--border)',
        borderWidth: '1px',
        backgroundColor: 'var(--bg-glass)',
        leftBorderColor: 'transparent'
      }
    }

    const lowerVerdict = String(verificationResult.verdict ?? '').toLowerCase()
    const confidence = verificationResult.confidence
    
    // Determine base color from verdict
    let baseColor = '#f59e0b' // Default: uncertain
    if (lowerVerdict.includes('true') || lowerVerdict.includes('accurate') || lowerVerdict.includes('real')) {
      baseColor = '#10b981' // Green for true
    } else if (lowerVerdict.includes('false') || lowerVerdict.includes('misinformation') || lowerVerdict.includes('fake')) {
      baseColor = '#ef4444' // Red for false
    }

    // Adjust opacity based on confidence (higher confidence = more visible tint)
    const opacity = Math.max(0.05, Math.min(0.15, confidence * 0.15))
    
    // Convert hex to rgb for rgba
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 }
    }
    
    const rgb = hexToRgb(baseColor)
    
    return {
      borderColor: baseColor,
      borderWidth: '3px',
      backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`,
      leftBorderColor: baseColor,
      boxShadow: `0 0 0 1px ${baseColor}20, 0 4px 12px ${baseColor}15`
    }
  }

  const verificationStyles = getVerificationStyles()
  
  const getVerificationBadge = () => {
    if (!isVerified || !verificationResult) return null
    
    const lowerVerdict = verificationResult.verdict.toLowerCase()
    
    if (lowerVerdict.includes('true') || lowerVerdict.includes('accurate') || lowerVerdict.includes('real')) {
      return {
        label: 'Real News',
        color: '#10b981',
        bgColor: '#d1fae5',
        icon: '✅'
      }
    } else if (lowerVerdict.includes('false') || lowerVerdict.includes('misinformation') || lowerVerdict.includes('fake')) {
      return {
        label: 'Fake News',
        color: '#ef4444',
        bgColor: '#fee2e2',
        icon: '❌'
      }
    } else {
      return {
        label: 'Uncertain',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        icon: '⚠️'
      }
    }
  }

  const badgeInfo = getVerificationBadge()

  return (
    <>
      <article className={`card hover-lift hover-glow ${isReply ? 'animate-slide-in' : 'animate-fade-in'}`} style={{ 
        padding: '24px',
        marginBottom: '20px',
        background: verificationStyles.backgroundColor,
        border: `${verificationStyles.borderWidth} solid ${verificationStyles.borderColor}`,
        borderRadius: 'var(--radius-xl)',
        boxShadow: verificationStyles.boxShadow || 'var(--shadow-lg)',
        marginLeft: isReply ? '40px' : '0',
        opacity: isReply ? 0.9 : 1,
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
      {/* Verification Left Border Indicator */}
      {isVerified && verificationResult && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          backgroundColor: verificationStyles.leftBorderColor,
          borderRadius: 'var(--radius-xl) 0 0 var(--radius-xl)'
        }} />
      )}

      {/* Reply indicator */}
      {isReply && (
        <div style={{
          position: 'absolute',
          left: '-20px',
          top: '20px',
          width: '2px',
          height: '40px',
          background: 'var(--border)',
          borderRadius: '1px'
        }} />
      )}

      <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '100%' }}>
        {/* Avatar */}
        <div className="hover-scale" style={{ 
          width: '56px', 
          height: '56px', 
          borderRadius: '50%', 
          background: 'var(--gradient-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '800',
          fontSize: '20px',
          flexShrink: 0,
          boxShadow: 'var(--shadow-lg)',
          transition: 'all 0.3s ease'
        }}>
          {author?.name?.charAt(0).toUpperCase() || '?'}
        </div>

        <div style={{ flex: 1, minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '8px',
            flexWrap: 'wrap',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              flex: 1
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '17px', 
                fontWeight: '800',
                color: 'var(--text)'
              }}>
                {author?.name ?? 'Unknown'}
              </h3>
              <span style={{ 
                color: 'var(--text-muted)', 
                fontSize: '14px',
                fontWeight: '500'
              }}>
                @{author?.handle ?? 'unknown'}
              </span>
              <span style={{ 
                color: 'var(--text-muted)', 
                fontSize: '14px'
              }}>
                ·
              </span>
              <time style={{ 
                color: 'var(--text-muted)', 
                fontSize: '14px'
              }}>
                {formatTime(tweet.createdAt)}
              </time>
            </div>
            
            {/* Verification Badge */}
            {badgeInfo && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexShrink: 0
              }}>
                <div style={{
                  padding: '8px 14px',
                  borderRadius: '24px',
                  backgroundColor: badgeInfo.bgColor,
                  border: `1.5px solid ${badgeInfo.color}50`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: `0 2px 8px ${badgeInfo.color}20`,
                  fontWeight: '600'
                }}>
                  <span style={{ fontSize: '16px' }}>{badgeInfo.icon}</span>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: badgeInfo.color === '#10b981' ? '#059669' : badgeInfo.color === '#ef4444' ? '#dc2626' : '#d97706',
                    letterSpacing: '0.3px'
                  }}>
                    {badgeInfo.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ 
            marginBottom: '20px',
            fontSize: '17px',
            lineHeight: '1.6',
            color: 'var(--text)',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            wordWrap: 'break-word',
            fontWeight: '400',
            maxWidth: '100%',
            overflow: 'hidden'
          }}>
            {tweet.content}
          </div>

          {/* Image Display */}
          {tweet.imageUrl && !tweet.imageUrl.startsWith('data:') && (
            <div style={{
              marginBottom: '20px',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              maxWidth: '100%'
            }}>
              <img
                src={getFullImageUrl(tweet.imageUrl) || ''}
                alt="Tweet image"
                style={{
                  width: '100%',
                  maxHeight: '600px',
                  objectFit: 'cover',
                  display: 'block'
                }}
                onError={(e) => {
                  // Fallback if image fails to load
                  console.error('Failed to load image:', tweet.imageUrl)
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}

          {/* Verification Summary Terminal Window */}
          {isVerified && verificationResult && (
            <div style={{
              marginBottom: '20px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(0, 0, 0, 0.05)',
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
              animation: 'fadeIn 0.3s ease'
            }}>
              {/* Terminal Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border)',
                gap: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '6px'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      boxShadow: '0 0 4px rgba(239, 68, 68, 0.5)'
                    }}></div>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#f59e0b',
                      boxShadow: '0 0 4px rgba(245, 158, 11, 0.5)'
                    }}></div>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 4px rgba(16, 185, 129, 0.5)'
                    }}></div>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'monospace',
                    fontWeight: '600',
                    marginLeft: '8px'
                  }}>
                    verification-analysis
                  </span>
                </div>
                <button
                  onClick={handleExpandVerification}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-light)'
                    e.currentTarget.style.borderColor = 'var(--primary)'
                    e.currentTarget.style.color = 'var(--primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--text)'
                  }}
                >
                  <span>Details</span>
                  <span style={{ fontSize: '10px' }}>→</span>
                </button>
              </div>

              {/* Terminal Content */}
              <div style={{
                padding: '16px',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.6',
                color: 'var(--text)',
                background: '#ffffff',
                minHeight: '80px',
                maxHeight: '150px',
                overflow: 'auto'
              }}>
                {/* Prompt line */}
                <div style={{
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{
                    color: '#10b981',
                    fontWeight: '600'
                  }}>
                    $&gt;
                  </span>
                  <span style={{
                    color: '#6366f1'
                  }}>
                    Analysis Summary:
                  </span>
                </div>

                {/* Summary content */}
                <div style={{
                  color: 'var(--text-secondary)',
                  paddingLeft: '24px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {generateSummary(verificationResult.reason) || 'Analysis complete.'}
                </div>

                {/* Verdict line */}
                <div style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{
                    color: '#10b981',
                    fontWeight: '600'
                  }}>
                    $&gt;
                  </span>
                  <span style={{
                    color: '#6366f1'
                  }}>
                    Verdict:
                  </span>
                  <span style={{
                    color: getVerificationIcon(verificationResult.verdict) === '✅' ? '#10b981' : 
                           getVerificationIcon(verificationResult.verdict) === '❌' ? '#ef4444' : '#f59e0b',
                    fontWeight: '600',
                    marginLeft: '8px'
                  }}>
                    {verificationResult.verdict}
                  </span>
                </div>

                {/* Confidence line */}
                <div style={{
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{
                    color: '#10b981',
                    fontWeight: '600'
                  }}>
                    $&gt;
                  </span>
                  <span style={{
                    color: '#6366f1'
                  }}>
                    Confidence:
                  </span>
                  <span style={{
                    color: verificationResult.confidence >= 0.8 ? '#10b981' : 
                           verificationResult.confidence >= 0.6 ? '#f59e0b' : '#ef4444',
                    fontWeight: '600',
                    marginLeft: '8px'
                  }}>
                    {Math.round(verificationResult.confidence * 100)}% ({getConfidenceText(verificationResult.confidence)})
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-light)',
            flexWrap: 'wrap',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden'
          }}>
            {/* Reply */}
            <button 
              onClick={() => setShowReply(!showReply)} 
              className="btn btn-ghost btn-sm hover-lift hover-glow"
              style={{ 
                padding: '12px 16px',
                fontSize: '15px',
                color: 'var(--text-muted)',
                fontWeight: '600',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                flex: '1',
                minWidth: '80px'
              }}
            >
              <span style={{ marginRight: '8px', fontSize: '16px' }}>💬</span>
              <span className="desktop-only">{tweet.replyCount || tweet.replies.length || 0}</span>
            </button>

            {/* Retweet */}
            <button 
              onClick={() => toggleRetweet(tweet._id)} 
              className="btn btn-ghost btn-sm hover-lift hover-glow"
              style={{ 
                padding: '12px 16px',
                fontSize: '15px',
                color: retweetedByMe ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: '600',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                flex: '1',
                minWidth: '80px'
              }}
            >
              <span style={{ marginRight: '8px', fontSize: '16px' }}>🔄</span>
              <span className="desktop-only">{tweet.retweetCount || tweet.retweets.length || 0}</span>
            </button>

            {/* Like */}
            <button 
              onClick={() => toggleLike(tweet._id)} 
              className="btn btn-ghost btn-sm hover-lift hover-glow"
              style={{ 
                padding: '12px 16px',
                fontSize: '15px',
                color: likedByMe ? '#ef4444' : 'var(--text-muted)',
                fontWeight: '600',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                flex: '1',
                minWidth: '80px'
              }}
            >
              <span style={{ marginRight: '8px', fontSize: '16px' }}>{likedByMe ? '❤️' : '🤍'}</span>
              <span className="desktop-only">{tweet.likeCount || tweet.likes.length || 0}</span>
            </button>

            {/* Verify Button / Verified Status */}
            {!isVerified ? (
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="btn btn-secondary btn-sm hover-lift hover-glow"
                style={{
                  padding: '12px 16px',
                  fontSize: '15px',
                  fontWeight: '700',
                  color: 'var(--text)',
                  opacity: isVerifying ? 0.6 : 1,
                  cursor: isVerifying ? 'not-allowed' : 'pointer',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  flex: '1',
                  minWidth: '80px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {isVerifying && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(147, 51, 234, 0.1)',
                    backdropFilter: 'blur(4px)',
                    animation: 'geminiFade 1.5s ease-in-out infinite alternate'
                  }}>
                    <span style={{
                      fontSize: '20px',
                      background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      fontWeight: 'bold'
                    }}>
                      ⭐
                    </span>
                  </div>
                )}
                <span style={{ 
                  marginRight: '8px', 
                  fontSize: '16px',
                  opacity: isVerifying ? 0 : 1,
                  transition: 'opacity 0.2s ease'
                }}>
                  ✅
                </span>
                <span 
                  className="desktop-only"
                  style={{
                    opacity: isVerifying ? 0 : 1,
                    transition: 'opacity 0.2s ease'
                  }}
                >
                  Verify
                </span>
              </button>
            ) : (
              <div style={{
                padding: '12px 16px',
                fontSize: '15px',
                fontWeight: '700',
                color: '#10b981',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: '1',
                minWidth: '80px',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '16px' }}>✅</span>
                <span className="desktop-only">Verified</span>
              </div>
            )}

            {/* Delete Button - Only show for own tweets */}
            {isMyTweet && (
              <button
                onClick={handleDelete}
                className="btn btn-danger btn-sm hover-lift hover-glow"
                style={{
                  padding: '12px 16px',
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#ef4444',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-glass)',
                  border: '1px solid #ef4444',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  flex: '1',
                  minWidth: '80px'
                }}
              >
                <span style={{ marginRight: '8px', fontSize: '16px' }}>🗑️</span>
                <span className="desktop-only">Delete</span>
              </button>
            )}

          </div>
          
          {/* Reply Form */}
          {showReply && (
            <form onSubmit={handleReply} className="animate-fade-in" style={{ 
              marginTop: '20px', 
              padding: '20px',
              background: 'var(--bg-glass)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div className="hover-scale" style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: 'var(--gradient-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '800',
                  fontSize: '16px',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-md)',
                  transition: 'all 0.3s ease'
                }}>
                  {state.users[state.currentUserId!]?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Tweet your reply..."
                    className="input"
                    style={{
                      marginBottom: '16px',
                      fontSize: '15px',
                      borderRadius: 'var(--radius-lg)'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button 
                      type="button"
                      onClick={() => setShowReply(false)}
                      className="btn btn-ghost btn-sm hover-lift"
                      style={{
                        borderRadius: 'var(--radius-lg)',
                        padding: '10px 16px',
                        fontSize: '14px'
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={!replyText.trim()}
                      className="btn btn-primary btn-sm hover-lift hover-glow"
                      style={{
                        borderRadius: 'var(--radius-lg)',
                        padding: '10px 16px',
                        fontSize: '14px'
                      }}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
      </article>


      {/* Verification Error Toast */}
      {verificationError && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#ef4444',
          color: 'white',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          zIndex: 1001,
          maxWidth: '400px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideInRight 0.3s ease'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
              Verification Failed
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {verificationError}
            </div>
          </div>
          <button
            onClick={closeVerificationResults}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              marginLeft: 'auto'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Verification Sidebar */}
      <VerificationSidebar
        result={verificationResult}
        isVisible={showVerificationSidebar}
        onClose={handleCloseVerificationSidebar}
        tweetContent={tweet.content || ''}
        tweetId={(tweet as any)._id || (tweet as any).id}
        imageUrl={getFullImageUrl(tweet.imageUrl)}
        chatId={chatId}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes geminiFade {
          0% {
            opacity: 0.6;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
