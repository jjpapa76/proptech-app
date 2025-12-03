import React from 'react';
import { LAYER_GROUPS, LayerDefinition } from './layerConfig';

interface LayerControlPanelProps {
    layers: LayerDefinition[];
    onToggleLayer: (id: string) => void;
    visibleItems: Record<string, string[]>;
    onLegendClick: (layerId: string, item: string) => void;
    selectedLegendItem: { layerId: string; item: string } | null;
    layerSettings?: Record<string, { opacity: number; thickness: number }>;
    onLayerSettingChange?: (layerId: string, settings: { opacity: number; thickness: number }) => void;
}

const ZONING_COLORS: Record<string, string> = {
    '제1종전용주거지역': '#E3E566',
    '제2종전용주거지역': '#EFEF78',
    '제1종일반주거지역': '#FFFF8F',
    '제2종일반주거지역': '#FFFF76',
    '제3종일반주거지역': '#FFFF62',
    '준주거지역': '#FFC9C9',
    '중심상업지역': '#FF9E9E',
    '일반상업지역': '#FFB6B6',
    '근린상업지역': '#FFCACA',
    '유통상업지역': '#FFD5D5',
    '전용공업지역': '#A8A8FF',
    '일반공업지역': '#C2C2FF',
    '준공업지역': '#DCDCFF',
    '보전녹지지역': '#88FF88',
    '생산녹지지역': '#A6FFA6',
    '자연녹지지역': '#C4FFC4',
    '보전관리지역': '#D1F8D1',
    '생산관리지역': '#98FB98',
    '계획관리지역': '#90EE90',
    '농림지역': '#E0F8D0',
    '자연환경보전지역': '#D0F0C0',
};

const LayerControlPanel: React.FC<LayerControlPanelProps> = ({
    layers,
    onToggleLayer,
    visibleItems,
    onLegendClick,
    selectedLegendItem,
    layerSettings,
    onLayerSettingChange
}) => {
    const [expandedSettings, setExpandedSettings] = React.useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
        "국토계획법에 따른 지역지구": true,
        "개별법령에 따른 지역지구": false,
        "도시계획시설": false,
    });

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    return (
        <div className="absolute top-4 right-4 z-10 bg-white rounded shadow-lg max-h-[80vh] overflow-y-auto w-80 flex flex-col font-sans text-sm">
            {/* Header */}
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center sticky top-0">
                <h3 className="font-bold text-gray-800">도면 보기 설정</h3>
                <button className="text-gray-400 hover:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                </button>
            </div>

            {/* Layer Groups */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {LAYER_GROUPS.map((group) => (
                    <div key={group.title} className="border border-gray-200 rounded overflow-hidden">
                        <button
                            onClick={() => toggleGroup(group.title)}
                            className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                        >
                            <span className="font-semibold text-gray-700 text-xs">{group.title}</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-3 w-3 text-gray-500 transform transition-transform ${expandedGroups[group.title] ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {expandedGroups[group.title] && (
                            <div className="p-2 bg-white space-y-2">
                                {group.layers.map((layerDef) => {
                                    const layerState = layers.find(l => l.id === layerDef.id);
                                    const isVisible = layerState?.visible ?? false;
                                    const items = visibleItems[layerDef.id] || [];
                                    const settings = layerSettings?.[layerDef.id] || { opacity: 0.7, thickness: 1 };

                                    return (
                                        <div key={layerDef.id} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <label className="flex items-center space-x-2 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={isVisible}
                                                        onChange={() => onToggleLayer(layerDef.id)}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-gray-700">{layerDef.name}</span>
                                                </label>
                                                {isVisible && (
                                                    <button
                                                        onClick={() => setExpandedSettings(expandedSettings === layerDef.id ? null : layerDef.id)}
                                                        className={`p-1 rounded hover:bg-gray-100 ${expandedSettings === layerDef.id ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}
                                                        title="설정"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>

                                            {/* View Settings */}
                                            {isVisible && expandedSettings === layerDef.id && (
                                                <div className="ml-6 p-2 bg-gray-50 rounded border border-gray-100 text-xs space-y-2">
                                                    <div>
                                                        <div className="flex justify-between mb-1 text-gray-500">
                                                            <span>투명도</span>
                                                            <span>{Math.round(settings.opacity * 100)}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            value={settings.opacity * 100}
                                                            onChange={(e) => onLayerSettingChange?.(layerDef.id, { ...settings, opacity: Number(e.target.value) / 100 })}
                                                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                        />
                                                    </div>
                                                    {layerDef.type === 'vector' && (
                                                        <div>
                                                            <div className="flex justify-between mb-1 text-gray-500">
                                                                <span>선 굵기</span>
                                                                <span>{settings.thickness}px</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="1"
                                                                max="5"
                                                                step="0.5"
                                                                value={settings.thickness}
                                                                onChange={(e) => onLayerSettingChange?.(layerDef.id, { ...settings, thickness: Number(e.target.value) })}
                                                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Legend Section */}
            <div className="border-t border-gray-200 p-3 bg-gray-50">
                <h4 className="font-bold text-gray-800 mb-2 text-xs">범례</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                    {Object.entries(visibleItems).map(([layerId, items]) => {
                        const layerDef = layers.find(l => l.id === layerId);
                        if (!layerDef || items.length === 0) return null;

                        return (
                            <div key={layerId}>
                                {items.map(item => {
                                    const isSelected = selectedLegendItem?.layerId === layerId && selectedLegendItem?.item === item;
                                    const color = ZONING_COLORS[item] || layerDef.color || '#cccccc';

                                    return (
                                        <button
                                            key={item}
                                            onClick={() => onLegendClick(layerId, item)}
                                            className={`w-full flex items-center space-x-2 p-1 rounded text-left transition-colors text-xs
                                                ${isSelected ? 'bg-blue-100 ring-1 ring-blue-500' : 'hover:bg-gray-100'}`}
                                        >
                                            <span
                                                className="w-3 h-3 border border-gray-300 shadow-sm flex-shrink-0 rounded-sm"
                                                style={{ backgroundColor: color }}
                                            />
                                            <span className={`truncate ${isSelected ? 'font-bold text-blue-900' : 'text-gray-600'}`}>
                                                {item}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                    {Object.keys(visibleItems).length === 0 && (
                        <p className="text-gray-400 text-xs italic">표시할 범례가 없습니다.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LayerControlPanel;
