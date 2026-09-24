export type Outlet = {
  id: string; slug: string; aliases: string[]; brand: string; outletName: string;
  shortName: string; tagline: string; theme: "bibichik" | "aburii";
  logo: string; googleReviewUrl: string; googleReviewEnv: string;
  websiteEnv: string; websiteUrl: string; active: boolean;
};

// Add an entry here to create a route; no page or component copies are needed.
// Empty URLs/logos are intentional until the owner supplies verified assets.
export const outlets: Outlet[] = [
  {
    id: "bibichik-ss2", slug: "bibichik-ss2", aliases: ["ss2"], brand: "BiBiChik",
    outletName: "BiBiChik SS2", shortName: "SS2", tagline: "A Taste of Nyonya Heritage",
    theme: "bibichik", logo: "/bibichik-logo-transparent.png", active: true,
    googleReviewUrl: "https://www.google.com/search?rlz=1C1VDKB_enMY1065MY1065&sca_esv=cc12825c4d4cb41c&sxsrf=APpeQntoRH0eFal3YrGmkIFDzJCTOHkJlg:1790223719844&q=bibichik+ss2&si=APenkKn5T4YN59srr511wD6k6Pufj9DEzRUvB1XJSwUeeT5afiYm1dqvDDoNOdgDswDHrM7TNw4HPQX-xk9f3KidxP0hgm0RfPPVVUJz5pUcIt7UGATtL4_o1Bh7kGOBCaS8WsUQ3diH&sa=X&sqi=2&ved=2ahUKEwjp1Y6Hr4aXAxVZbWwGHej2FR0QrrQLegQIHRAA&biw=1536&bih=695&dpr=1.25#",
    googleReviewEnv: "GOOGLE_REVIEW_URL_SS2", websiteEnv: "WEBSITE_URL_BIBICHIK", websiteUrl: "",
  },
  {
    id: "bibichik-sunway-163", slug: "bibichik-sunway-163", aliases: ["sunway-163"], brand: "BiBiChik",
    outletName: "BiBiChik Sunway 163 Mall", shortName: "Sunway 163 Mall", tagline: "A Taste of Nyonya Heritage",
    theme: "bibichik", logo: "/bibichik-logo-transparent.png", active: true,
    googleReviewUrl: "", googleReviewEnv: "GOOGLE_REVIEW_URL_SUNWAY_163",
    websiteEnv: "WEBSITE_URL_BIBICHIK", websiteUrl: "",
  },
  {
    id: "aburii-yakiniku", slug: "aburii-yakiniku", aliases: ["aburii"], brand: "Aburii Yakiniku",
    outletName: "Aburii Yakiniku", shortName: "Aburii", tagline: "", theme: "aburii", logo: "", active: true,
    googleReviewUrl: "", googleReviewEnv: "GOOGLE_REVIEW_URL_ABURII",
    websiteEnv: "WEBSITE_URL_ABURII", websiteUrl: "",
  },
];

export function findOutlet(slug: string) {
  return outlets.find(outlet => outlet.active && (outlet.slug === slug || outlet.aliases.includes(slug)));
}
