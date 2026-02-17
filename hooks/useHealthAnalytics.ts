import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AnalyticsQuery, analyticsService, TimeGranularity } from '../services/api/analytics';

export const useHealthAnalytics = (options: AnalyticsQuery = {}) => {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        setError(null);
        try {
            const response = await analyticsService.getHealthAnalytics(user.id, {
                granularity: options.granularity || TimeGranularity.DAY,
                days: options.days || 30,
            });
            console.log('[useHealthAnalytics] API Response:', JSON.stringify(response).substring(0, 200));

            // Handle different possible response structures
            const finalData = response.data || response;
            setData(finalData);
        } catch (err: any) {
            console.error('[useHealthAnalytics] API Error:', err);
            setError(err.message || 'Failed to fetch analytics');
        } finally {
            setLoading(false);
        }
    }, [user?.id, options.granularity, options.days]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    return {
        data,
        loading,
        error,
        refetch: fetchAnalytics,
    };
};
