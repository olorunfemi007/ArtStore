import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { useState, useEffect, useMemo } from 'react';
import { useCollections } from '@/lib/hooks';
import { useQuery } from '@tanstack/react-query';

interface Artwork {
  id: string;
  title: string;
  image: string;
}

export function About() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: collections = [] } = useCollections();

  const featuredCollections = useMemo(
    () => collections.filter((c) => c.featured),
    [collections]
  );

  const featuredCollectionIds = useMemo(
    () => featuredCollections.map((c) => c.id),
    [featuredCollections]
  );

  const { data: allArtworks = [] } = useQuery<Artwork[]>({
    queryKey: ['/api/artworks'],
  });

  const { data: collectionArtworkLinks = [] } = useQuery<{ collectionId: string; artworkId: string }[]>({
    queryKey: ['all-collection-artworks', featuredCollectionIds],
    queryFn: async () => {
      if (featuredCollectionIds.length === 0) return [];
      const results = await Promise.all(
        featuredCollectionIds.map(async (id) => {
          const res = await fetch(`/api/collections/${id}/artworks`);
          if (!res.ok) return [];
          const artworks: Artwork[] = await res.json();
          return artworks.map((a) => ({ collectionId: id, artworkId: a.id }));
        })
      );
      return results.flat();
    },
    enabled: featuredCollectionIds.length > 0,
  });

  const featuredArtworks = useMemo(() => {
    const artworkIds = new Set(collectionArtworkLinks.map((l) => l.artworkId));
    return allArtworks.filter((a) => artworkIds.has(a.id));
  }, [allArtworks, collectionArtworkLinks]);

  useEffect(() => {
    if (featuredArtworks.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredArtworks.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [featuredArtworks.length]);

  const currentArtwork = featuredArtworks[currentIndex];

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <section className="max-w-[1800px] mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs tracking-widest text-muted-foreground mb-6 block">
              THE ARTIST
            </span>
            <h1 className="text-display text-4xl md:text-6xl font-semibold mb-8 leading-[0.95]">
              EXPLORING<br />THE SPACE<br />BETWEEN
            </h1>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                For over a decade, this work has centered on a single obsession: 
                the relationship between presence and absence. What remains when 
                everything unnecessary is stripped away?
              </p>
              <p>
                Each painting begins with restraint. The gesture must be inevitable, 
                not decorative. The color must breathe, not shout. The canvas must 
                hold space for the viewer to enter and find their own meaning.
              </p>
              <p>
                Working primarily in oil and mixed media, the process is slow and 
                deliberate. Some works take months to complete. Others arrive in 
                a single session of focused intensity. Both are valid. Both are true.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="aspect-[3/4] overflow-hidden relative"
          >
            <AnimatePresence mode="wait">
              {currentArtwork ? (
                <motion.img
                  key={currentArtwork.id}
                  src={currentArtwork.image}
                  alt={currentArtwork.title}
                  className="w-full h-full object-cover absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                />
              ) : (
                <div className="w-full h-full bg-muted" />
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <section className="bg-card grain">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <h2 className="text-display text-3xl md:text-5xl font-semibold mb-12">
              "Art is not about adding more to the world. It's about revealing what was always there."
            </h2>
            <p className="text-muted-foreground">— Studio Notes, 2021</p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-[1800px] mx-auto px-6 md:px-12 py-24 md:py-32">
        <div className="grid md:grid-cols-3 gap-12 md:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-display text-xl font-semibold mb-4">PROCESS</h3>
            <p className="text-muted-foreground leading-relaxed">
              Every work begins with observation. Days spent looking before a single 
              mark is made. The canvas becomes a partner in dialogue, not a surface 
              to conquer. Mistakes are embraced as discoveries.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-display text-xl font-semibold mb-4">MATERIALS</h3>
            <p className="text-muted-foreground leading-relaxed">
              Only the finest materials are used. Belgian linen, cold-pressed oils, 
              hand-ground pigments. The archival quality ensures these works will 
              outlast us all. Art should speak to generations.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-display text-xl font-semibold mb-4">PHILOSOPHY</h3>
            <p className="text-muted-foreground leading-relaxed">
              Less, but better. The reduction of form to its essence. Finding power 
              in restraint and meaning in negative space. Every work is a meditation 
              on what truly matters.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-display text-3xl md:text-4xl font-semibold mb-6">
                EXHIBITIONS & COLLECTIONS
              </h2>
              <p className="text-muted-foreground mb-8">
                Works have been shown internationally and reside in private 
                collections across four continents.
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-baseline border-b border-border pb-4">
                <span>Solo Exhibition, White Cube Gallery</span>
                <span className="text-muted-foreground">2024</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border pb-4">
                <span>Art Basel Miami</span>
                <span className="text-muted-foreground">2023</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border pb-4">
                <span>Venice Biennale</span>
                <span className="text-muted-foreground">2022</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border pb-4">
                <span>MoMA PS1</span>
                <span className="text-muted-foreground">2021</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-foreground text-background">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-16 md:py-24 text-center">
          <h2 className="text-display text-3xl md:text-4xl font-semibold mb-6">
            READY TO START YOUR COLLECTION?
          </h2>
          <p className="text-background/70 mb-8 max-w-lg mx-auto">
            Each piece comes with a certificate of authenticity and worldwide shipping.
          </p>
          <Link href="/collections">
            <button
              className="bg-background text-foreground px-8 py-4 text-sm tracking-wide hover:opacity-90 transition-opacity"
              data-testid="button-browse-collection"
            >
              BROWSE COLLECTIONS
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
