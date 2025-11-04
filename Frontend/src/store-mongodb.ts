import apiService from './services/api'

export type User = {
  _id: string
  handle: string
  name: string
  avatarUrl?: string
  bio?: string
  followers: string[]
  following: string[]
  followerCount: number
  followingCount: number
  createdAt: string
}

export type Tweet = {
  _id: string
  author: User
  content: string
  imageUrl?: string
  parentTweet?: string
  likes: string[]
  retweets: Array<{ user: string; retweetedAt: string }>
  replies: string[]
  likeCount: number
  retweetCount: number
  replyCount: number
  createdAt: string
  verification?: {
    verdict: string
    confidence: number
    reason: string
    awareness_factor?: string
    verifiedAt: string
    verifiedBy: string
  }
}

export type Notification = {
  _id: string
  user: string
  fromUser: User
  type: 'like' | 'retweet' | 'follow' | 'reply'
  tweet?: string
  message: string
  read: boolean
  createdAt: string
}

export type AppState = {
  users: Record<string, User>
  currentUserId: string | null
  tweets: Tweet[]
  isAuthenticated: boolean
  theme: 'light' | 'dark'
  notifications: Notification[]
  searchQuery: string
  loading: boolean
  error: string | null
  userFeeds?: Record<string, string[]>
  userLikes?: Record<string, string[]>
  userRetweets?: Record<string, string[]>
  userFollowing?: Record<string, string[]>
  userFollowers?: Record<string, string[]>
}

let state: AppState = {
  users: {},
  currentUserId: null,
  tweets: [],
  isAuthenticated: false,
  theme: 'light',
  notifications: [],
  searchQuery: '',
  loading: false,
  error: null
}

type Listener = () => void
const listeners: Set<Listener> = new Set()

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify(): void {
  for (const listener of listeners) listener()
}

function setState(newState: Partial<AppState>): void {
  state = { ...state, ...newState }
  notify()
}

export function getState(): AppState {
  return state
}

// Initialize app data
export async function initializeApp(): Promise<void> {
  setState({ loading: true, error: null })
  
  try {
    // Check if we have a current user in localStorage
    const savedUserId = localStorage.getItem('currentUserId')
    if (savedUserId) {
      try {
        const user = await apiService.getUser(savedUserId)
        setState({
          currentUserId: user._id,
          isAuthenticated: true,
          users: { [user._id]: user }
        })
      } catch (userError) {
        // User doesn't exist in database, clear localStorage
        console.log('User not found in database, clearing localStorage')
        localStorage.removeItem('currentUserId')
        setState({
          currentUserId: null,
          isAuthenticated: false,
          users: {}
        })
      }
    }

    // Load initial data
    await Promise.all([
      loadUsers(),
      loadTweets(),
      loadNotifications()
    ])
  } catch (error) {
    console.error('Failed to initialize app:', error)
    setState({ error: 'Failed to load data' })
  } finally {
    setState({ loading: false })
  }
}

async function loadUsers(): Promise<void> {
  try {
    const users = await apiService.getUsers()
    const usersMap = users.reduce((acc, user) => {
      acc[user._id] = user
      return acc
    }, {} as Record<string, User>)
    setState({ users: usersMap })
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

async function loadTweets(): Promise<void> {
  try {
    // Load all tweets for the global feed
    const tweets = await apiService.getTweets()
    setState({ tweets: Array.isArray(tweets) ? tweets : [] })
  } catch (error) {
    console.error('Failed to load tweets:', error)
    setState({ tweets: [] })
  }
}

async function loadUserTweets(userId: string): Promise<void> {
  try {
    // Load tweets for a specific user
    const tweets = await apiService.getTweets(userId)
    setState({ tweets: Array.isArray(tweets) ? tweets : [] })
  } catch (error) {
    console.error('Failed to load user tweets:', error)
    setState({ tweets: [] })
  }
}

async function loadNotifications(): Promise<void> {
  if (!state.currentUserId) return
  
  try {
    const notifications = await apiService.getNotifications(state.currentUserId)
    setState({ notifications: notifications || [] })
  } catch (error) {
    console.error('Failed to load notifications:', error)
    setState({ notifications: [] }) // Set empty array on error
  }
}

// User Management
export async function login(handle: string, name: string): Promise<void> {
  setState({ loading: true, error: null })
  
  try {
    let user: User
    
    // Try to find existing user
    const users = await apiService.getUsers()
    const existingUser = users.find(u => u.handle === handle.toLowerCase())
    
    if (existingUser) {
      user = existingUser
    } else {
      // Create new user
      user = await apiService.createUser({ handle, name })
    }
    
    // Update users map
    setState({
      users: { ...state.users, [user._id]: user },
      currentUserId: user._id,
      isAuthenticated: true
    })
    
    // Save to localStorage
    localStorage.setItem('currentUserId', user._id)
    
    // Load user-specific data
    await Promise.all([
      loadTweets(),
      loadNotifications()
    ])
  } catch (error) {
    console.error('Login failed:', error)
    setState({ error: 'Login failed' })
  } finally {
    setState({ loading: false })
  }
}

// Login with user object directly (from API response)
export async function loginWithUser(user: User): Promise<void> {
  setState({ loading: true, error: null })
  
  try {
    // Update users map
    setState({
      users: { ...state.users, [user._id]: user },
      currentUserId: user._id,
      isAuthenticated: true
    })
    
    // Save to localStorage
    localStorage.setItem('currentUserId', user._id)
    
    // Set loading to false immediately so authentication completes
    setState({ loading: false })
    
    // Load user-specific data in the background (non-blocking)
    Promise.all([
      loadTweets(),
      loadNotifications()
    ]).catch(error => {
      console.error('Failed to load user data after login:', error)
    })
  } catch (error) {
    console.error('Login failed:', error)
    setState({ error: 'Login failed', loading: false })
  }
}

export function logout(): void {
  setState({
    currentUserId: null,
    isAuthenticated: false,
    notifications: []
  })
  localStorage.removeItem('currentUserId')
}

export async function switchAccount(userId: string): Promise<void> {
  const user = state.users[userId]
  if (!user) return
  
  setState({
    currentUserId: userId,
    isAuthenticated: true
  })
  
  localStorage.setItem('currentUserId', userId)
  
  // Load user-specific data
  await Promise.all([
    loadTweets(),
    loadNotifications()
  ])
}

// Tweet Management
export async function addTweet(content: string, imageUrl?: string): Promise<void> {
  if (!state.currentUserId) return
  
  setState({ loading: true, error: null })
  
  try {
    console.log('Creating tweet with:', {
      author: state.currentUserId,
      content,
      imageUrl
    });
    
    const tweet = await apiService.createTweet({
      author: state.currentUserId,
      content,
      imageUrl
    });
    
    console.log('Tweet created successfully:', tweet);
    
    setState({
      tweets: [tweet, ...state.tweets]
    })
  } catch (error) {
    console.error('Failed to create tweet:', error)
    setState({ error: 'Failed to create tweet' })
  } finally {
    setState({ loading: false })
  }
}

export async function toggleLike(tweetId: string): Promise<void> {
  if (!state.currentUserId) return
  
  try {
    const currentUser = state.users[state.currentUserId]
    const result = await apiService.likeTweet(tweetId, state.currentUserId, currentUser.name)
    
    setState({
      tweets: state.tweets.map(tweet =>
        tweet._id === tweetId
          ? { ...tweet, likeCount: result.likeCount, likes: result.isLiked ? [...tweet.likes, state.currentUserId!] : tweet.likes.filter(id => id !== state.currentUserId) }
          : tweet
      )
    })
    
    // Reload notifications
    await loadNotifications()
  } catch (error) {
    console.error('Failed to toggle like:', error)
  }
}

export async function toggleRetweet(tweetId: string): Promise<void> {
  if (!state.currentUserId) return
  
  try {
    const currentUser = state.users[state.currentUserId]
    const result = await apiService.retweet(tweetId, state.currentUserId, currentUser.name)
    
    setState({
      tweets: state.tweets.map(tweet =>
        tweet._id === tweetId
          ? { 
              ...tweet, 
              retweetCount: result.retweetCount,
              retweets: result.isRetweeted 
                ? [...tweet.retweets, { user: state.currentUserId!, retweetedAt: new Date().toISOString() }]
                : tweet.retweets.filter(r => r.user !== state.currentUserId)
            }
          : tweet
      )
    })
    
    // Reload notifications
    await loadNotifications()
  } catch (error) {
    console.error('Failed to toggle retweet:', error)
  }
}

export async function addReply(parentId: string, content: string): Promise<void> {
  if (!state.currentUserId) return
  
  setState({ loading: true, error: null })
  
  try {
    const currentUser = state.users[state.currentUserId]
    const reply = await apiService.replyToTweet(parentId, {
      author: state.currentUserId,
      content,
      userName: currentUser.name
    })
    
    setState({
      tweets: [reply, ...state.tweets]
    })
    
    // Reload notifications
    await loadNotifications()
  } catch (error) {
    console.error('Failed to create reply:', error)
    setState({ error: 'Failed to create reply' })
  } finally {
    setState({ loading: false })
  }
}

export async function deleteTweet(tweetId: string): Promise<void> {
  if (!state.currentUserId) return
  
  setState({ loading: true, error: null })
  
  try {
    await apiService.deleteTweet(tweetId, state.currentUserId)
    
    setState({
      tweets: state.tweets.filter(tweet => tweet._id !== tweetId)
    })
  } catch (error) {
    console.error('Failed to delete tweet:', error)
    setState({ error: 'Failed to delete tweet' })
  } finally {
    setState({ loading: false })
  }
}

// Following System
export async function toggleFollow(userId: string): Promise<void> {
  if (!state.currentUserId || state.currentUserId === userId) return
  
  try {
    const result = await apiService.followUser(userId, state.currentUserId)
    
    // Update both users in state
    const currentUser = state.users[state.currentUserId]
    const targetUser = state.users[userId]
    
    if (currentUser && targetUser) {
      setState({
        users: {
          ...state.users,
          [state.currentUserId]: {
            ...currentUser,
            following: result.isFollowing 
              ? [...currentUser.following, userId]
              : currentUser.following.filter(id => id !== userId)
          },
          [userId]: {
            ...targetUser,
            followers: result.isFollowing
              ? [...targetUser.followers, state.currentUserId]
              : targetUser.followers.filter(id => id !== state.currentUserId)
          }
        }
      })
    }
    
    // Reload notifications
    await loadNotifications()
  } catch (error) {
    console.error('Failed to toggle follow:', error)
  }
}

// Feed Management
export function getUserFeed(userId: string): Tweet[] {
  return state.tweets.filter(tweet => tweet.author._id === userId)
}

export function getFollowingFeed(userId: string): Tweet[] {
  const user = state.users[userId]
  if (!user) return []
  
  const followingIds = user.following
  return state.tweets.filter(tweet => 
    followingIds.includes(tweet.author._id) || tweet.author._id === userId
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getLikedTweets(userId: string): Tweet[] {
  return state.tweets.filter(tweet => tweet.likes.includes(userId))
}

export function getRetweetedTweets(userId: string): Tweet[] {
  return state.tweets.filter(tweet => 
    tweet.retweets.some(r => r.user === userId)
  )
}

// Theme Management
export function toggleTheme(): void {
  const newTheme = state.theme === 'light' ? 'dark' : 'light'
  console.log('toggleTheme - Current theme:', state.theme, 'New theme:', newTheme)
  setState({ theme: newTheme })
  localStorage.setItem('theme', newTheme)
  console.log('toggleTheme - Theme saved to localStorage:', newTheme)
}

// Search
export function setSearchQuery(query: string): void {
  setState({ searchQuery: query })
}

export async function searchTweets(query: string): Promise<Tweet[]> {
  try {
    return await apiService.searchTweets(query)
  } catch (error) {
    console.error('Search failed:', error)
    return []
  }
}

export async function searchUsers(query: string): Promise<User[]> {
  try {
    return await apiService.searchUsers(query)
  } catch (error) {
    console.error('User search failed:', error)
    return []
  }
}

// Notifications
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await apiService.markNotificationAsRead(notificationId)
    setState({
      notifications: state.notifications.map(n =>
        n._id === notificationId ? { ...n, read: true } : n
      )
    })
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  if (!state.currentUserId) return
  
  try {
    await apiService.markAllNotificationsAsRead(state.currentUserId)
    setState({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    })
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
  }
}

// Clear all data (for testing)
export function clearAllData(): void {
  setState({
    users: {},
    tweets: [],
    notifications: [],
    currentUserId: null,
    isAuthenticated: false,
    error: null,
    loading: false,
    theme: 'light',
    searchQuery: '',
    userFeeds: {},
    userLikes: {},
    userRetweets: {},
    userFollowing: {},
    userFollowers: {}
  })
  localStorage.clear()
  console.log('All data cleared from localStorage and state')
}

export { loadUserTweets }

// Initialize theme from localStorage
const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
  console.log('Initializing theme from localStorage:', savedTheme)
  setState({ theme: savedTheme })
  document.documentElement.setAttribute('data-theme', savedTheme)
} else {
  console.log('No saved theme found, using default light theme')
  setState({ theme: 'light' })
  document.documentElement.setAttribute('data-theme', 'light')
}
