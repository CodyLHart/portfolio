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
    featuredCollectionHandle,
    sections[] {
      _key,
      _type,
      _type == "heroSection" => {
        eyebrow,
        heading,
        body,
        ctaLabel,
        ctaPath,
        imagePosition,
        image {
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
        }
      },
      _type == "splitCollectionHeroSection" => {
        tiles[] {
          _key,
          label,
          collectionHandle,
          image {
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
          }
        }
      },
      _type == "featuredCollectionSection" => {
        heading,
        collectionHandle,
        productCount,
        linkLabel
      },
      _type == "imageTextSection" => {
        eyebrow,
        heading,
        body,
        imagePosition,
        linkLabel,
        linkPath,
        image {
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
        }
      },
      _type == "externalCarouselSection" => {
        heading,
        items[] {
          _key,
          title,
          subtitle,
          href,
          openInNewTab,
          image {
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
          }
        }
      }
    }
  }
`);

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[
    _id == "siteSettings" &&
    _type == "siteSettings" &&
    !(_id in path("drafts.**"))
  ][0]{
    siteTitle,
    announcementEnabled,
    announcementText,
    announcementLink {
      label,
      href,
      openInNewTab
    },
    headerLinks[] {
      _key,
      label,
      href,
      openInNewTab
    },
    footerHeading,
    footerBody,
    footerLinks[] {
      _key,
      label,
      href,
      openInNewTab
    },
    copyrightText
  }
`);
