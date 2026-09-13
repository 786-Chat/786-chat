import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, LogOut, BarChart3, Clock, AlertTriangle, User, Phone, Mail, GraduationCap, Star, Glasses, Globe, ArrowLeft, Hash, BookMarked, Heart, Home, Shield, HandHeart, Sparkles, Droplets, Volume2, ZoomIn, ZoomOut, Moon } from "lucide-react";
import { sixKalimas, noraniQaidaLessons, essentialDuas, imanAndNiyyat, masnoonDuas, imanKaBiyan, wuzuKaBiyan, ghusulKaBiyan, tayammumKaBiyan, namazKaBiyan, azanKaBiyan, azkarNamaz, namazKaTariqa, namazWitr, faraizNamaz, sajdaSahw, namazQasr, eidainKaBiyan, sajdaTilawat, taraweehKaBiyan, namazJanaza } from "@/lib/islamic-content";

export default function QuranStudentDashboard() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const sidFromUrl = params.get("sid");
  const isTeacherView = !!sidFromUrl;
  const studentId = sidFromUrl || localStorage.getItem("quranStudentId");
  const studentName = localStorage.getItem("quranStudentName");
  const academyName = localStorage.getItem("quranStudentAcademyName");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [zoomLevel, setZoomLevel] = useState(1);

  const ZoomControls = () => (
    <div className="flex items-center gap-2 mb-4 justify-end">
      <button onClick={() => setZoomLevel(z => Math.max(0.7, z - 0.1))} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white" data-testid="button-zoom-out"><ZoomOut className="h-4 w-4" /></button>
      <span className="text-emerald-300/70 text-xs min-w-[3rem] text-center">{Math.round(zoomLevel * 100)}%</span>
      <button onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white" data-testid="button-zoom-in"><ZoomIn className="h-4 w-4" /></button>
      <button onClick={() => setZoomLevel(1)} className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300/70 text-xs">Reset</button>
    </div>
  );

  useEffect(() => {
    if (!studentId && !isTeacherView) setLocation("/quran-student-login");
  }, [studentId]);

  const { data: student } = useQuery({
    queryKey: ["/api/quran/students", studentId],
    queryFn: () => fetch(`/api/quran/students/${studentId}`).then(r => { if (!r.ok) throw new Error("Failed to fetch student"); return r.json(); }),
    enabled: !!studentId,
    refetchInterval: 10000,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/quran/students", studentId, "sessions"],
    queryFn: () => fetch(`/api/quran/students/${studentId}/sessions`).then(r => { if (!r.ok) throw new Error("Failed to fetch sessions"); return r.json(); }),
    enabled: !!studentId,
  });

  const handleLogout = () => {
    localStorage.removeItem("quranStudentId");
    localStorage.removeItem("quranStudentName");
    localStorage.removeItem("quranStudentAcademyId");
    localStorage.removeItem("quranStudentAcademyName");
    setLocation("/quran-student-login");
  };

  const s = student;

  const navTabs = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "kalimas", label: "6 Kalimas", icon: Hash },
    { id: "qaida", label: "Qaida", icon: BookMarked },
    { id: "iman", label: "Iman", icon: Shield },
    { id: "duas", label: "Duas", icon: Heart },
    { id: "masnoon", label: "40 Duas", icon: HandHeart },
    { id: "imanbiyan", label: "Iman Biyan", icon: Sparkles },
    { id: "wuzu", label: "Wuzu", icon: Droplets },
    { id: "ghusul", label: "Ghusul", icon: Droplets },
    { id: "tayammum", label: "Tayammum", icon: Droplets },
    { id: "namaz", label: "Namaz", icon: Moon },
    { id: "azan", label: "Azan", icon: Volume2 },
    { id: "azkar", label: "Azkar", icon: BookOpen },
    { id: "tariqa", label: "Tariqa", icon: BookMarked },
    { id: "witr", label: "Witr", icon: Moon },
    { id: "faraiz", label: "Faraiz", icon: Shield },
    { id: "sajdasahw", label: "S.Sahw", icon: Star },
    { id: "qasr", label: "Qasr", icon: Star },
    { id: "eidain", label: "Eidain", icon: Star },
    { id: "sajdatilawat", label: "S.Tilawat", icon: BookOpen },
    { id: "taraweeh", label: "Taraweeh", icon: Moon },
    { id: "janaza", label: "Janaza", icon: Heart },
  ];

  return (
    <div className="min-h-screen quran-dashboard" style={{ background: "linear-gradient(135deg, #071e12 0%, #0a2e1a 50%, #071e12 100%)" }}>
      <div className="sticky top-0 z-40 bg-black/30 backdrop-blur-xl border-b border-emerald-500/10 px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm sm:text-base">{s?.name || studentName || "Student"}</h1>
              <p className="text-emerald-400/50 text-xs">{isTeacherView ? "Student Portal (Teacher View)" : academyName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isTeacherView && (
              <Button size="sm" variant="ghost" onClick={() => setLocation("/quran-academy-dashboard")} className="text-emerald-300/60 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs" data-testid="button-back-dashboard">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
              </Button>
            )}
            <Button size="sm" onClick={() => setLocation("/quran-reader?student=" + studentId)} className="bg-amber-600/80 hover:bg-amber-600 text-white text-xs" data-testid="button-start-reading">
              <BookOpen className="h-3.5 w-3.5 mr-1" /> Read Quran
            </Button>
            {!isTeacherView && (
              <Button size="sm" variant="ghost" onClick={handleLogout} className="text-red-300/50 hover:text-red-300 hover:bg-red-500/10" data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="sticky top-[57px] z-30 bg-black/20 backdrop-blur-md border-b border-emerald-500/10">
        <div className="max-w-4xl mx-auto flex overflow-x-auto" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "thin", scrollbarColor: "rgba(16,185,129,0.3) transparent" }}>
          {navTabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-all ${activeTab === t.id ? "border-emerald-400 text-emerald-300" : "border-transparent text-emerald-300/40 hover:text-emerald-300/70"}`}
              data-testid={`tab-${t.id}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {activeTab === "dashboard" && s && (
          <>
            <div className="text-center py-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500/30 to-amber-500/30 flex items-center justify-center border-2 border-emerald-500/20 mb-4">
                <User className="h-10 w-10 text-emerald-300" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{s.name}</h2>
              <p className="text-emerald-300/50 text-sm">{academyName}</p>
              {s.classTime && <p className="text-amber-400/60 text-xs mt-1">Class time: {s.classTime} · {s.sessionDuration || "30"} min</p>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Current Juz", value: s.currentJuz || 1, color: "amber" },
                { label: "Sessions", value: s.sessionsCompleted || 0, color: "emerald" },
                { label: "Mistakes", value: s.totalMistakes || 0, color: "red" },
                { label: "Current Surah", value: s.currentSurah || 1, color: "blue" },
              ].map((stat, i) => (
                <Card key={i} className="bg-white/5 border-emerald-500/10 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <p className={`text-3xl font-bold text-${stat.color}-400`}>{stat.value}</p>
                    <p className="text-emerald-300/40 text-xs mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-white/5 border-emerald-500/10 backdrop-blur-sm">
              <CardContent className="p-5">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><User className="h-4 w-4 text-emerald-400" /> My Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {s.phone && <div className="flex items-center gap-2 text-emerald-300/60 text-sm"><Phone className="h-4 w-4" />{s.phone}</div>}
                  {s.email && <div className="flex items-center gap-2 text-emerald-300/60 text-sm"><Mail className="h-4 w-4" />{s.email}</div>}
                  {s.age && <div className="flex items-center gap-2 text-emerald-300/60 text-sm"><User className="h-4 w-4" />Age: {s.age}</div>}
                  {s.country && <div className="flex items-center gap-2 text-emerald-300/60 text-sm"><Globe className="h-4 w-4" />{s.country}</div>}
                  {s.school && <div className="flex items-center gap-2 text-emerald-300/60 text-sm"><GraduationCap className="h-4 w-4" />{s.school}</div>}
                  {s.wearsGlasses && <div className="flex items-center gap-2 text-amber-300/60 text-sm"><Glasses className="h-4 w-4" />Wears glasses</div>}
                  {s.sessionDuration && <div className="flex items-center gap-2 text-emerald-300/60 text-sm"><Clock className="h-4 w-4" />{s.sessionDuration} min sessions</div>}
                  {s.classTime && <div className="flex items-center gap-2 text-emerald-300/60 text-sm"><Clock className="h-4 w-4" />Class: {s.classTime}</div>}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-emerald-500/10 backdrop-blur-sm">
              <CardContent className="p-5">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-emerald-400" /> Recent Sessions</h3>
                {sessions.length > 0 ? (
                  <div className="space-y-2">
                    {sessions.slice(0, 10).map((sess: any) => (
                      <div key={sess.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-emerald-500/10">
                        <div>
                          <p className="text-white text-sm font-medium">Surah {sess.surahNumber}</p>
                          <p className="text-emerald-300/40 text-xs">
                            Ayah {sess.startAyah}{sess.endAyah ? ` - ${sess.endAyah}` : ""} ·
                            {sess.duration ? ` ${Math.round(sess.duration / 60)} min` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${sess.status === "completed" ? "text-emerald-400" : "text-amber-400"}`}>
                            {sess.status === "completed" ? "Completed" : "In Progress"}
                          </p>
                          <p className="text-red-400/60 text-xs">{sess.mistakes || 0} mistakes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-emerald-300/40">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No sessions yet. Start reading to track your progress!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-center py-4">
              <Button onClick={() => setLocation("/quran-reader?student=" + studentId)} className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white h-14 px-8 text-lg shadow-lg shadow-emerald-500/20 rounded-xl" data-testid="button-start-reading-main">
                <BookOpen className="h-6 w-6 mr-3" /> Start Reading Quran
              </Button>
            </div>
          </>
        )}

        {activeTab === "kalimas" && (
          <div className="space-y-6">
            <ZoomControls />
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
                                          <p className="text-white text-2xl sm:text-3xl leading-loose whitespace-pre-line text-center py-4 px-3 rounded-xl bg-black/20 border border-emerald-500/10" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.2" }}>{k.arabic}</p>
                    <p className="text-emerald-300/70 italic text-sm">{k.transliteration}</p>
                    <p className="text-emerald-300/50 text-sm">{k.translation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "qaida" && (
          <div className="space-y-6">
            <ZoomControls />
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
                  <div className="p-5 pl-10">
                    <p className="text-white text-2xl sm:text-3xl leading-loose whitespace-pre-line text-center py-6 px-4 rounded-xl bg-black/20 border border-emerald-500/10" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.5" }}>{lesson.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "iman" && (
          <div className="space-y-6">
            <ZoomControls />
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
                                          <p className="text-white text-2xl sm:text-3xl leading-loose whitespace-pre-line text-center py-4 px-3 rounded-xl bg-black/20 border border-emerald-500/10" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.2" }}>{item.arabic}</p>
                    <p className="text-emerald-300/70 italic text-sm">{item.transliteration}</p>
                    <p className="text-emerald-300/50 text-sm">{item.translation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "duas" && (
          <div className="space-y-6">
            <ZoomControls />
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
                                          <p className="text-white text-2xl sm:text-3xl leading-loose whitespace-pre-line text-center py-4 px-3 rounded-xl bg-black/20 border border-emerald-500/10" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.2" }}>{dua.arabic}</p>
                    <p className="text-emerald-300/50 text-sm text-center">{dua.translation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "masnoon" && (
          <div className="space-y-6">
            <ZoomControls />
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
                                          <p className="text-white text-2xl sm:text-3xl leading-loose whitespace-pre-line text-center py-4 px-3 rounded-xl bg-black/20 border border-emerald-500/10" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.2" }}>{dua.arabic}</p>
                    <p className="text-emerald-300/50 text-sm text-center">{dua.translation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "imanbiyan" && (
          <div className="space-y-6">
            <ZoomControls />
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
                                              <p className="text-white text-2xl sm:text-3xl leading-loose whitespace-pre-line text-center py-4 px-3 rounded-xl bg-black/20 border border-emerald-500/10" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.2" }}>{item.arabic}</p>
                    )}
                    <p className="text-emerald-200/80 text-sm whitespace-pre-line leading-relaxed p-4 rounded-xl bg-purple-500/5 border border-purple-500/10" dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', serif", lineHeight: "2" }}>{item.content}</p>
                    <p className="text-emerald-300/50 text-sm whitespace-pre-line">{item.translation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "wuzu" && (
          <div className="space-y-6">
            <ZoomControls />
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
                                              <p className="text-white text-2xl sm:text-3xl leading-loose whitespace-pre-line text-center py-4 px-3 rounded-xl bg-black/20 border border-emerald-500/10" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.2" }}>{item.arabic}</p>
                    )}
                    <p className="text-emerald-200/80 text-sm whitespace-pre-line leading-relaxed p-4 rounded-xl bg-sky-500/5 border border-sky-500/10" dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', serif", lineHeight: "2" }}>{item.content}</p>
                    <p className="text-emerald-300/50 text-sm whitespace-pre-line">{item.translation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "ghusul" && (
          <div className="space-y-6">
            <ZoomControls />
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
                                              <p className="text-white text-2xl sm:text-3xl leading-loose whitespace-pre-line text-center py-4 px-3 rounded-xl bg-black/20 border border-emerald-500/10" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.2" }}>{item.arabic}</p>
                    )}
                    <p className="text-emerald-200/80 text-sm whitespace-pre-line leading-relaxed p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10" dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', serif", lineHeight: "2" }}>{item.content}</p>
                    <p className="text-emerald-300/50 text-sm whitespace-pre-line">{item.translation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {(() => {
          const contentSections: Record<string, { titleAr: string; subtitle: string; data: any[]; gradient: string; badgeBg: string; badgeText: string }> = {
            tayammum: { titleAr: "تَیَمُّم کَا بَیَان", subtitle: "Dry Ablution (Method & Rules)", data: tayammumKaBiyan, gradient: "from-amber-600/25 to-orange-600/15", badgeBg: "bg-amber-500/20", badgeText: "text-amber-400" },
            namaz: { titleAr: "نَمَاز کَا بَیَان", subtitle: "Prayer - Importance, Rakaat & Niyyat", data: namazKaBiyan, gradient: "from-emerald-600/25 to-yellow-600/15", badgeBg: "bg-yellow-500/20", badgeText: "text-yellow-400" },
            azan: { titleAr: "اَذَان و اِقَامَت", subtitle: "Call to Prayer & Second Call", data: azanKaBiyan, gradient: "from-purple-600/25 to-violet-600/15", badgeBg: "bg-purple-500/20", badgeText: "text-purple-400" },
            azkar: { titleAr: "اَذْکَارِ نَمَاز", subtitle: "All Recitations in Prayer", data: azkarNamaz, gradient: "from-blue-600/25 to-sky-600/15", badgeBg: "bg-blue-500/20", badgeText: "text-blue-400" },
            tariqa: { titleAr: "نَمَاز کَا طَرِیقَہ", subtitle: "Step-by-Step Method & Gender Differences", data: namazKaTariqa, gradient: "from-teal-600/25 to-emerald-600/15", badgeBg: "bg-teal-500/20", badgeText: "text-teal-400" },
            witr: { titleAr: "نَمَاز وِتر و دُعَائے قُنُوت", subtitle: "Witr Prayer & Its Special Dua", data: namazWitr, gradient: "from-rose-600/25 to-pink-600/15", badgeBg: "bg-rose-500/20", badgeText: "text-rose-400" },
            faraiz: { titleAr: "فَرَائِض و اَحکَامِ نَمَاز", subtitle: "Obligations, Sunnats & Disliked Acts", data: faraizNamaz, gradient: "from-indigo-600/25 to-blue-600/15", badgeBg: "bg-indigo-500/20", badgeText: "text-indigo-400" },
            sajdasahw: { titleAr: "سَجْدَہ سَہو", subtitle: "Prostration of Forgetfulness", data: sajdaSahw, gradient: "from-orange-600/25 to-amber-600/15", badgeBg: "bg-orange-500/20", badgeText: "text-orange-400" },
            qasr: { titleAr: "نَمَازِ قَصْر", subtitle: "Shortened Prayer for Travelers", data: namazQasr, gradient: "from-sky-600/25 to-cyan-600/15", badgeBg: "bg-sky-500/20", badgeText: "text-sky-400" },
            eidain: { titleAr: "عِیدَین کَا بَیَان", subtitle: "Eid Rules, Prayer & Takbeer Tashreeq", data: eidainKaBiyan, gradient: "from-green-600/25 to-emerald-600/15", badgeBg: "bg-green-500/20", badgeText: "text-green-400" },
            sajdatilawat: { titleAr: "سَجْدَہ تِلَاوَت", subtitle: "Prostration of Recitation", data: sajdaTilawat, gradient: "from-violet-600/25 to-purple-600/15", badgeBg: "bg-violet-500/20", badgeText: "text-violet-400" },
            taraweeh: { titleAr: "تَرَاوِیح کَا بَیَان", subtitle: "Taraweeh Prayer in Ramadan", data: taraweehKaBiyan, gradient: "from-lime-600/25 to-green-600/15", badgeBg: "bg-lime-500/20", badgeText: "text-lime-400" },
            janaza: { titleAr: "نَمَازِ جَنَازَہ", subtitle: "Funeral Prayer Method & Duas", data: namazJanaza, gradient: "from-slate-600/25 to-gray-600/15", badgeBg: "bg-slate-500/20", badgeText: "text-slate-400" },
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
                    <div className="p-5 space-y-4">
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

      <div className="text-center py-6 border-t border-emerald-500/10">
        <p className="text-emerald-400/30 text-xs">Powered by Link24</p>
      </div>
    </div>
  );
}
