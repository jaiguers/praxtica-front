export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string[];
  author: {
    name: string;
    avatar: string;
  };
  date: string;
  coverImage: string;
  readTime: string;
} 