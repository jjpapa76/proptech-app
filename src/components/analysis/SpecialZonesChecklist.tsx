import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface SpecialZonesChecklistProps {
    zones: {
        mountain: any[];
        heritage: any[];
        farmland?: any[];
        environment?: any[];
        military?: any[];
        education?: boolean; // Changed to boolean
        districtPlan?: boolean; // New
        culturalCheck?: boolean; // New flag from regulations
    };
}

const SpecialZonesChecklist: React.FC<SpecialZonesChecklistProps> = ({ zones }) => {
    const checkList = [
        { label: '산지 (보전/준보전)', data: zones.mountain, isBool: false, critical: true },
        { label: '농지 (진흥/보호)', data: zones.farmland, isBool: false, critical: true },
        { label: '문화재보호구역', data: zones.heritage, isBool: false, critical: true, fallbackBool: zones.culturalCheck },
        { label: '지구단위계획구역', data: zones.districtPlan, isBool: true, critical: false },
        { label: '교육환경보호구역', data: zones.education, isBool: true, critical: false },
        { label: '군사시설보호구역', data: zones.military, isBool: false, critical: false },
    ];

    return (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-400" />
                특수 구역 체크리스트
            </h3>
            <div className="grid grid-cols-2 gap-2">
                {checkList.map((item, idx) => {
                    // Determine if issue exists based on array length or boolean flag
                    let hasIssue = false;
                    let detailText = '';

                    if (item.isBool) {
                        hasIssue = !!item.data;
                        detailText = hasIssue ? '해당 구역 포함' : '';
                    } else {
                        hasIssue = (Array.isArray(item.data) && item.data.length > 0) || !!item.fallbackBool;
                        if (Array.isArray(item.data) && item.data.length > 0) {
                            detailText = item.data[0]?.mtgNm || item.data[0]?.ccbaMnm1 || '규제 지역 포함';
                        } else if (item.fallbackBool) {
                            detailText = '규제 지역 포함 (토지이용계획)';
                        }
                    }

                    return (
                        <div key={idx} className={`p-2 rounded border ${hasIssue ? 'bg-red-900/20 border-red-500/50' : 'bg-gray-700/30 border-gray-700/50'}`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-bold ${hasIssue ? 'text-red-300' : 'text-gray-400'}`}>
                                    {item.label}
                                </span>
                                {hasIssue ? (
                                    <AlertTriangle size={12} className="text-red-400" />
                                ) : (
                                    <CheckCircle size={12} className="text-green-500/50" />
                                )}
                            </div>
                            {hasIssue && (
                                <div className="text-[10px] text-red-200 mt-1 truncate">
                                    {detailText}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SpecialZonesChecklist;
