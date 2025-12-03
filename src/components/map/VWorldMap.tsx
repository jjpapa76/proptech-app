'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import Layer from 'ol/layer/Layer';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Stroke, Fill, Icon, Text, Circle as CircleStyle } from 'ol/style';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { getCenter, getIntersection } from 'ol/extent';
import Geometry from 'ol/geom/Geometry';
import { LayerDefinition } from './layerConfig';

const VWORLD_API_KEY = process.env.NEXT_PUBLIC_VWORLD_API_KEY;

const highlightStyle = new Style({
    stroke: new Stroke({
        color: '#3b82f6',
        width: 3,
    }),
    fill: new Fill({
        color: 'rgba(59, 130, 246, 0.1)',
    }),
});

const pnuHighlightStyle = new Style({
    stroke: new Stroke({
        color: '#ff0000',
        width: 5,
    }),
    fill: new Fill({
        color: 'rgba(0, 0, 0, 0)', // Transparent fill
    }),
});

const markerStyle = new Style({
    image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: '#3b82f6' }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
    }),
});

interface VWorldMapProps {
    className?: string;
    layers: LayerDefinition[];
    center?: { x: number; y: number };
    selectedPnu?: string;
    onVisibleItemsChange?: (items: Record<string, string[]>) => void;
    selectedLegendItem?: { layerId: string; item: string } | null;
    layerSettings?: Record<string, { opacity: number; thickness: number }>;
}

const VWorldMap: React.FC<VWorldMapProps> = ({
    className,
    layers,
    center,
    selectedPnu,
    onVisibleItemsChange,
    selectedLegendItem,
    layerSettings
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<Map | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const layersRef = useRef<Record<string, Layer<any>>>({});
    const highlightLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
    const baseLayerRef = useRef<TileLayer<XYZ> | null>(null);
    const [mapType, setMapType] = useState<'base' | 'satellite' | 'hybrid'>('base');

    // Initialize Map
    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    useEffect(() => {
        if (!isMounted || !mapRef.current || mapInstanceRef.current) return;

        console.log('[VWorldMap] Initializing...');

        // Clear any existing children
        while (mapRef.current.firstChild) {
            mapRef.current.removeChild(mapRef.current.firstChild);
        }

        // Base Layer (Default V-World Base)
        const vworldBaseLayer = new TileLayer({
            source: new XYZ({
                url: `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_API_KEY}/Base/{z}/{y}/{x}.png`,
                crossOrigin: 'anonymous',
            }),
            properties: { name: 'base' },
        });
        baseLayerRef.current = vworldBaseLayer;

        // Vector Layer for Highlighting
        const vectorSource = new VectorSource();
        const vectorLayer = new VectorLayer({
            source: vectorSource,
            zIndex: 999, // Topmost
        });
        highlightLayerRef.current = vectorLayer;

        const map = new Map({
            target: mapRef.current,
            layers: [vworldBaseLayer, vectorLayer],
            view: new View({
                center: fromLonLat([126.9780, 37.5665]), // Default: Seoul City Hall
                zoom: 14,
                minZoom: 6,
                maxZoom: 22,
            }),
            controls: defaultControls({ zoom: false, rotate: false }),
        });

        mapInstanceRef.current = map;
        setMapReady(true);
        console.log('[VWorldMap] Map Created');

        // Force resize
        setTimeout(() => {
            map.updateSize();
        }, 200);

        return () => {
            console.log('[VWorldMap] Cleanup');
            map.setTarget(undefined);
            mapInstanceRef.current = null;
            setMapReady(false);
        };
    }, [isMounted]);

    // Handle Map Type
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !baseLayerRef.current) return;

        // Remove existing hybrid overlay if any
        const existingOverlay = layersRef.current['hybrid_overlay'];
        if (existingOverlay) {
            map.removeLayer(existingOverlay);
            delete layersRef.current['hybrid_overlay'];
        }

        let newUrl = '';
        if (mapType === 'base') {
            newUrl = `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_API_KEY}/Base/{z}/{y}/{x}.png`;
        } else if (mapType === 'satellite') {
            newUrl = `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_API_KEY}/Satellite/{z}/{y}/{x}.jpeg`;
        } else if (mapType === 'hybrid') {
            newUrl = `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_API_KEY}/Satellite/{z}/{y}/{x}.jpeg`;
        }

        baseLayerRef.current.setSource(new XYZ({ url: newUrl, crossOrigin: 'anonymous' }));

        if (mapType === 'hybrid') {
            const hybridLayer = new TileLayer({
                source: new XYZ({
                    url: `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_API_KEY}/Hybrid/{z}/{y}/{x}.png`,
                    crossOrigin: 'anonymous',
                }),
                zIndex: 5,
                properties: { name: 'hybrid_overlay' },
            });
            map.addLayer(hybridLayer);
            layersRef.current['hybrid_overlay'] = hybridLayer;
        }
    }, [mapType, mapReady]);

    // Handle Center Change
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !center) return;
        const view = map.getView();
        view.animate({
            center: fromLonLat([center.x, center.y]),
            zoom: 19,
            duration: 1000,
        });
    }, [center, mapReady]);

    // Handle Dynamic Layers
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // 1. Identify layers to remove (those not in the new list)
        const currentLayerIds = new Set(layers.map(l => l.id));
        Object.keys(layersRef.current).forEach(layerId => {
            if (!currentLayerIds.has(layerId) && layerId !== 'hybrid_overlay') { // Preserve hybrid overlay
                const layerToRemove = layersRef.current[layerId];
                map.removeLayer(layerToRemove);
                delete layersRef.current[layerId];
            }
        });

        // 2. Add or Update layers
        layers.forEach((layerConfig) => {
            const layerId = layerConfig.id;
            const settings = layerSettings?.[layerId] || { opacity: 0.7, thickness: 1 };

            // Skip if not visible or no code
            if (!layerConfig.visible || !layerConfig.code) {
                const existingLayer = layersRef.current[layerId];
                if (existingLayer) {
                    map.removeLayer(existingLayer);
                    delete layersRef.current[layerId];
                }
                return;
            }

            let layer: Layer<any> | undefined = layersRef.current[layerId];

            // Check if layer type matches (e.g. switching from WMS to Vector)
            if (layer) {
                const isVector = layer instanceof VectorLayer;
                const configIsVector = layerConfig.type === 'vector';
                if (isVector !== configIsVector) {
                    map.removeLayer(layer);
                    delete layersRef.current[layerId];
                    layer = undefined; // Force recreation
                }
            }

            if (layer) {
                // Update existing layer settings
                layer.setOpacity(settings.opacity);

                // If it's a vector layer, we might need to update style if thickness changed
                if (layerConfig.type === 'vector' && layer instanceof VectorLayer) {
                    layer.setStyle((feature: any) => {
                        const labelField = layerConfig.labelField || 'dgm_nm';
                        const label = feature.get(labelField);

                        // Custom style for Cadastral Layer
                        if (layerConfig.id === 'cadastral') {
                            return new Style({
                                stroke: new Stroke({
                                    color: 'rgba(0, 0, 0, 0.5)', // Light Black (Dark Gray)
                                    width: 1
                                }),
                                text: new Text({
                                    text: label || '',
                                    font: '12px sans-serif',
                                    fill: new Fill({ color: '#000' }),
                                    stroke: new Stroke({ color: '#fff', width: 2 }),
                                    overflow: true,
                                })
                            });
                        }

                        return new Style({
                            stroke: new Stroke({ color: 'rgba(255, 0, 0, 0.7)', width: settings.thickness }),
                            fill: new Fill({ color: 'rgba(255, 0, 0, 0.1)' }),
                            text: new Text({
                                text: label || '',
                                font: '12px sans-serif',
                                fill: new Fill({ color: '#000' }),
                                stroke: new Stroke({ color: '#fff', width: 2 }),
                                overflow: true,
                            })
                        });
                    });
                }
            } else {
                // Create new layer
                if (layerConfig.type === 'vector') {
                    const vectorSource = new VectorSource({
                        format: new GeoJSON(),
                        loader: async function (extent, resolution, projection) {
                            const url = `/api/vworld/wfs?typeName=${layerConfig.code}&bbox=${extent.join(',')}`;
                            try {
                                const response = await fetch(url);
                                if (!response.ok) throw new Error(`Status ${response.status}`);
                                const data = await response.json();
                                const features = new GeoJSON().readFeatures(data, {
                                    featureProjection: projection,
                                });
                                vectorSource.addFeatures(features);
                            } catch (error) {
                                console.error('[VWorldMap] Failed to load WFS:', error);
                            }
                        },
                        strategy: bboxStrategy,
                    });

                    layer = new VectorLayer({
                        source: vectorSource,
                        style: (feature) => {
                            const labelField = layerConfig.labelField || 'dgm_nm';
                            const label = feature.get(labelField);

                            // Custom style for Cadastral Layer
                            if (layerConfig.id === 'cadastral') {
                                return new Style({
                                    stroke: new Stroke({
                                        color: 'rgba(0, 0, 0, 0.5)', // Light Black
                                        width: 1
                                    }),
                                    text: new Text({
                                        text: label || '',
                                        font: '12px sans-serif',
                                        fill: new Fill({ color: '#000' }),
                                        stroke: new Stroke({ color: '#fff', width: 2 }),
                                        overflow: true,
                                    })
                                });
                            }

                            return new Style({
                                stroke: new Stroke({ color: 'rgba(255, 0, 0, 0.7)', width: settings.thickness }),
                                fill: new Fill({ color: 'rgba(255, 0, 0, 0.1)' }),
                                text: new Text({
                                    text: label || '',
                                    font: '12px sans-serif',
                                    fill: new Fill({ color: '#000' }),
                                    stroke: new Stroke({ color: '#fff', width: 2 }),
                                    overflow: true,
                                })
                            });
                        },
                        opacity: settings.opacity,
                        zIndex: layerConfig.id === 'cadastral' ? 20 : 10, // Cadastral on top of other vectors
                        properties: { id: layerId },
                    });
                } else {
                    // WMS Layer
                    const params: any = {
                        LAYERS: layerConfig.code,
                        TILED: true,
                        STYLES: layerConfig.code,
                    };
                    if (layerConfig.id === 'zoning') {
                        params['STYLES'] = '';
                    }
                    // For cadastral map, we might want specific styles or defaults
                    if (layerConfig.id === 'cadastral') {
                        params['STYLES'] = '';
                    }

                    layer = new TileLayer({
                        source: new TileWMS({
                            url: '/api/vworld/wms',
                            params: params,
                            serverType: 'geoserver',
                            crossOrigin: 'anonymous',
                        }),
                        opacity: settings.opacity,
                        zIndex: layerConfig.id === 'cadastral' ? 6 : 5, // Cadastral (lines) above Zoning (polygons)
                        properties: { id: layerId },
                    });
                }

                map.addLayer(layer);
                layersRef.current[layerId] = layer;
            }
        });
    }, [layers, mapReady, layerSettings]);

    // Handle Selected PNU (Geometry)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !selectedPnu) return;

        const fetchGeometry = async () => {
            try {
                // Revert to default (EPSG:4326) as it was reported to be working previously.
                // We will let OpenLayers handle the transformation.
                const url = `/api/vworld/wfs?typeName=lp_pa_cbnd_bubun&cql_filter=pnu='${selectedPnu}'`;
                console.log('[VWorldMap] Fetching PNU geometry:', url);

                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch geometry: ${response.status}`);
                const data = await response.json();
                console.log('[VWorldMap] PNU Data received:', data);

                // Read features. OpenLayers defaults to EPSG:4326 for GeoJSON if not specified.
                // We transform to the map's projection (EPSG:3857).
                const features = new GeoJSON().readFeatures(data, {
                    featureProjection: map.getView().getProjection(),
                });
                console.log('[VWorldMap] Parsed features:', features.length);

                const source = highlightLayerRef.current?.getSource();
                if (source) {
                    source.clear();
                    if (features.length > 0) {
                        features.forEach(feature => {
                            feature.setStyle(new Style({
                                stroke: new Stroke({
                                    color: '#ef4444',
                                    width: 4,
                                }),
                                fill: new Fill({
                                    color: 'rgba(239, 68, 68, 0.2)',
                                }),
                            }));
                        });
                        source.addFeatures(features);
                        const extent = source.getExtent();

                        // Safety Check: Prevent jumping to random locations
                        // If we have a 'center' prop (from search), check if the PNU geometry is near it.
                        if (center && extent && !extent.some(val => !isFinite(val))) {
                            const pnuCenter = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
                            const mapCenter = fromLonLat([center.x, center.y]);

                            // Calculate distance squared (in meters approx)
                            const dx = pnuCenter[0] - mapCenter[0];
                            const dy = pnuCenter[1] - mapCenter[1];
                            const distSq = dx * dx + dy * dy;

                            // Threshold: 5km (25,000,000 m^2)
                            // If the PNU geometry is more than 5km away from the search result, 
                            // it's likely a wrong match or coordinate error. Don't jump.
                            if (distSq > 25000000) {
                                console.warn('[VWorldMap] PNU geometry is too far from search location. Preventing map jump.', {
                                    pnuCenter,
                                    mapCenter,
                                    dist: Math.sqrt(distSq)
                                });
                                // Still add the feature so user can see it if they pan, but don't force move.
                                // Or maybe we shouldn't even add it? 
                                // Let's add it but NOT fit.
                            } else {
                                console.log('[VWorldMap] Fitting view to PNU extent');
                                map.getView().fit(extent, { padding: [100, 100, 100, 100], duration: 1000 });
                            }

                            // Add marker at PNU center
                            const iconFeature = new Feature({
                                geometry: new Point(pnuCenter),
                            });
                            iconFeature.setStyle(markerStyle);
                            source.addFeature(iconFeature);

                        } else if (!center && extent) {
                            // If no center to compare, just fit (fallback)
                            map.getView().fit(extent, { padding: [100, 100, 100, 100], duration: 1000 });
                        }
                    } else {
                        console.warn('[VWorldMap] No features found for PNU:', selectedPnu);
                    }
                }
            } catch (error) {
                console.error('[VWorldMap] Error fetching geometry:', error);
            }
        };

        fetchGeometry();
    }, [selectedPnu, mapReady]); // Removed 'center' from dependency to prevent re-fetching on pan, but we need it for check. 
    // Actually 'center' prop changes only when user searches. So it's fine.
    // But we should probably use a ref for center to avoid effect re-triggering if we don't want to.
    // For now, keeping it simple.

    // Fetch Visible Items for Legend
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !mapReady) return;

        const fetchVisibleItems = async () => {
            // Filter layers that are visible AND have showLegend !== false
            const visibleLayers = layers.filter(l => l.visible && l.code && l.showLegend !== false);

            if (visibleLayers.length === 0) {
                if (onVisibleItemsChange) onVisibleItemsChange({});
                return;
            }

            const extent = map.getView().calculateExtent(map.getSize());
            const newVisibleItems: Record<string, string[]> = {};

            for (const layer of visibleLayers) {
                const propertyName = layer.labelField || 'dgm_nm';
                const url = `/api/vworld/wfs?typeName=${layer.code}&bbox=${extent.join(',')}&propertyName=${propertyName}&maxFeatures=50`;

                try {
                    const response = await fetch(url);
                    if (!response.ok) continue;
                    const data = await response.json();

                    if (data.features) {
                        const names = new Set<string>();
                        data.features.forEach((f: any) => {
                            const props = f.properties;
                            if (props && props[propertyName]) {
                                names.add(props[propertyName]);
                            }
                        });
                        newVisibleItems[layer.id] = Array.from(names).sort();
                    }
                } catch (error) {
                    console.error(`[VWorldMap] Error fetching items for ${layer.id}:`, error);
                }
            }

            if (onVisibleItemsChange) {
                onVisibleItemsChange(newVisibleItems);
            }
        };

        const handleMoveEnd = () => {
            fetchVisibleItems();
        };

        map.on('moveend', handleMoveEnd);
        setTimeout(fetchVisibleItems, 500);

        return () => {
            map.un('moveend', handleMoveEnd);
        };
    }, [mapReady, layers, onVisibleItemsChange]);

    // Handle Selected Legend Item (Highlighting)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !mapReady) return;

        const source = highlightLayerRef.current?.getSource();
        if (!source) return;

        if (!selectedLegendItem) {
            if (!selectedPnu) {
                source.clear();
            } else {
                // Re-trigger PNU fetch or just clear? 
                // If we clear here, the PNU highlight is lost when deselecting legend.
                // We should probably re-fetch PNU geometry if it exists.
                // For now, let's just clear to be safe, or we can rely on the user re-searching.
                // Ideally, we should check if selectedPnu exists and if so, re-apply it.
                // But `selectedPnu` effect runs on change.
                // Let's just clear.
                source.clear();
            }
            return;
        }

        const highlightItem = async () => {
            const { layerId, item } = selectedLegendItem;
            const layerConfig = layers.find(l => l.id === layerId);
            if (!layerConfig || !layerConfig.code) return;

            const propertyName = layerConfig.labelField || 'dgm_nm';
            const url = `/api/vworld/wfs?typeName=${layerConfig.code}&cql_filter=${propertyName}='${item}'`;

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch item geometry');
                const data = await response.json();

                const features = new GeoJSON().readFeatures(data, {
                    featureProjection: map.getView().getProjection(),
                });

                source.clear();
                if (features.length > 0) {
                    features.forEach(feature => {
                        feature.setStyle(highlightStyle);
                    });
                    source.addFeatures(features);
                }
            } catch (error) {
                console.error('[VWorldMap] Error highlighting item:', error);
            }
        };

        highlightItem();
    }, [selectedLegendItem, layers, mapReady, selectedPnu]);

    return (
        <div className={`relative w-full h-full ${className}`}>
            <div
                ref={mapRef}
                className="w-full h-full bg-gray-100"
                style={{ minHeight: '400px' }}
            />

            {/* Map Type Controls */}
            <div className="absolute top-4 right-80 flex flex-col gap-2 z-10 mr-4">
                <div className="bg-white rounded shadow p-1 flex border border-gray-300">
                    <button
                        onClick={() => setMapType('base')}
                        className={`px-3 py-1 text-xs rounded ${mapType === 'base' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                        일반
                    </button>
                    <button
                        onClick={() => setMapType('satellite')}
                        className={`px-3 py-1 text-xs rounded ${mapType === 'satellite' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                        위성
                    </button>
                    <button
                        onClick={() => setMapType('hybrid')}
                        className={`px-3 py-1 text-xs rounded ${mapType === 'hybrid' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                        복합
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VWorldMap;
