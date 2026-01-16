import { useState, useCallback } from 'react';

interface UseApiResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    execute: (...args: any[]) => Promise<T | null>;
    reset: () => void;
}

export const useApi = <T>(
    apiCall: (...args: any[]) => Promise<any>
): UseApiResult<T> => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(async (...args: any[]) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiCall(...args);
            // Adjust this based on your API response structure
            // Our services return the raw JSON body
            // Most endpoints return { message: string, data: T } or just T
            // We'll try to extract 'data' if it exists, otherwise return the whole object
            const result = response.data !== undefined ? response.data : response;
            setData(result);
            return result;
        } catch (err: any) {
            console.error("API Error in useApi:", err);
            // Extract nice error message if available from ApiError
            const msg = err.data?.message || err.message || 'An unexpected error occurred';
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, [apiCall]);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return { data, loading, error, execute, reset };
};
