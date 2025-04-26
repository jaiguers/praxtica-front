import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, repoUrl } = await request.json();
    const { id } = await context.params;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/challenges/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.user.token}`
      },
      body: JSON.stringify({ status, repoUrl })
    });

    if (!response.ok) {
      throw new Error('Failed to update challenge');
    }

    const challenge = await response.json();
    return NextResponse.json(challenge);
  } catch (error) {
    console.error('Error updating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to update challenge' },
      { status: 500 }
    );
  }
} 