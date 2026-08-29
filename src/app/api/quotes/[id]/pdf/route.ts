import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { generateQuotePDF } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch quote
    const quoteResult = await client`SELECT * FROM quotes WHERE id = ${params.id}`;
    if (quoteResult.length === 0) {
      return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 });
    }

    const quote = quoteResult[0];

    // Fetch client
    const clientResult = await client`SELECT * FROM clients WHERE id = ${quote.client_id}`;
    const clientData = clientResult[0];

    // Fetch lines
    const lines = await client`SELECT * FROM quote_lines WHERE quote_id = ${params.id} ORDER BY line_number ASC`;

    // Generate PDF
    const doc = generateQuotePDF({
      quote: { ...quote, lines },
      client: clientData,
      company: {
        name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Norton Plumbing & Gas',
        abn: process.env.NEXT_PUBLIC_COMPANY_ABN || '42 873 255 204',
        licence: process.env.NEXT_PUBLIC_COMPANY_LICENCE || 'PGE358691',
        location: process.env.NEXT_PUBLIC_COMPANY_LOCATION || 'Adelaide, South Australia',
      },
    });

    // Set response headers
    const filename = `quote-${quote.quote_number}.pdf`;
    const response = new NextResponse(doc as any);
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
