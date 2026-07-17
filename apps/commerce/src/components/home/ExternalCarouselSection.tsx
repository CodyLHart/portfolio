import { getSafeCmsHref, isExternalHref } from "../../lib/content";
import type {
  ResolvedCarouselItem,
  ResolvedExternalCarouselSection,
} from "../../lib/homepage";
import { formatShopifyPrice } from "../../lib/shopify/format";
import { urlForSanityImage } from "../../sanity/lib/image";
import type { SanityHeroImage } from "../../sanity/lib/types";
import {
  ExternalCarouselTrack,
  type ExternalCarouselTrackItem,
} from "./ExternalCarouselTrack";

type RenderableImage = SanityHeroImage & {
  alt: string;
  asset: NonNullable<SanityHeroImage["asset"]>;
};

const hasRenderableImage = (
  image: SanityHeroImage | null,
): image is RenderableImage => Boolean(image?.asset && image.alt);

const imageDimensions = (image: SanityHeroImage) => {
  const dimensions = image.asset?.metadata?.dimensions;

  return {
    width: dimensions?.width && dimensions.width > 0 ? dimensions.width : 800,
    height: dimensions?.height && dimensions.height > 0 ? dimensions.height : 1000,
  };
};

const toSanityTrackImage = (
  image: SanityHeroImage,
  fallbackAlt: string,
): ExternalCarouselTrackItem["image"] => {
  const { width, height } = imageDimensions(image);

  return {
    alt: image.alt?.trim() || fallbackAlt,
    src: urlForSanityImage(image)
      .width(800)
      .height(800)
      .fit("crop")
      .auto("format")
      .url(),
    width,
    height,
    blurDataURL: image.asset?.metadata?.lqip ?? null,
  };
};

const toTrackItem = (item: ResolvedCarouselItem): ExternalCarouselTrackItem | null => {
  if (item._type === "externalCarouselItem") {
    const safeHref = getSafeCmsHref(item.href);

    if (!safeHref || !isExternalHref(safeHref) || !hasRenderableImage(item.image)) {
      return null;
    }

    return {
      _key: item._key,
      linkType: "external",
      title: item.title,
      subtitle: item.subtitle,
      href: safeHref,
      openInNewTab: item.openInNewTab,
      image: toSanityTrackImage(item.image, item.title),
    };
  }

  const title = item.customTitle?.trim() || item.product.title;
  const subtitle =
    item.customSubtitle?.trim() ||
    (!item.product.availableForSale
      ? "Sold out"
      : formatShopifyPrice(item.product.priceRange.minVariantPrice));
  const customImage =
    item.customImage?.asset && item.customImage.alt ? item.customImage : null;
  const productImage = item.product.featuredImage;

  return {
    _key: item._key,
    linkType: "internal",
    title,
    subtitle,
    href: `/store/${item.product.handle}`,
    openInNewTab: false,
    image: customImage
      ? toSanityTrackImage(customImage, title)
      : productImage
        ? {
            alt: productImage.altText ?? title,
            src: productImage.url,
            width: productImage.width && productImage.width > 0 ? productImage.width : 800,
            height:
              productImage.height && productImage.height > 0
                ? productImage.height
                : 800,
            blurDataURL: null,
          }
        : null,
  };
};

export function ExternalCarouselSection({
  section,
}: {
  section: ResolvedExternalCarouselSection;
}) {
  const headingId = `${section._key}-heading`;
  const items = (section.items ?? [])
    .map((item) => toTrackItem(item))
    .filter((item): item is ExternalCarouselTrackItem => Boolean(item));

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className="home-section external-carousel-section"
      aria-labelledby={headingId}
    >
      <ExternalCarouselTrack
        heading={section.heading}
        headingId={headingId}
        items={items}
      />
    </section>
  );
}
