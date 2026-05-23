import { NextResponse } from 'next/server';

const getWompiSecretKey = () => {
  const nodeEnv = String(process.env.NODE_ENV);

  if (nodeEnv === 'development') {
    return process.env.NEXT_PUBLIC_WOMPI_SECRET_TEST;
  }

  return process.env.NEXT_PUBLIC_WOMPI_SECRET;
};

const getWompiBaseUrl = () => {
  const nodeEnv = String(process.env.NODE_ENV);

  if (nodeEnv === 'development') {
    return 'https://sandbox.wompi.co/v1';
  }

  return 'https://production.wompi.co/v1';
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    const secretKey = getWompiSecretKey();
    const baseUrl = getWompiBaseUrl();

    if (!secretKey) {
      return NextResponse.json(
        { message: 'Wompi secret key is not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${baseUrl}/transactions/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Error verifying Wompi transaction' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      id: data.data?.id,
      status: data.data?.status,
      amountInCents: data.data?.amount_in_cents,
      currency: data.data?.currency,
      reference: data.data?.reference,
    });
  } catch (error) {
    console.error('Error verifying Wompi transaction:', error);
    return NextResponse.json(
      { message: 'Error verifying Wompi transaction' },
      { status: 500 }
    );
  }
}
