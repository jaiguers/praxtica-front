import React, { useState } from 'react';

interface CommentFormProps {
  onSubmit: (text: string) => void; // Prop para manejar el envío
  placeholder?: string;
  buttonText?: string;
}

const CommentForm = ({ onSubmit, placeholder = "Escribe tu comentario...", buttonText = "Enviar Comentario" }: CommentFormProps) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text);
      setText(''); // Limpiar el textarea después de enviar
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <textarea
        className="w-full p-2 border rounded mb-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        rows={3}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={!text.trim()} // Deshabilitar si no hay texto
      >
        {buttonText}
      </button>
    </form>
  );
};

export default CommentForm; 