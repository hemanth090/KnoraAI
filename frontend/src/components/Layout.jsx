import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { checkHealth } from '../api'
import { useDarkMode } from '../context/DarkModeContext'

const navItems = [
    { path: '/dashboard', icon: 'home', label: 'Home' },
    { path: '/upload', icon: 'library_books', label: 'Library' },
    { path: '/chat', icon: 'chat_bubble', label: 'Chats' },
    { path: '/history', icon: 'history', label: 'History' },
    { path: '/settings', icon: 'settings', label: 'Settings' },
]

export default function Layout() {
    const location = useLocation()
    const [health, setHealth] = useState(null)
    const { darkMode, toggleDarkMode } = useDarkMode()

    useEffect(() => {
        // Check health on mount
        checkHealth()
            .then(setHealth)
            .catch(() => setHealth({ status: 'offline' }))
    }, [])

    // Dark mode is now managed by DarkModeContext

    return (
        <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950">
            {/* Sidebar */}
            <aside className="flex w-72 flex-col justify-between border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 flex-shrink-0">
                <div className="flex flex-col gap-8">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-1">
                        <div className="size-9 text-zinc-900 dark:text-white">
                            <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fill="currentColor" fillRule="evenodd"></path>
                                <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fill="currentColor" fillRule="evenodd"></path>
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-zinc-900 dark:text-white text-sm font-semibold leading-tight tracking-tight">Knora AI</h1>
                            <p className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium uppercase tracking-wide">Workspace</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-0.5">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${isActive || location.pathname.startsWith(item.path)
                                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`
                                }
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
                                <p className="text-sm font-medium">{item.label}</p>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* Bottom section */}
                <div className="flex flex-col gap-5">
                    {/* New Chat Button */}
                    <NavLink
                        to="/chat"
                        className="flex w-full cursor-pointer items-center justify-center rounded-lg h-9 px-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-white dark:text-zinc-900 text-sm font-medium shadow-sm"
                    >
                        <span className="truncate">New Chat</span>
                    </NavLink>

                    {/* Status + Dark Mode Toggle */}
                    <div className="flex flex-col gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                        {/* Health Status */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <div className={`size-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                                    {health?.status === 'healthy' ? 'System Online' : 'System Offline'}
                                </p>
                            </div>

                            {/* Dark Mode Toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
                                title={darkMode ? 'Light mode' : 'Dark mode'}
                                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            >
                                <span className="material-symbols-outlined icon-lg">
                                    {darkMode ? 'light_mode' : 'dark_mode'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-y-auto bg-white dark:bg-zinc-950">
                <Outlet />
            </main>
        </div>
    )
}
