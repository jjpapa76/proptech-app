'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Sidebar from '@/components/sidebar/Sidebar';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import LayerControlPanel from '@/components/map/LayerControlPanel';
import { ALL_LAYERS, LayerDefinition } from '@/components/map/layerConfig';

// Dynamically import VWorldMap with SSR disabled
const VWorldMap = dynamic(() => import('@/components/map/VWorldMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500">지도를 불러오는 중...</div>
});

export default function Home() {
  const [mapCenter, setMapCenter] = useState<{ x: number; y: number } | undefined>(undefined);
  const [selectedPnu, setSelectedPnu] = useState<string | undefined>(undefined);
  const [visibleItems, setVisibleItems] = useState<Record<string, string[]>>({});
  const [selectedLegendItem, setSelectedLegendItem] = useState<{ layerId: string; item: string } | null>(null);
  const [layerSettings, setLayerSettings] = useState<Record<string, { opacity: number; thickness: number }>>({});

  // Layer State - Initialize from ALL_LAYERS
  const [layers, setLayers] = useState<LayerDefinition[]>(
    ALL_LAYERS.map(def => ({
      ...def,
      visible: ['zoning', 'facility', 'cadastral'].includes(def.id), // Default visibility
      opacity: 0.7,
      thickness: def.type === 'vector' ? (def.id === 'facility' ? 2 : 1) : undefined
    }))
  );

  const handleSelectLocation = React.useCallback((center: { x: number; y: number }, pnu: string) => {
    setMapCenter(center);
    setSelectedPnu(pnu);
  }, []);

  const handleUpdateLayers = React.useCallback((newLayers: LayerDefinition[]) => {
    setLayers(newLayers);
  }, []);

  const handleToggleLayer = (id: string) => {
    setLayers(prev => prev.map(layer =>
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const handleVisibleItemsChange = (items: Record<string, string[]>) => {
    setVisibleItems(items);
  };

  const handleLegendClick = (layerId: string, item: string) => {
    if (selectedLegendItem?.layerId === layerId && selectedLegendItem?.item === item) {
      setSelectedLegendItem(null);
    } else {
      setSelectedLegendItem({ layerId, item });
    }
  };

  const handleLayerSettingChange = (layerId: string, settings: { opacity: number; thickness: number }) => {
    setLayerSettings(prev => ({
      ...prev,
      [layerId]: settings
    }));
  };

  return (
    <ErrorBoundary>
      <DashboardLayout
        sidebar={
          <Sidebar
            onSelectLocation={handleSelectLocation}
            onUpdateLayers={handleUpdateLayers}
          />
        }
        map={
          <div className="relative w-full h-full">
            <VWorldMap
              className="w-full h-full"
              layers={layers}
              center={mapCenter}
              selectedPnu={selectedPnu}
              onVisibleItemsChange={handleVisibleItemsChange}
              selectedLegendItem={selectedLegendItem}
              layerSettings={layerSettings}
            />
            <LayerControlPanel
              layers={layers}
              onToggleLayer={handleToggleLayer}
              visibleItems={visibleItems}
              onLegendClick={handleLegendClick}
              selectedLegendItem={selectedLegendItem}
              layerSettings={layerSettings}
              onLayerSettingChange={handleLayerSettingChange}
            />
          </div>
        }
      />
    </ErrorBoundary>
  );
}
