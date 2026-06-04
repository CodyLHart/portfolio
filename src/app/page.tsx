import Header from "@/components/layout/Header";
import Image from "next/image";
import {
  BabyJ,
  BgRecord,
  BostonSymphony,
  BrettGoldstein,
  FromScratch,
  MhvcLogo,
  Mighty,
  MulaneyVegas,
  OonLogo,
  RedRocks,
  Ryman,
  Thump,
  UnitedCenter,
  BgBolt1,
  BgBolt2,
  BgMosaic,
  BgSkull,
  Almonds,
  Montucky,
  Nanner,
  Percent,
  Skim,
  Whole,
} from "../images/index";

const portfolio = [
  {
    image: RedRocks,
    title: "John Mulaney",
    subtitle: "Red Rocks Amphitheatre Poster",
  },
  {
    image: BabyJ,
    title: "John Mulaney",
    subtitle: "Baby J Netflix Special Shirt",
  },
  {
    image: FromScratch,
    title: "John Mulaney",
    subtitle: "From Scratch Tour Poster",
  },
  {
    image: BostonSymphony,
    title: "John Mulaney",
    subtitle: "Boston Symphony Hall Shirt",
  },
  {
    image: UnitedCenter,
    title: "John Mulaney",
    subtitle: "United Center Poster",
  },
  {
    image: Ryman,
    title: "John Mulaney",
    subtitle: "Ryman Jamboree Shirt",
  },
  {
    image: MulaneyVegas,
    title: "John Mulaney",
    subtitle: "Hiatus in Vegas Shirt",
  },
  {
    image: BrettGoldstein,
    title: "Brett Goldstein",
    subtitle: "Second Best Night Poster",
  },
  {
    image: OonLogo,
    title: "Opposite of Nihilism",
    subtitle: "Logo Design",
  },
  {
    image: MhvcLogo,
    title: "Mile High Vinyl Collective",
    subtitle: "Logo Design",
  },
  {
    image: Mighty,
    title: "The Mighty Colorado Burger",
    subtitle: "Airstream Shirt",
  },
  {
    image: Thump,
    title: "Thump Coffee",
    subtitle: "Genuine Coffee Shirt",
  },
  {
    image: BgRecord,
    title: "Boot Gun",
    subtitle: "Album Artwork",
  },
  {
    image: BgMosaic,
    title: "Boot Gun",
    subtitle: "Mosaic Bolt Shirt",
  },
  {
    image: BgBolt2,
    title: "Boot Gun",
    subtitle: `Bolt "T" Shirt`,
  },
  {
    image: BgSkull,
    title: "Boot Gun",
    subtitle: "Do This Twice Skull",
  },
  {
    image: BgBolt1,
    title: "Boot Gun",
    subtitle: "Bolt Shirt",
  },
  {
    image: Whole,
    title: "Surdist Designs",
    subtitle: "Whole - A Milk for the People",
  },
  {
    image: Skim,
    title: "Surdist Designs",
    subtitle: "Skim is a Scam",
  },
  {
    image: Almonds,
    title: "Surdist Designs",
    subtitle: "Stop Milking Almonds",
  },
  {
    image: Percent,
    title: "Surdist Designs",
    subtitle: "We Are Not the 1%",
  },
  {
    image: Montucky,
    title: "Surdist Designs",
    subtitle: "Montucky Cold Snacks Collab",
  },
  {
    image: Nanner,
    title: "Surdist Designs",
    subtitle: "Nothing to Shake Your Nanner At",
  },
];

const Card = ({ item }: { item: (typeof portfolio)[0] }) => (
  <div
    style={{
      boxShadow: "1px 1px 5px 2px  #00000015",
      padding: "5%",
    }}
    className="w-fit h-fit bg-white relative flex flex-col gap-4 "
  >
    <div
      key={item.title}
      style={{
        boxShadow: "1px 1px 5px 2px  #00000015",
      }}
      className=" bg-white overflow-hidden flex flex-col items-center justify-center"
    >
      <Image
        src={item.image}
        alt={`${item.title} - ${item.subtitle}`}
        style={{ objectFit: "cover", height: "100%", aspectRatio: "1/1" }}
      />
    </div>
    <div className="relative">
      <div className="bg-white text-sm py-0 my-0 font-serif text-[3.5vw] min-[440px]:text-[2.3vw] md:text-[1.6vw] lg:text-base">
        {item.title}
      </div>
      <div className="bg-white leading-none  font-serif text-[4vw] min-[440px]:text-[2.65vw] md:text-[1.8vw] lg:text-lg">
        {item.subtitle}
      </div>
    </div>
  </div>
);

const Gallery = () => (
  <div className=" bg-yellow-500/50 mix-blend-multiply ">
    <div
      style={{ width: "80%" }}
      className="bg-white m-auto mt-8 mb-0 py-4 px-8 text-xl font-sans  max-w-4xl"
    >
      Howdy! <br />
      I'm Cody.
      <br />
      I am a software engineer and graphic designer based in Denver, Colorado. I
      am still working on building out my portfolio to include more of my
      software development and product design work, but in the meantime, here
      are some of my favorite graphic design projects that I've worked on over
      the years.
      <br />
      Thanks, and check back for more updates!
    </div>
    <div
      style={{ gap: "clamp(1rem, 3vw, 3rem)", padding: "4vw" }}
      className=" w-full grid grid-cols-1 min-[440px]:grid-cols-2 md:grid-cols-3   "
    >
      {portfolio.map((item) => (
        <div
          key={item.title + item.subtitle}
          className="flex flex-col items-center "
        >
          <Card item={item} />
        </div>
      ))}
    </div>
  </div>
);

export default function Home() {
  return (
    <div
      style={{
        gridTemplateRows: "80px 1fr",
      }}
      className="grid text-black flex-1 bg-cover font-sans h-screen  bg-white "
    >
      <Header />
      <Gallery />
    </div>
  );
}
