import Image from "next/image";
import Link from "next/link";
import { PageSections } from "../components/home/PageSections";
import { ProductCard } from "../components/product/ProductCard";
import productCardStyles from "../components/product/ProductCard.module.css";
import { resolveHomePageSections } from "../lib/homepage";
import { getCollectionByHandle } from "../lib/shopify/collections";
import { getHomePageContent } from "../sanity/lib/homePage";
import { urlForSanityImage } from "../sanity/lib/image";
import type { HomePageContent, SanityHeroImage } from "../sanity/lib/types";

type RenderableHeroImage = SanityHeroImage & {
  alt: string;
  asset: NonNullable<SanityHeroImage["asset"]>;
};

const fallbackHomePage: HomePageContent = {
  eyebrow: "Independent goods and creative work",
  heading: "Cody Hart Store",
  body: "Shop music, apparel, artwork, and other projects from Cody Hart and collaborators.",
  storeLinkLabel: "View store",
  heroImage: null,
  featuredCollectionHeading: null,
  featuredCollectionHandle: null,
  sections: null,
};

const getHeroImageDimensions = (heroImage: SanityHeroImage) => {
  const dimensions = heroImage.asset?.metadata?.dimensions;

  return {
    width: dimensions?.width && dimensions.width > 0 ? dimensions.width : 1200,
    height: dimensions?.height && dimensions.height > 0 ? dimensions.height : 900,
  };
};

const hasRenderableHeroImage = (
  heroImage: SanityHeroImage | null,
): heroImage is RenderableHeroImage => Boolean(heroImage?.asset && heroImage.alt);

const HeroImage = ({ heroImage }: { heroImage: RenderableHeroImage }) => {
  const { width, height } = getHeroImageDimensions(heroImage);
  const imageUrl = urlForSanityImage(heroImage)
    .width(1200)
    .height(900)
    .fit("crop")
    .auto("format")
    .url();
  const lqip = heroImage.asset?.metadata?.lqip;

  return (
    <div className="commerce-hero-image">
      <Image
        src={imageUrl}
        alt={heroImage.alt}
        width={width}
        height={height}
        sizes="(max-width: 900px) 100vw, 44vw"
        placeholder={lqip ? "blur" : "empty"}
        blurDataURL={lqip ?? undefined}
        priority
      />
    </div>
  );
};

export default async function Page() {
  const homePage = (await getHomePageContent()) ?? fallbackHomePage;
  const hasPageSections = Boolean(homePage.sections?.length);

  if (hasPageSections) {
    const sections = await resolveHomePageSections(homePage);

    return (
      <main className="commerce-shell">
        <PageSections sections={sections} />
      </main>
    );
  }

  const heroImage = hasRenderableHeroImage(homePage.heroImage)
    ? homePage.heroImage
    : null;
  const featuredCollection = await getCollectionByHandle(
    homePage.featuredCollectionHandle,
  );
  const featuredProducts = featuredCollection?.products.nodes ?? [];
  const shouldRenderFeaturedProducts = featuredProducts.length > 0;
  const featuredHeading =
    homePage.featuredCollectionHeading?.trim() ||
    featuredCollection?.title ||
    "Featured products";
  const featuredCollectionHref = featuredCollection
    ? `/store/collections/${featuredCollection.handle}`
    : "/store";

  return (
    <main className="commerce-shell">
      <section
        className={heroImage ? "commerce-hero has-image" : "commerce-hero"}
        aria-labelledby="commerce-heading"
      >
        <div className="commerce-intro">
          {homePage.eyebrow ? (
            <p className="commerce-eyebrow">{homePage.eyebrow}</p>
          ) : null}
          <h1 id="commerce-heading">{homePage.heading}</h1>
          <p>{homePage.body}</p>
          <Link className="commerce-link" href="/store">
            {homePage.storeLinkLabel}
          </Link>
        </div>
        {heroImage ? <HeroImage heroImage={heroImage} /> : null}
      </section>

      {shouldRenderFeaturedProducts ? (
        <section
          className="featured-products"
          aria-labelledby="featured-products-heading"
        >
          <div className="featured-products-header">
            <h2 id="featured-products-heading">{featuredHeading}</h2>
            <Link
              className="cart-store-link"
              href={featuredCollectionHref}
            >
              View collection
            </Link>
          </div>
          <ul className={productCardStyles.grid}>
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
