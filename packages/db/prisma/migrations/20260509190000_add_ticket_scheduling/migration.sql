-- AlterTable
ALTER TABLE "tickets" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'open',
                     ADD COLUMN "scheduled_at" TIMESTAMPTZ,
                     ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "tickets_status_sort_order_idx" ON "tickets"("status", "sort_order");
