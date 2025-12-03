'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BusinessChartProps {
    data: any[]; // Price history data
}

const BusinessChart: React.FC<BusinessChartProps> = ({ data }) => {
    if (!data || data.length === 0) return <div className="text-gray-400 p-4">데이터가 없습니다.</div>;

    // Transform data for chart
    const chartData = data.map((item) => ({
        year: item.stdrYear,
        price: Number(item.pblntfPclnd), // Official Price
    })).reverse(); // Usually API returns latest first

    return (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 h-64">
            <h3 className="text-white font-bold mb-4 text-sm">공시지가 추이 (원/m²)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="year" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                        itemStyle={{ color: '#60A5FA' }}
                    />
                    <Line type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BusinessChart;
