-- CreateTable
CREATE TABLE "public"."WorkingHours" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "staffId" TEXT,
    "weekday" INTEGER NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkingHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TimeOff" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "staffId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeOff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkingHours_organizationId_idx" ON "public"."WorkingHours"("organizationId");

-- CreateIndex
CREATE INDEX "WorkingHours_locationId_idx" ON "public"."WorkingHours"("locationId");

-- CreateIndex
CREATE INDEX "WorkingHours_staffId_idx" ON "public"."WorkingHours"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkingHours_locationId_staffId_weekday_key" ON "public"."WorkingHours"("locationId", "staffId", "weekday");

-- CreateIndex
CREATE INDEX "TimeOff_organizationId_idx" ON "public"."TimeOff"("organizationId");

-- CreateIndex
CREATE INDEX "TimeOff_locationId_idx" ON "public"."TimeOff"("locationId");

-- CreateIndex
CREATE INDEX "TimeOff_staffId_idx" ON "public"."TimeOff"("staffId");

-- CreateIndex
CREATE INDEX "TimeOff_startsAt_endsAt_idx" ON "public"."TimeOff"("startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "public"."WorkingHours" ADD CONSTRAINT "WorkingHours_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkingHours" ADD CONSTRAINT "WorkingHours_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkingHours" ADD CONSTRAINT "WorkingHours_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimeOff" ADD CONSTRAINT "TimeOff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimeOff" ADD CONSTRAINT "TimeOff_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimeOff" ADD CONSTRAINT "TimeOff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
