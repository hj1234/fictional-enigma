/**
 * Event System - Handles calendar events (holidays) and random events (flavor text)
 */

export class GameEvent {
  constructor(id, text, type = "info", effect = {}) {
    this.id = id;
    this.text = text;
    this.type = type;
    this.effect = effect;
  }
}

export class EventRegistry {
  constructor() {
    this.calendar_events = [];
    this.random_events = [];
  }
  
  registerCalendar(checkFunc, getEventFunc) {
    this.calendar_events.push([checkFunc, getEventFunc]);
  }
  
  registerRandom(probability, getEventFunc) {
    this.random_events.push([probability, getEventFunc]);
  }
  
  checkForEvents(currentDate) {
    // Check Calendar (Highest Priority)
    for (const [check, getEvent] of this.calendar_events) {
      if (check(currentDate)) {
        return getEvent(currentDate);
      }
    }
    
    // Check Random
    for (const [prob, getEvent] of this.random_events) {
      if (Math.random() < prob) {
        return getEvent();
      }
    }
    
    return null;
  }
}

export function isWeekend(date) {
  return date.getDay() >= 5; // Saturday = 6, Sunday = 0
}

export function getHolidayName(date) {
  const month = date.getMonth() + 1; // JS months are 0-indexed
  const day = date.getDate();
  const weekday = date.getDay();
  
  // Fixed holidays
  if (month === 1 && day === 1) return "New Year's Day";
  if (month === 7 && day === 4) return "Independence Day";
  if (month === 12 && day === 25) return "Christmas Day";
  
  // Floating holidays (simplified)
  if (month === 1 && weekday === 1 && day >= 15 && day <= 21) return "MLK Day";
  if (month === 2 && weekday === 1 && day >= 15 && day <= 21) return "Presidents' Day";
  if (month === 11 && weekday === 4 && day >= 22 && day <= 28) return "Thanksgiving";
  
  return null;
}

export function checkHoliday(date) {
  return getHolidayName(date) !== null;
}

export function createHolidayEvent(date) {
  const name = getHolidayName(date);
  
  const flavor = {
    "New Year's Day": "Traders are nursing hangovers.",
    "MLK Day": "Bond traders are skiing.",
    "Thanksgiving": "Turkey index is up.",
    "Christmas Day": "Santa Rally paused."
  };
  
  const text = flavor[name] || `Markets closed for ${name}.`;
  
  return new GameEvent(
    `holiday_${name}`,
    `MARKET CLOSED: ${text}`,
    "info",
    { market_halt: true }
  );
}

const FLAVOR_TEXT = [
  "Analyst spotted crying in the bathroom.",
  "Compliance officer is asking about your WhatsApps.",
  "Your star trader wants a bigger bonus.",
  "ZeroHedge tweeted about your positions.",
  "The coffee machine is broken. Morale -10.",
  "A junior analyst sent an Excel sheet with hardcoded values.",
  "The printer is out of toner. The deal is stalled."
];

export function createFlavorEvent() {
  const text = FLAVOR_TEXT[Math.floor(Math.random() * FLAVOR_TEXT.length)];
  return new GameEvent(
    "flavor_text",
    text,
    "default",
    {}
  );
}

