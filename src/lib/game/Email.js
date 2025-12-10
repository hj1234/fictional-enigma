/**
 * Email class and email creation functions
 */

export class Email {
  constructor(sender, subject, body, emailType = "standard", data = null) {
    this.id = crypto.randomUUID();
    this.sender = sender;
    this.subject = subject;
    this.body = body;
    this.type = emailType;
    this.data = data || {};
    this.read = false;
  }
}

export function createWelcomeLeverageEmail() {
  return new Email(
    "Goldman Sachs Prime",
    "Welcome to Prime Services",
    "Dear Client,\n\nWe noticed you have begun utilizing your margin facility. We are happy to extend you credit at SOFR + 400bps.\n\nPlease note: If your Effective Leverage exceeds 15.0x, our risk systems will automatically liquidate your portfolio to cover our exposure.\n\nHappy Trading,\nRisk Desk",
    "standard"
  );
}

export function createWarningEmail(level) {
  if (level === "medium") {
    // 8x warning - first warning, professional but concerned
    return new Email(
      "GS Risk Desk",
      "Risk Alert: Elevated Leverage",
      "Dear Client,\n\nYour effective leverage has crossed 8.0x. While within acceptable limits, we recommend monitoring your exposure closely. Consider reducing gross exposure if market conditions deteriorate.\n\nOur maximum permitted leverage is 15.0x. Exceeding this threshold will trigger automatic liquidation.\n\nBest regards,\nRisk Management",
      "alert"
    );
  } else if (level === "high") {
    // 10x warning - more urgent
    return new Email(
      "GS Risk Desk",
      "URGENT: High Leverage Alert",
      "URGENT NOTICE\n\nYour effective leverage has exceeded 10.0x. This is a significant risk level that requires immediate attention.\n\nWe STRONGLY advise reducing your gross exposure immediately. Market volatility at these leverage levels can result in rapid capital erosion.\n\nWARNING: Our absolute maximum is 15.0x. Do not approach this threshold.\n\nPlease contact your relationship manager immediately.\n\nRisk Management",
      "alert"
    );
  } else if (level === "critical") {
    // 12.5x warning - very panicky
    return new Email(
      "GS Risk Desk",
      "CRITICAL: EXTREME LEVERAGE WARNING",
      "CRITICAL ALERT - IMMEDIATE ACTION REQUIRED\n\nYOUR EFFECTIVE LEVERAGE HAS REACHED 12.5x.\n\nTHIS IS EXTREMELY DANGEROUS. You are approaching our ABSOLUTE MAXIMUM of 15.0x. If you cross 15.0x, our systems will AUTOMATICALLY LIQUIDATE your entire portfolio.\n\nYOU MUST REDUCE EXPOSURE NOW. There are no exceptions. No negotiations. 15.0x is the hard limit.\n\nThis is your final warning before automatic liquidation.\n\nContact us IMMEDIATELY.\n\nRisk Management - Emergency Desk",
      "alert"
    );
  } else if (level === "margin_call") {
    // 15x margin call - game over
    return new Email(
      "GS Risk Desk",
      "MARGIN CALL: AUTOMATIC LIQUIDATION",
      "MARGIN CALL EXECUTED\n\nYour effective leverage has exceeded 15.0x, our absolute maximum threshold.\n\nIn accordance with our risk management protocols, we have AUTOMATICALLY LIQUIDATED your entire portfolio to cover our exposure.\n\nAll positions have been closed. Your account has been frozen.\n\nThis action is irreversible.\n\nRisk Management - Liquidation Desk",
      "alert",
      { action: "margin_call" }
    );
  }
}

export function createDrawdownWarningEmail(podName, podId, drawdownPct, salary, prestigeMonths) {
  const drawdownDisplay = Math.abs(drawdownPct) * 100;
  
  const body = `RISK MANAGEMENT ALERT

Pod: ${podName}
Current Drawdown: -${drawdownDisplay.toFixed(1)}%

This pod has exceeded the 5% drawdown threshold. In accordance with industry standards, pods typically face termination at this level.

The pod is now trading defensively to protect capital, but continued losses may require intervention.

OPTIONS:
1. Continue monitoring (pod will trade more conservatively)
2. Terminate pod (no cost)

Risk Management`;
  
  return new Email(
    "Risk Management",
    `Drawdown Alert: ${podName}`,
    body,
    "alert",
    {
      pod_id: podId,
      pod_name: podName,
      drawdown_pct: drawdownPct,
      action: "drawdown_warning"
    }
  );
}

