/**
 * GameState class - Orchestrates the simulation using Fund, Pod, Ledger, and EmailManager.
 */
import { Fund } from './Fund.js';
import { Pod } from './Pod.js';
import { Ledger } from './Ledger.js';
import { EmailManager } from './EmailManager.js';
import { isWeekend, checkHoliday, getHolidayName } from './EventSystem.js';
import { setRecruitmentData, generateRecruit } from './Recruitment.js';
import { MessageManager } from './MessageManager.js';
import { MarketRegime } from './MarketRegime.js';
import { Strategist } from './Strategist.js';
import { TimRaver } from './TimRaver.js';
import { Awards, AWARDS } from './Awards.js';

const START_DATE = new Date(2024, 0, 1); // Jan 1, 2024

export class GameState {
  constructor(contentData = null, messageManager = null) {
    this.firm_name = null;
    this.current_date = new Date(START_DATE);
    this.is_running = false;
    this.game_over = false;
    this.game_over_reason = null;
    this.logs = [];
    
    // Store content data
    this.contentData = contentData;
    
    // Initialize MessageManager (unified message system)
    this.message_manager = messageManager || new MessageManager(this.current_date);
    
    // Set recruitment data if provided (still needed for generating recruits)
    if (contentData?.recruitmentData) {
      setRecruitmentData(contentData.recruitmentData);
    }
    
    // Initialize core components
    this.fund = new Fund(this.current_date);
    this.ledger = new Ledger();
    this.email_manager = new EmailManager(this.current_date);
    
    // Initialize Market Regime System
    this.market_regime = new MarketRegime(this.current_date);
    
    // Initialize Strategist
    this.strategist = new Strategist();
    this.last_regime_check = null; // Track when we last sent regime analysis
    
    // Initialize Tim Raver (inverse Cramer - always wrong)
    this.tim_raver = new TimRaver();
    this.last_tim_raver_check = null; // Track when we last sent Tim Raver analysis
    
    // Initialize Awards System
    this.awards = new Awards();
    this.previous_nav = null;
    this.previous_firm_cash = null;
    
    // Time limit tracking
    this.start_date = new Date(START_DATE);
    this.trading_days_elapsed = 0;
    this.max_trading_days = 1260; // 5 years * 252 trading days/year
    
    // NewsWire is now just a container for news items (no logic)
    this.news_wire = { news_items: [] };
    
    // Initialize House Pod
    const house_pod = new Pod("0", "House Account", "Generalist", 0.0001, 0.4, 150000, 0);
    house_pod.high_water_mark = 0;
    house_pod.pnl_at_month_start = 0.0;
    this.pods = [house_pod];
    
    // Welcome Email - use MessageManager exclusively
    const welcomeResults = this.message_manager.triggerGameEvent('game_start', {});
    for (const email of welcomeResults.email) {
      this.email_manager.sendEmail(email);
    }
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
    if (!email) return;
    
    // Use MessageManager response handling
    const action = this.message_manager.handleEmailResponse(email, 'hire', this);
    if (action && action.action === 'hire_pod') {
      const recruit = action.data || email.data;
      if (!recruit || !recruit.demands) {
        this.logs.unshift({
          date: this.current_date.toISOString().split('T')[0],
          text: `REJECTED: Invalid candidate data.`,
          type: "danger"
        });
        return;
      }
      
      const bonus = recruit.demands.signing_bonus;
      
      if (this.ledger.firm_cash < bonus) {
        this.logs.unshift({
          date: this.current_date.toISOString().split('T')[0],
          text: `REJECTED: Cannot afford ${recruit.name || 'candidate'}.`,
          type: "danger"
        });
        return;
      }
      
      // Trigger pod_hired event for ledger entry
      const hireResults = this.message_manager.triggerGameEvent('pod_hired', {
        pod_name: recruit.name,
        signing_bonus: bonus
      });
      
      // Add ledger entry from MessageManager
      for (const ledgerEntry of hireResults.ledger) {
        this.ledger.addTransaction(
          ledgerEntry.desc,
          ledgerEntry.amount,
          ledgerEntry.affect_cash,
          this.current_date
        );
      }
      
      const new_pod = new Pod(
        recruit.id,
        recruit.name,
        recruit.specialism,
        recruit.stats.alpha,
        recruit.stats.beta,
        recruit.demands.salary,
        recruit.demands.pnl_cut,
        recruit.asset_class
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
  }
  
  rejectEmail(emailId) {
    this.email_manager.removeEmail(emailId);
  }
  
  markEmailAsRead(emailId) {
    this.email_manager.markEmailAsRead(emailId);
  }
  
  firePod(emailId) {
    const email = this.email_manager.getEmail(emailId);
    if (!email) return;
    
    // Use MessageManager response handling
    const action = this.message_manager.handleEmailResponse(email, 'fire', this);
    if (action && action.action === 'fire_pod') {
      const podId = action.pod_id || email.data?.pod_id;
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
      
      // Trigger pod_fired event
      this.message_manager.triggerGameEvent('pod_fired', {
        pod_id: podId,
        pod_name: pod.name
      });
      
      this.email_manager.removeEmail(emailId);
      this.logs.unshift({
        date: this.current_date.toISOString().split('T')[0],
        text: `FIRED: ${pod.name}`,
        type: "danger"
      });
    }
  }
  
  processMonthEnd() {
    this.ledger.current_date = this.current_date;
    this.fund.current_date = this.current_date;
    
    // Calculate month-end values for MessageManager
    const active_pod_count = this.pods.filter(p => p.is_active).length;
    const total_salaries = this.pods.reduce((sum, p) => sum + p.salary, 0);
    const investor_equity = this.fund.investor_equity;
    
    // Trigger month_end event for ledger entries
    const monthEndResults = this.message_manager.triggerGameEvent('month_end', {
      pod_count: active_pod_count,
      total_salaries: total_salaries,
      investor_equity: investor_equity,
      current_date: this.current_date.toISOString().split('T')[0]
    });
    
    // Process ledger entries from MessageManager
    for (const ledgerEntry of monthEndResults.ledger) {
      this.ledger.addTransaction(
        ledgerEntry.desc,
        ledgerEntry.amount,
        ledgerEntry.affect_cash,
        this.current_date
      );
    }
    
    // Process month end (legacy system still handles calculations)
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
    
    // Increment trading days counter (only count weekdays)
    this.trading_days_elapsed++;
    
    // Check for 5-year time limit
    if (this.trading_days_elapsed >= this.max_trading_days) {
      // Award "Survived Three Years" trophy
      if (!this.awards.hasEarned('survived_three_years')) {
        this.awards.earnedAwards.push('survived_three_years');
        this.awards.saveEarnedAwards();
        
        // Send award email
        const awardEmail = this.awards.generateAwardEmail(AWARDS.SURVIVED_THREE_YEARS, this.current_date);
        this.email_manager.sendEmail(awardEmail);
      }
      
      // End the game
      this.game_over = true;
      this.game_over_reason = "time_limit";
      this.is_running = false;
      
      this.logs.unshift({
        date: this.current_date.toISOString().split('T')[0],
        text: "TIME LIMIT REACHED: 5 years have passed. Game complete.",
        type: "info"
      });
      
      return this.getState();
    }
    
    // Update date in components
    this.fund.current_date = this.current_date;
    this.ledger.current_date = this.current_date;
    this.email_manager.updateDate(this.current_date);
    this.message_manager.updateDate(this.current_date);
    
    // Update market regime and check for changes
    const prevRegime = this.market_regime.current_regime;
    const regimeChanged = this.market_regime.update(this.current_date);
    
    // If regime changed, send strategist email
    if (regimeChanged && prevRegime) {
      const strategistEmail = this.strategist.generateRegimeAnalysis(
        this.market_regime.getRegimeInfo(),
        this.current_date
      );
      this.email_manager.sendEmail(strategistEmail);
      
      // Also send Tim Raver newswire (always wrong, appears as newswire)
      const timRaverNews = this.tim_raver.generateRecommendations(
        this.market_regime.getRegimeInfo(),
        this.current_date
      );
      this.news_wire.news_items.unshift(timRaverNews);
      if (this.news_wire.news_items.length > 50) {
        this.news_wire.news_items.pop();
      }
      this.logs.unshift({
        date: this.current_date.toISOString().split('T')[0],
        text: `NEWS: ${timRaverNews.headline} - ${timRaverNews.source}`,
        type: timRaverNews.type || "alert"
      });
      
      // Log regime change
      this.logs.unshift({
        date: this.current_date.toISOString().split('T')[0],
        text: `REGIME CHANGE: ${prevRegime.toUpperCase()} → ${this.market_regime.current_regime.toUpperCase()}`,
        type: "info"
      });
      
      this.last_regime_check = this.market_regime.current_regime;
      this.last_tim_raver_check = this.market_regime.current_regime;
    }
    
    // Also send periodic strategist emails (once per regime, randomly timed)
    const regimeInfo = this.market_regime.getRegimeInfo();
    const daysInRegime = Math.floor((this.current_date - new Date(regimeInfo.regime_start_date)) / (1000 * 60 * 60 * 24));
    
    // Send analysis email 3-7 days into a new regime (random timing)
    if (this.last_regime_check !== this.market_regime.current_regime) {
      if (daysInRegime >= 3 && daysInRegime <= 7 && Math.random() < 0.3) {
        const strategistEmail = this.strategist.generateRegimeAnalysis(
          this.market_regime.getRegimeInfo(),
          this.current_date
        );
        this.email_manager.sendEmail(strategistEmail);
        this.last_regime_check = this.market_regime.current_regime;
      }
    }
    
    // Also send periodic Tim Raver newswire (once per regime, randomly timed, different timing than strategist)
    if (this.last_tim_raver_check !== this.market_regime.current_regime) {
      // Tim Raver appears 1-5 days into a regime (earlier and more frequent than strategist)
      if (daysInRegime >= 1 && daysInRegime <= 5 && Math.random() < 0.4) {
        const timRaverNews = this.tim_raver.generateRecommendations(
          this.market_regime.getRegimeInfo(),
          this.current_date
        );
        this.news_wire.news_items.unshift(timRaverNews);
        if (this.news_wire.news_items.length > 50) {
          this.news_wire.news_items.pop();
        }
        this.logs.unshift({
          date: this.current_date.toISOString().split('T')[0],
          text: `NEWS: ${timRaverNews.headline} - ${timRaverNews.source}`,
          type: timRaverNews.type || "alert"
        });
        this.last_tim_raver_check = this.market_regime.current_regime;
      }
    }
    
    // Check for month end
    if (this.current_date.getMonth() !== prev_month) {
      this.processMonthEnd();
    }
    
    // Check for holidays via MessageManager
    if (checkHoliday(this.current_date)) {
      const holidayName = getHolidayName(this.current_date);
      const holidayResults = this.message_manager.triggerGameEvent('holiday', {
        holiday_name: holidayName,
        date: this.current_date.toISOString().split('T')[0]
      });
      
      // Add holiday news to newswire
      for (const newsItem of holidayResults.newswire) {
        this.news_wire.news_items.unshift(newsItem);
        if (this.news_wire.news_items.length > 50) {
          this.news_wire.news_items.pop();
        }
        
        this.logs.unshift({
          date: this.current_date.toISOString().split('T')[0],
          text: `MARKET CLOSED: ${newsItem.headline || newsItem.text}`,
          type: newsItem.type || "info"
        });
        
        const impacts = this.message_manager.applyImpact(newsItem, this.fund);
        if (impacts.market_halt) {
          this.fund.current_daily_return_pct = 0.0;
          return this.getState();
        }
      }
    }
    
    // Check for random messages (newswire and emails) via MessageManager
    const randomMessages = this.message_manager.checkRandomMessages();
    
    // Handle random newswire message
    if (randomMessages.newswire) {
      const news_item = randomMessages.newswire;
      this.news_wire.news_items.unshift(news_item);
      if (this.news_wire.news_items.length > 50) {
        this.news_wire.news_items.pop();
      }
      
      this.logs.unshift({
        date: this.current_date.toISOString().split('T')[0],
        text: `NEWS: ${news_item.headline || news_item.text}`,
        type: news_item.type || "info"
      });
      
      const impacts = this.message_manager.applyImpact(news_item, this.fund);
      if (impacts.market_halt) {
        this.fund.current_daily_return_pct = 0.0;
        return this.getState();
      }
    }
    
    // Handle random recruitment email
    if (randomMessages.email) {
      // Check if it's a recruitment email that needs candidate data
      if (randomMessages.email._message_template?.content?.type === 'recruitment') {
        // Generate candidate data for recruitment email
        const recruit = generateRecruit(this.contentData?.recruitmentData || null);
        
        // Interpolate email with candidate data
        const email = randomMessages.email;
        const recruitData = {
          candidate_name: recruit.name,
          specialism: recruit.specialism,
          alpha_display: recruit.stats.alpha_display,
          beta: recruit.stats.beta,
          last_drawdown: recruit.stats.last_drawdown,
          lifetime_pnl: recruit.stats.lifetime_pnl,
          signing_bonus: recruit.demands.signing_bonus.toLocaleString('en-US'),
          salary: recruit.demands.salary.toLocaleString('en-US'),
          pnl_cut: recruit.demands.pnl_cut,
          bio: recruit.bio
        };
        
        email.subject = this.message_manager.interpolate(email.subject, recruitData);
        email.body = this.message_manager.interpolate(email.body, recruitData);
        email.data = recruit; // Store full recruit data for hiring
      }
      this.email_manager.sendEmail(randomMessages.email);
    }
    
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
      const regime_modifier = this.market_regime.getRegimeModifier(pod.asset_class);
      const pod_pnl = pod.tick(allocated_capital, market_return, regime_modifier);
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
    
    // Check leverage warnings and margin call via MessageManager
    const warning_level = this.fund.checkLeverageWarnings();
    if (warning_level) {
      if (warning_level === "margin_call" || warning_level === "margin_call_active") {
        // Margin call - trigger game event
        const marginCallResults = this.message_manager.triggerGameEvent('margin_call', {
          leverage: this.fund.effective_leverage
        });
        
        // Send margin call email
        for (const email of marginCallResults.email) {
          this.email_manager.sendEmail(email);
        }
        
        // Award LTCM Trophy for margin call
        if (!this.awards.hasEarned('ltcm_trophy')) {
          this.awards.earnedAwards.push('ltcm_trophy');
          this.awards.saveEarnedAwards();
          
          // Send award email
          const awardEmail = this.awards.generateAwardEmail(AWARDS.LTCM_TROPHY, this.current_date);
          this.email_manager.sendEmail(awardEmail);
        }
        
        // Check for game over impact
        if (marginCallResults.email.length > 0) {
          const email = marginCallResults.email[0];
          if (email._message_template?.impact?.simulation?.game_over) {
            this.is_running = false;
            this.game_over = true;
            this.game_over_reason = email._message_template.impact.simulation.reason || "margin_call";
          } else {
            this.is_running = false;
            this.game_over = true;
            this.game_over_reason = "margin_call";
          }
        } else {
          this.is_running = false;
          this.game_over = true;
          this.game_over_reason = "margin_call";
        }
        
        this.logs.unshift({
          date: this.current_date.toISOString().split('T')[0],
          text: "MARGIN CALL: Portfolio liquidated. Trading halted.",
          type: "danger"
        });
        return this.getState();
      } else {
        // Trigger leverage threshold event
        const leverageResults = this.message_manager.triggerGameEvent('leverage_threshold', {
          leverage: this.fund.effective_leverage
        });
        
        for (const email of leverageResults.email) {
          this.email_manager.sendEmail(email);
        }
      }
    }
    
    // Check for first leverage use
    if (this.fund.checkFirstLeverageUse()) {
      const firstLeverageResults = this.message_manager.triggerGameEvent('first_leverage_use', {
        leverage: this.fund.effective_leverage
      });
      
      for (const email of firstLeverageResults.email) {
        this.email_manager.sendEmail(email);
      }
      
      this.logs.unshift({
        date: this.current_date.toISOString().split('T')[0],
        text: "PRIME BROKER: Leverage facility activated.",
        type: "info"
      });
    }
    
    // Check for pod drawdown warnings via MessageManager
    for (const pod of this.pods) {
      if (pod.id === "0") continue;
      if (pod.is_fired || !pod.is_active) continue;
      
      // Reset flag when drawdown recovers above -5%
      if (pod.current_drawdown > -0.05 && pod.drawdown_warning_sent) {
        pod.drawdown_warning_sent = false;
      }
      
      // Check if pod is in drawdown and should receive email
      if (pod.current_drawdown <= -0.05) {
        // Check if we've sent a drawdown email for this pod this month
        const shouldSendEmail = (() => {
          if (!pod.last_drawdown_email_date) {
            // Never sent before, send it
            return true;
          }
          
          // Check if we're in a different month than when we last sent
          const lastEmailDate = new Date(pod.last_drawdown_email_date);
          const isDifferentMonth = 
            this.current_date.getMonth() !== lastEmailDate.getMonth() ||
            this.current_date.getFullYear() !== lastEmailDate.getFullYear();
          
          // Only send if we're in a different month
          return isDifferentMonth;
        })();
        
        if (shouldSendEmail && !pod.drawdown_warning_sent) {
          // Trigger drawdown event
          const drawdownResults = this.message_manager.triggerGameEvent('pod_drawdown', {
            pod_id: pod.id,
            pod_name: pod.name,
            drawdown: pod.current_drawdown,
            drawdown_display: `${Math.abs(pod.current_drawdown * 100).toFixed(1)}%`,
            salary: pod.salary
          });
          
          for (const email of drawdownResults.email) {
            this.email_manager.sendEmail(email);
          }
          
          pod.drawdown_warning_sent = true;
          pod.last_drawdown_email_date = new Date(this.current_date); // Store date as Date object
          
          this.logs.unshift({
            date: this.current_date.toISOString().split('T')[0],
            text: `RISK ALERT: ${pod.name} drawdown at ${(pod.current_drawdown * 100).toFixed(1)}%`,
            type: "alert"
          });
        }
      }
    }
    
    // Check for fund liquidation
    if (this.fund.checkInsolvency(this.logs)) {
      this.is_running = false;
      this.game_over = true;
      this.game_over_reason = "fund_liquidation";
    }
    
    // Check for awards (after updating NAV and firm cash)
    const currentNav = this.fund.investor_equity;
    const currentFirmCash = this.ledger.firm_cash;
    
    const newlyEarned = this.awards.checkAwards(
      currentNav,
      currentFirmCash,
      this.previous_nav,
      this.previous_firm_cash
    );
    
    // Send emails for newly earned awards
    for (const award of newlyEarned) {
      const awardEmail = this.awards.generateAwardEmail(award, this.current_date);
      this.email_manager.sendEmail(awardEmail);
      
      this.logs.unshift({
        date: this.current_date.toISOString().split('T')[0],
        text: `🏆 AWARD EARNED: ${award.name}`,
        type: "success"
      });
    }
    
    // Update previous values for next check
    this.previous_nav = currentNav;
    this.previous_firm_cash = currentFirmCash;
    
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
      market_regime: this.market_regime.getRegimeInfo(),
      effective_leverage: this.fund.effective_leverage,
      logs: this.logs.slice(0, 15),
      emails: this.email_manager.getSerializedEmails(),
      ledger: this.ledger.getLedger(),
      news_wire: this.news_wire.news_items.slice(0, 20).map(item => ({
        id: item.id,
        headline: item.headline || item.text,
        body: item.body || "",
        date: item.date,
        type: item.type || "info",
        read: item.read || false
      })),
      is_running: this.is_running,
      game_over: this.game_over,
      game_over_reason: this.game_over_reason,
      firm_name: this.firm_name,
        pods: active_pods.map(p => p.getSerialized(total_weight)),
        market_history: this.fund.getMarketPerformanceHistory(),
        earned_awards: this.awards.getEarnedAwards(),
        trading_days_elapsed: this.trading_days_elapsed,
        max_trading_days: this.max_trading_days
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

