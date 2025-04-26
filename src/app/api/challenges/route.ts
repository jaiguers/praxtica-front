import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/challenges`, {
      headers: {
        Authorization: `Bearer ${session.user.token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener los desafíos');
    }

    const challenges = await response.json();
    return NextResponse.json(challenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Error al obtener los desafíos' },
      { status: 500 }
    );
  }
} 