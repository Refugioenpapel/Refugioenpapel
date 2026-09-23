"use client";

import Navbar from "@components/Navbar";
import Footer from "@components/footer";
import FloatingWhatsApp from "@components/FloatingWhatsApp";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-[32px]">{children}</main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}