# Database Connection & Migration Guide

## 🚀 Quick Setup

### 1. **Create Neon Database**

1. **Sign Up for Neon**
   - Go to [neon.tech](https://neon.tech)
   - Sign up for free account
   - Create a new project

2. **Get Connection String**
   - In Neon dashboard, click "Connection Details"
   - Copy the connection string
   - Format: `postgresql://username:password@host/database?sslmode=require`

---

### 2. **Run Database Schema**

1. **In Neon Console**
   - Go to SQL Editor
   - Copy contents of `schema.sql`
   - Paste and click "Run"
   - Verify all tables created

2. **Verify Tables**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

Expected tables:
- clients
- users
- appointments
- invoices
- document_templates
- assigned_documents
- audit_log
- payment_methods
- payment_transactions

---

### 3. **Add to Vercel**

1. **Go to Vercel Dashboard**
   - Select your project
   - Go to Settings → Environment Variables

2. **Add Environment Variable**
   - Name: `DATABASE_URL`
   - Value: Your Neon connection string
   - Click "Save"

3. **Redeploy**
   - Go to Deployments
   - Click "Redeploy"
   - Wait for deployment to complete

---

## 📦 Migrating Data from localStorage

### Option 1: Automatic Migration (Recommended)

The system will automatically detect localStorage data and offer to migrate:

1. **Open your app**
2. **Login as admin**
3. **Look for migration prompt**
4. **Click "Migrate to Database"**
5. **Wait for completion**

### Option 2: Manual Migration via API

Use the migration API endpoint:

```bash
# Migrate clients
curl -X POST https://your-app.vercel.app/api/migrate-data \
  -H "Content-Type: application/json" \
  -d '{
    "dataType": "clients",
    "data": [/* your clients array */]
  }'

# Migrate appointments
curl -X POST https://your-app.vercel.app/api/migrate-data \
  -H "Content-Type: application/json" \
  -d '{
    "dataType": "appointments",
    "data": [/* your appointments array */]
  }'

# Migrate invoices
curl -X POST https://your-app.vercel.app/api/migrate-data \
  -H "Content-Type: application/json" \
  -d '{
    "dataType": "invoices",
    "data": [/* your invoices array */]
  }'

# Migrate documents
curl -X POST https://your-app.vercel.app/api/migrate-data \
  -H "Content-Type: application/json" \
  -d '{
    "dataType": "assigned_docs",
    "data": [/* your documents array */]
  }'
```

### Option 3: Export/Import via Browser Console

1. **Export from localStorage:**
   ```javascript
   // In browser console
   const exportData = {
     clients: JSON.parse(localStorage.getItem('clinicalspeak_clients') || '[]'),
     appointments: JSON.parse(localStorage.getItem('clinicalspeak_appointments') || '[]'),
     invoices: JSON.parse(localStorage.getItem('clinicalspeak_invoices') || '[]'),
     assignedDocs: JSON.parse(localStorage.getItem('clinicalspeak_assignedDocs') || '[]')
   };
   
   console.log(JSON.stringify(exportData, null, 2));
   // Copy the output
   ```

2. **Import to Database:**
   - Use the migration API with the exported data

---

## 🔄 Data Sync

### Automatic Sync
The system automatically syncs data between localStorage and database:

- **Read:** Checks database first, falls back to localStorage
- **Write:** Writes to both database and localStorage
- **Update:** Updates both sources
- **Delete:** Deletes from both sources

### Manual Sync
Force sync all data:

```javascript
// In browser console
syncAllData();
```

---

## 📊 Database Structure

### Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `clients` | Client information | id, name, email, phone, stripe_customer_id |
| `users` | Clinician accounts | id, username, password_hash, role |
| `appointments` | Scheduled sessions | id, client_id, date, time, status |
| `invoices` | Billing records | id, client_id, invoice_number, total_amount, status |
| `assigned_documents` | Document assignments | id, client_id, template_id, auth_code, status |
| `document_templates` | Form templates | id, template_id, name, fields |
| `audit_log` | HIPAA audit trail | id, user_id, action, timestamp |
| `payment_methods` | Saved payment methods | id, client_id, stripe_payment_method_id |
| `payment_transactions` | Payment history | id, invoice_id, amount, status, type |

---

## 🔐 Security

### Connection Security
- ✅ SSL/TLS required (sslmode=require)
- ✅ Encrypted connection string
- ✅ Environment variable storage
- ✅ No credentials in code

### Data Security
- ✅ Encrypted at rest (Neon provides)
- ✅ Encrypted in transit (SSL)
- ✅ Access controls
- ✅ Audit logging

### Best Practices
- ✅ Never commit DATABASE_URL to git
- ✅ Use environment variables
- ✅ Rotate credentials regularly
- ✅ Monitor access logs
- ✅ Set up automated backups

---

## 💾 Backup & Recovery

### Automated Backups (Neon)
Neon provides automatic backups:
- **Free Tier:** 7-day retention
- **Paid Tier:** 30-day retention
- **Point-in-time recovery:** Available

### Manual Backup
```sql
-- Backup all tables
pg_dump "your-connection-string" > backup.sql

-- Restore from backup
psql "your-connection-string" < backup.sql
```

### Data Export
```javascript
// Export all data
const exportData = {
  clients: await fetch('/api/clients').then(r => r.json()),
  appointments: await fetch('/api/appointments').then(r => r.json()),
  invoices: await fetch('/api/invoices').then(r => r.json()),
  documents: await fetch('/api/assigned-docs').then(r => r.json())
};

console.log(JSON.stringify(exportData, null, 2));
```

---

## 🧪 Testing

### Test Connection
```javascript
// In browser console
fetch('/api/health')
  .then(r => r.json())
  .then(data => console.log('Database status:', data));
```

### Test CRUD Operations
```javascript
// Create
const newClient = {
  name: 'Test Client',
  email: 'test@example.com',
  phone: '555-1234'
};

// Read
const clients = await fetch('/api/clients').then(r => r.json());

// Update
const updated = await fetch('/api/clients', {
  method: 'PUT',
  body: JSON.stringify({ id: 1, name: 'Updated Name' })
});

// Delete
await fetch('/api/clients?id=1', { method: 'DELETE' });
```

---

## 🐛 Troubleshooting

### Connection Issues

**Problem:** "Unable to connect to database"

**Solutions:**
1. Verify `DATABASE_URL` is set in Vercel
2. Check connection string format
3. Ensure Neon database is running
4. Verify SSL mode is enabled
5. Check network connectivity

### Missing Tables

**Problem:** "Relation does not exist"

**Solutions:**
1. Run `schema.sql` in Neon console
2. Verify all tables were created
3. Check for SQL errors in Neon logs
4. Re-run schema if needed

### Migration Issues

**Problem:** Data not migrating

**Solutions:**
1. Check localStorage has data
2. Verify API endpoint is accessible
3. Check Vercel function logs
4. Verify database connection
5. Check for duplicate IDs

### Performance Issues

**Problem:** Slow queries

**Solutions:**
1. Check indexes are created
2. Review query patterns
3. Optimize complex queries
4. Consider query caching
5. Monitor Neon dashboard

---

## 📈 Monitoring

### Neon Dashboard
- Connection count
- Query performance
- Storage usage
- Backup status

### Vercel Logs
- Function execution
- Error rates
- Response times
- API calls

---

## 🚀 Going Live

### Production Checklist

- [ ] Neon database created
- [ ] Schema executed successfully
- [ ] DATABASE_URL added to Vercel
- [ ] Admin user created
- [ ] Test data migrated
- [ ] Connection tested
- [ ] Backup schedule configured
- [ ] Monitoring enabled
- [ ] Security audit completed
- [ ] HIPAA compliance verified
- [ ] BAA signed with Neon

---

## 💰 Costs

### Neon Pricing
- **Free Tier:** 0.5 GB storage, shared compute
- **Launch:** $19/month - 10 GB storage
- **Scale:** $69/month - 50 GB storage

### Estimated Costs
- **Small Practice (100 clients):** Free tier sufficient
- **Medium Practice (500 clients):** ~$19/month
- **Large Practice (1000+ clients):** ~$69/month

---

## 📞 Support

### Neon
- **Docs:** https://neon.tech/docs
- **Support:** https://neon.tech/support
- **Status:** https://status.neon.tech

### Vercel
- **Docs:** https://vercel.com/docs
- **Support:** https://vercel.com/support

---

## 🔄 Migration Timeline

### Recommended Approach

**Week 1: Setup**
- Create Neon database
- Run schema
- Add to Vercel
- Test connection

**Week 2: Migration**
- Export localStorage data
- Migrate to database
- Verify data integrity
- Test all operations

**Week 3: Production**
- Switch to database-only mode
- Remove localStorage fallback
- Monitor performance
- Optimize queries

---

**Last Updated:** October 17, 2024  
**Status:** ✅ Ready for Production

