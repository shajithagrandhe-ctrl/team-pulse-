-- CreateTable
CREATE TABLE `EmployeeProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `phoneVerified` BOOLEAN NOT NULL DEFAULT false,
    `dateOfBirth` DATETIME(3) NULL,
    `yearsOfExperience` INTEGER NULL,
    `currentCompany` VARCHAR(191) NULL,
    `previousCompanies` JSON NULL,
    `currentPosition` VARCHAR(191) NULL,
    `roleGiven` VARCHAR(191) NULL,
    `dateOfJoining` DATETIME(3) NULL,
    `dateOfRelieving` DATETIME(3) NULL,
    `achievements` JSON NULL,
    `status` ENUM('ACTIVE', 'FROZEN') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmployeeProfile_userId_key`(`userId`),
    INDEX `EmployeeProfile_status_idx`(`status`),
    INDEX `EmployeeProfile_dateOfRelieving_idx`(`dateOfRelieving`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EmployeeProfile` ADD CONSTRAINT `EmployeeProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

