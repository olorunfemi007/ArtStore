import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { artworksAPI, customersAPI, ordersAPI, dropsAPI, subscribersAPI, collectionsAPI, addressesAPI } from "./api";
import type { InsertArtwork, InsertCustomer, InsertOrder, InsertDrop, InsertSubscriber, InsertCollection, InsertAddress } from "@shared/schema";

export function useArtworks() {
  return useQuery({
    queryKey: ["artworks"],
    queryFn: artworksAPI.getAll,
  });
}

export function useArtwork(id: string | undefined) {
  return useQuery({
    queryKey: ["artworks", id],
    queryFn: () => artworksAPI.getById(id!),
    enabled: !!id,
  });
}

export function useCreateArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertArtwork) => artworksAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artworks"] });
    },
  });
}

export function useUpdateArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertArtwork> }) =>
      artworksAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artworks"] });
    },
  });
}

export function useDeleteArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => artworksAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artworks"] });
    },
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: customersAPI.getAll,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => customersAPI.getById(id!),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertCustomer) => customersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertCustomer> }) =>
      customersAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: ordersAPI.getAll,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => ordersAPI.getById(id!),
    enabled: !!id,
  });
}

export function useCustomerOrders(customerId: string | undefined) {
  return useQuery({
    queryKey: ["orders", "customer", customerId],
    queryFn: () => ordersAPI.getByCustomer(customerId!),
    enabled: !!customerId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertOrder) => ordersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertOrder> }) =>
      ordersAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useDrops() {
  return useQuery({
    queryKey: ["drops"],
    queryFn: dropsAPI.getAll,
  });
}

export function useDrop(id: string | undefined) {
  return useQuery({
    queryKey: ["drops", id],
    queryFn: () => dropsAPI.getById(id!),
    enabled: !!id,
  });
}

export function useCreateDrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertDrop) => dropsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drops"] });
    },
  });
}

export function useUpdateDrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertDrop> }) =>
      dropsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drops"] });
    },
  });
}

export function useDeleteDrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dropsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drops"] });
    },
  });
}

export function useSubscribers() {
  return useQuery({
    queryKey: ["subscribers"],
    queryFn: subscribersAPI.getAll,
  });
}

export function useCreateSubscriber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertSubscriber) => subscribersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscribers"] });
    },
  });
}

export function useUpdateSubscriber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertSubscriber> }) =>
      subscribersAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscribers"] });
    },
  });
}

export function useDeleteSubscriber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscribersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscribers"] });
    },
  });
}

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: collectionsAPI.getAll,
  });
}

export function useCollection(slug: string | undefined) {
  return useQuery({
    queryKey: ["collections", slug],
    queryFn: () => collectionsAPI.getBySlug(slug!),
    enabled: !!slug,
  });
}

export function useCollectionArtworks(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ["collections", idOrSlug, "artworks"],
    queryFn: () => collectionsAPI.getArtworks(idOrSlug!),
    enabled: !!idOrSlug,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertCollection) => collectionsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertCollection> }) =>
      collectionsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useSetCollectionArtworks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, artworkIds }: { id: string; artworkIds: string[] }) =>
      collectionsAPI.setArtworks(id, artworkIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => collectionsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useCustomerAddresses(customerId: string | undefined) {
  return useQuery({
    queryKey: ["addresses", customerId],
    queryFn: () => addressesAPI.getByCustomer(customerId!),
    enabled: !!customerId,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertAddress) => addressesAPI.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["addresses", variables.customerId] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertAddress> }) =>
      addressesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}
