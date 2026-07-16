import Image from "next/image";
import Link from "next/link";
import { urlForSanityImage } from "../../sanity/lib/image";
import type { SanityHeroImage } from "../../sanity/lib/types";
import type {
  ResolvedPromoCollectionTile,
  ResolvedSplitCollectionHeroSection,
} from "../../lib/homepage";

type RenderableTile = ResolvedPromoCollectionTile & {
  image: SanityHeroImage & {
    alt: string;
    asset: NonNullable<SanityHeroImage["asset"]>;
  };
  collection: NonNullable<ResolvedPromoCollectionTile["collection"]>;
};

const hasRenderableTile = (
  tile: ResolvedPromoCollectionTile,
): tile is RenderableTile =>
  Boolean(tile.collection && tile.image?.asset && tile.image.alt);

const imageDimensions = (image: SanityHeroImage) => {
  const dimensions = image.asset?.metadata?.dimensions;

  return {
    width: dimensions?.width && dimensions.width > 0 ? dimensions.width : 1200,
    height: dimensions?.height && dimensions.height > 0 ? dimensions.height : 900,
  };
};

const SplitCollectionTile = ({
  align,
  priority,
  tile,
}: {
  align: "left" | "right";
  priority: boolean;
  tile: RenderableTile;
}) => {
  const { width, height } = imageDimensions(tile.image);
  const lqip = tile.image.asset.metadata?.lqip;

  return (
    <Link
      className={`split-collection-tile split-collection-tile-${align}`}
      href={`/store/collections/${tile.collection.handle}`}
    >
      <span className="split-collection-image">
        <Image
          src={urlForSanityImage(tile.image)
            .width(1200)
            .height(900)
            .fit("crop")
            .auto("format")
            .url()}
          alt={tile.image.alt}
          width={width}
          height={height}
          sizes="(max-width: 900px) 100vw, 50vw"
          placeholder={lqip ? "blur" : "empty"}
          blurDataURL={lqip ?? undefined}
          priority={priority}
        />
      </span>
      <span className="split-collection-label">{tile.label}</span>
    </Link>
  );
};

export function SplitCollectionHeroSection({
  section,
}: {
  section: ResolvedSplitCollectionHeroSection;
}) {
  const tiles = section.tiles.filter(hasRenderableTile);

  if (tiles.length === 0) {
    return null;
  }

  return (
    <section
      className="split-collection-hero split-collection-hero-full-bleed"
      aria-label="Featured collections"
    >
      {tiles.map((tile, index) => (
        <SplitCollectionTile
          align={index === 1 ? "right" : "left"}
          key={tile._key}
          tile={tile}
          priority={index < 2}
        />
      ))}
    </section>
  );
}
