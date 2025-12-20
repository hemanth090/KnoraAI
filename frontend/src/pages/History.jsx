import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listSessions, deleteSession, formatRelativeTime } from '../api'

export default function History() {
    const navigate = useNavigate()
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedSession, setExpandedSession] = useState(null)

    useEffect(() => {
        async function fetchSessions() {
            try {
                const data = await listSessions()
                setSessions(data.sessions)
            } catch (err) {
                console.error('Failed to fetch sessions:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchSessions()
    }, [])

    const [deleteId, setDeleteId] = useState(null)

    const handleDelete = async (sessionId) => {
        try {
            await deleteSession(sessionId)
            setSessions((prev) => prev.filter((s) => s.id !== sessionId))
            setDeleteId(null)
        } catch (err) {
            console.error('Delete failed:', err)
        }
    }

    const handleContinue = (session) => {
        navigate(`/chat/${session.document_id}/${session.id}`)
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-6 py-10 flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-zinc-900 dark:text-white text-2xl font-semibold tracking-tight">Chat History</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Your past conversations</p>
                </div>
                <div className="text-zinc-500 dark:text-zinc-400 text-sm">
                    {sessions.length} conversation{sessions.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Sessions List */}
            {loading ? (
                <div className="flex items-center justify-center p-12 text-zinc-500 dark:text-zinc-400">
                    <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                    Loading...
                </div>
            ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                    <span className="material-symbols-outlined text-[48px] text-zinc-300 dark:text-zinc-600">forum</span>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-sm">No conversations yet</p>
                    <Link
                        to="/chat"
                        className="mt-4 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                    >
                        Start a chat
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 overflow-hidden"
                        >
                            {/* Session Header */}
                            <div className="flex items-center gap-4 p-4">
                                <div className="flex items-center justify-center size-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chat</span>
                                </div>

                                <div className="flex flex-col flex-1 min-w-0">
                                    <h3 className="text-zinc-900 dark:text-white text-sm font-medium truncate">
                                        {session.title || 'Untitled Conversation'}
                                    </h3>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
                                        {session.document_name} • {session.messages?.length || 0} messages • {formatRelativeTime(session.updated_at)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                                        className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                            {expandedSession === session.id ? 'expand_less' : 'expand_more'}
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => handleContinue(session)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chat</span>
                                        Continue
                                    </button>

                                    {deleteId === session.id ? (
                                        <div className="flex items-center gap-1 animate-fadeIn">
                                            <button
                                                onClick={() => handleDelete(session.id)}
                                                className="px-2 py-1.5 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(null)}
                                                className="px-2 py-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteId(session.id)}
                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            aria-label="Delete session"
                                        >
                                            <span className="material-symbols-outlined icon-lg">delete</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Messages Preview */}
                            {expandedSession === session.id && session.messages && session.messages.length > 0 && (
                                <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                                    <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
                                        {session.messages.slice(-6).map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${msg.role === 'user'
                                                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                                        : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700'
                                                        }`}
                                                >
                                                    <p className="line-clamp-3">{msg.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {session.messages.length > 6 && (
                                        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-3">
                                            Showing last 6 of {session.messages.length} messages
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
