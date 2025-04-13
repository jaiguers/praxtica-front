import { fetchWithAuth } from './api';
import { Challenge } from '@/types/challenge';
import { getSession } from 'next-auth/react';

interface UsageLimits {
    success: boolean;
    message: string;
}

interface FeedbackPayload {
    stepId: number;
    feedback: {
        type: string;
    };
}

export const challengeService = {
    getAllChallenges: async (): Promise<Challenge[]> => {
        try {
            const session = await getSession();
            if (!session?.accessToken) {
                throw new Error('No access token available');
            }
            const response = await fetchWithAuth('/challenges');
            return response;
        } catch (error) {
            console.error('Error fetching challenges:', error);
            throw error;
        }
    },

    getChallengeById: async (id: string): Promise<Challenge> => {
        try {
            const session = await getSession();
            if (!session?.accessToken) {
                throw new Error('No access token available');
            }
            const response = await fetchWithAuth(`/challenges/${id}`);
            return response;
        } catch (error) {
            console.error('Error fetching challenge:', error);
            throw error;
        }
    },

    checkUsageLimits: async (type: string): Promise<UsageLimits> => {
        try {
            const session = await getSession();
            if (!session?.accessToken) {
                throw new Error('No access token available');
            }
            const response = await fetchWithAuth(`/challenges/check-usage/${type}`);
            return response;
        } catch (error) {
            console.error('Error checking usage limits:', error);
            throw error;
        }
    },

    updateChallengeFeedback: async (challengeId: string, payload: FeedbackPayload): Promise<void> => {
        try {
            const session = await getSession();
            if (!session?.accessToken) {
                throw new Error('No access token available');
            }
            await fetchWithAuth(`/challenges/${challengeId}/feedback`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error('Error updating challenge feedback:', error);
            throw error;
        }
    }
}; 