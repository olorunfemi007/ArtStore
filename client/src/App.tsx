import { useState, useCallback, useEffect, useRef } from 'react';
import { Switch, Route } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Cart } from '@/components/Cart';
import { SearchModal } from '@/components/SearchModal';
import { Home } from '@/pages/Home';
import { CollectionsPage } from '@/pages/CollectionsPage';
import { CollectionDetail } from '@/pages/CollectionDetail';
import { ArtworkDetail } from '@/pages/ArtworkDetail';
import { About } from '@/pages/About';
import { Checkout } from '@/pages/Checkout';
import { Account } from '@/pages/Account';
import { Shipping } from '@/pages/Shipping';
import { Contact } from '@/pages/Contact';
import { Privacy } from '@/pages/Privacy';
import { Terms } from '@/pages/Terms';
import { Admin } from '@/pages/Admin';
import { Drop } from '@/pages/Drop';
import { OrderConfirmation } from '@/pages/OrderConfirmation';
import Login from '@/pages/Login';
import NotFound from '@/pages/not-found';
import { CartItem } from '@/lib/mockData';

interface ArtworkForCart {
  id: string;
  title: string;
  price: number;
  image: string;
  soldOut: boolean;
  type: string;
  editionRemaining?: number | null;
}

function getMaxQuantity(artwork: ArtworkForCart): number {
  if (artwork.type === 'original') return 1;
  if (artwork.type === 'limited' && artwork.editionRemaining != null) {
    return artwork.editionRemaining;
  }
  return 999;
}

interface RouterProps {
  onAddToCart: (artwork: ArtworkForCart) => void;
  cartItems: CartItem[];
  clearCart: () => void;
}

function Router({ onAddToCart, cartItems, clearCart }: RouterProps) {
  return (
    <Switch>
      <Route path="/">
        <Home onAddToCart={onAddToCart} />
      </Route>
      <Route path="/collections" component={CollectionsPage} />
      <Route path="/collection/:slug" component={CollectionDetail} />
      <Route path="/artwork/:id">
        <ArtworkDetail onAddToCart={onAddToCart} />
      </Route>
      <Route path="/about" component={About} />
      <Route path="/checkout">
        <Checkout items={cartItems} onOrderComplete={clearCart} />
      </Route>
      <Route path="/order-confirmation" component={OrderConfirmation} />
      <Route path="/account" component={Account} />
      <Route path="/shipping" component={Shipping} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/drop/:id" component={Drop} />
      <Route path="/admin" component={Admin} />
      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

const CART_STORAGE_KEY_PREFIX = 'studiodrop_cart_';
const GUEST_CART_KEY = 'studiodrop_cart_guest';

function getCartStorageKey(userId?: string): string {
  return userId ? `${CART_STORAGE_KEY_PREFIX}${userId}` : GUEST_CART_KEY;
}

function loadCartFromStorage(userId?: string): CartItem[] {
  try {
    const key = getCartStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load cart from storage:', e);
  }
  return [];
}

function saveCartToStorage(items: CartItem[], userId?: string) {
  try {
    const key = getCartStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save cart to storage:', e);
  }
}

function AppContent() {
  const { user, isLoading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { toast } = useToast();
  const prevUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (authLoading) return;
    
    const currentUserId = user?.id;
    const prevUserId = prevUserIdRef.current;
    
    if (currentUserId !== prevUserId) {
      const loadedCart = loadCartFromStorage(currentUserId);
      setCartItems(loadedCart);
      prevUserIdRef.current = currentUserId;
    }
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (authLoading) return;
    saveCartToStorage(cartItems, user?.id);
  }, [cartItems, user?.id, authLoading]);

  const addToCart = useCallback((artwork: ArtworkForCart) => {
    if (!artwork || artwork.soldOut) return;

    const maxQty = getMaxQuantity(artwork);

    setCartItems((items) => {
      const existing = items.find((item) => item.artwork.id === artwork.id);
      if (existing) {
        if (existing.quantity >= maxQty) {
          return items;
        }
        return items.map((item) =>
          item.artwork.id === artwork.id
            ? { ...item, quantity: Math.min(item.quantity + 1, maxQty) }
            : item
        );
      }
      return [...items, { artwork: artwork as any, quantity: 1 }];
    });

    setCartItems((items) => {
      const existing = items.find((item) => item.artwork.id === artwork.id);
      if (existing && existing.quantity >= maxQty) {
        toast({
          title: "Maximum quantity reached",
          description: artwork.type === 'original' 
            ? "This is a one-of-a-kind original piece" 
            : `Only ${maxQty} available`,
        });
      }
      return items;
    });

    setCartOpen(true);
  }, [toast]);

  const updateQuantity = useCallback((artworkId: string, quantity: number) => {
    if (quantity < 1) return;
    setCartItems((items) =>
      items.map((item) => {
        if (item.artwork.id === artworkId) {
          const maxQty = getMaxQuantity(item.artwork as ArtworkForCart);
          const newQty = Math.min(quantity, maxQty);
          if (quantity > maxQty) {
            toast({
              title: "Maximum quantity reached",
              description: item.artwork.type === 'original' 
                ? "This is a one-of-a-kind original piece" 
                : `Only ${maxQty} available`,
            });
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  }, [toast]);

  const removeFromCart = useCallback((artworkId: string) => {
    setCartItems((items) => items.filter((item) => item.artwork.id !== artworkId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <TooltipProvider>
      <Toaster />
      <div className="flex flex-col min-h-screen">
        <Header 
          cartCount={cartCount} 
          onCartClick={() => setCartOpen(true)} 
          onSearchClick={() => setSearchOpen(true)}
        />
        <main className="flex-1">
          <Router onAddToCart={addToCart} cartItems={cartItems} clearCart={clearCart} />
        </main>
        <Footer />
      </div>
      <Cart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
      />
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
