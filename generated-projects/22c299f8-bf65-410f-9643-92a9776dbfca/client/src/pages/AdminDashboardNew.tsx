import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Building2, 
  Plus, 
  Upload, 
  FileText, 
  Users, 
  DollarSign, 
  Activity,
  Edit,
  Trash2,
  Send,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  MessageSquare,
  Calendar,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";

const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
});

const notificationSchema = z.object({
  branchId: z.string().min(1, "Please select a branch"),
  message: z.string().min(1, "Notification message is required"),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Visit date must be in YYYY-MM-DD format"),
  visitTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Visit time must be in HH:mm format"),
  purposeOfVisit: z.string().min(1, "Purpose of visit is required"),
  visitType: z.enum(['routine', 'follow-up', 'call-out', 'it', 'itf', 'other'], {
    errorMap: () => ({ message: "Please select a valid visit type" })
  }),
});

type BranchFormData = z.infer<typeof branchSchema>;
type NotificationFormData = z.infer<typeof notificationSchema>;

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  username?: string;
  status: string;
  contractStartDate?: string;
  contractEndDate?: string;
  createdAt: string;
  updatedAt?: string;
}

interface AdminStats {
  totalBranches: number;
  activeUsers: number;
  monthlyRevenue: number;
  systemHealth: number;
}

interface User {
  firstName?: string;
  email?: string;
  id?: string;
}

interface Document {
  id: string;
  title: string;
  filename: string;
  type: string;
  category: string;
  branchId: string;
  createdAt: string;
  sentAt?: string;
}

export default function AdminDashboardNew() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showBulkCreateDialog, setShowBulkCreateDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [bulkCreateCount, setBulkCreateCount] = useState(3000);
  const [isBulkCreating, setIsBulkCreating] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    title: "",
    type: "contract",
    category: "contracts",
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const branchesPerPage = 32;

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!user,
  });

  // Fetch branches with pagination
  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: ["/api/admin/branches", currentPage, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: branchesPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
      });
      const response = await fetch(`/api/admin/branches?${params}`);
      if (!response.ok) throw new Error("Failed to fetch branches");
      return response.json();
    },
    enabled: !!user,
  });
  
  const branches = branchesData?.branches || [];
  const totalPages = branchesData?.pagination?.totalPages || 1;
  const totalBranches = branchesData?.pagination?.totalCount || 0;

  // Fetch documents
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/documents"],
    enabled: !!user,
  });

  const form = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      username: "",
      password: "",
      contractStartDate: "",
      contractEndDate: "",
    },
  });

  const notificationForm = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      branchId: "",
      message: "",
      visitDate: "",
      visitTime: "",
      purposeOfVisit: "",
      visitType: "routine",
    },
  });

  // Create branch mutation
  const createBranchMutation = useMutation({
    mutationFn: async (data: BranchFormData) => {
      const response = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create branch");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Branch created successfully" });
      setShowBranchDialog(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/branches"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create branch", variant: "destructive" });
    },
  });

  // Bulk create branches mutation
  const bulkCreateMutation = useMutation({
    mutationFn: async (count: number) => {
      setIsBulkCreating(true);
      const response = await fetch("/api/admin/bulk-create-branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create branches in bulk");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setIsBulkCreating(false);
      setShowBulkCreateDialog(false);
      setBulkCreateCount(3000);
      toast({ 
        title: "Success", 
        description: `Successfully created ${data.count} branches!`,
        duration: 5000
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/branches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: any) => {
      setIsBulkCreating(false);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create branches in bulk", 
        variant: "destructive",
        duration: 5000
      });
    },
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile || !selectedBranch) throw new Error("Missing file or branch");
      
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadData.title);
      formData.append("type", uploadData.type);
      formData.append("category", uploadData.category);
      formData.append("branchId", selectedBranch);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload document");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Document uploaded successfully" });
      setShowUploadDialog(false);
      setUploadFile(null);
      setUploadData({ title: "", type: "contract", category: "contracts" });
      setSelectedBranch("");
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      const mappedData = {
        branchId: data.branchId,
        message: data.message,
        visitDate: data.visitDate,
        visitTime: data.visitTime,
        purposeOfVisit: data.purposeOfVisit,
        visitTypes: [data.visitType] // visitType is already the correct backend enum value
      };

      const response = await apiRequest("POST", "/api/notifications", mappedData);
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({ title: "Success", description: "Notification sent successfully" });
      setShowNotificationDialog(false);
      notificationForm.reset();
      // Invalidate notification cache for the specific branch
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/branch', variables.branchId] });
    },
    onError: (error: any) => {
      // Parse server error message if available
      let errorMessage = "Failed to send notification";
      if (error.message) {
        try {
          // Extract meaningful error from server response
          const match = error.message.match(/^\d{3}: (.+)$/);
          if (match) {
            errorMessage = match[1];
          } else {
            errorMessage = error.message;
          }
        } catch {
          errorMessage = error.message;
        }
      }
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp', 'image/bmp', 'image/tiff'];
      if (allowedTypes.includes(file.type)) {
        setUploadFile(file);
        if (!uploadData.title) {
          setUploadData(prev => ({ ...prev, title: file.name.split('.')[0] }));
        }
      } else {
        toast({
          title: "Invalid File Type",
          description: "Only PDF, JPG, PNG, GIF, SVG, WebP, BMP, and TIFF files are allowed",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = (data: BranchFormData) => {
    createBranchMutation.mutate(data);
  };

  const onNotificationSubmit = (data: NotificationFormData) => {
    sendNotificationMutation.mutate(data);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>Please login as an admin to access this dashboard</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = "/api/login"}>
              Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Pest Control Management</h1>
                <p className="text-sm text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {(user as any)?.firstName || (user as any)?.email || 'Admin'}</span>
              <Button variant="outline" size="sm" onClick={() => window.location.href = "/api/logout"}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {!statsLoading && stats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{(stats as AdminStats).totalBranches || 0}</p>
                    <p className="text-sm text-gray-600">Total Branches</p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{(stats as AdminStats).activeUsers || 0}</p>
                    <p className="text-sm text-gray-600">Active Users</p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">£{(stats as AdminStats).monthlyRevenue || 0}</p>
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{(stats as AdminStats).systemHealth || 0}%</p>
                    <p className="text-sm text-gray-600">System Health</p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Create New Branch</span>
              </CardTitle>
              <CardDescription>
                Add a new pest control branch and create login credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Branch
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Branch</DialogTitle>
                    <DialogDescription>
                      Enter the branch details and create login credentials
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Branch Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter branch name" />
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
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter phone number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Enter branch address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Branch login username" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" placeholder="Branch login password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contractStartDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contract Start Date</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contractEndDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contract End Date</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowBranchDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createBranchMutation.isPending}>
                          {createBranchMutation.isPending ? "Creating..." : "Create Branch"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Generate Test Branches</span>
              </CardTitle>
              <CardDescription>
                Create thousands of realistic UK branches for testing and demo purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={showBulkCreateDialog} onOpenChange={setShowBulkCreateDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    disabled={isBulkCreating}
                    data-testid="button-bulk-create"
                  >
                    {isBulkCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Creating {bulkCreateCount} Branches...
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Generate {bulkCreateCount} Branches
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Bulk Create Branches</DialogTitle>
                    <DialogDescription>
                      Generate thousands of realistic UK branches for testing purposes
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="count">Number of Branches</Label>
                      <Input
                        id="count"
                        type="number"
                        value={bulkCreateCount}
                        onChange={(e) => setBulkCreateCount(Number(e.target.value))}
                        min={1}
                        max={5000}
                        className="mt-1"
                        data-testid="input-bulk-count"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum 5000 branches per operation
                      </p>
                    </div>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <p className="font-medium mb-2">Generated branches will include:</p>
                      <ul className="text-xs space-y-1">
                        <li>• Realistic UK business names and addresses</li>
                        <li>• Unique usernames and email addresses</li>
                        <li>• Valid UK postcodes and phone numbers</li>
                        <li>• Contract dates and payment information</li>
                        <li>• Star ratings between 3-5 stars</li>
                      </ul>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowBulkCreateDialog(false)}
                        disabled={isBulkCreating}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => bulkCreateMutation.mutate(bulkCreateCount)}
                        disabled={isBulkCreating || bulkCreateCount < 1}
                        data-testid="button-confirm-bulk-create"
                      >
                        {isBulkCreating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          `Create ${bulkCreateCount} Branches`
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Upload Documents</span>
              </CardTitle>
              <CardDescription>
                Upload contracts, certificates, and monthly reports to specific branches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                      Upload documents to send to specific branches
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="branch">Select Branch</Label>
                      <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {(branches as Branch[])?.map((branch: Branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="file">Select File</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.svg"
                        onChange={handleFileChange}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Supported formats: PDF, JPG, PNG, SVG (Max 10MB)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="title">Document Title</Label>
                      <Input
                        id="title"
                        value={uploadData.title}
                        onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter document title"
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Document Type</Label>
                        <Select
                          value={uploadData.type}
                          onValueChange={(value) => setUploadData(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="membership_certificate">Membership Certificate</SelectItem>
                            <SelectItem value="coshh_risk_assessment">COSHH Risk Assessment</SelectItem>
                            <SelectItem value="inspection_report">Inspection Report</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={uploadData.category}
                          onValueChange={(value) => setUploadData(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contracts">Contracts</SelectItem>
                            <SelectItem value="certificates">Certificates</SelectItem>
                            <SelectItem value="monthly_reports">Monthly Reports</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => uploadMutation.mutate()}
                        disabled={!uploadFile || !selectedBranch || !uploadData.title || uploadMutation.isPending}
                      >
                        {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Send Notification</span>
              </CardTitle>
              <CardDescription>
                Send visit notifications and updates to specific branches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full" data-testid="button-send-notification">
                    <Send className="w-4 h-4 mr-2" />
                    Send Notification
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Send Notification</DialogTitle>
                    <DialogDescription>
                      Send a visit notification or update to a specific branch
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...notificationForm}>
                    <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-4">
                      <FormField
                        control={notificationForm.control}
                        name="branchId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Branch</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-branch-notification">
                                  <SelectValue placeholder="Choose a branch" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(branches as Branch[])?.map((branch: Branch) => (
                                  <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notification Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Enter notification message"
                                rows={3}
                                data-testid="textarea-notification-message"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={notificationForm.control}
                          name="visitDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>Visit Date</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="date" 
                                  data-testid="input-visit-date"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={notificationForm.control}
                          name="visitTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>Visit Time</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="time" 
                                  data-testid="input-visit-time"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="purposeOfVisit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Visit Purpose</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Enter purpose of visit"
                                rows={3}
                                data-testid="textarea-visit-purpose"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationForm.control}
                        name="visitType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type of Visit</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-visit-type">
                                  <SelectValue placeholder="Select visit type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="routine">Routine</SelectItem>
                                <SelectItem value="follow-up">Follow up</SelectItem>
                                <SelectItem value="call-out">Call out</SelectItem>
                                <SelectItem value="it">I.T (Initial Treatment)</SelectItem>
                                <SelectItem value="itf">I.T.F (Initial Treatment Follow)</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowNotificationDialog(false)}
                          data-testid="button-cancel-notification"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={sendNotificationMutation.isPending}
                          data-testid="button-submit-notification"
                        >
                          {sendNotificationMutation.isPending ? "Sending..." : "Send Notification"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Branches Management */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Branches</CardTitle>
                <CardDescription>
                  Manage all {totalBranches} pest control branches ({branchesPerPage} per page)
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search branches..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); // Reset to first page on search
                    }}
                    className="pl-10 w-64"
                    data-testid="input-search-branches"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {branchesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading branches...</p>
              </div>
            ) : !branches || !Array.isArray(branches) || branches.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No branches found</p>
                <p className="text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'Create your first branch to get started'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2 mb-4">
                  {branches.map((branch: Branch) => {
                    const statusColor = branch.status === 'active' ? 'green' : 
                                      branch.status === 'inactive' ? 'red' : 'gray';
                    const logoLetter = (branch.name || 'B').charAt(0).toUpperCase();
                    
                    return (
                      <div 
                        key={branch.id} 
                        className={`border-2 rounded-lg bg-white hover:shadow-lg transition-all duration-200 transform hover:scale-105 min-h-[90px] max-h-[110px] group
                          ${branch.status === 'active' ? 'border-green-200 hover:border-green-300' : 
                            branch.status === 'inactive' ? 'border-red-200 hover:border-red-300' : 
                            'border-gray-200 hover:border-gray-300'}`}
                        data-testid={`card-branch-${branch.id}`}
                      >
                        {/* Colored status top border */}
                        <div className={`h-1 rounded-t-lg ${
                          branch.status === 'active' ? 'bg-gradient-to-r from-green-400 to-green-600' : 
                          branch.status === 'inactive' ? 'bg-gradient-to-r from-red-400 to-red-600' : 
                          'bg-gradient-to-r from-gray-400 to-gray-600'
                        }`} />
                        
                        <div className="p-2">
                          {/* Logo and Status Row */}
                          <div className="flex items-center justify-between mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${
                              branch.status === 'active' ? 'bg-gradient-to-br from-green-400 to-green-600' : 
                              branch.status === 'inactive' ? 'bg-gradient-to-br from-red-400 to-red-600' : 
                              'bg-gradient-to-br from-gray-400 to-gray-600'
                            }`}>
                              {/* Branch logo or first letter */}
                              <img 
                                src={`/api/branches/${branch.id}/logo?v=${branch.updatedAt ? new Date(branch.updatedAt).getTime() : new Date(branch.createdAt).getTime()}`}
                                alt={branch.name}
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => {
                                  const img = e.currentTarget as HTMLImageElement;
                                  img.style.display = 'none';
                                  const span = img.nextElementSibling as HTMLSpanElement;
                                  if (span) span.style.display = 'block';
                                }}
                              />
                              <span className="hidden">{logoLetter}</span>
                            </div>
                            
                            <Badge 
                              className={`text-[8px] py-0.5 px-1.5 font-medium text-white border-0 ${
                                branch.status === 'active' ? 'bg-green-500 shadow-green-200' : 
                                branch.status === 'inactive' ? 'bg-red-500 shadow-red-200' : 
                                'bg-gray-500 shadow-gray-200'
                              } shadow-sm`}
                            >
                              {branch.status === 'active' ? 'Active' : 
                               branch.status === 'inactive' ? 'Inactive' : 'Unknown'}
                            </Badge>
                          </div>
                          
                          {/* Branch Name */}
                          <h3 className="font-semibold text-gray-900 text-xs mb-1 truncate leading-tight">
                            {branch.name}
                          </h3>
                          
                          {/* Compact Info */}
                          <div className="space-y-0.5 text-[10px] text-gray-600 mb-2">
                            {branch.phone && (
                              <div className="truncate leading-tight flex items-center">
                                <span className="text-gray-400 mr-1">📞</span>
                                {branch.phone.substring(0, 11)}
                              </div>
                            )}
                            {branch.username && (
                              <div className="truncate leading-tight flex items-center">
                                <span className="text-gray-400 mr-1">👤</span>
                                {branch.username.substring(0, 12)}
                              </div>
                            )}
                          </div>
                          
                          {/* Micro Actions */}
                          <div className="flex justify-between items-center">
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-5 w-5 p-0 border-gray-200 hover:bg-blue-50" 
                                data-testid={`button-edit-${branch.id}`}
                              >
                                <Edit className="w-2.5 h-2.5 text-gray-500" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-5 w-5 p-0 border-gray-200 hover:bg-red-50" 
                                data-testid={`button-delete-${branch.id}`}
                              >
                                <Trash2 className="w-2.5 h-2.5 text-red-500" />
                              </Button>
                            </div>
                            
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-5 px-2 text-[9px] text-blue-600 hover:bg-blue-50 font-medium"
                              data-testid={`button-view-${branch.id}`}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * branchesPerPage) + 1} to {Math.min(currentPage * branchesPerPage, totalBranches)} of {totalBranches} branches
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-8 h-8 p-0"
                              data-testid={`button-page-${pageNum}`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        data-testid="button-next-page"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>Recently uploaded documents across all branches</CardDescription>
          </CardHeader>
          <CardContent>
            {documentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading documents...</p>
              </div>
            ) : !documents || !Array.isArray(documents) || (documents as Document[]).length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No documents uploaded yet</p>
                <p className="text-sm text-gray-500">Upload documents to branches to see them here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(documents as Document[]).slice(0, 10).map((doc: Document) => (
                  <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">{doc.title}</h3>
                          <p className="text-sm text-gray-600">
                            {doc.type.replace('_', ' ')} • {doc.category.replace('_', ' ')} • {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
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