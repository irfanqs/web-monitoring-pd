/*
  Warnings:

  - The values [PTPD] on the enum `EmployeeRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EmployeeRole_new" AS ENUM ('VER', 'PPRBPD', 'OK', 'BP', 'OP', 'PPK', 'PPD', 'ADK', 'KSBU', 'PABPD', 'OSPM', 'OSPBy');
ALTER TABLE "users" ALTER COLUMN "employee_role" TYPE "EmployeeRole_new" USING ("employee_role"::text::"EmployeeRole_new");
ALTER TABLE "step_configurations" ALTER COLUMN "required_employee_role" TYPE "EmployeeRole_new" USING ("required_employee_role"::text::"EmployeeRole_new");
ALTER TYPE "EmployeeRole" RENAME TO "EmployeeRole_old";
ALTER TYPE "EmployeeRole_new" RENAME TO "EmployeeRole";
DROP TYPE "EmployeeRole_old";
COMMIT;
