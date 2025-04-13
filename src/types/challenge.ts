export interface Task {
    title: string;
    description: string;
    status: string;
}

export interface ChallengeStep {
    title: string;
    description: string;
    status: string;
    content: string;
    isActive: boolean;
    tabs: {
        instructions?: {
            text: string;
            task: Task;
        };
        video?: string;
    }
}

export interface Challenge {
    _id: string;
    title: string;
    subtitle: string;
    description: string;
    image: string | null;
    level: string;
    type: string;
    steps: ChallengeStep[];
    status: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    repoUrl: string | null;
} 