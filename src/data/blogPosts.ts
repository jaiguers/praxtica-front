import { BlogPost } from '@/types/blog';

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Construyendo un clon de Redis desde cero',
    slug: 'construyendo-redis-desde-cero',
    excerpt: 'Aprende cómo funciona Redis internamente construyendo tu propia versión simplificada.',
    content: [
      'Redis es una de las bases de datos más populares en el mundo del desarrollo de software. En este artículo, exploraremos cómo funciona internamente construyendo nuestra propia versión simplificada.',
      'Comenzaremos entendiendo los conceptos básicos de las estructuras de datos que utiliza Redis, como las hash tables y las linked lists. Luego, implementaremos un servidor TCP simple que puede aceptar conexiones y procesar comandos básicos.',
      'Una de las partes más interesantes de Redis es su modelo de persistencia. Veremos cómo implementar un sistema simple de persistencia que puede guardar y recuperar datos del disco.',
      'También exploraremos cómo Redis maneja las operaciones atómicas y cómo podemos implementar nuestras propias estructuras de datos thread-safe.',
      'Finalmente, discutiremos las optimizaciones de rendimiento que podemos hacer y cómo escalar nuestra implementación para manejar más carga.'
    ],
    author: {
      name: 'Ana Martínez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ana'
    },
    date: '2024-02-15',
    coverImage: '/images/redis-clone.jpg',
    readTime: '10 min'
  },
  {
    id: '2',
    title: 'Implementando un contenedor Docker simplificado',
    slug: 'implementando-contenedor-docker-simplificado',
    excerpt: 'Descubre cómo funcionan los contenedores por dentro creando tu propia versión de Docker.',
    content: [
      'Docker ha revolucionado la forma en que desarrollamos y desplegamos aplicaciones. En este artículo, vamos a explorar cómo funcionan los contenedores por dentro implementando nuestra propia versión simplificada.',
      'Los contenedores son posibles gracias a características del kernel de Linux como namespaces y cgroups. Veremos cómo usar estas características para aislar procesos y recursos del sistema.',
      'Aprenderemos sobre los sistemas de archivos en capas y cómo Docker utiliza esta tecnología para hacer que los contenedores sean eficientes en términos de espacio y rápidos de iniciar.',
      'La networking en contenedores es otro aspecto fascinante. Implementaremos un bridge network simple para permitir que nuestros contenedores se comuniquen entre sí.',
      'Por último, crearemos una CLI básica que nos permita ejecutar y administrar nuestros contenedores de forma similar a Docker.'
    ],
    author: {
      name: 'Carlos Ruiz',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos'
    },
    date: '2024-02-10',
    coverImage: '/images/docker-clone.jpg',
    readTime: '15 min'
  },
  {
    id: '3',
    title: 'Creando un sistema de control de versiones',
    slug: 'creando-sistema-control-versiones',
    excerpt: 'Explora los conceptos fundamentales de Git construyendo tu propio sistema de control de versiones.',
    content: [
      'Git es una herramienta esencial para cualquier desarrollador. En este artículo, vamos a construir nuestro propio sistema de control de versiones para entender cómo funciona Git por dentro.',
      'Comenzaremos implementando el modelo de objetos de Git: blobs, trees y commits. Veremos cómo estos objetos forman la base del sistema de versionado.',
      'Luego, implementaremos el sistema de branching y merging, que es una de las características más poderosas de Git. Aprenderemos sobre los diferentes algoritmos de merge y cómo manejar conflictos.',
      'La parte más interesante será implementar el sistema de staging area y cómo Git trackea los cambios en los archivos.',
      'Finalmente, agregaremos soporte para trabajar con repositorios remotos y sincronizar cambios entre diferentes copias del repositorio.'
    ],
    author: {
      name: 'Laura González',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laura'
    },
    date: '2024-02-05',
    coverImage: '/images/git-clone.jpg',
    readTime: '12 min'
  }
]; 