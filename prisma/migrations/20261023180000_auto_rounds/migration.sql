-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "auto_next_round" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "max_rounds" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "recovery_campaigns" ADD COLUMN     "rounds_sent" INTEGER NOT NULL DEFAULT 0;


-- Campaigns launched before rounds were counted sent at least one.
UPDATE "recovery_campaigns" SET "rounds_sent" = 1 WHERE "launched_at" IS NOT NULL;
