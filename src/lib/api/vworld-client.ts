import { jsonp } from './jsonp';

const VWORLD_API_KEY = process.env.NEXT_PUBLIC_VWORLD_API_KEY;
const VWORLD_SEARCH_URL = 'https://api.vworld.kr/req/search';

export interface VWorldSearchResult {
    id: string;
    title: string;
    road: string;
    parcel: string;
    point: {
        x: string;
        y: string;
    };
}

interface VWorldResponse {
    response: {
        status: string;
        result?: {
            items: Array<{
                id: string;
                address: {
                    road: string;
                    parcel: string;
                };
                point: {
                    x: string;
                    y: string;
                };
            }>;
        };
        error?: {
            text: string;
        };
    };
}

export async function searchAddressClient(query: string): Promise<VWorldSearchResult[]> {
    if (!VWORLD_API_KEY) {
        throw new Error('V-World API Key is not configured');
    }

    const fetchCategory = async (category: 'ROAD' | 'PARCEL') => {
        try {
            const response = await jsonp<VWorldResponse>(VWORLD_SEARCH_URL, {
                service: 'search',
                request: 'search',
                version: '2.0',
                crs: 'EPSG:4326',
                size: '10',
                page: '1',
                query: query,
                type: 'ADDRESS',
                category: category,
                format: 'json',
                errorformat: 'json',
                key: VWORLD_API_KEY,
            });

            if (response.response.status !== 'OK') {
                if (response.response.status === 'NOT_FOUND') {
                    return [];
                }
                throw new Error(response.response.error?.text || 'Unknown V-World API Error');
            }

            return response.response.result?.items || [];
        } catch (error) {
            console.error(`V-World Client Search Error (${category}):`, error);
            // We might want to rethrow or return empty, but for now let's throw to be consistent with previous fix
            throw error;
        }
    };

    try {
        const [roadItems, parcelItems] = await Promise.all([
            fetchCategory('ROAD'),
            fetchCategory('PARCEL'),
        ]);

        const allItems = [...roadItems, ...parcelItems];

        // Deduplicate
        const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());

        return uniqueItems.map((item) => ({
            id: item.id,
            title: item.address.road || item.address.parcel,
            road: item.address.road,
            parcel: item.address.parcel,
            point: item.point,
        }));
    } catch (error) {
        console.error('V-World Client Search Error:', error);
        throw error;
    }
}
