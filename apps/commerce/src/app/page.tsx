import Link from "next/link";
import { getHomePageContent } from "../sanity/lib/homePage";

const fallbackHomePage = {
  eyebrow: "Headless Commerce",
  heading: "Commerce app initialized",
  body: "Shopify and Sanity will be connected next.",
  storeLinkLabel: "View store",
};

export default async function Page() {
  const homePage = (await getHomePageContent()) ?? fallbackHomePage;

  return (
    <main className="commerce-shell">
      <section className="commerce-intro" aria-labelledby="commerce-heading">
        {homePage.eyebrow ? (
          <p className="commerce-eyebrow">{homePage.eyebrow}</p>
        ) : null}
        <h1 id="commerce-heading">{homePage.heading}</h1>
        <p>{homePage.body}</p>
        <Link className="commerce-link" href="/store">
          {homePage.storeLinkLabel}
        </Link>
      </section>
    </main>
  );
}
