-- CreateEnum
CREATE TYPE "BinColor" AS ENUM ('VERDE', 'NEGRA', 'NINGUNO');

-- CreateTable
CREATE TABLE "WasteSchedule" (
    "id"        SERIAL NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "binColor"  "BinColor" NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '07:00',
    "endTime"   TEXT NOT NULL DEFAULT '15:00',
    "active"    BOOLEAN NOT NULL DEFAULT true,
    "notes"     TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WasteSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WasteSchedule_dayOfWeek_key" ON "WasteSchedule"("dayOfWeek");

-- CreateIndex
CREATE INDEX "WasteSchedule_dayOfWeek_idx" ON "WasteSchedule"("dayOfWeek");
