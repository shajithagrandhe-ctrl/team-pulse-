CREATE TABLE `EmployeeAssignment` (
    `userId` VARCHAR(191) NOT NULL,
    `assignedLocationIds` JSON NULL,
    `assignedVentureIds` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `EmployeeAssignment`
  ADD CONSTRAINT `EmployeeAssignment_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
