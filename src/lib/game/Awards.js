/**
 * Awards System - Manages trophy/award tracking and triggering
 */

export const AWARDS = {
  HEDGE_FUND_OF_MONTH: {
    id: 'hedge_fund_of_month',
    name: 'Hedge Fund of the Month',
    description: 'Achieved $130M NAV',
    trigger: {
      type: 'nav_threshold',
      threshold: 130_000_000,
      direction: 'above' // Trigger when passing above threshold
    },
    svg: `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="trophyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#d97706;stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- Trophy base -->
      <rect x="70" y="150" width="60" height="20" rx="5" fill="#92400e"/>
      <rect x="75" y="145" width="50" height="10" rx="3" fill="#78350f"/>
      <!-- Trophy cup -->
      <path d="M 60 80 L 60 140 L 140 140 L 140 80 Q 140 50 100 50 Q 60 50 60 80 Z" fill="url(#trophyGrad)"/>
      <ellipse cx="100" cy="80" rx="35" ry="8" fill="#fbbf24"/>
      <!-- Trophy handles -->
      <path d="M 60 90 Q 40 90 40 110 Q 40 130 60 130" stroke="#fbbf24" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M 140 90 Q 160 90 160 110 Q 160 130 140 130" stroke="#fbbf24" stroke-width="8" fill="none" stroke-linecap="round"/>
      <!-- Star on trophy -->
      <path d="M 100 60 L 105 75 L 120 75 L 108 85 L 113 100 L 100 90 L 87 100 L 92 85 L 80 75 L 95 75 Z" fill="#fff"/>
    </svg>`
  },
  CASH_MILLIONAIRE: {
    id: 'cash_millionaire',
    name: 'Cash Millionaire',
    description: 'Accumulated $50M in firm cash',
    trigger: {
      type: 'firm_cash_threshold',
      threshold: 50_000_000,
      direction: 'above'
    },
    svg: `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cashGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- Dollar sign -->
      <circle cx="100" cy="100" r="80" fill="url(#cashGrad)"/>
      <text x="100" y="130" font-family="Arial, sans-serif" font-size="100" font-weight="bold" fill="white" text-anchor="middle">$</text>
      <!-- Sparkles -->
      <circle cx="50" cy="50" r="5" fill="#fbbf24"/>
      <circle cx="150" cy="50" r="5" fill="#fbbf24"/>
      <circle cx="50" cy="150" r="5" fill="#fbbf24"/>
      <circle cx="150" cy="150" r="5" fill="#fbbf24"/>
    </svg>`
  },
  NAV_200M: {
    id: 'nav_200m',
    name: 'Elite Fund',
    description: 'Reached $200M NAV',
    trigger: {
      type: 'nav_threshold',
      threshold: 200_000_000,
      direction: 'above'
    },
    svg: `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="eliteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6d28d9;stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- Crown -->
      <path d="M 50 120 L 50 160 L 150 160 L 150 120 L 100 80 Z" fill="url(#eliteGrad)"/>
      <path d="M 70 120 L 100 90 L 130 120" stroke="#fbbf24" stroke-width="3" fill="none"/>
      <!-- Crown jewels -->
      <circle cx="80" cy="110" r="8" fill="#fbbf24"/>
      <circle cx="100" cy="100" r="10" fill="#fff"/>
      <circle cx="120" cy="110" r="8" fill="#fbbf24"/>
    </svg>`
  }
};

export class Awards {
  constructor() {
    this.earnedAwards = this.loadEarnedAwards();
  }
  
  loadEarnedAwards() {
    try {
      const saved = localStorage.getItem('pod_shop_earned_awards');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Failed to load earned awards:', e);
      return [];
    }
  }
  
  saveEarnedAwards() {
    try {
      localStorage.setItem('pod_shop_earned_awards', JSON.stringify(this.earnedAwards));
    } catch (e) {
      console.warn('Failed to save earned awards:', e);
    }
  }
  
  hasEarned(awardId) {
    return this.earnedAwards.includes(awardId);
  }
  
  checkAwards(nav, firmCash, previousNav = null, previousFirmCash = null) {
    const newlyEarned = [];
    
    for (const [key, award] of Object.entries(AWARDS)) {
      // Skip if already earned
      if (this.hasEarned(award.id)) continue;
      
      const trigger = award.trigger;
      let shouldAward = false;
      
      if (trigger.type === 'nav_threshold') {
        if (trigger.direction === 'above') {
          // Check if we just crossed above the threshold
          const wasBelow = previousNav === null || previousNav < trigger.threshold;
          const isAbove = nav >= trigger.threshold;
          shouldAward = wasBelow && isAbove;
        } else if (trigger.direction === 'below') {
          const wasAbove = previousNav === null || previousNav > trigger.threshold;
          const isBelow = nav <= trigger.threshold;
          shouldAward = wasAbove && isBelow;
        }
      } else if (trigger.type === 'firm_cash_threshold') {
        if (trigger.direction === 'above') {
          const wasBelow = previousFirmCash === null || previousFirmCash < trigger.threshold;
          const isAbove = firmCash >= trigger.threshold;
          shouldAward = wasBelow && isAbove;
        } else if (trigger.direction === 'below') {
          const wasAbove = previousFirmCash === null || previousFirmCash > trigger.threshold;
          const isBelow = firmCash <= trigger.threshold;
          shouldAward = wasAbove && isBelow;
        }
      }
      
      if (shouldAward) {
        this.earnedAwards.push(award.id);
        newlyEarned.push(award);
      }
    }
    
    if (newlyEarned.length > 0) {
      this.saveEarnedAwards();
    }
    
    return newlyEarned;
  }
  
  getEarnedAwards() {
    return this.earnedAwards.map(id => {
      for (const award of Object.values(AWARDS)) {
        if (award.id === id) return award;
      }
      return null;
    }).filter(a => a !== null);
  }
  
  generateAwardEmail(award, currentDate) {
    return {
      id: crypto.randomUUID(),
      sender: 'Industry Recognition Committee',
      subject: `🏆 Award: ${award.name}`,
      body: `CONGRATULATIONS!\n\nYour fund has been recognized for outstanding performance.\n\nAWARD: ${award.name}\n${award.description}\n\nThis achievement has been added to your trophy cabinet.\n\nKeep up the excellent work!\n\nBest regards,\nIndustry Recognition Committee`,
      date: currentDate.toISOString().split('T')[0],
      type: 'standard',
      read: false,
      requires_response: false,
      data: {
        award_id: award.id,
        award_name: award.name,
        award_description: award.description,
        award_svg: award.svg
      }
    };
  }
}

