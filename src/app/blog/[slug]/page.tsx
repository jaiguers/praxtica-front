'use client';

import { useTheme } from '@/context/ThemeContext';
import { blogPosts } from '@/data/blogPosts';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export default function BlogPost({ params }: { params: { slug: string } }) {
  const { isDarkMode } = useTheme();
  const post = blogPosts.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className={`text-4xl md:text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {post.title}
          </h1>
          <div className="flex items-center">
            <Image
              src={post.author.avatar}
              alt={post.author.name}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {post.author.name}
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {new Date(post.date).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                {' · '}{post.readTime}
              </p>
            </div>
          </div>
        </div>

        {/* Imagen de portada */}
        <div className="relative aspect-video rounded-lg overflow-hidden mb-12">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Contenido */}
        <div className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
          {post.content.map((paragraph, index) => (
            <p 
              key={index}
              className={`mb-6 text-lg leading-relaxed text-justify ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
} 