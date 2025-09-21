import { useState, useEffect } from 'react'
import { getState, subscribe, switchAccount, getAvailableAccounts } from '../store'

export default function AccountSwitcher() {
  const [state, setState] = useState(getState())
  const [isOpen, setIsOpen] = useState(false)
  
  useEffect(() => {
    return subscribe(() => setState(getState()))
  }, [])

  const currentUser = state.currentUserId ? state.users[state.currentUserId] : null
  const availableAccounts = getAvailableAccounts()

  if (!currentUser || availableAccounts.length <= 1) {
    return null
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost hover-lift"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--text-secondary)',
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{ 
          width: '24px', 
          height: '24px', 
          borderRadius: '50%', 
          background: 'var(--gradient-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '700',
          fontSize: '12px'
        }}>
          {currentUser.name.charAt(0).toUpperCase()}
        </div>
        <span>{currentUser.name}</span>
        <span style={{ fontSize: '12px' }}>▼</span>
      </button>

      {isOpen && (
        <div className="card animate-fade-in" style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: '280px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 1000,
          marginTop: '8px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-tertiary)'
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '16px', 
              fontWeight: '700',
              color: 'var(--text)'
            }}>
              Switch Account
            </h3>
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {availableAccounts.map(account => (
              <button
                key={account.id}
                onClick={() => {
                  switchAccount(account.id)
                  setIsOpen(false)
                }}
                className="btn btn-ghost hover-lift"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  padding: '12px 16px',
                  border: 'none',
                  background: account.id === state.currentUserId ? 'var(--primary-light)' : 'transparent',
                  color: account.id === state.currentUserId ? 'var(--primary)' : 'var(--text)',
                  borderRadius: 0,
                  borderBottom: '1px solid var(--border)',
                  fontSize: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: 'var(--gradient-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '16px'
                  }}>
                    {account.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ 
                      fontWeight: '600', 
                      fontSize: '14px',
                      marginBottom: '2px'
                    }}>
                      {account.name}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-muted)'
                    }}>
                      @{account.handle}
                    </div>
                  </div>
                  {account.id === state.currentUserId && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--primary)'
                    }} />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-tertiary)'
          }}>
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-secondary btn-sm"
              style={{
                width: '100%',
                fontSize: '12px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
