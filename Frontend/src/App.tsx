import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './App.css'
import HomePage from './pages/Home'
import ProfilePage from './pages/Profile'
import UserProfilePage from './pages/UserProfile'
import SettingsPage from './pages/Settings'
import SearchPage from './pages/Search'
import Login from './components/Login'
import { ThemeProvider } from './contexts/ThemeContext'
import { getState, subscribe } from './store-mongodb'

export default function App() {
  const [state, setState] = useState(getState())
  
  useEffect(() => {
    return subscribe(() => setState(getState()))
  }, [])

  if (!state.isAuthenticated) {
    return (
      <ThemeProvider>
        <Login />
      </ThemeProvider>
    )
  }

          return (
          <ThemeProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/user/:userId" element={<UserProfilePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </ThemeProvider>
        )
}
