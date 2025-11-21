# HB Studio Email Templates

This directory contains professional email templates for HB Studio's automated email responses.

## Templates

### 1. `studio-contact-acknowledgment.html`
**Purpose:** Sent automatically when a user submits the Contact Us form.

**Variables:**
- `{{name}}` - User's full name
- `{{service}}` - Service they're interested in
- `{{phone}}` - User's phone number
- `{{date}}` - Submission date/time

### 2. `studio-booking-acknowledgment.html`
**Purpose:** Sent automatically when a user submits a booking request.

**Variables:**
- `{{name}}` - User's full name
- `{{eventType}}` - Type of event (wedding, corporate, etc.)
- `{{package}}` - Selected package
- `{{eventDate}}` - Event date
- `{{eventLocation}}` - Event location
- `{{guestCount}}` - Expected number of guests (optional)
- `{{phone}}` - User's phone number
- `{{specialRequests}}` - Special requests (optional)
- `{{date}}` - Submission date/time

### 3. `studio-response-template.html`
**Purpose:** General template for custom responses from the HB Studio team.

**Variables:**
- `{{name}}` - Recipient's name
- `{{subject}}` - Email subject
- `{{message}}` - Main message content (HTML supported)
- `{{callToAction}}` - CTA button text (optional)
- `{{callToActionUrl}}` - CTA button URL (optional)

## Backend Integration

These templates should be used by your backend API (`https://hblab-be.onrender.com/contact`) to send automated acknowledgment emails.

### Recommended Implementation:

1. **When a contact form is submitted:**
   - Send notification email to `info@hblab.rw` with form details
   - Send acknowledgment email to user using `studio-contact-acknowledgment.html`

2. **When a booking is submitted:**
   - Send notification email to `info@hblab.rw` with booking details
   - Send acknowledgment email to user using `studio-booking-acknowledgment.html`

3. **For custom responses:**
   - Use `studio-response-template.html` for personalized follow-ups

## Template Variables

All templates support the following global variables:
- `{{year}}` - Current year (for copyright)

## Styling

Templates use:
- HB Studio brand colors: `#16562e`, `#166c44`, `#f6c343`
- Responsive design for mobile and desktop
- Professional typography
- Inline CSS for maximum email client compatibility

## Testing

Before deploying, test templates with:
- Gmail
- Outlook
- Apple Mail
- Mobile email clients

## Notes

- Templates use inline CSS for maximum compatibility
- All images should be hosted externally or embedded as base64
- Test with various email clients before production use
- Consider using an email service like SendGrid, Mailgun, or AWS SES for reliable delivery

