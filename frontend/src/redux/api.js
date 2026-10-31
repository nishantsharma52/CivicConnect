const API_BASE = (
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080/api/v1'
).replace(/\/$/, '');


// ============================================================
// Token Helpers
// ============================================================

export const getToken = () =>
    localStorage.getItem(
        'civicconnect_token'
    );


export const setToken = (token) =>
    localStorage.setItem(
        'civicconnect_token',
        token
    );


export const clearToken = () =>
    localStorage.removeItem(
        'civicconnect_token'
    );


// ============================================================
// API Request
// ============================================================

export async function apiRequest(
    path,
    options = {}
) {
    const {
        method = 'GET',
        body,
        headers = {},
        auth = true,
    } = options;

    const finalHeaders = {
        ...headers,
    };


    // Add Authorization token
    if (auth) {
        const token = getToken();

        if (token) {
            finalHeaders.Authorization =
                `Bearer ${token}`;
        }
    }


    // Prepare request body
    let payload = body;

    if (
        body &&
        !(body instanceof FormData) &&
        typeof body !== 'string'
    ) {
        finalHeaders['Content-Type'] =
            'application/json';

        payload = JSON.stringify(body);
    }


    // Send request
    const response = await fetch(
        `${API_BASE}${path}`,
        {
            method,
            headers: finalHeaders,
            body: payload,
        }
    );


    // Read response
    const text = await response.text();

    let data;

    try {
        data = text
            ? JSON.parse(text)
            : null;
    } catch {
        data = {
            message:
                text ||
                'Unexpected server response',
        };
    }


    // Handle API errors
    if (!response.ok) {
        const error = new Error(
            data?.message ||
            `Request failed with status ${response.status}`
        );

        error.status = response.status;
        error.payload = data;

        throw error;
    }


    return data;
}


export {
    API_BASE,
};