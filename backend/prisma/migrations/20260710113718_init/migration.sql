-- CreateEnum
CREATE TYPE "PartyType" AS ENUM ('CASH', 'GST');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('COUNT', 'QUALITY', 'BG_YARN', 'FABRIC', 'CUTT_PIECE', 'LEFT_OVER', 'GREY_CLOTH');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('CASH_PURCHASE', 'GST_PURCHASE', 'CASH_SALE', 'GST_SALE', 'SERVICES', 'TRANSACTION');

-- CreateEnum
CREATE TYPE "RateOption" AS ENUM ('FULL', 'COM_LESS');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('PREPARED', 'CHECKED', 'APPROVED');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('YARN_RECEIPT_CASH', 'YARN_RECEIPT_GST', 'YARN_ISSUE_CASH', 'YARN_ISSUE_GST', 'SERVICES_NOTE', 'TRANSACTION_NOTE');

-- CreateTable
CREATE TABLE "parties" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PartyType" NOT NULL,
    "cashPartyName" TEXT,
    "cashAddress" TEXT,
    "cashCell" TEXT,
    "cashEmail" TEXT,
    "gstPartyName" TEXT,
    "strn" TEXT,
    "ntn" TEXT,
    "gstAddress" TEXT,
    "gstCell" TEXT,
    "gstEmail" TEXT,
    "ipConcernPerson" TEXT,
    "ipCell" TEXT,
    "ipEmail" TEXT,
    "cpConcernPerson" TEXT,
    "cpCell" TEXT,
    "cpEmail" TEXT,
    "refPersonName" TEXT,
    "refPersonCell" TEXT,
    "others" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "category" "ItemCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "box1" TEXT,
    "box2" TEXT,
    "box3" TEXT,
    "box4" TEXT,
    "box5" TEXT,
    "box6" TEXT,
    "box7" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "refTypeSerial" INTEGER NOT NULL DEFAULT 1,
    "contractType" "ContractType" NOT NULL,
    "partyRefNo" TEXT,
    "hasGst" BOOLEAN NOT NULL DEFAULT false,
    "hasCommission" BOOLEAN NOT NULL DEFAULT false,
    "rateOption" "RateOption" NOT NULL DEFAULT 'FULL',
    "bookingPartyId" INTEGER,
    "chequePartyId" INTEGER,
    "creditDays" INTEGER,
    "salesTax" DECIMAL(10,2),
    "fTax" DECIMAL(10,2),
    "aTax" DECIMAL(10,2),
    "iTax" DECIMAL(10,2),
    "commission" DECIMAL(10,2),
    "othersCom1Id" INTEGER,
    "ocRate1" DECIMAL(10,2),
    "othersCom2Id" INTEGER,
    "ocRate2" DECIMAL(10,2),
    "specialNote" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'PREPARED',
    "preparedBy" TEXT,
    "checkedBy" TEXT,
    "approvedBy" TEXT,
    "preparedAt" TIMESTAMP(3),
    "checkedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_items" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "itemId" INTEGER,
    "quality" TEXT,
    "bags" INTEGER,
    "rate" DECIMAL(10,2),
    "clRate" DECIMAL(10,2),
    "amount" DECIMAL(12,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "contract_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "noteType" "NoteType" NOT NULL,
    "partyId" INTEGER,
    "contractId" INTEGER,
    "salesTax" DECIMAL(10,2),
    "fTax" DECIMAL(10,2),
    "aTax" DECIMAL(10,2),
    "iTax" DECIMAL(10,2),
    "preparedBy" TEXT,
    "checkedBy" TEXT,
    "approvedBy" TEXT,
    "preparedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "checkedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_items" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "itemId" INTEGER,
    "quality" TEXT,
    "bags" INTEGER,
    "rate" DECIMAL(10,2),
    "amount" DECIMAL(12,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parties_code_key" ON "parties"("code");

-- CreateIndex
CREATE UNIQUE INDEX "items_code_key" ON "items"("code");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_code_key" ON "contracts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_code_key" ON "transactions"("code");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_bookingPartyId_fkey" FOREIGN KEY ("bookingPartyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_chequePartyId_fkey" FOREIGN KEY ("chequePartyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_othersCom1Id_fkey" FOREIGN KEY ("othersCom1Id") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_othersCom2Id_fkey" FOREIGN KEY ("othersCom2Id") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_items" ADD CONSTRAINT "contract_items_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_items" ADD CONSTRAINT "contract_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
