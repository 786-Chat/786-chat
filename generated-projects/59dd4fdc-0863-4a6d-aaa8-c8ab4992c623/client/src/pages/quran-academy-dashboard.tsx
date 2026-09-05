import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, Users, GraduationCap, LogOut, Menu, X, BarChart3, Clock, AlertTriangle, Star, ChevronRight, Phone, Mail, User, ExternalLink, Hash, BookMarked, Heart, Shield, HandHeart, Sparkles, Droplets, Volume2, ZoomIn, ZoomOut, Moon, Sun } from "lucide-react";
import { sixKalimas, noraniQaidaLessons, essentialDuas, imanAndNiyyat, masnoonDuas, imanKaBiyan, wuzuKaBiyan, ghusulKaBiyan, tayammumKaBiyan, namazKaBiyan, azanKaBiyan, azkarNamaz, namazKaTariqa, namazWitr, faraizNamaz, sajdaSahw, namazQasr, eidainKaBiyan, sajdaTilawat, taraweehKaBiyan, namazJanaza } from "@/lib/islamic-content";

export default function QuranAcademyDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const academyId = localStorage.getItem("quranAcademyId");
  const academyName = localStorage.getItem("quranAcademyName");
  const [activeTab, setActiveTab] = useState("students");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const ZoomControls = () => (
    <div className="flex items-center gap-2 mb-4 justify-end">
      <button onClick={() => setZoomLevel(z => Math.max(0.7, z - 0.1))} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white" data-testid="button-zoom-out"><ZoomOut className="h-4 w-4" /></button>
      <span className="text-emerald-300/70 text-xs min-w-[3rem] text-center">{Math.round(zoomLevel * 100)}%</span>
      <button onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white" data-testid="button-zoom-in"><ZoomIn className="h-4 w-4" /></button>
      <button onClick={() => setZoomLevel(1)} className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300/70 text-xs">Reset</button>
    </div>
  );
  const [editStudent, setEditStudent] = useState<any>(null);
  const [studentForm, setStudentForm] = useState({
    name: "", phone: "", email: "", age: "", academyId: "",
    loginUsername: "", loginPassword: "", wearsGlasses: false,
    country: "UK", school: "", sessionDuration: "30", classTime: "",
  });

  useEffect(() => {
    if (!academyId) setLocation("/quran-academy-login");
  }, [academyId]);

  const { data: students = [] } = useQuery({
    queryKey: ["/api/quran/academies", academyId, "students"],
    queryFn: () => fetch(`/api/quran/academies/${academyId}/students`).then(r => r.json()),
    enabled: !!academyId,
  });

  const createStudent = useMutation({
    mutationFn: (data: any) => fetch("/api/quran/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/quran/academies", academyId, "students"] }); setShowStudentForm(false); toast({ title: "Student added!" }); },
  });

  const updateStudent = useMutation({
    mutationFn: ({ id, ...data }: any) => fetch(`/api/quran/students/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/quran/academies", academyId, "students"] }); setEditStudent(null); setShowStudentForm(false); toast({ title: "Student updated!" }); },
  });

  const deleteStudent = useMutation({
    mutationFn: (id: string) => fetch(`/api/quran/students/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/quran/academies", academyId, "students"] }); toast({ title: "Student removed!" }); },
  });

  const handleLogout = () => {
    localStorage.removeItem("quranAcademyId");
    localStorage.removeItem("quranAcademyName");
    localStorage.removeItem("quranAcademySlug");
    setLocation("/quran-academy-login");
  };

  const activeStudents = students.filter((s: any) => s.isActive);
  const totalSessions = students.reduce((sum: number, s: any) => sum + (s.sessionsCompleted || 0), 0);
  const totalMistakes = students.reduce((sum: number, s: any) => sum + (s.totalMistakes || 0), 0);

  const tabs = [
    { id: "students", label: "Students", icon: Users },
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "kalimas", label: "6 Kalimas", icon: Hash },
    { id: "qaida", label: "Norani Qaida", icon: BookMarked },
    { id: "iman", label: "Iman & Niyyat", icon: Shield },
    { id: "duas", label: "Essential Duas", icon: Heart },
    { id: "masnoon", label: "40 Masnoon Duas", icon: HandHeart },
    { id: "imanbiyan", label: "Iman ka Biyan", icon: Sparkles },
    { id: "wuzu", label: "Wuzu", icon: Droplets },
    { id: "ghusul", label: "Ghusul", icon: Droplets },
    { id: "tayammum", label: "Tayammum", icon: Droplets },
    { id: "namaz", label: "Namaz ka Biyan", icon: Moon },
    { id: "azan", label: "Azan & Iqamah", icon: Volume2 },
    { id: "azkar", label: "Azkar-e-Namaz", icon: BookOpen },
    { id: "tariqa", label: "Namaz Tariqa", icon: BookMarked },
    { id: "witr", label: "Witr & Qunoot", icon: Moon },
    { id: "faraiz", label: "Faraiz Namaz", icon: Shield },
    { id: "sajdasahw", label: "Sajda Sahw", icon: Star },
    { id: "qasr", label: "Namaz Qasr", icon: Star },
    { id: "eidain", label: "Eidain", icon: Star },
    { id: "sajdatilawat", label: "Sajda Tilawat", icon: BookOpen },
    { id: "taraweeh", label: "Taraweeh", icon: Moon },
    { id: "janaza", label: "Namaz Janaza", icon: Heart },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">{academyName}</h2>
            <p className="text-emerald-400/50 text-xs">Quran Academy</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${activeTab === t.id ? "bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/10" : "text-emerald-300/50 hover:bg-white/5 hover:text-emerald-300"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
        <button onClick={() => setLocation("/quran-reader")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-amber-300/70 hover:bg-amber-500/10 hover:text-amber-300 transition-all">
          <BookOpen className="h-4 w-4" /> Open Quran Reader
        </button>
      </nav>
      <div className="p-4 border-t border-emerald-500/20">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-300/50 hover:bg-red-500/10 hover:text-red-300 transition-all">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #071e12 0%, #0a2e1a 50%, #071e12 100%)" }}>
      <div className="hidden md:block w-64 border-r border-emerald-500/10 bg-black/20 backdrop-blur-sm">
        <SidebarContent />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-emerald-950/95 backdrop-blur-xl border-r border-emerald-500/20 shadow-2xl">
            <div className="absolute right-3 top-3">
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-white"><X className="h-5 w-5" /></button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="sticky top-0 z-40 bg-black/30 backdrop-blur-md border-b border-emerald-500/10 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-white">{tabs.find(t => t.id === activeTab)?.label || "Students"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setLocation("/quran-reader")} className="bg-amber-600/80 hover:bg-amber-600 text-white text-xs hidden sm:flex" data-testid="button-open-reader">
              <BookOpen className="h-3.5 w-3.5 mr-1" /> Quran Reader
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Students", value: students.length, icon: Users, color: "emerald" },
                  { label: "Active", value: activeStudents.length, icon: GraduationCap, color: "green" },
                  { label: "Sessions", value: totalSessions, icon: Clock, color: "amber" },
                  { label: "Total Mistakes", value: totalMistakes, icon: AlertTriangle, color: "red" },
                ].map((s, i) => (
                  <Card key={i} className="bg-white/5 border-emerald-500/10 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-${s.color}-500/20 flex items-center justify-center`}>
                          <s.icon className={`h-5 w-5 text-${s.color}-400`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{s.value}</p>
                          <p className="text-emerald-300/50 text-xs">{s.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-white/5 border-emerald-500/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Student Progress</h3>
                  <div className="space-y-3">
                    {students.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-emerald-500/10">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <User className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{s.name}</p>
                            <p className="text-emerald-300/50 text-xs">Juz {s.currentJuz} · Surah {s.currentSurah}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-amber-400 text-sm font-bold">{s.sessionsCompleted || 0} sessions</p>
                          <p className="text-red-400/60 text-xs">{s.totalMistakes || 0} mistakes</p>
                        </div>
                      </div>
                    ))}
                    {students.length === 0 && <p className="text-emerald-300/40 text-center py-8">No students yet</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "students" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-emerald-300/50 text-sm">{students.length} students</p>
                <Button onClick={() => { setEditStudent(null); setStudentForm({ name: "", phone: "", email: "", age: "", academyId: academyId || "", loginUsername: "", loginPassword: "", wearsGlasses: false, country: "UK", school: "", sessionDuration: "30", classTime: "" }); setShowStudentForm(true); }} className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-add-student">
                  <Plus className="h-4 w-4 mr-2" /> Add Student
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((s: any) => (
                  <Card key={s.id} className="bg-white/5 border-emerald-500/10 backdrop-blur-sm hover:border-emerald-400/30 transition-all group" data-testid={`card-student-${s.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/30 to-amber-500/30 flex items-center justify-center border border-emerald-500/20">
                            <User className="h-6 w-6 text-emerald-300" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white">{s.name}</h3>
                            {s.age && <p className="text-emerald-300/50 text-xs">Age: {s.age}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setLocation(`/quran-student-dashboard?sid=${s.id}`)} className="w-7 h-7 rounded-full bg-blue-500/20 hover:bg-blue-500/30 flex items-center justify-center transition-colors" title="View Student Portal" data-testid={`button-student-portal-${s.id}`}>
                            <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
                          </button>
                          <div className={`px-2 py-1 rounded-full text-xs ${s.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                            {s.isActive ? "Active" : "Inactive"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-4">
                        {s.phone && <div className="flex items-center gap-2 text-emerald-300/50 text-xs"><Phone className="h-3 w-3" />{s.phone}</div>}
                        {s.email && <div className="flex items-center gap-2 text-emerald-300/50 text-xs"><Mail className="h-3 w-3" />{s.email}</div>}
                        {s.school && <div className="flex items-center gap-2 text-emerald-300/50 text-xs"><GraduationCap className="h-3 w-3" />{s.school}</div>}
                        {s.classTime && <div className="flex items-center gap-2 text-emerald-300/50 text-xs"><Clock className="h-3 w-3" />{s.classTime} · {s.sessionDuration || "30"} min</div>}
                        {s.wearsGlasses && <div className="flex items-center gap-2 text-amber-300/50 text-xs"><AlertTriangle className="h-3 w-3" />Wears glasses</div>}
                        {s.loginUsername && <div className="flex items-center gap-2 text-blue-300/50 text-xs"><User className="h-3 w-3" />Login: {s.loginUsername}</div>}
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-xl bg-black/20 border border-emerald-500/10">
                        <div className="text-center">
                          <p className="text-amber-400 text-lg font-bold">{s.currentJuz || 1}</p>
                          <p className="text-emerald-300/40 text-[10px]">Juz</p>
                        </div>
                        <div className="text-center border-x border-emerald-500/10">
                          <p className="text-emerald-300 text-lg font-bold">{s.sessionsCompleted || 0}</p>
                          <p className="text-emerald-300/40 text-[10px]">Sessions</p>
                        </div>
                        <div className="text-center">
                          <p className="text-red-400 text-lg font-bold">{s.totalMistakes || 0}</p>
                          <p className="text-emerald-300/40 text-[10px]">Mistakes</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-emerald-600/80 hover:bg-emerald-600 text-xs" onClick={() => setLocation(`/quran-reader?student=${s.id}`)} data-testid={`button-start-session-${s.id}`}>
                          <BookOpen className="h-3 w-3 mr-1" /> Start Session
                        </Button>
                        <Button size="sm" variant="outline" className="border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10 text-xs" onClick={() => { setEditStudent(s); setStudentForm({ name: s.name, phone: s.phone || "", email: s.email || "", age: s.age?.toString() || "", academyId: academyId || "", loginUsername: s.loginUsername || "", loginPassword: s.loginPassword || "", wearsGlasses: s.wearsGlasses || false, country: s.country || "UK", school: s.school || "", sessionDuration: s.sessionDuration || "30", classTime: s.classTime || "" }); setShowStudentForm(true); }}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500/20 text-red-300 hover:bg-red-500/10 text-xs" onClick={() => { if (confirm("Remove this student?")) deleteStudent.mutate(s.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {students.length === 0 && (
                <div className="text-center py-20 text-emerald-300/40">
                  <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No students yet</p>
                  <p className="text-sm">Add your first student to begin Quran sessions</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "kalimas" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-amber-400 mb-1" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>شَش کَلِمَے</h2>
                <p className="text-emerald-300/50 text-sm">The Six Kalimas of Islam</p>
              </div>
              {sixKalimas.map((k) => (
                <Card key={k.number} className="bg-white/5 border-emerald-500/10 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-emerald-600/30 to-amber-600/20 px-5 py-3 border-b border-emerald-500/10 flex items-center justify-between">
                      <div>
                        <h3 className="text-amber-300 font-bold text-lg" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }} dir="rtl">{k.nameAr}</h3>
                        <p className="text-emerald-300/60 text-xs">{k.nameEn}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <span className="text-amber-400 font-bold text-lg">{k.number}</span>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="text-center py-4 px-3 rounded-xl bg-black/20 border border-emerald-500/10">
                                                <p className="text-white text-2xl sm:text-3xl leading-loose" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.2" }}>{k.arabic}</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-emerald-300/70 italic">{k.transliteration}</p>
                        <p className="text-emerald-300/50">{k.translation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "qaida" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-amber-400 mb-1" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>نُوْرَانِی قَاعِدَہ</h2>
                <p className="text-emerald-300/50 text-sm">Norani Qaida - Basic Quranic Reading</p>
              </div>
              {noraniQaidaLessons.map((lesson) => (
                <Card key={lesson.number} className="bg-white/5 border-emerald-500/10 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-emerald-600/30 to-emerald-500/10 px-5 py-3 border-b border-emerald-500/10 flex items-center justify-between">
                      <div>
                        <h3 className="text-emerald-300 font-bold" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }} dir="rtl">{lesson.nameAr}</h3>
                        <p className="text-emerald-300/50 text-xs">Lesson {lesson.number}: {lesson.nameEn}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <span className="text-emerald-400 font-bold">{lesson.number}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="text-center py-6 px-4 rounded-xl bg-black/20 border border-emerald-500/10">
                        <p className="text-white text-2xl sm:text-3xl leading-loose" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.5", wordSpacing: "12px" }}>{lesson.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "iman" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-amber-400 mb-1" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>اِیْمَان و نِیَّت</h2>
                <p className="text-emerald-300/50 text-sm">Iman (Faith) & Niyyat (Intentions)</p>
              </div>
              {imanAndNiyyat.map((item, i) => (
                <Card key={i} className="bg-white/5 border-emerald-500/10 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-emerald-600/30 to-amber-600/20 px-5 py-3 border-b border-emerald-500/10">
                      <h3 className="text-amber-300 font-bold text-lg" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }} dir="rtl">{item.nameAr}</h3>
                      <p className="text-emerald-300/60 text-xs">{item.nameEn}</p>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="text-center py-4 px-3 rounded-xl bg-black/20 border border-emerald-500/10">
                                                <p className="text-white text-2xl sm:text-3xl leading-loose" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.2" }}>{item.arabic}</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-emerald-300/70 italic">{item.transliteration}</p>
                        <p className="text-emerald-300/50">{item.translation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "duas" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-amber-400 mb-1" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>ضَرُوْرِی دُعَائیں</h2>
                <p className="text-emerald-300/50 text-sm">Essential Daily Duas</p>
              </div>
              {essentialDuas.map((dua, i) => (
                <Card key={i} className="bg-white/5 border-emerald-500/10 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-amber-600/20 to-emerald-600/10 px-5 py-3 border-b border-emerald-500/10">
                      <h3 className="text-amber-300 font-bold" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }} dir="rtl">{dua.nameAr}</h3>
                      <p className="text-emerald-300/50 text-xs">{dua.nameEn}</p>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="text-center py-4 px-3 rounded-xl bg-black/20 border border-emerald-500/10">
                                                <p className="text-white text-2xl sm:text-3xl leading-loose" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.2" }}>{dua.arabic}</p>
                      </div>
                      <p className="text-emerald-300/50 text-sm text-center">{dua.translation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "masnoon" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-amber-400 mb-1" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>چَالِیس مَسْنُوْن دُعَائیں</h2>
                <p className="text-emerald-300/50 text-sm">40 Masnoon Duas - From Aasan Namaz</p>
              </div>
              {masnoonDuas.map((dua) => (
                <Card key={dua.number} className="bg-white/5 border-emerald-500/10 backdrop-blur-sm overflow-hidden" data-testid={`card-masnoon-dua-${dua.number}`}>
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-teal-600/30 to-amber-600/15 px-5 py-3 border-b border-emerald-500/10 flex items-center justify-between">
                      <div>
                        <h3 className="text-amber-300 font-bold text-lg" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }} dir="rtl">{dua.nameAr}</h3>
                        <p className="text-emerald-300/60 text-xs">{dua.nameEn}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-teal-400 font-bold text-lg">{dua.number}</span>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="text-center py-4 px-3 rounded-xl bg-black/20 border border-emerald-500/10">
                                                <p className="text-white text-2xl sm:text-3xl leading-loose whitespace-pre-line" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.2" }}>{dua.arabic}</p>
                      </div>
                      <p className="text-emerald-300/50 text-sm text-center">{dua.translation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "imanbiyan" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-amber-400 mb-1" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>اِیْمَان کَا بَیَان</h2>
                <p className="text-emerald-300/50 text-sm">Iman ka Biyan - Statement of Faith</p>
              </div>
              {imanKaBiyan.map((item) => (
                <Card key={item.number} className="bg-white/5 border-emerald-500/10 backdrop-blur-sm overflow-hidden" data-testid={`card-iman-biyan-${item.number}`}>
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-purple-600/25 to-amber-600/15 px-5 py-3 border-b border-emerald-500/10 flex items-center justify-between">
                      <div>
                        <h3 className="text-amber-300 font-bold text-lg" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }} dir="rtl">{item.nameAr}</h3>
                        <p className="text-emerald-300/60 text-xs">{item.nameEn}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-400 font-bold text-lg">{item.number}</span>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      {item.arabic && (
                        <div className="text-center py-4 px-3 rounded-xl bg-black/20 border border-emerald-500/10">
                                                    <p className="text-white text-2xl sm:text-3xl leading-loose whitespace-pre-line" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.2" }}>{item.arabic}</p>
                        </div>
                      )}
                      <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                        <p className="text-emerald-200/80 text-sm whitespace-pre-line leading-relaxed" dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', serif", lineHeight: "2" }}>{item.content}</p>
                      </div>
                      <p className="text-emerald-300/50 text-sm whitespace-pre-line">{item.translation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "wuzu" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-amber-400 mb-1" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>وُضُو کَا بَیَان</h2>
                <p className="text-emerald-300/50 text-sm">Wudhu - Ablution (Taharat & Method)</p>
              </div>
              {wuzuKaBiyan.map((item) => (
                <Card key={item.number} className="bg-white/5 border-emerald-500/10 backdrop-blur-sm overflow-hidden" data-testid={`card-wuzu-${item.number}`}>
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-sky-600/25 to-emerald-600/15 px-5 py-3 border-b border-emerald-500/10 flex items-center justify-between">
                      <div>
                        <h3 className="text-amber-300 font-bold text-lg" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }} dir="rtl">{item.nameAr}</h3>
                        <p className="text-emerald-300/60 text-xs">{item.nameEn}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sky-400 font-bold text-lg">{item.number}</span>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      {item.arabic && (
                        <div className="text-center py-4 px-3 rounded-xl bg-black/20 border border-emerald-500/10">
                                                    <p className="text-white text-2xl sm:text-3xl leading-loose whitespace-pre-line" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.2" }}>{item.arabic}</p>
                        </div>
                      )}
                      <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/10">
                        <p className="text-emerald-200/80 text-sm whitespace-pre-line leading-relaxed" dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', serif", lineHeight: "2" }}>{item.content}</p>
                      </div>
                      <p className="text-emerald-300/50 text-sm whitespace-pre-line">{item.translation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "ghusul" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-amber-400 mb-1" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>غُسْل کَا بَیَان</h2>
                <p className="text-emerald-300/50 text-sm">Ghusl - Ritual Bath (Method & Rules)</p>
              </div>
              {ghusulKaBiyan.map((item) => (
                <Card key={item.number} className="bg-white/5 border-emerald-500/10 backdrop-blur-sm overflow-hidden" data-testid={`card-ghusul-${item.number}`}>
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-cyan-600/25 to-emerald-600/15 px-5 py-3 border-b border-emerald-500/10 flex items-center justify-between">
                      <div>
                        <h3 className="text-amber-300 font-bold text-lg" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }} dir="rtl">{item.nameAr}</h3>
                        <p className="text-emerald-300/60 text-xs">{item.nameEn}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-cyan-400 font-bold text-lg">{item.number}</span>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      {item.arabic && (
                        <div className="text-center py-4 px-3 rounded-xl bg-black/20 border border-emerald-500/10">
                                                    <p className="text-white text-2xl sm:text-3xl leading-loose whitespace-pre-line" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.2" }}>{item.arabic}</p>
                        </div>
                      )}
                      <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                        <p className="text-emerald-200/80 text-sm whitespace-pre-line leading-relaxed" dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', serif", lineHeight: "2" }}>{item.content}</p>
                      </div>
                      <p className="text-emerald-300/50 text-sm whitespace-pre-line">{item.translation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {(() => {
            const contentSections: Record<string, { title: string; titleAr: string; subtitle: string; data: any[]; gradient: string; badgeBg: string; badgeText: string; contentBg: string; contentBorder: string }> = {
              tayammum: { title: "Tayammum", titleAr: "تَیَمُّم کَا بَیَان", subtitle: "Dry Ablution (Method & Rules)", data: tayammumKaBiyan, gradient: "from-amber-600/25 to-orange-600/15", badgeBg: "bg-amber-500/20", badgeText: "text-amber-400", contentBg: "bg-amber-500/5", contentBorder: "border-amber-500/10" },
              namaz: { title: "Namaz ka Biyan", titleAr: "نَمَاز کَا بَیَان", subtitle: "Prayer - Importance, Rakaat & Niyyat", data: namazKaBiyan, gradient: "from-emerald-600/25 to-yellow-600/15", badgeBg: "bg-yellow-500/20", badgeText: "text-yellow-400", contentBg: "bg-yellow-500/5", contentBorder: "border-yellow-500/10" },
              azan: { title: "Azan & Iqamah", titleAr: "اَذَان و اِقَامَت", subtitle: "Call to Prayer & Second Call", data: azanKaBiyan, gradient: "from-purple-600/25 to-violet-600/15", badgeBg: "bg-purple-500/20", badgeText: "text-purple-400", contentBg: "bg-purple-500/5", contentBorder: "border-purple-500/10" },
              azkar: { title: "Azkar-e-Namaz", titleAr: "اَذْکَارِ نَمَاز", subtitle: "All Recitations in Prayer", data: azkarNamaz, gradient: "from-blue-600/25 to-sky-600/15", badgeBg: "bg-blue-500/20", badgeText: "text-blue-400", contentBg: "bg-blue-500/5", contentBorder: "border-blue-500/10" },
              tariqa: { title: "Namaz ka Tariqa", titleAr: "نَمَاز کَا طَرِیقَہ", subtitle: "Step-by-Step Method & Gender Differences", data: namazKaTariqa, gradient: "from-teal-600/25 to-emerald-600/15", badgeBg: "bg-teal-500/20", badgeText: "text-teal-400", contentBg: "bg-teal-500/5", contentBorder: "border-teal-500/10" },
              witr: { title: "Witr & Dua-e-Qunoot", titleAr: "نَمَاز وِتر و دُعَائے قُنُوت", subtitle: "Witr Prayer & Its Special Dua", data: namazWitr, gradient: "from-rose-600/25 to-pink-600/15", badgeBg: "bg-rose-500/20", badgeText: "text-rose-400", contentBg: "bg-rose-500/5", contentBorder: "border-rose-500/10" },
              faraiz: { title: "Faraiz & Ahkaam Namaz", titleAr: "فَرَائِض و اَحکَامِ نَمَاز", subtitle: "Obligations, Necessities, Sunnats & Disliked Acts", data: faraizNamaz, gradient: "from-indigo-600/25 to-blue-600/15", badgeBg: "bg-indigo-500/20", badgeText: "text-indigo-400", contentBg: "bg-indigo-500/5", contentBorder: "border-indigo-500/10" },
              sajdasahw: { title: "Sajda Sahw", titleAr: "سَجْدَہ سَہو", subtitle: "Prostration of Forgetfulness", data: sajdaSahw, gradient: "from-orange-600/25 to-amber-600/15", badgeBg: "bg-orange-500/20", badgeText: "text-orange-400", contentBg: "bg-orange-500/5", contentBorder: "border-orange-500/10" },
              qasr: { title: "Namaz Qasr", titleAr: "نَمَازِ قَصْر", subtitle: "Shortened Prayer for Travelers", data: namazQasr, gradient: "from-sky-600/25 to-cyan-600/15", badgeBg: "bg-sky-500/20", badgeText: "text-sky-400", contentBg: "bg-sky-500/5", contentBorder: "border-sky-500/10" },
              eidain: { title: "Eidain ka Biyan", titleAr: "عِیدَین کَا بَیَان", subtitle: "Eid Rules, Prayer Method & Takbeer Tashreeq", data: eidainKaBiyan, gradient: "from-green-600/25 to-emerald-600/15", badgeBg: "bg-green-500/20", badgeText: "text-green-400", contentBg: "bg-green-500/5", contentBorder: "border-green-500/10" },
              sajdatilawat: { title: "Sajda Tilawat", titleAr: "سَجْدَہ تِلَاوَت", subtitle: "Prostration of Recitation", data: sajdaTilawat, gradient: "from-violet-600/25 to-purple-600/15", badgeBg: "bg-violet-500/20", badgeText: "text-violet-400", contentBg: "bg-violet-500/5", contentBorder: "border-violet-500/10" },
              taraweeh: { title: "Taraweeh ka Biyan", titleAr: "تَرَاوِیح کَا بَیَان", subtitle: "Taraweeh Prayer in Ramadan", data: taraweehKaBiyan, gradient: "from-lime-600/25 to-green-600/15", badgeBg: "bg-lime-500/20", badgeText: "text-lime-400", contentBg: "bg-lime-500/5", contentBorder: "border-lime-500/10" },
              janaza: { title: "Namaz Janaza", titleAr: "نَمَازِ جَنَازَہ", subtitle: "Funeral Prayer Method & Duas", data: namazJanaza, gradient: "from-slate-600/25 to-gray-600/15", badgeBg: "bg-slate-500/20", badgeText: "text-slate-400", contentBg: "bg-slate-500/5", contentBorder: "border-slate-500/10" },
            };
            const sec = contentSections[activeTab];
            if (!sec) return null;
            return (
              <div className="space-y-6">
                <ZoomControls />
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-amber-400 mb-1" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>{sec.titleAr}</h2>
                  <p className="text-emerald-300/50 text-sm">{sec.subtitle}</p>
                </div>
                {sec.data.map((item: any) => (
                  <Card key={item.number} className="bg-white/5 border-emerald-500/10 backdrop-blur-sm overflow-hidden" data-testid={`card-${activeTab}-${item.number}`}>
                    <CardContent className="p-0">
                      <div className={`bg-gradient-to-r ${sec.gradient} px-5 py-3 border-b border-emerald-500/10 flex items-center justify-between`}>
                        <div>
                          <h3 className="text-amber-300 font-bold text-lg" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }} dir="rtl">{item.nameAr}</h3>
                          <p className="text-emerald-300/60 text-xs">{item.nameEn}</p>
                        </div>
                        <div className={`w-10 h-10 rounded-full ${sec.badgeBg} flex items-center justify-center flex-shrink-0`}>
                          <span className={`${sec.badgeText} font-bold text-lg`}>{item.number}</span>
                        </div>
                      </div>
                      <div className="p-5 space-y-4 pl-10">
                        {item.arabic && (
                                                    <p className="text-white text-2xl sm:text-3xl leading-loose whitespace-pre-line text-center py-4 px-3 rounded-xl bg-black/20 border border-emerald-500/10" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.2" }}>{item.arabic}</p>
                        )}
                        {item.content && (
                          <p className="text-emerald-200/80 text-sm whitespace-pre-line leading-relaxed p-4 rounded-xl" dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', serif", lineHeight: "2" }}>{item.content}</p>
                        )}
                        <p className="text-emerald-300/50 text-sm whitespace-pre-line">{item.translation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      <Dialog open={showStudentForm} onOpenChange={setShowStudentForm}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg bg-emerald-950 text-white border-emerald-500/20">
          <DialogHeader><DialogTitle className="text-emerald-300">{editStudent ? "Edit" : "Add"} Student</DialogTitle></DialogHeader>
          <div className="grid gap-3 max-h-[70vh] overflow-y-auto pr-2">
            <div><Label className="text-emerald-300/70">Full Name *</Label><Input value={studentForm.name} onChange={e => setStudentForm(f => ({ ...f, name: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" data-testid="input-student-name" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-emerald-300/70">Login Username *</Label><Input value={studentForm.loginUsername} onChange={e => setStudentForm(f => ({ ...f, loginUsername: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" placeholder="student1" data-testid="input-student-username" /></div>
              <div><Label className="text-emerald-300/70">Login Password *</Label><Input value={studentForm.loginPassword} onChange={e => setStudentForm(f => ({ ...f, loginPassword: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" placeholder="pass123" data-testid="input-student-password" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-emerald-300/70">Phone</Label><Input value={studentForm.phone} onChange={e => setStudentForm(f => ({ ...f, phone: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" /></div>
              <div><Label className="text-emerald-300/70">Age</Label><Input type="number" value={studentForm.age} onChange={e => setStudentForm(f => ({ ...f, age: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" /></div>
            </div>
            <div><Label className="text-emerald-300/70">Email</Label><Input value={studentForm.email} onChange={e => setStudentForm(f => ({ ...f, email: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-emerald-300/70">Country</Label><Input value={studentForm.country} onChange={e => setStudentForm(f => ({ ...f, country: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" /></div>
              <div><Label className="text-emerald-300/70">School</Label><Input value={studentForm.school} onChange={e => setStudentForm(f => ({ ...f, school: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" placeholder="School name" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-emerald-300/70">Session Duration</Label>
                <select value={studentForm.sessionDuration} onChange={e => setStudentForm(f => ({ ...f, sessionDuration: e.target.value }))} className="w-full rounded-md bg-white/5 border border-emerald-500/20 text-white px-3 py-2 text-sm">
                  <option value="15" className="bg-emerald-950">15 minutes</option>
                  <option value="30" className="bg-emerald-950">30 minutes</option>
                  <option value="45" className="bg-emerald-950">45 minutes</option>
                  <option value="60" className="bg-emerald-950">1 hour</option>
                  <option value="90" className="bg-emerald-950">1.5 hours</option>
                  <option value="custom" className="bg-emerald-950">Custom</option>
                </select>
              </div>
              <div><Label className="text-emerald-300/70">Class Time</Label><Input type="time" value={studentForm.classTime} onChange={e => setStudentForm(f => ({ ...f, classTime: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" /></div>
            </div>
            {studentForm.sessionDuration === "custom" && (
              <div><Label className="text-emerald-300/70">Custom Duration (minutes)</Label><Input type="number" onChange={e => setStudentForm(f => ({ ...f, customDuration: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" placeholder="Enter minutes" /></div>
            )}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-emerald-500/10">
              <input type="checkbox" checked={studentForm.wearsGlasses} onChange={e => setStudentForm(f => ({ ...f, wearsGlasses: e.target.checked }))} className="rounded" id="glasses" />
              <Label htmlFor="glasses" className="text-emerald-300/70 cursor-pointer">Wears glasses</Label>
            </div>
            <Button onClick={() => {
              if (!studentForm.name || !studentForm.loginUsername || !studentForm.loginPassword) { toast({ title: "Name, username and password are required", variant: "destructive" }); return; }
              const duration = studentForm.sessionDuration === "custom" ? ((studentForm as any).customDuration || "30") : studentForm.sessionDuration;
              const data = { ...studentForm, sessionDuration: duration, age: studentForm.age ? parseInt(studentForm.age) : null, academyId };
              editStudent ? updateStudent.mutate({ id: editStudent.id, ...data }) : createStudent.mutate(data);
            }} className="bg-emerald-600 hover:bg-emerald-700 w-full" data-testid="button-save-student">
              {editStudent ? "Update" : "Add"} Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
