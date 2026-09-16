/**
 * Stores all requests going to backend
 *
*/

const API_BASE_PATH = '/api';

const SESSION_PROBE_PATHS = ['/auth/me', '/auth/login'];

export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

async function request(path, { method = 'GET', body, signal } = {}) {
    const response = await fetch(`${API_BASE_PATH}${path}`, {
        method,
        signal,
        headers: body ? {
            'Content-Type' : 'application/json'
        } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });

    // 204 No Content has no body to parse.
    const payload = response.status === 204 ? null : await response.json();

    if (!response.ok) {
        const isSessionProbe = SESSION_PROBE_PATHS.some((probe) => path.startsWith(probe));

        if (response.status === 401 && !isSessionProbe) {
            window.location.reload();
        }

        throw new ApiError(response.status, payload?.message ?? `Request failed (${response.status})`);
    }
    return payload;
}

export const api = {
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
    delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

// get the suggested filename from server (the {entity}-{datetime}.csv) from the Content-Disposition Header
function filenameFromResponse(response) {
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename="([^"]+)"/);
    return match ? match[1] : null;
}

// download file from fetch
export async function downloadFile(path, fallbackFilename) {
    const response = await fetch(`${API_BASE_PATH}${path}`);

    if (!response.ok) {
        if (response.status === 401) window.location.reload();
        const payload = await response.json().catch(() => null);
        throw new ApiError(response.status, payload?.message ?? 'Unduhan gagal');
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filenameFromResponse(response) ?? fallbackFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Revoking straight away can cancel the download before it starts.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

/** POST a FormData body, returning the parsed JSON and attaching row errors to failures. */
export async function uploadFile(path, formData) {
    const response = await fetch(`${API_BASE_PATH}${path}`, {
        method: 'POST',
        // No Content-Type header on purpose: the browser must set it itself so
        // it can include the multipart boundary.
        body: formData,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        if (response.status === 401) window.location.reload();
        const error = new ApiError(response.status, payload?.message ?? 'Impor gagal');
        error.rowErrors = payload?.errors ?? [];
        error.totalErrors = payload?.totalErrors ?? 0;
        throw error;
    }

    return payload;
}