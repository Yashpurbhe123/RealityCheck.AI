import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import TweetComposer from '../components/TweetComposer'
import TweetCard from '../components/TweetCard'
import Notifications from '../components/Notifications'
// import { useRealtime } from '../hooks/useRealtime' // Temporarily disabled
import { getState, subscribe, getFollowingFeed, initializeApp } from '../store-mongodb'

export default function HomePage() {
  const [state, setState] = useState(getState())
  // useRealtime() // Temporarily disabled to prevent invalid tweet creation
  
  useEffect(() => {
    initializeApp()
    return subscribe(() => setState(getState()))
  }, [])

  // Get tweets from followed users only
  const feedTweets = state.currentUserId ? getFollowingFeed(state.currentUserId) : []

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Hero Header */}
        <div className="card animate-slide-in-up responsive-padding" style={{ 
          padding: '32px',
          marginBottom: '32px',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: 'var(--shadow-xl)'
        }}>
          <div className="responsive-flex" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '20px' 
          }}>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: '36px',
                fontWeight: '900',
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-1px'
              }}>
                Welcome Home! 🏠
              </h1>
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '18px',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>
                Stay connected with what matters most
              </p>
            </div>
            <div className="responsive-flex horizontal-mobile" style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div className="desktop-only animate-glow" style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px', 
                background: 'var(--bg-glass)', 
                borderRadius: 'var(--radius-xl)', 
                fontSize: '15px',
                color: 'var(--primary)',
                fontWeight: '700',
                border: '2px solid var(--primary)',
                boxShadow: 'var(--shadow-lg)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}>
                <span className="animate-pulse" style={{ fontSize: '18px' }}>🔴</span>
                Live updates
              </div>
              <Notifications />
            </div>
          </div>
        </div>
        
        {/* Tweet Composer */}
        <div className="animate-slide-in-up" style={{ marginBottom: '32px', animationDelay: '0.2s' }}>
          <TweetComposer />
        </div>
        
        {/* Feed */}
        {feedTweets.length > 0 ? (
          <div style={{ display: 'grid', gap: '20px' }}>
            {feedTweets.map((tweet, index) => (
              <div key={tweet._id} className="animate-slide-in-up" style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
                <TweetCard tweet={tweet} />
              </div>
            ))}
          </div>
        ) : (
          <div className="card animate-slide-in-up" style={{ 
            padding: '80px 40px',
            textAlign: 'center',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: 'var(--shadow-xl)',
            animationDelay: '0.3s'
          }}>
            <div className="animate-float" style={{ fontSize: '64px', marginBottom: '24px' }}>🏠</div>
            <h2 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '28px',
              fontWeight: '800',
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Your feed is waiting! ✨
            </h2>
            <p style={{ 
              margin: '0 0 24px 0', 
              color: 'var(--text-secondary)',
              fontSize: '18px',
              lineHeight: '1.6',
              fontWeight: '500'
            }}>
              Follow some amazing people or start sharing your thoughts to see content here.
            </p>
            <div className="responsive-flex" style={{ 
              display: 'flex', 
              gap: '16px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button className="btn btn-primary hover-lift hover-glow" style={{ padding: '14px 24px', fontSize: '16px', flex: '1', minWidth: '150px' }}>
                Explore People 👥
              </button>
              <button className="btn btn-secondary hover-lift" style={{ padding: '14px 24px', fontSize: '16px', flex: '1', minWidth: '150px' }}>
                Start Tweeting ✍️
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

