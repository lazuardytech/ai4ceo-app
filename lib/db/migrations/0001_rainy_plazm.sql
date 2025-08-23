CREATE TABLE IF NOT EXISTS "NewsArticle" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"timeline" json,
	"factCheck" text,
	"publishedAt" timestamp,
	"scrapedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "NewsArticle_url_unique" UNIQUE("url")
);
