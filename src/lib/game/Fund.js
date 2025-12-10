/**
 * Fund class - Contains all logic related to the fund's balance sheet,
 * leverage, interest, and month-end processing.
 */
export class Fund {
  constructor(startDate) {
    // --- BALANCE SHEET ---
    this.investor_equity = 100_000_000.0;
    this.firm_cash = 25_000_000.0;
    this.equity_at_month_start = 100_000_000.0;
    
    this.accrued_interest = 0.0;
    
    // --- LEVERAGE ---
    this.target_leverage = 1.0;
    this.borrowed_amount = 0.0; // Fixed amount borrowed (only changes when user adjusts leverage)
    this.gross_exposure = 100_000_000.0; // investor_equity + borrowed_amount
    this.effective_leverage = 1.0; // Calculated as gross_exposure / investor_equity
    
    // --- RISK FLAGS ---
    this.has_used_leverage = false;
    this.sent_warning_8x = false;
    this.sent_warning_10x = false;
    this.sent_warning_12_5x = false;
    this.sent_warning_15x = false;
    
    // --- ECONOMICS ---
    this.interest_rate = 0.04;
    this.platform_fee_rate = 0.20;
    this.management_fee_rate = 0.02; // 2% annual management fee
    
    // --- MARKET DATA ---
    // Realistic market parameters:
    // - Annual return: ~8% (daily: ~0.031%)
    // - Annual volatility: ~16% (daily: ~1.01% = 0.0101)
    this.base_market_volatility = 0.0101; // ~16% annualized (0.0101 * sqrt(252) ≈ 0.16)
    this.market_volatility = 0.0101; // Current realized volatility (can deviate from base)
    this.current_daily_return_pct = 0.0;
    
    // Market dynamics for realistic returns (GARCH-like model)
    this.last_market_return = 0.0; // For autocorrelation
    this.last_squared_return = 0.0; // For GARCH variance calculation
    this.conditional_variance = Math.pow(this.base_market_volatility, 2); // GARCH conditional variance
    this.market_momentum = 0.0; // Tracks market momentum
    
    // GARCH(1,1) parameters - realistic values
    this.garch_omega = 0.00001; // Long-term variance component (very small)
    this.garch_alpha = 0.05; // Impact of yesterday's squared return (low persistence)
    this.garch_beta = 0.90; // Impact of yesterday's variance (high persistence)
    
    // Return characteristics
    this.return_autocorrelation = 0.02; // Very slight momentum (real markets have near-zero autocorrelation)
    this.market_drift = 0.00031; // ~8% annual return (0.00031 * 252 ≈ 0.08)
    
    // Market performance tracking for chart
    this.market_returns_history = []; // Array of {date, return, cumulative}
    this.market_index = 100.0; // Cumulative performance indexed to 100
    
    this.current_date = startDate;
  }
  
  updateLeverage(target) {
    const new_target = parseFloat(target);
    
    // When user changes leverage, we fix the borrowed amount
    // This borrowed amount stays constant until user changes leverage again
    // As NAV changes with performance, effective leverage will change naturally
    
    // Formula: borrowed_amount = investor_equity * (target_leverage - 1)
    // Example: $100M NAV at 2x leverage = borrow $100M, gross = $200M
    // If NAV goes to $110M, gross stays $200M, effective leverage = 200/110 = 1.82x
    // If NAV goes to $90M, gross stays $200M, effective leverage = 200/90 = 2.22x
    
    if (this.investor_equity > 0) {
      const desired_gross = this.investor_equity * new_target;
      this.borrowed_amount = Math.max(0, desired_gross - this.investor_equity);
      this.target_leverage = new_target;
      this.calculateGrossExposure();
      this.calculateEffectiveLeverage();
    }
  }
  
  calculateGrossExposure() {
    // Gross exposure = equity + borrowed amount (fixed until user changes leverage)
    this.gross_exposure = this.investor_equity + this.borrowed_amount;
  }
  
  calculateEffectiveLeverage() {
    if (this.investor_equity > 0) {
      this.effective_leverage = this.gross_exposure / this.investor_equity;
    } else {
      this.effective_leverage = 999.0;
    }
  }
  
  calculateDailyInterest() {
    // Interest is paid on the borrowed amount
    const daily_interest = (this.borrowed_amount * this.interest_rate) / 252;
    this.investor_equity -= daily_interest;
    return daily_interest;
  }
  
  applyDailyPnL(total_pnl_dollars) {
    this.investor_equity += total_pnl_dollars;
    
    if (this.investor_equity > 0) {
      this.current_daily_return_pct = total_pnl_dollars / this.investor_equity;
    } else {
      this.current_daily_return_pct = 0.0;
    }
    
    this.calculateEffectiveLeverage();
  }
  
  checkLeverageWarnings() {
    // Check for margin call first (15x - game over)
    if (this.effective_leverage >= 15.0) {
      if (!this.sent_warning_15x) {
        this.sent_warning_15x = true;
        return "margin_call";
      }
      return "margin_call_active";
    }
    
    // Check 12.5x warning
    if (this.effective_leverage >= 12.5 && !this.sent_warning_12_5x) {
      this.sent_warning_12_5x = true;
      return "critical";
    }
    
    // Check 10x warning
    if (this.effective_leverage >= 10.0 && !this.sent_warning_10x) {
      this.sent_warning_10x = true;
      return "high";
    }
    
    // Check 8x warning
    if (this.effective_leverage >= 8.0 && !this.sent_warning_8x) {
      this.sent_warning_8x = true;
      return "medium";
    }
    
    // Reset warnings if leverage drops below thresholds
    if (this.effective_leverage < 7.0) {
      this.sent_warning_8x = false;
    }
    if (this.effective_leverage < 9.0) {
      this.sent_warning_10x = false;
    }
    if (this.effective_leverage < 11.5) {
      this.sent_warning_12_5x = false;
    }
    if (this.effective_leverage < 14.0) {
      this.sent_warning_15x = false;
    }
    
    return null;
  }
  
  checkMarginCall() {
    // Returns true if margin call is active (15x or above)
    return this.effective_leverage >= 15.0;
  }
  
  checkFirstLeverageUse() {
    if (!this.has_used_leverage && this.effective_leverage > 1.01) {
      this.has_used_leverage = true;
      return true;
    }
    return false;
  }
  
  processMonthEnd(pods, ledger, logs) {
    logs.unshift({
      date: this.current_date.toISOString().split('T')[0],
      text: "--- MONTH END PROCESSING ---",
      type: "info"
    });
    
    const gross_fund_pnl = this.investor_equity - this.equity_at_month_start;
    
    let total_pod_payouts = 0.0;
    let total_monthly_pod_pnl = 0.0;
    
    // Process pod payouts based on monthly profits
    for (const pod of pods) {
      if (!pod.is_active) continue;
      
      const monthly_profit = pod.cumulative_pnl - pod.pnl_at_month_start;
      total_monthly_pod_pnl += monthly_profit;
      
      if (monthly_profit > 0) {
        const payout = monthly_profit * (pod.pnl_cut / 100.0);
        
        if (payout > 0) {
          total_pod_payouts += payout;
          ledger.addTransaction(
            `Bonus Payout: ${pod.name}`,
            -payout,
            false,
            this.current_date
          );
        }
      }
      
      if (pod.cumulative_pnl > pod.high_water_mark) {
        pod.high_water_mark = pod.cumulative_pnl;
      }
      
      pod.pnl_at_month_start = pod.cumulative_pnl;
    }
    
    // Fixed Costs (Salaries) - Paid by investors (reduces NAV)
    const total_salaries = pods.reduce((sum, p) => sum + p.salary, 0) / 12;
    
    if (total_salaries > 0) {
      const active_pod_count = pods.filter(p => p.is_active).length;
      ledger.addTransaction(
        `Monthly Salaries (${active_pod_count} pods)`,
        -total_salaries,
        false, // Salaries reduce NAV, not firm cash
        this.current_date
      );
    }
    
    // Management Fee - 2% annual, charged monthly (reduces NAV, adds to firm cash)
    const management_fee = this.investor_equity * (this.management_fee_rate / 12);
    
    if (management_fee > 0) {
      ledger.addTransaction(
        "Management Fee (2% annual)",
        management_fee,
        true, // Management fee adds to firm cash
        this.current_date
      );
    }
    
    // Total expenses include pod payouts, salaries, and management fee (all reduce NAV)
    const total_expenses = total_pod_payouts + total_salaries + management_fee;
    
    // Platform Performance Fee
    let platform_fee = 0.0;
    if (total_monthly_pod_pnl > 0) {
      const profit_after_bonuses = total_monthly_pod_pnl - total_pod_payouts;
      if (profit_after_bonuses > 0) {
        platform_fee = profit_after_bonuses * this.platform_fee_rate;
        ledger.addTransaction(
          "Platform Perf Fees",
          platform_fee,
          true,
          this.current_date
        );
        logs.unshift({
          date: this.current_date.toISOString().split('T')[0],
          text: `REVENUE: Earned $${platform_fee.toLocaleString('en-US', {maximumFractionDigits: 0})} fees`,
          type: "success"
        });
      } else {
        logs.unshift({
          date: this.current_date.toISOString().split('T')[0],
          text: "NO REVENUE: Pod bonuses > Monthly PnL",
          type: "warning"
        });
      }
    } else {
      logs.unshift({
        date: this.current_date.toISOString().split('T')[0],
        text: "NO REVENUE: Negative monthly PnL",
        type: "warning"
      });
    }
    
    this.investor_equity -= total_expenses;
    this.equity_at_month_start = this.investor_equity;
    
    return {
      gross_pnl: gross_fund_pnl,
      total_expenses: total_expenses,
      platform_fee: platform_fee
    };
  }
  
  checkInsolvency(logs) {
    if (this.investor_equity <= 0) {
      logs.unshift({
        date: this.current_date.toISOString().split('T')[0],
        text: "LIQUIDATION: Fund blew up.",
        type: "danger"
      });
      return true;
    }
    return false;
  }
  
  getMarketReturn() {
    // 1. Update conditional variance using GARCH(1,1) model
    // σ²_t = ω + α * ε²_{t-1} + β * σ²_{t-1}
    // This creates realistic volatility clustering
    this.conditional_variance = 
      this.garch_omega + 
      this.garch_alpha * this.last_squared_return + 
      this.garch_beta * this.conditional_variance;
    
    // Ensure variance doesn't explode or collapse
    const min_variance = Math.pow(0.005, 2); // Minimum 0.5% daily volatility
    const max_variance = Math.pow(0.03, 2); // Maximum 3% daily volatility (extreme stress)
    this.conditional_variance = Math.max(min_variance, Math.min(max_variance, this.conditional_variance));
    
    // Convert variance to volatility
    this.market_volatility = Math.sqrt(this.conditional_variance);
    
    // 2. Generate random shock (Box-Muller transform for normal distribution)
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    // 3. Add very rare fat tails (1% chance, not 5%) - extreme market events
    let volatility_multiplier = 1.0;
    if (Math.random() < 0.01) {
      // On rare occasions (1% chance), have a larger move (1.5x to 2.5x)
      volatility_multiplier = 1.5 + Math.random() * 1.0;
    }
    
    const random_component = z0 * this.market_volatility * volatility_multiplier;
    
    // 4. Add very slight autocorrelation (real markets have near-zero autocorrelation)
    const momentum_component = this.last_market_return * this.return_autocorrelation;
    
    // 5. Add positive drift (long-term market appreciation ~8% annual)
    const drift_component = this.market_drift;
    
    // 6. Calculate final return
    const market_return = random_component + momentum_component + drift_component;
    
    // 7. Update state for next iteration
    this.last_market_return = market_return;
    this.last_squared_return = market_return * market_return; // For GARCH variance calculation
    this.market_momentum = this.market_momentum * 0.95 + market_return * 0.05; // Exponential moving average
    
    // 8. Track market performance for chart
    this.market_index = this.market_index * (1 + market_return);
    this.market_returns_history.push({
      date: this.current_date.toISOString().split('T')[0],
      return: market_return,
      index: this.market_index
    });
    
    // Keep only last 252 days (1 year) of history
    if (this.market_returns_history.length > 252) {
      this.market_returns_history.shift();
    }
    
    return market_return;
  }
  
  getMarketPerformanceHistory() {
    return this.market_returns_history;
  }
}

