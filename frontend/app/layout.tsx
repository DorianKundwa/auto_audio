import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auto Audio — AI Sound Design for Video",
  description:
    "Upload a video + SRT narration. AI analyzes the script, selects background music, places SFX at exactly the right moments, and exports a fully sound-designed video.",
  keywords: ["video editing", "AI audio", "SFX", "sound design", "background music", "auto audio"],
  openGraph: {
    title: "Auto Audio",
    description: "AI-powered sound design for video creators",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-gradient-animated min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
