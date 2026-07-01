/*
  Warnings:

  - Added the required column `storagePath` to the `foto_veiculo` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusFotoVeiculo" AS ENUM ('BATIDO', 'EM_REPARO', 'PRONTO_VENDA');

-- AlterTable
ALTER TABLE "foto_veiculo" ADD COLUMN     "destaque" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "legenda" TEXT,
ADD COLUMN     "status" "StatusFotoVeiculo" NOT NULL DEFAULT 'PRONTO_VENDA',
ADD COLUMN     "storagePath" TEXT NOT NULL;
