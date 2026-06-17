import Link from "next/link";
import { IoMenu } from "react-icons/io5";

const NavItem = ({ text, page }: { text: string; page: string }) => (
  <Link
    className="text-xl font-sans hover:opacity-70 text-black font-semibold"
    href={page}
  >
    {text}
  </Link>
);

const HeaderLogo = () => (
  <Link
    className="font-sans font-regular text-xl text-center w-fit bg-black py-3 px-1 text-white leading-none "
    href="/"
    aria-label="Cody Hart home"
  >
    <div>CODY</div>
    <div>HART</div>
  </Link>
);

const HeaderNav = () => (
  <>
    <IoMenu className="text-5xl text-black md:hidden" />
    <div className="align-center justify-between gap-8 hidden md:flex">
      <NavItem text="PROJECTS" page="/projects" />
    </div>
  </>
);

export default function Header() {
  return (
    <header
      style={{ boxShadow: "0 8px 18px -10px #00000080", height: 80 }}
      className="sticky top-0 z-50 flex w-full items-center justify-between bg-white pl-4 pr-8"
    >
      <HeaderLogo />
      <HeaderNav />
    </header>
  );
}
