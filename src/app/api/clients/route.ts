import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { Client, ApiResponse, PaginatedResponse } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<PaginatedResponse<Client>>> {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, data: [], total: 0, page: 1, per_page: 0, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const search = searchParams.get('search');

    const offset = (page - 1) * perPage;

    let clients: Client[];
    let total: number;

    if (search) {
      const results = await client`
        SELECT * FROM clients
        WHERE name ILIKE ${'%' + search + '%'}
           OR email ILIKE ${'%' + search + '%'}
           OR phone ILIKE ${'%' + search + '%'}
        ORDER BY name ASC
        LIMIT ${perPage} OFFSET ${offset}
      `;
      clients = results;

      const countResult = await client`
        SELECT COUNT(*) as count FROM clients
        WHERE name ILIKE ${'%' + search + '%'}
           OR email ILIKE ${'%' + search + '%'}
           OR phone ILIKE ${'%' + search + '%'}
      `;
      total = countResult[0].count;
    } else {
      clients = await client`
        SELECT * FROM clients
        ORDER BY name ASC
        LIMIT ${perPage} OFFSET ${offset}
      `;

      const countResult = await client`SELECT COUNT(*) as count FROM clients`;
      total = countResult[0].count;
    }

    return NextResponse.json({
      success: true,
      data: clients,
      total,
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

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Client>>> {
  try {
    const auth = verifyAuth(request);
    if (!auth || !['owner', 'office'].includes(auth.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, phone, address, suburb, postcode, state, notes } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const results = await client`
      INSERT INTO clients (name, email, phone, address, suburb, postcode, state, notes)
      VALUES (${name}, ${email}, ${phone}, ${address}, ${suburb}, ${postcode}, ${state}, ${notes})
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: results[0],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
