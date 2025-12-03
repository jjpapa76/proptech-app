// Market Data Constants
// Extracted from various reports (Securities firms, Research institutes)
// Update this file manually or via admin UI to reflect latest market conditions.

export const MARKET_INDICATORS = {
    // Financial
    PF_INTEREST_RATE: 8.5, // Project Financing Interest Rate (%) - High Risk
    MORTGAGE_RATE: 4.5, // Mortgage Rate (%)

    // Market Risk
    UNSOLD_RISK_LEVEL: 'HIGH', // HIGH, MEDIUM, LOW
    VACANCY_RATE_SEOUL_OFFICE: 2.1, // %
    VACANCY_RATE_SEOUL_RETAIL: 8.5, // %

    // Construction
    CONSTRUCTION_COST_PER_PY: 8500000, // KRW per Pyeong (Standard)

    // Sentiment
    MARKET_SENTIMENT: 'BEARISH', // BULLISH, NEUTRAL, BEARISH
};

export const RISK_THRESHOLDS = {
    PF_RATE_HIGH: 8.0,
    VACANCY_RATE_HIGH: 10.0,
};
