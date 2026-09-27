import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ULPF SOC Analyst Dashboard | Universal Log Pre-processing Framework",
  description:
    "Universal Log Pre-processing Framework for Line-rate Zero-copy Normalization, WORM Parquet Storage, and Real-time Security Inviolability",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F3F3F3] text-[#1E293B]">
        {children}
      </body>
    </html>
  );
}
