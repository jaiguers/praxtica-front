import axios from 'axios';

export interface TestResult {
  passed: boolean;
  description: string;
  details?: string;
}

export interface GithubVerificationResponse {
  success: boolean;
  message: string;
  testResults?: TestResult[];
}

export const githubService = {
  async verifyChallenge(challengeId: string, stepId: number, githubUsername: string): Promise<GithubVerificationResponse> {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/challenges/verify/${challengeId}`, {
        stepId,
        githubUsername
      });
      
      return response.data;
    } catch (error) {
      console.error('Error verifying challenge:', error);
      throw new Error('Error al verificar el desafío');
    }
  },

  async initializeRepository(challengeId: string, githubUsername: string): Promise<{ success: boolean, repoUrl: string }> {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/initialize-repo`, {
        challengeId,
        githubUsername
      });
      
      return response.data;
    } catch (error) {
      console.error('Error initializing repository:', error);
      throw new Error('Error al inicializar el repositorio');
    }
  }
}; 