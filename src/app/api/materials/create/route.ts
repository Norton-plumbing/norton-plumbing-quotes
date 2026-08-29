import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { Material, ApiResponse } from '@/types';
import { calculateMaterialSellingPrice } from '@/lib/calculations';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Material>>> {
  try {
    const auth = verifyAuth(request);
    if (!auth || !['owner', 'office'].includes(auth.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { code, category, description, unit, cost_ex_gst, default_markup, supplier, reece_reference } = body;

    if (!code || !category || !description || !unit || !cost_ex_gst || !default_markup) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const selling_price = calculateMaterialSellingPrice(cost_ex_gst, default_markup);

    const results = await client`
      INSERT INTO materials (
        code, category, description, unit, cost_ex_gst, default_markup,
        selling_price_ex_gst, supplier, reece_reference, active
      ) VALUES (
        ${code}, ${category}, ${description}, ${unit}, ${cost_ex_gst}, ${default_markup},
        ${selling_price}, ${supplier || null}, ${reece_reference || null}, true
      )
      ON CONFLICT (code) DO UPDATE
      SET
        category = ${category},
        description = ${description},
        unit = ${unit},
        cost_ex_gst = ${cost_ex_gst},
        default_markup = ${default_markup},
        selling_price_ex_gst = ${selling_price},
        supplier = ${supplier || null},
        reece_reference = ${reece_reference || null},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    // Log price change
    await client`
      INSERT INTO material_price_history (material_id, cost_ex_gst, default_markup, changed_by_id)
      VALUES (${results[0].id}, ${cost_ex_gst}, ${default_markup}, ${auth.user_id})
    `;

    return NextResponse.json({
      success: true,
      data: results[0],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
