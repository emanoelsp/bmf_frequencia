import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import 'tailwindcss/tailwind.css';
import Header from "../app/components/header";
import Footer from '../app/components/footer';
import Nav from "../app/components/nav";

const inter = Inter({ subsets: ["latin"] });

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
        <div className="hidden md:block">
          <Header />
        </div>
        <div className='block md:hidden'>
          <h1 className="text-2xl font-bold p-2 text-white text-center">BOTANDO A MÃO E FAZENDO</h1>
        </div>
        <main className="w-full max-h-[1800px] pb-8 md:pb-0">{children}
        <div className="hidden md:block">
          <Footer />
        </div>
        <div className="block md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 p-4 flex justify-center">
          <Nav />
        </div>

        </main>
       
       
      </body>
    </html>
  );
}
