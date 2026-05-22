import { IoMenu } from "react-icons/io5";

const NavItem = ({ text, page }: { text: string; page: string }) => (
  <a
    className="text-xl font-sans hover:opacity-70 text-black font-semibold"
    href={page}
  >
    {text}
  </a>
);

const HeaderLogo = () => (
  <div className="font-sans font-regular text-xl text-center w-fit bg-black py-3 px-1 text-white leading-none ">
    <div>CODY</div>
    <div>HART</div>
  </div>
);

const HeaderNav = () => (
  <>
    <IoMenu className="text-5xl text-black md:hidden" />
    <div className="align-center justify-between gap-8 hidden md:flex">
      <NavItem text="WORK" page="/" />
      <NavItem text="ABOUT" page="/" />
      <NavItem text="CONTACT" page="/" />
    </div>
  </>
);

export default function Header() {
  return (
    <header
      style={{ boxShadow: "0 4px 8px 0 #0000005" }}
      className="w-screen flex items-center justify-between pl-4 pr-8 "
    >
      <HeaderLogo />
      {/* <HeaderNav /> */}
    </header>
  );
}
