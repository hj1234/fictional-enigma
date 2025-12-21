/**
 * Pod class - Contains all logic related to individual trading pods.
 */
import { ASSET_CLASSES } from './MarketRegime.js';

export class Pod {
  constructor(id, name, specialism, alpha, beta, salary, pnl_cut, asset_class = null) {
    this.id = id;
    this.name = name;
    this.specialism = specialism;
    this.alpha = alpha;
    this.beta = beta;
    this.salary = salary;
    this.pnl_cut = pnl_cut;
    this.asset_class = asset_class || this.inferAssetClassFromSpecialism(specialism);
    
    // Economic State
    this.cumulative_pnl = 0.0;
    this.high_water_mark = 0.0;
    this.weight = 10.0;
    this.pnl_at_month_start = 0.0;
    
    // Risk Management
    this.is_active = true;
    this.is_fired = false;
    
    // Drawdown Tracking
    this.perf_index = 100.0;
    this.peak_index = 100.0;
    this.current_drawdown = 0.0;
    this.drawdown_warning_sent = false; // Legacy flag for immediate check
    this.last_drawdown_email_date = null; // Track when last drawdown email was sent
    
    // Momentum/Streak Tracking
    this.recent_returns = [];
    this.momentum_window = 10;
    this.momentum_factor = 0.0;
    this.momentum_strength = 0.15;
    this.mean_reversion_rate = 0.1;
  }
  
  inferAssetClassFromSpecialism(specialism) {
    // Map specialisms to asset classes
    const mapping = {
      'Crypto': ASSET_CLASSES.CRYPTO,
      'Equity TMT': ASSET_CLASSES.EQUITIES,
      'Deep Value': ASSET_CLASSES.EQUITIES,
      'Fixed Income RV': ASSET_CLASSES.FIXED_INCOME,
      'Global Macro': ASSET_CLASSES.FX,
      'Stat Arb': ASSET_CLASSES.GENERALIST,
      'Generalist': ASSET_CLASSES.GENERALIST
    };
    return mapping[specialism] || ASSET_CLASSES.GENERALIST;
  }
  
  tick(allocated_capital, market_return, regime_modifier = 1.0) {
    if (!this.is_active) return 0.0;
    
    // Calculate Base Return
    // Realistic hedge fund noise: lower for higher beta (more market-correlated)
    // High beta funds have less idiosyncratic risk, low beta funds have more
    // Base noise scales inversely with beta (but with a floor)
    const base_noise = 0.0015 + (1.0 - this.beta) * 0.001; // Range: 0.15% to 0.25% daily (reduced from 0.5%)
    let effective_beta = this.beta;
    let adjusted_noise = base_noise;
    
    // Defensive behavior when in drawdown (but less aggressive)
    if (this.current_drawdown < -0.02) {
      const drawdown_severity = Math.abs(this.current_drawdown);
      // More gradual defensive response (max 50% reduction, not 75%)
      const defensive_factor = Math.min(0.5, drawdown_severity * 8);
      adjusted_noise = base_noise * (1 - defensive_factor);
      effective_beta = this.beta * (1 - defensive_factor * 0.2); // Less beta reduction
    }
    
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const noise = z0 * adjusted_noise;
    
    const base_return = (effective_beta * market_return) + this.alpha + noise;
    
    // Apply regime modifier to base return
    const regime_adjusted_return = base_return * regime_modifier;
    
    // Calculate Momentum Component (smoother, less volatile)
    if (this.recent_returns.length >= 3) {
      const recent = this.recent_returns.slice(-5);
      const avg_recent = recent.reduce((a, b) => a + b, 0) / recent.length;
      // Reduced momentum impact and smoother mean reversion
      this.momentum_factor = (this.momentum_factor * (1 - this.mean_reversion_rate * 0.5)) + 
                            (avg_recent * this.mean_reversion_rate * 1.5);
    } else {
      this.momentum_factor = 0.0;
    }
    
    // Reduced momentum contribution (70% of original)
    const momentum_contribution = this.momentum_factor * (this.momentum_strength * 0.7);
    const daily_return_pct = regime_adjusted_return + momentum_contribution;
    
    // Store return for momentum
    this.recent_returns.push(base_return);
    if (this.recent_returns.length > this.momentum_window) {
      this.recent_returns.shift();
    }
    
    // Calculate PnL
    const pnl_dollars = allocated_capital * daily_return_pct;
    
    // Update Performance Index
    this.perf_index = this.perf_index * (1 + daily_return_pct);
    
    if (this.perf_index > this.peak_index) {
      this.peak_index = this.perf_index;
    }
    
    this.current_drawdown = (this.perf_index - this.peak_index) / this.peak_index;
    
    return pnl_dollars;
  }
  
  addPnL(pnl_dollars) {
    this.cumulative_pnl += pnl_dollars;
  }
  
  updateWeight(increment) {
    this.weight = Math.max(0.0, this.weight + increment);
  }
  
  calculateAllocation(total_weight, gross_exposure) {
    if (total_weight === 0) return 0.0;
    const pod_share = this.weight / total_weight;
    return gross_exposure * pod_share;
  }
  
  getSerialized(total_weight) {
    // Calculate monthly PnL (PnL made since start of current month)
    const monthly_pnl = this.cumulative_pnl - this.pnl_at_month_start;
    
    return {
      id: this.id,
      name: this.name,
      specialism: this.specialism,
      asset_class: this.asset_class,
      alpha: this.alpha,
      beta: this.beta,
      pnl: this.cumulative_pnl,
      monthly_pnl: monthly_pnl,
      drawdown: this.current_drawdown,
      status: this.is_active ? "Active" : "Stopped",
      weight: this.weight,
      alloc_pct: total_weight > 0 ? (this.weight / total_weight) : 0.0
    };
  }
}

