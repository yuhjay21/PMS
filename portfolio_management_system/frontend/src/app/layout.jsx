import { Geist, Geist_Mono } from "next/font/google";
import 'bootstrap/dist/css/bootstrap.min.css';
//
import "./globals.css";
import "@/styles/style.css";
import "@/styles/responsive.css";
import "@/styles/color-one.css";
import AppShell from '@/components/layout/AppShell';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Portfolio Dashboard",
  description: "Portfolio Management System Frontend",
};



export default function RootLayout({ children }) {


  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
