import { useState, useEffect, useRef, useCallback } from "react";

// ─── SUPABASE CONFIG ─────────────────────────────────────────
const SB_URL  = "https://komfnzzizeyfmgdxjunq.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbWZuenppemV5Zm1nZHhqdW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MTIyODcsImV4cCI6MjA5NjA4ODI4N30.WKK-2Wcx9FtguO1kBm5Cg2ckT0YwinTcObACUlpn5hs";

// ─── SUPABASE FETCH HELPERS ───────────────────────────────────
// fetchWithTimeout — prevents infinite "Processing…" when the artifact
// sandbox blocks outbound requests. 12 s is generous for real deploys.
async function fetchWithTimeout(url, options, ms = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    if (e.name === "AbortError") {
      throw new Error("Request timed out. Make sure this app is running on your own domain (not inside the Claude sandbox) and that your Supabase project is active.");
    }
    throw new Error("Network error — check your internet connection and Supabase project status.");
  }
}

async function sbAuth(path, body, token) {
  try {
    const res = await fetchWithTimeout(`${SB_URL}/auth/v1/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SB_ANON, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error_description || json.msg || json.message || "Auth failed" };
    return json;
  } catch (e) {
    return { error: e.message };
  }
}

async function sbGet(table, query = "", token) {
  try {
    const res = await fetchWithTimeout(`${SB_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: SB_ANON, Authorization: `Bearer ${token || SB_ANON}`, "Content-Type": "application/json", Prefer: "return=representation" },
    });
    if (!res.ok) return { data: null, error: await res.json() };
    return { data: await res.json(), error: null };
  } catch (e) {
    return { data: null, error: e.message };
  }
}

async function sbPost(table, body, token) {
  try {
    const res = await fetchWithTimeout(`${SB_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SB_ANON, Authorization: `Bearer ${token || SB_ANON}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { data: null, error: await res.json() };
    return { data: await res.json(), error: null };
  } catch (e) {
    return { data: null, error: e.message };
  }
}

async function sbPatch(table, query, body, token) {
  try {
    const res = await fetchWithTimeout(`${SB_URL}/rest/v1/${table}?${query}`, {
      method: "PATCH",
      headers: { apikey: SB_ANON, Authorization: `Bearer ${token || SB_ANON}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { data: null, error: await res.json() };
    return { data: await res.json(), error: null };
  } catch (e) {
    return { data: null, error: e.message };
  }
}

// ─── GOOGLE OAUTH ─────────────────────────────────────────────
// Redirects to Google via Supabase. On return, the URL hash contains
// access_token, refresh_token, etc. — we parse these in App on mount.
function startGoogleOAuth() {
  const redirectTo = window.location.href.split("#")[0]; // strip any existing hash
  const url = `${SB_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
  window.location.href = url;
}

// Parse Supabase OAuth tokens from the URL hash fragment (#access_token=...&...)
function parseOAuthHash() {
  const hash = window.location.hash.substring(1);
  if (!hash) return null;
  const params = Object.fromEntries(new URLSearchParams(hash));
  if (!params.access_token) return null;
  // Build a session object shaped like the password-grant response
  return {
    access_token:  params.access_token,
    refresh_token: params.refresh_token,
    expires_in:    Number(params.expires_in)||3600,
    expires_at:    Math.floor(Date.now()/1000) + (Number(params.expires_in)||3600),
    token_type:    params.token_type||"bearer",
    user: { id: params.user_id||null, email: null }, // email fetched separately
  };
}

// After OAuth, fetch the user object using the access token
async function fetchOAuthUser(accessToken) {
  const res = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { apikey: SB_ANON, Authorization: `Bearer ${accessToken}` },
  });
  return res.ok ? res.json() : null;
}

// session stored in memory
let _session = null;
function getToken() { return _session?.access_token || null; }

// ─── CONSTANTS ────────────────────────────────────────────────
const BITCOIN_ADDRESS = "0x80a57072982ef59c94c2d04dea72d7f8529d4a37";
const ADMIN_EMAIL     = "ukohavictor05@gmail.com";
const MIN_INVEST      = 100;
const MIN_WITHDRAW    = 500;
const WITHDRAW_LOCK_DAYS = 90;

const PLANS = [
  { id:"starter", name:"Starter", min:100,   max:499,      color:"#f59e0b", badge:"⚡", desc:"Entry-level growth strategy",  dailyRate:0.30/90 },
  { id:"basic",   name:"Basic",   min:500,   max:1999,     color:"#10b981", badge:"🔥", desc:"Balanced yield portfolio",      dailyRate:0.50/90 },
  { id:"premium", name:"Premium", min:2000,  max:9999,     color:"#6366f1", badge:"💎", desc:"High-performance asset mix",    dailyRate:0.80/90 },
  { id:"vip",     name:"VIP",     min:10000, max:Infinity, color:"#f43f5e", badge:"👑", desc:"Institutional-grade strategy", dailyRate:1.00/90 },
];

const TESTIMONIALS = [
  { name:"Marcus T.",  country:"🇺🇸 United States", avatar:"M", text:"I was skeptical at first, but after my first 90-day cycle completed I was genuinely impressed. Clean dashboard, fast responses, balance grew exactly as expected.", plan:"Premium Plan", joined:"March 2023" },
  { name:"Amara O.",   country:"🇳🇬 Nigeria",        avatar:"A", text:"BitGrow has been one of the best financial decisions I've made. The verification was smooth and the admin team is professional. I've already referred three friends.", plan:"Basic Plan", joined:"July 2023" },
  { name:"Chen W.",    country:"🇸🇬 Singapore",      avatar:"C", text:"As someone who has tried multiple crypto platforms, BitGrow stands out for transparency and support. The recovery phrase system gave me real confidence.", plan:"VIP Plan", joined:"January 2024" },
  { name:"Sofia R.",   country:"🇧🇷 Brazil",          avatar:"S", text:"I started with Starter just to test. Three months later my balance had grown considerably. Now I've upgraded to Premium.", plan:"Starter Plan", joined:"October 2023" },
  { name:"James K.",   country:"🇬🇧 United Kingdom",  avatar:"J", text:"The platform is intuitive and live chat support is genuinely helpful. I had a question about my withdrawal and it was resolved in 10 minutes.", plan:"Basic Plan", joined:"April 2024" },
  { name:"Fatima A.",  country:"🇦🇪 UAE",             avatar:"F", text:"Professional platform with a serious team behind it. The blockchain verification step gave me confidence my funds were handled properly.", plan:"VIP Plan", joined:"February 2024" },
];

const BIP_WORDS = ["abandon","ability","able","about","above","absent","absorb","abstract","absurd","abuse","access","accident","account","accuse","achieve","acid","acoustic","acquire","across","act","action","actor","actress","actual","adapt","add","addict","address","adjust","admit","adult","advance","advice","aerobic","afford","afraid","again","agent","agree","ahead","aim","air","airport","aisle","alarm","album","alcohol","alert","alien","alley","allow","almost","alone","alpha","already","also","alter","always","amateur","amazing","among","amount","amused","analyst","anchor","ancient","anger","angle","angry","animal","ankle","announce","annual","another","answer","antenna","antique","anxiety","april","arch","arctic","area","arena","argue","arm","armed","armor","army","around","arrange","arrest","arrive","arrow","art","article","artist","ask","aspect","assault","asset","assist","assume","asthma","athlete","atom","attack","attend","attitude","attract","auction","audit","august","aunt","author","auto","autumn","average","avocado","aware","awesome","awful","awkward","axis"];
const CURRENCIES = ["USD – US Dollar","EUR – Euro","GBP – British Pound","JPY – Japanese Yen","AUD – Australian Dollar","CAD – Canadian Dollar","CHF – Swiss Franc","CNY – Chinese Yuan","ZAR – South African Rand","NGN – Nigerian Naira","BRL – Brazilian Real","INR – Indian Rupee","MXN – Mexican Peso","SGD – Singapore Dollar","AED – UAE Dirham","GHS – Ghanaian Cedi","KES – Kenyan Shilling","EGP – Egyptian Pound","PKR – Pakistani Rupee"];
const COUNTRIES  = ["Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","China","Colombia","Congo","Denmark","Ecuador","Egypt","Ethiopia","Finland","France","Germany","Ghana","Greece","Guatemala","Hungary","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Japan","Jordan","Kazakhstan","Kenya","Kuwait","Lebanon","Libya","Malaysia","Mexico","Morocco","Mozambique","Myanmar","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Saudi Arabia","Senegal","Singapore","South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria","Tanzania","Thailand","Tunisia","Turkey","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"];

// ─── HELPERS ──────────────────────────────────────────────────
function gen12Phrase() { return Array.from({length:12},()=>BIP_WORDS[Math.floor(Math.random()*BIP_WORDS.length)]).join(" "); }
function genReferralCode() { return "BG"+Math.random().toString(36).substring(2,8).toUpperCase(); }
function getPlan(amount) { return PLANS.find(p=>amount>=p.min&&amount<=p.max)||null; }
function calcBalance(inv) {
  if (!inv?.verified_at) return inv?.amount||0;
  const plan=getPlan(inv.amount); if(!plan) return inv.amount;
  const days=(Date.now()-new Date(inv.verified_at).getTime())/(1000*60*60*24);
  return +(inv.amount+inv.amount*plan.dailyRate*days).toFixed(2);
}
function usd(n) { return "$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function validatePassword(pw) {
  const e=[];
  if(pw.length<8) e.push("at least 8 characters");
  if(!/[A-Z]/.test(pw)) e.push("one uppercase letter");
  if(!/[0-9]/.test(pw)) e.push("one number");
  if(!/[^A-Za-z0-9]/.test(pw)) e.push("one special character");
  return e;
}
function canWithdraw(inv) { if(!inv?.verified_at)return false; return (Date.now()-new Date(inv.verified_at).getTime())/86400000>=WITHDRAW_LOCK_DAYS; }
function daysUntilWithdraw(inv) { if(!inv?.verified_at)return WITHDRAW_LOCK_DAYS; return Math.max(0,Math.ceil(WITHDRAW_LOCK_DAYS-(Date.now()-new Date(inv.verified_at).getTime())/86400000)); }
function useCopy(timeout=2500) {
  const [copied,setCopied]=useState(false);
  const copy=async text=>{ try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),timeout); } catch {} };
  return [copied,copy];
}

// ─── STYLES ───────────────────────────────────────────────────
const S = {
  card: { background:"#0f1117", border:"1px solid #1e2030", borderRadius:16 },
  btn: (active) => ({ background:active?"linear-gradient(135deg,#fbbf24,#f97316)":"#111218", color:active?"#07080f":"#6b7280", border:active?"none":"1px solid #1e2030", padding:"8px 14px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }),
  input: { background:"#080910", border:"1px solid #1e2030", borderRadius:10, padding:"12px 14px", color:"#e8eaf0", fontSize:15, outline:"none", width:"100%", fontFamily:"inherit" },
  label: { fontSize:12, color:"#6b7280", fontWeight:600, textTransform:"uppercase", letterSpacing:.4 },
  errBox: { background:"#ef444414", border:"1px solid #ef444433", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#ef4444", display:"flex", gap:8 },
  primaryBtn: { width:"100%", background:"linear-gradient(135deg,#fbbf24,#f97316)", color:"#07080f", border:"none", padding:"14px", borderRadius:10, fontWeight:700, fontSize:16, cursor:"pointer" },
};

// ─── SMALL COMPONENTS ─────────────────────────────────────────
function Spinner({ size=40 }) {
  return <div style={{width:size,height:size,border:`3px solid #1e2030`,borderTopColor:"#fbbf24",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>;
}

function LoadingBtn({ onClick, loading, disabled, children }) {
  return (
    <button onClick={(!loading&&!disabled)?onClick:undefined}
      style={{...S.primaryBtn, background:(loading||disabled)?"#b45309":"linear-gradient(135deg,#fbbf24,#f97316)", opacity:(loading||disabled)?0.8:1, display:"flex",alignItems:"center",justifyContent:"center",gap:10, cursor:(loading||disabled)?"not-allowed":"pointer"}}>
      {loading && <Spinner size={18}/>}
      {loading ? "Processing..." : children}
    </button>
  );
}

function ErrBox({ msg }) {
  if (!msg) return null;
  return <div style={S.errBox}><span>⚠</span><span>{msg}</span></div>;
}

function Field({ label, value, onChange, type="text", placeholder, readOnly }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <label style={S.label}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
        style={{...S.input, opacity:readOnly?.5:1}}
        onFocus={e=>!readOnly&&(e.target.style.borderColor="#fbbf24")}
        onBlur={e=>e.target.style.borderColor="#1e2030"}/>
    </div>
  );
}

function Select({ label, value, onChange, children }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <label style={S.label}>{label}</label>
      <select value={value} onChange={onChange}
        style={{...S.input,appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 14px center",color:value?"#e8eaf0":"#6b7280"}}>
        {children}
      </select>
    </div>
  );
}

function StatusBadge({ status }) {
  const m = { pending:{bg:"#f59e0b18",c:"#f59e0b",l:"⏳ Pending"}, pending_verification:{bg:"#f59e0b18",c:"#f59e0b",l:"🔍 Awaiting Verification"}, verified:{bg:"#10b98118",c:"#10b981",l:"✅ Verified"}, approved:{bg:"#6366f118",c:"#6366f1",l:"✓ Approved"}, paid:{bg:"#10b98118",c:"#10b981",l:"💸 Paid"}, rejected:{bg:"#ef444418",c:"#ef4444",l:"✕ Rejected"} };
  const s = m[status]||m.pending;
  return <span style={{background:s.bg,color:s.c,borderRadius:100,padding:"4px 12px",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{s.l}</span>;
}

function AnimatedCounter({ target, prefix="", suffix="", duration=2000 }) {
  const [count,setCount]=useState(0);
  const ref=useRef(null); const started=useRef(false);
  useEffect(()=>{
    const observer=new IntersectionObserver(entries=>{
      if(entries[0].isIntersecting&&!started.current){
        started.current=true;
        const start=Date.now();
        const tick=()=>{ const p=Math.min((Date.now()-start)/duration,1); const e=1-Math.pow(1-p,3); setCount(Math.floor(e*target)); if(p<1)requestAnimationFrame(tick); else setCount(target); };
        requestAnimationFrame(tick);
      }
    },{threshold:0.3});
    if(ref.current) observer.observe(ref.current);
    return ()=>observer.disconnect();
  },[target,duration]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

function CopyBtn({ text, label="Copy" }) {
  const [copied,copy]=useCopy();
  return (
    <button onClick={()=>copy(text)} style={{background:copied?"#10b98118":"#fbbf2418",color:copied?"#10b981":"#fbbf24",border:`1px solid ${copied?"#10b98155":"#fbbf2455"}`,borderRadius:8,padding:"9px 16px",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
      {copied?"✓ Copied!":label}
    </button>
  );
}

// ─── TESTIMONIALS ─────────────────────────────────────────────
function Testimonials() {
  const [active,setActive]=useState(0);
  useEffect(()=>{ const id=setInterval(()=>setActive(a=>(a+1)%TESTIMONIALS.length),5000); return()=>clearInterval(id); },[]);
  const t=TESTIMONIALS[active];
  return (
    <section style={{padding:"72px 24px",background:"#080910",borderTop:"1px solid #1e2030",borderBottom:"1px solid #1e2030"}}>
      <div style={{maxWidth:860,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <h2 style={{fontSize:30,fontWeight:800,marginBottom:10}}>What Our Investors Say</h2>
          <p style={{color:"#6b7280"}}>Trusted by over 12,400 investors across 80+ countries</p>
        </div>
        <div style={{...S.card,padding:36,maxWidth:680,margin:"0 auto",position:"relative"}}>
          <div style={{fontSize:48,color:"#fbbf2430",fontFamily:"Georgia",lineHeight:1,position:"absolute",top:20,left:28}}>"</div>
          <p style={{color:"#9ca3af",fontSize:15,lineHeight:1.85,marginBottom:24,marginTop:16,fontStyle:"italic"}}>{t.text}</p>
          <div style={{display:"flex",alignItems:"center",gap:14,justifyContent:"space-between",flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,#fbbf24,#f97316)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:18,color:"#07080f"}}>{t.avatar}</div>
              <div><div style={{fontWeight:700,fontSize:14}}>{t.name}</div><div style={{color:"#4b5563",fontSize:12}}>{t.country} · {t.joined}</div></div>
            </div>
            <span style={{background:"#fbbf2415",border:"1px solid #fbbf2433",color:"#fbbf24",borderRadius:100,padding:"4px 12px",fontSize:11,fontWeight:700}}>{t.plan}</span>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:24}}>
          {TESTIMONIALS.map((_,i)=><button key={i} onClick={()=>setActive(i)} style={{width:i===active?24:8,height:8,borderRadius:4,background:i===active?"#fbbf24":"#1e2030",border:"none",transition:"all .3s",cursor:"pointer"}}/>)}
        </div>
      </div>
    </section>
  );
}

// ─── SETTINGS MODAL ───────────────────────────────────────────
function SettingsModal({ session, profile, onClose, onProfileUpdate }) {
  const [tab,setTab]=useState("profile");
  const [msg,setMsg]=useState(null);
  const [loading,setLoading]=useState(false);
  const [prof,setProf]=useState({phone:profile?.phone||"",city:profile?.city||"",country:profile?.country||"",address:profile?.address||""});
  const [pw,setPw]=useState({newPw:"",confirm:""});
  const fp=k=>e=>setProf(p=>({...p,[k]:e.target.value}));
  const phrase=profile?.phrase||"";

  const saveProfile=async()=>{
    setMsg(null);setLoading(true);
    const{error}=await sbPatch("profiles",`id=eq.${profile.id}`,prof,getToken());
    setLoading(false);
    if(error) return setMsg({type:"err",text:"Failed to save."});
    onProfileUpdate({...profile,...prof});
    setMsg({type:"ok",text:"Profile updated successfully!"});
  };

  const savePassword=async()=>{
    setMsg(null);
    const errs=validatePassword(pw.newPw);
    if(errs.length) return setMsg({type:"err",text:"Password needs: "+errs.join(", ")});
    if(pw.newPw!==pw.confirm) return setMsg({type:"err",text:"Passwords do not match."});
    setLoading(true);
    const res=await sbAuth("user",{password:pw.newPw},getToken());
    setLoading(false);
    if(res.error) return setMsg({type:"err",text:res.error});
    setPw({newPw:"",confirm:""});
    setMsg({type:"ok",text:"Password changed successfully!"});
  };

  const tabs=[{id:"profile",label:"👤 Profile"},{id:"password",label:"🔒 Password"},{id:"phrase",label:"🔑 Recovery Phrase"},{id:"account",label:"ℹ️ Account"}];
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{...S.card,width:"100%",maxWidth:500,maxHeight:"88vh",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,.8)"}}>
        <div style={{padding:"20px 24px 16px",borderBottom:"1px solid #1e2030",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div><h2 style={{fontWeight:800,fontSize:18}}>Account Settings</h2><p style={{color:"#4b5563",fontSize:12,marginTop:2}}>{session?.user?.email}</p></div>
          <button onClick={onClose} style={{background:"#111218",border:"1px solid #1e2030",color:"#9ca3af",borderRadius:8,width:32,height:32,fontSize:16,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"flex",gap:4,padding:"12px 16px 0",flexShrink:0,overflowX:"auto"}}>
          {tabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setMsg(null);}} style={{flex:1,background:tab===t.id?"linear-gradient(135deg,#fbbf24,#f97316)":"#111218",color:tab===t.id?"#07080f":"#6b7280",border:tab===t.id?"none":"1px solid #1e2030",borderRadius:8,padding:"8px 6px",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>{t.label}</button>)}
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"20px 24px"}}>
          {msg&&<div style={{background:msg.type==="ok"?"#10b98115":"#ef444415",border:`1px solid ${msg.type==="ok"?"#10b98144":"#ef444444"}`,borderRadius:10,padding:"10px 14px",fontSize:13,color:msg.type==="ok"?"#10b981":"#ef4444",marginBottom:16}}>{msg.type==="ok"?"✅":"⚠"} {msg.text}</div>}
          {tab==="profile"&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <Field label="Phone Number" value={prof.phone} onChange={fp("phone")} type="tel" placeholder="+1 234 567 8900"/>
              <Field label="City" value={prof.city} onChange={fp("city")} placeholder="Your city"/>
              <Field label="Country" value={prof.country} onChange={fp("country")} placeholder="Your country"/>
              <Field label="Address" value={prof.address} onChange={fp("address")} placeholder="Street address"/>
              <LoadingBtn onClick={saveProfile} loading={loading}>Save Profile</LoadingBtn>
            </div>
          )}
          {tab==="password"&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{background:"#080910",border:"1px solid #1e2030",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#6b7280",lineHeight:1.7}}>🔐 Min 8 chars · uppercase · number · special character</div>
              <Field label="New Password" value={pw.newPw} onChange={e=>setPw(p=>({...p,newPw:e.target.value}))} type="password" placeholder="Enter new password"/>
              <Field label="Confirm Password" value={pw.confirm} onChange={e=>setPw(p=>({...p,confirm:e.target.value}))} type="password" placeholder="Re-enter new password"/>
              <LoadingBtn onClick={savePassword} loading={loading}>Update Password</LoadingBtn>
            </div>
          )}
          {tab==="phrase"&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{background:"#1a0d00",border:"1px solid #f59e0b44",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#f59e0b",lineHeight:1.7}}>⚠️ Keep this phrase secret. Anyone with it can access your account. Never share it.</div>
              {phrase?(
                <>
                  <div style={{background:"#080910",border:"2px solid #fbbf2444",borderRadius:12,padding:20}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                      {phrase.split(" ").map((w,i)=>(
                        <div key={i} style={{background:"#111218",borderRadius:8,padding:"8px 10px",display:"flex",alignItems:"center",gap:6}}>
                          <span style={{color:"#4b5563",fontSize:11,minWidth:16}}>{i+1}.</span>
                          <span style={{fontWeight:600,fontSize:13}}>{w}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <CopyBtn text={phrase} label="Copy Recovery Phrase"/>
                </>
              ):<p style={{color:"#4b5563",textAlign:"center",padding:24}}>No recovery phrase found for this account.</p>}
            </div>
          )}
          {tab==="account"&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[["Full Name",profile?.name||"—"],["Email",session?.user?.email||"—"],["Username",profile?.username||"—"],["Phone",profile?.phone||"Not set"],["Currency",profile?.currency||"Not set"],["Country",profile?.country||"Not set"],["Referral Code",profile?.referral_code||"—"],["Member Since",profile?.created_at?new Date(profile.created_at).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}):"—"]].map(([label,value])=>(
                <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#080910",border:"1px solid #1e2030",borderRadius:10,padding:"11px 14px",gap:12}}>
                  <span style={{color:"#4b5563",fontSize:12,fontWeight:600,flexShrink:0}}>{label}</span>
                  <span style={{color:label==="Referral Code"?"#fbbf24":"#9ca3af",fontSize:13,fontWeight:label==="Referral Code"?700:400,textAlign:"right",wordBreak:"break-all"}}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────
function Nav({ page, navigate, goBack, pageHistory, session, profile, logout, isAdmin, setDashTab, notifCount, setNotifCount }) {
  const showBack = pageHistory.length>0 && page!=="home";
  const [drop,setDrop]=useState(false);
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [localProfile,setLocalProfile]=useState(profile);
  const dropRef=useRef(null);
  useEffect(()=>setLocalProfile(profile),[profile]);
  useEffect(()=>{
    const h=e=>{if(dropRef.current&&!dropRef.current.contains(e.target))setDrop(false);};
    document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h);
  },[]);
  const goTab=tab=>{setDashTab(tab);navigate("dashboard");setDrop(false);};
  const p=localProfile||profile;
  return (
    <>
      {settingsOpen&&session&&<SettingsModal session={session} profile={p} onClose={()=>setSettingsOpen(false)} onProfileUpdate={updated=>{setLocalProfile(updated);setSettingsOpen(false);}}/>}
      <nav style={{position:"sticky",top:0,zIndex:200,background:"rgba(7,8,15,0.97)",backdropFilter:"blur(20px)",borderBottom:"1px solid #1e2030",padding:"0 20px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {showBack&&<button onClick={goBack} style={{background:"#111218",border:"1px solid #1e2030",color:"#9ca3af",borderRadius:8,padding:"6px 10px",display:"flex",alignItems:"center",gap:4,fontSize:13,marginRight:4,cursor:"pointer"}}>← Back</button>}
          <div onClick={()=>navigate("home")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:34,height:34,background:"linear-gradient(135deg,#fbbf24,#f59e0b)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:"#07080f"}}>B</div>
            <span style={{fontWeight:800,fontSize:20,background:"linear-gradient(90deg,#fbbf24,#f97316)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>BitGrow</span>
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {!session ? <>
            <button style={S.btn(page==="login")} onClick={()=>navigate("login")}>Login</button>
            <button style={{...S.btn(true)}} onClick={()=>navigate("register")}>Get Started</button>
          </> : <>
            <button style={S.btn(page==="dashboard")} onClick={()=>navigate("dashboard")}>Dashboard</button>
            {isAdmin&&<button style={S.btn(page==="admin")} onClick={()=>navigate("admin")}>⚙ Admin</button>}
            <button onClick={()=>{setNotifCount(0);goTab("overview");}} style={{position:"relative",background:"#111218",border:"1px solid #1e2030",borderRadius:9,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
              🔔
              {notifCount>0&&<span style={{position:"absolute",top:-5,right:-5,background:"#ef4444",color:"#fff",borderRadius:"50%",width:17,height:17,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #07080f"}}>{notifCount>9?"9+":notifCount}</span>}
            </button>
            <div ref={dropRef} style={{position:"relative"}}>
              <button onClick={()=>setDrop(o=>!o)} style={{display:"flex",alignItems:"center",gap:8,background:drop?"#1a1d2e":"#111218",border:`1px solid ${drop?"#fbbf2466":"#1e2030"}`,borderRadius:10,padding:"5px 10px 5px 6px",cursor:"pointer"}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#fbbf24,#f97316)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:"#07080f"}}>{(p?.first_name||p?.name||"U")[0].toUpperCase()}</div>
                <span style={{color:"#e8eaf0",fontSize:13,fontWeight:600,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p?.first_name||p?.name?.split(" ")[0]||"Account"}</span>
                <span style={{color:"#6b7280",fontSize:10,transform:drop?"rotate(180deg)":"none",display:"inline-block",transition:"transform .2s"}}>▼</span>
              </button>
              {drop&&(
                <div style={{position:"fixed",top:68,right:16,width:290,background:"#0f1117",border:"1px solid #1e2030",borderRadius:16,boxShadow:"0 24px 70px rgba(0,0,0,.8)",zIndex:400,maxHeight:"calc(100vh - 80px)",overflowY:"auto"}}>
                  {/* Profile header */}
                  <div style={{padding:"16px 18px 14px",background:"#080910",borderBottom:"1px solid #1e2030",borderRadius:"16px 16px 0 0"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#fbbf24,#f97316)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:20,color:"#07080f",flexShrink:0}}>{(p?.first_name||p?.name||"U")[0].toUpperCase()}</div>
                      <div style={{minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:14,color:"#e8eaf0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p?.name||"User"}</div>
                        <div style={{fontSize:11,color:"#4b5563",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session?.user?.email}</div>
                        <div style={{marginTop:4,display:"flex",gap:4}}>
                          <span style={{background:"#fbbf2415",border:"1px solid #fbbf2440",color:"#fbbf24",borderRadius:100,padding:"1px 8px",fontSize:10,fontWeight:700}}>{p?.referral_code||"—"}</span>
                          <span style={{background:"#10b98115",border:"1px solid #10b98140",color:"#10b981",borderRadius:100,padding:"1px 8px",fontSize:10,fontWeight:600}}>● Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Portfolio section */}
                  <div style={{padding:"6px 0"}}>
                    <div style={{padding:"6px 18px 2px",fontSize:10,color:"#374151",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Portfolio</div>
                    {[["📊","Overview","Your balance & investments",()=>goTab("overview")],["💰","Invest","Browse & fund a plan",()=>goTab("invest")],["💸","Withdraw","Request a payout",()=>goTab("withdraw")],["📋","History","Transactions & records",()=>goTab("history")],["👥","Referrals","Share code & earn $10",()=>goTab("referrals")]].map(([icon,label,sub,fn])=>(
                      <div key={label} onClick={fn} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 18px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#111218"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <span style={{fontSize:15,width:24,textAlign:"center",flexShrink:0}}>{icon}</span>
                        <div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"#e8eaf0"}}>{label}</div><div style={{fontSize:11,color:"#4b5563"}}>{sub}</div></div>
                      </div>
                    ))}
                  </div>
                  {/* Account section */}
                  <div style={{borderTop:"1px solid #1e2030",padding:"6px 0"}}>
                    <div style={{padding:"6px 18px 2px",fontSize:10,color:"#374151",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Account</div>
                    <div onClick={()=>{setSettingsOpen(true);setDrop(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 18px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#111218"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{fontSize:15,width:24,textAlign:"center",flexShrink:0}}>⚙️</span>
                      <div><div style={{fontSize:13,fontWeight:600,color:"#e8eaf0"}}>Settings</div><div style={{fontSize:11,color:"#4b5563"}}>Profile, password, recovery phrase</div></div>
                    </div>
                    <div onClick={()=>{setSettingsOpen(true);setDrop(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 18px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#111218"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{fontSize:15,width:24,textAlign:"center",flexShrink:0}}>🔒</span>
                      <div><div style={{fontSize:13,fontWeight:600,color:"#e8eaf0"}}>Change Password</div><div style={{fontSize:11,color:"#4b5563"}}>Update your login password</div></div>
                    </div>
                    <div onClick={()=>{setSettingsOpen(true);setDrop(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 18px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#111218"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{fontSize:15,width:24,textAlign:"center",flexShrink:0}}>🔑</span>
                      <div><div style={{fontSize:13,fontWeight:600,color:"#e8eaf0"}}>Recovery Phrase</div><div style={{fontSize:11,color:"#4b5563"}}>View your 12-word backup key</div></div>
                    </div>
                    {isAdmin&&<div onClick={()=>{navigate("admin");setDrop(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 18px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#111218"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{fontSize:15,width:24,textAlign:"center",flexShrink:0}}>🛡️</span>
                      <div><div style={{fontSize:13,fontWeight:600,color:"#fbbf24"}}>Admin Panel</div><div style={{fontSize:11,color:"#4b5563"}}>Manage users & transactions</div></div>
                    </div>}
                  </div>
                  {/* Sign out */}
                  <div style={{borderTop:"1px solid #1e2030"}}>
                    <div onClick={()=>{logout();setDrop(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"13px 18px",cursor:"pointer",borderRadius:"0 0 16px 16px"}} onMouseEnter={e=>e.currentTarget.style.background="#1a0808"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{fontSize:15,width:24,textAlign:"center",flexShrink:0}}>🚪</span>
                      <div style={{fontSize:13,fontWeight:700,color:"#ef4444"}}>Sign Out</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>}
        </div>
      </nav>
    </>
  );
}

// ─── AUTH PAGES ───────────────────────────────────────────────
function AuthCard({ title, subtitle, children }) {
  return (
    <div style={{minHeight:"82vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{...S.card,width:"100%",maxWidth:440,padding:40}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:52,height:52,background:"linear-gradient(135deg,#fbbf24,#f97316)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:24,color:"#07080f",margin:"0 auto 14px"}}>B</div>
          <h2 style={{fontWeight:800,fontSize:24,marginBottom:6}}>{title}</h2>
          <p style={{color:"#6b7280",fontSize:13}}>{subtitle}</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:18}}>{children}</div>
      </div>
    </div>
  );
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" style={{flexShrink:0}}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

function GoogleBtn({ label="Continue with Google" }) {
  return (
    <button onClick={startGoogleOAuth}
      style={{width:"100%",background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"13px 20px",fontSize:15,fontWeight:700,color:"#1f2937",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
      <GoogleIcon/>{label}
    </button>
  );
}

function Divider() {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      <div style={{flex:1,height:1,background:"#1e2030"}}/>
      <span style={{color:"#374151",fontSize:12,fontWeight:600}}>OR</span>
      <div style={{flex:1,height:1,background:"#1e2030"}}/>
    </div>
  );
}



function LoginPage({ navigate, onLogin }) {
  const [form,setForm]=useState({email:"",password:""});
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));

  const submit=async()=>{
    setErr(""); setLoading(true);
    const data=await sbAuth("token?grant_type=password",{email:form.email,password:form.password});
    setLoading(false);
    if(data.error) return setErr(data.error);
    _session=data;
    onLogin(data);
    navigate("dashboard");
  };

  return (
    <AuthCard title="Welcome Back" subtitle="Sign in to your BitGrow account">
      <ErrBox msg={err}/>
      <GoogleBtn label="Continue with Google"/>
      <Divider/>
      <Field label="Email Address" value={form.email} onChange={f("email")} type="email" placeholder="you@example.com"/>
      <Field label="Password" value={form.password} onChange={f("password")} type="password" placeholder="••••••••"/>
      <LoadingBtn onClick={submit} loading={loading}>Sign In</LoadingBtn>
      <div style={{textAlign:"center",fontSize:13,color:"#6b7280"}}>New to BitGrow? <span onClick={()=>navigate("register")} style={{color:"#fbbf24",cursor:"pointer",fontWeight:600}}>Create an account</span></div>
    </AuthCard>
  );
}

function RegisterPage({ navigate, onLogin }) {
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({firstName:"",lastName:"",email:"",phone:"",currency:"",country:"",state:"",city:"",address:"",username:"",password:"",confirm:"",referral:"",declared:false});
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [phrase,setPhrase]=useState("");
  const [phraseSession,setPhraseSession]=useState(null);
  const [phraseCopied,copyPhrase]=useCopy();
  const f=k=>e=>{const v=e.target.type==="checkbox"?e.target.checked:e.target.value;setForm(p=>({...p,[k]:v}));};

  const submit=async()=>{
    setErr("");
    const{firstName,lastName,email,phone,currency,country,state,city,address,username,password,confirm,declared}=form;
    if(!firstName||!lastName||!email||!phone||!currency||!country||!state||!city||!address||!username||!password||!confirm) return setErr("Please fill in all required fields.");
    const errs=validatePassword(password);
    if(errs.length) return setErr("Password must include: "+errs.join(", ")+".");
    if(password!==confirm) return setErr("Passwords do not match.");
    if(!declared) return setErr("You must accept the terms to proceed.");
    setLoading(true);
    const authData=await sbAuth("signup",{email:email.trim().toLowerCase(),password,data:{full_name:`${firstName} ${lastName}`}});
    if(authData.error||authData.error_description){setLoading(false);return setErr(authData.error_description||authData.error||"Signup failed");}
    const uid=authData.user?.id;
    if(!uid){setLoading(false);return setErr("Signup failed — no user ID.");}
    _session=authData;
    const p=gen12Phrase(),ref=genReferralCode();
    let referredBy=null;
    if(form.referral.trim()){
      const{data:refData}=await sbGet("profiles",`referral_code=eq.${form.referral.trim().toUpperCase()}&select=id`,getToken());
      if(refData?.[0]) referredBy=refData[0].id;
    }
    const{error:profErr}=await sbPost("profiles",{id:uid,name:`${firstName.trim()} ${lastName.trim()}`,first_name:firstName.trim(),last_name:lastName.trim(),username:username.trim(),phone,currency,country,state,city,address,referral_code:ref,referred_by:referredBy,phrase:p,manual_bonus:0,auth_method:"email",created_at:new Date().toISOString()},getToken());
    if(profErr){setLoading(false);return setErr(JSON.stringify(profErr));}
    await sbPost("chats",{user_id:uid,text:`Welcome to BitGrow, ${firstName}! 🎉 Your account is now active. Head to the Invest tab, select a plan, and send your deposit to our BSC wallet. Our team is here 24/7. — BitGrow Team`,from_role:"admin"},getToken());
    setLoading(false);
    setPhrase(p);
    setPhraseSession(authData);
    setStep(3);
  };

  if(step===3) return (
    <div style={{minHeight:"90vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{...S.card,width:"100%",maxWidth:520,padding:40}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:48,marginBottom:12}}>🔑</div>
          <h2 style={{fontWeight:800,fontSize:22,marginBottom:8,color:"#fbbf24"}}>Save Your Recovery Phrase</h2>
          <p style={{color:"#ef4444",fontSize:13,fontWeight:600}}>⚠ Shown ONCE. Write it down and store safely.</p>
        </div>
        <div style={{background:"#080910",border:"2px solid #fbbf2444",borderRadius:12,padding:20,marginBottom:20}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {phrase.split(" ").map((w,i)=>(
              <div key={i} style={{background:"#111218",borderRadius:8,padding:"8px 10px",display:"flex",alignItems:"center",gap:6}}>
                <span style={{color:"#4b5563",fontSize:11,minWidth:16}}>{i+1}.</span>
                <span style={{fontWeight:600,fontSize:13}}>{w}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={()=>copyPhrase(phrase)} style={{width:"100%",background:phraseCopied?"#10b98118":"#fbbf2418",color:phraseCopied?"#10b981":"#fbbf24",border:`1px solid ${phraseCopied?"#10b98155":"#fbbf2455"}`,borderRadius:10,padding:"10px",fontWeight:700,fontSize:14,marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer"}}>
          {phraseCopied?"✓ Copied!":"Copy Phrase"}
        </button>
        <button onClick={()=>{if(phraseSession)onLogin(phraseSession);navigate("dashboard");}} style={S.primaryBtn}>I've saved my phrase — Continue →</button>
      </div>
    </div>
  );

  const strength=form.password.length===0?0:(4-validatePassword(form.password).length);
  const sColor=["#ef4444","#f59e0b","#fbbf24","#10b981","#10b981"][strength];

  return (
    <div style={{minHeight:"90vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px"}}>
      <div style={{...S.card,width:"100%",maxWidth:560,padding:40}}>
        <div style={{marginBottom:32}}>
          <div style={{width:52,height:52,background:"linear-gradient(135deg,#fbbf24,#f97316)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:24,color:"#07080f",marginBottom:16}}>B</div>
          <h2 style={{fontWeight:800,fontSize:26,marginBottom:6}}>Create Account</h2>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <ErrBox msg={err}/>
          <GoogleBtn label="Sign up with Google"/>
          <Divider/>
          <Select label="Account Currency" value={form.currency} onChange={f("currency")}><option value="">Select your currency</option>{CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}</Select>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="First Name" value={form.firstName} onChange={f("firstName")} placeholder="John"/>
            <Field label="Last Name" value={form.lastName} onChange={f("lastName")} placeholder="Doe"/>
          </div>
          <Field label="Email Address" value={form.email} onChange={f("email")} type="email" placeholder="john@example.com"/>
          <Field label="Phone Number" value={form.phone} onChange={f("phone")} type="tel" placeholder="+1 234 567 8900"/>
          <Select label="Country" value={form.country} onChange={f("country")}><option value="">Select your country</option>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}</Select>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="State / Province" value={form.state} onChange={f("state")} placeholder="California"/>
            <Field label="City" value={form.city} onChange={f("city")} placeholder="Los Angeles"/>
          </div>
          <Field label="Address" value={form.address} onChange={f("address")} placeholder="123 Main St"/>
          <Field label="Username" value={form.username} onChange={f("username")} placeholder="johndoe"/>
          <Field label="Referral Code (optional)" value={form.referral} onChange={f("referral")} placeholder="e.g. BGXYZ123"/>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <Field label="Password" value={form.password} onChange={f("password")} type="password" placeholder="Min 8 chars, uppercase, number, symbol"/>
            {form.password.length>0&&<>
              <div style={{display:"flex",gap:4,marginTop:4}}>{[0,1,2,3].map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<strength?sColor:"#1e2030",transition:"background .3s"}}/>)}</div>
              <div style={{fontSize:11,color:sColor,fontWeight:600}}>{["","Weak","Fair","Good","Strong"][strength]}</div>
            </>}
          </div>
          <Field label="Confirm Password" value={form.confirm} onChange={f("confirm")} type="password" placeholder="Re-enter password"/>
          <label style={{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer",background:"#080910",border:`1px solid ${form.declared?"#fbbf2466":"#1e2030"}`,borderRadius:10,padding:"14px 16px"}}>
            <input type="checkbox" checked={form.declared} onChange={f("declared")} style={{marginTop:2}}/>
            <span style={{fontSize:13,color:"#9ca3af",lineHeight:1.6}}>I declare the information is accurate. I am at least 18 years old and agree to the <span style={{color:"#fbbf24"}}>Terms of Service</span> and <span style={{color:"#fbbf24"}}>Privacy Policy</span>.</span>
          </label>
          <LoadingBtn onClick={submit} loading={loading}>Create My Account →</LoadingBtn>
          <div style={{textAlign:"center",fontSize:13,color:"#6b7280"}}>Already have an account? <span onClick={()=>navigate("login")} style={{color:"#fbbf24",cursor:"pointer",fontWeight:600}}>Sign In</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────
function Dashboard({ session, profile, dashTab, setDashTab }) {
  const [tab,setTabLocal]=useState(dashTab||"overview");
  const setTab=t=>{setTabLocal(t);setDashTab(t);};
  useEffect(()=>setTabLocal(dashTab),[dashTab]);
  const [chatOpen,setChatOpen]=useState(false);
  const [investments,setInvestments]=useState([]);
  const [withdrawals,setWithdrawals]=useState([]);
  const [chats,setChats]=useState([]);
  const [referrals,setReferrals]=useState([]);
  const [loadingData,setLoadingData]=useState(true);
  const uid=session?.user?.id||session?.user_id;

  const fetchAll=useCallback(async()=>{
    if(!uid) return;
    const tok=getToken();
    const[invRes,wRes,chatRes,refRes]=await Promise.all([
      sbGet("investments",`user_id=eq.${uid}&order=started_at.desc`,tok),
      sbGet("withdrawals",`user_id=eq.${uid}&order=created_at.desc`,tok),
      sbGet("chats",`user_id=eq.${uid}&order=created_at.asc`,tok),
      sbGet("profiles",`referred_by=eq.${uid}&select=id,name`,tok),
    ]);
    setInvestments(invRes.data||[]);
    setWithdrawals(wRes.data||[]);
    setChats(chatRes.data||[]);
    setReferrals(refRes.data||[]);
    setLoadingData(false);
  },[uid]);

  useEffect(()=>{fetchAll();const id=setInterval(fetchAll,15000);return()=>clearInterval(id);},[fetchAll]);

  const activeInv=investments.filter(i=>i.status==="verified"||i.status==="pending_verification");
  const verifiedInv=investments.filter(i=>i.verified_at);
  const totalInvested=verifiedInv.reduce((s,i)=>s+(i.amount||0),0);
  const investmentBalance=verifiedInv.reduce((s,i)=>s+calcBalance(i),0);
  const totalBalance=+(investmentBalance+(profile?.manual_bonus||0)).toFixed(2);
  const totalProfit=+(totalBalance-totalInvested).toFixed(2);

  const sendChat=async msg=>{
    const tok=getToken();
    await sbPost("chats",{user_id:uid,text:msg,from_role:"user",read:false},tok);
    await fetchAll();
  };

  if(loadingData) return <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center"}}><Spinner/><p style={{color:"#6b7280",marginTop:16}}>Loading your portfolio…</p></div></div>;

  return (
    <div style={{maxWidth:1120,margin:"0 auto",padding:"28px 16px 100px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,flexWrap:"wrap",gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:46,height:46,background:"linear-gradient(135deg,#fbbf24,#f97316)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:20,color:"#07080f"}}>{(profile?.first_name||profile?.name||"U")[0].toUpperCase()}</div>
          <div>
            <h1 style={{fontWeight:800,fontSize:22}}>Hello, {profile?.first_name||profile?.name?.split(" ")[0]||"Investor"} 👋</h1>
            <p style={{color:"#6b7280",fontSize:12}}>{session?.user?.email} · Ref: <span style={{color:"#fbbf24",fontWeight:600}}>{profile?.referral_code||"—"}</span></p>
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"nowrap",overflowX:"auto"}}>
          {["overview","invest","withdraw","history","referrals"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={S.btn(tab===t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </div>
      </div>
      {tab==="overview"  &&<OverviewTab  profile={profile} totalBalance={totalBalance} totalInvested={totalInvested} totalProfit={totalProfit} activeInv={activeInv} withdrawals={withdrawals} setTab={setTab}/>}
      {tab==="invest"    &&<InvestTab    uid={uid} onRefresh={fetchAll}/>}
      {tab==="withdraw"  &&<WithdrawTab  uid={uid} totalBalance={totalBalance} withdrawals={withdrawals} activeInv={verifiedInv} onRefresh={fetchAll}/>}
      {tab==="history"   &&<HistoryTab   investments={investments} withdrawals={withdrawals}/>}
      {tab==="referrals" &&<ReferralsTab profile={profile} referrals={referrals}/>}
      <div style={{position:"fixed",bottom:24,right:24,zIndex:300}}>
        {chatOpen&&<ChatWidget uid={uid} profile={profile} chats={chats} onSend={sendChat}/>}
        <button onClick={()=>setChatOpen(o=>!o)} style={{width:54,height:54,borderRadius:"50%",background:"linear-gradient(135deg,#fbbf24,#f97316)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 8px 28px rgba(251,191,36,.4)",color:"#07080f",marginTop:8,cursor:"pointer"}}>{chatOpen?"✕":"💬"}</button>
      </div>
    </div>
  );
}

function OverviewTab({ profile, totalBalance, totalInvested, totalProfit, activeInv, withdrawals, setTab }) {
  const isNew=activeInv.length===0;
  return (
    <div>
      {isNew&&(
        <div style={{background:"linear-gradient(135deg,#1a1400,#1a0d00)",border:"1px solid #fbbf2433",borderRadius:16,padding:28,marginBottom:20}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
            <div style={{fontSize:36}}>🚀</div>
            <div style={{flex:1,minWidth:200}}>
              <h3 style={{fontWeight:800,fontSize:18,marginBottom:8,color:"#fbbf24"}}>Welcome to BitGrow, {profile?.first_name||"Investor"}!</h3>
              <p style={{color:"#9ca3af",fontSize:13,lineHeight:1.7,marginBottom:20}}>Follow these 3 steps to activate your investment.</p>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
                {[["1","Choose a Plan","Select the tier that fits your goals"],["2","Send Deposit","Transfer to our BSC wallet & paste TxID"],["3","Get Verified","Admin confirms & your balance activates"]].map(([n,t,d])=>(
                  <div key={n} style={{flex:1,minWidth:140,background:"#07080f",borderRadius:10,padding:"12px 14px",border:"1px solid #1e2030"}}>
                    <div style={{width:22,height:22,borderRadius:6,background:"linear-gradient(135deg,#fbbf24,#f97316)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,color:"#07080f",marginBottom:8}}>{n}</div>
                    <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{t}</div>
                    <div style={{color:"#4b5563",fontSize:11,lineHeight:1.5}}>{d}</div>
                  </div>
                ))}
              </div>
              <button onClick={()=>setTab("invest")} style={{background:"linear-gradient(135deg,#fbbf24,#f97316)",color:"#07080f",border:"none",padding:"11px 28px",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>Start Investing Now →</button>
            </div>
          </div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:14,marginBottom:20}}>
        {[{label:"Portfolio Value",value:usd(totalBalance),color:"#fbbf24",sub:activeInv.length>0?`${activeInv.length} active investment${activeInv.length>1?"s":""}`:  "No active investments",icon:"💼"},{label:"Total Invested",value:usd(totalInvested),color:"#6366f1",sub:"Principal deposited",icon:"📥"},{label:"Total Returns",value:usd(totalProfit),color:totalProfit>0?"#10b981":"#6b7280",sub:totalInvested>0?`${totalProfit>=0?"+":""}${((totalProfit/totalInvested)*100).toFixed(2)}% return`:  "Awaiting investment",icon:"📈"}].map(m=>(
          <div key={m.label} style={{...S.card,padding:22,borderLeft:`3px solid ${m.color}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}><span style={{color:"#4b5563",fontSize:11,fontWeight:600,textTransform:"uppercase"}}>{m.label}</span><span style={{fontSize:20}}>{m.icon}</span></div>
            <div style={{fontWeight:800,fontSize:24,color:m.color,marginBottom:4}}>{m.value}</div>
            <div style={{color:"#6b7280",fontSize:12}}>{m.sub}</div>
          </div>
        ))}
      </div>
      {activeInv.length>0?(
        <div style={{...S.card,padding:24,marginBottom:16}}>
          <h3 style={{fontWeight:700,fontSize:15,marginBottom:16}}>📊 Active Investments</h3>
          {activeInv.map((inv,i)=>{const p=getPlan(inv.amount);const bal=calcBalance(inv);const gain=+(bal-inv.amount).toFixed(2);return(
            <div key={i} style={{background:"#080910",borderRadius:12,padding:16,border:`1px solid ${p?.color||"#1e2030"}22`,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>{p?.badge}</span><div><span style={{fontWeight:700,color:p?.color}}>{p?.name} Plan</span><div style={{color:"#4b5563",fontSize:11}}>{new Date(inv.started_at).toLocaleDateString()}</div></div></div>
                <StatusBadge status={inv.verified_at?"verified":"pending_verification"}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8}}>
                {[["Deposited",usd(inv.amount),"#9ca3af"],["Current Value",usd(bal),"#fbbf24"],["Returns",usd(gain),gain>0?"#10b981":"#6b7280"],["TxID",(inv.txid||"").slice(0,12)+"...","#4b5563"]].map(([l,v,c])=>(
                  <div key={l} style={{background:"#0f1117",borderRadius:8,padding:"10px 12px"}}><div style={{color:"#4b5563",fontSize:10,marginBottom:3,textTransform:"uppercase"}}>{l}</div><div style={{fontWeight:700,color:c,fontSize:13}}>{v}</div></div>
                ))}
              </div>
            </div>
          );})}
        </div>
      ):(
        <div style={{...S.card,padding:48,textAlign:"center",border:"1px dashed #1e2030",marginBottom:16}}>
          <div style={{width:64,height:64,background:"#fbbf2412",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 20px",border:"1px solid #fbbf2433"}}>₿</div>
          <h3 style={{fontWeight:800,fontSize:20,marginBottom:10}}>No Active Investment</h3>
          <p style={{color:"#6b7280",marginBottom:24,maxWidth:380,margin:"0 auto 24px",lineHeight:1.7}}>Select a plan and submit your deposit to start tracking your portfolio returns.</p>
          <button onClick={()=>setTab("invest")} style={{background:"linear-gradient(135deg,#fbbf24,#f97316)",color:"#07080f",border:"none",padding:"12px 32px",borderRadius:10,fontWeight:700,fontSize:15,cursor:"pointer"}}>Start Investing →</button>
        </div>
      )}
      {withdrawals.length>0&&(
        <div style={{...S.card,padding:22}}>
          <h3 style={{fontWeight:700,fontSize:14,marginBottom:14,color:"#9ca3af"}}>RECENT WITHDRAWALS</h3>
          {withdrawals.slice(0,3).map(w=>(
            <div key={w.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#080910",borderRadius:10,padding:"12px 16px",marginBottom:8,flexWrap:"wrap",gap:8}}>
              <div><span style={{fontWeight:700,color:"#fbbf24"}}>{usd(w.amount)}</span><span style={{color:"#4b5563",fontSize:12,marginLeft:8}}>{w.network}</span></div>
              <StatusBadge status={w.status}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InvestTab({ uid, onRefresh }) {
  const [selectedPlan,setSelectedPlan]=useState(null);
  const [amount,setAmount]=useState("");
  const [txid,setTxid]=useState("");
  const [addrCopied,copyAddr]=useCopy();
  const [submitted,setSubmitted]=useState(false);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");

  const submit=async()=>{
    setErr("");
    if(!selectedPlan) return setErr("Please select an investment plan.");
    if(!amount||isNaN(amount)||+amount<MIN_INVEST) return setErr(`Minimum investment is ${usd(MIN_INVEST)}.`);
    const p=getPlan(+amount);
    if(!p||p.id!==selectedPlan.id) return setErr(`Amount is outside the ${selectedPlan.name} range.`);
    if(!txid.trim()) return setErr("Please enter your BSC Transaction ID.");
    setLoading(true);
    const{error}=await sbPost("investments",{user_id:uid,amount:+amount,txid:txid.trim(),plan:p.id,started_at:new Date().toISOString(),status:"pending_verification"},getToken());
    setLoading(false);
    if(error) return setErr(JSON.stringify(error));
    await onRefresh();
    setSubmitted(true);
  };

  if(submitted) return (
    <div style={{...S.card,maxWidth:520,margin:"0 auto",padding:48,textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:16}}>⏳</div>
      <h2 style={{fontWeight:800,fontSize:22,marginBottom:10,color:"#f59e0b"}}>Awaiting Verification</h2>
      <p style={{color:"#9ca3af",lineHeight:1.8,marginBottom:16}}>Your investment of <strong style={{color:"#fbbf24"}}>{usd(+amount)}</strong> has been submitted. Admin will verify before your balance activates.</p>
      <button onClick={()=>setSubmitted(false)} style={{background:"#111218",color:"#e8eaf0",border:"1px solid #1e2030",padding:"10px 24px",borderRadius:10,fontWeight:600,cursor:"pointer"}}>Submit Another</button>
    </div>
  );

  return (
    <div style={{maxWidth:640,margin:"0 auto"}}>
      <div style={{marginBottom:24}}>
        <h3 style={{fontWeight:700,marginBottom:14,display:"flex",alignItems:"center",gap:8}}><span style={{width:24,height:24,background:"linear-gradient(135deg,#fbbf24,#f97316)",borderRadius:6,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:"#07080f"}}>1</span> Select Investment Plan</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(138px,1fr))",gap:10}}>
          {PLANS.map(p=>(
            <div key={p.id} onClick={()=>{setSelectedPlan(p);setAmount("");}} style={{border:`2px solid ${selectedPlan?.id===p.id?p.color:"#1e2030"}`,borderRadius:12,padding:16,cursor:"pointer",background:selectedPlan?.id===p.id?p.color+"12":"#0f1117",transition:"all .2s"}}>
              <div style={{fontSize:22,marginBottom:6}}>{p.badge}</div>
              <div style={{fontWeight:700,color:selectedPlan?.id===p.id?p.color:"#e8eaf0",marginBottom:2}}>{p.name}</div>
              <div style={{color:"#6b7280",fontSize:11,marginBottom:6}}>{p.max===Infinity?`$${p.min.toLocaleString()}+`:`$${p.min.toLocaleString()}–$${p.max.toLocaleString()}`}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{marginBottom:24}}>
        <h3 style={{fontWeight:700,marginBottom:14,display:"flex",alignItems:"center",gap:8}}><span style={{width:24,height:24,background:"linear-gradient(135deg,#fbbf24,#f97316)",borderRadius:6,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:"#07080f"}}>2</span> Send Deposit to Wallet</h3>
        <div style={{...S.card,padding:24,border:"1px solid #fbbf2422"}}>
          <div style={{color:"#fbbf24",fontWeight:700,marginBottom:10,fontSize:13}}>🟡 BSC (BEP20) Network Only</div>
          <div style={{background:"#080910",borderRadius:8,padding:12,fontFamily:"monospace",fontSize:11,color:"#e8eaf0",wordBreak:"break-all",lineHeight:1.9,marginBottom:12,border:"1px solid #1e2030"}}>{BITCOIN_ADDRESS}</div>
          <CopyBtn text={BITCOIN_ADDRESS} label="Copy Wallet Address"/>
        </div>
      </div>
      <div>
        <h3 style={{fontWeight:700,marginBottom:14,display:"flex",alignItems:"center",gap:8}}><span style={{width:24,height:24,background:"linear-gradient(135deg,#fbbf24,#f97316)",borderRadius:6,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:"#07080f"}}>3</span> Confirm Your Deposit</h3>
        <div style={{...S.card,padding:24,display:"flex",flexDirection:"column",gap:16}}>
          <ErrBox msg={err}/>
          <Field label="Investment Amount (USD)" value={amount} onChange={e=>setAmount(e.target.value)} type="number" placeholder={selectedPlan?`Min $${selectedPlan.min.toLocaleString()}`:`Min $${MIN_INVEST}`}/>
          <Field label="BSC Transaction ID (TxID)" value={txid} onChange={e=>setTxid(e.target.value)} placeholder="Paste your transaction hash after sending"/>
          <LoadingBtn onClick={submit} loading={loading}>Submit for Verification</LoadingBtn>
        </div>
      </div>
    </div>
  );
}

function WithdrawTab({ uid, totalBalance, withdrawals, activeInv, onRefresh }) {
  const [wForm,setWForm]=useState({amount:"",wallet:"",network:"BSC (BEP20)"});
  const [wErr,setWErr]=useState("");
  const [wDone,setWDone]=useState(false);
  const [wLoading,setWLoading]=useState(false);
  const fw=k=>e=>setWForm(p=>({...p,[k]:e.target.value}));
  const pendingTotal=withdrawals.filter(w=>w.status==="pending").reduce((s,w)=>s+w.amount,0);
  const available=Math.max(0,+(totalBalance-pendingTotal).toFixed(2));
  const withdrawUnlocked=activeInv.some(i=>canWithdraw(i));
  const earliest=activeInv.find(i=>i.verified_at);
  const daysLeft=earliest?daysUntilWithdraw(earliest):WITHDRAW_LOCK_DAYS;

  const submit=async()=>{
    setWErr("");
    if(!withdrawUnlocked) return setWErr(`Withdrawal locked for ${daysLeft} more day${daysLeft!==1?"s":""}.`);
    if(!wForm.amount||isNaN(wForm.amount)||+wForm.amount<=0) return setWErr("Enter a valid amount.");
    if(+wForm.amount<MIN_WITHDRAW) return setWErr(`Minimum withdrawal is ${usd(MIN_WITHDRAW)}.`);
    if(+wForm.amount>available) return setWErr(`Insufficient balance. Available: ${usd(available)}`);
    if(!wForm.wallet.trim()) return setWErr("Enter your destination wallet address.");
    setWLoading(true);
    const{error}=await sbPost("withdrawals",{user_id:uid,amount:+wForm.amount,wallet:wForm.wallet.trim(),network:wForm.network,status:"pending",created_at:new Date().toISOString()},getToken());
    setWLoading(false);
    if(error) return setWErr(JSON.stringify(error));
    await onRefresh();
    setWDone(true);
  };

  if(wDone) return (
    <div style={{...S.card,maxWidth:520,margin:"0 auto",padding:48,textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:16}}>✅</div>
      <h2 style={{fontWeight:800,fontSize:22,color:"#10b981",marginBottom:10}}>Withdrawal Submitted</h2>
      <p style={{color:"#9ca3af",lineHeight:1.8,marginBottom:24}}>Your request of <strong style={{color:"#fbbf24"}}>{usd(+wForm.amount)}</strong> is under review.</p>
      <button onClick={()=>setWDone(false)} style={S.primaryBtn}>New Request</button>
    </div>
  );

  return (
    <div style={{maxWidth:580,margin:"0 auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        <div style={{...S.card,padding:20,borderTop:"3px solid #fbbf24"}}><div style={{color:"#4b5563",fontSize:11,marginBottom:6,textTransform:"uppercase"}}>Portfolio Value</div><div style={{fontWeight:800,fontSize:22,color:"#fbbf24"}}>{usd(totalBalance)}</div></div>
        <div style={{...S.card,padding:20,borderTop:"3px solid #10b981"}}><div style={{color:"#4b5563",fontSize:11,marginBottom:6,textTransform:"uppercase"}}>Available</div><div style={{fontWeight:800,fontSize:22,color:"#10b981"}}>{usd(available)}</div></div>
      </div>
      {!withdrawUnlocked&&(
        <div style={{...S.card,padding:24,marginBottom:16,textAlign:"center",border:"1px solid #f59e0b44"}}>
          <div style={{fontSize:36,marginBottom:12}}>🔒</div>
          <h3 style={{fontWeight:700,color:"#f59e0b",marginBottom:8}}>Withdrawal Locked</h3>
          <p style={{color:"#9ca3af",fontSize:14,lineHeight:1.7}}>Withdrawals available after 3-month maturity. {earliest?<>Unlocks in <strong style={{color:"#fbbf24"}}>{daysLeft} day{daysLeft!==1?"s":""}</strong>.</>:"Invest and get verified to start the countdown."}</p>
        </div>
      )}
      <div style={{...S.card,padding:28,display:"flex",flexDirection:"column",gap:18,opacity:withdrawUnlocked?1:0.5}}>
        <div><h2 style={{fontWeight:800,fontSize:20,marginBottom:4}}>💸 Request Withdrawal</h2><p style={{color:"#6b7280",fontSize:13}}>Minimum: <strong style={{color:"#e8eaf0"}}>{usd(MIN_WITHDRAW)}</strong></p></div>
        <ErrBox msg={wErr}/>
        <Field label="Withdrawal Amount (USD)" value={wForm.amount} onChange={fw("amount")} type="number" placeholder={`Min. ${usd(MIN_WITHDRAW)}`}/>
        <Select label="Network" value={wForm.network} onChange={fw("network")}><option>BSC (BEP20)</option><option>Ethereum (ERC20)</option><option>TRON (TRC20)</option><option>Bitcoin (BTC)</option></Select>
        <Field label="Destination Wallet Address" value={wForm.wallet} onChange={fw("wallet")} placeholder="Paste your wallet address"/>
        <LoadingBtn onClick={submit} loading={wLoading} disabled={!withdrawUnlocked}>Submit Withdrawal Request</LoadingBtn>
      </div>
    </div>
  );
}

function HistoryTab({ investments, withdrawals }) {
  return (
    <div>
      <div style={{...S.card,padding:24,marginBottom:16}}>
        <h3 style={{fontWeight:700,marginBottom:16}}>📥 Investment History</h3>
        {investments.length>0?(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:"1px solid #1e2030"}}>{["Date","Plan","Deposited","TxID","Status"].map(h=><th key={h} style={{padding:"10px 12px",color:"#4b5563",fontWeight:600,textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
              <tbody>{investments.map((inv,i)=>{const p=getPlan(inv.amount);return(
                <tr key={i} style={{borderBottom:"1px solid #1e203033"}}>
                  <td style={{padding:12,whiteSpace:"nowrap"}}>{new Date(inv.started_at).toLocaleDateString()}</td>
                  <td style={{padding:12}}><span style={{color:p?.color,fontWeight:600}}>{p?.badge} {p?.name}</span></td>
                  <td style={{padding:12,color:"#fbbf24",fontWeight:700}}>{usd(inv.amount)}</td>
                  <td style={{padding:12,fontFamily:"monospace",fontSize:10,color:"#4b5563"}}>{(inv.txid||"").slice(0,16)}...</td>
                  <td style={{padding:12}}><StatusBadge status={inv.verified_at?"verified":"pending_verification"}/></td>
                </tr>
              );})}
              </tbody>
            </table>
          </div>
        ):<p style={{color:"#4b5563",textAlign:"center",padding:32}}>No investment history yet.</p>}
      </div>
      <div style={{...S.card,padding:24}}>
        <h3 style={{fontWeight:700,marginBottom:16}}>💸 Withdrawal History</h3>
        {withdrawals.length>0?(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:"1px solid #1e2030"}}>{["Date","Amount","Network","Status"].map(h=><th key={h} style={{padding:"10px 12px",color:"#4b5563",fontWeight:600,textAlign:"left"}}>{h}</th>)}</tr></thead>
              <tbody>{withdrawals.map(w=>(
                <tr key={w.id} style={{borderBottom:"1px solid #1e203033"}}>
                  <td style={{padding:12,whiteSpace:"nowrap"}}>{new Date(w.created_at).toLocaleDateString()}</td>
                  <td style={{padding:12,color:"#fbbf24",fontWeight:700}}>{usd(w.amount)}</td>
                  <td style={{padding:12,color:"#6b7280",fontSize:12}}>{w.network}</td>
                  <td style={{padding:12}}><StatusBadge status={w.status}/></td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        ):<p style={{color:"#4b5563",textAlign:"center",padding:32}}>No withdrawal requests yet.</p>}
      </div>
    </div>
  );
}

function ReferralsTab({ profile, referrals }) {
  const [refCopied,copyRef]=useCopy();
  return (
    <div style={{maxWidth:600,margin:"0 auto"}}>
      <div style={{...S.card,padding:28,marginBottom:16,textAlign:"center",borderTop:"3px solid #fbbf24"}}>
        <div style={{fontSize:36,marginBottom:12}}>👥</div>
        <h3 style={{fontWeight:800,fontSize:20,marginBottom:8}}>Your Referral Code</h3>
        <div style={{background:"#080910",border:"2px solid #fbbf2444",borderRadius:12,padding:"20px",fontSize:28,fontWeight:800,color:"#fbbf24",letterSpacing:4,marginBottom:16}}>{profile?.referral_code||"—"}</div>
        <button onClick={()=>copyRef(profile?.referral_code||"")} style={{background:refCopied?"#10b98118":"#fbbf2418",color:refCopied?"#10b981":"#fbbf24",border:`1px solid ${refCopied?"#10b98155":"#fbbf2455"}`,borderRadius:10,padding:"10px 24px",fontWeight:700,fontSize:14,marginBottom:16,display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer"}}>
          {refCopied?"✓ Copied!":"Copy Code"}
        </button>
        <p style={{color:"#6b7280",fontSize:13,lineHeight:1.7}}>Share your code — when friends sign up and invest, <strong style={{color:"#fbbf24"}}>you earn a $10 bonus</strong>.</p>
      </div>
      <div style={{...S.card,padding:24}}>
        <h4 style={{fontWeight:700,marginBottom:16}}>Referred Users ({referrals.length})</h4>
        {referrals.length>0?referrals.map(r=>(
          <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#080910",borderRadius:10,padding:"12px 16px",marginBottom:8,flexWrap:"wrap",gap:8}}>
            <div style={{fontWeight:600}}>{r.name}</div>
            <span style={{background:"#10b98118",color:"#10b981",borderRadius:100,padding:"4px 12px",fontSize:12,fontWeight:700}}>+$10 earned</span>
          </div>
        )):<p style={{color:"#4b5563",textAlign:"center",padding:24}}>No referrals yet. Share your code to earn!</p>}
      </div>
    </div>
  );
}

function ChatWidget({ uid, profile, chats, onSend }) {
  const [input,setInput]=useState("");
  const bottomRef=useRef(null);
  useEffect(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),[chats]);
  const send=()=>{if(!input.trim())return;onSend(input.trim());setInput("");};
  return (
    <div style={{width:320,height:420,display:"flex",flexDirection:"column",background:"#0f1117",border:"1px solid #1e2030",borderRadius:16,marginBottom:10,boxShadow:"0 20px 60px rgba(0,0,0,.6)",overflow:"hidden"}}>
      <div style={{padding:"13px 16px",background:"linear-gradient(135deg,#fbbf24,#f97316)",color:"#07080f",fontWeight:700,fontSize:14,display:"flex",justifyContent:"space-between"}}>
        <span>💬 BitGrow Support</span><span style={{fontSize:11,opacity:.75}}>● Online</span>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:8}}>
        <div style={{background:"#1a1d2e",borderRadius:12,padding:"10px 14px",fontSize:13,alignSelf:"flex-start",maxWidth:"82%"}}>👋 Hi {profile?.first_name||"there"}! How can we assist you?</div>
        {chats.map(c=><div key={c.id} style={{background:c.from_role==="user"?"linear-gradient(135deg,#fbbf24,#f97316)":"#1a1d2e",color:c.from_role==="user"?"#07080f":"#e8eaf0",borderRadius:12,padding:"10px 14px",fontSize:13,alignSelf:c.from_role==="user"?"flex-end":"flex-start",maxWidth:"82%"}}>{c.text}</div>)}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:10,borderTop:"1px solid #1e2030",display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type a message..." style={{flex:1,background:"#080910",border:"1px solid #1e2030",borderRadius:8,padding:"8px 12px",color:"#e8eaf0",fontSize:13,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={send} style={{background:"linear-gradient(135deg,#fbbf24,#f97316)",border:"none",borderRadius:8,padding:"8px 14px",color:"#07080f",fontWeight:700,cursor:"pointer"}}>→</button>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────
function AdminPanel() {
  const [tab,setTab]=useState("verify");
  const [allUsers,setAllUsers]=useState([]);
  const [allInvestments,setAllInvestments]=useState([]);
  const [allWithdrawals,setAllWithdrawals]=useState([]);
  const [allChats,setAllChats]=useState([]);
  const [selected,setSelected]=useState(null);
  const [bonusAmt,setBonusAmt]=useState("");
  const [replyText,setReplyText]=useState("");
  const [search,setSearch]=useState("");
  const [loading,setLoading]=useState(true);

  const fetchAll=async()=>{
    setLoading(true);
    const tok=getToken();
    const[uRes,iRes,wRes,cRes]=await Promise.all([
      sbGet("profiles","order=created_at.desc",tok),
      sbGet("investments","order=started_at.desc",tok),
      sbGet("withdrawals","order=created_at.desc",tok),
      sbGet("chats","order=created_at.desc",tok),
    ]);
    setAllUsers(uRes.data||[]);
    setAllInvestments(iRes.data||[]);
    setAllWithdrawals(wRes.data||[]);
    setAllChats(cRes.data||[]);
    setLoading(false);
  };
  useEffect(()=>{fetchAll();},[]);

  const pendingInv=allInvestments.filter(i=>i.status==="pending_verification").map(i=>({...i,user:allUsers.find(u=>u.id===i.user_id)}));
  const pendingW=allWithdrawals.filter(w=>w.status==="pending");
  const filtered=allUsers.filter(u=>(u.name||"").toLowerCase().includes(search.toLowerCase())||(u.id||"").includes(search));

  const verifyInv=async(invId)=>{ await sbPatch("investments",`id=eq.${invId}`,{status:"verified",verified_at:new Date().toISOString()},getToken()); fetchAll(); };
  const rejectInv=async(invId)=>{ await sbPatch("investments",`id=eq.${invId}`,{status:"rejected"},getToken()); fetchAll(); };
  const updateW=async(wId,status)=>{ await sbPatch("withdrawals",`id=eq.${wId}`,{status,processed_at:new Date().toISOString()},getToken()); fetchAll(); };
  const applyBonus=async(uid,amt)=>{
    const user=allUsers.find(u=>u.id===uid);
    const newBonus=(user?.manual_bonus||0)+ +amt;
    await sbPatch("profiles",`id=eq.${uid}`,{manual_bonus:newBonus},getToken());
    setBonusAmt(""); fetchAll();
  };
  const replyMsg=async(uid)=>{
    if(!replyText.trim())return;
    await sbPost("chats",{user_id:uid,text:replyText.trim(),from_role:"admin",read:false},getToken());
    setReplyText(""); fetchAll();
  };

  const adminTabs=[{id:"verify",label:"Verify",badge:pendingInv.length},{id:"withdrawals",label:"Withdrawals",badge:pendingW.length},{id:"users",label:"Users",badge:0},{id:"chats",label:"Chats",badge:0},{id:"stats",label:"Stats",badge:0}];

  if(loading) return <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center"}}><Spinner/></div>;

  return (
    <div style={{maxWidth:1120,margin:"0 auto",padding:"28px 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28,flexWrap:"wrap",gap:12}}>
        <div><h1 style={{fontWeight:800,fontSize:22}}>⚙️ Admin Control Panel</h1><p style={{color:"#6b7280",fontSize:13}}>BitGrow · Internal Management</p></div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {adminTabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{position:"relative",...S.btn(tab===t.id)}}>
              {t.label}
              {t.badge>0&&<span style={{position:"absolute",top:-7,right:-7,background:"#ef4444",color:"#fff",borderRadius:"50%",width:18,height:18,fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {tab==="verify"&&(
        <div>
          {pendingInv.length===0?<div style={{...S.card,padding:48,textAlign:"center",color:"#4b5563"}}><div style={{fontSize:40,marginBottom:12}}>✅</div>No pending verifications.</div>:(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {pendingInv.map(inv=>{const p=getPlan(inv.amount);return(
                <div key={inv.id} style={{...S.card,padding:20,borderLeft:"4px solid #f59e0b"}}>
                  <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                        <div style={{width:36,height:36,background:"linear-gradient(135deg,#fbbf24,#f97316)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:"#07080f"}}>{(inv.user?.name||"U")[0]}</div>
                        <div><div style={{fontWeight:700}}>{inv.user?.name||"Unknown"}</div><div style={{color:"#6b7280",fontSize:12}}>{inv.user?.id}</div></div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:10}}>
                        {[["Amount",usd(inv.amount),"#fbbf24"],["Plan",`${p?.badge} ${p?.name}`,p?.color||"#9ca3af"],["Date",new Date(inv.started_at).toLocaleDateString(),"#6b7280"]].map(([l,v,c])=>(
                          <div key={l} style={{background:"#080910",borderRadius:8,padding:"8px 12px"}}><div style={{color:"#4b5563",fontSize:10,marginBottom:2}}>{l.toUpperCase()}</div><div style={{color:c,fontWeight:600,fontSize:13}}>{v}</div></div>
                        ))}
                      </div>
                      <div style={{background:"#080910",borderRadius:8,padding:"10px 12px"}}>
                        <div style={{color:"#4b5563",fontSize:10,marginBottom:2}}>TRANSACTION ID</div>
                        <div style={{fontFamily:"monospace",fontSize:11,color:"#fbbf24",wordBreak:"break-all"}}>{inv.txid}</div>
                        <a href={`https://bscscan.com/tx/${inv.txid}`} target="_blank" rel="noreferrer" style={{color:"#6366f1",fontSize:11,marginTop:4,display:"inline-block"}}>🔍 View on BSCScan →</a>
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8,minWidth:130}}>
                      <StatusBadge status="pending_verification"/>
                      <button onClick={()=>verifyInv(inv.id)} style={{background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",border:"none",borderRadius:8,padding:"10px 14px",fontWeight:700,fontSize:13,cursor:"pointer"}}>✅ Verify & Activate</button>
                      <button onClick={()=>rejectInv(inv.id)} style={{background:"#ef444418",color:"#ef4444",border:"1px solid #ef444455",borderRadius:8,padding:"10px 14px",fontWeight:700,fontSize:13,cursor:"pointer"}}>✕ Reject</button>
                    </div>
                  </div>
                </div>
              );})}
            </div>
          )}
        </div>
      )}

      {tab==="withdrawals"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:20}}>
            {[{l:"Pending",v:pendingW.length,c:"#f59e0b"},{l:"Paid",v:allWithdrawals.filter(w=>w.status==="paid").length,c:"#10b981"},{l:"Total Volume",v:usd(allWithdrawals.reduce((s,w)=>s+w.amount,0)),c:"#6366f1"}].map(s=>(
              <div key={s.l} style={{...S.card,padding:18,borderTop:`3px solid ${s.c}`}}><div style={{color:"#4b5563",fontSize:11,textTransform:"uppercase",marginBottom:4}}>{s.l}</div><div style={{fontWeight:800,fontSize:22,color:s.c}}>{s.v}</div></div>
            ))}
          </div>
          {allWithdrawals.length===0?<div style={{...S.card,padding:48,textAlign:"center",color:"#4b5563"}}>No withdrawal requests yet.</div>:(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {allWithdrawals.map(w=>{
                const wu=allUsers.find(u=>u.id===w.user_id);
                const sc={pending:"#f59e0b",approved:"#6366f1",paid:"#10b981",rejected:"#ef4444"}[w.status]||"#f59e0b";
                return(
                  <div key={w.id} style={{...S.card,padding:20,borderLeft:`4px solid ${sc}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,marginBottom:6}}>{wu?.name||"Unknown"} <span style={{color:"#4b5563",fontSize:12,fontWeight:400}}>· {usd(w.amount)} · {w.network}</span></div>
                        <div style={{fontFamily:"monospace",fontSize:11,color:"#9ca3af",wordBreak:"break-all",marginBottom:4}}>{w.wallet}</div>
                        <div style={{color:"#4b5563",fontSize:12}}>{new Date(w.created_at).toLocaleString()}</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:8,minWidth:130}}>
                        <StatusBadge status={w.status}/>
                        {(w.status==="pending"||w.status==="approved")&&<button onClick={()=>updateW(w.id,"paid")} style={{background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",border:"none",borderRadius:8,padding:"8px 12px",fontWeight:700,fontSize:13,cursor:"pointer"}}>💸 Mark Paid</button>}
                        {w.status==="pending"&&<button onClick={()=>updateW(w.id,"rejected")} style={{background:"#ef444418",color:"#ef4444",border:"1px solid #ef444455",borderRadius:8,padding:"8px 12px",fontWeight:700,fontSize:13,cursor:"pointer"}}>✕ Reject</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab==="users"&&(
        <div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search by name or user ID..." style={{...S.input,marginBottom:16}}/>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {filtered.map(u=>{
              const uInv=allInvestments.filter(i=>i.user_id===u.id&&i.verified_at);
              const invBal=uInv.reduce((s,i)=>s+calcBalance(i),0);
              const bal=+(invBal+(u.manual_bonus||0)).toFixed(2);
              const open=selected===u.id;
              return(
                <div key={u.id} style={S.card}>
                  <div onClick={()=>setSelected(open?null:u.id)} style={{padding:"16px 20px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:40,height:40,background:"linear-gradient(135deg,#fbbf24,#f97316)",borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:17,color:"#07080f"}}>{(u.name||"U")[0]}</div>
                      <div><div style={{fontWeight:700}}>{u.name||"—"}</div><div style={{color:"#6b7280",fontSize:12}}>Ref: {u.referral_code} · {u.country||"N/A"}</div></div>
                    </div>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{color:"#fbbf24",fontWeight:700}}>{usd(bal)}</span><span style={{color:"#4b5563"}}>{open?"▲":"▼"}</span></div>
                  </div>
                  {open&&(
                    <div style={{borderTop:"1px solid #1e2030",padding:20,background:"#080910",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20}}>
                      <div>
                        <h4 style={{fontWeight:700,marginBottom:12,color:"#fbbf24",fontSize:14}}>Investments ({allInvestments.filter(i=>i.user_id===u.id).length})</h4>
                        {allInvestments.filter(i=>i.user_id===u.id).length>0?allInvestments.filter(i=>i.user_id===u.id).map((inv,i)=>{const p=getPlan(inv.amount);return(
                          <div key={i} style={{background:"#0f1117",borderRadius:8,padding:"10px 12px",marginBottom:8}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:p?.color,fontWeight:600,fontSize:13}}>{p?.badge} {p?.name} · {usd(inv.amount)}</span><StatusBadge status={inv.verified_at?"verified":"pending_verification"}/></div>
                            <div style={{color:"#4b5563",fontSize:11}}>Current: {usd(calcBalance(inv))}</div>
                          </div>
                        );}):(<p style={{color:"#4b5563",fontSize:13}}>No investments.</p>)}
                      </div>
                      <div>
                        <h4 style={{fontWeight:700,marginBottom:12,color:"#10b981",fontSize:14}}>🔧 Balance Adjustment</h4>
                        <input value={bonusAmt} onChange={e=>setBonusAmt(e.target.value)} type="number" placeholder="e.g. 500 or -200" style={{...S.input,marginBottom:8}}/>
                        <p style={{color:"#4b5563",fontSize:11,marginBottom:10}}>Positive = add, negative = deduct. Hidden from user.</p>
                        <button onClick={()=>bonusAmt&&applyBonus(u.id,bonusAmt)} style={{width:"100%",background:"linear-gradient(135deg,#10b981,#059669)",border:"none",borderRadius:8,padding:"10px",color:"#fff",fontWeight:700,fontSize:14,marginBottom:16,cursor:"pointer"}}>Apply Adjustment</button>
                        <h4 style={{fontWeight:700,marginBottom:12,color:"#6366f1",fontSize:14}}>💬 Message User</h4>
                        <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Message to send..." style={{...S.input,resize:"vertical",minHeight:80,marginBottom:10}}/>
                        <button onClick={()=>replyMsg(u.id)} style={{width:"100%",background:"linear-gradient(135deg,#6366f1,#4f46e5)",border:"none",borderRadius:8,padding:"10px",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>Send Message</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length===0&&<div style={{...S.card,padding:40,textAlign:"center",color:"#4b5563"}}>No users found.</div>}
          </div>
        </div>
      )}

      {tab==="chats"&&(
        <div>
          <h3 style={{fontWeight:700,marginBottom:16}}>All Support Conversations</h3>
          {allChats.length===0?<div style={{...S.card,padding:40,textAlign:"center",color:"#4b5563"}}>No messages yet.</div>:(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {allChats.map(m=>{const u=allUsers.find(u=>u.id===m.user_id);return(
                <div key={m.id} style={{...S.card,padding:"13px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,borderLeft:`3px solid ${m.from_role==="admin"?"#6366f1":"#fbbf24"}`}}>
                  <div><span style={{fontWeight:700,color:m.from_role==="admin"?"#6366f1":"#fbbf24"}}>{m.from_role==="admin"?"⚙ Admin":`👤 ${u?.name||"User"}`}</span><span style={{color:"#9ca3af",marginLeft:8,fontSize:13}}>{m.text?.slice(0,80)}{m.text?.length>80?"…":""}</span></div>
                  <span style={{color:"#374151",fontSize:12}}>{new Date(m.created_at).toLocaleTimeString()}</span>
                </div>
              );})}
            </div>
          )}
        </div>
      )}

      {tab==="stats"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
          {[
            {l:"Total Users",v:allUsers.length,c:"#6366f1",i:"👥"},
            {l:"Active Investors",v:allUsers.filter(u=>allInvestments.some(i=>i.user_id===u.id&&i.verified_at)).length,c:"#fbbf24",i:"📈"},
            {l:"Pending Verify",v:pendingInv.length,c:"#f59e0b",i:"⏳"},
            {l:"Total Invested",v:usd(allInvestments.filter(i=>i.verified_at).reduce((s,i)=>s+i.amount,0)),c:"#10b981",i:"💰"},
            {l:"Pending Withdrawals",v:pendingW.length,c:"#f59e0b",i:"💸"},
            {l:"Support Messages",v:allChats.length,c:"#6366f1",i:"💬"},
          ].map(s=>(
            <div key={s.l} style={{...S.card,padding:22,borderTop:`3px solid ${s.c}`}}>
              <div style={{fontSize:24,marginBottom:8}}>{s.i}</div>
              <div style={{color:"#4b5563",fontSize:11,fontWeight:600,marginBottom:6,textTransform:"uppercase"}}>{s.l}</div>
              <div style={{fontWeight:800,fontSize:24,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────
function HomePage({ navigate, session }) {
  return (
    <div>
      <section style={{position:"relative",overflow:"hidden",padding:"96px 24px 80px",textAlign:"center"}}>
        <div style={{position:"absolute",top:-100,left:"50%",transform:"translateX(-50%)",width:700,height:500,background:"radial-gradient(ellipse,rgba(251,191,36,0.07) 0%,transparent 65%)",pointerEvents:"none"}}/>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"#111218",border:"1px solid #2a2d3e",borderRadius:100,padding:"5px 14px 5px 10px",fontSize:12,color:"#9ca3af",fontWeight:600,marginBottom:28}}>
          <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:"#10b981",animation:"pulse 2s infinite"}}/> <span style={{color:"#fbbf24"}}>LIVE</span>&nbsp;Crypto Asset Management Platform
        </div>
        <h1 style={{fontSize:"clamp(2.6rem,6vw,4.2rem)",fontWeight:800,lineHeight:1.08,marginBottom:22,letterSpacing:"-0.02em"}}>
          Your Capital.<br/>
          <span style={{background:"linear-gradient(95deg,#fbbf24 0%,#f97316 50%,#ef4444 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Intelligently Grown.</span>
        </h1>
        <p style={{color:"#6b7280",fontSize:17,maxWidth:560,margin:"0 auto 40px",lineHeight:1.85}}>BitGrow is a professional crypto asset management platform, leveraging institutional-grade strategies to deliver consistent, transparent returns.</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:56}}>
          {!session?<>
            <button onClick={()=>navigate("register")} style={{background:"linear-gradient(135deg,#fbbf24,#f97316)",color:"#07080f",border:"none",padding:"14px 36px",borderRadius:12,fontSize:16,fontWeight:700,boxShadow:"0 8px 32px rgba(251,191,36,.28)",cursor:"pointer"}}>Open Account →</button>
            <button onClick={()=>navigate("login")} style={{background:"#111218",color:"#e8eaf0",border:"1px solid #2a2d3e",padding:"14px 36px",borderRadius:12,fontSize:16,fontWeight:600,cursor:"pointer"}}>Sign In</button>
          </>:<button onClick={()=>navigate("dashboard")} style={{background:"linear-gradient(135deg,#fbbf24,#f97316)",color:"#07080f",border:"none",padding:"14px 36px",borderRadius:12,fontSize:16,fontWeight:700,cursor:"pointer"}}>Go to Dashboard →</button>}
        </div>
      </section>
      <section style={{padding:"0 24px 72px"}}>
        <div style={{maxWidth:860,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:36}}><h2 style={{fontSize:26,fontWeight:800,marginBottom:8}}>Platform at a Glance</h2></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14}}>
            {[{prefix:"$",target:2400000,suffix:"+",label:"Capital Managed",color:"#fbbf24",icon:"💰"},{prefix:"",target:12400,suffix:"+",label:"Active Investors",color:"#10b981",icon:"👥"},{prefix:"",target:82,suffix:"+",label:"Countries Reached",color:"#6366f1",icon:"🌍"},{prefix:"",target:98,suffix:"%",label:"Satisfaction Rate",color:"#f43f5e",icon:"⭐"}].map(s=>(
              <div key={s.label} style={{...S.card,padding:"24px 20px",textAlign:"center",borderTop:`3px solid ${s.color}`}}>
                <div style={{fontSize:28,marginBottom:10}}>{s.icon}</div>
                <div style={{fontWeight:800,fontSize:26,color:s.color,marginBottom:4}}><AnimatedCounter target={s.target} prefix={s.prefix} suffix={s.suffix}/></div>
                <div style={{color:"#6b7280",fontSize:12}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Testimonials/>
      <section style={{padding:"0 24px 80px",maxWidth:1060,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:48}}><h2 style={{fontSize:32,fontWeight:800,marginBottom:10}}>Investment Plans</h2></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:16}}>
          {PLANS.map(plan=>(
            <div key={plan.id} style={{...S.card,padding:28,borderTop:`3px solid ${plan.color}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
                <div><div style={{fontSize:26,marginBottom:6}}>{plan.badge}</div><div style={{fontWeight:800,fontSize:19,color:plan.color}}>{plan.name}</div></div>
              </div>
              <div style={{fontSize:13,color:"#9ca3af",marginBottom:16,lineHeight:1.5}}>{plan.desc}</div>
              <div style={{background:"#0a0b12",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
                <div style={{color:"#6b7280",fontSize:11,marginBottom:3}}>INVESTMENT RANGE</div>
                <div style={{fontWeight:700,fontSize:14}}>{plan.max===Infinity?`$${plan.min.toLocaleString()} and above`:`$${plan.min.toLocaleString()} — $${plan.max.toLocaleString()}`}</div>
              </div>
              {["Automated returns","Real-time tracking","Secure custody","Priority support"].map(f=>(
                <div key={f} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#9ca3af",marginBottom:5}}><span style={{color:plan.color}}>✓</span>{f}</div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────
function Footer({ navigate }) {
  return (
    <footer style={{background:"#07080f",borderTop:"1px solid #111218",padding:"40px 24px 32px"}}>
      <div style={{maxWidth:960,margin:"0 auto"}}>
        <div onClick={()=>navigate("home")} style={{cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,marginBottom:12}}>
          <div style={{width:30,height:30,background:"linear-gradient(135deg,#fbbf24,#f97316)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:"#07080f"}}>B</div>
          <span style={{fontWeight:800,fontSize:18,background:"linear-gradient(90deg,#fbbf24,#f97316)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>BitGrow</span>
        </div>
        <p style={{color:"#374151",fontSize:13,maxWidth:400,lineHeight:1.7,marginBottom:20}}>Professional crypto asset management. Institutional-grade strategies for every investor.</p>
        <div style={{borderTop:"1px solid #111218",paddingTop:20,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <p style={{color:"#1f2937",fontSize:12}}>© 2024 BitGrow. All rights reserved.</p>
          <p style={{color:"#1f2937",fontSize:12}}>Investment involves risk. Past performance is not indicative of future results.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────
export default function App() {
  const [session,setSession]   = useState(null);
  const [profile,setProfile]   = useState(null);
  const [page,setPage]         = useState(()=>localStorage.getItem("bg_page")||"home");
  const [pageHistory,setPageHistory] = useState([]);
  const [dashTab,setDashTab]   = useState(()=>localStorage.getItem("bg_tab")||"overview");
  const [notifCount,setNotifCount] = useState(0);
  const [authLoading,setAuthLoading] = useState(true);

  const fetchProfile=useCallback(async(uid,tok)=>{
    const{data}=await sbGet("profiles",`id=eq.${uid}`,tok);
    if(data?.[0]) setProfile(data[0]);
    const{data:unread}=await sbGet("chats",`user_id=eq.${uid}&from_role=eq.admin&read=eq.false`,tok);
    setNotifCount(unread?.length||0);
  },[]);

  // ── Check stored session + handle OAuth hash redirect ──
  useEffect(()=>{
    async function init() {
      // 1. Check if this is an OAuth callback (URL has #access_token=...)
      const oauthSession = parseOAuthHash();
      if (oauthSession) {
        // Clean the hash from the URL
        window.history.replaceState(null,"",window.location.pathname+window.location.search);
        // Fetch the real user object (has email, metadata, etc.)
        const user = await fetchOAuthUser(oauthSession.access_token);
        if (user) {
          oauthSession.user = user;
          _session = oauthSession;
          localStorage.setItem("bg_session", JSON.stringify(oauthSession));
          setSession(oauthSession);
          // Check if profile exists; if not, create one (first-time Google user)
          const { data: existing } = await sbGet("profiles", `id=eq.${user.id}`, oauthSession.access_token);
          if (!existing || existing.length === 0) {
            const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";
            const parts = fullName.trim().split(" ");
            const firstName = parts[0] || "User";
            const lastName  = parts.slice(1).join(" ") || "";
            const phrase    = gen12Phrase();
            const ref       = genReferralCode();
            await sbPost("profiles", {
              id: user.id,
              name: fullName || user.email,
              first_name: firstName,
              last_name:  lastName,
              username:   (user.email||"").split("@")[0],
              phone: "",
              currency: "",
              country: "",
              state: "",
              city: "",
              address: "",
              referral_code: ref,
              referred_by: null,
              phrase,
              manual_bonus: 0,
              auth_method: "google",
              created_at: new Date().toISOString(),
            }, oauthSession.access_token);
            await sbPost("chats", {
              user_id: user.id,
              text: `Welcome to BitGrow, ${firstName}! 🎉 Your account is active. Head to Invest, choose a plan, and send your deposit. — BitGrow Team`,
              from_role: "admin",
            }, oauthSession.access_token);
          }
          await fetchProfile(user.id, oauthSession.access_token);
          setPage("dashboard");
        }
        setAuthLoading(false);
        return;
      }

      // 2. No OAuth hash — check localStorage for existing session
      const stored = localStorage.getItem("bg_session");
      if (stored) {
        try {
          const s = JSON.parse(stored);
          // expires_at is Unix seconds — only logout if truly expired
          if (s.expires_at && s.expires_at < Date.now()/1000) {
            localStorage.removeItem("bg_session");
            setAuthLoading(false);
            return;
          }
          _session = s;
          setSession(s);
          const uid = s.user?.id || s.user_id;
          if (uid) await fetchProfile(uid, s.access_token);
        } catch { localStorage.removeItem("bg_session"); }
      }
      setAuthLoading(false);
    }
    init();
  },[fetchProfile]);

  const handleLogin=useCallback((s)=>{
    if (!s.expires_at && s.expires_in) {
      s.expires_at = Math.floor(Date.now()/1000) + Number(s.expires_in);
    }
    _session=s;
    setSession(s);
    localStorage.setItem("bg_session",JSON.stringify(s));
    const uid=s.user?.id||s.user_id;
    if(uid) fetchProfile(uid,s.access_token);
  },[fetchProfile]);

  const navigate=p=>{
    setPageHistory(h=>[...h,page]);
    setPage(p);
    localStorage.setItem("bg_page",p);
    window.scrollTo(0,0);
  };
  const goBack=()=>setPageHistory(h=>{
    const prev=h[h.length-1]||"home";
    setPage(prev);
    localStorage.setItem("bg_page",prev);
    return h.slice(0,-1);
  });
  const logout=()=>{
    _session=null;setSession(null);setProfile(null);
    setPage("home");setPageHistory([]);
    localStorage.removeItem("bg_session");
    localStorage.removeItem("bg_page");
    localStorage.removeItem("bg_tab");
  };
  const handleSetDashTab=t=>{setDashTab(t);localStorage.setItem("bg_tab",t);};
  const isAdmin=session?.user?.email?.toLowerCase()===ADMIN_EMAIL.toLowerCase();

  if(authLoading) return (
    <div style={{fontFamily:"system-ui,sans-serif",minHeight:"100vh",background:"#07080f",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:52,height:52,background:"linear-gradient(135deg,#fbbf24,#f97316)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:24,color:"#07080f",margin:"0 auto 20px"}}>B</div>
        <Spinner/>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",minHeight:"100vh",background:"#07080f",color:"#e8eaf0"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0f1017}::-webkit-scrollbar-thumb{background:#2a2d3e;border-radius:4px}
        input,textarea,select,button{font-family:inherit}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <Nav page={page} navigate={navigate} goBack={goBack} pageHistory={pageHistory} session={session} profile={profile} logout={logout} isAdmin={isAdmin} setDashTab={handleSetDashTab} notifCount={notifCount} setNotifCount={setNotifCount}/>
      {page==="home"      && <HomePage     navigate={navigate} session={session}/>}
      {page==="login"     && <LoginPage    navigate={navigate} onLogin={handleLogin}/>}
      {page==="register"  && <RegisterPage navigate={navigate} onLogin={handleLogin}/>}
      {page==="dashboard" && session       && <Dashboard session={session} profile={profile} dashTab={dashTab} setDashTab={handleSetDashTab}/>}
      {page==="admin"     && isAdmin        && <AdminPanel/>}
      {page==="admin"     && !isAdmin       && <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{...S.card,padding:40,textAlign:"center",maxWidth:360}}><div style={{fontSize:48,marginBottom:16}}>🔒</div><h2 style={{fontWeight:800,marginBottom:10}}>Restricted Access</h2><button onClick={()=>navigate("login")} style={{...S.primaryBtn,marginTop:12}}>Sign In</button></div></div>}
      <Footer navigate={navigate}/>
    </div>
  );
}
