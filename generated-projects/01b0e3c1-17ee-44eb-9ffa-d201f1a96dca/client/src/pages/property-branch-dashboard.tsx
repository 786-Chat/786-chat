import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2, Home, Users, FileText, CreditCard, Settings, LogOut,
  ChevronRight, Bell, Search, Plus, Edit, MapPin, Phone, Mail,
  Crown, BarChart3, TrendingUp, DollarSign, Eye, Clock, CheckCircle,
  ChevronLeft, Globe, Sparkles, ArrowUpRight, ArrowDownRight,
  Bed, Bath, Calendar, Image, MessageSquare, Star, Video, Save, Upload, ExternalLink, Trash2, Volume2, Layers, Key, Rocket, MousePointer, Play, Mic, Square, Pause, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface PropertyBranch {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  commissionRate: string;
  visitCharges: string;
  monthlyFee?: string | null;
  agreedPrice?: string | null;
  currency?: string;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
  whatsappNumber?: string | null;
  ownerName?: string | null;
  videoUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  youtubeUrl?: string | null;
  contactBgImages?: string[];
  advantages?: { title: string; description: string; icon: string }[];
  featuredProperties?: {
    id: string;
    title: string;
    location: string;
    price: string;
    type: string;
    beds: number;
    baths: number;
    area: string;
    image: string;
    videoUrl?: string;
    soldOut?: boolean;
    description?: string;
  }[];
  announcementText?: string | null;
  announcementEnabled?: boolean;
  welcomeVoiceUrl?: string | null;
  welcomeVoiceEnabled?: boolean;
  heroTagline?: string | null;
  heroTitle1?: string | null;
  heroTitle2?: string | null;
  heroTitle3?: string | null;
  heroDescription?: string | null;
  servicesTagline?: string | null;
  servicesTitle?: string | null;
  servicesDescription?: string | null;
  serviceCards?: { title: string; description: string; icon: string; color: string }[];
  introEnabled?: boolean;
  introSoundEnabled?: boolean;
  introSoundUrl?: string | null;
  clickSoundEnabled?: boolean;
  hoverSoundEnabled?: boolean;
  introText?: string | null;
  visitFee?: number;
  paymentMethods?: string[];
  easypaisaNumber?: string | null;
  jazzcashNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountTitle?: string | null;
  mapEmbedUrl?: string | null;
}

interface Appointment {
  id: string;
  branch_id: string;
  customer_name: string;
  customer_phone: string;
  property_name: string;
  visit_date: string;
  visit_time: string;
  visit_code: string;
  payment_method: string;
  payment_status: string;
  visit_fee: number;
  status: string;
  notes?: string;
  confirmed_at?: string;
  created_at: string;
}

interface Property {
  id: string;
  branchId: string;
  title: string;
  propertyType: string;
  purpose: string;
  propertyId: string;
  address: string;
  city: string;
  areaBlock: string;
  googleMapLink?: string;
  coveredArea: string;
  areaUnit: string;
  bedrooms: number;
  bathrooms: number;
  parking: boolean;
  furnished: boolean;
  price: string;
  negotiable: boolean;
  commissionPercent: number;
  images: string[];
  documents?: string[];
  availableFrom?: string;
  possessionStatus: string;
  dealerName: string;
  dealerPhone: string;
  dealerEmail?: string;
  isActive: boolean;
  createdAt: string;
}

interface Inquiry {
  id: string;
  branch_id: string;
  property_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  cnic?: string;
  purpose: string;
  budget_range?: string;
  preferred_date?: string;
  preferred_time?: string;
  message?: string;
  status: string;
  created_at: string;
}

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: "up" | "down";
  icon: React.ElementType;
}

const sidebarItems = [
  { icon: BarChart3, label: "Dashboard", id: "dashboard" },
  { icon: Building2, label: "Properties", id: "properties" },
  { icon: Home, label: "Featured", id: "featured" },
  { icon: Users, label: "Clients", id: "clients" },
  { icon: Calendar, label: "Appointments", id: "appointments" },
  { icon: CreditCard, label: "Payments", id: "payments" },
  { icon: MessageSquare, label: "Inquiries", id: "inquiries" },
  { icon: Star, label: "Advantages", id: "advantages" },
  { icon: Sparkles, label: "Hero Text", id: "herotext" },
  { icon: Layers, label: "Services", id: "services" },
  { icon: Video, label: "Video Links", id: "videolinks" },
  { icon: Volume2, label: "Voice", id: "voice" },
  { icon: Rocket, label: "Opening", id: "opening" },
  { icon: Settings, label: "Settings", id: "settings" },
];

function ContactBgPreviewSlider({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="relative h-32 rounded-lg overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`Preview ${currentIndex + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      </AnimatePresence>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? 'bg-amber-400' : 'bg-white/40'}`}
          />
        ))}
      </div>
      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}

function FeaturedPropertiesTab({ branch }: { branch: PropertyBranch }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [properties, setProperties] = useState(branch.featuredProperties || []);
  const [newProperty, setNewProperty] = useState({
    title: '', location: '', price: '', type: 'Sale', beds: 0, baths: 0, area: '', image: '', videoUrl: '', soldOut: false, description: ''
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/property-branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/property-branches/slug/${branch.slug}`] });
      toast({ title: "Properties updated!", description: "Your featured properties have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    }
  });

  const addProperty = () => {
    if (!newProperty.title || !newProperty.image) {
      toast({ title: "Missing fields", description: "Title and image are required", variant: "destructive" });
      return;
    }
    const prop = { ...newProperty, id: Date.now().toString() };
    const updated = [...properties, prop];
    setProperties(updated);
    updateMutation.mutate({ featuredProperties: updated });
    setNewProperty({ title: '', location: '', price: '', type: 'Sale', beds: 0, baths: 0, area: '', image: '', videoUrl: '', soldOut: false, description: '' });
  };

  const removeProperty = (id: string) => {
    const updated = properties.filter(p => p.id !== id);
    setProperties(updated);
    updateMutation.mutate({ featuredProperties: updated });
  };

  const toggleSoldOut = (id: string) => {
    const updated = properties.map(p => p.id === id ? { ...p, soldOut: !p.soldOut } : p);
    setProperties(updated);
    updateMutation.mutate({ featuredProperties: updated });
  };

  const updateProperty = (id: string, field: string, value: any) => {
    const updated = properties.map(p => p.id === id ? { ...p, [field]: value } : p);
    setProperties(updated);
  };

  const saveProperty = (id: string) => {
    updateMutation.mutate({ featuredProperties: properties });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Home className="w-5 h-5 text-emerald-400" />
          Add New Featured Property
        </h2>
        
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <Input value={newProperty.title} onChange={(e) => setNewProperty({...newProperty, title: e.target.value})} placeholder="Property Title *" className="bg-white/5 border-emerald-500/30 text-white" />
          <Input value={newProperty.location} onChange={(e) => setNewProperty({...newProperty, location: e.target.value})} placeholder="Location" className="bg-white/5 border-emerald-500/30 text-white" />
          <Input value={newProperty.price} onChange={(e) => setNewProperty({...newProperty, price: e.target.value})} placeholder="Price (e.g., Rs. 5.5 Crore)" className="bg-white/5 border-emerald-500/30 text-white" />
        </div>
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <select value={newProperty.type} onChange={(e) => setNewProperty({...newProperty, type: e.target.value})} className="bg-white/5 border border-emerald-500/30 text-white rounded-md px-3 py-2">
            <option value="Sale" className="bg-gray-900">For Sale</option>
            <option value="Rent" className="bg-gray-900">For Rent</option>
          </select>
          <Input type="number" value={newProperty.beds} onChange={(e) => setNewProperty({...newProperty, beds: parseInt(e.target.value) || 0})} placeholder="Beds" className="bg-white/5 border-emerald-500/30 text-white" />
          <Input type="number" value={newProperty.baths} onChange={(e) => setNewProperty({...newProperty, baths: parseInt(e.target.value) || 0})} placeholder="Baths" className="bg-white/5 border-emerald-500/30 text-white" />
          <Input value={newProperty.area} onChange={(e) => setNewProperty({...newProperty, area: e.target.value})} placeholder="Area (e.g., 1 Kanal)" className="bg-white/5 border-emerald-500/30 text-white" />
        </div>
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <Input value={newProperty.image} onChange={(e) => setNewProperty({...newProperty, image: e.target.value})} placeholder="Image URL *" className="bg-white/5 border-emerald-500/30 text-white" />
          <Input value={newProperty.videoUrl} onChange={(e) => setNewProperty({...newProperty, videoUrl: e.target.value})} placeholder="Video URL (optional - for TV preview)" className="bg-white/5 border-purple-500/30 text-white" />
        </div>
        <div className="mb-4">
          <textarea 
            value={newProperty.description} 
            onChange={(e) => setNewProperty({...newProperty, description: e.target.value})} 
            placeholder="Property Description (shown in Details popup)" 
            className="w-full bg-white/5 border border-emerald-500/30 text-white rounded-md px-3 py-2 min-h-[80px]"
          />
        </div>
        <Button onClick={addProperty} className="bg-emerald-500 hover:bg-emerald-600">
          <Plus className="w-4 h-4 mr-2" /> Add Property
        </Button>
      </div>

      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6">
        <h2 className="text-xl font-bold mb-4">Featured Properties ({properties.length})</h2>
        
        {properties.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No featured properties yet. Add one above!</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {properties.map((prop, index) => (
              <motion.div
                key={prop.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border ${prop.soldOut ? 'border-red-500/50' : 'border-emerald-500/30'} rounded-xl p-4`}
              >
                {prop.soldOut && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded font-bold z-10">SOLD OUT</div>
                )}
                <div className="flex gap-3 mb-3">
                  <img src={prop.image} alt={prop.title} className="w-20 h-20 object-cover rounded-lg" />
                  <div className="flex-1">
                    <Input value={prop.title} onChange={(e) => updateProperty(prop.id, 'title', e.target.value)} className="bg-white/5 border-emerald-500/30 text-white mb-1 text-sm h-8" />
                    <Input value={prop.location} onChange={(e) => updateProperty(prop.id, 'location', e.target.value)} className="bg-white/5 border-emerald-500/30 text-white text-sm h-8" placeholder="Location" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Input value={prop.price} onChange={(e) => updateProperty(prop.id, 'price', e.target.value)} className="bg-white/5 border-emerald-500/30 text-white text-xs h-7" placeholder="Price" />
                  <Input value={prop.area} onChange={(e) => updateProperty(prop.id, 'area', e.target.value)} className="bg-white/5 border-emerald-500/30 text-white text-xs h-7" placeholder="Area" />
                  <select value={prop.type} onChange={(e) => updateProperty(prop.id, 'type', e.target.value)} className="bg-white/5 border border-emerald-500/30 text-white rounded-md px-2 text-xs h-7">
                    <option value="Sale" className="bg-gray-900">Sale</option>
                    <option value="Rent" className="bg-gray-900">Rent</option>
                  </select>
                </div>
                <Input value={prop.videoUrl || ''} onChange={(e) => updateProperty(prop.id, 'videoUrl', e.target.value)} className="bg-white/5 border-purple-500/30 text-white text-xs h-7 mb-2" placeholder="Video URL for TV preview" />
                <textarea value={prop.description || ''} onChange={(e) => updateProperty(prop.id, 'description', e.target.value)} className="w-full bg-white/5 border border-emerald-500/30 text-white rounded-md px-2 py-1 text-xs mb-2 min-h-[50px]" placeholder="Description for Details popup" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveProperty(prop.id)} className="bg-emerald-500 hover:bg-emerald-600 text-xs flex-1">
                    <Save className="w-3 h-3 mr-1" /> Save
                  </Button>
                  <Button size="sm" onClick={() => toggleSoldOut(prop.id)} className={`${prop.soldOut ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'} text-xs`}>
                    {prop.soldOut ? 'Mark Available' : 'Mark Sold'}
                  </Button>
                  <Button size="sm" onClick={() => removeProperty(prop.id)} className="bg-red-500 hover:bg-red-600 text-xs">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const iconOptions = [
  { value: "shield", label: "Shield (Verified)" },
  { value: "file", label: "File (Documents)" },
  { value: "clock", label: "Clock (24/7)" },
  { value: "globe", label: "Globe (Network)" },
  { value: "star", label: "Star (Quality)" },
  { value: "home", label: "Home (Properties)" },
  { value: "users", label: "Users (Team)" },
  { value: "phone", label: "Phone (Support)" },
];

function VoiceAnnouncementTab({ branch }: { branch: PropertyBranch }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [announcementText, setAnnouncementText] = useState(branch.announcementText || "KING'S PROPERTY GROUP");
  const [announcementEnabled, setAnnouncementEnabled] = useState(branch.announcementEnabled !== false);
  const [welcomeVoiceEnabled, setWelcomeVoiceEnabled] = useState(branch.welcomeVoiceEnabled || false);
  const [welcomeVoiceUrl, setWelcomeVoiceUrl] = useState(branch.welcomeVoiceUrl || "");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/property-branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/property-branches/slug/${branch.slug}`] });
      toast({ title: "Voice settings saved!", description: "Your announcement has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    }
  });

  const saveSettings = () => {
    updateMutation.mutate({ announcementText, announcementEnabled, welcomeVoiceEnabled });
  };

  const testVoice = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(announcementText);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
      toast({ title: "Playing announcement", description: `"${announcementText}"` });
    } else {
      toast({ title: "Not supported", description: "Your browser doesn't support text-to-speech", variant: "destructive" });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        setAudioChunks(chunks);
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      toast({ title: "Recording started", description: "Speak your welcome message now" });
    } catch (error) {
      toast({ title: "Microphone access denied", description: "Please allow microphone access to record", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      toast({ title: "Recording stopped", description: "You can now preview and upload your recording" });
    }
  };

  const uploadRecordedAudio = async () => {
    if (audioChunks.length === 0) {
      toast({ title: "No recording", description: "Please record audio first", variant: "destructive" });
      return;
    }
    
    setIsUploading(true);
    try {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob, `welcome-voice-${Date.now()}.webm`);
      
      const response = await fetch(`/api/property-branches/${branch.id}/upload-voice`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setWelcomeVoiceUrl(data.url);
      setWelcomeVoiceEnabled(true);
      queryClient.invalidateQueries({ queryKey: [`/api/property-branches/slug/${branch.slug}`] });
      toast({ title: "Voice uploaded!", description: "Your custom welcome voice is now active" });
    } catch (error) {
      toast({ title: "Upload failed", description: "Failed to upload audio", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['audio/', 'video/mp4', 'video/webm'];
    const isValidType = validTypes.some(type => file.type.startsWith(type) || file.type === type);
    if (!isValidType) {
      toast({ title: "Invalid file", description: "Please select an audio file (MP3, WAV, MP4, etc.)", variant: "destructive" });
      return;
    }
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      
      const response = await fetch(`/api/property-branches/${branch.id}/upload-voice`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setWelcomeVoiceUrl(data.url);
      setWelcomeVoiceEnabled(true);
      queryClient.invalidateQueries({ queryKey: [`/api/property-branches/slug/${branch.slug}`] });
      toast({ title: "Voice uploaded!", description: "Your custom welcome voice is now active" });
    } catch (error) {
      toast({ title: "Upload failed", description: "Failed to upload audio", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const playCustomVoice = () => {
    if (welcomeVoiceUrl && audioRef.current) {
      audioRef.current.play();
    } else if (recordedAudioUrl) {
      const audio = new Audio(recordedAudioUrl);
      audio.play();
    }
  };

  const deleteCustomVoice = async () => {
    try {
      await updateMutation.mutateAsync({ welcomeVoiceUrl: null, welcomeVoiceEnabled: false });
      setWelcomeVoiceUrl("");
      setWelcomeVoiceEnabled(false);
      setRecordedAudioUrl(null);
      setAudioChunks([]);
      toast({ title: "Voice deleted", description: "Custom voice has been removed" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete voice", variant: "destructive" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Text-to-Speech Section */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-purple-400" />
          Text-to-Speech Announcement
        </h2>
        <p className="text-gray-400 mb-6">
          When visitors open your website, this text will be spoken aloud using computer voice.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Announcement Text</label>
            <Input 
              value={announcementText} 
              onChange={(e) => setAnnouncementText(e.target.value)} 
              placeholder="e.g., Welcome to KING'S PROPERTY GROUP" 
              className="bg-white/5 border-purple-500/30 text-white text-lg"
            />
            <p className="text-xs text-gray-500 mt-1">This text will be spoken when the website opens</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={announcementEnabled} 
                onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
            <span className="text-sm text-gray-300">Enable text-to-speech announcement</span>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={testVoice} variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20">
              <Volume2 className="w-4 h-4 mr-2" /> Test Voice
            </Button>
            <Button onClick={saveSettings} className="bg-purple-500 hover:bg-purple-600">
              <Save className="w-4 h-4 mr-2" /> Save Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Custom Voice Recording Section */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Mic className="w-5 h-5 text-cyan-400" />
          Custom Voice Recording
        </h2>
        <p className="text-gray-400 mb-6">
          Record your own voice message that will play during the moon landing intro when customers visit your website.
        </p>
        
        <div className="space-y-4">
          {/* Recording Controls */}
          <div className="flex flex-wrap gap-3">
            {!isRecording ? (
              <Button onClick={startRecording} className="bg-red-500 hover:bg-red-600">
                <Mic className="w-4 h-4 mr-2" /> Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} className="bg-gray-600 hover:bg-gray-700 animate-pulse">
                <Square className="w-4 h-4 mr-2" /> Stop Recording
              </Button>
            )}
            
            {recordedAudioUrl && !isRecording && (
              <>
                <Button onClick={() => new Audio(recordedAudioUrl).play()} variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20">
                  <Play className="w-4 h-4 mr-2" /> Preview Recording
                </Button>
                <Button onClick={uploadRecordedAudio} disabled={isUploading} className="bg-cyan-500 hover:bg-cyan-600">
                  <Upload className="w-4 h-4 mr-2" /> {isUploading ? "Uploading..." : "Upload Recording"}
                </Button>
              </>
            )}
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 text-red-400">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span>Recording in progress...</span>
            </div>
          )}

          {/* File Upload */}
          <div className="border-t border-gray-600 pt-4 mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Or Upload Audio File</label>
            <div className="flex gap-3 items-center flex-wrap">
              <input 
                type="file" 
                accept="audio/*,.mp4,.m4a,.opus,.ogg,.mp3,.wav,.webm,.aac" 
                onChange={handleFileUpload}
                className="hidden" 
                id="audio-upload"
                disabled={isUploading}
              />
              <label htmlFor="audio-upload" className={`cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span className="text-gray-300">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-cyan-400" />
                      <span className="text-gray-300">Choose Audio File</span>
                    </>
                  )}
                </div>
              </label>
              <span className="text-xs text-gray-500">MP3, WAV, WebM, OGG (max 10MB)</span>
            </div>
          </div>

          {/* Current Custom Voice */}
          {welcomeVoiceUrl && (
            <div className="border-t border-gray-600 pt-4 mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Current Custom Voice</label>
              <div className="flex items-center gap-3">
                <audio ref={audioRef} src={welcomeVoiceUrl} className="hidden" />
                <Button onClick={playCustomVoice} variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/20">
                  <Play className="w-4 h-4 mr-2" /> Play Current Voice
                </Button>
                <Button onClick={deleteCustomVoice} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/20">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={welcomeVoiceEnabled} 
                      onChange={(e) => {
                        setWelcomeVoiceEnabled(e.target.checked);
                        updateMutation.mutate({ welcomeVoiceEnabled: e.target.checked });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                  <span className="text-sm text-gray-300">Enable custom voice</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            Note: Custom voice will play during the moon landing animation when customers open your website. 
            If no custom voice is set, the text-to-speech announcement will be used instead.
          </p>

          {/* Save Button */}
          <div className="border-t border-gray-600 pt-4 mt-4">
            <Button 
              onClick={saveSettings} 
              className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold py-3"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save Voice Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HeroTextTab({ branch }: { branch: PropertyBranch }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [heroTagline, setHeroTagline] = useState(branch.heroTagline || "Premium Real Estate in Pakistan");
  const [heroTitle1, setHeroTitle1] = useState(branch.heroTitle1 || "Find Your");
  const [heroTitle2, setHeroTitle2] = useState(branch.heroTitle2 || "Dream Property");
  const [heroTitle3, setHeroTitle3] = useState(branch.heroTitle3 || "Faster");
  const [heroDescription, setHeroDescription] = useState(branch.heroDescription || "offers premium properties for sale and rent. Buy, sell, or rent with");

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/property-branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/property-branches/slug/${branch.slug}`] });
      toast({ title: "Hero text saved!", description: "Your website hero section has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    }
  });

  const saveSettings = () => {
    updateMutation.mutate({ heroTagline, heroTitle1, heroTitle2, heroTitle3, heroDescription });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          Hero Section Text
        </h2>
        <p className="text-gray-400 mb-6">
          Customize the main hero text that visitors see when they open your website.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tagline Badge</label>
            <Input 
              value={heroTagline} 
              onChange={(e) => setHeroTagline(e.target.value)} 
              placeholder="Premium Real Estate in Pakistan" 
              className="bg-white/5 border-emerald-500/30 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Small badge text at the top</p>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title Line 1 (White)</label>
              <Input 
                value={heroTitle1} 
                onChange={(e) => setHeroTitle1(e.target.value)} 
                placeholder="Find Your" 
                className="bg-white/5 border-white/30 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-400 mb-2">Title Line 2 (Green Animated)</label>
              <Input 
                value={heroTitle2} 
                onChange={(e) => setHeroTitle2(e.target.value)} 
                placeholder="Dream Property" 
                className="bg-white/5 border-emerald-500/30 text-emerald-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title Line 3 (White)</label>
              <Input 
                value={heroTitle3} 
                onChange={(e) => setHeroTitle3(e.target.value)} 
                placeholder="Faster" 
                className="bg-white/5 border-white/30 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description Text</label>
            <Input 
              value={heroDescription} 
              onChange={(e) => setHeroDescription(e.target.value)} 
              placeholder="offers premium properties for sale and rent..." 
              className="bg-white/5 border-emerald-500/30 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Your branch name and commission rate will be added automatically</p>
          </div>

          <div className="pt-4">
            <Button onClick={saveSettings} className="bg-emerald-500 hover:bg-emerald-600">
              <Save className="w-4 h-4 mr-2" /> Save Hero Text
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const colorOptions = [
  { value: "cyan", label: "Cyan (Blue-Green)" },
  { value: "emerald", label: "Emerald (Green)" },
  { value: "purple", label: "Purple" },
  { value: "amber", label: "Amber (Yellow)" },
  { value: "rose", label: "Rose (Pink)" },
  { value: "blue", label: "Blue" },
];

const serviceIconOptions = [
  { value: "home", label: "Home (Buy)" },
  { value: "key", label: "Key (Rent)" },
  { value: "trending", label: "Trending (Sell)" },
  { value: "building", label: "Building" },
  { value: "map", label: "Map" },
  { value: "dollar", label: "Dollar" },
];

interface VideoLink {
  id: string;
  branchId: string;
  title: string;
  url: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

function VideoLinksTab({ branchId }: { branchId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [category, setCategory] = useState("property_tours");

  const { data: videoLinks = [], isLoading } = useQuery<VideoLink[]>({
    queryKey: [`/api/property-branches/${branchId}/video-links`],
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/property-branches/${branchId}/video-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, url: newUrl, category }),
      });
      if (!res.ok) throw new Error("Failed to add video link");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/property-branches/${branchId}/video-links`] });
      setNewTitle("");
      setNewUrl("");
      toast({ title: "Video link added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add video link", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/property-video-links/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/property-branches/${branchId}/video-links`] });
      toast({ title: "Video link deleted" });
    },
  });

  const propertyTourLinks = videoLinks.filter(l => l.category === "property_tours");
  const marketUpdateLinks = videoLinks.filter(l => l.category === "market_updates");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Video Links</h2>
      </div>

      <div className="bg-[#0d1f35] rounded-xl p-6 border border-cyan-500/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-cyan-400" /> Add New Video Link
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Title (e.g., Property Tour - 5 Marla House)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="bg-[#0a1628] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500 outline-none"
          />
          <input
            type="text"
            placeholder="YouTube URL"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="bg-[#0a1628] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500 outline-none"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#0a1628] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 outline-none"
          >
            <option value="property_tours">Property Tours</option>
            <option value="market_updates">Market Updates</option>
          </select>
          <Button
            onClick={() => addMutation.mutate()}
            disabled={!newTitle || !newUrl || addMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Link
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#0d1f35] rounded-xl p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" /> Property Tours ({propertyTourLinks.length})
          </h3>
          {isLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : propertyTourLinks.length === 0 ? (
            <p className="text-gray-500 text-sm">No property tour links added yet</p>
          ) : (
            <div className="space-y-2">
              {propertyTourLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between bg-[#0a1628] rounded-lg p-3 border border-gray-700">
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{link.title}</p>
                    <p className="text-gray-500 text-xs truncate max-w-[200px]">{link.url}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(link.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#0d1f35] rounded-xl p-6 border border-emerald-500/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Market Updates ({marketUpdateLinks.length})
          </h3>
          {isLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : marketUpdateLinks.length === 0 ? (
            <p className="text-gray-500 text-sm">No market update links added yet</p>
          ) : (
            <div className="space-y-2">
              {marketUpdateLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between bg-[#0a1628] rounded-lg p-3 border border-gray-700">
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{link.title}</p>
                    <p className="text-gray-500 text-xs truncate max-w-[200px]">{link.url}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(link.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ServicesTab({ branch }: { branch: PropertyBranch }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const defaultCards = [
    { title: "Buy Property", description: "Find your dream home from our extensive collection of residential and commercial properties.", icon: "home", color: "cyan" },
    { title: "Rent Property", description: "Discover premium rental properties with flexible terms and transparent pricing.", icon: "key", color: "emerald" },
    { title: "Sell Property", description: "Get the best value for your property with our expert valuation and marketing.", icon: "trending", color: "purple" }
  ];
  
  const [servicesTagline, setServicesTagline] = useState(branch.servicesTagline || "Our Services");
  const [servicesTitle, setServicesTitle] = useState(branch.servicesTitle || "What We Offer");
  const [servicesDescription, setServicesDescription] = useState(branch.servicesDescription || "Comprehensive real estate solutions tailored to your needs");
  const [serviceCards, setServiceCards] = useState(branch.serviceCards || defaultCards);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/property-branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/property-branches/slug/${branch.slug}`] });
      toast({ title: "Services saved!", description: "Your services section has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    }
  });

  const updateCard = (index: number, field: string, value: string) => {
    const updated = [...serviceCards];
    updated[index] = { ...updated[index], [field]: value };
    setServiceCards(updated);
  };

  const saveAll = () => {
    updateMutation.mutate({ servicesTagline, servicesTitle, servicesDescription, serviceCards });
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      cyan: "border-cyan-500 bg-cyan-500/10",
      emerald: "border-emerald-500 bg-emerald-500/10",
      purple: "border-purple-500 bg-purple-500/10",
      amber: "border-amber-500 bg-amber-500/10",
      rose: "border-rose-500 bg-rose-500/10",
      blue: "border-blue-500 bg-blue-500/10",
    };
    return colors[color] || colors.cyan;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          Services Section Text
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tagline</label>
            <Input value={servicesTagline} onChange={(e) => setServicesTagline(e.target.value)} placeholder="Our Services" className="bg-white/5 border-cyan-500/30 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <Input value={servicesTitle} onChange={(e) => setServicesTitle(e.target.value)} placeholder="What We Offer" className="bg-white/5 border-cyan-500/30 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <Input value={servicesDescription} onChange={(e) => setServicesDescription(e.target.value)} placeholder="Comprehensive real estate..." className="bg-white/5 border-cyan-500/30 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6">
        <h2 className="text-xl font-bold mb-4">Service Cards ({serviceCards.length})</h2>
        
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          {serviceCards.map((card, index) => (
            <div key={index} className={`p-4 rounded-xl border-2 ${getColorClass(card.color)}`}>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                <Input value={card.title} onChange={(e) => updateCard(index, 'title', e.target.value)} className="bg-white/5 border-white/20 text-white text-sm h-8" />
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                <textarea 
                  value={card.description} 
                  onChange={(e) => updateCard(index, 'description', e.target.value)} 
                  className="w-full bg-white/5 border border-white/20 text-white text-xs rounded-md p-2 h-16 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Icon</label>
                  <select value={card.icon} onChange={(e) => updateCard(index, 'icon', e.target.value)} className="w-full bg-white/5 border border-white/20 text-white rounded-md px-2 py-1 text-xs">
                    {serviceIconOptions.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-gray-900">{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Color</label>
                  <select value={card.color} onChange={(e) => updateCard(index, 'color', e.target.value)} className="w-full bg-white/5 border border-white/20 text-white rounded-md px-2 py-1 text-xs">
                    {colorOptions.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-gray-900">{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={saveAll} className="bg-cyan-500 hover:bg-cyan-600">
          <Save className="w-4 h-4 mr-2" /> Save All Services
        </Button>
      </div>
    </motion.div>
  );
}

function OpeningControlTab({ branch }: { branch: PropertyBranch }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement>(null);
  const recordedAudioRef = useRef<HTMLAudioElement>(null);
  
  const [introEnabled, setIntroEnabled] = useState(branch.introEnabled !== false);
  const [introSoundEnabled, setIntroSoundEnabled] = useState(branch.introSoundEnabled !== false);
  const [clickSoundEnabled, setClickSoundEnabled] = useState(branch.clickSoundEnabled !== false);
  const [hoverSoundEnabled, setHoverSoundEnabled] = useState(branch.hoverSoundEnabled !== false);
  const [introText, setIntroText] = useState(branch.introText || "Welcome to");
  const [introSoundUrl, setIntroSoundUrl] = useState(branch.introSoundUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingRecorded, setIsUploadingRecorded] = useState(false);

  // Fetch video links for intro audio
  const { data: videoLinks = [] } = useQuery<{ id: string; branchId: string; title: string; url: string; category: string; displayOrder: number; isActive: boolean }[]>({
    queryKey: ["/api/property-branches", branch.id, "video-links"],
    queryFn: async () => {
      const res = await fetch(`/api/property-branches/${branch.id}/video-links`);
      return res.json();
    },
  });

  const introAudioLink = videoLinks.find(link => link.category === 'intro_audio');

  const handleRecordedAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['audio/', 'video/mp4', 'video/webm'];
    const isValidType = validTypes.some(type => file.type.startsWith(type) || file.type === type);
    if (!isValidType) {
      toast({ title: "Invalid file", description: "Please select an audio file (MP3, WAV, MP4, etc.)", variant: "destructive" });
      return;
    }
    
    setIsUploadingRecorded(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      
      const response = await fetch(`/api/property-branches/${branch.id}/upload-intro-audio-link`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error("Upload failed");
      queryClient.invalidateQueries({ queryKey: ["/api/property-branches", branch.id, "video-links"] });
      toast({ title: "Recorded audio uploaded!", description: "Your recorded welcome audio is now active on the moon intro" });
    } catch (error) {
      toast({ title: "Upload failed", description: "Failed to upload audio", variant: "destructive" });
    } finally {
      setIsUploadingRecorded(false);
    }
  };

  const playRecordedAudio = () => {
    if (introAudioLink?.url && recordedAudioRef.current) {
      recordedAudioRef.current.play();
    }
  };

  const deleteRecordedAudio = async () => {
    if (!introAudioLink) return;
    try {
      await fetch(`/api/property-video-links/${introAudioLink.id}`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: ["/api/property-branches", branch.id, "video-links"] });
      toast({ title: "Recorded audio deleted", description: "The moon intro will use standard intro sound" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete recorded audio", variant: "destructive" });
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['audio/', 'video/mp4', 'video/webm'];
    const isValidType = validTypes.some(type => file.type.startsWith(type) || file.type === type);
    if (!isValidType) {
      toast({ title: "Invalid file", description: "Please select an audio file (MP3, WAV, MP4, etc.)", variant: "destructive" });
      return;
    }
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      
      const response = await fetch(`/api/property-branches/${branch.id}/upload-intro-sound`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setIntroSoundUrl(data.url);
      queryClient.invalidateQueries({ queryKey: [`/api/property-branches/slug/${branch.slug}`] });
      toast({ title: "Intro sound uploaded!", description: "Your custom intro sound is now active" });
    } catch (error) {
      toast({ title: "Upload failed", description: "Failed to upload audio", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const playIntroSound = () => {
    if (introSoundUrl && audioRef.current) {
      audioRef.current.play();
    }
  };

  const deleteIntroSound = async () => {
    try {
      await fetch(`/api/property-branches/${branch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ introSoundUrl: null })
      });
      setIntroSoundUrl(null);
      queryClient.invalidateQueries({ queryKey: [`/api/property-branches/slug/${branch.slug}`] });
      toast({ title: "Intro sound deleted", description: "Using default intro sound" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete intro sound", variant: "destructive" });
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/property-branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/property-branches/slug/${branch.slug}`] });
      toast({ title: "Opening settings saved!", description: "Your intro and sound settings have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    }
  });

  const saveSettings = () => {
    updateMutation.mutate({ introEnabled, introSoundEnabled, clickSoundEnabled, hoverSoundEnabled, introText });
  };

  const testSound = (type: string) => {
    const sounds: Record<string, string> = {
      intro: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
      click: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
      hover: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
    };
    const audio = new Audio(sounds[type]);
    audio.volume = type === 'hover' ? 0.2 : 0.5;
    audio.play();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 mb-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-purple-400" />
          Opening Animation Control
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Moon-to-Earth Intro Animation</h3>
                <p className="text-sm text-gray-400">Show animated intro when website opens</p>
              </div>
            </div>
            <button
              onClick={() => setIntroEnabled(!introEnabled)}
              className={`w-14 h-7 rounded-full transition-all ${introEnabled ? 'bg-purple-500' : 'bg-gray-600'}`}
            >
              <motion.div
                className="w-5 h-5 bg-white rounded-full shadow-lg"
                animate={{ x: introEnabled ? 28 : 4 }}
                transition={{ type: "spring", stiffness: 500 }}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Intro Welcome Text</label>
            <Input
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
              placeholder="Welcome to"
              className="bg-white/5 border-purple-500/30 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">This text appears before your branch name during intro</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6 mb-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-cyan-400" />
          Sound Effects Control
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Play className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Intro Sound</h3>
                <p className="text-sm text-gray-400">Play sound during opening animation</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => testSound('intro')} className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20">
                Test Default
              </Button>
              <button
                onClick={() => setIntroSoundEnabled(!introSoundEnabled)}
                className={`w-14 h-7 rounded-full transition-all ${introSoundEnabled ? 'bg-cyan-500' : 'bg-gray-600'}`}
              >
                <motion.div
                  className="w-5 h-5 bg-white rounded-full shadow-lg"
                  animate={{ x: introSoundEnabled ? 28 : 4 }}
                  transition={{ type: "spring", stiffness: 500 }}
                />
              </button>
            </div>
          </div>

          {/* Custom Intro Sound Upload */}
          <div className="p-4 bg-white/5 rounded-xl border border-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Upload className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Custom Intro Sound</h3>
                <p className="text-sm text-gray-400">Upload your own intro sound for the moon animation</p>
              </div>
            </div>
            
            <div className="flex gap-3 items-center flex-wrap">
              <input 
                type="file" 
                accept="audio/*,.mp4,.m4a,.opus,.ogg,.mp3,.wav,.webm,.aac" 
                onChange={handleAudioUpload}
                className="hidden" 
                id="intro-sound-upload"
                disabled={isUploading}
              />
              <label htmlFor="intro-sound-upload" className={`cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                      <span className="text-purple-300">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-300">Upload Audio File</span>
                    </>
                  )}
                </div>
              </label>
              <span className="text-xs text-gray-500">MP3, WAV, MP4, WebM (max 10MB)</span>
            </div>
            
            {/* Current Custom Sound */}
            {introSoundUrl && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Custom Sound</label>
                <div className="flex items-center gap-3">
                  <audio ref={audioRef} src={introSoundUrl} className="hidden" />
                  <Button onClick={playIntroSound} variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/20">
                    <Play className="w-4 h-4 mr-2" /> Play
                  </Button>
                  <Button onClick={deleteIntroSound} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/20">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                  <span className="text-xs text-green-400">Custom sound active</span>
                </div>
              </div>
            )}
          </div>

          {/* Recorded Welcome Audio - plays on moon tap */}
          <div className="p-4 bg-white/5 rounded-xl border border-pink-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <Mic className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Recorded Welcome Audio</h3>
                <p className="text-sm text-gray-400">Upload recorded audio that plays when user taps on moon intro</p>
              </div>
            </div>
            
            <div className="flex gap-3 items-center flex-wrap">
              <input 
                type="file" 
                accept="audio/*,.mp4,.m4a,.opus,.ogg,.mp3,.wav,.webm,.aac" 
                onChange={handleRecordedAudioUpload}
                className="hidden" 
                id="recorded-audio-upload"
                disabled={isUploadingRecorded}
              />
              <label htmlFor="recorded-audio-upload" className={`cursor-pointer ${isUploadingRecorded ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 border border-pink-500/30 rounded-lg hover:bg-pink-500/30 transition-colors">
                  {isUploadingRecorded ? (
                    <>
                      <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
                      <span className="text-pink-300">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-pink-400" />
                      <span className="text-pink-300">Upload Recorded Audio</span>
                    </>
                  )}
                </div>
              </label>
              <span className="text-xs text-gray-500">MP3, WAV, MP4, WhatsApp audio (max 10MB)</span>
            </div>
            
            {/* Current Recorded Audio */}
            {introAudioLink && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Recorded Audio</label>
                <div className="flex items-center gap-3">
                  {introAudioLink.url.toLowerCase().includes('.mp4') ? (
                    <video ref={recordedAudioRef as React.RefObject<HTMLVideoElement>} src={introAudioLink.url} className="hidden" />
                  ) : (
                    <audio ref={recordedAudioRef as React.RefObject<HTMLAudioElement>} src={introAudioLink.url} className="hidden" />
                  )}
                  <Button onClick={playRecordedAudio} variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/20">
                    <Play className="w-4 h-4 mr-2" /> Play
                  </Button>
                  <Button onClick={deleteRecordedAudio} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/20">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                  <span className="text-xs text-pink-400">Plays when user taps moon intro</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <MousePointer className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Click Sound</h3>
                <p className="text-sm text-gray-400">Play sound when clicking buttons</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => testSound('click')} className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20">
                Test
              </Button>
              <button
                onClick={() => setClickSoundEnabled(!clickSoundEnabled)}
                className={`w-14 h-7 rounded-full transition-all ${clickSoundEnabled ? 'bg-emerald-500' : 'bg-gray-600'}`}
              >
                <motion.div
                  className="w-5 h-5 bg-white rounded-full shadow-lg"
                  animate={{ x: clickSoundEnabled ? 28 : 4 }}
                  transition={{ type: "spring", stiffness: 500 }}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <MousePointer className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Hover Sound</h3>
                <p className="text-sm text-gray-400">Play sound when hovering over elements</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => testSound('hover')} className="border-amber-500/30 text-amber-400 hover:bg-amber-500/20">
                Test
              </Button>
              <button
                onClick={() => setHoverSoundEnabled(!hoverSoundEnabled)}
                className={`w-14 h-7 rounded-full transition-all ${hoverSoundEnabled ? 'bg-amber-500' : 'bg-gray-600'}`}
              >
                <motion.div
                  className="w-5 h-5 bg-white rounded-full shadow-lg"
                  animate={{ x: hoverSoundEnabled ? 28 : 4 }}
                  transition={{ type: "spring", stiffness: 500 }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={saveSettings} className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600">
        <Save className="w-4 h-4 mr-2" /> Save Opening Settings
      </Button>
    </motion.div>
  );
}

function AppointmentsTab({ branch }: { branch: PropertyBranch }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: [`/api/property-appointments/${branch.id}`],
    staleTime: 10000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string; paymentStatus?: string }) => {
      const res = await fetch(`/api/property-appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/property-appointments/${branch.id}`] });
      toast({ title: 'Appointment updated!' });
    },
  });

  const openWhatsAppConfirm = (apt: Appointment) => {
    const message = `*Appointment Confirmed* %0A%0AHello ${apt.customer_name},%0A%0AYour property visit has been confirmed!%0A%0A*Visit Code:* ${apt.visit_code}%0A*Property:* ${apt.property_name}%0A*Date:* ${apt.visit_date}%0A*Time:* ${apt.visit_time}%0A*Fee:* Rs ${apt.visit_fee.toLocaleString()}%0A*Payment:* ${apt.payment_method}%0A%0AThank you for choosing ${branch.name}!`;
    const phone = apt.customer_phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    updateMutation.mutate({ id: apt.id, status: 'confirmed' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (isLoading) {
    return <div className="text-center py-10"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-400" />
          Property Visit Appointments ({appointments.length})
        </h2>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-amber-500/20 p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-amber-400 opacity-50" />
          <h3 className="text-lg font-semibold text-gray-300">No appointments yet</h3>
          <p className="text-gray-500">Customer bookings will appear here</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((apt) => (
            <motion.div
              key={apt.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-amber-500/20 p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{apt.customer_name}</h3>
                      <p className="text-sm text-gray-400">{apt.customer_phone}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Visit Code</div>
                      <div className="font-bold text-amber-400">{apt.visit_code}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Date & Time</div>
                      <div className="font-semibold text-white">{apt.visit_date} {apt.visit_time}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Property</div>
                      <div className="font-semibold text-white truncate">{apt.property_name}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Visit Fee</div>
                      <div className="font-bold text-emerald-400">Rs {apt.visit_fee.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(apt.payment_status)}`}>
                      {apt.payment_method} - {apt.payment_status}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    {apt.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => openWhatsAppConfirm(apt)} className="bg-green-600 hover:bg-green-700">
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          Confirm via WhatsApp
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: apt.id, status: 'cancelled' })} className="border-red-500/50 text-red-400">
                          Cancel
                        </Button>
                      </>
                    )}
                    {apt.payment_status === 'pending' && (
                      <Button size="sm" onClick={() => updateMutation.mutate({ id: apt.id, paymentStatus: 'paid' })} className="bg-emerald-600 hover:bg-emerald-700">
                        Mark Paid
                      </Button>
                    )}
                    {apt.status === 'confirmed' && (
                      <Button size="sm" onClick={() => updateMutation.mutate({ id: apt.id, status: 'completed' })} className="bg-blue-600 hover:bg-blue-700">
                        Mark Completed
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function AdvantagesTab({ branch }: { branch: PropertyBranch }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const defaultAdvantages = [
    { title: "Verified Properties", description: "All listings are thoroughly verified", icon: "shield" },
    { title: "Legal Assistance", description: "Complete documentation support", icon: "file" },
    { title: "24/7 Support", description: "Round the clock customer support", icon: "clock" },
    { title: "Wide Network", description: "Extensive network across Pakistan", icon: "globe" }
  ];
  const [advantages, setAdvantages] = useState(branch.advantages || defaultAdvantages);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/property-branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/property-branches/slug/${branch.slug}`] });
      toast({ title: "Advantages updated!", description: "Your changes have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    }
  });

  const updateAdvantage = (index: number, field: string, value: string) => {
    const updated = [...advantages];
    updated[index] = { ...updated[index], [field]: value };
    setAdvantages(updated);
  };

  const handleSave = () => {
    updateMutation.mutate({ advantages });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            Our Advantages Section
          </h2>
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-emerald-500 hover:bg-emerald-600">
            <Save className="w-4 h-4 mr-2" /> Save All Changes
          </Button>
        </div>
        
        <p className="text-gray-400 text-sm mb-6">These cards appear in the "Why Choose Us" section on your website. Edit the title, description, and icon for each advantage.</p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {advantages.map((adv, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <span className="text-white font-bold">{index + 1}</span>
                </div>
                <span className="text-emerald-400 font-semibold">Advantage Card {index + 1}</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Title</label>
                  <Input
                    value={adv.title}
                    onChange={(e) => updateAdvantage(index, 'title', e.target.value)}
                    placeholder="Enter title"
                    className="bg-white/5 border-emerald-500/30 text-white focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Description</label>
                  <Input
                    value={adv.description}
                    onChange={(e) => updateAdvantage(index, 'description', e.target.value)}
                    placeholder="Enter description"
                    className="bg-white/5 border-emerald-500/30 text-white focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Icon</label>
                  <select
                    value={adv.icon}
                    onChange={(e) => updateAdvantage(index, 'icon', e.target.value)}
                    className="w-full bg-white/5 border border-emerald-500/30 text-white rounded-md px-3 py-2 focus:border-emerald-500 outline-none"
                  >
                    {iconOptions.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-gray-900">{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function DashboardPropertiesSection({ branch, primaryColor, secondaryColor }: { branch: PropertyBranch; primaryColor: string; secondaryColor: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [propertyForm, setPropertyForm] = useState({
    title: '',
    propertyType: 'house',
    purpose: 'buy',
    address: '',
    city: '',
    areaBlock: '',
    googleMapLink: '',
    coveredArea: '',
    areaUnit: 'sqft',
    bedrooms: 3,
    bathrooms: 2,
    parking: false,
    furnished: false,
    price: '',
    negotiable: true,
    commissionPercent: 2,
    availableFrom: '',
    possessionStatus: 'ready',
    dealerName: branch.ownerName || '',
    dealerPhone: branch.phone || '',
    dealerEmail: branch.email || '',
    images: [] as string[],
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: [`/api/property-branches/${branch.id}/properties`],
    enabled: !!branch.id,
  });

  const { data: inquiries = [] } = useQuery<Inquiry[]>({
    queryKey: [`/api/property-branches/${branch.id}/inquiries`],
    enabled: !!branch.id,
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (data: typeof propertyForm) => {
      const res = await fetch(`/api/property-branches/${branch.id}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create property');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/property-branches/${branch.id}/properties`] });
      toast({ title: 'Property Added', description: 'Property listing has been created successfully.' });
      setShowAddForm(false);
      setPropertyForm({
        title: '', propertyType: 'house', purpose: 'buy', address: '', city: '', areaBlock: '',
        googleMapLink: '', coveredArea: '', areaUnit: 'sqft', bedrooms: 3, bathrooms: 2,
        parking: false, furnished: false, price: '', negotiable: true, commissionPercent: 2,
        availableFrom: '', possessionStatus: 'ready', dealerName: branch.ownerName || '',
        dealerPhone: branch.phone || '', dealerEmail: branch.email || '', images: [],
      });
    },
  });

  const handleSubmitProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyForm.title || !propertyForm.price || !propertyForm.address) {
      toast({ title: 'Missing Fields', description: 'Please fill in required fields.', variant: 'destructive' });
      return;
    }
    createPropertyMutation.mutate(propertyForm);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Recent Properties</h3>
          <Button 
            size="sm" 
            onClick={() => setShowAddForm(true)}
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Property
          </Button>
        </div>
        
        {properties.length === 0 ? (
          <div className="text-center py-10">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-500" />
            <p className="text-gray-400">No properties yet</p>
            <p className="text-gray-500 text-sm">Add your first property listing</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {properties.slice(0, 5).map((property) => (
              <div key={property.id} className="bg-white/5 border border-cyan-500/20 rounded-lg p-3 flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                  <Home className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{property.title}</p>
                  <p className="text-xs text-gray-400">{property.city} • {property.propertyType}</p>
                  <p className="text-sm text-cyan-400 font-semibold">Rs. {property.price}</p>
                </div>
                <Badge className={property.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}>
                  {property.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Recent Inquiries</h3>
          <Button variant="ghost" size="sm" className="text-cyan-400">View All</Button>
        </div>
        
        {inquiries.length === 0 ? (
          <div className="text-center py-10">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-500" />
            <p className="text-gray-400">No inquiries yet</p>
            <p className="text-gray-500 text-sm">Inquiries will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {inquiries.slice(0, 5).map((inquiry) => (
              <div key={inquiry.id} className="bg-white/5 border border-cyan-500/20 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{inquiry.customer_name}</p>
                    <p className="text-xs text-gray-400">{inquiry.customer_phone}</p>
                  </div>
                  <Badge className={inquiry.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}>
                    {inquiry.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mt-2 line-clamp-2">{inquiry.message || `Interested in ${inquiry.purpose}`}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-cyan-500/30 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Plus className="w-5 h-5 text-cyan-400" />
                  Add New Property
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmitProperty} className="space-y-6">
                <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-cyan-400 mb-4">Property Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Property Title *</label>
                      <Input
                        value={propertyForm.title}
                        onChange={(e) => setPropertyForm({ ...propertyForm, title: e.target.value })}
                        placeholder="e.g., Luxury 3 Bedroom House in DHA"
                        className="bg-white/5 border-cyan-500/30"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Property Type *</label>
                      <select
                        value={propertyForm.propertyType}
                        onChange={(e) => setPropertyForm({ ...propertyForm, propertyType: e.target.value })}
                        className="w-full bg-white/5 border border-cyan-500/30 rounded-md px-3 py-2 text-white"
                      >
                        <option value="house">House</option>
                        <option value="apartment">Apartment</option>
                        <option value="plot">Plot</option>
                        <option value="commercial">Commercial</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Purpose *</label>
                      <select
                        value={propertyForm.purpose}
                        onChange={(e) => setPropertyForm({ ...propertyForm, purpose: e.target.value })}
                        className="w-full bg-white/5 border border-cyan-500/30 rounded-md px-3 py-2 text-white"
                      >
                        <option value="buy">For Sale</option>
                        <option value="rent">For Rent</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-cyan-400 mb-4">Location Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Full Address *</label>
                      <Input
                        value={propertyForm.address}
                        onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                        placeholder="Complete address"
                        className="bg-white/5 border-cyan-500/30"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">City *</label>
                      <Input
                        value={propertyForm.city}
                        onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })}
                        placeholder="e.g., Lahore"
                        className="bg-white/5 border-cyan-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Area / Block</label>
                      <Input
                        value={propertyForm.areaBlock}
                        onChange={(e) => setPropertyForm({ ...propertyForm, areaBlock: e.target.value })}
                        placeholder="e.g., DHA Phase 5"
                        className="bg-white/5 border-cyan-500/30"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Google Map Link</label>
                      <Input
                        value={propertyForm.googleMapLink}
                        onChange={(e) => setPropertyForm({ ...propertyForm, googleMapLink: e.target.value })}
                        placeholder="https://maps.google.com/..."
                        className="bg-white/5 border-cyan-500/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-cyan-400 mb-4">Property Specifications</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Covered Area</label>
                      <Input
                        value={propertyForm.coveredArea}
                        onChange={(e) => setPropertyForm({ ...propertyForm, coveredArea: e.target.value })}
                        placeholder="e.g., 10"
                        className="bg-white/5 border-cyan-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Unit</label>
                      <select
                        value={propertyForm.areaUnit}
                        onChange={(e) => setPropertyForm({ ...propertyForm, areaUnit: e.target.value })}
                        className="w-full bg-white/5 border border-cyan-500/30 rounded-md px-3 py-2 text-white"
                      >
                        <option value="sqft">Sq Ft</option>
                        <option value="marla">Marla</option>
                        <option value="kanal">Kanal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Bedrooms</label>
                      <Input
                        type="number"
                        value={propertyForm.bedrooms}
                        onChange={(e) => setPropertyForm({ ...propertyForm, bedrooms: parseInt(e.target.value) || 0 })}
                        className="bg-white/5 border-cyan-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Bathrooms</label>
                      <Input
                        type="number"
                        value={propertyForm.bathrooms}
                        onChange={(e) => setPropertyForm({ ...propertyForm, bathrooms: parseInt(e.target.value) || 0 })}
                        className="bg-white/5 border-cyan-500/30"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={propertyForm.parking}
                          onChange={(e) => setPropertyForm({ ...propertyForm, parking: e.target.checked })}
                          className="rounded border-cyan-500/30"
                        />
                        Parking
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={propertyForm.furnished}
                          onChange={(e) => setPropertyForm({ ...propertyForm, furnished: e.target.checked })}
                          className="rounded border-cyan-500/30"
                        />
                        Furnished
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-cyan-400 mb-4">Pricing</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Property Price (Rs.) *</label>
                      <Input
                        value={propertyForm.price}
                        onChange={(e) => setPropertyForm({ ...propertyForm, price: e.target.value })}
                        placeholder="e.g., 25,000,000"
                        className="bg-white/5 border-cyan-500/30"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Commission (%)</label>
                      <Input
                        type="number"
                        step="0.5"
                        value={propertyForm.commissionPercent}
                        onChange={(e) => setPropertyForm({ ...propertyForm, commissionPercent: parseFloat(e.target.value) || 0 })}
                        className="bg-white/5 border-cyan-500/30"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={propertyForm.negotiable}
                          onChange={(e) => setPropertyForm({ ...propertyForm, negotiable: e.target.checked })}
                          className="rounded border-cyan-500/30"
                        />
                        Price Negotiable
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-cyan-400 mb-4">Availability</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Available From</label>
                      <Input
                        type="date"
                        value={propertyForm.availableFrom}
                        onChange={(e) => setPropertyForm({ ...propertyForm, availableFrom: e.target.value })}
                        className="bg-white/5 border-cyan-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Possession Status</label>
                      <select
                        value={propertyForm.possessionStatus}
                        onChange={(e) => setPropertyForm({ ...propertyForm, possessionStatus: e.target.value })}
                        className="w-full bg-white/5 border border-cyan-500/30 rounded-md px-3 py-2 text-white"
                      >
                        <option value="ready">Ready to Move</option>
                        <option value="under_construction">Under Construction</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-cyan-400 mb-4">Dealer / Owner Info</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Name</label>
                      <Input
                        value={propertyForm.dealerName}
                        onChange={(e) => setPropertyForm({ ...propertyForm, dealerName: e.target.value })}
                        placeholder="Dealer name"
                        className="bg-white/5 border-cyan-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Phone</label>
                      <Input
                        value={propertyForm.dealerPhone}
                        onChange={(e) => setPropertyForm({ ...propertyForm, dealerPhone: e.target.value })}
                        placeholder="Phone number"
                        className="bg-white/5 border-cyan-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Email</label>
                      <Input
                        value={propertyForm.dealerEmail}
                        onChange={(e) => setPropertyForm({ ...propertyForm, dealerEmail: e.target.value })}
                        placeholder="Email address"
                        className="bg-white/5 border-cyan-500/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="border-gray-500">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPropertyMutation.isPending}
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    {createPropertyMutation.isPending ? 'Creating...' : 'Submit Property'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsTab({ branch, primaryColor, secondaryColor }: { branch: PropertyBranch; primaryColor: string; secondaryColor: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [logoUrl, setLogoUrl] = useState(branch.logoUrl || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(branch.whatsappNumber || '');
  const [ownerName, setOwnerName] = useState(branch.ownerName || '');
  const [videoUrl, setVideoUrl] = useState(branch.videoUrl || '');
  const [phone, setPhone] = useState(branch.phone || '');
  const [email, setEmail] = useState(branch.email || '');
  const [address, setAddress] = useState(branch.address || '');
  const [mapEmbedUrl, setMapEmbedUrl] = useState(branch.mapEmbedUrl || '');
  const [facebookUrl, setFacebookUrl] = useState(branch.facebookUrl || '');
  const [instagramUrl, setInstagramUrl] = useState(branch.instagramUrl || '');
  const [twitterUrl, setTwitterUrl] = useState(branch.twitterUrl || '');
  const [youtubeUrl, setYoutubeUrl] = useState(branch.youtubeUrl || '');
  const [contactBgImages, setContactBgImages] = useState<string[]>(branch.contactBgImages || []);
  const [newBgImageUrl, setNewBgImageUrl] = useState('');

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<PropertyBranch>) => {
      const res = await fetch(`/api/property-branches/${branch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-branches'] });
      toast({ title: 'Settings saved successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      logoUrl,
      whatsappNumber,
      ownerName,
      videoUrl,
      phone,
      email,
      address,
      mapEmbedUrl,
      facebookUrl,
      instagramUrl,
      twitterUrl,
      youtubeUrl,
      contactBgImages,
    });
  };

  const handleReset = () => {
    setLogoUrl(branch.logoUrl || '');
    setWhatsappNumber(branch.whatsappNumber || '');
    setOwnerName(branch.ownerName || '');
    setVideoUrl(branch.videoUrl || '');
    setPhone(branch.phone || '');
    setEmail(branch.email || '');
    setAddress(branch.address || '');
    setMapEmbedUrl(branch.mapEmbedUrl || '');
    setFacebookUrl(branch.facebookUrl || '');
    setInstagramUrl(branch.instagramUrl || '');
    setTwitterUrl(branch.twitterUrl || '');
    setYoutubeUrl(branch.youtubeUrl || '');
    setContactBgImages(branch.contactBgImages || []);
    toast({ title: 'Reset Complete', description: 'All fields restored to saved values.' });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['image/png', 'image/gif', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload PNG, GIF, JPG or WebP', variant: 'destructive' });
      return;
    }
    
    setIsUploadingLogo(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogoUrl(data.url);
        toast({ title: 'Logo uploaded!', description: 'Click Save to apply changes.' });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const addBgImage = () => {
    if (newBgImageUrl.trim()) {
      setContactBgImages([...contactBgImages, newBgImageUrl.trim()]);
      setNewBgImageUrl('');
    }
  };

  const removeBgImage = (index: number) => {
    setContactBgImages(contactBgImages.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    const newImages: string[] = [];
    
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          newImages.push(data.url);
        } else {
          toast({ title: "Upload failed", description: `Failed to upload ${file.name}`, variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Upload error", description: `Error uploading ${file.name}`, variant: "destructive" });
      }
    }
    
    if (newImages.length > 0) {
      setContactBgImages([...contactBgImages, ...newImages]);
      toast({ title: "Upload complete", description: `${newImages.length} image(s) uploaded successfully` });
    }
    
    setIsUploading(false);
    e.target.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6 mb-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Branch Settings
        </h2>
        
        <div className="mb-8 p-6 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-2xl border border-purple-500/30">
          <h3 className="font-semibold text-lg text-purple-400 flex items-center gap-2 mb-4">
            <Image className="w-5 h-5" />
            Branch Logo (PNG / GIF)
          </h3>
          
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-purple-500/50 bg-white/5 flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-gray-500">
                  <Building2 className="w-10 h-10 mx-auto mb-2" />
                  <span className="text-xs">No logo</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Logo URL (or upload)</label>
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="bg-white/5 border-purple-500/30 text-white focus:border-purple-500"
                />
              </div>
              
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/gif,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                    disabled={isUploadingLogo}
                    asChild
                  >
                    <span>
                      {isUploadingLogo ? (
                        <>Uploading...</>
                      ) : (
                        <><Upload className="w-4 h-4 mr-2" /> Upload Logo</>
                      )}
                    </span>
                  </Button>
                </label>
                {logoUrl && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    onClick={() => setLogoUrl('')}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">Supports PNG, GIF, JPG, WebP. Recommended: 200x200 or larger</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-emerald-400 flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp Settings
            </h3>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">WhatsApp Number</label>
              <Input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+923334111575"
                className="bg-white/5 border-emerald-500/30 text-white focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +92 for Pakistan)</p>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Owner Name</label>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Faisal Chaudhary"
                className="bg-white/5 border-emerald-500/30 text-white focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">Shown in WhatsApp greeting message</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-purple-400 flex items-center gap-2">
              <Video className="w-5 h-5" />
              Marketing Video
            </h3>
            
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
              <label className="block text-sm text-gray-300 mb-2 font-medium">Paste YouTube URL or Embed Code</label>
              <div className="flex gap-2">
                <Input
                  value={videoUrl}
                  onChange={(e) => {
                    let url = e.target.value;
                    // Extract src from iframe embed code
                    if (url.includes('<iframe')) {
                      const match = url.match(/src="([^"]+)"/);
                      if (match) url = match[1];
                    }
                    // Convert watch URL to embed URL
                    else if (url.includes('youtube.com/watch')) {
                      const videoId = url.match(/[?&]v=([^&]+)/)?.[1];
                      if (videoId) url = `https://www.youtube.com/embed/${videoId}`;
                    }
                    // Convert short URL to embed URL
                    else if (url.includes('youtu.be/')) {
                      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
                      if (videoId) url = `https://www.youtube.com/embed/${videoId}`;
                    }
                    setVideoUrl(url);
                  }}
                  placeholder="https://www.youtube.com/watch?v=... or paste iframe code"
                  className="bg-white/5 border-purple-500/30 text-white focus:border-purple-500 flex-1"
                />
                <Button 
                  onClick={handleSave} 
                  disabled={updateMutation.isPending}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6"
                >
                  <Save className="w-4 h-4 mr-1" /> Save
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Accepts: YouTube URL, short link (youtu.be), or full iframe embed code</p>
              
              {videoUrl && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-2">Preview:</p>
                  <div className="aspect-video rounded-lg overflow-hidden border border-purple-500/30">
                    <iframe
                      src={videoUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-cyan-500/20 pt-6 mt-6">
          <h3 className="font-semibold text-lg text-blue-400 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Social Media Links
          </h3>
          <p className="text-xs text-gray-500 mb-4">Leave empty to hide icon on website</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
              <label className="block text-sm text-gray-300 mb-2 font-medium">Facebook URL</label>
              <div className="flex gap-2">
                <Input
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                  className="bg-white/5 border-blue-500/30 text-white focus:border-blue-500 flex-1"
                />
                <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-3">
              <label className="block text-sm text-gray-300 mb-2 font-medium">Instagram URL</label>
              <div className="flex gap-2">
                <Input
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/yourpage"
                  className="bg-white/5 border-pink-500/30 text-white focus:border-pink-500 flex-1"
                />
                <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-pink-500 hover:bg-pink-600 text-white">
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
              <label className="block text-sm text-gray-300 mb-2 font-medium">Twitter/X URL</label>
              <div className="flex gap-2">
                <Input
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://twitter.com/yourpage"
                  className="bg-white/5 border-cyan-500/30 text-white focus:border-cyan-500 flex-1"
                />
                <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <label className="block text-sm text-gray-300 mb-2 font-medium">YouTube URL</label>
              <div className="flex gap-2">
                <Input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                  className="bg-white/5 border-red-500/30 text-white focus:border-red-500 flex-1"
                />
                <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-red-500 hover:bg-red-600 text-white">
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-cyan-500/20 pt-6 mt-6">
          <h3 className="font-semibold text-lg text-amber-400 mb-4 flex items-center gap-2">
            <Image className="w-5 h-5" />
            "Get In Touch" Section Background Images
          </h3>
          
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
            <p className="text-amber-300 text-sm mb-2 font-medium">These images appear in the Contact section at the bottom of your website</p>
            <p className="text-gray-400 text-xs">Add multiple images to create a beautiful rotating slideshow. Supports PNG, JPG, or GIF files.</p>
          </div>
          
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex gap-2">
              <Input
                value={newBgImageUrl}
                onChange={(e) => setNewBgImageUrl(e.target.value)}
                placeholder="Paste image URL here (e.g., https://example.com/property.jpg)"
                className="bg-white/5 border-amber-500/30 text-white focus:border-amber-500 flex-1"
              />
              <Button onClick={addBgImage} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm">OR</span>
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-emerald-500/40 bg-emerald-500/10 cursor-pointer hover:bg-emerald-500/20 transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                  <Upload className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-300 font-medium">
                    {isUploading ? 'Uploading...' : 'Click to Upload Images'}
                  </span>
                </div>
              </label>
            </div>
          </div>
          
          {contactBgImages.length > 0 && (
            <>
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 mb-4 border border-amber-500/30">
                <p className="text-amber-400 text-sm mb-3 font-medium">Preview Slider ({contactBgImages.length} images - changes every 5 seconds on website)</p>
                <ContactBgPreviewSlider images={contactBgImages} />
              </div>
              
              <p className="text-gray-400 text-sm mb-2">All added images (click × to remove):</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {contactBgImages.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt={`BG ${i+1}`} className="w-full h-24 object-cover rounded-lg border-2 border-amber-500/30" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-2 rounded-b-lg">
                      Image {i + 1}
                    </div>
                    <button 
                      onClick={() => removeBgImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold shadow-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          {contactBgImages.length === 0 && (
            <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-dashed border-gray-600">
              <Image className="w-12 h-12 mx-auto mb-3 text-gray-500" />
              <p className="text-gray-400 text-sm">No images added yet</p>
              <p className="text-gray-500 text-xs mt-1">Default property images will be shown on your website</p>
            </div>
          )}
        </div>

        <div className="border-t border-cyan-500/20 pt-6 mt-6">
          <h3 className="font-semibold text-lg text-cyan-400 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Contact Information
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+923334111575"
                className="bg-white/5 border-cyan-500/30 text-white focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@example.com"
                className="bg-white/5 border-cyan-500/30 text-white focus:border-cyan-500"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm text-gray-400 mb-2">Address</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Your branch address"
                className="bg-white/5 border-cyan-500/30 text-white focus:border-cyan-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Google Maps Embed URL</label>
              <Input
                value={mapEmbedUrl}
                onChange={(e) => setMapEmbedUrl(e.target.value)}
                placeholder="Paste Google Maps embed URL here (from Google Maps share > embed)"
                className="bg-white/5 border-cyan-500/30 text-white focus:border-cyan-500"
              />
              <p className="text-xs text-gray-500 mt-1">Go to Google Maps → Share → Embed a map → Copy the src URL from the iframe code</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            className="px-6 py-3 rounded-xl bg-white/10 border border-amber-500/30 text-amber-400 font-semibold flex items-center gap-2 hover:bg-amber-500/10"
          >
            <ChevronLeft className="w-5 h-5" />
            Reset Changes
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/30 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function AnimatedBackground({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0a1628] to-[#000814]" />
      
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${primaryColor}20, transparent)` }}
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${secondaryColor}20, transparent)` }}
      />
      
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: i % 2 === 0 ? primaryColor : secondaryColor,
            opacity: 0.4,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  );
}

export default function PropertyBranchDashboard() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const slug = params.slug as string;
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: branches = [] } = useQuery<PropertyBranch[]>({
    queryKey: ["/api/property-branches"],
  });

  const branch = branches.find(b => b.slug === slug);

  const { data: dashboardProperties = [] } = useQuery<Property[]>({
    queryKey: [`/api/property-branches/${branch?.id}/properties`],
    enabled: !!branch?.id,
  });

  const { data: dashboardInquiries = [] } = useQuery<Inquiry[]>({
    queryKey: [`/api/property-branches/${branch?.id}/inquiries`],
    enabled: !!branch?.id,
  });

  const { data: dashboardAppointments = [] } = useQuery<Appointment[]>({
    queryKey: [`/api/property-appointments/${branch?.id}`],
    enabled: !!branch?.id,
  });

  const totalProperties = dashboardProperties.length;
  const activeListings = dashboardProperties.filter(p => p.isActive).length;
  const pendingInquiries = dashboardInquiries.filter(i => i.status === 'pending').length;
  const totalAppointments = dashboardAppointments.length;

  const stats: StatCard[] = [
    { title: "Total Properties", value: totalProperties.toString(), change: "+0%", changeType: "up", icon: Building2 },
    { title: "Active Listings", value: activeListings.toString(), change: "+0%", changeType: "up", icon: Home },
    { title: "This Month Sales", value: "Rs. 0", change: "+0%", changeType: "up", icon: DollarSign },
    { title: "Pending Inquiries", value: pendingInquiries.toString(), change: "+0%", changeType: "up", icon: MessageSquare },
    { title: "Appointments", value: totalAppointments.toString(), change: "+0%", changeType: "up", icon: Calendar },
    { title: "Commission Earned", value: "Rs. 0", change: "+0%", changeType: "up", icon: TrendingUp },
  ];

  if (!branch) {
    return <div className="min-h-screen bg-[#020617]" />;
  }

  const primaryColor = branch.primaryColor || "#0ea5e9";
  const secondaryColor = branch.secondaryColor || "#06b6d4";

  return (
    <div className="min-h-screen text-white flex relative overflow-hidden">
      <AnimatedBackground primaryColor={primaryColor} secondaryColor={secondaryColor} />
      
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        className="fixed left-0 top-0 bottom-0 bg-gradient-to-b from-black/80 to-black/60 backdrop-blur-xl border-r border-cyan-500/20 z-50 flex flex-col"
      >
        <div className="p-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              <Building2 className="w-6 h-6 text-white" />
            </motion.div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="overflow-hidden"
                >
                  <h1 className="font-bold text-lg text-white truncate" style={{ maxWidth: "180px" }}>
                    {branch.name}
                  </h1>
                  <p className="text-xs text-cyan-400/60">Branch Dashboard</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.a
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                href={`/property/${branch.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg"
              >
                <ExternalLink className="w-4 h-4" />
                View Website
              </motion.a>
            )}
          </AnimatePresence>
          {sidebarCollapsed && (
            <a
              href={`/property/${branch.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center w-10 h-10 mx-auto rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg"
              title="View Website"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          <ul className="space-y-1">
            {sidebarItems.map((item, index) => (
              <motion.li
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer w-full ${
                    activeTab === item.id
                      ? "bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-purple-500/10 border border-cyan-500/30 text-cyan-400"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? "text-cyan-400" : ""}`} />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-cyan-500/20 space-y-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation("/property-admin-login")}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-medium"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      <main className={`flex-1 transition-all duration-300 relative z-10 ${sidebarCollapsed ? "ml-20" : "ml-[280px]"}`}>
        <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-cyan-500/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </motion.button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-10 bg-white/5 border-cyan-500/20 text-white placeholder:text-gray-500 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400"
              >
                <Bell className="w-5 h-5" />
              </motion.button>

              <div className="h-8 w-px bg-cyan-500/20" />

              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-cyan-400">Branch Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6 mb-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">{branch.name}</h1>
                    {branch.address && (
                      <p className="text-gray-400 flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        {branch.address}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      {branch.phone && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Phone className="w-4 h-4 text-cyan-400" />
                          {branch.phone}
                        </span>
                      )}
                      {branch.email && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Mail className="w-4 h-4 text-cyan-400" />
                          {branch.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {branch.agreedPrice && parseFloat(branch.agreedPrice) > 0 && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        Agreed: {branch.currency || 'PKR'} {parseFloat(branch.agreedPrice).toLocaleString()}
                      </Badge>
                    )}
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                      {branch.commissionRate}% Commission
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {branch.currency || 'PKR'} {branch.visitCharges} Visit
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="relative group"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-5 border border-cyan-500/20">
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                        >
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          {stat.change}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <DashboardPropertiesSection branch={branch} primaryColor={primaryColor} secondaryColor={secondaryColor} />
            </motion.div>
          )}

          {activeTab === "settings" && (
            <SettingsTab branch={branch} primaryColor={primaryColor} secondaryColor={secondaryColor} />
          )}

          {activeTab === "advantages" && (
            <AdvantagesTab branch={branch} />
          )}

          {activeTab === "featured" && (
            <FeaturedPropertiesTab branch={branch} />
          )}

          {activeTab === "voice" && (
            <VoiceAnnouncementTab branch={branch} />
          )}

          {activeTab === "herotext" && (
            <HeroTextTab branch={branch} />
          )}

          {activeTab === "services" && (
            <ServicesTab branch={branch} />
          )}

          {activeTab === "videolinks" && (
            <VideoLinksTab branchId={branch.id} />
          )}

          {activeTab === "opening" && (
            <OpeningControlTab branch={branch} />
          )}

          {activeTab === "appointments" && (
            <AppointmentsTab branch={branch} />
          )}

          {activeTab !== "dashboard" && activeTab !== "settings" && activeTab !== "advantages" && activeTab !== "featured" && activeTab !== "voice" && activeTab !== "herotext" && activeTab !== "services" && activeTab !== "opening" && activeTab !== "appointments" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
              <h2 className="text-2xl font-bold mb-2 capitalize">{activeTab} Coming Soon</h2>
              <p className="text-gray-400">This feature is under development</p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
