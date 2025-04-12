const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error('Error en la petición');
  }

  return response.json();
}

export const challengesApi = {
  getAll: async (token: string) => {
    return fetchWithAuth('/challenges', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  update: async (id: string, data: any, token: string) => {
    return fetchWithAuth(`/challenges/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },

  createRepository: async (challengeId: string, token: string) => {
    return fetchWithAuth(`/challenges/${challengeId}/repository`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
}; 