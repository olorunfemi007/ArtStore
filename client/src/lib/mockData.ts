import heroImage from '@assets/generated_images/abstract_minimalist_art_painting.png';
import inkPainting from '@assets/generated_images/abstract_ink_brush_painting.png';
import earthTone from '@assets/generated_images/geometric_earth_tone_painting.png';
import landscape from '@assets/generated_images/minimal_gray_landscape_painting.png';

export interface Artwork {
  id: string;
  title: string;
  year: number;
  type: 'original' | 'limited' | 'open';
  medium: string;
  surface: string;
  dimensions: {
    height: number;
    width: number;
    depth?: number;
    unit: 'in' | 'cm';
  };
  price: number;
  compareAtPrice?: number;
  currency: string;
  editionSize?: number;
  editionRemaining?: number;
  image: string;
  images: string[];
  description: string;
  styleTags: string[];
  framed: boolean;
  frameDetails?: string;
  soldOut: boolean;
  dropId?: string;
}

export interface Drop {
  id: string;
  title: string;
  subtitle: string;
  startTime: Date;
  endTime?: Date;
  featured: boolean;
  artworkIds: string[];
  heroImage: string;
}

export interface CartItem {
  artwork: Artwork;
  quantity: number;
}

export const artworks: Artwork[] = [
  {
    id: '1',
    title: 'UNTITLED NO. 47',
    year: 2024,
    type: 'original',
    medium: 'Oil on canvas',
    surface: 'Canvas',
    dimensions: { height: 72, width: 48, unit: 'in' },
    price: 18500,
    currency: 'USD',
    image: heroImage,
    images: [heroImage],
    description: 'A meditation on form and void. Bold gestural strokes create a dialogue between presence and absence, inviting contemplation of the spaces we inhabit.',
    styleTags: ['Abstract', 'Gestural', 'Minimalist'],
    framed: false,
    soldOut: false,
    dropId: 'drop-1',
  },
  {
    id: '2',
    title: 'REMNANT II',
    year: 2024,
    type: 'limited',
    medium: 'Ink on paper',
    surface: 'Paper',
    dimensions: { height: 40, width: 30, unit: 'in' },
    price: 4200,
    compareAtPrice: 5000,
    currency: 'USD',
    editionSize: 25,
    editionRemaining: 8,
    image: inkPainting,
    images: [inkPainting],
    description: 'Part of the Remnant series exploring the traces we leave behind. Each print is hand-signed and numbered.',
    styleTags: ['Abstract', 'Calligraphic', 'Zen'],
    framed: false,
    soldOut: false,
    dropId: 'drop-1',
  },
  {
    id: '3',
    title: 'STRATA',
    year: 2023,
    type: 'original',
    medium: 'Mixed media',
    surface: 'Canvas',
    dimensions: { height: 60, width: 60, unit: 'in' },
    price: 22000,
    currency: 'USD',
    image: earthTone,
    images: [earthTone],
    description: 'Layers of earth pigments and oil create a topography of memory. The work references geological time and the slow accumulation of experience.',
    styleTags: ['Abstract', 'Geometric', 'Earth Tones'],
    framed: true,
    frameDetails: 'Natural oak float frame',
    soldOut: false,
  },
  {
    id: '4',
    title: 'HORIZON LINE',
    year: 2024,
    type: 'open',
    medium: 'Archival pigment print',
    surface: 'Cotton rag paper',
    dimensions: { height: 24, width: 42, unit: 'in' },
    price: 850,
    currency: 'USD',
    image: landscape,
    images: [landscape],
    description: 'A study in subtlety. Soft gradations evoke the liminal space between earth and sky, presence and absence.',
    styleTags: ['Minimal', 'Landscape', 'Atmospheric'],
    framed: false,
    soldOut: false,
  },
  {
    id: '5',
    title: 'VOID STUDY I',
    year: 2024,
    type: 'limited',
    medium: 'Oil on linen',
    surface: 'Linen',
    dimensions: { height: 36, width: 24, unit: 'in' },
    price: 6800,
    currency: 'USD',
    editionSize: 10,
    editionRemaining: 3,
    image: heroImage,
    images: [heroImage],
    description: 'The first in a series examining negative space as subject. What is absent speaks as loudly as what remains.',
    styleTags: ['Abstract', 'Minimalist', 'Conceptual'],
    framed: false,
    soldOut: false,
    dropId: 'drop-1',
  },
  {
    id: '6',
    title: 'PASSAGE',
    year: 2023,
    type: 'original',
    medium: 'Acrylic and graphite',
    surface: 'Canvas',
    dimensions: { height: 84, width: 60, unit: 'in' },
    price: 32000,
    currency: 'USD',
    image: inkPainting,
    images: [inkPainting],
    description: 'A monumental work that demands presence. The viewer is invited to stand before it and allow time to slow.',
    styleTags: ['Abstract', 'Large Scale', 'Contemplative'],
    framed: false,
    soldOut: true,
  },
];

export const drops: Drop[] = [
  {
    id: 'drop-1',
    title: 'WINTER 2024',
    subtitle: 'New works exploring absence and presence',
    startTime: new Date('2024-01-15T12:00:00'),
    featured: true,
    artworkIds: ['1', '2', '5'],
    heroImage: heroImage,
  },
];

export const formatPrice = (price: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const getArtworkById = (id: string): Artwork | undefined => {
  return artworks.find(a => a.id === id);
};

export const getFeaturedDrop = (): Drop | undefined => {
  return drops.find(d => d.featured);
};
