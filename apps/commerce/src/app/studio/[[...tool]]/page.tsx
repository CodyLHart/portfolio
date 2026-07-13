import type { Metadata, Viewport } from "next";
import {
  metadata as studioMetadata,
  NextStudio,
  viewport as studioViewport,
} from "next-sanity/studio";
import config from "../../../../sanity.config";

export const dynamic = "force-static";

export const metadata: Metadata = {
  ...studioMetadata,
  title: "Store CMS",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport = studioViewport as Viewport;

export default function StudioPage() {
  return (
    <div className="studio-route">
      <NextStudio config={config} />
    </div>
  );
}
