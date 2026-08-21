import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin — Bottlemoodi",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/minad");
  return (
    <div className="min-h-screen" style={{ background: "#e8ecdd", color: "#182320", fontFamily: "'Inter Tight',system-ui,sans-serif" }}>
      {children}
    </div>
  );
}
