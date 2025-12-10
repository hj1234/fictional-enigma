/**
 * GameState class - Orchestrates the simulation using Fund, Pod, Ledger, and EmailManager.
 */
import { Fund } from './Fund.js';
import { Pod } from './Pod.js';
import { Ledger } from './Ledger.js';
import { EmailManager } from './EmailManager.js';
import { Email, createDrawdownWarningEmail } from './Email.js';
import { EventRegistry, isWeekend, checkHoliday, createHolidayEvent, createFlavorEvent } from './EventSystem.js';
import { NewsWire } from './NewsWire.js';

const START_DATE = new Date(2024, 0, 1); // Jan 1, 2024

export class GameState {
  constructor() {
    this.firm_name = null;
    this.current_date = new Date(START_DATE);
    this.is_running = false;
    this.game_over = false;
    this.game_over_reason = null;
    this.logs = [];
    
    // Initialize core components
    this.fund = new Fund(this.current_date);
    this.ledger = new Ledger();
    this.email_manager = new EmailManager(this.current_date);
    this.news_wire = new NewsWire(this.current_date);
    
    // Initialize House Pod
    const house_pod = new Pod("0", "House Account", "Generalist", 0.0001, 0.4, 150000, 0);
    house_pod.high_water_mark = 0;
    house_pod.pnl_at_month_start = 0.0;
    this.pods = [house_pod];
    
    // Initialize event system
    this.events = new EventRegistry();
    this.events.registerCalendar(checkHoliday, createHolidayEvent);
    this.events.registerRandom(0.05, createFlavorEvent);
    
    // Welcome Email
    const welcome_email = new Email(
      "Fund Administrator",
      "Fund Launch Successful",
      `Welcome to the platform.\n\nStructure: Pass-Through\nMgmt Fee: 2%\nPerf Fee: 20%\n\nYour goal is to grow the Firm Cash by collecting management and performance fees from investors.`,
      "standard"
    );
    this.email_manager.sendEmail(welcome_email);
  }
  
  setLeverage(target) {
    this.fund.updateLeverage(target);
  }
  
  updatePodWeight(podId, increment) {
    const pod = this.pods.find(p => p.id === podId);
    if (pod) {
      pod.updateWeight(increment);
    }
  }
  
  hirePod(emailId) {
    const email = this.email_manager.getEmail(emailId);
    if (!email || email.type !== 'recruitment') return;
    
    const recruit = email.data;
    const bonus = recruit.demands.signing_bonus;
    
    if (this.ledger.firm_cash < bonus) {
      this.logs.unshift({
        date: this.current_date.toISOString().split('T')[0],
        text: `REJECTED: Cannot afford ${recruit.name}.`,
        type: "danger"
      });
      return;
    }
    
    this.ledger.addTransaction(
      `Sign-on Bonus: ${recruit.name}`,
      -bonus,
      true,
      this.current_date
    );
    
    const new_pod = new Pod(
      recruit.id,
      recruit.name,
      recruit.specialism,
      recruit.stats.alpha,
      recruit.stats.beta,
      recruit.demands.salary,
      recruit.demands.pnl_cut
    );
    new_pod.weight = 10.0;
    new_pod.pnl_at_month_start = 0.0;
    this.pods.push(new_pod);
    this.email_manager.removeEmail(emailId);
    this.logs.unshift({
      date: this.current_date.toISOString().split('T')[0],
      text: `HIRED: ${new_pod.name}`,
      type: "success"
    });
  }
  
  rejectEmail(emailId) {
    this.email_manager.removeEmail(emailId);
  }
  
  markEmailAsRead(emailId) {
    this.email_manager.markEmailAsRead(emailId);
  }
  
  firePod(emailId) {
    const email = this.email_manager.getEmail(emailId);
    if (!email || email.type !== 'alert' || email.data?.action !== 'drawdown_warning') return;
    
    const podId = email.data?.pod_id;
    if (!podId || podId === "0") {
      this.logs.unshift({
        date: this.current_date.toISOString().split('T')[0],
        text: "Cannot fire House Account.",
        type: "warning"
      });
      return;
    }
    
    const pod = this.pods.find(p => p.id === podId);
    if (!pod || pod.is_fired) return;
    
    const fired_weight = pod.weight;
    
    pod.is_fired = true;
    pod.is_active = false;
    pod.weight = 0.0;
    
    // Redistribute weight
    const active_pods = this.pods.filter(p => p.is_active && p.id !== "0");
    if (active_pods.length > 0 && fired_weight > 0) {
      const total_active_weight = active_pods.reduce((sum, p) => sum + p.weight, 0);
      if (total_active_weight > 0) {
        for (const active_pod of active_pods) {
          const share = active_pod.weight / total_active_weight;
          active_pod.weight += fired_weight * share;
        }
      } else {
        const weight_per_pod = fired_weight / active_pods.length;
        for (const active_pod of active_pods) {
          active_pod.weight += weight_per_pod;
        }
      }
    }
    
    this.email_manager.removeEmail(emailId);
    this.logs.unshift({
      date: this.current_date.toISOString().split('T')[0],
      text: `FIRED: ${pod.name}`,
      type: "danger"
    });
  }
  
  processMonthEnd() {
    this.ledger.current_date = this.current_date;
    this.fund.current_date = this.current_date;
    this.fund.processMonthEnd(this.pods, this.ledger, this.logs);
    
    if (this.ledger.checkInsolvency(this.current_date)) {
      this.logs.unshift({
        date: this.current_date.toISOString().split('T')[0],
        text: "GAME OVER: Management Co Insolvent.",
        type: "danger"
      });
      this.is_running = false;
      this.game_over = true;
      this.game_over_reason = "insolvency";
    }
  }
  
  step() {
    const prev_month = this.current_date.getMonth();
    
    // Advance date, skipping weekends
    const newDate = new Date(this.current_date);
    newDate.setDate(newDate.getDate() + 1);
    while (isWeekend(newDate)) {
      newDate.setDate(newDate.getDate() + 1);
    }
    this.current_date = newDate;
    
    // Update date in components
    this.fund.current_date = this.current_date;
    this.ledger.current_date = this.current_date;
    this.email_manager.updateDate(this.current_date);
    this.news_wire.updateDate(this.current_date);
    
    // Check for month end
    if (this.current_date.getMonth() !== prev_month) {
      this.processMonthEnd();
    }
    
    // Check for events
    const event = this.events.checkForEvents(this.current_date);
    if (event) {
      this.logs.unshift({
        date: this.current_date.toISOString().split('T')[0],
        text: event.text,
        type: event.type
      });
      if (event.effect?.market_halt) {
        this.fund.current_daily_return_pct = 0.0;
        return this.getState();
      }
    }
    
    // Check for market news
    const news_item = this.news_wire.checkForNews();
    if (news_item) {
      this.logs.unshift({
        date: this.current_date.toISOString().split('T')[0],
        text: `NEWS: ${news_item.headline}`,
        type: news_item.news_type
      });
      
      const impacts = this.news_wire.applyMarketImpact(news_item, this.fund);
      if (impacts.market_halt) {
        this.fund.current_daily_return_pct = 0.0;
        return this.getState();
      }
    }
    
    // Check for recruitment emails
    this.email_manager.checkRecruitment();
    
    // Daily trading loop
    const market_return = this.fund.getMarketReturn();
    console.log(`[${this.current_date.toISOString().split('T')[0]}] Market Return: ${(market_return * 100).toFixed(4)}%`);
    
    this.fund.calculateDailyInterest();
    // Don't recalculate gross exposure here - it's fixed based on borrowed amount
    // Only recalculate after PnL to update the value
    this.fund.calculateGrossExposure();
    
    const active_pods = this.pods.filter(p => p.is_active);
    const total_weight = active_pods.reduce((sum, p) => sum + p.weight, 0) || 1;
    let total_pnl_dollars = 0;
    
    for (const pod of active_pods) {
      const allocated_capital = pod.calculateAllocation(total_weight, this.fund.gross_exposure);
      const pod_pnl = pod.tick(allocated_capital, market_return);
      pod.addPnL(pod_pnl);
      total_pnl_dollars += pod_pnl;
      
      // Log house account return
      if (pod.id === "0") {
        const house_return_pct = allocated_capital > 0 ? (pod_pnl / allocated_capital) * 100 : 0;
        console.log(`[${this.current_date.toISOString().split('T')[0]}] House Account Return: ${house_return_pct.toFixed(4)}% (PnL: $${pod_pnl.toLocaleString('en-US', {maximumFractionDigits: 0})}, Capital: $${allocated_capital.toLocaleString('en-US', {maximumFractionDigits: 0})})`);
      }
    }
    
    this.fund.applyDailyPnL(total_pnl_dollars);
    this.fund.calculateGrossExposure();
    this.fund.calculateEffectiveLeverage();
    
    // Check leverage warnings and margin call
    const warning_level = this.fund.checkLeverageWarnings();
    if (warning_level) {
      if (warning_level === "margin_call" || warning_level === "margin_call_active") {
        // Margin call - stop the game
        this.email_manager.sendLeverageWarning("margin_call");
        this.is_running = false;
        this.game_over = true;
        this.game_over_reason = "margin_call";
        this.logs.unshift({
          date: this.current_date.toISOString().split('T')[0],
          text: "MARGIN CALL: Portfolio liquidated. Trading halted.",
          type: "danger"
        });
        return this.getState();
      } else {
        this.email_manager.sendLeverageWarning(warning_level);
      }
    }
    
    // Check for first leverage use
    if (this.fund.checkFirstLeverageUse()) {
      this.email_manager.sendWelcomeLeverageEmail();
      this.logs.unshift({
        date: this.current_date.toISOString().split('T')[0],
        text: "PRIME BROKER: Leverage facility activated.",
        type: "info"
      });
    }
    
    // Check for pod drawdown warnings
    for (const pod of this.pods) {
      if (pod.id === "0") continue;
      if (pod.is_fired || !pod.is_active) continue;
      
      if (pod.current_drawdown > -0.05 && pod.drawdown_warning_sent) {
        pod.drawdown_warning_sent = false;
      }
      
      if (pod.current_drawdown <= -0.05 && !pod.drawdown_warning_sent) {
        const prestige_months = this._calculatePrestigeMonths(pod);
        
        const warning_email = createDrawdownWarningEmail(
          pod.name,
          pod.id,
          pod.current_drawdown,
          pod.salary,
          prestige_months
        );
        this.email_manager.sendEmail(warning_email);
        pod.drawdown_warning_sent = true;
        
        this.logs.unshift({
          date: this.current_date.toISOString().split('T')[0],
          text: `RISK ALERT: ${pod.name} drawdown at ${(pod.current_drawdown * 100).toFixed(1)}%`,
          type: "alert"
        });
      }
    }
    
    // Check for fund liquidation
    if (this.fund.checkInsolvency(this.logs)) {
      this.is_running = false;
      this.game_over = true;
      this.game_over_reason = "fund_liquidation";
    }
    
    return this.getState();
  }
  
  getState() {
    const active_pods = this.pods.filter(p => p.is_active);
    const total_weight = active_pods.reduce((sum, p) => sum + p.weight, 0) || 1;
    
    // Format date as "DD MMM YYYY" (e.g., "01 Jan 2024")
    const day = String(this.current_date.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[this.current_date.getMonth()];
    const year = this.current_date.getFullYear();
    const dateStr = `${day} ${month} ${year}`;
    
    return {
      date: dateStr,
      investor_equity: this.fund.investor_equity,
      gross_exposure: this.fund.gross_exposure,
      firm_cash: this.ledger.firm_cash,
      daily_return: this.fund.current_daily_return_pct,
      leverage: this.fund.target_leverage,
      effective_leverage: this.fund.effective_leverage,
      logs: this.logs.slice(0, 15),
      emails: this.email_manager.getSerializedEmails(),
      ledger: this.ledger.getLedger(),
      news_wire: this.news_wire.getRecentNews(),
      is_running: this.is_running,
      game_over: this.game_over,
      game_over_reason: this.game_over_reason,
      firm_name: this.firm_name,
      pods: active_pods.map(p => p.getSerialized(total_weight)),
      market_history: this.fund.getMarketPerformanceHistory()
    };
  }
  
  _calculatePrestigeMonths(pod) {
    let months = 3;
    
    if (pod.alpha > 0) {
      const alpha_contribution = Math.min(6, Math.floor(pod.alpha * 252 * 100));
      months += alpha_contribution;
    } else {
      const alpha_penalty = Math.max(-2, Math.floor(pod.alpha * 252 * 50));
      months += alpha_penalty;
    }
    
    if (pod.cumulative_pnl > 0) {
      const pnl_contribution = Math.min(5, Math.floor(pod.cumulative_pnl / 1_000_000));
      months += pnl_contribution;
    }
    
    if (pod.salary > 500_000) {
      months += 4;
    } else if (pod.salary > 300_000) {
      months += 2;
    } else if (pod.salary > 150_000) {
      months += 1;
    }
    
    return Math.max(3, Math.min(18, months));
  }
}

