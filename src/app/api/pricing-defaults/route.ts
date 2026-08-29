import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { ApiResponse, PricingDefaults } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<PricingDefaults>>> {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const results = await client`
      SELECT * FROM pricing_defaults ORDER BY updated_at DESC LIMIT 1
    `;

    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No pricing defaults found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: results[0],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<PricingDefaults>>> {
  try {
    const auth = verifyAuth(request);
    if (!auth || auth.role !== 'owner') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      plumber_cost_per_hour,
      plumber_sell_rate_per_hour,
      apprentice_cost_per_hour,
      apprentice_sell_rate_per_hour,
      material_markup_percent,
      subcontractor_markup_percent,
      equipment_markup_percent,
    } = body;

    const results = await client`
      INSERT INTO pricing_defaults (
        plumber_cost_per_hour,
        plumber_sell_rate_per_hour,
        apprentice_cost_per_hour,
        apprentice_sell_rate_per_hour,
        material_markup_percent,
        subcontractor_markup_percent,
        equipment_markup_percent,
        updated_by_id
      ) VALUES (
        ${plumber_cost_per_hour},
        ${plumber_sell_rate_per_hour},
        ${apprentice_cost_per_hour || null},
        ${apprentice_sell_rate_per_hour || null},
        ${material_markup_percent},
        ${subcontractor_markup_percent},
        ${equipment_markup_percent},
        ${auth.user_id}
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: results[0],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
