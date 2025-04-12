interface Step {
  id: number;
  title: string;
  status: 'completed' | 'pending' | 'failed';
  isActive: boolean;
}

interface Challenge {
  title: string;
  subtitle: string;
  steps: Step[];
}

export const CHALLENGE_DATA: { [key: string]: Challenge } = {
  'docker-clone': {
    title: "Build your own Docker",
    subtitle: "using Go",
    steps: [
      { id: 1, title: "Introduction", status: 'completed', isActive: false },
      { id: 2, title: "Container Setup", status: 'completed', isActive: false },
      { id: 3, title: "Namespace Implementation", status: 'pending', isActive: true },
      { id: 4, title: "Cgroups Management", status: 'pending', isActive: false },
      { id: 5, title: "Image Management", status: 'pending', isActive: false },
    ]
  },
  'redis-clone': {
    title: "Build your own Redis",
    subtitle: "using Python",
    steps: [
      { id: 1, title: "Introduction", status: 'completed', isActive: false },
      { id: 2, title: "TCP Server Setup", status: 'completed', isActive: false },
      { id: 3, title: "Command Parser", status: 'pending', isActive: true },
      { id: 4, title: "Data Structures", status: 'pending', isActive: false },
      { id: 5, title: "Persistence", status: 'pending', isActive: false },
    ]
  },
  'git-clone': {
    title: "Build your own Git",
    subtitle: "using Rust",
    steps: [
      { id: 1, title: "Introduction", status: 'completed', isActive: false },
      { id: 2, title: "Repository Setup", status: 'completed', isActive: false },
      { id: 3, title: "Initialize the .git directory", status: 'completed', isActive: false },
      { id: 4, title: "Read a blob object", status: 'completed', isActive: false },
      { id: 5, title: "Create a blob object", status: 'pending', isActive: true },
      { id: 6, title: "Read a tree object", status: 'pending', isActive: false },
      { id: 7, title: "Write a tree object", status: 'pending', isActive: false },
      { id: 8, title: "Create a commit", status: 'pending', isActive: false },
      { id: 9, title: "Clone a repository", status: 'pending', isActive: false },
    ]
  },
  'sqlite-clone': {
    title: "Build your own SQLite",
    subtitle: "using C",
    steps: [
      { id: 1, title: "Introduction", status: 'completed', isActive: false },
      { id: 2, title: "Parser Implementation", status: 'completed', isActive: false },
      { id: 3, title: "B-tree Structure", status: 'pending', isActive: true },
      { id: 4, title: "Page Management", status: 'pending', isActive: false },
      { id: 5, title: "Query Execution", status: 'pending', isActive: false },
    ]
  },
  'load-balancer': {
    title: "Build your own Load Balancer",
    subtitle: "using Go",
    steps: [
      { id: 1, title: "Introduction", status: 'completed', isActive: false },
      { id: 2, title: "TCP Proxy Setup", status: 'completed', isActive: false },
      { id: 3, title: "Health Checks", status: 'pending', isActive: true },
      { id: 4, title: "Load Distribution", status: 'pending', isActive: false },
      { id: 5, title: "Configuration Management", status: 'pending', isActive: false },
    ]
  }
}; 