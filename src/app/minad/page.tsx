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
  tag: string; base: number; sub: string; active: boolean; images: ProductImage[];
}
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

  const [products,    setProducts]    = useState<Product[]>([]);
  const [orders,      setOrders]      = useState<Order[]>([]);
  const [codes,       setCodes]       = useState<DiscountCode[]>([]);
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

  const fileRefs = useRef<Record<number, HTMLInputElement|null>>({});

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
      .catch(() => {});
  }, []);

  // Fetch products from DB
  useEffect(() => {
    fetch("/api/admin/products")
      .then(r => r.json())
      .then((data: Product[]) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch(() => {});
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
      .catch(() => {});
  }, []);

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(""), 1800);
  };

  const editProduct = (id: number, key: keyof Product) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const v = (key==="base") ? (parseInt(raw.replace(/\D/g,""),10)||0) : raw;
      setProducts(ps => ps.map(p => p.id===id ? {...p,[key]:v} : p));
      // Persist change to DB
      fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: v }),
      }).then(() => flash("Saved")).catch(() => flash("Save failed"));
    };

  const handleUpload = async (id: number, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("productId", String(id));
    const res  = await fetch("/api/upload", { method:"POST", body:fd });
    const data = await res.json();
    if (!data.url) { flash("Upload failed"); return; }
    // Add new image to local state
    setProducts(ps => ps.map(p => p.id===id
      ? { ...p, images: [...p.images, data.image] }
      : p
    ));
    flash("Image saved");
  };

  const handleDeleteImage = async (productId: number, imageId: number) => {
    await fetch(`/api/upload/${imageId}`, { method: "DELETE" });
    setProducts(ps => ps.map(p => p.id===productId
      ? { ...p, images: p.images.filter(img => img.id !== imageId) }
      : p
    ));
    flash("Image removed");
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
            {tab==="dash" && <>
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
            {tab==="products" && <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                margin:"18px 0 12px", gap:12, flexWrap:"wrap" }}>
                <div style={{ fontSize:13, color:C.muted }}>{products.length} products · click any field to edit</div>
                <button
                  onClick={()=>{
                    fetch("/api/admin/products", {
                      method:"POST",
                      headers:{"Content-Type":"application/json"},
                      body:JSON.stringify({slug:`draft-${Date.now()}`,title:"Untitled print",tamil:"—",tag:"SIGNBOARD",base:499,sub:"New product description",active:false}),
                    }).then(r=>r.json()).then((p:Product)=>{
                      setProducts(ps=>[{...p,imageUrl:null},...ps]);
                      flash("Draft created");
                    }).catch(()=>flash("Create failed"));
                  }}
                  style={{ cursor:"pointer", border:"none", background:C.dark, color:C.card,
                    fontSize:13, fontWeight:600, padding:"9px 14px", borderRadius:4,
                    display:"flex", alignItems:"center", gap:6 }}>
                  <Plus size={13}/> New product
                </button>
              </div>

              <div className="bm-table-wrap">
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, overflow:"hidden", minWidth:720 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"56px 2fr 1.4fr 80px 90px 120px",
                    gap:10, padding:"10px 14px", background:C.thead, borderBottom:`1px solid ${C.border}`,
                    fontSize:10.5, fontWeight:700, letterSpacing:".06em", color:C.muted }}>
                    <span>ART</span><span>TITLE</span><span>TAMIL</span>
                    <span>PRICE</span><span>STATUS</span><span>ACTIONS</span>
                  </div>
                  {products.map(p => (
                    <div key={p.id}
                      style={{ display:"grid", gridTemplateColumns:"56px 2fr 1.4fr 80px 90px 120px",
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
                      {(["title","tamil","base"] as const).map(key => (
                        <input key={key} value={String(p[key])} onChange={editProduct(p.id,key)}
                          style={{ border:"1px solid transparent", borderRadius:3, padding:"6px 7px",
                            fontSize:13, background:"transparent", outline:"none", width:"100%",
                            boxSizing:"border-box",
                            fontFamily: key==="tamil" ? "var(--font-anek)" : "inherit",
                            fontVariantNumeric: key==="base" ? "tabular-nums" : "normal" }}
                          onFocus={fo} onBlur={fb}/>
                      ))}
                      <span style={{ fontSize:11, fontWeight:600,
                        color: p.active ? C.green : C.faint }}>
                        {p.active ? "Live" : "Archived"}
                      </span>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={()=>{
                          const newActive = !p.active;
                          fetch(`/api/admin/products/${p.id}`, {
                            method:"PUT",
                            headers:{"Content-Type":"application/json"},
                            body:JSON.stringify({active:newActive}),
                          }).then(()=>{
                            setProducts(ps=>ps.map(x=>x.id===p.id?{...x,active:newActive}:x));
                            flash(newActive?"Restored":"Archived");
                          }).catch(()=>flash("Update failed"));
                        }}
                          style={{ cursor:"pointer", border:`1px solid ${C.border}`, background:C.card,
                            fontSize:11.5, padding:"5px 9px", borderRadius:4,
                            display:"flex", alignItems:"center", gap:4 }}>
                          {p.active ? <><Archive size={10}/> Archive</> : <><RotateCcw size={10}/> Restore</>}
                        </button>
                        <button onClick={()=>{
                          if(!confirm("Delete this product?")) return;
                          fetch(`/api/admin/products/${p.id}`, { method:"DELETE" })
                            .then(()=>{ setProducts(ps=>ps.filter(x=>x.id!==p.id)); flash("Deleted"); })
                            .catch(()=>flash("Delete failed"));
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
            {tab==="orders" && (
              <div className="bm-table-wrap" style={{ marginTop:20 }}>
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, overflow:"hidden", minWidth:600 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"100px 1.4fr 1.8fr .9fr 1.4fr",
                    gap:12, padding:"11px 16px", background:C.thead, borderBottom:`1px solid ${C.border}`,
                    fontSize:10.5, fontWeight:700, letterSpacing:".06em", color:C.muted }}>
                    <span>ORDER</span><span>CUSTOMER</span><span>ITEMS</span><span>TOTAL</span><span>FULFILMENT</span>
                  </div>
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
                          if (dbId) {
                            fetch(`/api/admin/orders/${dbId}`, {
                              method:"PATCH",
                              headers:{"Content-Type":"application/json"},
                              body:JSON.stringify({status:v}),
                            }).then(()=>{ setOrders(os=>os.map((x,j)=>j===i?{...x,status:v}:x)); flash("Order updated"); })
                            .catch(()=>flash("Update failed"));
                          } else {
                            setOrders(os=>os.map((x,j)=>j===i?{...x,status:v}:x));
                            flash("Order updated");
                          }
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
            {tab==="discounts" && <>
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
                    fetch("/api/admin/discounts", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ code, type: newType, value: val }),
                    })
                      .then(r => r.json())
                      .then((d: DiscountCode) => {
                        if (d.id) { setCodes(cs => [d, ...cs]); setNewCode(""); setNewPct(""); flash("Code created"); }
                        else flash("Create failed");
                      })
                      .catch(() => flash("Create failed"));
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
                        fetch(`/api/admin/discounts/${c.id}`, {
                          method:"PATCH",
                          headers:{"Content-Type":"application/json"},
                          body:JSON.stringify({active:!c.active}),
                        })
                          .then(r=>r.json())
                          .then((d: DiscountCode)=>{ if(d.id){ setCodes(cs=>cs.map(x=>x.id===c.id?d:x)); flash(c.active?"Disabled":"Enabled"); } })
                          .catch(()=>flash("Update failed"));
                      }}
                        style={{ cursor:"pointer", border:`1px solid ${C.border}`, background:C.card,
                          fontSize:12, padding:"6px 10px", borderRadius:4, justifySelf:"start" }}>
                        {c.active?"Disable":"Enable"}
                      </button>
                      <button onClick={()=>{
                        if(!confirm(`Delete ${c.code}?`)) return;
                        fetch(`/api/admin/discounts/${c.id}`, { method:"DELETE" })
                          .then(()=>{ setCodes(cs=>cs.filter(x=>x.id!==c.id)); flash("Deleted"); })
                          .catch(()=>flash("Delete failed"));
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
            {tab==="homepage" && (
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
                  <button onClick={()=>flash("Homepage saved")}
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
