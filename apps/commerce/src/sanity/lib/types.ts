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
  sections: HomePageSection[] | null;
};

export type NavigationItemContent = {
  _key?: string;
  label: string | null;
  href: string | null;
  openInNewTab: boolean | null;
};

export type SiteSettingsContent = {
  siteTitle: string | null;
  announcementEnabled: boolean | null;
  announcementText: string | null;
  announcementLink: NavigationItemContent | null;
  headerLinks: NavigationItemContent[] | null;
  footerHeading: string | null;
  footerBody: string | null;
  footerLinks: NavigationItemContent[] | null;
  copyrightText: string | null;
};

export type HomePageSectionBase = {
  _key: string;
  _type: string;
};

export type HeroSectionContent = HomePageSectionBase & {
  _type: "heroSection";
  eyebrow: string | null;
  heading: string;
  body: string;
  ctaLabel: string | null;
  ctaPath: string | null;
  imagePosition: "left" | "right" | null;
  image: SanityHeroImage | null;
};

export type PromoCollectionTileContent = {
  _key: string;
  label: string;
  collectionHandle: string;
  image: SanityHeroImage | null;
};

export type SplitCollectionHeroSectionContent = HomePageSectionBase & {
  _type: "splitCollectionHeroSection";
  tiles: PromoCollectionTileContent[] | null;
};

export type FeaturedCollectionSectionContent = HomePageSectionBase & {
  _type: "featuredCollectionSection";
  heading: string | null;
  collectionHandle: string;
  productCount: number | null;
  linkLabel: string | null;
};

export type ImageTextSectionContent = HomePageSectionBase & {
  _type: "imageTextSection";
  eyebrow: string | null;
  heading: string;
  body: string;
  imagePosition: "left" | "right" | null;
  linkLabel: string | null;
  linkPath: string | null;
  image: SanityHeroImage | null;
};

export type ExternalCarouselItemContent = {
  _key: string;
  title: string;
  subtitle: string | null;
  href: string;
  openInNewTab: boolean | null;
  image: SanityHeroImage | null;
};

export type ExternalCarouselSectionContent = HomePageSectionBase & {
  _type: "externalCarouselSection";
  heading: string;
  items: ExternalCarouselItemContent[] | null;
};

export type HomePageSection =
  | HeroSectionContent
  | SplitCollectionHeroSectionContent
  | FeaturedCollectionSectionContent
  | ImageTextSectionContent
  | ExternalCarouselSectionContent;
