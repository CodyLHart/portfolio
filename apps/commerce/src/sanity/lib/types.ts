export type SanityImageDimensions = {
  width: number;
  height: number;
  aspectRatio: number;
};

export type SanityHeroImage = {
  alt: string | null;
  crop: Record<string, number> | null;
  hotspot: Record<string, number> | null;
  asset: {
    _id: string;
    url: string | null;
    metadata: {
      dimensions: SanityImageDimensions | null;
      lqip: string | null;
    } | null;
  } | null;
};

export type HomePageContent = {
  eyebrow: string | null;
  heading: string;
  body: string;
  storeLinkLabel: string;
  heroImage: SanityHeroImage | null;
  featuredCollectionHeading: string | null;
  featuredCollectionHandle: string | null;
};
