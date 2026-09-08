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