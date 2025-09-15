CREATE TABLE IF NOT EXISTS "mps" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"party" text NOT NULL,
	"phone_number" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "postcodes" DROP CONSTRAINT "postcodes_postcode_unique";--> statement-breakpoint
ALTER TABLE "districts" ADD COLUMN "district_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "districts" ADD COLUMN "mp_id" integer;--> statement-breakpoint
ALTER TABLE "postcodes" ADD COLUMN "postcode_number" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "postcodes" ADD COLUMN "district_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "districts" ADD CONSTRAINT "districts_mp_id_mps_id_fk" FOREIGN KEY ("mp_id") REFERENCES "mps"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "postcodes" ADD CONSTRAINT "postcodes_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "districts" DROP COLUMN IF EXISTS "state";--> statement-breakpoint
ALTER TABLE "districts" DROP COLUMN IF EXISTS "postcode";--> statement-breakpoint
ALTER TABLE "districts" DROP COLUMN IF EXISTS "suburb";--> statement-breakpoint
ALTER TABLE "postcodes" DROP COLUMN IF EXISTS "postcode";--> statement-breakpoint
ALTER TABLE "postcodes" DROP COLUMN IF EXISTS "suburb";--> statement-breakpoint
ALTER TABLE "postcodes" DROP COLUMN IF EXISTS "state";--> statement-breakpoint
ALTER TABLE "postcodes" DROP COLUMN IF EXISTS "district";--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_district_id_unique" UNIQUE("district_id");--> statement-breakpoint
ALTER TABLE "postcodes" ADD CONSTRAINT "postcodes_postcode_number_unique" UNIQUE("postcode_number");