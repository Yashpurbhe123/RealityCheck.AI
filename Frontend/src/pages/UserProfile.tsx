import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import TweetCard from '../components/TweetCard'
import { getState, subscribe, toggleFollow, getUserFeed, loadUserTweets } from '../store-mongodb'
import apiService from '../services/api'

export default function UserProfilePage() {
  const [state, setState] = useState(getState())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useParams<{ userId: string }>()
  
  useEffect(() => {
    return subscribe(() => setState(getState()))
  }, [])

  // Load user data when userId changes
  useEffect(() => {
    console.log('UserProfile - userId from params:', userId)
    if (userId && userId !== 'undefined') {
      loadUserData(userId)
    } else {
      console.error('UserProfile - Invalid userId:', userId)
      setError('Invalid user ID')
    }
  }, [userId])

  const loadUserData = async (userId: string) => {
    console.log('loadUserData called with userId:', userId)
    setLoading(true)
    setError(null)
    try {
      // Check if user is already in state
      if (state.users[userId]) {
        console.log('User already in state, skipping API call')
        setLoading(false)
        return
      }

      console.log('Fetching user data from API for userId:', userId)
      // Fetch user data from API
      const userData = await apiService.getUser(userId)
      
      // Update state with user data
      setState(prevState => ({
        ...prevState,
        users: {
          ...prevState.users,
          [userId]: userData
        }
      }))

      // Load user tweets
      await loadUserTweets(userId)
    } catch (error) {
      console.error('Failed to load user data:', error)
      setError('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  const user = userId ? state.users[userId] : null
  const currentUser = state.currentUserId ? state.users[state.currentUserId] : null
  
  if (loading) {
    return (
      <Layout>
        <div className="animate-fade-in">
          <div className="card" style={{ 
            padding: '60px 40px',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--text)'
            }}>
              Loading profile...
            </h3>
            <p style={{ 
              margin: 0, 
              color: 'var(--text-muted)',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              Please wait while we load the user's profile.
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !user) {
    return (
      <Layout>
        <div className="animate-fade-in">
          <div className="card" style={{ 
            padding: '60px 40px',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>👤</div>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--text)'
            }}>
              {error || 'User not found'}
            </h3>
            <p style={{ 
              margin: 0, 
              color: 'var(--text-muted)',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              {error || 'The user you\'re looking for doesn\'t exist or has been removed.'}
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  const userTweets = getUserFeed(userId!)
  const isFollowing = currentUser?.following?.includes(userId!) || false
  const isOwnProfile = currentUser?._id === userId

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* User Profile Header */}
        <div className="card card-elevated" style={{ 
          padding: '32px', 
          marginBottom: '24px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%', 
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '700',
              fontSize: '48px',
              boxShadow: 'var(--shadow-md)'
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '32px',
                fontWeight: '800',
                color: 'var(--text)'
              }}>
                {user.name}
              </h1>
              <p style={{ 
                margin: '0 0 8px 0', 
                color: 'var(--text-muted)',
                fontSize: '18px',
                fontWeight: '500'
              }}>
                @{user.handle}
              </p>
              {user.bio && (
                <p style={{ 
                  margin: '0 0 16px 0', 
                  color: 'var(--text-secondary)',
                  fontSize: '16px',
                  lineHeight: '1.5'
                }}>
                  {user.bio}
                </p>
              )}
              
              <div style={{ 
                display: 'flex', 
                gap: '32px', 
                color: 'var(--text-muted)',
                fontSize: '16px',
                marginBottom: '20px'
              }}>
                <span>
                  <strong style={{ color: 'var(--text)', fontSize: '20px' }}>
                    {user.followers?.length || 0}
                  </strong> Followers
                </span>
                <span>
                  <strong style={{ color: 'var(--text)', fontSize: '20px' }}>
                    {user.following?.length || 0}
                  </strong> Following
                </span>
                <span>
                  <strong style={{ color: 'var(--text)', fontSize: '20px' }}>
                    {userTweets.length}
                  </strong> Tweets
                </span>
              </div>

              {/* Follow/Unfollow Button */}
              {!isOwnProfile && currentUser && (
                <button
                  onClick={() => toggleFollow(userId!)}
                  className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} hover-glow`}
                  style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '700',
                    borderRadius: 'var(--radius-xl)',
                    minWidth: '120px'
                  }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}

              {isOwnProfile && (
                <div style={{
                  padding: '12px 24px',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  borderRadius: 'var(--radius-xl)',
                  fontSize: '16px',
                  fontWeight: '700',
                  display: 'inline-block'
                }}>
                  This is you
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User's Tweets */}
        <div>
          <h2 style={{ 
            margin: '0 0 20px 0', 
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--text)'
          }}>
            Tweets by {user.name}
          </h2>
          
          {userTweets.length > 0 ? (
            userTweets.map(tweet => (
              <TweetCard key={tweet._id} tweet={tweet} />
            ))
          ) : (
            <div className="card" style={{ 
              padding: '60px 40px',
              textAlign: 'center',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '20px',
                fontWeight: '700',
                color: 'var(--text)'
              }}>
                No tweets yet
              </h3>
              <p style={{ 
                margin: 0, 
                color: 'var(--text-muted)',
                fontSize: '16px'
              }}>
                {isOwnProfile ? 'Start sharing your thoughts!' : `${user.name} hasn't tweeted anything yet.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
