ALTER TABLE "Barrio"
  ADD COLUMN "visibleOnMap" BOOLEAN NOT NULL DEFAULT FALSE;

-- All existing barrios start hidden
UPDATE "Barrio" SET "visibleOnMap" = FALSE;
