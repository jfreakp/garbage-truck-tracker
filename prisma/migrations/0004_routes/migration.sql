CREATE TABLE "Route" (
  "id"        SERIAL PRIMARY KEY,
  "name"      VARCHAR(100) NOT NULL,
  "truckId"   INTEGER REFERENCES "Truck"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

SELECT AddGeometryColumn('public', 'Route', 'path', 4326, 'LINESTRING', 2);
CREATE INDEX route_path_idx ON "Route" USING GIST ("path");
