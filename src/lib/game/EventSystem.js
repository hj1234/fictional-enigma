/**
 * Event System - Utility functions for date checking
 * All event generation is now handled by MessageManager
 */

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

