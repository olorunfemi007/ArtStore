import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { formatPrice } from '@/lib/mockData';
import type { Artwork } from '@shared/schema';

interface ArtworkCardProps {
  artwork: Artwork;
  index?: number;
}

export function ArtworkCard({ artwork, index = 0 }: ArtworkCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link href={`/artwork/${artwork.id}`} data-testid={`card-artwork-${artwork.id}`}>
        <article className="group cursor-pointer">
          <div className="aspect-[3/4] bg-muted overflow-hidden relative">
            <img
              src={artwork.image}
              alt={artwork.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {artwork.soldOut && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <span className="text-display text-sm tracking-widest">SOLD</span>
              </div>
            )}
            {artwork.type === 'limited' && artwork.editionRemaining && artwork.editionRemaining <= 5 && !artwork.soldOut && (
              <div className="absolute bottom-4 left-4">
                <span className="bg-foreground text-background px-3 py-1.5 text-xs tracking-wide">
                  {artwork.editionRemaining} LEFT
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-4 space-y-1">
            <h3 className="text-display font-medium text-sm md:text-base tracking-tight">
              {artwork.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {artwork.medium}, {artwork.year}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-sm">{formatPrice(artwork.price)}</span>
              {artwork.compareAtPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(artwork.compareAtPrice)}
                </span>
              )}
            </div>
            {artwork.type === 'limited' && artwork.editionSize && (
              <p className="text-xs text-muted-foreground">
                Edition of {artwork.editionSize}
              </p>
            )}
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
