import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const artworks = pgTable("artworks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  year: integer("year").notNull(),
  type: text("type").notNull(), // original, limited, open
  medium: text("medium").notNull(),
  surface: text("surface").notNull(),
  height: real("height").notNull(),
  width: real("width").notNull(),
  depth: real("depth"),
  unit: text("unit").notNull().default('in'), // in or cm
  price: integer("price").notNull(), // whole dollar amount (e.g., 18500 = $18,500)
  compareAtPrice: integer("compare_at_price"),
  currency: text("currency").notNull().default('USD'),
  editionSize: integer("edition_size"),
  editionRemaining: integer("edition_remaining"),
  image: text("image").notNull(),
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  description: text("description").notNull(),
  styleTags: text("style_tags").array().notNull().default(sql`ARRAY[]::text[]`),
  framed: boolean("framed").notNull().default(false),
  frameDetails: text("frame_details"),
  soldOut: boolean("sold_out").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  joinedDate: timestamp("joined_date").notNull().defaultNow(),
  totalSpent: integer("total_spent").notNull().default(0), // whole dollar amount
  orderCount: integer("order_count").notNull().default(0),
  lastOrderDate: timestamp("last_order_date"),
  status: text("status").notNull().default('active'), // active, inactive
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // shipping, billing
  address: text("address").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey(),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  shippingAddress: text("shipping_address").notNull(),
  billingAddress: text("billing_address").notNull(),
  status: text("status").notNull().default('pending'), // pending, processing, shipped, delivered, cancelled, refunded
  paymentStatus: text("payment_status").notNull().default('pending'), // paid, pending, refunded, partially_refunded
  items: jsonb("items").notNull(), // array of {id, title, image, price, quantity}
  subtotal: integer("subtotal").notNull(), // whole dollar amount
  shipping: integer("shipping").notNull().default(0),
  tax: integer("tax").notNull().default(0),
  total: integer("total").notNull(),
  trackingCarrier: text("tracking_carrier"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  timeline: jsonb("timeline").notNull().default('[]'), // array of {date, event, note}
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const drops = pgTable("drops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description").notNull(),
  startDate: text("start_date").notNull(),
  startTime: text("start_time").notNull(),
  endDate: text("end_date"),
  endTime: text("end_time"),
  hasEndDate: boolean("has_end_date").notNull().default(false),
  status: text("status").notNull().default('scheduled'), // draft, scheduled, active, ended
  featured: boolean("featured").notNull().default(false),
  artworkIds: text("artwork_ids").array().notNull().default(sql`ARRAY[]::text[]`),
  heroImage: text("hero_image"),
  notifySubscribers: boolean("notify_subscribers").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const subscribers = pgTable("subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  subscribedDate: timestamp("subscribed_date").notNull().defaultNow(),
  source: text("source").notNull().default('website'), // website, purchase, drop_launch, exhibition
  status: text("status").notNull().default('subscribed'), // subscribed, unsubscribed
  customerId: varchar("customer_id").references(() => customers.id),
});

export const collections = pgTable("collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  heroImage: text("hero_image"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const collectionArtworks = pgTable("collection_artworks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id").notNull().references(() => collections.id, { onDelete: 'cascade' }),
  artworkId: varchar("artwork_id").notNull().references(() => artworks.id, { onDelete: 'cascade' }),
  ordering: integer("ordering").notNull().default(0),
});

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default('admin'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const insertArtworkSchema = createInsertSchema(artworks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export const insertAddressSchema = createInsertSchema(addresses).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ createdAt: true, updatedAt: true });
export const insertDropSchema = createInsertSchema(drops).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubscriberSchema = createInsertSchema(subscribers).omit({ id: true, subscribedDate: true });
export const insertCollectionSchema = createInsertSchema(collections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({ id: true, createdAt: true, lastLoginAt: true });

export type InsertArtwork = z.infer<typeof insertArtworkSchema>;
export type Artwork = typeof artworks.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Address = typeof addresses.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertDrop = z.infer<typeof insertDropSchema>;
export type Drop = typeof drops.$inferSelect;

export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type Subscriber = typeof subscribers.$inferSelect;

export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;
export type CollectionArtwork = typeof collectionArtworks.$inferSelect;

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
