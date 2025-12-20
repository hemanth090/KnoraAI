import { memo } from 'react'
import { Link } from 'react-router-dom'
import { formatRelativeTime } from '../api'

/**
 * Reusable document card component
 */
export const DocumentCard = memo(function DocumentCard({
    doc,
    onClick,
    showAction = true,
    actionLabel = 'Chat',
    actionIcon = 'chat'
}) {
    return (
        <div className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center justify-center size-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                <span className="material-symbols-outlined icon-xl">description</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
                <h3 className="text-zinc-900 dark:text-white text-sm font-medium truncate">
                    {doc.original_name}
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
                    {doc.page_count} pages • {formatRelativeTime(doc.created_at)}
                </p>
            </div>
            {showAction && onClick && (
                <button
                    onClick={() => onClick(doc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                    <span className="material-symbols-outlined icon-md">{actionIcon}</span>
                    {actionLabel}
                </button>
            )}
        </div>
    )
})

/**
 * Reusable session card component
 */
export const SessionCard = memo(function SessionCard({
    session,
    onClick,
    onDelete
}) {
    return (
        <div className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center justify-center size-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                <span className="material-symbols-outlined icon-xl">chat</span>
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
                {onClick && (
                    <button
                        onClick={() => onClick(session)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                    >
                        <span className="material-symbols-outlined icon-md">chat</span>
                        Continue
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={() => onDelete(session)}
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        aria-label="Delete session"
                    >
                        <span className="material-symbols-outlined icon-lg">delete</span>
                    </button>
                )}
            </div>
        </div>
    )
})

/**
 * Status badge component
 */
export const StatusBadge = memo(function StatusBadge({ status }) {
    const styles = {
        pending: 'status-pending',
        processing: 'status-processing',
        ready: 'status-ready',
        failed: 'status-failed',
    }

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || ''}`}>
            {status === 'processing' && (
                <span className="material-symbols-outlined animate-spin mr-1 icon-sm">progress_activity</span>
            )}
            {status}
        </span>
    )
})

/**
 * Loading spinner component
 */
export const LoadingSpinner = memo(function LoadingSpinner({ text = 'Loading...' }) {
    return (
        <div className="flex items-center justify-center p-12 text-zinc-500 dark:text-zinc-400">
            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
            {text}
        </div>
    )
})

/**
 * Empty state component
 */
export const EmptyState = memo(function EmptyState({
    icon,
    title,
    description,
    action,
    actionLink
}) {
    return (
        <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
            <span className="material-symbols-outlined text-[48px] text-zinc-300 dark:text-zinc-600">{icon}</span>
            <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-sm">{title}</p>
            {description && (
                <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1">{description}</p>
            )}
            {action && actionLink && (
                <Link
                    to={actionLink}
                    className="mt-4 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                    {action}
                </Link>
            )}
        </div>
    )
})
