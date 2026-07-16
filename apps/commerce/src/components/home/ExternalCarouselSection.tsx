import { getSafeCmsHref, isExternalHref } from "../../lib/content";
import type { ResolvedExternalCarouselSection } from "../../lib/homepage";
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

const toTrackItem = (
  item: NonNullable<ResolvedExternalCarouselSection["items"]>[number],
): ExternalCarouselTrackItem | null => {
  const safeHref = getSafeCmsHref(item.href);

  if (!safeHref || !isExternalHref(safeHref) || !hasRenderableImage(item.image)) {
    return null;
  }

  const { width, height } = imageDimensions(item.image);

  return {
    _key: item._key,
    title: item.title,
    subtitle: item.subtitle,
    href: safeHref,
    openInNewTab: item.openInNewTab,
    image: {
      alt: item.image.alt,
      src: urlForSanityImage(item.image)
        .width(800)
        .height(1000)
        .fit("crop")
        .auto("format")
        .url(),
      width,
      height,
      blurDataURL: item.image.asset.metadata?.lqip ?? null,
    },
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
