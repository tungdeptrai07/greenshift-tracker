/**
 * GreenShift Tracker — Scope 1/2/3 Personal & Team Carbon Accounting + Net-Zero Pathway Engine
 * Emission factors grounded in EPA GHG Emission Factors Hub & IEA global grid averages (kg CO2e).
 */

export const EMISSION_FACTORS = {
  carPetrolKm: 0.192,      // kg CO2e / km (average ICE passenger vehicle)
  carEvKm: 0.053,          // kg CO2e / km (EV on mixed grid)
  transitKm: 0.041,        // kg CO2e / km (bus/rail average)
  shortFlightHr: 250.0,    // kg CO2e / flight-hour
  electricityKwh: 0.436,   // kg CO2e / kWh (global average grid)
  renewableKwh: 0.025,     // kg CO2e / kWh (solar/wind lifecycle)
  beefMeal: 6.5,           // kg CO2e / serving
  poultryMeal: 1.8,        // kg CO2e / serving
  plantMeal: 0.45,         // kg CO2e / serving
  cloudComputeHr: 0.085    // kg CO2e / GPU-server-hour
};

export const PROFILES = {
  student_commuter: {
    name: "University Commuter",
    carPetrolKmWeek: 85,
    transitKmWeek: 45,
    electricityKwhMonth: 210,
    renewableSharePct: 15,
    beefMealsWeek: 5,
    plantMealsWeek: 9,
    flightHoursYear: 6,
    cloudHoursMonth: 25,
    teamSize: 1
  },
  remote_startup: {
    name: "5-Person Tech Startup",
    carPetrolKmWeek: 240,
    transitKmWeek: 120,
    electricityKwhMonth: 1150,
    renewableSharePct: 30,
    beefMealsWeek: 18,
    plantMealsWeek: 42,
    flightHoursYear: 28,
    cloudHoursMonth: 420,
    teamSize: 5
  },
  eco_champion: {
    name: "Low-Carbon Champion",
    carPetrolKmWeek: 10,
    transitKmWeek: 90,
    electricityKwhMonth: 150,
    renewableSharePct: 80,
    beefMealsWeek: 0,
    plantMealsWeek: 18,
    flightHoursYear: 2,
    cloudHoursMonth: 15,
    teamSize: 1
  }
};

function round2(v) {
  return Math.round(v * 100) / 100;
}

export function calcCarbon(input) {
  const cfg = {
    carPetrolKmWeek: Math.max(0, Number(input.carPetrolKmWeek ?? 80)),
    transitKmWeek: Math.max(0, Number(input.transitKmWeek ?? 40)),
    electricityKwhMonth: Math.max(0, Number(input.electricityKwhMonth ?? 200)),
    renewableSharePct: Math.max(0, Math.min(100, Number(input.renewableSharePct ?? 20))),
    beefMealsWeek: Math.max(0, Number(input.beefMealsWeek ?? 4)),
    plantMealsWeek: Math.max(0, Number(input.plantMealsWeek ?? 10)),
    flightHoursYear: Math.max(0, Number(input.flightHoursYear ?? 4)),
    cloudHoursMonth: Math.max(0, Number(input.cloudHoursMonth ?? 20)),
    teamSize: Math.max(1, Math.round(Number(input.teamSize ?? 1)))
  };

  // Annualized kg CO2e by Scope & Category
  const scope1Commute = cfg.carPetrolKmWeek * 52 * EMISSION_FACTORS.carPetrolKm;
  const renFrac = cfg.renewableSharePct / 100;
  const gridFactor = renFrac * EMISSION_FACTORS.renewableKwh + (1 - renFrac) * EMISSION_FACTORS.electricityKwh;
  const scope2Energy = cfg.electricityKwhMonth * 12 * gridFactor;

  const transitYear = cfg.transitKmWeek * 52 * EMISSION_FACTORS.transitKm;
  const flightsYear = cfg.flightHoursYear * EMISSION_FACTORS.shortFlightHr;
  const dietYear = (cfg.beefMealsWeek * EMISSION_FACTORS.beefMeal + cfg.plantMealsWeek * EMISSION_FACTORS.plantMeal) * 52;
  const cloudYear = cfg.cloudHoursMonth * 12 * EMISSION_FACTORS.cloudComputeHr;
  const scope3Other = transitYear + flightsYear + dietYear + cloudYear;

  const totalAnnualKg = scope1Commute + scope2Energy + scope3Other;
  const perCapitaTonnes = totalAnnualKg / 1000 / cfg.teamSize;
  const parisBudgetTonnes = 2.3; // 2030 Paris-aligned per-capita target
  const treesToOffset = Math.ceil(totalAnnualKg / 21.77); // ~21.77 kg CO2/yr per mature tree

  const breakdown = [
    { key: "Mobility (ICE Car)", scope: "Scope 1", kg: round2(scope1Commute) },
    { key: "Electricity & Grid", scope: "Scope 2", kg: round2(scope2Energy) },
    { key: "Flights & Transit", scope: "Scope 3", kg: round2(flightsYear + transitYear) },
    { key: "Food & Diet", scope: "Scope 3", kg: round2(dietYear) },
    { key: "Cloud & AI Compute", scope: "Scope 3", kg: round2(cloudYear) }
  ].sort((a, b) => b.kg - a.kg);

  // Actionable Reduction Levers (ranked by annual kg saved)
  const levers = [];
  if (cfg.carPetrolKmWeek > 15) {
    const saved = cfg.carPetrolKmWeek * 0.6 * 52 * (EMISSION_FACTORS.carPetrolKm - EMISSION_FACTORS.transitKm);
    levers.push({ action: "Shift 60% of car commute to public transit / EV", savedKgYear: round2(saved) });
  }
  if (cfg.renewableSharePct < 85 && cfg.electricityKwhMonth > 50) {
    const targetGrid = 0.85 * EMISSION_FACTORS.renewableKwh + 0.15 * EMISSION_FACTORS.electricityKwh;
    const saved = Math.max(0, cfg.electricityKwhMonth * 12 * (gridFactor - targetGrid));
    levers.push({ action: "Switch electricity plan to 85% certified renewables", savedKgYear: round2(saved) });
  }
  if (cfg.beefMealsWeek >= 2) {
    const saved = Math.ceil(cfg.beefMealsWeek * 0.6) * 52 * (EMISSION_FACTORS.beefMeal - EMISSION_FACTORS.plantMeal);
    levers.push({ action: "Swap 60% of beef meals to plant-based alternatives", savedKgYear: round2(saved) });
  }
  if (cfg.flightHoursYear >= 4) {
    const saved = cfg.flightHoursYear * 0.5 * EMISSION_FACTORS.shortFlightHr;
    levers.push({ action: "Replace 50% of short-haul flights with rail / virtual meetings", savedKgYear: round2(saved) });
  }
  levers.sort((a, b) => b.savedKgYear - a.savedKgYear);

  const maxSavingsKg = levers.reduce((s, l) => s + l.savedKgYear, 0);
  const projectedAnnualKg = Math.max(0, totalAnnualKg - maxSavingsKg);
  const rating = perCapitaTonnes <= parisBudgetTonnes ? "Paris-Aligned (A)"
    : perCapitaTonnes <= 4.5 ? "Below Global Avg (B)"
      : perCapitaTonnes <= 8.0 ? "Moderate Impact (C)"
        : "High Carbon Footprint (D)";

  return {
    config: cfg,
    totalAnnualKg: round2(totalAnnualKg),
    totalAnnualTonnes: round2(totalAnnualKg / 1000),
    perCapitaTonnes: round2(perCapitaTonnes),
    parisGapTonnes: round2(perCapitaTonnes - parisBudgetTonnes),
    treesToOffset,
    rating,
    scopes: {
      scope1Kg: round2(scope1Commute),
      scope2Kg: round2(scope2Energy),
      scope3Kg: round2(scope3Other)
    },
    breakdown,
    levers,
    maxSavingsKg: round2(maxSavingsKg),
    projectedAnnualKg: round2(projectedAnnualKg)
  };
}

export function buildEsgReport(result) {
  return [
    `# GreenShift Tracker — Scope 1/2/3 Carbon Audit`,
    ``,
    `- **Annual Emissions:** ${result.totalAnnualTonnes} tCO2e (${result.totalAnnualKg.toLocaleString()} kg CO2e)`,
    `- **Per-Capita Intensity:** ${result.perCapitaTonnes} tCO2e / person (${result.rating})`,
    `- **Trees Needed for Annual Offset:** ${result.treesToOffset} mature trees`,
    `- **Potential Verified Savings:** ${result.maxSavingsKg.toLocaleString()} kg CO2e / yr -> Projected **${round2(result.projectedAnnualKg / 1000)} tCO2e**`,
    ``,
    `## Emissions Breakdown`,
    ...result.breakdown.map(b => `- **${b.key} (${b.scope}):** ${b.kg.toLocaleString()} kg CO2e`),
    ``,
    `## Highest-Impact Decarbonization Levers`,
    ...result.levers.map((l, i) => `${i + 1}. ${l.action} (**-${l.savedKgYear.toLocaleString()} kg CO2e/yr**)`)
  ].join("\n");
}
