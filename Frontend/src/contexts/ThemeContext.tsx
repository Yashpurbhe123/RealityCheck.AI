import { createContext, useContext, useEffect, useState } from 'react'
import { getState, subscribe, toggleTheme } from '../store-mongodb'

type ThemeContextType = {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(getState())
  
  useEffect(() => {
    return subscribe(() => setState(getState()))
  }, [])

  useEffect(() => {
    console.log('ThemeContext - Setting theme to:', state.theme)
    document.documentElement.setAttribute('data-theme', state.theme)
    document.documentElement.className = state.theme
  }, [state.theme])

  return (
    <ThemeContext.Provider value={{ theme: state.theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
