# API Documentation

## Authentication

All API endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Login

**POST** `/api/auth/login`

Request:
```json
{
  "email": "josh@norton-plumbing.com.au",
  "password": "demo123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "user-id",
      "email": "josh@norton-plumbing.com.au",
      "name": "Josh Norton",
      "role": "owner"
    }
  }
}
```

## Clients

### List Clients

**GET** `/api/clients?page=1&per_page=20&search=john`

Query Parameters:
- `page` (default: 1)
- `per_page` (default: 20, max: 100)
- `search` - Search by name, email, or phone

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "0412345678",
      "address": "123 Main St",
      "suburb": "Walkerville",
      "postcode": "5081",
      "state": "SA"
    }
  ],
  "total": 42,
  "page": 1,
  "per_page": 20
}
```

### Create Client

**POST** `/api/clients`

**Requires:** `office` or `owner` role

Request:
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "0412345678",
  "address": "123 Main St",
  "suburb": "Walkerville",
  "postcode": "5081",
  "state": "SA",
  "notes": "Regular customer"
}
```

Response:
```json
{
  "success": true,
  "data": { /* client object */ }
}
```

## Quotes

### List Quotes

**GET** `/api/quotes?status=draft&client_id=uuid&page=1&per_page=20`

Query Parameters:
- `status` - draft, ready, sent, accepted, declined, expired
- `client_id` - Filter by client
- `page` (default: 1)
- `per_page` (default: 20)

### Create Quote

**POST** `/api/quotes`

Request:
```json
{
  "client_id": "uuid",
  "quote_date": "2026-08-29",
  "validity_days": 30,
  "scope_description": "Tap replacement and new installation",
  "conditions": "Default terms apply"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "quote-uuid",
    "quote_number": "NP-260829-001",
    "client_id": "client-uuid",
    "quote_date": "2026-08-29",
    "expiry_date": "2026-09-28",
    "status": "draft",
    "quote_ex_gst": "0.00",
    "gst_total": "0.00",
    "client_total": "0.00",
    "lines": []
  }
}
```

### Download Quote PDF

**GET** `/api/quotes/:id/pdf`

Returns a PDF file download. Can be saved or emailed to customer.

## Quote Lines

### Add Line to Quote

**POST** `/api/quote-lines`

Request:
```json
{
  "quote_id": "quote-uuid",
  "type": "labour_plumber",
  "description": "Tap replacement - 2 hours labour",
  "quantity": "2",
  "unit": "hours",
  "unit_cost_ex_gst": "88.00",
  "markup_percent": "50",
  "notes": "Includes supply of chrome tap"
}
```

Line types:
- `labour_plumber` - Plumber labour
- `labour_apprentice` - Apprentice labour
- `material` - Material from catalogue
- `subcontractor` - Subcontractor work
- `equipment` - Equipment hire
- `custom` - Custom line item
- `section` - Section heading

Response:
```json
{
  "success": true,
  "data": {
    "id": "line-uuid",
    "quote_id": "quote-uuid",
    "line_number": 1,
    "type": "labour_plumber",
    "description": "Tap replacement - 2 hours labour",
    "quantity": "2.00",
    "unit": "hours",
    "unit_cost_ex_gst": "88.00",
    "markup_percent": "50.00",
    "line_total_cost": "176.00",
    "selling_price_ex_gst": "264.00",
    "gst": "26.40",
    "selling_price_inc_gst": "290.40",
    "optional": false
  }
}
```

**Note:** Adding a line automatically recalculates all quote totals.

### Update Line

**PUT** `/api/quote-lines/:id`

Same request format as POST. Recalculates totals.

### Delete Line

**DELETE** `/api/quote-lines/:id`

Requires: `office`, `estimator`, or `owner` role.

Recalculates quote totals after deletion.

## Materials

### Search Materials

**GET** `/api/materials?search=tap&category=Valves%20%26%20Brassware&page=1&per_page=20`

Query Parameters:
- `search` - Search by code or description
- `category` - Filter by category (URL encoded)
- `page` (default: 1)
- `per_page` (default: 20, max: 100)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "material-uuid",
      "code": "TAP-001",
      "category": "Valves & Brassware",
      "description": "Brass Ball Tap 15mm",
      "unit": "each",
      "cost_ex_gst": "25.00",
      "default_markup": "35.00",
      "selling_price_ex_gst": "33.75",
      "supplier": "Reece",
      "active": true
    }
  ],
  "total": 42,
  "page": 1,
  "per_page": 20
}
```

### Create/Update Material

**POST** `/api/materials/create`

**Requires:** `office` or `owner` role

Request:
```json
{
  "code": "TAP-001",
  "category": "Valves & Brassware",
  "description": "Brass Ball Tap 15mm",
  "unit": "each",
  "cost_ex_gst": "25.00",
  "default_markup": "35",
  "supplier": "Reece",
  "reece_reference": "PRODUCT_ID_123"
}
```

## Pricing Defaults

### Get Current Pricing

**GET** `/api/pricing-defaults`

Response:
```json
{
  "success": true,
  "data": {
    "plumber_cost_per_hour": "88.00",
    "plumber_sell_rate_per_hour": "180.00",
    "apprentice_cost_per_hour": "45.00",
    "apprentice_sell_rate_per_hour": "95.00",
    "material_markup_percent": "35.00",
    "subcontractor_markup_percent": "20.00",
    "equipment_markup_percent": "25.00"
  }
}
```

### Update Pricing

**POST** `/api/pricing-defaults`

**Requires:** `owner` role only

Request:
```json
{
  "plumber_cost_per_hour": "88.00",
  "plumber_sell_rate_per_hour": "180.00",
  "apprentice_cost_per_hour": "45.00",
  "apprentice_sell_rate_per_hour": "95.00",
  "material_markup_percent": "35",
  "subcontractor_markup_percent": "20",
  "equipment_markup_percent": "25"
}
```

**Note:** All changes are logged in `material_price_history` table with timestamp and user ID.

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Quote not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Internal server error message"
}
```

## Rate Limiting

Currently not implemented but recommended for production:
- 100 requests per minute per user
- 1000 requests per hour per user

## Pagination

All list endpoints support pagination:
- `page` (starts at 1)
- `per_page` (1-100, default 20)
- Response includes `total`, `page`, `per_page`

## Versioning

Current API version: **v1** (in URL path `/api/v1/...` recommended for future versions)

---

For more information, see the main README.md or contact support.
