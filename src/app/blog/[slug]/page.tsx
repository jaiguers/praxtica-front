import { blogPosts } from '@/data/blogPosts';
import { notFound } from 'next/navigation';
import BlogPostClient from '@/app/blog/[slug]/BlogPostClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return <BlogPostClient post={post} />;
} 