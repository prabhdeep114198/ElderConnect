import axios from 'axios';
import { API_BASE_URL } from './api/config';

export const getCheckoutHtml = async (amount: number, token: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/subscriptions/checkout-html`, {
            params: { amount },
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching checkout HTML:', error);
        throw error;
    }
};

export const getBillingHistory = async (token: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/subscriptions/billing-history`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching billing history:', error);
        throw error;
    }
};

export const getSubscriptionStatus = async (token: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/subscriptions/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching subscription status:', error);
        throw error;
    }
};
