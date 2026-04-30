# Garbage Truck Tracker

Backend completo para rastrear camiones de basura en tiempo real y notificar a los vecinos cuando el camión entra a su barrio.

## Stack

- **Next.js 16** (App Router, Route Handlers, Proxy)
- **PostgreSQL + PostGIS** — detección geoespacial de barrios
- **Prisma 7** + `@prisma/adapter-pg` — ORM con driver adapter
- **Firebase Cloud Messaging** — notificaciones push
- **JWT** (`jose`) — autenticación stateless
- **Zod 4** — validación de requests
- **bcryptjs** — hash de contraseñas

## Arquitectura

```
POST /api/trucks/location
        │
        ▼
  updateTruckLocation
        │
        ▼
  PostGIS ST_Contains     ──► barrio nuevo?
        │                         │
        │                         ▼
  ST_DWithin (500m)       eventBus.emit("ENTERED_BARRIO")
        │                         │
        ▼                         ▼
  emit("NEAR_BARRIO")     fetch usuarios del barrio
                                  │
                                  ▼
                          anti-spam (NotificationLog)
                                  │
                                  ▼
                          Firebase FCM push
```

## Estructura

```
app/api/
  auth/register/         POST  — registro
  auth/login/            POST  — login
  auth/me/               GET   — perfil autenticado
  trucks/location/       POST  — GPS ping del camión (público)
  trucks/                GET/POST
  trucks/[id]/           GET
  barrios/               GET/POST
  barrios/[id]/          GET
  users/[id]/            GET/PATCH

modules/
  auth/                  — register, login, getMe
  users/                 — getUser, updateUser
  trucks/                — updateTruckLocation (lógica principal)
  barrios/               — CRUD de barrios
  geo/                   — queries PostGIS (ST_Contains, ST_DWithin)
  notifications/         — Firebase FCM + anti-spam
  events/                — event bus + handlers ENTERED_BARRIO / NEAR_BARRIO

lib/
  prisma.ts              — cliente singleton con pg adapter
  jwt.ts                 — signToken / verifyToken
  firebase.ts            — Firebase Admin lazy init
  errors.ts              — AppError, handleError
  logger.ts              — JSON structured logging
  auth-context.ts        — requireAuth() para route handlers

prisma/
  schema.prisma          — User, Barrio, Truck, NotificationLog
  migrations/0001_init/  — SQL con PostGIS (CREATE EXTENSION, AddGeometryColumn)
  seed.ts                — datos de prueba (2 barrios Bogotá, 1 camión, 2 usuarios)

proxy.ts                 — auth guard + request logging
instrumentation.ts       — registra event handlers al iniciar el servidor
```

## Setup

### 1. Variables de entorno

Copia y edita `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/garbage_tracker"

JWT_SECRET="genera-con: openssl rand -base64 32"
JWT_EXPIRES_IN="7d"

FIREBASE_PROJECT_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY=""
```

Para Firebase: crea una Service Account en la consola de Firebase → Configuración del proyecto → Cuentas de servicio → Generar clave privada.

### 2. Base de datos con PostGIS

```bash
docker run -d --name postgis \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=garbage_tracker \
  -p 5432:5432 \
  postgis/postgis:16-3.4
```

### 3. Migración y seed

```bash
pnpm db:migrate   # aplica prisma/migrations/0001_init/migration.sql
pnpm db:seed      # crea barrios, camión y usuarios de prueba
```

### 4. Desarrollo

```bash
pnpm dev
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm db:migrate` | Aplica migraciones |
| `pnpm db:seed` | Puebla la base de datos |
| `pnpm db:studio` | Abre Prisma Studio |
| `pnpm db:generate` | Regenera el cliente Prisma |

## Endpoints principales

### Autenticación

```bash
# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan","email":"juan@test.com","password":"password123","barrioId":1}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@test.com","password":"password123"}'
```

### GPS ping del camión

```bash
curl -X POST http://localhost:3000/api/trucks/location \
  -H "Content-Type: application/json" \
  -d '{"truckId":1,"lat":4.640,"lng":-74.055}'
```

Cuando el camión entra a un barrio nuevo → se envía push a todos los usuarios de ese barrio que tengan `fcmToken` registrado y no hayan sido notificados ya.

### Crear barrio con polígono

```bash
curl -X POST http://localhost:3000/api/barrios \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chapinero",
    "polygonWkt": "POLYGON((-74.065 4.625,-74.045 4.625,-74.045 4.655,-74.065 4.655,-74.065 4.625))"
  }'
```

> El polígono usa formato WKT con orden `lng lat` (estándar GIS).

Ver documentación completa de la API en [API.md](./API.md).

## Modelo de datos

```
User          — id, name, email, password, lat, lng, fcmToken, barrioId
Barrio        — id, name, polygon (PostGIS geometry)
Truck         — id, name, lat, lng, currentBarrioId, lastUpdate
NotificationLog — userId, truckId, barrioId, type (ENTRY|NEAR), sentAt
```

## Anti-spam

Antes de enviar una notificación se consulta `NotificationLog`. Si el usuario ya recibió una notificación de tipo `ENTRY` para ese camión y barrio, se omite. Las notificaciones `NEAR` también se omiten si ya se envió `ENTRY`.

## Notificaciones NEAR

Además de detectar cuando el camión **entra** a un barrio (`ENTRY`), el sistema detecta cuando está a menos de **500 metros** del polígono de un barrio usando `ST_DWithin` y emite el evento `NEAR_BARRIO`.
