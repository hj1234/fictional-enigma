/**
 * MessageManager - Unified content system for all game messages
 * Handles newswire, emails, and ledger entries with a consistent structure
 */

export class MessageManager {
  constructor(startDate, messages = null) {
    this.current_date = startDate;
    this.messages = messages || [];
    
    // Separate storage by channel for easy access
    this.newswire_items = [];
    this.emails = [];
    this.ledger_entries = [];
  }

  /**
   * Load messages from API and organize by channel
   */
  async loadMessages(apiBase = 'http://localhost:8000') {
    try {
      const response = await fetch(`${apiBase}/api/messages?active_only=true`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const messages = await response.json();
      this.messages = messages;
      this._organizeMessages();
      return messages;
    } catch (error) {
      console.warn('Failed to load messages from API, using defaults', error);
      return [];
    }
  }

  /**
   * Organize messages by channel
   */
  _organizeMessages() {
    this.newswire_items = this.messages.filter(m => m.channel === 'newswire');
    this.emails = this.messages.filter(m => m.channel === 'email');
    this.ledger_entries = this.messages.filter(m => m.channel === 'ledger');
  }

  /**
   * Check for random messages (newswire and emails)
   */
  checkRandomMessages() {
    const results = {
      newswire: null,
      email: null
    };

    // Check random newswire messages
    const random_newswire = this.newswire_items.filter(
      m => m.creation_trigger === 'random' && m.active !== false
    );
    for (const message of random_newswire) {
      const probability = message.creation_trigger_config?.probability || 0.03;
      if (Math.random() < probability) {
        results.newswire = this._createNewswireItem(message);
        break; // Only one random news per check
      }
    }

    // Check random email messages
    const random_emails = this.emails.filter(
      m => m.creation_trigger === 'random' && m.active !== false
    );
    for (const message of random_emails) {
      const probability = message.creation_trigger_config?.probability || 0.03;
      if (Math.random() < probability) {
        results.email = this._createEmail(message);
        break; // Only one random email per check
      }
    }

    return results;
  }

  /**
   * Trigger game event messages
   */
  triggerGameEvent(eventType, eventData = {}) {
    const results = {
      newswire: [],
      email: [],
      ledger: []
    };

    // Find messages triggered by this game event
    const event_messages = this.messages.filter(
      m => m.creation_trigger === 'game_event' &&
           m.creation_trigger_config?.event_type === eventType &&
           m.active !== false
    );

    for (const message of event_messages) {
      // Check if conditions are met
      if (this._checkConditions(message.creation_trigger_config?.conditions, eventData)) {
        const channel = message.channel;
        
        if (channel === 'newswire') {
          results.newswire.push(this._createNewswireItem(message, eventData));
        } else if (channel === 'email') {
          results.email.push(this._createEmail(message, eventData));
        } else if (channel === 'ledger') {
          results.ledger.push(this._createLedgerEntry(message, eventData));
        }
      }
    }

    return results;
  }

  /**
   * Check if message conditions are met
   */
  _checkConditions(conditions, eventData) {
    if (!conditions) return true;

    // Example conditions:
    // { "leverage": { "gte": 8.0 }, "pod_drawdown": { "lte": -0.05 } }
    for (const [key, check] of Object.entries(conditions)) {
      const value = eventData[key];
      if (value === undefined) return false;

      if (check.gte !== undefined && value < check.gte) return false;
      if (check.lte !== undefined && value > check.lte) return false;
      if (check.eq !== undefined && value !== check.eq) return false;
      if (check.gt !== undefined && value <= check.gt) return false;
      if (check.lt !== undefined && value >= check.lt) return false;
    }

    return true;
  }

  /**
   * Create a newswire item from message template
   */
  _createNewswireItem(message, eventData = {}) {
    const content = message.content || {};
    const impact = message.impact || {};
    
    const newsItem = {
      id: crypto.randomUUID(),
      headline: this._interpolate(content.headline || content.text || "", eventData),
      body: this._interpolate(content.body || "", eventData),
      date: this.current_date.toISOString().split('T')[0],
      type: content.type || "info",
      read: false,
      _message_template: message // Store reference for impact application
    };
    
    // For flavor text, use text as headline
    if (content.type === "flavor" && content.text) {
      newsItem.text = newsItem.headline;
      newsItem.headline = null;
    }
    
    return newsItem;
  }

  /**
   * Create an email from message template
   */
  _createEmail(message, eventData = {}) {
    const content = message.content || {};
    
    // Interpolate data fields if they exist
    let interpolatedData = content.data || eventData;
    if (typeof interpolatedData === 'object' && interpolatedData !== null) {
      interpolatedData = {};
      for (const [key, value] of Object.entries(content.data || {})) {
        if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
          const varName = value.slice(1, -1);
          interpolatedData[key] = eventData[varName] !== undefined ? eventData[varName] : value;
        } else {
          interpolatedData[key] = value;
        }
      }
      // Merge with eventData
      interpolatedData = { ...interpolatedData, ...eventData };
    }
    
    // For backward compatibility, add action field for drawdown warnings
    if (message.creation_trigger_config?.event_type === 'pod_drawdown' && 
        message.impact?.user_action?.fire) {
      interpolatedData.action = 'drawdown_warning';
    }
    
    return {
      id: crypto.randomUUID(),
      sender: content.sender || "System",
      subject: this._interpolate(content.subject || "", eventData),
      body: this._interpolate(content.body || "", eventData),
      date: this.current_date.toISOString().split('T')[0],
      type: content.type || "standard",
      read: false,
      requires_response: message.features?.requires_response || false,
      data: interpolatedData,
      _message_template: message // Store reference for response handling
    };
  }

  /**
   * Create a ledger entry from message template
   */
  _createLedgerEntry(message, eventData = {}) {
    const content = message.content || {};
    
    return {
      date: this.current_date.toISOString().split('T')[0],
      desc: this._interpolate(content.description || "", eventData),
      amount: this._calculateAmount(content.amount, eventData),
      affect_cash: content.affect_cash !== false,
      _message_template: message
    };
  }

  /**
   * Interpolate template strings with event data
   * Example: "Pod {pod_name} has {drawdown}% drawdown" -> "Pod Alpha Fund has -5.2% drawdown"
   * Made public for use in GameState
   */
  interpolate(template, data) {
    return this._interpolate(template, data);
  }
  
  _interpolate(template, data) {
    if (!template) return "";
    
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  /**
   * Calculate amount for ledger entries (can be formula or static)
   */
  _calculateAmount(amountConfig, eventData) {
    if (typeof amountConfig === 'number') {
      return amountConfig;
    }
    
    if (typeof amountConfig === 'object' && amountConfig.formula) {
      // Simple formula evaluation
      // Example: { "formula": "pod_salary / 12" }
      try {
        const formula = amountConfig.formula;
        // Replace variables with values from eventData
        let evaluated = formula;
        for (const [key, value] of Object.entries(eventData)) {
          evaluated = evaluated.replace(new RegExp(`\\b${key}\\b`, 'g'), value);
        }
        return eval(evaluated); // In production, use a safer evaluator
      } catch (e) {
        console.error('Error evaluating amount formula:', e);
        return 0;
      }
    }
    
    return 0;
  }

  /**
   * Apply impact from a newswire message
   */
  applyImpact(newswireItem, fund) {
    if (!newswireItem._message_template) return {};
    
    const impact = newswireItem._message_template.impact || {};
    const simulation_impact = impact.simulation || {};
    const results = {};

    // Apply volatility spike
    if (simulation_impact.volatility_spike !== undefined) {
      const spike = simulation_impact.volatility_spike;
      fund.base_market_volatility = Math.max(0.003, fund.base_market_volatility + spike * 0.3);
      fund.market_volatility = Math.max(0.003, fund.market_volatility + spike);
      results.volatility_change = spike;
    }

    // Apply market halt
    if (simulation_impact.market_halt === true) {
      results.market_halt = true;
    }

    // Apply other simulation impacts
    if (simulation_impact.investor_equity_multiplier) {
      fund.investor_equity *= simulation_impact.investor_equity_multiplier;
    }

    return results;
  }

  /**
   * Handle email response
   */
  handleEmailResponse(email, response, gameState) {
    if (!email._message_template) return null;
    
    const impact = email._message_template.impact || {};
    const user_action_impact = impact.user_action || {};
    
    if (!user_action_impact[response]) {
      return null;
    }

    const action = user_action_impact[response];
    const results = {};

    // Handle different action types
    if (action.type === 'hire_pod') {
      // Extract pod data from email
      const podData = email.data;
      // This would trigger pod creation in GameState
      results.action = 'hire_pod';
      results.data = podData;
    } else if (action.type === 'fire_pod') {
      results.action = 'fire_pod';
      results.pod_id = email.data?.pod_id;
    } else if (action.type === 'ledger_transaction') {
      results.action = 'ledger_transaction';
      results.transaction = action.transaction;
    }

    return results;
  }

  updateDate(newDate) {
    this.current_date = newDate;
  }
}

