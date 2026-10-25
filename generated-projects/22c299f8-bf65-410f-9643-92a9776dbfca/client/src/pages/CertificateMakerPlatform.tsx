import { useState } from "react";
import { Link } from "wouter";

/** Standalone admin certificate studio. Customer details stay in this browser only. */
export default function CertificateMakerPlatform() {
  const [v,setV]=useState({business:"",postcode:"",membership:"",start:"",expiry:"",certificate:"",issued:new Date().toLocaleDateString("en-GB"),verification:"",username:""});
  const set=(k:keyof typeof v,value:string)=>setV(old=>({...old,[k]:value}));
  const [busy,setBusy]=useState(false);
  const fields:[keyof typeof v,string][]=[["business","Business name"],["postcode","Business postcode"],["membership","Membership number"],["certificate","Certificate ID"],["start","Contract start date"],["expiry","Contract expiry date"],["issued","Date issued"],["verification","Verification code"],["username","Customer username (optional)"]];
  function downloadPNG(){
    const svg=document.getElementById("royal-certificate") as unknown as SVGSVGElement;
    if(!svg)return;
    setBusy(true);
    const markup=new XMLSerializer().serializeToString(svg);
    const blob=new Blob([markup],{type:"image/svg+xml;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const img=new Image();
    img.onload=()=>{
      const canvas=document.createElement("canvas");canvas.width=1654;canvas.height=2339;
      const ctx=canvas.getContext("2d");if(!ctx){URL.revokeObjectURL(url);setBusy(false);return;}
      ctx.fillStyle="#fff9ee";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
      canvas.toBlob(out=>{if(out){const a=document.createElement("a");a.href=URL.createObjectURL(out);a.download=(v.certificate||"royal-certificate")+".png";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}URL.revokeObjectURL(url);setBusy(false);},"image/png");
    };
    img.onerror=()=>{URL.revokeObjectURL(url);setBusy(false);alert("PNG could not be created. Use Print / Save PDF instead.");};
    img.src=url;
  }
  return <div style={{minHeight:"100vh",background:"#210811",color:"#ffefcf",fontFamily:"Georgia,serif",padding:"22px"}}>
    <style>{`@media print{body *{visibility:hidden!important}#royal-certificate,#royal-certificate *{visibility:visible!important}#royal-certificate{position:fixed!important;left:0!important;top:0!important;width:210mm!important;height:297mm!important} @page{size:A4 portrait;margin:0}}`}</style>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap",marginBottom:22}}>
      <div><h1 style={{fontSize:28,color:"#f3d18a",margin:0}}>✦ Royal A4 Certificate Maker</h1><p style={{color:"#d9b77a",margin:"7px 0"}}>Create a customer certificate from anywhere, then print or send it.</p></div>
      <Link href="/admin-dashboard"><a style={{color:"#fff2d1"}}>← Admin Dashboard</a></Link>
    </header>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,380px),1fr))",gap:22,alignItems:"start"}}>
      <section style={{border:"1px solid #c9a45b",borderRadius:13,background:"#fff8ed",color:"#42242a",padding:20}}>
        <h2 style={{marginTop:0}}>Certificate details</h2><p style={{fontSize:13}}>Enter each customer's real details. This form does not save customer information to a server.</p>
        {fields.map(([key,label])=><label key={key} style={{display:"block",fontFamily:"Arial,sans-serif",fontSize:14,marginBottom:13,fontWeight:600}}>{label}<input value={v[key]} onChange={e=>set(key,e.target.value)} placeholder={label} style={{display:"block",width:"100%",boxSizing:"border-box",padding:"11px",marginTop:5,borderRadius:6,border:"1px solid #c8ac7d",fontSize:15}} /></label>)}
        <div style={{display:"flex",gap:9,flexWrap:"wrap",marginTop:15}}>
          <button disabled={busy} onClick={downloadPNG} style={{padding:"11px 18px",background:"#762636",color:"white",border:0,borderRadius:7,cursor:"pointer"}}>Download PNG</button>
          <button onClick={()=>window.print()} style={{padding:"11px 18px",background:"#a77925",color:"white",border:0,borderRadius:7,cursor:"pointer"}}>Print / Save PDF</button>
          <button onClick={()=>setV({business:"",postcode:"",membership:"",start:"",expiry:"",certificate:"",issued:new Date().toLocaleDateString("en-GB"),verification:"",username:""})} style={{padding:"11px 18px",background:"white",border:"1px solid #b49b73",borderRadius:7,cursor:"pointer"}}>Clear</button>
        </div>
        <p style={{fontSize:12,lineHeight:1.5}}>Certificate verification is only valid if the certificate has separately been registered in your live records. Do not include customer passwords on shared certificates.</p>
      </section>
      <section style={{minWidth:0}}>
        <div style={{color:"#ffe0a2",marginBottom:10}}>Live A4 certificate preview</div>
        <svg id="royal-certificate" viewBox="0 0 794 1123" xmlns="http://www.w3.org/2000/svg" style={{display:"block",width:"100%",maxWidth:620,margin:"0 auto",boxShadow:"0 12px 36px #0007",background:"#fff9ed"}}>
          <rect width="794" height="1123" fill="#fff9ed"/>
          <rect x="18" y="18" width="758" height="1087" fill="none" stroke="#63182b" strokeWidth="20"/>
          <rect x="38" y="38" width="718" height="1047" fill="none" stroke="#d5a438" strokeWidth="7"/>
          <rect x="49" y="49" width="696" height="1025" fill="none" stroke="#752738" strokeWidth="2"/>
          <rect x="67" y="67" width="660" height="989" fill="none" stroke="#c8a45d" strokeWidth="1"/>
          {[[72,72],[722,72],[72,1050],[722,1050]].map(([x,y],i)=><g key={i} transform={`translate(${x},${y})`}><circle r="19" fill="#b78a32" stroke="#6b2834" strokeWidth="3"/><path d="M-13 0H13M0 -13V13" stroke="#fff1bb" strokeWidth="3"/></g>)}
          <text x="397" y="160" fontSize="18" fill="#8c6a24" textAnchor="middle" letterSpacing="5">FOOD &amp; SAFETY</text>
          <text x="397" y="207" fontSize="42" fontWeight="bold" fill="#6d172b" textAnchor="middle">CERTIFICATE</text>
          <text x="397" y="241" fontSize="20" fill="#a47932" textAnchor="middle" letterSpacing="4">OF MEMBERSHIP</text>
          <path d="M220 268H574" stroke="#b99039" strokeWidth="3"/><text x="397" y="320" fontSize="19" fill="#5c3942" textAnchor="middle">This certificate is presented to</text>
          <text x="397" y="391" fontSize={v.business.length>28?24:34} fontWeight="bold" fill="#651c2e" textAnchor="middle">{v.business||"BUSINESS NAME"}</text>
          <path d="M135 412H659" stroke="#c7a05d"/>
          <text x="397" y="455" fontSize="18" fill="#6e5051" textAnchor="middle">Business Postcode</text><text x="397" y="489" fontSize="24" fill="#552636" textAnchor="middle">{v.postcode||"—"}</text>
          <text x="397" y="552" fontSize="22" fontWeight="bold" fill="#772a3a" textAnchor="middle">Pest Control Membership</text>
          <text x="397" y="591" fontSize="20" fill="#50333b" textAnchor="middle">Membership No: {v.membership||"—"}</text>
          <text x="397" y="633" fontSize="18" fill="#50333b" textAnchor="middle">Contract: {v.start||"—"}  to  {v.expiry||"—"}</text>
          <text x="397" y="688" fontSize="17" fill="#50333b" textAnchor="middle">Certificate ID: {v.certificate||"—"}</text>
          <text x="397" y="726" fontSize="17" fill="#50333b" textAnchor="middle">Issued: {v.issued||"—"}</text>
          <circle cx="397" cy="832" r="61" fill="#f8ebcc" stroke="#c59c3c" strokeWidth="7"/><circle cx="397" cy="832" r="51" fill="none" stroke="#75283c" strokeWidth="2"/>
          <text x="397" y="822" fontSize="13" textAnchor="middle" fill="#75283c">FOOD SAFETY</text><text x="397" y="849" fontSize="17" fontWeight="bold" textAnchor="middle" fill="#75283c">APPROVED</text>
          <text x="226" y="942" fontFamily="cursive" fontSize="39" fontStyle="italic" fill="#283a55" textAnchor="middle">Smujeeb</text><path d="M95 950H358" stroke="#8f6e44" strokeWidth="2"/>
          <text x="225" y="975" fontSize="15" fill="#52333a" textAnchor="middle">Authorised Signature</text>
          <text x="570" y="940" fontSize="16" fill="#52333a" textAnchor="middle">Verification: {v.verification||"—"}</text><path d="M465 950H679" stroke="#8f6e44" strokeWidth="2"/>
          <text x="570" y="975" fontSize="15" fill="#52333a" textAnchor="middle">Certificate Verification</text>
          <text x="397" y="1018" fontSize="12" fill="#886a40" textAnchor="middle">pestcontrol.cat</text>
        </svg>
      </section>
    </div>
  </div>;
}
