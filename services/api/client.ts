import { API_BASE_URL, API_TIMEOUT, DEVICE_API_KEY } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
    headers?: Record<string, string>;
    body?: any;
    params?: Record<string, string>;
    requiresAuth?: boolean;
}

class ApiError extends Error {
    status: number;
    data: any;

    constructor(status: number, message: string, data?: any) {
        super(message);
        this.status = status;
        this.data = data;
        this.name = 'ApiError';
    }
}

/**
 * Generic API Client wrapper around fetch
 */
export const apiClient = async <T>(
    endpoint: string,
    method: RequestMethod,
    options: RequestOptions = {}
): Promise<T> => {
    const { headers = {}, body, params, requiresAuth = true } = options;

    // Construct query parameters
    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
        const queryString = new URLSearchParams(params).toString();
        url += `?${queryString}`;
    }

    if (__DEV__) {
        console.log(`[API Request] ${method} ${url}`);
    }

    // Default headers
    const configHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-KEY': DEVICE_API_KEY,
        ...headers,
    };

    // Inject Auth Token if required
    if (requiresAuth) {
        try {
            // NOTE: We're assuming the token is stored with this key. 
            // Adjust if you store it differently (e.g., inside a user session object)
            const token = await AsyncStorage.getItem('auth_token');
            if (token) {
                configHeaders['Authorization'] = `Bearer ${token}`;
            }
        } catch (error) {
            console.warn('Failed to retrieve auth token', error);
        }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
        const response = await fetch(url, {
            method,
            headers: configHeaders,
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle non-2xx responses
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { message: response.statusText };
            }

            throw new ApiError(response.status, errorData.message || 'API Request Failed', errorData);
        }

        // Return typed response
        // Check if response has content before parsing
        const text = await response.text();
        return text ? JSON.parse(text) : ({} as T);

    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new ApiError(408, 'Request Timeout');
        }
        throw error;
    }
};

// Convenience methods
export const api = {
    get: <T>(endpoint: string, options?: RequestOptions) =>
        apiClient<T>(endpoint, 'GET', options),

    post: <T>(endpoint: string, body: any, options?: RequestOptions) =>
        apiClient<T>(endpoint, 'POST', { ...options, body }),

    put: <T>(endpoint: string, body: any, options?: RequestOptions) =>
        apiClient<T>(endpoint, 'PUT', { ...options, body }),

    patch: <T>(endpoint: string, body: any, options?: RequestOptions) =>
        apiClient<T>(endpoint, 'PATCH', { ...options, body }),

    delete: <T>(endpoint: string, options?: RequestOptions) =>
        apiClient<T>(endpoint, 'DELETE', options),
};
