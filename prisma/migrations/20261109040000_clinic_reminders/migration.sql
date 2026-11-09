-- CreateEnum
CREATE TYPE "MessagePurpose" AS ENUM ('OFFER', 'BOOKING_CONFIRMATION', 'APPOINTMENT_REMINDER');

-- AlterEnum
ALTER TYPE "AppointmentSource" ADD VALUE 'ONLINE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MessageStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "MessageStatus" ADD VALUE 'SUPPRESSED';

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "confirmed_at" TIMESTAMP(3),
ADD COLUMN     "manage_token_hash" TEXT,
ADD COLUMN     "no_show_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "booking_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "booking_horizon_days" INTEGER NOT NULL DEFAULT 14,
ADD COLUMN     "booking_slug" TEXT,
ADD COLUMN     "reminder_offsets_minutes" INTEGER[] DEFAULT ARRAY[1440, 120]::INTEGER[],
ADD COLUMN     "slot_interval_minutes" INTEGER NOT NULL DEFAULT 15;

-- AlterTable
ALTER TABLE "outbox_messages" ADD COLUMN     "appointment_id" TEXT,
ADD COLUMN     "locked_until" TIMESTAMP(3),
ADD COLUMN     "purpose" "MessagePurpose" NOT NULL DEFAULT 'OFFER';

-- CreateIndex
CREATE UNIQUE INDEX "appointments_manage_token_hash_key" ON "appointments"("manage_token_hash");

-- CreateIndex
CREATE INDEX "appointments_customer_id_status_idx" ON "appointments"("customer_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "locations_booking_slug_key" ON "locations"("booking_slug");

-- CreateIndex
CREATE INDEX "outbox_messages_appointment_id_idx" ON "outbox_messages"("appointment_id");

-- CreateIndex
CREATE INDEX "outbox_messages_location_id_created_at_idx" ON "outbox_messages"("location_id", "created_at");

-- AddForeignKey
ALTER TABLE "outbox_messages" ADD CONSTRAINT "outbox_messages_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ─── Integrity constraints Prisma cannot express ─────────────────────────────

ALTER TABLE "locations"
  ADD CONSTRAINT "locations_booking_slug_format" CHECK ("booking_slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  ADD CONSTRAINT "locations_booking_horizon_valid" CHECK ("booking_horizon_days" BETWEEN 1 AND 90),
  ADD CONSTRAINT "locations_slot_interval_valid" CHECK ("slot_interval_minutes" BETWEEN 5 AND 120);
