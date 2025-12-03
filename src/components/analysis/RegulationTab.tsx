'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const MiniMap = dynamic(() => import('@/components/map/MiniMap'), { ssr: false });

interface RegulationTabProps {
    landUse: any;
    regulations?: any[];
    urbPlan?: any[];
    selectedLocation?: { x: number; y: number };
}

const RegulationTab: React.FC<RegulationTabProps> = ({ landUse, regulations = [], urbPlan = [], selectedLocation }) => {
    if (!landUse) return <div className="text-gray-400 p-4">데이터가 없습니다.</div>;

    // Helper to filter regulations
    const nationalLaws = urbPlan.filter(p => p.type === '용도지역' || p.upisuName?.includes('녹지') || p.upisuName?.includes('주거'));
    const otherLaws = urbPlan.filter(p => p.type !== '용도지역' && p.type !== '도시계획시설' && !p.upisuName?.includes('녹지') && !p.upisuName?.includes('주거'));
    const urbanFacilities = urbPlan.filter(p => p.type === '도시계획시설');

    const VWORLD_KEY = process.env.NEXT_PUBLIC_VWORLD_API_KEY;
    const mapUrl = selectedLocation && VWORLD_KEY
        ? `https://api.vworld.kr/req/image?service=image&request=getmap&key=${VWORLD_KEY}&center=${selectedLocation.x},${selectedLocation.y}&crs=epsg:4326&zoom=17&size=500,300&layers=lp_pa_cbnd_bubun,lt_c_aisru1,lt_c_uq111`
        : null;

    return (
        <div className="space-y-6 font-sans">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-sm">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-600 pb-2 flex items-center gap-2">
                    <span className="text-blue-400">📄</span> 토지이용계획확인서 (요약)
                </h3>

                {/* Table Layout */}
                <div className="border-t border-l border-gray-600 text-sm">
                    {/* Row 1: Address (Mock) / Jimok */}
                    <div className="grid grid-cols-4 border-b border-gray-600">
                        <div className="bg-gray-700/50 p-3 text-gray-300 font-medium border-r border-gray-600 flex items-center justify-center">
                            지목
                        </div>
                        <div className="p-3 text-white border-r border-gray-600 flex items-center">
                            {landUse.lndcNm || '-'}
                        </div>
                        <div className="bg-gray-700/50 p-3 text-gray-300 font-medium border-r border-gray-600 flex items-center justify-center">
                            면적
                        </div>
                        <div className="p-3 text-white flex items-center">
                            {landUse.ar ? `${landUse.ar.toLocaleString()} m²` : '-'}
                        </div>
                    </div>

                    {/* Row 2: Price */}
                    <div className="grid grid-cols-4 border-b border-gray-600">
                        <div className="bg-gray-700/50 p-3 text-gray-300 font-medium border-r border-gray-600 flex items-center justify-center">
                            개별공시지가
                        </div>
                        <div className="col-span-3 p-3 text-white flex items-center">
                            {landUse.indivOalp ? `${landUse.indivOalp.toLocaleString()} 원/m²` : '-'}
                            <span className="text-gray-500 text-xs ml-2">(2024/01 기준)</span>
                        </div>
                    </div>

                    {/* Row 3: National Land Planning Act */}
                    <div className="grid grid-cols-4 border-b border-gray-600">
                        <div className="bg-gray-700/50 p-3 text-gray-300 font-medium border-r border-gray-600 flex items-center justify-center">
                            국토계획법<br />지역·지구
                        </div>
                        <div className="col-span-3 p-3 text-white flex items-center flex-wrap gap-2">
                            {nationalLaws.length > 0 ? (
                                nationalLaws.map((plan, idx) => (
                                    <span key={idx} className="text-blue-300 font-bold">{plan.upisuName || plan.jiyukNm}</span>
                                ))
                            ) : (
                                <span className="text-gray-500">-</span>
                            )}
                        </div>
                    </div>

                    {/* Row 4: Other Laws */}
                    <div className="grid grid-cols-4 border-b border-gray-600">
                        <div className="bg-gray-700/50 p-3 text-gray-300 font-medium border-r border-gray-600 flex items-center justify-center">
                            다른 법령 등<br />지역·지구
                        </div>
                        <div className="col-span-3 p-3 text-white flex items-center flex-wrap gap-2">
                            {otherLaws.length > 0 ? (
                                otherLaws.map((plan, idx) => (
                                    <span key={idx} className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-200">
                                        {plan.upisuName || plan.jiyukNm}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-500">해당 없음</span>
                            )}
                        </div>
                    </div>

                    {/* Row 5: Urban Planning Facilities (New) */}
                    <div className="grid grid-cols-4 border-b border-gray-600">
                        <div className="bg-gray-700/50 p-3 text-gray-300 font-medium border-r border-gray-600 flex items-center justify-center">
                            도시계획시설
                        </div>
                        <div className="col-span-3 p-3 text-white flex items-center flex-wrap gap-2">
                            {urbanFacilities.length > 0 ? (
                                urbanFacilities.map((plan, idx) => (
                                    <span key={idx} className="text-green-400 font-medium">
                                        {plan.upisuName || plan.jiyukNm}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-500">해당 없음</span>
                            )}
                        </div>
                    </div>

                    {/* Row 6: Enforcement Decree (Mock/Placeholder) */}
                    <div className="grid grid-cols-4 border-b border-gray-600">
                        <div className="bg-gray-700/50 p-3 text-gray-300 font-medium border-r border-gray-600 flex items-center justify-center">
                            시행령 부칙<br />추가기재
                        </div>
                        <div className="col-span-3 p-3 text-white flex items-center text-gray-400 text-xs">
                            해당 사항 없음
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Drawing (Map) */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-white font-bold mb-4 border-b border-gray-600 pb-2 flex items-center gap-2">
                    <span className="text-blue-400">🗺️</span> 확인도면
                </h3>
                <div className="w-full h-64 bg-gray-900 rounded overflow-hidden flex items-center justify-center border border-gray-600 relative">
                    {selectedLocation ? (
                        <MiniMap
                            center={selectedLocation}
                            className="w-full h-full"
                        />
                    ) : (
                        <div className="text-gray-500 text-sm">지도를 불러올 수 없습니다.</div>
                    )}
                </div>
            </div>

            {/* Detailed Regulations List */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-white font-bold mb-4 border-b border-gray-600 pb-2">📜 행위제한내용 (상세)</h3>
                <div className="space-y-3">
                    {regulations && regulations.length > 0 ? (
                        regulations.map((reg, idx) => (
                            <div key={idx} className="flex flex-col gap-1 p-3 bg-gray-700/30 rounded border border-gray-700">
                                <span className="font-bold text-blue-400 text-sm">{reg.luseLawNm}</span>
                                <span className="text-gray-200 text-sm">{reg.content || reg.jiyukNm}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm">상세 규제 내역이 없습니다.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegulationTab;
