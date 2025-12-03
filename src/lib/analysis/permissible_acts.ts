export interface PermissibleAct {
    facility: string;
    allowed: boolean;
    reason: string;
    relatedLaw?: string;
    category: string; // New field
}

const FACILITY_CATEGORIES: Record<string, string> = {
    '단독주택': '주거시설',
    '공동주택': '주거시설',
    '아파트': '주거시설',
    '제1종근린생활시설': '상업/생활',
    '제2종근린생활시설': '상업/생활',
    '판매시설': '상업/생활',
    '공장': '산업시설',
    '창고시설': '산업시설'
};

const COMMON_FACILITIES_KO = Object.keys(FACILITY_CATEGORIES);

export function analyzePermissibleActs(regulations: any[]): PermissibleAct[] {
    const acts: PermissibleAct[] = [];

    // Check for specific zoning keywords in the regulations
    const isNaturalGreen = regulations.some(r => r.luseLawNm?.includes('자연녹지지역') || r.content?.includes('자연녹지지역'));
    const isCommercial = regulations.some(r => r.luseLawNm?.includes('상업지역') || r.content?.includes('상업지역'));
    const isPreservationForest = regulations.some(r => r.luseLawNm?.includes('보전산지') || r.content?.includes('보전산지'));
    const isBlind = regulations.some(r => r.content?.includes('맹지')); // Rudimentary check, usually handled elsewhere

    COMMON_FACILITIES_KO.forEach(facility => {
        let allowed = true;
        let reason = '국토계획법 및 조례에 따라 허용 가능성 높음';
        let relatedLaw = '국토의 계획 및 이용에 관한 법률';

        // Simplified Rule Engine
        if (facility === '아파트') {
            if (isNaturalGreen) {
                allowed = false;
                reason = '자연녹지지역에서는 아파트 건축이 불가능합니다 (4층 이하만 가능).';
                relatedLaw = '국토의 계획 및 이용에 관한 법률 시행령 제71조';
            }
        }

        if (facility === '공장') {
            if (isNaturalGreen && !isCommercial) {
                allowed = false;
                reason = '자연녹지지역에서는 공장 건축이 제한될 수 있습니다 (첨단업종 등 예외 있음).';
                relatedLaw = '국토의 계획 및 이용에 관한 법률 시행령 제71조';
            }
        }

        if (isPreservationForest) {
            if (facility !== '단독주택' && facility !== '창고시설') {
                allowed = false;
                reason = '보전산지에서는 농림어업용 시설 외 건축이 엄격히 제한됩니다.';
                relatedLaw = '산지관리법 제12조';
            }
        }

        // Blind land restriction (if detected in regulations, though usually physical)
        if (isBlind) {
            allowed = false;
            reason = '맹지에서는 건축행위가 불가능합니다.';
        }

        acts.push({
            facility,
            allowed,
            reason,
            relatedLaw,
            category: FACILITY_CATEGORIES[facility] || '기타'
        });
    });

    return acts;
}

export function getRecommendedActs(acts: PermissibleAct[], landChar: any): PermissibleAct[] {
    const possibleActs = acts.filter(act => act.allowed);

    // Heuristic Scoring
    const scoredActs = possibleActs.map(act => {
        let score = 0;
        const isForest = landChar?.lndSeCdNm?.includes('산') || landChar?.lndcNm === '임야';
        const isField = landChar?.lndcNm === '전' || landChar?.lndcNm === '답';

        // Prioritize based on land type
        if (isForest) {
            if (act.facility === '단독주택') score += 10; // Country house
            if (act.facility === '창고시설') score += 8; // Storage
            if (act.facility === '제1종근린생활시설') score += 5;
        } else if (isField) {
            if (act.facility === '단독주택') score += 10;
            if (act.facility === '제1종근린생활시설') score += 8;
            if (act.facility === '창고시설') score += 6;
        } else {
            // Urban/General
            if (act.facility === '제1종근린생활시설') score += 10;
            if (act.facility === '제2종근린생활시설') score += 9;
            if (act.facility === '단독주택') score += 8;
        }

        return { ...act, score };
    });

    // Sort by score desc
    return scoredActs.sort((a, b) => b.score - a.score).slice(0, 3);
}

export function groupActsByCategory(acts: PermissibleAct[]) {
    return acts.reduce((acc, act) => {
        if (!acc[act.category]) acc[act.category] = [];
        acc[act.category].push(act);
        return acc;
    }, {} as Record<string, PermissibleAct[]>);
}
