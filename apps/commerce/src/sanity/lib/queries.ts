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
    storeLinkLabel
  }
`);
