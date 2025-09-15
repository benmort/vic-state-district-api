CREATE TABLE IF NOT EXISTS "postcode_districts" (
	"postcode_id" integer NOT NULL,
	"district_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "postcode_districts_postcode_id_district_id_pk" PRIMARY KEY("postcode_id","district_id")
);
--> statement-breakpoint
ALTER TABLE "postcodes" DROP CONSTRAINT "postcodes_district_id_districts_id_fk";
--> statement-breakpoint
ALTER TABLE "postcodes" DROP COLUMN IF EXISTS "district_id";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "postcode_districts" ADD CONSTRAINT "postcode_districts_postcode_id_postcodes_id_fk" FOREIGN KEY ("postcode_id") REFERENCES "postcodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "postcode_districts" ADD CONSTRAINT "postcode_districts_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
