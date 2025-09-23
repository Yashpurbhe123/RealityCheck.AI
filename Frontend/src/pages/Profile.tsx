import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import TweetCard from '../components/TweetCard'
import { getState, subscribe, toggleFollow, getUserFeed, getFollowingFeed, getLikedTweets, getRetweetedTweets, loadUserTweets } from '../store-mongodb'

export default function ProfilePage() {
  const [state, setState] = useState(getState())
  const [activeTab, setActiveTab] = useState<'tweets' | 'following' | 'likes' | 'retweets'>('tweets')
  const navigate = useNavigate()
  
  useEffect(() => {
    return subscribe(() => setState(getState()))
  }, [])

  useEffect(() => {
    if (state.currentUserId) {
      loadUserTweets(state.currentUserId)
    }
  }, [state.currentUserId])

  const currentUser = state.currentUserId ? state.users[state.currentUserId] : null
  if (!currentUser) return null

  const myTweets = getUserFeed(state.currentUserId!)
  const followingTweets = getFollowingFeed(state.currentUserId!)
  const likedTweets = getLikedTweets(state.currentUserId!)
  const retweetedTweets = getRetweetedTweets(state.currentUserId!)

  const suggestedUsers = Object.values(state.users)
    .filter(user => user._id !== state.currentUserId)
    .slice(0, 3)

  const tabs = [
    { id: 'tweets' as const, label: 'Tweets', count: myTweets.length },
    { id: 'following' as const, label: 'Following', count: followingTweets.length },
    { id: 'likes' as const, label: 'Likes', count: likedTweets.length },
    { id: 'retweets' as const, label: 'Retweets', count: retweetedTweets.length },
  ]

  function getCurrentTweets() {
    switch (activeTab) {
      case 'tweets': return myTweets
      case 'following': return followingTweets
      case 'likes': return likedTweets
      case 'retweets': return retweetedTweets
      default: return []
    }
  }

  function handleUserClick(userId: string) {
    navigate(`/user/${userId}`)
  }

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Profile Header */}
        <div className="card card-elevated responsive-padding" style={{ 
          padding: '32px', 
          marginBottom: '24px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div className="responsive-flex" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '24px', 
            marginBottom: '24px' 
          }}>
            <div style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '700',
              fontSize: '36px',
              boxShadow: 'var(--shadow-md)',
              flexShrink: 0
            }}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '32px',
                fontWeight: '800',
                color: 'var(--text)'
              }}>
                {currentUser.name}
              </h1>
              <p style={{ 
                margin: '0 0 8px 0', 
                color: 'var(--text-muted)',
                fontSize: '18px',
                fontWeight: '500'
              }}>
                @{currentUser.handle}
              </p>
              {currentUser.bio && (
                <p style={{ 
                  margin: '0 0 16px 0', 
                  color: 'var(--text-secondary)',
                  fontSize: '16px',
                  lineHeight: '1.5'
                }}>
                  {currentUser.bio}
                </p>
              )}
              
              <div className="responsive-flex" style={{ 
                display: 'flex', 
                gap: '32px', 
                color: 'var(--text-muted)',
                fontSize: '16px',
                flexWrap: 'wrap'
              }}>
                <span>
                  <strong style={{ color: 'var(--text)', fontSize: '20px' }}>
                    {currentUser.followers.length}
                  </strong> Followers
                </span>
                <span>
                  <strong style={{ color: 'var(--text)', fontSize: '20px' }}>
                    {currentUser.following.length}
                  </strong> Following
                </span>
                <span>
                  <strong style={{ color: 'var(--text)', fontSize: '20px' }}>
                    {myTweets.length}
                  </strong> Tweets
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
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
            {tabs.map(tab => (
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

        {/* Content */}
        <div>
          {getCurrentTweets().length > 0 ? (
            getCurrentTweets().map(tweet => <TweetCard key={tweet._id} tweet={tweet} />)
          ) : (
            <div className="card" style={{ 
              padding: '60px 40px',
              textAlign: 'center',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                {activeTab === 'tweets' && '📝'}
                {activeTab === 'following' && '👥'}
                {activeTab === 'likes' && '❤️'}
                {activeTab === 'retweets' && '🔄'}
              </div>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '20px',
                fontWeight: '700',
                color: 'var(--text)'
              }}>
                {activeTab === 'tweets' && 'No tweets yet'}
                {activeTab === 'following' && 'No tweets from following'}
                {activeTab === 'likes' && 'No liked tweets yet'}
                {activeTab === 'retweets' && 'No retweets yet'}
              </h3>
              <p style={{ 
                margin: 0, 
                color: 'var(--text-muted)',
                fontSize: '16px'
              }}>
                {activeTab === 'tweets' && 'Start sharing your thoughts with the world!'}
                {activeTab === 'following' && 'Follow more people to see their tweets here.'}
                {activeTab === 'likes' && 'Like some tweets to see them here.'}
                {activeTab === 'retweets' && 'Retweet some tweets to see them here.'}
              </p>
            </div>
          )}
        </div>

        {/* Suggested Users */}
        {suggestedUsers.length > 0 && (
          <div className="card" style={{ 
            marginTop: '40px',
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
              Suggested Users
            </h3>
            <div className="responsive-grid" style={{ display: 'grid', gap: '16px' }}>
              {suggestedUsers.map(user => (
                <div 
                  key={user._id} 
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
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minWidth: 0
                  }}
                >
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '50%', 
                    background: 'var(--gradient-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '18px',
                    flexShrink: 0
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: '700', 
                      fontSize: '16px',
                      color: 'var(--text)',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {user.name}
                    </div>
                    <div style={{ 
                      color: 'var(--text-muted)', 
                      fontSize: '14px',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      @{user.handle}
                    </div>
                    {user.bio && (
                      <div style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '14px',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {user.bio}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFollow(user._id)
                    }}
                    className={`btn ${currentUser.following.includes(user._id) ? 'btn-secondary' : 'btn-primary'} btn-sm hover-glow`}
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      minWidth: '80px',
                      flexShrink: 0
                    }}
                  >
                    {currentUser.following.includes(user._id) ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}