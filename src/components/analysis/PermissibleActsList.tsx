import React, { useState } from 'react';
import { PermissibleAct, getRecommendedActs, groupActsByCategory } from '@/lib/analysis/permissible_acts';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Star, Building2, Home, Factory, ShoppingBag } from 'lucide-react';

interface PermissibleActsListProps {
    acts: PermissibleAct[];
    landChar: any;
}

const CategoryIcon = ({ category }: { category: string }) => {
    switch (category) {
        case '주거시설': return <Home size={16} className="text-blue-400" />;
        case '상업/생활': return <ShoppingBag size={16} className="text-green-400" />;
        case '산업시설': return <Factory size={16} className="text-orange-400" />;
        default: return <Building2 size={16} className="text-gray-400" />;
    }
};

const PermissibleActsList: React.FC<PermissibleActsListProps> = ({ acts, landChar }) => {
    const recommended = getRecommendedActs(acts, landChar);
    const grouped = groupActsByCategory(acts);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const toggleCategory = (cat: string) => {
        setExpandedCategory(expandedCategory === cat ? null : cat);
    };

    return (
        <div className="space-y-6">
            {/* Recommendations Section */}
            {recommended.length > 0 && (
                <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 rounded-lg p-4 border border-blue-500/30">
                    <h3 className="text-blue-200 font-bold mb-3 flex items-center gap-2">
                        <Star size={18} className="text-yellow-400 fill-yellow-400" />
                        추천 건축 용도 (Top 3)
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        {recommended.map((act, idx) => (
                            <div key={idx} className="bg-gray-800/80 p-3 rounded border border-blue-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500/20 p-2 rounded-full">
                                        <CategoryIcon category={act.category} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{act.facility}</div>
                                        <div className="text-xs text-gray-400">{act.category}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-green-400 text-xs font-bold border border-green-500/30 px-2 py-1 rounded-full">
                                        가능
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Grouped List Section */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700 bg-gray-800">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Building2 size={18} className="text-gray-400" />
                        전체 행위 가능 여부
                    </h3>
                </div>

                <div className="divide-y divide-gray-700">
                    {Object.entries(grouped).map(([category, categoryActs]) => {
                        const isExpanded = expandedCategory === category;
                        const possibleCount = categoryActs.filter(a => a.allowed).length;

                        return (
                            <div key={category} className="bg-gray-800/50">
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <CategoryIcon category={category} />
                                        <span className="font-medium text-gray-200">{category}</span>
                                        <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                                            {categoryActs.length}건
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500">
                                            가능 {possibleCount} / 불가 {categoryActs.length - possibleCount}
                                        </span>
                                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="bg-gray-900/30 p-2 space-y-1">
                                        {categoryActs.map((act, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded hover:bg-gray-700/30 transition-colors border border-transparent hover:border-gray-700">
                                                <span className="text-sm text-gray-300 pl-2">{act.facility}</span>
                                                <div className="flex items-center gap-3">
                                                    {act.allowed ? (
                                                        <span className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-900/20 px-2 py-1 rounded">
                                                            <CheckCircle size={12} /> 가능
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-red-400 text-xs font-bold bg-red-900/20 px-2 py-1 rounded">
                                                            <XCircle size={12} /> 불가능
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PermissibleActsList;
