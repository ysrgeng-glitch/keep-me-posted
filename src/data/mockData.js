// ====================================================
// JBS Southern Australia — Intelligence Platform
// Mock Data (development fallback)
// ====================================================

export const CATEGORIES = [
  'Market & Economy',
  'Legislation / Regulation',
  'Competition',
  'Climate / Weather',
  'Supply Chain',
  'Export / Trade',
  'Production Costs',
  'Forecasts / Projections',
]

export const REGIONS = ['SA', 'VIC', 'NSW', 'TAS', 'National', 'Global']
export const IMPACT_LEVELS = ['HIGH', 'MEDIUM', 'LOW']
export const VERIFICATION_STATUSES = ['VERIFIED_OFFICIAL', 'VERIFIED_MULTI', 'ANALYST_INFERENCE', 'UNCONFIRMED']
export const TIME_HORIZONS = ['IMMEDIATE', '30D', '90D', '6M', '12M']

// ====================================================
// News Articles (with full institutional fields)
// ====================================================

export const mockArticles = [
  {
    id: 'art-001',
    headline: 'ABARES Issues Emergency Drought Alert: Southern Cattle Regions Face Critical Water Shortage',
    summary: 'ABARES has elevated drought conditions in key southern Australian livestock regions to "critical" following below-average rainfall over the past six months. Soil moisture deficits across the VIC Wimmera and SA Flinders Ranges are at 20-year lows, threatening autumn pasture growth and forcing early destocking decisions across both states.',
    whyItMatters: 'This directly threatens the beef and lamb supply pipeline for SA and VIC processors over the next 6–9 months. Early destocking will temporarily increase saleyard throughput but will be followed by severe supply shortfalls as breeding stock is depleted.',
    category: 'Climate / Weather',
    impact: 'HIGH',
    regions: ['SA', 'VIC'],
    source: 'ABARES',
    sourceUrl: 'https://www.agriculture.gov.au/abares',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    shortTermImpact: 'Expect surge in saleyard volumes over the next 30–60 days as producers destock. Processing throughput up 15–20% short-term with increased competition for kill slots.',
    mediumTermImpact: 'Severe supply contraction in Q3–Q4 as breeding stock depleted. Significant price pressure across all cattle categories. Processor margins under sustained strain.',
    strategicRecommendation: 'Accelerate procurement of store cattle and yearlings immediately to build forward inventory ahead of supply tightening. Review all forward contracts. Assess cold storage capacity.',
    confidenceScore: 94,
    trending: true,
    tags: ['drought', 'water shortage', 'destocking', 'pasture', 'el nino', 'ABARES'],
    sentiment: -0.8,
    // Institutional fields
    verificationStatus: 'VERIFIED_OFFICIAL',
    financialImpactLow: 2000000,
    financialImpactHigh: 8000000,
    financialImpactLabel: '$2.0M–$8.0M EBITDA Risk',
    timeHorizon: '90D',
  },
  {
    id: 'art-002',
    headline: 'China Confirms Final 15% Tariff Reduction on Australian Beef Effective 1 July',
    summary: 'The Chinese Ministry of Commerce has confirmed a scheduled 15% reduction in import tariffs on Australian boxed beef, effective 1 July, as part of the ChAFTA final trajectory. This marks the terminal phased reduction, bringing eligible beef tariffs to zero for approved Australian processors.',
    whyItMatters: "China represents Australia's largest beef export market by value. This final tariff elimination will substantially improve price competitiveness for Australian processors against US and Brazilian beef across Chinese retail and foodservice channels.",
    category: 'Export / Trade',
    impact: 'HIGH',
    regions: ['National', 'Global'],
    source: 'DAFF',
    sourceUrl: 'https://www.agriculture.gov.au',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    shortTermImpact: 'Advance orders from Chinese importers expected to lift forward bookings immediately. Spot price uplift anticipated for premium export cuts — estimated 3–5% improvement.',
    mediumTermImpact: 'Structural improvement in export revenue across all export-grade processing facilities. Industry-wide annual benefit estimated at AUD $340M based on prior year export volumes.',
    strategicRecommendation: 'Lock in forward supply agreements with Chinese importers before competitors adjust pricing. Prioritise investment in export-grade processing line capacity and accreditation.',
    confidenceScore: 98,
    trending: true,
    tags: ['china', 'tariff', 'chafta', 'export', 'trade policy', 'beef'],
    sentiment: 0.9,
    verificationStatus: 'VERIFIED_OFFICIAL',
    financialImpactLow: 3500000,
    financialImpactHigh: 12000000,
    financialImpactLabel: '$3.5M–$12.0M Revenue Upside',
    timeHorizon: '6M',
  },
  {
    id: 'art-003',
    headline: 'SA Meatworks Industrial Action Imminent: Enterprise Agreement Collapse at Three Facilities',
    summary: 'Negotiations over a new enterprise agreement have broken down at three South Australian beef processing facilities. The AWU has lodged protected industrial action notices with Fair Work Australia, with work stoppages potentially commencing from next week.',
    whyItMatters: 'Any disruption to SA processing capacity during what is already a supply-constrained environment will cascade into delayed livestock turnoff, export shipment backlogs, and retailer supply gaps across the southern supply chain.',
    category: 'Supply Chain',
    impact: 'HIGH',
    regions: ['SA'],
    source: 'ABC Rural',
    sourceUrl: 'https://www.abc.net.au/rural',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    shortTermImpact: 'If action proceeds, expect 40–60% capacity reduction at affected plants. Livestock transport delays and spot market disruption within days.',
    mediumTermImpact: 'Accumulation of livestock creates quality risks from extended time-on-feed. Retailer supply gaps likely within 10–14 days of sustained action.',
    strategicRecommendation: 'Immediately assess alternative processing arrangements in VIC. Accelerate current livestock turnoff before action commences. Alert key export customers of potential delays.',
    confidenceScore: 79,
    trending: true,
    tags: ['industrial action', 'meatworks', 'enterprise agreement', 'AWU', 'south australia', 'strike'],
    sentiment: -0.75,
    verificationStatus: 'VERIFIED_MULTI',
    financialImpactLow: 1500000,
    financialImpactHigh: 5000000,
    financialImpactLabel: '$1.5M–$5.0M Revenue at Risk',
    timeHorizon: 'IMMEDIATE',
  },
  {
    id: 'art-004',
    headline: 'Feed Grain Prices Surge 22% on East Coast: Wheat and Barley Availability Severely Tightened',
    summary: 'Wheat and barley prices on the east coast have surged by an average of 22% over the past 30 days, driven by reduced Victorian crop forecasts, elevated export demand from Asian buyers, and ongoing rail freight disruptions limiting grain movement from WA surpluses to eastern states.',
    whyItMatters: 'Feed grain costs represent 60–70% of feedlot operating expenses. A sustained 22% price increase materially compresses margins for lotfeeders and may trigger early turnoff, tightening prime supply chain availability in 60–90 days.',
    category: 'Production Costs',
    impact: 'HIGH',
    regions: ['NSW', 'VIC', 'SA'],
    source: 'Grain Central',
    sourceUrl: 'https://www.graincentral.com',
    publishedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    shortTermImpact: 'Feedlot margins turn negative at current grain and cattle prices. Expect 10–15% reduction in new entries. Early turnoff of near-finished cattle to limit cost exposure.',
    mediumTermImpact: 'Reduction in finished cattle supply in 60–90 days. Grassfed premiums may increase as grain-finished supply tightens.',
    strategicRecommendation: 'Review feedlot procurement strategy urgently. Prioritise grassfed supply chains. Assess grain price hedging instruments.',
    confidenceScore: 88,
    trending: false,
    tags: ['feed grain', 'wheat', 'barley', 'feedlot', 'production costs', 'margin compression'],
    sentiment: -0.7,
    verificationStatus: 'ANALYST_INFERENCE',
    financialImpactLow: 800000,
    financialImpactHigh: 3000000,
    financialImpactLabel: '$800K–$3.0M EBITDA Risk',
    timeHorizon: '90D',
  },
  {
    id: 'art-005',
    headline: 'MLA Quarterly Outlook: Beef Prices Firm Through Q2, Lamb Facing Seasonal Softening',
    summary: "Meat & Livestock Australia's quarterly price outlook forecasts consistent beef prices through Q2, supported by tight grassfed supplies and strong export momentum. Lamb prices are forecast to soften 5–8% due to increased seasonal supply from the NSW autumn flush.",
    whyItMatters: 'Firm beef prices provide procurement planning certainty for Q2. The lamb softening signal warrants reviewing forward lamb purchasing strategy — a price dip could represent a meaningful buying opportunity.',
    category: 'Forecasts / Projections',
    impact: 'MEDIUM',
    regions: ['National'],
    source: 'MLA News',
    sourceUrl: 'https://www.mla.com.au',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    shortTermImpact: 'Stable beef procurement costs for the next 60–90 days. Budget planning confidence for Q2 operations.',
    mediumTermImpact: 'Lamb price softening creates inventory-building opportunity for processors with cold chain capacity.',
    strategicRecommendation: 'Lock in current beef supply contracts for Q2. Build frozen lamb inventory during the anticipated price dip to buffer off-season supply.',
    confidenceScore: 91,
    trending: false,
    tags: ['price outlook', 'beef', 'lamb', 'quarterly forecast', 'MLA', 'market intelligence'],
    sentiment: 0.3,
    verificationStatus: 'VERIFIED_OFFICIAL',
    financialImpactLow: 200000,
    financialImpactHigh: 800000,
    financialImpactLabel: '$200K–$800K Procurement Saving Opportunity',
    timeHorizon: '90D',
  },
  {
    id: 'art-006',
    headline: 'NLIS v2.0 Mandatory from 1 January: All Processing Facilities Must Upgrade Systems',
    summary: 'The Australian Government has confirmed mandatory implementation of NLIS v2.0, requiring enhanced electronic ear tag data and full chain-of-custody traceability for all beef cattle from 1 January next year. Industry-wide capital compliance costs estimated at AUD $85 million.',
    whyItMatters: 'All processing facilities must upgrade NLIS data management and scanning infrastructure before the deadline. Non-compliant operators will face processing suspension.',
    category: 'Legislation / Regulation',
    impact: 'HIGH',
    regions: ['National'],
    source: 'DAFF',
    sourceUrl: 'https://www.agriculture.gov.au/livestock-land-water/livestock/nlis',
    publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    shortTermImpact: 'Processor CAPEX commitments required by Q3 to meet installation and testing timelines. Approved vendor capacity already emerging as a constraint.',
    mediumTermImpact: 'Compliance creates a prerequisite for premium export market access including Japan and South Korea "clean beef" programs.',
    strategicRecommendation: 'Engage NLIS v2.0 approved technology vendors immediately. Prioritise system procurement and installation scheduling before vendor capacity tightens.',
    confidenceScore: 97,
    trending: false,
    tags: ['NLIS', 'regulation', 'traceability', 'compliance', 'livestock identification', 'DAFF'],
    sentiment: -0.2,
    verificationStatus: 'VERIFIED_OFFICIAL',
    financialImpactLow: 1200000,
    financialImpactHigh: 4000000,
    financialImpactLabel: '$1.2M–$4.0M Compliance CAPEX',
    timeHorizon: '6M',
  },
  {
    id: 'art-007',
    headline: 'Rabobank: Australian Cattle Herd Rebuild Cycle Nearing End — Supply Tightening From Q4',
    summary: "Rabobank's Agricultural Research team indicates the Australian cattle herd rebuilding cycle is entering its final phase. With female cattle retention declining and heifer slaughter percentages rising, Rabobank forecasts a 12–18% reduction in available processor cattle supply nationally from Q4.",
    whyItMatters: 'The end of herd rebuild cycles marks the beginning of multi-year supply constraint and price escalation phases for processors. The window for securing long-term supply arrangements at current prices is narrowing.',
    category: 'Forecasts / Projections',
    impact: 'HIGH',
    regions: ['National'],
    source: 'Beef Central',
    sourceUrl: 'https://www.beefcentral.com',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    shortTermImpact: 'No immediate price impact, but the strategic window for securing multi-year supply arrangements at current pricing is clearly closing.',
    mediumTermImpact: '12–18% cattle supply reduction forecast over 12–18 months. Significant processor throughput impact. Broad price support expected from Q1 next year.',
    strategicRecommendation: 'Aggressively negotiate 12–24 month supply agreements with key producers in the next 90 days. Review captive supply and backgrounding programs.',
    confidenceScore: 85,
    trending: true,
    tags: ['herd rebuild', 'supply forecast', 'cattle cycle', 'rabobank', 'supply tightening', 'price outlook'],
    sentiment: -0.4,
    verificationStatus: 'ANALYST_INFERENCE',
    financialImpactLow: 5000000,
    financialImpactHigh: 20000000,
    financialImpactLabel: '$5.0M–$20.0M Throughput Revenue at Risk',
    timeHorizon: '12M',
  },
  {
    id: 'art-008',
    headline: 'BOM Seasonal Outlook: Below-Average Rainfall Forecast for SA and Western VIC Through June',
    summary: "The Bureau of Meteorology's updated seasonal outlook shows a greater than 70% probability of below-average rainfall across southern South Australia and western Victoria. The outlook is driven by a persistently negative Indian Ocean Dipole combined with neutral ENSO conditions.",
    whyItMatters: 'Pasture growth in these regions will be significantly below normal through the critical autumn–winter feed accumulation window, increasing supplementary feed costs and potentially pushing producers toward earlier-than-planned turnoff.',
    category: 'Climate / Weather',
    impact: 'MEDIUM',
    regions: ['SA', 'VIC'],
    source: 'ABC Rural',
    sourceUrl: 'http://www.bom.gov.au/climate/outlooks/',
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    shortTermImpact: 'Supplementary feeding costs to rise sharply for SA and VIC graziers. Some early lamb turnoff expected within 4–6 weeks.',
    mediumTermImpact: 'Reduced lamb and beef production potential for the autumn–winter period. Impact on winter carcass weights and fat scores.',
    strategicRecommendation: 'Monitor saleyard flow increases from affected regions. Consider timing procurement to capture opportunistic destocking flows before supply tightens in Q3.',
    confidenceScore: 87,
    trending: false,
    tags: ['BOM', 'rainfall forecast', 'seasonal outlook', 'IOD', 'drought', 'pasture'],
    sentiment: -0.6,
    verificationStatus: 'VERIFIED_OFFICIAL',
    financialImpactLow: 300000,
    financialImpactHigh: 1200000,
    financialImpactLabel: '$300K–$1.2M Procurement Cost Risk',
    timeHorizon: '90D',
  },
  {
    id: 'art-009',
    headline: 'Tasmania Biosecurity Alert: Enhanced FMD Screening Activated at All Ports',
    summary: 'Biosecurity Tasmania has upgraded port entry screening protocols following a confirmed Foot-and-Mouth Disease incursion in Indonesia. While no Australian cases have been detected, DAFF has activated enhanced national surveillance and suspended all live animal movements from Southeast Asia.',
    whyItMatters: "An FMD incursion into Tasmania would immediately halt all beef and lamb exports from the state and trigger international market access suspensions. The island state's disease-free status commands significant price premiums in key export markets.",
    category: 'Supply Chain',
    impact: 'HIGH',
    regions: ['TAS', 'National'],
    source: 'DAFF',
    sourceUrl: 'https://www.agriculture.gov.au/biosecurity-trade/pests-diseases-weeds/animal/fmd',
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    shortTermImpact: 'No current operational impact. Enhanced compliance costs at port facilities. Heightened operational vigilance required.',
    mediumTermImpact: 'If an incursion occurs, total export market closure impact is estimated at AUD $2.1B nationally. Comprehensive scenario planning is critical.',
    strategicRecommendation: 'Review and refresh FMD response protocols immediately. Confirm all staff biosecurity training is current. Brief key export customers on Australian surveillance status.',
    confidenceScore: 91,
    trending: true,
    tags: ['FMD', 'biosecurity', 'foot and mouth', 'tasmania', 'indonesia', 'export risk'],
    sentiment: -0.85,
    verificationStatus: 'VERIFIED_OFFICIAL',
    financialImpactLow: 500000,
    financialImpactHigh: 50000000,
    financialImpactLabel: '$500K–$50M+ Catastrophic Export Risk (tail scenario)',
    timeHorizon: '30D',
  },
  {
    id: 'art-010',
    headline: 'Major Processor Announces $180M Southern NSW Expansion — New Capacity by December 2025',
    summary: 'A major Australian beef processor has announced a $180 million capital investment to expand processing capacity at its Riverina, NSW facility, adding a second kill floor and increasing daily throughput from 1,800 to 2,800 head. Full commissioning targeted for December 2025.',
    whyItMatters: "This substantial capacity addition will intensify competition for cattle supply across the Murrumbidgee–Riverina corridor and could draw supply volumes currently flowing to SA and VIC processing operations.",
    category: 'Competition',
    impact: 'MEDIUM',
    regions: ['NSW', 'SA', 'VIC'],
    source: 'The Land',
    sourceUrl: 'https://www.theland.com.au',
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    shortTermImpact: 'No immediate procurement impact during the 18-month construction phase. Window to consolidate SA and VIC producer relationships before new capacity comes online.',
    mediumTermImpact: 'Increased competition for NSW and northern VIC cattle supply from December 2025. Potential saleyard price uplift as processors compete for a tightening supply base.',
    strategicRecommendation: 'Strengthen producer loyalty and supply assurance programs in at-risk regions over the next 12 months. Review geographic procurement strategy for the Riverina corridor.',
    confidenceScore: 96,
    trending: false,
    tags: ['capacity expansion', 'competition', 'NSW', 'processing', 'supply competition'],
    sentiment: -0.3,
    verificationStatus: 'VERIFIED_MULTI',
    financialImpactLow: 2000000,
    financialImpactHigh: 8000000,
    financialImpactLabel: '$2.0M–$8.0M Annual Supply Competition Risk',
    timeHorizon: '12M',
  },
  {
    id: 'art-011',
    headline: 'RBA Holds Cash Rate at 4.35%: Agribusiness Finance Conditions Stable But Elevated',
    summary: 'The Reserve Bank of Australia held the official cash rate at 4.35% at its April meeting. The RBA noted inflation remains above target and rate cuts are unlikely before late in the year. Agribusiness variable lending rates remain near 7.5–8.2% across major lenders.',
    whyItMatters: 'Sustained high interest rates increase working capital costs for livestock buyers, processors financing stock-in-transit, and producers managing debt. Prolonged financial stress may accelerate forced livestock sales in leveraged operations.',
    category: 'Market & Economy',
    impact: 'MEDIUM',
    regions: ['National'],
    source: 'ABC Rural',
    sourceUrl: 'https://www.abc.net.au/rural',
    publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    shortTermImpact: 'No rate change provides consistent borrowing cost certainty for Q2 financial planning.',
    mediumTermImpact: 'Prolonged high rates may increase distressed livestock sales from over-leveraged producers, creating tactical buying opportunities.',
    strategicRecommendation: 'Monitor leveraged producer accounts for early signals of distressed selling. Maintain strong working capital position to capitalise on market dislocations.',
    confidenceScore: 99,
    trending: false,
    tags: ['RBA', 'interest rates', 'finance', 'cash rate', 'monetary policy', 'working capital'],
    sentiment: 0.0,
    verificationStatus: 'VERIFIED_OFFICIAL',
    financialImpactLow: 150000,
    financialImpactHigh: 500000,
    financialImpactLabel: '$150K–$500K Working Capital Cost Impact',
    timeHorizon: '6M',
  },
  {
    id: 'art-012',
    headline: 'Middle East Lamb Market Softening: Gulf Buyers Pivot to South American Supply on Price',
    summary: 'Live export volumes to Middle Eastern markets have declined 18% year-on-year as several Gulf state buyers have pivoted to chilled and frozen lamb imports from Uruguay and Chile, citing more competitive pricing.',
    whyItMatters: 'A structural shift in Middle East procurement preferences could soften SA lamb saleyard values as live export demand — which typically provides a firm price floor — retreats from the market.',
    category: 'Export / Trade',
    impact: 'MEDIUM',
    regions: ['SA', 'National', 'Global'],
    source: 'MLA News',
    sourceUrl: 'https://www.mla.com.au/prices-markets/market-reports-and-data/',
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    shortTermImpact: 'Reduced SA live export demand may soften sheep and lamb values at key saleyards over the next 30–60 days.',
    mediumTermImpact: 'If the trend persists, structural downward price realignment for sheepmeat in SA. Opportunity for increased carcase trade to capture volume from retreating live export channel.',
    strategicRecommendation: 'Review SA lamb procurement strategy. Monitor yard prices for early softening indicators. Potential to build lamb inventory at increasingly favourable prices.',
    confidenceScore: 76,
    trending: false,
    tags: ['lamb', 'live export', 'middle east', 'south america', 'sheepmeat', 'price softening'],
    sentiment: -0.4,
    verificationStatus: 'VERIFIED_OFFICIAL',
    financialImpactLow: 200000,
    financialImpactHigh: 800000,
    financialImpactLabel: '$200K–$800K Procurement Saving Opportunity',
    timeHorizon: '90D',
  },
]

// ====================================================
// Daily Briefing Mock
// ====================================================

export const mockDailyBriefing = {
  id: 'briefing-mock-001',
  briefing_date: new Date().toISOString().split('T')[0],
  briefing_text: `**INTELLIGENCE SUMMARY**
This morning's briefing covers 12 significant developments across drought conditions, export trade, industrial relations, and biosecurity. The overall intelligence picture presents a challenging near-term operating environment offset by meaningful medium-term export upside.

**NEW & CHANGED DEVELOPMENTS**
• [HIGH] ABARES drought alert upgraded to critical for SA Flinders Ranges and VIC Wimmera — supply tightening confirmed; $2.0M–$8.0M EBITDA risk
• [HIGH] China ChAFTA final tariff elimination confirmed for 1 July — $3.5M–$12.0M revenue upside for export-grade operations
• [HIGH] SA meatworks industrial action imminent — AWU protected notice lodged at three facilities; $1.5M–$5.0M revenue at immediate risk
• [HIGH] Feed grain prices surge 22% east coast — $800K–$3.0M EBITDA risk through feedlot supply chain
• [HIGH] TAS FMD biosecurity protocols elevated — Indonesia Bali Province incursion confirmed; tail risk scenario $50M+ export closure
• [MEDIUM] MLA Q2 price outlook: beef firm, lamb softening 5–8% — procurement window opening

**STRATEGIC ANALYSIS**
The simultaneous drought escalation and export market improvement creates a critical strategic window. JBS Southern Australia faces compressed near-term margins from input cost pressure (feed grain +22%, forced destocking premium pricing) while a significant export revenue opportunity is opening in China as tariffs reach zero. The SA industrial action is the most immediate operational risk — resolution in the next 48 hours is critical to maintain export commitment schedules.

The FMD biosecurity alert in Tasmania represents a low-probability, catastrophic-impact tail risk that demands immediate protocol review regardless of current probability assessments.

**FINANCIAL & OPERATIONAL IMPACT**
Aggregate near-term financial exposure: $6.0M–$17.0M EBITDA risk across active threats.
Primary upside: $3.5M–$12.0M revenue opportunity from China tariff elimination (6-month horizon).
Net position: Cautious — near-term headwinds are real and immediate; upside requires 3–6 months to materialise.

**LEADERSHIP RECOMMENDATIONS**
• Convene emergency SA industrial action response plan within 24 hours; identify VIC processing backup capacity immediately
• Initiate procurement of store cattle and yearlings this week to build forward inventory before supply tightening bites
• Contact top-3 Chinese importers this week to position for post-July tariff volume discussions
• Conduct FMD response protocol review within 48 hours; ensure all TAS facility staff are briefed
• Escalate grain price hedge assessment to CFO — review feedlot exposure and available instruments`,
  article_count: 12,
  change_count: 6,
  generated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
}

// ====================================================
// Dashboard KPI Data (legacy — derived from real data now)
// ====================================================

export const mockKPIs = {
  totalArticles: 847,
  highImpactToday: 4,
  regionsMonitored: 4,
  sourcesMonitored: 32,
  lastUpdated: new Date().toISOString(),
  sentimentScore: -0.24,
}

// ====================================================
// Forecast / Chart Data
// ====================================================

export const mockForecastData = {
  // Values in AUD $/kg cwt (not cents)
  beefPriceForecast: [
    { month: 'Oct', actual: 6.98, forecast: null },
    { month: 'Nov', actual: 7.10, forecast: null },
    { month: 'Dec', actual: 7.28, forecast: null },
    { month: 'Jan', actual: 7.35, forecast: null },
    { month: 'Feb', actual: null, forecast: 7.42, upper: 7.70, lower: 7.14 },
    { month: 'Mar', actual: null, forecast: 7.50, upper: 7.85, lower: 7.15 },
    { month: 'Apr', actual: null, forecast: 7.45, upper: 7.92, lower: 6.98 },
    { month: 'May', actual: null, forecast: 7.60, upper: 8.08, lower: 7.12 },
    { month: 'Jun', actual: null, forecast: 7.78, upper: 8.30, lower: 7.26 },
  ],
  lambPriceForecast: [
    { month: 'Oct', actual: 8.10, forecast: null },
    { month: 'Nov', actual: 8.05, forecast: null },
    { month: 'Dec', actual: 7.98, forecast: null },
    { month: 'Jan', actual: 7.92, forecast: null },
    { month: 'Feb', actual: null, forecast: 7.75, upper: 8.10, lower: 7.40 },
    { month: 'Mar', actual: null, forecast: 7.58, upper: 8.00, lower: 7.16 },
    { month: 'Apr', actual: null, forecast: 7.45, upper: 7.94, lower: 6.96 },
    { month: 'May', actual: null, forecast: 7.55, upper: 8.05, lower: 7.05 },
    { month: 'Jun', actual: null, forecast: 7.70, upper: 8.24, lower: 7.16 },
  ],
  sentimentTimeline: [
    { date: 'Oct 1',  score: -0.12 },
    { date: 'Oct 8',  score: -0.18 },
    { date: 'Oct 15', score: -0.14 },
    { date: 'Oct 22', score: -0.31 },
    { date: 'Oct 29', score: -0.27 },
    { date: 'Nov 5',  score: -0.38 },
    { date: 'Nov 12', score: -0.24 },
  ],
  categoryBreakdown: [
    { category: 'Climate / Weather',      count: 12, pct: 22 },
    { category: 'Market & Economy',       count: 9,  pct: 17 },
    { category: 'Export / Trade',         count: 8,  pct: 15 },
    { category: 'Legislation / Regulation', count: 7, pct: 13 },
    { category: 'Production Costs',       count: 6,  pct: 11 },
    { category: 'Supply Chain',           count: 5,  pct: 9  },
    { category: 'Forecasts / Projections',count: 5,  pct: 9  },
    { category: 'Competition',            count: 3,  pct: 6  },
  ],
}

export const mockMarketSignals = [
  { label: 'EYCI',            value: '$7.35/kg', change: '+2.4%', direction: 'up',   note: 'Eastern Young Cattle Indicator (cwt)' },
  { label: 'Nat. Trade Lamb', value: '$7.92/kg', change: '-1.1%', direction: 'down', note: 'National Trade Lamb Indicator (cwt)' },
  { label: 'AUD/USD',         value: '$0.647',   change: '+0.3%', direction: 'up',   note: 'Export pricing tailwind' },
  { label: 'Feed Wheat',      value: '$362/t',   change: '+8.2%', direction: 'up',   note: 'East coast spot price (AUD/tonne)' },
  { label: 'Mutton',          value: '$4.12/kg', change: '-3.2%', direction: 'down', note: 'Softer Middle East demand (cwt)' },
  { label: 'Export Beef Vol', value: '+6.1%',    change: 'YoY',   direction: 'up',   note: 'MTD volume vs prior year' },
]
