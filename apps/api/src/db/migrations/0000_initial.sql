CREATE TYPE "public"."code_purpose" AS ENUM('login', 'change_email');--> statement-breakpoint
CREATE TYPE "public"."comment_mode" AS ENUM('reply', 'feedback');--> statement-breakpoint
CREATE TYPE "public"."expiry" AS ENUM('none', '24h', '7d');--> statement-breakpoint
CREATE TYPE "public"."export_status" AS ENUM('pending', 'processing', 'ready', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."feed_sort" AS ENUM('new', 'week', 'top');--> statement-breakpoint
CREATE TYPE "public"."flag_status" AS ENUM('open', 'reviewing', 'actioned', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."flag_target" AS ENUM('post', 'comment');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('de', 'fr', 'it', 'en');--> statement-breakpoint
CREATE TYPE "public"."moderation_action" AS ENUM('keep', 'hide', 'delete', 'warn', 'suspend_7d', 'suspend_permanent');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('visible', 'hidden_pending', 'hidden', 'expired');--> statement-breakpoint
CREATE TYPE "public"."post_type" AS ENUM('thought', 'story');--> statement-breakpoint
CREATE TYPE "public"."reaction_kind" AS ENUM('read', 'felt', 'known', 'thanks');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('harassment', 'hate', 'spam', 'sexual', 'violence', 'self_harm_other', 'copyright', 'other');--> statement-breakpoint
CREATE TYPE "public"."room_kind" AS ENUM('reflection', 'fiction');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('private', 'anonymous', 'public');--> statement-breakpoint
CREATE TABLE "blocks" (
	"blocker_id" text NOT NULL,
	"blocked_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocks_blocker_id_blocked_id_pk" PRIMARY KEY("blocker_id","blocked_id")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"author_id" text NOT NULL,
	"mode" "comment_mode" NOT NULL,
	"body" text NOT NULL,
	"worked" text,
	"unclear" text,
	"hidden_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "daily_metrics" (
	"day" text NOT NULL,
	"metric" text NOT NULL,
	"value" real DEFAULT 0 NOT NULL,
	CONSTRAINT "daily_metrics_day_metric_pk" PRIMARY KEY("day","metric")
);
--> statement-breakpoint
CREATE TABLE "email_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"email_hash" text NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"purpose" "code_purpose" DEFAULT 'login' NOT NULL,
	"user_id" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exports" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" "export_status" DEFAULT 'pending' NOT NULL,
	"s3_key" text,
	"error" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_flags" (
	"id" text PRIMARY KEY NOT NULL,
	"target_type" "flag_target" NOT NULL,
	"target_id" text NOT NULL,
	"reporter_id" text NOT NULL,
	"reason" "report_reason" NOT NULL,
	"free_text" text,
	"priority" smallint DEFAULT 3 NOT NULL,
	"status" "flag_status" DEFAULT 'open' NOT NULL,
	"reviewer_id" text,
	"action" "moderation_action",
	"note" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_notices" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"flag_id" text,
	"action" "moderation_action" NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "passkeys" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"transports" text[] DEFAULT '{}'::text[] NOT NULL,
	"device_type" text DEFAULT 'singleDevice' NOT NULL,
	"backed_up" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "post_scores" (
	"post_id" text PRIMARY KEY NOT NULL,
	"score" real DEFAULT 0 NOT NULL,
	"net_votes" integer DEFAULT 0 NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"room_id" text,
	"type" "post_type" NOT NULL,
	"visibility" "visibility" NOT NULL,
	"status" "post_status" DEFAULT 'visible' NOT NULL,
	"title" text,
	"body" text,
	"ciphertext" text,
	"nonce" text,
	"wrapped_key" text,
	"word_count" integer DEFAULT 0 NOT NULL,
	"expiry" "expiry" DEFAULT 'none' NOT NULL,
	"expires_at" timestamp with time zone,
	"comments_enabled" boolean DEFAULT false NOT NULL,
	"series_id" text,
	"chapter" integer,
	"client_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"edited_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"platform" text DEFAULT 'web' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limits_key_window_start_pk" PRIMARY KEY("key","window_start")
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"post_id" text NOT NULL,
	"user_id" text NOT NULL,
	"kind" "reaction_kind" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reactions_post_id_user_id_kind_pk" PRIMARY KEY("post_id","user_id","kind")
);
--> statement-breakpoint
CREATE TABLE "room_members" (
	"room_id" text NOT NULL,
	"user_id" text NOT NULL,
	"push_enabled" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_members_room_id_user_id_pk" PRIMARY KEY("room_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"kind" "room_kind" NOT NULL,
	"locale" "locale" NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"rules" text DEFAULT '' NOT NULL,
	"sort_default" "feed_sort" DEFAULT 'new' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"show_helplines" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "series" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "series_subscriptions" (
	"series_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "series_subscriptions_series_id_user_id_pk" PRIMARY KEY("series_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"device" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_hash" text NOT NULL,
	"apple_sub" text,
	"pseudonym" text NOT NULL,
	"pseudonym_changed_at" timestamp with time zone,
	"avatar" text DEFAULT 'shape:leaf-1' NOT NULL,
	"locale" "locale" DEFAULT 'de' NOT NULL,
	"room_locales" text[] DEFAULT '{de}'::text[] NOT NULL,
	"roles" text[] DEFAULT '{member}'::text[] NOT NULL,
	"settings" jsonb NOT NULL,
	"age_confirmed_at" timestamp with time zone,
	"onboarding_completed_at" timestamp with time zone,
	"recovery_setup_at" timestamp with time zone,
	"warnings_count" integer DEFAULT 0 NOT NULL,
	"suspended_until" timestamp with time zone,
	"suspended_permanently" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"purge_after" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"post_id" text NOT NULL,
	"user_id" text NOT NULL,
	"value" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "votes_post_id_user_id_pk" PRIMARY KEY("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "webauthn_challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"challenge" text NOT NULL,
	"intent" text NOT NULL,
	"user_id" text,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocked_id_users_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_codes" ADD CONSTRAINT "email_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exports" ADD CONSTRAINT "exports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_flags" ADD CONSTRAINT "moderation_flags_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_flags" ADD CONSTRAINT "moderation_flags_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_notices" ADD CONSTRAINT "moderation_notices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_notices" ADD CONSTRAINT "moderation_notices_flag_id_moderation_flags_id_fk" FOREIGN KEY ("flag_id") REFERENCES "public"."moderation_flags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_scores" ADD CONSTRAINT "post_scores_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "series_subscriptions" ADD CONSTRAINT "series_subscriptions_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "series_subscriptions" ADD CONSTRAINT "series_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webauthn_challenges" ADD CONSTRAINT "webauthn_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blocks_blocked_idx" ON "blocks" USING btree ("blocked_id");--> statement-breakpoint
CREATE INDEX "comments_post_idx" ON "comments" USING btree ("post_id","created_at");--> statement-breakpoint
CREATE INDEX "email_codes_email_hash_idx" ON "email_codes" USING btree ("email_hash","created_at");--> statement-breakpoint
CREATE INDEX "exports_user_idx" ON "exports" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "moderation_flags_unique_report_idx" ON "moderation_flags" USING btree ("target_type","target_id","reporter_id");--> statement-breakpoint
CREATE INDEX "moderation_flags_queue_idx" ON "moderation_flags" USING btree ("status","priority","created_at");--> statement-breakpoint
CREATE INDEX "moderation_flags_target_idx" ON "moderation_flags" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "moderation_notices_user_idx" ON "moderation_notices" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "passkeys_user_idx" ON "passkeys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "posts_room_feed_idx" ON "posts" USING btree ("room_id","created_at","id");--> statement-breakpoint
CREATE INDEX "posts_author_idx" ON "posts" USING btree ("author_id","updated_at");--> statement-breakpoint
CREATE INDEX "posts_expires_idx" ON "posts" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "posts_series_idx" ON "posts" USING btree ("series_id","chapter");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_client_id_idx" ON "posts" USING btree ("author_id","client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscriptions_endpoint_idx" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "room_members_user_idx" ON "room_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_slug_idx" ON "rooms" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "rooms_locale_kind_idx" ON "rooms" USING btree ("locale","kind");--> statement-breakpoint
CREATE INDEX "series_author_idx" ON "series" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_idx" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_hash_idx" ON "users" USING btree ("email_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "users_pseudonym_idx" ON "users" USING btree ("pseudonym");--> statement-breakpoint
CREATE UNIQUE INDEX "users_apple_sub_idx" ON "users" USING btree ("apple_sub");