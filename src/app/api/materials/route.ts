import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { Material, PaginatedResponse } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<PaginatedResponse<Material>>> {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, data: [], total: 0, page: 1, per_page: 0, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');

    const offset = (page - 1) * perPage;

    let whereConditions: string[] = ['active = true'];
    const params: any[] = [];

    if (search) {
      whereConditions.push(`(code ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (category) {
      whereConditions.push(`category = $${params.length + 1}`);
      params.push(category);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const materials = await client`
      SELECT * FROM materials
      ${whereClause ? client(whereClause, params) : client``}
      ORDER BY code ASC
      LIMIT ${perPage} OFFSET ${offset}
    `;

    const countResult = await client`
      SELECT COUNT(*) as count FROM materials
      ${whereClause ? client(whereClause, params) : client``}
    `;

    return NextResponse.json({
      success: true,
      data: materials,
      total: countResult[0].count,
      page,
      per_page: perPage,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: [], total: 0, page: 1, per_page: 0, error: error.message },
      { status: 500 }
    );
  }
}
