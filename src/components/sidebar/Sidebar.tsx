import React, { useState } from 'react';
import axios from 'axios';
import { Search, MapPin, Building2, Map as MapIcon, AlertTriangle } from 'lucide-react';
import DiagnosisCard, { RiskLevel } from '../analysis/DiagnosisCard';
import RegulationTab from '../analysis/RegulationTab';
import BusinessChart from '../analysis/BusinessChart';
import ProfitabilityCalculator from '../analysis/ProfitabilityCalculator';
import PermissibleActsList from '../analysis/PermissibleActsList';
import SpecialZonesChecklist from '../analysis/SpecialZonesChecklist';
import { analyzePermissibleActs } from '@/lib/analysis/permissible_acts';
import { LayerDefinition } from '../map/layerConfig';
import { MARKET_INDICATORS } from '@/constants/market_data';
import { useRoadAnalysis } from '@/hooks/useRoadAnalysis';

interface SidebarProps {
    onSelectLocation: (center: { x: number; y: number }, pnu: string) => void;
    onUpdateLayers?: (layers: LayerDefinition[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectLocation, onUpdateLayers }) => {
    const [activeTab, setActiveTab] = useState('basic');
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<any>(null);
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [permissibleActs, setPermissibleActs] = useState<any[]>([]);

    // GIS Road Analysis Hook
    const { result: roadAnalysis, loading: roadLoading } = useRoadAnalysis(selectedAddress?.id || null);

    const handleSearch = async () => {
        if (!query) return;
        setLoading(true);
        try {
            const res = await axios.get(`/api/vworld/search?query=${query}`);
            setSearchResults(res.data.results);
            if (res.data.results.length === 0) {
                alert('검색 결과가 없습니다.');
            }
        } catch (error: any) {
            console.error('Search failed:', error);
            const errorMsg = error.response?.data?.error || '검색 중 오류가 발생했습니다.';
            alert(`검색 실패: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectResult = async (result: any) => {
        setSelectedAddress(result);
        setSearchResults([]);
        setQuery(result.title);
        onSelectLocation({ x: Number(result.point.x), y: Number(result.point.y) }, result.id);

        setLoading(true);
        try {
            const pnu = result.id;
            console.log('Fetching comprehensive data for PNU:', pnu);

            // Call the new Aggregator API
            const response = await axios.get(`/api/land/comprehensive?pnu=${pnu}`);
            const data = response.data;

            console.log('Comprehensive Data Received:', data);

            setAnalysisData(data);

            // Analyze Permissible Acts
            if (data.regulations?.restrictions) {
                const acts = analyzePermissibleActs(data.regulations.restrictions);
                setPermissibleActs(acts);
            }

        } catch (error: any) {
            console.error('Analysis failed:', error);
            alert('데이터 분석 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const calculateDiagnosis = () => {
        if (!analysisData) return { level: 'SAFE' as RiskLevel, score: 0, summary: '', details: [], swot: { s: [], w: [], o: [], t: [] } };

        let score = 85;
        const details: string[] = [];
        let level: RiskLevel = 'SAFE';
        const swot = {
            s: ['기반시설 양호', '교통 접근성 우수'],
            w: [] as string[],
            o: ['주변 개발 호재', '지가 상승 여력 보유'],
            t: [] as string[],
        };

        const regulations = analysisData.regulations?.restrictions || [];
        const restricted = regulations.some((r: any) => r.luseLawNm && r.luseLawNm.includes('개발제한구역'));

        if (restricted) {
            score -= 30;
            details.push('개발제한구역 포함 (건축 제한)');
            swot.t.push('개발제한구역으로 인한 행위 제한');
            level = 'DANGER';
        } else {
            swot.s.push('건축 규제 사항 적음');
        }

        // Additional Logic for Special Zones
        if (analysisData.specialZones?.mountain?.length > 0) {
            details.push('산지 구역 포함 (산지전용 허가 필요)');
            swot.w.push('경사도 및 산지 규제 검토 필요');
        }

        if (MARKET_INDICATORS.PF_INTEREST_RATE > 8.0) {
            score -= 10;
            details.push(`높은 PF 금리 (${MARKET_INDICATORS.PF_INTEREST_RATE}%) - 금융 비용 부담`);
            swot.t.push('고금리 기조로 인한 금융 비용 증가');
            if (level === 'SAFE') level = 'CAUTION';
        }

        const prices = analysisData.basic?.price || [];
        if (prices.length > 1 && prices[0].indivOalp < prices[1].indivOalp) {
            score -= 5;
            details.push('공시지가 하락 추세');
            swot.w.push('최근 공시지가 하락세');
            if (level === 'SAFE') level = 'CAUTION';
        } else {
            swot.s.push('지가 안정적 유지');
        }

        const summary = level === 'SAFE'
            ? '전반적으로 양호한 입지입니다. 개발 가능성이 높으며, 투자 가치가 충분합니다.'
            : level === 'CAUTION'
                ? '일부 규제 사항 및 시장 위험이 존재하므로, 신중한 검토가 필요합니다.'
                : '개발이 제한되거나 사업성이 낮은 위험 지역입니다. 전문가 상담이 필수적입니다.';

        return { level, score, summary, details, swot };
    };

    const diagnosis = calculateDiagnosis();

    return (
        <div className="w-full h-full flex flex-col bg-gray-900 text-white">
            {/* Header / Search Area */}
            <div className="p-4 border-b border-gray-800 relative">
                <h1 className="text-xl font-bold mb-4 text-blue-400">부동산 입지 분석</h1>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="주소 검색 (예: 판교역로 235)"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                        onClick={handleSearch}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded transition-colors"
                    >
                        <Search size={18} />
                    </button>
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute z-50 left-4 right-4 mt-2 bg-gray-800 border border-gray-700 rounded shadow-xl max-h-60 overflow-y-auto">
                        {searchResults.map((result) => (
                            <div
                                key={result.id}
                                onClick={() => handleSelectResult(result)}
                                className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-0"
                            >
                                <div className="font-bold text-white">{result.title}</div>
                                <div className="text-xs text-gray-400">{result.road}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800">
                {['basic', 'regulation', 'building', 'analysis'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab
                            ? 'text-blue-400 border-b-2 border-blue-400'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        {tab === 'basic' && '기본정보'}
                        {tab === 'regulation' && '규제/토지'}
                        {tab === 'building' && '건물/가격'}
                        {tab === 'analysis' && '사업성'}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {loading ? (
                    <div className="text-center text-gray-400 mt-10">데이터 분석 중...</div>
                ) : !selectedAddress ? (
                    <div className="p-4 bg-gray-800 rounded-lg text-center">
                        <p className="text-gray-400">주소를 검색하여 분석을 시작하세요.</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'basic' && analysisData && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <DiagnosisCard
                                    level={diagnosis.level}
                                    score={diagnosis.score}
                                    summary={diagnosis.summary}
                                    details={diagnosis.details}
                                />

                                {/* Basic Info Card with Land Characteristics */}
                                <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 shadow-lg">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <MapPin size={20} className="text-blue-400" />
                                        기본 정보
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="col-span-2 bg-gray-700/30 p-3 rounded border border-gray-700/50">
                                            <span className="text-gray-400 block text-xs mb-1">주소</span>
                                            <span className="text-white font-medium">{selectedAddress.title}</span>
                                        </div>

                                        <div className="bg-gray-700/30 p-3 rounded border border-gray-700/50">
                                            <span className="text-gray-400 block text-xs mb-1">지목</span>
                                            <span className="text-white font-medium">{analysisData?.basic?.landUse?.lndcNm || '-'}</span>
                                        </div>
                                        <div className="bg-gray-700/30 p-3 rounded border border-gray-700/50">
                                            <span className="text-gray-400 block text-xs mb-1">면적</span>
                                            <span className="text-white font-medium">
                                                {analysisData?.basic?.landUse?.ar?.toLocaleString()} m²
                                                <span className="text-gray-500 text-xs ml-1">
                                                    ({Math.round((analysisData?.basic?.landUse?.ar || 0) * 0.3025).toLocaleString()}평)
                                                </span>
                                            </span>
                                        </div>

                                        <div className="col-span-2 bg-gray-700/30 p-3 rounded border border-gray-700/50">
                                            <span className="text-gray-400 block text-xs mb-1">공시지가 (2024)</span>
                                            <span className="text-white font-medium text-lg">
                                                {analysisData?.basic?.landUse?.indivOalp?.toLocaleString()} 원/m²
                                            </span>
                                        </div>
                                    </div>

                                    {/* Detailed Land Characteristics */}
                                    <div className="mt-4 pt-4 border-t border-gray-700">
                                        <h4 className="text-sm font-bold text-gray-300 mb-3">토지 특성 정보 (국토교통부)</h4>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex justify-between p-2 bg-gray-900/50 rounded">
                                                <span className="text-gray-500">용도지역</span>
                                                <span className="text-gray-300 font-medium text-right">{analysisData?.basic?.landUse?.luseLawNm?.split(',')[0] || '-'}</span>
                                            </div>
                                            <div className="flex justify-between p-2 bg-gray-900/50 rounded">
                                                <span className="text-gray-500">토지이용상황</span>
                                                <span className="text-gray-300 font-medium text-right">{analysisData?.basic?.landChar?.lndSeCdNm || '-'}</span>
                                            </div>
                                            <div className="flex justify-between p-2 bg-gray-900/50 rounded">
                                                <span className="text-gray-500">지형고저</span>
                                                <span className="text-gray-300 font-medium text-right">{analysisData?.basic?.landChar?.tpgrphPitcSeCdNm || '-'}</span>
                                            </div>
                                            <div className="flex justify-between p-2 bg-gray-900/50 rounded">
                                                <span className="text-gray-500">지형형상</span>
                                                <span className="text-gray-300 font-medium text-right">{analysisData?.basic?.landChar?.tpgrphFrmSeCdNm || '-'}</span>
                                            </div>
                                            <div className="flex justify-between p-2 bg-gray-900/50 rounded items-center">
                                                <span className="text-gray-500">도로접면</span>
                                                <div className="text-right">
                                                    <span className="text-gray-300 font-medium block">
                                                        {analysisData?.basic?.landChar?.roadSideSeCdNm || '-'}
                                                    </span>
                                                    {/* Blind Land Warning */}
                                                    {(analysisData?.basic?.landChar?.roadSideSeCdNm?.includes('맹지') || (roadAnalysis && !roadAnalysis.isConnected)) && (
                                                        <span className="text-red-400 font-bold text-[10px] flex items-center justify-end gap-1 mt-1">
                                                            <AlertTriangle size={10} />
                                                            맹지 주의
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Road Analysis Section */}
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                                        <MapIcon size={18} className="text-blue-400" />
                                        도로 분석 (GIS & 공공데이터)
                                    </h3>
                                    {roadLoading ? (
                                        <div className="text-xs text-gray-500">도로 정보 분석 중...</div>
                                    ) : (
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">도로 접합 여부</span>
                                                <div className="text-right">
                                                    <span className={roadAnalysis?.isConnected ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                                        {roadAnalysis?.isConnected ? '접합 (GIS 분석)' : '맹지 가능성 (GIS 분석)'}
                                                    </span>
                                                    {analysisData?.basic?.landChar?.roadSideSeCdNm && (
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            대장상: {analysisData.basic.landChar.roadSideSeCdNm}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">인접 도로 폭</span>
                                                <span className="text-white">{roadAnalysis?.roadWidth || '정보 없음'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">도로명</span>
                                                <span className="text-white">{roadAnalysis?.roadName || '-'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Detailed Report Section */}
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <h3 className="text-white font-bold mb-4">상세 분석 리포트</h3>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-gray-700/50 p-3 rounded">
                                            <h4 className="text-blue-400 text-sm font-bold mb-2">강점 (Strength)</h4>
                                            <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                                                {diagnosis.swot.s.map((item, i) => <li key={i}>{item}</li>)}
                                            </ul>
                                        </div>
                                        <div className="bg-gray-700/50 p-3 rounded">
                                            <h4 className="text-red-400 text-sm font-bold mb-2">약점 (Weakness)</h4>
                                            <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                                                {diagnosis.swot.w.map((item, i) => <li key={i}>{item}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'regulation' && analysisData && (
                            <div className="space-y-6">
                                <SpecialZonesChecklist zones={analysisData.specialZones} />
                                <PermissibleActsList
                                    acts={permissibleActs}
                                    landChar={analysisData.basic.landChar}
                                />
                                <RegulationTab
                                    landUse={analysisData.basic.landUse}
                                    regulations={analysisData.regulations.restrictions}
                                    urbPlan={analysisData.regulations.urbanPlan}
                                    selectedLocation={selectedAddress ? { x: Number(selectedAddress.point.x), y: Number(selectedAddress.point.y) } : undefined}
                                />
                            </div>
                        )}

                        {activeTab === 'building' && analysisData && (
                            <div className="space-y-6">
                                <BusinessChart data={analysisData.basic.price} />
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <h3 className="text-white font-bold mb-3">건축물 대장 요약</h3>
                                    {analysisData.building && analysisData.building.length > 0 ? (
                                        <div className="text-sm text-gray-300 space-y-2">
                                            {analysisData.building.map((b: any, idx: number) => (
                                                <div key={idx} className="border-b border-gray-700 pb-2 last:border-0">
                                                    <p><span className="text-gray-500">건물명:</span> {b.bldNm || '이름 없음'}</p>
                                                    <p><span className="text-gray-500">주용도:</span> {b.mainPurpsCdNm}</p>
                                                    <p><span className="text-gray-500">연면적:</span> {b.totArea} m²</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">건물 정보가 없습니다.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'analysis' && (
                            <ProfitabilityCalculator
                                landArea={analysisData?.basic?.landUse?.ar || 0}
                                officialPrice={analysisData?.basic?.landUse?.indivOalp || 0}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
