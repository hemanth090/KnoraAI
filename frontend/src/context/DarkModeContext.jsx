import { createContext, useContext, useState, useEffect } from 'react'

const DarkModeContext = createContext()

export function DarkModeProvider({ children }) {
    const [darkMode, setDarkMode] = useState(() => {
        // Check localStorage or system preference
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('darkMode')
            if (saved !== null) return JSON.parse(saved)
            return window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        return false
    })

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('darkMode', JSON.stringify(darkMode))
    }, [darkMode])

    const toggleDarkMode = () => setDarkMode(prev => !prev)

    return (
        <DarkModeContext.Provider value={{ darkMode, setDarkMode, toggleDarkMode }}>
            {children}
        </DarkModeContext.Provider>
    )
}

export function useDarkMode() {
    const context = useContext(DarkModeContext)
    if (!context) {
        throw new Error('useDarkMode must be used within DarkModeProvider')
    }
    return context
}
