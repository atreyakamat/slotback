-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "city" TEXT,
ADD COLUMN     "onboarded_at" TIMESTAMP(3),
ADD COLUMN     "vertical" TEXT;

-- Workspaces that existed before onboarding (the demo) count as already set up.
UPDATE "organizations" SET "onboarded_at" = "created_at" WHERE "onboarded_at" IS NULL;
