import { NextResponse } from 'next/server';
import client from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const result = await client`SELECT 1 as ok`;
    
    return NextResponse.json({
      success: true,
      message: 'Platform is healthy',
      database: result.length > 0 ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Health check failed',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
