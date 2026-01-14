import { useState, useCallback, useEffect } from 'react';
import { useRoute } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock } from 'lucide-react';
import { Link } from 'wouter';
import { ArtworkCard } from '@/components/ArtworkCard';
import { Countdown } from '@/components/Countdown';
import { useDrops, useArtworks } from '@/lib/hooks';
import { getDropStatus, getDropStartDate, getDropEndDate, formatDropDate, type DropStatus } from '@/lib/dropUtils';
import type { Drop as DropType } from '@shared/schema';

function DropContent({ drop, allArtworks }: { drop: DropType; allArtworks: any[] }) {
  const [status, setStatus] = useState<DropStatus>(() => getDropStatus(drop));
  const startDate = getDropStartDate(drop);
  const endDate = getDropEndDate(drop);
  const dropArtworks = allArtworks?.filter(a => drop.artworkIds.includes(a.id)) || [];

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

  return (
    <div className="min-h-screen">
      <section className="relative min-h-[70vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          {drop.heroImage ? (
            <img
              src={drop.heroImage}
              alt={drop.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-900 to-neutral-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-[1800px] mx-auto px-6 md:px-12 pb-16 md:pb-24"
        >
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </Link>
          
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                {status === 'active' && (
                  <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] bg-foreground text-background px-3 py-1.5">
                    <span className="w-2 h-2 bg-background rounded-full animate-pulse" />
                    LIVE NOW
                  </span>
                )}
                {status === 'scheduled' && (
                  <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] border border-foreground/30 px-3 py-1.5">
                    <Clock className="w-3 h-3" />
                    UPCOMING
                  </span>
                )}
                {status === 'ended' && (
                  <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-muted-foreground border border-border px-3 py-1.5">
                    ENDED
                  </span>
                )}
              </div>
              
              <h1 className="text-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-[-0.02em] mb-3">
                {drop.title}
              </h1>
              {drop.subtitle && (
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
                  {drop.subtitle}
                </p>
              )}
            </div>
            
            {status === 'scheduled' && (
              <div className="bg-card/80 backdrop-blur-sm p-6 md:p-8">
                <p className="text-xs tracking-widest text-muted-foreground mb-4">DROPS IN</p>
                <Countdown targetDate={startDate} onComplete={handleCountdownComplete} />
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {status === 'scheduled' && (
        <section className="max-w-[1800px] mx-auto px-6 md:px-12 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-display text-2xl md:text-3xl font-semibold mb-4">
              {dropArtworks.length} {dropArtworks.length === 1 ? 'Piece' : 'Pieces'} Dropping
            </h2>
            <p className="text-muted-foreground mb-8">
              {drop.description}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDropDate(drop)}
            </p>
          </motion.div>
          
          {dropArtworks.length > 0 && (
            <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 opacity-50">
              {dropArtworks.map((artwork, index) => (
                <motion.div
                  key={artwork.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="relative"
                >
                  <div className="aspect-[4/5] bg-card overflow-hidden">
                    <img
                      src={artwork.image}
                      alt={artwork.title}
                      className="w-full h-full object-cover blur-sm"
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-background/90 px-4 py-2 text-xs tracking-widest">
                      COMING SOON
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {status === 'active' && (
        <section className="max-w-[1800px] mx-auto px-6 md:px-12 py-16 md:py-24">
          <div className="mb-12">
            <p className="text-muted-foreground max-w-2xl">
              {drop.description}
            </p>
          </div>
          
          {dropArtworks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {dropArtworks.map((artwork, index) => (
                <ArtworkCard key={artwork.id} artwork={artwork} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              No artworks in this drop
            </div>
          )}
        </section>
      )}

      {status === 'ended' && (
        <section className="max-w-[1800px] mx-auto px-6 md:px-12 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-display text-2xl md:text-3xl font-semibold mb-4">
              This Drop Has Ended
            </h2>
            <p className="text-muted-foreground mb-8">
              {drop.description}
            </p>
            <Link href="/collections">
              <button className="bg-foreground text-background px-8 py-4 text-sm tracking-wide hover:opacity-90 transition-opacity">
                BROWSE COLLECTIONS
              </button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

export function Drop() {
  const [, params] = useRoute('/drop/:id');
  const dropId = params?.id;
  
  const { data: drops, isLoading: dropsLoading } = useDrops();
  const { data: allArtworks, isLoading: artworksLoading } = useArtworks();
  
  if (dropsLoading || artworksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  const drop = drops?.find(d => d.id === dropId);
  
  if (!drop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <h1 className="text-2xl font-display">Drop not found</h1>
        <Link href="/">
          <button className="text-sm link-underline">Back to Home</button>
        </Link>
      </div>
    );
  }
  
  return <DropContent drop={drop} allArtworks={allArtworks || []} />;
}
