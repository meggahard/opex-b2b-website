import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Read the key server-side at runtime (never baked in at build time)
    const accessKey = (process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? '').trim();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!accessKey || !uuidRegex.test(accessKey)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Web3Forms access key is missing or invalid on the server. Please set NEXT_PUBLIC_WEB3FORMS_KEY to your Web3Forms UUID in the .env file and restart the server.',
        },
        { status: 500 }
      );
    }

    const payload = {
      ...body,
      access_key: accessKey,
    };

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json(
        { success: false, message: result.message || 'Submission failed. Please try again.' },
        { status: response.status }
      );
    }
  } catch (err) {
    console.error('submit-lead API error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
