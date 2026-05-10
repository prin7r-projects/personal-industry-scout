-- CreateTable
CREATE TABLE IF NOT EXISTS "benchmarks" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "scores" (
    "id" UUID NOT NULL,
    "benchmark_id" UUID NOT NULL,
    "industry" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "benchmarks_name_key" ON "benchmarks"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "scores_benchmark_id_industry_key" ON "scores"("benchmark_id", "industry");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'scores_benchmark_id_fkey'
    ) THEN
        ALTER TABLE "scores" ADD CONSTRAINT "scores_benchmark_id_fkey"
        FOREIGN KEY ("benchmark_id") REFERENCES "benchmarks"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
