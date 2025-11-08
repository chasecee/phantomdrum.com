import Quote from "../../art/Quote";
import NatGeoLogo from "../../art/NatGeoLogo";
import SiliconValleyLogo from "../../art/SiliconValleyLogo";
import RoyalAcademyLogo from "../../art/RoyalAcademyLogo";

const quotes = [
  { text: "It could be music!", logo: NatGeoLogo, opacity: "opacity-90" },
  {
    text: "A robot could never replace our Son",
    logo: SiliconValleyLogo,
    opacity: "opacity-80",
  },
  {
    text: "Bold, daring, devoid of life",
    logo: RoyalAcademyLogo,
    opacity: "opacity-70",
  },
  {
    text: "Avant garde in the lightest sense of the word",
    logo: RoyalAcademyLogo,
    opacity: "opacity-60",
  },
] as const;

export default function QuotesSection() {
  return (
    <div className="text-left font-bold p-2 max-w-[1500px] mx-auto text-white">
      <div className="grid grid-cols-1 gap-[10vw] my-[10vw] px-6">
        {quotes.map((quote, i) => (
          <Quote
            key={i}
            text={quote.text}
            logo={<quote.logo className="w-full h-auto" />}
            className={quote.opacity}
          />
        ))}
      </div>
    </div>
  );
}
