export const tutorialSteps = [
  {
    targetSelector: '[data-tutorial="header"]',
    title: "Game Header",
    content: "Monitor your fund's key metrics:\n\n• NAV: Net Asset Value (investor equity)\n• Gross: Total exposure across all positions\n• Firm Cash: Your operating capital\n• Effective Leverage: Current risk level (watch for warnings!)",
    tooltip: true
  },
  {
    targetSelector: '[data-tutorial="trading-desk"]',
    title: "Trading Desk",
    content: "Control your fund:\n\n• Set target leverage (1x-10x)\n• Start/stop trading sessions\n• Monitor real-time risk vs target\n• Watch daily interest costs\n\nTip: The slider tracks effective leverage when you're not adjusting it.",
    tooltip: true
  },
  {
    targetSelector: '[data-tutorial="pods-table"]',
    title: "Active Pods",
    content: "Manage your trading teams:\n\n• Adjust allocation with +/- buttons\n• Monitor drawdowns (DD) - fire pods at 5%\n• Track monthly and total PnL\n• Alpha: Expected excess return\n• Beta: Market correlation",
    tooltip: true
  },
  {
    targetSelector: '[data-tutorial="email-inbox"]',
    title: "Email & Ledger",
    content: "Stay informed:\n\n• Recruitment emails: Hire new pods\n• Risk alerts: Manage drawdowns\n• Ledger: Track all transactions\n• Red badges show unread items\n\nClick tabs to switch between emails and ledger.",
    tooltip: true
  },
  {
    targetSelector: '[data-tutorial="market-chart"]',
    title: "Market Performance",
    content: "Watch the market:\n\n• Chart shows cumulative market performance\n• Indexed to 100 at start\n• Use this to gauge market conditions\n• Hover for detailed information",
    tooltip: true
  },
  {
    targetSelector: '[data-tutorial="news-wire"]',
    title: "News Wire",
    content: "Real-time updates:\n\n• Trading activity and PnL\n• Revenue events (fees, bonuses)\n• Risk alerts and warnings\n• Market news and events\n\nScroll to see recent activity.",
    tooltip: true
  }
];

