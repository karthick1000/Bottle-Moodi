import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Bottlemoodi",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#e8ecdd", color: "#182320", fontFamily: "'Inter Tight',system-ui,sans-serif" }}>
      {children}
    </div>
  );
}
