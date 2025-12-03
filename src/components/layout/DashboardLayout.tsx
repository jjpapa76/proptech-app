'use client';

import React, { ReactNode } from 'react';

interface DashboardLayoutProps {
    sidebar: ReactNode;
    map: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ sidebar, map }) => {
    const [mobileView, setMobileView] = React.useState<'sidebar' | 'map'>('sidebar');

    return (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-gray-900 text-white overflow-hidden">
            {/* Sidebar Area */}
            <aside className={`
                ${mobileView === 'sidebar' ? 'flex' : 'hidden'} 
                lg:flex w-full lg:w-[30%] h-full border-r border-gray-800 flex-col bg-gray-900 z-20 shadow-xl
            `}>
                {sidebar}
            </aside>

            {/* Map Area */}
            <main className={`
                ${mobileView === 'map' ? 'flex' : 'hidden'} 
                lg:flex w-full lg:w-[70%] h-full relative bg-black
            `}>
                {map}
            </main>

            {/* Mobile Tab Bar (Bottom) */}
            <div className="lg:hidden flex border-t border-gray-800 bg-gray-900 z-30">
                <button
                    onClick={() => setMobileView('sidebar')}
                    className={`flex-1 p-4 text-center font-bold ${mobileView === 'sidebar' ? 'text-blue-400 border-t-2 border-blue-400' : 'text-gray-500'}`}
                >
                    분석/검색
                </button>
                <button
                    onClick={() => setMobileView('map')}
                    className={`flex-1 p-4 text-center font-bold ${mobileView === 'map' ? 'text-blue-400 border-t-2 border-blue-400' : 'text-gray-500'}`}
                >
                    지도 보기
                </button>
            </div>
        </div>
    );
};

export default DashboardLayout;
