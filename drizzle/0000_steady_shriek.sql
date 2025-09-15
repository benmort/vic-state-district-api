CREATE TABLE IF NOT EXISTS "districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"state" text DEFAULT 'VIC' NOT NULL,
	"postcode" text NOT NULL,
	"suburb" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "postcodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"postcode" text NOT NULL,
	"suburb" text NOT NULL,
	"state" text DEFAULT 'VIC' NOT NULL,
	"district" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "postcodes_postcode_unique" UNIQUE("postcode")
);
