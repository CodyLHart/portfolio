import Image from "next/image";
import Link from "next/link";
import { isValidInternalPath, splitTextParagraphs } from "../../lib/content";
import { urlForSanityImage } from "../../sanity/lib/image";
import type { SanityHeroImage } from "../../sanity/lib/types";
import type { ResolvedHeroSection } from "../../lib/homepage";

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
    width: dimensions?.width && dimensions.width > 0 ? dimensions.width : 1200,
    height: dimensions?.height && dimensions.height > 0 ? dimensions.height : 900,
  };
};

const SectionImage = ({ image }: { image: RenderableImage }) => {
  const { width, height } = imageDimensions(image);
  const lqip = image.asset.metadata?.lqip;

  return (
    <div className="home-section-image">
      <Image
        src={urlForSanityImage(image)
          .width(1200)
          .height(900)
          .fit("crop")
          .auto("format")
          .url()}
        alt={image.alt}
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

export function HeroSection({ section }: { section: ResolvedHeroSection }) {
  const image = hasRenderableImage(section.image) ? section.image : null;
  const ctaPath = isValidInternalPath(section.ctaPath) ? section.ctaPath : null;
  const ctaLabel = section.ctaLabel?.trim();
  const imagePosition = section.imagePosition === "left" ? "left" : "right";

  return (
    <section
      className={
        image
          ? `home-section home-hero image-${imagePosition}`
          : "home-section home-hero"
      }
      aria-labelledby={`${section._key}-heading`}
    >
      <div className="home-section-copy">
        {section.eyebrow ? (
          <p className="commerce-eyebrow">{section.eyebrow}</p>
        ) : null}
        <h1 id={`${section._key}-heading`}>{section.heading}</h1>
        <div className="home-section-body">
          {splitTextParagraphs(section.body).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        {ctaPath && ctaLabel ? (
          <Link className="commerce-link" href={ctaPath}>
            {ctaLabel}
          </Link>
        ) : null}
      </div>
      {image ? <SectionImage image={image} /> : null}
    </section>
  );
}
