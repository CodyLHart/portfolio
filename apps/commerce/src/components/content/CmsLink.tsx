import Link from "next/link";
import { getSafeCmsHref, isExternalHref } from "../../lib/content";

type CmsLinkProps = {
  label: string | null | undefined;
  href: unknown;
  openInNewTab?: boolean | null;
  className?: string;
};

export function CmsLink({
  label,
  href,
  openInNewTab,
  className,
}: CmsLinkProps) {
  const safeHref = getSafeCmsHref(href);
  const text = label?.trim();

  if (!safeHref || !text) {
    return null;
  }

  const newTabProps = openInNewTab
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  if (isExternalHref(safeHref)) {
    return (
      <a className={className} href={safeHref} {...newTabProps}>
        {text}
      </a>
    );
  }

  return (
    <Link className={className} href={safeHref} {...newTabProps}>
      {text}
    </Link>
  );
}
