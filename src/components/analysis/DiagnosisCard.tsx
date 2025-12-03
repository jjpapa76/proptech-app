'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export type RiskLevel = 'SAFE' | 'CAUTION' | 'DANGER';

interface DiagnosisCardProps {
    level: RiskLevel;
    score: number; // 0-100
    summary: string;
    details: string[];
}

const LEVEL_CONFIG: Record<RiskLevel, { color: string; icon: React.ReactNode; label: string }> = {
    SAFE: { color: 'bg-green-500', icon: <CheckCircle className="text-green-500" />, label: '안정' },
    CAUTION: { color: 'bg-yellow-500', icon: <AlertTriangle className="text-yellow-500" />, label: '주의' },
    DANGER: { color: 'bg-red-500', icon: <XCircle className="text-red-500" />, label: '위험' },
};

const DiagnosisCard: React.FC<DiagnosisCardProps> = ({ level, score, summary, details }) => {
    const config = LEVEL_CONFIG[level];

    return (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">종합 진단 결과</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-black ${config.color}`}>
                    {config.label}
                </span>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path
                            className="text-gray-700"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                        />
                        <path
                            className={level === 'SAFE' ? 'text-green-500' : level === 'CAUTION' ? 'text-yellow-500' : 'text-red-500'}
                            strokeDasharray={`${score}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                        />
                    </svg>
                    <span className="absolute text-xl font-bold text-white">{score}점</span>
                </div>
                <div className="flex-1">
                    <p className="text-gray-300 text-sm leading-relaxed">{summary}</p>
                </div>
            </div>

            <div className="space-y-2">
                {details.map((detail, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-gray-400">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0" />
                        <span>{detail}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DiagnosisCard;
