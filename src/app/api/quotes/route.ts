import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { Quote, QuoteLine, ApiResponse } from '@/types';
import { calculateQuoteTotals } from '@/lib/calculations';
import { addDays, format } from 'date-fns';

interface CreateQuoteRequest {
  client_id: string;
  job_id?: string;
  quote_date: string;
  validity_days?: number;
  scope_description?: string;
  conditions?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('client_id');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');

    const offset = (page - 1) * perPage;

    let whereClause = '';
    const params: any[] = [];

    if (status) {
      whereClause = 'WHERE status = $1';
      params.push(status);
    }

    if (clientId) {
      whereClause = whereClause ? whereClause + ' AND client_id = $2' : 'WHERE client_id = $1';
      params.push(clientId);
    }

    const quotes = await client`
      SELECT * FROM quotes
      ${whereClause ? client(whereClause, params) : client``}
      ORDER BY created_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `;

    // Fetch quote lines for each quote
    const quotesWithLines = await Promise.all(
      quotes.map(async (q) => ({
        ...q,
        lines: await client`SELECT * FROM quote_lines WHERE quote_id = ${q.id} ORDER BY line_number ASC`,
      }))
    );

    return NextResponse.json({
      success: true,
      data: quotesWithLines,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Quote>>> {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateQuoteRequest = await request.json();
    const { client_id, quote_date, validity_days = 30, scope_description, conditions } = body;

    if (!client_id || !quote_date) {
      return NextResponse.json(
        { success: false, error: 'client_id and quote_date are required' },
        { status: 400 }
      );
    }

    // Generate quote number
    const dateStr = format(new Date(quote_date), 'yyMMdd');
    const countResult = await client`
      SELECT COUNT(*) as count FROM quotes WHERE quote_date = ${quote_date}
    `;
    const quoteNum = String(countResult[0].count + 1).padStart(3, '0');
    const quote_number = `NP-${dateStr}-${quoteNum}`;

    const quoteDate = new Date(quote_date);
    const expiryDate = addDays(quoteDate, validity_days);

    const results = await client`
      INSERT INTO quotes (
        quote_number, client_id, created_by_id, quote_date, 
        validity_days, expiry_date, scope_description, conditions
      ) VALUES (
        ${quote_number}, ${client_id}, ${auth.user_id}, ${quote_date},
        ${validity_days}, ${format(expiryDate, 'yyyy-MM-dd')}, ${scope_description}, ${conditions}
      )
      RETURNING *
    `;

    const quote = results[0];
    return NextResponse.json({
      success: true,
      data: {
        ...quote,
        lines: [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
