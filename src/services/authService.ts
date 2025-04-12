import { fetchWithAuth } from './api';

export interface GitHubUserData {
  githubId: string;
  email: string;
  name: string;
  avatar: string;
  accessToken: string;
}

export const authService = {
  async registerGitHubUser(userData: GitHubUserData) {
    try {
      const response = await fetchWithAuth('/auth/github', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return response;
    } catch (error) {
      console.error('Error al registrar usuario de GitHub:', error);
      throw error;
    }
  },
}; 