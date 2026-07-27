"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ADMIN_CHAT_PATH = "/786-admin/chat"
const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const MARKER = "data-786-visual-editor-runtime"

type VisualOperation = {
  id: string
  styles?: Record<string, string>
  text?: string
  action?: "move-up" | "move-down" | "duplicate" | "delete"
}

function activeProjectId(): string {
  try {
    return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim()
  } catch {
    return ""
  }
}

function runtimeScript(operations: VisualOperation[]): string {
  const saved = JSON.stringify(operations).replace(/</g, "\\u003c")
  return `<script ${MARKER}="true">(function(){
    if(window.__786VisualEditorInstalled)return;
    window.__786VisualEditorInstalled=true;
    var operations=${saved};
    var selected=null;
    var editing=false;
    var saveTimer=0;

    function editableNodes(){
      return Array.prototype.slice.call(document.querySelectorAll('#root *')).filter(function(node){
        return node instanceof HTMLElement && !node.closest('[data-786-visual-toolbar]') && !['SCRIPT','STYLE'].includes(node.tagName);
      });
    }
    function assignIds(){
      editableNodes().forEach(function(node,index){if(!node.dataset.edit786Id)node.dataset.edit786Id='e'+index;});
    }
    function find(id){return document.querySelector('[data-edit786-id="'+id+'"]');}
    function applyOperation(op){
      var node=find(op.id);if(!node)return;
      if(op.styles)Object.keys(op.styles).forEach(function(key){node.style[key]=op.styles[key];});
      if(typeof op.text==='string')node.textContent=op.text;
      if(op.action==='move-up'&&node.previousElementSibling)node.parentElement.insertBefore(node,node.previousElementSibling);
      if(op.action==='move-down'&&node.nextElementSibling)node.parentElement.insertBefore(node.nextElementSibling,node);
      if(op.action==='duplicate'){
        var copy=node.cloneNode(true);copy.dataset.edit786Id=op.id+'-copy-'+Math.random().toString(36).slice(2,7);node.parentElement.insertBefore(copy,node.nextElementSibling);
      }
      if(op.action==='delete')node.remove();
    }
    function applyAll(){assignIds();operations.forEach(applyOperation);}
    function publish(){
      clearTimeout(saveTimer);
      saveTimer=setTimeout(function(){try{window.parent.postMessage({type:'786-visual-editor-save',operations:operations},'*');}catch(_){}},180);
    }
    function upsert(id,patch){
      var existing=null;
      for(var i=operations.length-1;i>=0;i--){if(operations[i].id===id&&!operations[i].action){existing=operations[i];break;}}
      if(!existing){existing={id:id,styles:{}};operations.push(existing);}
      if(patch.styles)existing.styles=Object.assign({},existing.styles||{},patch.styles);
      if(Object.prototype.hasOwnProperty.call(patch,'text'))existing.text=patch.text;
      publish();
    }
    function action(id,name){operations.push({id:id,action:name});publish();}
    function select(node){
      if(selected)selected.style.outline=selected.dataset.oldOutline786||'';
      selected=node;selected.dataset.oldOutline786=selected.style.outline||'';
      selected.style.outline='2px solid #22d3ee';selected.style.outlineOffset='3px';
      syncControls();
    }
    function syncControls(){
      if(!selected)return;
      text.value=selected.children.length===0?(selected.textContent||''):'';
      border.value=parseInt(selected.style.borderWidth||getComputedStyle(selected).borderWidth)||0;
      radius.value=parseInt(selected.style.borderRadius||getComputedStyle(selected).borderRadius)||0;
      padding.value=parseInt(selected.style.padding||getComputedStyle(selected).padding)||0;
      margin.value=parseInt(selected.style.margin||getComputedStyle(selected).margin)||0;
      size.value=String(parseInt(selected.style.fontSize||getComputedStyle(selected).fontSize)||16);
    }

    var toolbar=document.createElement('aside');toolbar.setAttribute('data-786-visual-toolbar','true');
    toolbar.innerHTML='<button data-toggle type="button">Edit page</button><div data-panel hidden><strong>Visual editor</strong><label>Text<input data-text type="text"></label><div class="row"><button data-up type="button">Move up</button><button data-down type="button">Move down</button></div><div class="row"><button data-copy type="button">Duplicate</button><button data-delete type="button">Delete</button></div><label>Font size<select data-size><option>14</option><option>16</option><option>18</option><option>24</option><option>32</option><option>48</option><option>64</option></select></label><label>Text colour<input data-color type="color"></label><label>Background<input data-bg type="color"></label><label>Border width<input data-border type="number" min="0" max="20"></label><label>Border radius<input data-radius type="number" min="0" max="100"></label><label>Padding<input data-padding type="number" min="0" max="160"></label><label>Margin<input data-margin type="number" min="0" max="160"></label><small>Click an element, change it, then reopen the project to confirm it saved.</small></div>';
    var style=document.createElement('style');style.textContent='[data-786-visual-toolbar]{position:fixed;z-index:2147483647;right:14px;top:14px;width:230px;font:13px Inter,system-ui;color:#e2e8f0}[data-786-visual-toolbar]>button{float:right;border:0;border-radius:12px;background:#0891b2;color:white;padding:10px 14px;font-weight:800}[data-786-visual-toolbar] [data-panel]{clear:both;margin-top:48px;padding:14px;border:1px solid rgba(255,255,255,.16);border-radius:16px;background:rgba(2,6,23,.96);box-shadow:0 20px 60px rgba(0,0,0,.4)}[data-786-visual-toolbar] label{display:block;margin-top:10px;color:#cbd5e1}[data-786-visual-toolbar] input,[data-786-visual-toolbar] select{display:block;width:100%;margin-top:4px;border:1px solid rgba(255,255,255,.18);border-radius:9px;background:#0f172a;color:white;padding:7px}[data-786-visual-toolbar] input[type=color]{height:38px;padding:3px}[data-786-visual-toolbar] .row{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}[data-786-visual-toolbar] .row button{border:1px solid rgba(255,255,255,.16);border-radius:9px;background:#172033;color:white;padding:7px;font-weight:700}[data-786-visual-toolbar] small{display:block;margin-top:10px;color:#94a3b8;line-height:1.4}';
    document.head.appendChild(style);document.body.appendChild(toolbar);
    var toggle=toolbar.querySelector('[data-toggle]'),panel=toolbar.querySelector('[data-panel]');
    var text=toolbar.querySelector('[data-text]'),size=toolbar.querySelector('[data-size]'),color=toolbar.querySelector('[data-color]'),bg=toolbar.querySelector('[data-bg]'),border=toolbar.querySelector('[data-border]'),radius=toolbar.querySelector('[data-radius]'),padding=toolbar.querySelector('[data-padding]'),margin=toolbar.querySelector('[data-margin]');
    toggle.addEventListener('click',function(){editing=!editing;panel.hidden=!editing;toggle.textContent=editing?'Close editor':'Edit page';if(!editing&&selected){selected.style.outline=selected.dataset.oldOutline786||'';selected=null;}});
    document.addEventListener('click',function(event){if(!editing||event.target.closest('[data-786-visual-toolbar]'))return;var node=event.target.closest('#root *');if(!node)return;event.preventDefault();event.stopPropagation();select(node);},true);
    text.addEventListener('change',function(){if(!selected||selected.children.length)return;selected.textContent=text.value;upsert(selected.dataset.edit786Id,{text:text.value});});
    function styleChange(input,key,suffix){input.addEventListener('change',function(){if(!selected)return;var value=input.value+(suffix||'');selected.style[key]=value;var styles={};styles[key]=value;upsert(selected.dataset.edit786Id,{styles:styles});});}
    styleChange(size,'fontSize','px');styleChange(color,'color','');styleChange(bg,'backgroundColor','');styleChange(border,'borderWidth','px');styleChange(radius,'borderRadius','px');styleChange(padding,'padding','px');styleChange(margin,'margin','px');
    border.addEventListener('change',function(){if(selected&&Number(border.value)>0){selected.style.borderStyle='solid';upsert(selected.dataset.edit786Id,{styles:{borderStyle:'solid'}});}});
    toolbar.querySelector('[data-up]').addEventListener('click',function(){if(selected){var id=selected.dataset.edit786Id;applyOperation({id:id,action:'move-up'});action(id,'move-up');}});
    toolbar.querySelector('[data-down]').addEventListener('click',function(){if(selected){var id=selected.dataset.edit786Id;applyOperation({id:id,action:'move-down'});action(id,'move-down');}});
    toolbar.querySelector('[data-copy]').addEventListener('click',function(){if(selected){var id=selected.dataset.edit786Id;applyOperation({id:id,action:'duplicate'});action(id,'duplicate');}});
    toolbar.querySelector('[data-delete]').addEventListener('click',function(){if(selected){var id=selected.dataset.edit786Id;action(id,'delete');selected.remove();selected=null;}});
    setTimeout(applyAll,500);setTimeout(applyAll,1200);
    new MutationObserver(function(){assignIds();}).observe(document.getElementById('root'),{childList:true,subtree:true});
  })();<\/script>`
}

export function AdminChatVisualEditor() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname?.startsWith(ADMIN_CHAT_PATH)) return
    let disposed = false
    let saveTimer: number | undefined
    let operations: VisualOperation[] = []

    async function loadOperations() {
      const id = activeProjectId()
      if (!id) return
      try {
        const response = await fetch(`/api/786-admin/projects/${id}`, { cache: "no-store" })
        const json = await response.json()
        const saved = json?.project?.metadata?.visual_editor_operations
        if (Array.isArray(saved)) operations = saved as VisualOperation[]
      } catch {}
    }

    async function persist(next: VisualOperation[]) {
      const id = activeProjectId()
      if (!id) return
      operations = next.slice(0, 500)
      try {
        await fetch(`/api/786-admin/projects/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metadata: { visual_editor_operations: operations },
            revision_source: "visual-editor",
            revision_label: "Before visual editor update",
          }),
        })
      } catch {}
    }

    function patchFrame(frame: HTMLIFrameElement) {
      const source = frame.getAttribute("srcdoc") || frame.srcdoc || ""
      if (!source || source.includes(MARKER)) return
      const injected = runtimeScript(operations)
      const next = source.includes("</body>") ? source.replace("</body>", `${injected}</body>`) : `${source}${injected}`
      frame.srcdoc = next
    }

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "786-visual-editor-save" || !Array.isArray(event.data.operations)) return
      window.clearTimeout(saveTimer)
      saveTimer = window.setTimeout(() => void persist(event.data.operations as VisualOperation[]), 250)
    }

    const inspect = () => {
      if (disposed) return
      document.querySelectorAll<HTMLIFrameElement>('iframe[title*="preview" i]').forEach(patchFrame)
    }

    void loadOperations().then(inspect)
    window.addEventListener("message", onMessage)
    const observer = new MutationObserver(inspect)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["srcdoc"] })
    const interval = window.setInterval(inspect, 1200)

    return () => {
      disposed = true
      window.clearTimeout(saveTimer)
      window.clearInterval(interval)
      observer.disconnect()
      window.removeEventListener("message", onMessage)
    }
  }, [pathname])

  return null
}
