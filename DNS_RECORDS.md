# DNS Records Setup for SendGrid

This guide explains how to add the SendGrid DNS records to your `clinicalcanvas.app` domain.

## DNS Records Overview

You need to add **5 CNAME records** and **1 TXT record** to enable SendGrid email authentication.

### Records to Add:

| Type  | Host                              | Value                                        | Purpose                    |
|-------|-----------------------------------|----------------------------------------------|----------------------------|
| CNAME | url377.clinicalcanvas.app         | sendgrid.net                                 | Link tracking              |
| CNAME | 56807755.clinicalcanvas.app       | sendgrid.net                                 | Verification               |
| CNAME | em2009.clinicalcanvas.app         | u56807755.wl006.sendgrid.net                 | Email subdomain            |
| CNAME | s1._domainkey.clinicalcanvas.app  | s1.domainkey.u56807755.wl006.sendgrid.net    | DKIM authentication key 1  |
| CNAME | s2._domainkey.clinicalcanvas.app  | s2.domainkey.u56807755.wl006.sendgrid.net    | DKIM authentication key 2  |
| TXT   | _dmarc.clinicalcanvas.app         | v=DMARC1; p=none;                            | DMARC policy               |

---

## How to Add DNS Records

Choose your DNS provider below:

### Option 1: Vercel DNS

If your domain is managed by Vercel:

1. **Go to:** [Vercel Dashboard](https://vercel.com/dashboard)
2. **Navigate to:** Domains → `clinicalcanvas.app`
3. **Scroll to:** DNS Records section
4. **Add each record:**

**For CNAME Records:**
- Click "Add Record"
- Type: `CNAME`
- Name: Enter the subdomain part only (e.g., `url377`, `em2009`, `s1._domainkey`)
- Value: Enter the value from the table above
- Click "Save"

**For TXT Record:**
- Click "Add Record"
- Type: `TXT`
- Name: `_dmarc`
- Value: `v=DMARC1; p=none;`
- Click "Save"

**Note:** Some DNS providers may require you to enter the full host name (including `.clinicalcanvas.app`) or use `@` for the root domain. Vercel typically requires just the subdomain prefix.

---

### Option 2: Namecheap

If your domain is registered with Namecheap:

1. **Log in to:** [Namecheap Dashboard](https://www.namecheap.com)
2. **Go to:** Domain List → Click "Manage" next to `clinicalcanvas.app`
3. **Navigate to:** Advanced DNS tab
4. **Add each record:**

**For CNAME Records:**
- Click "Add New Record"
- Type: `CNAME Record`
- Host: Enter subdomain (e.g., `url377`, `em2009`, `s1._domainkey`)
- Value: Enter the value from the table above
- TTL: Automatic (or 3600)
- Click the checkmark to save

**For TXT Record:**
- Click "Add New Record"
- Type: `TXT Record`
- Host: `_dmarc`
- Value: `v=DMARC1; p=none;`
- TTL: Automatic (or 3600)
- Click the checkmark to save

---

### Option 3: GoDaddy

If your domain is registered with GoDaddy:

1. **Log in to:** [GoDaddy Dashboard](https://www.godaddy.com)
2. **Go to:** My Products → Domains → Click on `clinicalcanvas.app`
3. **Scroll down to:** DNS Management → Click "Manage DNS"
4. **Add each record:**

**For CNAME Records:**
- Click "Add" under DNS Records
- Type: `CNAME`
- Name: Enter subdomain (e.g., `url377`, `em2009`, `s1._domainkey`)
- Value: Enter the value from the table above
- TTL: 1 Hour (or default)
- Click "Save"

**For TXT Record:**
- Click "Add" under DNS Records
- Type: `TXT`
- Name: `_dmarc`
- Value: `v=DMARC1; p=none;`
- TTL: 1 Hour (or default)
- Click "Save"

---

### Option 4: Cloudflare

If your domain is managed by Cloudflare:

1. **Log in to:** [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Select:** `clinicalcanvas.app` domain
3. **Go to:** DNS → Records
4. **Add each record:**

**For CNAME Records:**
- Click "Add record"
- Type: `CNAME`
- Name: Enter subdomain (e.g., `url377`, `em2009`, `s1._domainkey`)
- Target: Enter the value from the table above
- Proxy status: DNS only (gray cloud) - **IMPORTANT**
- TTL: Auto
- Click "Save"

**For TXT Record:**
- Click "Add record"
- Type: `TXT`
- Name: `_dmarc`
- Content: `v=DMARC1; p=none;`
- TTL: Auto
- Click "Save"

**Important:** Make sure the Proxy status is set to "DNS only" (gray cloud) for CNAME records, not "Proxied" (orange cloud).

---

### Option 5: Route 53 (AWS)

If your domain is managed by AWS Route 53:

1. **Log in to:** [AWS Console](https://console.aws.amazon.com)
2. **Navigate to:** Route 53 → Hosted Zones → `clinicalcanvas.app`
3. **Add each record:**

**For CNAME Records:**
- Click "Create Record"
- Record name: Enter subdomain (e.g., `url377`, `em2009`, `s1._domainkey`)
- Record type: `CNAME`
- Value: Enter the value from the table above
- TTL: 300 (or default)
- Routing policy: Simple routing
- Click "Create records"

**For TXT Record:**
- Click "Create Record"
- Record name: `_dmarc`
- Record type: `TXT`
- Value: `v=DMARC1; p=none;`
- TTL: 300 (or default)
- Routing policy: Simple routing
- Click "Create records"

---

## Verification

### After Adding DNS Records:

1. **Wait:** DNS propagation can take 24-48 hours (usually faster, 15-30 minutes)
2. **Check Status in SendGrid:**
   - Log in to SendGrid
   - Go to: Settings → Sender Authentication
   - Look for your domain
   - Click "Verify" once records are added
3. **Verify DNS Propagation:**
   - Use [DNS Checker](https://dnschecker.org/)
   - Enter one of your CNAME records (e.g., `em2009.clinicalcanvas.app`)
   - Ensure it resolves correctly worldwide

### Common Issues:

**Record Not Found:**
- Wait longer (DNS propagation can take time)
- Double-check the Host and Value fields
- Ensure there are no extra spaces in values

**CNAME Conflicts:**
- Some DNS providers don't allow CNAME records on the root domain
- Make sure you're using subdomains (e.g., `em2009.clinicalcanvas.app`, not `clinicalcanvas.app`)

**Verification Fails:**
- Check that all 6 records are added correctly
- Ensure TTL is set to a reasonable value (300-3600 seconds)
- Contact SendGrid support if issues persist

---

## Quick Reference

Copy-paste ready format for your DNS provider:

### CNAME Records:
```
url377.clinicalcanvas.app → sendgrid.net
56807755.clinicalcanvas.app → sendgrid.net
em2009.clinicalcanvas.app → u56807755.wl006.sendgrid.net
s1._domainkey.clinicalcanvas.app → s1.domainkey.u56807755.wl006.sendgrid.net
s2._domainkey.clinicalcanvas.app → s2.domainkey.u56807755.wl006.sendgrid.net
```

### TXT Record:
```
_dmarc.clinicalcanvas.app → v=DMARC1; p=none;
```

---

## Testing

After DNS records are verified in SendGrid:

1. **Update Environment Variables in Vercel:**
   ```
   SENDGRID_API_KEY=SG.your_api_key_here
   SENDGRID_FROM_EMAIL=noreply@clinicalcanvas.app
   SENDGRID_FROM_NAME=ClinicalCanvas EHR
   ```

2. **Send Test Email:**
   - Use the test endpoint: `/test-sendgrid-email`
   - Check if email arrives successfully
   - Verify sender shows as `noreply@clinicalcanvas.app`

---

## Need Help?

- **SendGrid Docs:** https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication
- **DNS Propagation Checker:** https://dnschecker.org/
- **SendGrid Support:** https://support.sendgrid.com/

---

**Status:** DNS records ready to be added to your DNS provider!
