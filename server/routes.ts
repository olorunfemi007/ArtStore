import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertArtworkSchema, insertCustomerSchema, insertAddressSchema, insertOrderSchema, insertDropSchema, insertSubscriberSchema, insertCollectionSchema, customers } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import session from "express-session";
import MemoryStore from "memorystore";
import { getShippingRates, calculatePackageWeight } from "./usps";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil",
});

// Password hashing using crypto (no external deps)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Auth schemas
const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Extend Express session
declare module 'express-session' {
  interface SessionData {
    customerId?: string;
    adminId?: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup session middleware
  const SessionStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'studiodrop-secret-key-change-in-prod',
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }));

  // Health check endpoint for Kubernetes probes
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password } = registerSchema.parse(req.body);
      
      // Check if email already exists
      const existing = await storage.getCustomerByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      // Hash password and create customer
      const hashedPassword = hashPassword(password);
      const customer = await storage.createCustomer({
        name,
        email,
        password: hashedPassword,
      });
      
      // Set session
      req.session.customerId = customer.id;
      
      res.status(201).json({
        id: customer.id,
        name: customer.name,
        email: customer.email,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid registration data" });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const customer = await storage.getCustomerByEmail(email);
      if (!customer || !verifyPassword(password, customer.password)) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Set session
      req.session.customerId = customer.id;
      
      res.json({
        id: customer.id,
        name: customer.name,
        email: customer.email,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid login data" });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/user", async (req, res) => {
    if (!req.session.customerId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const customer = await storage.getCustomer(req.session.customerId);
    if (!customer) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "User not found" });
    }
    
    res.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
    });
  });

  // Admin Authentication
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const admin = await storage.getAdminUserByEmail(email);
      if (!admin || !verifyPassword(password, admin.password)) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Update last login and set session
      await storage.updateAdminUserLastLogin(admin.id);
      req.session.adminId = admin.id;
      
      res.json({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid login data" });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.adminId = undefined;
    res.json({ success: true });
  });

  app.get("/api/admin/user", async (req, res) => {
    if (!req.session.adminId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const admin = await storage.getAdminUser(req.session.adminId);
    if (!admin) {
      req.session.adminId = undefined;
      return res.status(401).json({ error: "Admin not found" });
    }
    
    res.json({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });
  });

  // Seed initial admin user (for first-time setup)
  app.post("/api/admin/seed", async (req, res) => {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@studiodrop.com";
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminPassword) {
        return res.status(400).json({
          error: "ADMIN_PASSWORD environment variable must be set to seed admin user"
        });
      }
      
      // Check if any admin exists
      const existingAdmin = await storage.getAdminUserByEmail(adminEmail);
      if (existingAdmin) {
        return res.json({ message: "Admin user already exists", email: existingAdmin.email });
      }
      
      // Create admin with password from environment variable
      const hashedPassword = hashPassword(adminPassword);
      const admin = await storage.createAdminUser({
        name: "Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      });
      
      res.status(201).json({
        message: "Admin user created",
        email: admin.email,
      });
    } catch (error) {
      console.error("Failed to seed admin:", error);
      res.status(500).json({ error: "Failed to seed admin user" });
    }
  });

  // Artworks
  app.get("/api/artworks", async (req, res) => {
    try {
      const artworks = await storage.getArtworks();
      res.json(artworks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch artworks" });
    }
  });

  app.get("/api/artworks/:id", async (req, res) => {
    try {
      const artwork = await storage.getArtwork(req.params.id);
      if (!artwork) {
        return res.status(404).json({ error: "Artwork not found" });
      }
      res.json(artwork);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch artwork" });
    }
  });

  app.post("/api/artworks", async (req, res) => {
    try {
      const validatedData = insertArtworkSchema.parse(req.body);
      const artwork = await storage.createArtwork(validatedData);
      res.status(201).json(artwork);
    } catch (error) {
      res.status(400).json({ error: "Invalid artwork data" });
    }
  });

  app.patch("/api/artworks/:id", async (req, res) => {
    try {
      const artwork = await storage.updateArtwork(req.params.id, req.body);
      if (!artwork) {
        return res.status(404).json({ error: "Artwork not found" });
      }
      res.json(artwork);
    } catch (error) {
      res.status(500).json({ error: "Failed to update artwork" });
    }
  });

  app.delete("/api/artworks/:id", async (req, res) => {
    try {
      const success = await storage.deleteArtwork(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Artwork not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete artwork" });
    }
  });

  // Customers
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  // Addresses
  app.get("/api/customers/:customerId/addresses", async (req, res) => {
    try {
      const addresses = await storage.getAddressesByCustomer(req.params.customerId);
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });

  app.post("/api/addresses", async (req, res) => {
    try {
      const validatedData = insertAddressSchema.parse(req.body);
      const address = await storage.createAddress(validatedData);
      res.status(201).json(address);
    } catch (error) {
      res.status(400).json({ error: "Invalid address data" });
    }
  });

  app.patch("/api/addresses/:id", async (req, res) => {
    try {
      const address = await storage.updateAddress(req.params.id, req.body);
      if (!address) {
        return res.status(404).json({ error: "Address not found" });
      }
      res.json(address);
    } catch (error) {
      res.status(500).json({ error: "Failed to update address" });
    }
  });

  app.delete("/api/addresses/:id", async (req, res) => {
    try {
      const success = await storage.deleteAddress(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Address not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete address" });
    }
  });

  // Orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.get("/api/customers/:customerId/orders", async (req, res) => {
    try {
      const orders = await storage.getOrdersByCustomer(req.params.customerId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(400).json({ error: "Invalid order data" });
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Drops
  app.get("/api/drops", async (req, res) => {
    try {
      const drops = await storage.getDrops();
      res.json(drops);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drops" });
    }
  });

  app.get("/api/drops/:id", async (req, res) => {
    try {
      const drop = await storage.getDrop(req.params.id);
      if (!drop) {
        return res.status(404).json({ error: "Drop not found" });
      }
      res.json(drop);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drop" });
    }
  });

  app.post("/api/drops", async (req, res) => {
    try {
      const validatedData = insertDropSchema.parse(req.body);
      const drop = await storage.createDrop(validatedData);
      res.status(201).json(drop);
    } catch (error) {
      res.status(400).json({ error: "Invalid drop data" });
    }
  });

  app.patch("/api/drops/:id", async (req, res) => {
    try {
      const drop = await storage.updateDrop(req.params.id, req.body);
      if (!drop) {
        return res.status(404).json({ error: "Drop not found" });
      }
      res.json(drop);
    } catch (error) {
      res.status(500).json({ error: "Failed to update drop" });
    }
  });

  app.delete("/api/drops/:id", async (req, res) => {
    try {
      const success = await storage.deleteDrop(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Drop not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete drop" });
    }
  });

  // Subscribers
  app.get("/api/subscribers", async (req, res) => {
    try {
      const subscribers = await storage.getSubscribers();
      res.json(subscribers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscribers" });
    }
  });

  app.post("/api/subscribers", async (req, res) => {
    try {
      const validatedData = insertSubscriberSchema.parse(req.body);
      const subscriber = await storage.createSubscriber(validatedData);
      res.status(201).json(subscriber);
    } catch (error) {
      res.status(400).json({ error: "Invalid subscriber data" });
    }
  });

  app.patch("/api/subscribers/:id", async (req, res) => {
    try {
      const subscriber = await storage.updateSubscriber(req.params.id, req.body);
      if (!subscriber) {
        return res.status(404).json({ error: "Subscriber not found" });
      }
      res.json(subscriber);
    } catch (error) {
      res.status(500).json({ error: "Failed to update subscriber" });
    }
  });

  app.delete("/api/subscribers/:id", async (req, res) => {
    try {
      const success = await storage.deleteSubscriber(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Subscriber not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete subscriber" });
    }
  });

  // Collections
  app.get("/api/collections", async (req, res) => {
    try {
      const collections = await storage.getCollections();
      res.json(collections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  app.get("/api/collections/:idOrSlug", async (req, res) => {
    try {
      let collection = await storage.getCollection(req.params.idOrSlug);
      if (!collection) {
        collection = await storage.getCollectionBySlug(req.params.idOrSlug);
      }
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collection" });
    }
  });

  app.get("/api/collections/:idOrSlug/artworks", async (req, res) => {
    try {
      let collection = await storage.getCollection(req.params.idOrSlug);
      if (!collection) {
        collection = await storage.getCollectionBySlug(req.params.idOrSlug);
      }
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      const artworks = await storage.getCollectionArtworks(collection.id);
      res.json(artworks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collection artworks" });
    }
  });

  app.post("/api/collections", async (req, res) => {
    try {
      const validatedData = insertCollectionSchema.parse(req.body);
      const collection = await storage.createCollection(validatedData);
      res.status(201).json(collection);
    } catch (error) {
      res.status(400).json({ error: "Invalid collection data" });
    }
  });

  app.patch("/api/collections/:id", async (req, res) => {
    try {
      const collection = await storage.updateCollection(req.params.id, req.body);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      res.status(500).json({ error: "Failed to update collection" });
    }
  });

  app.put("/api/collections/:id/artworks", async (req, res) => {
    try {
      const { artworkIds } = req.body;
      if (!Array.isArray(artworkIds)) {
        return res.status(400).json({ error: "artworkIds must be an array" });
      }
      await storage.setCollectionArtworks(req.params.id, artworkIds);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update collection artworks" });
    }
  });

  app.delete("/api/collections/:id", async (req, res) => {
    try {
      const success = await storage.deleteCollection(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete collection" });
    }
  });

  // Shipping rates
  const shippingRateSchema = z.object({
    originZip: z.string().min(5).max(10),
    destinationZip: z.string().min(5).max(10),
    items: z.array(z.object({
      quantity: z.number().int().positive(),
    })),
  });

  app.post("/api/shipping/rates", async (req, res) => {
    try {
      const { originZip, destinationZip, items } = shippingRateSchema.parse(req.body);
      const weight = calculatePackageWeight(items);
      const rates = await getShippingRates({
        originZip,
        destinationZip,
        weight,
      });
      res.json(rates);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid shipping request data" });
      }
      res.status(500).json({ error: "Failed to calculate shipping rates" });
    }
  });

  // Stripe Payment Routes
  const createPaymentIntentSchema = z.object({
    items: z.array(z.object({
      artworkId: z.string(),
      quantity: z.number().int().positive(),
    })),
    shippingMailClass: z.string(),
    destinationZip: z.string().min(5).max(10),
    customerId: z.string().optional(),
  });

  app.post("/api/stripe/create-payment-intent", async (req, res) => {
    try {
      const { items, shippingMailClass, destinationZip, customerId } = createPaymentIntentSchema.parse(req.body);
      
      // Fetch artwork prices from database to calculate server-side total
      let subtotal = 0;
      const itemDetails: { id: string; title: string; price: number; quantity: number }[] = [];
      
      for (const item of items) {
        const artwork = await storage.getArtwork(item.artworkId);
        if (!artwork) {
          return res.status(400).json({ error: `Artwork not found: ${item.artworkId}` });
        }
        if (artwork.soldOut) {
          return res.status(400).json({ error: `Artwork sold out: ${artwork.title}` });
        }
        subtotal += artwork.price * item.quantity;
        itemDetails.push({
          id: artwork.id,
          title: artwork.title,
          price: artwork.price,
          quantity: item.quantity,
        });
      }
      
      // Recalculate shipping cost server-side using the same logic as /api/shipping/rates
      const weight = calculatePackageWeight(items);
      const shippingResponse = await getShippingRates({
        originZip: '10001',
        destinationZip,
        weight,
      });
      
      const selectedRate = shippingResponse.rates.find(r => r.mailClass === shippingMailClass);
      if (!selectedRate) {
        return res.status(400).json({ error: `Invalid shipping method: ${shippingMailClass}` });
      }
      
      const shippingCost = selectedRate.price;
      
      // Calculate tax (8%)
      const tax = Math.round(subtotal * 0.08);
      const total = subtotal + shippingCost + tax;
      
      if (total <= 0) {
        return res.status(400).json({ error: "Order total must be greater than 0" });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: {
          customerId: customerId || '',
          items: JSON.stringify(itemDetails.map(i => ({ id: i.id, qty: i.quantity }))),
          subtotal: subtotal.toString(),
          shipping: shippingCost.toString(),
          shippingMethod: selectedRate.mailClassName,
          tax: tax.toString(),
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        calculatedTotal: total,
        breakdown: {
          subtotal,
          shipping: shippingCost,
          shippingMethod: selectedRate.mailClassName,
          tax,
          total,
        },
      });
    } catch (error) {
      console.error("Stripe error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid payment request data" });
      }
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  app.get("/api/stripe/config", (req, res) => {
    res.json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  });

  return httpServer;
}
