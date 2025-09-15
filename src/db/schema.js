import { pgTable, text, serial, timestamp, integer, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const mps = pgTable('mps', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  party: text('party').notNull(),
  phoneNumber: text('phone_number').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const districts = pgTable('districts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  districtId: integer('district_id').notNull().unique(),
  mpId: integer('mp_id').references(() => mps.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const postcodes = pgTable('postcodes', {
  id: serial('id').primaryKey(),
  postcodeNumber: integer('postcode_number').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Junction table for many-to-many relationship between postcodes and districts
export const postcodeDistricts = pgTable('postcode_districts', {
  postcodeId: integer('postcode_id').references(() => postcodes.id).notNull(),
  districtId: integer('district_id').references(() => districts.id).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.postcodeId, table.districtId] }),
}));

// Define relationships
export const mpsRelations = relations(mps, ({ many }) => ({
  districts: many(districts),
}));

export const districtsRelations = relations(districts, ({ one, many }) => ({
  mp: one(mps, {
    fields: [districts.mpId],
    references: [mps.id],
  }),
  postcodeDistricts: many(postcodeDistricts),
}));

export const postcodesRelations = relations(postcodes, ({ many }) => ({
  postcodeDistricts: many(postcodeDistricts),
}));

export const postcodeDistrictsRelations = relations(postcodeDistricts, ({ one }) => ({
  postcode: one(postcodes, {
    fields: [postcodeDistricts.postcodeId],
    references: [postcodes.id],
  }),
  district: one(districts, {
    fields: [postcodeDistricts.districtId],
    references: [districts.id],
  }),
}));
