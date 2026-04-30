-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

-- Promote seed admin account
UPDATE "User" SET "role" = 'ADMIN' WHERE email = 'admin@loja.gob.ec';
