import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mic, MicOff, ChevronLeft, ChevronRight, BookOpen, Volume2, VolumeX, Eye, EyeOff, AlertCircle, CheckCircle, RotateCcw } from "lucide-react";

const SURAH_LIST = [
  { number: 1, name: "Al-Fatihah", arabic: "الفاتحة", ayahs: 7, juz: 1 },
  { number: 2, name: "Al-Baqarah", arabic: "البقرة", ayahs: 286, juz: 1 },
  { number: 3, name: "Aal-e-Imran", arabic: "آل عمران", ayahs: 200, juz: 3 },
  { number: 4, name: "An-Nisa", arabic: "النساء", ayahs: 176, juz: 4 },
  { number: 5, name: "Al-Ma'idah", arabic: "المائدة", ayahs: 120, juz: 6 },
  { number: 6, name: "Al-An'am", arabic: "الأنعام", ayahs: 165, juz: 7 },
  { number: 7, name: "Al-A'raf", arabic: "الأعراف", ayahs: 206, juz: 8 },
  { number: 8, name: "Al-Anfal", arabic: "الأنفال", ayahs: 75, juz: 9 },
  { number: 9, name: "At-Tawbah", arabic: "التوبة", ayahs: 129, juz: 10 },
  { number: 10, name: "Yunus", arabic: "يونس", ayahs: 109, juz: 11 },
  { number: 11, name: "Hud", arabic: "هود", ayahs: 123, juz: 11 },
  { number: 12, name: "Yusuf", arabic: "يوسف", ayahs: 111, juz: 12 },
  { number: 13, name: "Ar-Ra'd", arabic: "الرعد", ayahs: 43, juz: 13 },
  { number: 14, name: "Ibrahim", arabic: "إبراهيم", ayahs: 52, juz: 13 },
  { number: 15, name: "Al-Hijr", arabic: "الحجر", ayahs: 99, juz: 14 },
  { number: 16, name: "An-Nahl", arabic: "النحل", ayahs: 128, juz: 14 },
  { number: 17, name: "Al-Isra", arabic: "الإسراء", ayahs: 111, juz: 15 },
  { number: 18, name: "Al-Kahf", arabic: "الكهف", ayahs: 110, juz: 15 },
  { number: 19, name: "Maryam", arabic: "مريم", ayahs: 98, juz: 16 },
  { number: 20, name: "Taha", arabic: "طه", ayahs: 135, juz: 16 },
  { number: 21, name: "Al-Anbiya", arabic: "الأنبياء", ayahs: 112, juz: 17 },
  { number: 22, name: "Al-Hajj", arabic: "الحج", ayahs: 78, juz: 17 },
  { number: 23, name: "Al-Mu'minun", arabic: "المؤمنون", ayahs: 118, juz: 18 },
  { number: 24, name: "An-Nur", arabic: "النور", ayahs: 64, juz: 18 },
  { number: 25, name: "Al-Furqan", arabic: "الفرقان", ayahs: 77, juz: 18 },
  { number: 26, name: "Ash-Shu'ara", arabic: "الشعراء", ayahs: 227, juz: 19 },
  { number: 27, name: "An-Naml", arabic: "النمل", ayahs: 93, juz: 19 },
  { number: 28, name: "Al-Qasas", arabic: "القصص", ayahs: 88, juz: 20 },
  { number: 29, name: "Al-Ankabut", arabic: "العنكبوت", ayahs: 69, juz: 20 },
  { number: 30, name: "Ar-Rum", arabic: "الروم", ayahs: 60, juz: 21 },
  { number: 31, name: "Luqman", arabic: "لقمان", ayahs: 34, juz: 21 },
  { number: 32, name: "As-Sajdah", arabic: "السجدة", ayahs: 30, juz: 21 },
  { number: 33, name: "Al-Ahzab", arabic: "الأحزاب", ayahs: 73, juz: 21 },
  { number: 34, name: "Saba", arabic: "سبأ", ayahs: 54, juz: 22 },
  { number: 35, name: "Fatir", arabic: "فاطر", ayahs: 45, juz: 22 },
  { number: 36, name: "Ya-Sin", arabic: "يس", ayahs: 83, juz: 22 },
  { number: 37, name: "As-Saffat", arabic: "الصافات", ayahs: 182, juz: 23 },
  { number: 38, name: "Sad", arabic: "ص", ayahs: 88, juz: 23 },
  { number: 39, name: "Az-Zumar", arabic: "الزمر", ayahs: 75, juz: 23 },
  { number: 40, name: "Ghafir", arabic: "غافر", ayahs: 85, juz: 24 },
  { number: 41, name: "Fussilat", arabic: "فصلت", ayahs: 54, juz: 24 },
  { number: 42, name: "Ash-Shura", arabic: "الشورى", ayahs: 53, juz: 25 },
  { number: 43, name: "Az-Zukhruf", arabic: "الزخرف", ayahs: 89, juz: 25 },
  { number: 44, name: "Ad-Dukhan", arabic: "الدخان", ayahs: 59, juz: 25 },
  { number: 45, name: "Al-Jathiyah", arabic: "الجاثية", ayahs: 37, juz: 25 },
  { number: 46, name: "Al-Ahqaf", arabic: "الأحقاف", ayahs: 35, juz: 26 },
  { number: 47, name: "Muhammad", arabic: "محمد", ayahs: 38, juz: 26 },
  { number: 48, name: "Al-Fath", arabic: "الفتح", ayahs: 29, juz: 26 },
  { number: 49, name: "Al-Hujurat", arabic: "الحجرات", ayahs: 18, juz: 26 },
  { number: 50, name: "Qaf", arabic: "ق", ayahs: 45, juz: 26 },
  { number: 51, name: "Adh-Dhariyat", arabic: "الذاريات", ayahs: 60, juz: 26 },
  { number: 52, name: "At-Tur", arabic: "الطور", ayahs: 49, juz: 27 },
  { number: 53, name: "An-Najm", arabic: "النجم", ayahs: 62, juz: 27 },
  { number: 54, name: "Al-Qamar", arabic: "القمر", ayahs: 55, juz: 27 },
  { number: 55, name: "Ar-Rahman", arabic: "الرحمن", ayahs: 78, juz: 27 },
  { number: 56, name: "Al-Waqi'ah", arabic: "الواقعة", ayahs: 96, juz: 27 },
  { number: 57, name: "Al-Hadid", arabic: "الحديد", ayahs: 29, juz: 27 },
  { number: 58, name: "Al-Mujadila", arabic: "المجادلة", ayahs: 22, juz: 28 },
  { number: 59, name: "Al-Hashr", arabic: "الحشر", ayahs: 24, juz: 28 },
  { number: 60, name: "Al-Mumtahanah", arabic: "الممتحنة", ayahs: 13, juz: 28 },
  { number: 61, name: "As-Saff", arabic: "الصف", ayahs: 14, juz: 28 },
  { number: 62, name: "Al-Jumu'ah", arabic: "الجمعة", ayahs: 11, juz: 28 },
  { number: 63, name: "Al-Munafiqun", arabic: "المنافقون", ayahs: 11, juz: 28 },
  { number: 64, name: "At-Taghabun", arabic: "التغابن", ayahs: 18, juz: 28 },
  { number: 65, name: "At-Talaq", arabic: "الطلاق", ayahs: 12, juz: 28 },
  { number: 66, name: "At-Tahrim", arabic: "التحريم", ayahs: 12, juz: 28 },
  { number: 67, name: "Al-Mulk", arabic: "الملك", ayahs: 30, juz: 29 },
  { number: 68, name: "Al-Qalam", arabic: "القلم", ayahs: 52, juz: 29 },
  { number: 69, name: "Al-Haqqah", arabic: "الحاقة", ayahs: 52, juz: 29 },
  { number: 70, name: "Al-Ma'arij", arabic: "المعارج", ayahs: 44, juz: 29 },
  { number: 71, name: "Nuh", arabic: "نوح", ayahs: 28, juz: 29 },
  { number: 72, name: "Al-Jinn", arabic: "الجن", ayahs: 28, juz: 29 },
  { number: 73, name: "Al-Muzzammil", arabic: "المزمل", ayahs: 20, juz: 29 },
  { number: 74, name: "Al-Muddaththir", arabic: "المدثر", ayahs: 56, juz: 29 },
  { number: 75, name: "Al-Qiyamah", arabic: "القيامة", ayahs: 40, juz: 29 },
  { number: 76, name: "Al-Insan", arabic: "الإنسان", ayahs: 31, juz: 29 },
  { number: 77, name: "Al-Mursalat", arabic: "المرسلات", ayahs: 50, juz: 29 },
  { number: 78, name: "An-Naba", arabic: "النبأ", ayahs: 40, juz: 30 },
  { number: 79, name: "An-Nazi'at", arabic: "النازعات", ayahs: 46, juz: 30 },
  { number: 80, name: "Abasa", arabic: "عبس", ayahs: 42, juz: 30 },
  { number: 81, name: "At-Takwir", arabic: "التكوير", ayahs: 29, juz: 30 },
  { number: 82, name: "Al-Infitar", arabic: "الانفطار", ayahs: 19, juz: 30 },
  { number: 83, name: "Al-Mutaffifin", arabic: "المطففين", ayahs: 36, juz: 30 },
  { number: 84, name: "Al-Inshiqaq", arabic: "الانشقاق", ayahs: 25, juz: 30 },
  { number: 85, name: "Al-Buruj", arabic: "البروج", ayahs: 22, juz: 30 },
  { number: 86, name: "At-Tariq", arabic: "الطارق", ayahs: 17, juz: 30 },
  { number: 87, name: "Al-A'la", arabic: "الأعلى", ayahs: 19, juz: 30 },
  { number: 88, name: "Al-Ghashiyah", arabic: "الغاشية", ayahs: 26, juz: 30 },
  { number: 89, name: "Al-Fajr", arabic: "الفجر", ayahs: 30, juz: 30 },
  { number: 90, name: "Al-Balad", arabic: "البلد", ayahs: 20, juz: 30 },
  { number: 91, name: "Ash-Shams", arabic: "الشمس", ayahs: 15, juz: 30 },
  { number: 92, name: "Al-Layl", arabic: "الليل", ayahs: 21, juz: 30 },
  { number: 93, name: "Ad-Duha", arabic: "الضحى", ayahs: 11, juz: 30 },
  { number: 94, name: "Ash-Sharh", arabic: "الشرح", ayahs: 8, juz: 30 },
  { number: 95, name: "At-Tin", arabic: "التين", ayahs: 8, juz: 30 },
  { number: 96, name: "Al-Alaq", arabic: "العلق", ayahs: 19, juz: 30 },
  { number: 97, name: "Al-Qadr", arabic: "القدر", ayahs: 5, juz: 30 },
  { number: 98, name: "Al-Bayyinah", arabic: "البينة", ayahs: 8, juz: 30 },
  { number: 99, name: "Az-Zalzalah", arabic: "الزلزلة", ayahs: 8, juz: 30 },
  { number: 100, name: "Al-Adiyat", arabic: "العاديات", ayahs: 11, juz: 30 },
  { number: 101, name: "Al-Qari'ah", arabic: "القارعة", ayahs: 11, juz: 30 },
  { number: 102, name: "At-Takathur", arabic: "التكاثر", ayahs: 8, juz: 30 },
  { number: 103, name: "Al-Asr", arabic: "العصر", ayahs: 3, juz: 30 },
  { number: 104, name: "Al-Humazah", arabic: "الهمزة", ayahs: 9, juz: 30 },
  { number: 105, name: "Al-Fil", arabic: "الفيل", ayahs: 5, juz: 30 },
  { number: 106, name: "Quraysh", arabic: "قريش", ayahs: 4, juz: 30 },
  { number: 107, name: "Al-Ma'un", arabic: "الماعون", ayahs: 7, juz: 30 },
  { number: 108, name: "Al-Kawthar", arabic: "الكوثر", ayahs: 3, juz: 30 },
  { number: 109, name: "Al-Kafirun", arabic: "الكافرون", ayahs: 6, juz: 30 },
  { number: 110, name: "An-Nasr", arabic: "النصر", ayahs: 3, juz: 30 },
  { number: 111, name: "Al-Masad", arabic: "المسد", ayahs: 5, juz: 30 },
  { number: 112, name: "Al-Ikhlas", arabic: "الإخلاص", ayahs: 4, juz: 30 },
  { number: 113, name: "Al-Falaq", arabic: "الفلق", ayahs: 5, juz: 30 },
  { number: 114, name: "An-Nas", arabic: "الناس", ayahs: 6, juz: 30 },
];

function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[\u0621]/g, "ا")
    .replace(/[\u0622\u0623\u0625]/g, "ا")
    .replace(/[\u0624]/g, "و")
    .replace(/[\u0626]/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

function compareWords(spoken: string, expected: string): boolean {
  const s = normalizeArabic(spoken);
  const e = normalizeArabic(expected);
  if (s === e) return true;
  if (s.length === 0 || e.length === 0) return false;
  let matches = 0;
  const minLen = Math.min(s.length, e.length);
  for (let i = 0; i < minLen; i++) {
    if (s[i] === e[i]) matches++;
  }
  return matches / Math.max(s.length, e.length) > 0.6;
}

const QARI_LIST = [
  { id: "ar.alafasy", name: "Mishary Alafasy", nameAr: "مشاري العفاسي" },
  { id: "ar.abdulbasitmurattal", name: "Abdul Basit (Murattal)", nameAr: "عبد الباسط عبد الصمد" },
  { id: "ar.abdulsamad", name: "Abdul Basit (Mujawwad)", nameAr: "عبد الباسط مجوّد" },
  { id: "ar.husary", name: "Mahmoud Al-Husary", nameAr: "محمود خليل الحصري" },
  { id: "ar.minshawi", name: "Mohamed Al-Minshawi", nameAr: "محمد صدّيق المنشاوي" },
  { id: "ar.ahmedajamy", name: "Ahmed Al-Ajamy", nameAr: "أحمد العجمي" },
  { id: "ar.maaboralhuthaify", name: "Maher Al-Muaiqly", nameAr: "ماهر المعيقلي" },
];

export default function QuranReader() {
  const [, setLocation] = useLocation();
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [selectedQari, setSelectedQari] = useState("ar.alafasy");
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentAyah, setCurrentAyah] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [mistakeAyah, setMistakeAyah] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [correctAyahs, setCorrectAyahs] = useState<Set<number>>(new Set());
  const [showText, setShowText] = useState(true);
  const [showSurahList, setShowSurahList] = useState(false);
  const [showQariList, setShowQariList] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const recognitionRef = useRef<any>(null);
  const errorSoundRef = useRef<HTMLAudioElement | null>(null);
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const ayahRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const currentAyahRef = useRef(0);
  const ayahsRef = useRef<any[]>([]);
  const correctAyahsRef = useRef<Set<number>>(new Set());
  const isListeningRef = useRef(false);
  const showTextRef = useRef(true);

  useEffect(() => {
    errorSoundRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3");
    errorSoundRef.current.volume = 0.5;
    correctSoundRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3");
    correctSoundRef.current.volume = 0.3;
  }, []);

  useEffect(() => { currentAyahRef.current = currentAyah; }, [currentAyah]);
  useEffect(() => { ayahsRef.current = ayahs; }, [ayahs]);
  useEffect(() => { correctAyahsRef.current = correctAyahs; }, [correctAyahs]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { showTextRef.current = showText; }, [showText]);

  useEffect(() => {
    loadSurah(selectedSurah, selectedQari);
  }, [selectedSurah, selectedQari]);

  const loadSurah = async (num: number, qari: string) => {
    setLoading(true);
    setCurrentAyah(0);
    currentAyahRef.current = 0;
    setMistakeAyah(null);
    setMistakes(0);
    setCorrectAyahs(new Set());
    correctAyahsRef.current = new Set();
    setTranscript("");
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/${qari}`);
      const data = await res.json();
      if (data.data?.ayahs) {
        setAyahs(data.data.ayahs);
      }
    } catch (err) {
      console.error("Failed to load surah:", err);
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/ar.alafasy`);
        const data = await res.json();
        if (data.data?.ayahs) {
          setAyahs(data.data.ayahs);
        }
      } catch (e2) {
        setStatusMessage("Failed to load Quran data. Please check your internet connection.");
      }
    }
    setLoading(false);
  };

  const isIOS = useRef(typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)));

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatusMessage("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.continuous = !isIOS.current;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
      setStatusMessage("Listening... Start reciting");
      setMistakeAyah(null);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      if (finalTranscript) {
        const cur = currentAyahRef.current;
        const allAyahs = ayahsRef.current;
        if (!allAyahs[cur]) return;

        if (correctAyahsRef.current.has(cur)) {
          const next = cur + 1;
          if (next < allAyahs.length) {
            currentAyahRef.current = next;
            setCurrentAyah(next);
            setMistakeAyah(null);
            setTimeout(() => {
              const el = ayahRefs.current.get(next);
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 300);
          }
          return;
        }

        const expectedText = allAyahs[cur].text;
        const spokenNorm = normalizeArabic(finalTranscript);
        const expectedNorm = normalizeArabic(expectedText);

        const spokenWords = spokenNorm.split(/\s+/).filter(Boolean);
        const expectedWords = expectedNorm.split(/\s+/).filter(Boolean);

        let matchCount = 0;
        const checkLen = Math.min(spokenWords.length, expectedWords.length);
        for (let i = 0; i < checkLen; i++) {
          if (compareWords(spokenWords[i], expectedWords[i])) matchCount++;
        }

        const matchRatio = checkLen > 0 ? matchCount / checkLen : 0;

        if (matchRatio >= 0.5 || (spokenWords.length >= 2 && matchCount >= 1)) {
          const newCorrect = new Set([...correctAyahsRef.current, cur]);
          correctAyahsRef.current = newCorrect;
          setCorrectAyahs(newCorrect);
          setMistakeAyah(null);
          correctSoundRef.current?.play().catch(() => {});
          setStatusMessage("Correct! Moving to next ayah...");
          const nextAyah = cur + 1;
          if (nextAyah < allAyahs.length) {
            currentAyahRef.current = nextAyah;
            setCurrentAyah(nextAyah);
            setTimeout(() => {
              const el = ayahRefs.current.get(nextAyah);
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 300);
          } else {
            setStatusMessage("Surah completed! MashaAllah!");
            setIsListening(false);
            isListeningRef.current = false;
            recognitionRef.current?.stop();
          }
        } else {
          setMistakeAyah(cur);
          setMistakes(prev => prev + 1);
          errorSoundRef.current?.play().catch(() => {});
          setStatusMessage("Mistake detected! Try again...");
          if (!showTextRef.current) {
            setShowText(true);
            setTimeout(() => setShowText(false), 5000);
          }
        }
      }
    };

    let fatalError = false;

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        setStatusMessage("No speech detected. Please recite louder.");
      } else if (event.error === "aborted") {
        return;
      } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        fatalError = true;
        isListeningRef.current = false;
        setIsListening(false);
        recognitionRef.current = null;
        setStatusMessage("Microphone access denied. Please allow microphone access in your browser settings.");
      } else {
        setStatusMessage(`Error: ${event.error}. Restarting...`);
      }
    };

    recognition.onend = () => {
      if (fatalError) return;
      if (isListeningRef.current) {
        setTimeout(() => {
          if (isListeningRef.current && !fatalError) {
            try {
              if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch {}
              }
              const newRecognition = new SpeechRecognition();
              newRecognition.lang = "ar-SA";
              newRecognition.continuous = !isIOS.current;
              newRecognition.interimResults = true;
              newRecognition.maxAlternatives = 3;
              newRecognition.onstart = recognition.onstart;
              newRecognition.onresult = recognition.onresult;
              newRecognition.onerror = recognition.onerror;
              newRecognition.onend = recognition.onend;
              recognitionRef.current = newRecognition;
              newRecognition.start();
            } catch {}
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      setStatusMessage("Could not start speech recognition. Please check microphone permissions.");
    }
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {
        try { recognitionRef.current.stop(); } catch {}
      }
      recognitionRef.current = null;
    }
    setStatusMessage("Stopped listening");
  }, []);

  const surah = SURAH_LIST.find(s => s.number === selectedSurah);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAyahAudio = (ayah: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (ayah.audio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const audio = new Audio(ayah.audio);
      audioRef.current = audio;
      audio.play().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #071e12 0%, #0a2e1a 30%, #0d3d23 60%, #071e12 100%)" }}>
      <div className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-emerald-500/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/quran-academy-dashboard")} className="text-white hover:bg-white/10" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white">Quran Reader</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Button variant="ghost" size="sm" onClick={() => setShowQariList(!showQariList)}
                className="text-amber-400 hover:bg-white/10 text-xs gap-1" data-testid="button-qari-select">
                <Volume2 className="h-4 w-4" />
                <span className="hidden sm:inline">{QARI_LIST.find(q => q.id === selectedQari)?.name?.split(" ")[0] || "Qari"}</span>
              </Button>
              {showQariList && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-black/95 backdrop-blur-xl border border-emerald-500/20 rounded-xl shadow-2xl z-50 overflow-hidden" data-testid="qari-dropdown">
                  <div className="p-2">
                    <p className="text-emerald-400/50 text-[10px] uppercase tracking-wider px-3 py-1">Select Qari</p>
                    {QARI_LIST.map(q => (
                      <button key={q.id} onClick={() => { setSelectedQari(q.id); setShowQariList(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${selectedQari === q.id ? "bg-amber-500/20 text-amber-300" : "text-white/70 hover:bg-white/5"}`}
                        data-testid={`button-qari-${q.id}`}>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-xs">{q.name}</p>
                          <p className="text-[10px] opacity-60" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>{q.nameAr}</p>
                        </div>
                        {selectedQari === q.id && <Volume2 className="h-3 w-3 text-amber-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowText(!showText)}
              className={`text-xs ${showText ? "text-emerald-400" : "text-amber-400"} hover:bg-white/10`}
              data-testid="button-toggle-text">
              {showText ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowSurahList(!showSurahList)}
              className="text-emerald-400 hover:bg-white/10" data-testid="button-surah-list">
              <BookOpen className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {showSurahList && (
          <div className="w-72 bg-black/20 backdrop-blur-sm overflow-y-auto hidden sm:block">
            <div className="p-3">
              <h3 className="text-emerald-400/70 text-xs font-semibold uppercase tracking-wider mb-3 px-2">All Surahs</h3>
              {SURAH_LIST.map(s => (
                <button key={s.number} onClick={() => { setSelectedSurah(s.number); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 ${selectedSurah === s.number ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/20" : "text-emerald-300/50 hover:bg-white/5 hover:text-emerald-300"}`}
                  data-testid={`button-surah-${s.number}`}>
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-400">{s.number}</span>
                  <div className="text-left flex-1">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-[10px] opacity-60">{s.ayahs} Ayahs · Juz {s.juz}</p>
                  </div>
                  <span className="text-lg font-arabic" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>{s.arabic}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto" ref={containerRef}>
          <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="sm:hidden mb-4">
              <Select value={selectedSurah.toString()} onValueChange={v => setSelectedSurah(parseInt(v))}>
                <SelectTrigger className="bg-white/5 border-emerald-500/20 text-white" data-testid="select-surah-mobile">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-emerald-950 border-emerald-500/20 max-h-64">
                  {SURAH_LIST.map(s => (
                    <SelectItem key={s.number} value={s.number.toString()} className="text-white hover:bg-emerald-500/20">
                      {s.number}. {s.name} - {s.arabic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-center mb-8">
              <div className="inline-block relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 blur-xl" />
                <div className="relative bg-gradient-to-b from-emerald-900/40 to-emerald-950/40 border border-emerald-500/20 rounded-2xl px-8 py-6 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-500/50" />
                    <span className="text-amber-400 text-4xl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>{surah?.arabic}</span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-500/50" />
                  </div>
                  <h2 className="text-white text-lg font-semibold">{surah?.name}</h2>
                  <p className="text-emerald-300/50 text-xs mt-1">{surah?.ayahs} Ayahs · Juz {surah?.juz}</p>

                  <div className="flex items-center justify-center gap-3 mt-3">
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/10">
                      <span className="text-emerald-400 text-xs font-medium">{correctAyahs.size}/{ayahs.length} correct</span>
                    </div>
                    {mistakes > 0 && (
                      <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/10">
                        <span className="text-red-400 text-xs font-medium">{mistakes} mistakes</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
              </div>
            ) : (
              <>
                {selectedSurah !== 1 && selectedSurah !== 9 && (
                  <div className="text-center mb-8">
                    <p className="text-2xl text-amber-300/70" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {ayahs.map((ayah, idx) => (
                    <div
                      key={ayah.numberInSurah || idx}
                      ref={(el) => { if (el) ayahRefs.current.set(idx, el); }}
                      onClick={() => { setCurrentAyah(idx); playAyahAudio(ayah); }}
                      className={`relative p-4 sm:p-5 rounded-xl cursor-pointer transition-all duration-300 ${
                        mistakeAyah === idx
                          ? "bg-red-500/10 shadow-lg shadow-red-500/10 animate-pulse"
                          : correctAyahs.has(idx)
                          ? "bg-emerald-500/10"
                          : currentAyah === idx
                          ? "bg-amber-500/10 shadow-lg shadow-amber-500/5"
                          : "bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                      data-testid={`ayah-${idx}`}
                    >
                      <div className="flex items-start gap-3" dir="rtl">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            mistakeAyah === idx ? "bg-red-500/20 text-red-400" :
                            correctAyahs.has(idx) ? "bg-emerald-500/20 text-emerald-400" :
                            currentAyah === idx ? "bg-amber-500/20 text-amber-400" :
                            "bg-white/5 text-emerald-300/40"
                          }`}>
                            {ayah.numberInSurah}
                          </div>
                        </div>
                        <div className="flex-1">
                          {showText || mistakeAyah === idx || correctAyahs.has(idx) ? (
                            <p className={`text-xl sm:text-2xl leading-loose ${
                              mistakeAyah === idx ? "text-red-300" :
                              correctAyahs.has(idx) ? "text-emerald-300" :
                              currentAyah === idx ? "text-amber-200" :
                              "text-white/80"
                            }`} style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "2.5" }}>
                              {ayah.text}
                            </p>
                          ) : (
                            <div className="py-4 text-center">
                              <p className="text-emerald-300/30 text-sm">
                                {currentAyah === idx ? "Recite this ayah..." : `Ayah ${ayah.numberInSurah}`}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {mistakeAyah === idx && (
                        <div className="mt-3 flex items-center gap-2 text-red-400 text-sm" dir="ltr">
                          <AlertCircle className="h-4 w-4" />
                          <span>Mistake detected — please try again</span>
                        </div>
                      )}
                      {correctAyahs.has(idx) && (
                        <div className="absolute top-3 left-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        </div>
                      )}
                      {ayah.audio && (
                        <button
                          onClick={(e) => playAyahAudio(ayah, e)}
                          className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-white/5 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                          data-testid={`button-play-ayah-${idx}`}
                        >
                          <Volume2 className="h-4 w-4 text-emerald-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex items-center justify-between mt-8 mb-4">
              <Button variant="outline" disabled={selectedSurah <= 1}
                onClick={() => setSelectedSurah(s => s - 1)}
                className="border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10" data-testid="button-prev-surah">
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-emerald-300/50 text-sm">Surah {selectedSurah} of 114</span>
              <Button variant="outline" disabled={selectedSurah >= 114}
                onClick={() => setSelectedSurah(s => s + 1)}
                className="border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10" data-testid="button-next-surah">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {(transcript || isListening) && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 max-w-md w-[calc(100%-2rem)]">
          <div className="bg-black/90 backdrop-blur-xl border border-emerald-500/20 rounded-xl px-4 py-3 text-center">
            {transcript ? (
              <>
                <p className="text-emerald-300/50 text-[10px] uppercase tracking-wider mb-1">You said:</p>
                <p className="text-white text-lg" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>{transcript}</p>
              </>
            ) : isListening ? (
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <p className="text-emerald-300/70 text-sm">Listening... Start reciting the highlighted ayah</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className="sticky bottom-0 z-50 bg-black/40 backdrop-blur-xl border-t border-emerald-500/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => { setCurrentAyah(0); currentAyahRef.current = 0; setMistakeAyah(null); setMistakes(0); setCorrectAyahs(new Set()); correctAyahsRef.current = new Set(); setTranscript(""); }}
            className="text-emerald-300/50 hover:text-emerald-300 hover:bg-white/5" data-testid="button-reset">
            <RotateCcw className="h-4 w-4" />
          </Button>

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening
                  ? "bg-red-500 shadow-lg shadow-red-500/40 scale-110"
                  : "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/30 hover:scale-105"
              }`}
              data-testid="button-mic"
            >
              {isListening && (
                <>
                  <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                  <span className="absolute inset-[-4px] rounded-full border-2 border-red-400/30 animate-pulse" />
                </>
              )}
              {isListening ? <MicOff className="h-6 w-6 text-white relative z-10" /> : <Mic className="h-6 w-6 text-white relative z-10" />}
            </button>
            <p className={`text-[10px] font-medium ${isListening ? "text-red-400" : "text-emerald-400/60"}`}>
              {isListening ? "Tap to stop" : "Tap to recite"}
            </p>
          </div>

          {statusMessage && (
            <p className={`text-xs max-w-[120px] text-center ${mistakeAyah !== null ? "text-red-400" : "text-emerald-400"}`}>
              {statusMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
