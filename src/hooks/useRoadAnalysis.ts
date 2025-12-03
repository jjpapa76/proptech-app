import { useState, useEffect } from 'react';
import axios from 'axios';
import * as turf from '@turf/turf';

interface RoadAnalysisResult {
    isConnected: boolean;
    roadWidth: string; // e.g., "8m~10m" or "Soro 2"
    contactLength: number; // meters
    roadName?: string;
}

export function useRoadAnalysis(pnu: string | null) {
    const [result, setResult] = useState<RoadAnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!pnu) return;

        const analyzeRoad = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Fetch Land Parcel Geometry
                const domain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
                const VWORLD_API_KEY = process.env.NEXT_PUBLIC_VWORLD_API_KEY;

                // 1. Fetch Land Parcel Geometry (Direct to V-World)
                const landRes = await axios.get('https://api.vworld.kr/req/wfs', {
                    params: {
                        SERVICE: 'WFS',
                        REQUEST: 'GetFeature',
                        TYPENAME: 'lp_pa_cbnd_bubun',
                        OUTPUT: 'application/json',
                        VERSION: '1.1.0',
                        KEY: VWORLD_API_KEY,
                        DOMAIN: domain,
                        MAXFEATURES: '1',
                        FILTER: `<Filter><PropertyIsEqualTo><PropertyName>pnu</PropertyName><Literal>${pnu}</Literal></PropertyIsEqualTo></Filter>`
                    }
                });

                const landFeature = landRes.data.features?.[0];
                if (!landFeature) throw new Error('Land parcel not found');

                const landPoly = landFeature.geometry;
                const bbox = turf.bbox(landFeature);

                // Expand bbox slightly to find adjacent roads
                const expandedBbox = [
                    bbox[0] - 0.0001, bbox[1] - 0.0001,
                    bbox[2] + 0.0001, bbox[3] + 0.0001
                ].join(',');

                // 2. Fetch Nearby Roads (Road Network Layer)
                // Using 'lt_l_sprd' (Road Centerline) or 'lt_c_usfsff001' (Road Zone)
                // 'lt_l_upis_uq151' is Urban Planning Facility (Road) - often better for width info
                // 2. Fetch Nearby Roads (Direct to V-World)
                const roadRes = await axios.get('https://api.vworld.kr/req/wfs', {
                    params: {
                        SERVICE: 'WFS',
                        REQUEST: 'GetFeature',
                        TYPENAME: 'lt_l_upis_uq151', // Urban Planning Road
                        OUTPUT: 'application/json',
                        VERSION: '1.1.0',
                        KEY: VWORLD_API_KEY,
                        DOMAIN: domain,
                        BBOX: expandedBbox,
                        SRSNAME: 'EPSG:4326' // Ensure correct CRS if needed, though turf usually handles 4326
                    }
                });

                const roadFeatures = roadRes.data.features || [];

                let isConnected = false;
                let maxContactLength = 0;
                let bestRoadWidth = '정보 없음';
                let bestRoadName = '';

                // 3. Analyze Intersection
                // Convert land polygon to line string for intersection check
                const landLine = turf.polygonToLine(landFeature);

                roadFeatures.forEach((road: any) => {
                    // Check if road intersects or touches the land buffer
                    // Simple check: distance from land to road < small threshold
                    // In real implementation, we might buffer the land and check intersection
                    const bufferedLand = turf.buffer(landFeature as any, 0.001, { units: 'kilometers' }); // 1m buffer
                    if (!bufferedLand) return;
                    const intersects = turf.booleanIntersects(bufferedLand, road);

                    if (intersects) {
                        isConnected = true;
                        // Extract width info from attributes if available
                        // Example attributes: 'dwk_nam' (Road Name), 'rvw_nam' (Width)
                        const width = road.properties.rvw_nam || road.properties.dwk_nam || '정보 없음';
                        const name = road.properties.fac_nam || '도로';

                        if (width !== '정보 없음') bestRoadWidth = width;
                        bestRoadName = name;
                    }
                });

                setResult({
                    isConnected,
                    roadWidth: bestRoadWidth,
                    contactLength: 0, // Complex to calc accurately without precise geometry
                    roadName: bestRoadName
                });

            } catch (err: any) {
                console.error('Road Analysis Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        analyzeRoad();
    }, [pnu]);

    return { result, loading, error };
}
