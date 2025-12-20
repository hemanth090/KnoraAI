import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { listDocuments, sendQuery, getSession, parseCitations } from '../api'

export default function Chat() {
    const { documentId, sessionId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const messagesEndRef = useRef(null)

    const [documents, setDocuments] = useState([])
    const [selectedDocId, setSelectedDocId] = useState(documentId ? parseInt(documentId) : null)
    const [selectedDoc, setSelectedDoc] = useState(null)
    const [messages, setMessages] = useState([])
    const [currentSessionId, setCurrentSessionId] = useState(sessionId ? parseInt(sessionId) : null)
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingDocs, setLoadingDocs] = useState(true)
    const [showSources, setShowSources] = useState(null)

    // Fetch documents
    useEffect(() => {
        async function fetchDocs() {
            try {
                const data = await listDocuments({ status: 'ready' })
                setDocuments(data.documents)

                // If documentId from URL, find the doc
                if (documentId) {
                    const doc = data.documents.find((d) => d.id === parseInt(documentId))
                    if (doc) {
                        setSelectedDoc(doc)
                        setSelectedDocId(doc.id)
                    }
                }
            } catch (err) {
                console.error('Failed to fetch documents:', err)
            } finally {
                setLoadingDocs(false)
            }
        }
        fetchDocs()
    }, [documentId])

    // Load existing session
    useEffect(() => {
        if (sessionId) {
            async function loadSession() {
                try {
                    const session = await getSession(parseInt(sessionId))
                    setMessages(session.messages || [])
                    setCurrentSessionId(session.id)
                } catch (err) {
                    console.error('Failed to load session:', err)
                }
            }
            loadSession()
        }
    }, [sessionId])

    // Handle initial question from dashboard
    useEffect(() => {
        if (location.state?.initialQuestion && selectedDocId) {
            setInput(location.state.initialQuestion)
            // Clear the state so it doesn't re-trigger
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [location.state, selectedDocId, navigate, location.pathname])

    // Scroll to bottom when messages change
    const messageCount = messages.length
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messageCount])

    // Handle document selection
    const handleSelectDoc = useCallback((doc) => {
        setSelectedDoc(doc)
        setSelectedDocId(doc.id)
        setMessages([])
        setCurrentSessionId(null)
        navigate(`/chat/${doc.id}`)
    }, [navigate])

    // Handle send message
    const handleSend = useCallback(async () => {
        if (!input.trim() || !selectedDocId || loading) return

        const question = input.trim()
        setInput('')

        // Add user message immediately
        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: question,
            created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, userMessage])
        setLoading(true)

        try {
            const response = await sendQuery({
                question,
                documentId: selectedDocId,
                sessionId: currentSessionId,
            })

            // Add assistant message
            const assistantMessage = {
                id: response.message_id,
                role: 'assistant',
                content: response.answer,
                sources: response.sources,
                created_at: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, assistantMessage])
            setCurrentSessionId(response.session_id)

            // Update URL with session ID
            if (!sessionId) {
                navigate(`/chat/${selectedDocId}/${response.session_id}`, { replace: true })
            }
        } catch (err) {
            console.error('Query failed:', err)
            const errorMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: err.response?.data?.detail || 'Sorry, something went wrong. Please try again.',
                created_at: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setLoading(false)
        }
    }, [input, selectedDocId, currentSessionId, loading, sessionId, navigate])

    // Render message with citations
    const renderMessageContent = (message) => {
        if (message.role === 'user') {
            return <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        }

        const { citations } = parseCitations(message.content)
        let content = message.content

        // Replace [page:X] with styled badges
        content = content.replace(/\[page:(\d+)\]/g, (match, pageNum) => {
            return `<button class="citation-badge" data-page="${pageNum}">[page:${pageNum}]</button>`
        })

        return (
            <div className="text-sm">
                <div
                    className="whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: content }}
                    onClick={(e) => {
                        if (e.target.classList.contains('citation-badge')) {
                            const page = parseInt(e.target.dataset.page)
                            const source = message.sources?.find((s) => s.page === page)
                            if (source) {
                                setShowSources(showSources === message.id ? null : message.id)
                            }
                        }
                    }}
                />

                {/* Sources panel */}
                {message.sources && message.sources.length > 0 && showSources === message.id && (
                    <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Sources</p>
                        <div className="flex flex-col gap-2">
                            {message.sources.map((source, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                            Page {source.page}
                                        </span>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                            {(source.relevance_score * 100).toFixed(0)}% match
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3">
                                        {source.text_snippet}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Show sources toggle */}
                {message.sources && message.sources.length > 0 && (
                    <button
                        onClick={() => setShowSources(showSources === message.id ? null : message.id)}
                        className="mt-2 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            {showSources === message.id ? 'expand_less' : 'expand_more'}
                        </span>
                        {showSources === message.id ? 'Hide' : 'Show'} {message.sources.length} source{message.sources.length !== 1 ? 's' : ''}
                    </button>
                )}
            </div>
        )
    }

    // Document selector view
    if (!selectedDocId) {
        return (
            <div className="w-full max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">
                <div>
                    <h1 className="text-zinc-900 dark:text-white text-2xl font-semibold tracking-tight">Start a Chat</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Select a document to ask questions about</p>
                </div>

                {loadingDocs ? (
                    <div className="flex items-center justify-center p-12 text-zinc-500 dark:text-zinc-400">
                        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                        Loading documents...
                    </div>
                ) : documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                        <span className="material-symbols-outlined text-[48px] text-zinc-300 dark:text-zinc-600">folder_open</span>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-sm">No documents ready</p>
                        <button
                            onClick={() => navigate('/upload')}
                            className="mt-4 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                        >
                            Upload a document
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {documents.map((doc) => (
                            <button
                                key={doc.id}
                                onClick={() => handleSelectDoc(doc)}
                                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm transition-all text-left group"
                            >
                                <div className="size-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 flex-shrink-0 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-zinc-900 transition-colors">
                                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>description</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-zinc-900 dark:text-white text-sm font-medium truncate">{doc.original_name}</h3>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">{doc.page_count} pages</p>
                                </div>
                                <span className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300">arrow_forward</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // Chat view
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-10">
                <button
                    onClick={() => {
                        setSelectedDocId(null)
                        setSelectedDoc(null)
                        setMessages([])
                        setCurrentSessionId(null)
                        navigate('/chat')
                    }}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="text-zinc-900 dark:text-white text-sm font-medium truncate">
                        {selectedDoc?.original_name || 'Document'}
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                        {selectedDoc?.page_count || 0} pages • {messages.length} messages
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
                <div className="max-w-3xl mx-auto flex flex-col gap-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="size-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
                                <span className="material-symbols-outlined text-[32px]">chat_bubble</span>
                            </div>
                            <h3 className="text-zinc-900 dark:text-white text-lg font-medium">Start the conversation</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 max-w-md">
                                Ask a question about the document and I'll provide answers with page citations.
                            </p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] ${message.role === 'user'
                                        ? 'message-user'
                                        : 'message-assistant'
                                        }`}
                                >
                                    {renderMessageContent(message)}
                                </div>
                            </div>
                        ))
                    )}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="message-assistant flex items-center gap-2">
                                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                <span className="text-sm">Thinking...</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-end gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                            placeholder="Ask a question about the document..."
                            aria-label="Ask a question about the document"
                            rows={1}
                            className="flex-1 resize-none bg-transparent border-none focus:ring-0 focus:outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm min-h-[24px] max-h-[120px]"
                            style={{ height: 'auto' }}
                            disabled={loading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="flex items-center justify-center size-9 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                            aria-label="Send message"
                        >
                            <span className="material-symbols-outlined icon-lg">arrow_upward</span>
                        </button>
                    </div>
                    <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                        Press Enter to send, Shift+Enter for new line
                    </p>
                </div>
            </div>
        </div>
    )
}
