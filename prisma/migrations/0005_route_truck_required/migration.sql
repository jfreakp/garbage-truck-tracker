-- Delete routes that have no truck (orphaned rows would violate NOT NULL)
DELETE FROM "Route" WHERE "truckId" IS NULL;

-- Make truckId NOT NULL and switch cascade to DELETE
ALTER TABLE "Route"
  DROP CONSTRAINT IF EXISTS "Route_truckId_fkey",
  ALTER COLUMN "truckId" SET NOT NULL,
  ADD CONSTRAINT "Route_truckId_fkey"
    FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE;
