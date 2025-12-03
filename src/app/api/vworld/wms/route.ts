import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const VWORLD_API_KEY = process.env.NEXT_PUBLIC_VWORLD_API_KEY;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    if (!VWORLD_API_KEY) {
        return NextResponse.json({ error: 'V-World API Key is missing' }, { status: 500 });
    }

    try {
        const params: any = {};
        searchParams.forEach((value, key) => {
            params[key] = value;
        });

        // Ensure key is present
        params.KEY = VWORLD_API_KEY;
        params.DOMAIN = 'localhost';

        const queryParams = new URLSearchParams(params);
        const url = `https://api.vworld.kr/req/wms?${queryParams.toString()}`;

        const response = await axios.get(url, {
            responseType: 'arraybuffer'
        });

        const contentType = response.headers['content-type'];

        return new NextResponse(response.data, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400'
            }
        });
    } catch (error: any) {
        console.error('[WMS Proxy] Error:', error.message);
        return NextResponse.json(
            { error: 'Failed to fetch WMS data' },
            { status: 500 }
        );
    }
}
