import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, CreditCard, Truck, Shield, Check, Plus, MapPin, Loader2, Package } from 'lucide-react';
import { CartItem, formatPrice } from '@/lib/mockData';
import { useAuth } from '@/hooks/use-auth';
import { useCustomerAddresses, useCreateAddress, useUpdateAddress } from '@/lib/hooks';
import { useToast } from '@/hooks/use-toast';
import type { Address } from '@shared/schema';
import { shippingAPI, type ShippingRate } from '@/lib/api';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface CheckoutProps {
  items: CartItem[];
  onOrderComplete?: () => void;
}

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

function InputField({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  required = true,
  error
}: InputFieldProps) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-2">
        {label}{required && ' *'}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border bg-transparent px-4 py-3 focus:border-foreground outline-none transition-colors ${
          error ? 'border-red-500' : 'border-border'
        }`}
        data-testid={`input-${name}`}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}

interface ShippingFormData {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  country: string;
  state: string;
  zip: string;
  phone: string;
}

const emptyShippingForm: ShippingFormData = {
  email: '',
  firstName: '',
  lastName: '',
  address: '',
  apartment: '',
  city: '',
  country: 'United States',
  state: '',
  zip: '',
  phone: '',
};

function parseAddressString(addressStr: string): ShippingFormData {
  try {
    return JSON.parse(addressStr);
  } catch {
    return { ...emptyShippingForm, address: addressStr };
  }
}

function formatAddressForDisplay(addressStr: string): string {
  try {
    const data = JSON.parse(addressStr) as ShippingFormData;
    return `${data.firstName} ${data.lastName}, ${data.address}${data.apartment ? ` ${data.apartment}` : ''}, ${data.city}, ${data.state} ${data.zip}`;
  } catch {
    return addressStr;
  }
}

interface StripePaymentFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  total: number;
}

function StripePaymentForm({ onSuccess, onError, isProcessing, setIsProcessing, total }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/order-confirmation',
      },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message || 'Payment failed');
      setIsProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="space-y-6">
      <div className="border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-5 h-5" />
          <span className="font-medium">Payment Details</span>
        </div>
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <Shield className="w-4 h-4" />
        <span>Your payment is secured by Stripe</span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!stripe || isProcessing}
        className="w-full bg-foreground text-background py-4 text-sm tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="button-place-order"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            PROCESSING...
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            PAY {formatPrice(total)}
          </>
        )}
      </button>
    </div>
  );
}

export function Checkout({ items, onOrderComplete }: CheckoutProps) {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const { data: savedAddresses, isLoading: addressesLoading } = useCustomerAddresses(user?.id);
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  
  const [step, setStep] = useState<'shipping' | 'delivery' | 'payment' | 'review'>('shipping');
  const [shippingInfo, setShippingInfo] = useState<ShippingFormData>(emptyShippingForm);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShippingRate, setSelectedShippingRate] = useState<ShippingRate | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  const defaultAddress = savedAddresses?.find(a => a.isDefault);
  const hasAddresses = savedAddresses && savedAddresses.length > 0;

  useEffect(() => {
    fetch('/api/stripe/config')
      .then(res => res.json())
      .then(data => {
        if (data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey));
        }
      })
      .catch(err => console.error('Failed to load Stripe config:', err));
  }, []);

  useEffect(() => {
    if (user?.email) {
      setShippingInfo(prev => ({ ...prev, email: user.email }));
    }
  }, [user?.email]);

  useEffect(() => {
    if (defaultAddress && !useNewAddress) {
      setSelectedAddressId(defaultAddress.id);
      const parsed = parseAddressString(defaultAddress.address);
      setShippingInfo(prev => ({ ...prev, ...parsed }));
    }
  }, [defaultAddress, useNewAddress]);

  const subtotal = items.reduce((sum, item) => sum + item.artwork.price * item.quantity, 0);
  const shippingCost = selectedShippingRate ? selectedShippingRate.price : 0;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shippingCost + tax;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const createPaymentIntent = async () => {
    if (!selectedShippingRate || !shippingInfo.zip) return;
    
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ artworkId: i.artwork.id, quantity: i.quantity })),
          shippingMailClass: selectedShippingRate.mailClass,
          destinationZip: shippingInfo.zip,
          customerId: user?.id,
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setPaymentReady(true);
      } else {
        throw new Error('No client secret returned');
      }
    } catch (err: any) {
      console.error('Failed to create payment intent:', err);
      toast({ title: err.message || 'Failed to initialize payment', variant: 'destructive' });
    }
  };

  const validateShipping = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!shippingInfo.email) newErrors.email = 'Email is required';
    if (!shippingInfo.firstName) newErrors.firstName = 'First name is required';
    if (!shippingInfo.lastName) newErrors.lastName = 'Last name is required';
    if (!shippingInfo.address) newErrors.address = 'Address is required';
    if (!shippingInfo.city) newErrors.city = 'City is required';
    if (!shippingInfo.state) newErrors.state = 'State is required';
    if (!shippingInfo.zip) newErrors.zip = 'ZIP code is required';
    if (!shippingInfo.phone) newErrors.phone = 'Phone is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchShippingRates = async () => {
    if (!shippingInfo.zip) return;
    
    setLoadingRates(true);
    try {
      const response = await shippingAPI.getRates({
        originZip: '10001',
        destinationZip: shippingInfo.zip,
        items: items.map(item => ({ quantity: item.quantity })),
      });
      
      if (response.rates && response.rates.length > 0) {
        setShippingRates(response.rates);
        setSelectedShippingRate(response.rates[0]);
      }
    } catch (error) {
      console.error('Failed to fetch shipping rates:', error);
      toast({ title: 'Could not fetch shipping rates', variant: 'destructive' });
    } finally {
      setLoadingRates(false);
    }
  };

  const handleContinueToDelivery = async () => {
    if (!validateShipping()) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    if (useNewAddress && user?.id) {
      const addressData = JSON.stringify(shippingInfo);
      try {
        if (saveAsDefault && defaultAddress) {
          await updateAddress.mutateAsync({ 
            id: defaultAddress.id, 
            data: { isDefault: false } 
          });
        }
        await createAddress.mutateAsync({
          customerId: user.id,
          type: 'shipping',
          address: addressData,
          isDefault: saveAsDefault,
        });
        toast({ title: saveAsDefault ? 'Address saved as default' : 'Address saved' });
      } catch {
        toast({ title: 'Failed to save address', variant: 'destructive' });
      }
    }

    setStep('delivery');
    fetchShippingRates();
  };

  const goToStep = (targetStep: typeof step) => {
    const stepOrder = ['shipping', 'delivery', 'payment', 'review'];
    const currentIndex = stepOrder.indexOf(step);
    const targetIndex = stepOrder.indexOf(targetStep);
    
    if (targetIndex < currentIndex) {
      setStep(targetStep);
      return true;
    }
    return false;
  };

  const handleContinueToPayment = async () => {
    if (!selectedShippingRate) {
      toast({ title: 'Please select a shipping method', variant: 'destructive' });
      return;
    }
    setStep('payment');
    await createPaymentIntent();
  };

  const handlePaymentSuccess = async () => {
    try {
      const orderData = {
        id: paymentIntentId || `order_${Date.now()}`,
        customerId: user?.id || '',
        customerName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        customerEmail: shippingInfo.email || user?.email || '',
        customerPhone: shippingInfo.phone || '',
        shippingAddress: JSON.stringify(shippingInfo),
        billingAddress: JSON.stringify(shippingInfo),
        status: 'processing',
        paymentStatus: 'paid',
        items: items.map(item => ({
          id: item.artwork.id,
          title: item.artwork.title,
          image: item.artwork.image,
          price: item.artwork.price,
          quantity: item.quantity,
        })),
        subtotal,
        shipping: selectedShippingRate?.price || 0,
        tax,
        total,
        timeline: [
          {
            date: new Date().toISOString(),
            event: 'Order placed',
            note: 'Payment confirmed via Stripe',
          },
        ],
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      toast({ title: 'Order placed successfully!' });
      if (onOrderComplete) {
        onOrderComplete();
      }
      setLocation('/order-confirmation');
    } catch (error) {
      console.error('Failed to create order:', error);
      toast({ title: 'Payment successful but order creation failed. Please contact support.', variant: 'destructive' });
    }
  };

  const handlePaymentError = (message: string) => {
    toast({ title: message, variant: 'destructive' });
    setIsProcessing(false);
  };

  const handleSelectSavedAddress = (address: Address) => {
    setSelectedAddressId(address.id);
    setUseNewAddress(false);
    const parsed = parseAddressString(address.address);
    setShippingInfo(prev => ({ ...prev, ...parsed }));
    setErrors({});
  };

  const handleUseNewAddress = () => {
    setUseNewAddress(true);
    setSelectedAddressId(null);
    setShippingInfo({ ...emptyShippingForm, email: user?.email || '' });
    setSaveAsDefault(true);
  };

  const handleSetAsDefault = async (addressId: string) => {
    try {
      if (defaultAddress && defaultAddress.id !== addressId) {
        await updateAddress.mutateAsync({ id: defaultAddress.id, data: { isDefault: false } });
      }
      await updateAddress.mutateAsync({ id: addressId, data: { isDefault: true } });
      toast({ title: 'Default address updated' });
    } catch {
      toast({ title: 'Failed to update default address', variant: 'destructive' });
    }
  };

  if (authLoading || addressesLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-display text-2xl mb-4">Your cart is empty</h1>
          <Link href="/collections">
            <span className="link-underline">Continue Shopping</span>
          </Link>
        </div>
      </div>
    );
  }

  const stripeAppearance = {
    theme: 'flat' as const,
    variables: {
      colorPrimary: '#000000',
      colorBackground: '#ffffff',
      colorText: '#000000',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '0px',
    },
    rules: {
      '.Input': {
        border: '1px solid #e5e5e5',
        padding: '12px 16px',
      },
      '.Input:focus': {
        border: '1px solid #000000',
        boxShadow: 'none',
      },
      '.Label': {
        fontSize: '12px',
        fontWeight: '400',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        color: '#737373',
        marginBottom: '8px',
      },
    },
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-24">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <Link href="/">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 block">
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </span>
        </Link>

        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <div className="flex items-center gap-4 mb-12">
              {['shipping', 'delivery', 'payment'].map((s, i) => {
                const stepOrder = ['shipping', 'delivery', 'payment'];
                const currentIndex = stepOrder.indexOf(step);
                const targetIndex = stepOrder.indexOf(s);
                const isCompleted = targetIndex < currentIndex;
                const isCurrent = step === s;
                
                const handleStepClick = () => {
                  if (targetIndex < currentIndex) {
                    goToStep(s as typeof step);
                  }
                };
                
                return (
                  <div key={s} className="flex items-center">
                    <button
                      onClick={handleStepClick}
                      disabled={targetIndex > currentIndex}
                      className={`flex items-center gap-2 ${
                        isCurrent ? 'text-foreground' : isCompleted ? 'text-foreground cursor-pointer' : 'text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 flex items-center justify-center text-sm border ${
                          isCurrent
                            ? 'bg-foreground text-background border-foreground'
                            : isCompleted
                            ? 'bg-foreground/10 border-foreground'
                            : 'border-border'
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                      </span>
                      <span className="hidden md:block text-sm uppercase tracking-wide">
                        {s === 'delivery' ? 'Delivery' : s}
                      </span>
                    </button>
                    {i < 2 && (
                      <div className="w-8 md:w-12 h-px bg-border mx-2" />
                    )}
                  </div>
                );
              })}
            </div>

            {step === 'shipping' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-display text-2xl font-semibold mb-8">
                  SHIPPING INFORMATION
                </h2>

                {hasAddresses && !useNewAddress && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-sm font-medium">SAVED ADDRESSES</h3>
                    {savedAddresses?.map((address) => (
                      <div
                        key={address.id}
                        className={`border p-4 cursor-pointer transition-colors ${
                          selectedAddressId === address.id
                            ? 'border-foreground bg-accent/50'
                            : 'border-border hover:border-foreground/50'
                        }`}
                        onClick={() => handleSelectSavedAddress(address)}
                        data-testid={`address-${address.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-sm">{formatAddressForDisplay(address.address)}</p>
                              {address.isDefault && (
                                <span className="text-xs text-muted-foreground mt-1 inline-block">Default</span>
                              )}
                            </div>
                          </div>
                          {!address.isDefault && selectedAddressId === address.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetAsDefault(address.id);
                              }}
                              className="text-xs underline text-muted-foreground hover:text-foreground"
                              data-testid="button-set-default"
                            >
                              Set as default
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={handleUseNewAddress}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-add-new-address"
                    >
                      <Plus className="w-4 h-4" />
                      Add new address
                    </button>
                  </div>
                )}

                {(!hasAddresses || useNewAddress) && (
                  <>
                    {useNewAddress && (
                      <button
                        onClick={() => {
                          setUseNewAddress(false);
                          if (defaultAddress) handleSelectSavedAddress(defaultAddress);
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground mb-4"
                        data-testid="button-use-saved"
                      >
                        ← Use saved address
                      </button>
                    )}

                    <InputField
                      label="EMAIL"
                      name="email"
                      type="email"
                      value={shippingInfo.email}
                      onChange={(v) => setShippingInfo({ ...shippingInfo, email: v })}
                      error={errors.email}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="FIRST NAME"
                        name="firstName"
                        value={shippingInfo.firstName}
                        onChange={(v) => setShippingInfo({ ...shippingInfo, firstName: v })}
                        error={errors.firstName}
                      />
                      <InputField
                        label="LAST NAME"
                        name="lastName"
                        value={shippingInfo.lastName}
                        onChange={(v) => setShippingInfo({ ...shippingInfo, lastName: v })}
                        error={errors.lastName}
                      />
                    </div>

                    <InputField
                      label="ADDRESS"
                      name="address"
                      value={shippingInfo.address}
                      onChange={(v) => setShippingInfo({ ...shippingInfo, address: v })}
                      error={errors.address}
                    />

                    <InputField
                      label="APARTMENT, SUITE, ETC."
                      name="apartment"
                      value={shippingInfo.apartment}
                      onChange={(v) => setShippingInfo({ ...shippingInfo, apartment: v })}
                      required={false}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="CITY"
                        name="city"
                        value={shippingInfo.city}
                        onChange={(v) => setShippingInfo({ ...shippingInfo, city: v })}
                        error={errors.city}
                      />
                      <InputField
                        label="STATE"
                        name="state"
                        value={shippingInfo.state}
                        onChange={(v) => setShippingInfo({ ...shippingInfo, state: v })}
                        error={errors.state}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="ZIP CODE"
                        name="zip"
                        value={shippingInfo.zip}
                        onChange={(v) => setShippingInfo({ ...shippingInfo, zip: v })}
                        error={errors.zip}
                      />
                      <InputField
                        label="PHONE"
                        name="phone"
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={(v) => setShippingInfo({ ...shippingInfo, phone: v })}
                        error={errors.phone}
                      />
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveAsDefault}
                        onChange={(e) => setSaveAsDefault(e.target.checked)}
                        className="w-4 h-4 accent-foreground"
                        data-testid="checkbox-save-default"
                      />
                      <span className="text-sm">Save as default shipping address</span>
                    </label>
                  </>
                )}

                <button
                  onClick={handleContinueToDelivery}
                  className="w-full bg-foreground text-background py-4 text-sm tracking-wide hover:opacity-90 transition-opacity mt-8"
                  data-testid="button-continue-delivery"
                >
                  CONTINUE TO DELIVERY
                </button>
              </motion.div>
            )}

            {step === 'delivery' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-display text-2xl font-semibold mb-8">
                  DELIVERY METHOD
                </h2>

                <div className="border-b border-border pb-6 mb-6">
                  <h3 className="text-sm font-medium mb-2">SHIPPING TO</h3>
                  <p className="text-sm text-muted-foreground">
                    {shippingInfo.firstName} {shippingInfo.lastName}, {shippingInfo.address}
                    {shippingInfo.apartment && ` ${shippingInfo.apartment}`}, {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zip}
                  </p>
                </div>

                {loadingRates ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-muted-foreground">Calculating shipping rates...</span>
                  </div>
                ) : shippingRates.length > 0 ? (
                  <div className="space-y-3">
                    {shippingRates.map((rate) => (
                      <div
                        key={rate.mailClass}
                        onClick={() => setSelectedShippingRate(rate)}
                        className={`border p-4 cursor-pointer transition-colors ${
                          selectedShippingRate?.mailClass === rate.mailClass
                            ? 'border-foreground bg-accent/50'
                            : 'border-border hover:border-foreground/50'
                        }`}
                        data-testid={`shipping-rate-${rate.mailClass}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{rate.mailClassName}</p>
                              {rate.deliveryDays && (
                                <p className="text-sm text-muted-foreground">
                                  Estimated {rate.deliveryDays} business day{rate.deliveryDays > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="font-medium">{formatPrice(rate.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Unable to calculate shipping rates.</p>
                    <p className="text-sm mt-2">Please verify your shipping address.</p>
                  </div>
                )}

                <button
                  onClick={handleContinueToPayment}
                  disabled={!selectedShippingRate || loadingRates}
                  className="w-full bg-foreground text-background py-4 text-sm tracking-wide hover:opacity-90 transition-opacity mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-continue-payment"
                >
                  CONTINUE TO PAYMENT
                </button>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-display text-2xl font-semibold mb-8">
                  PAYMENT
                </h2>

                <div className="border-b border-border pb-6 mb-6">
                  <h3 className="text-sm font-medium mb-2">SHIPPING TO</h3>
                  <p className="text-sm text-muted-foreground">
                    {shippingInfo.firstName} {shippingInfo.lastName}, {shippingInfo.address}
                    {shippingInfo.apartment && ` ${shippingInfo.apartment}`}, {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zip}
                  </p>
                </div>

                <div className="border-b border-border pb-6 mb-6">
                  <h3 className="text-sm font-medium mb-2">DELIVERY METHOD</h3>
                  {selectedShippingRate && (
                    <p className="text-sm text-muted-foreground">
                      {selectedShippingRate.mailClassName} - {formatPrice(selectedShippingRate.price)}
                      {selectedShippingRate.deliveryDays && ` (${selectedShippingRate.deliveryDays} days)`}
                    </p>
                  )}
                </div>

                {stripePromise && clientSecret && paymentReady ? (
                  <Elements 
                    stripe={stripePromise} 
                    options={{ 
                      clientSecret,
                      appearance: stripeAppearance,
                    }}
                  >
                    <StripePaymentForm
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                      total={total}
                    />
                  </Elements>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-muted-foreground">Loading payment form...</span>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <div className="lg:pl-16 lg:border-l border-border">
            <div className="sticky top-32">
              <h3 className="text-display text-lg font-medium mb-6">ORDER SUMMARY</h3>

              <div className="space-y-4 mb-8">
                {items.map((item) => (
                  <div key={item.artwork.id} className="flex gap-4">
                    <div className="w-20 h-24 bg-muted overflow-hidden relative">
                      <img
                        src={item.artwork.image}
                        alt={item.artwork.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-foreground text-background text-xs flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.artwork.title}</p>
                      <p className="text-xs text-muted-foreground">{item.artwork.medium}</p>
                    </div>
                    <p className="text-sm">{formatPrice(item.artwork.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {selectedShippingRate 
                      ? formatPrice(selectedShippingRate.price)
                      : 'Calculated at next step'}
                  </span>
                </div>
                {selectedShippingRate && (
                  <div className="text-xs text-muted-foreground">
                    {selectedShippingRate.mailClassName}
                    {selectedShippingRate.deliveryDays && ` (${selectedShippingRate.deliveryDays} days)`}
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-medium pt-4 border-t border-border">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="mt-8 space-y-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4" />
                  <span>Insured shipping via USPS</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4" />
                  <span>Secure worldwide delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
