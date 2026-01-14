import { X, Minus, Plus, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { CartItem, formatPrice } from '@/lib/mockData';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (artworkId: string, quantity: number) => void;
  onRemove: (artworkId: string) => void;
}

export function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemove }: CartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.artwork.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-display text-xl font-medium">CART ({items.length})</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent transition-colors"
                data-testid="button-close-cart"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-muted-foreground mb-6">Your cart is empty</p>
                <Link href="/collections">
                  <button
                    onClick={onClose}
                    className="bg-foreground text-background px-8 py-3 text-sm tracking-wide hover:opacity-90 transition-opacity"
                    data-testid="button-continue-shopping"
                  >
                    CONTINUE SHOPPING
                  </button>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {items.map((item) => (
                    <div key={item.artwork.id} className="flex gap-4" data-testid={`cart-item-${item.artwork.id}`}>
                      <div className="w-24 h-32 bg-muted overflow-hidden flex-shrink-0">
                        <img
                          src={item.artwork.image}
                          alt={item.artwork.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 flex flex-col">
                        <h3 className="text-display font-medium text-sm">{item.artwork.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.artwork.medium}
                        </p>
                        <p className="text-sm mt-2">{formatPrice(item.artwork.price)}</p>
                        
                        <div className="flex items-center justify-between mt-auto pt-4">
                          <div className="flex items-center border border-border">
                            <button
                              onClick={() => onUpdateQuantity(item.artwork.id, item.quantity - 1)}
                              className="p-2 hover:bg-accent transition-colors"
                              data-testid={`button-decrease-${item.artwork.id}`}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-4 text-sm">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.artwork.id, item.quantity + 1)}
                              className="p-2 hover:bg-accent transition-colors"
                              data-testid={`button-increase-${item.artwork.id}`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => onRemove(item.artwork.id)}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors link-underline"
                            data-testid={`button-remove-${item.artwork.id}`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-display font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Shipping and taxes calculated at checkout
                  </p>
                  <Link href="/checkout">
                  <button
                    onClick={onClose}
                    className="w-full bg-foreground text-background py-4 text-sm tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    data-testid="button-checkout"
                  >
                    CHECKOUT
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
