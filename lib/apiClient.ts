// lib/apiClient.ts

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
    method?: RequestMethod;
    body?: any;
    params?: Record<string, string>;
}

/**
 * Wrapper helper untuk melakukan request API (Fetch).
 * Menangani konversi parameter ke query string, setting header default, dan error handling.
 */
export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, params } = options;

    // Membangun URL dengan query params jika ada
    let url = `/api${endpoint}`;
    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, value);
            }
        });
        url += `?${searchParams.toString()}`;
    }

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    const config: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include', // Pastikan cookies dikirim (penting untuk NextAuth)
    };

    try {
        const response = await fetch(url, config);

        // Cek jika response tidak OK (bukan 2xx)
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || errorData.error || `Request failed with status ${response.status}`);
        }

        // Return data JSON
        return response.json();
    } catch (error) {
        console.error(`API Call Failed [${method} ${url}]:`, error);
        throw error;
    }
}
