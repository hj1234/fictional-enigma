/**
 * Recruitment system - Generates candidate profiles for hiring
 */
import { ASSET_CLASSES } from './MarketRegime.js';

function inferAssetClassFromSpecialism(specialism) {
  const mapping = {
    'Crypto': ASSET_CLASSES.CRYPTO,
    'Equity TMT': ASSET_CLASSES.EQUITIES,
    'Deep Value': ASSET_CLASSES.EQUITIES,
    'Fixed Income RV': ASSET_CLASSES.FIXED_INCOME,
    'Credit': ASSET_CLASSES.CREDIT,
    'Credit Trading': ASSET_CLASSES.CREDIT,
    'Distressed Credit': ASSET_CLASSES.CREDIT,
    'High Yield Credit': ASSET_CLASSES.CREDIT,
    'Credit Arbitrage': ASSET_CLASSES.CREDIT,
    'Global Macro': ASSET_CLASSES.FX,
    'Stat Arb': ASSET_CLASSES.GENERALIST,
    'Generalist': ASSET_CLASSES.GENERALIST
  };
  return mapping[specialism] || ASSET_CLASSES.GENERALIST;
}

const DEFAULT_SPECIALISMS = {
  "Global Macro": { beta_mu: 0.4, beta_sigma: 0.5, vol_range: [0.01, 0.03] },
  "Equity TMT": { beta_mu: 1.1, beta_sigma: 0.2, vol_range: [0.015, 0.04] },
  "Fixed Income RV": { beta_mu: 0.05, beta_sigma: 0.1, vol_range: [0.005, 0.01] },
  "Deep Value": { beta_mu: 0.8, beta_sigma: 0.3, vol_range: [0.01, 0.02] },
  "Stat Arb": { beta_mu: 0.0, beta_sigma: 0.05, vol_range: [0.005, 0.015] }
};

const DEFAULT_NAMES_FIRST = ["Brad", "Chad", "Winston", "Preston", "Chip", "Trey", "Gorman", "Liz", "Sloane", "Caroline"];
const DEFAULT_NAMES_LAST = ["Sterling", "Hancock", "Vanderbilt", "Roth", "Dubois", "Kowalski", "Chen", "Gupta", "Schmidt"];

const DEFAULT_BIOS = [
  "Claims he predicted the 2008 crash (he was 12).",
  "Spent 3 years at Citadel. Has a non-compete he thinks is 'unenforceable'.",
  "Writes a substack about interest rates. 500k followers.",
  "Only trades when Mercury is in retrograde.",
  "Previously managed money for a cartel (allegedly).",
  "Wears a vest in the shower. Pure efficiency.",
  "Thinks 'Risk Management' is for cowards.",
  "Brings his own Bloomberg keyboard to interviews.",
  "Left last firm because the coffee wasn't single-origin."
];

// Global recruitment data (can be set by ContentLoader)
let SPECIALISMS = DEFAULT_SPECIALISMS;
let NAMES_FIRST = DEFAULT_NAMES_FIRST;
let NAMES_LAST = DEFAULT_NAMES_LAST;
let BIOS = DEFAULT_BIOS;

export function setRecruitmentData(recruitmentData) {
  if (recruitmentData) {
    if (recruitmentData.specialisms) {
      SPECIALISMS = recruitmentData.specialisms;
    }
    if (recruitmentData.names_first && Array.isArray(recruitmentData.names_first)) {
      NAMES_FIRST = recruitmentData.names_first;
    }
    if (recruitmentData.names_last && Array.isArray(recruitmentData.names_last)) {
      NAMES_LAST = recruitmentData.names_last;
    }
    if (recruitmentData.bios && Array.isArray(recruitmentData.bios)) {
      BIOS = recruitmentData.bios;
    }
  }
}

function normalRandom(mean, stdDev) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
}

export function generateRecruit(recruitmentData = null) {
  // Check if we have new format (candidates array)
  if (recruitmentData?._candidates && Array.isArray(recruitmentData._candidates) && recruitmentData._candidates.length > 0) {
    // New format: pick a random candidate
    const activeCandidates = recruitmentData._candidates.filter(c => c.active !== false);
    if (activeCandidates.length > 0) {
      const candidate = activeCandidates[Math.floor(Math.random() * activeCandidates.length)];
      
      // Generate stats based on candidate's specialism data
      const raw_alpha = normalRandom(0.0001, 0.0002);
      const annual_alpha = raw_alpha * 252;
      
      const beta = normalRandom(candidate.beta_mu, candidate.beta_sigma);
      
      const drawdown_pct = Math.floor(Math.random() * 31) + 5; // 5-35
      const years_exp = Math.floor(Math.random() * 14) + 2; // 2-15
      const lifetime_pnl_m = Math.max(1, Math.floor((raw_alpha * 10000 * years_exp) + Math.floor(Math.random() * 46) + 5));
      
      // Valuation logic
      let valuation = 200_000;
      
      if (annual_alpha > 0) {
        valuation += (annual_alpha * 100) * 1_000_000;
      }
      
      const dist_from_zero = Math.abs(beta);
      if (dist_from_zero < 0.2) valuation += 2_000_000;
      else if (dist_from_zero < 0.5) valuation += 500_000;
      
      valuation += (lifetime_pnl_m * 20_000);
      
      if (drawdown_pct > 20) valuation *= 0.6;
      else if (drawdown_pct < 8) valuation *= 1.2;
      
      // Demands
      // Randomize salary between 100k and 250k in 5k increments
      const min_salary = 100_000;
      const max_salary = 250_000;
      const increment = 5_000;
      const num_increments = (max_salary - min_salary) / increment;
      const random_increment = Math.floor(Math.random() * (num_increments + 1));
      const salary = min_salary + (random_increment * increment);
      
      // Calculate signing bonus using valuation system (can be much higher than salary)
      const ego_factor = normalRandom(1.1, 0.2);
      const total_ask = Math.max(250_000, valuation * ego_factor);
      
      const bonus_ratio = Math.random() * 0.4 + 0.4; // 0.4-0.8
      const signing_bonus = Math.round(Math.floor(total_ask * bonus_ratio) / 10000) * 10000;
      
      let pnl_cut = 10;
      if (annual_alpha > 0.05) pnl_cut += 5;
      if (lifetime_pnl_m > 100) pnl_cut += 5;
      
      return {
        id: candidate.id || crypto.randomUUID(),
        name: `${candidate.first_name} ${candidate.last_name}`,
        specialism: candidate.specialism,
        asset_class: candidate.asset_class || ASSET_CLASSES.GENERALIST,
        bio: candidate.bio,
        stats: {
          beta: Math.round(beta * 100) / 100,
          alpha: raw_alpha,
          alpha_display: `${annual_alpha > 0 ? '+' : ''}${(annual_alpha * 100).toFixed(1)}%`,
          last_drawdown: `-${drawdown_pct}%`,
          lifetime_pnl: `+$${lifetime_pnl_m}M`
        },
        demands: {
          signing_bonus: signing_bonus,
          salary: salary,
          pnl_cut: pnl_cut
        }
      };
    }
  }
  
  // Fallback to old format (separate arrays)
  const specialisms = recruitmentData?.specialisms || SPECIALISMS;
  const namesFirst = recruitmentData?.names_first || NAMES_FIRST;
  const namesLast = recruitmentData?.names_last || NAMES_LAST;
  const bios = recruitmentData?.bios || BIOS;
  
  const specEntries = Object.entries(specialisms);
  const [specName, specData] = specEntries[Math.floor(Math.random() * specEntries.length)];
  
  // Generate stats
  const raw_alpha = normalRandom(0.0001, 0.0002);
  const annual_alpha = raw_alpha * 252;
  
  const beta = normalRandom(specData.beta_mu, specData.beta_sigma);
  
  const drawdown_pct = Math.floor(Math.random() * 31) + 5; // 5-35
  const years_exp = Math.floor(Math.random() * 14) + 2; // 2-15
  const lifetime_pnl_m = Math.max(1, Math.floor((raw_alpha * 10000 * years_exp) + Math.floor(Math.random() * 46) + 5));
  
  // Valuation logic
  let valuation = 200_000;
  
  if (annual_alpha > 0) {
    valuation += (annual_alpha * 100) * 1_000_000;
  }
  
  const dist_from_zero = Math.abs(beta);
  if (dist_from_zero < 0.2) valuation += 2_000_000;
  else if (dist_from_zero < 0.5) valuation += 500_000;
  
  valuation += (lifetime_pnl_m * 20_000);
  
  if (drawdown_pct > 20) valuation *= 0.6;
  else if (drawdown_pct < 8) valuation *= 1.2;
  
  // Demands
  // Randomize salary between 100k and 250k in 5k increments
  const min_salary = 100_000;
  const max_salary = 250_000;
  const increment = 5_000;
  const num_increments = (max_salary - min_salary) / increment;
  const random_increment = Math.floor(Math.random() * (num_increments + 1));
  const salary = min_salary + (random_increment * increment);
  
  // Calculate signing bonus using valuation system (can be much higher than salary)
  const ego_factor = normalRandom(1.1, 0.2);
  const total_ask = Math.max(250_000, valuation * ego_factor);
  
  const bonus_ratio = Math.random() * 0.4 + 0.4; // 0.4-0.8
  const signing_bonus = Math.round(Math.floor(total_ask * bonus_ratio) / 10000) * 10000;
  
  let pnl_cut = 10;
  if (annual_alpha > 0.05) pnl_cut += 5;
  if (lifetime_pnl_m > 100) pnl_cut += 5;
  
  const name = `${namesFirst[Math.floor(Math.random() * namesFirst.length)]} ${namesLast[Math.floor(Math.random() * namesLast.length)]}`;
  
  return {
    id: crypto.randomUUID(),
    name: name,
    specialism: specName,
    asset_class: inferAssetClassFromSpecialism(specName), // Old format - always infer
    bio: bios[Math.floor(Math.random() * bios.length)],
    stats: {
      beta: Math.round(beta * 100) / 100,
      alpha: raw_alpha,
      alpha_display: `${annual_alpha > 0 ? '+' : ''}${(annual_alpha * 100).toFixed(1)}%`,
      last_drawdown: `-${drawdown_pct}%`,
      lifetime_pnl: `+$${lifetime_pnl_m}M`
    },
    demands: {
      signing_bonus: signing_bonus,
      salary: salary,
      pnl_cut: pnl_cut
    }
  };
}

