import { NextRequest, NextResponse } from 'next/server';
import { getCommercialAreaInfo, getBuildingPermitInfo, getUnsoldHousingInfo } from '@/lib/api/public_data';

function parsePnu(pnu: string) {
    if (!pnu || pnu.length !== 19) return null;
    return {
        sigunguCd: pnu.substring(0, 5),
    };
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const pnu = searchParams.get('pnu');

    if (!pnu) {
        return NextResponse.json({ error: 'PNU parameter is required' }, { status: 400 });
    }

    const pnuData = parsePnu(pnu);
    if (!pnuData) {
        return NextResponse.json({ error: 'Invalid PNU' }, { status: 400 });
    }

    try {
        const [commercial, permit, unsold] = await Promise.all([
            getCommercialAreaInfo(pnu),
            getBuildingPermitInfo(pnu),
            getUnsoldHousingInfo(pnuData.sigunguCd),
        ]);

        return NextResponse.json({
            commercial,
            permit,
            unsold,
        });
    } catch (error: any) {
        console.error('Business/Risk API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
