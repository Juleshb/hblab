CREATE TABLE "HbmsPushToken" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'unknown',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HbmsPushToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HbmsPushToken_token_key" ON "HbmsPushToken"("token");
CREATE INDEX "HbmsPushToken_userId_idx" ON "HbmsPushToken"("userId");

ALTER TABLE "HbmsPushToken" ADD CONSTRAINT "HbmsPushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
