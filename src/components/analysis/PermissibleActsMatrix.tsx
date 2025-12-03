import React, { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { PermissibleAct } from '@/lib/analysis/permissible_acts';

interface PermissibleActsMatrixProps {
    acts: PermissibleAct[];
}

const PermissibleActsMatrix: React.FC<PermissibleActsMatrixProps> = ({ acts }) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggleExpand = (idx: number) => {
        setExpandedIndex(expandedIndex === idx ? null : idx);
    };

    return (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Check size={18} className="text-green-400" />
                행위가능여부 (건축물 용도)
            </h3>
            <div className="space-y-2">
                {acts.map((act, idx) => (
                    <div key={idx} className="flex flex-col bg-gray-700/30 rounded border border-gray-700/50 overflow-hidden">
                        <div
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-700/50 transition-colors"
                            onClick={() => toggleExpand(idx)}
                        >
                            <span className="text-sm text-gray-200 font-medium">{act.facility}</span>
                            <div className="flex items-center gap-3">
                                {act.allowed ? (
                                    <span className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-400/10 px-2 py-1 rounded">
                                        <Check size={12} /> 가능
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-red-400 text-xs font-bold bg-red-400/10 px-2 py-1 rounded">
                                        <X size={12} /> 불가능
                                    </span>
                                )}
                                {expandedIndex === idx ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                            </div>
                        </div>

                        {expandedIndex === idx && (
                            <div className="p-3 bg-gray-900/50 border-t border-gray-700/50 text-xs space-y-2 animate-in slide-in-from-top-1 duration-200">
                                <div className="flex gap-2">
                                    <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-gray-400 block mb-1">판단 근거:</span>
                                        <p className="text-gray-300 leading-relaxed">{act.reason}</p>
                                    </div>
                                </div>
                                {act.relatedLaw && (
                                    <div className="pl-6">
                                        <span className="text-gray-500 block mb-1">관련 법령:</span>
                                        <p className="text-gray-400">{act.relatedLaw}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="mt-3 text-xs text-gray-500 text-center">
                * 법적 참고용이며, 실제 인허가는 관할 지자체 확인 필수
            </div>
        </div>
    );
};

export default PermissibleActsMatrix;
