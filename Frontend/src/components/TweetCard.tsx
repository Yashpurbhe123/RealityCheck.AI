import { getState, toggleLike, toggleRetweet, addReply } from '../store-mongodb'
import type { Tweet } from '../store-mongodb'
import { useEffect, useState } from 'react'
import { subscribe } from '../store-mongodb'
import { verifyTweetContent, type VerificationResult } from '../services/verification'
import VerificationModal from './VerificationModal'
import VerificationLoading from './VerificationLoading'

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
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [verificationData, setVerificationData] = useState<VerificationResult | null>(null)
  
  useEffect(() => {
    return subscribe(() => setState(getState()))
  }, [])

  // Handle both MongoDB format (author as object) and old format (authorId as string)
  const author = tweet.author
  const isReply = !!tweet.parentTweet
  const likedByMe = state.currentUserId ? tweet.likes.includes(state.currentUserId) : false
  const retweetedByMe = state.currentUserId ? tweet.retweets.some(r => r.user === state.currentUserId) : false

  function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyText.trim()) return
    addReply(tweet._id, replyText.trim())
    setReplyText('')
    setShowReply(false)
  }

  async function handleVerify() {
    const id = (tweet as any)._id || (tweet as any).id
    console.log('[TweetCard] Starting verification for tweet:', id, tweet.content)
    setIsVerifying(true)
    setVerificationError(null)
    setVerificationResult(null)
    
    try {
      const result = await verifyTweetContent(id, tweet.content)
      console.log('[TweetCard] Verification result:', result)
      if (result) {
        console.log('[TweetCard] Setting verification result:', result)
        setVerificationResult(result)
        setShowVerificationModal(true)
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

  function handleCloseVerificationModal() {
    setShowVerificationModal(false)
    setVerificationResult(null)
  }

  function handleConfirmVerification() {
    // Mark the tweet as verified
    // In a real app, this would update the tweet in the database
    console.log('[TweetCard] Tweet marked as verified:', tweet._id)
    setIsVerified(true)
    setVerificationData(verificationResult) // Store the verification result
    setShowVerificationModal(false)
    setVerificationResult(null)
    // You could add a state update here to mark the tweet as verified locally
    // For now, we'll just close the modal
  }

  // Helper functions for verification display
  function getVerificationBannerStyle(verdict: string) {
    const lowerVerdict = verdict.toLowerCase()
    if (lowerVerdict.includes('true') || lowerVerdict.includes('accurate') || lowerVerdict.includes('real')) {
      return {
        backgroundColor: '#10b981',
        color: 'white',
        borderColor: '#059669'
      }
    } else if (lowerVerdict.includes('false') || lowerVerdict.includes('misinformation') || lowerVerdict.includes('fake')) {
      return {
        backgroundColor: '#ef4444',
        color: 'white',
        borderColor: '#dc2626'
      }
    } else {
      return {
        backgroundColor: '#f59e0b',
        color: 'white',
        borderColor: '#d97706'
      }
    }
  }

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

  function getVerificationTitle(verdict: string) {
    const lowerVerdict = verdict.toLowerCase()
    if (lowerVerdict.includes('true') || lowerVerdict.includes('accurate') || lowerVerdict.includes('real')) {
      return 'Verified as TRUE'
    } else if (lowerVerdict.includes('false') || lowerVerdict.includes('misinformation') || lowerVerdict.includes('fake')) {
      return 'Verified as FALSE'
    } else {
      return 'Verification UNCERTAIN'
    }
  }

  function getConfidenceText(confidence: number) {
    if (confidence >= 0.8) {
      return 'High Confidence'
    } else if (confidence >= 0.6) {
      return 'Medium Confidence'
    } else {
      return 'Low Confidence'
    }
  }

  return (
    <>
      <article className={`card hover-lift hover-glow ${isReply ? 'animate-slide-in' : 'animate-fade-in'}`} style={{ 
        padding: '24px',
        marginBottom: '20px',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        marginLeft: isReply ? '40px' : '0',
        opacity: isReply ? 0.9 : 1,
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
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

      <div style={{ display: 'flex', gap: '16px' }}>
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

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '8px',
            flexWrap: 'wrap'
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

          {/* Content */}
          <div style={{ 
            marginBottom: '20px',
            fontSize: '17px',
            lineHeight: '1.6',
            color: 'var(--text)',
            wordBreak: 'break-word',
            fontWeight: '400'
          }}>
            {tweet.content}
          </div>

          {/* Verification Status Banner */}
          {isVerified && verificationData && (
            <div style={{
              marginBottom: '20px',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '2px solid',
              position: 'relative',
              overflow: 'hidden',
              ...(getVerificationBannerStyle(verificationData.verdict))
            }}>
              {/* Background Pattern */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.1,
                background: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='a' patternUnits='userSpaceOnUse' width='20' height='20' patternTransform='scale(0.5) rotate(0)'%3E%3Crect x='0' y='0' width='100%25' height='100%25' fill='none'/%3E%3Cpath d='M10 10m-1 0a1 1 0 1 1 2 0a1 1 0 1 1-2 0' stroke='currentColor' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23a)'/%3E%3C/svg%3E")`,
              }} />
              
              <div style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {/* Verification Icon */}
                <div style={{
                  fontSize: '24px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                }}>
                  {getVerificationIcon(verificationData.verdict)}
                </div>
                
                <div style={{ flex: 1 }}>
                  {/* Verification Title */}
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    marginBottom: '4px',
                    color: 'inherit'
                  }}>
                    {getVerificationTitle(verificationData.verdict)}
                  </div>
                  
                  {/* Confidence Level */}
                  <div style={{
                    fontSize: '14px',
                    opacity: 0.9,
                    marginBottom: '8px'
                  }}>
                    {getConfidenceText(verificationData.confidence)} • Verified by AI
                  </div>
                  
                  {/* Confidence Bar */}
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${verificationData.confidence * 100}%`,
                      background: 'rgba(255,255,255,0.8)',
                      borderRadius: '3px',
                      transition: 'width 0.8s ease'
                    }} />
                  </div>
                </div>
                
                {/* Confidence Percentage */}
                <div style={{
                  fontSize: '18px',
                  fontWeight: '800',
                  color: 'inherit'
                }}>
                  {Math.round(verificationData.confidence * 100)}%
                </div>
              </div>
              
              {/* Verification Details */}
              <div style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '14px',
                lineHeight: '1.5',
                color: 'inherit',
                opacity: 0.9
              }}>
                <strong>Analysis:</strong> {verificationData.reason}
              </div>
            </div>
          )}
          
          
          {/* Actions */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '32px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-light)'
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
                WebkitBackdropFilter: 'blur(10px)'
              }}
            >
              <span style={{ marginRight: '8px', fontSize: '16px' }}>💬</span>
              {tweet.replyCount || tweet.replies.length || 0}
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
                WebkitBackdropFilter: 'blur(10px)'
              }}
            >
              <span style={{ marginRight: '8px', fontSize: '16px' }}>🔄</span>
              {tweet.retweetCount || tweet.retweets.length || 0}
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
                WebkitBackdropFilter: 'blur(10px)'
              }}
            >
              <span style={{ marginRight: '8px', fontSize: '16px' }}>{likedByMe ? '❤️' : '🤍'}</span>
              {tweet.likeCount || tweet.likes.length || 0}
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
                  WebkitBackdropFilter: 'blur(10px)'
                }}
              >
                <span style={{ marginRight: '8px', fontSize: '16px' }}>
                  {isVerifying ? '⏳' : '✅'}
                </span>
                {isVerifying ? 'Verifying...' : 'Verify'}
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
                gap: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>✅</span>
                <span>Verified</span>
              </div>
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

      {/* Verification Loading Screen */}
      <VerificationLoading isVisible={isVerifying} />

      {/* Verification Results Modal */}
      <VerificationModal
        result={verificationResult}
        isVisible={showVerificationModal}
        onClose={handleCloseVerificationModal}
        onConfirm={handleConfirmVerification}
      />
    </>
  )
}