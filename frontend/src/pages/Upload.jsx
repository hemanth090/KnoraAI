import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadDocument, listDocuments, deleteDocument, getDocument, formatFileSize, formatRelativeTime } from '../api'

export default function Upload() {
    const navigate = useNavigate()
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [dragOver, setDragOver] = useState(false)
    const [error, setError] = useState(null)

    // Fetch documents
    const fetchDocuments = useCallback(async () => {
        try {
            const data = await listDocuments()
            setDocuments(data.documents)
        } catch (err) {
            console.error('Failed to fetch documents:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchDocuments()
    }, [fetchDocuments])

    // Poll for processing documents - use ref to avoid dependency on documents
    const documentsRef = useRef(documents)
    documentsRef.current = documents

    useEffect(() => {
        const interval = setInterval(async () => {
            const processingDocs = documentsRef.current.filter(
                (d) => d.status === 'pending' || d.status === 'processing'
            )

            if (processingDocs.length === 0) return

            for (const doc of processingDocs) {
                try {
                    const updated = await getDocument(doc.id)
                    setDocuments((prev) =>
                        prev.map((d) => (d.id === updated.id ? updated : d))
                    )
                } catch (err) {
                    console.error('Failed to poll document:', err)
                }
            }
        }, 3000)

        return () => clearInterval(interval)
    }, []) // Empty deps - interval created once

    // Handle file upload
    const handleUpload = async (files) => {
        const file = files[0]
        if (!file) return

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setError('Only PDF files are supported')
            return
        }

        // Validate file size (50MB)
        if (file.size > 50 * 1024 * 1024) {
            setError('File size exceeds 50MB limit')
            return
        }

        setError(null)
        setUploading(true)
        setUploadProgress(0)

        try {
            const newDoc = await uploadDocument(file, setUploadProgress)
            setDocuments((prev) => [newDoc, ...prev])
        } catch (err) {
            console.error('Upload failed:', err)
            setError(err.response?.data?.detail || 'Upload failed')
        } finally {
            setUploading(false)
            setUploadProgress(0)
        }
    }

    // Handle delete
    const handleDelete = async (doc) => {
        if (!confirm(`Delete "${doc.original_name}"? This cannot be undone.`)) return

        try {
            await deleteDocument(doc.id)
            setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
        } catch (err) {
            console.error('Delete failed:', err)
            setError('Failed to delete document')
        }
    }

    // Handle drag & drop
    const handleDragOver = (e) => {
        e.preventDefault()
        setDragOver(true)
    }

    const handleDragLeave = () => {
        setDragOver(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        handleUpload(e.dataTransfer.files)
    }

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'status-pending',
            processing: 'status-processing',
            ready: 'status-ready',
            failed: 'status-failed',
        }
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || ''}`}>
                {status === 'processing' && (
                    <span className="material-symbols-outlined animate-spin mr-1" style={{ fontSize: '12px' }}>progress_activity</span>
                )}
                {status}
            </span>
        )
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-6 py-10 flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-zinc-900 dark:text-white text-2xl font-semibold tracking-tight">Library</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Upload and manage your documents</p>
                </div>
                <div className="text-zinc-500 dark:text-zinc-400 text-sm">
                    {documents.length} document{documents.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Upload Zone */}
            <div
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all duration-200 ${dragOver
                    ? 'border-zinc-400 bg-zinc-50 dark:border-zinc-500 dark:bg-zinc-800/50'
                    : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
                    } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept=".pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => handleUpload(e.target.files)}
                    disabled={uploading}
                />

                {uploading ? (
                    <div className="flex flex-col items-center gap-4">
                        <span className="material-symbols-outlined text-[40px] text-zinc-400 animate-pulse">cloud_upload</span>
                        <div className="w-48 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-zinc-900 dark:bg-white rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Uploading... {uploadProgress}%</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="size-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                            <span className="material-symbols-outlined text-[28px]">upload_file</span>
                        </div>
                        <div className="text-center">
                            <p className="text-zinc-900 dark:text-white text-base font-medium">
                                Drop a PDF here or click to browse
                            </p>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                                Maximum file size: 50MB
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                    <span className="material-symbols-outlined">error</span>
                    <p className="text-sm">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            )}

            {/* Document List */}
            <div className="flex flex-col gap-4">
                <h2 className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-widest">Your Documents</h2>

                {loading ? (
                    <div className="flex items-center justify-center p-12 text-zinc-500 dark:text-zinc-400">
                        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                        Loading...
                    </div>
                ) : documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                        <span className="material-symbols-outlined text-[48px] text-zinc-300 dark:text-zinc-600">folder_open</span>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-sm">No documents yet</p>
                        <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1">Upload a PDF to get started</p>
                    </div>
                ) : (
                    <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900/30">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                                <div className="flex items-center justify-center size-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>description</span>
                                </div>

                                <div className="flex flex-col flex-1 min-w-0">
                                    <h3 className="text-zinc-900 dark:text-white text-sm font-medium truncate">
                                        {doc.original_name}
                                    </h3>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
                                        {formatFileSize(doc.file_size)} • {doc.page_count} pages • {formatRelativeTime(doc.created_at)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {getStatusBadge(doc.status)}

                                    {doc.status === 'ready' && (
                                        <button
                                            onClick={() => navigate(`/chat/${doc.id}`)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chat</span>
                                            Chat
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDelete(doc)}
                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        title="Delete document"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
