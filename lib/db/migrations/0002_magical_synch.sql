CREATE TABLE IF NOT EXISTS "NewsCurationRun" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"finishedAt" timestamp,
	"inserted" varchar(16) DEFAULT '0' NOT NULL,
	"skipped" varchar(16) DEFAULT '0' NOT NULL,
	"stoppedEarly" boolean DEFAULT false NOT NULL,
	"pausedUntil" timestamp,
	"stoppedAtSource" text,
	"providerStats" json
);
--> statement-breakpoint
ALTER TABLE "NewsArticle" ADD COLUMN "curatedProvider" varchar(16);--> statement-breakpoint
ALTER TABLE "NewsArticle" ADD COLUMN "curatedModelId" varchar(64);--> statement-breakpoint
ALTER TABLE "NewsArticle" ADD COLUMN "curatedAt" timestamp DEFAULT now();