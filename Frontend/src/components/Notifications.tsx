import { useEffect, useState, useRef } from 'react'
import { getState, subscribe, markNotificationAsRead, markAllNotificationsAsRead } from '../store-mongodb'

export default function Notifications() {
  const [state, setState] = useState(getState())
  const [isOpen, setIsOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    return subscribe(() => setState(getState()))
  }, [])

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Safety check for state initialization
  if (!state || !state.notifications || !Array.isArray(state.notifications)) {
    return null
  }

  // Sort notifications by creation date (newest first) and filter out null/undefined
  const sortedNotifications = [...state.notifications]
    .filter(n => n && n._id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const unreadCount = sortedNotifications.filter(n => !n.read).length

  function formatTime(timestamp: number | string): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  function getNotificationIcon(type: string): string {
    switch (type) {
      case 'like': return '❤️'
      case 'retweet': return '🔄'
      case 'follow': return '👤'
      case 'reply': return '💬'
      default: return '🔔'
    }
  }

  function getNotificationColor(type: string): string {
    switch (type) {
      case 'like': return '#ef4444'
      case 'retweet': return '#10b981'
      case 'follow': return '#3b82f6'
      case 'reply': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  function getNotificationMessage(notification: any): string {
    const fromUser = notification.fromUser
    const fromName = fromUser?.name || 'Someone'
    
    switch (notification.type) {
      case 'like':
        return `${fromName} liked your tweet`
      case 'retweet':
        return `${fromName} retweeted your tweet`
      case 'follow':
        return `${fromName} started following you`
      case 'reply':
        return `${fromName} replied to your tweet`
      default:
        return notification.message || 'New notification'
    }
  }

  function handleNotificationClick(notification: any) {
    if (notification._id && !notification.read) {
      markNotificationAsRead(notification._id)
    }
    setIsOpen(false)
  }

  return (
    <>
      {/* Notification Bell Button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '12px',
            borderRadius: '50%',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: 'var(--text)',
            position: 'relative',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--hover)'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          🔔
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
              animation: 'pulse 2s infinite'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.1)',
            zIndex: 2147483646,
            backdropFilter: 'blur(2px)'
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Notification Container */}
      {isOpen && (
        <div 
          ref={notificationRef}
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            width: '400px',
            maxWidth: 'calc(100vw - 40px)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            zIndex: 2147483647,
            maxHeight: '600px',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            color: 'white'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsAsRead()}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '500px', overflow: 'auto' }}>
            {sortedNotifications.length === 0 ? (
              <div style={{
                padding: '40px 24px',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                  No notifications yet
                </h4>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  You'll see notifications here when people interact with your content
                </p>
              </div>
            ) : (
              <div>
                {sortedNotifications.map((notification, index) => (
                  <div
                    key={notification._id}
                    className="notification-item"
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      padding: '16px 24px',
                      borderBottom: index < sortedNotifications.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      background: notification.read ? 'transparent' : 'linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = notification.read 
                        ? 'var(--hover)' 
                        : 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notification.read 
                        ? 'transparent' 
                        : 'linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)'
                    }}
                  >
                    {/* Notification Icon */}
                    <div style={{ 
                      fontSize: '24px',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: `${getNotificationColor(notification.type)}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* Notification Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '14px',
                        lineHeight: '1.4',
                        color: 'var(--text)',
                        fontWeight: notification.read ? '400' : '500'
                      }}>
                        {getNotificationMessage(notification)}
                      </div>
                      <div style={{
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                        marginTop: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>{formatTime(notification.createdAt)}</span>
                        {notification.tweet && (
                          <>
                            <span>•</span>
                            <span style={{ 
                              background: 'var(--primary)',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontSize: '10px'
                            }}>
                              Tweet
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        marginTop: '8px',
                        flexShrink: 0,
                        boxShadow: '0 0 0 2px var(--bg-secondary)'
                      }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}