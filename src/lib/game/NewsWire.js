/**
 * Market News system - Generates market news that can have market impact or be informational.
 */
export class NewsItem {
  constructor(id, headline, body, date, marketImpact = {}, newsType = "info") {
    this.id = id;
    this.headline = headline;
    this.body = body;
    this.date = date;
    this.market_impact = marketImpact;
    this.news_type = newsType;
    this.read = false;
  }
  
  toDict() {
    return {
      id: this.id,
      headline: this.headline,
      body: this.body,
      date: this.date.toISOString().split('T')[0],
      market_impact: this.market_impact,
      type: this.news_type,
      read: this.read
    };
  }
}

export class NewsWire {
  static NEWS_TEMPLATES = [
    {
      headline: "Fed Signals Rate Cut",
      body: "Federal Reserve hints at potential rate cuts in upcoming meetings, sparking optimism in equity markets.",
      impact: { volatility_spike: 0.008 },
      type: "info",
      probability: 0.03
    },
    {
      headline: "Major Tech Earnings Beat Expectations",
      body: "Tech giants report stronger-than-expected earnings, driving sector-wide rally.",
      impact: { volatility_spike: 0.005 },
      type: "info",
      probability: 0.04
    },
    {
      headline: "Geopolitical Tensions Escalate",
      body: "Rising tensions in key regions create uncertainty in global markets.",
      impact: { volatility_spike: 0.012 },
      type: "alert",
      probability: 0.02
    },
    {
      headline: "Flash Crash in Asian Markets",
      body: "Sudden sell-off in Asian markets triggers circuit breakers. European markets opening lower.",
      impact: { volatility_spike: 0.02, market_halt: false },
      type: "breaking",
      probability: 0.01
    },
    {
      headline: "Oil Prices Surge on Supply Concerns",
      body: "Crude oil prices jump 5% following supply disruption reports.",
      impact: { volatility_spike: 0.006 },
      type: "info",
      probability: 0.03
    },
    {
      headline: "Inflation Data Comes in Lower Than Expected",
      body: "CPI data shows cooling inflation, boosting market sentiment.",
      impact: { volatility_spike: 0.004 },
      type: "info",
      probability: 0.03
    },
    {
      headline: "Major Bank Reports Trading Loss",
      body: "Large investment bank discloses significant trading losses, raising concerns about risk management.",
      impact: { volatility_spike: 0.01 },
      type: "alert",
      probability: 0.015
    },
    {
      headline: "Cryptocurrency Market Volatility",
      body: "Bitcoin and other cryptocurrencies experience sharp price movements.",
      impact: { volatility_spike: 0.003 },
      type: "info",
      probability: 0.04
    },
    {
      headline: "Trade War Escalation",
      body: "New tariffs announced between major trading partners, markets react negatively.",
      impact: { volatility_spike: 0.015 },
      type: "alert",
      probability: 0.01
    },
    {
      headline: "Strong Jobs Report",
      body: "Employment data exceeds expectations, suggesting robust economic growth.",
      impact: { volatility_spike: 0.004 },
      type: "info",
      probability: 0.03
    },
    {
      headline: "Market Holiday - Low Volume Trading",
      body: "Trading volumes are lower than usual due to market holidays in key regions.",
      impact: {},
      type: "info",
      probability: 0.02
    },
    {
      headline: "Central Bank Intervention",
      body: "Central banks announce coordinated intervention to stabilize markets.",
      impact: { volatility_spike: -0.005 },
      type: "breaking",
      probability: 0.005
    }
  ];
  
  constructor(startDate) {
    this.news_items = [];
    this.current_date = startDate;
    this._last_news_check = startDate;
  }
  
  checkForNews() {
    for (const template of NewsWire.NEWS_TEMPLATES) {
      if (Math.random() < template.probability) {
        const newsItem = new NewsItem(
          crypto.randomUUID(),
          template.headline,
          template.body,
          this.current_date,
          { ...template.impact },
          template.type
        );
        this.news_items.unshift(newsItem);
        if (this.news_items.length > 50) {
          this.news_items.pop();
        }
        return newsItem;
      }
    }
    return null;
  }
  
  getRecentNews(limit = 20) {
    return this.news_items.slice(0, limit).map(item => item.toDict());
  }
  
  applyMarketImpact(newsItem, fund) {
    const impacts_applied = {};
    
    if ("volatility_spike" in newsItem.market_impact) {
      const spike = newsItem.market_impact.volatility_spike;
      // Apply spike to both base and current volatility for persistent effect
      fund.base_market_volatility = Math.max(0.003, fund.base_market_volatility + spike * 0.3);
      fund.market_volatility = Math.max(0.003, fund.market_volatility + spike);
      impacts_applied.volatility_change = spike;
    }
    
    if (newsItem.market_impact.market_halt && newsItem.market_impact.market_halt) {
      impacts_applied.market_halt = true;
    }
    
    return impacts_applied;
  }
  
  updateDate(newDate) {
    this.current_date = newDate;
  }
}

