import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string | { src?: string };
  }) =>
    React.createElement("img", {
      ...props,
      alt,
      src: typeof src === "string" ? src : src.src,
    }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  }) =>
    React.createElement(
      "a",
      {
        ...props,
        href,
      },
      children,
    ),
}));
