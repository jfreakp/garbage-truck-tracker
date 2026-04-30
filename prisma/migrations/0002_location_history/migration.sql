CREATE TABLE "LocationHistory" (
  "id"        SERIAL PRIMARY KEY,
  "truckId"   INTEGER NOT NULL REFERENCES "Truck"("id") ON DELETE CASCADE,
  "lat"       DOUBLE PRECISION NOT NULL,
  "lng"       DOUBLE PRECISION NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX location_history_truck_idx ON "LocationHistory" ("truckId", "recordedAt" DESC);
