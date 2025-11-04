import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// keep existing store login to avoid breaking flows
import { loginWithUser } from '../store-mongodb'
import apiService from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [handle, setHandle] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      setLoading(true)
      if (mode === 'register') {
        if (!handle.trim() || !name.trim() || !email.trim() || !password.trim()) return
        const res = await apiService.register({ handle: handle.trim(), name: name.trim(), email: email.trim(), password: password.trim(), bio: bio.trim() || undefined })
        console.log('[REGISTER SUCCESS]', res)
        // Login to local store with user object from API response
        await loginWithUser(res.user)
        navigate('/')
      } else {
        if (!handle.trim() || !password.trim()) return
        const res = await apiService.login({ handle: handle.trim(), password: password.trim() })
        console.log('[LOGIN SUCCESS]', res)
        // Login to local store with user object from API response
        await loginWithUser(res.user)
        navigate('/')
      }
    } catch (err: any) {
      console.error('[AUTH ERROR]', err)
      setError(err?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'var(--gradient-primary)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Elements */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        animation: 'pulse 4s ease-in-out infinite'
      }} />
      
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '10%',
        width: '300px',
        height: '300px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        filter: 'blur(40px)'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '10%',
        width: '200px',
        height: '200px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        filter: 'blur(30px)'
      }} />

      <div className="card card-elevated animate-fade-in responsive-padding" style={{
        background: 'var(--bg-secondary)',
        padding: '48px',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
        zIndex: 10,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        margin: '20px'
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            Create Account
          </button>
        </div>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="text-gradient" style={{ 
            fontSize: '48px', 
            fontWeight: '800',
            margin: '0 0 8px 0',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Twittlite
          </h1>
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '18px',
            margin: 0,
            fontWeight: '500'
          }}>
            Connect, Share, and Discover <br/>
            For accessing the app, create an account <br/>
            or use demo credentials : <br/>
            demo username : Yash <br/>
            demo password : 1234 <br/>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
          {error && (
            <div style={{ color: '#ef4444', fontWeight: 600, fontSize: 14 }}>{error}</div>
          )}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px', 
              fontWeight: '600',
              fontSize: '16px',
              color: 'var(--text)'
            }}>
              Username
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@username"
              required
              className="input"
              style={{
                fontSize: '16px',
                padding: '16px 20px',
                height: '56px'
              }}
            />
          </div>
          {mode === 'register' && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, fontSize: '16px', color: 'var(--text)'}}>Display Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required className="input" style={{ fontSize: '16px', padding: '16px 20px', height: '56px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, fontSize: '16px', color: 'var(--text)'}}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="input" style={{ fontSize: '16px', padding: '16px 20px', height: '56px' }} />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, fontSize: '16px', color: 'var(--text)'}}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="input" style={{ fontSize: '16px', padding: '16px 20px', height: '56px' }} />
          </div>

          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, fontSize: '16px', color: 'var(--text)'}}>Bio (optional)</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} className="input" style={{ fontSize: '16px', padding: '12px 16px' }} />
            </div>
          )}
          
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg hover-glow" style={{ height: '56px', fontSize: '18px', fontWeight: '700', borderRadius: 'var(--radius-xl)', marginTop: '8px' }}>
            {loading ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Log In'}
          </button>
        </form>

        {/* Features */}
        <div style={{ 
          marginTop: '40px', 
          padding: '24px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)'
        }}>
          <h3 style={{ 
            margin: '0 0 16px 0', 
            fontSize: '16px',
            fontWeight: '700',
            color: 'var(--text)',
            textAlign: 'center'
          }}>
            What you can do
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              { icon: '💬', text: 'Share your thoughts' },
              { icon: '🔄', text: 'Retweet and engage' },
              { icon: '❤️', text: 'Like and connect' },
              { icon: '🔍', text: 'Discover trending topics' }
            ].map((feature, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>
                <span style={{ fontSize: '18px' }}>{feature.icon}</span>
                {feature.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
