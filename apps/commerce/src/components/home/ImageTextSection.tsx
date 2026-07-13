import Image from "next/image";
import Link from "next/link";
import { isValidInternalPath, splitTextParagraphs } from "../../lib/content";
import type { ResolvedImageTextSection } from "../../lib/homepage";
import { urlForSanityImage } from "../../sanity/lib/image";
import type { SanityHeroImage } from "../../sanity/lib/types";

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
      />
    </div>
  );
};

export function ImageTextSection({
  section,
}: {
  section: ResolvedImageTextSection;
}) {
  const image = hasRenderableImage(section.image) ? section.image : null;
  const linkPath = isValidInternalPath(section.linkPath) ? section.linkPath : null;
  const linkLabel = section.linkLabel?.trim();
  const imagePosition = section.imagePosition === "right" ? "right" : "left";

  return (
    <section
      className={`home-section image-text image-${imagePosition}`}
      aria-labelledby={`${section._key}-heading`}
    >
      <div className="home-section-copy">
        {section.eyebrow ? (
          <p className="commerce-eyebrow">{section.eyebrow}</p>
        ) : null}
        <h2 id={`${section._key}-heading`}>{section.heading}</h2>
        <div className="home-section-body">
          {splitTextParagraphs(section.body).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        {linkPath && linkLabel ? (
          <Link className="commerce-link" href={linkPath}>
            {linkLabel}
          </Link>
        ) : null}
      </div>
      {image ? <SectionImage image={image} /> : null}
    </section>
  );
}
