import type { VerificationResult } from '../services/verification'
import TweetChatbot from './TweetChatbot'

interface VerificationSidebarProps {
  result: VerificationResult | null
  isVisible: boolean
  onClose: () => void
  tweetContent?: string
  tweetId?: string
  imageUrl?: string
  chatId?: string | null
}

export default function VerificationSidebar({ result, isVisible, onClose, tweetContent = '', tweetId, imageUrl, chatId }: VerificationSidebarProps) {
  if (!isVisible || !result) return null

  const getVerdictInfo = (verdict: string | undefined) => {
    const lowerVerdict = String(verdict ?? '').toLowerCase()
    if (lowerVerdict.includes('true') || lowerVerdict.includes('accurate') || lowerVerdict.includes('real')) {
      return {
        color: '#10b981',
        bgColor: '#d1fae5',
        icon: '✅',
        title: 'Verified as True',
        subtitle: 'This information appears to be accurate',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      }
    } else if (lowerVerdict.includes('false') || lowerVerdict.includes('misinformation') || lowerVerdict.includes('fake')) {
      return {
        color: '#ef4444',
        bgColor: '#fee2e2',
        icon: '❌',
        title: 'Verified as False',
        subtitle: 'This information appears to be inaccurate',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
      }
    } else {
      return {
        color: '#f59e0b',
        bgColor: '#fef3c7',
        icon: '⚠️',
        title: 'Uncertain',
        subtitle: 'Unable to verify this information',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
      }
    }
  }

  const getConfidenceInfo = (confidence: number) => {
    if (confidence >= 0.8) {
      return {
        color: '#10b981',
        label: 'High Confidence',
        icon: '🎯'
      }
    } else if (confidence >= 0.6) {
      return {
        color: '#f59e0b',
        label: 'Medium Confidence',
        icon: '⚖️'
      }
    } else {
      return {
        color: '#ef4444',
        label: 'Low Confidence',
        icon: '❓'
      }
    }
  }

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`
  }

  const verdictInfo = getVerdictInfo(result.verdict)
  const confidenceInfo = getConfidenceInfo(result.confidence)

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 'min(560px, 92vw)',
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border)',
      boxShadow: '-8px 0 30px rgba(0,0,0,.25)',
      zIndex: 9999,
      overflowY: 'auto',
      animation: 'slideInRight 0.28s ease'
    }}>
      {/* Header */}
      <div style={{
        background: verdictInfo.gradient,
        padding: '22px 24px',
        color: 'white',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            right: 16,
            top: 16,
            width: 32,
            height: 32,
            borderRadius: 999,
            border: 'none',
            background: 'rgba(255,255,255,.22)',
            color: 'white',
            fontSize: 18,
            cursor: 'pointer'
          }}
        >
          ×
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>⭐</span>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.2 }}>RealityCheck Verification</div>
            <div style={{ opacity: .9, marginTop: 2 }}>AI-Powered Content Analysis</div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>{verdictInfo.icon}</span>
          <div>
            <div style={{ fontWeight: 700 }}>{verdictInfo.title}</div>
            <div style={{ opacity: .9, fontSize: 14 }}>{verdictInfo.subtitle}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 24 }}>
        {/* Confidence card */}
        <section style={{
          background: confidenceInfo.color === '#10b981' ? '#e7fbf2' : confidenceInfo.color === '#f59e0b' ? '#fff6e6' : '#ffecec',
          border: `1px solid ${confidenceInfo.color}55`,
          borderRadius: 16,
          padding: 20,
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{confidenceInfo.icon}</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: confidenceInfo.color }}>{confidenceInfo.label}</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: confidenceInfo.color }}>{formatConfidence(result.confidence)}</span>
          </div>
          <div style={{ height: 10, background: `${confidenceInfo.color}22`, borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              width: `${result.confidence * 100}%`,
              height: '100%',
              background: confidenceInfo.color,
              transition: 'width .6s ease'
            }} />
          </div>
        </section>

        {/* AI Analysis */}
        <section style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>🔍</span>
            <div style={{ fontWeight: 800 }}>AI Analysis</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {result.reason}
          </div>
        </section>

        {/* Why this matters */}
        {result.awareness_factor && (
          <section style={{ background: '#fff6e0', border: '1px solid #f59e0b55', borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>💡</span>
              <div style={{ fontWeight: 800, color: '#b45309' }}>Why This Matters</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,.6)', borderRadius: 12, padding: 16, color: '#7c2d12', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {result.awareness_factor}
            </div>
          </section>
        )}

        {/* Chatbot (optional) */}
        {tweetContent && (
          <section style={{ marginTop: 16 }}>
            <TweetChatbot
              tweetContent={tweetContent}
              verificationResult={result}
              tweetId={tweetId}
              imageUrl={imageUrl}
              chatId={chatId}
            />
          </section>
        )}

        {/* Footer */}
        <footer style={{ marginTop: 20, borderTop: '1px dashed var(--border)', paddingTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
          This analysis is generated by AI and should be used as a reference only. Verify with trusted sources.
        </footer>
      </div>

      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(12%);} to { opacity: 1; transform: translateX(0);} }
      `}</style>
    </div>
  )
}

