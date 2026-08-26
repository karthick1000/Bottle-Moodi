"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Plus, Upload, Archive, RotateCcw, Menu, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ProductImage { id: number; url: string; position: number; }
interface Product {
  id: number; slug: string; title: string; tamil: string;
  tag: string; base: number; priceA3: number; priceA2: number;
  sub: string; active: boolean; images: ProductImage[];
}
/** Product fields the admin table edits as integers rather than free text. */
const NUMERIC_PRODUCT_FIELDS = ["base", "priceA3", "priceA2"] as const;

/** Price columns, in the order the sizes appear on the storefront. */
const PRICE_FIELDS = [
  ["base",    "A4"],
  ["priceA3", "A3"],
  ["priceA2", "A2"],
] as const;

/** Shared grid track list for the products table header and its rows. */
const PRODUCT_COLS = "56px 1.5fr 1.1fr 2fr 66px 66px 66px 78px 118px";

interface DbOrder {
  id: number; clerkUserId: string; status: string; shipping: number; createdAt: string;
  items: { id: number; size: string; amount: number; product: { title: string; tamil: string } }[];
}
interface Order {
  id: string; name: string; items: string; total: string; status: string; dbId?: number;
}
interface DiscountCode {
  id: number; code: string; type: string; value: number;
  minOrder?: number | null; maxUses?: number | null; usedCount: number;
  active: boolean; expiresAt?: string | null; createdAt: string;
}

interface DashData {
  revenue30d: number; orders30d: number; unitsSold: number; avgOrder: number;
  revenueChart: { date: string; revenue: number }[];
  weeklyBars: { day: string; units: number }[];
  topPrints: { title: string; units: number }[];
  statusPie: { name: string; value: number; color?: string }[];
}

// ── Seed data removed — all data fetched from DB ──────────────────────────

// ── Palette ────────────────────────────────────────────────────────────────

const C = {
  bg:"#e8ecdd", loginBg:"#dfe5d2", sidebar:"#182320", card:"#f5f7ee",
  border:"#d5dcc7", rowBorder:"#e4e9d9", thead:"#eef1e6", dark:"#182320",
  red:"#e8452c", muted:"#5a6a61", faint:"#87998d", sideText:"#c3ccb2",
  sideActive:"#26332e", green:"#2f7d55", amber:"#a8781a",
};

// ── Tooltips ───────────────────────────────────────────────────────────────

const RevTip = ({ active, payload, label }: { active?: boolean; payload?: {value:number}[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:"8px 12px" }}>
      <div style={{ fontSize:10.5, color:C.faint, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:15, fontWeight:600, color:C.dark, marginTop:2 }}>₹{payload[0].value.toLocaleString("en-IN")}</div>
    </div>
  );
};

const BarTip = ({ active, payload, label }: { active?: boolean; payload?: {value:number}[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:"7px 10px" }}>
      <div style={{ fontSize:10.5, color:C.faint }}>{label}</div>
      <div style={{ fontSize:14, fontWeight:600, color:C.dark }}>{payload[0].value} units</div>
    </div>
  );
};

// ── Loading state ──────────────────────────────────────────────────────────

/** Spinning cap shown while a tab's data is in flight. */
function AdminLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite"
      style={{ display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", gap:12, padding:"56px 0" }}>
      <span style={{ width:44, height:44, borderRadius:"50%", display:"flex",
        alignItems:"center", justifyContent:"center", flexShrink:0,
        background:"repeating-conic-gradient(from 0deg,#e8452c 0 4.2deg,#a82d19 4.2deg 8.4deg)",
        animation:"bm-spin 7s linear infinite" }}>
        <span style={{ width:"76%", height:"76%", borderRadius:"50%", background:"#e8452c",
          boxShadow:"inset 0 0 0 1.5px rgba(226,231,211,.5)" }}/>
      </span>
      <span style={{ fontSize:11, letterSpacing:".18em", textTransform:"uppercase",
        color:"#87998d", fontFamily:"ui-monospace,Menlo,monospace" }}>
        {label}
      </span>
    </div>
  );
}

/** Shown when a tab loaded fine but there is genuinely nothing yet. */
function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ padding:"44px 0", textAlign:"center", fontSize:13.5, color:"#87998d" }}>
      {text}
    </div>
  );
}

// ── Cap logo ───────────────────────────────────────────────────────────────

function CapLogo({ size = 30 }: { size?: number }) {
  return (
    <span style={{ width:size, height:size, flexShrink:0, borderRadius:"50%",
      background:"repeating-conic-gradient(from 0deg,#e8452c 0 4.2deg,#a82d19 4.2deg 8.4deg)",
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ width:"76%", height:"76%", borderRadius:"50%", background:C.red,
        boxShadow:"inset 0 0 0 1.5px rgba(226,231,211,.5)",
        display:"flex", alignItems:"center", justifyContent:"center",
        textAlign:"center", fontFamily:"var(--font-anek)", fontWeight:700,
        lineHeight:1.05, color:"#e2e7d3", fontSize: size < 32 ? 7 : 9 }}>
        பாட்டில்<br/>மூடி
      </span>
    </span>
  );
}

// ── Responsive CSS ─────────────────────────────────────────────────────────

const RESPONSIVE_CSS = `
  .bm-shell { display: grid; grid-template-columns: 216px 1fr; min-height: 100vh; }
  .bm-sidebar { display: flex; }
  .bm-mobile-bar { display: none; }
  .bm-stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-top: 22px; }
  .bm-chart-row { display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; margin-top: 16px; }
  .bm-chart-right { display: grid; gap: 16px; }
  .bm-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .bm-hp-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; margin-top: 22px; align-items: start; }
  .bm-rev-chart { background: var(--card); border: 1px solid var(--border); border-radius: 6px; padding: 18px 20px 10px; margin-top: 16px; }

  @media (max-width: 1024px) {
    .bm-stat-grid { grid-template-columns: repeat(2,1fr); }
    .bm-chart-row { grid-template-columns: 1fr; }
    .bm-hp-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 768px) {
    .bm-shell { grid-template-columns: 1fr; }
    .bm-sidebar {
      position: fixed; inset: 0; z-index: 50;
      transform: translateX(-100%); transition: transform .22s ease;
    }
    .bm-sidebar.open { transform: translateX(0); }
    .bm-sidebar-backdrop {
      display: none; position: fixed; inset: 0; z-index: 49;
      background: rgba(0,0,0,.45);
    }
    .bm-sidebar-backdrop.open { display: block; }
    .bm-mobile-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; background: var(--sidebar);
      position: sticky; top: 0; z-index: 40;
    }
    .bm-stat-grid { grid-template-columns: repeat(2,1fr); gap: 10px; margin-top: 14px; }
    .bm-main-pad { padding: 0 16px 40px !important; }
    .bm-page-head { padding: 14px 0 12px !important; margin-bottom: 0; }
    .bm-chart-row { grid-template-columns: 1fr; margin-top: 12px; }
    .bm-hp-grid { grid-template-columns: 1fr; }
    .bm-rev-chart { padding: 14px 14px 8px; margin-top: 12px; }
  }

  @media (max-width: 480px) {
    .bm-stat-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
    .bm-stat-val { font-size: 20px !important; }
  }
`;

// ── Tabs ───────────────────────────────────────────────────────────────────

/** SiteSetting keys holding a homepage image. */
type ImageKey = "studioPhotoUrl" | "teeMockupUrl" | "toteMockupUrl";

const IMAGE_FIELDS: { key: ImageKey; label: string; hint: string; ratio: string }[] = [
  { key:"studioPhotoUrl", label:"Studio photo", ratio:"4/5",
    hint:"Beside the story section. Portrait 4:5 works best." },
  { key:"teeMockupUrl",   label:"Tee mockup",   ratio:"1/1",
    hint:"Top-left tile of the Coming Soon grid. Square." },
  { key:"toteMockupUrl",  label:"Tote mockup",  ratio:"1/1",
    hint:"Bottom-right tile of the Coming Soon grid. Square." },
];

/**
 * Mutating request helper. A bare `fetch(...).then(onSuccess)` runs the
 * success path for a 403 too, which silently desyncs the console from the DB
 * (an operator sees "Deleted" for a row that is still there). Every admin
 * mutation goes through this so a non-2xx reliably throws.
 */
async function apiSend(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    ...(body !== undefined
      ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      : {}),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
  return data;
}

type Tab = "dash"|"products"|"orders"|"discounts"|"homepage";
const TABS: [Tab, string][] = [
  ["dash","Dashboard"],["products","Products"],["orders","Orders"],
  ["discounts","Discounts"],["homepage","Homepage"],
];

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════

export default function AdminPage() {
  const { user: clerkUser } = useUser();
  const [tab,     setTab]     = useState<Tab>("dash");
  const [saved,   setSaved]   = useState("");
  const [sideOpen,setSideOpen]= useState(false);

  const [products,        setProducts]        = useState<Product[]>([]);
  const [productsError,   setProductsError]   = useState("");
  const [productsLoading, setProductsLoading] = useState(true);
  const [orders,          setOrders]          = useState<Order[]>([]);
  const [ordersLoading,   setOrdersLoading]   = useState(true);
  const [codes,           setCodes]           = useState<DiscountCode[]>([]);
  const [codesLoading,    setCodesLoading]    = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [newCode,     setNewCode]     = useState("");
  const [newPct,      setNewPct]      = useState("");
  const [newType,     setNewType]     = useState<"PERCENT"|"FLAT">("PERCENT");
  const [dashLoading, setDashLoading] = useState(true);
  const [dashData,    setDashData]    = useState<DashData>({
    revenue30d: 0, orders30d: 0, unitsSold: 0, avgOrder: 0,
    revenueChart: [], weeklyBars: [], topPrints: [], statusPie: [],
  });
  const [tagline,  setTagline]  = useState("Bottle Moodi — Mood-க்கு ஏத்த Design");
  const [headline, setHeadline] = useState("NORMAL IS NOT OUR SIZE");
  const [strip,    setStrip]    = useState("NOW SHOWING · POSTERS · CHENNAI");
  const [featured, setFeatured] = useState<number[]>([]);
  // Homepage imagery, keyed by the SiteSetting key each one persists to.
  const [images, setImages] = useState<Record<ImageKey, string>>({
    studioPhotoUrl: "", teeMockupUrl: "", toteMockupUrl: "",
  });
  const [uploadingKey, setUploadingKey] = useState<ImageKey | null>(null);

  const fileRefs = useRef<Record<number, HTMLInputElement|null>>({});
  // Pending debounce timers, keyed by `${productId}:${field}`.
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Fetch dashboard stats from DB
  useEffect(() => {
    setDashLoading(true);
    fetch("/api/admin/dashboard")
      .then(r => r.json())
      .then((data: DashData) => {
        if (data && typeof data.revenue30d === "number") {
          setDashData(data);
        }
      })
      .catch(() => {})
      .finally(() => setDashLoading(false));
  }, []);

  // Fetch discounts from DB
  useEffect(() => {
    fetch("/api/admin/discounts")
      .then(r => r.json())
      .then((data: DiscountCode[]) => {
        if (Array.isArray(data)) setCodes(data);
      })
      .catch(() => {})
      .finally(() => setCodesLoading(false));
  }, []);

  // Fetch products from DB. Never swallow the failure — an empty table that
  // actually means "request rejected" reads as data loss to the operator.
  useEffect(() => {
    fetch("/api/admin/products", { cache: "no-store" })
      .then(async r => {
        const data = await r.json().catch(() => null);
        if (!r.ok) {
          setProductsError(
            r.status === 403
              ? "Forbidden — this Clerk account is not the configured admin (check ADMIN_CLERK_USER_ID)."
              : r.status === 401
              ? "Not signed in."
              : `Could not load products (HTTP ${r.status}).`
          );
          return;
        }
        if (Array.isArray(data)) {
          setProducts(data);
          setProductsError("");
        } else {
          setProductsError("Unexpected response from the products API.");
        }
      })
      .catch(() => setProductsError("Network error while loading products."))
      .finally(() => setProductsLoading(false));
  }, []);

  // Fetch orders from DB
  useEffect(() => {
    fetch("/api/admin/orders")
      .then(r => r.json())
      .then((data: DbOrder[]) => {
        if (!Array.isArray(data)) return;
        const mapped: Order[] = data.map(o => ({
          id: `BM-${o.id}`,
          dbId: o.id,
          name: o.clerkUserId.slice(0, 16) + "…",
          items: o.items.map(i => `${i.product.title} ${i.size}`).join(", "),
          total: "₹" + (o.items.reduce((s, i) => s + i.amount, 0) + o.shipping).toLocaleString("en-IN"),
          status: o.status,
        }));
        setOrders(mapped);
      })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, []);

  // Fetch editable homepage content from DB
  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then((s) => {
        if (!s) return;
        if (typeof s.tagline  === "string") setTagline(s.tagline);
        if (typeof s.headline === "string") setHeadline(s.headline);
        if (typeof s.strip    === "string") setStrip(s.strip);
        setImages({
          studioPhotoUrl: typeof s.studioPhotoUrl === "string" ? s.studioPhotoUrl : "",
          teeMockupUrl:   typeof s.teeMockupUrl   === "string" ? s.teeMockupUrl   : "",
          toteMockupUrl:  typeof s.toteMockupUrl  === "string" ? s.toteMockupUrl  : "",
        });
      })
      .catch(() => {})
      .finally(() => setSettingsLoading(false));
  }, []);

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(""), 1800);
  };

  const saveHomepage = async () => {
    try {
      await apiSend("/api/admin/settings", "PUT", { tagline, headline, strip, ...images });
      flash("Homepage saved");
    } catch (e) {
      flash(`Save failed — ${(e as Error).message}`);
    }
  };

  /** Uploads to Cloudinary with no productId, then persists the URL. */
  const uploadImage = async (key: ImageKey, file: File) => {
    setUploadingKey(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) throw new Error(data?.error ?? `HTTP ${res.status}`);

      await apiSend("/api/admin/settings", "PUT", { [key]: data.url });
      setImages(m => ({ ...m, [key]: data.url }));
      flash("Image saved");
    } catch (e) {
      flash(`Upload failed — ${(e as Error).message}`);
    } finally {
      setUploadingKey(null);
    }
  };

  const removeImage = async (key: ImageKey) => {
    try {
      await apiSend("/api/admin/settings", "PUT", { [key]: "" });
      setImages(m => ({ ...m, [key]: "" }));
      flash("Image removed");
    } catch (e) {
      flash(`Remove failed — ${(e as Error).message}`);
    }
  };

  const editProduct = (id: number, key: keyof Product) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const v = NUMERIC_PRODUCT_FIELDS.includes(key as typeof NUMERIC_PRODUCT_FIELDS[number])
        ? (parseInt(raw.replace(/\D/g,""),10)||0)
        : raw;
      setProducts(ps => ps.map(p => p.id===id ? {...p,[key]:v} : p));

      // Debounce the write. Firing a PUT per keystroke lets responses land out
      // of order, so a half-typed value can overwrite the finished one.
      const timerKey = `${id}:${String(key)}`;
      clearTimeout(saveTimers.current[timerKey]);
      saveTimers.current[timerKey] = setTimeout(() => {
        apiSend(`/api/admin/products/${id}`, "PUT", { [key]: v })
          .then(() => flash("Saved"))
          .catch((err: Error) => flash(`Save failed — ${err.message}`));
      }, 600);
    };

  const handleUpload = async (id: number, file: File) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productId", String(id));
      const res  = await fetch("/api/upload", { method:"POST", body:fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setProducts(ps => ps.map(p => p.id===id
        ? { ...p, images: [...p.images, data.image] }
        : p
      ));
      flash("Image saved");
    } catch (e) {
      flash(`Upload failed — ${(e as Error).message}`);
    }
  };

  const handleDeleteImage = async (productId: number, imageId: number) => {
    try {
      await apiSend(`/api/upload/${imageId}`, "DELETE");
      setProducts(ps => ps.map(p => p.id===productId
        ? { ...p, images: p.images.filter(img => img.id !== imageId) }
        : p
      ));
      flash("Image removed");
    } catch (e) {
      flash(`Remove failed — ${(e as Error).message}`);
    }
  };

  const pickTab = (t: Tab) => { setTab(t); setSideOpen(false); };

  // ── Sidebar inner ─────────────────────────────────────────────────────

  const SidebarContent = () => (
    <aside className={`bm-sidebar${sideOpen?" open":""}`}
      style={{ background:C.sidebar, color:C.sideText, padding:"20px 14px",
        flexDirection:"column", gap:22, width:216, flexShrink:0 }}>
      <div style={{ padding:"0 8px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ fontFamily:"var(--font-bakbak)", fontSize:16, color:C.card, letterSpacing:".02em" }}>
            BOTTLEMOODI
          </div>
          <CapLogo size={30}/>
        </div>
        <div style={{ fontSize:11, color:"#7c8b80", marginTop:2 }}>Admin · v0.1</div>
      </div>
      <nav style={{ display:"grid", gap:2 }}>
        {TABS.map(([k,label]) => (
          <button key={k} onClick={()=>pickTab(k)}
            style={{ cursor:"pointer", textAlign:"left", border:"none", borderRadius:4,
              padding:"9px 10px", fontSize:13.5,
              background: tab===k ? C.sideActive : "transparent",
              color: tab===k ? C.card : C.sideText }}>
            {label}
          </button>
        ))}
      </nav>
      <div style={{ marginTop:"auto", padding:"0 8px" }}>
        <div style={{ fontSize:12, color:"#7c8b80", marginBottom:10 }}>
          {clerkUser?.primaryEmailAddress?.emailAddress ?? "admin"}
        </div>
        <UserButton
          appearance={{
            elements: { avatarBox: "w-7 h-7 rounded-sm" },
            variables: { colorPrimary: C.red, borderRadius: "2px" },
          }}
          showName={false}
        />
      </div>
    </aside>
  );

  // ── Shared input focus handlers ───────────────────────────────────────

  const fo = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor=C.red; e.target.style.background=C.card; };
  const fb = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor="transparent"; e.target.style.background="transparent"; };

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>

      {/* Mobile backdrop */}
      <div className={`bm-sidebar-backdrop${sideOpen?" open":""}`} onClick={()=>setSideOpen(false)}/>

      <div className="bm-shell">

        <SidebarContent/>

        {/* Right column: mobile top bar + main */}
        <div style={{ display:"flex", flexDirection:"column", minWidth:0 }}>

          {/* Mobile top bar */}
          <div className="bm-mobile-bar"
            style={{ "--sidebar": C.sidebar } as React.CSSProperties}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button onClick={()=>setSideOpen(o=>!o)}
                style={{ cursor:"pointer", border:"none", background:"transparent", color:C.card, padding:4, display:"flex" }}>
                {sideOpen ? <X size={20}/> : <Menu size={20}/>}
              </button>
              <span style={{ fontFamily:"var(--font-bakbak)", fontSize:15, color:C.card, letterSpacing:".02em" }}>
                BOTTLEMOODI
              </span>
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:C.card }}>
              {TABS.find(t=>t[0]===tab)?.[1]}
            </span>
          </div>

          {/* Main content */}
          <main className="bm-main-pad" style={{ background:C.bg, padding:"26px 30px 60px", flex:1 }}>
            <div className="bm-page-head"
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16,
                borderBottom:`1px solid ${C.border}`, paddingBottom:16 }}>
              <h1 style={{ margin:0, fontFamily:"var(--font-bakbak)", fontSize:22, fontWeight:400, letterSpacing:".01em" }}>
                {TABS.find(t=>t[0]===tab)?.[1]}
              </h1>
              <div style={{ fontSize:12.5, color:C.muted, flexShrink:0 }}>{saved}</div>
            </div>

            {/* ══ DASHBOARD ══ */}
            {tab==="dash" && dashLoading && <AdminLoader label="Loading dashboard"/>}
            {tab==="dash" && !dashLoading && <>
              <div className="bm-stat-grid">
                {[
                  { label:"REVENUE (30D)", value: dashLoading ? "—" : `₹${dashData.revenue30d.toLocaleString("en-IN")}` },
                  { label:"ORDERS (30D)",  value: dashLoading ? "—" : String(dashData.orders30d) },
                  { label:"UNITS SOLD",    value: dashLoading ? "—" : String(dashData.unitsSold) },
                  { label:"AVG ORDER",     value: dashLoading ? "—" : `₹${dashData.avgOrder.toLocaleString("en-IN")}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:14 }}>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:600, letterSpacing:".04em" }}>{label}</div>
                    <div className="bm-stat-val" style={{ fontSize:24, fontWeight:600, marginTop:6, letterSpacing:"-.02em" }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Revenue area */}
              <div className="bm-rev-chart">
                <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Revenue — last 30 days</div>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={dashData.revenueChart} margin={{ top:4, right:4, bottom:0, left:0 }}>
                    <defs>
                      <linearGradient id="revG2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.red} stopOpacity={0.22}/>
                        <stop offset="100%" stopColor={C.red} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.rowBorder} vertical={false}/>
                    <XAxis dataKey="date" tick={{ fontSize:9.5, fill:C.faint }} tickLine={false} axisLine={false} interval={4}/>
                    <YAxis tick={{ fontSize:9.5, fill:C.faint }} tickLine={false} axisLine={false}
                      tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} width={36}/>
                    <Tooltip content={<RevTip/>}/>
                    <Area type="monotone" dataKey="revenue" stroke={C.red} strokeWidth={2}
                      fill="url(#revG2)" dot={false} activeDot={{ r:4, fill:C.red, stroke:C.card, strokeWidth:2 }}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bm-chart-row">
                {/* Weekly bar */}
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Units sold — last 7 days</div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={dashData.weeklyBars} margin={{ top:0, right:0, bottom:0, left:-20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.rowBorder} vertical={false}/>
                      <XAxis dataKey="day" tick={{ fontSize:10.5, fill:C.faint }} tickLine={false} axisLine={false}/>
                      <YAxis tick={{ fontSize:9.5, fill:C.faint }} tickLine={false} axisLine={false}/>
                      <Tooltip content={<BarTip/>}/>
                      <Bar dataKey="units" radius={[2,2,0,0]}>
                        {dashData.weeklyBars.map((d,i) => (
                          <Cell key={i} fill={`rgba(232,69,44,${0.45+i*0.07})`}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Top prints + donut */}
                <div className="bm-chart-right">
                  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Top prints</div>
                    <div style={{ display:"grid", gap:9 }}>
                      {dashData.topPrints.map(t => (
                        <div key={t.title} style={{ display:"flex", justifyContent:"space-between",
                          fontSize:13.5, borderBottom:`1px solid ${C.rowBorder}`, paddingBottom:8 }}>
                          <span>{t.title}</span><span style={{ color:C.muted }}>{t.units} units</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Order status</div>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ position:"relative", flexShrink:0 }}>
                        <PieChart width={90} height={90}>
                          <Pie data={dashData.statusPie} cx={45} cy={45} innerRadius={28} outerRadius={43}
                            paddingAngle={2} dataKey="value" stroke="none">
                            {dashData.statusPie.map((e,i) => <Cell key={i} fill={e.color ?? C.faint}/>)}
                          </Pie>
                        </PieChart>
                        <div style={{ position:"absolute", top:"50%", left:"50%",
                          transform:"translate(-50%,-50%)", textAlign:"center", pointerEvents:"none" }}>
                          <div style={{ fontSize:14, fontWeight:700 }}>{dashLoading ? "—" : dashData.orders30d}</div>
                          <div style={{ fontSize:8, color:C.faint, fontWeight:600 }}>ORDERS</div>
                        </div>
                      </div>
                      <div style={{ display:"grid", gap:5 }}>
                        {dashData.statusPie.map(d => (
                          <div key={d.name} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12 }}>
                            <div style={{ width:7, height:7, borderRadius:"50%", background:d.color ?? C.faint, flexShrink:0 }}/>
                            <span style={{ color:"#3b4a42" }}>{d.name}</span>
                            <span style={{ color:C.faint, marginLeft:8 }}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>}

            {/* ══ PRODUCTS ══ */}
            {tab==="products" && productsLoading && <AdminLoader label="Loading products"/>}
            {tab==="products" && !productsLoading && <>
              {productsError && (
                <div style={{ marginTop:18, padding:"11px 14px", borderRadius:4,
                  border:`1px solid ${C.red}`, background:"#fdeeeb",
                  color:C.red, fontSize:13 }}>
                  {productsError}
                </div>
              )}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                margin:"18px 0 12px", gap:12, flexWrap:"wrap" }}>
                <div style={{ fontSize:13, color:C.muted }}>{products.length} products · click any field to edit</div>
                <button
                  onClick={()=>{
                    fetch("/api/admin/products", {
                      method:"POST",
                      headers:{"Content-Type":"application/json"},
                      body:JSON.stringify({slug:`draft-${Date.now()}`,title:"Untitled print",tamil:"—",tag:"SIGNBOARD",base:499,priceA3:649,priceA2:849,sub:"New product description",active:false}),
                    }).then(async r=>{
                      const p = await r.json().catch(()=>null);
                      if (!r.ok || !p?.id) throw new Error(p?.error ?? `HTTP ${r.status}`);
                      setProducts(ps=>[{...p,imageUrl:null},...ps]);
                      flash("Draft created");
                    }).catch((e:Error)=>flash(`Create failed — ${e.message}`));
                  }}
                  style={{ cursor:"pointer", border:"none", background:C.dark, color:C.card,
                    fontSize:13, fontWeight:600, padding:"9px 14px", borderRadius:4,
                    display:"flex", alignItems:"center", gap:6 }}>
                  <Plus size={13}/> New product
                </button>
              </div>

              <div className="bm-table-wrap">
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, overflow:"hidden", minWidth:1040 }}>
                  <div style={{ display:"grid", gridTemplateColumns:PRODUCT_COLS,
                    gap:10, padding:"10px 14px", background:C.thead, borderBottom:`1px solid ${C.border}`,
                    fontSize:10.5, fontWeight:700, letterSpacing:".06em", color:C.muted }}>
                    <span>ART</span><span>TITLE</span><span>TAMIL</span><span>DESCRIPTION</span>
                    {PRICE_FIELDS.map(([key,label]) => (
                      <span key={key} title={`Price for the ${label} print`}>₹ {label}</span>
                    ))}
                    <span>STATUS</span><span>ACTIONS</span>
                  </div>
                  {products.length === 0 && !productsError && (
                    <EmptyState text="No products yet — create one with New product."/>
                  )}
                  {products.map(p => (
                    <div key={p.id}
                      style={{ display:"grid", gridTemplateColumns:PRODUCT_COLS,
                        gap:10, padding:"10px 14px", borderBottom:`1px solid ${C.rowBorder}`,
                        alignItems:"center", fontSize:13.5, opacity: p.active ? 1 : 0.55 }}>
                      <div>
                        <input type="file" accept="image/*" ref={el=>{fileRefs.current[p.id]=el;}} className="hidden"
                          onChange={e=>{const f=e.target.files?.[0]; if(f) handleUpload(p.id,f);}}/>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                          {p.images.map(img => (
                            <div key={img.id} style={{ position:"relative", width:38, height:50 }}
                              title="Click × to remove">
                              <img src={img.url} alt="" style={{ width:38, height:50, objectFit:"cover", borderRadius:3, border:`1px solid ${C.border}` }}/>
                              <button onClick={()=>handleDeleteImage(p.id,img.id)}
                                style={{ position:"absolute", top:-4, right:-4, width:14, height:14, borderRadius:"50%",
                                  background:"#e8452c", color:"#fff", border:"none", cursor:"pointer",
                                  fontSize:9, lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                ×
                              </button>
                            </div>
                          ))}
                          <button onClick={()=>fileRefs.current[p.id]?.click()}
                            title="Add image"
                            style={{ cursor:"pointer", width:38, height:50, border:`1px dashed ${C.border}`,
                              borderRadius:3, background:"repeating-linear-gradient(38deg,#e9eddf 0 5px,#f5f7ee 5px 10px)",
                              padding:0, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <Upload size={11} color={C.faint}/>
                          </button>
                        </div>
                      </div>
                      {(["title","tamil","sub"] as const).map(key => (
                        <input key={key} value={p[key]} onChange={editProduct(p.id,key)}
                          placeholder={key==="sub" ? "Poster description" : undefined}
                          title={key==="sub" ? p.sub : undefined}
                          style={{ border:"1px solid transparent", borderRadius:3, padding:"6px 7px",
                            fontSize:13, background:"transparent", outline:"none", width:"100%",
                            boxSizing:"border-box",
                            fontFamily: key==="tamil" ? "var(--font-anek)" : "inherit" }}
                          onFocus={fo} onBlur={fb}/>
                      ))}
                      {PRICE_FIELDS.map(([key,label]) => (
                        <input key={key} value={String(p[key])} onChange={editProduct(p.id,key)}
                          inputMode="numeric" aria-label={`${label} price`}
                          style={{ border:"1px solid transparent", borderRadius:3, padding:"6px 7px",
                            fontSize:13, background:"transparent", outline:"none", width:"100%",
                            boxSizing:"border-box", fontVariantNumeric:"tabular-nums" }}
                          onFocus={fo} onBlur={fb}/>
                      ))}
                      <span style={{ fontSize:11, fontWeight:600,
                        color: p.active ? C.green : C.faint }}>
                        {p.active ? "Live" : "Archived"}
                      </span>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={()=>{
                          const newActive = !p.active;
                          apiSend(`/api/admin/products/${p.id}`, "PUT", { active:newActive })
                            .then(()=>{
                              setProducts(ps=>ps.map(x=>x.id===p.id?{...x,active:newActive}:x));
                              flash(newActive?"Restored":"Archived");
                            })
                            .catch((e:Error)=>flash(`Update failed — ${e.message}`));
                        }}
                          style={{ cursor:"pointer", border:`1px solid ${C.border}`, background:C.card,
                            fontSize:11.5, padding:"5px 9px", borderRadius:4,
                            display:"flex", alignItems:"center", gap:4 }}>
                          {p.active ? <><Archive size={10}/> Archive</> : <><RotateCcw size={10}/> Restore</>}
                        </button>
                        <button onClick={()=>{
                          if(!confirm("Delete this product?")) return;
                          apiSend(`/api/admin/products/${p.id}`, "DELETE")
                            .then(()=>{ setProducts(ps=>ps.filter(x=>x.id!==p.id)); flash("Deleted"); })
                            .catch((e:Error)=>flash(`Delete failed — ${e.message}`));
                        }}
                          style={{ cursor:"pointer", border:`1px solid ${C.red}`, background:"transparent",
                            color:C.red, fontSize:11.5, padding:"5px 9px", borderRadius:4 }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize:12, color:C.faint, marginTop:10 }}>
                Images upload to Cloudinary when{" "}
                <code style={{ background:C.thead, padding:"1px 4px", borderRadius:2 }}>CLOUDINARY_*</code>{" "}
                env vars are set in .env.local.
              </div>
            </>}

            {/* ══ ORDERS ══ */}
            {tab==="orders" && ordersLoading && <AdminLoader label="Loading orders"/>}
            {tab==="orders" && !ordersLoading && (
              <div className="bm-table-wrap" style={{ marginTop:20 }}>
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, overflow:"hidden", minWidth:600 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"100px 1.4fr 1.8fr .9fr 1.4fr",
                    gap:12, padding:"11px 16px", background:C.thead, borderBottom:`1px solid ${C.border}`,
                    fontSize:10.5, fontWeight:700, letterSpacing:".06em", color:C.muted }}>
                    <span>ORDER</span><span>CUSTOMER</span><span>ITEMS</span><span>TOTAL</span><span>FULFILMENT</span>
                  </div>
                  {orders.length === 0 && <EmptyState text="No orders yet."/>}
                  {orders.map((o,i) => (
                    <div key={o.id}
                      style={{ display:"grid", gridTemplateColumns:"100px 1.4fr 1.8fr .9fr 1.4fr",
                        gap:12, padding:"12px 16px", borderBottom:`1px solid ${C.rowBorder}`,
                        alignItems:"center", fontSize:13.5 }}>
                      <span style={{ fontFamily:"ui-monospace,Menlo,monospace", fontSize:12 }}>{o.id}</span>
                      <span>{o.name}</span>
                      <span style={{ color:C.muted, fontSize:12.5 }}>{o.items}</span>
                      <span style={{ fontVariantNumeric:"tabular-nums" }}>{o.total}</span>
                      <select value={o.status}
                        onChange={e=>{
                          const v=e.target.value;
                          const dbId = o.dbId;
                          if (!dbId) { flash("Cannot update — order has no database id"); return; }
                          apiSend(`/api/admin/orders/${dbId}`, "PATCH", { status:v })
                            .then(()=>{ setOrders(os=>os.map((x,j)=>j===i?{...x,status:v}:x)); flash("Order updated"); })
                            .catch((err:Error)=>flash(`Update failed — ${err.message}`));
                        }}
                        style={{ border:`1px solid ${C.border}`, borderRadius:4, padding:"6px 8px",
                          fontSize:12.5, background:C.card, outline:"none", cursor:"pointer" }}>
                        {["PENDING","PAID","SHIPPED","CANCELLED"].map(s=>(
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ DISCOUNTS ══ */}
            {tab==="discounts" && codesLoading && <AdminLoader label="Loading codes"/>}
            {tab==="discounts" && !codesLoading && <>
              <div style={{ display:"flex", gap:10, margin:"20px 0 14px", flexWrap:"wrap" }}>
                <input value={newCode} onChange={e=>setNewCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  style={{ border:`1px solid ${C.border}`, borderRadius:4, padding:"9px 12px",
                    fontSize:13, outline:"none", textTransform:"uppercase", width:140, background:C.card }}/>
                <input value={newPct} onChange={e=>setNewPct(e.target.value)}
                  placeholder="Value"
                  style={{ border:`1px solid ${C.border}`, borderRadius:4, padding:"9px 12px",
                    fontSize:13, outline:"none", width:80, background:C.card }}/>
                <select value={newType} onChange={e=>setNewType(e.target.value as "PERCENT"|"FLAT")}
                  style={{ border:`1px solid ${C.border}`, borderRadius:4, padding:"9px 10px",
                    fontSize:13, outline:"none", background:C.card, cursor:"pointer" }}>
                  <option value="PERCENT">% off</option>
                  <option value="FLAT">₹ flat</option>
                </select>
                <button
                  onClick={()=>{
                    const code = newCode.trim();
                    if (!code) return flash("Enter a code");
                    const val = parseInt(newPct, 10);
                    if (!val || val <= 0) return flash("Enter a valid value");
                    apiSend("/api/admin/discounts", "POST", { code, type: newType, value: val })
                      .then((d: DiscountCode) => {
                        if (!d?.id) throw new Error("Unexpected response");
                        setCodes(cs => [d, ...cs]); setNewCode(""); setNewPct(""); flash("Code created");
                      })
                      .catch((e: Error) => flash(`Create failed — ${e.message}`));
                  }}
                  style={{ cursor:"pointer", border:"none", background:C.dark, color:C.card,
                    fontSize:13, fontWeight:600, padding:"9px 14px", borderRadius:4 }}>
                  Create code
                </button>
              </div>

              <div className="bm-table-wrap">
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, overflow:"hidden", minWidth:480 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1.2fr .8fr .8fr 1fr .8fr .6fr",
                    gap:12, padding:"11px 16px", background:C.thead, borderBottom:`1px solid ${C.border}`,
                    fontSize:10.5, fontWeight:700, letterSpacing:".06em", color:C.muted }}>
                    <span>CODE</span><span>DISCOUNT</span><span>USES</span><span>STATUS</span><span></span><span></span>
                  </div>
                  {codes.length === 0 && <EmptyState text="No discount codes yet."/>}
                  {codes.map(c => (
                    <div key={c.id}
                      style={{ display:"grid", gridTemplateColumns:"1.2fr .8fr .8fr 1fr .8fr .6fr",
                        gap:12, padding:"12px 16px", borderBottom:`1px solid ${C.rowBorder}`,
                        alignItems:"center", fontSize:13.5 }}>
                      <span style={{ fontFamily:"ui-monospace,Menlo,monospace", fontSize:12.5 }}>{c.code}</span>
                      <span>{c.type === "PERCENT" ? `${c.value}%` : `₹${c.value}`}</span>
                      <span style={{ color:C.muted }}>{c.usedCount}{c.maxUses != null ? ` / ${c.maxUses}` : " / ∞"}</span>
                      <span style={{ fontSize:11.5, fontWeight:600, color:c.active?C.green:C.faint }}>
                        {c.active ? "Active" : "Inactive"}
                      </span>
                      <button onClick={()=>{
                        apiSend(`/api/admin/discounts/${c.id}`, "PATCH", { active:!c.active })
                          .then((d: DiscountCode)=>{
                            if(!d?.id) throw new Error("Unexpected response");
                            setCodes(cs=>cs.map(x=>x.id===c.id?d:x));
                            flash(c.active?"Disabled":"Enabled");
                          })
                          .catch((e:Error)=>flash(`Update failed — ${e.message}`));
                      }}
                        style={{ cursor:"pointer", border:`1px solid ${C.border}`, background:C.card,
                          fontSize:12, padding:"6px 10px", borderRadius:4, justifySelf:"start" }}>
                        {c.active?"Disable":"Enable"}
                      </button>
                      <button onClick={()=>{
                        if(!confirm(`Delete ${c.code}?`)) return;
                        apiSend(`/api/admin/discounts/${c.id}`, "DELETE")
                          .then(()=>{ setCodes(cs=>cs.filter(x=>x.id!==c.id)); flash("Deleted"); })
                          .catch((e:Error)=>flash(`Delete failed — ${e.message}`));
                      }}
                        style={{ cursor:"pointer", border:`1px solid ${C.red}`, background:"transparent",
                          color:C.red, fontSize:12, padding:"6px 10px", borderRadius:4 }}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>}

            {/* ══ HOMEPAGE ══ */}
            {tab==="homepage" && settingsLoading && <AdminLoader label="Loading content"/>}
            {tab==="homepage" && !settingsLoading && (
              <div className="bm-hp-grid">
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6,
                  padding:20, display:"grid", gap:16 }}>
                  {[
                    { label:"Tagline band",      value:tagline, set:setTagline  },
                    { label:"Hero headline",      value:headline,set:setHeadline },
                    { label:"Announcement strip", value:strip,   set:setStrip   },
                  ].map(({ label, value, set }) => (
                    <div key={label}>
                      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#3b4a42", marginBottom:6 }}>
                        {label}
                      </label>
                      <input value={value} onChange={e=>set(e.target.value)}
                        style={{ width:"100%", boxSizing:"border-box", border:`1px solid ${C.border}`,
                          borderRadius:4, padding:"10px 12px", fontSize:14, outline:"none", background:C.card }}/>
                    </div>
                  ))}
                  <div>
                    <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#3b4a42", marginBottom:8 }}>
                      Featured prints (max 4)
                    </label>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      {products.map(p => {
                        const on = featured.includes(p.id);
                        return (
                          <button key={p.id}
                            onClick={()=>setFeatured(f=>on?f.filter(x=>x!==p.id):(f.length>=4?f:[...f,p.id]))}
                            style={{ cursor:"pointer", fontSize:12.5, padding:"7px 12px", borderRadius:999,
                              border:`1px solid ${C.border}`,
                              background: on ? C.dark : C.card,
                              color: on ? C.card : "#3b4a42" }}>
                            {p.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {IMAGE_FIELDS.map(({ key, label, hint, ratio }) => {
                    const url = images[key];
                    const busy = uploadingKey === key;
                    return (
                      <div key={key}>
                        <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#3b4a42", marginBottom:8 }}>
                          {label}
                        </label>
                        <div style={{ display:"flex", gap:14, alignItems:"flex-start", flexWrap:"wrap" }}>
                          <div style={{ width:96, aspectRatio:ratio, flexShrink:0, borderRadius:4,
                            border:`1px solid ${C.border}`, overflow:"hidden", background:C.thead,
                            display:"flex", alignItems:"center", justifyContent:"center" }}>
                            {url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={url} alt={label}
                                style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                            ) : (
                              <span style={{ fontSize:10.5, color:C.faint, textAlign:"center", padding:6 }}>
                                No image
                              </span>
                            )}
                          </div>
                          <div style={{ display:"grid", gap:8 }}>
                            <label style={{ cursor: busy ? "wait" : "pointer",
                              border:`1px solid ${C.border}`, background:C.card, borderRadius:4,
                              fontSize:12.5, padding:"8px 12px", display:"inline-flex",
                              alignItems:"center", gap:6, opacity: busy ? .6 : 1 }}>
                              <Upload size={13}/>
                              {busy ? "Uploading…" : url ? "Replace" : "Upload"}
                              <input type="file" accept="image/*" hidden disabled={busy}
                                onChange={e=>{
                                  const f = e.target.files?.[0];
                                  e.target.value = "";
                                  if (f) uploadImage(key, f);
                                }}/>
                            </label>
                            {url && (
                              <button onClick={()=>removeImage(key)}
                                style={{ cursor:"pointer", border:`1px solid ${C.red}`, background:"transparent",
                                  color:C.red, fontSize:12, padding:"7px 12px", borderRadius:4, justifySelf:"start" }}>
                                Remove
                              </button>
                            )}
                            <span style={{ fontSize:11.5, color:C.faint, maxWidth:230, lineHeight:1.5 }}>
                              {hint}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button onClick={saveHomepage}
                    style={{ cursor:"pointer", justifySelf:"start", border:"none", background:C.dark,
                      color:C.card, fontSize:13.5, fontWeight:600, padding:"10px 18px", borderRadius:4 }}>
                    Save changes
                  </button>
                </div>

                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:18 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:C.muted, letterSpacing:".04em", marginBottom:12 }}>
                    PREVIEW
                  </div>
                  <div style={{ background:C.dark, color:"#e2e7d3", padding:"22px 16px", textAlign:"center", borderRadius:3 }}>
                    <div style={{ fontSize:9.5, letterSpacing:".28em", color:"#b0c2a6" }}>{strip}</div>
                    <div style={{ fontSize:20, fontWeight:700, marginTop:12, lineHeight:1.1 }}>{headline}</div>
                  </div>
                  <div style={{ background:C.red, color:C.card, padding:12, textAlign:"center",
                    fontSize:13, fontWeight:600, marginTop:6, borderRadius:3 }}>
                    {tagline}
                  </div>
                  <div style={{ fontSize:12.5, color:C.muted, marginTop:14 }}>
                    Featured: {featured.map(id=>(products.find(p=>p.id===id)||{}).title).filter(Boolean).join(", ")||"none"}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
