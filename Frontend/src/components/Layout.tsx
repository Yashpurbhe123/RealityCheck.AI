import { type PropsWithChildren, useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { getState, subscribe, logout, toggleTheme } from '../store-mongodb'
import SearchBar from './SearchBar'

export default function Layout({ children }: PropsWithChildren) {
  const [state, setState] = useState(getState())
  const location = useLocation()
  
  useEffect(() => {
    return subscribe(() => setState(getState()))
  }, [])

  const currentUser = state.currentUserId ? state.users[state.currentUserId] : null

  const navItems = [
    { to: '/', label: 'Home', icon: '🏠', end: true },
    { to: '/search', label: 'Search', icon: '🔍' },
    { to: '/profile', label: 'Profile', icon: '👤' },
    { to: '/settings', label: 'Settings', icon: '⚙️' }
  ]

  return (
    <div className="layout animate-fade-in">
      {/* Left Sidebar */}
      <aside className="left-sidebar glass animate-slide-in" style={{ 
        padding: '32px 24px',
        background: 'var(--bg-glass)',
        borderRight: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}>
        {/* Logo */}
        <div className="animate-float" style={{ marginBottom: '40px' }}>
          <h1 className="text-gradient" style={{ 
            fontSize: '32px', 
            fontWeight: '900',
            margin: 0,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            letterSpacing: '-0.5px'
          }}>
            Twittlite
          </h1>
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '15px',
            margin: '8px 0 0 0',
            fontWeight: '500'
          }}>
            Connect & Share ✨
          </p>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'grid', gap: '12px', marginBottom: '40px' }}>
          {navItems.map((item, index) => (
            <NavLink 
              key={item.to}
              to={item.to} 
              end={item.end}
              className={({ isActive }) => 
                `btn btn-ghost ${isActive ? 'hover-glow' : ''} hover-lift animate-slide-in-up`
              }
              style={{ 
                justifyContent: 'flex-start',
                padding: '16px 20px',
                borderRadius: 'var(--radius-xl)',
                fontSize: '17px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                background: location.pathname === item.to ? 'var(--primary-light)' : 'var(--bg-glass)',
                color: location.pathname === item.to ? 'var(--primary)' : 'var(--text-secondary)',
                border: location.pathname === item.to ? '1px solid var(--primary)' : '1px solid var(--border)',
                animationDelay: `${index * 0.1}s`,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}
            >
              <span style={{ fontSize: '22px', marginRight: '16px' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        
        {/* User Profile */}
        {currentUser && (
          <div className="card animate-slide-in-up" style={{ 
            padding: '24px',
            marginTop: 'auto',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            animationDelay: '0.4s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
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
                boxShadow: 'var(--shadow-lg)',
                transition: 'all 0.3s ease'
              }}>
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: '700', 
                  fontSize: '16px',
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {currentUser.name}
                </div>
                <div style={{ 
                  color: 'var(--text-muted)', 
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  @{currentUser.handle}
                </div>
              </div>
            </div>
            
            {/* Account Switcher removed as requested */}
            
            <button 
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{
                width: '100%',
                fontSize: '14px'
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </aside>
      
      {/* Main Content */}
      <main style={{ 
        padding: '24px 32px', 
        margin: '0 auto',
        width: '100%'
      }}>
        {children}
      </main>
      
      {/* Right Sidebar */}
      <aside className="right-sidebar glass animate-slide-in" style={{ 
        padding: '32px 24px',
        background: 'var(--bg-glass)',
        borderLeft: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        animationDelay: '0.2s'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Search */}
          <div className="animate-slide-in">
            <SearchBar />
          </div>
          
          {/* Theme Toggle */}
          <div className="card animate-slide-in-up" style={{ padding: '20px', animationDelay: '0.3s' }}>
            <button
              onClick={() => {
                console.log('Theme toggle button clicked, current theme:', state.theme)
                toggleTheme()
              }}
              className="btn btn-secondary hover-lift hover-glow"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '16px',
                fontSize: '15px',
                fontWeight: '600',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}
            >
              <span style={{ fontSize: '18px' }}>{state.theme === 'light' ? '🌙' : '☀️'}</span>
              {state.theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
          
          {/* Trending */}
          <div className="card card-elevated animate-slide-in-up" style={{ padding: '24px', animationDelay: '0.4s' }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '20px',
              fontWeight: '800',
              color: 'var(--text)',
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🔥 What's happening
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              {['#ReactJS', '#TypeScript', '#WebDev', '#JavaScript', '#AI'].map((tag, index) => (
                <div 
                  key={tag}
                  className="hover-lift hover-glow animate-slide-in-up"
                  style={{
                    padding: '16px 20px',
                    background: 'var(--bg-glass)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid var(--border)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    animationDelay: `${0.5 + index * 0.1}s`
                  }}
                >
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '700',
                    color: 'var(--text)',
                    marginBottom: '6px'
                  }}>
                    {tag}
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: 'var(--text-muted)',
                    fontWeight: '500'
                  }}>
                    {Math.floor(Math.random() * 1000) + 100} posts
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="card animate-slide-in-up" style={{ padding: '24px', animationDelay: '0.6s' }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '20px',
              fontWeight: '800',
              color: 'var(--text)',
              background: 'var(--gradient-accent)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              👥 Who to follow
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              {['Alex Developer', 'Sarah Coder', 'Mike Programmer'].map((name, index) => (
                <div 
                  key={name}
                  className="hover-lift hover-glow animate-slide-in-up"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    background: 'var(--bg-glass)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid var(--border)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    animationDelay: `${0.7 + index * 0.1}s`
                  }}
                >
                  <div className="hover-scale" style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '50%', 
                    background: 'var(--gradient-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '800',
                    fontSize: '18px',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'all 0.3s ease'
                  }}>
                    {name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: '700', 
                      fontSize: '15px',
                      color: 'var(--text)',
                      marginBottom: '2px'
                    }}>
                      {name}
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-muted)',
                      fontWeight: '500'
                    }}>
                      @{name.toLowerCase().replace(' ', '')}
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm hover-lift" style={{ 
                    fontSize: '13px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

