"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { upload } from "@vercel/blob/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Upload, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minus, Printer, Download, FileText, Image as ImageIcon } from "lucide-react";

const categories = [
  "SFBB / Safer Food Better Business",
  "Staff Certificates",
  "Food Hygiene Certificates",
  "Training Certificates",
  "Gas Certificate",
  "Electrical Certificate",
  "TR19 / Canopy / Extract Cleaning Certificate",
  "Waste / Oil Disposal Receipts",
  "Pest Control",
  "Insurance",
  "Equipment Certificates",
  "Other",
];

interface DocumentRecord {
  id: string;
  title: string;
  category: string;
  description: string;
  document_date: string | null;
  expiry_date: string | null;
  staff_member: string;
  certificate_reference: string;
  notes: string;
  file_name: string;
  file_type: string;
  file_size: number;
  blob_url: string;
  created_at: string;
}

interface StaffOption {
  value: string;
  option_type?: string;
  optionType?: string;
}

const emptyForm = {
  title: "",
  category: "",
  description: "",
  documentDate: "",
  expiryDate: "",
  staffMember: "",
  certificateReference: "",
  notes: "",
};

export function DocumentsView() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [staffOptions, setStaffOptions] = useState<string[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStaff, setFilterStaff] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [viewing, setViewing] = useState<DocumentRecord | null>(null);
  const [editing, setEditing] = useState<DocumentRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSession();
    fetchDocuments();
    fetchStaffOptions();
  }, []);

  async function fetchSession() {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const id = data?.user?.id;
      if (typeof id === "string" && id) setCurrentUserId(id);
    } catch {}
  }

  async function fetchDocuments() {
    try {
      const res = await fetch("/api/uploads");
      if (res.status === 401) {
        setAuthRequired(true);
        setDocuments([]);
        setError(null);
        return;
      }
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      setAuthRequired(false);
      setDocuments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStaffOptions() {
    try {
      const res = await fetch("/api/freezer-options");
      if (!res.ok) throw new Error("Failed to load staff options");
      const data = await res.json();
      const staff = data.filter((o: StaffOption) => (o.option_type ?? o.optionType) === "staff_name").map((o: StaffOption) => o.value);
      if (staff.length) setStaffOptions(staff);
    } catch (err: any) {
      console.error(err);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(selected.type)) {
      setError("File type not allowed. Please upload PDF, JPG, JPEG, or PNG.");
      return;
    }
    if (selected.size > 25 * 1024 * 1024) {
      setError("File too large. Maximum size is 25 MB.");
      return;
    }
    setFile(selected);
    setError(null);
  }

  async function readApiError(res: Response, fallback: string) {
    const text = await res.text();
    if (!text) return fallback;
    try {
      const data = JSON.parse(text);
      if (typeof data?.error === "string") return data.error;
      if (typeof data?.error?.message === "string") return data.error.message;
    } catch {}
    return `${fallback} (${res.status})`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (authRequired || !currentUserId) {
      setError("Please sign in before uploading documents.");
      return;
    }
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("File too large. Maximum size is 25 MB.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const pathname = `documents/${currentUserId}/${safeFilename}`;
      const blob = await upload(pathname, file, {
        access: "private",
        handleUploadUrl: "/api/uploads/client",
        multipart: true,
        contentType: file.type,
        onUploadProgress: ({ percentage }) => setUploadProgress(Math.round(percentage)),
      });

      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          blobUrl: blob.url,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "Failed to save document details"));
      }

      setForm({ ...emptyForm });
      setFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchDocuments();
    } catch (err: any) {
      setError(err?.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    try {
      const res = await fetch(`/api/uploads/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to update document");
      }
      setEditing(null);
      setForm({ ...emptyForm });
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    try {
      const res = await fetch(`/api/uploads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function getStatus(doc: DocumentRecord): { tone: "green" | "amber" | "red" | "blue"; label: string } {
    if (!doc.expiry_date) return { tone: "blue", label: "No Expiry" };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(doc.expiry_date + "T00:00:00");
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { tone: "red", label: "Expired" };
    if (diffDays <= 30) return { tone: "amber", label: "Expiring Soon" };
    return { tone: "green", label: "Valid" };
  }

  const filteredDocs = documents.filter((doc) => {
    if (search && !doc.title.toLowerCase().includes(search.toLowerCase()) && !doc.staff_member.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory && doc.category !== filterCategory) return false;
    if (filterStaff && doc.staff_member !== filterStaff) return false;
    if (filterStatus && getStatus(doc).label !== filterStatus) return false;
    if (filterDate && doc.document_date !== filterDate) return false;
    return true;
  });

  const staffList = Array.from(new Set([...staffOptions, ...documents.map((d) => d.staff_member).filter(Boolean)]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Documents</h1>

      {authRequired && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-100">
          <p className="font-semibold">Documents are protected.</p>
          <p className="mt-1 text-amber-200/80">Sign in before viewing or uploading certificates and compliance files.</p>
          <div className="mt-3 flex gap-3">
            <a href="/login?next=/documents" className="rounded bg-emerald-600 px-4 py-2 font-semibold text-white">Sign In</a>
            <a href="/register?next=/documents" className="rounded border border-slate-500 px-4 py-2 font-semibold text-slate-100">Create Account</a>
          </div>
        </div>
      )}

      {!authRequired && (
      <Card className="border-2 border-slate-600 bg-white text-slate-900">
        <CardContent className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">{editing ? "Edit Document" : "Upload Document"}</h2>
          {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
          <form onSubmit={editing ? handleEditSubmit : handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Document Title</label>
              <input name="title" value={form.title} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Category</label>
              <select name="category" value={form.category} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="">Select category</option>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="mb-1 text-sm font-semibold">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="rounded border-2 border-slate-400 px-3 py-2 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Document Date</label>
              <input name="documentDate" type="date" value={form.documentDate} onChange={handleChange} className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Expiry Date (if applicable)</label>
              <input name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Staff Member (if applicable)</label>
              <select name="staffMember" value={form.staffMember} onChange={handleChange} className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="">Select staff</option>
                {staffList.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Certificate / Reference Number</label>
              <input name="certificateReference" value={form.certificateReference} onChange={handleChange} className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            {!editing && (
              <div className="flex flex-col sm:col-span-2">
                <label className="mb-1 text-sm font-semibold">File Upload (PDF, JPG, JPEG, PNG - max 25 MB)</label>
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
                {file && <p className="mt-1 text-sm text-slate-500">{file.name} ({Math.round(file.size / 1024)} KB)</p>}
                {uploading && <p className="mt-1 text-sm font-semibold text-sky-600">Uploading directly to secure storage: {uploadProgress}%</p>}
              </div>
            )}
            <div className="flex flex-col sm:col-span-2">
              <label className="mb-1 text-sm font-semibold">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="rounded border-2 border-slate-400 px-3 py-2 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" disabled={uploading} className="h-11 cursor-pointer rounded bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
                {editing ? "Update Document" : uploading ? `Uploading ${uploadProgress}%` : "Upload Document"}
              </button>
              {editing && (
                <button type="button" onClick={() => { setEditing(null); setForm({ ...emptyForm }); }} className="h-11 cursor-pointer rounded bg-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-300">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      )}

      {documents.length > 0 && (
      <Card>
        <CardContent className="p-4">
          <h2 className="mb-3 text-lg font-bold">Uploaded Documents</h2>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or staff" className="h-10 w-full rounded border-2 border-slate-700 bg-slate-900 pl-9 pr-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none" />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="h-10 rounded border-2 border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none">
              <option value="">All Categories</option>
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)} className="h-10 rounded border-2 border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none">
              <option value="">All Staff</option>
              {staffList.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 rounded border-2 border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none">
              <option value="">All Statuses</option>
              <option value="Valid">Valid</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
              <option value="No Expiry">No Expiry</option>
            </select>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="h-10 rounded border-2 border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none" />
          </div>
          {loading ? (
            <p className="text-sm text-slate-400">Loading documents...</p>
          ) : filteredDocs.length === 0 ? (
            <p className="text-sm text-slate-400">No documents found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Staff</th>
                    <th className="px-4 py-3 font-medium">Document Date</th>
                    <th className="px-4 py-3 font-medium">Expiry Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">File Type</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredDocs.map((doc) => {
                    const status = getStatus(doc);
                    return (
                      <tr key={doc.id} className="text-slate-300">
                        <td className="px-4 py-3 font-medium text-slate-100">{doc.title}</td>
                        <td className="px-4 py-3">{doc.category}</td>
                        <td className="px-4 py-3">{doc.staff_member || "—"}</td>
                        <td className="px-4 py-3">{doc.document_date || "—"}</td>
                        <td className="px-4 py-3">{doc.expiry_date || "—"}</td>
                        <td className="px-4 py-3"><Badge tone={status.tone}>{status.label}</Badge></td>
                        <td className="px-4 py-3">{doc.file_type === "application/pdf" ? "PDF" : doc.file_type === "image/jpeg" ? "JPG" : "PNG"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => setViewing(doc)} className="cursor-pointer rounded bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400">View</button>
                            <button onClick={() => { setEditing(doc); setForm({ title: doc.title, category: doc.category, description: doc.description, documentDate: doc.document_date || "", expiryDate: doc.expiry_date || "", staffMember: doc.staff_member, certificateReference: doc.certificate_reference, notes: doc.notes }); }} className="cursor-pointer rounded bg-slate-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-400">Edit</button>
                            <button onClick={() => handleDelete(doc.id)} className="cursor-pointer rounded bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-400">Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {viewing && <DocumentViewer doc={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function DocumentViewer({ doc, onClose }: { doc: DocumentRecord; onClose: () => void }) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<"page" | "width">("page");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetch(`/api/uploads/${doc.id}`)
      .then((res) => res.json())
      .then((data) => setDownloadUrl(data.downloadUrl))
      .catch(console.error);
  }, [doc.id]);

  const isPdf = doc.file_type === "application/pdf";

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  const handleDownload = () => {
    if (downloadUrl) window.open(downloadUrl, "_blank");
  };

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const fitPage = () => { setFitMode("page"); setZoom(1); };
  const fitWidth = () => { setFitMode("width"); setZoom(1); };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <h3 className="text-sm font-semibold text-slate-200">{doc.title}</h3>
        <div className="flex items-center gap-2">
          {isPdf && (
            <>
              <button onClick={zoomOut} className="rounded p-2 text-slate-300 hover:bg-slate-800" aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></button>
              <span className="text-xs text-slate-400">{Math.round(zoom * 100)}%</span>
              <button onClick={zoomIn} className="rounded p-2 text-slate-300 hover:bg-slate-800" aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></button>
              <button onClick={fitPage} className="rounded p-2 text-slate-300 hover:bg-slate-800" aria-label="Fit page"><Minus className="h-4 w-4" /></button>
              <button onClick={fitWidth} className="rounded p-2 text-slate-300 hover:bg-slate-800" aria-label="Fit width"><Maximize className="h-4 w-4" /></button>
              <button onClick={handlePrint} className="rounded p-2 text-slate-300 hover:bg-slate-800" aria-label="Print"><Printer className="h-4 w-4" /></button>
            </>
          )}
          <button onClick={handleDownload} className="rounded p-2 text-slate-300 hover:bg-slate-800" aria-label="Download"><Download className="h-4 w-4" /></button>
          <button onClick={onClose} className="rounded p-2 text-slate-300 hover:bg-slate-800" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {isPdf ? (
          <div className="mx-auto flex h-full max-w-full flex-col items-center">
            <div className="mb-2 flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded p-1 text-slate-300 hover:bg-slate-800 disabled:opacity-30" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-xs text-slate-400">Page {page} of {numPages}</span>
              <button onClick={() => setPage((p) => Math.min(numPages, p + 1))} disabled={page >= numPages} className="rounded p-1 text-slate-300 hover:bg-slate-800 disabled:opacity-30" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <iframe
              ref={iframeRef}
              src={`${downloadUrl}#page=${page}&zoom=${zoom}`}
              className="h-full w-full rounded border border-slate-700 bg-white"
              style={{ maxWidth: fitMode === "page" ? "100%" : "100%" }}
              onLoad={(e) => {
                const iframe = e.target as HTMLIFrameElement;
                try {
                  const doc = iframe.contentDocument;
                  if (doc) {
                    const pdf = doc.querySelector("embed") as HTMLEmbedElement | null;
                    if (pdf) {
                      const pages = pdf.getAttribute("data-page-count");
                      if (pages) setNumPages(parseInt(pages));
                    }
                  }
                } catch {}
              }}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="rounded border border-slate-700 bg-white p-4 shadow-lg" style={{ maxWidth: "100%", maxHeight: "100%" }}>
              <img src={downloadUrl || ""} alt={doc.title} className="max-h-[80vh] max-w-full object-contain" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
