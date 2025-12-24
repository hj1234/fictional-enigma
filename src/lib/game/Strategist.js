/**
 * Strategist - Market regime analyst who sends emails with regime predictions
 */

import { REGIMES, ASSET_CLASSES, REGIME_MODIFIERS } from './MarketRegime.js';

export class Strategist {
  constructor() {
    this.name = "Marcus Chen";
    this.title = "Chief Strategist";
    this.accuracy = 0.75; // 75% accuracy (sometimes wrong)
    this.last_regime_analysis = null;
  }
  
  /**
   * Generate regime analysis email
   * @param {Object} actualRegime - The actual current regime info
   * @param {Date} currentDate - Current game date
   * @returns {Object} Email object
   */
  generateRegimeAnalysis(actualRegime, currentDate) {
    // Determine if strategist is correct (based on accuracy)
    const isCorrect = Math.random() < this.accuracy;
    const predictedRegime = isCorrect ? actualRegime.current_regime : this._getWrongRegime(actualRegime.current_regime);
    
    // Get asset class recommendations based on predicted regime
    const recommendations = this._getAssetClassRecommendations(predictedRegime);
    
    // Generate email content
    const subject = this._generateSubject(predictedRegime);
    const body = this._generateBody(predictedRegime, recommendations, currentDate);
    
    this.last_regime_analysis = {
      predicted: predictedRegime,
      actual: actualRegime.current_regime,
      correct: isCorrect,
      date: currentDate
    };
    
    return {
      id: crypto.randomUUID(),
      sender: this.name,
      subject: subject,
      body: body,
      date: currentDate.toISOString().split('T')[0],
      type: "standard",
      read: false,
      requires_response: false,
      data: {
        predicted_regime: predictedRegime,
        actual_regime: actualRegime.current_regime,
        is_correct: isCorrect,
        recommendations: recommendations
      }
    };
  }
  
  _getWrongRegime(actualRegime) {
    // Return a random regime that's not the actual one
    const availableRegimes = Object.values(REGIMES).filter(r => r !== actualRegime);
    return availableRegimes[Math.floor(Math.random() * availableRegimes.length)];
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
  
  _generateSubject(regime) {
    const regimeLabels = {
      [REGIMES.EXPANSION]: "Expansion Regime",
      [REGIMES.GOLDILOCKS]: "Goldilocks Environment",
      [REGIMES.DEFLATION]: "Deflationary Pressures",
      [REGIMES.STAGFLATION]: "Stagflation Warning"
    };
    
    return `Market Regime Analysis: ${regimeLabels[regime]}`;
  }
  
  _generateBody(regime, recommendations, currentDate) {
    const regimeDescriptions = {
      [REGIMES.EXPANSION]: "We're seeing rising inflation alongside strong growth. This is a classic expansionary environment where risk assets tend to outperform.",
      [REGIMES.GOLDILOCKS]: "The perfect storm: falling inflation with robust growth. This is the sweet spot for risk assets, particularly equities.",
      [REGIMES.DEFLATION]: "Deflationary pressures are mounting with growth slowing. This environment favors defensive positioning and quality assets.",
      [REGIMES.STAGFLATION]: "The worst of both worlds: rising inflation and slowing growth. This is a challenging environment that requires careful asset selection."
    };
    
    const assetClassLabels = {
      [ASSET_CLASSES.CRYPTO]: "Crypto",
      [ASSET_CLASSES.EQUITIES]: "Equities",
      [ASSET_CLASSES.FIXED_INCOME]: "Fixed Income",
      [ASSET_CLASSES.COMMODITIES]: "Commodities",
      [ASSET_CLASSES.VOLATILITY]: "Volatility",
      [ASSET_CLASSES.CREDIT]: "Credit",
      [ASSET_CLASSES.FX]: "FX/Currency",
      [ASSET_CLASSES.GENERALIST]: "Generalist"
    };
    
    // Select a random email format template
    const formatTemplates = [
      this._generateFormalFormat.bind(this),
      this._generateCasualFormat.bind(this),
      this._generateSkiingFormat.bind(this),
      this._generateCoffeeFormat.bind(this),
      this._generateBriefFormat.bind(this)
    ];
    
    const selectedFormat = formatTemplates[Math.floor(Math.random() * formatTemplates.length)];
    return selectedFormat(regime, recommendations, currentDate, regimeDescriptions, assetClassLabels);
  }
  
  _generateFormalFormat(regime, recommendations, currentDate, regimeDescriptions, assetClassLabels) {
    let body = `MARKET REGIME ANALYSIS\n`;
    body += `Date: ${currentDate.toISOString().split('T')[0]}\n\n`;
    body += `${regimeDescriptions[regime]}\n\n`;
    
    if (recommendations.favored.length > 0) {
      body += `FAVORED ASSET CLASSES:\n`;
      recommendations.favored.forEach(ac => {
        body += `• ${assetClassLabels[ac]}\n`;
      });
      body += `\n`;
    }
    
    if (recommendations.disfavored.length > 0) {
      body += `DISFAVORED ASSET CLASSES:\n`;
      recommendations.disfavored.forEach(ac => {
        body += `• ${assetClassLabels[ac]}\n`;
      });
      body += `\n`;
    }
    
    body += `RECOMMENDATION: Adjust your pod allocations accordingly. Markets are dynamic - this analysis is based on current conditions and may change.\n\n`;
    body += `Best,\n${this.name}\n${this.title}`;
    
    return body;
  }
  
  _generateCasualFormat(regime, recommendations, currentDate, regimeDescriptions, assetClassLabels) {
    let body = `Hey,\n\n`;
    body += `Quick update on the market regime. ${regimeDescriptions[regime]}\n\n`;
    
    if (recommendations.favored.length > 0) {
      body += `What's working:\n`;
      recommendations.favored.forEach(ac => {
        body += `- ${assetClassLabels[ac]}\n`;
      });
      body += `\n`;
    }
    
    if (recommendations.disfavored.length > 0) {
      body += `What's not:\n`;
      recommendations.disfavored.forEach(ac => {
        body += `- ${assetClassLabels[ac]}\n`;
      });
      body += `\n`;
    }
    
    body += `Food for thought as you position the book.\n\n`;
    body += `${this.name}`;
    
    return body;
  }
  
  _generateSkiingFormat(regime, recommendations, currentDate, regimeDescriptions, assetClassLabels) {
    let body = `While cross country skiing this morning, I had a thought about the current market regime.\n\n`;
    body += `${regimeDescriptions[regime]}\n\n`;
    
    if (recommendations.favored.length > 0) {
      body += `The conditions favor:\n`;
      recommendations.favored.forEach(ac => {
        body += `• ${assetClassLabels[ac]}\n`;
      });
      body += `\n`;
    }
    
    if (recommendations.disfavored.length > 0) {
      body += `Meanwhile, I'd be cautious on:\n`;
      recommendations.disfavored.forEach(ac => {
        body += `• ${assetClassLabels[ac]}\n`;
      });
      body += `\n`;
    }
    
    body += `The fresh air helps with perspective. Consider this when allocating capital.\n\n`;
    body += `${this.name}\n${this.title}`;
    
    return body;
  }
  
  _generateCoffeeFormat(regime, recommendations, currentDate, regimeDescriptions, assetClassLabels) {
    let body = `Morning,\n\n`;
    body += `Just finished my third espresso and the charts are telling a story. ${regimeDescriptions[regime]}\n\n`;
    
    if (recommendations.favored.length > 0) {
      body += `Where I'm seeing opportunity:\n`;
      recommendations.favored.forEach(ac => {
        body += `→ ${assetClassLabels[ac]}\n`;
      });
      body += `\n`;
    }
    
    if (recommendations.disfavored.length > 0) {
      body += `Where I'm seeing risk:\n`;
      recommendations.disfavored.forEach(ac => {
        body += `→ ${assetClassLabels[ac]}\n`;
      });
      body += `\n`;
    }
    
    body += `Caffeine-fueled analysis, but the data doesn't lie.\n\n`;
    body += `${this.name}`;
    
    return body;
  }
  
  _generateBriefFormat(regime, recommendations, currentDate, regimeDescriptions, assetClassLabels) {
    let body = `REGIME UPDATE\n\n`;
    body += `${regimeDescriptions[regime]}\n\n`;
    
    if (recommendations.favored.length > 0) {
      body += `↑ ${recommendations.favored.map(ac => assetClassLabels[ac]).join(', ')}\n`;
    }
    
    if (recommendations.disfavored.length > 0) {
      body += `↓ ${recommendations.disfavored.map(ac => assetClassLabels[ac]).join(', ')}\n`;
    }
    
    body += `\n--\n${this.name}`;
    
    return body;
  }
}

