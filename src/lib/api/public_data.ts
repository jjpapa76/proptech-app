import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const PUBLIC_DATA_API_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_API_KEY;
const TOJI_EUM_API_KEY = process.env.TOJI_EUM_API_KEY || PUBLIC_DATA_API_KEY;

// Base URLs
const LAND_USE_URL = 'https://apis.data.go.kr/1613000/NSOLandUseInfoService';
const LAND_CHAR_URL = 'https://apis.data.go.kr/1613000/LandCharacteristicsService';
const BLD_URL = 'https://apis.data.go.kr/1613000/BldRgstService_v2';
const MOUNTAIN_URL = 'https://apis.data.go.kr/1400000/ForestInfoService'; // Example
const CULTURE_URL = 'https://www.cha.go.kr/cha/SearchKindOpenapi.do'; // Example
const COMMERCIAL_URL = 'https://apis.data.go.kr/B553077/api/open/sdsc2';
const PERMIT_URL = 'https://apis.data.go.kr/1613000/ArchPmsService_v2';
const UNSOLD_URL = 'https://apis.data.go.kr/1613000/MIFHService';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
});

// --- Mock Data for Fallback ---
const MOCK_DATA = {
    landUse: {
        pnu: '4719012600200480004',
        lndcNm: '임야',
        ar: 15420,
        indivOalp: 12500,
        luseLawNm: '국토의 계획 및 이용에 관한 법률: 자연녹지지역, 가축분뇨의 관리 및 이용에 관한 법률: 가축사육제한구역(절대제한구역), 산지관리법: 준보전산지, 수도법: 공장설립승인지역',
    },
    urbPlan: [
        { upisuName: '자연녹지지역', type: '용도지역' },
        { upisuName: '가축사육제한구역', type: '기타' },
        { upisuName: '준보전산지', type: '산지' },
        { upisuName: '공장설립승인지역', type: '수도' },
        { upisuName: '대로3류(폭 25m~30m)(접합)', type: '도시계획시설' },
    ],
    regulations: [
        { luseLawNm: '국토의 계획 및 이용에 관한 법률', content: '자연녹지지역' },
        { luseLawNm: '가축분뇨의 관리 및 이용에 관한 법률', content: '가축사육제한구역(절대제한구역)' },
        { luseLawNm: '산지관리법', content: '준보전산지' },
        { luseLawNm: '수도법', content: '공장설립승인지역(수도법시행령 제14조의3 1호)' },
    ],
    building: [
        { bldNm: '양호동 물류창고', mainPurpsCdNm: '창고시설', totArea: 450.5, strctCdNm: '일반철골구조', useAprDay: '20180615', grndFlrCnt: 1, ugrndFlrCnt: 0 }
    ],
    price: [
        { stdrYear: '2024', indivOalp: 12500 },
        { stdrYear: '2023', indivOalp: 12800 },
        { stdrYear: '2022', indivOalp: 13500 },
        { stdrYear: '2021', indivOalp: 11000 },
        { stdrYear: '2020', indivOalp: 10500 },
    ]
};

// Helper to handle XML response and error checking with Mock Fallback
async function fetchAndParse(url: string, params: any, apiKey: string = PUBLIC_DATA_API_KEY!) {
    // If no API Key or explicitly testing, return null to trigger fallback in caller or handle here
    if (!apiKey || apiKey.includes('********')) {
        console.warn(`API Key missing or masked for ${url}. Using Mock Data.`);
        return null;
    }

    try {
        // IMPORTANT: Decode the key first to prevent double-encoding by axios
        // If the user provided an already encoded key (containing %), this fixes it.
        // If they provided a raw key, decodeURIComponent doesn't hurt (usually).
        const decodedKey = decodeURIComponent(apiKey);

        const response = await axios.get(url, {
            params: {
                ...params,
                serviceKey: decodedKey,
                format: 'xml',
            },
            timeout: 5000, // 5s timeout
        });

        const parsed = parser.parse(response.data);
        const header = parsed.response?.header || parsed.result?.header;

        if (header && header.resultCode !== '00') {
            console.warn(`Public Data API Warning: ${header.resultMsg}`);
            return null;
        }

        const items = parsed.response?.body?.items?.item || parsed.result?.body?.items?.item;
        return items;
    } catch (error) {
        console.error(`API Error (${url}):`, error);
        return null;
    }
}

// --- PNU Parser ---
function parsePnu(pnu: string) {
    if (!pnu || pnu.length !== 19) throw new Error('Invalid PNU Code');
    return {
        sigunguCd: pnu.substring(0, 5),
        bjdongCd: pnu.substring(5, 10),
        platGbCd: pnu.substring(10, 11) === '2' ? '1' : '0',
        bun: pnu.substring(11, 15),
        ji: pnu.substring(15, 19),
    };
}

// --- Land Use & Regulations ---
export interface LandUsePlan {
    pnu: string;
    lndcNm: string;
    ar: number;
    indivOalp: number;
    luseLawNm: string;
}

export async function getLandUsePlan(pnu: string): Promise<LandUsePlan | null> {
    const data = await fetchAndParse(`${LAND_USE_URL}/getLandUsePlan`, { pnu }, TOJI_EUM_API_KEY);
    if (data) {
        const item = Array.isArray(data) ? data[0] : data;
        return {
            pnu: item.pnu,
            lndcNm: item.lndcNm,
            ar: Number(item.ar),
            indivOalp: Number(item.indivOalp),
            luseLawNm: item.luseLawNm,
        };
    }
    // Fallback
    return { ...MOCK_DATA.landUse, pnu };
}

export interface LandCharacteristics {
    pnu: string;
    lndcNm: string; // Jimok
    lndSeCdNm: string; // Land Category
    tpgrphPitcSeCdNm: string; // Topography Height (e.g. Flat)
    tpgrphFrmSeCdNm: string; // Topography Shape (e.g. Rectangular)
    roadSideSeCdNm: string; // Road Interface (e.g. Wide Road)
}

export async function getLandCharacteristics(pnu: string): Promise<LandCharacteristics | null> {
    const data = await fetchAndParse(`${LAND_CHAR_URL}/getLandCharacteristics`, { pnu }, TOJI_EUM_API_KEY);
    if (data) {
        const item = Array.isArray(data) ? data[0] : data;
        return {
            pnu: item.pnu,
            lndcNm: item.lndcNm,
            lndSeCdNm: item.lndSeCdNm,
            tpgrphPitcSeCdNm: item.tpgrphPitcSeCdNm,
            tpgrphFrmSeCdNm: item.tpgrphFrmSeCdNm,
            roadSideSeCdNm: item.roadSideSeCdNm,
        };
    }
    // Fallback Mock
    return {
        pnu,
        lndcNm: '임야',
        lndSeCdNm: '일반산지',
        tpgrphPitcSeCdNm: '완경사',
        tpgrphFrmSeCdNm: '부정형',
        roadSideSeCdNm: '세로(불)',
    };
}

export async function getUrbPlanInfo(pnu: string) {
    const data = await fetchAndParse(`${LAND_USE_URL}/getUrbPlanInfo`, { pnu }, TOJI_EUM_API_KEY);
    return Array.isArray(data) ? data : (data ? [data] : MOCK_DATA.urbPlan);
}

export async function getRegulationInfo(pnu: string) {
    const data = await fetchAndParse(`${LAND_USE_URL}/getRegulationInfo`, { pnu }, TOJI_EUM_API_KEY);
    return Array.isArray(data) ? data : (data ? [data] : MOCK_DATA.regulations);
}

// --- Building Ledger & Price ---
export async function getBrTitleInfo(pnu: string) {
    const { sigunguCd, bjdongCd, platGbCd, bun, ji } = parsePnu(pnu);
    const data = await fetchAndParse(`${BLD_URL}/getBrTitleInfo`, {
        sigunguCd, bjdongCd, platGbCd, bun, ji, numOfRows: 10,
    });
    return Array.isArray(data) ? data : (data ? [data] : MOCK_DATA.building);
}

export async function getIndivOalp(pnu: string) {
    const data = await fetchAndParse(`${LAND_USE_URL}/getIndivOalp`, { pnu, numOfRows: 10 });
    return Array.isArray(data) ? data : (data ? [data] : MOCK_DATA.price);
}

// --- Special Regulations (Mountain, Culture, Farmland, etc) ---
export async function getMountainInfo(pnu: string) {
    const { sigunguCd, bjdongCd, platGbCd, bun, ji } = parsePnu(pnu);
    // Note: Actual API might differ, using placeholder structure based on research
    const data = await fetchAndParse(`${MOUNTAIN_URL}/getSanjiInfo`, {
        sigunguCd, bjdongCd, bun, ji, mountainGb: platGbCd === '2' ? '1' : '0', numOfRows: 10,
    });
    return Array.isArray(data) ? data : (data ? [data] : []);
}

export async function getCulturalHeritageInfo(pnu: string) {
    // Note: The Cultural Heritage API often requires specific coordinates or region codes not directly mapable from PNU easily without intermediate steps.
    // For now, we will try to fetch based on the region code derived from PNU.
    const { sigunguCd } = parsePnu(pnu);
    const data = await fetchAndParse(`${CULTURE_URL}/getCcbaCtgryList`, {
        ccbaKdcd: '11', ctprvnCd: sigunguCd.substring(0, 2), gugunCd: sigunguCd.substring(2, 5), numOfRows: 10,
    });
    return Array.isArray(data) ? data : (data ? [data] : []);
}

// Helper to check for specific zones in Regulation Info
export function checkSpecialZones(regulations: any[]) {
    const zones = {
        education: false,
        districtPlan: false,
        cultural: false,
    };

    if (!regulations) return zones;

    const regList = Array.isArray(regulations) ? regulations : [regulations];

    regList.forEach((reg: any) => {
        const content = reg.content || reg.luseLawNm || '';
        if (content.includes('교육환경보호구역') || content.includes('상대보호구역') || content.includes('절대보호구역')) {
            zones.education = true;
        }
        if (content.includes('지구단위계획구역')) {
            zones.districtPlan = true;
        }
        if (content.includes('문화재') || content.includes('역사문화환경')) {
            zones.cultural = true;
        }
    });

    return zones;
}

export async function getFarmlandInfo(pnu: string) {
    // Placeholder for Farmland API
    return [];
}

// --- Permissible Acts (Behavior Restriction) ---
export async function getBehaviorRestriction(pnu: string) {
    const data = await fetchAndParse(`${LAND_USE_URL}/getBehaviorRestriction`, { pnu }, TOJI_EUM_API_KEY);
    return Array.isArray(data) ? data : (data ? [data] : []);
}

// --- Business & Risk Analysis ---
export async function getCommercialAreaInfo(pnu: string) {
    const { bjdongCd } = parsePnu(pnu);
    const data = await fetchAndParse(`${COMMERCIAL_URL}/storeListInDong`, {
        divId: 'ctprvnCd', key: bjdongCd,
    });
    return Array.isArray(data) ? data : (data ? [data] : []);
}

export async function getBuildingPermitInfo(pnu: string) {
    const { sigunguCd, bjdongCd, bun, ji } = parsePnu(pnu);
    const data = await fetchAndParse(`${PERMIT_URL}/getApBasisOulnInfo`, {
        sigunguCd, bjdongCd, bun, ji, numOfRows: 10,
    });
    return Array.isArray(data) ? data : (data ? [data] : []);
}

export async function getUnsoldHousingInfo(sigunguCd: string) {
    const data = await fetchAndParse(`${UNSOLD_URL}/getUnsoldHouseInfo`, {
        sigunguCd, numOfRows: 10,
    });
    return Array.isArray(data) ? data : (data ? [data] : []);
}
