"use client";

import { useState, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Plus, Upload, Archive, RotateCcw, Menu, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface Product {
  id: number; slug: string; title: string; tamil: string;
  tag: string; price: number; stock: number; live: boolean; imageUrl: string | null;
}
interface Order {
  id: string; name: string; items: string; total: string; status: string;
}
interface DiscountCode {
  code: string; pct: string; uses: string; live: boolean;
}

// ── Seed data ──────────────────────────────────────────────────────────────

const REVENUE_30 = [
  { d:"Jul 22",rev:4120}, { d:"Jul 24",rev:7290}, { d:"Jul 26",rev:3400},
  { d:"Jul 28",rev:7100}, { d:"Jul 30",rev:6910}, { d:"Aug 1", rev:9200},
  { d:"Aug 3", rev:4200}, { d:"Aug 5", rev:8100}, { d:"Aug 7", rev:7300},
  { d:"Aug 9", rev:6400}, { d:"Aug 11",rev:4100}, { d:"Aug 13",rev:10200},
  { d:"Aug 15",rev:11400},{ d:"Aug 17",rev:5100}, { d:"Aug 19",rev:9300},
  { d:"Aug 20",rev:10800},
];

const WEEKLY_BARS = [
  { day:"Mon",h:46},{ day:"Tue",h:62},{ day:"Wed",h:38},
  { day:"Thu",h:78},{ day:"Fri",h:96},{ day:"Sat",h:84},{ day:"Sun",h:54},
];

const TOP_PRINTS = [
  { title:"Rendu Minute",      units:"92 units" },
  { title:"Meter Podu",        units:"74 units" },
  { title:"Filter Coffee Only",units:"61 units" },
  { title:"Semma Scene",       units:"48 units" },
];

const STATUS_PIE = [
  { name:"Delivered",value:185,color:"#2f7d55" },
  { name:"Shipped",  value:67, color:"#1a5fa8" },
  { name:"Packed",   value:24, color:"#6d28d9" },
  { name:"Printing", value:22, color:"#a8781a" },
  { name:"New",      value:14, color:"#e8452c" },
];

const P0: Product[] = [
  { id:1,slug:"meter-podu",        title:"Meter Podu",        tamil:"மீட்டர் போடு",         tag:"SIGNBOARD",price:499,stock:42,live:true, imageUrl:null},
  { id:2,slug:"filter-coffee-only",title:"Filter Coffee Only",tamil:"டிகிரி காபி",          tag:"OORU",     price:599,stock:18,live:true, imageUrl:null},
  { id:3,slug:"rendu-minute",      title:"Rendu Minute",      tamil:"ரெண்டு நிமிஷம்",       tag:"SLANG",    price:399,stock:65,live:true, imageUrl:null},
  { id:4,slug:"vetti-time",        title:"Vetti Time",        tamil:"வெட்டி நேரம்",         tag:"SLANG",    price:449,stock:7, live:true, imageUrl:null},
  { id:5,slug:"bus-stand-blues",   title:"Bus Stand Blues",   tamil:"நிற்கும் இடம்",        tag:"NOSTALGIA",price:699,stock:0, live:false,imageUrl:null},
  { id:6,slug:"kadalai-podu",      title:"Kadalai Podu",      tamil:"கடலை போடு",            tag:"SLANG",    price:449,stock:31,live:true, imageUrl:null},
  { id:7,slug:"semma-scene",       title:"Semma Scene",       tamil:"செம்ம சீன்",           tag:"OORU",     price:549,stock:24,live:true, imageUrl:null},
  { id:8,slug:"sapten-thoongiten", title:"Sapten Thoongiten", tamil:"சாப்டேன் தூங்கிட்டேன்",tag:"NOSTALGIA",price:599,stock:12,live:true, imageUrl:null},
  { id:9,slug:"ille-ille",         title:"Ille Ille",         tamil:"இல்லை இல்லை",          tag:"SIGNBOARD",price:399,stock:53,live:true, imageUrl:null},
];

const O0: Order[] = [
  { id:"BM-4412",name:"Deepa R · Chennai",    items:"Meter Podu A3, Ille Ille A4",     total:"₹1,027",status:"New"},
  { id:"BM-4411",name:"Arun K · Coimbatore",  items:"Filter Coffee Only A2",            total:"₹1,028",status:"Printing"},
  { id:"BM-4410",name:"Nithya S · Bengaluru", items:"Vetti Time A3 ×2",                total:"₹1,277",status:"Packed"},
  { id:"BM-4409",name:"Hari V · Madurai",     items:"Semma Scene A4",                  total:"₹628",  status:"Shipped"},
  { id:"BM-4408",name:"Priya M · Toronto",    items:"Rendu Minute A2, Kadalai Podu A3",total:"₹1,527",status:"Shipped"},
  { id:"BM-4407",name:"Sabari T · Trichy",    items:"Sapten Thoongiten A3",            total:"₹828",  status:"Delivered"},
];

const C0: DiscountCode[] = [
  { code:"MOODI10",  pct:"10%", uses:"87 / ∞",   live:true  },
  { code:"FIRSTWALL",pct:"₹100",uses:"212 / 500", live:true  },
  { code:"DIWALI24", pct:"20%", uses:"431 / 431", live:false },
];

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
  const [authed,  setAuthed]  = useState(false);
  const [user,    setUser]    = useState("");
  const [pass,    setPass]    = useState("");
  const [tab,     setTab]     = useState<Tab>("dash");
  const [saved,   setSaved]   = useState("");
  const [sideOpen,setSideOpen]= useState(false);

  const [products, setProducts] = useState<Product[]>(P0);
  const [orders,   setOrders]   = useState<Order[]>(O0);
  const [codes,    setCodes]    = useState<DiscountCode[]>(C0);
  const [newCode,  setNewCode]  = useState("");
  const [newPct,   setNewPct]   = useState("");
  const [tagline,  setTagline]  = useState("Bottle Moodi — Mood-க்கு ஏத்த Design");
  const [headline, setHeadline] = useState("NORMAL IS NOT OUR SIZE");
  const [strip,    setStrip]    = useState("NOW SHOWING · POSTERS · CHENNAI");
  const [featured, setFeatured] = useState<number[]>([1,2,3,4]);

  const fileRefs = useRef<Record<number, HTMLInputElement|null>>({});

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(""), 1800);
  };

  const editProduct = (id: number, key: keyof Product) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const v = (key==="price"||key==="stock") ? (parseInt(raw.replace(/\D/g,""),10)||0) : raw;
      setProducts(ps => ps.map(p => p.id===id ? {...p,[key]:v} : p));
      flash("Saved");
    };

  const handleUpload = async (id: number, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res  = await fetch("/api/upload", { method:"POST", body:fd });
    const data = await res.json();
    const url  = data.url ?? URL.createObjectURL(file);
    setProducts(ps => ps.map(p => p.id===id ? {...p,imageUrl:url} : p));
    flash(data.url ? "Uploaded" : "Preview set (configure Cloudinary to persist)");
  };

  const pickTab = (t: Tab) => { setTab(t); setSideOpen(false); };

  // ── Login ─────────────────────────────────────────────────────────────

  if (!authed) return (
    <>
      <style>{RESPONSIVE_CSS}</style>
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
        background:C.loginBg, padding:16 }}>
        <div style={{ width:"100%", maxWidth:360, background:C.card, border:`1px solid ${C.border}`,
          borderRadius:6, padding:"24px 28px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ fontFamily:"var(--font-bakbak)", fontSize:17, letterSpacing:".02em", color:C.dark }}>
              BOTTLEMOODI
            </div>
            <CapLogo size={38}/>
          </div>
          <h1 style={{ margin:"8px 0 2px", fontFamily:"var(--font-bakbak)", fontSize:24,
            fontWeight:400, letterSpacing:".01em", color:C.dark }}>Admin sign in</h1>
          <div style={{ fontSize:13, color:C.muted, marginBottom:22 }}>Internal tool. Staff accounts only.</div>

          {[
            { label:"Email", type:"text",     value:user, set:(v:string)=>setUser(v), placeholder:"you@bottlemoodi.com" },
            { label:"Password", type:"password", value:pass, set:(v:string)=>setPass(v), placeholder:"••••••••" },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#3b4a42", marginBottom:6 }}>{f.label}</label>
              <input type={f.type} value={f.value} onChange={e=>f.set(e.target.value)}
                placeholder={f.placeholder}
                style={{ width:"100%", boxSizing:"border-box", border:`1px solid ${C.border}`,
                  borderRadius:4, padding:"10px 12px", fontSize:14, outline:"none",
                  marginBottom:14, background:"#fff" }}
                onKeyDown={e=>e.key==="Enter"&&setAuthed(true)}/>
            </div>
          ))}

          <button onClick={()=>setAuthed(true)}
            style={{ width:"100%", cursor:"pointer", border:"none", background:C.dark,
              color:C.card, fontSize:14, fontWeight:600, padding:11, borderRadius:4 }}>
            Sign in
          </button>
        </div>
      </div>
    </>
  );

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
        <div style={{ fontSize:12, color:"#7c8b80" }}>{user||"admin@bottlemoodi.com"}</div>
        <button onClick={()=>{ setAuthed(false); setPass(""); setSideOpen(false); }}
          style={{ cursor:"pointer", marginTop:8, border:"1px solid #31423b", background:"transparent",
            color:C.sideText, fontSize:12, padding:"7px 12px", borderRadius:4 }}>
          Sign out
        </button>
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
                  { label:"REVENUE (30D)",value:"₹1,84,200",delta:"+18% vs last month" },
                  { label:"ORDERS (30D)", value:"312",       delta:"+24 this week" },
                  { label:"UNITS SOLD",   value:"489",       delta:"+9% vs last month" },
                  { label:"AVG ORDER",    value:"₹591",      delta:"+₹32" },
                ].map(({ label, value, delta }) => (
                  <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:14 }}>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:600, letterSpacing:".04em" }}>{label}</div>
                    <div className="bm-stat-val" style={{ fontSize:24, fontWeight:600, marginTop:6, letterSpacing:"-.02em" }}>{value}</div>
                    <div style={{ fontSize:12, color:C.green, marginTop:4 }}>{delta}</div>
                  </div>
                ))}
              </div>

              {/* Revenue area */}
              <div className="bm-rev-chart">
                <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Revenue — last 30 days</div>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={REVENUE_30} margin={{ top:4, right:4, bottom:0, left:0 }}>
                    <defs>
                      <linearGradient id="revG2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.red} stopOpacity={0.22}/>
                        <stop offset="100%" stopColor={C.red} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.rowBorder} vertical={false}/>
                    <XAxis dataKey="d" tick={{ fontSize:9.5, fill:C.faint }} tickLine={false} axisLine={false} interval={4}/>
                    <YAxis tick={{ fontSize:9.5, fill:C.faint }} tickLine={false} axisLine={false}
                      tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} width={36}/>
                    <Tooltip content={<RevTip/>}/>
                    <Area type="monotone" dataKey="rev" stroke={C.red} strokeWidth={2}
                      fill="url(#revG2)" dot={false} activeDot={{ r:4, fill:C.red, stroke:C.card, strokeWidth:2 }}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bm-chart-row">
                {/* Weekly bar */}
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Units sold — last 7 days</div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={WEEKLY_BARS} margin={{ top:0, right:0, bottom:0, left:-20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.rowBorder} vertical={false}/>
                      <XAxis dataKey="day" tick={{ fontSize:10.5, fill:C.faint }} tickLine={false} axisLine={false}/>
                      <YAxis tick={{ fontSize:9.5, fill:C.faint }} tickLine={false} axisLine={false}/>
                      <Tooltip content={<BarTip/>}/>
                      <Bar dataKey="h" radius={[2,2,0,0]}>
                        {WEEKLY_BARS.map((d,i) => (
                          <Cell key={i} fill={d.h===96 ? C.red : `rgba(232,69,44,${0.45+i*0.07})`}/>
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
                      {TOP_PRINTS.map(t => (
                        <div key={t.title} style={{ display:"flex", justifyContent:"space-between",
                          fontSize:13.5, borderBottom:`1px solid ${C.rowBorder}`, paddingBottom:8 }}>
                          <span>{t.title}</span><span style={{ color:C.muted }}>{t.units}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Order status</div>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ position:"relative", flexShrink:0 }}>
                        <PieChart width={90} height={90}>
                          <Pie data={STATUS_PIE} cx={45} cy={45} innerRadius={28} outerRadius={43}
                            paddingAngle={2} dataKey="value" stroke="none">
                            {STATUS_PIE.map((e,i) => <Cell key={i} fill={e.color}/>)}
                          </Pie>
                        </PieChart>
                        <div style={{ position:"absolute", top:"50%", left:"50%",
                          transform:"translate(-50%,-50%)", textAlign:"center", pointerEvents:"none" }}>
                          <div style={{ fontSize:14, fontWeight:700 }}>312</div>
                          <div style={{ fontSize:8, color:C.faint, fontWeight:600 }}>ORDERS</div>
                        </div>
                      </div>
                      <div style={{ display:"grid", gap:5 }}>
                        {STATUS_PIE.map(d => (
                          <div key={d.name} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12 }}>
                            <div style={{ width:7, height:7, borderRadius:"50%", background:d.color, flexShrink:0 }}/>
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
                  onClick={()=>{ const id=Math.max(...products.map(p=>p.id))+1; setProducts(ps=>[{id,slug:`draft-${id}`,title:"Untitled print",tamil:"—",tag:"SIGNBOARD",price:499,stock:0,live:false,imageUrl:null},...ps]); flash("Draft created"); }}
                  style={{ cursor:"pointer", border:"none", background:C.dark, color:C.card,
                    fontSize:13, fontWeight:600, padding:"9px 14px", borderRadius:4,
                    display:"flex", alignItems:"center", gap:6 }}>
                  <Plus size={13}/> New product
                </button>
              </div>

              <div className="bm-table-wrap">
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, overflow:"hidden", minWidth:680 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"56px 2fr 1.4fr 80px 70px 90px 100px",
                    gap:10, padding:"10px 14px", background:C.thead, borderBottom:`1px solid ${C.border}`,
                    fontSize:10.5, fontWeight:700, letterSpacing:".06em", color:C.muted }}>
                    <span>ART</span><span>TITLE</span><span>TAMIL</span>
                    <span>PRICE</span><span>STOCK</span><span>STATUS</span><span>ACTION</span>
                  </div>
                  {products.map(p => (
                    <div key={p.id}
                      style={{ display:"grid", gridTemplateColumns:"56px 2fr 1.4fr 80px 70px 90px 100px",
                        gap:10, padding:"10px 14px", borderBottom:`1px solid ${C.rowBorder}`,
                        alignItems:"center", fontSize:13.5, opacity: p.live ? 1 : 0.55 }}>
                      <div>
                        <input type="file" accept="image/*" ref={el=>{fileRefs.current[p.id]=el;}} className="hidden"
                          onChange={e=>{const f=e.target.files?.[0]; if(f) handleUpload(p.id,f);}}/>
                        <button onClick={()=>fileRefs.current[p.id]?.click()}
                          style={{ cursor:"pointer", width:38, height:50, border:`1px dashed ${C.border}`,
                            borderRadius:3, background:"repeating-linear-gradient(38deg,#e9eddf 0 5px,#f5f7ee 5px 10px)",
                            padding:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt={p.title} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                            : <Upload size={11} color={C.faint}/>}
                        </button>
                      </div>
                      {(["title","tamil","price","stock"] as const).map(key => (
                        <input key={key} value={String(p[key])} onChange={editProduct(p.id,key)}
                          style={{ border:"1px solid transparent", borderRadius:3, padding:"6px 7px",
                            fontSize:13, background:"transparent", outline:"none", width:"100%",
                            boxSizing:"border-box",
                            fontFamily: key==="tamil" ? "var(--font-anek)" : "inherit",
                            fontVariantNumeric: (key==="price"||key==="stock") ? "tabular-nums" : "normal",
                            color: key==="stock" ? (p.stock===0?C.red:p.stock<10?C.amber:"inherit") : "inherit" }}
                          onFocus={fo} onBlur={fb}/>
                      ))}
                      <span style={{ fontSize:11, fontWeight:600,
                        color: p.live ? (p.stock>0?C.green:C.amber) : C.faint }}>
                        {p.live ? (p.stock>0?"Live":"Sold out") : "Archived"}
                      </span>
                      <button onClick={()=>{ setProducts(ps=>ps.map(x=>x.id===p.id?{...x,live:!x.live}:x)); flash(p.live?"Archived":"Restored"); }}
                        style={{ cursor:"pointer", border:`1px solid ${C.border}`, background:C.card,
                          fontSize:11.5, padding:"5px 9px", borderRadius:4, justifySelf:"start",
                          display:"flex", alignItems:"center", gap:4 }}>
                        {p.live ? <><Archive size={10}/> Archive</> : <><RotateCcw size={10}/> Restore</>}
                      </button>
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
                        onChange={e=>{ const v=e.target.value; setOrders(os=>os.map((x,j)=>j===i?{...x,status:v}:x)); flash("Order updated"); }}
                        style={{ border:`1px solid ${C.border}`, borderRadius:4, padding:"6px 8px",
                          fontSize:12.5, background:C.card, outline:"none", cursor:"pointer" }}>
                        {["New","Printing","Packed","Shipped","Delivered"].map(s=>(
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
                  placeholder="% off"
                  style={{ border:`1px solid ${C.border}`, borderRadius:4, padding:"9px 12px",
                    fontSize:13, outline:"none", width:80, background:C.card }}/>
                <button
                  onClick={()=>{ const code=newCode.trim(); if(!code) return flash("Enter a code"); setCodes(cs=>[{code,pct:(newPct||"10")+"%",uses:"0 / ∞",live:true},...cs]); setNewCode(""); setNewPct(""); flash("Code created"); }}
                  style={{ cursor:"pointer", border:"none", background:C.dark, color:C.card,
                    fontSize:13, fontWeight:600, padding:"9px 14px", borderRadius:4 }}>
                  Create code
                </button>
              </div>

              <div className="bm-table-wrap">
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, overflow:"hidden", minWidth:480 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1.2fr .8fr .8fr 1fr .8fr",
                    gap:12, padding:"11px 16px", background:C.thead, borderBottom:`1px solid ${C.border}`,
                    fontSize:10.5, fontWeight:700, letterSpacing:".06em", color:C.muted }}>
                    <span>CODE</span><span>DISCOUNT</span><span>USES</span><span>STATUS</span><span></span>
                  </div>
                  {codes.map((c,i) => (
                    <div key={c.code}
                      style={{ display:"grid", gridTemplateColumns:"1.2fr .8fr .8fr 1fr .8fr",
                        gap:12, padding:"12px 16px", borderBottom:`1px solid ${C.rowBorder}`,
                        alignItems:"center", fontSize:13.5 }}>
                      <span style={{ fontFamily:"ui-monospace,Menlo,monospace", fontSize:12.5 }}>{c.code}</span>
                      <span>{c.pct}</span>
                      <span style={{ color:C.muted }}>{c.uses}</span>
                      <span style={{ fontSize:11.5, fontWeight:600, color:c.live?C.green:C.faint }}>
                        {c.live?"Active":"Expired"}
                      </span>
                      <button onClick={()=>{ setCodes(cs=>cs.map((x,j)=>j===i?{...x,live:!x.live}:x)); flash(c.live?"Disabled":"Enabled"); }}
                        style={{ cursor:"pointer", border:`1px solid ${C.border}`, background:C.card,
                          fontSize:12, padding:"6px 10px", borderRadius:4, justifySelf:"start" }}>
                        {c.live?"Disable":"Enable"}
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
