-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('admin', 'supervisor', 'employee');

-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('VER', 'PPRBPD', 'OK', 'BP', 'OP', 'PPK', 'PTPD', 'ADK', 'KSBU', 'PABPD', 'OSPM', 'OSPBy');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('pending', 'in_progress', 'completed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "system_role" "SystemRole" NOT NULL,
    "employee_role" "EmployeeRole",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "activity_name" TEXT NOT NULL,
    "assignment_letter_number" TEXT NOT NULL,
    "uraian" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "is_ls" BOOLEAN NOT NULL DEFAULT false,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "status" "TicketStatus" NOT NULL DEFAULT 'pending',
    "assigned_ppd_user_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_histories" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "processed_by_id" TEXT NOT NULL,
    "processor_name" TEXT NOT NULL,
    "file_url" TEXT,
    "file_name" TEXT,
    "notes" TEXT,
    "processed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "step_configurations" (
    "id" SERIAL NOT NULL,
    "step_number" INTEGER NOT NULL,
    "step_name" TEXT NOT NULL,
    "required_employee_role" "EmployeeRole" NOT NULL,
    "description" TEXT,
    "is_ls_only" BOOLEAN NOT NULL DEFAULT false,
    "is_non_ls_only" BOOLEAN NOT NULL DEFAULT false,
    "is_parallel" BOOLEAN NOT NULL DEFAULT false,
    "parallel_group" TEXT,

    CONSTRAINT "step_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticket_number_key" ON "tickets"("ticket_number");

-- CreateIndex
CREATE UNIQUE INDEX "step_configurations_step_number_key" ON "step_configurations"("step_number");

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_ppd_user_id_fkey" FOREIGN KEY ("assigned_ppd_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_histories" ADD CONSTRAINT "ticket_histories_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_histories" ADD CONSTRAINT "ticket_histories_processed_by_id_fkey" FOREIGN KEY ("processed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
