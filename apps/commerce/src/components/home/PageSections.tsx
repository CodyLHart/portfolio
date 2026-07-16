import { ExternalCarouselSection } from "./ExternalCarouselSection";
import { FeaturedCollectionSection } from "./FeaturedCollectionSection";
import { HeroSection } from "./HeroSection";
import { ImageTextSection } from "./ImageTextSection";
import { SplitCollectionHeroSection } from "./SplitCollectionHeroSection";
import type { ResolvedHomePageSection } from "../../lib/homepage";

export function PageSections({
  sections,
}: {
  sections: ResolvedHomePageSection[];
}) {
  return (
    <>
      {sections.map((section) => {
        switch (section._type) {
          case "heroSection":
            return <HeroSection key={section._key} section={section} />;
          case "splitCollectionHeroSection":
            return (
              <SplitCollectionHeroSection
                key={section._key}
                section={section}
              />
            );
          case "featuredCollectionSection":
            return (
              <FeaturedCollectionSection key={section._key} section={section} />
            );
          case "imageTextSection":
            return <ImageTextSection key={section._key} section={section} />;
          case "externalCarouselSection":
            return (
              <ExternalCarouselSection key={section._key} section={section} />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
