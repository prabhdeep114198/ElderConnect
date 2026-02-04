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
            const analyticsData = await analyticsService.getHealthAnalytics(user.id, {
                granularity: options.granularity || TimeGranularity.DAY,
                days: options.days || 30,
            });
            setData(analyticsData.data);
        } catch (err: any) {
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
