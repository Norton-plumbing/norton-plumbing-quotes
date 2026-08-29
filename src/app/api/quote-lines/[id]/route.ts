import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { QuoteLine, ApiResponse } from '@/types';
import { calculateLineAmounts, calculateQuoteTotals } from '@/lib/calculations';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<QuoteLine>>> {
  try {
    const auth = verifyAuth(request);
    if (!auth || !['owner', 'office', 'estimator', 'field'].includes(auth.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { quote_id, quantity, unit_cost_ex_gst, markup_percent, description } = body;

    // Calculate new amounts
    const lineData = {
      quantity,
      unit_cost_ex_gst,
      markup_percent,
    };
    const amounts = calculateLineAmounts(lineData);

    const results = await client`
      UPDATE quote_lines
      SET
        quantity = ${quantity},
        unit_cost_ex_gst = ${unit_cost_ex_gst},
        markup_percent = ${markup_percent},
        description = ${description},
        line_total_cost = ${amounts.line_total_cost},
        selling_price_ex_gst = ${amounts.selling_price_ex_gst},
        gst = ${amounts.gst},
        selling_price_inc_gst = ${amounts.selling_price_inc_gst},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id}
      RETURNING *
    `;

    if (results.length === 0) {
      return NextResponse.json({ success: false, error: 'Line not found' }, { status: 404 });
    }

    // Recalculate quote totals
    const lines = await client`SELECT * FROM quote_lines WHERE quote_id = ${quote_id}`;
    const totals = calculateQuoteTotals(lines);

    await client`
      UPDATE quotes
      SET
        direct_job_cost = ${totals.direct_job_cost},
        quote_ex_gst = ${totals.quote_ex_gst},
        gst_total = ${totals.gst_total},
        client_total = ${totals.client_total},
        gross_profit = ${totals.gross_profit},
        gross_margin_percent = ${totals.gross_margin_percent},
        margin_health = ${totals.margin_health},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${quote_id}
    `;

    return NextResponse.json({
      success: true,
      data: results[0],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const auth = verifyAuth(request);
    if (!auth || !['owner', 'office', 'estimator'].includes(auth.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const line = await client`SELECT quote_id FROM quote_lines WHERE id = ${params.id}`;
    if (line.length === 0) {
      return NextResponse.json({ success: false, error: 'Line not found' }, { status: 404 });
    }

    const quote_id = line[0].quote_id;

    await client`DELETE FROM quote_lines WHERE id = ${params.id}`;

    // Recalculate quote totals
    const lines = await client`SELECT * FROM quote_lines WHERE quote_id = ${quote_id}`;
    const totals = calculateQuoteTotals(lines);

    await client`
      UPDATE quotes
      SET
        direct_job_cost = ${totals.direct_job_cost},
        quote_ex_gst = ${totals.quote_ex_gst},
        gst_total = ${totals.gst_total},
        client_total = ${totals.client_total},
        gross_profit = ${totals.gross_profit},
        gross_margin_percent = ${totals.gross_margin_percent},
        margin_health = ${totals.margin_health},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${quote_id}
    `;

    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
