CREATE TABLE IF NOT EXISTS "ChatAgent" (
  "chatId" uuid NOT NULL,
  "agentId" uuid NOT NULL,
  CONSTRAINT "ChatAgent_pk" PRIMARY KEY ("chatId", "agentId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ChatAgent" ADD CONSTRAINT "ChatAgent_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ChatAgent" ADD CONSTRAINT "ChatAgent_agentId_Agent_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

