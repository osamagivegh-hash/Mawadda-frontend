import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مَوَدَّة | منصة زواج آمنة",
  description:
    "مَوَدَّة منصة زواج آمنة تربط الرجال والنساء الراغبين بالزواج بمنهجية موثوقة وخدمات استشارية متخصصة.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className="bg-slate-50 text-slate-900 antialiased font-sans"
      >
        {children}
      </body>
    </html>
  );
}
