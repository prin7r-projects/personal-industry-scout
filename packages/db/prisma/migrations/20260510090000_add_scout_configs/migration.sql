-- CreateTable
CREATE TABLE "scout_configs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "industry" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "signals" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scout_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scout_configs_user_id_idx" ON "scout_configs"("user_id");

-- AddForeignKey
ALTER TABLE "scout_configs" ADD CONSTRAINT "scout_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
