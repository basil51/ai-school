# Email System Setup Guide

## Overview
The AI School platform now includes a comprehensive guardian email system that automatically sends weekly progress reports to guardians of students.

## Features Implemented

### 1. Guardian-Student Relationships
- Admin can create relationships between guardians and students
- Relationship status management (pending, approved, rejected, revoked)
- Admin UI for managing relationships at `/admin/guardians`

### 2. Email System
- **Resend Integration**: Uses Resend for reliable email delivery
- **Email Templates**: HTML and text templates with variable substitution
- **Email Preferences**: Guardians can control email frequency and opt-out
- **Email Logging**: All emails are logged in the database for tracking

### 3. Progress Reports
- Automatic generation of weekly progress reports
- Tracks sessions, questions asked, time spent, and topics covered
- Customizable email templates with student-specific data

### 4. Automated Cron Jobs
- Weekly email sending via cron endpoint
- Frequency control and duplicate prevention
- Secure authentication for cron requests

## Environment Variables Required

Add these to your `.env` file:

```env
# Email Configuration
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@eduvibe.vip

# Cron Security
CRON_SECRET=your_secure_cron_secret_here

# App Configuration
NEXTAUTH_URL=https://eduvibe.vip
```

## Setup Instructions

### 1. Resend Setup
1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add the API key to your environment variables
4. Verify your domain for sending emails

### 2. Database Migration
The database schema has been updated with new tables:
- `GuardianRelationship` - Links guardians to students
- `EmailPreference` - User email preferences
- `ProgressReport` - Student progress tracking
- `EmailTemplate` - Email templates
- `EmailLog` - Email delivery logs

### 3. Seed Data
Run the seed script to create demo data:
```bash
npx prisma db seed
```

This creates:
- Demo guardian and student users
- Sample guardian-student relationships
- Default email templates

## Usage

### Admin Panel
1. Navigate to `/admin` and go to the "Guardians" tab
2. Click "Manage Guardian Relationships"
3. Create relationships between guardians and students
4. Approve relationships to enable email communication

### Manual Email Sending
Send progress emails manually via API:
```bash
POST /api/admin/emails/progress
{
  "studentId": "student_id_here"
}
```

### Automated Emails
Set up a cron job to call the weekly email endpoint:
```bash
# Weekly on Sunday at 9 AM
0 9 * * 0 curl -X POST https://eduvibe.vip/api/cron/weekly-emails \
  -H "Authorization: Bearer your_cron_secret_here"
```

## Email Templates

The system includes a default weekly progress template with these variables:
- `{{guardianName}}` - Guardian's name
- `{{studentName}}` - Student's name
- `{{sessionsCount}}` - Number of sessions completed
- `{{questionsAsked}}` - Number of questions asked
- `{{timeSpent}}` - Time spent learning (formatted)
- `{{topicsCovered}}` - Topics covered this week
- `{{reportDate}}` - Report date
- `{{unsubscribeUrl}}` - Unsubscribe link

## Unsubscribe System

Guardians can unsubscribe via:
1. Link in email footer
2. Direct URL: `/unsubscribe?email=guardian@example.com`
3. Success page at `/unsubscribe-success`

## Testing

### Test Email Sending
1. Create guardian-student relationships in admin panel
2. Use the manual email endpoint to send test emails
3. Check email logs in the database

### Test Cron Job
```bash
curl -X POST http://localhost:3006/api/cron/weekly-emails \
  -H "Authorization: Bearer your_cron_secret_here"
```

## Demo Users

The seed script creates these demo users:
- **Guardian Grace**: guardian@example.com / guard123
- **Student Sam**: student@example.com / study123
- **Guardian George**: guardian2@example.com / guard123
- **Student Sarah**: student2@example.com / study123

## Next Steps

1. **Production Setup**: Configure Resend with your domain
2. **Cron Job**: Set up automated weekly email sending
3. **Monitoring**: Monitor email delivery rates and logs
4. **Customization**: Customize email templates as needed
5. **Analytics**: Add progress tracking to student activities

## Troubleshooting

### Common Issues
1. **Emails not sending**: Check Resend API key and domain verification
2. **Cron job failing**: Verify CRON_SECRET environment variable
3. **Template errors**: Check template variable syntax
4. **Database errors**: Ensure all migrations are applied

### Logs
- Email logs are stored in the `EmailLog` table
- Check application logs for detailed error messages
- Monitor Resend dashboard for delivery status
