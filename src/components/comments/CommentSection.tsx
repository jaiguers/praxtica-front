import React, { useState, useEffect } from 'react';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import { useSession } from 'next-auth/react';

// Definir el tipo Comment (puedes moverlo a un archivo types)
interface Comment {
  id: string;
  text: string;
  author: string; // Podría ser un objeto User más complejo
  authorImage?: string;
  createdAt: string;
  votes: number;
  replies?: Comment[];
  parentId?: string | null; // Para identificar respuestas
}

interface CommentSectionProps {
  contextId: string; // ID del desafío o paso
}

// Datos de ejemplo
const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1', text: '¡Gran desafío! Me costó un poco la parte de estado.', author: 'Usuario1', createdAt: 'Hace 2 horas', votes: 5,
    replies: [
      { id: 'r1', text: 'A mí también, pero lo logré.', author: 'Usuario2', createdAt: 'Hace 1 hora', votes: 2, parentId: 'c1' }
    ]
  },
  {
    id: 'c2', text: '¿Alguien sabe cómo optimizar el renderizado?', author: 'Usuario3', createdAt: 'Hace 5 horas', votes: 10
  }
];

const CommentSection = ({ contextId }: CommentSectionProps) => {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aquí harías fetch de los comentarios para contextId
    console.log(`Cargando comentarios para: ${contextId}`);
    setLoading(true);
    // Simular carga
    setTimeout(() => {
      setComments(MOCK_COMMENTS);
      setLoading(false);
    }, 1000);
  }, [contextId]);

  const handleAddComment = (text: string, parentId: string | null = null) => {
    if (!session?.user) return; // Asegurar que el usuario esté logueado

    const newComment: Comment = {
      id: `temp-${Date.now()}`, // ID temporal
      text,
      author: session.user.name || 'Usuario Anónimo',
      authorImage: session.user.image || undefined,
      createdAt: 'Ahora mismo',
      votes: 1,
      parentId,
    };

    // Aquí enviarías el newComment al backend
    console.log('Enviando comentario:', newComment);

    // Actualizar UI optimistamente (o esperar respuesta del backend)
    if (parentId) {
      // Añadir como respuesta
      setComments(prevComments => prevComments.map(comment => {
        if (comment.id === parentId) {
          return { ...comment, replies: [...(comment.replies || []), newComment] };
        }
        // Podrías necesitar lógica recursiva para respuestas anidadas profundas
        return comment;
      }));
    } else {
      // Añadir como comentario principal
      setComments(prevComments => [newComment, ...prevComments]);
    }
  };

  if (loading) {
    return <div>Cargando comentarios...</div>;
  }

  const topLevelComments = comments.filter(comment => !comment.parentId);

  return (
    <div className="mt-12">
      <h3 className="text-xl font-semibold mb-4">Comentarios</h3>
      {session && <CommentForm onSubmit={handleAddComment} />} {/* Mostrar formulario solo si está logueado */}
      <div className="space-y-6 mt-6">
        {topLevelComments.length > 0 ? (
          topLevelComments.map(comment => (
            <CommentItem key={comment.id} comment={comment} onReply={handleAddComment} />
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No hay comentarios aún. ¡Sé el primero!</p>
        )}
      </div>
    </div>
  );
};

export default CommentSection; 