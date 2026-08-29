import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { QuoteLine, ApiResponse } from '@/types';
import { calculateLineAmounts, calculateQuoteTotals } from '@/lib/calculations';

interface CreateQuoteLineRequest {
  quote_id: string;
  type: string;
  description: string;
  quantity: string;
  unit: string;
  unit_cost_ex_gst: string;
  markup_percent: string;
  material_id?: string;
  notes?: string;
  optional?: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<QuoteLine>>> {
  try {
    const auth = verifyAuth(request);
    if (!auth || !['owner', 'office', 'estimator', 'field'].includes(auth.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateQuoteLineRequest = await request.json();
    const {
      quote_id,
      type,
      description,
      quantity,
      unit,
      unit_cost_ex_gst,
      markup_percent,
      material_id,
      notes,
      optional = false,
    } = body;

    // Validate required fields
    if (!quote_id || !type || !description || !quantity || !unit || !unit_cost_ex_gst || !markup_percent) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate line amounts
    const lineData = {
      quantity,
      unit_cost_ex_gst,
      markup_percent,
    };
    const amounts = calculateLineAmounts(lineData);

    // Get next line number
    const lineCountResult = await client`
      SELECT COUNT(*) as count FROM quote_lines WHERE quote_id = ${quote_id}
    `;
    const lineNumber = (lineCountResult[0].count || 0) + 1;

    // Insert line
    const results = await client`
      INSERT INTO quote_lines (
        quote_id, line_number, type, description, quantity, unit,
        unit_cost_ex_gst, markup_percent, line_total_cost,
        selling_price_ex_gst, gst, selling_price_inc_gst,
        material_id, notes, optional
      ) VALUES (
        ${quote_id}, ${lineNumber}, ${type}, ${description}, ${quantity}, ${unit},
        ${unit_cost_ex_gst}, ${markup_percent}, ${amounts.line_total_cost},
        ${amounts.selling_price_ex_gst}, ${amounts.gst}, ${amounts.selling_price_inc_gst},
        ${material_id || null}, ${notes || null}, ${optional}
      )
      RETURNING *
    `;

    // Recalculate quote totals
    const lines = await client`SELECT * FROM quote_lines WHERE quote_id = ${quote_id}`;
    const totals = calculateQuoteTotals(lines);

    // Update quote with new totals
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

    // Log audit
    await client`
      INSERT INTO quote_audit (quote_id, changed_by_id, field_name, new_value)
      VALUES (${quote_id}, ${auth.user_id}, 'line_added', ${description})
    `;

    return NextResponse.json({
      success: true,
      data: results[0],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
