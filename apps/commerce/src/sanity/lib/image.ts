import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";
import { sanityDataset, sanityProjectId } from "../env";

const builder = createImageUrlBuilder({
  projectId: sanityProjectId,
  dataset: sanityDataset,
});

export const urlForSanityImage = (source: SanityImageSource) =>
  builder.image(source);
