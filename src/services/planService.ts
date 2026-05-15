const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type PlanType = 'free' | 'monthly' | 'annual' | 'enterprise';

export interface Plan {
  _id: string;
  title: string;
  type: PlanType;
  items: string[];
  price: number;
  active: boolean;
}

export const planService = {
  getPlans: async (): Promise<Plan[]> => {
    const response = await fetch(`${API_URL}/plans`);

    if (!response.ok) {
      throw new Error('Error fetching plans');
    }

    return response.json();
  },
};
