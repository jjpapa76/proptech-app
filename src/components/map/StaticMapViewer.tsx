'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';

interface StaticMapViewerProps {
    center: { x: number; y: number }; // Longitude, Latitude
    address: string;
}

const VWORLD_API_KEY = process.env.NEXT_PUBLIC_VWORLD_API_KEY;

const StaticMapViewer: React.FC<StaticMapViewerProps> = ({ center, address }) => {
    const [loading, setLoading] = useState(false);

    // Calculate BBOX for ~200m width
    // 0.002 degrees is roughly 200m
    const delta = 0.002;
    const minx = center.x - delta;
    const miny = center.y - delta;
    const maxx = center.x + delta;
    const maxy = center.y + delta;
    const bbox = `${minx},${miny},${maxx},${maxy}`;

    // Layers: Cadastral + Zoning
    const layers = 'lp_pa_cbnd_bubun,lp_pa_cbnd_bonbun,lt_c_uq111';

    const imageUrl = `https://api.vworld.kr/req/wms?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${layers}&STYLES=,&CRS=EPSG:4326&BBOX=${bbox}&WIDTH=600&HEIGHT=600&FORMAT=image/png&TRANSPARENT=false&BGCOLOR=0xFFFFFF&KEY=${VWORLD_API_KEY}&DOMAIN=${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`;

    const handleDownload = async () => {
        setLoading(true);
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${address}_토지이용도면.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            alert('도면 다운로드에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (!VWORLD_API_KEY) return <div>API Key Missing</div>;

    return (
        <div className="flex flex-col items-center gap-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
            <div className="w-full flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-white">토지이용계획 도면 (정적 뷰)</h3>
                <button
                    onClick={handleDownload}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
                >
                    <Download size={16} />
                    {loading ? '다운로드 중...' : '이미지 저장'}
                </button>
            </div>

            <div className="relative w-[600px] h-[600px] bg-white rounded overflow-hidden border border-gray-600">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imageUrl}
                    alt="Land Use Plan Map"
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-white/80 px-2 py-1 text-xs text-black rounded">
                    V-World
                </div>
            </div>

            <p className="text-sm text-gray-400">
                * 본 도면은 참고용이며 법적 효력이 없습니다. (출처: 브이월드)
            </p>
        </div>
    );
};

export default StaticMapViewer;
