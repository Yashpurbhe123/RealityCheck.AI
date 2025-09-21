export type User = {
  id: string
  handle: string
  name: string
  avatarUrl?: string
  bio?: string
  followers: string[]
  following: string[]
  createdAt: number
}

export type Tweet = {
  id: string
  authorId: string
  content: string
  createdAt: number
  likes: number
  likedByMe: boolean
  retweets: number
  retweetedByMe: boolean
  replies: number
  parentId?: string // for replies
}

export type AppState = {
  users: Record<string, User>
  currentUserId: string | null
  tweets: Tweet[]
  isAuthenticated: boolean
  theme: 'light' | 'dark'
  notifications: Notification[]
  searchQuery: string
  userFeeds: Record<string, string[]> // userId -> tweetIds
  userLikes: Record<string, string[]> // userId -> liked tweetIds
  userRetweets: Record<string, string[]> // userId -> retweeted tweetIds
  userFollowing: Record<string, string[]> // userId -> following userIds
  userFollowers: Record<string, string[]> // userId -> follower userIds
}

export type Notification = {
  id: string
  type: 'like' | 'retweet' | 'follow' | 'reply'
  fromUserId: string
  tweetId?: string
  message: string
  createdAt: number
  read: boolean
}

const PERSIST_KEY = 'twittlite_state_v2'

// Default seed users
const seedUsers: User[] = [
  {
    id: 'u1',
    handle: 'alex_dev',
    name: 'Alex Developer',
    bio: 'Full-stack developer passionate about React and TypeScript 🚀',
    followers: ['u2', 'u3'],
    following: ['u2', 'u3'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  },
  {
    id: 'u2',
    handle: 'sarah_coder',
    name: 'Sarah Coder',
    bio: 'UI/UX Designer & Frontend Developer ✨',
    followers: ['u1', 'u3'],
    following: ['u1'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
  },
  {
    id: 'u3',
    handle: 'mike_programmer',
    name: 'Mike Programmer',
    bio: 'Backend developer and DevOps enthusiast 🔧',
    followers: ['u1', 'u2'],
    following: ['u1', 'u2'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
  }
]

const initialTweets: Tweet[] = [
  {
    id: 't1',
    authorId: 'u1',
    content: 'Just shipped a new feature! 🚀 The power of React and TypeScript never ceases to amaze me.',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    likes: 12,
    likedByMe: false,
    retweets: 3,
    retweetedByMe: false,
    replies: 2,
  },
  {
    id: 't2',
    authorId: 'u2',
    content: 'Design systems are the backbone of scalable UI development. Here\'s what I learned building one from scratch 🎨',
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
    likes: 8,
    likedByMe: false,
    retweets: 1,
    retweetedByMe: false,
    replies: 1,
  },
  {
    id: 't3',
    authorId: 'u3',
    content: 'Docker containers are game-changers for development workflows. Setting up microservices has never been easier! 🐳',
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    likes: 15,
    likedByMe: false,
    retweets: 4,
    retweetedByMe: false,
    replies: 3,
  },
  {
    id: 't4',
    authorId: 'u1',
    content: 'Working on a Twitter clone with React! The state management and real-time updates are fascinating to implement.',
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
    likes: 6,
    likedByMe: false,
    retweets: 2,
    retweetedByMe: false,
    replies: 1,
  }
]

function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(PERSIST_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppState
    return parsed
  } catch {
    return null
  }
}

function saveState(s: AppState): void {
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(s))
  } catch (error) {
    console.error('Failed to save state:', error)
  }
}

function migrateState(oldState: any): AppState {
  // Migrate from old state format if needed
  const users: Record<string, User> = {}
  const userFeeds: Record<string, string[]> = {}
  const userLikes: Record<string, string[]> = {}
  const userRetweets: Record<string, string[]> = {}
  const userFollowing: Record<string, string[]> = {}
  const userFollowers: Record<string, string[]> = {}

  // Initialize with seed users
  seedUsers.forEach(user => {
    users[user.id] = user
    userFeeds[user.id] = []
    userLikes[user.id] = []
    userRetweets[user.id] = []
    userFollowing[user.id] = user.following
    userFollowers[user.id] = user.followers
  })

  // Migrate existing users if any
  if (oldState?.users) {
    Object.values(oldState.users).forEach((user: any) => {
      if (!users[user.id]) {
        users[user.id] = user
        userFeeds[user.id] = []
        userLikes[user.id] = []
        userRetweets[user.id] = []
        userFollowing[user.id] = user.following || []
        userFollowers[user.id] = user.followers || []
      }
    })
  }

  // Migrate tweets and build feeds
  const tweets = oldState?.tweets || initialTweets
  tweets.forEach((tweet: Tweet) => {
    if (userFeeds[tweet.authorId]) {
      userFeeds[tweet.authorId].push(tweet.id)
    }
    
    // Migrate likes and retweets
    if (tweet.likedByMe && userLikes[tweet.authorId]) {
      userLikes[tweet.authorId].push(tweet.id)
    }
    if (tweet.retweetedByMe && userRetweets[tweet.authorId]) {
      userRetweets[tweet.authorId].push(tweet.id)
    }
  })

  return {
    users,
    currentUserId: oldState?.currentUserId || null,
    tweets,
    isAuthenticated: oldState?.isAuthenticated || false,
    theme: oldState?.theme || 'light',
    notifications: oldState?.notifications || [],
    searchQuery: oldState?.searchQuery || '',
    userFeeds,
    userLikes,
    userRetweets,
    userFollowing,
    userFollowers,
  }
}

let state: AppState = (() => {
  const loaded = loadState()
  if (loaded) {
    return migrateState(loaded)
  }
  
  // Initialize with seed data
  const users: Record<string, User> = {}
  const userFeeds: Record<string, string[]> = {}
  const userLikes: Record<string, string[]> = {}
  const userRetweets: Record<string, string[]> = {}
  const userFollowing: Record<string, string[]> = {}
  const userFollowers: Record<string, string[]> = {}

  seedUsers.forEach(user => {
    users[user.id] = user
    userFeeds[user.id] = []
    userLikes[user.id] = []
    userRetweets[user.id] = []
    userFollowing[user.id] = user.following
    userFollowers[user.id] = user.followers
  })

  // Initialize feeds with tweets
  initialTweets.forEach(tweet => {
    if (userFeeds[tweet.authorId]) {
      userFeeds[tweet.authorId].push(tweet.id)
    }
  })

  return {
    users,
    currentUserId: null,
    tweets: initialTweets,
    isAuthenticated: false,
    theme: 'light',
    notifications: [],
    searchQuery: '',
    userFeeds,
    userLikes,
    userRetweets,
    userFollowing,
    userFollowers,
  }
})()

type Listener = () => void
const listeners: Set<Listener> = new Set()

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify(): void {
  for (const listener of listeners) listener()
}

export function getState(): AppState {
  return state
}

// Account Management
export function login(handle: string, name: string): void {
  const existingUser = Object.values(state.users).find(u => u.handle === handle)
  
  if (existingUser) {
    state = { ...state, currentUserId: existingUser.id, isAuthenticated: true }
  } else {
    const newUser: User = {
      id: `u${Math.random().toString(36).slice(2, 9)}`,
      handle,
      name,
      bio: '',
      followers: [],
      following: [],
      createdAt: Date.now(),
    }
    
    state = {
      ...state,
      users: { ...state.users, [newUser.id]: newUser },
      currentUserId: newUser.id,
      isAuthenticated: true,
      userFeeds: { ...state.userFeeds, [newUser.id]: [] },
      userLikes: { ...state.userLikes, [newUser.id]: [] },
      userRetweets: { ...state.userRetweets, [newUser.id]: [] },
      userFollowing: { ...state.userFollowing, [newUser.id]: [] },
      userFollowers: { ...state.userFollowers, [newUser.id]: [] },
    }
  }
  saveState(state)
  notify()
}

export function logout(): void {
  state = { ...state, currentUserId: null, isAuthenticated: false }
  saveState(state)
  notify()
}

export function switchAccount(userId: string): void {
  if (state.users[userId]) {
    state = { ...state, currentUserId: userId, isAuthenticated: true }
    saveState(state)
    notify()
  }
}

export function getAvailableAccounts(): User[] {
  return Object.values(state.users)
}

// Tweet Management
export function addTweet(content: string): void {
  if (!state.currentUserId) return
  
  const newTweet: Tweet = {
    id: `t${Math.random().toString(36).slice(2, 9)}`,
    authorId: state.currentUserId,
    content,
    createdAt: Date.now(),
    likes: 0,
    likedByMe: false,
    retweets: 0,
    retweetedByMe: false,
    replies: 0
  }
  
  state = { 
    ...state, 
    tweets: [newTweet, ...state.tweets],
    userFeeds: {
      ...state.userFeeds,
      [state.currentUserId]: [newTweet.id, ...(state.userFeeds[state.currentUserId] || [])]
    }
  }
  saveState(state)
  notify()
}

export function toggleLike(tweetId: string): void {
  if (!state.currentUserId) return
  
  const tweet = state.tweets.find(t => t.id === tweetId)
  if (!tweet) return
  
  const wasLiked = tweet.likedByMe
  const currentUserLikes = state.userLikes[state.currentUserId] || []
  
  state = {
    ...state,
    tweets: state.tweets.map((t) =>
      t.id === tweetId
        ? {
            ...t,
            likedByMe: !t.likedByMe,
            likes: t.likedByMe ? t.likes - 1 : t.likes + 1,
          }
        : t,
    ),
    userLikes: {
      ...state.userLikes,
      [state.currentUserId]: wasLiked 
        ? currentUserLikes.filter(id => id !== tweetId)
        : [...currentUserLikes, tweetId]
    }
  }
  
  // Add notification for like
  if (!wasLiked && tweet.authorId !== state.currentUserId && state.currentUserId) {
    addNotification({
      type: 'like',
      fromUserId: state.currentUserId,
      tweetId: tweetId,
      message: `${state.users[state.currentUserId]?.name} liked your tweet`
    })
  }
  
  saveState(state)
  notify()
}

export function toggleRetweet(tweetId: string): void {
  if (!state.currentUserId) return
  
  const tweet = state.tweets.find(t => t.id === tweetId)
  if (!tweet) return
  
  const wasRetweeted = tweet.retweetedByMe
  const currentUserRetweets = state.userRetweets[state.currentUserId] || []
  
  state = {
    ...state,
    tweets: state.tweets.map((t) =>
      t.id === tweetId
        ? {
            ...t,
            retweetedByMe: !t.retweetedByMe,
            retweets: t.retweetedByMe ? t.retweets - 1 : t.retweets + 1,
          }
        : t,
    ),
    userRetweets: {
      ...state.userRetweets,
      [state.currentUserId]: wasRetweeted 
        ? currentUserRetweets.filter(id => id !== tweetId)
        : [...currentUserRetweets, tweetId]
    }
  }
  
  // Add notification for retweet
  if (!wasRetweeted && tweet.authorId !== state.currentUserId && state.currentUserId) {
    addNotification({
      type: 'retweet',
      fromUserId: state.currentUserId,
      tweetId: tweetId,
      message: `${state.users[state.currentUserId]?.name} retweeted your tweet`
    })
  }
  
  saveState(state)
  notify()
}

export function addReply(parentId: string, content: string): void {
  if (!state.currentUserId) return
  
  const parentTweet = state.tweets.find(t => t.id === parentId)
  if (!parentTweet) return
  
  const reply: Tweet = {
    id: `t${Math.random().toString(36).slice(2, 9)}`,
    authorId: state.currentUserId,
    content,
    createdAt: Date.now(),
    likes: 0,
    likedByMe: false,
    retweets: 0,
    retweetedByMe: false,
    replies: 0,
    parentId,
  }
  
  state = {
    ...state,
    tweets: state.tweets.map((t) =>
      t.id === parentId ? { ...t, replies: t.replies + 1 } : t
    ),
    userFeeds: {
      ...state.userFeeds,
      [state.currentUserId]: [reply.id, ...(state.userFeeds[state.currentUserId] || [])]
    }
  }
  state = { ...state, tweets: [reply, ...state.tweets] }
  
  // Add notification for reply
  if (parentTweet.authorId !== state.currentUserId && state.currentUserId) {
    addNotification({
      type: 'reply',
      fromUserId: state.currentUserId,
      tweetId: parentId,
      message: `${state.users[state.currentUserId]?.name} replied to your tweet`
    })
  }
  
  saveState(state)
  notify()
}

// Following System
export function toggleFollow(userId: string): void {
  if (!state.currentUserId || state.currentUserId === userId) return
  
  const currentUser = state.users[state.currentUserId]
  const targetUser = state.users[userId]
  
  if (!currentUser || !targetUser) return
  
  const isFollowing = state.userFollowing[state.currentUserId]?.includes(userId) || false
  
  state = {
    ...state,
    users: {
      ...state.users,
      [state.currentUserId]: {
        ...currentUser,
        following: isFollowing
          ? currentUser.following.filter(id => id !== userId)
          : [...currentUser.following, userId]
      },
      [userId]: {
        ...targetUser,
        followers: isFollowing
          ? targetUser.followers.filter(id => id !== state.currentUserId!)
          : [...targetUser.followers, state.currentUserId!]
      }
    },
    userFollowing: {
      ...state.userFollowing,
      [state.currentUserId]: isFollowing
        ? (state.userFollowing[state.currentUserId] || []).filter(id => id !== userId)
        : [...(state.userFollowing[state.currentUserId] || []), userId]
    },
    userFollowers: {
      ...state.userFollowers,
      [userId]: isFollowing
        ? (state.userFollowers[userId] || []).filter(id => id !== state.currentUserId!)
        : [...(state.userFollowers[userId] || []), state.currentUserId!]
    }
  }
  
  // Add notification for follow
  if (!isFollowing && state.currentUserId) {
    addNotification({
      type: 'follow',
      fromUserId: state.currentUserId,
      message: `${currentUser.name} started following you`
    })
  }
  
  saveState(state)
  notify()
}

// Feed Management
export function getUserFeed(userId: string): Tweet[] {
  const feedTweetIds = state.userFeeds[userId] || []
  return feedTweetIds
    .map(id => state.tweets.find(t => t.id === id))
    .filter(Boolean) as Tweet[]
}

export function getFollowingFeed(userId: string): Tweet[] {
  const following = state.userFollowing[userId] || []
  const followingTweets = following.flatMap(followingId => 
    state.userFeeds[followingId] || []
  )
  
  return followingTweets
    .map(id => state.tweets.find(t => t.id === id))
    .filter((tweet): tweet is Tweet => Boolean(tweet))
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function getLikedTweets(userId: string): Tweet[] {
  const likedIds = state.userLikes[userId] || []
  return likedIds
    .map(id => state.tweets.find(t => t.id === id))
    .filter(Boolean) as Tweet[]
}

export function getRetweetedTweets(userId: string): Tweet[] {
  const retweetedIds = state.userRetweets[userId] || []
  return retweetedIds
    .map(id => state.tweets.find(t => t.id === id))
    .filter(Boolean) as Tweet[]
}

// Theme Management
export function toggleTheme(): void {
  state = { ...state, theme: state.theme === 'light' ? 'dark' : 'light' }
  saveState(state)
  notify()
}

// Search
export function setSearchQuery(query: string): void {
  state = { ...state, searchQuery: query }
  notify()
}

export function searchTweets(query: string): Tweet[] {
  if (!query.trim()) return state.tweets
  const lowercaseQuery = query.toLowerCase()
  return state.tweets.filter(tweet =>
    tweet.content.toLowerCase().includes(lowercaseQuery) ||
    state.users[tweet.authorId]?.name.toLowerCase().includes(lowercaseQuery) ||
    state.users[tweet.authorId]?.handle.toLowerCase().includes(lowercaseQuery)
  )
}

export function searchUsers(query: string): User[] {
  if (!query.trim()) return Object.values(state.users)
  const lowercaseQuery = query.toLowerCase()
  return Object.values(state.users).filter(user =>
    user.name.toLowerCase().includes(lowercaseQuery) ||
    user.handle.toLowerCase().includes(lowercaseQuery) ||
    user.bio?.toLowerCase().includes(lowercaseQuery)
  )
}

// Notifications
export function addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): void {
  const newNotification: Notification = {
    ...notification,
    id: `n${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    read: false,
  }
  state = { ...state, notifications: [newNotification, ...state.notifications] }
  saveState(state)
  notify()
}

export function markNotificationAsRead(notificationId: string): void {
  state = {
    ...state,
    notifications: state.notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    )
  }
  saveState(state)
  notify()
}

export function markAllNotificationsAsRead(): void {
  state = {
    ...state,
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  }
  saveState(state)
  notify()
}

// Data Management
export function clearAllData(): void {
  localStorage.removeItem(PERSIST_KEY)
  // Reset to initial state
  state = {
    users: {},
    currentUserId: null,
    tweets: [],
    isAuthenticated: false,
    theme: 'light',
    notifications: [],
    searchQuery: '',
    userFeeds: {},
    userLikes: {},
    userRetweets: {},
    userFollowing: {},
    userFollowers: {},
  }
  notify()
}

// Initialize with seed data if no existing data
if (Object.keys(state.users).length === 0) {
  seedUsers.forEach(user => {
    state.users[user.id] = user
    state.userFeeds[user.id] = []
    state.userLikes[user.id] = []
    state.userRetweets[user.id] = []
    state.userFollowing[user.id] = user.following
    state.userFollowers[user.id] = user.followers
  })
  
  // Initialize feeds with tweets
  initialTweets.forEach(tweet => {
    if (state.userFeeds[tweet.authorId]) {
      state.userFeeds[tweet.authorId].push(tweet.id)
    }
  })
  
  state.tweets = initialTweets
  saveState(state)
}