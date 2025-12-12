/*
  Warnings:

  - A unique constraint covering the columns `[companyId,code]` on the table `chart_of_accounts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,plateNumber]` on the table `vehicles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `chart_of_accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `vendors` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "chart_of_accounts_code_key";

-- DropIndex
DROP INDEX "vehicles_plateNumber_key";

-- AlterTable
ALTER TABLE "chart_of_accounts" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "companyId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subscriptionPlan" TEXT NOT NULL DEFAULT 'basic',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "chart_of_accounts_companyId_idx" ON "chart_of_accounts"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_companyId_code_key" ON "chart_of_accounts"("companyId", "code");

-- CreateIndex
CREATE INDEX "customers_companyId_idx" ON "customers"("companyId");

-- CreateIndex
CREATE INDEX "items_companyId_idx" ON "items"("companyId");

-- CreateIndex
CREATE INDEX "transactions_companyId_idx" ON "transactions"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_companyId_plateNumber_key" ON "vehicles"("companyId", "plateNumber");

-- CreateIndex
CREATE INDEX "vendors_companyId_idx" ON "vendors"("companyId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
