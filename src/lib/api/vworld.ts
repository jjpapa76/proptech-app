import axios from 'axios';

const VWORLD_API_KEY = process.env.NEXT_PUBLIC_VWORLD_API_KEY;
const VWORLD_SEARCH_URL = 'https://api.vworld.kr/req/search';

export interface VWorldSearchResult {
  id: string; // PNU code usually comes in 'id' or specific field depending on response
  title: string; // Address string
  road: string; // Road address
  parcel: string; // Parcel address
  point: {
    x: string; // Longitude
    y: string; // Latitude
  };
}

export interface VWorldResponse {
  response: {
    service: {
      name: string;
      version: string;
      operation: string;
      time: string;
    };
    status: string;
    record: {
      total: string;
      current: string;
    };
    page: {
      total: string;
      current: string;
      size: string;
    };
    result?: {
      crs: string;
      items: Array<{
        id: string; // This is the PNU for address search
        address: {
          zipcode: string;
          category: string;
          road: string;
          parcel: string;
          bldnm: string;
          bldnmdc: string;
        };
        point: {
          x: string;
          y: string;
        };
      }>;
    };
    error?: {
      level: string;
      code: string;
      text: string;
    }
  };
}

export async function searchAddress(query: string): Promise<VWorldSearchResult[]> {
  if (!VWORLD_API_KEY) {
    console.error('V-World API Key is missing');
    throw new Error('V-World API Key is not configured');
  }

  const fetchCategory = async (category: 'ROAD' | 'PARCEL') => {
    try {
      const response = await axios.get<VWorldResponse>(VWORLD_SEARCH_URL, {
        params: {
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
        },
      });

      if (response.data.response.status !== 'OK') {
        if (response.data.response.status === 'NOT_FOUND') {
          return [];
        }
        // Throw error to be caught by the caller
        const errorMsg = response.data.response.error?.text || 'Unknown V-World API Error';
        throw new Error(errorMsg);
      }

      return response.data.response.result?.items || [];
    } catch (error) {
      console.error(`V-World Search API Error (${category}):`, error);
      throw error;
    }
  };

  try {
    const [roadItems, parcelItems] = await Promise.all([
      fetchCategory('ROAD'),
      fetchCategory('PARCEL'),
    ]);

    const allItems = [...roadItems, ...parcelItems];

    // Deduplicate by ID (PNU) if necessary, though usually they might differ slightly or be same.
    // Let's just return all for now, or deduplicate by ID.
    const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());

    return uniqueItems.map((item) => ({
      id: item.id, // PNU Code
      title: item.address.road || item.address.parcel,
      road: item.address.road,
      parcel: item.address.parcel,
      point: item.point,
    }));
  } catch (error) {
    console.error('V-World Search API Error:', error);
    throw error;
  }
}
