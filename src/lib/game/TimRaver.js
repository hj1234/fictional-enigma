/**
 * Tim Raver - Inverse Jim Cramer style character who gives consistently wrong buy/sell recommendations
 * Appears as newswire events (not emails)
 */

import { REGIMES, ASSET_CLASSES, REGIME_MODIFIERS } from './MarketRegime.js';

export class TimRaver {
  constructor() {
    this.name = "Tim Raver";
    this.title = "Market Commentator";
    this.accuracy = 0.0; // Always wrong (inverse Cramer)
  }
  
  /**
   * Generate buy/sell recommendations (always wrong)
   * @param {Object} actualRegime - The actual current regime info
   * @param {Date} currentDate - Current game date
   * @returns {Object} Newswire item object
   */
  generateRecommendations(actualRegime, currentDate) {
    // Get what's actually good and bad for the current regime
    const actualRecommendations = this._getAssetClassRecommendations(actualRegime.current_regime);
    
    // Invert: recommend buying what's bad, selling what's good
    const buyRecommendations = actualRecommendations.disfavored; // Buy what's actually bad
    const sellRecommendations = actualRecommendations.favored; // Sell what's actually good
    
    // Pick 1-3 asset classes to focus on (keep it short and punchy)
    const buyTargets = this._randomSelect(buyRecommendations, 1, 2);
    const sellTargets = this._randomSelect(sellRecommendations, 1, 2);
    
    // Generate newswire content
    const message = this._generateCramerMessage(buyTargets, sellTargets);
    
    return {
      id: crypto.randomUUID(),
      headline: message.headline,
      body: message.body,
      date: currentDate.toISOString().split('T')[0],
      type: "alert",
      read: false,
      author: this.name,
      source: `${this.name} - ${this.title}`,
      _tim_raver_analysis: {
        buy: buyTargets,
        sell: sellTargets,
        actual_regime: actualRegime.current_regime,
        is_correct: false // Always false
      }
    };
  }
  
  _getAssetClassRecommendations(regime) {
    const modifiers = REGIME_MODIFIERS[regime];
    const recommendations = {
      favored: [],
      disfavored: []
    };
    
    // Categorize asset classes based on modifiers
    for (const [assetClass, modifier] of Object.entries(modifiers)) {
      if (modifier >= 1.2) {
        recommendations.favored.push(assetClass);
      } else if (modifier <= 0.85) {
        recommendations.disfavored.push(assetClass);
      }
    }
    
    return recommendations;
  }
  
  _randomSelect(array, min, max) {
    if (array.length === 0) return [];
    const count = Math.min(array.length, Math.floor(Math.random() * (max - min + 1)) + min);
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  
  _generateCramerMessage(buyTargets, sellTargets) {
    const assetClassLabels = {
      [ASSET_CLASSES.CRYPTO]: "CRYPTO",
      [ASSET_CLASSES.EQUITIES]: "EQUITIES",
      [ASSET_CLASSES.FIXED_INCOME]: "BONDS",
      [ASSET_CLASSES.COMMODITIES]: "COMMODITIES",
      [ASSET_CLASSES.VOLATILITY]: "VOL",
      [ASSET_CLASSES.FX]: "FX",
      [ASSET_CLASSES.GENERALIST]: "GENERALIST"
    };
    
    // Collection of short, funny Cramer-style messages
    const buyMessages = [
      (asset) => `BUY ${asset}! BUY BUY BUY! This is THE trade of the year!`,
      (asset) => `I'm TELLING you - ${asset} is about to EXPLODE! Get in NOW!`,
      (asset) => `${asset}? This is a NO-BRAINER! Load up the truck!`,
      (asset) => `You want to make money? BUY ${asset}! It's going to the MOON!`,
      (asset) => `${asset} is the play. Trust me. This is going to be HUGE!`,
      (asset) => `I've never been more CERTAIN - ${asset} is the move!`,
      (asset) => `${asset}? YES! YES! YES! This is the opportunity of a LIFETIME!`,
      (asset) => `Don't think. Just BUY ${asset}. The charts are SCREAMING!`,
      (asset) => `${asset} is about to RIP! Get positioned NOW before it's too late!`,
      (asset) => `I'm BEGGING you - buy ${asset}! This is going to be LEGENDARY!`
    ];
    
    const sellMessages = [
      (asset) => `SELL ${asset}! Get out NOW before it's too late!`,
      (asset) => `${asset} is DEAD MONEY! Dump it immediately!`,
      (asset) => `I'm WARNING you - ${asset} is about to CRASH! Sell everything!`,
      (asset) => `${asset}? That trade is OVER! Take profits and RUN!`,
      (asset) => `Get OUT of ${asset}! The party is OVER!`,
      (asset) => `${asset} is going to ZERO! Sell it ALL!`,
      (asset) => `I've never seen a worse setup - DUMP ${asset} immediately!`,
      (asset) => `${asset} is a TRAP! Don't be the last one holding the bag!`,
      (asset) => `SELL ${asset}! This is going to HURT if you don't!`,
      (asset) => `${asset}? That's a LOSER! Cut your losses NOW!`
    ];
    
    const openingPhrases = [
      "BREAKING: ",
      "URGENT: ",
      "ALERT: ",
      "EXCLUSIVE: ",
      "LISTEN UP: ",
      "STOP WHAT YOU'RE DOING: "
    ];
    
    // Build the message
    let headline = "";
    let body = "";
    
    // Pick a random opening
    const opening = openingPhrases[Math.floor(Math.random() * openingPhrases.length)];
    
    // Generate buy message
    if (buyTargets.length > 0) {
      const buyAsset = assetClassLabels[buyTargets[0]];
      const buyMessage = buyMessages[Math.floor(Math.random() * buyMessages.length)](buyAsset);
      headline = `${opening}${buyMessage}`;
      body = buyMessage;
      
      // Add additional buy targets if any
      if (buyTargets.length > 1) {
        body += `\n\nAlso BUY ${assetClassLabels[buyTargets[1]]}! Same story!`;
      }
    }
    
    // Add sell message
    if (sellTargets.length > 0) {
      const sellAsset = assetClassLabels[sellTargets[0]];
      const sellMessage = sellMessages[Math.floor(Math.random() * sellMessages.length)](sellAsset);
      
      if (headline) {
        body += `\n\n${sellMessage}`;
      } else {
        headline = `${opening}${sellMessage}`;
        body = sellMessage;
      }
      
      // Add additional sell targets if any
      if (sellTargets.length > 1) {
        body += `\n\nAnd SELL ${assetClassLabels[sellTargets[1]]}! Get out!`;
      }
    }
    
    // Add closing
    const closings = [
      "\n\nThis is NOT financial advice, but I'm telling you - this is the move!",
      "\n\nThe data is CLEAR. The charts are SCREAMING. Don't miss this!",
      "\n\nI've been doing this for YEARS. Trust me on this one!",
      "\n\nYou're going to thank me later. This is the trade!",
      "\n\nDon't say I didn't warn you. This is happening NOW!",
      "\n\nI'm putting my reputation on the line here. This is IT!"
    ];
    
    body += closings[Math.floor(Math.random() * closings.length)];
    body += `\n\n- ${this.name}\n${this.title}`;
    
    return { headline, body };
  }
}
