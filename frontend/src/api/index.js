import axios from 'axios';

// API base URL - uses VITE_API_URL env var in production, or /api (proxy) in development
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============== Document APIs ==============

/**
 * Upload a PDF document
 * @param {File} file - The PDF file to upload
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} DocumentResponse
 */
export async function uploadDocument(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/documents/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percent);
            }
        },
    });

    return response.data;
}

/**
 * List all documents
 * @param {Object} options - Query options
 * @param {number} options.skip - Pagination offset
 * @param {number} options.limit - Max results
 * @param {string} options.status - Filter by status
 * @returns {Promise<Object>} DocumentListResponse
 */
export async function listDocuments({ skip = 0, limit = 50, status = null } = {}) {
    const params = new URLSearchParams();
    params.append('skip', skip);
    params.append('limit', limit);
    if (status) params.append('status', status);

    const response = await api.get(`/documents/?${params.toString()}`);
    return response.data;
}

/**
 * Get a single document by ID
 * @param {number} id - Document ID
 * @returns {Promise<Object>} DocumentResponse
 */
export async function getDocument(id) {
    const response = await api.get(`/documents/${id}`);
    return response.data;
}

/**
 * Delete a document
 * @param {number} id - Document ID
 * @returns {Promise<void>}
 */
export async function deleteDocument(id) {
    await api.delete(`/documents/${id}`);
}

/**
 * Get document processing stats
 * @param {number} id - Document ID
 * @returns {Promise<Object>} Stats object
 */
export async function getDocumentStats(id) {
    const response = await api.get(`/documents/${id}/stats`);
    return response.data;
}

// ============== Chat APIs ==============

/**
 * Send a query to a document
 * @param {Object} params - Query parameters
 * @param {string} params.question - The question to ask
 * @param {number} params.documentId - Document ID
 * @param {number|null} params.sessionId - Existing session ID (optional)
 * @returns {Promise<Object>} QueryResponse
 */
export async function sendQuery({ question, documentId, sessionId = null }) {
    const response = await api.post('/chat/query', {
        question,
        document_id: documentId,
        session_id: sessionId,
    });
    return response.data;
}

/**
 * Continue an existing chat session
 * @param {number} sessionId - Session ID
 * @param {string} question - The question to ask
 * @returns {Promise<Object>} QueryResponse
 */
export async function continueSession(sessionId, question) {
    const response = await api.post(`/chat/sessions/${sessionId}/continue`, {
        question,
        document_id: 0, // Will be ignored by backend
    });
    return response.data;
}

/**
 * List chat sessions
 * @param {Object} options - Query options
 * @param {number} options.documentId - Filter by document
 * @param {number} options.skip - Pagination offset
 * @param {number} options.limit - Max results
 * @returns {Promise<Object>} ChatSessionListResponse
 */
export async function listSessions({ documentId = null, skip = 0, limit = 50 } = {}) {
    const params = new URLSearchParams();
    params.append('skip', skip);
    params.append('limit', limit);
    if (documentId) params.append('document_id', documentId);

    const response = await api.get(`/chat/sessions?${params.toString()}`);
    return response.data;
}

/**
 * Get a single chat session with messages
 * @param {number} id - Session ID
 * @returns {Promise<Object>} ChatSessionResponse
 */
export async function getSession(id) {
    const response = await api.get(`/chat/sessions/${id}`);
    return response.data;
}

/**
 * Delete a chat session
 * @param {number} id - Session ID
 * @returns {Promise<void>}
 */
export async function deleteSession(id) {
    await api.delete(`/chat/sessions/${id}`);
}

// ============== Health API ==============

/**
 * Check backend health status
 * @returns {Promise<Object>} HealthResponse
 */
export async function checkHealth() {
    const response = await api.get('/health');
    return response.data;
}

// ============== Utility Functions ==============

/**
 * Format file size to human readable
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Parse citations from text
 * @param {string} text - Text containing [page:X] citations
 * @returns {Object} { text, citations: number[] }
 */
export function parseCitations(text) {
    const regex = /\[page:(\d+)\]/g;
    const citations = [...text.matchAll(regex)].map((m) => parseInt(m[1]));
    return { text, citations: [...new Set(citations)] };
}

/**
 * Format relative time
 * @param {string} dateStr - ISO date string
 * @returns {string} Relative time (e.g., "2m ago")
 */
export function formatRelativeTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export default api;
