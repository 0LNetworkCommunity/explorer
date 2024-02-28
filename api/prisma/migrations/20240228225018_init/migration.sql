-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('IOS', 'ANDROID');

-- CreateTable
CREATE TABLE "Device" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token" TEXT NOT NULL,
    "type" "DeviceType" NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletSubscription" (
    "walletAddress" BYTEA NOT NULL,
    "deviceId" UUID NOT NULL,

    CONSTRAINT "WalletSubscription_pkey" PRIMARY KEY ("walletAddress","deviceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_token_type_key" ON "Device"("token", "type");

-- AddForeignKey
ALTER TABLE "WalletSubscription" ADD CONSTRAINT "WalletSubscription_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
