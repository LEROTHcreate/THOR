"use client";

import Link from "next/link";
import { useMemo, useEffect, useState } from "react";

/* ── LocalStorage ─────────────────────────────────────────────────────────── */
function safeLoad<T>(key: string, fb: T[] = []): T[] {
  if (typeof window === "undefined") return fb;
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; }
  catch { return fb; }
}

/* ── Date utils ──────────────────────────────────────────────────────────── */
function daysSince(iso: string)  { return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000); }
function isToday(d: string)      { return d === new Date().toISOString().split("T")[0]; }
function isThisMonth(d: string)  { const dt = new Date(d), n = new Date(); return dt.getFullYear()===n.getFullYear() && dt.getMonth()===n.getMonth(); }
function fmtDate(iso: string)    { return new Date(iso).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}); }

/* ── Sparkline ───────────────────────────────────────────────────────────── */
function mkSpark(data: number[], w=110, h=34) {
  const max=Math.max(...data), min=Math.min(...data), r=max-min||1;
  const pts=data.map((v,i)=>`${((i/(data.length-1))*w).toFixed(1)},${(h-((v-min)/r)*(h-6)-3).toFixed(1)}`);
  const line=`M ${pts.join(" L ")}`;
  return { line, fill:`${line} L ${w},${h} L 0,${h} Z` };
}

/* ── Interfaces ──────────────────────────────────────────────────────────── */
interface Rdv     { id:string; date?:string; heure?:string; patientNom?:string; patientPrenom?:string; type?:string; statut?:string; }
interface Dossier { id:string; patientNom?:string; patientPrenom?:string; status?:string; dateLivraison?:string; marque?:string; modele?:string; }
interface Patient { id:string; nom?:string; prenom?:string; createdAt?:string; }
interface Facture { id:string; montantTTC?:number; montant?:number; date?:string; createdAt?:string; }

/* ── Constants ───────────────────────────────────────────────────────────── */
const RENEWAL=1460, SOON=1277, INACTIVE=182;
const RDV_COL: Record<string,string> = { bilan:"#00C98A", controle:"#10b981", adaptation:"#8B5CF6", livraison:"#f59e0b", suivi:"#00C98A", urgence:"#ef4444", autre:"#64748b" };

/* ── Demo data ───────────────────────────────────────────────────────────── */
const DD: Dossier[] = [
  {id:"d1",patientNom:"Bernard", patientPrenom:"Alain",   status:"Livré",dateLivraison:"2021-01-15",marque:"Phonak", modele:"Audéo M90"},
  {id:"d2",patientNom:"Lecomte", patientPrenom:"Martine", status:"Livré",dateLivraison:"2021-07-03",marque:"Oticon", modele:"More 1"},
  {id:"d3",patientNom:"Dupuis",  patientPrenom:"René",    status:"Livré",dateLivraison:"2022-03-20",marque:"Starkey",modele:"Evolv AI"},
  {id:"d4",patientNom:"Moreau",  patientPrenom:"Lucie",   status:"Livré",dateLivraison:"2022-09-11",marque:"Phonak", modele:"Naída P90"},
];
const DP: Patient[] = [
  {id:"p1",nom:"Fontaine",prenom:"Claire", createdAt:"2023-01-10"},
  {id:"p2",nom:"Morel",   prenom:"Jacques",createdAt:"2022-11-05"},
  {id:"p3",nom:"Girard",  prenom:"Sylvie", createdAt:"2023-03-14"},
];

const ACTIONS = [
  {l:"Nouveau patient", h:"/clair-audition/pro/patients",  icon:"M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3Zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5Z"},
  {l:"Agenda",          h:"/clair-audition/pro/agenda",    icon:"M3 4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4Zm0 6h18M8 2v4M16 2v4"},
  {l:"Nouveau bilan",   h:"/clair-audition/pro/bilans",    icon:"M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"},
  {l:"Nouveau dossier", h:"/clair-audition/pro/dossiers",  icon:"M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"},
];

/* ══════════════════════════════════════════════════════════════════════════ */
export default function AudDashboard() {
  const [ok, setOk] = useState(false);
  useEffect(()=>setOk(true),[]);

  const rdvs    = useMemo(()=>ok?safeLoad<Rdv>("thor_pro_audition_rdv"):[], [ok]);
  const dossiers= useMemo(()=>{const d=ok?safeLoad<Dossier>("thor_pro_audition_dossiers"):[];return d.length?d:DD;},[ok]);
  const patients= useMemo(()=>{const p=ok?safeLoad<Patient>("thor_pro_audition_patients"):[];return p.length?p:DP;},[ok]);
  const factures= useMemo(()=>ok?safeLoad<Facture>("thor_pro_audition_factures"):[]  ,[ok]);

  const rdvToday = useMemo(()=>rdvs.filter(r=>r.date&&isToday(r.date)),[rdvs]);
  const caMonth  = useMemo(()=>factures.filter(f=>{const d=f.date??f.createdAt??"";return d&&isThisMonth(d);}).reduce((s,f)=>s+(f.montantTTC??f.montant??0),0),[factures]);
  const agenda   = useMemo(()=>rdvToday.slice().sort((a,b)=>(a.heure??"").localeCompare(b.heure??"")), [rdvToday]);

  const renewals = useMemo(()=>
    dossiers.filter(d=>d.status==="Livré"&&d.dateLivraison)
      .map(d=>{const days=daysSince(d.dateLivraison!); const s=days>=RENEWAL?"eligible":days>=SOON?"soon":null; return s?{...d,days,s,left:RENEWAL-days}:null;})
      .filter(Boolean).sort((a,b)=>b!.days-a!.days).slice(0,6) as Array<Dossier&{days:number;s:"eligible"|"soon";left:number}>,
  [dossiers]);

  const inactive = useMemo(()=>
    patients.map(p=>{
      const nm=`${p.nom??""} ${p.prenom??""}`.trim().toLowerCase();
      const last=rdvs.filter(r=>`${r.patientNom??""} ${r.patientPrenom??""}`.trim().toLowerCase()===nm&&r.date).sort((a,b)=>b.date!.localeCompare(a.date!))[0];
      const d=daysSince(last?.date??p.createdAt??"2099-01-01");
      return d>=INACTIVE?{...p,days:d}:null;
    }).filter(Boolean).sort((a,b)=>b!.days-a!.days).slice(0,5) as Array<Patient&{days:number}>,
  [patients,rdvs]);

  const greet  = useMemo(()=>{const h=new Date().getHours();return h<12?"Bonjour":h<18?"Bonne après-midi":"Bonsoir";},[]);
  const dateLbl= useMemo(()=>new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}),[]);

  const spR=mkSpark([4,6,5,7,6,8,5,7,6,6]);
  const spP=mkSpark([140,145,152,156,161,165,170,175,182,189]);
  const spC=mkSpark([28400,30200,31000,33500,34800,36100,36900,37500,38000,38400]);

  const caDisplay = caMonth>=1000 ? `${(caMonth/1000).toFixed(1).replace(".",",")} k€` : `${caMonth.toLocaleString("fr-FR")} €`;

  return (
    <div>

        {/* ── Header ── */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32,flexWrap:"wrap",gap:12}}>
          <div>
            <p style={{fontSize:12,fontWeight:600,color:"#64748b",letterSpacing:".09em",textTransform:"uppercase",marginBottom:6,margin:0}}>{dateLbl}</p>
            <h1 style={{fontSize:28,fontWeight:900,color:"#0f172a",letterSpacing:"-.035em",margin:"6px 0 0"}}>{greet}</h1>
          </div>
          <Link href="/clair-audition/pro/patients" style={{
            display:"flex",alignItems:"center",gap:8,padding:"11px 22px",
            background:"#00C98A",
            color:"#fff",borderRadius:14,fontSize:13,fontWeight:700,
            textDecoration:"none",boxShadow:"0 8px 24px rgba(0,201,138,.35),0 2px 8px rgba(0,201,138,.2)",letterSpacing:".01em"
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Nouveau patient
          </Link>
        </div>

        {/* ── KPI strip ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginBottom:32}}>

          {/* Card 1 – RDV */}
          <div style={{borderRadius:24,padding:"26px 28px 22px",background:"linear-gradient(135deg,rgba(0,201,138,0.08) 0%,rgba(255,255,255,0.60) 100%)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",boxShadow:"0 8px 32px rgba(0,201,138,.10),0 2px 8px rgba(0,0,0,.04)",border:"1px solid var(--glass-border)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-28,right:-28,width:110,height:110,borderRadius:"50%",background:"rgba(255,255,255,.45)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",bottom:-12,right:18,width:64,height:64,borderRadius:"50%",background:"rgba(255,255,255,.30)",pointerEvents:"none"}}/>
            <p style={{fontSize:10,fontWeight:800,color:"#00C98A",letterSpacing:".1em",textTransform:"uppercase",margin:"0 0 16px",opacity:.8}}>RDV aujourd'hui</p>
            <p style={{fontSize:52,fontWeight:900,color:"#0f172a",letterSpacing:"-.05em",lineHeight:1,margin:"0 0 16px"}}>{ok?rdvToday.length:0}</p>
            <svg width="100%" height="34" viewBox="0 0 110 34" preserveAspectRatio="none">
              <defs><linearGradient id="ga-rdv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00C98A" stopOpacity=".25"/><stop offset="100%" stopColor="#00C98A" stopOpacity="0"/></linearGradient></defs>
              <path d={spR.fill} fill="url(#ga-rdv)"/>
              <path d={spR.line} fill="none" stroke="#00C98A" strokeWidth="2" strokeLinecap="round" strokeOpacity=".7"/>
            </svg>
          </div>

          {/* Card 2 – Patients */}
          <div style={{borderRadius:24,padding:"26px 28px 22px",background:"linear-gradient(135deg,rgba(99,102,241,0.08) 0%,rgba(255,255,255,0.60) 100%)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",boxShadow:"0 8px 32px rgba(99,102,241,.10),0 2px 8px rgba(0,0,0,.04)",border:"1px solid var(--glass-border)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-28,right:-28,width:110,height:110,borderRadius:"50%",background:"rgba(255,255,255,.45)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",bottom:-12,right:18,width:64,height:64,borderRadius:"50%",background:"rgba(255,255,255,.30)",pointerEvents:"none"}}/>
            <p style={{fontSize:10,fontWeight:800,color:"#6366f1",letterSpacing:".1em",textTransform:"uppercase",margin:"0 0 16px",opacity:.8}}>Patients suivis</p>
            <p style={{fontSize:52,fontWeight:900,color:"#0f172a",letterSpacing:"-.05em",lineHeight:1,margin:"0 0 16px"}}>{ok?patients.length:0}</p>
            <svg width="100%" height="34" viewBox="0 0 110 34" preserveAspectRatio="none">
              <defs><linearGradient id="ga-pat" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity=".25"/><stop offset="100%" stopColor="#6366f1" stopOpacity="0"/></linearGradient></defs>
              <path d={spP.fill} fill="url(#ga-pat)"/>
              <path d={spP.line} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeOpacity=".7"/>
            </svg>
          </div>

          {/* Card 3 – CA */}
          <div style={{borderRadius:24,padding:"26px 28px 22px",background:"linear-gradient(135deg,rgba(16,185,129,0.08) 0%,rgba(255,255,255,0.60) 100%)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",boxShadow:"0 8px 32px rgba(16,185,129,.10),0 2px 8px rgba(0,0,0,.04)",border:"1px solid var(--glass-border)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-28,right:-28,width:110,height:110,borderRadius:"50%",background:"rgba(255,255,255,.45)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",bottom:-12,right:18,width:64,height:64,borderRadius:"50%",background:"rgba(255,255,255,.30)",pointerEvents:"none"}}/>
            <p style={{fontSize:10,fontWeight:800,color:"#10b981",letterSpacing:".1em",textTransform:"uppercase",margin:"0 0 16px",opacity:.8}}>CA du mois</p>
            <p style={{fontSize:52,fontWeight:900,color:"#0f172a",letterSpacing:"-.05em",lineHeight:1,margin:"0 0 16px"}}>{caDisplay}</p>
            <svg width="100%" height="34" viewBox="0 0 110 34" preserveAspectRatio="none">
              <defs><linearGradient id="ga-ca" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity=".25"/><stop offset="100%" stopColor="#10b981" stopOpacity="0"/></linearGradient></defs>
              <path d={spC.fill} fill="url(#ga-ca)"/>
              <path d={spC.line} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeOpacity=".7"/>
            </svg>
          </div>
        </div>

        {/* ── Section label ── */}
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
          <div style={{flex:1,height:1,background:"linear-gradient(90deg,rgba(0,201,138,.2),transparent)"}}/>
          <span style={{fontSize:11,fontWeight:800,color:"#00C98A",letterSpacing:".12em",textTransform:"uppercase"}}>Radar Clinique</span>
          <div style={{flex:1,height:1,background:"linear-gradient(270deg,rgba(0,201,138,.2),transparent)"}}/>
        </div>

        {/* ── Summary banner ── */}
        {(renewals.length>0||inactive.length>0)&&(
          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:24}}>
            {renewals.filter(r=>r.s==="eligible").length>0&&(
              <div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.22)",borderRadius:12}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#10b981"}}/>
                <span style={{fontSize:13,fontWeight:700,color:"#059669"}}>
                  {renewals.filter(r=>r.s==="eligible").length} renouvellement{renewals.filter(r=>r.s==="eligible").length>1?"s":""} disponible{renewals.filter(r=>r.s==="eligible").length>1?"s":""}
                </span>
              </div>
            )}
            {renewals.filter(r=>r.s==="soon").length>0&&(
              <div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.18)",borderRadius:12}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#3b82f6"}}/>
                <span style={{fontSize:13,fontWeight:700,color:"#2563eb"}}>{renewals.filter(r=>r.s==="soon").length} bientôt éligible{renewals.filter(r=>r.s==="soon").length>1?"s":""}</span>
              </div>
            )}
            {inactive.length>0&&(
              <div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:12}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#f59e0b"}}/>
                <span style={{fontSize:13,fontWeight:700,color:"#d97706"}}>{inactive.length} patient{inactive.length>1?"s":""} à relancer</span>
              </div>
            )}
          </div>
        )}

        {/* ── Body ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr min(320px,35%)",gap:24,alignItems:"start"}}>

          {/* LEFT */}
          <div style={{display:"flex",flexDirection:"column",gap:22}}>

            {/* Renouvellements */}
            <div style={{background:"rgba(255,255,255,.78)",backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",border:"1px solid rgba(255,255,255,.9)",boxShadow:"0 8px 40px rgba(0,0,0,.06)",borderRadius:24,padding:28}}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
                <div style={{width:46,height:46,borderRadius:14,background:"linear-gradient(135deg,#00C98A18,#00C98A08)",border:"1px solid rgba(0,201,138,.18)",display:"grid",placeItems:"center",flexShrink:0}}>
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#00C98A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <h2 style={{fontSize:17,fontWeight:800,color:"#0f172a",margin:0,letterSpacing:"-.01em"}}>Renouvellements SS</h2>
                    {renewals.length>0&&<span style={{fontSize:12,fontWeight:800,color:"#00C98A",background:"rgba(0,201,138,.12)",padding:"2px 10px",borderRadius:20,flexShrink:0}}>{renewals.length}</span>}
                  </div>
                  <p style={{fontSize:12,color:"#94a3b8",margin:"3px 0 0"}}>Prise en charge tous les 4 ans — appareils livrés</p>
                </div>
              </div>

              {renewals.length===0 ? (
                <EmptyState text="Aucun appareillage éligible au renouvellement pour l'instant." />
              ) : [...renewals].sort((a,b)=>(a.s==="eligible"?0:1)-(b.s==="eligible"?0:1)).map(r=>{
                const eli=r.s==="eligible";
                const bc=eli?"#10b981":"#3b82f6";
                const pct=Math.min(100,Math.round(r.days/RENEWAL*100));
                const eligibleDate=new Date(new Date(r.dateLivraison!).getTime()+RENEWAL*86_400_000);
                const eligibleLabel=eli?`Éligible depuis le ${fmtDate(eligibleDate.toISOString())}`:`Éligible le ${fmtDate(eligibleDate.toISOString())}`;
                return (
                  <div key={r.id} style={{
                    padding:"16px 20px",borderRadius:16,marginBottom:10,cursor:"pointer",
                    background:eli?"linear-gradient(90deg,rgba(16,185,129,.06) 0%,rgba(255,255,255,.6) 100%)":"rgba(255,255,255,.7)",
                    border:`1px solid ${eli?"rgba(16,185,129,.22)":"rgba(59,130,246,.15)"}`,
                    boxShadow:eli?"0 2px 16px rgba(16,185,129,.08)":"none",
                    transition:"transform .15s,box-shadow .15s"
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                      <div style={{width:42,height:42,borderRadius:"50%",background:`${bc}18`,display:"grid",placeItems:"center",fontSize:14,fontWeight:800,color:bc,flexShrink:0,border:`1.5px solid ${bc}30`}}>
                        {(r.patientPrenom?.[0]??"")}{(r.patientNom?.[0]??"")}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:14,fontWeight:700,color:"#0f172a",margin:"0 0 2px"}}>{r.patientPrenom} {r.patientNom}</p>
                        <p style={{fontSize:12,color:"#64748b",margin:"0 0 1px"}}>{r.marque} {r.modele} · Livré le {fmtDate(r.dateLivraison!)}</p>
                        <p style={{fontSize:11,color:bc,margin:0,fontWeight:600}}>{eligibleLabel}</p>
                      </div>
                      <span style={{flexShrink:0,fontSize:11,fontWeight:800,color:bc,background:`${bc}15`,padding:"5px 13px",borderRadius:20,border:`1px solid ${bc}25`,whiteSpace:"nowrap"}}>
                        {eli?"✓ Renouvellable":"Bientôt éligible"}
                      </span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{flex:1,height:5,background:"rgba(0,0,0,.06)",borderRadius:3,overflow:"hidden"}}>
                        <div style={{width:`${pct}%`,height:"100%",background:eli?`#10b981`:`linear-gradient(90deg,#93c5fd,#3b82f6)`,borderRadius:3,transition:"width .6s"}}/>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,color:bc,flexShrink:0}}>{pct}%</span>
                      <span style={{fontSize:11,color:"#94a3b8",flexShrink:0}}>
                        {eli?`+${Math.round((r.days-RENEWAL)/30)}m dépassé`:`~${Math.round(r.left/30)}m restants`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Patients inactifs */}
            <div style={{background:"rgba(255,255,255,.78)",backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",border:"1px solid rgba(255,255,255,.9)",boxShadow:"0 8px 40px rgba(0,0,0,.06)",borderRadius:24,padding:28}}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
                <div style={{width:46,height:46,borderRadius:14,background:"linear-gradient(135deg,#f59e0b18,#f59e0b08)",border:"1px solid rgba(245,158,11,.18)",display:"grid",placeItems:"center",flexShrink:0}}>
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <h2 style={{fontSize:17,fontWeight:800,color:"#0f172a",margin:0,letterSpacing:"-.01em"}}>Patients à relancer</h2>
                    {inactive.length>0&&<span style={{fontSize:12,fontWeight:800,color:"#f59e0b",background:"rgba(245,158,11,.12)",padding:"2px 10px",borderRadius:20,flexShrink:0}}>{inactive.length}</span>}
                  </div>
                  <p style={{fontSize:12,color:"#94a3b8",margin:"3px 0 0"}}>Sans rendez-vous depuis plus de 6 mois</p>
                </div>
              </div>

              {inactive.length===0 ? (
                <EmptyState text="Tous vos patients ont eu un suivi récent. Bravo !" icon="✓" />
              ) : inactive.map(p=>{
                const months=Math.round(p.days/30);
                const urg=p.days>365?"#ef4444":p.days>270?"#f59e0b":"#94a3b8";
                return (
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 18px",background:"rgba(255,255,255,.7)",borderRadius:14,border:"1px solid rgba(0,0,0,.05)",marginBottom:9}}>
                    <div style={{width:40,height:40,borderRadius:"50%",background:`${urg}15`,display:"grid",placeItems:"center",fontSize:13,fontWeight:800,color:urg,flexShrink:0,border:`1.5px solid ${urg}25`}}>
                      {(p.prenom?.[0]??"")}{(p.nom?.[0]??"")}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:13,fontWeight:700,color:"#0f172a",margin:"0 0 3px"}}>{p.prenom} {p.nom}</p>
                      <p style={{fontSize:11,color:"#94a3b8",margin:0}}>
                        Dernière visite : <span style={{color:urg,fontWeight:700}}>il y a {months} mois</span>
                      </p>
                    </div>
                    <Link href="/clair-audition/pro/agenda" style={{flexShrink:0,padding:"8px 16px",background:"rgba(0,201,138,.1)",color:"#00C98A",borderRadius:10,fontSize:12,fontWeight:700,textDecoration:"none",border:"1px solid rgba(0,201,138,.2)"}}>
                      Planifier
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT sidebar */}
          <div style={{display:"flex",flexDirection:"column",gap:18}}>

            {/* Agenda */}
            <div style={{background:"rgba(255,255,255,.78)",backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",border:"1px solid rgba(255,255,255,.9)",boxShadow:"0 8px 40px rgba(0,0,0,.06)",borderRadius:22,padding:24}}>
              <SideTitle label="Agenda du jour" accent="#00C98A"/>
              {agenda.length===0 ? (
                <div style={{textAlign:"center",padding:"24px 0"}}>
                  <p style={{fontSize:13,color:"#94a3b8",fontWeight:500,margin:0}}>Journée libre</p>
                </div>
              ) : agenda.map(r=>{
                const col=RDV_COL[r.type??""]??"#64748b";
                return (
                  <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"rgba(248,250,252,.9)",borderRadius:12,border:"1px solid rgba(0,0,0,.04)",marginBottom:8}}>
                    <div style={{width:3,height:36,borderRadius:2,background:col,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:13,fontWeight:700,color:"#0f172a",margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.patientPrenom} {r.patientNom}</p>
                      <p style={{fontSize:11,color:"#64748b",margin:0}}>{r.heure??"—"} · <span style={{color:col,fontWeight:700}}>{r.type??"RDV"}</span></p>
                    </div>
                    {r.statut==="Confirmé"&&<div style={{width:8,height:8,borderRadius:"50%",background:"#00C98A",flexShrink:0}}/>}
                  </div>
                );
              })}
              <Link href="/clair-audition/pro/agenda" style={{display:"block",textAlign:"center",marginTop:12,fontSize:12,color:"#00C98A",fontWeight:700,textDecoration:"none"}}>
                Voir l'agenda →
              </Link>
            </div>

            {/* Actions */}
            <div style={{background:"rgba(255,255,255,.78)",backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",border:"1px solid rgba(255,255,255,.9)",boxShadow:"0 8px 40px rgba(0,0,0,.06)",borderRadius:22,padding:24}}>
              <SideTitle label="Actions rapides" accent="#00C98A"/>
              {ACTIONS.map((a,i)=>(
                <Link key={i} href={a.h} style={{
                  display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,
                  background:"rgba(248,250,252,.9)",border:"1px solid rgba(0,201,138,.12)",
                  textDecoration:"none",color:"#0f172a",fontWeight:600,fontSize:13,marginBottom:9
                }}>
                  <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,rgba(0,201,138,.15),rgba(0,201,138,.07))",display:"grid",placeItems:"center",flexShrink:0}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00C98A" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={a.icon}/></svg>
                  </div>
                  {a.l}
                </Link>
              ))}
            </div>

          </div>
        </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function SideTitle({label,accent}:{label:string;accent:string}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:18}}>
      <div style={{width:3,height:18,borderRadius:2,background:accent}}/>
      <p style={{fontSize:11,fontWeight:800,color:"#0f172a",letterSpacing:".08em",textTransform:"uppercase",margin:0}}>{label}</p>
    </div>
  );
}
function EmptyState({text}:{text:string;icon?:string}) {
  return (
    <div style={{textAlign:"center",padding:"28px 0",background:"rgba(248,250,252,.8)",borderRadius:14}}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{margin:"0 auto 10px",display:"block"}}><path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <p style={{fontSize:13,color:"#94a3b8",margin:0}}>{text}</p>
    </div>
  );
}
