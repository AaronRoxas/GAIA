import type { HazardType } from './hazard-icons';

export interface HazardSafetyGuideContent {
  /** Short subtitle under the hazard name */
  summary: string;
  before: string[];
  during: string[];
  after: string[];
}

/** Readiness guides aligned with Philippine DRR messaging (prep, response, recovery). */
export const HAZARD_SAFETY_GUIDES: Record<HazardType, HazardSafetyGuideContent> = {
  flood: {
    summary: 'Flooding affects low-lying and riverine communities—prioritize evacuation routes and elevated shelter.',
    before: [
      'Know your barangay’s flood hazard map and the nearest evacuation center.',
      'Keep go-bags with IDs, meds, whistles, flashlight, bottled water, and copies of contacts.',
      'Elevate valuables and documents; unplug appliances before water enters.',
      'Clear drains and canals near your property when safe; report blocked infrastructure.',
      'Monitor PAGASA red/orange rainfall warnings and local DRRMO advisories.',
    ],
    during: [
      'Move to higher ground immediately; avoid walking or driving through moving water.',
      'Stay off flooded roads — manholes and currents are often invisible beneath.',
      'If trapped indoors, move to the highest floor; signal for rescue with bright cloth or flashlight.',
      'Listen only to verified updates from LGU / DRRMO / NDRRMC channels.',
      'Shut off mains power if instructed or if water threatens electrical installations.',
    ],
    after: [
      'Do not return until LGU declares the area safe; watch for weakened structures.',
      'Document damage for LGU assessments; discard food that touched floodwater.',
      'Disinfect surfaces; use bottled or boiled water until water quality clears.',
      'Watch for stray wires, snakes, sharp debris; use boots and gloves for cleanup.',
      'Check on vulnerable neighbors once you are stable; coordinate with responders.',
    ],
  },
  typhoon: {
    summary: 'Tropical cyclones bring wind, surge, and rain—secure your home early and heed pre-emptive evacuation.',
    before: [
      'Stock 3+ days of water, shelf-stable food, battery radio, meds, cash in small denominations.',
      'Inspect roof ties, shutters, gutters; prune weak branches near power lines professionally.',
      'Know storm surge zones and evacuation signals (e.g., sirens/flags) in your locality.',
      'Charge power banks and fill clean containers with water.',
      'Register vulnerable household members with your barangay for priority assistance.',
    ],
    during: [
      'Stay indoors away from windows; shelter in inner rooms on lower floors unless flooding forces higher.',
      'If wind tears roofing, move beneath sturdy tables away from drywall debris.',
      'Never cross bridges or coastal roads mid-storm surge; tides can rise faster than expected.',
      'Avoid unnecessary travel during signal warnings.',
      'If flooding begins, prioritize life over property—evacuate with your go-bag.',
    ],
    after: [
      'Watch for dangling power lines and gas odors; report to utility/disaster desks.',
      'Photograph structural damage before cleanup for LGU/engineering inspections.',
      'Clear drainage paths only after assessing mudslide stability on slopes.',
      'Rebuild using typhoon-resilient strapping and roof clips where codes allow.',
      'Follow boil-water or health advisories until services normalize.',
    ],
  },
  landslide: {
    summary: 'Heavy rain on steep slopes can trigger debris flows—early recognition saves lives.',
    before: [
      'Avoid building or camping in identified landslide-prone areas; consult geohazard maps.',
      'Install flexible drainage to direct water away from slopes above your home.',
      'Watch for tilting trees, new cracks in walls, or muddy springs—report to DRRMO.',
      'Plan multiple exit routes upslope and cross-slope, not only downslope.',
      'Monitor intense monsoon or post-typhoon rainfall forecasts.',
    ],
    during: [
      'If the ground moves or you hear a low rumble, evacuate immediately to stable high ground.',
      'Do not shelter in narrow valleys or river channels; move perpendicular to flow paths.',
      'Stay alert at night; rain-triggered slides are harder to see—keep radio on.',
      'Avoid driving through mountain roads with fresh rockfall or mud on pavement.',
      'If trapped, protect airways; make noise and use phone/SMS when signal returns.',
    ],
    after: [
      'Do not re-enter until geotechnical teams clear the slope and structures.',
      'Report new cracks, leaning posts, or broken utility lines.',
      'Help document blocked roads for faster engineering response.',
      'Support community replanting of deep-rooted native vegetation on rehabilitated slopes.',
      'Review insurance/LGU assistance programs for shelter and livelihood recovery.',
    ],
  },
  earthquake: {
    summary: 'Sudden ground shaking requires immediate protective action and aftershock awareness.',
    before: [
      'Secure tall furniture, water heaters, and heavy wall hangings with straps.',
      'Practice Drop, Cover, and Hold with household members twice a year.',
      'Keep sturdy shoes and flashlight beside beds; know gas/water shutoff locations.',
      'Download offline maps and family rendezvous points outside damaged zones.',
      'Verify school and workplace drill policies; update emergency contacts.',
    ],
    during: [
      'Drop, Cover, and Hold under a sturdy desk; if no cover, cover head/neck beside an interior wall.',
      'Stay inside until shaking stops; do not run outside where glass or facades may fall.',
      'If outdoors, move to open space away from buildings, power lines, and slopes.',
      'If driving, pull over clear of overpasses; stay inside until shaking ends.',
      'If near the coast, move inland to higher ground after strong shaking—tsunami risk.',
    ],
    after: [
      'Expect aftershocks; re-inspect before re-entering—check for gas leaks and structural cracks.',
      'Use SMS/social check-ins to reduce network congestion; listen to Phivolcs advisories.',
      'Avoid damaged elevators and stairwells with visible shear cracks.',
      'Participate in barangay damage assessments; document for assistance programs.',
      'Offer first aid if trained; direct serious injuries to designated health stations.',
    ],
  },
  volcanic_eruption: {
    summary: 'Ashfall, pyroclastic flows, and lahars require sector-specific warnings from PHIVOLCS and LGUs.',
    before: [
      'Know your volcano’s alert level meanings and designated lahar escape corridors.',
      'Stock N95 masks, goggles, long sleeves, and plastic sheeting for ash sealing.',
      'Keep vehicle air filters serviced; plan indoor shelter for livestock when possible.',
      'Pre-pack go-bags oriented to dry ash (sealed food, wiped electronics).',
      'Stay within reliable warning channels (PHIVOLCS, LGU) — avoid rumor chains.',
    ],
    during: [
      'If told to evacuate, leave immediately along official routes—lahars follow river paths.',
      'Wear N95 or damp cloth over nose/mouth in ashfall; protect eyes if outside.',
      'Sweep ash off roofs only when structurally safe; wet ash to reduce dust.',
      'Avoid driving if visibility is near zero; pull over with lights on if necessary.',
      'Stay indoors with windows closed during heavy ashfall; seal door gaps if possible.',
    ],
    after: [
      'Clean ash carefully—spray with water, avoid dry sweeping that harms lungs.',
      'Check gutters and water tanks for ash contamination before drinking.',
      'Follow agricultural advisories on soil remediation and livestock feed safety.',
      'Watch for secondary lahars during rain even after alert levels drop.',
      'Support mental health check-ins; eruptions are prolonged stress events.',
    ],
  },
  storm_surge: {
    summary: 'Coastal inundation from storms can exceed roof lines in worst cases—evacuate early from surge maps.',
    before: [
      'Identify vertical evacuation buildings and routes above modeled surge lines.',
      'Move boats to safe harbors per PCG advisories; secure dock lines and fuel.',
      'Waterproof ground-level utilities; relocate vehicles to higher parking.',
      'Pack buoyant aids (life vests) if you must transit near coastlines.',
      'Monitor PAGASA storm surge height forecasts for your province.',
    ],
    during: [
      'Evacuate when ordered—surge arrival can precede peak winds.',
      'Never sightsee on seawalls or piers; sneaker waves and debris are lethal.',
      'If caught in rising water, seek highest possible point; call for rescue with location pin.',
      'Stay off coastal roads subject to wave overwash.',
      'Treat all floodwater as contaminated with salt, fuel, and debris.',
    ],
    after: [
      'Wait for Coast Guard / LGU clearance before maritime travel.',
      'Flush plumbing carefully if saltwater intruded; follow water district guidance.',
      'Inspect foundations for undermining; report beach erosion threatening homes.',
      'Corrosion risk rises—have electrical systems checked before full power-up.',
      'Participate in coastal greenbelt restoration where ecologists recommend.',
    ],
  },
  tsunami: {
    summary: 'Ocean-wide waves from distant or local earthquakes need immediate move to high ground.',
    before: [
      'Learn natural signs: strong shaking near shore, unusual sea withdrawal, roaring sound.',
      'Identify Tsunami Evacuation signs and practice walking routes under 15 minutes.',
      'Keep portable grab bags at coastal workplaces and schools.',
      'Register for SMS alerts where offered by provincial DRRMOs.',
      'Teach household members never to investigate an empty seabed.',
    ],
    during: [
      'After major coastal shaking, move inland and uphill without waiting for official text.',
      'Do not rely on wave count—dangerous currents can persist for hours.',
      'Avoid downed power lines mixed with seawater.',
      'If on a boat offshore, heed maritime broadcast—depth may matter more than land flight.',
      'Help move slow walkers; leave vehicles blocking exits if jams risk lives.',
    ],
    after: [
      'Remain in safe zones until NOAA/PAGASA/coastal LGU all-clear.',
      'Expect damaged ports; supply chains may stall—coordinate community kitchens.',
      'Test wells and fisheries for salt intrusion before consumption or sale.',
      'Document boats/gear losses for fisheries assistance desks.',
      'Rebuild set-backs respecting updated inundation zoning.',
    ],
  },
  fire: {
    summary: 'Structural and wildland fires spread fast—clear exits early and prioritize breathable air.',
    before: [
      'Install smoke alarms; replace batteries routinely; rehearse two escape paths.',
      'Keep fire extinguishers rated for kitchen/grease risks; train adults to PASS method.',
      'Store fuels away from dwellings; prohibit indoor open-flame mosquito control near curtains.',
      'For wildfires, maintain defensible space; store hoses and ladders accessibly.',
      'Teach children to stop-drop-roll and to never hide during alarms.',
    ],
    during: [
      'Escape immediately on alarm; crawl low beneath smoke; test doors before opening.',
      'If trapped, seal door gaps with wet cloth and signal from a window.',
      'Do not use elevators; assist mobility-limited neighbors if safe.',
      'For wildfires, follow perpendicular evacuation vectors away from convection column.',
      'Call emergency services once outside with exact address/bar landmark.',
    ],
    after: [
      'Do not re-enter until BFP clears structure stability and utility shutoffs.',
      'Ventilate cautiously wearing N95 masks; wet ash residues to minimize inhalation.',
      'Inventory losses for LGU/red cross assistance workflows.',
      'Schedule electrical inspection before re-powering burnt sections.',
      'Counsel kids on nightmares; disasters hit emotional safety too.',
    ],
  },
  drought: {
    summary: 'Prolonged dry spells strain water supply and crops—ration early and coordinate with communal systems.',
    before: [
      'Harvest rainwater legally in allowable containers; mulch gardens to preserve soil moisture.',
      'Fix leaks preemptively; share community water audits with barangay agriculture offices.',
      'Rotate livestock fodder reserves; diversify crops with tolerant varieties locally.',
      'Monitor PAGASA El Niño outlooks for seasonal planning.',
      'Maintain emergency hydration stores for medically vulnerable households.',
    ],
    during: [
      'Follow odd-even rationing schedules if mandated; avoid non-essential water use.',
      'Report illegal deep wells or diverted irrigation to watchdog authorities respectfully.',
      'Shift cooking to foods needing less water without sacrificing nutrition.',
      'Protect watershed tree cover—no slash-burn during prolonged drought.',
      'Watch for dust storms; shield airways outdoors.',
    ],
    after: [
      'Gradually replenish aquifers according to LGU/environment office guidance.',
      'Soil-test before replanting; replenish organic matter.',
      'Review livelihood insurance or crop calamity declarations.',
      'Advocate communal reservoir maintenance and leak mapping.',
      'Hydration education in schools reinforces long-term resilience.',
    ],
  },
  heat_wave: {
    summary: 'Extreme heat index days stress hearts and grids—shade, hydration schedules, and neighbor checks.',
    before: [
      'Install reflective curtains or external shades; prioritize passive ventilation schedules.',
      'Learn signs of heat stroke vs. heat exhaustion; keep ORS mixes available.',
      'Pre-arrange rotating power use if brownouts loom—preserve meds in coolers.',
      'Identify nearby cooled public spaces LGUs may open.',
      'Trim outdoor work toward dawn/dusk blocks when possible.',
    ],
    during: [
      'Hydrate regularly even without thirst—avoid sugary alcohol-heavy drinks outdoors labor.',
      'Never leave children or pets in parked vehicles—even “quick” errands.',
      'Use fans with misting sparingly indoors to avoid fungal growth; prioritize airflow.',
      'Check elders living alone twice daily during red heat index announcements.',
      'Wear breathable clothing; reschedule strenuous events when DOH flags extreme risk.',
    ],
    after: [
      'Recover sleep debt and electrolytes medically if cramps persist.',
      'Audit which cooling strategies worked; invest incrementally.',
      'Plant drought-tolerant street trees responsibly with arborist advice.',
      'Report heat-related outages to cooperative action centers.',
      'Discuss workplace heat mitigation with OSH focal persons.',
    ],
  },
  heat_index: {
    summary: 'High heat index combines temperature and humidity—PAGASA warnings indicate dangerous conditions requiring immediate precautions.',
    before: [
      'Monitor PAGASA heat index forecasts daily during hot months (March–June).',
      'Know heat index color codes: Yellow (27–32°C), Orange (33–41°C), Red (42–51°C), Purple (52°C+).',
      'Stock oral rehydration salts (ORS), electrolyte drinks, and cooling towels.',
      'Install reflective window films; ensure fans and AC units are serviced.',
      'Identify vulnerable household members (elderly, infants, those with chronic conditions).',
    ],
    during: [
      'Limit outdoor activities especially between 10am–4pm when heat index peaks.',
      'Drink water every 15–20 minutes even without feeling thirsty; avoid caffeine and alcohol.',
      'Recognize heat exhaustion signs: heavy sweating, weakness, cold/pale skin, nausea.',
      'Recognize heat stroke emergency: hot/red skin, no sweating, confusion, high body temperature—call emergency services immediately.',
      'Never leave children, elderly, or pets inside parked vehicles—temperatures can rise fatally within minutes.',
    ],
    after: [
      'Continue hydrating even after heat index drops; electrolyte balance takes time to restore.',
      'Monitor for delayed heat illness symptoms over the next 24–48 hours.',
      'Report any heat-related medical incidents to barangay health workers for community tracking.',
      'Review and improve household cooling strategies before the next heat advisory.',
      'Advocate for workplace heat safety policies if outdoor labor is required.',
    ],
  },
  heavy_rain: {
    summary: 'Intense convection without full tropical cyclone classification still triggers flash floods.',
    before: [
      'Clear rooftop and street-level drains ahead of monsoon bursts.',
      'Pre-position sump pumps where basements flood historically.',
      'Download radar apps; localize warnings to ridge vs. valley exposures.',
      'Share vehicular avoidance lists for perennial flood underpasses.',
      'Prep visibility gear for commuters (reflective stripes, headlights on).',
    ],
    during: [
      'Delay travel through known flood hotspots until stream gauges fall.',
      'Move vehicles to higher slabs if surge timing allows—life first.',
      'Avoid wading currents even knee-deep—they can sweep adults.',
      'Listen for thunderstorm wind shear if outdoors—seek sturdy buildings.',
      'Shelter commuters in malls only when interior refuge is safer than stalled traffic.',
    ],
    after: [
      'Pump basements gradually to avoid hydrostatic foundation blowouts.',
      'Photograph potholes opened by scour; notify DPWH/LGU.',
      'Test basement mold within 48h; remediate aggressively if immune-compromised present.',
      'Replenish sandbag stocks communally.',
      'Update rainfall thresholds that triggered your contingency actions.',
    ],
  },
  other: {
    summary: 'Hazards beyond this list still follow the same readiness rhythm: know risk, watch warnings, adapt quickly.',
    before: [
      'Subscribe to widest official alert channels covering your locality — not influencers alone.',
      'Maintain adaptable go-bags: cash, chargers, laminated emergency numbers.',
      'Map neighbors with skills (medical, engineering, boating) you can mutually aid.',
      'Schedule household scenario talks quarterly; rotate who leads drills.',
      'Back up vital documents encrypted in cloud plus USB in go-bag.',
    ],
    during: [
      'Pause, verify source credibility, then act on strongest official guidance available.',
      'Communicate calmly in group chats — stamped time/location prevents panic loops.',
      'Conserve phone battery except for SOS unless safe to recharge.',
      'Use whistles and mirrors where voice or data fails in remote terrain.',
      'Offer calm presence to frightened children/animal companions.',
    ],
    after: [
      'Conduct after-action reflections with household notes—what stalled decisions?',
      'Restock depleted kits within one week once commerce resumes.',
      'Volunteer capacities through accredited CSOs/DROMIC channels before ad hoc convoys.',
      'Push feedback on unclear warning language to LGU accountability desks constructively.',
      'Sleep/recover; burnout reduces community resilience loops.',
    ],
  },
};
