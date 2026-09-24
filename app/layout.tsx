import type { Metadata } from "next";
import "./globals.css";
import "./outlet-themes.css";
export const metadata: Metadata = {title:"Share your experience | BiBiChik SS2",description:"Tell us about your visit to BiBiChik SS2. Your feedback helps us serve you better.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }

