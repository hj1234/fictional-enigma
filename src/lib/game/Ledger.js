/**
 * Ledger class - Manages all transactions and ledger entries.
 */
export class Ledger {
  constructor(initialCash = 30_000_000.0) {
    this.firm_cash = initialCash;
    this.ledger = [];
    this.current_date = null;
  }
  
  addTransaction(description, amount, affectCash = true, currentDate = null) {
    if (affectCash) {
      this.firm_cash += amount;
    }
    
    const date = currentDate || this.current_date;
    const dateStr = date ? date.toISOString().split('T')[0] : "Unknown";
    
    this.ledger.unshift({
      date: dateStr,
      desc: description,
      amount: amount,
      balance: this.firm_cash
    });
    
    // Keep only last 50 entries
    if (this.ledger.length > 50) {
      this.ledger = this.ledger.slice(0, 50);
    }
  }
  
  checkInsolvency(currentDate) {
    return this.firm_cash < 0;
  }
  
  getLedger() {
    return this.ledger;
  }
}

