/**
 * Recruitment system - Generates candidate profiles for hiring
 */

const SPECIALISMS = {
  "Global Macro": { beta_mu: 0.4, beta_sigma: 0.5, vol_range: [0.01, 0.03] },
  "Equity TMT": { beta_mu: 1.1, beta_sigma: 0.2, vol_range: [0.015, 0.04] },
  "Fixed Income RV": { beta_mu: 0.05, beta_sigma: 0.1, vol_range: [0.005, 0.01] },
  "Deep Value": { beta_mu: 0.8, beta_sigma: 0.3, vol_range: [0.01, 0.02] },
  "Stat Arb": { beta_mu: 0.0, beta_sigma: 0.05, vol_range: [0.005, 0.015] }
};

const NAMES_FIRST = ["Brad", "Chad", "Winston", "Preston", "Chip", "Trey", "Gorman", "Liz", "Sloane", "Caroline"];
const NAMES_LAST = ["Sterling", "Hancock", "Vanderbilt", "Roth", "Dubois", "Kowalski", "Chen", "Gupta", "Schmidt"];

const BIOS = [
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

function normalRandom(mean, stdDev) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
}

export function generateRecruit() {
  const specEntries = Object.entries(SPECIALISMS);
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
  const ego_factor = normalRandom(1.1, 0.2);
  const total_ask = Math.max(250_000, valuation * ego_factor);
  
  const bonus_ratio = Math.random() * 0.4 + 0.4; // 0.4-0.8
  const signing_bonus = Math.round(Math.floor(total_ask * bonus_ratio) / 10000) * 10000;
  const salary = Math.round(Math.floor(total_ask * (1 - bonus_ratio)) / 10000) * 10000;
  
  let pnl_cut = 10;
  if (annual_alpha > 0.05) pnl_cut += 5;
  if (lifetime_pnl_m > 100) pnl_cut += 5;
  
  const name = `${NAMES_FIRST[Math.floor(Math.random() * NAMES_FIRST.length)]} ${NAMES_LAST[Math.floor(Math.random() * NAMES_LAST.length)]}`;
  
  return {
    id: crypto.randomUUID(),
    name: name,
    specialism: specName,
    bio: BIOS[Math.floor(Math.random() * BIOS.length)],
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

