-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "taskTitle" TEXT NOT NULL,
    "commentAuthor" TEXT NOT NULL,
    "commentBody" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
