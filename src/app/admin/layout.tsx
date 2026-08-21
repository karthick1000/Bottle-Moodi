import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Bottlemoodi",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen" style={{ background: "#f6f7f8", color: "#15181c", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif" }}>{children}</div>;
}
