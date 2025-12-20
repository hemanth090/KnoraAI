import { useState, useEffect } from 'react'
import { checkHealth } from '../api'

export default function Settings() {
    const [health, setHealth] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchHealth() {
            try {
                const data = await checkHealth()
                setHealth(data)
            } catch (err) {
                console.error('Failed to fetch health:', err)
                setHealth({ status: 'offline' })
            } finally {
                setLoading(false)
            }
        }
        fetchHealth()
    }, [])

    const configItems = [
        { label: 'Chunk Size', value: '600 tokens', description: 'Target size for document chunks' },
        { label: 'Chunk Overlap', value: '100 tokens', description: 'Overlap between consecutive chunks' },
        { label: 'Top K Results', value: '10', description: 'Number of chunks retrieved per query' },
        { label: 'Max File Size', value: '50 MB', description: 'Maximum upload file size' },
        { label: 'Database', value: 'Supabase PostgreSQL', description: 'Cloud-hosted document storage' },
        { label: 'Vector Store', value: 'pgvector', description: 'PostgreSQL vector similarity search' },
        { label: 'File Storage', value: 'Supabase Storage', description: 'Cloud-hosted PDF storage' },
    ]

    return (
        <div className="w-full max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">
            {/* Header */}
            <div>
                <h1 className="text-zinc-900 dark:text-white text-2xl font-semibold tracking-tight">Settings</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">System configuration and status</p>
            </div>

            {/* System Status */}
            <div className="flex flex-col gap-4">
                <h2 className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-widest">System Status</h2>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center p-8 text-zinc-500 dark:text-zinc-400">
                            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                            Checking status...
                        </div>
                    ) : (
                        <>
                            {/* Status Header */}
                            <div className="flex items-center gap-4 p-4 border-b border-zinc-100 dark:border-zinc-800">
                                <div className={`size-3 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                <div className="flex-1">
                                    <h3 className="text-zinc-900 dark:text-white text-sm font-medium">
                                        {health?.status === 'healthy' ? 'All Systems Operational' : 'System Offline'}
                                    </h3>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
                                        Version {health?.version || 'Unknown'}
                                    </p>
                                </div>
                            </div>

                            {/* Models */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                                <div className="flex flex-col gap-1 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-zinc-500 dark:text-zinc-400" style={{ fontSize: '18px' }}>neurology</span>
                                        <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase">Embedding Model</span>
                                    </div>
                                    <p className="text-zinc-900 dark:text-white text-sm font-medium mt-1">{health?.embedding_model || 'Not configured'}</p>
                                </div>

                                <div className="flex flex-col gap-1 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-zinc-500 dark:text-zinc-400" style={{ fontSize: '18px' }}>smart_toy</span>
                                        <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase">LLM Model</span>
                                    </div>
                                    <p className="text-zinc-900 dark:text-white text-sm font-medium mt-1">{health?.llm_model || 'Not configured'}</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Configuration */}
            <div className="flex flex-col gap-4">
                <h2 className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-widest">Configuration</h2>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 divide-y divide-zinc-100 dark:divide-zinc-800">
                    {configItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4">
                            <div className="flex flex-col">
                                <span className="text-zinc-900 dark:text-white text-sm font-medium">{item.label}</span>
                                <span className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">{item.description}</span>
                            </div>
                            <span className="text-zinc-600 dark:text-zinc-300 text-sm font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* About */}
            <div className="flex flex-col gap-4">
                <h2 className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-widest">About</h2>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-6">
                    <div className="flex items-start gap-4">
                        <div className="size-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fill="currentColor" fillRule="evenodd"></path>
                                <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fill="currentColor" fillRule="evenodd"></path>
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-zinc-900 dark:text-white text-lg font-semibold">Knora AI</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 leading-relaxed">
                                A document-grounded AI assistant powered by RAG (Retrieval-Augmented Generation).
                                Upload PDFs, ask questions, and get answers with page citations.
                            </p>
                            <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-3">
                                Built with FastAPI, React, Supabase (PostgreSQL + pgvector + Storage), and sentence-transformers.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
