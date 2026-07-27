"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ADMIN_CHAT_PATH = "/786-admin/chat"
const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const MARKER = "data-786-visual-editor-runtime"

type VisualOperation = {
  id: string
  opId?: string
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

function stripRuntime(source: string): string {
  return source.replace(
    /<script\s+data-786-visual-editor-runtime="true"[^>]*>[\s\S]*?<\/script>/gi,
    "",
  )
}

function runtimeScript(projectId: string, operations: VisualOperation[]): string {
  const safeProjectId = JSON.stringify(projectId).replace(/</g, "\\u003c")
  const saved = JSON.stringify(operations).replace(/</g, "\\u003c")

  return `<script ${MARKER}="true" data-project-id=${safeProjectId}>(function(){
    if(window.__786VisualOperationsInstalled)return;
    window.__786VisualOperationsInstalled=true;
    var operations=${saved}.map(function(op,index){
      if(!op.opId)op.opId='legacy-'+index+'-'+String(op.id||'');
      return op;
    });
    var applyTimer=0;

    function editableNodes(){
      var root=document.getElementById('root');
      if(!root)return [];
      return Array.prototype.slice.call(root.querySelectorAll('*')).filter(function(node){
        return node instanceof HTMLElement && !['SCRIPT','STYLE','LINK','META'].includes(node.tagName);
      });
    }

    function stablePath(node){
      if(node.id)return 'id:'+node.id;
      var root=document.getElementById('root');
      var parts=[];
      var current=node;
      while(current&&current!==root){
        var tag=current.tagName.toLowerCase();
        var parent=current.parentElement;
        if(!parent)break;
        var same=Array.prototype.filter.call(parent.children,function(child){return child.tagName===current.tagName;});
        parts.unshift(tag+':nth-of-type('+(same.indexOf(current)+1)+')');
        current=parent;
      }
      return 'path:'+parts.join('>');
    }

    function assignIds(){
      editableNodes().forEach(function(node){
        if(!node.dataset.edit786Id)node.dataset.edit786Id=stablePath(node);
      });
    }

    function find(id){
      var nodes=editableNodes();
      for(var i=0;i<nodes.length;i++)if(nodes[i].dataset.edit786Id===id)return nodes[i];
      return null;
    }

    function applied(node,opId){
      return (node.dataset.applied786Ops||'').split(',').indexOf(opId)>=0;
    }

    function markApplied(node,opId){
      var values=(node.dataset.applied786Ops||'').split(',').filter(Boolean);
      if(values.indexOf(opId)<0)values.push(opId);
      node.dataset.applied786Ops=values.slice(-100).join(',');
    }

    function applyOperation(op){
      var node=find(op.id);
      if(!node)return;
      if(op.styles)Object.keys(op.styles).forEach(function(key){node.style[key]=op.styles[key];});
      if(typeof op.text==='string'&&node.children.length===0)node.textContent=op.text;
      if(!op.action)return;
      var opId=op.opId||('action-'+op.action+'-'+op.id);
      if(applied(node,opId))return;
      if(op.action==='move-up'&&node.previousElementSibling){node.parentElement.insertBefore(node,node.previousElementSibling);markApplied(node,opId);}
      if(op.action==='move-down'&&node.nextElementSibling){node.parentElement.insertBefore(node.nextElementSibling,node);markApplied(node,opId);}
      if(op.action==='duplicate'){
        var copyId=op.id+'__copy__'+opId;
        if(!find(copyId)){
          var copy=node.cloneNode(true);
          copy.dataset.edit786Id=copyId;
          copy.removeAttribute('data-applied786-ops');
          node.parentElement.insertBefore(copy,node.nextElementSibling);
        }
        markApplied(node,opId);
      }
      if(op.action==='delete')node.remove();
    }

    function applyAll(){assignIds();operations.forEach(applyOperation);assignIds();}
    function scheduleApply(){clearTimeout(applyTimer);applyTimer=setTimeout(applyAll,80);}
    applyAll();
    setTimeout(applyAll,300);
    setTimeout(applyAll,900);
    var root=document.getElementById('root');
    if(root)new MutationObserver(scheduleApply).observe(root,{childList:true,subtree:true});
  })();<\/script>`
}

export function AdminChatVisualEditor() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname?.startsWith(ADMIN_CHAT_PATH)) return

    let disposed = false
    let loadedProjectId = ""
    let operations: VisualOperation[] = []
    let loadingProject: Promise<void> | null = null

    async function loadOperations(projectId: string) {
      if (!projectId) {
        loadedProjectId = ""
        operations = []
        return
      }
      try {
        const response = await fetch(`/api/786-admin/projects/${projectId}`, { cache: "no-store" })
        const json = await response.json()
        if (disposed || projectId !== activeProjectId()) return
        const saved = json?.project?.metadata?.visual_editor_operations
        operations = Array.isArray(saved) ? (saved as VisualOperation[]) : []
        loadedProjectId = projectId
      } catch {
        if (!disposed && projectId === activeProjectId()) {
          operations = []
          loadedProjectId = projectId
        }
      }
    }

    async function ensureCurrentProjectLoaded() {
      const projectId = activeProjectId()
      if (projectId === loadedProjectId) return
      if (!loadingProject) {
        loadingProject = loadOperations(projectId).finally(() => { loadingProject = null })
      }
      await loadingProject
    }

    function patchFrame(frame: HTMLIFrameElement) {
      const projectId = activeProjectId()
      if (!projectId || projectId !== loadedProjectId) return
      const source = frame.getAttribute("srcdoc") || frame.srcdoc || ""
      if (!source) return
      const marker = `data-project-id=${JSON.stringify(projectId)}`
      if (source.includes(MARKER) && source.includes(marker)) return
      const cleanSource = stripRuntime(source)
      const injected = runtimeScript(projectId, operations)
      frame.srcdoc = cleanSource.includes("</body>")
        ? cleanSource.replace("</body>", `${injected}</body>`)
        : `${cleanSource}${injected}`
    }

    const inspect = async () => {
      if (disposed) return
      await ensureCurrentProjectLoaded()
      if (disposed) return
      document.querySelectorAll<HTMLIFrameElement>('iframe[title*="preview" i]').forEach(patchFrame)
    }

    void inspect()
    const observer = new MutationObserver(() => { void inspect() })
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["srcdoc"] })
    const timer = window.setInterval(() => { void inspect() }, 700)

    return () => {
      disposed = true
      observer.disconnect()
      window.clearInterval(timer)
    }
  }, [pathname])

  return null
}
