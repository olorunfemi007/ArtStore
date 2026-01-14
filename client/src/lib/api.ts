import type { Artwork, Customer, Order, Drop, Subscriber, Collection, Address, InsertArtwork, InsertCustomer, InsertOrder, InsertDrop, InsertSubscriber, InsertCollection, InsertAddress } from "@shared/schema";

const API_BASE = "/api";

async function fetchJSON(url: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const artworksAPI = {
  getAll: () => fetchJSON("/artworks") as Promise<Artwork[]>,
  getById: (id: string) => fetchJSON(`/artworks/${id}`) as Promise<Artwork>,
  create: (data: InsertArtwork) => fetchJSON("/artworks", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<Artwork>,
  update: (id: string, data: Partial<InsertArtwork>) => fetchJSON(`/artworks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }) as Promise<Artwork>,
  delete: (id: string) => fetchJSON(`/artworks/${id}`, {
    method: "DELETE",
  }),
};

export const customersAPI = {
  getAll: () => fetchJSON("/customers") as Promise<Customer[]>,
  getById: (id: string) => fetchJSON(`/customers/${id}`) as Promise<Customer>,
  create: (data: InsertCustomer) => fetchJSON("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<Customer>,
  update: (id: string, data: Partial<InsertCustomer>) => fetchJSON(`/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }) as Promise<Customer>,
};

export const ordersAPI = {
  getAll: () => fetchJSON("/orders") as Promise<Order[]>,
  getById: (id: string) => fetchJSON(`/orders/${id}`) as Promise<Order>,
  getByCustomer: (customerId: string) => fetchJSON(`/customers/${customerId}/orders`) as Promise<Order[]>,
  create: (data: InsertOrder) => fetchJSON("/orders", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<Order>,
  update: (id: string, data: Partial<InsertOrder>) => fetchJSON(`/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }) as Promise<Order>,
};

export const dropsAPI = {
  getAll: () => fetchJSON("/drops") as Promise<Drop[]>,
  getById: (id: string) => fetchJSON(`/drops/${id}`) as Promise<Drop>,
  create: (data: InsertDrop) => fetchJSON("/drops", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<Drop>,
  update: (id: string, data: Partial<InsertDrop>) => fetchJSON(`/drops/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }) as Promise<Drop>,
  delete: (id: string) => fetchJSON(`/drops/${id}`, {
    method: "DELETE",
  }),
};

export const subscribersAPI = {
  getAll: () => fetchJSON("/subscribers") as Promise<Subscriber[]>,
  create: (data: InsertSubscriber) => fetchJSON("/subscribers", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<Subscriber>,
  update: (id: string, data: Partial<InsertSubscriber>) => fetchJSON(`/subscribers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }) as Promise<Subscriber>,
  delete: (id: string) => fetchJSON(`/subscribers/${id}`, {
    method: "DELETE",
  }),
};

export const addressesAPI = {
  getByCustomer: (customerId: string) => fetchJSON(`/customers/${customerId}/addresses`) as Promise<Address[]>,
  create: (data: InsertAddress) => fetchJSON("/addresses", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<Address>,
  update: (id: string, data: Partial<InsertAddress>) => fetchJSON(`/addresses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }) as Promise<Address>,
  delete: (id: string) => fetchJSON(`/addresses/${id}`, {
    method: "DELETE",
  }),
};

export const collectionsAPI = {
  getAll: () => fetchJSON("/collections") as Promise<Collection[]>,
  getBySlug: (slug: string) => fetchJSON(`/collections/${slug}`) as Promise<Collection>,
  getArtworks: (idOrSlug: string) => fetchJSON(`/collections/${idOrSlug}/artworks`) as Promise<Artwork[]>,
  create: (data: InsertCollection) => fetchJSON("/collections", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<Collection>,
  update: (id: string, data: Partial<InsertCollection>) => fetchJSON(`/collections/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }) as Promise<Collection>,
  setArtworks: (id: string, artworkIds: string[]) => fetchJSON(`/collections/${id}/artworks`, {
    method: "PUT",
    body: JSON.stringify({ artworkIds }),
  }),
  delete: (id: string) => fetchJSON(`/collections/${id}`, {
    method: "DELETE",
  }),
};

export interface ShippingRate {
  mailClass: string;
  mailClassName: string;
  price: number;
  deliveryDays: number | null;
  deliveryDate: string | null;
}

export interface ShippingRatesResponse {
  rates: ShippingRate[];
  error?: string;
}

export const shippingAPI = {
  getRates: (data: { originZip: string; destinationZip: string; items: Array<{ quantity: number }> }) =>
    fetchJSON("/shipping/rates", {
      method: "POST",
      body: JSON.stringify(data),
    }) as Promise<ShippingRatesResponse>,
};

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const adminAuthAPI = {
  login: (data: { email: string; password: string }) =>
    fetchJSON("/admin/login", {
      method: "POST",
      body: JSON.stringify(data),
    }) as Promise<AdminUser>,
  logout: () =>
    fetchJSON("/admin/logout", {
      method: "POST",
    }) as Promise<{ success: boolean }>,
  getUser: () =>
    fetchJSON("/admin/user") as Promise<AdminUser>,
};
