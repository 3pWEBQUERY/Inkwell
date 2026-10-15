-- A private entry can be sealed as a letter to one's later self.
ALTER TABLE "posts" ADD COLUMN "opens_at" timestamp with time zone;
