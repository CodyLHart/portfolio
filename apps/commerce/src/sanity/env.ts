const requiredSanityEnv = {
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
};

const missingSanityEnv = Object.entries(requiredSanityEnv)
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingSanityEnv.length > 0) {
  throw new Error(
    `Missing Sanity configuration: ${missingSanityEnv.join(", ")}`,
  );
}

export const sanityProjectId =
  requiredSanityEnv.NEXT_PUBLIC_SANITY_PROJECT_ID!;
export const sanityDataset = requiredSanityEnv.NEXT_PUBLIC_SANITY_DATASET!;
export const sanityApiVersion =
  requiredSanityEnv.NEXT_PUBLIC_SANITY_API_VERSION!;
