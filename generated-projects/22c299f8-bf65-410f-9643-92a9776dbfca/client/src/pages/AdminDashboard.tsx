import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import NotificationSidebar from "@/components/NotificationSidebar";
import CodeProtectionPanel from "@/components/CodeProtectionPanel";

import {
  BarChart3,
  Users,
  DollarSign,
  Activity,
  Plus,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Building2,
  FileText,
  Upload,
  ImageIcon,
  Bug,
  Calendar,
  Link as LinkIcon,
  CreditCard,
  Bell,
  Settings,
  HardDrive,
  LogOut,
  Search,
  Download,
  Send,

  FileEdit,
  Menu,
  X,
  Filter,
  SortAsc,
  MoreVertical,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Zap,
  TrendingUp,
  PieChart,
  Star,
  Calendar as CalendarIcon,
  MessageSquare,
  Globe,
  Palette,
  Layout,
  Image,
  Video,
  Music,
  FileImage,
  FileSpreadsheet,
  Archive,
  Cloud,
  Shield,
  Key,
  UserCheck,
  UserX,
  AlertTriangle,
  Info,
  Heart,
  Bookmark,
  Share2,
  ExternalLink,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  StopCircle,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  Crop,
  Scissors,
  PaintBucket,
  Brush,
  Eraser,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  List,
  Indent,
  Outdent,
  Quote,
  Code,
  Terminal,
  Command,
  Option,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MousePointer,
  MousePointer2,
  Hand,
  Grab,
  FolderPlus,
  Save,
  Lock,
  Unlock,
  Copy,
  Timer,
  Check
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import UsefulLinksSection from "@/components/UsefulLinksSection";
import PaymentTrackerSection from "@/components/PaymentTrackerSection";
import PDFViewer from "@/components/PDFViewer";

const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  address: z.string().min(1, "Full address is required"),
  postCode: z.string().min(1, "Post code is required"),
  contractNumber: z.string().min(1, "Contract number is required"),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  email: z.string().email("Valid email is required"),
  username: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  paymentMethod: z.enum(["online", "cash"]).default("online"),
  visitFrequency: z.enum(["monthly", "quarterly", "yearly"]).default("monthly"),
  paymentAmount: z.enum(["20", "25", "30", "35", "50", "70", "75", "100", "150", "240", "300", "360", "400", "500"]).default("50"),
  lastTraining: z.string().optional(),
  trainingNextDue: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password.length > 0) {
    return data.password.length >= 8 && data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Password must be at least 8 characters and passwords must match",
  path: ["confirmPassword"],
});

type BranchFormData = z.infer<typeof branchSchema>;

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  username?: string;
  status: string;
  contactNumber?: string;
  postCode?: string;
  contractNumber?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  email?: string;
  paymentMethod?: string;
  visitFrequency?: string;
  paymentAmount?: string;
  logoUrl?: string;
  membershipCertificateUrl?: string;
  starRating?: number;
  lastTraining?: string;
  trainingNextDue?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Document {
  id: string;
  title: string;
  filename: string;
  filepath: string;
  type: string;
  category: string;
  branchId?: string;
  uploadedBy: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
}

interface Photo {
  id: string;
  title: string;
  filename: string;
  filepath: string;
  type: 'before' | 'after';
  category: string;
  branchId?: string;
  uploadedBy: string;
  description?: string;
  notes?: string;
  treatment?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
}

interface AdminStats {
  totalBranches: number;
  activeUsers: number;
  monthlyRevenue: number;
  systemHealth: number;
}

interface MonthlyReport {
  id: string;
  title: string;
  filename: string;
  filepath: string;
  reportType: string;
  fileSize?: number;
  mimeType?: string;
  viewSize: string;
  branchId?: string;
  uploadedBy: string;
  sentAt?: string;
  receivedAt?: string;
  viewedAt?: string;
  downloadedAt?: string;
  isDeleted: boolean;
  isInMyDocs?: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface PestControlDoc {
  id: string;
  title: string;
  filename: string;
  filepath: string;
  docType: string;
  description?: string;
  fileSize?: number;
  mimeType?: string;
  viewSize: string;
  branchId?: string;
  uploadedBy: string;
  issueDate?: string;
  expiryDate?: string;
  sentAt?: string;
  receivedAt?: string;
  viewedAt?: string;
  downloadedAt?: string;
  isDeleted: boolean;
  isInMyDocs?: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface Notification {
  id: string;
  branchId: string;
  message: string;
  visitDate: string;
  visitTime: string;
  purposeOfVisit: string;
  isRead?: boolean;
  sentAt: string;
  createdAt: string;
}

const monthlyReportSchema = z.object({
  title: z.string().min(1, "Report title is required"),
  reportType: z.enum(["coshh", "risk_assessment", "inspection", "general"]).default("general"),
  viewSize: z.enum(["A4", "A5"]).default("A4"),
});

export default function AdminDashboard() {
  // Check if admin is authenticated via PIN
  // Enhanced scroll handler for laptop trackpads
  const handleSidebarScroll = () => {
    if (sidebarScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = sidebarScrollRef.current;
      setScrollIndicators({
        top: scrollTop > 20,
        bottom: scrollTop < scrollHeight - clientHeight - 20
      });
    }
  };

  useEffect(() => {
    const sidebar = sidebarScrollRef.current;
    if (sidebar) {
      sidebar.addEventListener('scroll', handleSidebarScroll);
      handleSidebarScroll(); // Initial check
      return () => sidebar.removeEventListener('scroll', handleSidebarScroll);
    }
  }, []);

  // Load Biro Script font from server so typing preview matches PDF output
  useEffect(() => {
    const loadBiroFont = async () => {
      try {
        const font = new FontFace('BiroScript', 'url(/api/fonts/biro-script.ttf)');
        const loaded = await font.load();
        document.fonts.add(loaded);
      } catch {
        // Font not available — fallback fonts will be used
      }
    };
    loadBiroFont();
  }, []);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Authentication check useEffect
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check server admin authentication first
        const response = await fetch('/api/admin/auth-check', {
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.status === 401) {
          window.location.href = '/admin-login';
          return;
        }
        
        const authData = await response.json();
        if (!authData.authenticated) {
          window.location.href = '/admin-login';
          return;
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  const handleAdminLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Admin logout request failed:", error);
    } finally {
      queryClient.clear();
      window.location.replace("/admin-login");
    }
  };

  // States
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showNotificationSidebar, setShowNotificationSidebar] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [settingsTab, setSettingsTab] = useState("branch-dashboard");
  const [selectedBranchForSettings, setSelectedBranchForSettings] = useState<string>("");
  const [currentRating, setCurrentRating] = useState(5);
  const [isEditingRating, setIsEditingRating] = useState(false);
  const [scrollIndicators, setScrollIndicators] = useState({ top: false, bottom: false });
  const sidebarScrollRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settingsLogoFile, setSettingsLogoFile] = useState<File | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [settingsLogoPreview, setSettingsLogoPreview] = useState<string | null>(null);
  const [visitorCount, setVisitorCount] = useState(1000);
  const [ratingStyle, setRatingStyle] = useState("stars");
  const [cardSpacing, setCardSpacing] = useState("normal");
  
  const [cardBorderRadius, setCardBorderRadius] = useState("rounded");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#8b5cf6");
  const [successColor, setSuccessColor] = useState("#22c55e");
  const [warningColor, setWarningColor] = useState("#ef4444");
  
  // Admin Settings Security
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [pinInput, setPinInput] = useState("");
  
  // Master Unlock PIN Dialog
  const [showMasterUnlockDialog, setShowMasterUnlockDialog] = useState(false);
  const [masterUnlockPinInput, setMasterUnlockPinInput] = useState("");
  const [adminEmail, setAdminEmail] = useState("mujeeb@job4u.com");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newSidebarPin, setNewSidebarPin] = useState("");
  const [confirmSidebarPin, setConfirmSidebarPin] = useState("");
  const [currentSidebarPin, setCurrentSidebarPin] = useState("smrptt77");
  
  // Site Settings Security
  const [showSiteSettingsPinDialog, setShowSiteSettingsPinDialog] = useState(false);
  const [siteSettingsPinInput, setSiteSettingsPinInput] = useState("");
  const [siteSettingsUnlocked, setSiteSettingsUnlocked] = useState(false);
  
  // Payment Tracker Security
  const [showPaymentTrackerPinDialog, setShowPaymentTrackerPinDialog] = useState(false);
  const [paymentTrackerPinInput, setPaymentTrackerPinInput] = useState("");
  const [paymentTrackerUnlocked, setPaymentTrackerUnlocked] = useState(false);
  
  // Useful Links Security
  const [showUsefulLinksPinDialog, setShowUsefulLinksPinDialog] = useState(false);
  const [usefulLinksPinInput, setUsefulLinksPinInput] = useState("");
  const [usefulLinksUnlocked, setUsefulLinksUnlocked] = useState(false);
  
  // Master Lock/Unlock Toggle
  const [masterLockEnabled, setMasterLockEnabled] = useState(true);
  
  // Master Lock/Unlock Function
  const handleMasterLockToggle = () => {
    if (masterLockEnabled) {
      // Unlock all sections
      setSiteSettingsUnlocked(true);
      setPaymentTrackerUnlocked(true);
      setUsefulLinksUnlocked(true);
      setPestControlUnlocked(true);
      setBranchesUnlocked(true);
      setStaffAccessUnlocked(true);
      setMasterLockEnabled(false);
      toast({
        title: "All Sections Unlocked",
        description: "All sidebar PIN locks have been disabled",
      });
    } else {
      // Lock all sections
      setSiteSettingsUnlocked(false);
      setPaymentTrackerUnlocked(false);
      setUsefulLinksUnlocked(false);
      setPestControlUnlocked(false);
      setBranchesUnlocked(false);
      setStaffAccessUnlocked(false);
      setMasterLockEnabled(true);
      toast({
        title: "All Sections Locked",
        description: "All sidebar PIN locks have been enabled",
      });
    }
  };
  
  // Pest Control Docs Security
  const [showPestControlPinDialog, setShowPestControlPinDialog] = useState(false);
  const [pestControlPinInput, setPestControlPinInput] = useState("");
  const [pestControlUnlocked, setPestControlUnlocked] = useState(false);
  
  
  // Branches Security
  const [showBranchesPinDialog, setShowBranchesPinDialog] = useState(false);
  const [branchesPinInput, setBranchesPinInput] = useState("");
  const [branchesUnlocked, setBranchesUnlocked] = useState(false);
  
  // Staff Access Management
  const [showStaffAccessDialog, setShowStaffAccessDialog] = useState(false);
  const [showStaffAccessPinDialog, setShowStaffAccessPinDialog] = useState(false);
  const [staffAccessPinInput, setStaffAccessPinInput] = useState("");
  const [staffAccessUnlocked, setStaffAccessUnlocked] = useState(false);
  const [tempStaffCredentials, setTempStaffCredentials] = useState({
    username: "",
    password: "",
    duration: "24",
    allowedSections: [] as string[],
    expiresAt: null as Date | null
  });

  // Notification Management
  const [notificationsUnlocked, setNotificationsUnlocked] = useState(false);
  const [showNotificationsPinDialog, setShowNotificationsPinDialog] = useState(false);
  const [notificationsPinInput, setNotificationsPinInput] = useState("");
  const [activeStaffSessions, setActiveStaffSessions] = useState<any[]>([]);
  
  // Deployment Management
  const [deploymentMode, setDeploymentMode] = useState<'staging' | 'live'>('staging');
  const [pendingChanges, setPendingChanges] = useState<string[]>([]);
  const [showDeploymentDialog, setShowDeploymentDialog] = useState(false);
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showPhotoSendDialog, setShowPhotoSendDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showPhotoViewerDialog, setShowPhotoViewerDialog] = useState(false);
  const [showAddLinkDialog, setShowAddLinkDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [showLinksDialog, setShowLinksDialog] = useState(false);
  const [showPestDocumentSendDialog, setShowPestDocumentSendDialog] = useState(false);
  const [showSendFileToBranchDialog, setShowSendFileToBranchDialog] = useState(false);
  const [showBranchDeleteDialog, setShowBranchDeleteDialog] = useState(false);
  const [showMonthlyReportDialog, setShowMonthlyReportDialog] = useState(false);
  const [showGenerateReportDialog, setShowGenerateReportDialog] = useState(false);
  const [generateTemplateType, setGenerateTemplateType] = useState<'inspection' | 'coshh'>('inspection');
  const [genClientName, setGenClientName] = useState('');
  const [genPremises, setGenPremises] = useState('');
  const [genAddress, setGenAddress] = useState('');
  const [genTelephone, setGenTelephone] = useState('');
  const [genDateOfReport, setGenDateOfReport] = useState(new Date().toLocaleDateString('en-GB'));
  const [genContractNo, setGenContractNo] = useState('');
  const [genPostCode, setGenPostCode] = useState('');
  const [genTown, setGenTown] = useState('');
  const [genRecommendations, setGenRecommendations] = useState('');
  const [genProductsUsed, setGenProductsUsed] = useState('DP Wax Difenacoum0.005%');
  const [genPreviewUrl, setGenPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [genClickX, setGenClickX] = useState<number | null>(null);
  const [genClickY, setGenClickY] = useState<number | null>(null);
  const [genPdfDims, setGenPdfDims] = useState<{w: number; h: number} | null>(null);
  const [genCanvasDims, setGenCanvasDims] = useState<{w: number; h: number} | null>(null);
  const [genInputScreenPos, setGenInputScreenPos] = useState<{x: number; y: number} | null>(null);
  const [genEditActive, setGenEditActive] = useState(false);
  const [genFontSize, setGenFontSize] = useState(15);
  const [genFontFamily, setGenFontFamily] = useState('IndieFlower');
  const [genFontColor, setGenFontColor] = useState('#0d1a73');
  const [genFontBold, setGenFontBold] = useState(false);
  const [genTextItems, setGenTextItems] = useState<Array<{id: string; text: string; pdfX: number; pdfY: number; screenX: number; screenY: number; fontSize: number; fontFamily: string; fontColor: string; fontBold: boolean; pageIndex: number}>>([]);
  const [genFontPickerOpen, setGenFontPickerOpen] = useState(false);
  const [genDragging, setGenDragging] = useState(false);
  const genDragOffset = useRef<{x: number; y: number}>({x: 0, y: 0});
  const genCanvasRef = useRef<HTMLCanvasElement>(null);
  const genCanvas2Ref = useRef<HTMLCanvasElement>(null);
  const [genPage2Loaded, setGenPage2Loaded] = useState(false);
  const [genPdfDims2, setGenPdfDims2] = useState<{w: number; h: number} | null>(null);
  const [genCanvas2Dims, setGenCanvas2Dims] = useState<{w: number; h: number} | null>(null);
  const [genActivePage, setGenActivePage] = useState<1 | 2>(1);
  const genCanvasContainerRef = useRef<HTMLDivElement>(null);
  const genCanvas2ContainerRef = useRef<HTMLDivElement>(null);
  const genPdfDocRef = useRef<any>(null);
  const genInputRef = useRef<HTMLInputElement>(null);
  const genInput2Ref = useRef<HTMLInputElement>(null);
  const [showReportViewDialog, setShowReportViewDialog] = useState(false);
  const [showReportEditDialog, setShowReportEditDialog] = useState(false);
  const [showReportSendDialog, setShowReportSendDialog] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'text'>('pen');
  const [showReportDeleteDialog, setShowReportDeleteDialog] = useState(false);
  const [showBulkCreateDialog, setShowBulkCreateDialog] = useState(false);
  const [bulkCreateCount, setBulkCreateCount] = useState(100);
  const [bulkCreateProgress, setBulkCreateProgress] = useState(0);
  const [isBulkCreating, setIsBulkCreating] = useState(false);

  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  const [reportToDelete, setReportToDelete] = useState<MonthlyReport | null>(null);
  const [sendFile, setSendFile] = useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [branchLogoFile, setBranchLogoFile] = useState<File | null>(null);
  const [branchLogoPreview, setBranchLogoPreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoType, setPhotoType] = useState<'before' | 'after'>('before');
  const [photoDescription, setPhotoDescription] = useState("");
  const [selectedPhotoForSend, setSelectedPhotoForSend] = useState<Photo | null>(null);
  const [selectedBranchForPhoto, setSelectedBranchForPhoto] = useState<string>("");
  const [selectedBranchForReport, setSelectedBranchForReport] = useState<string>("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("12");
  const [monthlyReportsSearchTerm, setMonthlyReportsSearchTerm] = useState<string>("");
  const [monthlyReportsCurrentPage, setMonthlyReportsCurrentPage] = useState<number>(1);
  const monthlyReportsBranchesPerPage = 10;
  
  
  // Pest Control Docs state
  const [showPestControlDocDialog, setShowPestControlDocDialog] = useState(false);
  const [showPestControlDocViewDialog, setShowPestControlDocViewDialog] = useState(false);
  const [showPestControlDocSendDialog, setShowPestControlDocSendDialog] = useState(false);
  const [showPestControlDocDeleteDialog, setShowPestControlDocDeleteDialog] = useState(false);
  const [selectedPestControlDoc, setSelectedPestControlDoc] = useState<PestControlDoc | null>(null);
  const [pestControlDocToDelete, setPestControlDocToDelete] = useState<PestControlDoc | null>(null);
  const [pestControlDocFile, setPestControlDocFile] = useState<File | null>(null);
  const [pestControlDocTitle, setPestControlDocTitle] = useState("");
  const [pestControlDocIssueDate, setPestControlDocIssueDate] = useState("");
  const [pestControlDocExpiryDate, setPestControlDocExpiryDate] = useState("");
  const [pestControlDocDescription, setPestControlDocDescription] = useState("");
  const [pestControlDocViewSize, setPestControlDocViewSize] = useState("A4");

  // Monthly Report states (additional)
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportTitle, setReportTitle] = useState("");
  const [reportType, setReportType] = useState("coshh-risk-assessment");
  const [reportViewSize, setReportViewSize] = useState("A4");
  const [selectedReportForEdit, setSelectedReportForEdit] = useState<MonthlyReport | null>(null);
  const [viewingReport, setViewingReport] = useState<MonthlyReport | null>(null);
  const [showInlineViewer, setShowInlineViewer] = useState(false);
  
  // PDF Viewer states
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [selectedPDFDocument, setSelectedPDFDocument] = useState<any>(null);
  

  // Form
  const form = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      contactNumber: "",
      address: "",
      postCode: "",
      contractNumber: "UN5-163-26",
      contractStartDate: "",
      contractEndDate: "",
      email: "",
      password: "",
      confirmPassword: "",
      status: "active",
      paymentMethod: "online",
      visitFrequency: "monthly",
      paymentAmount: "50",
    },
  });

  // Queries with improved performance settings
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    retry: 1,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  useEffect(() => {
    if (statsError) {
      console.error("Stats fetching error:", statsError);
    }
  }, [statsError]);

  // IoT Cloud state
  const [iotAssignDeviceId, setIotAssignDeviceId] = useState("");
  const [iotAssignDeviceName, setIotAssignDeviceName] = useState("");
  const [iotAssignBranchId, setIotAssignBranchId] = useState("");
  const [iotAssignNotes, setIotAssignNotes] = useState("");
  const [iotTestResult, setIotTestResult] = useState<{success:boolean;message:string}|null>(null);
  const [iotTestLoading, setIotTestLoading] = useState(false);

  const { data: iotStatusRaw } = useQuery({
    queryKey: ["/api/tuya/status"],
    queryFn: async () => { const r = await fetch("/api/tuya/status"); return r.json(); },
    staleTime: 60000,
  });
  const iotStatus = iotStatusRaw as any;

  const { data: iotDevicesRaw, refetch: refetchIotDevices } = useQuery({
    queryKey: ["/api/iot/devices"],
    queryFn: async () => { const r = await fetch("/api/iot/devices"); return r.json(); },
    staleTime: 30000,
  });
  const iotDevices: any[] = Array.isArray(iotDevicesRaw) ? iotDevicesRaw : [];

  // Branch pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [branchSearchTerm, setBranchSearchTerm] = useState("");
  const branchesPerPage = 10;

  // Data queries with pagination for 3000+ branches
  const { data: branchesResponse, isLoading: branchesLoading, error: branchesError } = useQuery({
    queryKey: ["/api/branches", currentPage, branchSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: branchesPerPage.toString(),
        ...(branchSearchTerm && { search: branchSearchTerm })
      });
      const response = await fetch(`/api/branches?${params}`);
      if (!response.ok) throw new Error('Failed to fetch branches');
      return response.json();
    },
    retry: 1,
    staleTime: 30000,
  });

  useEffect(() => {
    if (branchesError) {
      toast({
        title: "Error fetching branches",
        description: "There was a problem loading the branch list. Please try refreshing.",
        variant: "destructive",
      });
    }
  }, [branchesError, toast]);

  const branches = branchesResponse?.branches || [];
  const branchPagination = branchesResponse?.pagination;

  const { data: documents = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: photos = [], isLoading: photosLoading } = useQuery<Photo[]>({
    queryKey: ["/api/photos"],
  });

  const { data: monthlyReports = [], isLoading: reportsLoading, refetch: refetchReports } = useQuery<MonthlyReport[]>({
    queryKey: ["/api/monthly-reports"],
    staleTime: 0,
    gcTime: 0, // Disable cache for this query to ensure fresh data
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // Remove reportType filter to show all reports
      const response = await fetch(`/api/monthly-reports`);
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      return response.json();
    },
  });


  // Fetch pest control docs
  const { data: pestControlDocs = [] } = useQuery<PestControlDoc[]>({
    queryKey: ["/api/pest-control-docs"],
  });




  // Pest Control Doc mutations
  const createPestControlDocMutation = useMutation({
    mutationFn: async (data: { file: File; fileData: any }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('title', data.fileData.title);
      
      // Document type removed as requested - using generic type
      formData.append('docType', 'general');
      
      formData.append('viewSize', data.fileData.viewSize || 'A4');
      if (data.fileData.issueDate) formData.append('issueDate', data.fileData.issueDate);
      if (data.fileData.expiryDate) formData.append('expiryDate', data.fileData.expiryDate);
      
      // Add description if provided
      if (data.fileData.description) {
        formData.append('description', data.fileData.description);
      }

      const response = await fetch('/api/pest-control-docs', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to create pest control document');
      }
      return response.json();
    },
    onSuccess: (createdDoc) => {
      queryClient.setQueryData(["/api/pest-control-docs"], (current: PestControlDoc[] | undefined) => {
        const existing = current || [];
        return [createdDoc, ...existing.filter((doc) => doc.id !== createdDoc.id)];
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pest-control-docs"] });
      setShowPestControlDocDialog(false);
      setPestControlDocFile(null);
      setPestControlDocTitle("");
      setPestControlDocDescription("");
      setPestControlDocIssueDate("");
      setPestControlDocExpiryDate("");
      toast({
        title: "Success",
        description: "Pest control document created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create pest control document",
        variant: "destructive",
      });
    },
  });

  const sendPestControlDocToBranchMutation = useMutation({
    mutationFn: async ({ docId, branchId }: { docId: string; branchId: string }) => {
      const response = await fetch(`/api/pest-control-docs/${docId}/send-to-branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId }),
      });
      if (!response.ok) {
        throw new Error('Failed to send document to branch');
      }
      return response.json();
    },
    onSuccess: (createdDoc) => {
      queryClient.setQueryData(["/api/pest-control-docs"], (current: PestControlDoc[] | undefined) => {
        const existing = current || [];
        return [createdDoc, ...existing.filter((doc) => doc.id !== createdDoc.id)];
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pest-control-docs"] });
      setShowPestControlDocSendDialog(false);
      setSelectedPestControlDoc(null);
      toast({
        title: "Success",
        description: "Document sent to branch successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send document to branch",
        variant: "destructive",
      });
    },
  });

  const deletePestControlDocMutation = useMutation({
    mutationFn: async (docId: string) => {
      const response = await fetch(`/api/pest-control-docs/${docId}`, {
        method: 'DELETE',
        credentials: 'include', // ✅ FIXED: Include authentication cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to delete document');
      }
      return response.json();
    },
    onSuccess: (data, docId) => {
      // Immediately update the UI by removing the deleted item from cache
      queryClient.setQueryData(["/api/pest-control-docs"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((doc: any) => doc.id !== docId);
      });
      
      // Then invalidate to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/pest-control-docs"] });
      
      setShowPestControlDocDeleteDialog(false);
      setPestControlDocToDelete(null);
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });


  // Mutations
  // Assign Report to Branch Mutation
  const assignReportToBranch = useMutation({
    mutationFn: async ({ reportId, branchId }: { reportId: string; branchId: string }) => {
      const response = await fetch(`/api/monthly-reports/${reportId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ branchId }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      
      return response.json();
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document assigned to branch successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-reports', reportType] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign document to branch",
        variant: "destructive",
      });
      console.error('Error assigning report to branch:', error);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; fileData: any; type: 'document' | 'photo' }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('fileData', JSON.stringify(data.fileData));
      formData.append('type', data.type);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Upload failed",
        variant: "destructive",
      });
    },
  });

  const addBranchMutation = useMutation({
    mutationFn: async (data: BranchFormData) => {
      const formData = new FormData();
      
      // Add form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      // Add logo file if present
      if (branchLogoFile) {
        formData.append('logo', branchLogoFile);
      }
      
      const response = await fetch('/api/branches', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Branch created successfully:', data);
      // Force complete refresh of all branch-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.refetchQueries({ queryKey: ["/api/branches"] });
      
      setShowBranchDialog(false);
      form.reset();
      setLogoFile(null);
      setLogoPreview("");
      setBranchLogoFile(null);
      setBranchLogoPreview("");
      toast({
        title: "Success",
        description: `Branch "${data.name}" added successfully`,
      });
    },
    onError: (error: any) => {
      console.error('❌ Branch creation failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add branch",
        variant: "destructive",
      });
    },
  });


  const bulkCreateMutation = useMutation({
    mutationFn: async (count: number) => {
      const response = await fetch('/api/branches/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowBulkCreateDialog(false);
      setIsBulkCreating(false);
      setBulkCreateProgress(0);
      toast({
        title: "Success",
        description: `Successfully created ${data.created} branches in ${data.duration}ms`,
      });
    },
    onError: (error) => {
      setIsBulkCreating(false);
      setBulkCreateProgress(0);
      toast({
        title: "Error",
        description: error.message || "Failed to bulk create branches",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: BranchFormData) => {
    if (selectedBranch) {
      // Edit mode - update branch with logo if provided
      updateBranchMutation.mutate({
        id: selectedBranch.id,
        formData: data,
        logoFile: selectedLogoFile || undefined
      });
    } else {
      // Add mode - create the branch once. The create endpoint stores any selected
      // logo against the new branch's real UUID so branch data cannot cross over.
      await addBranchMutation.mutateAsync(data);
    }
  };

  const uploadCertificateMutation = useMutation({
    mutationFn: async ({ branchId, formData }: { branchId: string; formData: FormData }) => {
      const response = await fetch(`/api/branches/${branchId}/certificate`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Certificate upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({
        title: "Success",
        description: "Membership certificate uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Certificate upload failed",
        variant: "destructive",
      });
    },
  });

  // Deployment-persistent logo upload mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async ({ branchId, formData }: { branchId: string; formData: FormData }) => {
      const response = await fetch(`/api/branches/${branchId}/logo`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Logo upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      setBranchLogoFile(null);
      setBranchLogoPreview("");
      toast({
        title: "Success",
        description: "Branch logo uploaded with deployment persistence - will remain visible after updates",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Logo upload failed",
        variant: "destructive",
      });
    },
  });

  const updateBranchMutation = useMutation({
    mutationFn: async (data: { id: string; formData: any; logoFile?: File }) => {
      let response;
      
      if (data.logoFile) {
        // If we have a logo file, use FormData for multipart upload
        const formData = new FormData();
        
        // Add all the form fields
        Object.keys(data.formData).forEach(key => {
          if (data.formData[key] !== undefined && data.formData[key] !== null) {
            formData.append(key, data.formData[key]);
          }
        });
        
        // Add the logo file
        formData.append('logo', data.logoFile);
        
        response = await fetch(`/api/branches/${data.id}`, {
          method: 'PATCH',
          body: formData,
        });
      } else {
        // No logo file, use regular JSON
        response = await fetch(`/api/branches/${data.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data.formData),
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      
      return response.json();
    },
    onSuccess: (updatedBranch) => {
      console.log('✅ Branch update successful:', updatedBranch);
      
      // Force complete cache invalidation for immediate refresh 
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      
      // Branch-specific cache-busting now handled by updatedAt timestamp in img src
      // No need for manual DOM manipulation
      
      // Force immediate refetch to show changes
      queryClient.refetchQueries({ queryKey: ["/api/branches"] });
      
      setShowEditDialog(false);
      setSelectedBranch(null);
      setBranchLogoFile(null); // Clear the logo file
      setBranchLogoPreview(""); // Clear preview
      setSelectedLogoFile(null); // Clear the selected logo file
      // Clear the file input element
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: "Success",
        description: updatedBranch?.logoUpdated 
          ? "Branch and logo updated successfully - changes are now visible"
          : "Branch updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update branch",
        variant: "destructive",
      });
    },
  });

  const handleViewBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowViewDialog(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    form.reset({
      name: branch.name || "",
      contactNumber: branch.contactNumber || "",
      address: branch.address || "",
      postCode: branch.postCode || "",
      contractNumber: branch.contractNumber || "UN5-163-26",
      contractStartDate: branch.contractStartDate ? new Date(branch.contractStartDate).toISOString().split('T')[0] : "",
      contractEndDate: branch.contractEndDate ? new Date(branch.contractEndDate).toISOString().split('T')[0] : "",
      email: branch.email || "",
      username: branch.username || "",
      password: "", // Always empty for security
      confirmPassword: "", // Always empty for security
      status: branch.status as "active" | "inactive",
      paymentMethod: (branch.paymentMethod || "online") as "online" | "cash",
      visitFrequency: (branch.visitFrequency || "monthly") as "monthly" | "quarterly" | "yearly",
      paymentAmount: (branch.paymentAmount?.toString() || "50") as "20" | "25" | "30" | "35" | "50" | "70" | "75" | "100" | "150" | "240" | "300" | "360" | "400" | "500",
      lastTraining: branch.lastTraining ? new Date(branch.lastTraining).toISOString().split('T')[0] : "",
      trainingNextDue: branch.trainingNextDue ? new Date(branch.trainingNextDue).toISOString().split('T')[0] : "",
    });
    setSelectedLogoFile(null); // Clear any previously selected logo file
    setShowEditDialog(true);
  };

  // Monthly Reports Mutations
  const uploadReportMutation = useMutation({
    mutationFn: async (data: { file: File; title: string; reportType: string; viewSize: string }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('title', data.title);
      formData.append('reportType', data.reportType);
      formData.append('viewSize', data.viewSize);
      
      const response = await fetch('/api/monthly-reports', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (newReport) => {
      // Refresh both Monthly Reports and My Docs (auto-save enabled)
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      // Also invalidate branch reports if a branch was filtered
      queryClient.invalidateQueries({ queryKey: ["/api/branch/monthly-reports"] });
      refetchReports(); // Force refresh
      
      setShowMonthlyReportDialog(false);
      setReportFile(null);
      setReportTitle("");
      setReportType("");
      setReportViewSize("A4");
      toast({
        title: "Success",
        description: "Monthly report uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async (data: { baseReportId: string; newDate: string; newTitle: string; dateX?: number; dateY?: number; fontSize?: number; fontFamily?: string; fontColor?: string; fontBold?: boolean }) => {
      const response = await fetch('/api/monthly-reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Generation failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-reports"] });
      // Keep dialog open — reset placed items and text so user can do another report
      setGenTextItems([]);
      setGenDateOfReport('');
      setGenClickX(null);
      setGenClickY(null);
      setGenInputScreenPos(null);
      setGenEditActive(false);
      if (genPreviewUrl) { URL.revokeObjectURL(genPreviewUrl); setGenPreviewUrl(null); }
      toast({ title: "Report Saved", description: "New report saved. You can place more text or save another." });
    },
    onError: (error: Error) => {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    }
  });

  const handlePreviewGeneratedReport = async () => {
    const allItems = [
      ...(genClickX !== null && genClickY !== null && genDateOfReport ? [{
        text: genDateOfReport, pdfX: genClickX, pdfY: genClickY,
        fontSize: genFontSize, fontFamily: genFontFamily, fontColor: genFontColor, fontBold: genFontBold,
      }] : []),
      ...genTextItems.map(it => ({ text: it.text, pdfX: it.pdfX, pdfY: it.pdfY, fontSize: it.fontSize, fontFamily: it.fontFamily, fontColor: it.fontColor, fontBold: it.fontBold, pageIndex: it.pageIndex })),
    ];
    if (!genPremises || allItems.length === 0) return;
    setIsGeneratingPreview(true);
    if (genPreviewUrl) { URL.revokeObjectURL(genPreviewUrl); setGenPreviewUrl(null); }
    try {
      const primary = allItems[0];
      const body: any = {
        baseReportId: genPremises, newDate: primary.text,
        dateX: primary.pdfX, dateY: primary.pdfY,
        fontSize: primary.fontSize, fontFamily: primary.fontFamily,
        fontColor: primary.fontColor, fontBold: primary.fontBold,
        extraItems: allItems.slice(1),
      };
      const response = await fetch('/api/monthly-reports/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Preview failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setGenPreviewUrl(url);
    } catch (e: any) {
      toast({ title: "Preview Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Load and render PDF on canvas for the click-to-place editor
  const loadGenPdfOnCanvas = async (reportId: string) => {
    if (!reportId) return;

    // Immediately clear the old canvas so the old PDF doesn't show as a ghost
    setGenCanvasDims(null);
    setGenPdfDims(null);
    setGenCanvas2Dims(null);
    setGenPdfDims2(null);
    setGenClickX(null);
    setGenClickY(null);
    setGenInputScreenPos(null);
    setGenEditActive(false);
    setGenTextItems([]);
    setGenPage2Loaded(false);
    setGenActivePage(1);

    if (genPdfDocRef.current) {
      try { genPdfDocRef.current.destroy(); } catch {}
      genPdfDocRef.current = null;
    }

    const canvas = genCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 0;
      canvas.height = 0;
    }

    // Small delay to let the canvas mount
    await new Promise(r => setTimeout(r, 100));
    const canvas2 = genCanvasRef.current;
    if (!canvas2) return;

    try {
      const response = await fetch(`/api/monthly-reports/${reportId}/raw-pdf`);
      if (!response.ok) return;
      const arrayBuffer = await response.arrayBuffer();

      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      genPdfDocRef.current = pdfDoc;

      const page = await pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });

      const containerWidth = (canvas2.parentElement?.clientWidth || 600) - 8;
      const scale = containerWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      canvas2.width = scaledViewport.width;
      canvas2.height = scaledViewport.height;

      const ctx = canvas2.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas2.width, canvas2.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas2.width, canvas2.height);
      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

      setGenPdfDims({ w: viewport.width, h: viewport.height });
      setGenCanvasDims({ w: scaledViewport.width, h: scaledViewport.height });

      // Render page 2 if it exists — also clickable for adding text
      console.log('[PDF] numPages:', pdfDoc.numPages);
      if (pdfDoc.numPages >= 2) {
        const page2 = await pdfDoc.getPage(2);
        const vp2Raw = page2.getViewport({ scale: 1.0 });
        const vp2 = page2.getViewport({ scale });

        // Retry getting the canvas ref up to 5 times (150ms apart) in case
        // React hasn't flushed the re-render yet
        let canvas2El: HTMLCanvasElement | null = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          canvas2El = genCanvas2Ref.current;
          if (canvas2El) break;
          await new Promise(r => setTimeout(r, 150));
        }
        console.log('[PDF] page2 canvas ref:', canvas2El ? 'found' : 'null');

        if (canvas2El) {
          canvas2El.width = vp2.width;
          canvas2El.height = vp2.height;
          const ctx2 = canvas2El.getContext('2d');
          if (ctx2) {
            ctx2.fillStyle = '#ffffff';
            ctx2.fillRect(0, 0, vp2.width, vp2.height);
            await page2.render({ canvasContext: ctx2, viewport: vp2 }).promise;
            setGenPdfDims2({ w: vp2Raw.width, h: vp2Raw.height });
            setGenCanvas2Dims({ w: vp2.width, h: vp2.height });
            setGenPage2Loaded(true);
            console.log('[PDF] page 2 rendered OK');
          }
        }
      }
    } catch (e) {
      console.error('Error loading PDF for click editor:', e);
    }
  };

  // Redraw a single canvas page and overlay its items
  const redrawPageCanvas = async (
    pageNum: 1 | 2,
    items: typeof genTextItems,
  ) => {
    const pdfDoc = genPdfDocRef.current;
    if (!pdfDoc) return;

    const canvas = pageNum === 1 ? genCanvasRef.current : genCanvas2Ref.current;
    const dims = pageNum === 1 ? genCanvasDims : genCanvas2Dims;
    const pdfDims = pageNum === 1 ? genPdfDims : genPdfDims2;
    if (!canvas || !dims || !pdfDims) return;

    const page = await pdfDoc.getPage(pageNum);
    const scale = dims.w / pdfDims.w;
    const viewport = page.getViewport({ scale });
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / (rect.width || canvas.width);
    const sy = canvas.height / (rect.height || canvas.height);
    const fontNameMap: Record<string, string> = {
      BiroScript: 'BiroScript',
      IndieFlower: 'Indie Flower',
      PatrickHand: 'Patrick Hand',
      Kalam: 'Kalam',
    };
    for (const item of items.filter(i => i.pageIndex === pageNum)) {
      const fname = fontNameMap[item.fontFamily] ?? 'Kalam';
      const cfs = item.fontSize * sx;
      ctx.font = `${item.fontBold ? 'bold ' : ''}${cfs}px '${fname}', cursive`;
      ctx.fillStyle = item.fontColor;
      ctx.fillText(item.text, item.screenX * sx, item.screenY * sy + cfs);
    }
  };

  // Whenever placed items change, refresh both canvas overlays
  useEffect(() => {
    if (genCanvasDims && genPdfDims) redrawPageCanvas(1, genTextItems);
    if (genCanvas2Dims && genPdfDims2) redrawPageCanvas(2, genTextItems);
  }, [genTextItems, genCanvasDims, genPdfDims, genCanvas2Dims, genPdfDims2]);

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/monthly-reports/${reportId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      
      return response.json();
    },
    onSuccess: (data, reportId) => {
      // Immediately update the UI by removing the deleted item from cache
      queryClient.setQueryData(["/api/monthly-reports"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((report: any) => report.id !== reportId);
      });
      
      // Then invalidate to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-reports"] });
      
      setShowReportDeleteDialog(false);
      setReportToDelete(null);
      toast({
        title: "Success",
        description: "Monthly report deleted (preserved in My Docs)",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete monthly report",
        variant: "destructive",
      });
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async (data: { reportId: string; title: string; reportType: string; viewSize: string }) => {
      const response = await fetch(`/api/monthly-reports/${data.reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          reportType: data.reportType,
          viewSize: data.viewSize,
        }),
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-reports"] });
      setShowReportEditDialog(false);
      setSelectedReport(null);
      toast({
        title: "Success",
        description: "Monthly report updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update monthly report",
        variant: "destructive",
      });
    },
  });



  // Save to My Documents mutation for monthly reports  
  const saveToMyDocsMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/monthly-reports/${reportId}/send-to-mydocs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save report');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Saved",
        description: "Monthly report saved to My Documents",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save report",
        variant: "destructive",
      });
    },
  });

  const sendToMyDocsMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/monthly-reports/${reportId}/send-to-mydocs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setShowReportViewDialog(false);
      toast({
        title: "Success",
        description: "Report sent to My Documents",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send report to My Documents",
        variant: "destructive",
      });
    },
  });


  const sendReportToBranchMutation = useMutation({
    mutationFn: async (data: { reportId: string; branchId: string }) => {
      const response = await fetch(`/api/monthly-reports/${data.reportId}/send-to-branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: data.branchId })
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-reports'] });
      queryClient.refetchQueries({ queryKey: ['/api/monthly-reports'] });
      refetchReports();
      
      setShowReportSendDialog(false);
      setSelectedBranchForReport("");
      toast({
        title: "Success",
        description: "Report sent to branch successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send report to branch",
        variant: "destructive",
      });
    },
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (branchId: string) => {
      console.log('Attempting to delete branch:', branchId);
      
      const response = await fetch(`/api/branches/${branchId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies for server-side auth
      });
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Server error: ${response.status}`;
          
          // Expired admin sessions must return to the canonical admin login.
          if (response.status === 401) {
            window.location.replace('/admin-login');
            throw new Error('Authentication expired. Please log in again.');
          }
        } catch (parseError) {
          const text = await response.text();
          errorMessage = text || `HTTP ${response.status}: Failed to delete branch`;
        }
        
        console.error('Delete branch error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('Delete branch success:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Branch deletion successful:', data);
      // Smooth refresh - just invalidate to refetch without clearing cache first
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      
      setShowBranchDeleteDialog(false);
      setBranchToDelete(null);
      
      toast({
        title: "Success",
        description: data.message || "Branch and all associated data deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Branch deletion failed:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete branch. Please check your permissions and try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteBranch = (branch: Branch) => {
    setBranchToDelete(branch);
    setShowBranchDeleteDialog(true);
  };
  
  // PDF Viewer handlers
  const handleViewPDF = (document: any) => {
    setSelectedPDFDocument(document);
    setShowPDFViewer(true);
  };
  
  const handleClosePDFViewer = () => {
    setShowPDFViewer(false);
    setSelectedPDFDocument(null);
  };

  const confirmDeleteBranch = () => {
    if (branchToDelete) {
      deleteBranchMutation.mutate(branchToDelete.id);
    }
  };

  // Image editing functions
  const handleImageDoubleClick = (photo: Photo) => {
    if (photo.mimeType?.includes('png') || photo.mimeType?.includes('jpeg') || photo.mimeType?.includes('jpg')) {
      setSelectedImage(photo);
      setShowImageEditor(true);
    }
  };

  const initializeCanvas = (canvas: HTMLCanvasElement, imageUrl: string) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Set canvas size to image size but limit maximum dimensions
      const maxWidth = 800;
      const maxHeight = 600;
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      
      ctx.drawImage(img, 0, 0, width, height);
    };
    img.onerror = () => {
      console.error('Failed to load image for editing');
      toast({
        title: "Error",
        description: "Failed to load image for editing",
        variant: "destructive",
      });
    };
    img.src = imageUrl;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef || currentTool !== 'pen') return;
    setIsDrawing(true);
    
    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvasRef.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef || currentTool !== 'pen') return;
    
    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvasRef.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const addTextToCanvas = (text: string, x: number, y: number) => {
    if (!canvasRef) return;
    
    const ctx = canvasRef.getContext('2d');
    if (ctx) {
      ctx.font = '20px "Biro Script", cursive';
      ctx.fillStyle = '#000000';
      ctx.fillText(text, x, y);
    }
  };

  const saveEditedImage = async () => {
    if (!canvasRef || !selectedImage) return;
    
    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob | null>(resolve => {
        canvasRef.toBlob(resolve, 'image/png', 1.0);
      });
      
      if (!blob) {
        toast({
          title: "Error",
          description: "Failed to create edited image",
          variant: "destructive",
        });
        return;
      }
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', blob, selectedImage.filename);
      
      // Handle different image types (photos vs monthly reports)
      if (selectedImage.type === 'monthly-report') {
        // Update the monthly report file
        const response = await fetch(`/api/monthly-reports/${selectedImage.id}/update-file`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`${response.status}: ${text}`);
        }
        
        // Refresh monthly reports list
        await queryClient.invalidateQueries({ queryKey: ["/api/monthly-reports"] });
        
        toast({
          title: "Success",
          description: "Monthly report updated with your annotations",
        });
      } else {
        // Save as new photo (original behavior for photos)
        const editedFileName = `edited_${Date.now()}_${selectedImage.filename}`;
        formData.append('title', `Edited: ${selectedImage.title}`);
        formData.append('description', `Edited version of ${selectedImage.title} with handwritten annotations`);
        formData.append('type', selectedImage.type);
        formData.append('category', selectedImage.category);
        
        const response = await fetch('/api/photos', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`${response.status}: ${text}`);
        }
        
        // Refresh photos list
        await queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
        
        toast({
          title: "Success",
          description: "Edited image saved successfully",
        });
      }
      
      setShowImageEditor(false);
      setSelectedImage(null);
      
    } catch (error: any) {
      console.error("Error saving edited image:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save edited image",
        variant: "destructive",
      });
    }
  };



  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Logo file must be less than 10MB",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml'];
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
      toast({
        title: "Invalid File Type",
        description: "Please select PNG, JPG/JPEG, GIF or SVG",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    setBranchLogoFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setBranchLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Card-specific logo upload handler
  const handleCardLogoUpload = (branchId: string, file: File | undefined) => {
    console.log('🎯 Logo upload started:', { branchId, file: file?.name, size: file?.size, type: file?.type });
    
    if (!file) {
      console.log('❌ No file provided');
      return;
    }

    // Validate file size (10MB limit for all image formats)
    if (file.size > 10 * 1024 * 1024) {
      console.log('❌ File too large:', file.size);
      toast({
        title: "File Too Large",
        description: "Logo file must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type - support all image formats
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type);
      toast({
        title: "Invalid File Type",
        description: "Please select a valid image file (PNG, JPG/JPEG, GIF, SVG)",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ File validation passed, creating FormData');

    // Create FormData with correct field name 'logo' (backend expects this)
    const formData = new FormData();
    formData.append('logo', file);
    
    console.log('📤 Sending upload request to:', `/api/branches/${branchId}`);

    // Use direct fetch call for file upload (apiRequest doesn't handle FormData properly)
    fetch(`/api/branches/${branchId}/logo`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Include cookies for authentication
    })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      const result = await response.json();
      console.log('✅ Upload successful:', result);
      toast({
        title: "Logo Updated",
        description: "Branch logo has been uploaded successfully with lifetime storage",
      });
      // Refresh the branches data to show new logo with proper cache invalidation
      queryClient.invalidateQueries({ queryKey: ['/api/branches'] });
      // Also invalidate individual branch data for immediate update
      queryClient.invalidateQueries({ queryKey: ['/api/branch/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/branch/current'] });
      // Force refresh the specific branch logo with cache busting
      queryClient.invalidateQueries({ queryKey: [`/api/branches/${branchId}/logo`] });
    })
    .catch((error) => {
      console.error('❌ Logo upload error:', error);
      toast({
        title: "Upload Failed",
        description: `Failed to upload logo: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    });
  };

  // Remove logo handler - DISABLED to prevent auto-removal and preserve uploaded logos permanently
  const handleRemoveLogo = (branchId: string) => {
    // Logo removal functionality disabled to prevent auto-removal
    // All uploaded logos are preserved permanently for lifetime storage
    console.warn('Logo removal disabled - uploaded logos are preserved permanently');
    toast({
      title: "Logo Removal Disabled",
      description: "Logo removal is disabled to prevent data loss. Logos are preserved permanently.",
      variant: "default",
    });
    return;
    
    // Original removal code commented out to prevent accidental logo deletion
    /*
    apiRequest('PATCH', `/api/branches/${branchId}`, { logoUrl: null })
    .then(() => {
      toast({
        title: "Logo Removed",
        description: "Branch logo has been removed successfully",
      });
      // Refresh the branches data
      queryClient.invalidateQueries({ queryKey: ['/api/branches'] });
    })
    .catch((error) => {
      console.error('Logo removal error:', error);
      toast({
        title: "Removal Failed",
        description: "Failed to remove logo. Please try again.",
        variant: "destructive",
      });
    });
    */
  };

  // Photo management functions
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for photos
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      
      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhotoMutation = useMutation({
    mutationFn: async () => {
      if (!photoFile) throw new Error("No photo selected");
      
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('type', photoType);
      formData.append('description', photoDescription);
      formData.append('category', 'general');
      
      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      setShowPhotoDialog(false);
      setPhotoFile(null);
      setPhotoPreview("");
      setPhotoDescription("");
      setPhotoType('before');
      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    },
  });

  const sendPhotoToBranchMutation = useMutation({
    mutationFn: async (data: { photoId: string; branchId: string }) => {
      const response = await fetch(`/api/photos/${data.photoId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ branchId: data.branchId }),
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      setShowPhotoSendDialog(false);
      setSelectedPhotoForSend(null);
      setSelectedBranchForPhoto("");
      toast({
        title: "Success",
        description: "Photo sent to branch successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send photo",
        variant: "destructive",
      });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // If photo is already deleted (404), treat as success
        if (response.status === 404) {
          return { success: true, message: "Photo already deleted" };
        }
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      
      return response.json();
    },
    onSuccess: (data, photoId) => {
      // Immediately update the UI by removing the deleted item from cache
      queryClient.setQueryData(["/api/photos"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((photo: any) => photo.id !== photoId);
      });
      
      // Then invalidate to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      
      toast({
        title: "Success",
        description: "Photo deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete photo",
        variant: "destructive",
      });
    },
  });

  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);
  const [showPhotoDeleteDialog, setShowPhotoDeleteDialog] = useState(false);

  const handleDeletePhoto = (photo: Photo) => {
    deletePhotoMutation.mutate(photo.id);
  };

  const confirmDeletePhoto = () => {
    if (photoToDelete) {
      deletePhotoMutation.mutate(photoToDelete.id);
      setShowPhotoDeleteDialog(false);
      setPhotoToDelete(null);
    }
  };

  const handleSendPhotoToBranch = (photo: Photo) => {
    setSelectedPhotoForSend(photo);
    setShowPhotoSendDialog(true);
  };

  const handleViewPhoto = (photo: Photo) => {
    setViewingPhoto(photo);
    setShowPhotoViewerDialog(true);
  };

  // Sidebar navigation structure
  const sidebarSections = [
    // OVERVIEW
    { section: "OVERVIEW", items: [
      { id: "dashboard", label: "Dashboard", icon: BarChart3 },
      { id: "branches", label: "Branches", icon: Building2 }
    ]},
    
    // CONTENT AREAS  
    { section: "CONTENT AREAS", items: [
      { id: "photos", label: "Photos", icon: ImageIcon },
      { id: "pest-control-docs", label: "Pest Control Docs", icon: FileText },
      { id: "monthly-reports", label: "Monthly Reports", icon: Calendar },
      { id: "useful-links", label: "Useful Links", icon: LinkIcon }
    ]},
    
    
    // FINANCIAL MANAGEMENT
    { section: "FINANCIAL MANAGEMENT", items: [
      { id: "payment-tracker", label: "Payment Tracker", icon: CreditCard }
    ]},
    
    // BRANCH MANAGEMENT  
    { section: "BRANCH MANAGEMENT", items: [
      { id: "site-settings", label: "Site Settings", icon: Settings }
    ]},
    
    // DEVELOPER TOOLS
    { section: "DEVELOPER TOOLS", items: [
      { id: "iot-cloud", label: "IoT Cloud Settings", icon: Zap },
      { id: "download-source", label: "Download Source Code", icon: Download }
    ]},
    
    // ACCOUNT
    { section: "ACCOUNT", items: [
      { id: "logout", label: "Logout", icon: LogOut }
    ]}
  ];

  return (
    <div className="h-screen w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden flex flex-col">
      {/* Sticky Top Banner - 2 Line Layout */}
      <div className="flex-shrink-0 z-50 bg-gradient-to-r from-slate-800/90 via-purple-800/70 to-slate-800/90 shadow-xl border-b border-purple-500/20 backdrop-blur-md">
        {/* First Line - Welcome Text */}
        <div className="px-2 sm:px-4 lg:px-6 py-1 overflow-hidden border-b border-purple-500/10">
          <div className="relative">
            <h1 className="text-sm sm:text-base lg:text-lg font-bold text-white animate-scroll-left-right whitespace-nowrap">
              Welcome back, Admin! Manage your branches and content from here. Central management system
            </h1>
          </div>
        </div>
        
        {/* Second Line - Buttons */}
        <div className="px-2 sm:px-4 lg:px-6 py-2 flex items-center justify-center space-x-2 sm:space-x-3">
          <Button
            data-testid="button-staff-access"
            variant="outline"
            size="sm"
            className="border-green-600 text-green-300 hover:bg-green-700/20 hover:border-green-500 bg-green-800/10 text-xs sm:text-sm px-2 sm:px-3"
            onClick={() => {
              if (!staffAccessUnlocked) {
                setShowStaffAccessPinDialog(true);
              } else {
                setShowStaffAccessDialog(true);
              }
            }}
          >
            <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span>Staff</span>
            {!staffAccessUnlocked && (
              <Lock className="h-3 w-3 ml-1 text-yellow-400" />
            )}
          </Button>
          <Button
            data-testid="button-settings"
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500 bg-slate-800/30 text-xs sm:text-sm px-2 sm:px-3"
            onClick={() => setShowPinDialog(true)}
          >
            <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span>Settings</span>
          </Button>
          <Button
            data-testid="button-logout"
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500 bg-slate-800/30 text-xs sm:text-sm px-2 sm:px-3"
            onClick={handleAdminLogout}
          >
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 min-h-0">
        {/* Mobile hamburger - always visible on small screens */}
        <Button
          onClick={() => setSidebarCollapsed(false)}
          variant="ghost"
          size="sm"
          className="lg:hidden fixed top-3 left-3 z-50 text-white hover:bg-white/10 w-11 h-11 p-0 bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-lg shadow-lg"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop hamburger - only when collapsed on large screens */}
        {sidebarCollapsed && (
          <Button
            data-testid="button-open-sidebar"
            onClick={() => setSidebarCollapsed(false)}
            variant="ghost"
            size="sm"
            className="hidden lg:flex fixed top-24 left-4 z-50 text-white hover:bg-white/10 transition-all duration-300 hover:scale-110 w-10 h-10 p-0 bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-lg shadow-lg items-center justify-center"
            title="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Mobile overlay backdrop */}
        {!sidebarCollapsed && (
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* Sidebar - fixed drawer on mobile, in-flow on desktop */}
        <div className={`
          fixed lg:relative z-50 lg:z-auto h-full
          ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:pointer-events-none' : 'translate-x-0 lg:w-64 lg:opacity-100'}
          w-72 lg:w-64 transition-all duration-300 ease-in-out
          bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-800/95 backdrop-blur-md border-r border-slate-700/50 flex flex-col overflow-hidden
        `}>
          {/* Header with collapse/expand toggle */}
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => {
                    console.log("Master unlock button clicked");
                    setShowMasterUnlockDialog(true);
                    console.log("Dialog state set to true");
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 transition-all duration-300 p-1.5"
                  title="Master Unlock - Unlock all sections with PIN"
                >
                  <Unlock className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setSidebarCollapsed(true)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 transition-all duration-300 hover:scale-110 p-1.5"
                  title="Collapse sidebar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Navigation with Scrolling */}
          <nav 
            ref={sidebarScrollRef}
            className={`flex-1 scrollbar-enhanced sidebar-scrollable scroll-indicator py-4 px-2 ${
              scrollIndicators.top ? 'scrolled-top' : ''
            } ${scrollIndicators.bottom ? 'scrolled-bottom' : ''}`}
          >
            {sidebarSections.map((section, sectionIndex) => (
              <div key={section.section} className="mb-6">
                <div className="px-3 mb-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {section.section}
                  </h3>
                </div>
                <div className="space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const delay = (sectionIndex * section.items.length + itemIndex) * 0.05;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.id === "logout") {
                            void handleAdminLogout();
                          } else if (item.id === "download-source") {
                            // Download source code as zip file
                            console.log("🔥 Downloading complete source code...");
                            const link = document.createElement('a');
                            link.href = '/api/download-source-code';
                            link.download = 'pest-control-source-code.zip';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            toast({
                              title: "Source Code Download",
                              description: "Complete source code is being downloaded as a ZIP file.",
                            });
                          } else if (item.id === "site-settings") {
                            if (!siteSettingsUnlocked) {
                              setShowSiteSettingsPinDialog(true);
                            } else {
                              setActiveTab(item.id);
                            }
                          } else if (item.id === "payment-tracker") {
                            if (!paymentTrackerUnlocked) {
                              setShowPaymentTrackerPinDialog(true);
                            } else {
                              setActiveTab(item.id);
                            }
                          } else if (item.id === "useful-links") {
                            if (!usefulLinksUnlocked) {
                              setShowUsefulLinksPinDialog(true);
                            } else {
                              setActiveTab(item.id);
                            }
                          } else if (item.id === "pest-control-docs") {
                            if (!pestControlUnlocked) {
                              setShowPestControlPinDialog(true);
                            } else {
                              setActiveTab(item.id);
                            }
                          } else if (item.id === "branches") {
                            if (!branchesUnlocked) {
                              setShowBranchesPinDialog(true);
                            } else {
                              setActiveTab(item.id);
                            }
                          } else {
                            setActiveTab(item.id);
                          }
                          if (window.innerWidth < 1024) setSidebarCollapsed(true);
                        }}
                        className={`
                          w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-all duration-300 group/item
                          transform hover:scale-105 hover:translate-x-1
                          ${isActive 
                            ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30 shadow-lg shadow-pink-500/20' 
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }
                        `}
                        style={{
                          animationDelay: `${delay}s`
                        }}
                      >
                        <div className={`
                          flex items-center justify-center w-8 h-8 rounded-md transition-all duration-300
                          ${isActive 
                            ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-md' 
                            : 'text-slate-400 group-hover/item:text-white group-hover/item:bg-white/10 group-hover/item:scale-110'
                          }
                        `}>
                          <Icon className="h-4 w-4" />
                        </div>
                        
                        <div className="ml-3 flex-1 flex items-center justify-between">
                          <span className="text-sm font-medium transition-all duration-300 group-hover/item:translate-x-1">
                            {item.label}
                          </span>
                          {item.id === "site-settings" && !siteSettingsUnlocked && (
                            <Lock className="h-3 w-3 text-yellow-400" />
                          )}
                          {item.id === "payment-tracker" && !paymentTrackerUnlocked && (
                            <Lock className="h-3 w-3 text-yellow-400" />
                          )}
                          {item.id === "useful-links" && !usefulLinksUnlocked && (
                            <Lock className="h-3 w-3 text-yellow-400" />
                          )}
                          {item.id === "pest-control-docs" && !pestControlUnlocked && (
                            <Lock className="h-3 w-3 text-yellow-400" />
                          )}
                          {item.id === "branches" && !branchesUnlocked && (
                            <Lock className="h-3 w-3 text-yellow-400" />
                          )}
                        </div>
                        
                        {isActive && (
                          <div className="w-1 h-6 bg-gradient-to-b from-pink-400 to-purple-400 rounded-full animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Main Content - full width on mobile (sidebar is fixed overlay), flex-1 on desktop */}
        <div className="flex-1 overflow-hidden w-full">
          <div className="h-full overflow-y-auto p-4 lg:p-6 pt-16 lg:pt-6 scroll-ios">
            {/* Dashboard Section */}
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                {/* Header Section - Mobile Responsive */}
                <div className="relative overflow-hidden w-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl blur-xl"></div>
                  <div className="relative bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 lg:p-8 w-full max-w-full overflow-hidden">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      <div className="min-w-0 flex-1">
                        <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-2 text-center lg:text-left">
                          Dashboard Overview
                        </h1>
                        <p className="text-slate-300 text-sm lg:text-lg font-medium text-center lg:text-left">Welcome to your pest control management center</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start mt-4 space-y-2 sm:space-y-0 sm:space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs lg:text-sm text-slate-400">System Online</span>
                          </div>
                          <div className="text-xs lg:text-sm text-slate-400">
                            Last updated: {new Date().toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="hidden lg:flex items-center space-x-6 flex-shrink-0">
                        <div className="w-32 h-32 relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-spin opacity-20"></div>
                          <div className="absolute inset-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <BarChart3 className="h-12 w-12 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="group cursor-pointer">
                    <div className="relative transform transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
                      <Card className="relative bg-gradient-to-br from-blue-600/30 to-cyan-600/20 border border-blue-500/40 backdrop-blur-xl rounded-xl overflow-hidden h-32">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-10 -mt-10"></div>
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center justify-between h-full">
                            <div className="space-y-1">
                              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider text-center">Total Branches</p>
                              <p className="text-2xl font-bold text-white leading-none">
                                {statsLoading ? (
                                  <div className="w-8 h-6 bg-blue-400/30 rounded animate-pulse"></div>
                                ) : (
                                  <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                                    {stats?.totalBranches || 0}
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center space-x-1 text-blue-300">
                                <TrendingUp className="h-2 w-2" />
                                <span className="text-xs font-medium">+12% from last month</span>
                              </div>
                            </div>
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
                                <Building2 className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="group cursor-pointer">
                    <div className="relative transform transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
                      <Card className="relative bg-gradient-to-br from-green-600/30 to-emerald-600/20 border border-green-500/40 backdrop-blur-xl rounded-xl overflow-hidden h-32">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-10 -mt-10"></div>
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center justify-between h-full">
                            <div className="space-y-1">
                              <p className="text-green-200 text-xs font-semibold uppercase tracking-wider text-center">Active Users</p>
                              <p className="text-2xl font-bold text-white leading-none">
                                {statsLoading ? (
                                  <div className="w-8 h-6 bg-green-400/30 rounded animate-pulse"></div>
                                ) : (
                                  <span className="bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                                    {stats?.activeUsers || 0}
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center space-x-1 text-green-300">
                                <TrendingUp className="h-2 w-2" />
                                <span className="text-xs font-medium">+8% from last week</span>
                              </div>
                            </div>
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
                                <Users className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="group cursor-pointer">
                    <div className="relative transform transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
                      <Card className="relative bg-gradient-to-br from-purple-600/30 to-pink-600/20 border border-purple-500/40 backdrop-blur-xl rounded-xl overflow-hidden h-32">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-10 -mt-10"></div>
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center justify-between h-full">
                            <div className="space-y-1">
                              <p className="text-purple-200 text-xs font-semibold uppercase tracking-wider text-center">Monthly Revenue</p>
                              <p className="text-2xl font-bold text-white leading-none">
                                {statsLoading ? (
                                  <div className="w-10 h-6 bg-purple-400/30 rounded animate-pulse"></div>
                                ) : (
                                  <span className="bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                                    £{stats?.monthlyRevenue || 0}
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center space-x-1 text-purple-300">
                                <TrendingUp className="h-2 w-2" />
                                <span className="text-xs font-medium">+15% from last month</span>
                              </div>
                            </div>
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
                                <DollarSign className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="group cursor-pointer">
                    <div className="relative transform transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
                      <Card className="relative bg-gradient-to-br from-orange-600/30 to-red-600/20 border border-orange-500/40 backdrop-blur-xl rounded-xl overflow-hidden h-32">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-10 -mt-10"></div>
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center justify-between h-full">
                            <div className="space-y-1">
                              <p className="text-orange-200 text-xs font-semibold uppercase tracking-wider text-center">System Health</p>
                              <p className="text-2xl font-bold text-white leading-none">
                                {statsLoading ? (
                                  <div className="w-8 h-6 bg-orange-400/30 rounded animate-pulse"></div>
                                ) : (
                                  <span className="bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                                    {stats?.systemHealth || 0}%
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center space-x-1 text-orange-300">
                                <CheckCircle className="h-2 w-2" />
                                <span className="text-xs font-medium">All systems operational</span>
                              </div>
                            </div>
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
                                <Activity className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Pest Control System Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Pest Monitoring Status */}
                  <div className="group">
                    <div className="relative transform transition-all duration-300 group-hover:scale-[1.02] h-full">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl"></div>
                      <Card className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 backdrop-blur-xl rounded-2xl h-full">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg font-bold text-white flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                  <Bug className="h-5 w-5 text-white" />
                                </div>
                                <span>Pest Monitoring</span>
                              </CardTitle>
                              <CardDescription className="text-slate-400 mt-1">Real-time activity status</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-300 font-medium">Non-Toxic Activity Detected</span>
                              </div>
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                                <span className="text-slate-300">Zone A1-A5</span>
                              </div>
                              <span className="text-slate-400 text-sm">Last check: 2h ago</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                                <span className="text-slate-300">Zone B1-B3</span>
                              </div>
                              <span className="text-slate-400 text-sm">Last check: 4h ago</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* WiFi Device Monitoring */}
                  <div className="group">
                    <div className="relative transform transition-all duration-300 group-hover:scale-[1.02] h-full">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl"></div>
                      <Card className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 backdrop-blur-xl rounded-2xl h-full">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg font-bold text-white flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                  <Globe className="h-5 w-5 text-white" />
                                </div>
                                <span>Device Monitoring</span>
                              </CardTitle>
                              <CardDescription className="text-slate-400 mt-1">WiFi connected devices</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-300 font-medium">Device #4</span>
                              </div>
                              <span className="text-green-400 text-sm font-medium">Online</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-300 font-medium">Device #1</span>
                              </div>
                              <span className="text-green-400 text-sm font-medium">Online</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                <span className="text-red-300 font-medium">Device #2</span>
                              </div>
                              <span className="text-red-400 text-sm font-medium">Offline</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Trap Activity Logs */}
                  <div className="group">
                    <div className="relative transform transition-all duration-300 group-hover:scale-[1.02] h-full">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl"></div>
                      <Card className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 backdrop-blur-xl rounded-2xl h-full">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg font-bold text-white flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                  <Activity className="h-5 w-5 text-white" />
                                </div>
                                <span>Trap Activity</span>
                              </CardTitle>
                              <CardDescription className="text-slate-400 mt-1">Active monitoring logs</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                              <div>
                                <p className="text-white text-sm font-medium">Last Activity</p>
                                <p className="text-slate-400 text-xs">Today, 14:32</p>
                              </div>
                              <Clock className="h-4 w-4 text-slate-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20 text-center">
                                <p className="text-2xl font-bold text-green-400">12</p>
                                <p className="text-green-300 text-xs">Active Traps</p>
                              </div>
                              <div className="p-3 bg-slate-800/40 rounded-xl text-center">
                                <p className="text-2xl font-bold text-slate-400">3</p>
                                <p className="text-slate-300 text-xs">Inactive Traps</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Additional Dashboard Widgets */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Activity Widget */}
                  <div className="group">
                    <div className="relative transform transition-all duration-300 group-hover:scale-[1.02] h-full">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
                      <Card className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 backdrop-blur-xl rounded-2xl h-full">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-xl font-bold text-white flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                                  <Clock className="h-5 w-5 text-white" />
                                </div>
                                <span>Recent Activity</span>
                              </CardTitle>
                              <CardDescription className="text-slate-400 mt-1">Latest system updates and actions</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-start space-x-3 p-3 bg-slate-800/40 rounded-xl hover:bg-slate-800/60 transition-colors duration-200">
                              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <UserPlus className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">New branch registered</p>
                                <p className="text-slate-400 text-xs">London Central Branch - 2 hours ago</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3 p-3 bg-slate-800/40 rounded-xl hover:bg-slate-800/60 transition-colors duration-200">
                              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Upload className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">Monthly report uploaded</p>
                                <p className="text-slate-400 text-xs">Branch-A-September-2024.pdf - 4 hours ago</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3 p-3 bg-slate-800/40 rounded-xl hover:bg-slate-800/60 transition-colors duration-200">
                              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <ImageIcon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">Before/After photos added</p>
                                <p className="text-slate-400 text-xs">Treatment documentation - 6 hours ago</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Quick Actions Widget */}
                  <div className="group">
                    <div className="relative transform transition-all duration-300 group-hover:scale-[1.02] h-full">
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-2xl blur-xl"></div>
                      <Card className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 backdrop-blur-xl rounded-2xl h-full">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-xl font-bold text-white flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center">
                                  <Zap className="h-5 w-5 text-white" />
                                </div>
                                <span>Quick Actions</span>
                              </CardTitle>
                              <CardDescription className="text-slate-400 mt-1">Frequently used functions</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              onClick={() => setActiveTab("branches")}
                              className="h-16 bg-gradient-to-r from-blue-600/20 to-blue-700/30 border border-blue-500/30 hover:from-blue-600/30 hover:to-blue-700/40 text-white rounded-xl flex-col space-y-1 group/btn"
                            >
                              <Building2 className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-200" />
                              <span className="text-xs font-medium">Add Branch</span>
                            </Button>
                            <Button 
                              onClick={() => setActiveTab("photos")}
                              className="h-16 bg-gradient-to-r from-purple-600/20 to-purple-700/30 border border-purple-500/30 hover:from-purple-600/30 hover:to-purple-700/40 text-white rounded-xl flex-col space-y-1 group/btn"
                            >
                              <ImageIcon className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-200" />
                              <span className="text-xs font-medium">Upload Photo</span>
                            </Button>
                            <Button 
                              onClick={() => setActiveTab("pest-control")}
                              className="h-16 bg-gradient-to-r from-green-600/20 to-green-700/30 border border-green-500/30 hover:from-green-600/30 hover:to-green-700/40 text-white rounded-xl flex-col space-y-1 group/btn"
                            >
                              <Bug className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-200" />
                              <span className="text-xs font-medium">Pest Report</span>
                            </Button>
                            <Button 
                              onClick={() => setActiveTab("monthly-reports")}
                              className="h-16 bg-gradient-to-r from-orange-600/20 to-orange-700/30 border border-orange-500/30 hover:from-orange-600/30 hover:to-orange-700/40 text-white rounded-xl flex-col space-y-1 group/btn"
                            >
                              <Calendar className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-200" />
                              <span className="text-xs font-medium">Reports</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* System Status Bar - Mobile Responsive */}
                <div className="relative w-full max-w-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-700/20 to-slate-600/20 rounded-2xl blur-xl"></div>
                  <Card className="relative bg-gradient-to-r from-slate-900/95 to-slate-800/95 border border-slate-700/50 backdrop-blur-xl rounded-2xl w-full max-w-full overflow-hidden">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        {/* Left side - Status and Uptime */}
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6 min-w-0 flex-1">
                          <div className="flex items-center justify-center sm:justify-start space-x-3">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                            <span className="text-white font-medium text-sm lg:text-base text-center sm:text-left">System Status: Operational</span>
                          </div>
                          <div className="text-slate-400 text-xs lg:text-sm text-center sm:text-left">
                            Uptime: 99.9% | Last backup: 2 hours ago
                          </div>
                        </div>
                        
                        {/* Right side - Server Load */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-center lg:justify-end space-y-2 sm:space-y-0 sm:space-x-4 flex-shrink-0">
                          <div className="text-xs lg:text-sm text-slate-400 text-center sm:text-right">
                            Server Load: <span className="text-green-400 font-medium">Low</span>
                          </div>
                          <div className="w-20 lg:w-24 h-2 bg-slate-700 rounded-full overflow-hidden mx-auto sm:mx-0">
                            <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full w-1/4"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Branches Section */}
            {activeTab === "branches" && branchesUnlocked && (
              <div className="space-y-6 w-full overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl lg:text-2xl font-bold text-white text-center">Branch Management</h2>
                    <p className="text-slate-400 text-sm lg:text-base text-center">
                      Manage all branch locations ({branchPagination?.totalCount || 0} total)
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowBranchDialog(true)}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg w-full sm:w-auto"
                    style={{ marginLeft: '8px', marginBottom: '8px' }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Branch
                  </Button>
                </div>

                {/* Search and Pagination Controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Input
                      type="text"
                      placeholder="Search branches by name, email, address..."
                      value={branchSearchTerm}
                      onChange={(e) => {
                        setBranchSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to page 1 when searching
                      }}
                      className="bg-slate-800 border-slate-600 text-white pl-10"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-form-type="other"
                      data-lpignore="true"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Users className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                  
                  {branchPagination && branchPagination.totalPages > 1 && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={!branchPagination.hasPrev}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <span className="text-slate-300 text-sm px-3">
                        Page {branchPagination.currentPage} of {branchPagination.totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(branchPagination.totalPages, currentPage + 1))}
                        disabled={!branchPagination.hasNext}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Performance indicator for large datasets */}
                {branchPagination?.totalCount > 1000 && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-blue-400" />
                      <span className="text-blue-300 text-sm">
                        High-performance mode: Managing {branchPagination.totalCount} branches with optimized pagination
                      </span>
                    </div>
                  </div>
                )}

                {/* Search and Filter */}
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Search branches..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder-slate-400"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-form-type="other"
                      data-lpignore="true"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700/50 text-white">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="all" className="text-white hover:bg-slate-700 focus:bg-slate-700">All Status</SelectItem>
                      <SelectItem value="active" className="text-white hover:bg-slate-700 focus:bg-slate-700">Active</SelectItem>
                      <SelectItem value="inactive" className="text-white hover:bg-slate-700 focus:bg-slate-700">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Branch List */}
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {branchesLoading ? (
                        <div className="text-center py-8">
                          <div className="text-slate-400">Loading branches...</div>
                        </div>
                      ) : branches.length === 0 ? (
                        <div className="text-center py-12">
                          <Building2 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-white mb-2">No branches found</h3>
                          <p className="text-slate-400 mb-6">Get started by adding your first branch location</p>
                          <Button 
                            onClick={() => setShowBranchDialog(true)}
                            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Branch
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
                          {branches
                            .filter((branch: Branch) => {
                              const matchesSearch = searchTerm === "" || 
                                                  branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                  branch.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                  branch.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                  branch.username?.toLowerCase().includes(searchTerm.toLowerCase());
                              const matchesStatus = filterStatus === "all" || branch.status === filterStatus;
                              return matchesSearch && matchesStatus;
                            })
                            .map((branch: Branch) => (
                            <div key={branch.id} className="group relative perspective-1000 w-full max-w-full">
                              {/* 3D Background Shadow */}
                              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-2xl transform translate-x-2 translate-y-2 opacity-60 group-hover:opacity-80 transition-all duration-300"></div>
                              
                              {/* Main Card with 3D Effect */}
                              <div className="relative transform transition-all duration-500 group-hover:scale-[1.02] group-hover:-translate-y-1 group-hover:rotate-x-2 group-hover:rotate-y-1">
                                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <Card className="relative bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-slate-900/95 border border-slate-700/60 backdrop-blur-xl rounded-2xl shadow-2xl transform-gpu group-hover:border-slate-600/70 transition-all duration-500 overflow-hidden w-full max-w-full">
                                  {/* Top Gradient Accent */}
                                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"></div>
                                  
                                  <CardContent className="p-4 lg:p-6 relative z-10">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 space-y-4 sm:space-y-0">
                                      <div className="flex items-center space-x-3 lg:space-x-4 min-w-0 flex-1">
                                        <div className="relative flex-shrink-0">
                                          <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl blur-sm opacity-50"></div>
                                          <div className="relative w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shadow-xl transform group-hover:rotate-6 transition-transform duration-300 overflow-hidden">
                                            <img 
                                              src={`/api/branches/${branch.id}/logo?v=${new Date(branch.updatedAt || branch.createdAt).getTime()}`} 
                                              alt={`${branch.name} logo`}
                                              className="w-full h-full object-cover rounded-xl"
                                              onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const parent = target.parentElement;
                                                if (parent) {
                                                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="text-white text-xs lg:text-sm font-bold">${branch.name.substring(0, 2).toUpperCase()}</span></div>`;
                                                }
                                              }}
                                            />
                                          </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <h3 className="font-bold text-white text-lg lg:text-xl mb-1 truncate">{branch.name}</h3>
                                          <p className="text-xs lg:text-sm text-slate-400 truncate">{branch.email}</p>
                                        </div>
                                      </div>
                                      <Badge 
                                        variant={branch.status === "active" ? "default" : "secondary"}
                                        className={`px-3 py-1 font-medium text-xs ${branch.status === "active" 
                                          ? "bg-green-500/20 text-green-300 border-green-500/40 shadow-green-500/20" 
                                          : "bg-red-500/20 text-red-300 border-red-500/40 shadow-red-500/20"} shadow-lg`}
                                      >
                                        {branch.status}
                                      </Badge>
                                    </div>
                                    
                                    <div className="space-y-3 mb-6 text-sm">
                                      <div className="flex items-center text-slate-300 bg-slate-800/40 p-2 lg:p-3 rounded-lg overflow-hidden">
                                        <MapPin className="h-3 w-3 lg:h-4 lg:w-4 mr-2 lg:mr-3 text-slate-400 flex-shrink-0" />
                                        <span className="truncate text-xs lg:text-sm">{branch.address}, {branch.postCode}</span>
                                      </div>
                                      <div className="flex items-center text-slate-300 bg-slate-800/40 p-2 lg:p-3 rounded-lg overflow-hidden">
                                        <Phone className="h-3 w-3 lg:h-4 lg:w-4 mr-2 lg:mr-3 text-slate-400 flex-shrink-0" />
                                        <span className="truncate text-xs lg:text-sm">Contact: {branch.contactNumber}</span>
                                      </div>
                                      <div className="flex items-center text-slate-300 bg-slate-800/40 p-2 lg:p-3 rounded-lg overflow-hidden">
                                        <FileText className="h-3 w-3 lg:h-4 lg:w-4 mr-2 lg:mr-3 text-slate-400 flex-shrink-0" />
                                        <span className="truncate text-xs lg:text-sm">Contract: {branch.contractNumber}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-slate-300 bg-slate-800/40 p-2 lg:p-3 rounded-lg">
                                        <div className="flex items-center min-w-0 flex-1">
                                          <Calendar className="h-3 w-3 lg:h-4 lg:w-4 mr-2 lg:mr-3 text-slate-400 flex-shrink-0" />
                                          <span className="truncate text-xs lg:text-sm">Visit: {branch.visitFrequency}</span>
                                        </div>
                                        <div className="flex items-center font-semibold text-green-400 ml-2">
                                          <span className="text-xs lg:text-sm">£{branch.paymentAmount}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Buttons - Centered Mobile Layout */}
                                    <div className="border-t border-slate-700/50 pt-4">
                                      {/* Action Buttons - Responsive Grid */}
                                      <div className="flex items-center justify-center space-x-2 mb-3">
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          onClick={() => handleEditBranch(branch)} 
                                          className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 flex items-center justify-center text-xs lg:text-sm py-2 px-3"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          onClick={() => handleDeleteBranch(branch)} 
                                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 flex items-center justify-center text-xs lg:text-sm py-2 px-3"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      

                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Photos Section - Mobile Responsive */}
            {activeTab === "photos" && (
              <div className="space-y-6 w-full max-w-full overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 w-full max-w-full">
                  <div className="flex items-center space-x-3 min-w-0 flex-1 lg:ml-16">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 lg:p-3 rounded-lg flex-shrink-0">
                      <ImageIcon className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl lg:text-2xl font-bold text-white text-center lg:text-left">Photos</h2>
                      <h3 className="text-lg lg:text-xl font-semibold text-purple-400 text-center lg:text-left">Management</h3>
                    </div>
                  </div>
                  <div className="flex justify-center lg:justify-end mt-2 lg:mt-0 lg:ml-6">
                    <Button 
                      onClick={() => setShowPhotoDialog(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 lg:px-6 py-2 text-sm lg:text-base"
                    >
                      <Upload className="mr-2 h-3 w-3 lg:h-4 lg:w-4" />
                      Upload Photo
                    </Button>
                  </div>
                </div>

                <Card className="bg-slate-800/50 backdrop-blur border-slate-700 w-full max-w-full overflow-hidden">
                  <CardContent className="p-4 lg:p-6">
                    {photosLoading ? (
                      <div className="text-center py-8">
                        <div className="text-slate-400">Loading photos...</div>
                      </div>
                    ) : photos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 w-full max-w-full">
                        {photos.map((photo) => (
                          <div key={photo.id} className="group relative w-full max-w-full">
                            {/* 3D Card Container - Mobile Responsive */}
                            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-1 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-purple-500/20 border border-slate-700/50 w-full max-w-full overflow-hidden">
                              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-3 lg:p-4 relative overflow-hidden w-full max-w-full">
                                {/* Magical Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                
                                {/* Badge Container - Mobile Responsive */}
                                <div className="relative z-10 mb-3 lg:mb-4">
                                  <div className="flex items-center justify-between mb-2 lg:mb-3">
                                    <div className="flex items-center space-x-1 lg:space-x-2 min-w-0 flex-1">
                                      <Badge className={`${
                                        photo.type === 'before' ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gradient-to-r from-green-500 to-green-600'
                                      } text-white text-xs px-2 lg:px-3 py-1 rounded-full shadow-lg flex-shrink-0`}>
                                        {photo.type === 'before' ? 'Before' : 'After'}
                                      </Badge>
                                      {photo.branchId && (
                                        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-2 lg:px-3 py-1 rounded-full shadow-lg flex items-center space-x-1 flex-shrink-0">
                                          <CheckCircle className="h-2 w-2 lg:h-3 lg:w-3" />
                                          <span className="hidden sm:inline">Sent</span>
                                          <span className="sm:hidden">S</span>
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {/* Delete Button - Top Right - Smaller on Mobile */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeletePhoto(photo)}
                                      className="w-6 h-6 lg:w-8 lg:h-8 p-0 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-full border border-red-500/30 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 flex-shrink-0"
                                      title="Delete Photo"
                                    >
                                      <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Photo Container with 3D Effects */}
                                <div className="relative z-10 mb-4">
                                  <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-slate-600/50 flex items-center justify-center overflow-hidden shadow-inner relative group/image">
                                    {/* Shimmer Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/image:translate-x-full transition-transform duration-1000"></div>
                                    
                                    {photo.filepath ? (
                                      <img 
                                        src={photo.filepath} 
                                        alt={photo.title}
                                        className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover/image:scale-105 cursor-pointer"
                                        onDoubleClick={() => handleImageDoubleClick(photo)}
                                        title="Double-click to edit PNG images"
                                      />
                                    ) : (
                                      <div className="flex flex-col items-center justify-center text-slate-500">
                                        <ImageIcon className="h-8 w-8 lg:h-12 lg:w-12 mb-2" />
                                        <span className="text-xs">No Preview</span>
                                      </div>
                                    )}
                                    
                                    {/* Image Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300"></div>
                                  </div>
                                </div>

                                {/* Photo Info */}
                                <div className="relative z-10 space-y-3">
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-white text-sm truncate bg-gradient-to-r from-white to-slate-300 bg-clip-text">{photo.title}</h4>
                                    {photo.description && (
                                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{photo.description}</p>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                                    <span className="bg-slate-700/50 px-2 py-1 rounded-full">{photo.category}</span>
                                    <span className="text-slate-400 font-medium">
                                      {new Date(photo.createdAt).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit', 
                                        year: 'numeric'
                                      })} at {new Date(photo.createdAt).toLocaleTimeString('en-GB', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false
                                      })}
                                    </span>
                                  </div>
                                </div>

                                {/* Action Buttons - Mobile Responsive */}
                                <div className="relative z-10 mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-slate-700/50">
                                  <div className="flex items-center justify-center space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleViewPhoto(photo)}
                                      className="flex-1 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 text-purple-300 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 shadow-lg hover:shadow-purple-500/20 backdrop-blur-sm text-xs lg:text-sm py-1.5 lg:py-2"
                                      title="View Photo"
                                    >
                                      <Eye className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleSendPhotoToBranch(photo)}
                                      className="flex-1 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 text-blue-300 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 shadow-lg hover:shadow-blue-500/20 backdrop-blur-sm text-xs lg:text-sm py-1.5 lg:py-2"
                                      title="Send to Branch"
                                    >
                                      <Send className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                                      Send
                                    </Button>
                                  </div>
                                </div>

                                {/* Floating Decorative Elements */}
                                <div className="absolute top-4 right-4 w-2 h-2 bg-purple-500/30 rounded-full animate-pulse"></div>
                                <div className="absolute bottom-4 left-4 w-1 h-1 bg-pink-500/30 rounded-full animate-pulse delay-300"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <ImageIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-400 text-lg mb-2">No photos uploaded yet</p>
                        <p className="text-slate-500 text-sm">Upload your first before/after photo to get started</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}



            

{activeTab === "monthly-reports" && (
  <div className="h-full min-h-0 w-full max-w-full overflow-y-auto overscroll-contain pr-1 pb-24 space-y-5">
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 w-full">
      <div className="flex items-center gap-3 min-w-0">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2.5 rounded-lg flex-shrink-0">
          <FileText className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl lg:text-2xl font-bold text-white">Monthly Reports</h2>
          <h3 className="text-sm lg:text-base font-semibold text-purple-400">A5 PDF Management</h3>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 md:justify-end md:ml-auto">
        <Button
          onClick={() => { setShowGenerateReportDialog(true); setGenPreviewUrl(null); }}
          className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-4 lg:px-5 py-2 text-sm"
        >
          <FileText className="mr-2 h-4 w-4" />Generate Report
        </Button>
        <Button
          onClick={() => setShowMonthlyReportDialog(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 lg:px-5 py-2 text-sm"
        >
          <Upload className="mr-2 h-4 w-4" />Upload Report
        </Button>
      </div>
    </div>

    <Card className="bg-slate-800/50 backdrop-blur border-slate-700 w-full">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Calendar className="h-4 w-4 text-purple-400 flex-shrink-0" />
            <select className="w-full sm:w-auto min-w-[150px] bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm">
              <option value="">All Months</option>
              {(() => {
                const months = [];
                const currentDate = new Date();
                for (let i = 0; i < 12; i++) {
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                  const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                  const label = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                  months.push(<option key={value} value={value}>{label}</option>);
                }
                return months;
              })()}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Filter className="h-4 w-4 text-green-400 flex-shrink-0" />
            <select
              className="w-full sm:w-auto min-w-[210px] bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="coshh-risk-assessment">COSHH/Risk Assessment</option>
              <option value="inspection-report">Inspection Report</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-white/5 backdrop-blur-sm border-white/10 w-full">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedBranchFilter} onValueChange={setSelectedBranchFilter}>
              <SelectTrigger className="w-full sm:w-[210px] bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all">
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-gray-700">
                <SelectItem value="all" className="text-white hover:bg-slate-700 focus:bg-slate-700">All Branches</SelectItem>
                {branches.map((branch: Branch) => (
                  <SelectItem key={branch.id} value={branch.id} className="text-white hover:bg-slate-700 focus:bg-slate-700">
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-full sm:w-[160px] bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all">
                <Clock className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="12" className="text-white hover:bg-slate-700 focus:bg-slate-700">Last 12 months</SelectItem>
                <SelectItem value="24" className="text-white hover:bg-slate-700 focus:bg-slate-700">Last 24 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-white/60">
            <Calendar className="w-4 h-4 mr-1" />
            {monthlyReports.filter(report => !report.isDeleted).length} reports
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-slate-800/50 backdrop-blur border-slate-700 w-full overflow-visible">
      <CardContent className="p-4 lg:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-base lg:text-lg font-semibold text-white">Reports by Branch</h3>
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={branchSearchTerm}
              onChange={(e) => setBranchSearchTerm(e.target.value)}
              placeholder="Search reports..."
              className="pl-9 bg-slate-900/70 border-slate-600 text-white"
            />
          </div>
        </div>

        {reportsLoading ? (
          <div className="text-center py-10 text-slate-400">Loading reports...</div>
        ) : monthlyReports.filter(report => !report.isDeleted).length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-14 w-14 text-slate-500 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-1">No monthly reports uploaded</h3>
            <p className="text-slate-400 text-sm">Upload your first report to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full pb-4">
            {monthlyReports
              .filter(report => !report.isDeleted)
              .filter(report => selectedBranchFilter === 'all' || report.branchId === selectedBranchFilter)
              .filter(report => !branchSearchTerm || report.title?.toLowerCase().includes(branchSearchTerm.toLowerCase()) || branches.find((b: Branch) => b.id === report.branchId)?.name?.toLowerCase().includes(branchSearchTerm.toLowerCase()))
              .map((report) => (
                <Card key={report.id} className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-purple-500/30 overflow-hidden">
                  <CardContent className="p-4 flex flex-col min-h-[270px]">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Badge className={report.branchId ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}>
                        {report.branchId ? 'Sent' : 'Uploaded'}
                      </Badge>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-red-500/20" onClick={() => deleteReportMutation.mutate(report.id)} disabled={deleteReportMutation.isPending}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 py-4 mb-3">
                      <FileText className="h-12 w-12 text-purple-400 mb-2" />
                      <div className="text-sm font-semibold text-purple-200">{report.viewSize || 'A4'} PDF</div>
                      <div className="text-xs text-slate-400 mt-1">{report.fileSize ? `${(report.fileSize / 1024 / 1024).toFixed(2)} MB` : ''}</div>
                    </div>

                    <h4 className="text-white font-semibold text-sm text-center line-clamp-2 mb-1">{report.title}</h4>
                    <div className="text-center mb-3">
                      <span className="inline-flex px-2 py-1 rounded-full bg-green-500/15 text-green-300 text-xs">
                        {report.branchId ? (branches.find((b: Branch) => b.id === report.branchId)?.name || 'Branch') : 'Not assigned'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 text-center mb-3">Uploaded: {new Date(report.createdAt).toLocaleDateString('en-GB')}</p>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => handleViewPDF({ ...report, type: 'monthly-reports' })}>
                        <Eye className="h-4 w-4 mr-1" />View
                      </Button>
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { setSelectedReport(report); setShowReportSendDialog(true); }}>
                        <Send className="h-4 w-4 mr-1" />Send
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
)}

{/* Pest Control Documents Section - Mobile Responsive */}
            {activeTab === "pest-control-docs" && (
              <div className="space-y-6 w-full max-w-full overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 w-full max-w-full">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl lg:text-2xl font-bold text-white text-center lg:text-left">Pest Control Documents</h2>
                    <p className="text-slate-400 text-sm lg:text-base text-center lg:text-left">Manage treatment plans, certificates, and inspection reports</p>
                  </div>
                  <div className="flex justify-center lg:justify-end mt-2 lg:mt-0 lg:ml-6">
                    <Button
                      onClick={() => setShowPestControlDocDialog(true)}
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg px-4 lg:px-6 py-2 text-sm lg:text-base"
                    >
                      <Plus className="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                </div>

                <Card className="bg-slate-800/50 backdrop-blur border-slate-700 w-full max-w-full overflow-hidden">
                  <CardContent className="p-4 lg:p-6">
                    {pestControlDocs.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 lg:h-16 lg:w-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-base lg:text-lg font-medium text-white mb-2">No pest control documents uploaded</h3>
                        <p className="text-slate-400 text-sm lg:text-base">Upload your first pest control document to get started</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {pestControlDocs.map((doc) => (
                          <div key={doc.id} className="group relative">
                            <div className="bg-gradient-to-br from-orange-900/20 to-red-800/30 backdrop-blur-xl rounded-2xl p-1 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-orange-500/30 border-2 border-orange-500/40 hover:border-orange-400/60">
                              <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-xl p-5 relative overflow-hidden min-h-[320px] flex flex-col">
                                {/* Magical Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                
                                {/* Header */}
                                <div className="relative z-10 mb-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <Badge className={`${
                                      doc.sentAt ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'
                                    } text-white text-xs px-3 py-1 rounded-full shadow-lg`}>
                                      {doc.sentAt ? 'Sent' : 'Draft'}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="w-8 h-8 p-0 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-full border border-red-500/30 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110"
                                      title="Delete Document"
                                      onClick={() => deletePestControlDocMutation.mutate(doc.id)}
                                      disabled={deletePestControlDocMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* PDF Icon - Centered and Larger */}
                                <div className="relative z-10 mb-4 flex-1 flex items-center justify-center">
                                  <div className="w-full aspect-[3/4] max-w-[180px] bg-gradient-to-br from-orange-600/30 to-red-700/40 rounded-xl border-2 border-orange-500/50 flex flex-col items-center justify-center overflow-hidden shadow-inner relative group/pdf">
                                    <div className="flex flex-col items-center justify-center h-full">
                                      <FileText className="h-20 w-20 text-orange-400 mb-3 group-hover/pdf:scale-110 transition-transform duration-300" />
                                      <div className="text-sm text-orange-300 font-semibold">{doc.viewSize || 'A4'} PDF</div>
                                      <div className="text-xs text-slate-400 mt-2 bg-slate-800/50 px-2 py-1 rounded-full">
                                        {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(1)} MB` : 'N/A'}
                                      </div>
                                    </div>
                                    
                                    {/* PDF Overlay with better visual effect */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 via-transparent to-orange-800/10 opacity-0 group-hover/pdf:opacity-100 transition-opacity duration-300"></div>
                                    
                                    {/* Shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/pdf:translate-x-full transition-transform duration-1000"></div>
                                  </div>
                                </div>

                                {/* Document Info - Better Positioned */}
                                <div className="relative z-10 space-y-3 mt-auto">
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-white text-sm line-clamp-2 leading-relaxed text-center">{doc.title}</h4>
                                    <p className="text-xs text-center">
                                      {doc.sentAt ? (
                                        <span className="text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
                                          {branches.find((b: Branch) => b.id === doc.branchId)?.name || 'Unknown Branch'}
                                        </span>
                                      ) : (
                                        <span className="text-orange-400 bg-orange-500/20 px-2 py-1 rounded-full">Not sent</span>
                                      )}
                                    </p>
                                    {doc.description && (
                                      <p className="text-xs text-slate-400 text-center line-clamp-2">{doc.description}</p>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                                    <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full text-xs font-medium">
                                      {doc.docType?.replace('-', ' ') || 'General'}
                                    </span>
                                    <span className="text-slate-400 font-medium">
                                      {new Date(doc.createdAt).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                      })} at {new Date(doc.createdAt).toLocaleTimeString('en-GB', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false
                                      })}
                                    </span>
                                  </div>

                                  {/* Issue/Expiry Dates */}
                                  {(doc.issueDate || doc.expiryDate) && (
                                    <div className="space-y-1 pt-2">
                                      {doc.issueDate && (
                                        <div className="flex items-center justify-center text-xs text-blue-300">
                                          <Calendar className="h-3 w-3 mr-1" />
                                          Issue: {new Date(doc.issueDate).toLocaleDateString('en-GB')}
                                        </div>
                                      )}
                                      {doc.expiryDate && (
                                        <div className="flex items-center justify-center text-xs text-orange-300">
                                          <Clock className="h-3 w-3 mr-1" />
                                          Expires: {new Date(doc.expiryDate).toLocaleDateString('en-GB')}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Action Buttons - Enhanced */}
                                <div className="relative z-10 mt-4 pt-4 border-t border-orange-500/20">
                                  <div className="grid grid-cols-2 gap-3">
                                    <Button
                                      size="sm"
                                      className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 text-purple-200 border border-purple-500/40 hover:border-purple-400/60 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 backdrop-blur-sm font-medium"
                                      onClick={() => {
                                        handleViewPDF({
                                          ...doc,
                                          type: 'pest-control-docs'
                                        });
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-gradient-to-r from-green-600/30 to-emerald-600/30 hover:from-green-600/40 hover:to-emerald-600/40 text-green-200 border border-green-500/40 hover:border-green-400/60 transition-all duration-300 shadow-lg hover:shadow-green-500/30 backdrop-blur-sm font-medium"
                                      onClick={() => {
                                        setSelectedPestControlDoc(doc);
                                        setShowPestControlDocSendDialog(true);
                                      }}
                                    >
                                      <Send className="h-4 w-4 mr-1" />
                                      Send
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Useful Links Section */}
            {activeTab === "useful-links" && usefulLinksUnlocked && (
              <div className="space-y-6">
                <UsefulLinksSection />
              </div>
            )}
            
            {/* Payment Tracker Section */}
            {activeTab === "payment-tracker" && paymentTrackerUnlocked && (
              <div className="space-y-6">
                <PaymentTrackerSection />
              </div>
            )}


            {activeTab === "pest-control" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Pest Control Documents</h2>
                    <p className="text-slate-400">Manage treatment plans, certificates, and inspection reports</p>
                  </div>
                  <Button
                    onClick={() => setShowPestControlDocDialog(true)}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>

                <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
                  <CardContent className="p-6">
                    {pestControlDocs.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No pest control documents uploaded</h3>
                        <p className="text-slate-400">Upload your first pest control document to get started</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pestControlDocs.map((doc) => (
                          <div key={doc.id} className="group relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                            <Card className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300 overflow-hidden">
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <FileText className="h-6 w-6 text-white" />
                                  </div>
                                  <div className="flex space-x-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 hover:bg-blue-500/20 rounded-lg"
                                      onClick={() => {
                                        // Open PDF directly in new tab to avoid Chrome blocking
                                        window.open(`/api/pest-control-docs/${doc.id}/view`, '_blank');
                                      }}
                                    >
                                      <Eye className="h-4 w-4 text-blue-400" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 hover:bg-green-500/20 rounded-lg"
                                      onClick={() => {
                                        setSelectedPestControlDoc(doc);
                                        setShowPestControlDocSendDialog(true);
                                      }}
                                    >
                                      <Send className="h-4 w-4 text-green-400" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 hover:bg-red-500/20 rounded-lg"
                                      onClick={() => deletePestControlDocMutation.mutate(doc.id)}
                                      disabled={deletePestControlDocMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-400" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <h3 className="font-semibold text-white text-lg leading-tight">{doc.title}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                                        {doc.docType === 'treatment-plan' ? 'Treatment Plan' :
                                         doc.docType === 'inspection-certificate' ? 'Inspection Certificate' :
                                         doc.docType === 'compliance-report' ? 'Compliance Report' :
                                         doc.docType === 'safety-assessment' ? 'Safety Assessment' :
                                         doc.docType}
                                      </Badge>
                                      <Badge className="bg-slate-600/20 text-slate-300 border-slate-500/30 text-xs">
                                        {doc.viewSize}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div className="space-y-2 text-sm">
                                    {doc.issueDate && (
                                      <div className="flex justify-between text-slate-400">
                                        <span>Issue Date:</span>
                                        <span className="text-slate-300">
                                          {new Date(doc.issueDate).toLocaleDateString('en-GB')}
                                        </span>
                                      </div>
                                    )}
                                    {doc.expiryDate && (
                                      <div className="flex justify-between text-slate-400">
                                        <span>Expiry Date:</span>
                                        <span className={`
                                          ${new Date(doc.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
                                            ? 'text-red-400' : 'text-slate-300'}
                                        `}>
                                          {new Date(doc.expiryDate).toLocaleDateString('en-GB')}
                                        </span>
                                      </div>
                                    )}
                                    {(() => {
                                      if (doc.branchId) {
                                        const branch = branches.find((b: Branch) => b.id === doc.branchId);
                                        return (
                                          <div className="flex items-center gap-2 pt-2">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            <span className="text-green-400 text-xs font-medium">
                                              Sent to {branch?.name || 'Branch'}
                                            </span>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                  
                                  <div className="pt-2 border-t border-slate-700/50">
                                    <p className="text-xs text-slate-400">
                                      Uploaded: {new Date(doc.createdAt).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                      })} at {new Date(doc.createdAt).toLocaleTimeString('en-GB', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* IoT Cloud Settings Section */}
            {activeTab === "iot-cloud" && (
              <div className="space-y-6 w-full max-w-full">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Link24 Cloud</h2>
                    <p className="text-slate-400 text-sm">Manage Smart Mouser pest control devices</p>
                  </div>
                </div>

                {/* Connection Status Card */}
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-cyan-400" /> Connection Status
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-slate-400 text-xs mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${iotStatus?.configured ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className={`text-sm font-medium ${iotStatus?.configured ? 'text-green-400' : 'text-red-400'}`}>
                          {iotStatus?.configured ? 'Configured' : 'Not Configured'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-slate-400 text-xs mb-1">API Key</p>
                      <p className="text-sm text-white font-mono">{iotStatus?.accessId || '••••••••••••'}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-slate-400 text-xs mb-1">Data Center</p>
                      <p className="text-sm text-white">Central Europe</p>
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      setIotTestLoading(true);
                      setIotTestResult(null);
                      try {
                        const r = await fetch("/api/tuya/test-connection");
                        const data = await r.json();
                        setIotTestResult(data);
                      } catch { setIotTestResult({ success: false, message: "Network error" }); }
                      setIotTestLoading(false);
                    }}
                    disabled={iotTestLoading}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    size="sm"
                  >
                    {iotTestLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                    Test Connection
                  </Button>
                  {iotTestResult && (
                    <div className={`p-3 rounded-lg text-sm ${iotTestResult.success ? 'bg-green-900/30 text-green-300 border border-green-700/50' : 'bg-red-900/30 text-red-300 border border-red-700/50'}`}>
                      {iotTestResult.success ? <CheckCircle className="inline h-4 w-4 mr-1" /> : <AlertCircle className="inline h-4 w-4 mr-1" />}
                      {iotTestResult.message}
                    </div>
                  )}
                </div>

                {/* Assign Device to Branch */}
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-400" /> Assign Device to Branch
                  </h3>
                  <div className="flex items-center gap-4 mb-2">
                    <img src="https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087853714-8a17cb6e-806a-433c-a5b2-5e616bbb45b2-smart-mouser-9IkSDc7KHY9vGd9hY9Z97CfS5sDivs.png" alt="Smart Mouser" className="w-20 h-20 object-contain rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 p-1" />
                    <div>
                      <p className="text-white font-medium">Smart Mouser Device</p>
                      <p className="text-slate-400 text-sm">Electronic mouse trap with cloud monitoring</p>
                      <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30 mt-1">IoT Pest Control</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 text-xs mb-1 block">Device ID (from cloud)</label>
                      <Input
                        value={iotAssignDeviceId}
                        onChange={(e) => setIotAssignDeviceId(e.target.value)}
                        placeholder="e.g. bfd22febfe6441f5c726..."
                        className="bg-slate-900 border-slate-600 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs mb-1 block">Device Name</label>
                      <Input
                        value={iotAssignDeviceName}
                        onChange={(e) => setIotAssignDeviceName(e.target.value)}
                        placeholder="e.g. Smart Mouser Unit 1"
                        className="bg-slate-900 border-slate-600 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs mb-1 block">Branch</label>
                      <select
                        value={iotAssignBranchId}
                        onChange={(e) => setIotAssignBranchId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded-md px-3 py-2"
                      >
                        <option value="">Select a branch...</option>
                        {(branchesResponse?.branches || []).map((b: any) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs mb-1 block">Notes (optional)</label>
                      <Input
                        value={iotAssignNotes}
                        onChange={(e) => setIotAssignNotes(e.target.value)}
                        placeholder="Location, notes..."
                        className="bg-slate-900 border-slate-600 text-white text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      if (!iotAssignDeviceId || !iotAssignDeviceName || !iotAssignBranchId) {
                        toast({ title: "Missing fields", description: "Please fill in Device ID, Name, and Branch", variant: "destructive" });
                        return;
                      }
                      try {
                        const r = await fetch("/api/iot/devices", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ deviceId: iotAssignDeviceId, deviceName: iotAssignDeviceName, branchId: iotAssignBranchId, notes: iotAssignNotes }),
                        });
                        if (!r.ok) throw new Error((await r.json()).message);
                        toast({ title: "Device Assigned", description: `${iotAssignDeviceName} assigned to branch successfully` });
                        setIotAssignDeviceId(""); setIotAssignDeviceName(""); setIotAssignBranchId(""); setIotAssignNotes("");
                        refetchIotDevices();
                      } catch (err: any) {
                        toast({ title: "Error", description: err.message, variant: "destructive" });
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Assign Device
                  </Button>
                </div>

                {/* Assigned Devices List */}
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-green-400" /> Assigned Devices ({iotDevices.length})
                    </h3>
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={() => refetchIotDevices()}>
                      <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
                    </Button>
                  </div>
                  {iotDevices.length === 0 ? (
                    <div className="text-center py-8">
                      <img src="https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087853714-8a17cb6e-806a-433c-a5b2-5e616bbb45b2-smart-mouser-9IkSDc7KHY9vGd9hY9Z97CfS5sDivs.png" alt="Smart Mouser" className="w-24 h-24 object-contain mx-auto mb-3 opacity-40" />
                      <p className="text-slate-400">No devices assigned yet</p>
                      <p className="text-slate-500 text-sm">Assign a device to a branch above</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {iotDevices.map((dev: any) => (
                        <div key={dev.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 flex gap-4 items-start">
                          <img src="https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087853714-8a17cb6e-806a-433c-a5b2-5e616bbb45b2-smart-mouser-9IkSDc7KHY9vGd9hY9Z97CfS5sDivs.png" alt="Smart Mouser" className="w-16 h-16 object-contain rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/30 p-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-white font-medium text-sm truncate">{dev.deviceName}</p>
                              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                <div className={`w-2 h-2 rounded-full ${dev.isOnline ? 'bg-green-400' : 'bg-slate-500'}`} />
                                <span className={`text-xs ${dev.isOnline ? 'text-green-400' : 'text-slate-400'}`}>
                                  {dev.isOnline ? 'Online' : 'Offline'}
                                </span>
                              </div>
                            </div>
                            <p className="text-slate-400 text-xs font-mono mb-1 truncate">{dev.deviceId}</p>
                            {dev.notes && <p className="text-slate-500 text-xs mb-2 truncate">{dev.notes}</p>}
                            {dev.lastCheckedAt && (
                              <p className="text-slate-500 text-xs mb-2">Checked: {new Date(dev.lastCheckedAt).toLocaleString()}</p>
                            )}
                                    {dev.alarmActive && (
                                <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 rounded-lg px-2 py-1 mb-1">
                                  <span className="text-red-400 text-xs font-bold animate-pulse">🐭 MOUSE/RAT DETECTED</span>
                                </div>
                              )}
                              {dev.lastAlarmAt && (
                                <p className="text-orange-400 text-xs mb-1">Last alarm: {new Date(dev.lastAlarmAt).toLocaleString()}</p>
                              )}
                              <div className="flex gap-2 mt-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs h-7 px-2"
                                onClick={async () => {
                                  try {
                                    await fetch(`/api/iot/devices/${dev.id}/refresh`, { method: "POST" });
                                    refetchIotDevices();
                                    toast({ title: "Status refreshed", description: dev.deviceName });
                                  } catch { toast({ title: "Refresh failed", variant: "destructive" }); }
                                }}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                              </Button>
                              {dev.alarmActive && (
                                <Button
                                  size="sm"
                                  className="bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 border border-orange-700/30 text-xs h-7 px-2"
                                  onClick={async () => {
                                    await fetch(`/api/iot/devices/${dev.id}/clear-alarm`, { method: "POST" });
                                    refetchIotDevices();
                                    toast({ title: "Alarm cleared", description: dev.deviceName });
                                  }}
                                >
                                  Clear Alarm
                                </Button>
                              )}
                              <Button
                                size="sm"
                                className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-700/30 text-xs h-7 px-2"
                                onClick={async () => {
                                  if (!confirm(`Remove ${dev.deviceName}?`)) return;
                                  await fetch(`/api/iot/devices/${dev.id}`, { method: "DELETE" });
                                  refetchIotDevices();
                                  toast({ title: "Device removed" });
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-1" /> Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Site Settings Section - Mobile Responsive */}
            {activeTab === "site-settings" && siteSettingsUnlocked && (
              <div className="space-y-6 w-full max-w-full overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 w-full max-w-full">
                  <div className="min-w-0">
                    <h2 className="text-xl lg:text-2xl font-bold text-white text-center lg:text-left">Site Settings</h2>
                    <p className="text-slate-400 text-sm lg:text-base text-center lg:text-left">Customize and control all aspects of your application</p>
                  </div>
                </div>

                {/* Branch Selection & Navigation */}
                <div className="space-y-4">
                  {/* Branch Selector for Branch-specific Settings - Mobile Responsive */}
                  {settingsTab === "branch-dashboard" && (
                    <div className="p-3 lg:p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 w-full max-w-full overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                        <h3 className="text-white font-semibold text-sm lg:text-base text-center sm:text-left">Select Branch to Customize</h3>
                        <Badge className="bg-blue-600 text-white text-xs px-2 py-1 self-center sm:self-auto">Per-Branch Settings</Badge>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-300 text-sm">Choose Branch</Label>
                          <Select value={selectedBranchForSettings} onValueChange={setSelectedBranchForSettings}>
                            <SelectTrigger className="bg-slate-900 border-slate-600 text-white mt-2 w-full">
                              <SelectValue placeholder="Select a branch to customize..." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-600 text-white">
                              {branches.map((branch: Branch) => (
                                <SelectItem key={branch.id} value={branch.id} className="text-white hover:bg-slate-700 focus:bg-slate-700">
                                  <span className="truncate text-white">{branch.name} - {branch.address}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <div className="text-xs lg:text-sm text-slate-400">
                            <p>Changes will only apply to the selected branch.</p>
                            <p>Other branches keep their current settings.</p>
                          </div>
                        </div>
                      </div>
                      {!selectedBranchForSettings && (
                        <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                          <p className="text-orange-300 text-xs lg:text-sm">Please select a branch to customize its settings.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Navigation Tabs */}
                  <div className="p-3 sm:p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {["branch-dashboard", "admin-dashboard", "browser-tab", "code-protection"].map((tab) => (
                        <Button
                          key={tab}
                          size="sm"
                          variant={settingsTab === tab ? "default" : "outline"}
                          onClick={() => setSettingsTab(tab)}
                          className={`
                            ${settingsTab === tab 
                              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                              : "border-slate-600 text-slate-300 hover:bg-slate-700"
                            }
                            w-full text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center
                            h-auto py-2 px-2 min-h-[44px]
                          `}
                        >
                          <span className="truncate">
                            {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                          {tab === "branch-dashboard" && (
                            <span className="text-xs opacity-75 mt-1 sm:mt-0 sm:ml-1 whitespace-nowrap">
                              (Per Branch)
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Branch Dashboard Settings */}
                {settingsTab === "branch-dashboard" && (
                  <div className="space-y-6">
                    {selectedBranchForSettings ? (
                      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <span>Branch Dashboard Controls</span>
                                <p className="text-sm text-slate-400 font-normal">
                                  Customizing: {branches.find((b: Branch) => b.id === selectedBranchForSettings)?.name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-orange-500 text-orange-300 hover:bg-orange-500/10"
                                onClick={() => {
                                  setCurrentRating(5);
                                  setIsEditingRating(false);
                                  setSettingsLogoFile(null);
                                  setSettingsLogoPreview(null);
                                  setVisitorCount(1000);
                                  setRatingStyle("stars");
                                  setCardSpacing("normal");
                                  setCardBorderRadius("rounded");
                                  setPrimaryColor("#3b82f6");
                                  setSecondaryColor("#8b5cf6");
                                  setSuccessColor("#22c55e");
                                  setWarningColor("#ef4444");
                                  toast({
                                    title: "Settings Reset",
                                    description: `Dashboard settings reset to default for ${branches.find((b: Branch) => b.id === selectedBranchForSettings)?.name}`,
                                  });
                                }}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reset to Default
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Save for This Branch
                              </Button>
                            </div>
                          </CardTitle>
                          <CardDescription className="text-slate-400">
                            Customize this specific branch's dashboard appearance and content
                          </CardDescription>
                        </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Header Controls */}
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Header & Branding</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-slate-300">Branch Dashboard Title</Label>
                              <Input
                                placeholder="Branch Dashboard"
                                defaultValue="Branch Dashboard"
                                className="bg-slate-900 border-slate-600 text-white mt-2"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-300">Branch Name Display</Label>
                              <Input
                                placeholder="Cake Box"
                                defaultValue="Cake Box"
                                className="bg-slate-900 border-slate-600 text-white mt-2"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-300">Welcome Message</Label>
                              <Input
                                placeholder="Welcome, Cake Box"
                                defaultValue="Welcome, Cake Box"
                                className="bg-slate-900 border-slate-600 text-white mt-2"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-300">Logo/Icon Upload</Label>
                              <div className="flex items-center space-x-3 mt-2">
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                                  {settingsLogoPreview ? (
                                    <img 
                                      src={settingsLogoPreview} 
                                      alt="Logo preview" 
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <span className="text-xs font-bold text-blue-600">
                                      {branches.find((b: Branch) => b.id === selectedBranchForSettings)?.name?.substring(0, 2) || "CB"}
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setSettingsLogoFile(file);
                                        const reader = new FileReader();
                                        reader.onload = (e) => {
                                          setSettingsLogoPreview(e.target?.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                        toast({
                                          title: "Logo Selected",
                                          description: `${file.name} ready to upload for ${branches.find((b: Branch) => b.id === selectedBranchForSettings)?.name}`,
                                        });
                                      }
                                    }}
                                    className="hidden"
                                    id="logo-upload"
                                  />
                                  <Button 
                                    size="sm" 
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Change Logo
                                  </Button>
                                  {settingsLogoFile && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="border-green-500 text-green-300 hover:bg-green-500/10"
                                      onClick={() => {
                                        // Here you would upload to server
                                        toast({
                                          title: "Logo Uploaded",
                                          description: `Logo successfully uploaded for ${branches.find((b: Branch) => b.id === selectedBranchForSettings)?.name}`,
                                        });
                                        setSettingsLogoFile(null);
                                      }}
                                    >
                                      Upload Logo
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <p className="text-slate-400 text-xs mt-2">
                                Recommended: Square image, max 2MB (JPG, PNG, SVG)
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Branch Star Rating Management - Separate Container */}
                        <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-600/30">
                          <CardHeader>
                            <CardTitle className="text-yellow-300 flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-lg">⭐</span>
                              </div>
                              <span>Official Food Hygiene Rating Management</span>
                            </CardTitle>
                            <CardDescription className="text-yellow-200/70">
                              Set official UK Food Hygiene Ratings (0-5) for each branch. Matches gov.uk council standards.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {/* Branch Selection for Star Rating */}
                            <div className="space-y-3">
                              <Label className="text-yellow-200 font-medium">Select Branch for Food Hygiene Rating</Label>
                              <Select 
                                value={selectedBranchForSettings} 
                                onValueChange={(value) => {
                                  setSelectedBranchForSettings(value);
                                  // Load current rating for selected branch
                                  const branch = branches.find((b: Branch) => b.id === value);
                                  setCurrentRating(branch?.starRating || 5);
                                }}
                              >
                                <SelectTrigger className="bg-slate-900 border-yellow-600/50 text-white">
                                  <SelectValue placeholder="Choose branch for hygiene rating..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-yellow-600/50 text-white">
                                  {branches.map((branch: Branch) => (
                                    <SelectItem key={branch.id} value={branch.id} className="text-white hover:bg-yellow-700/20">
                                      <div className="flex items-center justify-between w-full">
                                        <span>{branch.name}</span>
                                        <div className="flex items-center gap-2">
                                          <div className={`flex ${
                                            (branch.starRating || 5) >= 4 ? 'text-green-400' : 
                                            (branch.starRating || 5) === 3 ? 'text-yellow-500' :
                                            (branch.starRating || 5) === 0 ? 'text-red-400' :
                                            'text-amber-500'
                                          }`}>
                                            {branch.starRating === 0 ? (
                                              <span className="text-sm font-bold">0★</span>
                                            ) : (
                                              [...Array(branch.starRating || 5)].map((_, i) => (
                                                <span key={i} className="text-sm">★</span>
                                              ))
                                            )}
                                          </div>
                                          <Check className="h-3 w-3 text-green-400" />
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Star Rating Controls */}
                            {selectedBranchForSettings && (
                              <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-yellow-600/20">
                                <div className="flex items-center justify-between">
                                  <Label className="text-yellow-200">
                                    Rating for: {branches.find((b: Branch) => b.id === selectedBranchForSettings)?.name}
                                  </Label>
                                  <Badge variant="outline" className="border-yellow-500 text-yellow-300">
                                    Current: {branches.find((b: Branch) => b.id === selectedBranchForSettings)?.starRating || 5} stars
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-2">
                                    {/* 0 Stars Option */}
                                    <button 
                                      onClick={() => setCurrentRating(0)}
                                      className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                                        currentRating === 0 
                                          ? "bg-red-600 text-white transform scale-105" 
                                          : "bg-slate-700 text-slate-300 hover:bg-red-600/50"
                                      }`}
                                    >
                                      0 - Urgent
                                    </button>
                                    
                                    {/* 1-5 Stars */}
                                    <div className="flex space-x-1">
                                      {[1,2,3,4,5].map((star) => (
                                        <button 
                                          key={star} 
                                          onClick={() => setCurrentRating(star)}
                                          className={`text-2xl transition-all duration-200 ${
                                            star <= currentRating && currentRating > 0
                                              ? (currentRating >= 4 ? "text-green-400 transform scale-110" : 
                                                 currentRating === 3 ? "text-yellow-500 transform scale-110" :
                                                 "text-amber-500 transform scale-110")
                                              : "text-slate-600 hover:text-amber-400"
                                          } hover:scale-125 cursor-pointer`}
                                        >
                                          ★
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div className="flex space-x-2">
                                    <Button 
                                      size="sm" 
                                      className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(`/api/branches/${selectedBranchForSettings}/settings`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ starRating: currentRating })
                                          });
                                          
                                          if (response.ok) {
                                            const data = await response.json();
                                            
                                            toast({
                                              title: "Food Hygiene Rating Sent Successfully",
                                              description: `${branches.find((b: Branch) => b.id === selectedBranchForSettings)?.name} received ${currentRating}/5 rating (${
                                                currentRating === 5 ? 'Very Good' :
                                                currentRating === 4 ? 'Good' :
                                                currentRating === 3 ? 'Generally Satisfactory' :
                                                currentRating === 2 ? 'Improvement Necessary' :
                                                currentRating === 1 ? 'Major Improvement Necessary' :
                                                'Urgent Improvement Necessary'
                                              })`,
                                            });
                                            
                                            // Reload page to update UI
                                            setTimeout(() => {
                                              window.location.reload();
                                            }, 1000);
                                          } else {
                                            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                                            throw new Error(errorData.message || 'Failed to save rating');
                                          }
                                        } catch (error) {
                                          console.error('Error saving rating:', error);
                                          toast({
                                            title: "Error",
                                            description: error instanceof Error ? error.message : "Failed to save star rating",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Send {currentRating}-Star Rating to Branch
                                    </Button>
                                    
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="border-yellow-600/50 text-yellow-300 hover:bg-yellow-700/20"
                                      onClick={() => {
                                        const branch = branches.find((b: Branch) => b.id === selectedBranchForSettings);
                                        setCurrentRating(branch?.starRating || 5);
                                      }}
                                    >
                                      Reset
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="text-yellow-200/60 text-sm">
                                  Selected Rating: <span className={`font-bold ${
                                    currentRating === 0 ? 'text-red-300' : 
                                    currentRating >= 4 ? 'text-green-300' :
                                    currentRating === 3 ? 'text-yellow-400' :
                                    'text-amber-400'
                                  }`}>
                                    {currentRating} {currentRating === 1 ? 'star' : 'stars'} - {
                                      currentRating === 5 ? 'Very Good' :
                                      currentRating === 4 ? 'Good' :
                                      currentRating === 3 ? 'Generally Satisfactory' :
                                      currentRating === 2 ? 'Improvement Necessary' :
                                      currentRating === 1 ? 'Major Improvement Necessary' :
                                      'Urgent Improvement Necessary'
                                    }
                                  </span>
                                  <br />
                                  <div className={`text-xs font-medium ${
                                    currentRating >= 4 ? 'text-green-200' :
                                    currentRating === 3 ? 'text-yellow-200' :
                                    currentRating >= 1 ? 'text-amber-200' :
                                    'text-red-200'
                                  }`}>
                                    Official UK Food Hygiene Rating - matches council standards
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Other Dashboard Controls */}
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Dashboard Layout</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-slate-300">Rating Style</Label>
                              <Select value={ratingStyle} onValueChange={setRatingStyle}>
                                <SelectTrigger className="bg-slate-900 border-slate-600 text-white mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-600">
                                  <SelectItem value="stars" className="text-white hover:bg-slate-700 focus:bg-slate-700">★ Yellow Stars</SelectItem>
                                  <SelectItem value="cubes" className="text-white hover:bg-slate-700 focus:bg-slate-700">🟨 Yellow Cubes</SelectItem>
                                  <SelectItem value="circles" className="text-white hover:bg-slate-700 focus:bg-slate-700">🔵 Blue Circles</SelectItem>
                                  <SelectItem value="hearts" className="text-white hover:bg-slate-700 focus:bg-slate-700">❤️ Hearts</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Visitor Counter */}
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Visitor Counter</h4>
                          <div className="flex items-center space-x-3">
                            <Input
                              type="number"
                              value={visitorCount}
                              onChange={(e) => setVisitorCount(parseInt(e.target.value) || 0)}
                              className="bg-slate-900 border-slate-600 text-white w-32"
                              min="0"
                            />
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                toast({
                                  title: "Visitor Count Updated",
                                  description: `Visitor counter set to ${visitorCount.toLocaleString()} for ${branches.find((b: Branch) => b.id === selectedBranchForSettings)?.name}`,
                                });
                              }}
                            >
                              Update
                            </Button>
                          </div>
                        </div>

                        {/* Dashboard Cards Controls */}
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Dashboard Cards Content</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                              <Label className="text-slate-300 text-xs">Your Rating Card</Label>
                              <div className="mt-2 space-y-1">
                                <Input placeholder="5/5" defaultValue="5/5" className="bg-slate-800 border-slate-600 text-white text-sm h-8" />
                                <Input placeholder="+0.5" defaultValue="+0.5" className="bg-slate-800 border-slate-600 text-green-400 text-xs h-6" />
                              </div>
                            </div>
                            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                              <Label className="text-slate-300 text-xs">Documents Card</Label>
                              <div className="mt-2 space-y-1">
                                <Input placeholder="8" defaultValue="8" className="bg-slate-800 border-slate-600 text-white text-sm h-8" />
                                <Input placeholder="+3" defaultValue="+3" className="bg-slate-800 border-slate-600 text-green-400 text-xs h-6" />
                              </div>
                            </div>
                            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                              <Label className="text-slate-300 text-xs">Compliance Card</Label>
                              <div className="mt-2 space-y-1">
                                <Input placeholder="92%" defaultValue="92%" className="bg-slate-800 border-slate-600 text-white text-sm h-8" />
                                <Input placeholder="+5%" defaultValue="+5%" className="bg-slate-800 border-slate-600 text-green-400 text-xs h-6" />
                              </div>
                            </div>
                            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                              <Label className="text-slate-300 text-xs">Pending Tasks</Label>
                              <div className="mt-2 space-y-1">
                                <Input placeholder="4" defaultValue="4" className="bg-slate-800 border-slate-600 text-white text-sm h-8" />
                                <Input placeholder="-2" defaultValue="-2" className="bg-slate-800 border-slate-600 text-red-400 text-xs h-6" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Food Safety Rating Section */}
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Food Safety Rating Section</h4>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-slate-300">Section Title</Label>
                              <Input
                                placeholder="Food Safety Rating"
                                defaultValue="Food Safety Rating"
                                className="bg-slate-900 border-slate-600 text-white mt-2"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-300">Description Text</Label>
                              <Textarea
                                placeholder="Offering pest control services and hygiene training can definitely lead to high ratings if the service is effective and reliable..."
                                defaultValue="Offering pest control services and hygiene training can definitely lead to high ratings if the service is effective and reliable. To maintain that 5-star rating, it's important to focus on a few key areas:"
                                className="bg-slate-900 border-slate-600 text-white mt-2"
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label className="text-slate-300">Star Icon Style</Label>
                              <div className="flex items-center space-x-3 mt-2">
                                <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                                  <span className="text-2xl">⭐</span>
                                </div>
                                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                                  Change Icon
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Service Cards Management */}
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Service Cards (Bottom Section)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Pest Control Card */}
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                  <Bug className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-white font-medium">Pest Control</span>
                              </div>
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Last Inspection</span>
                                  <Input placeholder="2025-04-15" defaultValue="2025-04-15" className="bg-slate-800 border-slate-600 text-white h-6 text-xs w-20" />
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Next Due</span>
                                  <Input placeholder="2025-07-15" defaultValue="2025-07-15" className="bg-slate-800 border-slate-600 text-white h-6 text-xs w-20" />
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Status</span>
                                  <Badge className="bg-green-600 text-white text-xs">Compliant</Badge>
                                </div>
                              </div>
                            </div>

                            {/* Payment Agreement Card */}
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                  <CreditCard className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-white font-medium">Payment Agreement</span>
                              </div>
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Amount</span>
                                  <Input placeholder="£15" defaultValue="£15" className="bg-slate-800 border-slate-600 text-white h-6 text-xs w-16" />
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Method</span>
                                  <Input placeholder="Cash" defaultValue="Cash" className="bg-slate-800 border-slate-600 text-white h-6 text-xs w-16" />
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Frequency</span>
                                  <Input placeholder="Weekly" defaultValue="Weekly" className="bg-slate-800 border-slate-600 text-white h-6 text-xs w-20" />
                                </div>
                              </div>
                            </div>

                            {/* Hygiene Training Card */}
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-white font-medium">Hygiene Training</span>
                              </div>
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Last Training</span>
                                  <Input placeholder="2025-03-20" defaultValue="2025-03-20" className="bg-slate-800 border-slate-600 text-white h-6 text-xs w-20" />
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Next Due</span>
                                  <Input placeholder="2025-09-20" defaultValue="2025-09-20" className="bg-slate-800 border-slate-600 text-white h-6 text-xs w-20" />
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Status</span>
                                  <Badge className="bg-green-600 text-white text-xs">Compliant</Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tips Section Controls */}
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Tips Section</h4>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-slate-300">Tips Title</Label>
                              <Input
                                placeholder="Tips for Maintaining High Ratings"
                                defaultValue="Tips for Maintaining High Ratings"
                                className="bg-slate-900 border-slate-600 text-white mt-2"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-300">Tips Content (4 items)</Label>
                              <div className="space-y-2 mt-2">
                                <Input placeholder="Schedule regular pest control inspections and maintain detailed logs." className="bg-slate-900 border-slate-600 text-white text-sm" />
                                <Input placeholder="Ensure all staff complete hygiene training within 30 days of joining." className="bg-slate-900 border-slate-600 text-white text-sm" />
                                <Input placeholder="Conduct daily cleaning audits and maintain sanitization standards." className="bg-slate-900 border-slate-600 text-white text-sm" />
                                <Input placeholder="Keep safety documentation up-to-date and easily accessible." className="bg-slate-900 border-slate-600 text-white text-sm" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Font Controls */}
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Font Controls</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label className="text-slate-300">Font Family</Label>
                              <Select>
                                <SelectTrigger className="bg-slate-900 border-slate-600 text-white mt-2">
                                  <SelectValue placeholder="Select font" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-600">
                                  <SelectItem value="inter" className="text-white hover:bg-slate-700 focus:bg-slate-700">Inter</SelectItem>
                                  <SelectItem value="roboto" className="text-white hover:bg-slate-700 focus:bg-slate-700">Roboto</SelectItem>
                                  <SelectItem value="opensans" className="text-white hover:bg-slate-700 focus:bg-slate-700">Open Sans</SelectItem>
                                  <SelectItem value="poppins" className="text-white hover:bg-slate-700 focus:bg-slate-700">Poppins</SelectItem>
                                  <SelectItem value="montserrat" className="text-white hover:bg-slate-700 focus:bg-slate-700">Montserrat</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-slate-300">Font Size</Label>
                              <Select>
                                <SelectTrigger className="bg-slate-900 border-slate-600 text-white mt-2">
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-600">
                                  <SelectItem value="sm" className="text-white hover:bg-slate-700 focus:bg-slate-700">Small</SelectItem>
                                  <SelectItem value="md" className="text-white hover:bg-slate-700 focus:bg-slate-700">Medium</SelectItem>
                                  <SelectItem value="lg" className="text-white hover:bg-slate-700 focus:bg-slate-700">Large</SelectItem>
                                  <SelectItem value="xl" className="text-white hover:bg-slate-700 focus:bg-slate-700">Extra Large</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-slate-300">Text Color</Label>
                              <Input
                                type="color"
                                className="bg-slate-900 border-slate-600 text-white mt-2 h-10"
                                defaultValue="#ffffff"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Visual Elements */}
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Visual Elements</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-slate-300">Star Rating Display</Label>
                              <Select>
                                <SelectTrigger className="bg-slate-900 border-slate-600 text-white mt-2">
                                  <SelectValue placeholder="Select rating style" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-600">
                                  <SelectItem value="stars" className="text-white hover:bg-slate-700 focus:bg-slate-700">5 Star Icons</SelectItem>
                                  <SelectItem value="cubes" className="text-white hover:bg-slate-700 focus:bg-slate-700">5 Cube Icons</SelectItem>
                                  <SelectItem value="hidden" className="text-white hover:bg-slate-700 focus:bg-slate-700">Hidden</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-slate-300">Visitor Counter</Label>
                              <div className="flex items-center space-x-2 mt-2">
                                <Input
                                  type="number"
                                  placeholder="1000"
                                  className="bg-slate-900 border-slate-600 text-white"
                                />
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  Update
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Color Scheme Controls */}
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Color & Theme Controls</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-slate-300">Primary Color (Cards Background)</Label>
                              <Input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="bg-slate-900 border-slate-600 text-white mt-2 h-10"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-300">Secondary Color (Accents)</Label>
                              <Input
                                type="color"
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="bg-slate-900 border-slate-600 text-white mt-2 h-10"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-300">Success Color (Green badges)</Label>
                              <Input
                                type="color"
                                value={successColor}
                                onChange={(e) => setSuccessColor(e.target.value)}
                                className="bg-slate-900 border-slate-600 text-white mt-2 h-10"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-300">Warning Color (Red badges)</Label>
                              <Input
                                type="color"
                                value={warningColor}
                                onChange={(e) => setWarningColor(e.target.value)}
                                className="bg-slate-900 border-slate-600 text-white mt-2 h-10"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Layout & Spacing */}
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Layout & Spacing</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-slate-300">Card Spacing</Label>
                              <Select value={cardSpacing} onValueChange={setCardSpacing}>
                                <SelectTrigger className="bg-slate-900 border-slate-600 text-white mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-600">
                                  <SelectItem value="tight" className="text-white hover:bg-slate-700 focus:bg-slate-700">Tight</SelectItem>
                                  <SelectItem value="normal" className="text-white hover:bg-slate-700 focus:bg-slate-700">Normal</SelectItem>
                                  <SelectItem value="loose" className="text-white hover:bg-slate-700 focus:bg-slate-700">Loose</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-slate-300">Card Border Radius</Label>
                              <Select value={cardBorderRadius} onValueChange={setCardBorderRadius}>
                                <SelectTrigger className="bg-slate-900 border-slate-600 text-white mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-600">
                                  <SelectItem value="square" className="text-white hover:bg-slate-700 focus:bg-slate-700">Square</SelectItem>
                                  <SelectItem value="rounded" className="text-white hover:bg-slate-700 focus:bg-slate-700">Rounded</SelectItem>
                                  <SelectItem value="very-rounded" className="text-white hover:bg-slate-700 focus:bg-slate-700">Very Rounded</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    ) : (
                      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                        <CardContent className="p-12 text-center">
                          <Building2 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-white mb-2">Select a Branch First</h3>
                          <p className="text-slate-400 mb-6">Choose a branch from the dropdown above to customize its dashboard settings.</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                            {branches.slice(0, 3).map((branch: Branch) => (
                              <Button
                                key={branch.id}
                                variant="outline"
                                onClick={() => setSelectedBranchForSettings(branch.id)}
                                className="border-slate-600 text-slate-300 hover:bg-slate-700 p-4 h-auto flex-col space-y-2"
                              >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                  <Building2 className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-medium">{branch.name}</p>
                                  <p className="text-xs text-slate-500">{branch.address}</p>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Admin Dashboard Settings */}
                {settingsTab === "admin-dashboard" && (
                  <div className="space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                              <Settings className="h-5 w-5 text-white" />
                            </div>
                            <span>Admin Dashboard Controls</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-orange-500 text-orange-300 hover:bg-orange-500/10"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset to Default
                          </Button>
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Customize admin dashboard appearance and sections
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Headlines and Text */}
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Headlines & Content</h4>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-slate-300">Main Dashboard Title</Label>
                              <Input
                                placeholder="Dashboard Overview"
                                className="bg-slate-900 border-slate-600 text-white mt-2"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-300">Welcome Message</Label>
                              <Input
                                placeholder="Welcome to your pest control management center"
                                className="bg-slate-900 border-slate-600 text-white mt-2"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-300">System Status Text</Label>
                              <Input
                                placeholder="System Online"
                                className="bg-slate-900 border-slate-600 text-white mt-2"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section Visibility */}
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Section Visibility</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              "Enhanced Stats Cards",
                              "Pest Control System Cards", 
                              "Recent Activity Widget",
                              "Quick Actions Widget",
                              "WiFi Device Monitoring",
                              "System Health Monitor"
                            ].map((section) => (
                              <div key={section} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                                <span className="text-white text-sm">{section}</span>
                                <div className="flex items-center space-x-2">
                                  <Button size="sm" variant="outline" className="h-7 px-2 border-slate-600 text-slate-300">
                                    Hide
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 px-2 border-blue-600 text-blue-300">
                                    Edit
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Icon Management */}
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Icon Management</h4>
                          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                            {[BarChart3, Users, DollarSign, Activity, Building2, Bug].map((Icon, i) => (
                              <div key={i} className="relative group">
                                <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center border border-slate-600 hover:border-purple-500 transition-colors">
                                  <Icon className="h-6 w-6 text-slate-300" />
                                </div>
                                <Button 
                                  size="sm" 
                                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 bg-red-500 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}





                {/* Browser Tab Settings */}
                {settingsTab === "browser-tab" && (
                  <div className="space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <Globe className="h-5 w-5 text-white" />
                          </div>
                          <span>Browser Tab Settings</span>
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Customize browser tab title and favicon
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Tab Title */}
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Tab Title</h4>
                          <div>
                            <Label className="text-slate-300">Browser Tab Title</Label>
                            <Input
                              placeholder="Pest Control Management System"
                              className="bg-slate-900 border-slate-600 text-white mt-2"
                            />
                            <p className="text-slate-400 text-xs mt-1">This appears in the browser tab</p>
                          </div>
                        </div>

                        {/* Favicon Upload */}
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Favicon (Tab Icon)</h4>
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center border border-slate-600">
                              <ImageIcon className="h-6 w-6 text-slate-400" />
                            </div>
                            <div className="space-y-2">
                              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Favicon
                              </Button>
                              <p className="text-slate-400 text-xs">ICO, PNG 16x16 or 32x32px</p>
                            </div>
                          </div>
                        </div>

                        {/* Preview */}
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold">Preview</h4>
                          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                            <div className="flex items-center space-x-2 p-2 bg-slate-800 rounded-lg">
                              <div className="w-4 h-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-sm"></div>
                              <span className="text-slate-300 text-sm">Pest Control Management System</span>
                            </div>
                            <p className="text-slate-400 text-xs mt-2">Browser tab preview</p>
                          </div>
                        </div>

                        {/* Apply Changes */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                          <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                            Preview Changes
                          </Button>
                          <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                            Apply Changes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Code Protection Settings */}
                {settingsTab === "code-protection" && (
                  <div className="space-y-6">
                    <CodeProtectionPanel />
                  </div>
                )}

                {/* Save Changes Section - Mobile Responsive */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 pt-6 border-t border-slate-700 w-full max-w-full">
                  <div className="text-sm text-slate-400 text-center lg:text-left">
                    {(settingsTab === "branch-dashboard" || settingsTab === "branch-login") && selectedBranchForSettings ? (
                      <p>Changes will be saved only for: <span className="text-white font-medium">{branches.find((b: Branch) => b.id === selectedBranchForSettings)?.name}</span></p>
                    ) : (settingsTab === "admin-dashboard" || settingsTab === "browser-tab" || settingsTab === "code-protection") ? (
                      <p>Changes will apply to the entire system</p>
                    ) : (
                      <p>Select a branch to save changes</p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-start lg:justify-end space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 w-full sm:w-auto px-4 lg:px-6 py-2 text-sm lg:text-base"
                      onClick={() => {
                        if ((settingsTab === "branch-dashboard" || settingsTab === "branch-login") && selectedBranchForSettings) {
                          const branchName = branches.find((b: Branch) => b.id === selectedBranchForSettings)?.name;
                          toast({
                            title: "Preview Ready",
                            description: `Preview showing changes for ${branchName}: Rating ${currentRating}/5, ${ratingStyle} style, ${cardSpacing} spacing, ${cardBorderRadius} corners`,
                          });
                        } else if (settingsTab === "admin-dashboard" || settingsTab === "browser-tab") {
                          toast({
                            title: "Preview Ready",
                            description: "Preview showing system-wide changes for all users",
                          });
                        } else {
                          toast({
                            title: "Select Branch",
                            description: "Please select a branch to preview changes",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Preview Changes
                    </Button>
                    <Button 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 w-full sm:w-auto px-4 lg:px-6 py-2 text-sm lg:text-base"
                      disabled={(settingsTab === "branch-dashboard" || settingsTab === "branch-login") && !selectedBranchForSettings}
                      onClick={() => {
                        if (deploymentMode === 'staging') {
                          const changeDescription = `${settingsTab} settings updated`;
                          setPendingChanges(prev => [...prev, changeDescription]);
                          toast({
                            title: "Changes Saved to Staging",
                            description: "Changes saved to staging. Deploy when ready to make live.",
                          });
                        } else {
                          if (settingsTab === "branch-dashboard" && selectedBranchForSettings) {
                            const branchName = branches.find((b: Branch) => b.id === selectedBranchForSettings)?.name;
                            toast({
                              title: "Settings Saved Live",
                              description: `Changes for ${branchName} are now live and visible to users.`,
                            });
                          } else {
                            toast({
                              title: "Settings Saved Live",
                              description: "Changes are now live and visible to all users.",
                            });
                          }
                        }
                      }}
                    >
                      {(settingsTab === "branch-dashboard" || settingsTab === "branch-login") 
                        ? "Save for Selected" 
                        : "Save System Settings"
                      }
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Other sections would go here... */}
          </div>
        </div>
      </div>

      {/* Add Branch Dialog */}
      <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
        <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-pink-400 text-2xl font-bold flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span>Add New Branch</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a new branch location with complete details and access credentials
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Branch Logo */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <ImageIcon className="h-5 w-5 mr-2 text-orange-400" />
                  Branch Logo
                </h3>
                <div className="space-y-4">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.gif,.svg,image/png,image/jpeg,image/gif,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-500 file:text-white hover:file:bg-orange-600 file:cursor-pointer cursor-pointer bg-slate-800/50 border border-slate-700 rounded-lg"
                  />
                  <p className="text-xs text-slate-400">
                    Supported formats: PNG, JPG/JPEG, GIF, SVG. Max size: 10MB
                  </p>
                  {branchLogoPreview && (
                    <div>
                      <p className="text-sm text-slate-300 mb-2">Logo Preview:</p>
                      <div className="w-32 h-32 bg-slate-800 rounded-lg border border-slate-600 flex items-center justify-center overflow-hidden">
                        <img src={branchLogoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Branch Information */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-blue-400" />
                  Branch Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Branch Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-slate-800/50 border-slate-700 text-white" placeholder="Enter branch name" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Contact Number</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-slate-800/50 border-slate-700 text-white" placeholder="Enter contact number" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-slate-300">Full Address</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-slate-800/50 border-slate-700 text-white" placeholder="Enter full address" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="postCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Post Code</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-slate-800/50 border-slate-700 text-white" placeholder="Enter post code" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contractNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Contract Number</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-slate-800/50 border-slate-700 text-white" placeholder="Enter contract number" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contractStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Contract Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="bg-slate-800/50 border-slate-700 text-white" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contractEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Contract Finish Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="bg-slate-800/50 border-slate-700 text-white" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Login Credentials */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Key className="h-5 w-5 mr-2 text-green-400" />
                  Login Credentials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Email (for branch login)</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" className="bg-slate-800/50 border-slate-700 text-white" placeholder="Enter email address" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Branch Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="active" className="text-white hover:bg-slate-700 focus:bg-slate-700">Active</SelectItem>
                            <SelectItem value="inactive" className="text-white hover:bg-slate-700 focus:bg-slate-700">Inactive (Login Disabled)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" className="bg-slate-800/50 border-slate-700 text-white" placeholder="Enter password (min 8 characters)" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Confirm Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" className="bg-slate-800/50 border-slate-700 text-white" placeholder="Confirm password" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Payment & Agreement Settings */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-purple-400" />
                  Payment & Agreement Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="online" className="text-white hover:bg-slate-700 focus:bg-slate-700">Online</SelectItem>
                            <SelectItem value="cash" className="text-white hover:bg-slate-700 focus:bg-slate-700">Cash</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="visitFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Visit Agreement Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="monthly" className="text-white hover:bg-slate-700 focus:bg-slate-700">Monthly</SelectItem>
                            <SelectItem value="quarterly" className="text-white hover:bg-slate-700 focus:bg-slate-700">Quarterly</SelectItem>
                            <SelectItem value="yearly" className="text-white hover:bg-slate-700 focus:bg-slate-700">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="paymentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Payment Agreement (£)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                              <SelectValue placeholder="Select amount" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-slate-700 max-h-48">
                            <SelectItem value="20" className="text-white hover:bg-slate-700 focus:bg-slate-700">£20</SelectItem>
                            <SelectItem value="25" className="text-white hover:bg-slate-700 focus:bg-slate-700">£25</SelectItem>
                            <SelectItem value="30" className="text-white hover:bg-slate-700 focus:bg-slate-700">£30</SelectItem>
                            <SelectItem value="35" className="text-white hover:bg-slate-700 focus:bg-slate-700">£35</SelectItem>
                            <SelectItem value="50" className="text-white hover:bg-slate-700 focus:bg-slate-700">£50</SelectItem>
                            <SelectItem value="70" className="text-white hover:bg-slate-700 focus:bg-slate-700">£70</SelectItem>
                            <SelectItem value="75" className="text-white hover:bg-slate-700 focus:bg-slate-700">£75</SelectItem>
                            <SelectItem value="100" className="text-white hover:bg-slate-700 focus:bg-slate-700">£100</SelectItem>
                            <SelectItem value="150" className="text-white hover:bg-slate-700 focus:bg-slate-700">£150</SelectItem>
                            <SelectItem value="240" className="text-white hover:bg-slate-700 focus:bg-slate-700">£240</SelectItem>
                            <SelectItem value="300" className="text-white hover:bg-slate-700 focus:bg-slate-700">£300</SelectItem>
                            <SelectItem value="360" className="text-white hover:bg-slate-700 focus:bg-slate-700">£360</SelectItem>
                            <SelectItem value="400" className="text-white hover:bg-slate-700 focus:bg-slate-700">£400</SelectItem>
                            <SelectItem value="500" className="text-white hover:bg-slate-700 focus:bg-slate-700">£500</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-700/50">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowBranchDialog(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addBranchMutation.isPending}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg"
                >
                  {addBranchMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4 mr-2" />
                      Save Branch
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Edit className="h-6 w-6 text-white" />
              </div>
              <span>Edit Branch</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Update branch information and settings
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Logo Upload Section */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <ImageIcon className="h-5 w-5 mr-2 text-orange-400" />
                  Branch Logo
                </h3>
                <div className="space-y-4">
                  {/* Current Logo Display */}
                  {selectedBranch?.logoUrl && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-300 mb-2">Current Logo:</p>
                      <div className="w-32 h-32 bg-slate-800 rounded-lg border border-slate-600 flex items-center justify-center overflow-hidden">
                        <img 
                          src={`/api/branches/${selectedBranch.id}/logo?t=${Date.now()}`} 
                          alt="Branch Logo" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="text-slate-400 text-xs text-center p-4">No logo available</div>';
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Logo Upload Input */}
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">
                      Upload New Logo (optional)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.gif,.svg,image/png,image/jpeg,image/gif,image/svg+xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml'];
                        const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
                        const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
                        if (file.size > 10 * 1024 * 1024) {
                          toast({ title: "File Too Large", description: "Logo file must be less than 10MB", variant: "destructive" });
                          e.target.value = "";
                          return;
                        }
                        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
                          toast({ title: "Invalid File Type", description: "Please select PNG, JPG/JPEG, GIF or SVG", variant: "destructive" });
                          e.target.value = "";
                          return;
                        }
                        setSelectedLogoFile(file);
                      }}
                      className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-500 file:text-white hover:file:bg-orange-600 file:cursor-pointer cursor-pointer bg-slate-800/50 border border-slate-700 rounded-lg"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Supported formats: PNG, JPG/JPEG, GIF, SVG. Max size: 10MB
                    </p>
                  </div>
                  
                  {/* Preview new logo if selected */}
                  {selectedLogoFile && (
                    <div>
                      <p className="text-sm text-slate-300 mb-2">New Logo Preview:</p>
                      <div className="w-32 h-32 bg-slate-800 rounded-lg border border-slate-600 flex items-center justify-center overflow-hidden">
                        <img 
                          src={URL.createObjectURL(selectedLogoFile)} 
                          alt="Logo Preview" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-blue-400" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Branch Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-slate-800/50 border-slate-700 text-white" placeholder="Enter branch name" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Contact Number</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-slate-800/50 border-slate-700 text-white" placeholder="Enter contact number" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Address</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-slate-800/50 border-slate-700 text-white" placeholder="Enter address" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="postCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Post Code</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-slate-800/50 border-slate-700 text-white" placeholder="Enter post code" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contractNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Contract Number</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-slate-800/50 border-slate-700 text-white" placeholder="Enter contract number" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contractStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Contract Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="bg-slate-800/50 border-slate-700 text-white" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contractEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Contract Finish Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="bg-slate-800/50 border-slate-700 text-white" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="active" className="text-white hover:bg-slate-700 focus:bg-slate-700">Active</SelectItem>
                            <SelectItem value="inactive" className="text-white hover:bg-slate-700 focus:bg-slate-700">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Login Credentials */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Key className="h-5 w-5 mr-2 text-green-400" />
                  Login Credentials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Email (Username)</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" className="bg-slate-800/50 border-slate-700 text-white" placeholder="Enter email address" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">New Password (leave blank to keep current)</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" className="bg-slate-800/50 border-slate-700 text-white" placeholder="Enter new password" />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Confirm New Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" className="bg-slate-800/50 border-slate-700 text-white" placeholder="Confirm new password" />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>


              {/* Payment & Agreement Settings */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-purple-400" />
                  Payment & Agreement Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="online" className="text-white hover:bg-slate-700 focus:bg-slate-700">Online</SelectItem>
                            <SelectItem value="cash" className="text-white hover:bg-slate-700 focus:bg-slate-700">Cash</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="visitFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Visit Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="monthly" className="text-white hover:bg-slate-700 focus:bg-slate-700">Monthly</SelectItem>
                            <SelectItem value="quarterly" className="text-white hover:bg-slate-700 focus:bg-slate-700">Quarterly</SelectItem>
                            <SelectItem value="yearly" className="text-white hover:bg-slate-700 focus:bg-slate-700">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="paymentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Payment Amount (£)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                              <SelectValue placeholder="Select amount" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="20" className="text-white hover:bg-slate-700 focus:bg-slate-700">£20</SelectItem>
                            <SelectItem value="25" className="text-white hover:bg-slate-700 focus:bg-slate-700">£25</SelectItem>
                            <SelectItem value="30" className="text-white hover:bg-slate-700 focus:bg-slate-700">£30</SelectItem>
                            <SelectItem value="35" className="text-white hover:bg-slate-700 focus:bg-slate-700">£35</SelectItem>
                            <SelectItem value="50" className="text-white hover:bg-slate-700 focus:bg-slate-700">£50</SelectItem>
                            <SelectItem value="70" className="text-white hover:bg-slate-700 focus:bg-slate-700">£70</SelectItem>
                            <SelectItem value="75" className="text-white hover:bg-slate-700 focus:bg-slate-700">£75</SelectItem>
                            <SelectItem value="100" className="text-white hover:bg-slate-700 focus:bg-slate-700">£100</SelectItem>
                            <SelectItem value="150" className="text-white hover:bg-slate-700 focus:bg-slate-700">£150</SelectItem>
                            <SelectItem value="240" className="text-white hover:bg-slate-700 focus:bg-slate-700">£240</SelectItem>
                            <SelectItem value="300" className="text-white hover:bg-slate-700 focus:bg-slate-700">£300</SelectItem>
                            <SelectItem value="360" className="text-white hover:bg-slate-700 focus:bg-slate-700">£360</SelectItem>
                            <SelectItem value="400" className="text-white hover:bg-slate-700 focus:bg-slate-700">£400</SelectItem>
                            <SelectItem value="500" className="text-white hover:bg-slate-700 focus:bg-slate-700">£500</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Hygiene Training */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                  Hygiene Training
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lastTraining"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Last Training Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="bg-slate-800/50 border-slate-700 text-white"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="trainingNextDue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Next Due Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="bg-slate-800/50 border-slate-700 text-white"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-700/50">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateBranchMutation.isPending}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                >
                  {updateBranchMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Update Branch
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-700">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-lg">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Upload Photo</h2>
                <p className="text-slate-400">Upload before/after photos</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Photo Upload */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Photo File</label>
                {photoPreview ? (
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img 
                        src={photoPreview} 
                        alt="Photo preview" 
                        className="w-32 h-32 object-cover rounded-xl border border-slate-600"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview("");
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-300 font-medium">{photoFile?.name}</p>
                      <p className="text-xs text-slate-400">
                        {photoFile ? (photoFile.size / 1024 / 1024).toFixed(2) : 0} MB
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        className="mt-2 border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        Change Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <label 
                      htmlFor="photo-upload"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-600 border-dashed rounded-xl cursor-pointer bg-slate-800/30 hover:bg-slate-800/50 transition-colors duration-200"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-4 text-slate-400" />
                        <p className="mb-2 text-sm text-slate-400">
                          <span className="font-semibold">Click to upload</span> photo
                        </p>
                        <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                      </div>
                    </label>
                  </div>
                )}
                <input 
                  id="photo-upload"
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handlePhotoUpload}
                />
              </div>

              {/* Photo Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Photo Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="before"
                      checked={photoType === 'before'}
                      onChange={(e) => setPhotoType(e.target.value as 'before' | 'after')}
                      className="w-4 h-4 text-orange-600 bg-slate-800 border-slate-600"
                    />
                    <span className="text-slate-300">Before</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="after"
                      checked={photoType === 'after'}
                      onChange={(e) => setPhotoType(e.target.value as 'before' | 'after')}
                      className="w-4 h-4 text-green-600 bg-slate-800 border-slate-600"
                    />
                    <span className="text-slate-300">After</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Description</label>
                <textarea
                  value={photoDescription}
                  onChange={(e) => setPhotoDescription(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm resize-none"
                  rows={3}
                  placeholder="Add a description for this photo..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowPhotoDialog(false);
                  setPhotoFile(null);
                  setPhotoPreview("");
                  setPhotoDescription("");
                  setPhotoType('before');
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={() => uploadPhotoMutation.mutate()}
                disabled={!photoFile || uploadPhotoMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
              >
                {uploadPhotoMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Send to Branch Dialog */}
      <Dialog open={showPhotoSendDialog} onOpenChange={setShowPhotoSendDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-lg">
                <Send className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Send Photo to Branch</h2>
                <p className="text-slate-400">Select a branch to send this photo</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Select Branch</label>
                <select
                  value={selectedBranchForPhoto}
                  onChange={(e) => setSelectedBranchForPhoto(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-3 py-2"
                >
                  <option value="">Choose a branch...</option>
                  {branches.map((branch: Branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPhotoForSend && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
                      {selectedPhotoForSend.filepath ? (
                        <img 
                          src={selectedPhotoForSend.filepath} 
                          alt={selectedPhotoForSend.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white text-sm">{selectedPhotoForSend.title}</h4>
                      <p className="text-xs text-slate-400">{selectedPhotoForSend.type} photo</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowPhotoSendDialog(false);
                  setSelectedPhotoForSend(null);
                  setSelectedBranchForPhoto("");
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  if (selectedPhotoForSend && selectedBranchForPhoto) {
                    sendPhotoToBranchMutation.mutate({
                      photoId: selectedPhotoForSend.id,
                      branchId: selectedBranchForPhoto
                    });
                    setShowPhotoSendDialog(false);
                    setSelectedPhotoForSend(null);
                    setSelectedBranchForPhoto("");
                  }
                }}
                disabled={!selectedBranchForPhoto || sendPhotoToBranchMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              >
                {sendPhotoToBranchMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Photo
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Viewer Dialog */}
      <Dialog open={showPhotoViewerDialog} onOpenChange={setShowPhotoViewerDialog}>
        <DialogContent className="sm:max-w-4xl bg-slate-900 border-slate-700">
          <div className="space-y-6">
            {viewingPhoto && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-lg">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{viewingPhoto.title}</h2>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${
                          viewingPhoto.type === 'before' ? 'bg-orange-600' : 'bg-green-600'
                        } text-white text-xs`}>
                          {viewingPhoto.type === 'before' ? 'Before' : 'After'}
                        </Badge>
                        <span className="text-slate-400 text-sm">
                          {new Date(viewingPhoto.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="aspect-video bg-slate-900 rounded flex items-center justify-center overflow-hidden">
                    {viewingPhoto.filepath ? (
                      <img 
                        src={viewingPhoto.filepath} 
                        alt={viewingPhoto.title}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-24 w-24 text-slate-500" />
                    )}
                  </div>
                </div>

                {viewingPhoto.description && (
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <h4 className="text-sm font-medium text-white mb-2">Description</h4>
                    <p className="text-slate-300 text-sm">{viewingPhoto.description}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Category: {viewingPhoto.category} | Uploaded by: {viewingPhoto.uploadedBy}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendPhotoToBranch(viewingPhoto)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Send to Branch
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Editor Dialog */}
      <Dialog open={showImageEditor} onOpenChange={setShowImageEditor}>
        <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-purple-400 text-2xl font-bold flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <span>Edit PNG Image</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Add handwritten annotations like date of visit and address using biro_script font
            </DialogDescription>
          </DialogHeader>

          {selectedImage && (
            <div className="space-y-6">
              {/* Tool Selection */}
              <div className="flex items-center space-x-4 p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-slate-300">Drawing Tool:</label>
                  <Button
                    size="sm"
                    variant={currentTool === 'pen' ? 'default' : 'outline'}
                    onClick={() => setCurrentTool('pen')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Pen
                  </Button>
                  <Button
                    size="sm"
                    variant={currentTool === 'text' ? 'default' : 'outline'}
                    onClick={() => setCurrentTool('text')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Text
                  </Button>
                </div>
              </div>

              {/* Canvas Container */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="text-center">
                  <canvas
                    ref={(canvas) => {
                      setCanvasRef(canvas);
                      if (canvas && selectedImage) {
                        initializeCanvas(canvas, selectedImage.filepath);
                      }
                    }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    className="border border-slate-600 rounded-lg max-w-full max-h-96 cursor-crosshair"
                    style={{ 
                      fontFamily: '"Biro Script", cursive',
                      cursor: currentTool === 'pen' ? 'crosshair' : 'text'
                    }}
                  />
                </div>
                
                {/* Quick Text Templates */}
                {currentTool === 'text' && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-slate-400">Quick Templates (click to add):</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTextToCanvas(`Visit Date: ${new Date().toLocaleDateString()}`, 50, 50)}
                        className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        Add Visit Date
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTextToCanvas('Address: [Edit here]', 50, 80)}
                        className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        Add Address
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTextToCanvas('Treatment Applied', 50, 110)}
                        className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        Add Treatment Note
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTextToCanvas('Pest Control Specialist', 50, 140)}
                        className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        Add Signature
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImageEditor(false);
                    setSelectedImage(null);
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (canvasRef && selectedImage) {
                        initializeCanvas(canvasRef, selectedImage.filepath);
                      }
                    }}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={saveEditedImage}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Save Edited Image
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Branch Confirmation Dialog */}
      <Dialog open={showBranchDeleteDialog} onOpenChange={setShowBranchDeleteDialog}>
        <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400 text-xl font-bold flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <span>Delete Branch</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              This action cannot be undone. This will permanently delete the branch and all associated data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {branchToDelete && (
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                <h4 className="font-semibold text-white mb-2">{branchToDelete.name}</h4>
                <p className="text-sm text-slate-400">{branchToDelete.email}</p>
                <p className="text-sm text-slate-400">{branchToDelete.address}</p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowBranchDeleteDialog(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={confirmDeleteBranch}
                disabled={deleteBranchMutation.isPending}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
              >
                {deleteBranchMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Branch
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Report — Inline Click-to-Edit PDF Editor */}
      <Dialog open={showGenerateReportDialog} onOpenChange={(open) => {
        setShowGenerateReportDialog(open);
        if (!open) {
          if (genPreviewUrl) { URL.revokeObjectURL(genPreviewUrl); setGenPreviewUrl(null); }
          setGenClickX(null); setGenClickY(null);
          setGenPdfDims(null); setGenCanvasDims(null);
          setGenInputScreenPos(null); setGenEditActive(false);
          setGenPremises(''); setGenDateOfReport(new Date().toLocaleDateString('en-GB'));
        }
      }}>
        <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-3xl max-h-[96vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-400 text-xl font-bold flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span>Edit Date on Report</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Choose a report, then click directly on the date in the PDF to edit it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Report selector */}
            <select
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
              value={genPremises}
              onChange={e => {
                const val = e.target.value;
                setGenPremises(val);
                setGenClickX(null); setGenClickY(null);
                setGenInputScreenPos(null); setGenEditActive(false);
                setGenPreviewUrl(null); setGenDateOfReport('');
                if (val) loadGenPdfOnCanvas(val);
              }}
            >
              <option value="">-- Choose a report to edit --</option>
              {monthlyReports.map((r: any) => (
                <option key={r.id} value={r.id}>{r.title} ({r.reportType})</option>
              ))}
            </select>

            {/* Toolbar — always visible when a report is loaded */}
            {genPremises && (() => {
              const fontCssMap: Record<string, string> = {
                BiroScript: "'BiroScript', cursive",
                IndieFlower: "'Indie Flower', cursive",
                PatrickHand: "'Patrick Hand', cursive",
                Kalam: "'Kalam', cursive",
              };
              const darkColors  = ['#0d1a73','#000000','#8B0000','#1a5c1a'];
              const darkLabels  = ['Navy Dark','Black','Dark Red','Dark Green'];
              const lightColors = ['#555555','#777777','#aaaaaa','#4a90d9'];
              const lightLabels = ['Graphite','Light Grey','Very Light','Light Blue'];
              const fonts = [
                { key: 'BiroScript',  label: 'Biro Script',   css: "'BiroScript', cursive" },
                { key: 'IndieFlower', label: 'Indie Flower',  css: "'Indie Flower', cursive" },
                { key: 'PatrickHand', label: 'Patrick Hand',  css: "'Patrick Hand', cursive" },
                { key: 'Kalam',       label: 'Kalam',         css: "'Kalam', cursive" },
              ];
              const selected = fonts.find(f => f.key === genFontFamily) ?? fonts[0];
              const addItem = () => {
                if (genDateOfReport.trim() && genClickX !== null && genClickY !== null && genInputScreenPos) {
                  setGenTextItems(prev => [...prev, {
                    id: Date.now().toString(),
                    text: genDateOfReport.trim(),
                    pdfX: genClickX!, pdfY: genClickY!,
                    screenX: genInputScreenPos!.x, screenY: genInputScreenPos!.y,
                    fontSize: genFontSize, fontFamily: genFontFamily,
                    fontColor: genFontColor, fontBold: genFontBold,
                    pageIndex: genActivePage,
                  }]);
                }
                setGenEditActive(false);
                setGenDateOfReport('');
                setGenClickX(null);
                setGenClickY(null);
                setGenInputScreenPos(null);
              };
              return (
                <div style={{
                  display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px',
                  background: '#1e293b', border: '1px solid #334155', borderRadius: '8px',
                  padding: '6px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}>
                  {/* Font selector */}
                  <div style={{ position: 'relative' }}>
                    <button type="button" onClick={() => setGenFontPickerOpen(o => !o)}
                      style={{ background: '#0f172a', border: '1px solid #475569', borderRadius: '4px',
                        color: '#e2e8f0', padding: '3px 8px', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: selected.css, fontSize: '14px', lineHeight: 1 }}>{selected.label}</span>
                      <span style={{ fontSize: '9px', color: '#64748b' }}>▾</span>
                    </button>
                    {genFontPickerOpen && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '2px',
                        background: '#0f172a', border: '1px solid #475569', borderRadius: '6px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.6)', zIndex: 100, minWidth: '140px', overflow: 'hidden' }}>
                        {fonts.map(f => (
                          <button key={f.key} type="button"
                            onClick={() => { setGenFontFamily(f.key); setGenFontPickerOpen(false); }}
                            style={{ display: 'block', width: '100%', textAlign: 'left',
                              padding: '6px 10px', border: 'none', cursor: 'pointer',
                              background: genFontFamily === f.key ? '#1e3a5f' : 'transparent',
                              fontFamily: f.css, fontSize: '15px', color: '#e2e8f0', lineHeight: 1.4 }}>
                            {f.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ width: '1px', height: '20px', background: '#334155', flexShrink: 0 }} />
                  {/* Font size */}
                  <button type="button" onClick={() => setGenFontSize(s => Math.max(6, s - 1))}
                    style={{ background: '#0f172a', border: '1px solid #475569', color: '#94a3b8', cursor: 'pointer', borderRadius: '3px', width: '22px', height: '22px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ color: '#e2e8f0', fontSize: '12px', minWidth: '24px', textAlign: 'center' }}>{genFontSize}</span>
                  <button type="button" onClick={() => setGenFontSize(s => Math.min(60, s + 1))}
                    style={{ background: '#0f172a', border: '1px solid #475569', color: '#94a3b8', cursor: 'pointer', borderRadius: '3px', width: '22px', height: '22px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  <div style={{ width: '1px', height: '20px', background: '#334155', flexShrink: 0 }} />
                  {/* Dark colours */}
                  <span style={{ color: '#64748b', fontSize: '10px', flexShrink: 0 }}>Dark</span>
                  {darkColors.map((c, i) => (
                    <button key={c} type="button" title={darkLabels[i]} onClick={() => setGenFontColor(c)}
                      style={{ width: '18px', height: '18px', borderRadius: '50%', background: c, flexShrink: 0,
                        border: genFontColor === c ? '2px solid #f8fafc' : '2px solid #334155', cursor: 'pointer',
                        outline: genFontColor === c ? '1px solid #64748b' : 'none' }} />
                  ))}
                  <div style={{ width: '1px', height: '14px', background: '#334155', flexShrink: 0 }} />
                  {/* Light colours */}
                  <span style={{ color: '#64748b', fontSize: '10px', flexShrink: 0 }}>Light</span>
                  {lightColors.map((c, i) => (
                    <button key={c} type="button" title={lightLabels[i]} onClick={() => setGenFontColor(c)}
                      style={{ width: '18px', height: '18px', borderRadius: '50%', background: c, flexShrink: 0,
                        border: genFontColor === c ? '2px solid #f8fafc' : '2px solid #334155', cursor: 'pointer',
                        outline: genFontColor === c ? '1px solid #64748b' : 'none' }} />
                  ))}
                  <div style={{ width: '1px', height: '20px', background: '#334155', flexShrink: 0 }} />
                  {/* Bold */}
                  <button type="button" title={genFontBold ? 'Remove bold' : 'Bold'} onClick={() => setGenFontBold(b => !b)}
                    style={{ background: genFontBold ? '#3b82f6' : '#0f172a', border: '1px solid #475569',
                      color: genFontBold ? '#fff' : '#94a3b8', cursor: 'pointer', borderRadius: '3px',
                      width: '24px', height: '22px', fontSize: '13px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>B</button>
                  {/* Coordinates */}
                  {genClickX !== null && genClickY !== null && (
                    <>
                      <div style={{ width: '1px', height: '20px', background: '#334155', flexShrink: 0 }} />
                      <span style={{ color: '#64748b', fontSize: '10px', whiteSpace: 'nowrap' }}>
                        x:{Math.round(genClickX)} y:{Math.round(genClickY)}
                      </span>
                    </>
                  )}
                  {/* Add button — only when editing */}
                  {genEditActive && genDateOfReport.trim() && (
                    <>
                      <div style={{ width: '1px', height: '20px', background: '#334155', flexShrink: 0 }} />
                      <button type="button" onClick={addItem}
                        style={{ background: '#166534', border: '1px solid #16a34a', color: '#86efac', cursor: 'pointer',
                          borderRadius: '4px', padding: '2px 10px', height: '22px', fontSize: '12px', fontWeight: 600,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>✓ Add</button>
                    </>
                  )}
                  {/* Hint when idle */}
                  {!genEditActive && genCanvasDims && (
                    <span style={{ color: '#64748b', fontSize: '11px', marginLeft: '4px' }}>
                      ← Click the PDF to place text
                    </span>
                  )}
                </div>
              );
            })()}

            {/* PDF Canvas — click directly on the date to edit */}
            {genPremises && (
              <div className="rounded-lg border border-slate-600 overflow-hidden bg-white">
                <div
                  ref={genCanvasContainerRef}
                  className="relative w-full"
                  style={{ cursor: genCanvasDims ? 'text' : 'default' }}
                >
                  <canvas
                    ref={genCanvasRef}
                    className="w-full block"
                    onClick={(e) => {
                      const canvas = genCanvasRef.current;
                      const container = genCanvasContainerRef.current;
                      if (!canvas || !container || !genPdfDims || !genCanvasDims) return;

                      const canvasRect = canvas.getBoundingClientRect();
                      const containerRect = container.getBoundingClientRect();

                      // Click position relative to displayed canvas
                      const dispX = e.clientX - canvasRect.left;
                      const dispY = e.clientY - canvasRect.top;

                      // Scale from display pixels → canvas pixels
                      const scaleX = genCanvasDims.w / canvasRect.width;
                      const scaleY = genCanvasDims.h / canvasRect.height;
                      const canvasX = dispX * scaleX;
                      const canvasY = dispY * scaleY;

                      // Convert canvas pixels → PDF points (PDF y is bottom-up)
                      const docScale = genPdfDims.w / genCanvasDims.w;
                      const pdfX = canvasX * docScale;
                      const pdfY = genPdfDims.h - (canvasY * docScale);

                      setGenClickX(pdfX);
                      setGenClickY(pdfY);

                      // Position of inline input relative to container div
                      const inputX = e.clientX - containerRect.left;
                      const inputY = e.clientY - containerRect.top;
                      setGenInputScreenPos({ x: inputX, y: inputY });
                      setGenActivePage(1);
                      setGenEditActive(true);

                      // Focus the input after state update
                      setTimeout(() => genInputRef.current?.focus(), 50);
                    }}
                  />

                  {/* Transparent text input — placed at click position on PDF */}
                  {genEditActive && genInputScreenPos && (() => {
                    const fontCssMap: Record<string, string> = {
                      BiroScript: "'BiroScript', cursive",
                      IndieFlower: "'Indie Flower', cursive",
                      PatrickHand: "'Patrick Hand', cursive",
                      Kalam: "'Kalam', cursive",
                    };
                    const activeCss = fontCssMap[genFontFamily] ?? "'Indie Flower', cursive";
                    return (
                      <div style={{ position: 'absolute', left: genInputScreenPos.x, top: genInputScreenPos.y, zIndex: 20, userSelect: 'none' }}>
                        <input
                          ref={genInputRef}
                          type="text"
                          value={genDateOfReport}
                          onChange={e => setGenDateOfReport(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Escape') { setGenEditActive(false); }
                            if (e.key === 'Enter' && genDateOfReport.trim() && genClickX !== null && genClickY !== null) {
                              setGenTextItems(prev => [...prev, {
                                id: Date.now().toString(),
                                text: genDateOfReport.trim(),
                                pdfX: genClickX!, pdfY: genClickY!,
                                screenX: genInputScreenPos!.x, screenY: genInputScreenPos!.y,
                                fontSize: genFontSize, fontFamily: genFontFamily,
                                fontColor: genFontColor, fontBold: genFontBold,
                                pageIndex: genActivePage,
                              }]);
                              setGenEditActive(false);
                              setGenDateOfReport('');
                              setGenClickX(null);
                              setGenClickY(null);
                              setGenInputScreenPos(null);
                            }
                          }}
                          style={{
                            fontFamily: activeCss,
                            fontSize: `${genFontSize}px`,
                            fontWeight: genFontBold ? 700 : 400,
                            color: genFontColor,
                            background: 'rgba(173, 216, 230, 0.35)',
                            border: '1px dashed rgba(100,140,200,0.5)',
                            borderRadius: '2px',
                            outline: 'none',
                            padding: '0 4px',
                            minWidth: '120px',
                            lineHeight: '1.4',
                            caretColor: genFontColor,
                            textShadow: '0 0 3px rgba(255,255,255,0.8)',
                          }}
                          placeholder="type here…"
                          autoFocus
                        />
                      </div>
                    );
                  })()}

                  {/* Loading spinner */}
                  {!genCanvasDims && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-slate-500 text-sm">
                      <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading PDF…
                    </div>
                  )}

                  {/* Hint when PDF is loaded */}
                  {genCanvasDims && !genEditActive && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                      <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                        Page 1 — click to place text
                      </span>
                    </div>
                  )}
                </div>

                {/* Page 2 — clickable, independent text placement */}
                <div className={`relative w-full border-t border-slate-300 ${genPage2Loaded ? '' : 'hidden'}`}>
                  <div className="absolute top-1 left-2 z-10 bg-blue-700/80 text-white text-[10px] px-2 py-0.5 rounded">
                    Page 2 — click to place text
                  </div>
                  <div
                    ref={genCanvas2ContainerRef}
                    className="relative w-full"
                    style={{ cursor: genCanvas2Dims ? 'text' : 'default' }}
                  >
                    <canvas
                      ref={genCanvas2Ref}
                      className="w-full block"
                      onClick={(e) => {
                        const canvas = genCanvas2Ref.current;
                        const container = genCanvas2ContainerRef.current;
                        if (!canvas || !container || !genPdfDims2 || !genCanvas2Dims) return;

                        const canvasRect = canvas.getBoundingClientRect();
                        const containerRect = container.getBoundingClientRect();
                        const clickX = e.clientX - containerRect.left;
                        const clickY = e.clientY - containerRect.top;

                        const scaleX = genCanvas2Dims.w / canvasRect.width;
                        const scaleY = genCanvas2Dims.h / canvasRect.height;
                        const docScale = genPdfDims2.w / genCanvas2Dims.w;

                        setGenClickX(clickX * scaleX * docScale);
                        setGenClickY(genPdfDims2.h - clickY * scaleY * docScale);
                        setGenInputScreenPos({ x: clickX, y: clickY });
                        setGenActivePage(2);
                        setGenEditActive(true);
                        setGenDateOfReport('');
                        setTimeout(() => genInput2Ref.current?.focus(), 50);
                      }}
                    />
                    {/* Transparent input on page 2 canvas */}
                    {genEditActive && genActivePage === 2 && genInputScreenPos && (() => {
                      const fontCssMap2: Record<string, string> = {
                        BiroScript: "'BiroScript', cursive",
                        IndieFlower: "'Indie Flower', cursive",
                        PatrickHand: "'Patrick Hand', cursive",
                        Kalam: "'Kalam', cursive",
                      };
                      const activeCss2 = fontCssMap2[genFontFamily] ?? "'Indie Flower', cursive";
                      return (
                        <div style={{ position: 'absolute', left: genInputScreenPos.x, top: genInputScreenPos.y, zIndex: 20, userSelect: 'none' }}>
                          <input
                            ref={genInput2Ref}
                            type="text"
                            value={genDateOfReport}
                            onChange={e => setGenDateOfReport(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Escape') { setGenEditActive(false); }
                              if (e.key === 'Enter' && genDateOfReport.trim() && genClickX !== null && genClickY !== null) {
                                setGenTextItems(prev => [...prev, {
                                  id: Date.now().toString(),
                                  text: genDateOfReport.trim(),
                                  pdfX: genClickX!, pdfY: genClickY!,
                                  screenX: genInputScreenPos!.x, screenY: genInputScreenPos!.y,
                                  fontSize: genFontSize, fontFamily: genFontFamily,
                                  fontColor: genFontColor, fontBold: genFontBold,
                                  pageIndex: 2,
                                }]);
                                setGenEditActive(false);
                                setGenDateOfReport('');
                                setGenClickX(null);
                                setGenClickY(null);
                                setGenInputScreenPos(null);
                              }
                            }}
                            style={{
                              fontFamily: activeCss2,
                              fontSize: `${genFontSize}px`,
                              fontWeight: genFontBold ? 700 : 400,
                              color: genFontColor,
                              background: 'rgba(173, 216, 230, 0.35)',
                              border: '1px dashed rgba(100,140,200,0.5)',
                              borderRadius: '2px',
                              outline: 'none',
                              padding: '0 4px',
                              minWidth: '120px',
                              lineHeight: '1.4',
                              caretColor: genFontColor,
                              textShadow: '0 0 3px rgba(255,255,255,0.8)',
                            }}
                            placeholder="type here…"
                            autoFocus
                          />
                        </div>
                      );
                    })()}
                    {genCanvas2Dims && !genEditActive && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                        <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                          Page 2 — click to place text
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Placed text items list */}
            {genTextItems.length > 0 && (
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 space-y-2">
                <p className="text-xs text-slate-400 font-medium">Placed text ({genTextItems.length} item{genTextItems.length !== 1 ? 's' : ''}) — click Save to apply all:</p>
                {genTextItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 bg-slate-700/50 rounded px-3 py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-500 text-xs shrink-0">#{idx + 1}</span>
                      <span className={`text-[9px] px-1 py-0.5 rounded shrink-0 ${item.pageIndex === 2 ? 'bg-blue-700 text-blue-100' : 'bg-slate-600 text-slate-300'}`}>P{item.pageIndex}</span>
                      <span style={{ fontFamily: item.fontFamily === 'BiroScript' ? "'BiroScript', cursive" : item.fontFamily === 'IndieFlower' ? "'Indie Flower', cursive" : item.fontFamily === 'PatrickHand' ? "'Patrick Hand', cursive" : "'Kalam', cursive", color: item.fontColor, fontSize: '14px', fontWeight: item.fontBold ? 700 : 400 }} className="truncate">{item.text}</span>
                    </div>
                    <button type="button" onClick={() => setGenTextItems(prev => prev.filter(i => i.id !== item.id))}
                      className="text-red-400 hover:text-red-300 text-xs shrink-0 px-1">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-700">
              <Button type="button" variant="outline"
                onClick={() => setShowGenerateReportDialog(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline"
                  onClick={handlePreviewGeneratedReport}
                  disabled={isGeneratingPreview || !genPremises || !genDateOfReport || genClickX === null}
                  className="border-green-600 text-green-400 hover:bg-green-600/10">
                  {isGeneratingPreview
                    ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Loading…</>
                    : <><Eye className="h-4 w-4 mr-2" />Preview Result</>}
                </Button>
                <Button type="button"
                  onClick={() => {
                    const allItems = [
                      ...(genClickX !== null && genClickY !== null && genDateOfReport ? [{
                        text: genDateOfReport, pdfX: genClickX, pdfY: genClickY,
                        fontSize: genFontSize, fontFamily: genFontFamily, fontColor: genFontColor, fontBold: genFontBold,
                      }] : []),
                      ...genTextItems.map(it => ({ text: it.text, pdfX: it.pdfX, pdfY: it.pdfY, fontSize: it.fontSize, fontFamily: it.fontFamily, fontColor: it.fontColor, fontBold: it.fontBold, pageIndex: it.pageIndex })),
                    ];
                    if (allItems.length === 0) return;
                    const primary = allItems[0];
                    generateReportMutation.mutate({
                      baseReportId: genPremises, newDate: primary.text, newTitle: '',
                      fontSize: primary.fontSize, fontFamily: primary.fontFamily,
                      fontColor: primary.fontColor, fontBold: primary.fontBold,
                      dateX: primary.pdfX, dateY: primary.pdfY,
                      extraItems: allItems.slice(1),
                    } as any);
                  }}
                  disabled={generateReportMutation.isPending || !genPremises || (genTextItems.length === 0 && (genClickX === null || !genDateOfReport))}
                  className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-lg">
                  {generateReportMutation.isPending
                    ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                    : <><FileText className="h-4 w-4 mr-2" />Save New Report</>}
                </Button>
              </div>
            </div>

            {/* Preview */}
            {genPreviewUrl && (
              <div className="rounded-xl border border-green-500/30 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-green-900/20">
                  <p className="text-xs text-green-400">Preview — scroll to check date placement</p>
                  <button
                    type="button"
                    onClick={() => { URL.revokeObjectURL(genPreviewUrl); setGenPreviewUrl(null); }}
                    className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-slate-700 transition-colors"
                  >✕ Close Preview</button>
                </div>
                <iframe
                  src={genPreviewUrl}
                  className="w-full border-0"
                  style={{ height: '420px' }}
                  title="Report Preview"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Monthly Report Upload Dialog */}
      <Dialog open={showMonthlyReportDialog} onOpenChange={setShowMonthlyReportDialog}>
        <DialogContent className="bg-slate-800 text-white border-slate-700 w-[calc(100vw-1rem)] sm:max-w-xl max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain !top-2 !translate-y-0 p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle className="text-purple-400 text-xl font-bold flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span>Upload Monthly Report</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Upload A4 or A5 PDF reports for branches. Supports PDF, PNG, JPG, GIF, and SVG formats.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Report Title</label>
                <Input
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Enter report title..."
                  className="bg-slate-900 border-slate-600 text-white placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-600">
                      <SelectItem value="coshh-risk-assessment" className="text-white hover:bg-slate-700 focus:bg-slate-700">COSHH/Risk Assessment</SelectItem>
                      <SelectItem value="inspection-report" className="text-white hover:bg-slate-700 focus:bg-slate-700">Inspection Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">View Size</label>
                  <Select value={reportViewSize} onValueChange={setReportViewSize}>
                    <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-600">
                      <SelectItem value="A4" className="text-white hover:bg-slate-700 focus:bg-slate-700">A4</SelectItem>
                      <SelectItem value="A5" className="text-white hover:bg-slate-700 focus:bg-slate-700">A5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Upload File</label>
                <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.svg"
                    onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="report-upload"
                  />
                  <label htmlFor="report-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400 mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-slate-500">PDF, PNG, JPG, GIF, SVG up to 10MB</p>
                  </label>
                  {reportFile && (
                    <div className="mt-4 p-3 bg-slate-700 rounded-lg">
                      <p className="text-white font-medium">{reportFile.name}</p>
                      <p className="text-sm text-slate-400">{(reportFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowMonthlyReportDialog(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  if (reportFile && reportTitle) {
                    uploadReportMutation.mutate({
                      file: reportFile,
                      title: reportTitle,
                      reportType,
                      viewSize: reportViewSize
                    });
                  }
                }}
                disabled={uploadReportMutation.isPending || !reportFile || !reportTitle}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
              >
                {uploadReportMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Monthly Report Edit Dialog */}
      <Dialog open={showReportEditDialog} onOpenChange={setShowReportEditDialog}>
        <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-blue-400 text-xl font-bold flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <FileEdit className="h-5 w-5 text-white" />
              </div>
              <span>Edit Monthly Report</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Update report details and settings
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Report Title</label>
                  <Input
                    defaultValue={selectedReport.title}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Enter report title..."
                    className="bg-slate-900 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Report Type</label>
                    <Select defaultValue={selectedReport.reportType} onValueChange={setReportType}>
                      <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-600">
                        <SelectItem value="coshh-risk-assessment" className="text-white hover:bg-slate-700 focus:bg-slate-700">COSHH/Risk Assessment</SelectItem>
                        <SelectItem value="inspection-report" className="text-white hover:bg-slate-700 focus:bg-slate-700">Inspection Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">View Size</label>
                    <Select defaultValue={selectedReport.viewSize || "A4"} onValueChange={setReportViewSize}>
                      <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-600">
                        <SelectItem value="A4" className="text-white hover:bg-slate-700 focus:bg-slate-700">A4</SelectItem>
                        <SelectItem value="A5" className="text-white hover:bg-slate-700 focus:bg-slate-700">A5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-red-400" />
                      <div>
                        <p className="text-white font-medium">{selectedReport.filename}</p>
                        <p className="text-sm text-slate-400">
                          {selectedReport.fileSize ? `${(selectedReport.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                        </p>
                      </div>
                    </div>
                    {selectedReport.filename.toLowerCase().endsWith('.png') && (
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleViewPDF({
                              ...selectedReport,
                              type: 'monthly-reports'
                            });
                          }}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Embedded
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/api/monthly-reports/${selectedReport.id}/view`, '_blank')}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          New Tab
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedImage({
                              id: selectedReport.id,
                              title: selectedReport.title,
                              filename: selectedReport.filename,
                              filepath: `/api/monthly-reports/${selectedReport.id}/view`,
                              type: 'monthly-report'
                            });
                            setShowReportEditDialog(false);
                            setShowImageEditor(true);
                          }}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit PNG
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {selectedReport.filename.toLowerCase().endsWith('.png') && (
                    <div className="mt-4 rounded-lg overflow-hidden bg-white/5 border border-slate-600">
                      <img 
                        src={`/api/monthly-reports/${selectedReport.id}/view`}
                        alt={selectedReport.title}
                        className="w-full h-auto max-h-64 object-contain"
                        style={{ imageRendering: 'crisp-edges' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-700">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowReportEditDialog(false);
                    setSelectedReport(null);
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    if (selectedReport) {
                      updateReportMutation.mutate({
                        reportId: selectedReport.id,
                        title: reportTitle || selectedReport.title,
                        reportType: reportType || selectedReport.reportType,
                        viewSize: reportViewSize || selectedReport.viewSize || "A4"
                      });
                    }
                  }}
                  disabled={updateReportMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
                >
                  {updateReportMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FileEdit className="h-4 w-4 mr-2" />
                      Update Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Send Dialog */}
      <Dialog open={showReportSendDialog} onOpenChange={setShowReportSendDialog}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-orange-400 text-xl font-bold flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <Send className="h-5 w-5 text-white" />
              </div>
              <span>Send Report to Branch</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Select a branch to send this monthly report to.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedReport && (
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                <h4 className="font-semibold text-white mb-2">{selectedReport.title}</h4>
                <p className="text-sm text-slate-400">{selectedReport.reportType}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Select Branch</label>
              <Select value={selectedBranchForReport} onValueChange={setSelectedBranchForReport}>
                <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                  <SelectValue placeholder="Choose a branch..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-600">
                  {branches.map((branch: Branch) => (
                    <SelectItem key={branch.id} value={branch.id} className="text-white hover:bg-slate-700 focus:bg-slate-700">
                      <span className="text-white">{branch.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowReportSendDialog(false);
                  setSelectedBranchForReport("");
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  if (selectedReport && selectedBranchForReport) {
                    sendReportToBranchMutation.mutate({
                      reportId: selectedReport.id,
                      branchId: selectedBranchForReport
                    });
                  }
                }}
                disabled={sendReportToBranchMutation.isPending || !selectedBranchForReport}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg"
              >
                {sendReportToBranchMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Delete Confirmation Dialog */}
      <Dialog open={showReportDeleteDialog} onOpenChange={setShowReportDeleteDialog}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-red-400 text-xl font-bold flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <span>Delete Monthly Report</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              This will remove the report from Monthly Reports section only. The document will remain in My Docs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reportToDelete && (
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                <h4 className="font-semibold text-white mb-2">{reportToDelete.title}</h4>
                <p className="text-sm text-slate-400">{reportToDelete.reportType}</p>
                <p className="text-sm text-slate-500">Created: {new Date(reportToDelete.createdAt).toLocaleDateString()}</p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowReportDeleteDialog(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  if (reportToDelete) {
                    deleteReportMutation.mutate(reportToDelete.id);
                    setShowReportDeleteDialog(false);
                    setReportToDelete(null);
                  }
                }}
                disabled={deleteReportMutation.isPending}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
              >
                {deleteReportMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report View Dialog */}
      <Dialog open={showReportViewDialog} onOpenChange={setShowReportViewDialog}>
        <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-purple-400 text-xl font-bold flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <span>View Monthly Report</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const currentIndex = monthlyReports.findIndex(r => r.id === selectedReport?.id);
                    if (currentIndex > 0) {
                      setSelectedReport(monthlyReports[currentIndex - 1]);
                    }
                  }}
                  disabled={!selectedReport || monthlyReports.findIndex(r => r.id === selectedReport.id) === 0}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  ←
                  Previous
                </Button>
                <span className="text-sm text-slate-400">
                  {selectedReport ? monthlyReports.findIndex(r => r.id === selectedReport.id) + 1 : 0} of {monthlyReports.length}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const currentIndex = monthlyReports.findIndex(r => r.id === selectedReport?.id);
                    if (currentIndex < monthlyReports.length - 1) {
                      setSelectedReport(monthlyReports[currentIndex + 1]);
                    }
                  }}
                  disabled={!selectedReport || monthlyReports.findIndex(r => r.id === selectedReport.id) === monthlyReports.length - 1}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Next
                  →
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedReport && (
              <>
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white text-lg">{selectedReport.title}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${
                        selectedReport.branchId ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'
                      } text-white text-xs px-3 py-1 rounded-full shadow-lg`}>
                        {selectedReport.branchId ? 'Sent' : 'Draft'}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => handleViewPDF({
                          ...selectedReport,
                          type: 'monthly-reports'
                        })}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View PDF
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedReport.filepath;
                          link.download = selectedReport.filename;
                          link.click();
                        }}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Type:</span>
                      <span className="text-white ml-2">{selectedReport.reportType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">View Size:</span>
                      <span className="text-white ml-2">{selectedReport.viewSize || 'A4'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Created:</span>
                      <span className="text-white ml-2">{new Date(selectedReport.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">File Size:</span>
                      <span className="text-white ml-2">
                        {selectedReport.fileSize ? `${(selectedReport.fileSize / 1024 / 1024).toFixed(1)} MB` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  {selectedReport.branchId && (
                    <div className="mt-2 text-sm">
                      <span className="text-slate-400">Sent to:</span>
                      <span className="text-blue-400 ml-2">
                        {branches.find((b: Branch) => b.id === selectedReport.branchId)?.name || 'Unknown Branch'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 rounded-xl p-4 min-h-[600px] border border-slate-700/50">
                  {selectedReport.mimeType?.startsWith('image/') ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <img 
                        src={selectedReport.filepath} 
                        alt={selectedReport.title}
                        className="max-w-full max-h-[580px] object-contain rounded-lg shadow-2xl"
                      />
                    </div>
                  ) : selectedReport.mimeType === 'application/pdf' ? (
                    <div className="w-full h-full flex flex-col">
                      <div className="flex-1 bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden relative">
                        <div className="w-full h-[580px] bg-slate-900 rounded-lg flex items-center justify-center">
                          <div className="text-center p-8">
                            <FileText className="h-20 w-20 text-red-400 mx-auto mb-6" />
                            <h3 className="text-xl font-semibold text-white mb-3">{selectedReport.title}</h3>
                            <p className="text-slate-400 mb-2">{selectedReport.reportType} Document</p>
                            <p className="text-slate-500 text-sm mb-6">
                              Size: {selectedReport.viewSize} | Created: {new Date(selectedReport.createdAt).toLocaleDateString()}
                            </p>
                            <div className="bg-slate-800/80 rounded-lg p-4 mb-6 border border-slate-700">
                              <p className="text-slate-300 text-sm mb-3">
                                This PDF document is ready to view. Click the button below to open it in a new tab for the best viewing experience.
                              </p>
                              <div className="flex items-center justify-center text-xs text-slate-500">
                                <FileText className="h-3 w-3 mr-1" />
                                PDF files display best in dedicated browser tabs
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-center space-x-3">
                        <Button
                          size="sm"
                          onClick={() => handleViewPDF({
                            ...selectedReport,
                            type: 'monthly-reports'
                          })}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View PDF
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = selectedReport.filepath;
                            link.download = selectedReport.filename;
                            link.click();
                          }}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <FileText className="h-20 w-20 text-slate-400 mx-auto mb-6" />
                      <h3 className="text-xl font-semibold text-white mb-2">{selectedReport.title}</h3>
                      <p className="text-slate-400 mb-6">Preview not available for this file type</p>
                      <div className="space-y-3">
                        <Button
                          onClick={() => handleViewPDF({
                            ...selectedReport,
                            type: 'monthly-reports'
                          })}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Embedded
                        </Button>
                        <Button
                          onClick={() => window.open(`/api/monthly-reports/${selectedReport.id}/view`, '_blank')}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 w-full"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                        <Button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = selectedReport.filepath;
                            link.download = selectedReport.filename;
                            link.click();
                          }}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download File
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center space-x-4 pt-4 border-t border-slate-700">
                  <Button
                    onClick={() => {
                      setShowReportViewDialog(false);
                      setSelectedReport(selectedReport);
                      setShowReportEditDialog(true);
                    }}
                    className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 text-blue-300 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300"
                  >
                    <FileEdit className="h-4 w-4 mr-2" />
                    Edit Report
                  </Button>
                  <Button
                    onClick={() => {
                      setShowReportViewDialog(false);
                      setSelectedReport(selectedReport);
                      setShowReportSendDialog(true);
                    }}
                    className="bg-gradient-to-r from-orange-600/20 to-yellow-600/20 hover:from-orange-600/30 hover:to-yellow-600/30 text-orange-300 border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send to Branch
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedReport) {
                        sendToMyDocsMutation.mutate(selectedReport.id);
                      }
                    }}
                    disabled={sendToMyDocsMutation.isPending}
                    className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 text-purple-300 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300"
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Send to My Docs
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedReport) deleteReportMutation.mutate(selectedReport.id);
                      setShowReportViewDialog(false);
                    }}
                    disabled={deleteReportMutation.isPending}
                    className="bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-600/30 hover:to-red-700/30 text-red-300 border border-red-500/30 hover:border-red-400/50 transition-all duration-300"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Report
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>




      {/* Pest Control Document Upload Dialog */}
      <Dialog open={showPestControlDocDialog} onOpenChange={setShowPestControlDocDialog}>
        <DialogContent className="bg-slate-800 text-white border-slate-700 w-[calc(100vw-1.5rem)] sm:max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 flex-shrink-0">
            <DialogTitle className="text-orange-400 text-xl font-bold flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span>Upload Pest Control Document</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Upload treatment plans, certificates, and inspection reports
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Document Title</label>
                <Input
                  value={pestControlDocTitle}
                  onChange={(e) => setPestControlDocTitle(e.target.value)}
                  placeholder="Enter document title..."
                  className="bg-slate-900 border-slate-600 text-white placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">View Size</label>
                <Select value={pestControlDocViewSize} onValueChange={setPestControlDocViewSize}>
                  <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-600 z-[100] max-h-60">
                    <SelectItem value="A4" className="text-white hover:bg-slate-700 focus:bg-slate-700">A4 (210×297mm)</SelectItem>
                    <SelectItem value="A5" className="text-white hover:bg-slate-700 focus:bg-slate-700">A5 (148×210mm)</SelectItem>
                    <SelectItem value="A3" className="text-white hover:bg-slate-700 focus:bg-slate-700">A3 (297×420mm)</SelectItem>
                    <SelectItem value="Letter" className="text-white hover:bg-slate-700 focus:bg-slate-700">Letter (216×279mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Issue Date</label>
                  <Input
                    type="date"
                    value={pestControlDocIssueDate}
                    onChange={(e) => setPestControlDocIssueDate(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Expiry Date</label>
                  <Input
                    type="date"
                    value={pestControlDocExpiryDate}
                    onChange={(e) => setPestControlDocExpiryDate(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Upload File</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full min-h-24 sm:min-h-28 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700/30 hover:bg-slate-700/50 px-3">
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <Upload className="w-8 h-8 mb-4 text-slate-400" />
                      <p className="mb-2 text-sm text-slate-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-500">PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF, SVG files - Max 50MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.svg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPestControlDocFile(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {pestControlDocFile && (
                  <div className="mt-2 p-2.5 bg-slate-700/50 rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-orange-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{pestControlDocFile.name}</p>
                        <p className="text-xs text-slate-400">
                          {(pestControlDocFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowPestControlDocDialog(false);
                  setPestControlDocFile(null);
                  setPestControlDocTitle("");
                  setPestControlDocDescription("");
                  setPestControlDocIssueDate("");
                  setPestControlDocExpiryDate("");
                  setPestControlDocViewSize("A4");
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  if (pestControlDocFile && pestControlDocTitle) {
                    createPestControlDocMutation.mutate({
                      file: pestControlDocFile,
                      fileData: {
                        title: pestControlDocTitle,
                        viewSize: pestControlDocViewSize,
                        issueDate: pestControlDocIssueDate,
                        expiryDate: pestControlDocExpiryDate,
                        description: pestControlDocDescription
                      }
                    });
                  }
                }}
                disabled={!pestControlDocFile || !pestControlDocTitle || createPestControlDocMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {createPestControlDocMutation.isPending ? "Uploading..." : "Upload Document"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pest Control Document Send Dialog */}
      <Dialog open={showPestControlDocSendDialog} onOpenChange={setShowPestControlDocSendDialog}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-green-400 text-xl font-bold flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Send className="h-5 w-5 text-white" />
              </div>
              <span>Send Pest Control Document</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Send this document to a specific branch
            </DialogDescription>
          </DialogHeader>

          {selectedPestControlDoc && (
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="font-medium text-white">{selectedPestControlDoc.title}</h4>
                <p className="text-sm text-slate-400">
                  {selectedPestControlDoc.docType === 'treatment-plan' ? 'Treatment Plan' :
                   selectedPestControlDoc.docType === 'inspection-certificate' ? 'Inspection Certificate' :
                   selectedPestControlDoc.docType === 'compliance-report' ? 'Compliance Report' :
                   selectedPestControlDoc.docType === 'safety-assessment' ? 'Safety Assessment' :
                   selectedPestControlDoc.docType}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Branch</label>
                <Select onValueChange={setSelectedBranchForReport}>
                  <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                    <SelectValue placeholder="Choose a branch..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-600">
                    {branches.map((branch: Branch) => (
                      <SelectItem key={branch.id} value={branch.id} className="text-white hover:bg-slate-700 focus:bg-slate-700">
                        <span className="text-white">{branch.name} - {branch.address}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPestControlDocSendDialog(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedBranchForReport) {
                      sendPestControlDocToBranchMutation.mutate({
                        docId: selectedPestControlDoc.id,
                        branchId: selectedBranchForReport
                      });
                    }
                  }}
                  disabled={!selectedBranchForReport || sendPestControlDocToBranchMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {sendPestControlDocToBranchMutation.isPending ? "Sending..." : "Send Document"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pest Control Document Delete Dialog */}
      <Dialog open={showPestControlDocDeleteDialog} onOpenChange={setShowPestControlDocDeleteDialog}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-red-400 text-xl font-bold flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-white" />
              </div>
              <span>Delete Pest Control Document</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              This action cannot be undone. This will permanently delete the document.
            </DialogDescription>
          </DialogHeader>

          {pestControlDocToDelete && (
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="font-medium text-white">{pestControlDocToDelete.title}</h4>
                <p className="text-sm text-slate-400">{pestControlDocToDelete.filename}</p>
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPestControlDocDeleteDialog(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    deletePestControlDocMutation.mutate(pestControlDocToDelete.id);
                  }}
                  disabled={deletePestControlDocMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deletePestControlDocMutation.isPending ? "Deleting..." : "Delete Document"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pest Control Document View Dialog */}
      <Dialog open={showPestControlDocViewDialog} onOpenChange={setShowPestControlDocViewDialog}>
        <DialogContent className="max-w-6xl h-[85vh] bg-slate-900 border-slate-700 p-0">
          <DialogHeader className="p-6 pb-4 border-b border-slate-700">
            <DialogTitle className="text-white text-xl font-bold flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span>{selectedPestControlDoc?.title}</span>
                  <p className="text-sm text-slate-400 font-normal">
                    {selectedPestControlDoc?.docType === 'treatment-plan' ? 'Treatment Plan' :
                     selectedPestControlDoc?.docType === 'inspection-certificate' ? 'Inspection Certificate' :
                     selectedPestControlDoc?.docType === 'compliance-report' ? 'Compliance Report' :
                     selectedPestControlDoc?.docType === 'safety-assessment' ? 'Safety Assessment' :
                     selectedPestControlDoc?.docType} • {selectedPestControlDoc?.viewSize} Size
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPestControlDocViewDialog(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-6">
            {selectedPestControlDoc && (
              <div className="w-full h-full flex justify-center items-center bg-slate-900">
                <div 
                  className={`
                    rounded-lg shadow-2xl overflow-hidden
                    ${selectedPestControlDoc.viewSize === 'A5' ? 'w-full max-w-[420px] aspect-[148/210]' :
                      selectedPestControlDoc.viewSize === 'A3' ? 'w-full max-w-[900px] aspect-[297/420]' :
                      selectedPestControlDoc.viewSize === 'Letter' ? 'w-full max-w-[650px] aspect-[216/279]' :
                      'w-full max-w-[600px] aspect-[210/297]'} // A4 default
                  `}
                  style={{ 
                    maxHeight: 'calc(100vh - 200px)',
                    maxWidth: '90vw'
                  }}
                >
                  {selectedPestControlDoc.mimeType?.startsWith('image/') ? (
                    <img
                      src={`/api/pest-control-docs/${selectedPestControlDoc.id}/view`}
                      alt={selectedPestControlDoc.title}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-800 rounded-lg p-6">
                      <FileText className="h-16 w-16 text-slate-400" />
                      <p className="text-slate-300 text-sm text-center">{selectedPestControlDoc.title}</p>
                      <Button
                        onClick={() => window.open(`/api/pest-control-docs/${selectedPestControlDoc.id}/view`, '_blank')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Open Document
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Delete Confirmation Dialog */}
      <Dialog open={showPhotoDeleteDialog} onOpenChange={setShowPhotoDeleteDialog}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-red-400 text-xl font-bold flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-white" />
              </div>
              <span>Delete Photo Permanently?</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              This action cannot be undone
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-slate-300">
              This will permanently delete this photo and remove it from all branches. 
              The photo file will be completely removed from the system.
            </p>
            
            {photoToDelete && (
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
                    {photoToDelete.filepath ? (
                      <img 
                        src={photoToDelete.filepath} 
                        alt={photoToDelete.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{photoToDelete.title}</h4>
                    <p className="text-sm text-slate-400 capitalize">{photoToDelete.type} photo</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowPhotoDeleteDialog(false);
                setPhotoToDelete(null);
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={confirmDeletePhoto}
              disabled={deletePhotoMutation.isPending}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
            >
              {deletePhotoMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Photo
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>




      {/* PIN Entry Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Lock className="h-5 w-5 mr-2 text-yellow-400" />
              Admin Security
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Enter your PIN to access admin settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">PIN</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white font-mono text-lg tracking-widest"
                  placeholder="Enter your PIN"
                  maxLength={14}
                  onKeyPress={async (e) => {
                    if (e.key === 'Enter') {
                      try {
                        // Use local PIN verification for reliability
                        const isRegularPin = pinInput === "11223344";
                        const isMasterPin = pinInput === "smrptt77";
                        const isTemporaryPin = pinInput === "11111111";
                        
                        if (isRegularPin || isMasterPin || isTemporaryPin) {
                          setShowPinDialog(false);
                          setShowAdminSettings(true);
                          setPinInput("");
                          toast({
                            title: "Access Granted",
                            description: "Welcome to admin settings",
                          });
                          return;
                        }
                        toast({
                          title: "Access Denied",
                          description: "Incorrect PIN",
                          variant: "destructive",
                        });
                        setPinInput("");
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to verify PIN",
                          variant: "destructive",
                        });
                        setPinInput("");
                      }
                    }
                  }}
                />
                {pinInput && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <div className="text-xs text-slate-400">
                      {pinInput.length}/14
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enter your secure PIN to access admin settings
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPinDialog(false);
                  setPinInput("");
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (pinInput === currentSidebarPin) {
                    setShowPinDialog(false);
                    setShowAdminSettings(true);
                    setPinInput("");
                    toast({
                      title: "Access Granted",
                      description: "Welcome to admin settings",
                    });
                  } else {
                    toast({
                      title: "Access Denied",
                      description: "Incorrect PIN",
                      variant: "destructive",
                    });
                    setPinInput("");
                  }
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Lock className="h-4 w-4 mr-2" />
                Unlock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Settings Dialog */}
      <Dialog open={showAdminSettings} onOpenChange={setShowAdminSettings}>
        <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700 max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-400" />
              Admin Settings
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Configure admin account settings
            </DialogDescription>
          </DialogHeader>
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 max-h-[60vh]">
            {/* Admin Email */}
            <div>
              <Label className="text-slate-300">Admin Email</Label>
              <Input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white mt-2"
                placeholder="admin@pestcontrol.com"
              />
            </div>

            {/* Admin Password */}
            <div>
              <Label className="text-slate-300">New Admin Password</Label>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white mt-2"
                placeholder="Enter new password"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <Label className="text-slate-300">Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white mt-2"
                placeholder="Confirm new password"
              />
            </div>

            {/* Separator */}
            <div className="border-t border-slate-700 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-yellow-400" />
                  Sidebar Access PIN
                </h4>
                {/* Master Lock/Unlock Toggle Button */}
                <Button
                  onClick={handleMasterLockToggle}
                  className={`
                    ${masterLockEnabled 
                      ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600" 
                      : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    } text-white font-medium px-4 py-2 text-sm
                  `}
                >
                  {masterLockEnabled ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Unlock All
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Lock All
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Use the "Unlock All" button to instantly unlock all sidebar sections for office efficiency. Click "Lock All" to re-enable all PIN protections.
              </p>
            </div>

            {/* Current PIN Display */}
            <div>
              <Label className="text-slate-300">Current Sidebar PIN</Label>
              <div className="bg-slate-700/50 border border-slate-600 rounded-md p-3 mt-2 text-slate-400 text-sm">
                ••••••••••••• (Hidden for security)
              </div>
            </div>

            {/* New PIN */}
            <div>
              <Label className="text-slate-300">New Sidebar PIN</Label>
              <Input
                type="password"
                value={newSidebarPin}
                onChange={(e) => setNewSidebarPin(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white mt-2"
                placeholder="Enter new PIN for sidebar access"
              />
              <p className="text-xs text-slate-500 mt-1">
                This PIN is used to access settings sections in the sidebar
              </p>
            </div>

            {/* Confirm New PIN */}
            <div>
              <Label className="text-slate-300">Confirm New Sidebar PIN</Label>
              <Input
                type="password"
                value={confirmSidebarPin}
                onChange={(e) => setConfirmSidebarPin(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white mt-2"
                placeholder="Confirm new sidebar PIN"
              />
            </div>
          </div>
            
          {/* Action Buttons - Fixed at bottom */}
          <div className="flex justify-between pt-4 border-t border-slate-700 flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={handleAdminLogout}
              className="border-red-500 text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAdminSettings(false);
                  setAdminPassword("");
                  setConfirmPassword("");
                  setNewSidebarPin("");
                  setConfirmSidebarPin("");
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  // Validate admin password
                  if (adminPassword && adminPassword !== confirmPassword) {
                    toast({
                      title: "Password Mismatch",
                      description: "Admin passwords do not match",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  // Validate sidebar PIN
                  if (newSidebarPin && newSidebarPin !== confirmSidebarPin) {
                    toast({
                      title: "PIN Mismatch",
                      description: "Sidebar PINs do not match",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  let credentialsUpdated = false;
                  let pinUpdated = false;
                  
                  // Update admin credentials if provided
                  if (adminEmail && adminPassword) {
                    try {
                      const response = await fetch('/api/admin/update-credentials', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          email: adminEmail, 
                          password: adminPassword 
                        }),
                      });
                      
                      if (response.ok) {
                        credentialsUpdated = true;
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to update admin credentials",
                        variant: "destructive",
                      });
                      return;
                    }
                  }
                    
                    // Update sidebar PIN if provided
                    if (newSidebarPin) {
                      try {
                        const response = await fetch('/api/admin/update-sidebar-pin', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            pin: newSidebarPin 
                          }),
                        });
                        
                        if (response.ok) {
                          pinUpdated = true;
                          // Update the current PIN state
                          setCurrentSidebarPin(newSidebarPin);
                        }
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to update sidebar PIN",
                          variant: "destructive",
                        });
                        return;
                      }
                    }
                    
                    // Show success message
                    if (credentialsUpdated && pinUpdated) {
                      toast({
                        title: "Settings Saved",
                        description: "Admin credentials and sidebar PIN updated successfully",
                      });
                    } else if (credentialsUpdated) {
                      toast({
                        title: "Settings Saved",
                        description: "Admin credentials updated successfully",
                      });
                    } else if (pinUpdated) {
                      toast({
                        title: "Settings Saved",
                        description: "Sidebar PIN updated successfully",
                      });
                    } else {
                      toast({
                        title: "No Changes",
                        description: "Please enter information to update",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    // Reset form
                    setShowAdminSettings(false);
                    setAdminEmail("");
                    setAdminPassword("");
                    setConfirmPassword("");
                    setNewSidebarPin("");
                    setConfirmSidebarPin("");
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Site Settings PIN Dialog */}
      <Dialog open={showSiteSettingsPinDialog} onOpenChange={setShowSiteSettingsPinDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Lock className="h-5 w-5 mr-2 text-yellow-400" />
              Site Settings Security
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Enter your PIN to access site configuration settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">PIN</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={siteSettingsPinInput}
                  onChange={(e) => setSiteSettingsPinInput(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white font-mono text-lg tracking-widest"
                  placeholder="Enter your PIN"
                  maxLength={14}
                  onKeyPress={async (e) => {
                    if (e.key === 'Enter') {
                      try {
                        const isRegularPin = siteSettingsPinInput === "11223344";
                        const isMasterPin = siteSettingsPinInput === "smrptt77";
                        const isTemporaryPin = siteSettingsPinInput === "11111111";
                        
                        if (isRegularPin || isMasterPin || isTemporaryPin) {
                          setShowSiteSettingsPinDialog(false);
                          setSiteSettingsUnlocked(true);
                          setActiveTab("site-settings");
                          setSiteSettingsPinInput("");
                          toast({
                            title: "Site Settings Unlocked",
                            description: "You now have access to site configuration",
                          });
                        } else {
                          toast({
                            title: "Access Denied",
                            description: "Incorrect PIN for site settings",
                            variant: "destructive",
                          });
                          setSiteSettingsPinInput("");
                        }
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to verify PIN",
                          variant: "destructive",
                        });
                        setSiteSettingsPinInput("");
                      }
                    }
                  }}
                />
                {siteSettingsPinInput && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <div className="text-xs text-slate-400">
                      {siteSettingsPinInput.length}/14
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                This protects your site configuration from unauthorized changes
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSiteSettingsPinDialog(false);
                  setSiteSettingsPinInput("");
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (siteSettingsPinInput === currentSidebarPin) {
                    setShowSiteSettingsPinDialog(false);
                    setSiteSettingsUnlocked(true);
                    setActiveTab("site-settings");
                    setSiteSettingsPinInput("");
                    toast({
                      title: "Site Settings Unlocked",
                      description: "You now have access to site configuration",
                    });
                  } else {
                    toast({
                      title: "Access Denied",
                      description: "Incorrect PIN for site settings",
                      variant: "destructive",
                    });
                    setSiteSettingsPinInput("");
                  }
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Lock className="h-4 w-4 mr-2" />
                Unlock Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Tracker PIN Dialog */}
      <Dialog open={showPaymentTrackerPinDialog} onOpenChange={setShowPaymentTrackerPinDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Lock className="h-5 w-5 mr-2 text-yellow-400" />
              Payment Tracker Security
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Enter your PIN to access financial data and payment records
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">PIN</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={paymentTrackerPinInput}
                  onChange={(e) => setPaymentTrackerPinInput(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white font-mono text-lg tracking-widest"
                  placeholder="Enter your PIN"
                  maxLength={14}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (paymentTrackerPinInput === currentSidebarPin) {
                        setShowPaymentTrackerPinDialog(false);
                        setPaymentTrackerUnlocked(true);
                        setActiveTab("payment-tracker");
                        setPaymentTrackerPinInput("");
                        toast({
                          title: "Payment Tracker Unlocked",
                          description: "You now have access to financial data",
                        });
                      } else {
                        toast({
                          title: "Access Denied",
                          description: "Incorrect PIN for payment tracker",
                          variant: "destructive",
                        });
                        setPaymentTrackerPinInput("");
                      }
                    }
                  }}
                />
                {paymentTrackerPinInput && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <div className="text-xs text-slate-400">
                      {paymentTrackerPinInput.length}/14
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                This protects sensitive financial information from unauthorized access
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPaymentTrackerPinDialog(false);
                  setPaymentTrackerPinInput("");
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (paymentTrackerPinInput === currentSidebarPin) {
                    setShowPaymentTrackerPinDialog(false);
                    setPaymentTrackerUnlocked(true);
                    setActiveTab("payment-tracker");
                    setPaymentTrackerPinInput("");
                    toast({
                      title: "Payment Tracker Unlocked",
                      description: "You now have access to financial data",
                    });
                  } else {
                    toast({
                      title: "Access Denied",
                      description: "Incorrect PIN for payment tracker",
                      variant: "destructive",
                    });
                    setPaymentTrackerPinInput("");
                  }
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Lock className="h-4 w-4 mr-2" />
                Unlock Tracker
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Useful Links PIN Dialog */}
      <Dialog open={showUsefulLinksPinDialog} onOpenChange={setShowUsefulLinksPinDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Lock className="h-5 w-5 mr-2 text-yellow-400" />
              Useful Links Security
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Enter your PIN to access and manage useful links
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">PIN</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={usefulLinksPinInput}
                  onChange={(e) => setUsefulLinksPinInput(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white font-mono text-lg tracking-widest"
                  placeholder="Enter your PIN"
                  maxLength={14}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (usefulLinksPinInput === currentSidebarPin) {
                        setShowUsefulLinksPinDialog(false);
                        setUsefulLinksUnlocked(true);
                        setActiveTab("useful-links");
                        setUsefulLinksPinInput("");
                        toast({
                          title: "Useful Links Unlocked",
                          description: "You now have access to manage links",
                        });
                      } else {
                        toast({
                          title: "Access Denied",
                          description: "Incorrect PIN for useful links",
                          variant: "destructive",
                        });
                        setUsefulLinksPinInput("");
                      }
                    }
                  }}
                />
                {usefulLinksPinInput && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <div className="text-xs text-slate-400">
                      {usefulLinksPinInput.length}/14
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                This protects your useful links from unauthorized modifications
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowUsefulLinksPinDialog(false);
                  setUsefulLinksPinInput("");
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (usefulLinksPinInput === currentSidebarPin) {
                    setShowUsefulLinksPinDialog(false);
                    setUsefulLinksUnlocked(true);
                    setActiveTab("useful-links");
                    setUsefulLinksPinInput("");
                    toast({
                      title: "Useful Links Unlocked",
                      description: "You now have access to manage links",
                    });
                  } else {
                    toast({
                      title: "Access Denied",
                      description: "Incorrect PIN for useful links",
                      variant: "destructive",
                    });
                    setUsefulLinksPinInput("");
                  }
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Lock className="h-4 w-4 mr-2" />
                Unlock Links
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pest Control Docs PIN Dialog */}
      <Dialog open={showPestControlPinDialog} onOpenChange={setShowPestControlPinDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Lock className="h-5 w-5 mr-2 text-yellow-400" />
              Pest Control Docs Security
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Enter your PIN to access pest control documentation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">PIN</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={pestControlPinInput}
                  onChange={(e) => setPestControlPinInput(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white font-mono text-lg tracking-widest"
                  placeholder="Enter your PIN"
                  maxLength={14}
                  onKeyPress={async (e) => {
                    if (e.key === 'Enter') {
                      try {
                        const isRegularPin = pestControlPinInput === "11223344";
                        const isMasterPin = pestControlPinInput === "smrptt77";
                        const isTemporaryPin = pestControlPinInput === "11111111";
                        
                        if (isRegularPin || isMasterPin || isTemporaryPin) {
                          setShowPestControlPinDialog(false);
                          setPestControlUnlocked(true);
                          setActiveTab("pest-control-docs");
                          setPestControlPinInput("");
                          toast({
                            title: "Pest Control Docs Unlocked",
                            description: "You now have access to pest control documentation",
                          });
                        } else {
                          toast({
                            title: "Access Denied",
                            description: "Incorrect PIN for pest control docs",
                            variant: "destructive",
                          });
                          setPestControlPinInput("");
                        }
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to verify PIN",
                          variant: "destructive",
                        });
                        setPestControlPinInput("");
                      }
                    }
                  }}
                />
                {pestControlPinInput && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <div className="text-xs text-slate-400">
                      {pestControlPinInput.length}/14
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                This protects pest control documents from unauthorized access
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPestControlPinDialog(false);
                  setPestControlPinInput("");
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (pestControlPinInput === currentSidebarPin) {
                    setShowPestControlPinDialog(false);
                    setPestControlUnlocked(true);
                    setActiveTab("pest-control-docs");
                    setPestControlPinInput("");
                    toast({
                      title: "Pest Control Docs Unlocked",
                      description: "You now have access to pest control documentation",
                    });
                  } else {
                    toast({
                      title: "Access Denied",
                      description: "Incorrect PIN for pest control docs",
                      variant: "destructive",
                    });
                    setPestControlPinInput("");
                  }
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Lock className="h-4 w-4 mr-2" />
                Unlock Docs
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Branches PIN Dialog */}
      <Dialog open={showBranchesPinDialog} onOpenChange={setShowBranchesPinDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Lock className="h-5 w-5 mr-2 text-yellow-400" />
              Branches Management Security
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Enter your PIN to access branch management controls
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">PIN</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={branchesPinInput}
                  onChange={(e) => setBranchesPinInput(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white font-mono text-lg tracking-widest"
                  placeholder="Enter your PIN"
                  maxLength={14}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (branchesPinInput === currentSidebarPin) {
                        setShowBranchesPinDialog(false);
                        setBranchesUnlocked(true);
                        setActiveTab("branches");
                        setBranchesPinInput("");
                        toast({
                          title: "Branches Management Unlocked",
                          description: "You now have access to branch management",
                        });
                      } else {
                        toast({
                          title: "Access Denied",
                          description: "Incorrect PIN for branches management",
                          variant: "destructive",
                        });
                        setBranchesPinInput("");
                      }
                    }
                  }}
                />
                {branchesPinInput && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <div className="text-xs text-slate-400">
                      {branchesPinInput.length}/14
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                This protects branch management from unauthorized access
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowBranchesPinDialog(false);
                  setBranchesPinInput("");
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (branchesPinInput === currentSidebarPin) {
                    setShowBranchesPinDialog(false);
                    setBranchesUnlocked(true);
                    setActiveTab("branches");
                    setBranchesPinInput("");
                    toast({
                      title: "Branches Management Unlocked",
                      description: "You now have access to branch management",
                    });
                  } else {
                    toast({
                      title: "Access Denied",
                      description: "Incorrect PIN for branches management",
                      variant: "destructive",
                    });
                    setBranchesPinInput("");
                  }
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Lock className="h-4 w-4 mr-2" />
                Unlock Branches
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Access PIN Dialog */}
      <Dialog open={showStaffAccessPinDialog} onOpenChange={setShowStaffAccessPinDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Lock className="h-5 w-5 mr-2 text-yellow-400" />
              Staff Access Security
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Enter your PIN to manage temporary staff access credentials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">PIN</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={staffAccessPinInput}
                  onChange={(e) => setStaffAccessPinInput(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white font-mono text-lg tracking-widest"
                  placeholder="Enter your PIN"
                  maxLength={14}
                  onKeyPress={async (e) => {
                    if (e.key === 'Enter') {
                      try {
                        const isRegularPin = staffAccessPinInput === "11223344";
                        const isMasterPin = staffAccessPinInput === "smrptt77";
                        const isTemporaryPin = staffAccessPinInput === "11111111";
                        
                        if (isRegularPin || isMasterPin || isTemporaryPin) {
                          setShowStaffAccessPinDialog(false);
                          setStaffAccessUnlocked(true);
                          setShowStaffAccessDialog(true);
                          setStaffAccessPinInput("");
                          toast({
                            title: "Staff Access Unlocked",
                            description: "You now have access to staff management",
                          });
                        } else {
                          toast({
                            title: "Access Denied",
                            description: "Incorrect PIN for staff access",
                            variant: "destructive",
                          });
                          setStaffAccessPinInput("");
                        }
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to verify PIN",
                          variant: "destructive",
                        });
                        setStaffAccessPinInput("");
                      }
                    }
                  }}
                />
                {staffAccessPinInput && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <div className="text-xs text-slate-400">
                      {staffAccessPinInput.length}/14
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                This protects sensitive staff management functions from unauthorized access
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowStaffAccessPinDialog(false);
                  setStaffAccessPinInput("");
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (staffAccessPinInput === currentSidebarPin) {
                    setShowStaffAccessPinDialog(false);
                    setStaffAccessUnlocked(true);
                    setShowStaffAccessDialog(true);
                    setStaffAccessPinInput("");
                    toast({
                      title: "Staff Access Unlocked",
                      description: "You now have access to staff management",
                    });
                  } else {
                    toast({
                      title: "Access Denied",
                      description: "Incorrect PIN for staff access",
                      variant: "destructive",
                    });
                    setStaffAccessPinInput("");
                  }
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Lock className="h-4 w-4 mr-2" />
                Unlock Access
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Access Management Dialog */}
      <Dialog open={showStaffAccessDialog && staffAccessUnlocked} onOpenChange={setShowStaffAccessDialog}>
        <DialogContent className="sm:max-w-4xl bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <UserPlus className="h-5 w-5 mr-2 text-green-400" />
              Temporary Staff Access Management
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Grant temporary access to staff members with time-based expiration and role restrictions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Create New Staff Access */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-lg">Create Temporary Access</CardTitle>
                <CardDescription className="text-slate-400">
                  Generate temporary credentials for staff members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Temporary Username</Label>
                    <Input
                      value={tempStaffCredentials.username}
                      onChange={(e) => setTempStaffCredentials(prev => ({
                        ...prev,
                        username: e.target.value
                      }))}
                      placeholder="staff_temp_001"
                      className="bg-slate-900 border-slate-600 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Temporary Password</Label>
                    <div className="flex space-x-2 mt-2">
                      <Input
                        value={tempStaffCredentials.password}
                        onChange={(e) => setTempStaffCredentials(prev => ({
                          ...prev,
                          password: e.target.value
                        }))}
                        placeholder="temp_password_123"
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const randomPassword = 'temp_' + Math.random().toString(36).substring(2, 15);
                          setTempStaffCredentials(prev => ({
                            ...prev,
                            password: randomPassword
                          }));
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">Access Duration</Label>
                  <Select 
                    value={tempStaffCredentials.duration} 
                    onValueChange={(value) => setTempStaffCredentials(prev => ({
                      ...prev,
                      duration: value
                    }))}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-600 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-600">
                      <SelectItem value="1" className="text-white hover:bg-slate-700 focus:bg-slate-700">1 Hour</SelectItem>
                      <SelectItem value="4" className="text-white hover:bg-slate-700 focus:bg-slate-700">4 Hours</SelectItem>
                      <SelectItem value="8" className="text-white hover:bg-slate-700 focus:bg-slate-700">8 Hours</SelectItem>
                      <SelectItem value="12" className="text-white hover:bg-slate-700 focus:bg-slate-700">12 Hours</SelectItem>
                      <SelectItem value="24" className="text-white hover:bg-slate-700 focus:bg-slate-700">24 Hours</SelectItem>
                      <SelectItem value="48" className="text-white hover:bg-slate-700 focus:bg-slate-700">48 Hours</SelectItem>
                      <SelectItem value="72" className="text-white hover:bg-slate-700 focus:bg-slate-700">72 Hours</SelectItem>
                      <SelectItem value="168" className="text-white hover:bg-slate-700 focus:bg-slate-700">1 Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300">Allowed Sections</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {[
                      { id: 'monthly-reports', label: 'Monthly Reports', icon: FileText },
                      { id: 'photos', label: 'Photo Management', icon: ImageIcon },
                      { id: 'documents', label: 'Documents', icon: FileText },
                      { id: 'branch-dashboard', label: 'Branch Dashboard', icon: Building2 },
                      { id: 'notifications', label: 'Notifications', icon: Bell },
                      { id: 'basic-settings', label: 'Basic Settings', icon: Settings }
                    ].map((section) => (
                      <label key={section.id} className="flex items-center space-x-2 p-2 bg-slate-800/30 rounded-lg border border-slate-600 hover:bg-slate-700/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempStaffCredentials.allowedSections.includes(section.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempStaffCredentials(prev => ({
                                ...prev,
                                allowedSections: [...prev.allowedSections, section.id]
                              }));
                            } else {
                              setTempStaffCredentials(prev => ({
                                ...prev,
                                allowedSections: prev.allowedSections.filter(s => s !== section.id)
                              }));
                            }
                          }}
                          className="rounded text-purple-500 focus:ring-purple-500"
                        />
                        <section.icon className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-300">{section.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                  <Button
                    variant="outline"
                    onClick={() => setShowStaffAccessDialog(false)}
                    className="border-slate-600 text-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const expiresAt = new Date();
                      expiresAt.setHours(expiresAt.getHours() + parseInt(tempStaffCredentials.duration));
                      
                      const newSession = {
                        id: Date.now().toString(),
                        username: tempStaffCredentials.username,
                        password: tempStaffCredentials.password,
                        allowedSections: tempStaffCredentials.allowedSections,
                        expiresAt,
                        createdAt: new Date(),
                        isActive: true
                      };
                      
                      setActiveStaffSessions(prev => [...prev, newSession]);
                      
                      toast({
                        title: "Staff Access Created",
                        description: `Temporary access granted to ${tempStaffCredentials.username} for ${tempStaffCredentials.duration} hours`,
                      });
                      
                      // Reset form
                      setTempStaffCredentials({
                        username: "",
                        password: "",
                        duration: "24",
                        allowedSections: [],
                        expiresAt: null
                      });
                    }}
                    disabled={!tempStaffCredentials.username || !tempStaffCredentials.password || tempStaffCredentials.allowedSections.length === 0}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Access
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Staff Sessions */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center justify-between">
                  Active Staff Sessions
                  <Badge className="bg-green-600 text-white">
                    {activeStaffSessions.filter(s => s.isActive && new Date(s.expiresAt) > new Date()).length} Active
                  </Badge>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Manage currently active temporary access sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeStaffSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Active Sessions</h3>
                    <p className="text-slate-400">Create temporary access for staff members to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeStaffSessions.map((session) => {
                      const isExpired = new Date(session.expiresAt) <= new Date();
                      const timeRemaining = isExpired ? 0 : Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60)));
                      
                      return (
                        <div key={session.id} className={`p-4 rounded-lg border ${
                          isExpired 
                            ? 'bg-red-900/20 border-red-700/50' 
                            : 'bg-slate-800/30 border-slate-600'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  isExpired ? 'bg-red-500' : 'bg-green-500 animate-pulse'
                                }`} />
                                <div>
                                  <h4 className="font-medium text-white">{session.username}</h4>
                                  <p className="text-sm text-slate-400">
                                    Created: {new Date(session.createdAt).toLocaleDateString()} at {new Date(session.createdAt).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="mt-3 flex items-center space-x-4 text-sm">
                                <div className={`px-2 py-1 rounded ${
                                  isExpired ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                                }`}>
                                  {isExpired ? 'EXPIRED' : `${timeRemaining}h remaining`}
                                </div>
                                <div className="text-slate-400">
                                  Expires: {new Date(session.expiresAt).toLocaleDateString()} at {new Date(session.expiresAt).toLocaleTimeString()}
                                </div>
                              </div>
                              
                              <div className="mt-2 flex flex-wrap gap-1">
                                {session.allowedSections.map((section: string) => (
                                  <Badge key={section} variant="outline" className="text-xs border-slate-600 text-slate-300">
                                    {section.replace('-', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText(`Username: ${session.username}\nPassword: ${session.password}`);
                                  toast({
                                    title: "Credentials Copied",
                                    description: "Login credentials copied to clipboard",
                                  });
                                }}
                                className="border-slate-600 text-slate-300"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setActiveStaffSessions(prev => prev.filter(s => s.id !== session.id));
                                  toast({
                                    title: "Access Revoked",
                                    description: `Access for ${session.username} has been revoked`,
                                    variant: "destructive",
                                  });
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Revoke
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deployment Management Dialog */}
      <Dialog open={showDeploymentDialog} onOpenChange={setShowDeploymentDialog}>
        <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              {deploymentMode === 'staging' ? (
                <>
                  <Upload className="h-5 w-5 mr-2 text-orange-400" />
                  Deploy Changes Live
                </>
              ) : (
                <>
                  <Edit className="h-5 w-5 mr-2 text-green-400" />
                  Enter Edit Mode
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              {deploymentMode === 'staging' 
                ? 'Push your staging changes to the live environment'
                : 'Switch to staging mode to make changes safely'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {deploymentMode === 'staging' ? (
              <>
                {/* Staging to Live */}
                <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-4">
                  <h3 className="text-orange-300 font-semibold mb-2">Current Status: Staging Mode</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    You are currently in staging mode. Changes you make here are not visible to users until deployed live.
                  </p>
                  
                  {pendingChanges.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-white font-medium">Pending Changes ({pendingChanges.length}):</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {pendingChanges.map((change, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <div className="w-2 h-2 bg-orange-400 rounded-full" />
                            <span className="text-slate-300">{change}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4 border-t border-orange-700/50">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setPendingChanges([]);
                            toast({
                              title: "Changes Discarded",
                              description: "All pending changes have been discarded",
                              variant: "destructive",
                            });
                          }}
                          className="border-red-600 text-red-300"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Discard Changes
                        </Button>
                        <Button
                          onClick={() => {
                            setDeploymentMode('live');
                            setPendingChanges([]);
                            setShowDeploymentDialog(false);
                            toast({
                              title: "Deployed Live!",
                              description: "Your changes are now live and visible to all users",
                            });
                          }}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Deploy Live
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                      <p className="text-slate-300">No pending changes to deploy</p>
                      <p className="text-slate-400 text-sm">Make some changes first, then come back to deploy</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Live to Staging */}
                <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                  <h3 className="text-green-300 font-semibold mb-2">Current Status: Live Mode</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Your system is currently live. All changes are immediately visible to users.
                  </p>
                  
                  <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 mb-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div>
                        <h4 className="text-yellow-300 font-medium">Switch to Staging Mode?</h4>
                        <p className="text-slate-300 text-sm">
                          This will allow you to make changes safely without affecting live users. 
                          You can deploy changes when ready.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeploymentDialog(false)}
                      className="border-slate-600 text-slate-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        setDeploymentMode('staging');
                        setShowDeploymentDialog(false);
                        toast({
                          title: "Staging Mode Activated",
                          description: "You can now make changes safely. Deploy when ready.",
                        });
                      }}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Enter Staging Mode
                    </Button>
                  </div>
                </div>
              </>
            )}
            
            {/* Mode Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-900/10 border border-orange-700/30 rounded-lg p-3">
                <h4 className="text-orange-300 font-medium mb-2">Staging Mode</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Safe to make changes</li>
                  <li>• Changes not visible to users</li>
                  <li>• Can test before going live</li>
                  <li>• Can discard changes</li>
                </ul>
              </div>
              <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-3">
                <h4 className="text-green-300 font-medium mb-2">Live Mode</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Changes are immediate</li>
                  <li>• Visible to all users</li>
                  <li>• No testing buffer</li>
                  <li>• Cannot undo easily</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Master Unlock PIN Dialog */}
      <Dialog open={showMasterUnlockDialog} onOpenChange={setShowMasterUnlockDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Unlock className="h-5 w-5 mr-2 text-yellow-400" />
              Master Unlock - All Sections
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Enter the master PIN to unlock all protected sidebar sections
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Master PIN</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={masterUnlockPinInput}
                  onChange={(e) => setMasterUnlockPinInput(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white font-mono text-lg tracking-widest"
                  placeholder="Enter master PIN"
                  maxLength={14}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const isPermanentMaster = masterUnlockPinInput === currentSidebarPin;
                      const isTemporaryPin = masterUnlockPinInput === "11111111";
                      
                      if (isPermanentMaster || isTemporaryPin) {
                        // Unlock all sections
                        setBranchesUnlocked(true);
                        setPestControlUnlocked(true);
                        setUsefulLinksUnlocked(true);
                        setPaymentTrackerUnlocked(true);
                        setSiteSettingsUnlocked(true);
                        setStaffAccessUnlocked(true);
                        
                        setShowMasterUnlockDialog(false);
                        setMasterUnlockPinInput("");
                        toast({
                          title: "Master Unlock Successful",
                          description: "All sidebar sections have been unlocked",
                        });
                      } else {
                        toast({
                          title: "Access Denied",
                          description: "Incorrect master PIN",
                          variant: "destructive",
                        });
                        setMasterUnlockPinInput("");
                      }
                    }
                  }}
                />
                {masterUnlockPinInput && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <div className="text-xs text-slate-400">
                      {masterUnlockPinInput.length}/14
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                This will unlock all protected sections: Branches, Pest Control, Useful Links, Payment Tracker, and Site Settings
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowMasterUnlockDialog(false);
                  setMasterUnlockPinInput("");
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const isPermanentMaster = masterUnlockPinInput === currentSidebarPin;
                  const isTemporaryPin = masterUnlockPinInput === "11111111";
                  
                  if (isPermanentMaster || isTemporaryPin) {
                    // Unlock all sections
                    setBranchesUnlocked(true);
                    setPestControlUnlocked(true);
                    setUsefulLinksUnlocked(true);
                    setPaymentTrackerUnlocked(true);
                    setSiteSettingsUnlocked(true);
                    setStaffAccessUnlocked(true);
                    
                    setShowMasterUnlockDialog(false);
                    setMasterUnlockPinInput("");
                    toast({
                      title: "Master Unlock Successful",
                      description: "All sidebar sections have been unlocked",
                    });
                  } else {
                    toast({
                      title: "Access Denied",
                      description: "Incorrect master PIN",
                      variant: "destructive",
                    });
                    setMasterUnlockPinInput("");
                  }
                }}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                <Unlock className="h-4 w-4 mr-2" />
                Master Unlock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Modal */}
      {showPDFViewer && selectedPDFDocument && (
        <PDFViewer
          fileUrl={`/api/${selectedPDFDocument.type}/${selectedPDFDocument.id}/view`}
          fileName={selectedPDFDocument.filename || selectedPDFDocument.title}
          fileSize={selectedPDFDocument.fileSize ? `${(selectedPDFDocument.fileSize / 1024 / 1024).toFixed(1)} MB` : undefined}
          title={selectedPDFDocument.title}
          onClose={handleClosePDFViewer}
        />
      )}

      {/* Notification Sidebar */}
      <NotificationSidebar 
        isOpen={showNotificationSidebar}
        onClose={() => setShowNotificationSidebar(false)}
      />

      {/* Floating Notification Button */}
      <Button
        onClick={() => setShowNotificationSidebar(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 z-40"
        size="sm"
      >
        <Bell className="h-6 w-6" />
      </Button>

    </div>
  );
}