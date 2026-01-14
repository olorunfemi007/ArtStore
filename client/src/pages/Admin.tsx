import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Image, 
  Package, 
  Users, 
  Calendar,
  Settings,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Clock,
  X,
  Upload,
  ImagePlus,
  Check,
  CalendarDays,
  Zap,
  Eye,
  EyeOff,
  LogOut,
  Loader2
} from 'lucide-react';
import { formatPrice } from '@/lib/mockData';
import { useArtworks, useCreateArtwork, useUpdateArtwork, useDeleteArtwork, useOrders, useCustomers, useDrops, useCreateDrop, useUpdateDrop, useDeleteDrop, useSubscribers, useCollections, useCreateCollection, useUpdateCollection, useDeleteCollection, useSetCollectionArtworks, useCollectionArtworks } from '@/lib/hooks';
import type { Artwork, Drop, Order, Customer, Subscriber, Collection } from '@shared/schema';
import { Layers } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { adminAuthAPI, type AdminUser } from '@/lib/api';

type Tab = 'dashboard' | 'artworks' | 'collections' | 'orders' | 'drops' | 'customers' | 'settings';

interface ArtworkFormData {
  title: string;
  medium: string;
  surface: string;
  year: number;
  height: number;
  width: number;
  depth: number | undefined;
  unit: 'in' | 'cm';
  price: number;
  compareAtPrice: number | undefined;
  type: 'original' | 'limited' | 'open';
  editionSize: number | undefined;
  editionRemaining: number | undefined;
  description: string;
  styleTags: string[];
  image: string;
  framed: boolean;
  frameDetails: string;
  soldOut: boolean;
  featured: boolean;
}

interface DropFormData {
  title: string;
  subtitle: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  hasEndDate: boolean;
  featured: boolean;
  artworkIds: string[];
  heroImage: string;
  notifySubscribers: boolean;
}

const emptyArtwork: ArtworkFormData = {
  title: '',
  medium: '',
  surface: 'Canvas',
  year: new Date().getFullYear(),
  height: 0,
  width: 0,
  depth: undefined,
  unit: 'in',
  price: 0,
  compareAtPrice: undefined,
  type: 'original',
  editionSize: undefined,
  editionRemaining: undefined,
  description: '',
  styleTags: [],
  image: '',
  framed: false,
  frameDetails: '',
  soldOut: false,
  featured: false,
};

const emptyDrop: DropFormData = {
  title: '',
  subtitle: '',
  description: '',
  startDate: '',
  startTime: '12:00',
  endDate: '',
  endTime: '23:59',
  hasEndDate: false,
  featured: true,
  artworkIds: [],
  heroImage: '',
  notifySubscribers: true,
};

const availableTags = ['Abstract', 'Minimalist', 'Geometric', 'Textural', 'Monochrome', 'Bold', 'Serene', 'Dynamic', 'Gestural', 'Zen'];

function formatDimensions(dimensions: { height: number; width: number; depth?: number; unit: 'in' | 'cm' }): string {
  const { height, width, depth, unit } = dimensions;
  if (depth) {
    return `${height}" × ${width}" × ${depth}"`;
  }
  return `${height}" × ${width}"`;
}

function getDropStatus(drop: Drop): 'draft' | 'scheduled' | 'active' | 'ended' {
  const now = new Date();
  const start = new Date(`${drop.startDate}T${drop.startTime}`);
  const end = drop.hasEndDate && drop.endDate && drop.endTime 
    ? new Date(`${drop.endDate}T${drop.endTime}`) 
    : null;
  
  if (now < start) return 'scheduled';
  if (end && now > end) return 'ended';
  if (now >= start) return 'active';
  return 'draft';
}

function formatDropDate(dateStr: string | null | undefined, timeStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T${timeStr || '00:00'}`);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

import { Mail, ArrowLeft, MapPin, Phone, Tag, FileText, ChevronRight, Truck, RotateCcw, Printer, Copy, ExternalLink, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

type OrderItem = { id: string; title: string; image: string; price: number; quantity: number };
type TimelineEvent = { date: string; event: string; note?: string };

function OrdersTab({ initialOrderId, onClearSelection }: { initialOrderId: string | null; onClearSelection: () => void }) {
  const { data: ordersData, isLoading: ordersLoading } = useOrders();
  const orders = ordersData || [];
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(
    initialOrderId && ordersData ? ordersData.find((o) => o.id === initialOrderId) || null : null
  );
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [trackingCarrier, setTrackingCarrier] = useState('FedEx');
  const [trackingNumber, setTrackingNumber] = useState('');

  const statusCounts = {
    All: orders.length,
    Pending: orders.filter((o) => o.status === 'pending').length,
    Processing: orders.filter((o) => o.status === 'processing').length,
    Shipped: orders.filter((o) => o.status === 'shipped').length,
    Delivered: orders.filter((o) => o.status === 'delivered').length,
  };

  const filteredOrders = statusFilter === 'All' 
    ? orders 
    : orders.filter((o) => o.status === statusFilter.toLowerCase());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-muted';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'refunded': return 'text-gray-600';
      case 'partially_refunded': return 'text-orange-600';
      default: return '';
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) =>
        prev ? { ...prev, status: newStatus } : null
      );
    }
  };

  const handleAddTracking = () => {
    if (!selectedOrder || !trackingNumber) return;
    
    const trackingUrl = trackingCarrier === 'FedEx' 
      ? `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`
      : trackingCarrier === 'UPS'
      ? `https://www.ups.com/track?tracknum=${trackingNumber}`
      : `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;

    setSelectedOrder((prev) =>
      prev
        ? {
            ...prev,
            status: 'shipped',
            trackingCarrier: trackingCarrier,
            trackingNumber: trackingNumber,
            trackingUrl: trackingUrl,
          }
        : null
    );
    setShowShippingModal(false);
    setTrackingNumber('');
  };

  const handleRefund = () => {
    if (!selectedOrder) return;
    
    const amount = parseFloat(refundAmount) || selectedOrder.total;
    const isFullRefund = amount >= selectedOrder.total;

    setSelectedOrder((prev) =>
      prev
        ? { ...prev, status: 'refunded', paymentStatus: isFullRefund ? 'refunded' : 'partially_refunded' }
        : null
    );
    setShowRefundModal(false);
    setRefundAmount('');
    setRefundReason('');
  };

  if (selectedOrder) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <button
          onClick={() => {
            setSelectedOrder(null);
            onClearSelection();
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-display text-2xl font-semibold">{selectedOrder.id}</h2>
            <p className="text-muted-foreground">
              {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1.5 uppercase ${getStatusColor(selectedOrder.status)}`}>
              {selectedOrder.status}
            </span>
            <select
              value={selectedOrder.status}
              onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value as Order['status'])}
              className="border border-border bg-transparent px-3 py-1.5 text-sm"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-background border border-border">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">Items</h3>
                <span className="text-sm text-muted-foreground">{(selectedOrder.items as OrderItem[]).length} item(s)</span>
              </div>
              <div className="divide-y divide-border">
                {(selectedOrder.items as OrderItem[]).map((item) => (
                  <div key={item.id} className="p-4 flex items-center gap-4">
                    <div className="w-16 h-20 bg-muted overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">{formatPrice(item.price)}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{selectedOrder.shipping === 0 ? 'Free' : formatPrice(selectedOrder.shipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(selectedOrder.tax)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="bg-background border border-border">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Shipping
                </h3>
                {!selectedOrder.trackingNumber && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'refunded' && (
                  <button
                    onClick={() => setShowShippingModal(true)}
                    className="text-sm bg-foreground text-background px-3 py-1.5 hover:opacity-90"
                  >
                    Add Tracking
                  </button>
                )}
              </div>
              <div className="p-4">
                {selectedOrder.trackingNumber ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50">
                      <div>
                        <p className="font-medium">{selectedOrder.trackingCarrier}</p>
                        <p className="text-sm text-muted-foreground font-mono">{selectedOrder.trackingNumber}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigator.clipboard.writeText(selectedOrder.trackingNumber!)}
                          className="p-2 hover:bg-accent transition-colors"
                          title="Copy tracking number"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {selectedOrder.trackingUrl && (
                          <a
                            href={selectedOrder.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-accent transition-colors"
                            title="Track package"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                    <button className="flex items-center gap-2 text-sm border border-border px-3 py-2 hover:bg-accent transition-colors w-full justify-center">
                      <Printer className="w-4 h-4" />
                      Print Shipping Label
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Truck className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No tracking information yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-background border border-border">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Order Timeline</h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {(selectedOrder.timeline as TimelineEvent[]).map((event, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-foreground' : 'bg-border'}`} />
                        {idx < (selectedOrder.timeline as TimelineEvent[]).length - 1 && (
                          <div className="w-px h-full bg-border flex-1 min-h-[20px]" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-medium">{event.event}</p>
                        {event.note && <p className="text-sm text-muted-foreground">{event.note}</p>}
                        <p className="text-xs text-muted-foreground mt-1">{event.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-background border border-border p-4">
              <h3 className="font-semibold mb-4">Customer</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center text-sm font-medium">
                    {selectedOrder.customerName.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium">{selectedOrder.customerName}</p>
                    <p className="text-xs text-muted-foreground">{selectedOrder.customerEmail}</p>
                  </div>
                </div>
                {selectedOrder.customerPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {selectedOrder.customerPhone}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-background border border-border p-4">
              <h3 className="font-semibold mb-4">Shipping Address</h3>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  {(() => {
                    try {
                      const addr = JSON.parse(selectedOrder.shippingAddress);
                      return (
                        <>
                          <p>{addr.firstName} {addr.lastName}</p>
                          <p>{addr.address}{addr.apartment ? `, ${addr.apartment}` : ''}</p>
                          <p>{addr.city}, {addr.state} {addr.zip}</p>
                          <p>{addr.country}</p>
                          {addr.phone && <p className="mt-2">{addr.phone}</p>}
                        </>
                      );
                    } catch {
                      return <p>{selectedOrder.shippingAddress}</p>;
                    }
                  })()}
                </div>
              </div>
            </div>

            <div className="bg-background border border-border p-4">
              <h3 className="font-semibold mb-4">Payment</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className={`text-sm font-medium capitalize ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                    {selectedOrder.paymentStatus.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-semibold">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
              {selectedOrder.paymentStatus === 'paid' && selectedOrder.status !== 'refunded' && (
                <button
                  onClick={() => {
                    setRefundAmount(selectedOrder.total.toString());
                    setShowRefundModal(true);
                  }}
                  className="mt-4 w-full flex items-center justify-center gap-2 text-sm border border-red-200 text-red-600 px-3 py-2 hover:bg-red-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Issue Refund
                </button>
              )}
            </div>

            {selectedOrder.notes && (
              <div className="bg-background border border-border p-4">
                <h3 className="font-semibold mb-2">Order Notes</h3>
                <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
              </div>
            )}

            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 text-sm border border-border px-3 py-2 hover:bg-accent transition-colors">
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
              <button className="w-full flex items-center justify-center gap-2 text-sm border border-border px-3 py-2 hover:bg-accent transition-colors">
                <Mail className="w-4 h-4" />
                Email Customer
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showShippingModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowShippingModal(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-background border border-border w-full max-w-md p-6"
              >
                <h3 className="text-display text-lg font-semibold mb-6">Add Shipping Info</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">CARRIER</label>
                    <select
                      value={trackingCarrier}
                      onChange={(e) => setTrackingCarrier(e.target.value)}
                      className="w-full border border-border bg-transparent px-4 py-3"
                    >
                      <option value="FedEx">FedEx</option>
                      <option value="UPS">UPS</option>
                      <option value="USPS">USPS</option>
                      <option value="DHL">DHL</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">TRACKING NUMBER</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                      className="w-full border border-border bg-transparent px-4 py-3"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleAddTracking}
                    className="flex-1 bg-foreground text-background py-3 text-sm hover:opacity-90"
                  >
                    Add & Mark Shipped
                  </button>
                  <button
                    onClick={() => setShowShippingModal(false)}
                    className="px-4 py-3 border border-border text-sm hover:bg-accent"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showRefundModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowRefundModal(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-background border border-border w-full max-w-md p-6"
              >
                <h3 className="text-display text-lg font-semibold mb-2">Issue Refund</h3>
                <p className="text-sm text-muted-foreground mb-6">This will refund the customer's payment method.</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">REFUND AMOUNT</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <input
                        type="number"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        className="w-full border border-border bg-transparent pl-8 pr-4 py-3"
                        max={selectedOrder.total}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Max: {formatPrice(selectedOrder.total)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">REASON (OPTIONAL)</label>
                    <select
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full border border-border bg-transparent px-4 py-3"
                    >
                      <option value="">Select a reason...</option>
                      <option value="Customer request">Customer request</option>
                      <option value="Damaged item">Damaged item</option>
                      <option value="Wrong item shipped">Wrong item shipped</option>
                      <option value="Item not as described">Item not as described</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleRefund}
                    className="flex-1 bg-red-600 text-white py-3 text-sm hover:bg-red-700"
                  >
                    Confirm Refund
                  </button>
                  <button
                    onClick={() => setShowRefundModal(false)}
                    className="px-4 py-3 border border-border text-sm hover:bg-accent"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (ordersLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="bg-background border border-border p-12 flex items-center justify-center">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-display text-xl font-semibold">Orders</h2>
          <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Pending', 'Processing', 'Shipped', 'Delivered'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 text-xs border transition-colors ${
                statusFilter === filter ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-accent'
              }`}
            >
              {filter} ({statusCounts[filter as keyof typeof statusCounts]})
            </button>
          ))}
        </div>
      </div>

      <div className="bg-background border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium">Order</th>
                <th className="text-left p-4 font-medium">Customer</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Payment</th>
                <th className="text-left p-4 font-medium">Total</th>
                <th className="text-left p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="p-4 font-medium">{order.id}</td>
                  <td className="p-4">
                    <div>
                      <p>{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs capitalize ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus === 'paid' && <CheckCircle2 className="w-4 h-4 inline mr-1" />}
                      {order.paymentStatus === 'pending' && <AlertCircle className="w-4 h-4 inline mr-1" />}
                      {order.paymentStatus === 'refunded' && <XCircle className="w-4 h-4 inline mr-1" />}
                      {order.paymentStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 font-medium">{formatPrice(order.total)}</td>
                  <td className="p-4">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function CustomersTab({ artworksList, customers, subscribers, orders, customersLoading, subscribersLoading }: { 
  artworksList: Artwork[];
  customers: Customer[];
  subscribers: Subscriber[];
  orders: Order[];
  customersLoading: boolean;
  subscribersLoading: boolean;
}) {
  const [customerSubTab, setCustomerSubTab] = useState<'customers' | 'mailing'>('customers');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredSubscribers = subscribers.filter(
    (s) =>
      (s.name?.toLowerCase() || '').includes(customerSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const activeSubscribers = subscribers.filter((s) => s.status === 'subscribed').length;

  if (selectedCustomer) {
    const customerOrders = orders.filter(o => o.customerId === selectedCustomer.id);
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <button
          onClick={() => setSelectedCustomer(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-background border border-border p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-foreground text-background flex items-center justify-center text-xl font-semibold">
                  {selectedCustomer.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-display text-xl font-semibold">{selectedCustomer.name}</h2>
                  <p className="text-sm text-muted-foreground">Customer since {new Date(selectedCustomer.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedCustomer.email}</span>
                </div>
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                )}
              </div>

              {selectedCustomer.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-3">TAGS</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-xs px-2 py-1 ${
                          tag === 'VIP' ? 'bg-purple-100 text-purple-800' :
                          tag === 'Collector' ? 'bg-blue-100 text-blue-800' :
                          tag === 'Early Supporter' ? 'bg-green-100 text-green-800' :
                          'bg-muted'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedCustomer.notes && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-3">NOTES</p>
                  <p className="text-sm">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>

            <div className="bg-background border border-border p-6">
              <p className="text-xs text-muted-foreground mb-4">LIFETIME VALUE</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-display text-2xl font-semibold">{formatPrice(selectedCustomer.totalSpent)}</p>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                </div>
                <div>
                  <p className="text-display text-2xl font-semibold">{selectedCustomer.orderCount}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-background border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-display font-semibold">Order History</h3>
              </div>
              
              {customerOrders.length > 0 ? (
                <div className="divide-y divide-border">
                  {customerOrders.map((order) => (
                    <div key={order.id} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-medium">{order.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 capitalize ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          'bg-muted'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {(order.items as OrderItem[]).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4">
                            <div className="w-12 h-16 bg-muted overflow-hidden flex-shrink-0">
                              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="font-semibold">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Package className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No orders yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCustomerSubTab('customers')}
            className={`px-4 py-2 text-sm transition-colors ${
              customerSubTab === 'customers'
                ? 'bg-foreground text-background'
                : 'border border-border hover:bg-accent'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setCustomerSubTab('mailing')}
            className={`px-4 py-2 text-sm transition-colors ${
              customerSubTab === 'mailing'
                ? 'bg-foreground text-background'
                : 'border border-border hover:bg-accent'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            Mailing List ({activeSubscribers})
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-border bg-background text-sm w-64 focus:border-foreground outline-none transition-colors"
          />
        </div>
      </div>

      {customerSubTab === 'customers' && (
        <>
          {customersLoading ? (
            <div className="bg-background border border-border p-12 flex items-center justify-center">
              <p className="text-muted-foreground">Loading customers...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-background border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">TOTAL CUSTOMERS</p>
                  <p className="text-display text-2xl font-semibold">{customers.length}</p>
                </div>
                <div className="bg-background border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">TOTAL REVENUE</p>
                  <p className="text-display text-2xl font-semibold">{formatPrice(customers.reduce((sum, c) => sum + c.totalSpent, 0))}</p>
                </div>
                <div className="bg-background border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">AVG. ORDER VALUE</p>
                  <p className="text-display text-2xl font-semibold">{formatPrice(Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / (customers.reduce((sum, c) => sum + c.orderCount, 0) || 1)))}</p>
                </div>
                <div className="bg-background border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">VIP CUSTOMERS</p>
                  <p className="text-display text-2xl font-semibold">{customers.filter((c) => c.tags.includes('VIP')).length}</p>
                </div>
              </div>

              <div className="bg-background border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Orders</th>
                    <th className="text-left p-4 font-medium">Total Spent</th>
                    <th className="text-left p-4 font-medium">Last Order</th>
                    <th className="text-left p-4 font-medium">Tags</th>
                    <th className="text-left p-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {customer.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{customer.orderCount}</td>
                      <td className="p-4 font-medium">{formatPrice(customer.totalSpent)}</td>
                      <td className="p-4 text-muted-foreground">
                        {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {customer.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className={`text-xs px-2 py-0.5 ${
                                tag === 'VIP' ? 'bg-purple-100 text-purple-800' :
                                tag === 'Collector' ? 'bg-blue-100 text-blue-800' :
                                tag === 'New' ? 'bg-green-100 text-green-800' :
                                'bg-muted'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                          {customer.tags.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{customer.tags.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
            </>
          )}
        </>
      )}

      {customerSubTab === 'mailing' && (
        <>
          {subscribersLoading ? (
            <div className="bg-background border border-border p-12 flex items-center justify-center">
              <p className="text-muted-foreground">Loading subscribers...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-background border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">TOTAL SUBSCRIBERS</p>
                  <p className="text-display text-2xl font-semibold">{subscribers.length}</p>
                </div>
                <div className="bg-background border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">ACTIVE</p>
                  <p className="text-display text-2xl font-semibold text-green-600">{activeSubscribers}</p>
                </div>
                <div className="bg-background border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">UNSUBSCRIBED</p>
                  <p className="text-display text-2xl font-semibold text-muted-foreground">{subscribers.length - activeSubscribers}</p>
                </div>
              </div>

              <div className="bg-background border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex gap-2">
                {['All', 'Subscribed', 'Unsubscribed'].map((filter) => (
                  <button
                    key={filter}
                    className={`px-3 py-1.5 text-xs border transition-colors ${
                      filter === 'All' ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-accent'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <button className="text-sm flex items-center gap-2 border border-border px-3 py-1.5 hover:bg-accent transition-colors">
                <Mail className="w-4 h-4" />
                Export List
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Subscribed</th>
                    <th className="text-left p-4 font-medium">Source</th>
                    <th className="text-left p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="border-b border-border last:border-0">
                      <td className="p-4 font-medium">{subscriber.email}</td>
                      <td className="p-4">{subscriber.name}</td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(subscriber.subscribedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-4">
                        <span className="text-xs bg-muted px-2 py-1">{subscriber.source}</span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 ${
                          subscriber.status === 'subscribed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {subscriber.status === 'subscribed' ? 'Subscribed' : 'Unsubscribed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
            </>
          )}
        </>
      )}
    </motion.div>
  );
}

interface CollectionFormData {
  name: string;
  slug: string;
  description: string;
  heroImage: string;
  featured: boolean;
}

const emptyCollection: CollectionFormData = {
  name: '',
  slug: '',
  description: '',
  heroImage: '',
  featured: false,
};

function CollectionsTab({ artworks }: { artworks: Artwork[] }) {
  const { data: collections, isLoading } = useCollections();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();
  const setCollectionArtworks = useSetCollectionArtworks();
  
  const collectionsList = collections || [];
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState<CollectionFormData>(emptyCollection);
  const [selectedArtworkIds, setSelectedArtworkIds] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingCollection(null);
    setFormData(emptyCollection);
    setSelectedArtworkIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      slug: collection.slug,
      description: collection.description || '',
      heroImage: collection.heroImage || '',
      featured: collection.featured,
    });
    setIsModalOpen(true);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const collectionData = {
      name: formData.name,
      slug: formData.slug || generateSlug(formData.name),
      description: formData.description || null,
      heroImage: formData.heroImage || null,
      featured: formData.featured,
    };

    try {
      if (editingCollection) {
        await updateCollection.mutateAsync({ id: editingCollection.id, data: collectionData });
        toast({ title: 'Collection updated', description: `"${formData.name}" has been updated.` });
      } else {
        const newCollection = await createCollection.mutateAsync(collectionData);
        if (selectedArtworkIds.length > 0) {
          await setCollectionArtworks.mutateAsync({ id: newCollection.id, artworkIds: selectedArtworkIds });
        }
        toast({ title: 'Collection created', description: `"${formData.name}" has been created.` });
      }
      setIsModalOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save collection.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCollection.mutateAsync(id);
      toast({ title: 'Collection deleted' });
      setDeleteConfirm(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete collection.', variant: 'destructive' });
    }
  };

  const handleArtworksUpdate = async (collectionId: string, artworkIds: string[]) => {
    try {
      await setCollectionArtworks.mutateAsync({ id: collectionId, artworkIds });
      toast({ title: 'Artworks updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update artworks.', variant: 'destructive' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-display text-xl font-semibold">Collections</h2>
          <p className="text-sm text-muted-foreground">{collectionsList.length} total</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-foreground text-background px-4 py-2 text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
          data-testid="button-create-collection"
        >
          <Plus className="w-4 h-4" />
          Create Collection
        </button>
      </div>

      {isLoading ? (
        <div className="bg-background border border-border p-12 flex items-center justify-center">
          <p className="text-muted-foreground">Loading collections...</p>
        </div>
      ) : collectionsList.length === 0 ? (
        <div className="bg-background border border-border p-12 flex items-center justify-center">
          <p className="text-muted-foreground">No collections yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {collectionsList.map((collection) => (
            <div key={collection.id} className="bg-background border border-border p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-display text-lg font-medium">{collection.name}</h3>
                    {collection.featured && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800">Featured</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">/{collection.slug}</p>
                  {collection.description && (
                    <p className="text-sm text-muted-foreground">{collection.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {deleteConfirm === collection.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(collection.id)}
                        className="px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700"
                        data-testid={`button-confirm-delete-${collection.id}`}
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="p-2 hover:bg-accent"
                        data-testid={`button-cancel-delete-${collection.id}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => openEditModal(collection)}
                        className="p-2 hover:bg-accent transition-colors"
                        data-testid={`button-edit-collection-${collection.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(collection.id)}
                        className="p-2 hover:bg-accent transition-colors text-red-600"
                        data-testid={`button-delete-collection-${collection.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <CollectionArtworksEditor
                collectionId={collection.id}
                allArtworks={artworks}
                onSave={handleArtworksUpdate}
              />
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-background border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background">
                <h3 className="text-display text-lg font-semibold">
                  {editingCollection ? 'Edit Collection' : 'Create Collection'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} data-testid="button-close-modal">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        name: e.target.value,
                        slug: formData.slug || generateSlug(e.target.value)
                      });
                    }}
                    className="w-full px-4 py-3 border border-border bg-background focus:border-foreground outline-none"
                    placeholder="Collection name"
                    required
                    data-testid="input-collection-name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Slug</label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">/collection/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="flex-1 px-4 py-3 border border-border bg-background focus:border-foreground outline-none"
                      placeholder="collection-slug"
                      data-testid="input-collection-slug"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-border bg-background focus:border-foreground outline-none resize-none"
                    rows={3}
                    placeholder="Collection description"
                    data-testid="input-collection-description"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Hero Image URL</label>
                  <input
                    type="text"
                    value={formData.heroImage}
                    onChange={(e) => setFormData({ ...formData, heroImage: e.target.value })}
                    className="w-full px-4 py-3 border border-border bg-background focus:border-foreground outline-none"
                    placeholder="https://..."
                    data-testid="input-collection-hero-image"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4"
                      data-testid="input-collection-featured"
                    />
                    <span className="text-sm">Featured collection</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-border hover:bg-accent transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createCollection.isPending || updateCollection.isPending}
                    className="flex-1 px-6 py-3 bg-foreground text-background hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
                    data-testid="button-save-collection"
                  >
                    {createCollection.isPending || updateCollection.isPending ? 'Saving...' : 'Save Collection'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CollectionArtworksEditor({ 
  collectionId, 
  allArtworks, 
  onSave 
}: { 
  collectionId: string; 
  allArtworks: Artwork[]; 
  onSave: (collectionId: string, artworkIds: string[]) => void;
}) {
  const { data: artworks, isLoading } = useCollectionArtworks(collectionId);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const currentArtworks = artworks || [];

  const startEditing = () => {
    setSelectedIds(currentArtworks.map(a => a.id));
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(collectionId, selectedIds);
    setIsEditing(false);
  };

  const toggleArtwork = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground mt-4">Loading artworks...</p>;
  }

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {currentArtworks.length} {currentArtworks.length === 1 ? 'artwork' : 'artworks'}
        </p>
        {!isEditing ? (
          <button
            onClick={startEditing}
            className="text-xs px-3 py-1 border border-border hover:bg-accent transition-colors"
            data-testid={`button-edit-artworks-${collectionId}`}
          >
            Manage Artworks
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs px-3 py-1 border border-border hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-xs px-3 py-1 bg-foreground text-background hover:opacity-90 transition-opacity"
              data-testid={`button-save-artworks-${collectionId}`}
            >
              Save
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
          {allArtworks.map((artwork) => (
            <button
              key={artwork.id}
              onClick={() => toggleArtwork(artwork.id)}
              className={`aspect-square relative border-2 transition-colors ${
                selectedIds.includes(artwork.id)
                  ? 'border-foreground'
                  : 'border-transparent hover:border-muted'
              }`}
              data-testid={`artwork-toggle-${artwork.id}`}
            >
              <img src={artwork.image} alt={artwork.title} className="w-full h-full object-cover" />
              {selectedIds.includes(artwork.id) && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-foreground text-background rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </button>
          ))}
        </div>
      ) : currentArtworks.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {currentArtworks.slice(0, 6).map((artwork) => (
            <img
              key={artwork.id}
              src={artwork.image}
              alt={artwork.title}
              className="w-16 h-16 object-cover flex-shrink-0"
            />
          ))}
          {currentArtworks.length > 6 && (
            <div className="w-16 h-16 bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-sm text-muted-foreground">+{currentArtworks.length - 6}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No artworks assigned</p>
      )}
    </div>
  );
}

function AdminLogin({ onLogin }: { onLogin: (user: AdminUser) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await adminAuthAPI.login({ email, password });
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold tracking-[-0.02em] mb-2">STUDIODROP</h1>
          <p className="text-muted-foreground">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-destructive/10 text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground"
              placeholder="admin@studiodrop.com"
              required
              data-testid="input-admin-email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground"
              placeholder="••••••••"
              required
              data-testid="input-admin-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            data-testid="button-admin-login"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export function Admin() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('drops');
  const [searchQuery, setSearchQuery] = useState('');
  const [isArtworkModalOpen, setIsArtworkModalOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [artworkFormData, setArtworkFormData] = useState<ArtworkFormData>(emptyArtwork);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [editingDrop, setEditingDrop] = useState<Drop | null>(null);
  const [dropFormData, setDropFormData] = useState<DropFormData>(emptyDrop);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteDropConfirm, setDeleteDropConfirm] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'STUDIODROP',
    currency: 'USD',
    emailNotifications: true,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedSettings = localStorage.getItem('studiodrop_settings');
    if (savedSettings) {
      try {
        setStoreSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  const saveStoreSettings = () => {
    localStorage.setItem('studiodrop_settings', JSON.stringify(storeSettings));
    window.dispatchEvent(new CustomEvent('storeSettingsUpdated', { detail: storeSettings }));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const { data: artworks, isLoading: artworksLoading } = useArtworks();
  const { data: drops, isLoading: dropsLoading } = useDrops();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: subscribers, isLoading: subscribersLoading } = useSubscribers();
  
  const createArtwork = useCreateArtwork();
  const updateArtwork = useUpdateArtwork();
  const deleteArtwork = useDeleteArtwork();
  const createDrop = useCreateDrop();
  const updateDrop = useUpdateDrop();
  const deleteDrop = useDeleteDrop();

  useEffect(() => {
    adminAuthAPI.getUser()
      .then(user => setAdminUser(user))
      .catch(() => setAdminUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await adminAuthAPI.logout();
      setAdminUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!adminUser) {
    return <AdminLogin onLogin={setAdminUser} />;
  }
  
  const artworksList = artworks || [];
  const dropsList = drops || [];
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setArtworkFormData({ ...artworkFormData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'artworks' as Tab, label: 'Artworks', icon: Image },
    { id: 'collections' as Tab, label: 'Collections', icon: Layers },
    { id: 'orders' as Tab, label: 'Orders', icon: Package },
    { id: 'drops' as Tab, label: 'Drops', icon: Calendar },
    { id: 'customers' as Tab, label: 'Customers', icon: Users },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  const ordersList = orders || [];
  const totalRevenue = ordersList.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = ordersList.length > 0 ? Math.round(totalRevenue / ordersList.length) : 0;
  
  const stats = [
    { label: 'Total Revenue', value: formatPrice(totalRevenue), change: ordersList.length > 0 ? '+12%' : '—', icon: DollarSign },
    { label: 'Orders', value: ordersList.length.toString(), change: ordersList.length > 0 ? '+8%' : '—', icon: ShoppingCart },
    { label: 'Artworks', value: artworksList.length.toString(), change: artworksList.length > 0 ? '+5%' : '—', icon: TrendingUp },
    { label: 'Avg. Order Value', value: formatPrice(avgOrderValue), change: ordersList.length > 0 ? '+5%' : '—', icon: Clock },
  ];

  const openAddArtworkModal = () => {
    setEditingArtwork(null);
    setArtworkFormData(emptyArtwork);
    setIsArtworkModalOpen(true);
  };

  const openEditArtworkModal = (artwork: Artwork) => {
    setEditingArtwork(artwork);
    setArtworkFormData({
      title: artwork.title,
      medium: artwork.medium,
      surface: artwork.surface,
      year: artwork.year,
      height: artwork.height,
      width: artwork.width,
      depth: artwork.depth || undefined,
      unit: artwork.unit as 'in' | 'cm',
      price: artwork.price,
      compareAtPrice: artwork.compareAtPrice || undefined,
      type: artwork.type as 'original' | 'limited' | 'open',
      editionSize: artwork.editionSize || undefined,
      editionRemaining: artwork.editionRemaining || undefined,
      description: artwork.description,
      styleTags: artwork.styleTags,
      image: artwork.image,
      framed: artwork.framed,
      frameDetails: artwork.frameDetails || '',
      soldOut: artwork.soldOut,
      featured: artwork.featured,
    });
    setIsArtworkModalOpen(true);
  };

  const closeArtworkModal = () => {
    setIsArtworkModalOpen(false);
    setEditingArtwork(null);
    setArtworkFormData(emptyArtwork);
  };

  const handleSaveArtwork = async () => {
    const artworkData = {
      title: artworkFormData.title,
      year: artworkFormData.year,
      type: artworkFormData.type,
      medium: artworkFormData.medium,
      surface: artworkFormData.surface,
      height: artworkFormData.height,
      width: artworkFormData.width,
      depth: artworkFormData.depth,
      unit: artworkFormData.unit,
      price: artworkFormData.price,
      compareAtPrice: artworkFormData.compareAtPrice,
      currency: 'USD',
      editionSize: artworkFormData.editionSize,
      editionRemaining: artworkFormData.editionRemaining,
      image: artworkFormData.image,
      images: [artworkFormData.image],
      description: artworkFormData.description,
      styleTags: artworkFormData.styleTags,
      framed: artworkFormData.framed,
      frameDetails: artworkFormData.frameDetails || undefined,
      soldOut: artworkFormData.soldOut,
      featured: artworkFormData.featured,
    };

    try {
      if (editingArtwork) {
        await updateArtwork.mutateAsync({ id: editingArtwork.id, data: artworkData });
        toast({
          title: "Success",
          description: "Artwork updated successfully",
        });
      } else {
        await createArtwork.mutateAsync(artworkData);
        toast({
          title: "Success",
          description: "Artwork created successfully",
        });
      }
      closeArtworkModal();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingArtwork ? 'update' : 'create'} artwork`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteArtwork = async (id: string) => {
    try {
      await deleteArtwork.mutateAsync(id);
      toast({
        title: "Success",
        description: "Artwork deleted successfully",
      });
      setDeleteConfirm(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete artwork",
        variant: "destructive",
      });
    }
  };

  const addTag = (tag: string) => {
    if (tag && !artworkFormData.styleTags.includes(tag)) {
      setArtworkFormData({ ...artworkFormData, styleTags: [...artworkFormData.styleTags, tag] });
    }
  };

  const removeTag = (tag: string) => {
    setArtworkFormData({
      ...artworkFormData,
      styleTags: artworkFormData.styleTags.filter((t) => t !== tag),
    });
  };

  const openAddDropModal = () => {
    setEditingDrop(null);
    setDropFormData(emptyDrop);
    setIsDropModalOpen(true);
  };

  const openEditDropModal = (drop: Drop) => {
    setEditingDrop(drop);
    setDropFormData({
      title: drop.title,
      subtitle: drop.subtitle ?? '',
      description: drop.description,
      startDate: drop.startDate,
      startTime: drop.startTime,
      endDate: drop.endDate ?? '',
      endTime: drop.endTime ?? '',
      hasEndDate: drop.hasEndDate,
      featured: drop.featured,
      artworkIds: drop.artworkIds,
      heroImage: drop.heroImage ?? '',
      notifySubscribers: drop.notifySubscribers,
    });
    setIsDropModalOpen(true);
  };

  const closeDropModal = () => {
    setIsDropModalOpen(false);
    setEditingDrop(null);
    setDropFormData(emptyDrop);
  };

  const handleSaveDrop = async () => {
    const dropData = {
      title: dropFormData.title,
      subtitle: dropFormData.subtitle,
      description: dropFormData.description,
      startDate: dropFormData.startDate,
      startTime: dropFormData.startTime,
      endDate: dropFormData.endDate,
      endTime: dropFormData.endTime,
      hasEndDate: dropFormData.hasEndDate,
      status: 'scheduled' as const,
      featured: dropFormData.featured,
      artworkIds: dropFormData.artworkIds,
      heroImage: dropFormData.heroImage,
      notifySubscribers: dropFormData.notifySubscribers,
    };

    try {
      if (editingDrop) {
        await updateDrop.mutateAsync({ id: editingDrop.id, data: dropData });
        toast({
          title: "Success",
          description: "Drop updated successfully",
        });
      } else {
        await createDrop.mutateAsync(dropData);
        toast({
          title: "Success",
          description: "Drop created successfully",
        });
      }
      closeDropModal();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingDrop ? 'update' : 'create'} drop`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteDrop = async (id: string) => {
    try {
      await deleteDrop.mutateAsync(id);
      toast({
        title: "Success",
        description: "Drop deleted successfully",
      });
      setDeleteDropConfirm(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete drop",
        variant: "destructive",
      });
    }
  };

  const toggleArtworkInDrop = (artworkId: string) => {
    setDropFormData((prev) => ({
      ...prev,
      artworkIds: prev.artworkIds.includes(artworkId)
        ? prev.artworkIds.filter((id) => id !== artworkId)
        : [...prev.artworkIds, artworkId],
    }));
  };

  const filteredArtworks = artworksList.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.medium.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24 bg-muted/30">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-display text-3xl font-semibold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage your store</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-border bg-background text-sm w-64 focus:border-foreground outline-none transition-colors"
                data-testid="input-admin-search"
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-foreground text-background'
                    : 'hover:bg-background'
                }`}
                data-testid={`admin-tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
            
            <div className="pt-4 mt-4 border-t border-border">
              <div className="px-4 py-2 text-xs text-muted-foreground mb-2">
                {adminUser.email}
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                data-testid="button-admin-logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </nav>

          <div className="md:col-span-4">
            {activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="bg-background border border-border p-6">
                      <div className="flex items-center justify-between mb-4">
                        <stat.icon className="w-5 h-5 text-muted-foreground" />
                        <span className="text-xs text-green-600">{stat.change}</span>
                      </div>
                      <p className="text-display text-2xl font-semibold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-background border border-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-display text-lg font-semibold">Recent Orders</h2>
                    <button className="text-sm link-underline" onClick={() => setActiveTab('orders')}>View All</button>
                  </div>
                  {ordersLoading ? (
                    <div className="p-8 flex items-center justify-center">
                      <p className="text-muted-foreground">Loading orders...</p>
                    </div>
                  ) : ordersList.length === 0 ? (
                    <div className="p-8 flex items-center justify-center">
                      <p className="text-muted-foreground">No orders yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left pb-3 font-medium">Order</th>
                            <th className="text-left pb-3 font-medium">Customer</th>
                            <th className="text-left pb-3 font-medium">Status</th>
                            <th className="text-left pb-3 font-medium">Total</th>
                            <th className="text-left pb-3 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ordersList.slice(0, 4).map((order) => (
                            <tr 
                              key={order.id} 
                              className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                              onClick={() => {
                                setSelectedOrderId(order.id);
                                setActiveTab('orders');
                              }}
                            >
                              <td className="py-4 font-medium">{order.id}</td>
                              <td className="py-4">{order.customerName}</td>
                              <td className="py-4">
                                <span className={`text-xs px-2 py-1 capitalize ${
                                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                  order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                  order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-muted'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="py-4">{formatPrice(order.total)}</td>
                              <td className="py-4 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'artworks' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-display text-xl font-semibold">Artworks</h2>
                    <p className="text-sm text-muted-foreground">{artworksList.length} total</p>
                  </div>
                  <button
                    onClick={openAddArtworkModal}
                    className="bg-foreground text-background px-4 py-2 text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
                    data-testid="button-add-artwork"
                  >
                    <Plus className="w-4 h-4" />
                    Add Artwork
                  </button>
                </div>

                {artworksLoading ? (
                  <div className="bg-background border border-border p-12 flex items-center justify-center">
                    <p className="text-muted-foreground">Loading artworks...</p>
                  </div>
                ) : (
                  <div className="bg-background border border-border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-4 font-medium">Artwork</th>
                            <th className="text-left p-4 font-medium">Type</th>
                            <th className="text-left p-4 font-medium">Price</th>
                            <th className="text-left p-4 font-medium">Status</th>
                            <th className="text-left p-4 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredArtworks.map((artwork) => (
                          <tr key={artwork.id} className="border-b border-border last:border-0 group">
                            <td className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-16 bg-muted overflow-hidden flex-shrink-0">
                                  {artwork.image ? (
                                    <img
                                      src={artwork.image}
                                      alt={artwork.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ImagePlus className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{artwork.title}</p>
                                  <p className="text-xs text-muted-foreground">{artwork.medium}, {artwork.year}</p>
                                  <p className="text-xs text-muted-foreground">{formatDimensions({ height: artwork.height, width: artwork.width, depth: artwork.depth || undefined, unit: artwork.unit as 'in' | 'cm' })}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="capitalize">{artwork.type}</span>
                              {artwork.type === 'limited' && artwork.editionSize && (
                                <span className="text-muted-foreground text-xs block">
                                  {artwork.editionRemaining}/{artwork.editionSize} remaining
                                </span>
                              )}
                            </td>
                            <td className="p-4 font-medium">{formatPrice(artwork.price)}</td>
                            <td className="p-4">
                              <span className={`text-xs px-2 py-1 ${
                                artwork.soldOut ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {artwork.soldOut ? 'Sold' : 'Available'}
                              </span>
                            </td>
                            <td className="p-4">
                              {deleteConfirm === artwork.id ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleDeleteArtwork(artwork.id)}
                                    className="text-xs bg-red-600 text-white px-3 py-1.5 hover:bg-red-700"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="text-xs border border-border px-3 py-1.5 hover:bg-accent"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openEditArtworkModal(artwork)}
                                    className="p-2 hover:bg-accent transition-colors"
                                    data-testid={`button-edit-${artwork.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(artwork.id)}
                                    className="p-2 hover:bg-accent transition-colors text-red-600"
                                    data-testid={`button-delete-${artwork.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <OrdersTab initialOrderId={selectedOrderId} onClearSelection={() => setSelectedOrderId(null)} />
            )}

            {activeTab === 'collections' && (
              <CollectionsTab artworks={artworksList} />
            )}

            {activeTab === 'drops' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-display text-xl font-semibold">Drops</h2>
                    <p className="text-sm text-muted-foreground">{dropsList.length} total</p>
                  </div>
                  <button
                    onClick={openAddDropModal}
                    className="bg-foreground text-background px-4 py-2 text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
                    data-testid="button-create-drop"
                  >
                    <Plus className="w-4 h-4" />
                    Create Drop
                  </button>
                </div>

                {dropsLoading ? (
                  <div className="bg-background border border-border p-12 flex items-center justify-center">
                    <p className="text-muted-foreground">Loading drops...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dropsList.map((drop) => {
                    const status = getDropStatus(drop);
                    const dropArtworks = artworksList.filter((a) => drop.artworkIds.includes(a.id));
                    
                    return (
                      <motion.div
                        key={drop.id}
                        layout
                        className="bg-background border border-border"
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`text-xs px-2 py-1 uppercase ${getStatusColor(status)}`}>
                                  {status}
                                </span>
                                {drop.featured && (
                                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    Featured
                                  </span>
                                )}
                              </div>
                              <h3 className="text-display text-xl font-semibold">{drop.title}</h3>
                              {drop.subtitle && (
                                <p className="text-muted-foreground">{drop.subtitle}</p>
                              )}
                            </div>
                            
                            {deleteDropConfirm === drop.id ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDeleteDrop(drop.id)}
                                  className="text-xs bg-red-600 text-white px-3 py-1.5 hover:bg-red-700"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setDeleteDropConfirm(null)}
                                  className="text-xs border border-border px-3 py-1.5 hover:bg-accent"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditDropModal(drop)}
                                  className="p-2 hover:bg-accent transition-colors"
                                  data-testid={`button-edit-drop-${drop.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteDropConfirm(drop.id)}
                                  className="p-2 hover:bg-accent transition-colors text-red-600"
                                  data-testid={`button-delete-drop-${drop.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="mt-6 grid md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">SCHEDULE</p>
                              <div className="flex items-center gap-2 text-sm">
                                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                                <span>Starts: {formatDropDate(drop.startDate, drop.startTime)}</span>
                              </div>
                              {drop.hasEndDate && drop.endDate && (
                                <div className="flex items-center gap-2 text-sm mt-1">
                                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                                  <span>Ends: {formatDropDate(drop.endDate, drop.endTime)}</span>
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">
                                ARTWORKS ({dropArtworks.length})
                              </p>
                              {dropArtworks.length > 0 ? (
                                <div className="flex gap-2">
                                  {dropArtworks.slice(0, 4).map((artwork) => (
                                    <div
                                      key={artwork.id}
                                      className="w-12 h-16 bg-muted overflow-hidden"
                                    >
                                      <img
                                        src={artwork.image}
                                        alt={artwork.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                                  {dropArtworks.length > 4 && (
                                    <div className="w-12 h-16 bg-muted flex items-center justify-center text-sm text-muted-foreground">
                                      +{dropArtworks.length - 4}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">No artworks added</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                    {dropsList.length === 0 && (
                      <div className="bg-background border border-border border-dashed p-12 text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">No drops scheduled</p>
                        <button
                          onClick={openAddDropModal}
                          className="text-sm link-underline"
                        >
                          Create your first drop
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'customers' && (
              <CustomersTab 
                artworksList={artworksList} 
                customers={customers || []} 
                subscribers={subscribers || []}
                orders={orders || []}
                customersLoading={customersLoading}
                subscribersLoading={subscribersLoading}
              />
            )}

            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h2 className="text-display text-xl font-semibold mb-6">Settings</h2>
                <div className="bg-background border border-border divide-y divide-border">
                  <div className="p-6">
                    <h3 className="font-medium mb-4">Store Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-2">STORE NAME</label>
                        <input
                          type="text"
                          value={storeSettings.storeName}
                          onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                          className="w-full md:w-1/2 border border-border bg-transparent px-4 py-2 focus:border-foreground outline-none transition-colors"
                          data-testid="input-store-name"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-2">CURRENCY</label>
                        <select 
                          value={storeSettings.currency}
                          onChange={(e) => setStoreSettings({ ...storeSettings, currency: e.target.value })}
                          className="border border-border bg-transparent px-4 py-2"
                          data-testid="select-currency"
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-medium mb-4">Notifications</h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={storeSettings.emailNotifications}
                        onChange={(e) => setStoreSettings({ ...storeSettings, emailNotifications: e.target.checked })}
                        className="w-5 h-5" 
                        data-testid="checkbox-email-notifications"
                      />
                      <span className="text-sm">Email me when a new order is placed</span>
                    </label>
                  </div>
                  <div className="p-6">
                    <button
                      onClick={saveStoreSettings}
                      className="px-6 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center gap-2"
                      data-testid="button-save-settings"
                    >
                      {settingsSaved ? (
                        <>
                          <Check className="w-4 h-4" />
                          Saved!
                        </>
                      ) : (
                        'Save Settings'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isArtworkModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          >
            <div
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={closeArtworkModal}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-background border border-border w-full max-w-3xl my-8"
            >
              <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-display text-xl font-semibold">
                  {editingArtwork ? 'EDIT ARTWORK' : 'ADD NEW ARTWORK'}
                </h2>
                <button
                  onClick={closeArtworkModal}
                  className="p-2 hover:bg-accent transition-colors"
                  data-testid="button-close-modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">
                        ARTWORK IMAGE
                      </label>
                      <div 
                        onClick={() => !artworkFormData.image && fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border p-8 text-center hover:border-muted-foreground transition-colors cursor-pointer"
                        data-testid="upload-area"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          data-testid="input-file-upload"
                        />
                        {artworkFormData.image ? (
                          <div className="relative">
                            <img
                              src={artworkFormData.image}
                              alt="Preview"
                              className="w-full aspect-[3/4] object-cover"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setArtworkFormData({ ...artworkFormData, image: '' });
                              }}
                              className="absolute top-2 right-2 p-1 bg-background border border-border hover:bg-accent"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Drag & drop or click to upload
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Recommended: 1200x1600px, JPG or PNG
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Or paste image URL..."
                        value={artworkFormData.image}
                        onChange={(e) => setArtworkFormData({ ...artworkFormData, image: e.target.value })}
                        className="w-full mt-3 border border-border bg-transparent px-4 py-2 text-sm focus:border-foreground outline-none transition-colors"
                        data-testid="input-image-url"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">
                        STYLE TAGS
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {artworkFormData.styleTags.map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-1 text-xs bg-foreground text-background px-2 py-1"
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="hover:opacity-70"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {availableTags
                          .filter((tag) => !artworkFormData.styleTags.includes(tag))
                          .map((tag) => (
                            <button
                              key={tag}
                              onClick={() => addTag(tag)}
                              className="text-xs border border-border px-2 py-1 hover:bg-accent transition-colors"
                            >
                              + {tag}
                            </button>
                          ))}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={artworkFormData.framed}
                          onChange={(e) => setArtworkFormData({ ...artworkFormData, framed: e.target.checked })}
                          className="w-5 h-5 border border-border accent-foreground"
                          data-testid="checkbox-framed"
                        />
                        <span className="text-sm">Framed</span>
                      </label>

                      {artworkFormData.framed && (
                        <input
                          type="text"
                          placeholder="Frame details (e.g. Natural oak float frame)"
                          value={artworkFormData.frameDetails}
                          onChange={(e) => setArtworkFormData({ ...artworkFormData, frameDetails: e.target.value })}
                          className="w-full border border-border bg-transparent px-4 py-2 text-sm focus:border-foreground outline-none transition-colors"
                        />
                      )}

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={artworkFormData.soldOut}
                          onChange={(e) => setArtworkFormData({ ...artworkFormData, soldOut: e.target.checked })}
                          className="w-5 h-5 border border-border accent-foreground"
                          data-testid="checkbox-sold-out"
                        />
                        <span className="text-sm">Mark as sold</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">
                        TITLE *
                      </label>
                      <input
                        type="text"
                        value={artworkFormData.title}
                        onChange={(e) => setArtworkFormData({ ...artworkFormData, title: e.target.value })}
                        className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                        data-testid="input-title"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-2">
                          MEDIUM *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Oil on canvas"
                          value={artworkFormData.medium}
                          onChange={(e) => setArtworkFormData({ ...artworkFormData, medium: e.target.value })}
                          className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                          data-testid="input-medium"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-2">
                          SURFACE
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Canvas"
                          value={artworkFormData.surface}
                          onChange={(e) => setArtworkFormData({ ...artworkFormData, surface: e.target.value })}
                          className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                          data-testid="input-surface"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">
                        DIMENSIONS
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <input
                            type="number"
                            step="any"
                            placeholder="H"
                            value={artworkFormData.height || ''}
                            onChange={(e) => setArtworkFormData({ ...artworkFormData, height: parseFloat(e.target.value) || 0 })}
                            className="w-full border border-border bg-transparent px-3 py-3 focus:border-foreground outline-none transition-colors text-center"
                            data-testid="input-height"
                          />
                          <span className="text-xs text-muted-foreground block text-center mt-1">Height</span>
                        </div>
                        <div>
                          <input
                            type="number"
                            step="any"
                            placeholder="W"
                            value={artworkFormData.width || ''}
                            onChange={(e) => setArtworkFormData({ ...artworkFormData, width: parseFloat(e.target.value) || 0 })}
                            className="w-full border border-border bg-transparent px-3 py-3 focus:border-foreground outline-none transition-colors text-center"
                            data-testid="input-width"
                          />
                          <span className="text-xs text-muted-foreground block text-center mt-1">Width</span>
                        </div>
                        <div>
                          <input
                            type="number"
                            step="any"
                            placeholder="D"
                            value={artworkFormData.depth || ''}
                            onChange={(e) => setArtworkFormData({ ...artworkFormData, depth: parseFloat(e.target.value) || undefined })}
                            className="w-full border border-border bg-transparent px-3 py-3 focus:border-foreground outline-none transition-colors text-center"
                            data-testid="input-depth"
                          />
                          <span className="text-xs text-muted-foreground block text-center mt-1">Depth</span>
                        </div>
                        <div>
                          <select
                            value={artworkFormData.unit}
                            onChange={(e) => setArtworkFormData({ ...artworkFormData, unit: e.target.value as 'in' | 'cm' })}
                            className="w-full border border-border bg-transparent px-2 py-3 focus:border-foreground outline-none transition-colors"
                          >
                            <option value="in">in</option>
                            <option value="cm">cm</option>
                          </select>
                          <span className="text-xs text-muted-foreground block text-center mt-1">Unit</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-2">
                          YEAR
                        </label>
                        <input
                          type="number"
                          value={artworkFormData.year}
                          onChange={(e) => setArtworkFormData({ ...artworkFormData, year: parseInt(e.target.value) })}
                          className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                          data-testid="input-year"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-2">
                          TYPE *
                        </label>
                        <select
                          value={artworkFormData.type}
                          onChange={(e) => setArtworkFormData({ ...artworkFormData, type: e.target.value as ArtworkFormData['type'] })}
                          className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors appearance-none"
                          data-testid="select-type"
                        >
                          <option value="original">Original</option>
                          <option value="limited">Limited Edition</option>
                          <option value="open">Open Edition</option>
                        </select>
                      </div>
                    </div>

                    {artworkFormData.type === 'limited' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <label className="text-xs text-muted-foreground block mb-2">
                            EDITION SIZE
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 50"
                            value={artworkFormData.editionSize || ''}
                            onChange={(e) => setArtworkFormData({ ...artworkFormData, editionSize: parseInt(e.target.value) || undefined })}
                            className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                            data-testid="input-edition-size"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-2">
                            REMAINING
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 25"
                            value={artworkFormData.editionRemaining || ''}
                            onChange={(e) => setArtworkFormData({ ...artworkFormData, editionRemaining: parseInt(e.target.value) || undefined })}
                            className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                            data-testid="input-edition-remaining"
                          />
                        </div>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-2">
                          PRICE (USD) *
                        </label>
                        <input
                          type="number"
                          value={artworkFormData.price || ''}
                          onChange={(e) => setArtworkFormData({ ...artworkFormData, price: parseInt(e.target.value) || 0 })}
                          className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                          data-testid="input-price"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-2">
                          COMPARE AT PRICE
                        </label>
                        <input
                          type="number"
                          placeholder="Original price"
                          value={artworkFormData.compareAtPrice || ''}
                          onChange={(e) => setArtworkFormData({ ...artworkFormData, compareAtPrice: parseInt(e.target.value) || undefined })}
                          className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                          data-testid="input-compare-price"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">
                        DESCRIPTION
                      </label>
                      <textarea
                        rows={4}
                        value={artworkFormData.description}
                        onChange={(e) => setArtworkFormData({ ...artworkFormData, description: e.target.value })}
                        className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors resize-none"
                        data-testid="textarea-description"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex gap-4">
                <button
                  onClick={handleSaveArtwork}
                  className="flex-1 bg-foreground text-background py-3 text-sm tracking-wide hover:opacity-90 transition-opacity"
                  data-testid="button-save-artwork"
                >
                  {editingArtwork ? 'SAVE CHANGES' : 'ADD ARTWORK'}
                </button>
                <button
                  onClick={closeArtworkModal}
                  className="px-6 py-3 border border-border text-sm tracking-wide hover:bg-accent transition-colors"
                  data-testid="button-cancel"
                >
                  CANCEL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDropModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          >
            <div
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={closeDropModal}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-background border border-border w-full max-w-4xl my-8"
            >
              <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-display text-xl font-semibold">
                  {editingDrop ? 'EDIT DROP' : 'CREATE NEW DROP'}
                </h2>
                <button
                  onClick={closeDropModal}
                  className="p-2 hover:bg-accent transition-colors"
                  data-testid="button-close-drop-modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">
                        DROP TITLE *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SPRING 2024"
                        value={dropFormData.title}
                        onChange={(e) => setDropFormData({ ...dropFormData, title: e.target.value })}
                        className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                        data-testid="input-drop-title"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">
                        SUBTITLE
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. New Works Collection"
                        value={dropFormData.subtitle}
                        onChange={(e) => setDropFormData({ ...dropFormData, subtitle: e.target.value })}
                        className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                        data-testid="input-drop-subtitle"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">
                        DESCRIPTION
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tell collectors about this drop..."
                        value={dropFormData.description}
                        onChange={(e) => setDropFormData({ ...dropFormData, description: e.target.value })}
                        className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors resize-none"
                        data-testid="textarea-drop-description"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">
                        HERO IMAGE URL (OPTIONAL)
                      </label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={dropFormData.heroImage}
                        onChange={(e) => setDropFormData({ ...dropFormData, heroImage: e.target.value })}
                        className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                        data-testid="input-drop-hero"
                      />
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">
                        START DATE & TIME *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={dropFormData.startDate}
                          onChange={(e) => setDropFormData({ ...dropFormData, startDate: e.target.value })}
                          className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                          data-testid="input-start-date"
                        />
                        <input
                          type="time"
                          value={dropFormData.startTime}
                          onChange={(e) => setDropFormData({ ...dropFormData, startTime: e.target.value })}
                          className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                          data-testid="input-start-time"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-3 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={dropFormData.hasEndDate}
                          onChange={(e) => setDropFormData({ ...dropFormData, hasEndDate: e.target.checked })}
                          className="w-5 h-5 border border-border accent-foreground"
                        />
                        <span className="text-sm">Set end date (limited time drop)</span>
                      </label>

                      {dropFormData.hasEndDate && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="grid grid-cols-2 gap-3"
                        >
                          <input
                            type="date"
                            value={dropFormData.endDate}
                            onChange={(e) => setDropFormData({ ...dropFormData, endDate: e.target.value })}
                            className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                            data-testid="input-end-date"
                          />
                          <input
                            type="time"
                            value={dropFormData.endTime}
                            onChange={(e) => setDropFormData({ ...dropFormData, endTime: e.target.value })}
                            className="w-full border border-border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors"
                            data-testid="input-end-time"
                          />
                        </motion.div>
                      )}
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dropFormData.featured}
                          onChange={(e) => setDropFormData({ ...dropFormData, featured: e.target.checked })}
                          className="w-5 h-5 border border-border accent-foreground"
                        />
                        <div>
                          <span className="text-sm flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Feature on homepage
                          </span>
                          <span className="text-xs text-muted-foreground">Show in hero section</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dropFormData.notifySubscribers}
                          onChange={(e) => setDropFormData({ ...dropFormData, notifySubscribers: e.target.checked })}
                          className="w-5 h-5 border border-border accent-foreground"
                        />
                        <div>
                          <span className="text-sm">Notify subscribers</span>
                          <span className="text-xs text-muted-foreground block">Send email when drop goes live</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="text-xs text-muted-foreground block">
                        SELECT ARTWORKS
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {dropFormData.artworkIds.length} selected
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto p-1">
                    {artworksList.map((artwork) => {
                      const isSelected = dropFormData.artworkIds.includes(artwork.id);
                      return (
                        <button
                          key={artwork.id}
                          onClick={() => toggleArtworkInDrop(artwork.id)}
                          className={`relative border-2 transition-colors ${
                            isSelected
                              ? 'border-foreground'
                              : 'border-transparent hover:border-border'
                          }`}
                          data-testid={`toggle-artwork-${artwork.id}`}
                        >
                          <div className="aspect-[3/4] bg-muted overflow-hidden">
                            <img
                              src={artwork.image}
                              alt={artwork.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-2 bg-background">
                            <p className="text-xs font-medium truncate">{artwork.title}</p>
                            <p className="text-xs text-muted-foreground">{formatPrice(artwork.price)}</p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-foreground text-background flex items-center justify-center">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                          {artwork.soldOut && (
                            <div className="absolute top-2 left-2 text-xs bg-red-600 text-white px-1.5 py-0.5">
                              Sold
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex gap-4">
                <button
                  onClick={handleSaveDrop}
                  className="flex-1 bg-foreground text-background py-3 text-sm tracking-wide hover:opacity-90 transition-opacity"
                  data-testid="button-save-drop"
                >
                  {editingDrop ? 'SAVE CHANGES' : 'CREATE DROP'}
                </button>
                <button
                  onClick={closeDropModal}
                  className="px-6 py-3 border border-border text-sm tracking-wide hover:bg-accent transition-colors"
                  data-testid="button-cancel-drop"
                >
                  CANCEL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
