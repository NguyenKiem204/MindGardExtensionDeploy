import { api } from '../utils/api';
import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const subscriptionService = {
    // Get active plans (monthly, yearly) wrapper
    getActivePlans: async () => {
        try {
            const response = await api.get(`/v1/subscriptions/plans`);
            return response.data;
        } catch (error) {
            console.error('Error fetching subscription plans:', error);
            throw error;
        }
    },

    // Get current user's subscription status
    getCurrentSubscription: async () => {
        try {
            const response = await api.get(`/v1/subscriptions/me`);
            return response.data;
        } catch (error) {
            console.error('Error fetching current subscription:', error);
            return null;
        }
    },

    // Generate SePay VietQR payment link
    createPaymentUrl: async (planId, paymentMethod = 'SEPAY') => {
        try {
            const response = await api.post(`/v1/subscriptions/buy`,
                { planId, paymentMethod }
            );
            return response.data; // { qrUrl, orderCode, amount, bankAccount, bankName }
        } catch (error) {
            console.error('Error creating payment URL:', error);
            throw error;
        }
    },

    // Check payment status (Polling)
    checkPaymentStatus: async (orderCode) => {
        try {
            const response = await api.get(`/v1/subscriptions/status/${orderCode}`);
            return response.data; // { status: "SUCCESS" | "PENDING" | "FAILED" }
        } catch (error) {
            console.error('Error checking payment status:', error);
            throw error;
        }
    }
};
