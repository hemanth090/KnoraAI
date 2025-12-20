import { Link } from 'react-router-dom'
import { useDarkMode } from '../context/DarkModeContext'

export default function Landing() {
    const { darkMode, toggleDarkMode } = useDarkMode()

    // Dark mode is managed by DarkModeContext

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-white dark:bg-zinc-950 transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 transition-colors border-b border-transparent">
                <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3">
                        <div className="size-8 text-zinc-900 dark:text-white">
                            <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fill="currentColor" fillRule="evenodd"></path>
                                <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fill="currentColor" fillRule="evenodd"></path>
                            </svg>
                        </div>
                        <span className="text-zinc-900 dark:text-white text-lg font-bold tracking-tight">Knora AI</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleDarkMode}
                            className="flex items-center justify-center rounded-lg h-9 w-9 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            <span className="material-symbols-outlined icon-xl">
                                {darkMode ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>
                        <Link
                            to="/dashboard"
                            className="flex items-center justify-center rounded-lg h-9 px-4 text-zinc-600 dark:text-zinc-300 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-20 w-full max-w-7xl mx-auto">
                <div className="w-full max-w-4xl flex flex-col items-center gap-12 text-center">
                    {/* Hero */}
                    <div className="flex flex-col gap-6 animate-fade-in-up">
                        <h1 className="text-zinc-900 dark:text-white text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tighter">
                            Ask questions.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
                                Get cited answers.
                            </span>
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-lg sm:text-xl font-normal leading-relaxed max-w-2xl mx-auto">
                            Turn your documents into an intelligent knowledge base. Instant answers, grounded in your own data.
                        </p>
                    </div>

                    {/* CTA Button */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                        <Link
                            to="/dashboard"
                            className="group flex min-w-[160px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-base font-semibold transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                            <span className="mr-2">Get Started</span>
                            <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </Link>
                    </div>

                    {/* Search Preview */}
                    <div className="w-full max-w-2xl mt-12 relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-800 rounded-2xl blur-2xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                        <div className="relative flex w-full items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden h-16 px-4 transition-colors">
                            <div className="text-zinc-800 dark:text-zinc-200 mr-3 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[28px]">smart_toy</span>
                            </div>
                            <div className="flex-1 text-left">
                                <span className="text-zinc-400 dark:text-zinc-500 text-lg font-normal animate-pulse">
                                    What are the key findings in the Q3 report?
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
                                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                                </div>
                                <div className="h-8 w-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-black shadow-md cursor-pointer hover:opacity-90 transition-opacity">
                                    <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-16 mt-16 w-full max-w-3xl pt-10 border-t border-zinc-100 dark:border-zinc-800/50">
                        <div className="flex flex-col items-center gap-3 group">
                            <div className="p-3 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white mb-1 group-hover:scale-110 transition-transform duration-300">
                                <span className="material-symbols-outlined text-[24px]">verified_user</span>
                            </div>
                            <h3 className="text-zinc-900 dark:text-white text-sm font-bold">Trusted by research teams</h3>
                        </div>
                        <div className="flex flex-col items-center gap-3 group">
                            <div className="p-3 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white mb-1 group-hover:scale-110 transition-transform duration-300">
                                <span className="material-symbols-outlined text-[24px]">lock</span>
                            </div>
                            <h3 className="text-zinc-900 dark:text-white text-sm font-bold">Secure & Private</h3>
                        </div>
                        <div className="flex flex-col items-center gap-3 group">
                            <div className="p-3 rounded-full bg-zinc-50 dark:bg-zinc-800 text-emerald-600 mb-1 group-hover:scale-110 transition-transform duration-300">
                                <span className="material-symbols-outlined text-[24px]">format_quote</span>
                            </div>
                            <h3 className="text-zinc-900 dark:text-white text-sm font-bold">Source Citations included</h3>
                        </div>
                    </div>
                </div>
            </main>

            {/* Background gradient */}
            <div className="fixed bottom-0 left-0 w-full h-96 bg-gradient-to-t from-zinc-100/50 to-transparent dark:from-zinc-900/50 dark:to-transparent -z-10 pointer-events-none"></div>
        </div>
    )
}
