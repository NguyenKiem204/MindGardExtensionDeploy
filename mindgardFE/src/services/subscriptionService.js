import { api } from '../utils/api';
import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://kiemnv.shop/api';

export const subscriptionService = {
    getActivePlans: async () => {
        try {
            const response = await api.get(`/v1/subscriptions/plans`);
            return response.data;
        } catch (error) {
            console.error('Error fetching subscription plans:', error);
            throw error;
        }
    },

    getCurrentSubscription: async () => {
        try {
            const response = await api.get(`/v1/subscriptions/me`);
            return response.data;
        } catch (error) {
            console.error('Error fetching current subscription:', error);
            return null;
        }
    },

    createPaymentUrl: async (planId, paymentMethod = 'SEPAY') => {
        try {
            const response = await api.post(`/v1/subscriptions/buy`,
                { planId, paymentMethod }
            );
            return response.data;
        } catch (error) {
            console.error('Error creating payment URL:', error);
            throw error;
        }
    },

    checkPaymentStatus: async (orderCode) => {
        try {
            const response = await api.get(`/v1/subscriptions/status/${orderCode}`);
            return response.data;
        } catch (error) {
            console.error('Error checking payment status:', error);
            throw error;
        }
    }
};
