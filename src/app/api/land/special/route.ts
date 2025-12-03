import { NextRequest, NextResponse } from 'next/server';
import { getMountainInfo, getCulturalHeritageInfo } from '@/lib/api/public_data';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const pnu = searchParams.get('pnu');

    if (!pnu) {
        return NextResponse.json({ error: 'PNU parameter is required' }, { status: 400 });
    }

    try {
        const [mountain, culture] = await Promise.all([
            getMountainInfo(pnu),
            getCulturalHeritageInfo(pnu),
        ]);

        return NextResponse.json({
            mountain,
            culture,
        });
    } catch (error: any) {
        console.error('Special Regulation API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
