import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getState, subscribe, setSearchQuery, searchTweets, searchUsers, toggleFollow } from '../store-mongodb'

export default function SearchBar() {
  const [state, setState] = useState(getState())
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'tweets' | 'users'>('all')
  const [searchResults, setSearchResults] = useState<{tweets: any[], users: any[]}>({ tweets: [], users: [] })
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  
  useEffect(() => {
    return subscribe(() => setState(getState()))
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle search when query changes
  useEffect(() => {
    if (query.trim()) {
      setIsSearching(true)
      Promise.all([
        searchTweets(query),
        searchUsers(query)
      ]).then(([tweets, users]) => {
        setSearchResults({
          tweets: tweets || [],
          users: users || []
        })
        setIsSearching(false)
      }).catch(error => {
        console.error('Search error:', error)
        setSearchResults({ tweets: [], users: [] })
        setIsSearching(false)
      })
    } else {
      setSearchResults({ tweets: [], users: [] })
    }
  }, [query])

  const filteredResults = {
    tweets: activeTab === 'all' || activeTab === 'tweets' ? searchResults.tweets : [],
    users: activeTab === 'all' || activeTab === 'users' ? searchResults.users : []
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      setSearchQuery(query)
      setShowResults(false)
      navigate(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  function handleUserClick(userId: string) {
    console.log('SearchBar - handleUserClick called with userId:', userId)
    setShowResults(false)
    setQuery('')
    navigate(`/user/${userId}`)
  }

  function handleTweetClick(_tweetId: string) {
    setShowResults(false)
    setQuery('')
    // Could scroll to tweet here
  }

  function handleFollowClick(e: React.MouseEvent, userId: string) {
    e.stopPropagation() // Prevent navigation when clicking follow button
    if (state.currentUserId) {
      toggleFollow(userId)
    }
  }

  function isFollowing(userId: string): boolean {
    if (!state.currentUserId) return false
    const currentUser = state.users[state.currentUserId]
    return currentUser?.following?.includes(userId) || false
  }

  function highlightText(text: string, query: string) {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} style={{ 
          background: 'var(--primary-light)', 
          color: 'var(--primary)',
          padding: '0 2px',
          borderRadius: '2px',
          fontWeight: '600'
        }}>
          {part}
        </mark>
      ) : part
    )
  }

  function formatTime(timestamp: number | string): string {
    const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp
    const diff = Date.now() - time
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  return (
    <div ref={searchRef} style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSearch}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            placeholder="Search tweets, users..."
            className="input"
            style={{
              width: '100%',
              padding: '12px 16px 12px 48px',
              borderRadius: 'var(--radius-xl)',
              fontSize: '16px',
              background: 'var(--bg-tertiary)',
              border: '2px solid var(--border)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
          <div style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            fontSize: '18px'
          }}>
            🔍
          </div>
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setShowResults(false)
              }}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          )}
        </div>
      </form>

      {showResults && query.trim() && (
        <div className="card animate-fade-in" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 1000,
          marginTop: '8px',
          overflow: 'hidden',
          maxHeight: '500px',
          maxWidth: 'calc(100vw - 40px)',
          width: '400px'
        }}>
          {/* Search Tabs */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-tertiary)'
          }}>
            {[
              { id: 'all' as const, label: 'All', count: (searchResults.tweets?.length || 0) + (searchResults.users?.length || 0) },
              { id: 'tweets' as const, label: 'Tweets', count: searchResults.tweets?.length || 0 },
              { id: 'users' as const, label: 'Users', count: searchResults.users?.length || 0 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="btn btn-ghost"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 0,
                  fontSize: '14px',
                  fontWeight: '600',
                  borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <span style={{ marginRight: '6px' }}>{tab.label}</span>
                <span style={{
                  background: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {/* Loading Indicator */}
            {isSearching && (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>🔍</div>
                <div>Searching...</div>
              </div>
            )}
            
            {/* Users Results */}
            {!isSearching && filteredResults.users.length > 0 && (
              <div>
                <div style={{ 
                  padding: '12px 16px 8px', 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Users
                </div>
                {filteredResults.users.slice(0, 5).map(user => (
                  <div
                    key={user._id || user.id}
                    onClick={() => handleUserClick(user._id)}
                    className="hover-lift"
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
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
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: '700', 
                        fontSize: '15px',
                        color: 'var(--text)',
                        marginBottom: '2px'
                      }}>
                        {highlightText(user.name, query)}
                      </div>
                      <div style={{ 
                        color: 'var(--text-muted)', 
                        fontSize: '13px',
                        marginBottom: '2px'
                      }}>
                        @{highlightText(user.handle, query)}
                      </div>
                      {user.bio && (
                        <div style={{ 
                          color: 'var(--text-secondary)', 
                          fontSize: '12px',
                          lineHeight: '1.3',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {highlightText(user.bio, query)}
                        </div>
                      )}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      flexShrink: 0
                    }}>
                      <div className="desktop-only" style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        fontWeight: '500'
                      }}>
                        {user.followers.length} followers
                      </div>
                      {state.currentUserId && state.currentUserId !== user._id && (
                        <button
                          onClick={(e) => handleFollowClick(e, user._id)}
                          className="btn"
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            borderRadius: 'var(--radius-lg)',
                            background: isFollowing(user._id) 
                              ? 'var(--bg-tertiary)' 
                              : 'var(--primary)',
                            color: isFollowing(user._id) 
                              ? 'var(--text)' 
                              : 'white',
                            border: isFollowing(user._id) 
                              ? '1px solid var(--border)' 
                              : 'none',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            minWidth: '60px'
                          }}
                        >
                          {isFollowing(user._id) ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tweets Results */}
            {!isSearching && filteredResults.tweets.length > 0 && (
              <div>
                <div style={{ 
                  padding: '12px 16px 8px', 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Tweets
                </div>
                {filteredResults.tweets.slice(0, 8).map(tweet => (
                  <div
                    key={tweet._id || tweet.id}
                    onClick={() => handleTweetClick(tweet._id || tweet.id)}
                    className="hover-lift"
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '14px',
                        flexShrink: 0
                      }}>
                        {tweet.author?.name?.charAt(0).toUpperCase() || state.users[tweet.authorId]?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          marginBottom: '4px',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{ 
                            fontWeight: '700', 
                            fontSize: '14px',
                            color: 'var(--text)'
                          }}>
                            {tweet.author?.name || state.users[tweet.authorId]?.name || 'Unknown'}
                          </span>
                          <span style={{ 
                            color: 'var(--text-muted)', 
                            fontSize: '13px'
                          }}>
                            @{tweet.author?.handle || state.users[tweet.authorId]?.handle || 'unknown'}
                          </span>
                          <span style={{ 
                            color: 'var(--text-muted)', 
                            fontSize: '13px'
                          }}>
                            ·
                          </span>
                          <span style={{ 
                            color: 'var(--text-muted)', 
                            fontSize: '13px'
                          }}>
                            {formatTime(tweet.createdAt)}
                          </span>
                        </div>
                        <div style={{ 
                          fontSize: '14px',
                          lineHeight: '1.4',
                          color: 'var(--text)',
                          wordBreak: 'break-word'
                        }}>
                          {highlightText(tweet.content, query)}
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          gap: '16px', 
                          marginTop: '8px',
                          fontSize: '12px',
                          color: 'var(--text-muted)'
                        }}>
                          <span>❤️ {tweet.likeCount ?? (Array.isArray(tweet.likes) ? tweet.likes.length : 0)}</span>
                          <span>🔄 {tweet.retweetCount ?? (Array.isArray(tweet.retweets) ? tweet.retweets.length : 0)}</span>
                          <span>💬 {tweet.replyCount ?? (Array.isArray(tweet.replies) ? tweet.replies.length : 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {!isSearching && filteredResults.users.length === 0 && filteredResults.tweets.length === 0 && (
              <div style={{ 
                padding: '40px 20px', 
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  marginBottom: '4px',
                  color: 'var(--text)'
                }}>
                  No results found
                </div>
                <div style={{ fontSize: '14px' }}>
                  Try searching for something else
                </div>
              </div>
            )}
          </div>

          {/* Search Footer */}
          {query.trim() && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-tertiary)',
              fontSize: '12px',
              color: 'var(--text-muted)',
              textAlign: 'center'
            }}>
              Press Enter to search for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}