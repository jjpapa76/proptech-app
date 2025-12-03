import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const VWORLD_API_KEY = process.env.NEXT_PUBLIC_VWORLD_API_KEY;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const pnu = searchParams.get('pnu');
    const typeName = searchParams.get('typeName') || 'lp_pa_cbnd_bubun'; // Default to cadastral
    const bbox = searchParams.get('bbox');
    const propertyName = searchParams.get('propertyName');

    if (!VWORLD_API_KEY) {
        return NextResponse.json({ error: 'V-World API Key is missing' }, { status: 500 });
    }

    try {
        const params: any = {
            SERVICE: 'WFS',
            REQUEST: 'GetFeature',
            TYPENAME: typeName,
            OUTPUT: 'application/json',
            VERSION: '1.1.0',
            KEY: VWORLD_API_KEY,
            DOMAIN: 'localhost',
        };

        if (pnu) {
            params.MAXFEATURES = '1';
            params.FILTER = `<Filter><PropertyIsEqualTo><PropertyName>pnu</PropertyName><Literal>${pnu}</Literal></PropertyIsEqualTo></Filter>`;
        } else if (searchParams.get('cql_filter')) {
            params.CQL_FILTER = searchParams.get('cql_filter');
        } else if (bbox) {
            params.BBOX = bbox;
            params.SRSNAME = 'EPSG:3857';
            if (propertyName) {
                params.PROPERTYNAME = propertyName;
            }
        } else {
            return NextResponse.json({ error: 'Either pnu, bbox, or cql_filter is required' }, { status: 400 });
        }

        const queryParams = new URLSearchParams(params);
        const url = `https://api.vworld.kr/req/wfs?${queryParams.toString()}`;

        console.log(`[WFS Proxy] Fetching: ${url}`);

        const response = await axios.get(url);

        if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
            console.error('[WFS Proxy] Received XML response instead of JSON:', response.data);
            return NextResponse.json({ error: 'Received XML response from V-World', details: response.data }, { status: 500 });
        }

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('[WFS Proxy] Error Details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: error.config?.url
        });
        return NextResponse.json(
            { error: 'Failed to fetch WFS data', details: error.message, upstreamError: error.response?.data },
            { status: 500 }
        );
    }
}
