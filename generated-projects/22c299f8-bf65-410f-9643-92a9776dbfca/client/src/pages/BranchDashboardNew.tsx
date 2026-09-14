import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  Shield, 
  Building2, 
  LogOut,
  Bell,
  AlertCircle,
  CheckCircle,
  Star,
  Users,
  Activity,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import CustomCursor from "@/components/CustomCursor";

interface BranchInfo {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  status: string;
  contractStartDate?: string;
  contractEndDate?: string;
}

interface Document {
  id: string;
  title: string;
  filename: string;
  type: string;
  category: string;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  downloadedAt?: string;
  expiryDate?: string;
  isExpired: boolean;
}

interface BranchStats {
  documentsCount: number;
  photosCount: number;
  reportsCount: number;
  tasksCount: number;
}

export default function BranchDashboardNew() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch branch info
  const { data: branchInfo, isLoading: branchLoading } = useQuery<BranchInfo>({
    queryKey: ["/api/branch/current"],
    retry: false,
  });

  // Fetch branch documents
  const { data: documents, isLoading: documentsLoading, refetch: refetchDocuments } = useQuery<Document[]>({
    queryKey: ["/api/branch/documents", selectedCategory === "all" ? undefined : selectedCategory],
    retry: false,
  });

  // Fetch branch stats
  const { data: stats, isLoading: statsLoading } = useQuery<BranchStats>({
    queryKey: ["/api/branch/stats"],
    retry: false,
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/branch/logout", { method: "POST" });
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      window.location.href = "/branch-login";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (documentId: string, filename: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: `${filename} is being downloaded`,
      });
      
      refetchDocuments();
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download the document",
        variant: "destructive",
      });
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      contract: "Contract",
      membership_certificate: "Membership Certificate",
      coshh_risk_assessment: "COSHH Risk Assessment",
      inspection_report: "Inspection Report",
    };
    return types[type] || type;
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      contracts: "Contracts",
      certificates: "Certificates",
      monthly_reports: "Monthly Reports",
    };
    return categories[category] || category;
  };

  const getStatusBadge = (doc: Document) => {
    if (doc.isExpired) {
      return <Badge variant="destructive" className="text-xs">Expired</Badge>;
    }
    if (doc.downloadedAt) {
      return <Badge variant="default" className="text-xs bg-green-600">Downloaded</Badge>;
    }
    if (doc.viewedAt) {
      return <Badge variant="secondary" className="text-xs">Viewed</Badge>;
    }
    return <Badge variant="outline" className="text-xs">New</Badge>;
  };

  if (branchLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center relative overflow-hidden">
        <CustomCursor />
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
          <div className="absolute bottom-32 right-20 w-24 h-24 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>
        
        <div className="text-center z-10">
          <div className="relative">
            {/* Rotating Logo Cubes */}
            <div className="flex space-x-4 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg animate-spin" style={{ animationDelay: `${i * 0.5}s`, animationDuration: "3s" }}>
                    <div className="absolute inset-2 bg-white/20 rounded backdrop-blur-sm flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 text-white text-lg font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!branchInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center relative overflow-hidden">
        <CustomCursor />
        <Card className="w-full max-w-md bg-black/30 backdrop-blur-xl border-white/20 text-white">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-pink-400 mx-auto mb-4" />
            <CardTitle className="text-white">Access Denied</CardTitle>
            <CardDescription className="text-purple-200">You need to login to access this page</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = "/branch-login"} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 relative overflow-hidden">
      <CustomCursor />
      
      {/* Modern Animated Background Elements - matching admin login */}
      <div className="absolute inset-0 opacity-30">
        {/* Main floating elements */}
        <div className="absolute top-20 left-16 w-40 h-40 bg-gradient-to-br from-purple-400/40 to-pink-400/40 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-32 right-24 w-32 h-32 bg-gradient-to-br from-pink-400/40 to-purple-400/40 rounded-full blur-lg animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-40 left-1/4 w-48 h-48 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-20 right-1/3 w-36 h-36 bg-gradient-to-br from-pink-500/40 to-purple-500/40 rounded-full blur-xl animate-pulse" style={{ animationDelay: "3s" }}></div>
        
        {/* Additional smaller floating elements */}
        <div className="absolute top-1/2 left-12 w-24 h-24 bg-gradient-to-br from-purple-300/30 to-pink-300/30 rounded-full blur-lg animate-pulse" style={{ animationDelay: "4s" }}></div>
        <div className="absolute top-3/4 right-16 w-28 h-28 bg-gradient-to-br from-pink-300/30 to-purple-300/30 rounded-full blur-lg animate-pulse" style={{ animationDelay: "2.5s" }}></div>
        
        {/* Subtle overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20"></div>
      </div>

      {/* Header */}
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-2xl relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              {/* Rotating Logo Cubes */}
              <div className="flex space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg animate-spin" style={{ animationDelay: `${i * 0.3}s`, animationDuration: "4s" }}>
                      <div className="absolute inset-1 bg-white/20 rounded backdrop-blur-sm flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">{branchInfo.name}</h1>
                <p className="text-purple-200 font-medium">Pest Control Management Hub</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleLogout}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
            Welcome to Your Dashboard
          </h2>
          <p className="text-purple-200 text-lg">
            Manage your pest control operations with our comprehensive tools
          </p>
        </div>

        {/* Branch Info Card */}
        <Card className="mb-8 bg-black/20 backdrop-blur-xl border-white/20 text-white shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Shield className="w-5 h-5 text-pink-400" />
              <span>Branch Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-purple-200 mb-1">Branch Name</p>
                <p className="font-medium text-white">{branchInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-purple-200 mb-1">Status</p>
                <Badge 
                  variant={branchInfo.status === 'active' ? 'default' : 'secondary'}
                  className={branchInfo.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}
                >
                  {branchInfo.status}
                </Badge>
              </div>
              {branchInfo.address && (
                <div>
                  <p className="text-sm text-purple-200 mb-1">Address</p>
                  <p className="font-medium text-white">{branchInfo.address}</p>
                </div>
              )}
              {branchInfo.phone && (
                <div>
                  <p className="text-sm text-purple-200 mb-1">Phone</p>
                  <p className="font-medium text-white">{branchInfo.phone}</p>
                </div>
              )}
              {branchInfo.contractStartDate && (
                <div>
                  <p className="text-sm text-purple-200 mb-1">Contract Period</p>
                  <p className="font-medium text-white">
                    {format(new Date(branchInfo.contractStartDate), 'MMM dd, yyyy')} - {' '}
                    {branchInfo.contractEndDate ? format(new Date(branchInfo.contractEndDate), 'MMM dd, yyyy') : 'Ongoing'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-black/20 backdrop-blur-xl border-white/20 text-white shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{stats.documentsCount}</p>
                    <p className="text-sm text-purple-200">Documents</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-black/20 backdrop-blur-xl border-white/20 text-white shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{stats.photosCount}</p>
                    <p className="text-sm text-purple-200">Photos</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-black/20 backdrop-blur-xl border-white/20 text-white shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{stats.reportsCount}</p>
                    <p className="text-sm text-purple-200">Reports</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-400 rounded-lg">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-black/20 backdrop-blur-xl border-white/20 text-white shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{stats.tasksCount}</p>
                    <p className="text-sm text-purple-200">Tasks</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-pink-600 to-purple-400 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Documents Section */}
        <Card className="bg-black/20 backdrop-blur-xl border-white/20 text-white shadow-2xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white text-xl">Documents & Reports</CardTitle>
                <CardDescription className="text-purple-200">View and download your pest control documents</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  className={selectedCategory === "all" ? 
                    "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0" : 
                    "border-white/30 text-purple-200 hover:bg-white/10"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                >
                  All
                </Button>
                <Button
                  variant={selectedCategory === "contracts" ? "default" : "outline"}
                  className={selectedCategory === "contracts" ? 
                    "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0" : 
                    "border-white/30 text-purple-200 hover:bg-white/10"}
                  size="sm"
                  onClick={() => setSelectedCategory("contracts")}
                >
                  Contracts
                </Button>
                <Button
                  variant={selectedCategory === "certificates" ? "default" : "outline"}
                  className={selectedCategory === "certificates" ? 
                    "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0" : 
                    "border-white/30 text-purple-200 hover:bg-white/10"}
                  size="sm"
                  onClick={() => setSelectedCategory("certificates")}
                >
                  Certificates
                </Button>
                <Button
                  variant={selectedCategory === "monthly_reports" ? "default" : "outline"}
                  className={selectedCategory === "monthly_reports" ? 
                    "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0" : 
                    "border-white/30 text-purple-200 hover:bg-white/10"}
                  size="sm"
                  onClick={() => setSelectedCategory("monthly_reports")}
                >
                  Monthly Reports
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {documentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mx-auto"></div>
                <p className="mt-2 text-purple-200">Loading documents...</p>
              </div>
            ) : !documents || documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                <p className="text-white">No documents available</p>
                <p className="text-sm text-purple-200">Documents will appear here when uploaded by admin</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc: Document) => (
                  <div key={doc.id} className="bg-black/10 backdrop-blur-lg border border-white/20 rounded-lg p-6 hover:bg-white/5 transition-all duration-300 shadow-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="font-medium text-white text-lg">{doc.title}</h3>
                          {getStatusBadge(doc)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-purple-200">Type</p>
                            <p className="text-white">{getDocumentTypeLabel(doc.type)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-purple-200">Category</p>
                            <p className="text-white">{getCategoryLabel(doc.category)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-purple-200">Uploaded</p>
                            <p className="text-white">{format(new Date(doc.createdAt), 'MMM dd, yyyy')}</p>
                          </div>
                          {doc.downloadedAt && (
                            <div>
                              <p className="font-medium text-purple-200">Last Downloaded</p>
                              <p className="text-white">{format(new Date(doc.downloadedAt), 'MMM dd, yyyy')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleDownload(doc.id, doc.filename)}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}