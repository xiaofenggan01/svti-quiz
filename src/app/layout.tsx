import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SVTI 测评 — 星露谷类型指标",
  description:
    "30 道基于《星露谷物语》的情景选择题，测出属于你的 25 种星露谷人格类型。",
  icons: { icon: "/icons/Golden_Walnut.png" },
  openGraph: {
    title: "SVTI 测评 — 星露谷类型指标",
    description: "测出最适合你游玩风格的星露谷人格！",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Noto+Sans+SC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">
        <div className="min-h-screen bg-gradient-to-b from-[#e8f0e4] via-[#f5f0e8] to-[#ede4d3]">
          {children}
        </div>
      </body>
    </html>
  );
}
