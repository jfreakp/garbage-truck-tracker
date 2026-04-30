CREATE TABLE "Device" (
  "id"        SERIAL PRIMARY KEY,
  "name"      VARCHAR(200) NOT NULL,
  "token"     CHAR(64)     NOT NULL,
  "active"    BOOLEAN      NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "truckId"   INTEGER      NOT NULL UNIQUE
    REFERENCES "Truck"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "Device_token_key" ON "Device" ("token");
CREATE INDEX "Device_token_idx"        ON "Device" ("token");
