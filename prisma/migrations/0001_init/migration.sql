-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Barrio (neighborhood)
CREATE TABLE "Barrio" (
  "id"        SERIAL PRIMARY KEY,
  "name"      TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add a real PostGIS geometry column for the polygon
SELECT AddGeometryColumn('public', 'Barrio', 'polygon', 4326, 'POLYGON', 2);
CREATE INDEX barrio_polygon_idx ON "Barrio" USING GIST ("polygon");

-- User
CREATE TABLE "User" (
  "id"        SERIAL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "email"     TEXT NOT NULL UNIQUE,
  "password"  TEXT NOT NULL,
  "lat"       DOUBLE PRECISION,
  "lng"       DOUBLE PRECISION,
  "fcmToken"  TEXT,
  "barrioId"  INTEGER REFERENCES "Barrio"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX user_barrio_idx ON "User"("barrioId");

-- Truck
CREATE TABLE "Truck" (
  "id"              SERIAL PRIMARY KEY,
  "name"            TEXT NOT NULL,
  "lat"             DOUBLE PRECISION,
  "lng"             DOUBLE PRECISION,
  "lastUpdate"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "currentBarrioId" INTEGER REFERENCES "Barrio"("id") ON DELETE SET NULL
);
CREATE INDEX truck_barrio_idx ON "Truck"("currentBarrioId");

-- NotificationType enum
CREATE TYPE "NotificationType" AS ENUM ('ENTRY', 'NEAR');

-- NotificationLog
CREATE TABLE "NotificationLog" (
  "id"       SERIAL PRIMARY KEY,
  "type"     "NotificationType" NOT NULL,
  "sentAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId"   INTEGER NOT NULL REFERENCES "User"("id"),
  "truckId"  INTEGER NOT NULL REFERENCES "Truck"("id"),
  "barrioId" INTEGER NOT NULL REFERENCES "Barrio"("id")
);
CREATE INDEX notif_log_composite_idx ON "NotificationLog"("userId", "truckId", "barrioId", "type");
