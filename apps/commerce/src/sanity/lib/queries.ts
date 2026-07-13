import { defineQuery } from "next-sanity";

export const HOME_PAGE_QUERY = defineQuery(`
  *[
    _id == "homePage" &&
    _type == "homePage" &&
    !(_id in path("drafts.**"))
  ][0]{
    eyebrow,
    heading,
    body,
    storeLinkLabel,
    heroImage {
      alt,
      crop,
      hotspot,
      asset->{
        _id,
        url,
        metadata {
          dimensions {
            width,
            height,
            aspectRatio
          },
          lqip
        }
      }
    },
    featuredCollectionHeading,
    featuredCollectionHandle
  }
`);
