-- Optional password sign-in for accounts created by operators (admins, test users).
ALTER TABLE "users" ADD COLUMN "password_hash" text;
