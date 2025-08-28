import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { EmailTemplate, User, ProgressReport } from '@prisma/client';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
}

export interface ProgressEmailData {
  guardian: User;
  student: User;
  progressReport: ProgressReport;
  template: EmailTemplate;
}

export class EmailService {
  /**
   * Send an email using Resend
   */
  static async sendEmail(data: EmailData) {
    try {
      const result = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@eduvibe.vip',
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
      });

      // Log the email
      await this.logEmail(data.to, data.templateId, data.subject, data.html);

      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      
      // Log the failed email
      await this.logEmail(data.to, data.templateId, data.subject, data.html, 'failed', error instanceof Error ? error.message : 'Unknown error');
      
      throw error;
    }
  }

  /**
   * Send progress report email to guardian
   */
  static async sendProgressEmail(data: ProgressEmailData) {
    const { guardian, student, progressReport, template } = data;

    // Replace template variables
    const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
      guardianName: guardian.name || 'Guardian',
      studentName: student.name || 'Student',
      sessionsCount: progressReport.sessionsCount,
      questionsAsked: progressReport.questionsAsked,
      timeSpent: this.formatTime(progressReport.timeSpent),
      topicsCovered: progressReport.topicsCovered?.join(', ') || 'Various topics',
      reportDate: progressReport.reportDate.toLocaleDateString(),
      unsubscribeUrl: `${process.env.NEXTAUTH_URL}/unsubscribe?email=${encodeURIComponent(guardian.email)}`,
    });

    const textContent = this.replaceTemplateVariables(template.textContent, {
      guardianName: guardian.name || 'Guardian',
      studentName: student.name || 'Student',
      sessionsCount: progressReport.sessionsCount,
      questionsAsked: progressReport.questionsAsked,
      timeSpent: this.formatTime(progressReport.timeSpent),
      topicsCovered: progressReport.topicsCovered?.join(', ') || 'Various topics',
      reportDate: progressReport.reportDate.toLocaleDateString(),
      unsubscribeUrl: `${process.env.NEXTAUTH_URL}/unsubscribe?email=${encodeURIComponent(guardian.email)}`,
    });

    return this.sendEmail({
      to: guardian.email,
      subject: template.subject,
      html: htmlContent,
      text: textContent,
      templateId: template.id,
    });
  }

  /**
   * Replace template variables with actual values
   */
  private static replaceTemplateVariables(content: string, variables: Record<string, any>): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  /**
   * Format time in minutes to human readable format
   */
  private static formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
  }

  /**
   * Log email to database
   */
  private static async logEmail(
    recipientEmail: string,
    templateId: string | undefined,
    subject: string,
    content: string,
    status: 'sent' | 'failed' = 'sent',
    errorMessage?: string
  ) {
    try {
      const recipient = await prisma.user.findUnique({
        where: { email: recipientEmail },
      });

      if (recipient) {
        await prisma.emailLog.create({
          data: {
            recipientId: recipient.id,
            templateId,
            subject,
            content,
            status,
            errorMessage,
          },
        });
      }
    } catch (error) {
      console.error('Failed to log email:', error);
    }
  }

  /**
   * Get or create default email templates
   */
  static async getDefaultTemplates() {
    const templates = [
      {
        name: 'weekly_progress',
        subject: 'Weekly Progress Report for {{studentName}}',
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Weekly Progress Report</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Weekly Progress Report</h2>
              <p>Dear {{guardianName}},</p>
              <p>Here's a summary of {{studentName}}'s learning progress this week:</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">📊 This Week's Activity</h3>
                <ul style="list-style: none; padding: 0;">
                  <li style="margin: 10px 0;">📚 <strong>Sessions completed:</strong> {{sessionsCount}}</li>
                  <li style="margin: 10px 0;">❓ <strong>Questions asked:</strong> {{questionsAsked}}</li>
                  <li style="margin: 10px 0;">⏱️ <strong>Time spent learning:</strong> {{timeSpent}}</li>
                  <li style="margin: 10px 0;">📖 <strong>Topics covered:</strong> {{topicsCovered}}</li>
                </ul>
              </div>
              
              <p>Keep up the great work! If you have any questions about {{studentName}}'s progress, please don't hesitate to reach out.</p>
              
              <p>Best regards,<br>The EduVibe Team</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #6b7280;">
                You're receiving this email because you're registered as a guardian for {{studentName}}.
                <a href="{{unsubscribeUrl}}" style="color: #2563eb;">Unsubscribe</a>
              </p>
            </div>
          </body>
          </html>
        `,
        textContent: `
          Weekly Progress Report
          
          Dear {{guardianName}},
          
          Here's a summary of {{studentName}}'s learning progress this week:
          
          This Week's Activity:
          - Sessions completed: {{sessionsCount}}
          - Questions asked: {{questionsAsked}}
          - Time spent learning: {{timeSpent}}
          - Topics covered: {{topicsCovered}}
          
          Keep up the great work! If you have any questions about {{studentName}}'s progress, please don't hesitate to reach out.
          
          Best regards,
          The EduVibe Team
          
          You're receiving this email because you're registered as a guardian for {{studentName}}.
          To unsubscribe, visit: {{unsubscribeUrl}}
        `,
      },
    ];

    for (const template of templates) {
      await prisma.emailTemplate.upsert({
        where: { name: template.name },
        update: {},
        create: template,
      });
    }
  }
}
