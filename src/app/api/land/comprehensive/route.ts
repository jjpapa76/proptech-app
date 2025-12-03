import { NextRequest, NextResponse } from 'next/server';
import {
    getLandUsePlan,
    getUrbPlanInfo,
    getRegulationInfo,
    getBrTitleInfo,
    getIndivOalp,
    getMountainInfo,
    getCulturalHeritageInfo,
    getLandCharacteristics,
    checkSpecialZones
} from '@/lib/api/public_data';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const pnu = searchParams.get('pnu');

    if (!pnu) {
        return NextResponse.json({ error: 'PNU is required' }, { status: 400 });
    }

    try {
        // Parallel fetching for performance
        const [
            landUse,
            landChar,
            urbanPlan,
            regulations,
            building,
            price,
            mountain,
            heritage
        ] = await Promise.all([
            getLandUsePlan(pnu),
            getLandCharacteristics(pnu),
            getUrbPlanInfo(pnu),
            getRegulationInfo(pnu),
            getBrTitleInfo(pnu),
            getIndivOalp(pnu),
            getMountainInfo(pnu),
            getCulturalHeritageInfo(pnu)
        ]);

        // Check for special zones in regulations
        const additionalZones = checkSpecialZones(regulations);

        // Aggregate results
        const comprehensiveData = {
            basic: {
                landUse,
                landChar,
                price,
            },
            regulations: {
                urbanPlan,
                restrictions: regulations,
            },
            building: building,
            specialZones: {
                mountain,
                heritage,
                education: additionalZones.education,
                districtPlan: additionalZones.districtPlan,
                culturalCheck: additionalZones.cultural, // Flag from regulations
            }
        };

        return NextResponse.json(comprehensiveData);

    } catch (error: any) {
        console.error('Error fetching comprehensive land data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data', details: error.message },
            { status: 500 }
        );
    }
}
