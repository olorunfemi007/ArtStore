import {
  artworks,
  customers,
  addresses,
  orders,
  drops,
  subscribers,
  collections,
  collectionArtworks,
  adminUsers,
  type Artwork,
  type InsertArtwork,
  type Customer,
  type InsertCustomer,
  type Address,
  type InsertAddress,
  type Order,
  type InsertOrder,
  type Drop,
  type InsertDrop,
  type Subscriber,
  type InsertSubscriber,
  type Collection,
  type InsertCollection,
  type AdminUser,
  type InsertAdminUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, inArray, asc } from "drizzle-orm";

export interface IStorage {
  // Artworks
  getArtworks(): Promise<Artwork[]>;
  getArtwork(id: string): Promise<Artwork | undefined>;
  createArtwork(artwork: InsertArtwork): Promise<Artwork>;
  updateArtwork(id: string, artwork: Partial<InsertArtwork>): Promise<Artwork | undefined>;
  deleteArtwork(id: string): Promise<boolean>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Addresses
  getAddressesByCustomer(customerId: string): Promise<Address[]>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: string, address: Partial<InsertAddress>): Promise<Address | undefined>;
  deleteAddress(id: string): Promise<boolean>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;

  // Drops
  getDrops(): Promise<Drop[]>;
  getDrop(id: string): Promise<Drop | undefined>;
  createDrop(drop: InsertDrop): Promise<Drop>;
  updateDrop(id: string, drop: Partial<InsertDrop>): Promise<Drop | undefined>;
  deleteDrop(id: string): Promise<boolean>;

  // Subscribers
  getSubscribers(): Promise<Subscriber[]>;
  getSubscriber(id: string): Promise<Subscriber | undefined>;
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  updateSubscriber(id: string, subscriber: Partial<InsertSubscriber>): Promise<Subscriber | undefined>;
  deleteSubscriber(id: string): Promise<boolean>;

  // Collections
  getCollections(): Promise<Collection[]>;
  getCollection(id: string): Promise<Collection | undefined>;
  getCollectionBySlug(slug: string): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: string, collection: Partial<InsertCollection>): Promise<Collection | undefined>;
  deleteCollection(id: string): Promise<boolean>;
  getCollectionArtworks(collectionId: string): Promise<Artwork[]>;
  setCollectionArtworks(collectionId: string, artworkIds: string[]): Promise<void>;

  // Admin Users
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUserLastLogin(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Artworks
  async getArtworks(): Promise<Artwork[]> {
    return await db.select().from(artworks).orderBy(desc(artworks.createdAt));
  }

  async getArtwork(id: string): Promise<Artwork | undefined> {
    const [artwork] = await db.select().from(artworks).where(eq(artworks.id, id));
    return artwork || undefined;
  }

  async createArtwork(insertArtwork: InsertArtwork): Promise<Artwork> {
    const [artwork] = await db.insert(artworks).values(insertArtwork).returning();
    return artwork;
  }

  async updateArtwork(id: string, updateData: Partial<InsertArtwork>): Promise<Artwork | undefined> {
    const [artwork] = await db
      .update(artworks)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(artworks.id, id))
      .returning();
    return artwork || undefined;
  }

  async deleteArtwork(id: string): Promise<boolean> {
    const result = await db.delete(artworks).where(eq(artworks.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.totalSpent));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async updateCustomer(id: string, updateData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();
    return customer || undefined;
  }

  // Addresses
  async getAddressesByCustomer(customerId: string): Promise<Address[]> {
    return await db.select().from(addresses).where(eq(addresses.customerId, customerId));
  }

  async createAddress(insertAddress: InsertAddress): Promise<Address> {
    const [address] = await db.insert(addresses).values(insertAddress).returning();
    return address;
  }

  async updateAddress(id: string, updateData: Partial<InsertAddress>): Promise<Address | undefined> {
    const [address] = await db
      .update(addresses)
      .set(updateData)
      .where(eq(addresses.id, id))
      .returning();
    return address || undefined;
  }

  async deleteAddress(id: string): Promise<boolean> {
    const result = await db.delete(addresses).where(eq(addresses.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    
    // Update customer stats
    const customer = await this.getCustomer(insertOrder.customerId);
    if (customer) {
      await this.updateCustomer(insertOrder.customerId, {
        totalSpent: customer.totalSpent + insertOrder.total,
        orderCount: customer.orderCount + 1,
        lastOrderDate: new Date(),
      });
    }
    
    return order;
  }

  async updateOrder(id: string, updateData: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  // Drops
  async getDrops(): Promise<Drop[]> {
    return await db.select().from(drops).orderBy(desc(drops.createdAt));
  }

  async getDrop(id: string): Promise<Drop | undefined> {
    const [drop] = await db.select().from(drops).where(eq(drops.id, id));
    return drop || undefined;
  }

  async createDrop(insertDrop: InsertDrop): Promise<Drop> {
    const [drop] = await db.insert(drops).values(insertDrop).returning();
    return drop;
  }

  async updateDrop(id: string, updateData: Partial<InsertDrop>): Promise<Drop | undefined> {
    const [drop] = await db
      .update(drops)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(drops.id, id))
      .returning();
    return drop || undefined;
  }

  async deleteDrop(id: string): Promise<boolean> {
    const result = await db.delete(drops).where(eq(drops.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Subscribers
  async getSubscribers(): Promise<Subscriber[]> {
    return await db.select().from(subscribers).orderBy(desc(subscribers.subscribedDate));
  }

  async getSubscriber(id: string): Promise<Subscriber | undefined> {
    const [subscriber] = await db.select().from(subscribers).where(eq(subscribers.id, id));
    return subscriber || undefined;
  }

  async createSubscriber(insertSubscriber: InsertSubscriber): Promise<Subscriber> {
    const [subscriber] = await db.insert(subscribers).values(insertSubscriber).returning();
    return subscriber;
  }

  async updateSubscriber(id: string, updateData: Partial<InsertSubscriber>): Promise<Subscriber | undefined> {
    const [subscriber] = await db
      .update(subscribers)
      .set(updateData)
      .where(eq(subscribers.id, id))
      .returning();
    return subscriber || undefined;
  }

  async deleteSubscriber(id: string): Promise<boolean> {
    const result = await db.delete(subscribers).where(eq(subscribers.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Collections
  async getCollections(): Promise<Collection[]> {
    return await db.select().from(collections).orderBy(desc(collections.createdAt));
  }

  async getCollection(id: string): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    return collection || undefined;
  }

  async getCollectionBySlug(slug: string): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.slug, slug));
    return collection || undefined;
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const [collection] = await db.insert(collections).values(insertCollection).returning();
    return collection;
  }

  async updateCollection(id: string, updateData: Partial<InsertCollection>): Promise<Collection | undefined> {
    const [collection] = await db
      .update(collections)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(collections.id, id))
      .returning();
    return collection || undefined;
  }

  async deleteCollection(id: string): Promise<boolean> {
    const result = await db.delete(collections).where(eq(collections.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getCollectionArtworks(collectionId: string): Promise<Artwork[]> {
    const assignments = await db
      .select()
      .from(collectionArtworks)
      .where(eq(collectionArtworks.collectionId, collectionId))
      .orderBy(asc(collectionArtworks.ordering));
    
    if (assignments.length === 0) return [];
    
    const artworkIds = assignments.map(a => a.artworkId);
    const artworkList = await db
      .select()
      .from(artworks)
      .where(inArray(artworks.id, artworkIds));
    
    const artworkMap = new Map(artworkList.map(a => [a.id, a]));
    return assignments.map(a => artworkMap.get(a.artworkId)!).filter(Boolean);
  }

  async setCollectionArtworks(collectionId: string, artworkIds: string[]): Promise<void> {
    await db.delete(collectionArtworks).where(eq(collectionArtworks.collectionId, collectionId));
    
    if (artworkIds.length > 0) {
      const values = artworkIds.map((artworkId, index) => ({
        collectionId,
        artworkId,
        ordering: index,
      }));
      await db.insert(collectionArtworks).values(values);
    }
  }

  // Admin Users
  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user || undefined;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return user || undefined;
  }

  async createAdminUser(insertUser: InsertAdminUser): Promise<AdminUser> {
    const [user] = await db.insert(adminUsers).values(insertUser).returning();
    return user;
  }

  async updateAdminUserLastLogin(id: string): Promise<void> {
    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, id));
  }
}

export const storage = new DatabaseStorage();
