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
    googleReviewUrl: "https://g.page/r/CV3tOjOu1XilEBM/review",
    googleReviewEnv: "GOOGLE_REVIEW_URL_SS2", websiteEnv: "WEBSITE_URL_BIBICHIK", websiteUrl: "",
  },
  {
    id: "bibichik-sunway-163", slug: "bibichik-sunway-163", aliases: ["sunway-163"], brand: "BiBiChik",
    outletName: "BiBiChik Sunway 163 Mall", shortName: "Sunway 163 Mall", tagline: "A Taste of Nyonya Heritage",
    theme: "bibichik", logo: "/bibichik-logo-transparent.png", active: true,
    googleReviewUrl: "https://g.page/r/Cc3Q2nvEBsVdEBM/review", googleReviewEnv: "GOOGLE_REVIEW_URL_SUNWAY_163",
    websiteEnv: "WEBSITE_URL_BIBICHIK", websiteUrl: "",
  },
  {
    id: "aburii-yakiniku", slug: "aburii-yakiniku", aliases: ["aburii"], brand: "Aburii Yakiniku",
    outletName: "Aburii Yakiniku", shortName: "Aburii", tagline: "", theme: "aburii", logo: "", active: true,
    googleReviewUrl: "https://g.page/r/CTJ2TrR0rYaLEBM/review", googleReviewEnv: "GOOGLE_REVIEW_URL_ABURII",
    websiteEnv: "WEBSITE_URL_ABURII", websiteUrl: "",
  },
];

export function findOutlet(slug: string) {
  return outlets.find(outlet => outlet.active && (outlet.slug === slug || outlet.aliases.includes(slug)));
}
