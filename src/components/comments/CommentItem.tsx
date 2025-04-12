import React, { useState } from 'react';
import CommentForm from './CommentForm'; // Importar para responder
import { useSession } from 'next-auth/react'; // Para saber si mostrar form de respuesta
import Image from 'next/image'; // Para la imagen de autor

interface Comment {
  id: string;
  text: string;
  author: string;
  authorImage?: string;
  createdAt: string;
  votes: number;
  replies?: Comment[];
  parentId?: string | null;
}

interface CommentItemProps {
  comment: Comment;
  onReply: (text: string, parentId: string | null) => void;
}

const CommentItem = ({ comment, onReply }: CommentItemProps) => {
  const { data: session } = useSession();
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReplySubmit = (replyText: string) => {
    onReply(replyText, comment.id); // Llamar a onReply con el texto y el ID padre
    setShowReplyForm(false); // Ocultar formulario después de enviar
  };

  // Lógica para votar (necesitaría props adicionales o un servicio)
  const handleVote = (voteType: 'up' | 'down') => {
    console.log(`Votando ${voteType} en comentario ${comment.id}`);
    // Aquí llamarías a tu backend para registrar el voto
  };

  return (
    <div className="border rounded p-4 mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-start mb-2">
        {/* Imagen del Autor */} 
        {comment.authorImage ? (
          <Image
            src={comment.authorImage}
            alt={`Avatar de ${comment.author}`}
            width={32}
            height={32}
            className="rounded-full mr-3"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 mr-3"></div> // Placeholder
        )}
        <div>
          <span className="font-semibold mr-2 text-gray-900 dark:text-gray-100">{comment.author}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{comment.createdAt}</span>
        </div>
      </div>
      <p className="text-gray-800 dark:text-gray-200 mb-3 ml-11">{/* Indentación para alinear con nombre */}
        {comment.text}
      </p>
      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 ml-11"> {/* Indentación */} 
        {/* Botones de Votar */}
        <button onClick={() => handleVote('up')} className="mr-1 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">⬆️</button>
        <span className="font-medium mx-1">{comment.votes}</span>
        <button onClick={() => handleVote('down')} className="ml-1 mr-4 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">⬇️</button>
        {/* Botón de Responder */}
        {session && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="mr-4 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Responder
          </button>
        )}
        {/* Otros botones (Compartir, etc.) */}
      </div>

      {/* Formulario de Respuesta (condicional) */}
      {showReplyForm && (
        <div className="ml-11 mt-4">
          <CommentForm
            onSubmit={handleReplySubmit}
            placeholder={`Respondiendo a ${comment.author}...`}
            buttonText="Enviar Respuesta"
          />
        </div>
      )}

      {/* Respuestas Anidadas */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 mt-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} /> // Pasar onReply recursivamente
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem; 