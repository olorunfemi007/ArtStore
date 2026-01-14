import { useState, useCallback, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Bell, X, Check } from 'lucide-react';
import { Countdown } from './Countdown';
import { getDropStatus, getDropStartDate, getDropEndDate, type DropStatus } from '@/lib/dropUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import type { Drop, Artwork } from '@shared/schema';

interface DropHeroProps {
  drop: Drop;
  artworks?: Artwork[];
}

export function DropHero({ drop, artworks = [] }: DropHeroProps) {
  const [status, setStatus] = useState<DropStatus>(() => getDropStatus(drop));
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const startDate = getDropStartDate(drop);
  const endDate = getDropEndDate(drop);

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await apiRequest('POST', '/api/subscribers', {
        email,
        source: 'drop_launch',
      });
      setSubmitted(true);
      setTimeout(() => {
        setShowNotifyDialog(false);
        setSubmitted(false);
        setEmail('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to subscribe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dropArtworks = artworks.filter(a => drop.artworkIds?.includes(a.id)) || [];
  const backgroundImages = dropArtworks.length > 0 
    ? dropArtworks.map(a => a.image) 
    : drop.heroImage 
      ? [drop.heroImage] 
      : [];

  const handleCountdownComplete = useCallback(() => {
    setStatus(getDropStatus(drop));
  }, [drop]);

  useEffect(() => {
    if (status !== 'active' || !endDate) return;
    
    const checkEnd = () => {
      if (new Date() >= endDate) {
        setStatus('ended');
      }
    };
    
    const interval = setInterval(checkEnd, 1000);
    return () => clearInterval(interval);
  }, [status, endDate]);

  useEffect(() => {
    if (backgroundImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % backgroundImages.length);
    }, 7000);
    
    return () => clearInterval(interval);
  }, [backgroundImages.length]);
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        {backgroundImages.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={backgroundImages[currentImageIndex]}
              alt={drop.title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="w-full h-full object-cover absolute inset-0"
            />
          </AnimatePresence>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-900 to-neutral-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 text-center px-6 py-24"
      >
        {status === 'scheduled' && (
          <>
            <span className="inline-block text-xs tracking-[0.3em] mb-6 text-muted-foreground">
              UPCOMING DROP
            </span>
            <h1 className="text-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-[-0.02em] mb-4">
              {drop.title}
            </h1>
            {drop.subtitle && (
              <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-xl mx-auto">
                {drop.subtitle}
              </p>
            )}
            
            <div className="mb-12">
              <Countdown targetDate={startDate} onComplete={handleCountdownComplete} />
            </div>
            
            <button
              onClick={() => setShowNotifyDialog(true)}
              className="inline-flex items-center gap-3 border border-foreground px-8 py-4 text-sm tracking-wide hover:bg-foreground hover:text-background transition-colors"
              data-testid="button-notify-drop"
            >
              <Bell className="w-4 h-4" />
              NOTIFY ME
            </button>
          </>
        )}

        <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-display text-xl">Get Notified</DialogTitle>
            </DialogHeader>
            {submitted ? (
              <div className="flex flex-col items-center py-8">
                <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center mb-4">
                  <Check className="w-6 h-6 text-background" />
                </div>
                <p className="text-center">You're on the list! We'll notify you when {drop.title} drops.</p>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Enter your email to be notified when {drop.title} goes live.
                </p>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                  data-testid="input-notify-email"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12"
                  data-testid="button-submit-notify"
                >
                  {isSubmitting ? 'SUBSCRIBING...' : 'NOTIFY ME'}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {status === 'active' && (
          <>
            <motion.span 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-block text-xs tracking-[0.3em] mb-6 bg-foreground text-background px-4 py-2"
            >
              LIVE NOW
            </motion.span>
            <h1 className="text-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-[-0.02em] mb-4">
              {drop.title}
            </h1>
            {drop.subtitle && (
              <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-xl mx-auto">
                {drop.subtitle}
              </p>
            )}
            
            <Link href={`/drop/${drop.id}`}>
              <button
                className="inline-flex items-center gap-3 bg-foreground text-background px-10 py-5 text-sm tracking-wide hover:opacity-90 transition-opacity"
                data-testid="button-shop-drop"
              >
                SHOP NOW
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </>
        )}

        {status === 'ended' && (
          <>
            <span className="inline-block text-xs tracking-[0.3em] mb-6 text-muted-foreground">
              DROP ENDED
            </span>
            <h1 className="text-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-[-0.02em] mb-4 opacity-60">
              {drop.title}
            </h1>
            <p className="text-muted-foreground mb-8">
              This drop has ended. Stay tuned for the next one.
            </p>
            <Link href="/collections">
              <button
                className="inline-flex items-center gap-3 border border-foreground/50 px-8 py-4 text-sm tracking-wide hover:bg-foreground hover:text-background transition-colors"
                data-testid="button-browse-collections"
              >
                BROWSE COLLECTIONS
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </>
        )}
      </motion.div>
    </section>
  );
}

export function DropBanner({ drop }: { drop: Drop }) {
  const status = getDropStatus(drop);
  const startDate = new Date(`${drop.startDate}T${drop.startTime}`);
  
  if (status === 'ended') return null;
  
  return (
    <Link href={status === 'active' ? `/drop/${drop.id}` : '#'}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-foreground text-background py-3 px-4 text-center cursor-pointer hover:bg-foreground/90 transition-colors"
        data-testid="drop-banner"
      >
        <div className="flex items-center justify-center gap-4 text-sm tracking-wide">
          {status === 'scheduled' ? (
            <>
              <span className="font-medium">{drop.title} DROPS IN</span>
              <span className="font-mono">
                <Countdown targetDate={startDate} />
              </span>
            </>
          ) : (
            <>
              <span className="animate-pulse">●</span>
              <span className="font-medium">{drop.title} IS LIVE</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
