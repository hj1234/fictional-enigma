export const tutorialSteps = [
  {
    targetSelector: '[data-tutorial="trading-desk"]',
    title: "Trading Desk",
    content: "Control your fund's operations:\n\n• LEVERAGE SLIDER: Set your target leverage from 1x to 10x. This determines how much capital you borrow relative to investor equity. Higher leverage = higher risk and potential returns.\n\n• START/HALT TRADING: Click to start or pause the game. When halted, time stops and you can adjust allocations without market movement.\n\n• The slider shows your effective leverage (actual risk) vs target leverage. Effective leverage changes as your NAV fluctuates.",
    tooltip: true
  },
  {
    targetSelector: '[data-tutorial="news-wire"]',
    title: "News Wire",
    content: "Real-time market updates and fund activity:\n\n• Market news and events that affect trading\n• Trading activity and PnL updates\n• Revenue events (management fees, performance bonuses)\n• Risk alerts and warnings\n• Newswire items appear automatically as events occur\n\nScroll to see recent activity. This is your primary source of market information.",
    tooltip: true
  },
  {
    targetSelector: '[data-tutorial="email-inbox"]',
    title: "Email Inbox",
    content: "Stay informed and manage your fund:\n\n• RECRUITMENT EMAILS: Hire new trading pods (PMs) to manage capital\n• RISK ALERTS: Warnings when pods hit drawdown thresholds\n• LEVERAGE WARNINGS: Alerts from your prime broker about risk levels\n• STRATEGIST UPDATES: Market regime analysis and recommendations\n\nClick on emails to view details and take actions (hire, fire, etc.)",
    tooltip: true
  },
  {
    targetSelector: '[data-tutorial="email-inbox"]',
    title: "Firm Ledger",
    content: "Track all financial transactions:\n\n• Switch to the LEDGER tab to see all money movements\n• Monthly salaries paid to pods\n• Management fees collected (2% annual)\n• Performance bonuses paid to pods\n• Sign-on bonuses for new hires\n• Interest payments on borrowed capital\n\nGreen = money in, Red = money out. This is your accounting system.",
    tooltip: true
  },
  {
    targetSelector: '[data-tutorial="pods-table"]',
    title: "Active Pods",
    content: "Manage your trading teams:\n\n• Each pod is a Portfolio Manager (PM) managing allocated capital\n• Use +/- buttons to adjust allocation percentages\n• Monitor drawdowns (DD) - fire pods that exceed -5%\n• Track monthly and total PnL for each pod\n• Alpha: Expected excess return above market\n• Beta: Market correlation (higher = more market exposure)\n• Click (i) button for detailed pod information",
    tooltip: true
  },
  {
    targetSelector: '[data-tutorial="nav-metric"]',
    title: "NAV (Net Asset Value)",
    content: "Your investors' equity:\n\n• NAV represents the funds provided by your investors ($100M starting)\n• This is the return your investors experience - if NAV grows, they profit\n• NAV changes daily based on pod performance\n• Management fees (2% annual) and pod salaries reduce NAV\n• Performance fees (20%) are paid from investor profits\n\nYour goal: Maximize NAV to generate fees and bonuses.",
    tooltip: true
  },
  {
    targetSelector: '[data-tutorial="gross-metric"]',
    title: "Gross Exposure & Leverage",
    content: "Understanding your risk:\n\n• GROSS EXPOSURE: Total capital deployed across all positions\n• LEVERAGE RELATIONSHIP: Gross Exposure = NAV × Effective Leverage\n\nExample: $100M NAV at 2x leverage = $200M gross exposure\n\n• Effective Leverage = Gross Exposure ÷ NAV\n• As NAV changes, effective leverage changes automatically\n• Prime broker will warn you at 8x, 10x, 12.5x\n• Margin call at 15x = game over",
    tooltip: true
  },
  {
    targetSelector: '[data-tutorial="cash-metric"]',
    title: "Firm Cash",
    content: "Your working capital:\n\n• Firm Cash is your operating capital (starting: $25M)\n• Used to pay sign-on bonuses when hiring pods\n• Grows from management fees (2% of NAV annually)\n• Grows from performance fees (20% of investor profits)\n• NOT used for trading - that's investor money (NAV)\n• If Firm Cash goes negative, you can't afford new hires\n\nThis is your personal profit, separate from investor returns.",
    tooltip: true
  },
  {
    targetSelector: '[data-tutorial="trophy-cabinet"]',
    title: "Trophy Cabinet",
    content: "Your achievements:\n\n• Click the 🏆 button to view earned trophies\n• Trophies are awarded for milestones:\n  - NAV thresholds (e.g., $150M, $200M, $500M)\n  - Firm Cash thresholds (e.g., $50M, $75M, $90M)\n  - Special achievements (surviving 3 years, margin calls)\n\n• Each trophy represents a significant milestone in your fund's journey\n• View your collection anytime to see your progress",
    tooltip: true
  },
  {
    targetSelector: '[data-tutorial="retire-button"]',
    title: "Retire Button",
    content: "End your fund management career:\n\n• Click the red door icon to retire and end the game\n• You'll see a shareable results page with:\n  - Final statistics (NAV, PnL, annualized performance)\n  - All earned trophies\n  - A unique shareable link\n\n• You can retire at any time, or the game ends automatically after 5 years\n• Margin calls also end the game automatically\n\nGood luck building your hedge fund empire!",
    tooltip: true
  }
];
