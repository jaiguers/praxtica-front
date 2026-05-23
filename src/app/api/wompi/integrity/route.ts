import crypto from 'crypto';
import { NextResponse } from 'next/server';

const getWompiKeys = () => {
  const nodeEnv = String(process.env.NODE_ENV);

  if (nodeEnv === 'development') {
    return {
      publicKey: process.env.WOMPI_PUBLIC_TEST_KEY,
      integrityKey: process.env.NEXT_PUBLIC_WOMPI_INTEGRITY_TEST,
      secretKey: process.env.NEXT_PUBLIC_WOMPI_SECRET_TEST,
    };
  }

  return {
    publicKey: process.env.WOMPI_PUBLIC_KEY,
    integrityKey: process.env.NEXT_PUBLIC_WOMPI_INTEGRITY_KEY,
    secretKey: process.env.NEXT_PUBLIC_WOMPI_SECRET,
  };
};

export async function POST(request: Request) {
  try {
    const { reference, amountInCents, currency } = await request.json();
    const { publicKey, integrityKey, secretKey } = getWompiKeys();

    if (!publicKey || !integrityKey || !secretKey) {
      return NextResponse.json(
        { message: 'Wompi environment variables are not configured' },
        { status: 500 }
      );
    }

    if (!reference || !amountInCents || !currency) {
      return NextResponse.json(
        { message: 'reference, amountInCents and currency are required' },
        { status: 400 }
      );
    }

    const dataToHash = `${reference}${amountInCents}${currency}${integrityKey}`;
    const integrity = crypto
      .createHash('sha256')
      .update(dataToHash)
      .digest('hex');

    return NextResponse.json({ integrity, publicKey });
  } catch (error) {
    console.error('Error generating Wompi integrity hash:', error);
    return NextResponse.json(
      { message: 'Error generating Wompi integrity hash' },
      { status: 500 }
    );
  }
}
