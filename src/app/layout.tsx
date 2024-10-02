import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import 'tailwindcss/tailwind.css'
import Header from "../app/components/header"
import Footer from '../app/components/footer'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BMF - Frequência",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 bg-opacity-50 text-white`}>
        <Header />
        <main className="w-full max-h-[1800px]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
