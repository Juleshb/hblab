-- Public internship registrations do not require an account.
ALTER TABLE "CareerApplication" ALTER COLUMN "userId" DROP NOT NULL;
