# Notification Usage Examples with Practice Branding

This guide shows how to use the updated notification system with practice branding.

## 🎯 Quick Start

### 1. Import the Notification Functions

```javascript
const {
    sendTemplateNotification,
    getPracticeSettings,
    sendEmail,
    sendDualNotification
} = require('./utils/notifications');
```

### 2. Send a Template Notification with Practice Branding

```javascript
// Example: Send payment received notification
async function notifyPaymentReceived(userId, invoiceData, clientContact) {
    // Fetch practice settings for branding
    const practiceSettings = await getPracticeSettings(userId);

    // Send notification using template
    const result = await sendTemplateNotification(
        'paymentReceived',
        { invoice: invoiceData },
        {
            email: clientContact.email,
            phone: clientContact.phone
        },
        practiceSettings
    );

    console.log('Notification sent:', result);
}

// Usage
await notifyPaymentReceived('user123', {
    invoice_number: 'INV-001',
    client_name: 'John Doe',
    total_amount: 150.00
}, {
    email: 'john@example.com',
    phone: '+15551234567'
});
```

## 📧 Available Templates

### 1. Payment Received

```javascript
const practiceSettings = await getPracticeSettings(userId);

await sendTemplateNotification(
    'paymentReceived',
    {
        invoice: {
            invoice_number: 'INV-001',
            client_name: 'John Doe',
            total_amount: 150.00
        }
    },
    {
        email: 'client@example.com',
        phone: '+15551234567'
    },
    practiceSettings
);
```

### 2. Payment Failed

```javascript
await sendTemplateNotification(
    'paymentFailed',
    {
        invoice: {
            invoice_number: 'INV-001',
            client_name: 'John Doe',
            total_amount: 150.00
        },
        error: 'Card declined'
    },
    { email: 'client@example.com' },
    practiceSettings
);
```

### 3. Refund Processed

```javascript
await sendTemplateNotification(
    'refundProcessed',
    {
        invoice: {
            invoice_number: 'INV-001',
            client_name: 'John Doe'
        },
        refundAmount: 50.00
    },
    { email: 'client@example.com' },
    practiceSettings
);
```

### 4. Invoice Created

```javascript
await sendTemplateNotification(
    'invoiceCreated',
    {
        invoice: {
            invoice_number: 'INV-002',
            client_name: 'Jane Smith',
            total_amount: 200.00,
            due_date: '2025-12-01'
        }
    },
    { email: 'jane@example.com', phone: '+15559876543' },
    practiceSettings
);
```

### 5. Autopay Enabled

```javascript
await sendTemplateNotification(
    'autopayEnabled',
    {
        client: {
            name: 'John Doe'
        }
    },
    { email: 'client@example.com' },
    practiceSettings
);
```

### 6. Autopay Failed

```javascript
await sendTemplateNotification(
    'autopayFailed',
    {
        invoice: {
            invoice_number: 'INV-001',
            client_name: 'John Doe'
        },
        error: 'Insufficient funds'
    },
    { email: 'client@example.com' },
    practiceSettings
);
```

### 7. Appointment Reminder

```javascript
await sendTemplateNotification(
    'appointmentReminder',
    {
        appointment: {
            client_name: 'John Doe',
            appointment_date: '2025-11-15',
            appointment_time: '2:00 PM',
            duration: 60,
            type: 'Initial Consultation'
        }
    },
    { email: 'client@example.com', phone: '+15551234567' },
    practiceSettings
);
```

### 8. Document Assigned

```javascript
await sendTemplateNotification(
    'documentAssigned',
    {
        client: {
            name: 'John Doe'
        },
        document: {
            template_name: 'Intake Form',
            auth_code: 'ABC123XYZ'
        }
    },
    { email: 'client@example.com' },
    practiceSettings
);
```

## 🔧 Custom Notifications

### Send Custom Email with Practice Branding

```javascript
const { sendEmail, getPracticeSettings } = require('./utils/notifications');

async function sendCustomNotification(userId, recipientEmail) {
    const practiceSettings = await getPracticeSettings(userId);

    await sendEmail({
        to: recipientEmail,
        subject: 'Custom Notification',
        body: 'Your custom message here...',
        practiceSettings: practiceSettings
    });
}
```

### Send Both Email and SMS

```javascript
const { sendDualNotification, getPracticeSettings } = require('./utils/notifications');

async function sendDualAlert(userId, contact) {
    const practiceSettings = await getPracticeSettings(userId);

    await sendDualNotification({
        email: contact.email,
        phone: contact.phone,
        subject: 'Important Alert',
        body: 'Your important message here...',
        practiceSettings: practiceSettings
    });
}
```

## 🏥 Practice Settings

### What Gets Displayed

When you use practice branding, the following information from your practice settings is included:

**In Email Header:**
- Practice name (large, prominent)

**In Email Footer:**
- Practice phone number
- Practice email
- Practice website

**In From Name:**
- Practice name (e.g., "Smith Family Therapy" instead of "Sessionably")

**Sessionably Attribution:**
- Footer only: "Powered by Sessionably - HIPAA Compliant Messenger"

### Default Behavior

If practice settings are not configured:
- Practice name defaults to "Your Practice"
- Contact info section is hidden if no details are provided
- System still sends notifications normally

## 💡 Best Practices

### 1. Always Fetch Fresh Practice Settings

```javascript
// ✅ Good - Fresh settings
const practiceSettings = await getPracticeSettings(userId);
await sendTemplateNotification('paymentReceived', data, contact, practiceSettings);

// ❌ Avoid - Stale settings
const settings = await getPracticeSettings(userId);
// ... much later in code
await sendTemplateNotification('paymentReceived', data, contact, settings);
```

### 2. Handle Errors Gracefully

```javascript
try {
    const practiceSettings = await getPracticeSettings(userId);
    const result = await sendTemplateNotification(
        'paymentReceived',
        { invoice: invoiceData },
        { email: clientEmail },
        practiceSettings
    );

    if (!result.email.success) {
        console.error('Email failed:', result.email.message);
        // Handle failure (retry, log, alert admin, etc.)
    }
} catch (error) {
    console.error('Notification error:', error);
    // Handle error appropriately
}
```

### 3. Batch Notifications Efficiently

```javascript
async function sendBatchNotifications(userId, clients) {
    // Fetch practice settings once for all notifications
    const practiceSettings = await getPracticeSettings(userId);

    // Send notifications in parallel
    const promises = clients.map(client =>
        sendTemplateNotification(
            'appointmentReminder',
            { appointment: client.appointment },
            { email: client.email, phone: client.phone },
            practiceSettings
        )
    );

    const results = await Promise.all(promises);
    return results;
}
```

### 4. Provide Contact Options

```javascript
// ✅ Good - Provide both email and phone when available
await sendTemplateNotification(
    'invoiceCreated',
    { invoice: data },
    {
        email: client.email,
        phone: client.phone
    },
    practiceSettings
);

// ✅ Also good - Email only if phone not available
await sendTemplateNotification(
    'invoiceCreated',
    { invoice: data },
    { email: client.email },
    practiceSettings
);
```

## 🧪 Testing

### Test with Demo Mode (No SendGrid/Twilio)

```javascript
// Run without SENDGRID_API_KEY or TWILIO credentials set
// Notifications will be logged to console instead of sent

const result = await sendTemplateNotification(
    'paymentReceived',
    { invoice: testData },
    { email: 'test@example.com' },
    { practice_name: 'Test Practice' }
);

// Check console for output:
// 📧 EMAIL (Demo Mode): { to: 'test@example.com', subject: '...', ... }
```

### Test with Real Services

```javascript
// Set environment variables:
// SENDGRID_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

// Send test notification
const result = await sendTemplateNotification(
    'paymentReceived',
    {
        invoice: {
            invoice_number: 'TEST-001',
            client_name: 'Test Client',
            total_amount: 10.00
        }
    },
    {
        email: 'your-email@example.com',
        phone: '+15551234567'
    },
    {
        practice_name: 'Test Practice',
        practice_phone: '555-123-4567',
        practice_email: 'info@testpractice.com',
        practice_website: 'https://testpractice.com'
    }
);

console.log('Email result:', result.email);
console.log('SMS result:', result.sms);
```

## 🔍 Troubleshooting

### Practice Name Not Showing

**Problem:** Emails still show "Sessionably" or "Your Practice"

**Solution:**
1. Ensure practice settings are saved in database
2. Verify `practice_name` field is populated
3. Check that you're passing `practiceSettings` to the notification function

```javascript
// Debug: Log practice settings
const settings = await getPracticeSettings(userId);
console.log('Practice settings:', settings);
```

### Contact Info Not Displaying

**Problem:** Contact information missing from email footer

**Solution:**
Contact info only displays if values are provided. Check that these fields are set:
- `practice_phone`
- `practice_email`
- `practice_website`

### Notifications Not Sending

**Problem:** No emails or SMS received

**Solution:**
1. Check if running in demo mode (look for console logs)
2. Verify environment variables are set in Vercel
3. Check SendGrid/Twilio dashboards for errors
4. Verify recipient email/phone format is correct

---

**Last Updated:** November 2, 2025
**Version:** 2.0.0 (Practice Branding Update)
