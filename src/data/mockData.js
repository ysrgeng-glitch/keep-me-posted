// ====================================================
// KEEP ME POSTED — Mock Data
// Australian Beef & Lamb Intelligence Platform
// Replace with real API responses in production
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

// ====================================================
// News Articles
// ====================================================

export const mockArticles = [
  {
    id: 'art-001',
    headline: 'ABARES Issues Emergency Drought Alert: Southern Cattle Regions Face Critical Water Shortage',
    summary:
      'ABARES has elevated drought conditions in key southern Australian livestock regions to "critical" following below-average rainfall over the past six months. Soil moisture deficits across the VIC Wimmera and SA Flinders Ranges are at 20-year lows, threatening autumn pasture growth and forcing early destocking decisions across both states.',
    whyItMatters:
      'This directly threatens the beef and lamb supply pipeline for SA and VIC processors over the next 6–9 months. Early destocking will temporarily increase saleyard throughput but will be followed by severe supply shortfalls as breeding stock is depleted.',
    category: 'Climate / Weather',
    impact: 'HIGH',
    regions: ['SA', 'VIC'],
    source: 'ABARES',
    sourceUrl: 'https://www.agriculture.gov.au/abares',
    publishedAt: '2024-04-10T06:30:00Z',
    shortTermImpact:
      'Expect surge in saleyard volumes over the next 30–60 days as producers destock. Processing throughput up 15–20% short-term with increased competition for kill slots.',
    mediumTermImpact:
      'Severe supply contraction in Q3–Q4 2024 as breeding stock depleted. Significant price pressure across all cattle categories. Processor margins under sustained strain.',
    strategicRecommendation:
      'Accelerate procurement of store cattle and yearlings immediately to build forward inventory ahead of supply tightening. Review all forward contracts. Assess cold storage capacity and timeline.',
    confidenceScore: 94,
    trending: true,
    tags: ['drought', 'water shortage', 'destocking', 'pasture', 'el nino', 'ABARES'],
    sentiment: -0.8,
  },
  {
    id: 'art-002',
    headline: 'China Confirms 15% Tariff Reduction on Australian Beef Imports Effective 1 July 2024',
    summary:
      'The Chinese Ministry of Commerce has confirmed a scheduled 15% reduction in import tariffs on Australian boxed beef, effective 1 July 2024, as part of the China–Australia Free Trade Agreement (ChAFTA) final trajectory. This marks the terminal phased reduction, bringing eligible beef tariffs to zero for approved Australian processors.',
    whyItMatters:
      "China represents Australia's largest beef export market by value. This final tariff elimination will substantially improve price competitiveness for Australian processors against US and Brazilian beef across Chinese retail and foodservice channels.",
    category: 'Export / Trade',
    impact: 'HIGH',
    regions: ['National', 'Global'],
    source: 'DAFF',
    sourceUrl: 'https://www.agriculture.gov.au',
    publishedAt: '2024-04-09T09:00:00Z',
    shortTermImpact:
      'Advance orders from Chinese importers expected to lift Australian beef forward bookings immediately. Spot price uplift anticipated for premium export cuts — estimated 3–5% improvement.',
    mediumTermImpact:
      'Structural improvement in export revenue across all export-grade processing facilities. Industry-wide annual benefit estimated at AUD $340M based on 2023 export volumes.',
    strategicRecommendation:
      'Lock in forward supply agreements with Chinese importers before competitors adjust pricing. Prioritise investment in export-grade processing line capacity and accreditation.',
    confidenceScore: 98,
    trending: true,
    tags: ['china', 'tariff', 'chafta', 'export', 'trade policy', 'beef'],
    sentiment: 0.9,
  },
  {
    id: 'art-003',
    headline: 'SA Meatworks Industrial Action Imminent: Enterprise Agreement Collapse at Three Major Facilities',
    summary:
      'Negotiations over a new enterprise agreement have broken down at three South Australian beef processing facilities operated by two major processors. The AWU has lodged protected industrial action notices with Fair Work Australia, with work stoppages potentially commencing from 18 April. Sticking points include shift loading rates, fatigue management protocols, and roster flexibility.',
    whyItMatters:
      'Any disruption to SA processing capacity during what is already a supply-constrained environment will cascade into delayed livestock turnoff, export shipment backlogs, and retailer supply gaps across the southern supply chain.',
    category: 'Supply Chain',
    impact: 'HIGH',
    regions: ['SA'],
    source: 'ABC Rural',
    sourceUrl: 'https://www.abc.net.au/rural',
    publishedAt: '2024-04-09T14:15:00Z',
    shortTermImpact:
      'If action proceeds, expect 40–60% capacity reduction at affected plants for the duration. Livestock transport delays and spot market disruption from week commencing 18 April.',
    mediumTermImpact:
      'Accumulation of livestock requiring processing creates quality risks from extended time-on-feed. Retailer supply gaps likely within 10–14 days of sustained action.',
    strategicRecommendation:
      'Immediately assess alternative processing arrangements in VIC. Accelerate current livestock turnoff before action commences. Proactively alert key export customers of potential delays.',
    confidenceScore: 79,
    trending: true,
    tags: ['industrial action', 'meatworks', 'enterprise agreement', 'AWU', 'south australia', 'strike'],
    sentiment: -0.75,
  },
  {
    id: 'art-004',
    headline: 'Feed Grain Prices Surge 22% on East Coast: Wheat and Barley Availability Severely Tightened',
    summary:
      'Wheat and barley prices on the east coast have surged by an average of 22% over the past 30 days, driven by reduced Victorian crop forecasts, elevated export demand from Asian buyers, and ongoing rail freight disruptions limiting grain movement from WA surpluses to eastern states. Feed lot operators across NSW and VIC report significant operating margin pressure.',
    whyItMatters:
      'Feed grain costs represent 60–70% of feedlot operating expenses. A sustained 22% price increase materially compresses margins for lotfeeders and may trigger early turnoff and reduced new entries, tightening prime supply chain availability in 60–90 days.',
    category: 'Production Costs',
    impact: 'HIGH',
    regions: ['NSW', 'VIC', 'SA'],
    source: 'Elders Market Intelligence',
    sourceUrl: 'https://www.elders.com.au/agribusiness-hub',
    publishedAt: '2024-04-08T10:30:00Z',
    shortTermImpact:
      'Feedlot margins turn negative at current grain and cattle prices for most operators. Expect 10–15% reduction in new entries to feed. Early turnoff of near-finished cattle to limit cost exposure.',
    mediumTermImpact:
      'Reduction in finished cattle supply in 60–90 days as feedlot entries fall. Grassfed premiums may increase as grain-finished supply tightens. Price outlook for export-grade beef remains firm.',
    strategicRecommendation:
      'Review feedlot procurement strategy urgently. Prioritise grassfed supply chains where margin is more defensible. Assess grain price hedging instruments available through Elders or Rabobank.',
    confidenceScore: 88,
    trending: false,
    tags: ['feed grain', 'wheat', 'barley', 'feedlot', 'production costs', 'margin compression'],
    sentiment: -0.7,
  },
  {
    id: 'art-005',
    headline: "MLA April Quarterly Outlook: National Beef Prices Firm Through Q2, Lamb Facing Seasonal Softening",
    summary:
      "Meat & Livestock Australia's April quarterly price outlook forecasts nationally consistent beef prices through Q2 2024, supported by tight grassfed supplies, strong domestic demand, and ongoing export momentum to Asian markets. Lamb prices are forecast to soften 5–8% due to increased seasonal supply from the NSW autumn flush and reduced live export volumes to the Middle East.",
    whyItMatters:
      'Firm beef prices provide procurement planning certainty for Q2. The lamb softening signal warrants reviewing forward lamb purchasing strategy — a price dip could represent a meaningful buying opportunity for processors with cold storage capacity.',
    category: 'Forecasts / Projections',
    impact: 'MEDIUM',
    regions: ['National'],
    source: 'MLA',
    sourceUrl: 'https://www.mla.com.au',
    publishedAt: '2024-04-07T08:00:00Z',
    shortTermImpact:
      'Stable beef procurement costs for the next 60–90 days. Budget planning confidence for Q2 operations. Lamb procurement window opening for cold storage building.',
    mediumTermImpact:
      'Lamb price softening creates inventory-building opportunity. Processors with cold chain capacity should consider forward purchasing against Q3 off-season supply tightness.',
    strategicRecommendation:
      'Lock in current beef supply contracts for Q2. Build frozen lamb inventory during the anticipated Q3 price dip to buffer off-season supply and improve margin mix.',
    confidenceScore: 82,
    trending: false,
    tags: ['price outlook', 'beef', 'lamb', 'quarterly forecast', 'MLA', 'market intelligence'],
    sentiment: 0.3,
  },
  {
    id: 'art-006',
    headline: 'NLIS v2.0 Mandatory from 1 January 2025: All Processing Facilities Must Upgrade Systems',
    summary:
      'The Australian Government has confirmed mandatory implementation of NLIS v2.0, requiring enhanced electronic ear tag data including GPS waypoints, health treatment records, and full chain-of-custody traceability for all beef cattle from 1 January 2025. Industry-wide capital compliance costs are estimated at AUD $85 million. Non-compliant operators will face processing suspension.',
    whyItMatters:
      'All processing facilities must upgrade their NLIS data management and scanning infrastructure before the deadline. The new system, while costly, creates a competitive differentiator in premium international markets demanding enhanced traceability credentials.',
    category: 'Legislation / Regulation',
    impact: 'HIGH',
    regions: ['National'],
    source: 'DAFF',
    sourceUrl: 'https://www.agriculture.gov.au/livestock-land-water/livestock/nlis',
    publishedAt: '2024-04-06T11:00:00Z',
    shortTermImpact:
      'Processor CAPEX commitments required by Q3 2024 to meet installation and testing timelines. Approved vendor capacity already emerging as a constraint — early engagement critical.',
    mediumTermImpact:
      'Compliance creates a prerequisite for premium export market access including Japan and South Korea "clean beef" programs, which require enhanced traceability as of 2025.',
    strategicRecommendation:
      'Engage NLIS v2.0 approved technology vendors immediately. Prioritise system procurement and installation scheduling before vendor capacity tightens further. Use compliance as a brand differentiation opportunity in premium export pitches.',
    confidenceScore: 97,
    trending: false,
    tags: ['NLIS', 'regulation', 'traceability', 'compliance', 'livestock identification', 'DAFF'],
    sentiment: -0.2,
  },
  {
    id: 'art-007',
    headline: 'Rabobank: Australian Cattle Herd Rebuild Cycle Nearing End — Supply Tightening From Q4 2024',
    summary:
      "Rabobank's Agricultural Research team has published analysis indicating the Australian cattle herd rebuilding cycle, which commenced in 2021 following the La Niña recovery, is entering its final phase. With female cattle retention declining and heifer slaughter percentages rising, Rabobank forecasts a 12–18% reduction in available processor cattle supply nationally from Q4 2024.",
    whyItMatters:
      'The end of herd rebuild cycles historically marks the beginning of multi-year supply constraint and price escalation phases for processors. The window for securing long-term supply arrangements at current prices is narrowing.',
    category: 'Forecasts / Projections',
    impact: 'HIGH',
    regions: ['National'],
    source: 'Rabobank',
    sourceUrl: 'https://research.rabobank.com/far/en/sectors/animal-protein/australia',
    publishedAt: '2024-04-05T07:00:00Z',
    shortTermImpact:
      'No immediate price impact, but the strategic window for securing multi-year supply arrangements at current pricing is clearly closing.',
    mediumTermImpact:
      '12–18% cattle supply reduction forecast over 12–18 months. Significant processor throughput impact. Broad price support for all cattle categories expected from Q1 2025.',
    strategicRecommendation:
      'Aggressively negotiate 12–24 month supply agreements with key producers and agents in the next 90 days. Review captive supply and backgrounding programs. Assess supply base diversification across all monitored regions.',
    confidenceScore: 85,
    trending: true,
    tags: ['herd rebuild', 'supply forecast', 'cattle cycle', 'rabobank', 'supply tightening', 'price outlook'],
    sentiment: -0.4,
  },
  {
    id: 'art-008',
    headline: 'BOM Seasonal Outlook: Below-Average Rainfall Forecast for SA and Western VIC Through June',
    summary:
      "The Bureau of Meteorology's updated seasonal outlook for April–June 2024 shows a greater than 70% probability of below-average rainfall across southern South Australia and western Victoria. The outlook is driven by a persistently negative Indian Ocean Dipole combined with neutral ENSO conditions trending toward a developing La Niña event.",
    whyItMatters:
      'Pasture growth in these regions will be significantly below normal through the critical autumn–winter feed accumulation window, increasing supplementary feed costs and potentially pushing producers toward earlier-than-planned turnoff decisions.',
    category: 'Climate / Weather',
    impact: 'MEDIUM',
    regions: ['SA', 'VIC'],
    source: 'BOM',
    sourceUrl: 'http://www.bom.gov.au/climate/outlooks/',
    publishedAt: '2024-04-05T09:30:00Z',
    shortTermImpact:
      'Supplementary feeding costs to rise sharply for SA and VIC graziers. Some early lamb turnoff in western VIC and mid-north SA expected within 4–6 weeks.',
    mediumTermImpact:
      'Reduced lamb and beef production potential for the autumn–winter period. Impact on winter carcass weights and fat scores. Processor grade mix implications.',
    strategicRecommendation:
      'Monitor saleyard flow increases from affected regions. Consider timing procurement to capture opportunistic destocking flows before supply tightens materially in Q3.',
    confidenceScore: 87,
    trending: false,
    tags: ['BOM', 'rainfall forecast', 'seasonal outlook', 'IOD', 'drought', 'pasture'],
    sentiment: -0.6,
  },
  {
    id: 'art-009',
    headline: 'Tasmania Biosecurity Alert: Enhanced FMD Screening Protocols Activated at All Ports',
    summary:
      'Biosecurity Tasmania has upgraded port entry screening protocols following a confirmed Foot-and-Mouth Disease incursion in Indonesia affecting Bali province. While no Australian cases have been detected, DAFF has activated enhanced national surveillance and suspended all live animal movements from Southeast Asia pending further epidemiological assessment.',
    whyItMatters:
      "An FMD incursion into Tasmania would immediately halt all beef and lamb exports from the state and trigger international market access suspensions. The island state's disease-free status is a critical premium market differentiator commanding price premiums in key export markets.",
    category: 'Supply Chain',
    impact: 'HIGH',
    regions: ['TAS', 'National'],
    source: 'DAFF',
    sourceUrl: 'https://www.agriculture.gov.au/biosecurity-trade/pests-diseases-weeds/animal/fmd',
    publishedAt: '2024-04-04T15:00:00Z',
    shortTermImpact:
      'No current operational impact to processing. Enhanced compliance costs at port facilities. Heightened operational vigilance across all livestock-adjacent supply chain points required.',
    mediumTermImpact:
      'If an incursion occurs, total export market closure impact is estimated at AUD $2.1B. Comprehensive scenario planning and contingency protocols are critical to activate immediately.',
    strategicRecommendation:
      'Review and refresh FMD response protocols immediately. Confirm all staff biosecurity training is current. Brief key export customers on Australian surveillance status and response capability.',
    confidenceScore: 91,
    trending: true,
    tags: ['FMD', 'biosecurity', 'foot and mouth', 'tasmania', 'indonesia', 'export risk'],
    sentiment: -0.85,
  },
  {
    id: 'art-010',
    headline: 'JBS Australia Announces $180M Southern NSW Processing Expansion — New Capacity by December 2025',
    summary:
      'JBS Australia has announced a $180 million capital investment to expand processing capacity at its Riverina, NSW facility, adding a second kill floor and increasing daily throughput from 1,800 to 2,800 head. Construction commences July 2024 with full commissioning targeted for December 2025.',
    whyItMatters:
      "This substantial capacity addition from Australia's largest beef processor will intensify competition for cattle supply across the Murrumbidgee–Riverina corridor and could draw supply volumes currently flowing to SA and VIC processing operations.",
    category: 'Competition',
    impact: 'MEDIUM',
    regions: ['NSW', 'SA', 'VIC'],
    source: 'The Land',
    sourceUrl: 'https://www.theland.com.au',
    publishedAt: '2024-04-03T08:00:00Z',
    shortTermImpact:
      'No immediate procurement impact during the 18-month construction phase. Window available to consolidate SA and VIC producer relationships before new competitive capacity comes online.',
    mediumTermImpact:
      'Increased competition for NSW and northern VIC cattle supply from December 2025. Potential saleyard price uplift as processors compete for a tightening supply base.',
    strategicRecommendation:
      'Strengthen producer loyalty and supply assurance programs in at-risk supply regions over the next 12 months. Review geographic procurement strategy for the Riverina and Murrumbidgee corridor with urgency.',
    confidenceScore: 96,
    trending: false,
    tags: ['JBS', 'capacity expansion', 'competition', 'NSW', 'processing', 'supply competition'],
    sentiment: -0.3,
  },
  {
    id: 'art-011',
    headline: 'RBA Holds Cash Rate at 4.35%: Agribusiness Finance Conditions Stable But Elevated',
    summary:
      'The Reserve Bank of Australia held the official cash rate at 4.35% at its April meeting, consistent with market expectations. The RBA noted inflation remains above target and rate cuts are unlikely before late 2024. Agribusiness variable lending rates remain near 7.5–8.2% across major lenders.',
    whyItMatters:
      'Sustained high interest rates increase working capital costs for livestock buyers, processors financing stock-in-transit, and producers managing debt facilities. Prolonged financial stress may accelerate forced livestock sales in leveraged operations.',
    category: 'Market & Economy',
    impact: 'MEDIUM',
    regions: ['National'],
    source: 'ABC Rural',
    sourceUrl: 'https://www.abc.net.au/rural',
    publishedAt: '2024-04-02T14:30:00Z',
    shortTermImpact:
      'No rate change provides consistent borrowing cost certainty for Q2 financial planning. Budget assumptions remain valid for the current quarter.',
    mediumTermImpact:
      'Prolonged high rates may increase distressed livestock sales from over-leveraged producers, creating tactical buying opportunities at saleyards.',
    strategicRecommendation:
      'Monitor leveraged producer accounts and agent contacts for early signals of distressed selling. Maintain strong working capital position to capitalise on any market dislocations.',
    confidenceScore: 99,
    trending: false,
    tags: ['RBA', 'interest rates', 'finance', 'cash rate', 'monetary policy', 'working capital'],
    sentiment: 0.0,
  },
  {
    id: 'art-012',
    headline: 'Middle East Lamb Market Softening: Gulf Buyers Pivot to South American Supply on Price',
    summary:
      'Live export volumes to Middle Eastern markets have declined 18% year-on-year as several Gulf state buyers have pivoted to chilled and frozen lamb imports from Uruguay and Chile, citing more competitive pricing and comparable quality. WA exporters report significant booking difficulties for Q3 2024 shipments.',
    whyItMatters:
      'While directly affecting live export operators, a structural shift in Middle East procurement preferences could soften SA lamb saleyard values as live export demand — which typically provides a firm price floor — retreats from the market.',
    category: 'Export / Trade',
    impact: 'MEDIUM',
    regions: ['SA', 'National', 'Global'],
    source: 'MLA',
    sourceUrl: 'https://www.mla.com.au/prices-markets/market-reports-and-data/',
    publishedAt: '2024-04-01T09:00:00Z',
    shortTermImpact:
      'Reduced SA live export demand may soften sheep and lamb values at Pt Augusta and Murray Bridge saleyards over the next 30–60 days.',
    mediumTermImpact:
      'If the trend persists, structural downward price realignment for sheepmeat in SA. Opportunity for increased carcase trade to capture volume from retreating live export channel.',
    strategicRecommendation:
      'Review SA lamb procurement strategy. Monitor Murray Bridge and Naracoorte yard prices for early softening indicators. Potential to build lamb inventory at increasingly favourable prices.',
    confidenceScore: 76,
    trending: false,
    tags: ['lamb', 'live export', 'middle east', 'south america', 'sheepmeat', 'price softening'],
    sentiment: -0.4,
  },
  {
    id: 'art-013',
    headline: 'NSW DPI Announces $45M Drought Recovery Grants for Hunter Valley and Central Western Producers',
    summary:
      'The NSW Department of Primary Industries has announced $45 million in targeted drought recovery grants available to beef and sheep producers in the Hunter Valley and Central Western regions, covering restocking, fencing, water infrastructure, and pasture establishment. Applications open 15 April 2024.',
    whyItMatters:
      'Government restocking support will accelerate herd and flock rebuilding in key NSW supply regions, supporting future processing throughput volumes but potentially delaying near-term cattle availability as producers prioritise retention over sale.',
    category: 'Legislation / Regulation',
    impact: 'LOW',
    regions: ['NSW'],
    source: 'NSW DPI',
    sourceUrl: 'https://www.dpi.nsw.gov.au',
    publishedAt: '2024-03-31T10:00:00Z',
    shortTermImpact:
      'Marginal reduction in NSW saleyard throughput as producers elect to retain and restock rather than sell into the current market.',
    mediumTermImpact:
      'Positive long-term supply base recovery in NSW over 18–36 months. Processing throughput benefits expected from 2026 as rebuilt herds reach slaughter weight.',
    strategicRecommendation:
      'No immediate procurement action required. Monitor producer uptake rates to assess pace of rebuilding in key NSW supply zones. Update long-range supply projections accordingly.',
    confidenceScore: 88,
    trending: false,
    tags: ['NSW', 'drought recovery', 'grants', 'restocking', 'government support', 'DPI'],
    sentiment: 0.4,
  },
  {
    id: 'art-014',
    headline: 'Victorian Lamb Prices Hit 6-Month High at Bendigo and Hamilton — Supply Tightness Confirmed',
    summary:
      'Trade lamb and heavy lamb categories reached 6-month price highs at Bendigo and Hamilton saleyards this week, with competition between export processors, domestic retailers, and live exporters driving prices to 780–820c/kg cwt for heavy trade. Total yarding numbers remain 12% below year-ago levels across both yards.',
    whyItMatters:
      'Price records in VIC lamb markets confirm supply tightness and strong multi-channel demand. This creates both procurement cost pressure and export pricing opportunity as global lamb markets track firm through the Northern Hemisphere spring.',
    category: 'Market & Economy',
    impact: 'MEDIUM',
    regions: ['VIC'],
    source: 'Australian Livestock Markets',
    sourceUrl: 'https://www.australianlivestock.com.au',
    publishedAt: '2024-03-29T16:00:00Z',
    shortTermImpact:
      'VIC lamb procurement costs elevated. Consider exploring procurement diversification toward SA or NSW markets where supply conditions may be comparatively softer.',
    mediumTermImpact:
      'If high prices persist through Q2, review export lamb program volumes or adjust export pricing to preserve processing margins.',
    strategicRecommendation:
      'Seek procurement diversification across SA, NSW, and TAS markets. Review contract pricing structures for key retail accounts ahead of Q2 term renegotiations.',
    confidenceScore: 95,
    trending: false,
    tags: ['lamb prices', 'saleyard', 'VIC', 'bendigo', 'hamilton', 'supply tightness'],
    sentiment: 0.2,
  },
  {
    id: 'art-015',
    headline: 'AMIC Calls for Urgent Review of Beef Labelling Rules Amid Country-of-Origin Confusion at Retail',
    summary:
      'The Australian Meat Industry Council has formally requested the ACCC and DAFF investigate labelling irregularities in imported beef products sold under misleading "Product of Australia" adjacent branding. AMIC consumer research estimates 15–20% of packaged beef shoppers believe they are purchasing Australian product when the product is fully or partially imported.',
    whyItMatters:
      'Consumer confusion undermines the premium pricing power of genuine Australian beef in domestic retail, particularly for SA and VIC processors competing directly against imported product in major retail chains.',
    category: 'Legislation / Regulation',
    impact: 'MEDIUM',
    regions: ['National'],
    source: 'AMIC',
    sourceUrl: 'https://www.amic.org.au',
    publishedAt: '2024-03-28T11:00:00Z',
    shortTermImpact:
      'No immediate market impact. ACCC and DAFF regulatory response timelines typically 12–24 months from formal submission.',
    mediumTermImpact:
      'Successful labelling reform could recover 2–4% domestic market share for genuine Australian processors. Premium positioning strengthened in consumer-facing channels.',
    strategicRecommendation:
      'Support the AMIC submission. Reinforce genuine Australian provenance messaging across all consumer-facing materials. Leverage the regulatory action in key account negotiations with major retailers.',
    confidenceScore: 72,
    trending: false,
    tags: ['labelling', 'AMIC', 'ACCC', 'country of origin', 'consumer', 'retail', 'market share'],
    sentiment: 0.1,
  },
]

// ====================================================
// Dashboard KPI Data
// ====================================================

export const mockKPIs = {
  totalArticles: 847,
  highImpactToday: 4,
  regionsMonitored: 4,
  sourcesMonitored: 32,
  lastUpdated: new Date().toISOString(),
  weeklyArticleChange: 12,
  weeklyHighImpactChange: 2,
  sentimentScore: -0.24,
  sentimentTrend: 'deteriorating',
  avgConfidenceScore: 88,
}

// ====================================================
// Alert Banners
// ====================================================

export const mockAlerts = [
  {
    id: 'alert-001',
    level: 'CRITICAL',
    message:
      'SA meatworks industrial action imminent — AWU protected strike notice lodged at 3 processing facilities. Action may commence 18 April.',
    timestamp: '2024-04-09T14:15:00Z',
  },
  {
    id: 'alert-002',
    level: 'HIGH',
    message:
      'TAS biosecurity protocols elevated — FMD detected in Indonesia (Bali province). DAFF enhanced surveillance activated.',
    timestamp: '2024-04-04T15:00:00Z',
  },
  {
    id: 'alert-003',
    level: 'POSITIVE',
    message:
      'CONFIRMED: China zero tariff on Australian beef effective 1 July 2024. All ChAFTA-eligible processors to benefit.',
    timestamp: '2024-04-09T09:00:00Z',
  },
]

// ====================================================
// Trending Topics
// ====================================================

export const mockTrending = [
  { topic: 'Drought Conditions', count: 23, trend: 'up', sentiment: -0.8 },
  { topic: 'China Tariff Removal', count: 18, trend: 'up', sentiment: 0.7 },
  { topic: 'Feed Cost Pressures', count: 16, trend: 'up', sentiment: -0.6 },
  { topic: 'SA Industrial Action', count: 11, trend: 'stable', sentiment: -0.7 },
  { topic: 'Herd Rebuild Cycle', count: 9, trend: 'down', sentiment: -0.3 },
  { topic: 'TAS Biosecurity', count: 8, trend: 'up', sentiment: -0.5 },
  { topic: 'Middle East Export', count: 7, trend: 'stable', sentiment: 0.4 },
  { topic: 'Interest Rates', count: 6, trend: 'stable', sentiment: 0.0 },
]

// ====================================================
// Daily AI Briefing Summary
// ====================================================

export const mockDailySummary = {
  date: '2024-04-10',
  generatedAt: '2024-04-10T07:00:00Z',
  headline:
    'Drought pressures escalate across southern regions as China tariff win provides medium-term export tailwind',
  body:
    "Today's intelligence brief highlights a sharpening divergence between near-term domestic supply risks and medium-term export market opportunity. The ABARES drought alert upgrade for SA and VIC is the most consequential development, with forced destocking likely to drive short-term saleyard volatility before transitioning to a supply deficit by Q3. The confirmed China tariff elimination from July provides meaningful export revenue upside that partially offsets domestic margin pressures. The SA meatworks industrial action risk remains the most operationally urgent issue heading into this week — resolution will be closely watched.",
  keyThemes: ['Drought', 'China Trade', 'Industrial Action', 'Feed Costs'],
  overallOutlook: 'CAUTIOUS',
}

// ====================================================
// What Changed Today
// ====================================================

export const mockChangesToday = [
  {
    type: 'ESCALATED',
    description: 'SA meatworks strike risk elevated from MEDIUM to CRITICAL — protected action notice lodged',
    impact: 'HIGH',
  },
  {
    type: 'NEW',
    description: 'ABARES drought alert upgraded to Critical status for SA Flinders Ranges and VIC Wimmera',
    impact: 'HIGH',
  },
  {
    type: 'NEW',
    description: 'BOM rainfall forecast updated — below-average outlook confirmed for full April–June window',
    impact: 'MEDIUM',
  },
  {
    type: 'RESOLVED',
    description: 'NSW grain rail freight disruption partially resolved — barley movement from Dubbo corridor resuming',
    impact: 'MEDIUM',
  },
  {
    type: 'UPDATED',
    description: 'MLA eastern young cattle indicator (EYCI) revised upward — now tracking 2.4% above last week',
    impact: 'LOW',
  },
]

// ====================================================
// Forecast / Chart Data
// ====================================================

export const mockForecastData = {
  beefPriceForecast: [
    { month: 'Jan', actual: 698, forecast: null },
    { month: 'Feb', actual: 710, forecast: null },
    { month: 'Mar', actual: 728, forecast: null },
    { month: 'Apr', actual: 735, forecast: null },
    { month: 'May', actual: null, forecast: 742, upper: 770, lower: 714 },
    { month: 'Jun', actual: null, forecast: 750, upper: 785, lower: 715 },
    { month: 'Jul', actual: null, forecast: 745, upper: 792, lower: 698 },
    { month: 'Aug', actual: null, forecast: 760, upper: 808, lower: 712 },
    { month: 'Sep', actual: null, forecast: 778, upper: 830, lower: 726 },
  ],
  lambPriceForecast: [
    { month: 'Jan', actual: 810, forecast: null },
    { month: 'Feb', actual: 805, forecast: null },
    { month: 'Mar', actual: 798, forecast: null },
    { month: 'Apr', actual: 792, forecast: null },
    { month: 'May', actual: null, forecast: 775, upper: 810, lower: 740 },
    { month: 'Jun', actual: null, forecast: 758, upper: 800, lower: 716 },
    { month: 'Jul', actual: null, forecast: 745, upper: 794, lower: 696 },
    { month: 'Aug', actual: null, forecast: 755, upper: 805, lower: 705 },
    { month: 'Sep', actual: null, forecast: 770, upper: 824, lower: 716 },
  ],
  sentimentTimeline: [
    { date: 'Mar 1', score: -0.12 },
    { date: 'Mar 8', score: -0.18 },
    { date: 'Mar 15', score: -0.14 },
    { date: 'Mar 22', score: -0.31 },
    { date: 'Mar 29', score: -0.27 },
    { date: 'Apr 5', score: -0.38 },
    { date: 'Apr 10', score: -0.24 },
  ],
  categoryBreakdown: [
    { category: 'Climate / Weather', count: 12, pct: 22 },
    { category: 'Market & Economy', count: 9, pct: 17 },
    { category: 'Export / Trade', count: 8, pct: 15 },
    { category: 'Legislation / Regulation', count: 7, pct: 13 },
    { category: 'Production Costs', count: 6, pct: 11 },
    { category: 'Supply Chain', count: 5, pct: 9 },
    { category: 'Forecasts / Projections', count: 5, pct: 9 },
    { category: 'Competition', count: 3, pct: 6 },
  ],
}

// ====================================================
// Market Signals (Forecast Page)
// ====================================================

export const mockMarketSignals = [
  { label: 'EYCI (c/kg cwt)', value: '735c', change: '+2.4%', direction: 'up', note: 'Eastern Young Cattle Indicator' },
  { label: 'Lamb Indicator', value: '792c', change: '-1.1%', direction: 'down', note: 'National Trade Lamb' },
  { label: 'AUD/USD', value: '0.647', change: '+0.3%', direction: 'up', note: 'Export pricing tailwind' },
  { label: 'Feed Wheat (t)', value: 'AUD$362', change: '+8.2%', direction: 'up', note: 'East coast spot price' },
  { label: 'Mutton (c/kg)', value: '412c', change: '-3.2%', direction: 'down', note: 'Softer Middle East demand' },
  { label: 'Export Beef Vol.', value: '+6.1%', change: 'YoY', direction: 'up', note: 'Apr MTD vs prior year' },
]
