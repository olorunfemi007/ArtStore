import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { User, Package, Heart, MapPin, LogOut, X, Plus } from 'lucide-react';
import { formatPrice } from '@/lib/mockData';
import { useAuth } from '@/hooks/use-auth';
import { useCustomerAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress, useCustomerOrders } from '@/lib/hooks';
import { useToast } from '@/hooks/use-toast';
import type { Address as DBAddress } from '@shared/schema';

type Tab = 'orders' | 'wishlist' | 'addresses' | 'settings';

interface AddressFormData {
  name: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

const mockWishlist: any[] = [];

const emptyFormData: AddressFormData = {
  name: '',
  firstName: '',
  lastName: '',
  address: '',
  apartment: '',
  city: '',
  state: '',
  zip: '',
  country: 'United States',
  phone: '',
  isDefault: false,
};

function parseAddressData(addressStr: string): Omit<AddressFormData, 'isDefault'> {
  try {
    return JSON.parse(addressStr);
  } catch {
    return { ...emptyFormData, address: addressStr };
  }
}

function serializeAddressData(data: Omit<AddressFormData, 'isDefault'>): string {
  return JSON.stringify(data);
}

export function Account() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { toast } = useToast();
  
  const { data: savedAddresses, isLoading: addressesLoading } = useCustomerAddresses(user?.id);
  const { data: orders = [], isLoading: ordersLoading } = useCustomerOrders(user?.id);
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  
  const [activeTab, setActiveTab] = useState<Tab>('addresses');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(emptyFormData);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const tabs = [
    { id: 'orders' as Tab, label: 'Orders', icon: Package },
    { id: 'wishlist' as Tab, label: 'Wishlist', icon: Heart },
    { id: 'addresses' as Tab, label: 'Addresses', icon: MapPin },
    { id: 'settings' as Tab, label: 'Settings', icon: User },
  ];

  const openAddModal = () => {
    setEditingAddressId(null);
    setFormData(emptyFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (address: DBAddress) => {
    setEditingAddressId(address.id);
    const parsed = parseAddressData(address.address);
    setFormData({
      ...parsed,
      isDefault: address.isDefault ?? false,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddressId(null);
    setFormData(emptyFormData);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    const addressData = serializeAddressData({
      name: formData.name,
      firstName: formData.firstName,
      lastName: formData.lastName,
      address: formData.address,
      apartment: formData.apartment,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      country: formData.country,
      phone: formData.phone,
    });

    try {
      if (editingAddressId) {
        if (formData.isDefault) {
          const currentDefault = savedAddresses?.find(a => a.isDefault && a.id !== editingAddressId);
          if (currentDefault) {
            await updateAddress.mutateAsync({ id: currentDefault.id, data: { isDefault: false } });
          }
        }
        await updateAddress.mutateAsync({
          id: editingAddressId,
          data: { address: addressData, isDefault: formData.isDefault },
        });
        toast({ title: 'Address updated' });
      } else {
        if (formData.isDefault) {
          const currentDefault = savedAddresses?.find(a => a.isDefault);
          if (currentDefault) {
            await updateAddress.mutateAsync({ id: currentDefault.id, data: { isDefault: false } });
          }
        }
        await createAddress.mutateAsync({
          customerId: user.id,
          type: 'shipping',
          address: addressData,
          isDefault: formData.isDefault,
        });
        toast({ title: 'Address added' });
      }
      closeModal();
    } catch {
      toast({ title: 'Failed to save address', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAddress.mutateAsync(id);
      toast({ title: 'Address deleted' });
      setDeleteConfirm(null);
    } catch {
      toast({ title: 'Failed to delete address', variant: 'destructive' });
    }
  };

  const setAsDefault = async (id: string) => {
    try {
      const currentDefault = savedAddresses?.find(a => a.isDefault);
      if (currentDefault) {
        await updateAddress.mutateAsync({ id: currentDefault.id, data: { isDefault: false } });
      }
      await updateAddress.mutateAsync({ id, data: { isDefault: true } });
      toast({ title: 'Default address updated' });
    } catch {
      toast({ title: 'Failed to update default address', variant: 'destructive' });
    }
  };

  const addresses = savedAddresses || [];

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-24">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-display text-4xl font-semibold mb-2">MY ACCOUNT</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name || 'Collector'}</p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-12">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-foreground text-background'
                    : 'hover:bg-accent'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm tracking-wide">{tab.label.toUpperCase()}</span>
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm tracking-wide">SIGN OUT</span>
            </button>
          </nav>

          <div className="md:col-span-3">
            {activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h2 className="text-display text-2xl font-semibold mb-8">ORDER HISTORY</h2>
                
                {ordersLoading ? (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16 border border-border">
                    <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No orders yet</p>
                    <Link href="/collections">
                      <span className="link-underline">Start Shopping</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-border p-6"
                        data-testid={`order-${order.id}`}
                      >
                        <div className="flex flex-wrap justify-between gap-4 mb-6 pb-6 border-b border-border">
                          <div>
                            <p className="text-sm text-muted-foreground">Order</p>
                            <p className="font-medium text-xs">{order.id.slice(0, 20)}...</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Date</p>
                            <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className={`capitalize ${order.status === 'delivered' ? 'text-green-600' : ''}`}>
                              {order.status}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="font-medium">{formatPrice(order.total)}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                          {(order.items as any[]).map((item: any) => (
                            <div key={item.id} className="flex gap-4">
                              <div className="w-20 h-24 bg-muted overflow-hidden">
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'wishlist' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h2 className="text-display text-2xl font-semibold mb-8">WISHLIST</h2>
                
                {mockWishlist.length === 0 ? (
                  <div className="text-center py-16 border border-border">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
                    <Link href="/collections">
                      <span className="link-underline">Browse Collections</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {mockWishlist.map((artwork) => (
                      <Link key={artwork.id} href={`/artwork/${artwork.id}`}>
                        <div className="group cursor-pointer" data-testid={`wishlist-${artwork.id}`}>
                          <div className="aspect-[3/4] bg-muted overflow-hidden mb-4">
                            <img
                              src={artwork.image}
                              alt={artwork.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <h3 className="text-display font-medium">{artwork.title}</h3>
                          <p className="text-sm text-muted-foreground">{artwork.medium}</p>
                          <p className="text-sm mt-1">{formatPrice(artwork.price)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'addresses' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-display text-2xl font-semibold">SAVED ADDRESSES</h2>
                  <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 text-sm bg-foreground text-background px-4 py-2 hover:opacity-90 transition-opacity"
                    data-testid="button-add-address"
                  >
                    <Plus className="w-4 h-4" />
                    ADD NEW
                  </button>
                </div>
                
                {addressesLoading ? (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">Loading addresses...</p>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-16 border border-border border-dashed">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No saved addresses</p>
                    <button
                      onClick={openAddModal}
                      className="link-underline"
                    >
                      Add your first address
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {addresses.map((address) => {
                      const parsed = parseAddressData(address.address);
                      return (
                        <motion.div
                          key={address.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`border p-6 transition-colors ${
                            address.isDefault ? 'border-foreground' : 'border-border'
                          }`}
                          data-testid={`address-${address.id}`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="font-medium text-display">{parsed.name || 'Address'}</p>
                              {address.isDefault && (
                                <span className="text-xs text-muted-foreground">Default address</span>
                              )}
                            </div>
                            {address.isDefault && (
                              <span className="text-xs bg-foreground text-background px-2 py-1">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1 mb-6">
                            <p>{parsed.firstName} {parsed.lastName}</p>
                            <p>{parsed.address}</p>
                            {parsed.apartment && <p>{parsed.apartment}</p>}
                            <p>{parsed.city}, {parsed.state} {parsed.zip}</p>
                            <p>{parsed.country}</p>
                            {parsed.phone && <p className="pt-2">{parsed.phone}</p>}
                          </div>

                          <div className="flex items-center gap-4 pt-4 border-t border-border">
                            <button
                              onClick={() => openEditModal(address)}
                              className="text-sm link-underline"
                              data-testid={`button-edit-${address.id}`}
                            >
                              Edit
                            </button>
                            {!address.isDefault && (
                              <button
                                onClick={() => setAsDefault(address.id)}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                data-testid={`button-default-${address.id}`}
                              >
                                Set as default
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteConfirm(address.id)}
                              className="text-sm text-muted-foreground hover:text-red-600 transition-colors ml-auto"
                              data-testid={`button-delete-${address.id}`}
                            >
                              Delete
                            </button>
                          </div>

                          <AnimatePresence>
                            {deleteConfirm === address.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 pt-4 border-t border-border">
                                  <p className="text-sm text-muted-foreground mb-3">
                                    Are you sure you want to delete this address?
                                  </p>
                                  <div className="flex gap-3">
                                    <button
                                      onClick={() => handleDelete(address.id)}
                                      className="text-sm bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition-colors"
                                      data-testid={`button-confirm-delete-${address.id}`}
                                    >
                                      Delete
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm(null)}
                                      className="text-sm border border-border px-4 py-2 hover:bg-accent transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h2 className="text-display text-2xl font-semibold mb-8">ACCOUNT SETTINGS</h2>
                
                <div className="space-y-8">
                  <div className="border-b border-border pb-8">
                    <h3 className="font-medium mb-4">Personal Information</h3>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">
                        NAME
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.name || ''}
                        className="w-full md:w-1/2 border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="border-b border-border pb-8">
                    <h3 className="font-medium mb-4">Email</h3>
                    <input
                      type="email"
                      defaultValue={user?.email || ''}
                      className="w-full md:w-1/2 border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground mt-2">Email cannot be changed</p>
                  </div>

                  <div>
                    <h3 className="font-medium mb-4">Newsletter</h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-5 h-5 border border-border"
                      />
                      <span className="text-sm">
                        Receive updates about new drops and exhibitions
                      </span>
                    </label>
                  </div>

                  <button
                    className="bg-foreground text-background px-8 py-3 text-sm tracking-wide hover:opacity-90 transition-opacity"
                    data-testid="button-save-settings"
                  >
                    SAVE CHANGES
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={closeModal}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-background border border-border w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
                <h2 className="text-display text-xl font-semibold">
                  {editingAddressId ? 'EDIT ADDRESS' : 'ADD NEW ADDRESS'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-accent transition-colors"
                  data-testid="button-close-modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    ADDRESS LABEL
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Home, Office, Studio"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                    data-testid="input-address-label"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">
                      FIRST NAME
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">
                      LAST NAME
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                      data-testid="input-last-name"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    STREET ADDRESS
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                    data-testid="input-street-address"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    APARTMENT, SUITE, ETC. (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={formData.apartment}
                    onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                    className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                    data-testid="input-apartment"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">
                      CITY
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                      data-testid="input-city"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">
                      STATE / PROVINCE
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                      data-testid="input-state"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">
                      ZIP / POSTAL CODE
                    </label>
                    <input
                      type="text"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                      data-testid="input-zip"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">
                      COUNTRY
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                      data-testid="input-country"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    PHONE NUMBER
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                    data-testid="input-phone"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-5 h-5 accent-foreground"
                    data-testid="checkbox-default"
                  />
                  <span className="text-sm">Set as default address</span>
                </label>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={createAddress.isPending || updateAddress.isPending}
                    className="flex-1 bg-foreground text-background py-3 text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
                    data-testid="button-save-address"
                  >
                    {createAddress.isPending || updateAddress.isPending ? 'SAVING...' : 'SAVE ADDRESS'}
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-6 py-3 border border-border text-sm tracking-wide hover:bg-accent transition-colors"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
