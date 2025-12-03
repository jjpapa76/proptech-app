'use client';

import React, { useState, useEffect } from 'react';
import { MARKET_INDICATORS } from '@/constants/market_data';

interface ProfitabilityCalculatorProps {
    landArea: number; // m2
    officialPrice: number; // KRW/m2
}

const ProfitabilityCalculator: React.FC<ProfitabilityCalculatorProps> = ({ landArea, officialPrice }) => {
    // Inputs
    const [landCost, setLandCost] = useState(0);
    const [constructionCostPerPy, setConstructionCostPerPy] = useState(MARKET_INDICATORS.CONSTRUCTION_COST_PER_PY);
    const [targetFloorAreaRatio, setTargetFloorAreaRatio] = useState(200); // %
    const [salesPricePerPy, setSalesPricePerPy] = useState(30000000); // KRW

    // Outputs
    const [totalCost, setTotalCost] = useState(0);
    const [expectedSales, setExpectedSales] = useState(0);
    const [profit, setProfit] = useState(0);
    const [roi, setRoi] = useState(0);

    useEffect(() => {
        // Initialize Land Cost Estimate (1.5x Official Price as rough market value)
        setLandCost(officialPrice * landArea * 1.5);
    }, [landArea, officialPrice]);

    useEffect(() => {
        calculate();
    }, [landCost, constructionCostPerPy, targetFloorAreaRatio, salesPricePerPy]);

    const calculate = () => {
        // 1. Land Cost is Input

        // 2. Construction Cost
        // Land Area (m2) * FAR (%) / 100 = Total Floor Area (m2)
        // Total Floor Area (m2) / 3.3058 = Total Floor Area (Py)
        const totalFloorAreaM2 = landArea * (targetFloorAreaRatio / 100);
        const totalFloorAreaPy = totalFloorAreaM2 / 3.3058;
        const totalConstructionCost = totalFloorAreaPy * constructionCostPerPy;

        // 3. Other Costs (Design, Supervision, Tax ~ 15% of Construction)
        const otherCosts = totalConstructionCost * 0.15;

        // 4. Total Project Cost
        const calculatedTotalCost = landCost + totalConstructionCost + otherCosts;

        // 5. Expected Sales
        // Sales Area usually ~ Total Floor Area (simplification)
        const calculatedSales = totalFloorAreaPy * salesPricePerPy;

        // 6. Profit & ROI
        const calculatedProfit = calculatedSales - calculatedTotalCost;
        const calculatedRoi = calculatedTotalCost > 0 ? (calculatedProfit / calculatedTotalCost) * 100 : 0;

        setTotalCost(calculatedTotalCost);
        setExpectedSales(calculatedSales);
        setProfit(calculatedProfit);
        setRoi(calculatedRoi);
    };

    const formatMoney = (val: number) => {
        return Math.floor(val / 100000000).toLocaleString() + '억 ' + Math.floor((val % 100000000) / 10000).toLocaleString() + '만';
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-white font-bold mb-4 border-b border-gray-600 pb-2">수익률 계산기 (가상)</h3>

                {/* Inputs */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-xs mb-1">토지 매입비 (예상)</label>
                        <input
                            type="number"
                            value={landCost}
                            onChange={(e) => setLandCost(Number(e.target.value))}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-right"
                        />
                        <p className="text-xs text-gray-500 text-right mt-1">{formatMoney(landCost)}원</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 text-xs mb-1">목표 용적률 (%)</label>
                            <input
                                type="number"
                                value={targetFloorAreaRatio}
                                onChange={(e) => setTargetFloorAreaRatio(Number(e.target.value))}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-right"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-xs mb-1">평당 건축비 (원)</label>
                            <input
                                type="number"
                                value={constructionCostPerPy}
                                onChange={(e) => setConstructionCostPerPy(Number(e.target.value))}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-right"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-xs mb-1">평당 예상 분양가 (원)</label>
                        <input
                            type="number"
                            value={salesPricePerPy}
                            onChange={(e) => setSalesPricePerPy(Number(e.target.value))}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-right"
                        />
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-white font-bold mb-4 border-b border-gray-600 pb-2">분석 결과</h3>
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-gray-400">총 사업비</span>
                        <span className="text-white font-medium">{formatMoney(totalCost)}원</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">예상 매출</span>
                        <span className="text-white font-medium">{formatMoney(expectedSales)}원</span>
                    </div>
                    <div className="border-t border-gray-700 my-2 pt-2 flex justify-between items-center">
                        <span className="text-gray-300 font-bold">예상 수익</span>
                        <span className={`font-bold text-lg ${profit > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                            {formatMoney(profit)}원
                        </span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-900 p-2 rounded">
                        <span className="text-gray-300 font-bold">ROI (수익률)</span>
                        <span className={`font-bold text-xl ${roi > 10 ? 'text-green-400' : roi > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                            {roi.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfitabilityCalculator;
