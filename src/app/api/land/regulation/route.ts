import { NextRequest, NextResponse } from 'next/server';
import { getLandUsePlan, getUrbPlanInfo, getRegulationInfo } from '@/lib/api/public_data';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const pnu = searchParams.get('pnu');

    if (!pnu) {
        return NextResponse.json({ error: 'PNU parameter is required' }, { status: 400 });
    }

    try {
        // Parallel Fetching for performance
        const [landUse, urbPlan, regulations] = await Promise.all([
            getLandUsePlan(pnu),
            getUrbPlanInfo(pnu),
            getRegulationInfo(pnu),
        ]);

        return NextResponse.json({
            landUse,
            urbPlan,
            regulations,
        });
    } catch (error: any) {
        console.error('Toji-eum API Route Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
