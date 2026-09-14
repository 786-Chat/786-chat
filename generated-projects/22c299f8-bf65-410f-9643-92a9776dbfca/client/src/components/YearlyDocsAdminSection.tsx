
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Calendar, Eye, FileText, Send, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Branch = { id: string; name?: string | null; status?: string | null };
type YearlyDoc = {
  id: string;
  title: string;
  filename: string;
  filepath: string;
  docType: string;
  fileSize?: number | null;
  mimeType?: string | null;
  viewSize?: string | null;
  branchId?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  sentAt?: string | null;
  createdAt?: string | null;
  adminDeleted?: boolean | null;
};

export default function YearlyDocsAdminSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<YearlyDoc | null>(null);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("yearly-contract");
  const [viewSize, setViewSize] = useState("A4");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const { data: yearlyDocs = [], isLoading } = useQuery<YearlyDoc[]>({
    queryKey: ["/api/yearly-docs"],
    queryFn: async () => {
      const res = await fetch("/api/yearly-docs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load yearly documents");
      return res.json();
    },
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches", "yearly-docs-admin"],
    queryFn: async () => {
      const res = await fetch("/api/branches?all=true", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load branches");
      const body = await res.json();
      return Array.isArray(body) ? body : Array.isArray(body?.branches) ? body.branches : [];
    },
  });

  const realBranches = useMemo(
    () => branches.filter((b) => String(b.name || "").trim().length > 0),
    [branches]
  );

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !title.trim() || !issueDate || !expiryDate) {
        throw new Error("Title, issue date, expiry date and file are required");
      }
      const form = new FormData();
      form.append("file", file);
      form.append("title", title.trim());
      form.append("docType", docType);
      form.append("viewSize", viewSize);
      form.append("issueDate", issueDate);
      form.append("expiryDate", expiryDate);
      const res = await fetch("/api/yearly-docs", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-docs"] });
      setShowUpload(false);
      setFile(null);
      setTitle("");
      setIssueDate("");
      setExpiryDate("");
      toast({ title: "Uploaded", description: "Yearly document uploaded successfully" });
    },
    onError: (error: any) => toast({ title: "Upload failed", description: error?.message || "Failed to upload yearly document", variant: "destructive" }),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDoc || !selectedBranch) throw new Error("Select a branch");
      const res = await fetch(`/api/yearly-docs/${selectedDoc.id}/send-to-branch`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId: selectedBranch }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      const branchName = realBranches.find((b) => b.id === selectedBranch)?.name || "branch";
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-docs"] });
      setShowSend(false);
      setSelectedDoc(null);
      setSelectedBranch("");
      toast({ title: "Sent", description: `Yearly document sent to ${branchName}` });
    },
    onError: (error: any) => toast({ title: "Send failed", description: error?.message || "Failed to send yearly document", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/yearly-docs/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-docs"] });
      toast({ title: "Deleted", description: "Yearly document removed from admin view" });
    },
    onError: (error: any) => toast({ title: "Delete failed", description: error?.message || "Failed to delete yearly document", variant: "destructive" }),
  });

  const visibleDocs = yearlyDocs.filter((doc) => !doc.adminDeleted);
  const branchName = (id?: string | null) => realBranches.find((b) => b.id === id)?.name || "Not assigned";

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain pr-1 pb-24 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
            <Archive className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-white">Yearly Documents</h2>
            <p className="text-emerald-300/80 text-sm">Upload annual documents and send them to a specific branch</p>
          </div>
        </div>
        <Button onClick={() => setShowUpload(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Upload className="h-4 w-4 mr-2" />Upload Yearly Document
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-14 text-slate-400">Loading yearly documents...</div>
      ) : visibleDocs.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 text-center py-16">
          <Archive className="h-14 w-14 text-slate-500 mx-auto mb-3" />
          <h3 className="text-white font-semibold">No yearly documents uploaded</h3>
          <p className="text-slate-400 text-sm mt-1">Upload the first yearly document to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleDocs.map((doc) => (
            <div key={doc.id} className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-800 to-slate-900 p-4 flex flex-col min-h-[300px]">
              <div className="flex items-start justify-between gap-2 mb-3">
                <Badge className={doc.branchId ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"}>
                  {doc.branchId ? "Sent" : "Uploaded"}
                </Badge>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-red-500/20" onClick={() => deleteMutation.mutate(doc.id)}>
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-5 mb-3">
                <FileText className="h-14 w-14 text-emerald-400 mb-2" />
                <div className="text-sm font-semibold text-emerald-200">{doc.viewSize || "A4"} Document</div>
                <div className="text-xs text-slate-400 mt-1">{doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(2)} MB` : ""}</div>
              </div>

              <h4 className="text-white font-semibold text-sm text-center line-clamp-2">{doc.title}</h4>
              <div className="text-center my-2">
                <span className="inline-flex px-2 py-1 rounded-full bg-green-500/15 text-green-300 text-xs">{branchName(doc.branchId)}</span>
              </div>
              <div className="text-xs text-slate-400 text-center space-y-1 mb-3">
                {doc.issueDate && <div><Calendar className="inline h-3 w-3 mr-1" />Issue: {new Date(doc.issueDate).toLocaleDateString("en-GB")}</div>}
                {doc.expiryDate && <div>Expiry: {new Date(doc.expiryDate).toLocaleDateString("en-GB")}</div>}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => window.open(doc.filepath, "_blank", "noopener,noreferrer")}>
                  <Eye className="h-4 w-4 mr-1" />View
                </Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setSelectedDoc(doc); setSelectedBranch(doc.branchId || ""); setShowSend(true); }}>
                  <Send className="h-4 w-4 mr-1" />Send
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-3" onMouseDown={(e) => { if (e.currentTarget === e.target) setShowUpload(false); }}>
          <div className="w-full max-w-2xl max-h-[calc(100vh-24px)] overflow-y-auto rounded-2xl bg-slate-800 border border-slate-600 shadow-2xl">
            <div className="sticky top-0 z-10 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
              <div><h3 className="text-lg font-bold text-white">Upload Yearly Document</h3><p className="text-sm text-slate-400">PDF, DOC, XLS or image documents</p></div>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setShowUpload(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-4 space-y-4">
              <div><label className="text-sm text-slate-300">Document Title</label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 bg-slate-900 border-slate-600 text-white" placeholder="Enter document title" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="text-sm text-slate-300">Document Type</label><select value={docType} onChange={(e) => setDocType(e.target.value)} className="mt-1 w-full h-10 rounded-md bg-slate-900 border border-slate-600 text-white px-3"><option value="yearly-contract">Yearly Contract</option><option value="yearly-membership-certificate">Membership Certificate</option><option value="guideline-chart-3d">Guideline Chart 3D</option><option value="annual-report">Annual Report</option><option value="general">General</option></select></div>
                <div><label className="text-sm text-slate-300">View Size</label><select value={viewSize} onChange={(e) => setViewSize(e.target.value)} className="mt-1 w-full h-10 rounded-md bg-slate-900 border border-slate-600 text-white px-3"><option value="A4">A4</option><option value="A5">A5</option></select></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label className="text-sm text-slate-300">Issue Date</label><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="mt-1 bg-slate-900 border-slate-600 text-white" /></div><div><label className="text-sm text-slate-300">Expiry Date</label><Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="mt-1 bg-slate-900 border-slate-600 text-white" /></div></div>
              <div><label className="text-sm text-slate-300">Upload File</label><input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.svg" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full rounded-xl border border-dashed border-slate-500 bg-slate-900/60 p-5 text-sm text-slate-300" />{file && <div className="mt-2 rounded-lg bg-slate-700 p-3 text-sm text-white">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</div>}</div>
            </div>
            <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700" disabled={uploadMutation.isPending || !file || !title.trim() || !issueDate || !expiryDate} onClick={() => uploadMutation.mutate()}>{uploadMutation.isPending ? "Uploading..." : "Upload Document"}</Button></div>
          </div>
        </div>
      )}

      {showSend && selectedDoc && (
        <div className="fixed inset-0 z-[210] bg-black/70 flex items-center justify-center p-3" onMouseDown={(e) => { if (e.currentTarget === e.target) setShowSend(false); }}>
          <div className="w-full max-w-lg rounded-2xl bg-slate-800 border border-slate-600 shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4"><div><h3 className="text-lg font-bold text-emerald-300">Send Yearly Document to Branch</h3><p className="text-sm text-slate-400">{selectedDoc.title}</p></div><Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setShowSend(false)}><X className="h-4 w-4" /></Button></div>
            <label className="text-sm text-slate-300">Select Branch</label>
            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="mt-1 w-full h-11 rounded-md bg-slate-900 border border-slate-600 text-white px-3"><option value="">Choose a branch...</option>{realBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
            <div className="flex justify-end gap-2 mt-5"><Button variant="outline" onClick={() => setShowSend(false)}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700" disabled={!selectedBranch || sendMutation.isPending} onClick={() => sendMutation.mutate()}><Send className="h-4 w-4 mr-2" />{sendMutation.isPending ? "Sending..." : "Send Document"}</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
