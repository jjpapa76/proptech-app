import { NextRequest, NextResponse } from 'next/server';
import { getBrTitleInfo, getIndivOalp } from '@/lib/api/public_data';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const pnu = searchParams.get('pnu');

    if (!pnu) {
        return NextResponse.json({ error: 'PNU parameter is required' }, { status: 400 });
    }

    try {
        const [building, price] = await Promise.all([
            getBrTitleInfo(pnu),
            getIndivOalp(pnu),
        ]);

        return NextResponse.json({
            building,
            price,
        });
    } catch (error: any) {
        console.error('Building Info API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
