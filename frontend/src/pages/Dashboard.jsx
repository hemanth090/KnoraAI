import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { listDocuments, listSessions, formatRelativeTime } from '../api'

export default function Dashboard() {
    const navigate = useNavigate()
    const [documents, setDocuments] = useState([])
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const [docsRes, sessionsRes] = await Promise.all([
                    listDocuments({ limit: 5 }),
                    listSessions({ limit: 5 }),
                ])
                setDocuments(docsRes.documents)
                setSessions(sessionsRes.sessions)
            } catch (err) {
                console.error('Failed to fetch data:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 17) return 'Good afternoon'
        return 'Good evening'
    }

    return (
        <div className="w-full max-w-3xl mx-auto px-6 py-10 flex flex-col gap-10">
            {/* Header */}
            <div className="flex flex-col gap-2 pt-12 pb-2 text-center items-center">
                <div className="size-12 mb-4 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-white shadow-sm">
                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>auto_awesome</span>
                </div>
                <h1 className="text-zinc-900 dark:text-white text-3xl font-medium tracking-tight">{getGreeting()}</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg font-light tracking-wide">Ready to assist with your research.</p>
            </div>

            {/* Search Bar */}
            <div className="w-full relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 rounded-2xl opacity-40 blur transition duration-500 group-hover:opacity-75"></div>
                <label className="relative flex flex-col w-full">
                    <div className="flex w-full items-center rounded-xl h-14 bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-zinc-900/10 dark:focus-within:ring-white/20 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 transition-all overflow-hidden">
                        <div className="flex items-center justify-center pl-5 pr-3 text-zinc-400 dark:text-zinc-500">
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>search</span>
                        </div>
                        <input
                            className="flex w-full min-w-0 flex-1 resize-none bg-transparent border-none focus:ring-0 focus:outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 px-1 text-[15px] font-normal h-full"
                            placeholder="Ask Knora or search documents..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                    navigate('/chat', { state: { initialQuestion: e.target.value } })
                                }
                            }}
                        />
                        <div className="pr-2 flex items-center gap-1">
                            <span className="hidden md:flex h-6 items-center gap-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 font-mono text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                                <span className="text-xs">⌘</span>K
                            </span>
                        </div>
                    </div>
                </label>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-4">
                <h2 className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-widest pl-1">Start New</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Link
                        to="/upload"
                        className="flex flex-col items-center text-center gap-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 p-6 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm transition-all duration-300 group"
                    >
                        <div className="size-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center group-hover:scale-110 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 dark:group-hover:bg-white dark:group-hover:text-zinc-900 transition-all duration-300">
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload_file</span>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-zinc-900 dark:text-white text-sm font-medium">Upload PDF</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Add to knowledge base</p>
                        </div>
                    </Link>

                    <Link
                        to="/chat"
                        className="flex flex-col items-center text-center gap-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 p-6 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm transition-all duration-300 group"
                    >
                        <div className="size-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center group-hover:scale-110 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 dark:group-hover:bg-white dark:group-hover:text-zinc-900 transition-all duration-300">
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chat_bubble</span>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-zinc-900 dark:text-white text-sm font-medium">New Chat</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Ask questions</p>
                        </div>
                    </Link>

                    <Link
                        to="/history"
                        className="flex flex-col items-center text-center gap-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 p-6 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm transition-all duration-300 group"
                    >
                        <div className="size-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center group-hover:scale-110 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 dark:group-hover:bg-white dark:group-hover:text-zinc-900 transition-all duration-300">
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>history</span>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-zinc-900 dark:text-white text-sm font-medium">View History</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Past conversations</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pl-1">
                    <h2 className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-widest">Jump back in</h2>
                    <Link to="/history" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white text-xs font-medium transition-colors">
                        View all
                    </Link>
                </div>

                <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900/30">
                    {loading ? (
                        <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                            <p className="mt-2 text-sm">Loading...</p>
                        </div>
                    ) : sessions.length === 0 && documents.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                            <span className="material-symbols-outlined text-[32px] mb-2">inbox</span>
                            <p className="text-sm">No recent activity</p>
                            <p className="text-xs mt-1">Upload a document to get started</p>
                        </div>
                    ) : (
                        <>
                            {sessions.slice(0, 3).map((session) => (
                                <Link
                                    key={`session-${session.id}`}
                                    to={`/chat/${session.document_id}/${session.id}`}
                                    className="group flex items-start gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center justify-center size-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex-shrink-0 mt-0.5 border border-zinc-200 dark:border-zinc-700">
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat</span>
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0 gap-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-zinc-900 dark:text-white text-sm font-medium truncate group-hover:underline decoration-zinc-400 underline-offset-2">
                                                {session.title || 'Untitled Chat'}
                                            </h3>
                                            <span className="text-zinc-400 dark:text-zinc-600 text-[11px] font-mono">
                                                {formatRelativeTime(session.updated_at)}
                                            </span>
                                        </div>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed truncate">
                                            {session.document_name} • {session.messages?.length || 0} messages
                                        </p>
                                    </div>
                                </Link>
                            ))}

                            {documents.slice(0, 2).map((doc) => (
                                <Link
                                    key={`doc-${doc.id}`}
                                    to={doc.status === 'ready' ? `/chat/${doc.id}` : '/upload'}
                                    className="group flex items-start gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center justify-center size-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex-shrink-0 mt-0.5 border border-zinc-200 dark:border-zinc-700">
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>description</span>
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0 gap-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-zinc-900 dark:text-white text-sm font-medium truncate group-hover:underline decoration-zinc-400 underline-offset-2">
                                                {doc.original_name}
                                            </h3>
                                            <span className="text-zinc-400 dark:text-zinc-600 text-[11px] font-mono">
                                                {formatRelativeTime(doc.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed truncate">
                                            {doc.page_count} pages • Status: {doc.status}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
