/**
 * Market Regime System - Manages inflation/growth quadrants and asset class performance
 */

export const REGIMES = {
  EXPANSION: 'expansion',      // Inflation ↑, Growth ↑
  GOLDILOCKS: 'goldilocks',    // Inflation ↓, Growth ↑
  DEFLATION: 'deflation',      // Inflation ↓, Growth ↓
  STAGFLATION: 'stagflation'   // Inflation ↑, Growth ↓
};

export const ASSET_CLASSES = {
  CRYPTO: 'crypto',
  EQUITIES: 'equities',
  FIXED_INCOME: 'fixed_income',
  COMMODITIES: 'commodities',
  FX: 'fx',
  VOLATILITY: "volatility",
  CREDIT: 'credit',
  GENERALIST: 'generalist' // For pods without specific asset class
};

// Performance modifiers: very_favorable, favorable, neutral, negative, very_negative
// Applied as multipliers to pod returns
const REGIME_MODIFIERS = {
  [REGIMES.EXPANSION]: {
    [ASSET_CLASSES.CRYPTO]: 1.3,        // very_favorable
    [ASSET_CLASSES.EQUITIES]: 1.2,      // favorable
    [ASSET_CLASSES.COMMODITIES]: 1.15,  // favorable
    [ASSET_CLASSES.CREDIT]: 1.1,        // favorable - growth supports credit
    [ASSET_CLASSES.FX]: 1.0,
    [ASSET_CLASSES.VOLATILITY]: 0.9,             // neutral
    [ASSET_CLASSES.FIXED_INCOME]: 0.9,  // negative
    [ASSET_CLASSES.GENERALIST]: 1.0     // neutral
  },
  [REGIMES.GOLDILOCKS]: {
    [ASSET_CLASSES.CRYPTO]: 1.15,       // favorable
    [ASSET_CLASSES.EQUITIES]: 1.3,      // very_favorable
    [ASSET_CLASSES.CREDIT]: 1.25,       // very_favorable - ideal conditions for credit
    [ASSET_CLASSES.FIXED_INCOME]: 1.1,  // favorable
    [ASSET_CLASSES.FX]: 1.05,           // favorable
    [ASSET_CLASSES.VOLATILITY]: 0.95,
    [ASSET_CLASSES.COMMODITIES]: 0.95,  // negative
    [ASSET_CLASSES.GENERALIST]: 1.0     // neutral
  },
  [REGIMES.DEFLATION]: {
    [ASSET_CLASSES.FIXED_INCOME]: 1.3,  // very_favorable
    [ASSET_CLASSES.FX]: 1.1,            // favorable
    [ASSET_CLASSES.EQUITIES]: 0.85,     // negative
    [ASSET_CLASSES.CRYPTO]: 0.7,        // very_negative
    [ASSET_CLASSES.COMMODITIES]: 0.8,   // negative
    [ASSET_CLASSES.CREDIT]: 0.8,        // negative - deflation makes debt harder to service
    [ASSET_CLASSES.VOLATILITY]: 1.5,
    [ASSET_CLASSES.GENERALIST]: 0.95    // negative
  },
  [REGIMES.STAGFLATION]: {
    [ASSET_CLASSES.COMMODITIES]: 1.3,   // very_favorable
    [ASSET_CLASSES.CRYPTO]: 1.1,        // favorable
    [ASSET_CLASSES.FX]: 0.9,            // negative
    [ASSET_CLASSES.EQUITIES]: 0.75,     // very_negative
    [ASSET_CLASSES.FIXED_INCOME]: 0.85, // negative
    [ASSET_CLASSES.CREDIT]: 0.75,       // very_negative - defaults rise in stagflation
    [ASSET_CLASSES.VOLATILITY]: 1.25,
    [ASSET_CLASSES.GENERALIST]: 0.9     // negative
  }
};

export class MarketRegime {
  constructor(startDate) {
    this.current_regime = REGIMES.EXPANSION; // Start with expansion
    this.regime_start_date = new Date(startDate);
    this.regime_duration_days = this.generateRegimeDuration(); // 1.5-3 months (45-90 days)
    this.regime_end_date = new Date(this.regime_start_date);
    this.regime_end_date.setDate(this.regime_end_date.getDate() + this.regime_duration_days);
    
    // Track regime history
    this.regime_history = [{
      regime: this.current_regime,
      start_date: new Date(this.regime_start_date),
      end_date: new Date(this.regime_end_date)
    }];
  }
  
  generateRegimeDuration() {
    // Random duration between 1.5 and 3 months (45-90 trading days)
    // Assuming ~21 trading days per month
    const minDays = Math.floor(1.5 * 21); // ~32 days
    const maxDays = Math.floor(3 * 21);   // ~63 days
    return Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  }
  
  update(currentDate) {
    // Check if regime should transition
    if (currentDate >= this.regime_end_date) {
      this.transitionToNewRegime(currentDate);
      return true; // Return true if regime changed
    }
    return false;
  }
  
  transitionToNewRegime(currentDate) {
    // Select new regime (can't be the same as current)
    const availableRegimes = Object.values(REGIMES).filter(r => r !== this.current_regime);
    const newRegime = availableRegimes[Math.floor(Math.random() * availableRegimes.length)];
    
    this.current_regime = newRegime;
    this.regime_start_date = new Date(currentDate);
    this.regime_duration_days = this.generateRegimeDuration();
    this.regime_end_date = new Date(this.regime_start_date);
    this.regime_end_date.setDate(this.regime_end_date.getDate() + this.regime_duration_days);
    
    // Add to history
    this.regime_history.push({
      regime: this.current_regime,
      start_date: new Date(this.regime_start_date),
      end_date: new Date(this.regime_end_date)
    });
    
    // Keep only last 10 regime changes
    if (this.regime_history.length > 10) {
      this.regime_history.shift();
    }
  }
  
  getRegimeModifier(assetClass) {
    return REGIME_MODIFIERS[this.current_regime][assetClass] || 1.0;
  }
  
  getDaysRemaining(currentDate) {
    const daysRemaining = Math.ceil((this.regime_end_date - currentDate) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  }
  
  getRegimeInfo() {
    return {
      current_regime: this.current_regime,
      regime_start_date: this.regime_start_date,
      regime_end_date: this.regime_end_date,
      days_remaining: this.getDaysRemaining(new Date()),
      regime_history: this.regime_history
    };
  }
}

// Export modifiers for use in Strategist
export { REGIME_MODIFIERS };

