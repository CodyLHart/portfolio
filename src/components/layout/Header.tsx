import Link from "next/link";

const HeaderLogo = () => (
  <Link
    className="header-logo font-sans text-center w-fit bg-black py-3 px-1 text-xl font-normal leading-none text-white antialiased transition hover:opacity-85 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
    href="/"
    aria-label="Cody Hart home"
  >
    <div>CODY</div>
    <div>HART</div>
  </Link>
);

export default function Header() {
  return (
    <header
      style={{ boxShadow: "0 8px 18px -10px #00000080", height: 80 }}
      className="sticky top-0 z-50 flex w-full items-center justify-between bg-white pl-4 pr-8"
    >
      <HeaderLogo />
    </header>
  );
}
