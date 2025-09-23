
interface VerificationResult {
  verdict: string
  confidence: number
  reason: string
  awareness_factor?: string
}

interface VerificationModalProps {
  result: VerificationResult | null
  isVisible: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function VerificationModal({ result, isVisible, onClose, onConfirm }: VerificationModalProps) {
  if (!isVisible || !result) return null

  const getVerdictInfo = (verdict: string) => {
    const lowerVerdict = verdict.toLowerCase()
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
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '24px',
        padding: '0',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-2xl)',
        border: '1px solid var(--border)',
        position: 'relative',
        animation: 'slideInUp 0.4s ease'
      }}>
        {/* Header with gradient background */}
        <div style={{
          background: verdictInfo.gradient,
          borderRadius: '24px 24px 0 0',
          padding: '32px 32px 24px 32px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'white',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            ×
          </button>

          {/* Main verdict display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '12px'
          }}>
            <div style={{
              fontSize: '48px',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))'
            }}>
              {verdictInfo.icon}
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: '800',
                color: 'white',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                {verdictInfo.title}
              </h1>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '500'
              }}>
                {verdictInfo.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div style={{ padding: '32px' }}>
          {/* Confidence section */}
          <div style={{
            backgroundColor: confidenceInfo.color === '#10b981' ? '#d1fae5' : 
                           confidenceInfo.color === '#f59e0b' ? '#fef3c7' : '#fee2e2',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            border: `2px solid ${confidenceInfo.color}20`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>{confidenceInfo.icon}</span>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: confidenceInfo.color
                }}>
                  {confidenceInfo.label}
                </span>
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '800',
                color: confidenceInfo.color
              }}>
                {formatConfidence(result.confidence)}
              </div>
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              backgroundColor: `${confidenceInfo.color}20`,
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${result.confidence * 100}%`,
                height: '100%',
                background: confidenceInfo.color,
                borderRadius: '6px',
                transition: 'width 0.8s ease',
                boxShadow: `0 0 8px ${confidenceInfo.color}40`
              }} />
            </div>
          </div>

          {/* Analysis section */}
          <div style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '20px' }}>🔍</span>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                AI Analysis
              </h3>
            </div>
            <p style={{
              margin: 0,
              fontSize: '15px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              background: 'var(--bg-secondary)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              {result.reason}
            </p>
          </div>

          {/* Awareness factor */}
          {result.awareness_factor && (
            <div style={{
              backgroundColor: '#fef3c7',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              border: '2px solid #f59e0b20'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>💡</span>
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#d97706'
                }}>
                  Why This Matters
                </h3>
              </div>
              <p style={{
                margin: 0,
                fontSize: '15px',
                color: '#92400e',
                lineHeight: '1.6',
                background: 'rgba(255, 255, 255, 0.5)',
                padding: '16px',
                borderRadius: '12px'
              }}>
                {result.awareness_factor}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px'
          }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px 24px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Close
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: '14px 24px',
                background: 'var(--gradient-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              Mark as Verified ✓
            </button>
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>🤖</span>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-secondary)'
              }}>
                AI-Powered Verification
              </span>
            </div>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: 'var(--text-muted)',
              lineHeight: '1.4'
            }}>
              This analysis is generated by AI and should be used as a reference only.
            </p>
          </div>
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  )
}
