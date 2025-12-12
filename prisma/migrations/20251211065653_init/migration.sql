/*
  Warnings:

  - You are about to drop the column `volume` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `quantity` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "volume",
ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL;
