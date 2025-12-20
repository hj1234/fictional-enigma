/**
 * EmailManager class - Manages all email operations.
 * Now just a container - all email creation is handled by MessageManager.
 */

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
  
  // Legacy methods removed - all email creation now handled by MessageManager
  
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

