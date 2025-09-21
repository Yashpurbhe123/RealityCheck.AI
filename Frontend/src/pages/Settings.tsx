import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { getState, subscribe } from '../store'

export default function SettingsPage() {
  const [state, setState] = useState(getState())
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  
  useEffect(() => {
    return subscribe(() => setState(getState()))
  }, [])

  const currentUser = state.currentUserId ? state.users[state.currentUserId] : null

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name)
      setBio(currentUser.bio || '')
    }
  }, [currentUser])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    // In a real app, you'd update the user profile here
    console.log('Saving profile:', { name, bio })
  }

  return (
    <Layout>
      <div style={{ maxWidth: '600px' }}>
        <h2 style={{ marginBottom: '24px' }}>Settings</h2>
        
        <form onSubmit={handleSave} style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold' 
            }}>
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--card-bg)',
                color: 'var(--text)'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold' 
            }}>
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--card-bg)',
                color: 'var(--text)',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold' 
            }}>
              Username
            </label>
            <input
              type="text"
              value={currentUser?.handle || ''}
              disabled
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--hover)',
                color: 'var(--text-muted)',
                cursor: 'not-allowed'
              }}
            />
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--text-muted)', 
              marginTop: '4px' 
            }}>
              Username cannot be changed
            </div>
          </div>

          <button
            type="submit"
            style={{
              padding: '12px 24px',
              background: 'var(--primary)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Save Changes
          </button>
        </form>

        <div style={{ 
          marginTop: '40px', 
          padding: '20px', 
          background: 'var(--hover)', 
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ margin: '0 0 12px 0' }}>Account Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {currentUser?.followers.length || 0}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>Followers</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {currentUser?.following.length || 0}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>Following</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {state.tweets.filter(t => t.authorId === state.currentUserId).length}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>Tweets</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {state.notifications.length}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>Notifications</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
