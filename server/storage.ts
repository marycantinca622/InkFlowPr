import {
  users,
  artists,
  clients,
  appointments,
  inventory,
  sales,
  type User,
  type UpsertUser,
  type Artist,
  type InsertArtist,
  type Client,
  type InsertClient,
  type Appointment,
  type InsertAppointment,
  type AppointmentWithRelations,
  type InventoryItem,
  type InsertInventory,
  type Sale,
  type InsertSale,
  type SaleWithRelations,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, gte, lte, sql, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Artist operations
  getArtists(): Promise<Artist[]>;
  getArtist(id: string): Promise<Artist | undefined>;
  createArtist(artist: InsertArtist): Promise<Artist>;
  updateArtist(id: string, updates: Partial<InsertArtist>): Promise<Artist>;
  deleteArtist(id: string): Promise<void>;

  // Client operations
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  searchClients(query: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, updates: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;

  // Appointment operations
  getAppointments(): Promise<AppointmentWithRelations[]>;
  getAppointment(id: string): Promise<AppointmentWithRelations | undefined>;
  getAppointmentsByDate(date: Date): Promise<AppointmentWithRelations[]>;
  getAppointmentsByArtist(artistId: string): Promise<AppointmentWithRelations[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment>;
  deleteAppointment(id: string): Promise<void>;

  // Inventory operations
  getInventory(): Promise<InventoryItem[]>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  getLowStockItems(): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventory): Promise<InventoryItem>;
  updateInventoryItem(id: string, updates: Partial<InsertInventory>): Promise<InventoryItem>;
  deleteInventoryItem(id: string): Promise<void>;

  // Sales operations
  getSales(): Promise<SaleWithRelations[]>;
  getSale(id: string): Promise<SaleWithRelations | undefined>;
  getSalesByDateRange(startDate: Date, endDate: Date): Promise<SaleWithRelations[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  updateSale(id: string, updates: Partial<InsertSale>): Promise<Sale>;
  deleteSale(id: string): Promise<void>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    todayAppointments: number;
    monthlyRevenue: number;
    activeArtists: number;
    lowStockItems: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Artist operations
  async getArtists(): Promise<Artist[]> {
    return await db.select().from(artists).orderBy(asc(artists.name));
  }

  async getArtist(id: string): Promise<Artist | undefined> {
    const [artist] = await db.select().from(artists).where(eq(artists.id, id));
    return artist;
  }

  async createArtist(artist: InsertArtist): Promise<Artist> {
    const [newArtist] = await db.insert(artists).values(artist).returning();
    return newArtist;
  }

  async updateArtist(id: string, updates: Partial<InsertArtist>): Promise<Artist> {
    const [updatedArtist] = await db
      .update(artists)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(artists.id, id))
      .returning();
    return updatedArtist;
  }

  async deleteArtist(id: string): Promise<void> {
    await db.delete(artists).where(eq(artists.id, id));
  }

  // Client operations
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(asc(clients.lastName), asc(clients.firstName));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async searchClients(query: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(
        sql`LOWER(${clients.firstName}) LIKE LOWER(${`%${query}%`}) OR LOWER(${clients.lastName}) LIKE LOWER(${`%${query}%`}) OR LOWER(${clients.email}) LIKE LOWER(${`%${query}%`})`
      )
      .orderBy(asc(clients.lastName), asc(clients.firstName));
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: string, updates: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Appointment operations
  async getAppointments(): Promise<AppointmentWithRelations[]> {
    return await db
      .select()
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(artists, eq(appointments.artistId, artists.id))
      .orderBy(desc(appointments.scheduledDate))
      .then(rows => 
        rows.map(row => ({
          ...row.appointments,
          client: row.clients!,
          artist: row.artists!,
        }))
      );
  }

  async getAppointment(id: string): Promise<AppointmentWithRelations | undefined> {
    const [row] = await db
      .select()
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(artists, eq(appointments.artistId, artists.id))
      .where(eq(appointments.id, id));
    
    if (!row) return undefined;
    
    return {
      ...row.appointments,
      client: row.clients!,
      artist: row.artists!,
    };
  }

  async getAppointmentsByDate(date: Date): Promise<AppointmentWithRelations[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(artists, eq(appointments.artistId, artists.id))
      .where(
        and(
          gte(appointments.scheduledDate, startOfDay),
          lte(appointments.scheduledDate, endOfDay)
        )
      )
      .orderBy(asc(appointments.scheduledDate))
      .then(rows => 
        rows.map(row => ({
          ...row.appointments,
          client: row.clients!,
          artist: row.artists!,
        }))
      );
  }

  async getAppointmentsByArtist(artistId: string): Promise<AppointmentWithRelations[]> {
    return await db
      .select()
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(artists, eq(appointments.artistId, artists.id))
      .where(eq(appointments.artistId, artistId))
      .orderBy(desc(appointments.scheduledDate))
      .then(rows => 
        rows.map(row => ({
          ...row.appointments,
          client: row.clients!,
          artist: row.artists!,
        }))
      );
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async deleteAppointment(id: string): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  // Inventory operations
  async getInventory(): Promise<InventoryItem[]> {
    return await db.select().from(inventory).orderBy(asc(inventory.name));
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    return item;
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return await db
      .select()
      .from(inventory)
      .where(sql`${inventory.currentStock} <= ${inventory.minLevel}`)
      .orderBy(asc(inventory.name));
  }

  async createInventoryItem(item: InsertInventory): Promise<InventoryItem> {
    const [newItem] = await db.insert(inventory).values(item).returning();
    return newItem;
  }

  async updateInventoryItem(id: string, updates: Partial<InsertInventory>): Promise<InventoryItem> {
    const [updatedItem] = await db
      .update(inventory)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(inventory.id, id))
      .returning();
    return updatedItem;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    await db.delete(inventory).where(eq(inventory.id, id));
  }

  // Sales operations
  async getSales(): Promise<SaleWithRelations[]> {
    return await db
      .select()
      .from(sales)
      .leftJoin(clients, eq(sales.clientId, clients.id))
      .leftJoin(artists, eq(sales.artistId, artists.id))
      .leftJoin(appointments, eq(sales.appointmentId, appointments.id))
      .orderBy(desc(sales.saleDate))
      .then(rows => 
        rows.map(row => ({
          ...row.sales,
          client: row.clients!,
          artist: row.artists!,
          appointment: row.appointments || undefined,
        }))
      );
  }

  async getSale(id: string): Promise<SaleWithRelations | undefined> {
    const [row] = await db
      .select()
      .from(sales)
      .leftJoin(clients, eq(sales.clientId, clients.id))
      .leftJoin(artists, eq(sales.artistId, artists.id))
      .leftJoin(appointments, eq(sales.appointmentId, appointments.id))
      .where(eq(sales.id, id));
    
    if (!row) return undefined;
    
    return {
      ...row.sales,
      client: row.clients!,
      artist: row.artists!,
      appointment: row.appointments || undefined,
    };
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<SaleWithRelations[]> {
    return await db
      .select()
      .from(sales)
      .leftJoin(clients, eq(sales.clientId, clients.id))
      .leftJoin(artists, eq(sales.artistId, artists.id))
      .leftJoin(appointments, eq(sales.appointmentId, appointments.id))
      .where(
        and(
          gte(sales.saleDate, startDate),
          lte(sales.saleDate, endDate)
        )
      )
      .orderBy(desc(sales.saleDate))
      .then(rows => 
        rows.map(row => ({
          ...row.sales,
          client: row.clients!,
          artist: row.artists!,
          appointment: row.appointments || undefined,
        }))
      );
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const [newSale] = await db.insert(sales).values(sale).returning();
    return newSale;
  }

  async updateSale(id: string, updates: Partial<InsertSale>): Promise<Sale> {
    const [updatedSale] = await db
      .update(sales)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sales.id, id))
      .returning();
    return updatedSale;
  }

  async deleteSale(id: string): Promise<void> {
    await db.delete(sales).where(eq(sales.id, id));
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    todayAppointments: number;
    monthlyRevenue: number;
    activeArtists: number;
    lowStockItems: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [todayAppointmentsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          gte(appointments.scheduledDate, today),
          lte(appointments.scheduledDate, tomorrow)
        )
      );

    const [monthlyRevenueResult] = await db
      .select({ sum: sql<number>`COALESCE(sum(${sales.totalAmount}), 0)` })
      .from(sales)
      .where(
        and(
          gte(sales.saleDate, startOfMonth),
          lte(sales.saleDate, endOfMonth)
        )
      );

    const [activeArtistsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(artists)
      .where(eq(artists.isActive, true));

    const [lowStockItemsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(inventory)
      .where(sql`${inventory.currentStock} <= ${inventory.minLevel}`);

    return {
      todayAppointments: todayAppointmentsResult.count,
      monthlyRevenue: Number(monthlyRevenueResult.sum),
      activeArtists: activeArtistsResult.count,
      lowStockItems: lowStockItemsResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
