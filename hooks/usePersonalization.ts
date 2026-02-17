import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PersonalizationData, personalizationService } from '../services/api/personalization';

export const usePersonalization = () => {
    const { user } = useAuth();
    const [data, setData] = useState<PersonalizationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPersonalization = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await personalizationService.getJourney();
            setData(response.data);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch personalization:', err);
            setError(err.message || 'Failed to load personalization');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPersonalization();
    }, [user?.id]);

    return { data, loading, error, refetch: fetchPersonalization };
};
