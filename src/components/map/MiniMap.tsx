'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Stroke, Fill, Circle as CircleStyle, Text } from 'ol/style';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';

const VWORLD_API_KEY = process.env.NEXT_PUBLIC_VWORLD_API_KEY;

interface MiniMapProps {
    center: { x: number; y: number };
    className?: string;
}

const MiniMap: React.FC<MiniMapProps> = ({ center, className }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<Map | null>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // 1. Base Layer (Gray/White background for better visibility of zones)
        // Using Base layer but maybe we want a cleaner look? Let's stick to Base.
        const baseLayer = new TileLayer({
            source: new XYZ({
                url: `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_API_KEY}/Base/{z}/{y}/{x}.png`,
                crossOrigin: 'anonymous',
            }),
        });

        // 2. Zoning Layer (WMS) - 용도지역
        const zoningLayer = new TileLayer({
            source: new TileWMS({
                url: '/api/vworld/wms',
                params: {
                    LAYERS: 'lt_c_uq111', // 용도지역
                    TILED: true,
                    STYLES: 'lt_c_uq111',
                },
                serverType: 'geoserver',
                crossOrigin: 'anonymous',
            }),
            opacity: 0.6,
        });

        // 3. Cadastral Layer (WFS) - 지적도 (with labels)
        const cadastralSource = new VectorSource({
            format: new GeoJSON(),
            loader: async function (extent, resolution, projection) {
                const url = `/api/vworld/wfs?typeName=lp_pa_cbnd_bubun&bbox=${extent.join(',')}`;
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`Status ${response.status}`);
                    const data = await response.json();
                    const features = new GeoJSON().readFeatures(data, {
                        featureProjection: projection,
                    });
                    cadastralSource.addFeatures(features);
                } catch (error) {
                    console.error('[MiniMap] Failed to load WFS:', error);
                }
            },
            strategy: bboxStrategy,
        });

        const cadastralLayer = new VectorLayer({
            source: cadastralSource,
            style: (feature) => {
                const label = feature.get('jibun') || '';
                return new Style({
                    stroke: new Stroke({
                        color: 'rgba(0, 0, 0, 0.4)',
                        width: 1,
                    }),
                    text: new Text({
                        text: label,
                        font: '11px sans-serif',
                        fill: new Fill({ color: '#000' }),
                        stroke: new Stroke({ color: '#fff', width: 2 }),
                        overflow: true,
                    }),
                });
            },
            zIndex: 10,
        });

        // 4. Marker Layer (Red Circle)
        const markerSource = new VectorSource();
        const markerLayer = new VectorLayer({
            source: markerSource,
            zIndex: 20,
            style: new Style({
                image: new CircleStyle({
                    radius: 8,
                    stroke: new Stroke({ color: '#ff0000', width: 2 }),
                    fill: new Fill({ color: 'rgba(255, 0, 0, 0.2)' }),
                }),
            }),
        });

        // Create Map
        const map = new Map({
            target: mapRef.current,
            layers: [baseLayer, zoningLayer, cadastralLayer, markerLayer],
            view: new View({
                center: fromLonLat([center.x, center.y]),
                zoom: 18, // Close up view
                minZoom: 14,
                maxZoom: 22,
            }),
            controls: defaultControls({ zoom: true, rotate: false, attribution: false }),
        });

        // Add Marker
        const markerFeature = new Feature({
            geometry: new Point(fromLonLat([center.x, center.y])),
        });
        markerSource.addFeature(markerFeature);

        mapInstanceRef.current = map;

        return () => {
            map.setTarget(undefined);
            mapInstanceRef.current = null;
        };
    }, []); // Init once

    // Update center if it changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        map.getView().animate({
            center: fromLonLat([center.x, center.y]),
            duration: 500
        });

        // Update marker position
        const layers = map.getLayers().getArray();
        const markerLayer = layers.find(l => l instanceof VectorLayer && l.getZIndex() === 20) as VectorLayer<VectorSource>;
        if (markerLayer) {
            const source = markerLayer.getSource();
            if (source) {
                source.clear();
                source.addFeature(new Feature({
                    geometry: new Point(fromLonLat([center.x, center.y]))
                }));
            }
        }
    }, [center.x, center.y]);

    return (
        <div className={`relative w-full h-full ${className}`}>
            <div ref={mapRef} className="w-full h-full bg-gray-100" />
            <div className="absolute bottom-2 right-2 bg-black/50 text-xs text-white px-2 py-1 rounded z-10 pointer-events-none">
                V-World
            </div>
        </div>
    );
};

export default MiniMap;
