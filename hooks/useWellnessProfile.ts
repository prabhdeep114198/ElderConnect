import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/api/analytics';

export interface WellnessProfile {
    physicalScore: number;
    mentalScore: number;
    sleepScore: number;
    socialScore: number;
    dietScore: number;
    exerciseScore: number;
    medicationAdherence: number;
    activeDays: number;
    riskLevel: 'low' | 'medium' | 'high';
}

export const useWellnessProfile = () => {
    const { user } = useAuth();
    const [data, setData] = useState<WellnessProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        setError(null);
        try {
            const response = await analyticsService.getWellnessProfile(user.id);
            setData(response.data || response);
        } catch (err: any) {
            console.error('[useWellnessProfile] API Error:', err);
            setError(err.message || 'Failed to fetch wellness profile');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return {
        data,
        loading,
        error,
        refetch: fetchProfile,
    };
};
