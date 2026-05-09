-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "subscribers" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "tz" TEXT NOT NULL DEFAULT 'UTC',
    "telegram_user_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "subscriber_id" UUID NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'operator',
    "status" TEXT NOT NULL DEFAULT 'active',
    "starts_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMPTZ,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "paid_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlists" (
    "id" UUID NOT NULL,
    "subscriber_id" UUID NOT NULL,
    "industries" JSONB NOT NULL DEFAULT '[]',
    "companies" JSONB NOT NULL DEFAULT '[]',
    "geos" JSONB NOT NULL DEFAULT '[]',
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "briefs" (
    "id" UUID NOT NULL,
    "industry" TEXT NOT NULL,
    "isoweek" INTEGER NOT NULL,
    "scout_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "body_md" TEXT NOT NULL,
    "signed_at" TIMESTAMPTZ,

    CONSTRAINT "briefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citations" (
    "id" UUID NOT NULL,
    "brief_id" UUID NOT NULL,
    "cite_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "verified_at" TIMESTAMPTZ,

    CONSTRAINT "citations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" UUID NOT NULL,
    "brief_id" UUID NOT NULL,
    "subscriber_id" UUID NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "watermark_uuid" TEXT NOT NULL,
    "artifact_url" TEXT,
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scouts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "industry_focus" TEXT NOT NULL,

    CONSTRAINT "scouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "subscriber_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "response" TEXT,
    "opened_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMPTZ,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_email_key" ON "subscribers"("email");

-- CreateIndex
CREATE INDEX "subscriptions_subscriber_id_status_idx" ON "subscriptions"("subscriber_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "orders_invoice_id_key" ON "orders"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "watchlists_subscriber_id_key" ON "watchlists"("subscriber_id");

-- CreateIndex
CREATE INDEX "briefs_industry_isoweek_idx" ON "briefs"("industry", "isoweek");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_brief_id_subscriber_id_key" ON "deliveries"("brief_id", "subscriber_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscribers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscribers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "briefs" ADD CONSTRAINT "briefs_scout_id_fkey" FOREIGN KEY ("scout_id") REFERENCES "scouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citations" ADD CONSTRAINT "citations_brief_id_fkey" FOREIGN KEY ("brief_id") REFERENCES "briefs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_brief_id_fkey" FOREIGN KEY ("brief_id") REFERENCES "briefs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscribers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscribers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

