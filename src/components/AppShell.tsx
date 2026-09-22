"use client";

import { usePathname } from "next/navigation";
import Navbar from "@components/Navbar";
import Footer from "@components/footer";
import FloatingWhatsApp from "@components/FloatingWhatsApp";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <main>{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="pt-[32px]">{children}</main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}