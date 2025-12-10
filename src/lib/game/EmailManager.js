/**
 * EmailManager class - Manages all email operations.
 */
import { Email, createWelcomeLeverageEmail, createWarningEmail } from './Email.js';
import { generateRecruit } from './Recruitment.js';

export class EmailManager {
  constructor(startDate) {
    this.emails = [];
    this.current_date = startDate;
  }
  
  sendEmail(emailObj) {
    emailObj.date = this.current_date.toISOString().split('T')[0];
    this.emails.unshift(emailObj);
    if (this.emails.length > 20) {
      this.emails.pop();
    }
  }
  
  removeEmail(emailId) {
    this.emails = this.emails.filter(e => e.id !== emailId);
  }
  
  getEmail(emailId) {
    return this.emails.find(e => e.id === emailId) || null;
  }
  
  checkRecruitment() {
    const pending_recruits = this.emails.filter(e => e.type === 'recruitment').length;
    
    if (Math.random() < 0.072) { // 20% more likely (0.06 * 1.2 = 0.072)
      const recruit = generateRecruit();
      
      const headhunter_greetings = [
        "Hey,",
        "Hi there,",
        "Morning,",
        "Hope you're well,"
      ];
      
      const headhunter_messages = [
        `Thought you might like ${recruit.name}'s profile. I'm in town next week, let's grab coffee.`,
        `Found someone interesting - ${recruit.name}. Worth a look. Coffee next week?`,
        `Check out ${recruit.name}. Strong candidate. Free for coffee Tuesday?`,
        `${recruit.name} might be a fit. Let me know if you want to chat over coffee.`
      ];
      
      const greeting = headhunter_greetings[Math.floor(Math.random() * headhunter_greetings.length)];
      const message = headhunter_messages[Math.floor(Math.random() * headhunter_messages.length)];
      
      const body = `${greeting}

${message}

---
CANDIDATE PROFILE
---

Name: ${recruit.name}
Specialism: ${recruit.specialism}

PERFORMANCE METRICS:
Alpha (Annualized): ${recruit.stats.alpha_display}
Beta: ${recruit.stats.beta}
Last Drawdown: ${recruit.stats.last_drawdown}
Lifetime PnL: ${recruit.stats.lifetime_pnl}

COMPENSATION DEMANDS:
Sign-on Bonus: $${recruit.demands.signing_bonus.toLocaleString('en-US')}
Annual Salary: $${recruit.demands.salary.toLocaleString('en-US')}
Performance Cut: ${recruit.demands.pnl_cut}%

BIO:
${recruit.bio}

Best,
Headhunter`;
      
      const email = new Email(
        "Headhunter",
        `Candidate: ${recruit.name} (${recruit.specialism})`,
        body,
        "recruitment",
        recruit
      );
      this.sendEmail(email);
      return true;
    }
    return false;
  }
  
  sendLeverageWarning(level) {
    this.sendEmail(createWarningEmail(level));
  }
  
  sendWelcomeLeverageEmail() {
    this.sendEmail(createWelcomeLeverageEmail());
  }
  
  markEmailAsRead(emailId) {
    const email = this.emails.find(e => e.id === emailId);
    if (email) {
      email.read = true;
    }
  }
  
  getSerializedEmails() {
    return this.emails.map(e => ({
      id: e.id,
      sender: e.sender,
      subject: e.subject,
      body: e.body,
      type: e.type,
      data: e.data,
      date: e.date || "",
      read: e.read || false
    }));
  }
  
  updateDate(newDate) {
    this.current_date = newDate;
  }
}

