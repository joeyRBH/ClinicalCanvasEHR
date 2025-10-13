# 🗄️ Database Setup Guide

## Quick Start with Neon PostgreSQL

### 1️⃣ Create Neon Database

1. Go to [neon.tech](https://neon.tech)
2. Sign up for free account
3. Create a new project
4. Copy your connection string

### 2️⃣ Set Environment Variable

Create a `.env` file in your project root:

```bash
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```

Or in Vercel:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `DATABASE_URL` with your Neon connection string

### 3️⃣ Run Database Schema

Execute the `schema.sql` file in your Neon database:

**Option A: Using Neon Console**
1. Log into [console.neon.tech](https://console.neon.tech)
2. Select your project
3. Go to "SQL Editor"
4. Copy and paste contents of `schema.sql`
5. Click "Run"

**Option B: Using psql**
```bash
psql "your-neon-connection-string" -f schema.sql
```

### 4️⃣ Create Admin User

Run the setup-admin API endpoint once:
```bash
curl -X POST https://your-app.vercel.app/api/setup-admin
```

Or visit in browser:
```
https://your-app.vercel.app/api/setup-admin
```

This creates the default admin user:
- Username: `admin`
- Password: `admin123`

**⚠️ Change this password in production!**

---

## Database Tables

### Core Tables

**clients** - Client/patient information
- id, name, email, phone, dob, notes
- Timestamps: created_at, updated_at

**users** - Clinician accounts
- id, username, password_hash, name, email, role
- Timestamps: created_at

**appointments** - Scheduled appointments
- id, client_id, appointment_date, appointment_time
- duration, type, cpt_code, notes, status
- Timestamps: created_at, updated_at

**invoices** - Billing and invoices
- id, client_id, invoice_number, due_date
- services (JSON), total_amount, status, payment_date
- Timestamps: created_at, updated_at

**document_templates** - Form templates
- id, template_id, name, fields (JSON)
- Timestamps: created_at

**assigned_documents** - Documents assigned to clients
- id, client_id, template_id, auth_code
- status, responses (JSON), signatures
- Timestamps: assigned_at, completed_at

**audit_log** - HIPAA audit trail
- id, user_id, user_name, action, details (JSON)
- ip_address, timestamp

---

## Vercel Deployment

### Environment Variables

Add these to Vercel:

1. `DATABASE_URL` - Your Neon connection string

### Deploy

```bash
# Commit and push
git add .
git commit -m "Add calendar integration and database"
git push

# Vercel auto-deploys!
```

---

## Testing

### Verify Database Connection

After deployment, test the API:

1. **Login**: `POST /api/login`
2. **Get Clients**: `GET /api/clients`
3. **Get Appointments**: `GET /api/appointments`
4. **Get Invoices**: `GET /api/invoices`

### Sample Data

You can add sample data directly in Neon SQL Editor:

```sql
-- Add a test client
INSERT INTO clients (name, email, phone, dob)
VALUES ('John Doe', 'john@example.com', '555-1234', '1990-01-15');

-- Add a test appointment
INSERT INTO appointments (client_id, appointment_date, appointment_time, type, cpt_code, duration)
VALUES (1, '2024-10-20', '14:00', 'Psychotherapy 60 min (90837)', '90837', 60);
```

---

## Troubleshooting

### Connection Issues

**Error: "unable to connect to database"**
- Verify DATABASE_URL is set in Vercel
- Check Neon database is running
- Ensure SSL mode is enabled

### Missing Tables

**Error: "relation does not exist"**
- Run `schema.sql` in Neon console
- Verify all tables were created
- Check for SQL errors in Neon logs

### API Errors

**Error: "Method not allowed"**
- Check Vercel function logs
- Verify CORS headers are set
- Test API endpoints individually

---

## Production Checklist

- [ ] Database encrypted at rest (Neon provides this)
- [ ] SSL/TLS connections (Neon enforces this)
- [ ] Environment variables set in Vercel
- [ ] Admin password changed from default
- [ ] Backup schedule configured
- [ ] Audit logging enabled
- [ ] HIPAA compliance review completed
- [ ] BAA signed with Neon (required for PHI)

---

## Need Help?

- 📚 [Neon Documentation](https://neon.tech/docs)
- 🚀 [Vercel Documentation](https://vercel.com/docs)
- 🔒 [HIPAA Compliance Guide](https://www.hhs.gov/hipaa)

---

**Your database is ready! 🎉**

