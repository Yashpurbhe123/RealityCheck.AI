import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import TweetCard from '../components/TweetCard'
import { getState, subscribe, searchTweets, searchUsers, toggleFollow } from '../store-mongodb'

export default function SearchPage() {
  const [state, setState] = useState(getState())
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'all' | 'tweets' | 'users'>('all')
  const [searchResults, setSearchResults] = useState<{tweets: any[], users: any[]}>({ tweets: [], users: [] })
  const [isSearching, setIsSearching] = useState(false)
  const navigate = useNavigate()
  
  useEffect(() => {
    return subscribe(() => setState(getState()))
  }, [])

  const query = searchParams.get('q') || ''

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


  function handleUserClick(userId: string) {
    console.log('Search - handleUserClick called with userId:', userId)
    navigate(`/user/${userId}`)
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

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Search Header */}
        <div className="card" style={{ 
          padding: '24px',
          marginBottom: '24px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <h1 style={{ 
            margin: '0 0 16px 0', 
            fontSize: '28px',
            fontWeight: '800',
            color: 'var(--text)'
          }}>
            {query ? `Search results for "${query}"` : 'Search'}
          </h1>
          
          {query && (
            <div style={{ 
              display: 'flex', 
              gap: '24px', 
              color: 'var(--text-muted)',
              fontSize: '16px'
            }}>
              <span>
                <strong style={{ color: 'var(--text)', fontSize: '20px' }}>
                  {searchResults.tweets.length}
                </strong> Tweets
              </span>
              <span>
                <strong style={{ color: 'var(--text)', fontSize: '20px' }}>
                  {searchResults.users.length}
                </strong> Users
              </span>
            </div>
          )}
        </div>

        {query && (
          <>
            {/* Search Tabs */}
            <div className="card" style={{ 
              padding: '0',
              marginBottom: '24px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}>
              <div style={{ 
                display: 'flex', 
                borderBottom: '1px solid var(--border)'
              }}>
                {[
                  { id: 'all' as const, label: 'All', count: (searchResults.tweets?.length || 0) + (searchResults.users?.length || 0) },
                  { id: 'tweets' as const, label: 'Tweets', count: searchResults.tweets?.length || 0 },
                  { id: 'users' as const, label: 'Users', count: searchResults.users?.length || 0 }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="btn btn-ghost hover-lift"
                    style={{
                      flex: 1,
                      padding: '16px 20px',
                      background: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
                      color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: 0,
                      fontSize: '16px',
                      fontWeight: '600',
                      borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <span style={{ marginRight: '8px' }}>{tab.label}</span>
                    <span style={{
                      background: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div>
              {/* Loading Indicator */}
              {isSearching && (
                <div className="card" style={{ 
                  padding: '60px 40px',
                  textAlign: 'center',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: '24px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'var(--text)'
                  }}>
                    Searching...
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    color: 'var(--text-muted)',
                    fontSize: '16px',
                    lineHeight: '1.5'
                  }}>
                    Looking for tweets and users matching "{query}"
                  </p>
                </div>
              )}

              {/* Users Results */}
              {!isSearching && filteredResults.users.length > 0 && (
                <div className="card" style={{ 
                  marginBottom: '24px',
                  padding: '24px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <h3 style={{ 
                    margin: '0 0 20px 0', 
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'var(--text)'
                  }}>
                    Users ({filteredResults.users.length})
                  </h3>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {filteredResults.users.map(user => {
                      console.log('Search - User data:', user)
                      return (
                      <div 
                        key={user._id || user.id} 
                        onClick={() => handleUserClick(user._id)}
                        className="hover-lift" 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '16px',
                          background: 'var(--bg-tertiary)',
                          borderRadius: 'var(--radius)',
                          border: '1px solid var(--border-light)',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        <div style={{ 
                          width: '60px', 
                          height: '60px', 
                          borderRadius: '50%', 
                          background: 'var(--gradient-accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '24px'
                        }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: '700', 
                            fontSize: '18px',
                            color: 'var(--text)',
                            marginBottom: '4px'
                          }}>
                            {highlightText(user.name, query)}
                          </div>
                          <div style={{ 
                            color: 'var(--text-muted)', 
                            fontSize: '15px',
                            marginBottom: '8px'
                          }}>
                            @{highlightText(user.handle, query)}
                          </div>
                          {user.bio && (
                            <div style={{ 
                              color: 'var(--text-secondary)', 
                              fontSize: '14px',
                              lineHeight: '1.4',
                              marginBottom: '8px'
                            }}>
                              {highlightText(user.bio, query)}
                            </div>
                          )}
                          <div style={{ 
                            display: 'flex', 
                            gap: '16px',
                            fontSize: '13px',
                            color: 'var(--text-muted)'
                          }}>
                            <span>{user.followers.length} followers</span>
                            <span>{user.following.length} following</span>
                          </div>
                        </div>
                        {state.currentUserId && state.currentUserId !== user._id && (
                          <button
                            onClick={(e) => handleFollowClick(e, user._id)}
                            className="btn"
                            style={{
                              padding: '8px 16px',
                              fontSize: '14px',
                              fontWeight: '600',
                              borderRadius: 'var(--radius-xl)',
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
                              minWidth: '80px'
                            }}
                          >
                            {isFollowing(user._id) ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tweets Results */}
              {!isSearching && filteredResults.tweets.length > 0 && (
                <div>
                  <h3 style={{ 
                    margin: '0 0 20px 0', 
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'var(--text)'
                  }}>
                    Tweets ({filteredResults.tweets.length})
                  </h3>
                  {filteredResults.tweets.map(tweet => (
                    <TweetCard key={tweet._id || tweet.id} tweet={tweet} />
                  ))}
                </div>
              )}

              {/* No Results */}
              {!isSearching && filteredResults.users.length === 0 && filteredResults.tweets.length === 0 && (
                <div className="card" style={{ 
                  padding: '60px 40px',
                  textAlign: 'center',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔍</div>
                  <h3 style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '24px',
                    fontWeight: '700',
                    color: 'var(--text)'
                  }}>
                    No results found for "{query}"
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    color: 'var(--text-muted)',
                    fontSize: '16px',
                    lineHeight: '1.5'
                  }}>
                    Try searching with different keywords or check your spelling.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {!query && (
          <div className="card" style={{ 
            padding: '60px 40px',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔍</div>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--text)'
            }}>
              Search for anything
            </h3>
            <p style={{ 
              margin: 0, 
              color: 'var(--text-muted)',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              Use the search bar above to find tweets, users, and more.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
