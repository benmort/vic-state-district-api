CREATE INDEX IF NOT EXISTS "districts_name_idx" ON "districts" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "districts_mp_id_idx" ON "districts" ("mp_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mps_name_idx" ON "mps" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mps_party_idx" ON "mps" ("party");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "postcode_districts_postcode_id_idx" ON "postcode_districts" ("postcode_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "postcode_districts_district_id_idx" ON "postcode_districts" ("district_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "postcodes_postcode_number_idx" ON "postcodes" ("postcode_number");