# ClinicalSpeak EHR API Documentation

**Version:** 1.0.0  
**Base URL:** `https://your-domain.vercel.app/api`  
**Authentication:** Bearer Token (JWT)

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Error Handling](#error-handling)
4. [Endpoints](#endpoints)
   - [Health Check](#health-check)
   - [Authentication](#authentication-endpoints)
   - [Clients](#clients)
   - [Appointments](#appointments)
   - [Invoices](#invoices)
   - [Analytics](#analytics)
5. [Security](#security)
6. [Audit Logging](#audit-logging)

---

## 🔐 Authentication

All API endpoints (except `/api/login` and `/api/health`) require authentication using JWT Bearer tokens.

### Request Headers

```http
Authorization: Bearer <your_access_token>
Content-Type: application/json
```

### Token Expiration

- **Access Token:** 1 hour
- **Refresh Token:** 7 days

Use the `/api/refresh-token` endpoint to get a new access token when it expires.

---

## ⏱️ Rate Limiting

Rate limits are enforced to prevent abuse:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| PHI Access (Clients) | 30 requests | 1 minute |
| General API | 100 requests | 15 minutes |
| Read Operations | 300 requests | 15 minutes |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
Retry-After: 900 (seconds, when limit exceeded)
```

---

## ❌ Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "timestamp": "2025-10-14T12:00:00.000Z",
    "details": ["Additional error details"]
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `AUTHENTICATION_ERROR` | 401 | Authentication required or failed |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT_ERROR` | 409 | Resource already exists |
| `RATE_LIMIT_ERROR` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 📡 Endpoints

### Health Check

#### `GET /api/health`

Check system health and status.

**Parameters:**
- `detailed` (query, optional): Set to `"true"` for detailed health information

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-14T12:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

**Detailed Response (requires auth):**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-14T12:00:00.000Z",
  "responseTime": "25ms",
  "system": {
    "uptime": 3600,
    "environment": "production",
    "nodeVersion": "v20.0.0",
    "platform": "linux",
    "memory": {
      "rss": "50MB",
      "heapUsed": "30MB",
      "heapTotal": "45MB"
    }
  },
  "database": {
    "status": "connected",
    "healthy": true,
    "stats": {
      "users": 5,
      "clients": 150,
      "appointments": 342,
      "invoices": 210,
      "documents": 89,
      "auditLogs": 1250
    }
  }
}
```

---

### Authentication Endpoints

#### `POST /api/login`

Authenticate and receive access and refresh tokens.

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "username": "admin",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "username": "admin",
      "name": "Dr. Smith",
      "email": "admin@example.com"
    }
  },
  "timestamp": "2025-10-14T12:00:00.000Z"
}
```

#### `POST /api/refresh-token`

Refresh an expired access token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

---

### Clients

#### `GET /api/clients`

Get all clients or a specific client.

**Parameters:**
- `id` (query, optional): Client ID for single client lookup

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-0123",
      "dob": "1990-01-15",
      "notes": "Initial intake completed",
      "active": true,
      "created_at": "2025-01-01T10:00:00.000Z",
      "updated_at": "2025-01-01T10:00:00.000Z"
    }
  ],
  "timestamp": "2025-10-14T12:00:00.000Z"
}
```

#### `POST /api/clients`

Create a new client.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "555-0124",
  "dob": "1985-06-20",
  "notes": "Referred by Dr. Johnson"
}
```

**Validation Rules:**
- `name` (required): 2-255 characters
- `email` (optional): Valid email format
- `phone` (optional): Valid phone number
- `dob` (optional): Valid date (YYYY-MM-DD)
- `notes` (optional): Up to 10,000 characters

**Response:**
```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "555-0124",
    "dob": "1985-06-20",
    "notes": "Referred by Dr. Johnson",
    "active": true,
    "created_at": "2025-10-14T12:00:00.000Z",
    "updated_at": "2025-10-14T12:00:00.000Z"
  },
  "timestamp": "2025-10-14T12:00:00.000Z"
}
```

#### `PUT /api/clients`

Update an existing client.

**Request Body:**
```json
{
  "id": 2,
  "name": "Jane Smith-Doe",
  "email": "jane.doe@example.com",
  "phone": "555-0125",
  "dob": "1985-06-20",
  "notes": "Updated contact information"
}
```

**Response:** Same as POST response

#### `DELETE /api/clients`

Soft delete a client (sets active = false).

**Request Body:**
```json
{
  "id": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Client deleted successfully",
  "data": {
    "id": 2
  },
  "timestamp": "2025-10-14T12:00:00.000Z"
}
```

---

### Appointments

#### `GET /api/appointments`

Get appointments with optional filtering.

**Parameters:**
- `month` (query, optional): Month number (1-12)
- `year` (query, optional): Year (e.g., 2025)
- `client_id` (query, optional): Filter by client ID

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "client_id": 1,
      "client_name": "John Doe",
      "client_phone": "555-0123",
      "client_email": "john@example.com",
      "appointment_date": "2025-10-20",
      "appointment_time": "14:00:00",
      "duration": 60,
      "type": "Psychotherapy",
      "cpt_code": "90834",
      "notes": "Follow-up session",
      "status": "scheduled",
      "created_by": "admin",
      "created_at": "2025-10-14T12:00:00.000Z",
      "updated_at": "2025-10-14T12:00:00.000Z"
    }
  ],
  "timestamp": "2025-10-14T12:00:00.000Z"
}
```

#### `POST /api/appointments`

Create a new appointment.

**Request Body:**
```json
{
  "client_id": 1,
  "appointment_date": "2025-10-20",
  "appointment_time": "14:00",
  "duration": 60,
  "type": "Psychotherapy - 45min",
  "cpt_code": "90834",
  "notes": "Follow-up session"
}
```

**Validation Rules:**
- `client_id` (required): Valid client ID
- `appointment_date` (required): Future date in YYYY-MM-DD format
- `appointment_time` (required): Time in HH:MM format
- `duration` (optional): 15-480 minutes, default 60
- `type` (required): Min 3 characters
- `cpt_code` (optional): CPT code
- `notes` (optional): Up to 10,000 characters

#### `PUT /api/appointments`

Update an existing appointment.

#### `DELETE /api/appointments`

Delete an appointment.

---

### Invoices

#### `GET /api/invoices`

Get invoices with optional filtering.

**Parameters:**
- `client_id` (query, optional): Filter by client ID
- `status` (query, optional): Filter by status (pending, paid, overdue)

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "client_id": 1,
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "client_phone": "555-0123",
      "invoice_number": "INV-1697123456-ABC12",
      "services": [
        {
          "description": "Psychotherapy - 45min",
          "cpt_code": "90834",
          "amount": 150.00
        }
      ],
      "total_amount": 150.00,
      "due_date": "2025-11-01",
      "payment_date": null,
      "payment_method": null,
      "status": "pending",
      "notes": "",
      "created_by": "admin",
      "created_at": "2025-10-14T12:00:00.000Z",
      "updated_at": "2025-10-14T12:00:00.000Z"
    }
  ],
  "timestamp": "2025-10-14T12:00:00.000Z"
}
```

#### `POST /api/invoices`

Create a new invoice.

**Request Body:**
```json
{
  "client_id": 1,
  "services": [
    {
      "description": "Psychotherapy - 45min",
      "cpt_code": "90834",
      "amount": 150.00
    }
  ],
  "total_amount": 150.00,
  "due_date": "2025-11-01",
  "notes": "Payment due within 30 days"
}
```

#### `PUT /api/invoices`

Update invoice status and payment information.

**Request Body:**
```json
{
  "id": 1,
  "status": "paid",
  "payment_date": "2025-10-15",
  "payment_method": "Credit Card",
  "notes": "Paid in full"
}
```

---

### Analytics

#### `GET /api/analytics`

Get practice analytics and statistics.

**Parameters:**
- `timeframe` (query, optional): Number of days to analyze (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_clients": 150,
      "new_clients": 12,
      "total_appointments": 342,
      "completed_appointments": 298,
      "upcoming_appointments": 44,
      "total_documents": 89,
      "pending_documents": 7,
      "completed_documents": 82,
      "total_revenue": 42500.00,
      "pending_revenue": 3200.00
    },
    "trends": {
      "monthly_appointments": [...],
      "popular_appointment_types": [...],
      "top_clients": [...]
    },
    "timeframe": 30
  }
}
```

---

## 🔒 Security

### Security Headers

All responses include comprehensive security headers:

- `Strict-Transport-Security`: HTTPS enforcement
- `X-Content-Type-Options`: MIME type sniffing prevention
- `X-Frame-Options`: Clickjacking protection
- `X-XSS-Protection`: XSS filter
- `Content-Security-Policy`: XSS and injection prevention
- `Referrer-Policy`: Referrer information control

### CORS

CORS is configured based on environment:
- **Development:** Allows all origins
- **Production:** Strict whitelist from `ALLOWED_ORIGINS` environment variable

### Input Sanitization

All inputs are automatically:
- Trimmed of whitespace
- Sanitized to prevent XSS
- Validated against schema
- Limited in length (10KB max)

---

## 📊 Audit Logging

All PHI access and modifications are automatically logged for HIPAA compliance.

### Logged Events

- Authentication (login, logout, failures)
- PHI Access (read, create, update, delete)
- Client operations
- Appointment operations
- Document operations
- Invoice operations
- Security violations
- Rate limit exceedances

### Audit Log Format

```json
{
  "id": 1,
  "user_id": 1,
  "username": "admin",
  "event_type": "CLIENT_VIEW",
  "resource": "client",
  "resource_id": "5",
  "action": "GET",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "details": {},
  "success": true,
  "error_message": null,
  "timestamp": "2025-10-14T12:00:00.000Z"
}
```

---

## 🚀 Getting Started

### 1. Obtain Access Token

```bash
curl -X POST https://your-domain.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'
```

### 2. Use Access Token

```bash
curl -X GET https://your-domain.vercel.app/api/clients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Refresh Token When Expired

```bash
curl -X POST https://your-domain.vercel.app/api/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## 📞 Support

For API support or to report issues:
- GitHub Issues: https://github.com/joeyrbh/clinicalspeak/issues
- Email: support@example.com

---

**Last Updated:** October 14, 2025  
**API Version:** 1.0.0

