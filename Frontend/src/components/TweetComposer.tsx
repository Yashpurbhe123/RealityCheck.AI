import { type FormEvent, useState } from 'react'
import { addTweet } from '../store-mongodb'

export default function TweetComposer() {
  const [text, setText] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    console.log('TweetComposer - text:', text, 'trimmed:', trimmed)
    if (!trimmed) return
    addTweet(trimmed || '').catch(err => {
      console.error('Failed to post tweet:', err)
      alert(err?.message || 'Failed to post tweet')
    })
    setText('')
  }


  return (
    <div className="card card-elevated animate-fade-in" style={{ 
      padding: '24px',
      marginBottom: '24px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '700',
            fontSize: '18px',
            flexShrink: 0
          }}>
            U
          </div>

          <div style={{ flex: 1 }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's happening?"
              rows={3}
              className="input"
              style={{ 
                resize: 'none',
                fontSize: '18px',
                lineHeight: '1.5',
                border: 'none',
                background: 'transparent',
                padding: '0',
                minHeight: '80px'
              }}
            />
          </div>
        </div>
        
        {/* Actions */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--text-muted)',
              fontWeight: '500'
            }}>
              {text.length}/280
            </div>
            <button 
              type="submit" 
              disabled={!text.trim()} 
              className="btn btn-primary hover-glow"
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '700',
                borderRadius: 'var(--radius-xl)',
                minWidth: '100px'
              }}
            >
              Tweet
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

