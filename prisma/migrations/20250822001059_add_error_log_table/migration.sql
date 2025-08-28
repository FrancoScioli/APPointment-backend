-- CreateTable
CREATE TABLE "public"."ErrorLog" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "route" TEXT,
    "method" TEXT,
    "statusCode" INTEGER,
    "userId" TEXT,
    "organizationId" TEXT,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ErrorLog_createdAt_idx" ON "public"."ErrorLog"("createdAt");

-- CreateIndex
CREATE INDEX "ErrorLog_level_idx" ON "public"."ErrorLog"("level");

-- CreateIndex
CREATE INDEX "ErrorLog_statusCode_idx" ON "public"."ErrorLog"("statusCode");
