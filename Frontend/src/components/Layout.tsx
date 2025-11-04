import { type PropsWithChildren, useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { getState, subscribe, logout, toggleTheme } from '../store-mongodb'
import SearchBar from './SearchBar'

export default function Layout({ children }: PropsWithChildren) {
  const [state, setState] = useState(getState())
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const location = useLocation()
  
  useEffect(() => {
    return subscribe(() => setState(getState()))
  }, [])
  
  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [location])

  const currentUser = state.currentUserId ? state.users[state.currentUserId] : null

  const navItems = [
    { to: '/', label: 'Home', icon: '🏠', end: true },
    { to: '/search', label: 'Search', icon: '🔍' },
    { to: '/profile', label: 'Profile', icon: '👤' },
    { to: '/settings', label: 'Settings', icon: '⚙️' }
  ]

  return (
    <div className={`layout animate-fade-in ${isSidebarMinimized ? 'sidebar-minimized' : ''}`}>
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className={`mobile-sidebar-overlay ${isMobileSidebarOpen ? 'open' : ''}`}
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Header */}
      <div className="mobile-only mobile-header">
        <div className="logo">Twittlite</div>
        <button 
          className="menu-toggle"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Sidebar */}
      <div className={`mobile-only mobile-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-content">
          {/* Mobile Sidebar Header */}
          <div className="mobile-sidebar-header">
            <div className="mobile-sidebar-logo">Twittlite</div>
            <button 
              className="mobile-sidebar-close"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Search Section */}
          <div className="mobile-sidebar-section">
            <h3>🔍 Search</h3>
            <SearchBar />
          </div>

          {/* Navigation Section */}
          <div className="mobile-sidebar-section">
            <h3>🧭 Navigation</h3>
            <nav style={{ display: 'grid', gap: '12px' }}>
              {navItems.filter(item => item.to !== '/search').map((item) => (
                <NavLink 
                  key={item.to}
                  to={item.to} 
                  end={item.end}
                  className={({ isActive }) => 
                    `btn btn-ghost ${isActive ? 'hover-glow' : ''} hover-lift`
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
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                  }}
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <span style={{ fontSize: '22px', marginRight: '16px' }}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* User Profile Section */}
          {currentUser && (
            <div className="mobile-sidebar-section">
              <h3>👤 Profile</h3>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                marginBottom: '20px' 
              }}>
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

          {/* Theme Toggle Section */}
          <div className="mobile-sidebar-section">
            <h3>🎨 Theme</h3>
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

          {/* Trending Section */}
          <div className="mobile-sidebar-section">
            <h3>🔥 What's happening</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              {['#ReactJS', '#TypeScript', '#WebDev', '#JavaScript', '#AI'].map((tag) => (
                <div 
                  key={tag}
                  className="hover-lift hover-glow"
                  style={{
                    padding: '16px 20px',
                    background: 'var(--bg-glass)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid var(--border)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
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
        </div>
      </div>

      {/* Left Sidebar */}
      <aside className={`left-sidebar glass animate-slide-in ${isSidebarMinimized ? 'minimized' : ''}`} style={{ 
        padding: '32px 24px',
        background: 'var(--bg-glass)',
        borderRight: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}>
        {/* Sidebar Header with Minimize Button */}
        <div className="desktop-only" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '40px'
        }}>
          <div className="animate-float" style={{ flex: 1 }}>
            <h1 className="text-gradient" style={{ 
              fontSize: '32px', 
              fontWeight: '900',
              margin: 0,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              letterSpacing: '-0.5px',
              transition: 'all 0.3s ease'
            }}>
              Twittlite
            </h1>
            <p style={{ 
              color: 'var(--text-muted)', 
              fontSize: '15px',
              margin: '8px 0 0 0',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}>
              Connect & Share ✨
            </p>
          </div>
          <button
            onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
            className="btn btn-ghost btn-sm hover-lift"
            style={{
              padding: '8px',
              borderRadius: '50%',
              minWidth: 'auto',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: 'var(--text-muted)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              transition: 'all 0.3s ease'
            }}
            title={isSidebarMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
          >
            {isSidebarMinimized ? '▶' : '◀'}
          </button>
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
                justifyContent: isSidebarMinimized ? 'center' : 'flex-start',
                padding: isSidebarMinimized ? '16px 8px' : '16px 20px',
                borderRadius: 'var(--radius-xl)',
                fontSize: isSidebarMinimized ? '20px' : '17px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                background: location.pathname === item.to ? 'var(--primary-light)' : 'var(--bg-glass)',
                color: location.pathname === item.to ? 'var(--primary)' : 'var(--text-secondary)',
                border: location.pathname === item.to ? '1px solid var(--primary)' : '1px solid var(--border)',
                animationDelay: `${index * 0.1}s`,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                position: 'relative'
              }}
              title={isSidebarMinimized ? item.label : undefined}
            >
              <span style={{ 
                fontSize: isSidebarMinimized ? '20px' : '22px', 
                marginRight: isSidebarMinimized ? '0' : '16px' 
              }}>
                {item.icon}
              </span>
              <span style={{ 
                opacity: isSidebarMinimized ? 0 : 1,
                transition: 'opacity 0.3s ease',
                whiteSpace: 'nowrap'
              }}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
        
        {/* User Profile */}
        {currentUser && (
          <div className="card animate-slide-in-up" style={{ 
            padding: isSidebarMinimized ? '16px 8px' : '24px',
            marginTop: 'auto',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            animationDelay: '0.4s'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isSidebarMinimized ? '0' : '16px', 
              marginBottom: isSidebarMinimized ? '0' : '20px',
              flexDirection: isSidebarMinimized ? 'column' : 'row'
            }}>
              <div className="hover-scale" style={{ 
                width: isSidebarMinimized ? '40px' : '56px', 
                height: isSidebarMinimized ? '40px' : '56px', 
                borderRadius: '50%', 
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '800',
                fontSize: isSidebarMinimized ? '16px' : '20px',
                boxShadow: 'var(--shadow-lg)',
                transition: 'all 0.3s ease'
              }}>
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              {!isSidebarMinimized && (
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
              )}
            </div>
            
            {!isSidebarMinimized && (
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
            )}
          </div>
        )}
      </aside>
      
      {/* Main Content */}
      <main className="responsive-padding" style={{ 
        padding: '24px 32px', 
        margin: '0 auto',
        width: '100%',
        maxWidth: '100%'
      }}>
        {children}
      </main>
      
      {/* Right Sidebar */}
      <aside className="right-sidebar desktop-only glass animate-slide-in" style={{ 
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

          {/* Suggestions removed */}
        </div>
      </aside>
    </div>
  )
}

