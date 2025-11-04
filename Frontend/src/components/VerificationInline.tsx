import type { VerificationResult } from '../services/verification'

interface VerificationInlineProps {
  result: VerificationResult
  onExpand: () => void
}

export default function VerificationInline({ result, onExpand }: VerificationInlineProps) {
  const getVerdictInfo = (verdict: string) => {
    const lowerVerdict = verdict.toLowerCase()
    if (lowerVerdict.includes('true') || lowerVerdict.includes('accurate') || lowerVerdict.includes('real')) {
      return {
        color: '#10b981',
        bgColor: '#d1fae5',
        borderColor: '#10b981',
        icon: '✅',
        label: 'Verified as True',
        badgeColor: '#059669'
      }
    } else if (lowerVerdict.includes('false') || lowerVerdict.includes('misinformation') || lowerVerdict.includes('fake')) {
      return {
        color: '#ef4444',
        bgColor: '#fee2e2',
        borderColor: '#ef4444',
        icon: '❌',
        label: 'Verified as False',
        badgeColor: '#dc2626'
      }
    } else {
      return {
        color: '#f59e0b',
        bgColor: '#fef3c7',
        borderColor: '#f59e0b',
        icon: '⚠️',
        label: 'Uncertain',
        badgeColor: '#d97706'
      }
    }
  }

  const getConfidenceInfo = (confidence: number) => {
    if (confidence >= 0.8) {
      return { color: '#10b981', label: 'High Confidence', bgColor: '#d1fae5' }
    } else if (confidence >= 0.6) {
      return { color: '#f59e0b', label: 'Medium Confidence', bgColor: '#fef3c7' }
    } else {
      return { color: '#ef4444', label: 'Low Confidence', bgColor: '#fee2e2' }
    }
  }

  const verdictInfo = getVerdictInfo(result.verdict)
  const confidenceInfo = getConfidenceInfo(result.confidence)

  return (
    <div style={{
      marginTop: '20px',
      borderRadius: '16px',
      border: `1px solid ${verdictInfo.borderColor}30`,
      backgroundColor: 'var(--bg-secondary)',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: verdictInfo.bgColor,
        borderBottom: `1px solid ${verdictInfo.borderColor}20`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: verdictInfo.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: `0 2px 8px ${verdictInfo.color}30`
          }}>
            {verdictInfo.icon}
          </div>
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: verdictInfo.badgeColor,
              marginBottom: '2px'
            }}>
              {verdictInfo.label}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontWeight: '500'
            }}>
              AI Verification Complete
            </div>
          </div>
        </div>
        <button
          onClick={onExpand}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'white',
            backgroundColor: verdictInfo.color,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: `0 2px 4px ${verdictInfo.color}30`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = verdictInfo.badgeColor
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = `0 4px 8px ${verdictInfo.color}40`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = verdictInfo.color
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = `0 2px 4px ${verdictInfo.color}30`
          }}
        >
          <span>View Details</span>
          <span style={{ fontSize: '12px' }}>→</span>
        </button>
      </div>

      {/* Content */}
      <div style={{
        padding: '20px'
      }}>
        {/* Confidence Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          padding: '12px 16px',
          backgroundColor: confidenceInfo.bgColor,
          borderRadius: '12px',
          border: `1px solid ${confidenceInfo.color}20`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '18px' }}>
              {confidenceInfo.color === '#10b981' ? '🎯' : confidenceInfo.color === '#f59e0b' ? '⚖️' : '❓'}
            </span>
            <div>
              <div style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                marginBottom: '2px'
              }}>
                Confidence Level
              </div>
              <div style={{
                fontSize: '15px',
                fontWeight: '700',
                color: confidenceInfo.color
              }}>
                {confidenceInfo.label}
              </div>
            </div>
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '800',
            color: confidenceInfo.color
          }}>
            {Math.round(result.confidence * 100)}%
          </div>
        </div>

        {/* Analysis Section */}
        <div style={{
          marginBottom: result.awareness_factor ? '20px' : '0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '18px' }}>🔍</span>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--text-primary)'
            }}>
              AI Analysis
            </h3>
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            lineHeight: '1.6',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {result.reason}
          </div>
        </div>

        {/* Awareness Factor */}
        {result.awareness_factor && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#fef3c7',
            borderRadius: '12px',
            border: '1px solid #f59e0b20'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '18px' }}>💡</span>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '700',
                color: '#d97706'
              }}>
                Why This Matters
              </h3>
            </div>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#92400e',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {result.awareness_factor}
            </p>
          </div>
        )}

        {/* Footer Note */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <span>🤖</span>
          <span>Click "View Details" to see full verification report</span>
        </div>
      </div>
    </div>
  )
}
