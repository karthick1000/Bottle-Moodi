import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";

export const metadata: Metadata = {
  title: "Admin — Bottlemoodi",
  robots: { index: false, follow: false },
};

// The admin gate reads the signed-in user on every request.
export const dynamic = "force-dynamic";

const SHELL: React.CSSProperties = {
  background: "#e8ecdd",
  color: "#182320",
  fontFamily: "'Inter Tight',system-ui,sans-serif",
};

/**
 * Shown to anyone who is not the configured admin — signed out or signed in
 * as someone else. Deliberately the same page for both: an anonymous visitor
 * gets no sign-in prompt and no confirmation that a console lives here.
 */
function NotAuthorized() {
  return (
    <div style={{ ...SHELL, minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ maxWidth: 380, textAlign: "center" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".18em",
            color: "#e8452c",
          }}
        >
          403 — NOT AUTHORIZED
        </div>
        <h1
          style={{
            margin: "14px 0 0",
            fontSize: 30,
            lineHeight: 1.15,
            fontWeight: 600,
            letterSpacing: "-.02em",
          }}
        >
          You don&apos;t have access to this page.
        </h1>
        <p style={{ margin: "12px 0 0", fontSize: 14.5, lineHeight: 1.6, color: "#5a6a61" }}>
          This area is restricted. If you think you should be able to get in,
          check with whoever runs the store.
        </p>
        <a
          href="/"
          style={{
            display: "inline-block",
            marginTop: 26,
            padding: "10px 20px",
            borderRadius: 4,
            background: "#182320",
            color: "#f5f7ee",
            fontSize: 13.5,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Back to the shop
        </a>
      </div>
    </div>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const adminId = process.env.ADMIN_CLERK_USER_ID;

  // Signed out, misconfigured, or signed in as a non-admin all land here.
  // Matches the check getAdminUserId() applies to the admin API routes.
  if (!userId || !adminId || userId !== adminId) return <NotAuthorized />;

  return (
    <div className="min-h-screen" style={SHELL}>
      {children}
    </div>
  );
}
