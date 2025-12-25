/**
 * Awards System - Manages trophy/award tracking and triggering
 */

export const AWARDS = {
  HEDGE_FUND_OF_MONTH: {
    id: 'hedge_fund_of_month',
    name: 'Hedge Fund of the Month',
    description: 'Achieved $105M NAV',
    trigger: {
      type: 'nav_threshold',
      threshold: 105_000_000,
      direction: 'above' // Trigger when passing above threshold
    },
    image: '/trophies/hedge_fund_of_month.png'
  },
  APARTMENT: {
    id: 'apartment',
    name: 'Apartment',
    description: 'Accumulated $35M in firm cash',
    trigger: {
      type: 'firm_cash_threshold',
      threshold: 35_000_000,
      direction: 'above'
    },
    image: '/trophies/apartment.png'
  },
  SS_POSITIVE_CARRY: {
    id: 'ss_positive_carry',
    name: 'SS Positive Carry',
    description: 'Accumulated $40M in firm cash',
    trigger: {
      type: 'firm_cash_threshold',
      threshold: 40_000_000,
      direction: 'above'
    },
    image: '/trophies/ss_positive_carry.png'
  },
  NOHO_CLUB: {
    id: 'noho_club',
    name: 'NoHo Club',
    description: 'Reached $110M NAV',
    trigger: {
      type: 'nav_threshold',
      threshold: 110_000_000,
      direction: 'above'
    },
    image: '/trophies/noho_club.png'
  },
  GLOBAL_EXPRESS: {
    id: 'global_express',
    name: 'Global Express',
    description: 'Accumulated $55M in firm cash',
    trigger: {
      type: 'firm_cash_threshold',
      threshold: 55_000_000,
      direction: 'above'
    },
    image: '/trophies/global_express.png'
  },
  NAV_500M: {
    id: 'nav_150m',
    name: 'Nav 150M',
    description: 'Reached $150M NAV',
    trigger: {
      type: 'nav_threshold',
      threshold: 150_000_000,
      direction: 'above'
    },
    image: '/trophies/nav_500m.png'
  },
  BIOGRAPHY: {
    id: 'biography',
    name: 'Biography',
    description: 'Reached $200M NAV',
    trigger: {
      type: 'nav_threshold',
      threshold: 200_000_000,
      direction: 'above'
    },
    image: '/trophies/biography.png'
  },
  LTCM_TROPHY: {
    id: 'ltcm_trophy',
    name: 'LTCM Trophy',
    description: 'Margin called at 15x leverage',
    trigger: {
      type: 'margin_call',
      // This will be awarded manually, not through threshold checking
    },
    image: '/trophies/ltcm_trophy.png'
  },
  SUNDERLAND_SEAGULLS: {
    id: 'sunderland_seagulls',
    name: 'Sunderland Seagulls',
    description: 'Accumulated $65M in firm cash',
    trigger: {
      type: 'firm_cash_threshold',
      threshold: 65_000_000,
      direction: 'above'
    },
    image: '/trophies/sunderland_seagulls.png'
  },
  PODCAST: {
    id: 'podcast',
    name: 'Podcast',
    description: 'Reached $120M NAV',
    trigger: {
      type: 'nav_threshold',
      threshold: 120_000_000,
      direction: 'above'
    },
    image: '/trophies/podcast.png'
  },
  SURVIVED_THREE_YEARS: {
    id: 'survived_three_years',
    name: 'Survived Three Years',
    description: 'Completed 3-year fund management tenure',
    trigger: {
      type: 'time_limit',
      // This will be awarded manually when time limit is reached
    },
    image: '/trophies/survived_three_years.svg'
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
    const trigger = award.trigger;
    let subject = '';
    let body = '';
    
    // Generate contextual messages based on award type
    if (trigger.type === 'firm_cash_threshold') {
      // Firm cash awards - messages about buying yourself things
      const firmCashMessages = [
        {
          subject: `🏆 You've Earned It: ${award.name}`,
          body: `CONGRATULATIONS!\n\nYou've accumulated enough firm cash to treat yourself. ${award.name} is yours.\n\n${award.description}\n\nThis achievement has been added to your trophy cabinet. Enjoy the fruits of your success!\n\nBest regards,\nIndustry Recognition Committee`
        },
        {
          subject: `🏆 Success Unlocked: ${award.name}`,
          body: `Well done!\n\nYour firm cash has reached new heights, and you've earned ${award.name}.\n\n${award.description}\n\nTime to celebrate - you've bought yourself something nice. This trophy is now in your cabinet.\n\nKeep it up!\n\nBest regards,\nIndustry Recognition Committee`
        },
        {
          subject: `🏆 Achievement: ${award.name}`,
          body: `CONGRATULATIONS!\n\nYou've worked hard, and now you can afford ${award.name}.\n\n${award.description}\n\nThis is what success looks like. Your trophy cabinet is getting impressive.\n\nBest regards,\nIndustry Recognition Committee`
        },
        {
          subject: `🏆 You Deserve This: ${award.name}`,
          body: `Outstanding performance!\n\n${award.description}\n\nYou've earned enough to get yourself ${award.name}. This achievement has been added to your trophy cabinet.\n\nEnjoy the rewards of your success!\n\nBest regards,\nIndustry Recognition Committee`
        },
        {
          subject: `🏆 Milestone Reached: ${award.name}`,
          body: `CONGRATULATIONS!\n\nYour firm cash milestone has unlocked ${award.name}.\n\n${award.description}\n\nYou've bought yourself something special. This trophy is now yours.\n\nBest regards,\nIndustry Recognition Committee`
        }
      ];
      const message = firmCashMessages[Math.floor(Math.random() * firmCashMessages.length)];
      subject = message.subject;
      body = message.body;
    } else if (trigger.type === 'nav_threshold') {
      // NAV awards - messages about fund growth and recognition
      const navMessages = [
        {
          subject: `🏆 Fund Recognition: ${award.name}`,
          body: `CONGRATULATIONS!\n\nYour fund has reached an impressive milestone.\n\n${award.description}\n\nYou've earned ${award.name} - a testament to your fund management skills. This achievement has been added to your trophy cabinet.\n\nKeep building that legacy!\n\nBest regards,\nIndustry Recognition Committee`
        },
        {
          subject: `🏆 Outstanding Performance: ${award.name}`,
          body: `Well done!\n\n${award.description}\n\nYour fund's growth has earned you ${award.name}. This is a significant achievement that reflects your strategic prowess.\n\nThis trophy is now in your cabinet. Keep up the excellent work!\n\nBest regards,\nIndustry Recognition Committee`
        },
        {
          subject: `🏆 Achievement Unlocked: ${award.name}`,
          body: `CONGRATULATIONS!\n\n${award.description}\n\nYou've earned ${award.name} through exceptional fund performance. This achievement has been added to your trophy cabinet.\n\nYour fund is making waves in the industry.\n\nBest regards,\nIndustry Recognition Committee`
        },
        {
          subject: `🏆 Milestone Achievement: ${award.name}`,
          body: `Outstanding!\n\n${award.description}\n\nYour fund has reached new heights, earning you ${award.name}. This trophy represents your success and is now in your cabinet.\n\nKeep building that track record!\n\nBest regards,\nIndustry Recognition Committee`
        },
        {
          subject: `🏆 Recognition: ${award.name}`,
          body: `CONGRATULATIONS!\n\n${award.description}\n\nYou've earned ${award.name} - recognition for your fund's impressive growth. This achievement has been added to your trophy cabinet.\n\nBest regards,\nIndustry Recognition Committee`
        }
      ];
      const message = navMessages[Math.floor(Math.random() * navMessages.length)];
      subject = message.subject;
      body = message.body;
    } else if (trigger.type === 'margin_call') {
      // Margin call - different tone (ironic/satirical)
      subject = `🏆 "Achievement" Unlocked: ${award.name}`;
      body = `Well... this happened.\n\n${award.description}\n\nYou've earned ${award.name} - a reminder that leverage cuts both ways. This "achievement" has been added to your trophy cabinet.\n\nMaybe next time, dial it back a bit?\n\nBest regards,\nIndustry Recognition Committee`;
    } else {
      // Default message
      subject = `🏆 Award: ${award.name}`;
      body = `CONGRATULATIONS!\n\nYour fund has been recognized for outstanding performance.\n\nAWARD: ${award.name}\n${award.description}\n\nThis achievement has been added to your trophy cabinet.\n\nKeep up the excellent work!\n\nBest regards,\nIndustry Recognition Committee`;
    }
    
    return {
      id: crypto.randomUUID(),
      sender: 'Industry Recognition Committee',
      subject: subject,
      body: body,
      date: currentDate.toISOString().split('T')[0],
      type: 'standard',
      read: false,
      requires_response: false,
      data: {
        award_id: award.id,
        award_name: award.name,
        award_description: award.description,
        award_image: award.image
      }
    };
  }
}

