-- CreateTable
CREATE TABLE "public"."Label" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CardLabel" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardLabel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Label_boardId_idx" ON "public"."Label"("boardId");

-- CreateIndex
CREATE INDEX "CardLabel_cardId_idx" ON "public"."CardLabel"("cardId");

-- CreateIndex
CREATE INDEX "CardLabel_labelId_idx" ON "public"."CardLabel"("labelId");

-- CreateIndex
CREATE UNIQUE INDEX "CardLabel_cardId_labelId_key" ON "public"."CardLabel"("cardId", "labelId");

-- AddForeignKey
ALTER TABLE "public"."Label" ADD CONSTRAINT "Label_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "public"."Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CardLabel" ADD CONSTRAINT "CardLabel_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "public"."Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CardLabel" ADD CONSTRAINT "CardLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "public"."Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
