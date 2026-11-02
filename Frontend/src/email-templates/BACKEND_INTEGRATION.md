# Backend Integration Guide for HB Studio Email System

## Overview

The HB Studio contact and booking forms are now configured to send structured data to your backend API. This guide explains what data is sent and how to implement email responses.

## API Endpoint

**URL:** `https://hblab-be.onrender.com/contact`  
**Method:** `POST`  
**Content-Type:** `application/json`

## Data Structures

### Contact Form Submission

When a user submits the Contact Us form, the following data is sent:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+250 788 123 456",
  "service": "videography",
  "message": "I'm interested in your videography services...",
  "source": "studio-contact",
  "subject": "HB Studio Contact: videography"
}
```

### Booking Form Submission

When a user submits a Booking form, the following data is sent:

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+250 788 123 456",
  "eventType": "wedding",
  "package": "premium",
  "eventDate": "2024-12-15",
  "eventLocation": "Kigali, Rwanda",
  "guestCount": "150",
  "specialRequests": "Need drone footage",
  "type": "booking",
  "source": "studio-booking",
  "subject": "HB Studio Booking: wedding - premium"
}
```

## Recommended Backend Flow

### 1. Receive Form Submission

```javascript
// Example Node.js/Express handler
app.post('/contact', async (req, res) => {
  const formData = req.body;
  const { source, type } = formData;
  
  try {
    // 1. Save to database
    await saveContactSubmission(formData);
    
    // 2. Send notification email to HB Studio team
    await sendNotificationEmail(formData);
    
    // 3. Send acknowledgment email to user
    if (source === 'studio-contact') {
      await sendContactAcknowledgment(formData);
    } else if (source === 'studio-booking' || type === 'booking') {
      await sendBookingAcknowledgment(formData);
    }
    
    res.json({ success: true, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error processing form:', error);
    res.status(500).json({ success: false, message: 'Failed to process submission' });
  }
});
```

### 2. Send Notification Email to Team

Send an email to `info@hblab.rw` with the form submission details:

**Subject:** `New {{source}} Submission: {{name}}`

**Body should include:**
- All form fields
- Submission timestamp
- Source (studio-contact or studio-booking)

### 3. Send Acknowledgment Email to User

Use the email templates in `/src/email-templates/`:

#### For Contact Form:
- Template: `studio-contact-acknowledgment.html`
- Variables to replace:
  - `{{name}}` → formData.name
  - `{{service}}` → formData.service
  - `{{phone}}` → formData.phone
  - `{{date}}` → formatted submission date
  - `{{year}}` → current year

#### For Booking Form:
- Template: `studio-booking-acknowledgment.html`
- Variables to replace:
  - `{{name}}` → formData.name
  - `{{eventType}}` → formData.eventType
  - `{{package}}` → formData.package
  - `{{eventDate}}` → formatted formData.eventDate
  - `{{eventLocation}}` → formData.eventLocation
  - `{{guestCount}}` → formData.guestCount (if provided)
  - `{{phone}}` → formData.phone
  - `{{specialRequests}}` → formData.specialRequests (if provided)
  - `{{date}}` → formatted submission date
  - `{{year}}` → current year

## Email Service Setup

### Recommended Services:
1. **SendGrid** - Reliable, good free tier
2. **Mailgun** - Developer-friendly
3. **AWS SES** - Cost-effective for high volume
4. **Nodemailer** - For SMTP (Gmail, Outlook, etc.)

### Example with Nodemailer (Node.js):

```javascript
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Configure transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Function to send contact acknowledgment
async function sendContactAcknowledgment(formData) {
  // Read template
  let template = fs.readFileSync(
    path.join(__dirname, '../email-templates/studio-contact-acknowledgment.html'),
    'utf8'
  );
  
  // Replace variables
  template = template.replace(/\{\{name\}\}/g, formData.name);
  template = template.replace(/\{\{service\}\}/g, formData.service || 'General Inquiry');
  template = template.replace(/\{\{phone\}\}/g, formData.phone);
  template = template.replace(/\{\{date\}\}/g, new Date().toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short'
  }));
  template = template.replace(/\{\{year\}\}/g, new Date().getFullYear());
  
  // Send email
  await transporter.sendMail({
    from: '"HB Studio" <info@hblab.rw>',
    to: formData.email,
    subject: 'Thank You for Contacting HB Studio',
    html: template
  });
}

// Function to send booking acknowledgment
async function sendBookingAcknowledgment(formData) {
  // Read template
  let template = fs.readFileSync(
    path.join(__dirname, '../email-templates/studio-booking-acknowledgment.html'),
    'utf8'
  );
  
  // Replace variables
  template = template.replace(/\{\{name\}\}/g, formData.name);
  template = template.replace(/\{\{eventType\}\}/g, formData.eventType || 'Event');
  template = template.replace(/\{\{package\}\}/g, formData.package || 'Custom Package');
  template = template.replace(/\{\{eventDate\}\}/g, formatDate(formData.eventDate));
  template = template.replace(/\{\{eventLocation\}\}/g, formData.eventLocation);
  template = template.replace(/\{\{guestCount\}\}/g, formData.guestCount || 'Not specified');
  template = template.replace(/\{\{phone\}\}/g, formData.phone);
  template = template.replace(/\{\{specialRequests\}\}/g, formData.specialRequests || '');
  template = template.replace(/\{\{date\}\}/g, new Date().toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short'
  }));
  template = template.replace(/\{\{year\}\}/g, new Date().getFullYear());
  
  // Handle conditional special requests
  if (!formData.specialRequests) {
    template = template.replace(/{{#if specialRequests}}[\s\S]*?{{\/if}}/g, '');
  } else {
    template = template.replace(/\{\{#if specialRequests\}\}/g, '');
    template = template.replace(/\{\{\/if\}\}/g, '');
  }
  
  // Send email
  await transporter.sendMail({
    from: '"HB Studio" <info@hblab.rw>',
    to: formData.email,
    subject: 'Booking Request Received - HB Studio',
    html: template
  });
}
```

## Testing

Before going live, test:

1. ✅ Contact form submission
2. ✅ Booking form submission
3. ✅ Email delivery to user
4. ✅ Email delivery to team
5. ✅ Email rendering in different clients (Gmail, Outlook, etc.)
6. ✅ Mobile email client rendering

## Security Considerations

1. **Validate all inputs** before processing
2. **Sanitize email content** to prevent XSS
3. **Rate limit** form submissions to prevent spam
4. **Use HTTPS** for all API calls
5. **Validate email addresses** before sending
6. **Implement CAPTCHA** if spam becomes an issue

## Environment Variables

Recommended environment variables for your backend:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@hblab.rw
SMTP_PASS=your-app-password
STUDIO_EMAIL=info@hblab.rw
```

## Support

For questions or issues with email integration, refer to the email template README.md for template-specific documentation.

