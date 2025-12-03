export interface LayerDefinition {
    id: string;
    name: string;
    code: string;
    type: 'wms' | 'vector';
    color?: string; // Default color for legend if needed
    visible?: boolean;
    labelField?: string;
    showLegend?: boolean;
}

export interface LayerGroup {
    title: string;
    layers: LayerDefinition[];
}

export const LAYER_GROUPS: LayerGroup[] = [
    {
        title: "국토계획법에 따른 지역지구",
        layers: [
            { id: 'cadastral', name: '연속지적도', code: 'lp_pa_cbnd_bubun', type: 'vector', labelField: 'jibun', visible: true, showLegend: false },
            { id: 'zoning', name: '용도지역', code: 'lt_c_uq111', type: 'wms', labelField: 'uname', visible: true },
            { id: 'district', name: '용도지구', code: 'lt_c_uq112', type: 'wms', labelField: 'uname' },
            { id: 'zone', name: '용도구역', code: 'lt_c_uq113', type: 'wms', labelField: 'uname' },
        ]
    },
    {
        title: "개별법령에 따른 지역지구",
        layers: [
            // Common layers based on Toji-Eum
            { id: 'education', name: '교육환경보호구역', code: 'lt_c_aisruq999', type: 'wms', labelField: 'uname' },
            { id: 'road_zone', name: '도로구역', code: 'lt_c_usfsff001', type: 'wms', labelField: 'uname' },
            { id: 'river', name: '하천구역', code: 'lt_c_riv_fr001', type: 'wms', labelField: 'uname' },
            { id: 'cultural', name: '문화재보호구역', code: 'lt_c_adsd111', type: 'wms', labelField: 'uname' },
            { id: 'mountain', name: '보전산지', code: 'lt_c_kfzq111', type: 'wms', labelField: 'uname' },
        ]
    },
    {
        title: "도시계획시설",
        layers: [
            { id: 'facility', name: '도시계획시설', code: 'lt_c_upisuq151', type: 'vector', labelField: 'fac_nam', visible: false },
        ]
    }
];

export const ALL_LAYERS = LAYER_GROUPS.flatMap(group => group.layers);
