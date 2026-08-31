"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { loadBuilderProject } from "./api"
import {
  applyFoodSafetyBookDetails,
  DEFAULT_FOOD_SAFETY_DETAILS,
  type FoodSafetyBookDetails,
} from "@/lib/786-chat/food-safety-pdf-editor"

const ACTIVE_PROJECT_KEY = "786chat_builder_active_project"
const TEMPLATE_ID = "food-safety-record-book"
const KNOWN_FOOD_SAFETY_PROJECT_ID = "fd542697-fb5b-46c6-8435-7276a05e2e0e"
const TOTAL_PAGES = 197
const DB_NAME = "786-chat-approved-food-safety-pdf"
const STORE_NAME = "approved-pdfs"
const EXPECTED_FILE = "Raja_Catering_FINAL_197_Page_Record_Book_FINAL_CLEAN.pdf"

type PreviewBounds = { left: number; top: number; width: number; height: number }
type StoredPdf = {
  projectId: string
  name: string
  blob: Blob
  masterBlob?: Blob
  details?: FoodSafetyBookDetails
  updatedAt: number
}

function freshDefaults(): FoodSafetyBookDetails {
  return { ...DEFAULT_FOOD_SAFETY_DETAILS, products: [...DEFAULT_FOOD_SAFETY_DETAILS.products] }
}

function openPdfDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "projectId" })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error("Could not open approved PDF storage."))
  })
}

async function readStoredPdf(projectId: string) {
  const db = await openPdfDb()
  try {
    return await new Promise<StoredPdf | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly")
      const request = transaction.objectStore(STORE_NAME).get(projectId)
      request.onsuccess = () => resolve((request.result as StoredPdf | undefined) || null)
      request.onerror = () => reject(request.error || new Error("Could not read approved PDF."))
    })
  } finally { db.close() }
}

async function writeStoredPdf(record: StoredPdf) {
  const db = await openPdfDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite")
      transaction.objectStore(STORE_NAME).put(record)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error || new Error("Could not save approved PDF."))
      transaction.onabort = () => reject(transaction.error || new Error("Could not save approved PDF."))
    })
  } finally { db.close() }
}

function locateLivePreview(): PreviewBounds | null {
  const labels = Array.from(document.querySelectorAll("span"))
  const label = labels.find((node) => node.textContent?.trim() === "Live preview")
  const panel = label?.closest("section") as HTMLElement | null
  if (!panel) return null
  const rect = panel.getBoundingClientRect()
  if (rect.width < 220 || rect.height < 220 || rect.bottom < 0 || rect.top > window.innerHeight) return null
  return { left: Math.max(0, rect.left + 8), top: Math.max(0, rect.top + 49), width: Math.max(220, rect.width - 16), height: Math.max(220, rect.height - 57) }
}

function sameBounds(a: PreviewBounds | null, b: PreviewBounds | null) {
  if (!a || !b) return a === b
  return Math.abs(a.left-b.left)<1 && Math.abs(a.top-b.top)<1 && Math.abs(a.width-b.width)<1 && Math.abs(a.height-b.height)<1
}

function isFoodSafetyProject(project: { id: string; title?: string; files?: Record<string,string>; metadata?: Record<string,unknown> }) {
  if (project.id === KNOWN_FOOD_SAFETY_PROJECT_ID) return true
  if (project.metadata?.template_id === TEMPLATE_ID) return true
  if (/food\s+safety\s+record\s+book/i.test(project.title || "")) return true
  return Object.keys(project.files || {}).some((path) => /food-safety-book|approved-pdf-mode/i.test(path))
}

function safeFileName(details: FoodSafetyBookDetails) {
  const business = details.businessName.trim().replace(/[^a-z0-9]+/gi,"_").replace(/^_+|_+$/g,"") || "Food_Safety"
  const start = details.firstMonday.replace(/[^0-9]+/g,"-")
  return `${business}_197_Page_Food_Safety_Book_${start || "updated"}.pdf`
}

export function FoodSafetyApprovedPdfOverlay() {
  const [projectId,setProjectId]=useState("")
  const [active,setActive]=useState(false)
  const [bounds,setBounds]=useState<PreviewBounds|null>(null)
  const [pdfUrl,setPdfUrl]=useState("")
  const [pdfName,setPdfName]=useState("")
  const [page,setPage]=useState(1)
  const [pageInput,setPageInput]=useState("1")
  const [message,setMessage]=useState("")
  const [hydrated,setHydrated]=useState(false)
  const [editorOpen,setEditorOpen]=useState(false)
  const [details,setDetails]=useState<FoodSafetyBookDetails>(()=>freshDefaults())
  const [applying,setApplying]=useState(false)
  const fileInputRef=useRef<HTMLInputElement|null>(null)
  const objectUrlRef=useRef("")
  const currentBlobRef=useRef<Blob|null>(null)
  const masterBlobRef=useRef<Blob|null>(null)

  const replaceObjectUrl=useCallback((blob:Blob|null,name="")=>{
    if(objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    objectUrlRef.current=blob?URL.createObjectURL(blob):""
    currentBlobRef.current=blob
    setPdfUrl(objectUrlRef.current)
    setPdfName(name)
  },[])

  useEffect(()=>{ setHydrated(true); return()=>{ if(objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current) } },[])

  useEffect(()=>{
    if(!hydrated) return
    let cancelled=false; let lastId=""
    const inspectProject=async()=>{
      const id=window.localStorage.getItem(ACTIVE_PROJECT_KEY)||""
      if(id===lastId) return
      lastId=id; setProjectId(id); setActive(false); setPage(1); setPageInput("1"); setMessage(""); setEditorOpen(false); replaceObjectUrl(null); masterBlobRef.current=null; setDetails(freshDefaults())
      if(!id) return
      try{
        const result=await loadBuilderProject(id); if(cancelled) return
        const foodSafety=isFoodSafetyProject(result.project); setActive(foodSafety); if(!foodSafety) return
        const stored=await readStoredPdf(id).catch(()=>null); if(cancelled||!stored?.blob) return
        masterBlobRef.current=stored.masterBlob||stored.blob
        setDetails(stored.details?{...stored.details,products:[...stored.details.products]}:freshDefaults())
        replaceObjectUrl(stored.blob,stored.name||EXPECTED_FILE)
      }catch{ if(!cancelled) setActive(false) }
    }
    void inspectProject(); const timer=window.setInterval(()=>void inspectProject(),900)
    return()=>{cancelled=true;window.clearInterval(timer)}
  },[hydrated,replaceObjectUrl])

  useEffect(()=>{
    if(!active){setBounds(null);return}
    const update=()=>{const next=locateLivePreview();setBounds((current)=>sameBounds(current,next)?current:next)}
    update(); const timer=window.setInterval(update,350); window.addEventListener("resize",update); window.addEventListener("scroll",update,true)
    return()=>{window.clearInterval(timer);window.removeEventListener("resize",update);window.removeEventListener("scroll",update,true)}
  },[active])

  const pdfPageUrl=useMemo(()=>pdfUrl?`${pdfUrl}#page=${page}&zoom=page-fit&toolbar=0&navpanes=0&scrollbar=0&view=Fit`:"",[pdfUrl,page])
  const jumpToPage=useCallback(()=>{const parsed=Number.parseInt(pageInput,10);const next=Number.isFinite(parsed)?Math.min(TOTAL_PAGES,Math.max(1,parsed)):1;setPage(next);setPageInput(String(next))},[pageInput])

  const choosePdf=useCallback(async(file:File|null)=>{
    if(!file||!projectId)return
    if(file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf")){setMessage("Please select the approved 197-page PDF.");return}
    if(file.size>30*1024*1024){setMessage("The approved PDF must be 30MB or smaller.");return}
    masterBlobRef.current=file; const defaults=freshDefaults(); setDetails(defaults); replaceObjectUrl(file,file.name||EXPECTED_FILE); setPage(1);setPageInput("1");setMessage("Approved PDF loaded. Use Edit Customer / Book Details to make a new customer or six-month renewal.")
    try{await writeStoredPdf({projectId,name:file.name||EXPECTED_FILE,blob:file,masterBlob:file,details:defaults,updatedAt:Date.now()})}catch{setMessage("Approved PDF loaded, but this browser could not remember it after refresh.")}
  },[projectId,replaceObjectUrl])

  const applyEdits=useCallback(async()=>{
    const master=masterBlobRef.current
    if(!master||!projectId){setMessage("Load the approved 197-page PDF first.");return}
    setApplying(true);setMessage("Updating the real approved PDF...")
    try{
      const edited=await applyFoodSafetyBookDetails(master,details)
      const name=safeFileName(details)
      replaceObjectUrl(edited,name);setPage(1);setPageInput("1")
      await writeStoredPdf({projectId,name,blob:edited,masterBlob:master,details:{...details,products:[...details.products]},updatedAt:Date.now()})
      setEditorOpen(false);setMessage("Book updated. The approved design is unchanged; customer details and selected global fields were applied to the PDF.")
    }catch(error){setMessage(error instanceof Error?error.message:"Could not update the approved PDF.")}
    finally{setApplying(false)}
  },[details,projectId,replaceObjectUrl])

  const resetChanges=useCallback(async()=>{
    const master=masterBlobRef.current
    if(!master||!projectId)return
    const defaults=freshDefaults();setDetails(defaults);replaceObjectUrl(master,EXPECTED_FILE);setPage(1);setPageInput("1")
    await writeStoredPdf({projectId,name:EXPECTED_FILE,blob:master,masterBlob:master,details:defaults,updatedAt:Date.now()}).catch(()=>{})
    setMessage("Restored the approved master PDF and Raja Catering default details.")
  },[projectId,replaceObjectUrl])

  const setField=<K extends keyof FoodSafetyBookDetails>(key:K,value:FoodSafetyBookDetails[K])=>setDetails((current)=>({...current,[key]:value}))
  if(!hydrated||!active||!bounds)return null

  const shellStyle:React.CSSProperties={position:"fixed",left:bounds.left,top:bounds.top,width:bounds.width,height:bounds.height,zIndex:90,display:"flex",flexDirection:"column",overflow:"hidden",borderRadius:10,border:"1px solid #263550",background:"#07101d",boxShadow:"0 20px 55px rgba(0,0,0,.34)"}
  const buttonStyle:React.CSSProperties={height:34,borderRadius:8,border:"1px solid #31445f",background:"#0d1829",color:"#dce7f8",padding:"0 12px",fontWeight:800,fontSize:13,cursor:"pointer"}
  const goldButtonStyle:React.CSSProperties={...buttonStyle,border:"1px solid #d6a82c",background:"linear-gradient(135deg,#f5d36b,#d9a520)",color:"#143426"}
  const inputStyle:React.CSSProperties={width:"100%",height:36,borderRadius:8,border:"1px solid #c8d3dc",background:"white",color:"#10231d",padding:"0 10px",fontSize:13,fontWeight:650,boxSizing:"border-box"}
  const labelStyle:React.CSSProperties={display:"grid",gap:5,color:"#173e32",fontSize:12,fontWeight:850}
  const sectionStyle:React.CSSProperties={border:"1px solid #d7dfdb",borderRadius:12,padding:12,background:"#f8faf8",display:"grid",gap:10}

  const editor=(
    <div style={{position:"absolute",inset:"52px 0 0 auto",width:"min(520px,100%)",zIndex:8,background:"#eef4f1",borderLeft:"1px solid #34485a",boxShadow:"-18px 0 45px rgba(0,0,0,.28)",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"12px 14px",background:"#0b3d31",color:"white",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
        <div><div style={{fontSize:15,fontWeight:900}}>Edit Customer / Book Details</div><div style={{fontSize:11,color:"#c8ded5",marginTop:2}}>Changes are stamped onto the real approved PDF. The approved page design stays in place.</div></div>
        <button type="button" style={buttonStyle} onClick={()=>setEditorOpen(false)}>Close</button>
      </div>
      <div style={{padding:12,overflow:"auto",display:"grid",gap:12}}>
        <div style={sectionStyle}><strong style={{color:"#0b513e"}}>Business details</strong>
          <label style={labelStyle}>Business Name<input style={inputStyle} value={details.businessName} onChange={(e)=>setField("businessName",e.target.value)}/></label>
          <label style={labelStyle}>Address Line 1<input style={inputStyle} value={details.addressLine1} onChange={(e)=>setField("addressLine1",e.target.value)}/></label>
          <label style={labelStyle}>Address Line 2 / Postcode<input style={inputStyle} value={details.addressLine2} onChange={(e)=>setField("addressLine2",e.target.value)}/></label>
          <label style={labelStyle}>Telephone<input style={inputStyle} value={details.telephone} onChange={(e)=>setField("telephone",e.target.value)}/></label>
          <label style={labelStyle}>Approved By<input style={inputStyle} value={details.approvedBy} onChange={(e)=>setField("approvedBy",e.target.value)}/></label>
        </div>
        <div style={sectionStyle}><strong style={{color:"#0b513e"}}>Staff & HACCP team</strong>
          <label style={labelStyle}>HACCP Completed By<input style={inputStyle} value={details.haccpCompletedBy} onChange={(e)=>setField("haccpCompletedBy",e.target.value)}/></label>
          <label style={labelStyle}>Consultant<input style={inputStyle} value={details.consultant} onChange={(e)=>setField("consultant",e.target.value)}/></label>
          <label style={labelStyle}>Director / Worker<input style={inputStyle} value={details.director} onChange={(e)=>setField("director",e.target.value)}/></label>
          <label style={labelStyle}>Preparation & Cooking<input style={inputStyle} value={details.preparationStaff} onChange={(e)=>setField("preparationStaff",e.target.value)}/></label>
          <label style={labelStyle}>Storage & Wash-up<input style={inputStyle} value={details.storageStaff} onChange={(e)=>setField("storageStaff",e.target.value)}/></label>
        </div>
        <div style={sectionStyle}><strong style={{color:"#0b513e"}}>Global dates</strong>
          <label style={labelStyle}>Assessment Date (DD/MM/YYYY)<input style={inputStyle} value={details.assessmentDate} onChange={(e)=>setField("assessmentDate",e.target.value)}/></label>
          <label style={labelStyle}>Review Date (DD/MM/YYYY)<input style={inputStyle} value={details.reviewDate} onChange={(e)=>setField("reviewDate",e.target.value)}/></label>
          <label style={labelStyle}>First Monday / 26-week Start Date<input style={inputStyle} value={details.firstMonday} onChange={(e)=>setField("firstMonday",e.target.value)}/></label>
          <div style={{fontSize:11,color:"#50655d"}}>Changing the First Monday regenerates the 182 daily dates across the 26-week book.</div>
        </div>
        <div style={sectionStyle}><strong style={{color:"#0b513e"}}>Products</strong>
          {details.products.map((product,index)=><label key={index} style={labelStyle}>Product {index+1}<input style={inputStyle} value={product} onChange={(e)=>{const products=[...details.products];products[index]=e.target.value;setField("products",products)}}/></label>)}
        </div>
        <div style={sectionStyle}><strong style={{color:"#0b513e"}}>Ingredients & allergens</strong>
          <label style={labelStyle}>Ingredients<input style={inputStyle} value={details.ingredients} onChange={(e)=>setField("ingredients",e.target.value)}/></label>
          <label style={labelStyle}>Allergens<input style={inputStyle} value={details.allergens} onChange={(e)=>setField("allergens",e.target.value)}/></label>
        </div>
        <div style={sectionStyle}><strong style={{color:"#0b513e"}}>Food-safety limits</strong>
          <label style={labelStyle}>Heat Treatment Target<input style={inputStyle} value={details.heatTreatmentTarget} onChange={(e)=>setField("heatTreatmentTarget",e.target.value)}/></label>
          <label style={labelStyle}>Cooling Target<input style={inputStyle} value={details.coolingTarget} onChange={(e)=>setField("coolingTarget",e.target.value)}/></label>
          <label style={labelStyle}>Cold Room Target<input style={inputStyle} value={details.coldRoomTarget} onChange={(e)=>setField("coldRoomTarget",e.target.value)}/></label>
          <label style={labelStyle}>Frozen Storage Target<input style={inputStyle} value={details.frozenStorageTarget} onChange={(e)=>setField("frozenStorageTarget",e.target.value)}/></label>
        </div>
        <div style={sectionStyle}><strong style={{color:"#0b513e"}}>Controlled heading</strong><label style={labelStyle}>Document Name<input style={inputStyle} value={details.documentName} onChange={(e)=>setField("documentName",e.target.value)}/></label></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",paddingBottom:6}}>
          <button type="button" style={{...goldButtonStyle,minHeight:42}} disabled={applying} onClick={()=>void applyEdits()}>{applying?"Applying...":"Apply to Book"}</button>
          <button type="button" style={buttonStyle} disabled={applying} onClick={()=>void resetChanges()}>Restore Raja Catering Defaults</button>
        </div>
      </div>
    </div>
  )

  const overlay=(
    <div style={shellStyle} data-food-safety-approved-pdf-only="true">
      <div style={{minHeight:52,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",padding:"8px 10px",borderBottom:"1px solid #263550",background:"#081522"}}>
        <strong style={{color:"#f5d36b",fontSize:13,marginRight:4}}>Approved 197-page PDF - Exact View</strong>
        <button type="button" style={pdfUrl?buttonStyle:goldButtonStyle} onClick={()=>fileInputRef.current?.click()}>{pdfUrl?"Replace PDF":"Load Approved PDF"}</button>
        <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(event)=>{const file=event.target.files?.[0]||null;void choosePdf(file);event.currentTarget.value=""}}/>
        {pdfUrl&&<button type="button" style={goldButtonStyle} onClick={()=>setEditorOpen(true)}>Edit Customer / Book Details</button>}
        {pdfUrl&&<button type="button" style={buttonStyle} onClick={()=>window.open(pdfUrl,"_blank","noopener,noreferrer")}>Open Full PDF</button>}
        {pdfUrl&&<button type="button" style={buttonStyle} onClick={()=>{const a=document.createElement("a");a.href=pdfUrl;a.download=pdfName||EXPECTED_FILE;a.click()}}>Save PDF Copy</button>}
      </div>
      {pdfUrl?(<>
        <div style={{minHeight:46,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"6px 10px",borderBottom:"1px solid #263550",background:"#0a1525",color:"#dce7f8",fontSize:13}}>
          <button type="button" style={buttonStyle} disabled={page<=1} onClick={()=>{const next=Math.max(1,page-1);setPage(next);setPageInput(String(next))}}>Previous</button>
          <strong>Page {page} of {TOTAL_PAGES}</strong>
          <input aria-label="PDF page number" value={pageInput} onChange={(e)=>setPageInput(e.target.value.replace(/[^0-9]/g,""))} onKeyDown={(e)=>{if(e.key==="Enter")jumpToPage()}} style={{width:66,height:32,borderRadius:7,border:"1px solid #31445f",background:"#07101d",color:"white",padding:"0 8px"}}/>
          <button type="button" style={buttonStyle} onClick={jumpToPage}>Go</button>
          <button type="button" style={buttonStyle} disabled={page>=TOTAL_PAGES} onClick={()=>{const next=Math.min(TOTAL_PAGES,page+1);setPage(next);setPageInput(String(next))}}>Next</button>
        </div>
        <iframe key={pdfPageUrl} src={pdfPageUrl} title="Approved Raja Catering 197-page Food Safety PDF" style={{width:"100%",height:"100%",flex:"1 1 auto",minHeight:0,border:0,background:"#dfe7e4"}}/>
        {message&&<div style={{padding:"5px 10px",borderTop:"1px solid #263550",background:"#07101d",color:"#b6c5d8",fontSize:11}}>{message}</div>}
      </>):(
        <div onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault();void choosePdf(e.dataTransfer.files?.[0]||null)}} style={{flex:1,display:"grid",placeItems:"center",padding:24,overflow:"auto",background:"linear-gradient(145deg,#081522,#0b2630)"}}>
          <div style={{width:"min(620px,92%)",borderRadius:18,border:"1px solid rgba(217,165,32,.55)",background:"rgba(8,22,31,.92)",padding:28,textAlign:"center",boxShadow:"0 18px 60px rgba(0,0,0,.28)"}}>
            <div style={{color:"#f1c24d",fontSize:12,fontWeight:900,letterSpacing:".14em"}}>APPROVED CHATGPT PDF MASTER</div>
            <h2 style={{margin:"10px 0 8px",color:"white",fontSize:24}}>Use the real approved 197-page book</h2>
            <p style={{margin:"0 auto 18px",maxWidth:520,color:"#b9c7d7",lineHeight:1.6,fontSize:14}}>Select the approved PDF. Live Preview shows the PDF itself exactly, including full A4 portrait pages and native landscape HACCP pages.</p>
            <div style={{margin:"0 auto 18px",maxWidth:520,borderRadius:10,background:"#06111c",border:"1px solid #263550",padding:"10px 12px",color:"#e7edf6",fontFamily:"monospace",fontSize:12,overflowWrap:"anywhere"}}>{EXPECTED_FILE}</div>
            <button type="button" style={{...goldButtonStyle,minHeight:42,padding:"0 18px"}} onClick={()=>fileInputRef.current?.click()}>Choose Approved 197-page PDF</button>
            {message&&<p style={{margin:"12px 0 0",color:"#f5d36b",fontSize:13,fontWeight:700}}>{message}</p>}
          </div>
        </div>
      )}
      {editorOpen&&pdfUrl&&editor}
    </div>
  )
  return createPortal(overlay,document.body)
}
