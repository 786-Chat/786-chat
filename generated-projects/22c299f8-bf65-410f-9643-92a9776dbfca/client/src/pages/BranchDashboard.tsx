import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import {
  Building2,
  FileText,
  Camera,
  Bug,
  Calendar,
  FileImage,
  Link as LinkIcon,
  CreditCard,
  Bell,
  Settings,
  Search,
  Plus,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  MapPin,
  Phone,
  Mail,
  LogOut,
  Download,
  Eye,
  X,
  ExternalLink,
  Menu,
  User,
  Lock,
  Shield,
  MoreVertical,
  Receipt,
  Send,
  Trash2,
  Upload,
  Grid,
  Layout,
  RotateCcw,
  Archive,
  Pencil
} from "lucide-react";
import SmoothCursor from "@/components/SmoothCursor";
import { BranchUsefulLinksSection } from "@/components/BranchUsefulLinksSection";
import PaymentTrackerSection from "@/components/PaymentTrackerSection";
import PDFViewer from "@/components/PDFViewer";
import BranchNotificationPanel from "@/components/BranchNotificationPanel";
import BranchChartPage from "@/pages/BranchChartPage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Use public asset URLs for reliable loading
const logo1 = "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087871673-1829269c-78e7-4c76-a6e2-0c1090fd8c2e-logo1-m5BHauMOSuVvkp1yxc1LjRvdzjOuL4.png";
const logo2 = "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087872596-7c3dec17-9044-4dd6-a870-6595396b61ca-logo2-4QPqPg5WqzqAdqmEY7rLQnJdrTTlf7.png";
const logo3 = "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087873423-05924ff1-ac2f-4d93-b68c-224bd139a7d8-logo3-CxaNcaWzudsiU7GosFusQ7OJlxlKx4.png";
const logo4 = "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087874448-db35fc63-5281-4768-abcc-5bec4afb1c06-logo4-OtkAHniroCMOYCjhvbIKDaY0dXtEEe.png";
const logo5 = "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087874880-ed9be19a-df6d-4a0d-9bbe-6a1d0289e8ff-logo5-g62bnyhukzs6ZDnbFNaBBNatmWbadn.png";
const starIcon = "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087876186-2e18a970-654c-4f26-a152-fb171d380591-star-qeCWdE0CnV8I6tAWaYKkiSze55M4oY.png";

interface BranchStats {
  documentsCount: number;
  photosCount: number;
  reportsCount: number;
  tasksCount: number;
}

interface Branch {
  id: string;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  logoUrl?: string;
  lastInspection?: string;
  nextDue?: string;
  paymentAmount?: string;
  paymentMethod?: string;
  paymentFrequency?: string;
  visitFrequency?: string;
  paymentStatus?: string;
  lastTraining?: string;
  trainingNextDue?: string;
  createdAt: string;
  updatedAt?: string;
  starRating?: number;
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
  createdAt: string;
  updatedAt?: string;
  isInMyDocs?: boolean;
}

export default function BranchDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedTheme, setSelectedTheme] = useState("blue");
  const [selectedFontSize, setSelectedFontSize] = useState("medium");
  const [savedTheme, setSavedTheme] = useState("blue");
  const [savedFontSize, setSavedFontSize] = useState("medium");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrollIndicators, setScrollIndicators] = useState({ top: false, bottom: false });
  const sidebarScrollRef = useRef<HTMLElement>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Logo rotation state
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const logos = [logo1, logo2, logo3, logo4, logo5];
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [selectedPDFDocument, setSelectedPDFDocument] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // IoT Smart Devices query
  const { data: iotDevicesRaw, refetch: refetchIotDevices } = useQuery<any[]>({
    queryKey: ["/api/branch/iot-devices"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 30000,
  });
  const branchIotDevices: any[] = Array.isArray(iotDevicesRaw) ? iotDevicesRaw : [];

  // Yearly docs state
  const [showViewer, setShowViewer] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const { data: yearlyDocsRaw, isLoading: docsLoading, error: docsError, refetch: refetchYearlyDocs } = useQuery<any[]>({
    queryKey: ["/api/branch/yearly-docs"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 30000,
  });
  const yearlyDocs: any[] = Array.isArray(yearlyDocsRaw) ? yearlyDocsRaw : [];
  
  // Missing handlers
  const handleCloseViewer = () => {
    setShowViewer(false);
    setSelectedDoc(null);
  };
  
  const handleViewDoc = (doc: any) => {
    setSelectedDoc(doc);
    setShowViewer(true);
  };

  // Load saved appearance settings from database
  const { data: userPreferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ['/api/user/preferences'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  }) as { data: { theme?: string; fontSize?: string } | undefined; isLoading: boolean };

  // Update appearance settings when preferences are loaded
  useEffect(() => {
    if (userPreferences) {
      setSelectedTheme(userPreferences.theme || 'blue');
      setSavedTheme(userPreferences.theme || 'blue');
      setSelectedFontSize(userPreferences.fontSize || 'medium');
      setSavedFontSize(userPreferences.fontSize || 'medium');
    }
  }, [userPreferences]);

  // Save appearance settings to database
  const savePreferencesMutation = useMutation({
    mutationFn: async (preferences: { theme: string; fontSize: string }) => {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(preferences),
      });
      if (!response.ok) throw new Error('Failed to save preferences');
      return response.json() as Promise<{ theme: string; fontSize: string }>;
    },
    onSuccess: (data: { theme: string; fontSize: string }) => {
      setSavedTheme(data.theme);
      setSavedFontSize(data.fontSize);
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      
      toast({
        title: "Settings Saved",
        description: "Your appearance settings have been saved successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to save preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save appearance settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save appearance settings function
  const saveAppearanceSettings = () => {
    savePreferencesMutation.mutate({
      theme: selectedTheme,
      fontSize: selectedFontSize,
    });
  };

  // Reset appearance settings to default
  const resetAppearanceSettings = () => {
    setSelectedTheme('blue');
    setSelectedFontSize('medium');
    
    toast({
      title: "Settings Reset",
      description: "Appearance settings have been reset to defaults. Click Save to apply.",
      variant: "default",
    });
  };

  // Get current branch data
  const { data: currentBranch, isLoading: branchLoading } = useQuery<Branch>({
    queryKey: ["/api/branch/current"],
  });

  // Get branch statistics
  const { data: stats } = useQuery<BranchStats>({
    queryKey: ["/api/branch/stats"],
  });

  // Scroll indicator handler
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

  // Get current branch information with proper cache invalidation
  const { data: branchProfile, refetch: refetchProfile } = useQuery<Branch>({
    queryKey: ["/api/branch/profile"],
    retry: false,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache to ensure we get updated logo (v5 syntax)
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Auto-refresh profile data every 30 seconds to catch admin logo updates
  useEffect(() => {
    const interval = setInterval(() => {
      refetchProfile();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchProfile]);

  // Removed admin endpoint call that was causing 401 errors and auto-logout



  // Get photos
  const { data: photosRaw } = useQuery<any[]>({
    queryKey: ["/api/branch/photos"],
  });
  const photos: any[] = Array.isArray(photosRaw) ? photosRaw : [];

  // Get payment records for this branch
  const { data: paymentRecordsRaw } = useQuery<any[]>({
    queryKey: ["/api/branch/payment-records"],
  });
  const paymentRecords: any[] = Array.isArray(paymentRecordsRaw) ? paymentRecordsRaw : [];

  // Get documents for My Documents section
  const { data: myDocumentsRaw, isLoading: documentsLoading, refetch: refetchDocuments } = useQuery<any[]>({
    queryKey: ["/api/branch/documents"],
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  const myDocuments: any[] = Array.isArray(myDocumentsRaw) ? myDocumentsRaw : [];

  // Get ALL documents sent by admin (like Monthly Reports does)
  const { data: allDocumentsRaw, isLoading: allDocumentsLoading, error: allDocumentsError } = useQuery<any[]>({
    queryKey: ["/api/branch/all-documents"],
    staleTime: 30000,
    gcTime: 300000,
    retry: false,
  });
  const allDocuments: any[] = Array.isArray(allDocumentsRaw) ? allDocumentsRaw : [];

  const handleLogout = async () => {
    try {
      await fetch("/api/branch/logout", { method: "POST" });
    } catch (_) {}
    window.location.href = "/";
  };

  // Photo save functionality removed - branch has read-only access

  // Check if report exists in My Documents
  const checkReportInMyDocs = async (reportId: string) => {
    try {
      const response = await fetch(`/api/branch/monthly-reports/${reportId}/check-mydocs`);
      if (response.ok) {
        const data = await response.json();
        return data.exists;
      }
    } catch (error) {
      console.error('Error checking report in My Docs:', error);
    }
    return false;
  };



  // Send yearly doc to My Documents mutation
  const sendYearlyDocToMyDocs = useMutation({
    mutationFn: async (docId: string) => {
      const response = await fetch(`/api/branch/yearly-docs/${docId}/send-to-mydocs`, {
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
      toast({
        title: "Success",
        description: "Document sent to My Documents successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/branch/yearly-docs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/branch/documents'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message.includes('already exists') ? 
          "Document already exists in My Documents" : 
          "Failed to send document to My Documents",
        variant: "destructive",
      });
    },
  });



  // Delete yearly doc mutation (branch)
  const deleteYearlyDoc = useMutation({
    mutationFn: async (docId: string) => {
      const response = await fetch(`/api/branch/yearly-docs/${docId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deleted",
        description: "Yearly document removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/branch/yearly-docs'] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  // Delete document from My Documents mutation
  const deleteFromMyDocs = useMutation({
    mutationFn: async (docId: string) => {
      return apiRequest("DELETE", `/api/branch/documents/${docId}/from-mydocs`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document removed from My Documents",
      });
      // Aggressive cache invalidation with forced refetch
      queryClient.invalidateQueries({ queryKey: ['/api/branch/documents'] });
      queryClient.refetchQueries({ queryKey: ['/api/branch/documents'] });
      // Also force a manual refetch
      setTimeout(() => {
        refetchDocuments();
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove document",
        variant: "destructive",
      });
    },
  });

  // Branch logo upload mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await fetch('/api/branch/logo', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
      // Refresh branch profile data to show new logo
      queryClient.invalidateQueries({ queryKey: ['/api/branch/profile'] });
      setShowLogoUpload(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    },
  });

  // MonthlyReportsSection Component
  const MonthlyReportsSection = () => {
    const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
    const [showViewer, setShowViewer] = useState(false);
    const [isViewerLoading, setIsViewerLoading] = useState(false);
    
    const { data: monthlyReportsRaw, isLoading: reportsLoading, error: reportsError } = useQuery<MonthlyReport[]>({
      queryKey: ["/api/branch/monthly-reports"],
      queryFn: getQueryFn({ on401: "returnNull" }),
      staleTime: 30000,
      gcTime: 300000,
      retry: false,
    });
    const monthlyReports: MonthlyReport[] = Array.isArray(monthlyReportsRaw) ? monthlyReportsRaw : [];

    console.log('Monthly reports data:', { monthlyReports, reportsLoading, reportsError });

    const sendReportToMyDocs = useMutation({
      mutationFn: async (reportId: string) => {
        console.log('🔄 Attempting to save report to My Docs:', reportId);
        
        const response = await fetch(`/api/branch/monthly-reports/${reportId}/send-to-mydocs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include' // Include cookies for authentication
        });
        
        console.log('📡 Save response status:', response.status);
        
        if (!response.ok) {
          const error = await response.text();
          console.error('❌ Save error:', { status: response.status, error });
          throw new Error(error || 'Failed to save report');
        }
        
        const result = await response.json();
        console.log('✅ Save successful:', result);
        return result;
      },
      onSuccess: () => {
        toast({
          title: "Report Saved",
          description: "Monthly report saved to My Documents",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/branch/documents'] });
      },
      onError: (error) => {
        toast({
          title: "Save Failed",
          description: error.message || "Failed to save report",
          variant: "destructive",
        });
      },
    });

    const deleteMonthlyReport = useMutation({
      mutationFn: async (reportId: string) => {
        const response = await fetch(`/api/branch/monthly-reports/${reportId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Failed to delete report');
        }
        
        return response.json();
      },
      onSuccess: () => {
        toast({
          title: "Report Deleted",
          description: "Monthly report deleted successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/branch/monthly-reports"] });
      },
      onError: (error) => {
        toast({
          title: "Delete Failed",
          description: error.message || "Failed to delete report",
          variant: "destructive",
        });
      },
    });



    const handleViewReport = (report: MonthlyReport) => {
      setSelectedPDFDocument({
        viewUrl: `/api/monthly-reports/${report.id}/view`,
        filename: report.filename,
        title: report.title,
        fileSize: report.fileSize ? `${Math.round(report.fileSize / 1024)} KB` : undefined,
      });
      setShowPDFViewer(true);
    };

    const handleCloseViewer = () => {
      setShowViewer(false);
      setSelectedReport(null);
      setIsViewerLoading(false);
    };

    const handleViewPDF = (document: any) => {
      setSelectedPDFDocument({
        viewUrl: `/api/monthly-reports/${document.id}/view`,
        filename: document.filename,
        title: document.title,
        fileSize: document.fileSize ? `${Math.round(document.fileSize / 1024)} KB` : undefined,
      });
      setShowPDFViewer(true);
    };

    if (reportsError) {
      return (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">Error loading monthly reports</p>
          <p className="text-slate-500 text-sm">{reportsError.message || 'Please try refreshing the page'}</p>
        </div>
      );
    }

    if (reportsLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-2 text-slate-400">Loading monthly reports...</p>
        </div>
      );
    }

    if (monthlyReports.length === 0) {
      return (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No monthly reports received yet</p>
          <p className="text-slate-500 text-sm">Reports sent by admin will appear here</p>
        </div>
      );
    }



    return (
      <>
      {/* Full Table Layout */}
      <div className="bg-slate-800/50 rounded-lg overflow-hidden">

        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Document</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Type</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Size</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Received</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Format</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Status</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {monthlyReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white truncate">{report.title}</div>
                        <div className="text-xs text-slate-400 truncate">{report.filename}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                      {report.reportType === 'inspection-report' ? 'Inspection' :
                       report.reportType === 'coshh-risk-assessment' ? 'COSHH Risk' :
                       report.reportType === 'monthly-summary' ? 'Monthly Summary' :
                       report.reportType || 'Report'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-300">{report.viewSize || 'A4'}</div>
                    <div className="text-xs text-slate-400">{Math.round((report.fileSize || 0) / 1024)} KB</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-300">
                      {report.receivedAt ? new Date(report.receivedAt).toLocaleDateString() : 'Not received'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {report.receivedAt ? new Date(report.receivedAt).toLocaleTimeString() : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-300">
                      {report.mimeType?.includes('pdf') ? 'PDF' : 
                       report.mimeType?.includes('image') ? 'Image' : 'Document'}
                    </div>
                    <div className="text-xs text-slate-400">{report.mimeType}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-400">
                        {report.isInMyDocs ? 'In My Docs' : 'Available'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        size="sm"
                        onClick={() => deleteMonthlyReport.mutate(report.id)}
                        disabled={deleteMonthlyReport.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        title="Delete Report"
                        data-testid={`button-delete-monthly-report-${report.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleViewPDF({
                          ...report,
                          type: 'monthly-reports'
                        })}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        title="View Report"
                        data-testid={`button-view-monthly-report-${report.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => sendReportToMyDocs.mutate(report.id)}
                        disabled={sendReportToMyDocs.isPending}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                        title="Save to My Documents"
                        data-testid={`button-save-monthly-report-${report.id}`}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Summary Footer */}
        <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Total Reports: <span className="text-white font-medium">{monthlyReports.length}</span>
            </div>
            <div className="text-sm text-slate-400">
              In My Docs: <span className="text-green-400 font-medium">
                {monthlyReports.filter(r => r.isInMyDocs).length}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Grid View Toggle Button */}
      <div className="mt-4 text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Toggle between table and grid view
            const gridView = document.querySelector('.monthly-reports-grid');
            const tableView = document.querySelector('.monthly-reports-table');
            // This would toggle between views if implemented
          }}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <Grid className="h-4 w-4 mr-2" />
          Switch to Grid View
        </Button>
      </div>

    </>
    );
  };

  // YearlyDocsSection Component - Removed old implementation

  // Photo Section Component
  const PhotoSection = () => {
    const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
    const [showPhotoViewer, setShowPhotoViewer] = useState(false);
    
    const { data: photosData, isLoading: photosLoading } = useQuery<any[]>({
      queryKey: ["/api/branch/photos"],
      queryFn: getQueryFn({ on401: "returnNull" }),
      retry: false,
    });
    const photos: any[] = Array.isArray(photosData) ? photosData : [];

    const sendPhotoToMyDocs = useMutation({
      mutationFn: async (photoId: string) => {
        return apiRequest("POST", `/api/branch/photos/${photoId}/send-to-mydocs`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/branch/documents"] });
        queryClient.invalidateQueries({ queryKey: ["/api/branch/photos"] });
        toast({
          title: "Success",
          description: "Photo sent to My Documents successfully",
        });
      },
      onError: (error: any) => {
        if (error.message.includes('409')) {
          toast({
            title: "Already Saved",
            description: "This photo is already in your My Documents",
            variant: "default",
          });
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to send photo to My Documents",
            variant: "destructive",
          });
        }
      },
    });

    const deletePhoto = useMutation({
      mutationFn: async (photoId: string) => {
        return apiRequest("DELETE", `/api/branch/photos/${photoId}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/branch/photos"] });
        toast({
          title: "Success",
          description: "Photo deleted successfully",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to delete photo",
          variant: "destructive",
        });
      },
    });

    const handleViewPhoto = (photo: any) => {
      setSelectedPhoto(photo);
      setShowPhotoViewer(true);
    };

    const handleClosePhotoViewer = () => {
      setShowPhotoViewer(false);
      setSelectedPhoto(null);
    };

    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-white">Photos</h1>
          <p className="text-slate-400">View before/after photos and treatment documentation.</p>
        </div>

        <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Branch Photos</CardTitle>
            <p className="text-slate-400">Before/after photos and documentation</p>
          </CardHeader>
          <CardContent>
            {photosLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                <p className="mt-2 text-slate-400">Loading photos...</p>
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-8">
                <FileImage className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No photos found</p>
                <p className="text-slate-500 text-sm">Photos will appear here</p>
              </div>
            ) : (
              <>
                {/* Summary Header */}
                <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-400">
                      Total Photos: <span className="text-white font-medium">{photos.length}</span>
                    </div>
                    <div className="text-sm text-slate-400">
                      Before: <span className="text-red-400 font-medium">
                        {photos.filter(p => p.type === 'before').length}
                      </span> • After: <span className="text-green-400 font-medium">
                        {photos.filter(p => p.type === 'after').length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Grid Layout for Photos */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {photos.map((photo) => (
                    <div 
                      key={photo.id} 
                      className="group bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700 hover:border-slate-600 hover:bg-slate-800/70 transition-all duration-200 transform hover:scale-105"
                      data-testid={`photo-card-${photo.id}`}
                    >
                      {/* Photo Thumbnail */}
                      <div className="relative aspect-square overflow-hidden bg-slate-900">
                        <img
                          src={`/api/smart-image/${photo.filename}`}
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-slate-900"><svg class="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>';
                            }
                          }}
                        />
                        
                        {/* Type Badge - positioned in top right */}
                        <div className="absolute top-2 right-2">
                          <Badge className={`text-xs shadow-lg ${
                            photo.type === 'before' ? 'bg-red-600/90 text-red-100 border-red-500/50' :
                            'bg-green-600/90 text-green-100 border-green-500/50'
                          }`}>
                            {photo.type === 'before' ? 'Before' : 'After'}
                          </Badge>
                        </div>

                      </div>

                      {/* Photo Info */}
                      <div className="p-3">
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium text-white truncate mb-1" title={photo.title}>
                            {photo.title}
                          </h4>
                          <p className="text-xs text-slate-400 truncate mb-2" title={photo.category}>
                            {photo.category}
                          </p>
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-xs text-slate-500">
                              {new Date(photo.createdAt).toLocaleDateString('en-GB')}
                            </div>
                            <div className="flex items-center space-x-1">
                              {photo.filepath && photo.filepath.startsWith('/objects/') ? (
                                <>
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                  <span className="text-xs text-green-400">Available</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                  <span className="text-xs text-red-400">File Missing</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Buttons at bottom */}
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleViewPhoto(photo)}
                              className="bg-slate-700 hover:bg-slate-600 text-white h-8 w-8 p-0 flex items-center justify-center rounded-md"
                              title="View Photo"
                              data-testid={`button-view-photo-${photo.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => sendPhotoToMyDocs.mutate(photo.id)}
                              disabled={sendPhotoToMyDocs.isPending}
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white h-8 w-8 p-0 flex items-center justify-center rounded-md"
                              title="Save to My Documents"
                              data-testid={`button-save-photo-${photo.id}`}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => deletePhoto.mutate(photo.id)}
                              disabled={deletePhoto.isPending}
                              className="bg-red-600 hover:bg-red-700 text-white h-8 w-8 p-0 flex items-center justify-center rounded-md"
                              title="Delete Photo"
                              data-testid={`button-delete-photo-${photo.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Photo Viewer Modal */}
        {showPhotoViewer && selectedPhoto && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 sm:p-6">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedPhoto.title}</h3>
                    <p className="text-sm text-slate-400">
                      {selectedPhoto.type === 'before' ? 'Before Photo' : 'After Photo'} • {selectedPhoto.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `/api/smart-image/${selectedPhoto.filename}`;
                      link.target = '_blank';
                      link.rel = 'noopener noreferrer';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open in New Tab
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClosePhotoViewer}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-6 flex items-center justify-center">
                <div className="max-w-sm w-full aspect-[4/3] rounded-lg border border-slate-700 overflow-hidden bg-slate-800 flex items-center justify-center shadow-lg">
                  <img
                    src={`/api/smart-image/${selectedPhoto.filename}`}
                    alt={selectedPhoto.title}
                    className="max-w-full max-h-full object-contain rounded"
                    onLoad={() => console.log('Image loaded successfully')}
                    onError={(e) => {
                      console.error('Failed to load image:', selectedPhoto.filename);
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400"><div class="text-center"><svg class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg><p>Image not found</p></div></div>';
                      }
                    }}
                  />
                </div>
                
                {selectedPhoto.description && (
                  <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-slate-300 text-sm">{selectedPhoto.description}</p>
                  </div>
                )}
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-400">
                  <div>
                    <span className="font-medium">Type:</span> {selectedPhoto.type === 'before' ? 'Before Photo' : 'After Photo'}
                  </div>
                  <div>
                    <span className="font-medium">Category:</span> {selectedPhoto.category}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span> A5 (148 × 210 mm)
                  </div>
                  <div>
                    <span className="font-medium">Received:</span> {new Date(selectedPhoto.createdAt).toLocaleDateString('en-GB')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // NEW Clean Pest Control Docs Section
  const NewPestControlDocsSection = () => {
    const [selectedDoc, setSelectedDoc] = useState<any>(null);
    const [showViewer, setShowViewer] = useState(false);
    
    // Fetch pest control documents for this branch
    // Use returnNull on 401 so a session expiry doesn't cause a full-page redirect/crash
    const { data: rawPestControlDocs, isLoading: docsLoading, refetch: refetchDocs } = useQuery<any[]>({
      queryKey: ["/api/branch/pest-control-docs"],
      queryFn: getQueryFn({ on401: "returnNull" }),
      staleTime: 30000,
      gcTime: 300000,
      retry: false,
    });
    const pestControlDocs: any[] = Array.isArray(rawPestControlDocs) ? rawPestControlDocs : [];

    // Save to My Documents mutation
    const savePestControlDoc = useMutation({
      mutationFn: async (docId: string) => {
        const response = await fetch(`/api/branch/pest-control-docs/${docId}/send-to-mydocs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Failed to save document');
        }
        
        return response.json();
      },
      onSuccess: () => {
        toast({
          title: "Document Saved",
          description: "Pest control document saved to My Documents",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/branch/documents'] });
        refetchDocs();
      },
      onError: (error) => {
        toast({
          title: "Save Failed",
          description: error.message || "Failed to save document",
          variant: "destructive",
        });
      },
    });

    // Delete document mutation
    const deletePestControlDoc = useMutation({
      mutationFn: async (docId: string) => {
        const response = await fetch(`/api/branch/pest-control-docs/${docId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Failed to delete document');
        }
        
        return response.json();
      },
      onSuccess: () => {
        toast({
          title: "Document Deleted",
          description: "Pest control document deleted successfully",
        });
        refetchDocs();
      },
      onError: (error) => {
        toast({
          title: "Delete Failed",
          description: error.message || "Failed to delete document",
          variant: "destructive",
        });
      },
    });

    const handleViewDoc = (doc: any) => {
      setSelectedPDFDocument({
        viewUrl: `/api/pest-control-docs/${doc.id}/view`,
        filename: doc.filename || doc.title,
        title: doc.title,
        fileSize: doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : undefined,
      });
      setShowPDFViewer(true);
    };

    const handleCloseViewer = () => {
      setShowViewer(false);
      setSelectedDoc(null);
    };

    if (docsLoading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-yellow-600 to-green-600 p-3 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Pest Control Documents</h1>
              <p className="text-slate-400">Documents sent by admin to your branch</p>
            </div>
          </div>
          <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <div className="text-slate-400">Loading pest control documents...</div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
        {/* Full Table Layout */}
        <div className="bg-slate-800/50 rounded-lg overflow-hidden mx-2 sm:mx-0">
          
          {pestControlDocs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Document</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Type</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Size</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Received</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Format</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Status</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {pestControlDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Shield className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-white truncate">{doc.title}</div>
                              <div className="text-xs text-slate-400 truncate">{doc.filename}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-500/30">
                            {doc.docType === 'pest-control-report' ? 'Pest Control' :
                             doc.docType === 'inspection-report' ? 'Inspection' :
                             doc.docType === 'treatment-record' ? 'Treatment' :
                             doc.docType === 'monthly-treatment' ? 'Monthly Treatment' :
                             doc.docType?.replace('-', ' ').toUpperCase() || 'INSPECTION CERTIFICATE'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-300">{doc.viewSize || 'A4'}</div>
                          <div className="text-xs text-slate-400">{Math.round((doc.fileSize || 0) / 1024)} KB</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-300">
                            {(doc.sentAt || doc.createdAt) ? new Date(doc.sentAt || doc.createdAt).toLocaleDateString('en-GB') : 'Not received'}
                          </div>
                          <div className="text-xs text-slate-400">
                            {(doc.sentAt || doc.createdAt) ? new Date(doc.sentAt || doc.createdAt).toLocaleTimeString() : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-300">
                            {doc.mimeType?.includes('pdf') ? 'PDF' : 
                             doc.mimeType?.includes('image') ? 'Image' : 'Document'}
                          </div>
                          <div className="text-xs text-slate-400">{doc.mimeType}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-400">
                              {doc.isInMyDocs ? 'In My Docs' : 'Available'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              size="sm"
                              onClick={() => deletePestControlDoc.mutate(doc.id)}
                              disabled={deletePestControlDoc.isPending}
                              className="bg-red-600 hover:bg-red-700 text-white"
                              title="Delete Document"
                              data-testid={`button-delete-pest-control-doc-${doc.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleViewDoc(doc)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                              title="View Document"
                              data-testid={`button-view-pest-control-doc-${doc.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => savePestControlDoc.mutate(doc.id)}
                              disabled={savePestControlDoc.isPending}
                              className="bg-gradient-to-r from-green-500 to-yellow-600 hover:from-green-600 hover:to-yellow-700 text-white"
                              title="Save to My Documents"
                              data-testid={`button-save-pest-control-doc-${doc.id}`}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Summary Footer */}
              <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-400">
                    Total Documents: <span className="text-white font-medium">{pestControlDocs.length}</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    In My Docs: <span className="text-green-400 font-medium">
                      {pestControlDocs.filter(d => d.isInMyDocs).length}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-500/20 to-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-12 w-12 text-yellow-400" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-green-400/5 rounded-full blur-xl"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Documents Received</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Pest control documents sent by admin will appear here. Check back later or contact admin if you're expecting documents.
              </p>
            </div>
          )}
        </div>
        
        {/* Grid View Toggle Button */}
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Toggle between table and grid view
              const gridView = document.querySelector('.pest-control-grid');
              const tableView = document.querySelector('.pest-control-table');
              // This would toggle between views if implemented
            }}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Grid className="h-4 w-4 mr-2" />
            Switch to Grid View
          </Button>
        </div>

      </div>
    );
  };

  const YearlyDocsContent = () => {
    if (docsLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
          <p className="mt-2 text-slate-400">Loading yearly documents...</p>
        </div>
      );
    }

    if (yearlyDocs.length === 0) {
      if (docsError) {
        return (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-400">Error loading yearly documents</p>
            <p className="text-slate-500 text-sm">{docsError.message}</p>
            <button 
              onClick={() => refetchYearlyDocs()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        );
      }
      
      return (
        <div className="text-center py-8">
          <FileImage className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No yearly documents received yet</p>
          <p className="text-slate-500 text-sm">Documents sent by admin will appear here</p>
          <button 
            onClick={() => refetchYearlyDocs()}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Refresh
          </button>
        </div>
      );
    }

    if (yearlyDocs && yearlyDocs.length > 0) {
      return (
        <>
          {/* Full Table Layout */}
          <div className="bg-slate-800/50 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 text-center">
              <h3 className="text-lg font-semibold text-white">Yearly Documents Table</h3>
              <p className="text-sm text-slate-400">Complete list of all yearly documents</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Document</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Type</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Size</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Issue Date</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Expiry Date</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Format</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">Status</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {yearlyDocs.map((doc: any) => {
                    console.log('Rendering individual doc:', doc.id, doc.title);
                    return (
                      <tr key={doc.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileImage className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-white truncate">{doc.title}</div>
                              <div className="text-xs text-slate-400 truncate">{doc.filename}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
                            {doc.docType === 'coshh-risk-assessment' ? 'COSHH/Risk Assessment' :
                             doc.docType === 'inspection-report' ? 'Inspection Report' :
                             doc.docType === 'yearly-contract' ? 'Yearly Contract' :
                             doc.docType === 'yearly-membership-certificate' ? 'Membership Certificate' :
                             doc.docType === 'guideline-chart-3d' ? 'Guideline Chart 3D' :
                             doc.docType?.replace('-', ' ') || 'Document'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-300">{doc.viewSize || 'A4'}</div>
                          <div className="text-xs text-slate-400">{Math.round((doc.fileSize || 0) / 1024)} KB</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-300">
                            {doc.issueDate && !isNaN(new Date(doc.issueDate).getTime()) ? 
                              new Date(doc.issueDate).toLocaleDateString() : 'Not specified'}
                          </div>
                          <div className="text-xs text-slate-400">
                            {doc.issueDate && !isNaN(new Date(doc.issueDate).getTime()) ? 
                              new Date(doc.issueDate).toLocaleTimeString() : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm ${
                            doc.expiryDate && new Date(doc.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
                              ? 'text-red-400' : 'text-slate-300'
                          }`}>
                            {doc.expiryDate && !isNaN(new Date(doc.expiryDate).getTime()) ? 
                              new Date(doc.expiryDate).toLocaleDateString() : 'No expiry'}
                          </div>
                          <div className="text-xs text-slate-400">
                            {doc.expiryDate && !isNaN(new Date(doc.expiryDate).getTime()) ? 
                              new Date(doc.expiryDate).toLocaleTimeString() : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-300">
                            {doc.mimeType?.includes('pdf') ? 'PDF' : 
                             doc.mimeType?.includes('image') ? 'Image' : 'Document'}
                          </div>
                          <div className="text-xs text-slate-400">{doc.mimeType}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-400">
                              {doc.isInMyDocs ? 'In My Docs' : 'Available'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPDFDocument({
                                  viewUrl: `/api/yearly-docs/${doc.id}/view`,
                                  filename: doc.filename || doc.title,
                                  title: doc.title,
                                  fileSize: doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : undefined,
                                });
                                setShowPDFViewer(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              title="View Document"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => sendYearlyDocToMyDocs.mutate(doc.id)}
                              disabled={sendYearlyDocToMyDocs.isPending}
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                              title="Save to My Documents"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (confirm('Delete this yearly document?')) {
                                  deleteYearlyDoc.mutate(doc.id);
                                }
                              }}
                              disabled={deleteYearlyDoc.isPending}
                              className="bg-red-600 hover:bg-red-700 text-white"
                              title="Delete Document"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Summary Footer */}
            <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  Total Documents: <span className="text-white font-medium">{yearlyDocs.length}</span>
                </div>
                <div className="text-sm text-slate-400">
                  In My Docs: <span className="text-green-400 font-medium">
                    {yearlyDocs.filter((d: any) => d.isInMyDocs).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
        </>
      );
    }

    return (
      <div className="text-center py-8">
        <FileImage className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No yearly documents received yet</p>
        <p className="text-slate-500 text-sm">Documents sent by admin will appear here</p>
      </div>
    );
  };

  const themeColors = {
    blue: {
      primary: "from-blue-600 to-blue-700",
      secondary: "from-blue-800 to-blue-900",
      accent: "border-blue-400",
      bg: "bg-blue-600",
      sidebar: "bg-blue-900/95",
      sidebarBorder: "border-blue-700/50",
      activeButton: "bg-blue-600/20 text-blue-300 border-blue-500/30",
      hoverButton: "hover:bg-blue-700/50"
    },
    purple: {
      primary: "from-purple-600 to-purple-700",
      secondary: "from-purple-800 to-purple-900",
      accent: "border-purple-400",
      bg: "bg-purple-600",
      sidebar: "bg-purple-900/95",
      sidebarBorder: "border-purple-700/50",
      activeButton: "bg-purple-600/20 text-purple-300 border-purple-500/30",
      hoverButton: "hover:bg-purple-700/50"
    },
    pink: {
      primary: "from-pink-600 to-pink-700",
      secondary: "from-pink-800 to-pink-900",
      accent: "border-pink-400",
      bg: "bg-pink-600",
      sidebar: "bg-pink-900/95",
      sidebarBorder: "border-pink-700/50",
      activeButton: "bg-pink-600/20 text-pink-300 border-pink-500/30",
      hoverButton: "hover:bg-pink-700/50"
    },
    green: {
      primary: "from-green-600 to-green-700",
      secondary: "from-green-800 to-green-900",
      accent: "border-green-400",
      bg: "bg-green-600",
      sidebar: "bg-green-900/95",
      sidebarBorder: "border-green-700/50",
      activeButton: "bg-green-600/20 text-green-300 border-green-500/30",
      hoverButton: "hover:bg-green-700/50"
    },
    orange: {
      primary: "from-orange-600 to-orange-700",
      secondary: "from-orange-800 to-orange-900",
      accent: "border-orange-400",
      bg: "bg-orange-600",
      sidebar: "bg-orange-900/95",
      sidebarBorder: "border-orange-700/50",
      activeButton: "bg-orange-600/20 text-orange-300 border-orange-500/30",
      hoverButton: "hover:bg-orange-700/50"
    }
  };

  const currentTheme = themeColors[selectedTheme as keyof typeof themeColors];

  const sidebarItems = [
    {
      category: null,
      items: [
        { id: "dashboard", label: "Dashboard", icon: BarChart3 }
      ]
    },
    {
      category: "CONTENT AREAS",
      items: [
        { id: "my-documents", label: "My Documents", icon: FileText },
        { id: "photos", label: "Photos", icon: Camera },
        { id: "pest-control-docs", label: "Pest Control Docs", icon: FileText },
        { id: "monthly-reports", label: "Monthly Reports", icon: Calendar },
        { id: "yearly-docs", label: "Yearly Docs", icon: Archive },
        { id: "useful-links", label: "Useful Links", icon: LinkIcon },
        { id: "smart-devices", label: "Smart Devices", icon: Shield }
      ]
    },
    {
      category: "SHOP LAYOUT TOOLS",
      items: [
        { id: "chart-designer", label: "Chart Designer", icon: Layout }
      ]
    },
    {
      category: "SYSTEM MANAGEMENT",
      items: [
        { id: "payments", label: "Payments", icon: CreditCard },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "settings", label: "Settings", icon: Settings }
      ]
    },

    {
      category: null,
      items: [
        { id: "logout", label: "Logout", icon: LogOut }
      ]
    }
  ];

  const statsCards = [
    {
      title: "Your Rating",
      value: `${currentBranch?.starRating || 5}/5`,
      change: "+0.5",
      color: "from-purple-600 to-purple-700",
      positive: true
    },
    {
      title: "Documents",
      value: stats?.documentsCount || 0,
      change: "+3",
      color: "from-purple-800 to-purple-900",
      positive: true
    },
    {
      title: "Compliance",
      value: "92%",
      change: "+5%",
      color: "from-blue-600 to-blue-700",
      positive: true
    },
    {
      title: "Pending Tasks",
      value: "4",
      change: "-2",
      color: "from-purple-700 to-purple-800",
      positive: false
    }
  ];

  const renderMainContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Header with Branch Logo and User Info */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center gap-3 min-w-0">
                {/* Branch Logo with Avatar Component - EXTRA BIG SIZE - INSTANT LOAD */}
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 border-4 border-white/30 shadow-2xl">
                  {currentBranch?.id ? (
                    <AvatarImage 
                      src={`/api/branches/${currentBranch.id}/logo?t=${currentBranch?.updatedAt ? new Date(currentBranch.updatedAt).getTime() : Date.now()}`}
                      alt={`${currentBranch?.name} Logo`}
                      onLoad={() => {
                        console.log(`✅ Dashboard Logo loaded successfully for ${currentBranch?.name}`);
                      }}
                      onError={(e) => {
                        console.error(`❌ Dashboard Logo failed to load for ${currentBranch?.name}`, e);
                        const target = e.target as HTMLImageElement;
                        const originalUrl = currentBranch?.logoUrl;
                        
                        if (originalUrl && !target.src.includes('/attached_assets/')) {
                          console.log(`🔄 Trying fallback URL: ${originalUrl}`);
                          if (originalUrl.startsWith('/uploads/')) {
                            target.src = originalUrl.replace('/uploads/', '/attached_assets/');
                          } else if (originalUrl.startsWith('/data/')) {
                            target.src = originalUrl.replace('/data/', '/uploads/');
                          } else {
                            target.src = `/attached_assets/${originalUrl}`;
                          }
                        } else if (originalUrl && !target.src.includes('/data/')) {
                          target.src = originalUrl.replace('/uploads/', '/data/').replace('/attached_assets/', '/data/');
                        }
                      }}
                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-lg sm:text-xl lg:text-2xl font-bold">
                    {currentBranch?.name?.substring(0, 2).toUpperCase() || 'BR'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Pest Control Dashboard</h1>
                    <div className="flex items-center">
                      {currentBranch?.starRating === 0 ? (
                        <span className="text-red-400 text-2xl sm:text-3xl lg:text-4xl font-bold">0★</span>
                      ) : (
                        <div className={`flex ${
                          (currentBranch?.starRating || 5) >= 4 ? 'text-green-400' : 
                          (currentBranch?.starRating || 5) === 3 ? 'text-yellow-500' :
                          'text-amber-500'
                        }`}>
                          {[...Array(currentBranch?.starRating || 5)].map((_, i) => (
                            <span key={i} className="text-2xl sm:text-3xl lg:text-4xl">★</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="h-8 sm:h-10 lg:h-12 overflow-hidden ticker" data-testid="ticker-branch-name">
                    <div className="ticker-track text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                      <span>{currentBranch?.name || "Amigos Burgers & Shakes"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              {statsCards.map((stat, index) => (
                <Card key={index} className={`bg-gradient-to-br ${
                  index === 0 ? currentTheme.primary : 
                  index === 1 ? currentTheme.secondary : 
                  index === 2 ? "from-blue-600 to-blue-700" : 
                  currentTheme.primary
                } border-0 text-white`}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          {index === 0 && <BarChart3 className="w-4 h-4 text-white" />}
                          {index === 1 && <FileText className="w-4 h-4 text-white" />}
                          {index === 2 && <CheckCircle className="w-4 h-4 text-white" />}
                          {index === 3 && <AlertTriangle className="w-4 h-4 text-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white/90 text-xs sm:text-sm font-medium truncate">
                            {stat.title}
                          </p>
                          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-white">
                            {stat.value}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`text-xs sm:text-sm font-medium ${
                          stat.positive ? 'text-green-300' : 'text-red-300'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Food Safety Rating Section */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-6 mb-6">
                {/* Rotating 3D Logo Cube */}
                <div className="relative w-16 h-16 perspective-1000">
                  <div className="w-full h-full relative preserve-3d">
                    <div 
                      className="absolute inset-0 bg-gradient-to-br from-green-500 via-yellow-500 to-orange-500 rounded-xl shadow-2xl border border-white/30 backdrop-blur-sm"
                      style={{
                        transform: `rotateY(${rotation}deg)`,
                        transition: "transform 0.6s ease-in-out"
                      }}
                    >
                      <div className="relative w-full h-full p-2">
                        <img 
                          src={logos[currentLogoIndex]} 
                          alt="Food Safety Rating" 
                          className="w-full h-3/4 object-contain rounded-xl"
                          onError={(e) => {
                            console.error('Logo failed to load:', logos[currentLogoIndex]);
                            e.currentTarget.src = 'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087870687-000adb4f-18c5-4442-a78b-29271b8fb56a-fallback-logo-bzJbp8iGJMwBwZsANVpxPe051OEHfY.png';
                          }}
                        />
                        <div className="flex justify-center items-center h-1/4 space-x-0.5">
                          {[...Array(currentBranch?.starRating || 5)].map((_, i) => (
                            <img key={i} src={starIcon} alt="star" className="w-2 h-2 filter drop-shadow-sm" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-white">Food Safety Rating</h2>
              </div>
              <p className="text-slate-300 text-lg max-w-4xl mx-auto">
                Offering pest control services and hygiene training can definitely lead to high ratings if the 
                service is effective and reliable. To get that 5-star rating, it's important to focus on a few key areas:
              </p>
            </div>

            {/* Service Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Pest Control Card */}
              <Card className="bg-slate-800/50 border-slate-600/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Bug className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Pest Control</h3>
                      <p className="text-slate-400 text-sm">Regular inspections & treatments</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Inspection</span>
                      <span className="text-white font-semibold">
                        {branchProfile?.lastInspection 
                          ? new Date(branchProfile.lastInspection).toLocaleDateString('en-GB', {
                              year: 'numeric',
                              month: 'short', 
                              day: '2-digit'
                            })
                          : 'Not set'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Next Due</span>
                      <span className="text-white font-semibold">
                        {branchProfile?.nextDue 
                          ? new Date(branchProfile.nextDue).toLocaleDateString('en-GB', {
                              year: 'numeric',
                              month: 'short', 
                              day: '2-digit'
                            })
                          : 'Not set'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
                        Compliant
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Agreement Card */}
              <Card className="bg-slate-800/50 border-slate-600/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Payment Agreement</h3>
                      <p className="text-slate-400 text-sm">Current payment setup</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount</span>
                      <span className="text-white font-semibold">
                        {currentBranch?.paymentAmount ? `£${currentBranch.paymentAmount}` : 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Method</span>
                      <span className="text-white font-semibold capitalize">
                        {currentBranch?.paymentMethod || 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Frequency</span>
                      <span className="text-white font-semibold capitalize">
                        {currentBranch?.visitFrequency || currentBranch?.paymentFrequency || 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <Badge className={currentBranch?.paymentAmount ? "bg-green-600/20 text-green-300 border-green-500/30" : "bg-slate-600/20 text-slate-400 border-slate-500/30"}>
                        {currentBranch?.paymentAmount ? 'Active' : 'Not configured'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hygiene Training Card */}
              <Card className="bg-slate-800/50 border-slate-600/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Hygiene Training</h3>
                      <p className="text-slate-400 text-sm">Staff certification & training</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Training</span>
                      <span className="text-white font-semibold">
                        {currentBranch?.lastTraining
                          ? new Date(currentBranch.lastTraining).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })
                          : 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Next Due</span>
                      <span className="text-white font-semibold">
                        {currentBranch?.trainingNextDue
                          ? new Date(currentBranch.trainingNextDue).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })
                          : 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <Badge className={currentBranch?.lastTraining ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-slate-600/20 text-slate-400 border-slate-500/30"}>
                        {currentBranch?.lastTraining ? 'Compliant' : 'Not set'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>



              {/* Documentation Card */}
              <Card className="bg-slate-800/50 border-slate-600/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Documentation</h3>
                      <p className="text-slate-400 text-sm">Records & compliance checks</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Inspection Updated</span>
                      <span className="text-white font-semibold">Yes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">COSHH Updated</span>
                      <span className="text-white font-semibold">Yes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Audit Score</span>
                      <span className="text-white font-semibold">98/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Audit</span>
                      <span className="text-white font-semibold">20 Apr 2025</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tips Section */}
            <Card className="bg-slate-800/50 border-slate-600/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">💡</span>
                  <h3 className="text-xl font-bold text-white">Tips for Maintaining High Ratings</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                    <p className="text-slate-300">
                      Schedule regular pest control inspections and maintain detailed logs.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                    <p className="text-slate-300">
                      Ensure all staff complete hygiene training within 30 days of joining.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                    <p className="text-slate-300">
                      Conduct daily cleaning audits and maintain sanitization standards.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                    <p className="text-slate-300">
                      Keep safety documentation up-to-date and easily accessible.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "documents":
      case "my-documents":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-white">My Documents</h1>
              <p className="text-slate-400">View documents saved from Monthly Reports section.</p>
              
              {/* Search Bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
                <Button className="bg-white text-slate-900 hover:bg-slate-100">
                  + Filter
                </Button>
              </div>
            </div>

            {/* My Documents Content - Using myDocuments for saved documents */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-6">
                {documentsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                    <p className="mt-2 text-slate-400">Loading documents...</p>
                  </div>
                ) : myDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {myDocuments.map((doc: any) => (
                      <div key={doc.id} className="bg-gradient-to-r from-slate-800/60 to-slate-700/40 rounded-xl p-6 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-200 shadow-lg">
                        <div className="flex flex-col space-y-4">
                          <div className="flex items-start space-x-4">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              doc.type === 'monthly-report' 
                                ? 'bg-gradient-to-br from-purple-600 to-purple-700' 
                                : 'bg-gradient-to-br from-blue-600 to-blue-700'
                            }`}>
                              {doc.type === 'photo' ? (
                                <Camera className="h-7 w-7 text-white" />
                              ) : doc.type === 'monthly-report' ? (
                                <Calendar className="h-7 w-7 text-white" />
                              ) : (
                                <FileText className="h-7 w-7 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-bold text-xl mb-2">{doc.title}</h4>
                              {doc.description && (
                                <p className="text-slate-400 text-sm mb-3">{doc.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 mb-3">
                                <Badge className={`px-3 py-1 ${
                                  doc.type === 'monthly-report' 
                                    ? 'bg-purple-600/20 text-purple-300 border-purple-500/30'
                                    : 'bg-blue-600/20 text-blue-300 border-blue-500/30'
                                }`}>
                                  {doc.category}
                                </Badge>
                                {doc.filename && (
                                  <Badge variant="outline" className="text-slate-400 border-slate-600 px-3 py-1">
                                    {doc.filename.split('.').pop()?.toUpperCase() || 'FILE'}
                                  </Badge>
                                )}
                                {doc.createdAt && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-slate-400 text-sm">
                                      Saved: {new Date(doc.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Document validity and retention info */}
                              <div className="space-y-3">
                                {doc.description && doc.description.includes('Issue Date:') && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                      <span className="text-slate-400">
                                        {doc.description.split('|')[0].trim()}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                                      <span className="text-slate-400">
                                        {doc.description.split('|')[1]?.trim()} (1 month validity)
                                      </span>
                                    </div>
                                  </div>
                                )}
                                
                          {/* Action buttons with proper sizing and overflow control */}
                          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-600/30">
                            {(() => {
                              const filename = doc.filename || '';
                              const extension = filename.split('.').pop()?.toLowerCase() || '';
                              const isImage = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension);
                              const isPDF = extension === 'pdf';
                              const isText = ['txt', 'doc', 'docx'].includes(extension);
                              
                              let viewUrl = '';
                              if (doc.type === 'photo' || isImage) {
                                // For photos, use smart image API that handles multiple paths
                                if (doc.filename) {
                                  viewUrl = `/api/documents/${doc.id}/preview`;
                                } else {
                                  viewUrl = `/api/documents/${doc.id}/download`;
                                }
                              } else if (doc.type === 'monthly-report') {
                                viewUrl = doc.filename ? `/uploads/${doc.filename}` : `/api/documents/${doc.id}/download`;
                              } else {
                                viewUrl = `/api/documents/${doc.id}/download`;
                              }
                              
                              let buttonColor = 'green';
                              let buttonText = 'View';
                              
                              if (isImage || doc.type === 'photo') {
                                buttonColor = 'blue';
                                buttonText = 'View Image';
                              } else if (isPDF) {
                                buttonColor = 'red';
                                buttonText = 'View PDF';
                              } else if (isText) {
                                buttonColor = 'yellow';
                                buttonText = 'View';
                              } else if (doc.type === 'monthly-report') {
                                buttonColor = 'purple';
                                buttonText = 'View Report';
                              }
                              
                              const colorClasses = {
                                blue: 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/20',
                                green: 'bg-green-600/20 hover:bg-green-600/30 text-green-300 border-green-500/30 hover:border-green-400/50 hover:shadow-green-500/20',
                                red: 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border-red-500/30 hover:border-red-400/50 hover:shadow-red-500/20',
                                yellow: 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border-yellow-500/30 hover:border-yellow-400/50 hover:shadow-yellow-500/20',
                                purple: 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border-purple-500/30 hover:border-purple-400/50 hover:shadow-purple-500/20'
                              };
                              
                              return (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      console.log(`Viewing ${extension.toUpperCase()} file:`, viewUrl);
                                      const finalViewUrl = `/api/documents/${doc.id}/preview`;
                                      if (isImage) {
                                        setSelectedDocument({
                                          ...doc,
                                          viewUrl: finalViewUrl,
                                          extension,
                                          isImage,
                                          isPDF,
                                          isText,
                                          fallbackPaths: [
                                            `/api/documents/${doc.id}/preview`,
                                            `/api/photos/${doc.id}/view`,
                                            `/uploads/${doc.filename}`,
                                            `/attached_assets/${doc.filename}`,
                                            `/api/documents/${doc.id}/download`
                                          ]
                                        });
                                        setShowDocumentViewer(true);
                                      } else {
                                        setSelectedPDFDocument({
                                          viewUrl: finalViewUrl,
                                          filename: doc.filename,
                                          title: doc.title,
                                          fileSize: doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : undefined,
                                        });
                                        setShowPDFViewer(true);
                                      }
                                    }}
                                    className={`${(colorClasses as any)[buttonColor] || colorClasses.blue} border transition-all duration-300 shadow-lg backdrop-blur-sm text-xs px-3 py-2 h-9 w-full sm:w-auto flex items-center justify-center font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0`}
                                  >
                                    <Eye className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                    <span className="truncate">{buttonText}</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => deleteFromMyDocs.mutate(doc.id)}
                                    disabled={deleteFromMyDocs.isPending}
                                    className="bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 hover:border-red-400/50 transition-all duration-300 shadow-lg hover:shadow-red-500/20 backdrop-blur-sm text-xs px-3 py-2 h-9 w-full sm:w-auto flex items-center justify-center font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                    <span className="truncate">Delete</span>
                                  </Button>
                                </>
                              );
                            })()}
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <p className="text-white/60 font-semibold mb-2">No documents available</p>
                    <p className="text-white/40 text-sm mb-3">Documents you save from Monthly Reports, Pest Control Docs, Photos, and Yearly Documents will appear here</p>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 max-w-md mx-auto mt-4">
                      <p className="text-amber-300 text-sm font-medium mb-1">📤 Need to upload documents?</p>
                      <p className="text-amber-200/70 text-xs">If you previously uploaded PNG, GIF, or other files and they're not showing, please re-upload them. Files may need to be uploaded again to ensure they're properly saved.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );



      case "notifications":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">Notifications</h1>
              <p className="text-slate-400">View visit notifications and messages from admin.</p>
            </div>
            


            {/* Branch Notifications */}
            <BranchNotificationPanel branchId={currentBranch?.id || ""} />

            {/* Account Settings */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/60 text-sm">Branch Name</p>
                      <p className="text-white font-medium truncate">{currentBranch?.name || "Cake Box"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/60 text-sm">Email</p>
                      <p className="text-white font-medium truncate">{currentBranch?.email || "—"}</p>
                    </div>
                    <button
                      onClick={() => setShowUpdateProfileModal(true)}
                      className="w-7 h-7 rounded-full bg-blue-500/20 hover:bg-blue-500/40 flex items-center justify-center transition-colors flex-shrink-0"
                      title="Edit email"
                    >
                      <Pencil className="w-3 h-3 text-blue-400" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/60 text-sm">Status</p>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    className="bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center w-full sm:flex-1"
                    onClick={() => setShowChangePasswordModal(true)}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 flex items-center justify-center w-full sm:flex-1"
                    onClick={() => setShowUpdateProfileModal(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Update Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );



      case "photos":
        return <PhotoSection />;

      case "pest-control-docs":
        return <NewPestControlDocsSection />;

      case "useful-links":
        return (
          <div className="space-y-6 min-h-screen">
            <BranchUsefulLinksSection />
          </div>
        );

      case "smart-devices":
        return (
          <div className="space-y-6 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Smart Devices</h2>
                <p className="text-slate-400 text-sm">Your IoT pest control devices — powered by Link24 Cloud</p>
              </div>
            </div>

            {/* Global alarm banner if any device has active alarm */}
            {branchIotDevices.some((d: any) => d.alarmActive) && (
              <div className="bg-red-500/20 border-2 border-red-500/60 rounded-xl p-4 flex items-center gap-4 animate-pulse">
                <span className="text-4xl">🐭</span>
                <div>
                  <p className="text-red-300 font-bold text-lg">MOUSE / RAT DETECTED!</p>
                  <p className="text-red-400 text-sm">One or more Smart Mouser devices have triggered. Please check the traps and contact your pest controller immediately.</p>
                </div>
              </div>
            )}

            {branchIotDevices.length === 0 ? (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-10 flex flex-col items-center gap-4">
                <img src="https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087853714-8a17cb6e-806a-433c-a5b2-5e616bbb45b2-smart-mouser-9IkSDc7KHY9vGd9hY9Z97CfS5sDivs.png" alt="Smart Mouser" className="w-32 h-32 object-contain opacity-40" />
                <p className="text-slate-400 text-lg font-medium">No smart devices assigned</p>
                <p className="text-slate-500 text-sm text-center max-w-xs">Your Smart Mouser devices will appear here once assigned by your administrator.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {branchIotDevices.map((dev: any) => (
                  <div key={dev.id} className={`rounded-xl p-5 space-y-4 border-2 ${dev.alarmActive ? 'bg-red-900/20 border-red-500/60' : 'bg-slate-800/60 border-slate-700/50'}`}>
                    {/* Alarm flash banner */}
                    {dev.alarmActive && (
                      <div className="flex items-center gap-2 bg-red-500/30 rounded-lg px-3 py-2">
                        <span className="text-xl">🐭</span>
                        <div>
                          <p className="text-red-200 font-bold text-sm">MOUSE / RAT DETECTED</p>
                          {dev.lastAlarmAt && (
                            <p className="text-red-300 text-xs">Triggered: {new Date(dev.lastAlarmAt).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <img src="https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087853714-8a17cb6e-806a-433c-a5b2-5e616bbb45b2-smart-mouser-9IkSDc7KHY9vGd9hY9Z97CfS5sDivs.png" alt="Smart Mouser" className={`w-20 h-20 object-contain rounded-xl p-2 ${dev.alarmActive ? 'bg-gradient-to-br from-red-500/40 to-orange-500/40' : 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30'}`} />
                        {dev.alarmActive && (
                          <span className="absolute -top-1 -right-1 text-lg animate-bounce">⚠️</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-semibold text-base truncate">{dev.deviceName}</p>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${dev.isOnline ? 'bg-green-400 shadow-lg shadow-green-500/30' : 'bg-slate-500'}`} />
                            <span className={`text-sm font-medium ${dev.isOnline ? 'text-green-400' : 'text-slate-400'}`}>
                              {dev.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                        <Badge className={`text-xs mb-2 ${dev.alarmActive ? 'bg-red-600/30 text-red-300 border-red-500/40' : 'bg-blue-600/20 text-blue-300 border-blue-500/30'}`}>
                          {dev.alarmActive ? '⚠️ Alarm Active' : 'Smart Mouser'}
                        </Badge>
                        {dev.notes && <p className="text-slate-400 text-sm truncate">{dev.notes}</p>}
                        {dev.lastCheckedAt && (
                          <p className="text-slate-500 text-xs mt-1">Last updated: {new Date(dev.lastCheckedAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    {/* Status indicators */}
                    {Array.isArray(dev.lastStatus) && dev.lastStatus.length > 0 && (
                      <div className={`rounded-lg p-3 space-y-2 ${dev.alarmActive ? 'bg-red-900/30' : 'bg-slate-900/50'}`}>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Device Status</p>
                        <div className="grid grid-cols-2 gap-2">
                          {dev.lastStatus.slice(0, 6).map((s: any) => {
                            const isAlarmDp = s.value === true && ["catch_mouse","shake","alarm","pir_state","temper_alarm","vibration","motion","knock_alarm"].includes((s.code||"").toLowerCase());
                            return (
                              <div key={s.code} className={`flex items-center justify-between rounded px-2 py-1 ${isAlarmDp ? 'bg-red-800/50' : 'bg-slate-800/60'}`}>
                                <span className={`text-xs capitalize ${isAlarmDp ? 'text-red-300' : 'text-slate-400'}`}>{s.code.replace(/_/g, ' ')}</span>
                                <span className={`text-xs font-medium ${isAlarmDp ? 'text-red-200 font-bold' : 'text-white'}`}>
                                  {isAlarmDp ? '⚠️ YES' : (typeof s.value === 'boolean' ? (s.value ? 'Yes' : 'No') : String(s.value))}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="text-center">
              <p className="text-slate-600 text-xs">Powered by Link24 Cloud • IoT Pest Control</p>
            </div>
          </div>
        );

      case "payments":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">Payment Information</h1>
              <p className="text-slate-400">View your payment agreements and billing details.</p>
            </div>

            {/* Payment Agreement Card */}
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-400" />
                  Payment Agreement
                </CardTitle>
                <p className="text-slate-400">Current payment setup and terms</p>
              </CardHeader>
              <CardContent>
                {paymentRecords.length > 0 ? (
                  <div className="space-y-6">
                    {paymentRecords.map((record: any) => (
                      <div 
                        key={record.id}
                        className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg p-6 border border-purple-500/20"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                              <span className="text-white text-xl font-bold">£</span>
                            </div>
                            <p className="text-slate-400 text-sm">Agreement Amount</p>
                            <p className="text-white text-2xl font-bold">£{record.paymentAgreement}</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                              <CreditCard className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-slate-400 text-sm">Payment Method</p>
                            <p className="text-white text-lg font-semibold capitalize">{record.paymentMethod}</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Calendar className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-slate-400 text-sm">Visit Frequency</p>
                            <p className="text-white text-lg font-semibold capitalize">{record.visitFrequency}</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                              <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-slate-400 text-sm">Status</p>
                            <Badge className="bg-green-600/20 text-green-300 border-green-500/30 text-sm">
                              Active
                            </Badge>
                          </div>
                        </div>
                        
                        <Separator className="my-6 bg-slate-600" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <p className="text-slate-400">Agreement Created:</p>
                            <p className="text-white">{new Date(record.createdAt).toLocaleDateString('en-GB')}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-slate-400">Next Service Due:</p>
                            <p className="text-white">Contact admin for scheduling</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Payment Agreement</h3>
                    <p className="text-slate-400 mb-6">No payment agreement has been set up for your branch yet.</p>
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-blue-300 text-sm">
                        Contact your admin to set up payment terms and service agreements.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment History Card - Future Enhancement */}
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-400" />
                  Payment History
                </CardTitle>
                <p className="text-slate-400">Transaction history and payment records</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">Payment history not available</p>
                  <p className="text-slate-500 text-sm">Payment tracking feature coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">Branch Settings</h1>
              <p className="text-slate-400">Customize your branch dashboard experience.</p>
            </div>

            {/* Settings Content */}
            <div className="space-y-8">
              {/* Appearance Settings */}
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-md border-slate-700/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white">Appearance</CardTitle>
                      <p className="text-slate-400 text-sm">Customize colors and display preferences</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">

                  {/* Color Theme Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <div className="w-3 h-3 bg-white rounded-sm"></div>
                      </div>
                      <h3 className="text-white font-semibold text-lg">Color Theme</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {[
                        { name: 'blue', bg: 'bg-blue-600', gradient: 'from-blue-500 to-blue-700' },
                        { name: 'purple', bg: 'bg-purple-600', gradient: 'from-purple-500 to-purple-700' },
                        { name: 'pink', bg: 'bg-pink-600', gradient: 'from-pink-500 to-pink-700' },
                        { name: 'green', bg: 'bg-green-600', gradient: 'from-green-500 to-green-700' },
                        { name: 'orange', bg: 'bg-orange-600', gradient: 'from-orange-500 to-orange-700' }
                      ].map((theme) => (
                        <button
                          key={theme.name}
                          onClick={() => setSelectedTheme(theme.name)}
                          className={`group relative h-14 sm:h-16 rounded-xl bg-gradient-to-br ${theme.gradient} transition-all duration-300 hover:scale-105 ${
                            selectedTheme === theme.name 
                              ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-slate-900 shadow-2xl' 
                              : 'hover:shadow-lg'
                          }`}
                        >
                          <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="relative text-white font-medium capitalize text-xs sm:text-sm">
                            {theme.name}
                          </span>
                          {selectedTheme === theme.name && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                      <h3 className="text-white font-semibold text-lg">Font Size</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { name: 'small', label: 'Small', size: 'text-sm' },
                        { name: 'medium', label: 'Medium', size: 'text-base' },
                        { name: 'large', label: 'Large', size: 'text-lg' }
                      ].map((size) => (
                        <button
                          key={size.name}
                          onClick={() => setSelectedFontSize(size.name)}
                          className={`relative group py-3 sm:py-4 px-4 sm:px-6 rounded-xl border-2 transition-all duration-300 ${
                            selectedFontSize === size.name 
                              ? 'border-purple-500 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white shadow-lg' 
                              : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-500 hover:bg-slate-600/30'
                          }`}
                        >
                          <span className={`font-medium ${size.size}`}>
                            {size.label}
                          </span>
                          {selectedFontSize === size.name && (
                            <div className="absolute top-2 right-2 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Eye className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="text-white font-semibold text-lg">Preview</h3>
                    </div>
                    <div className={`p-4 sm:p-6 rounded-xl bg-gradient-to-r ${
                      selectedTheme === 'blue' ? 'from-blue-600/20 to-blue-500/20' :
                      selectedTheme === 'purple' ? 'from-purple-600/20 to-purple-500/20' :
                      selectedTheme === 'pink' ? 'from-pink-600/20 to-pink-500/20' :
                      selectedTheme === 'green' ? 'from-green-600/20 to-green-500/20' :
                      'from-orange-600/20 to-orange-500/20'
                    } border border-white/10 backdrop-blur-sm`}>
                      <h4 className={`text-white font-bold mb-2 ${selectedFontSize === 'small' ? 'text-base sm:text-lg' : selectedFontSize === 'medium' ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}>
                        Sample Dashboard Card
                      </h4>
                      <p className={`text-slate-300 ${selectedFontSize === 'small' ? 'text-sm' : selectedFontSize === 'medium' ? 'text-sm sm:text-base' : 'text-base sm:text-lg'}`}>
                        This is how your dashboard will look with the selected theme and font size.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-6 space-y-3">
                    <Button 
                      onClick={saveAppearanceSettings}
                      disabled={savePreferencesMutation.isPending}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 sm:px-8 py-3 text-base sm:text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                      data-testid="button-save-appearance-settings"
                    >
                      <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      {savePreferencesMutation.isPending ? 'Saving...' : 'Save Appearance Settings'}
                    </Button>
                    
                    <Button 
                      onClick={resetAppearanceSettings}
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 px-4 sm:px-8 py-3 text-base sm:text-lg font-medium transition-all duration-300 flex items-center justify-center"
                      data-testid="button-reset-appearance-settings"
                    >
                      <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Reset to Defaults
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "monthly-reports":
        return (
          <div className="space-y-6">
            <MonthlyReportsSection />
          </div>
        );

      case "yearly-docs":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Archive className="h-6 w-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">Yearly Documents</h2>
            </div>
            <YearlyDocsContent />
          </div>
        );

      case "chart-designer":
        return <BranchChartPage />;

      default:
        return (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">Section under development</p>
            <p className="text-white/40 text-sm">This feature will be available soon</p>
          </div>
        );
    }
  };

  const getBackgroundGradient = () => {
    switch (savedTheme) {
      case "blue":
        return "bg-gradient-to-br from-blue-900 via-slate-800 to-blue-900";
      case "purple":
        return "bg-gradient-to-br from-purple-900 via-slate-800 to-purple-900";
      case "pink":
        return "bg-gradient-to-br from-pink-900 via-slate-800 to-pink-900";
      case "green":
        return "bg-gradient-to-br from-green-900 via-slate-800 to-green-900";
      case "orange":
        return "bg-gradient-to-br from-orange-900 via-slate-800 to-orange-900";
      default:
        return "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900";
    }
  };

  if (branchLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* My Documents Viewer - A4 Sized Modal */}
      {showDocumentViewer && selectedDocument && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full h-[95vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  selectedDocument.isImage ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-red-500 to-red-600'
                }`}>
                  {selectedDocument.isImage ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  ) : (
                    <FileText className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-white truncate">{selectedDocument.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400">A4 Document • {selectedDocument.extension?.toUpperCase() || 'FILE'}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDocumentViewer(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full h-8 w-8 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 sm:p-6 h-[calc(95vh-100px)]">
              <div className="w-full h-full flex justify-center items-center bg-slate-800 rounded-lg relative">
                <div 
                  className="rounded-lg shadow-2xl overflow-hidden bg-white w-full max-w-[420px] aspect-[210/297] max-h-[calc(95vh-140px)] flex items-center justify-center"
                >
                  <img
                    src={selectedDocument.viewUrl}
                    alt={selectedDocument.title}
                    className="w-full h-full object-contain bg-white"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.img-error-msg')) {
                        const msg = document.createElement('div');
                        msg.className = 'img-error-msg flex flex-col items-center justify-center w-full h-full bg-slate-100 text-slate-500 p-6 text-center';
                        msg.innerHTML = '<svg class="w-12 h-12 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg><p class="font-semibold text-sm">Image Not Available</p><p class="text-xs mt-1">This file was stored temporarily and has been lost. Please ask admin to re-send it.</p>';
                        parent.appendChild(msg);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal PDF Viewer */}
      {showPDFViewer && selectedPDFDocument && (
        <PDFViewer
          fileUrl={selectedPDFDocument.viewUrl}
          fileName={selectedPDFDocument.filename || selectedPDFDocument.title}
          title={selectedPDFDocument.title}
          onClose={() => setShowPDFViewer(false)}
        />
      )}

      <div className={`h-screen ${getBackgroundGradient()} overflow-hidden flex flex-col`}>
      <SmoothCursor enabled={true} />


      {/* Mobile Menu Toggle - positioned on left */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <Button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-slate-800/90 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 p-2 w-11 h-11"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:relative z-50 lg:z-auto
          w-52 ${currentTheme.sidebar} backdrop-blur-md border-r ${currentTheme.sidebarBorder} 
          flex flex-col transition-transform duration-300 ease-in-out h-full overflow-hidden
        `}>
          {/* Pest Control Dashboard Header with Logo */}
          <div className={`p-4 border-b ${currentTheme.sidebarBorder}`}>
            <div className="flex items-center gap-3">
              {/* Branch Logo with Upload - always uses API endpoint (generates initials if no logo) */}
              <div className="relative group">
                <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-white/30 cursor-pointer shadow-xl" onClick={() => setShowLogoUpload(true)}>
                  <AvatarImage 
                    src={currentBranch?.id ? `/api/branches/${currentBranch.id}/logo?t=${currentBranch?.updatedAt ? new Date(currentBranch.updatedAt).getTime() : Date.now()}` : ''}
                    alt={`${currentBranch?.name} Logo`}
                    onLoad={() => {
                      console.log(`✅ Sidebar Logo loaded successfully for ${currentBranch?.name}`);
                    }}
                    onError={(e) => {
                      console.error(`❌ Sidebar Logo failed to load for ${currentBranch?.name}`, e);
                    }}
                  />
                  <AvatarFallback className={`${currentTheme.bg} text-white text-base sm:text-lg font-bold`}>
                    {currentBranch?.name?.substring(0, 2).toUpperCase() || 'BR'}
                  </AvatarFallback>
                </Avatar>
                
                {/* Upload overlay on hover */}
                <div 
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => setShowLogoUpload(true)}
                >
                  <Upload className="w-4 h-4 text-white" />
                </div>
              </div>
              
              {/* Branch Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-xs truncate">
                  {branchProfile?.name || 'Amigos Burgers & Shakes'}
                </h2>
                <p className="text-slate-400 text-xs truncate">
                  {branchProfile?.address || 'Dashboard'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation with Scrollbar */}
          <div className="flex-1 p-4 space-y-1 overflow-y-auto sidebar-scroll">
            {sidebarItems.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {section.category && (
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-6">
                    {section.category}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === "logout") {
                          setShowLogoutConfirm(true);
                          setSidebarOpen(false);
                        } else {
                          setActiveSection(item.id);
                          setSidebarOpen(false); // Close sidebar on mobile when item is selected
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeSection === item.id
                          ? `${currentTheme.activeButton} border`
                          : item.id === "logout"
                          ? "text-slate-400 hover:bg-red-600/10 hover:text-red-300"
                          : `text-slate-300 ${currentTheme.hoverButton} hover:text-white`
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                      {item.id === "settings" && (
                        <div className="w-2 h-2 bg-red-500 rounded-full ml-auto"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8 overflow-auto pt-16 lg:pt-8 pb-safe-area-inset-bottom">
          {renderMainContent()}
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                <LogOut className="h-5 w-5 text-white" />
              </div>
              Log Out
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to log out of your branch dashboard?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowLogoutConfirm(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Log Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Change Password</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <ChangePasswordForm 
            onSuccess={() => {
              setShowChangePasswordModal(false);
              toast({
                title: "Password Changed",
                description: "Your password has been updated successfully.",
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Update Profile Modal */}
      <Dialog open={showUpdateProfileModal} onOpenChange={setShowUpdateProfileModal}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Update Profile</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update your branch information and contact details.
            </DialogDescription>
          </DialogHeader>
          <UpdateProfileForm 
            key={showUpdateProfileModal ? currentBranch?.id + '_open' : 'closed'}
            currentBranch={currentBranch}
            onSuccess={() => {
              setShowUpdateProfileModal(false);
              queryClient.invalidateQueries({ queryKey: ["/api/branch/current"] });
              toast({
                title: "Profile Updated",
                description: "Your profile has been updated successfully.",
              });
            }}
          />
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}

// Change Password Form Component
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function ChangePasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof changePasswordSchema>) => {
      return apiRequest("POST", "/api/branch/change-password", data);
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof changePasswordSchema>) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Current Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter current password"
                  {...field}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">New Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  {...field}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Confirm New Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  {...field}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Update Profile Form Component
const updateProfileSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

function UpdateProfileForm({ currentBranch, onSuccess }: { currentBranch: Branch | undefined; onSuccess: () => void }) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof updateProfileSchema>>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: currentBranch?.name || "",
      email: currentBranch?.email || "",
      phone: currentBranch?.phone || "",
      address: currentBranch?.address || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateProfileSchema>) => {
      return apiRequest("PUT", "/api/branch/profile", data);
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof updateProfileSchema>) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Branch Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter branch name"
                  {...field}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter email address"
                  type="email"
                  {...field}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Phone Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter phone number"
                  {...field}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter branch address"
                  {...field}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
}