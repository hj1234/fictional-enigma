/**
 * Email class - Simple email data structure
 * All email creation is now handled by MessageManager
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

