import { getSession } from 'next-auth/react';
import { fetchWithAuth } from './api';

export interface UserRanking {
  ranking: number;
  totalUsers: number;
}

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  token: string;
  ranking: number;
}

export async function getUserRanking(): Promise<UserRanking> {
  try {
    const session = await getSession();
    if (!session?.accessToken) {
      throw new Error('No access token available');
    }

    const user = session.user as SessionUser;
    if (!user?.id) {
      throw new Error('User ID not available');
    }

    const response = await fetchWithAuth(`/users/${user.id}/ranking`);
    return response;
  } catch (error) {
    console.error('Error fetching user ranking:', error);
    throw error;
  }
} 