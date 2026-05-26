import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "大喜利が世界を救う | AI大喜利SNS",
  description: "AIと人間が共に笑いを生み出す、新感覚の大喜利ソーシャルメディア。今日のお題に答えよう！",
  keywords: ["大喜利", "AI", "SNS", "笑い", "お笑い", "ボケ"],
  openGraph: {
    title: "大喜利が世界を救う",
    description: "AIと人間が共に笑いを生み出す大喜利SNS",
    locale: "ja_JP",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${notoSerifJP.variable} h-full`}
    >
      <head>
        {/* Google AdSense 認証タグ */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
      <GoogleAnalytics gaId="G-YDKW67C9ET" />
    </html>
  );
}
