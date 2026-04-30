# Garbage Truck Tracker — API Reference

Base URL: `http://localhost:3000`

All protected endpoints require:
```
Authorization: Bearer <token>
```

---

## Auth

### POST /api/auth/register
Register a new user.

**Request:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "securepassword",
  "lat": 4.637,
  "lng": -74.056,
  "barrioId": 1,
  "fcmToken": "firebase-device-token"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "name": "Juan Pérez", "email": "juan@example.com", "barrioId": 1 },
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

---

### POST /api/auth/login

**Request:**
```json
{ "email": "juan@example.com", "password": "securepassword" }
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "name": "Juan Pérez", "email": "juan@example.com" },
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

---

### GET /api/auth/me *(protected)*
Returns the authenticated user's profile.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1, "name": "Juan Pérez", "email": "juan@example.com",
    "lat": 4.637, "lng": -74.056, "barrioId": 1,
    "barrio": { "id": 1, "name": "Chapinero" }
  }
}
```

---

## Trucks

### POST /api/trucks/location *(public – called by truck device)*
GPS ping from truck. Triggers barrio detection and notifications.

**Request:**
```json
{ "truckId": 1, "lat": 4.640, "lng": -74.055 }
```

**Response 200 (truck inside a barrio):**
```json
{
  "success": true,
  "data": {
    "truckId": 1, "lat": 4.640, "lng": -74.055,
    "insideBarrio": { "id": 1, "name": "Chapinero" },
    "nearBarrios": []
  }
}
```

**Response 200 (truck not inside but near barrios):**
```json
{
  "success": true,
  "data": {
    "truckId": 1, "lat": 4.624, "lng": -74.065,
    "insideBarrio": null,
    "nearBarrios": [{ "id": 1, "name": "Chapinero" }]
  }
}
```

---

### GET /api/trucks *(protected)*
List all trucks with their current barrio.

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Camión 01", "lat": 4.64, "lng": -74.055,
      "currentBarrio": { "id": 1, "name": "Chapinero" } }
  ]
}
```

### POST /api/trucks *(protected)*
Create a truck.

**Request:** `{ "name": "Camión 02" }`

### GET /api/trucks/:id *(protected)*
Get single truck.

---

## Barrios

### GET /api/barrios *(protected)*
List all barrios.

### POST /api/barrios *(protected)*
Create a barrio with a PostGIS polygon.

**Request:**
```json
{
  "name": "Chapinero",
  "polygonWkt": "POLYGON((-74.065 4.625, -74.045 4.625, -74.045 4.655, -74.065 4.655, -74.065 4.625))"
}
```
> Note: WKT uses `lng lat` order (standard GIS convention).

**Response 201:**
```json
{ "success": true, "data": { "id": 1, "name": "Chapinero" } }
```

### GET /api/barrios/:id *(protected)*

---

## Users

### GET /api/users/:id *(protected – own profile only)*
### PATCH /api/users/:id *(protected – own profile only)*

**Request:**
```json
{ "fcmToken": "new-firebase-token", "lat": 4.638, "lng": -74.057 }
```

---

## Error responses

All errors return:
```json
{ "success": false, "error": "Human readable message" }
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error (Zod) |
| 401 | Missing/invalid token |
| 404 | Resource not found |
| 409 | Conflict (e.g. email already used) |
| 500 | Internal server error |

---

## Setup

```bash
# 1. Configure environment
cp .env.example .env   # fill DATABASE_URL, JWT_SECRET, Firebase vars

# 2. Run PostgreSQL with PostGIS
docker run -d --name postgis \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=garbage_tracker \
  -p 5432:5432 \
  postgis/postgis:16-3.4

# 3. Apply migration
pnpm db:migrate

# 4. Seed test data
pnpm db:seed

# 5. Start dev server
pnpm dev
```
