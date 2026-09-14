import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Plus, ExternalLink, Trash2, X, Edit3, Search, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const linkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Please enter a valid URL"),
  description: z.string().optional(),
});

type UsefulLink = {
  id: string;
  title: string;
  url: string;
  description?: string;
  branchId?: string;
  isActive: boolean;
  createdBy: string;
  sentAt?: string;
  clickedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type Branch = {
  id: string;
  name: string;
};

export default function UsefulLinksSection() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<UsefulLink | null>(null);
  const [sendingLink, setSendingLink] = useState<UsefulLink | null>(null);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [sendSelectedBranches, setSendSelectedBranches] = useState<string[]>([]);
  const [branchSearchTerm, setBranchSearchTerm] = useState("");
  const [sendBranchSearchTerm, setSendBranchSearchTerm] = useState("");
  const [selectAllBranches, setSelectAllBranches] = useState(false);
  const [sendSelectAllBranches, setSendSelectAllBranches] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: linksResponse, isLoading: linksLoading, error: linksError } = useQuery<{success: boolean, data: UsefulLink[]}>({
    queryKey: ["/api/useful-links"],
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });
  
  // CRITICAL FIX: Properly validate backend response and surface failures
  const links = (() => {
    // If we have an error from the query itself (network, auth, etc.), return empty array and let error handling show
    if (linksError) {
      console.error('Useful links query failed:', linksError);
      return [];
    }
    
    // If we have a response, validate it has the expected success contract
    if (linksResponse) {
      if (linksResponse.success === false) {
        // Backend returned structured error - this should trigger user notification
        console.error('Backend returned unsuccessful response for useful links:', linksResponse);
        toast({
          title: "Error loading links",
          description: "Failed to load useful links from server. Please check your internet connection and try again.",
          variant: "destructive",
        });
        return [];
      }
      
      if (linksResponse.success === true && Array.isArray(linksResponse.data)) {
        // Valid successful response with data
        return linksResponse.data;
      }
      
      // Response exists but doesn't match expected contract
      console.error('Invalid response format for useful links:', linksResponse);
      toast({
        title: "Unexpected response format", 
        description: "The server returned data in an unexpected format. Please refresh the page or contact support if this persists.",
        variant: "destructive",
      });
      return [];
    }
    
    // No response yet (loading) - return empty array
    return [];
  })();

  const { data: branchesResponse } = useQuery<{branches: Branch[]}>({
    queryKey: ["/api/branches", { limit: 5000 }],
    staleTime: 300000, // Cache for 5 minutes since branches don't change frequently
    gcTime: 600000, // Keep in cache for 10 minutes
  });
  
  const branches = branchesResponse?.branches || [];

  const form = useForm<z.infer<typeof linkSchema>>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
    },
  });

  const editForm = useForm<z.infer<typeof linkSchema>>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof linkSchema> & { branchIds: string[] }) => {
      console.log('Creating link with data:', data);
      try {
        const response = await apiRequest('POST', '/api/useful-links', data);
        const result = await response.json();
        console.log('Create response:', result);
        
        // Validate server response format
        if (!result.success) {
          throw new Error(result.message || 'Server returned unsuccessful response');
        }
        
        return result;
      } catch (error) {
        console.error('Create mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/useful-links"] });
      setIsAddDialogOpen(false);
      setSelectedBranches([]);
      setBranchSearchTerm("");
      setSelectAllBranches(false);
      form.reset();
      toast({
        title: "Success",
        description: "Useful link created successfully",
      });
    },
    onError: (error: any) => {
      console.error('Create link error details:', {
        error,
        message: error?.message,
        status: error?.status,
        stack: error?.stack
      });
      const errorMessage = error?.message || error?.toString() || "Failed to create useful link";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });



  const sendMutation = useMutation({
    mutationFn: async (data: { linkData: UsefulLink; branchIds: string[] }) => {
      console.log('Sending link with data:', data);
      const payload = {
        title: data.linkData.title,
        url: data.linkData.url,
        description: data.linkData.description || "",
        branchIds: data.branchIds
      };
      console.log('Payload being sent:', payload);
      try {
        const response = await apiRequest('POST', '/api/useful-links', payload);
        const result = await response.json();
        console.log('Send response:', result);
        
        // Validate server response format
        if (!result.success) {
          throw new Error(result.message || 'Server returned unsuccessful response');
        }
        
        return result;
      } catch (error) {
        console.error('Send mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Link sent to selected branches successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/useful-links'] });
      setIsSendDialogOpen(false);
      setSendingLink(null);
      setSendSelectedBranches([]);
      setSendBranchSearchTerm("");
    },
    onError: (error: any) => {
      console.error('Send link error details:', {
        error,
        message: error?.message,
        status: error?.status,
        stack: error?.stack
      });
      const errorMessage = error?.message || error?.toString() || "Failed to send link";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (linkId: string) => {
      console.log('Deleting link with ID:', linkId);
      try {
        const response = await apiRequest('DELETE', `/api/useful-links/${linkId}`);
        const result = await response.json();
        console.log('Delete response:', result);
        
        // Validate server response format
        if (!result.success) {
          throw new Error(result.message || 'Server returned unsuccessful response');
        }
        
        return result;
      } catch (error) {
        console.error('Delete mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/useful-links"] });
      toast({
        title: "Success",
        description: "Link deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Delete link error details:', {
        error,
        message: error?.message,
        status: error?.status,
        stack: error?.stack
      });
      const errorMessage = error?.message || error?.toString() || "Failed to delete link";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { updateData: z.infer<typeof linkSchema> & { branchIds: string[] } }) => {
      console.log('Updating link with atomic replace:', data);
      
      if (!editingLink) {
        throw new Error('No link selected for editing');
      }
      
      try {
        // CRITICAL FIX: Use atomic replace endpoint to prevent data loss
        const payload = {
          originalLink: {
            title: editingLink.title,
            url: editingLink.url
          },
          newData: {
            title: data.updateData.title,
            url: data.updateData.url,
            description: data.updateData.description,
            branchIds: data.updateData.branchIds
          }
        };
        
        console.log('Atomic replace payload:', payload);
        
        const response = await apiRequest('POST', '/api/useful-links/replace', payload);
        const result = await response.json();
        console.log('Atomic replace response:', result);
        
        // Validate server response format
        if (!result.success) {
          throw new Error(result.message || 'Server returned unsuccessful response');
        }
        
        return result;
      } catch (error) {
        console.error('Atomic update mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/useful-links"] });
      setIsEditDialogOpen(false);
      setEditingLink(null);
      setSelectedBranches([]);
      setBranchSearchTerm("");
      editForm.reset();
      toast({
        title: "Success",
        description: "Link updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Update link error details:', {
        error,
        message: error?.message,
        status: error?.status,
        stack: error?.stack
      });
      const errorMessage = error?.message || error?.toString() || "Failed to update link";
      toast({
        title: "Error", 
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const filteredBranches = branches.filter(branch =>
    branch?.name?.toLowerCase().includes(branchSearchTerm.toLowerCase())
  );

  const sendFilteredBranches = branches.filter(branch =>
    branch?.name?.toLowerCase().includes(sendBranchSearchTerm.toLowerCase())
  );

  const handleSelectAllChange = (checked: boolean) => {
    setSelectAllBranches(checked);
    if (checked) {
      setSelectedBranches(filteredBranches.map(branch => branch.id));
    } else {
      setSelectedBranches([]);
    }
  };

  const handleBranchToggle = (branchId: string) => {
    setSelectedBranches(prev => {
      const newSelection = prev.includes(branchId)
        ? prev.filter(id => id !== branchId)
        : [...prev, branchId];
      
      // Update select all state
      setSelectAllBranches(newSelection.length === filteredBranches.length);
      return newSelection;
    });
  };

  const handleSendSelectAllChange = (checked: boolean) => {
    setSendSelectAllBranches(checked);
    if (checked) {
      setSendSelectedBranches(sendFilteredBranches.map(branch => branch.id));
    } else {
      setSendSelectedBranches([]);
    }
  };

  const handleSendBranchToggle = (branchId: string) => {
    setSendSelectedBranches(prev => {
      const newSelection = prev.includes(branchId)
        ? prev.filter(id => id !== branchId)
        : [...prev, branchId];
      
      // Update select all state
      setSendSelectAllBranches(newSelection.length === sendFilteredBranches.length);
      return newSelection;
    });
  };

  const onSubmit = (data: z.infer<typeof linkSchema>) => {
    if (!selectedBranches.length) {
      toast({
        title: "Error",
        description: "Please select at least one branch",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      ...data,
      branchIds: selectedBranches,
    });
  };



  const handleDelete = (linkId: string) => {
    if (confirm("Are you sure you want to delete this link?")) {
      deleteMutation.mutate(linkId);
    }
  };

  // Filter and group links for search functionality
  const uniqueLinks = Array.isArray(links) ? links.reduce((uniqueLinks, link) => {
    const existing = uniqueLinks.find(l => l.url === link.url && l.title === link.title);
    if (!existing) {
      uniqueLinks.push(link);
    }
    return uniqueLinks;
  }, [] as UsefulLink[]) : [];

  // Get unique branches that have received links
  const branchesWithLinks = uniqueLinks.reduce((branchIds: Set<string>, link) => {
    if (link.branchId) {
      branchIds.add(link.branchId);
    }
    return branchIds;
  }, new Set<string>());

  // Check if search should be shown (multiple branches have been sent links)
  const shouldShowSearch = branchesWithLinks.size > 1 && uniqueLinks.length > 0;

  // Filter links based on search term
  const filteredLinks = uniqueLinks.filter(link => {
    if (!searchTerm) return true;
    
    const branch = branches.find(b => b.id === link.branchId);
    const branchName = branch?.name || '';
    
    return (
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branchName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 w-full max-w-full overflow-hidden">
      <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 w-full max-w-full">
        <CardTitle className="text-xl lg:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-center lg:text-left">
          <Link className="inline mr-2" size={20} />
          Useful Links
        </CardTitle>
        <div className="flex justify-center lg:justify-end lg:ml-6">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-purple-500/25 transition-all duration-300 px-4 lg:px-6 py-2 text-sm lg:text-base"
              >
                <Plus className="mr-2" size={16} />
                Add New Link
              </Button>
            </DialogTrigger>
          <DialogContent className="bg-black/90 border-purple-500/30">
            <DialogHeader>
              <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Add New Useful Link
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-300">Link Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Food Safety Guidelines"
                          className="bg-black/50 border-purple-500/50 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-300">URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://example.com"
                          className="bg-black/50 border-purple-500/50 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-300">Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Brief description of what this link contains..."
                          className="bg-black/50 border-purple-500/50 text-white"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Branch Selection - Inline Design */}
                <div className="space-y-4">
                  <Label className="text-purple-300">Select Branches to Send To</Label>
                  
                  {/* Search with Inline Controls */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <Input
                          placeholder="Search branches..."
                          value={branchSearchTerm}
                          onChange={(e) => setBranchSearchTerm(e.target.value)}
                          className="bg-gray-800 border-purple-500/30 text-white placeholder:text-gray-400"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="selectAll"
                          checked={selectAllBranches}
                          onChange={(e) => handleSelectAllChange(e.target.checked)}
                          className="w-4 h-4 text-purple-600 bg-gray-800 border-purple-500 rounded focus:ring-purple-500"
                        />
                        <Label htmlFor="selectAll" className="text-purple-300 cursor-pointer text-sm">
                          Select All ({filteredBranches.length})
                        </Label>
                      </div>
                    </div>
                    
                    {selectedBranches.length > 0 && (
                      <div className="text-center">
                        <p className="text-green-400 text-sm">
                          {selectedBranches.length} branch{selectedBranches.length !== 1 ? 'es' : ''} selected
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Branch List */}
                  <div className="max-h-48 overflow-y-auto border border-purple-500/30 rounded-md p-3 space-y-2">
                    {filteredBranches.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">
                        No branches found matching "{branchSearchTerm}"
                      </p>
                    ) : (
                      filteredBranches.map((branch) => (
                        <div key={branch.id} className="flex items-center space-x-2 p-1 hover:bg-purple-500/10 rounded">
                          <input
                            type="checkbox"
                            id={branch.id}
                            checked={selectedBranches.includes(branch.id)}
                            onChange={() => handleBranchToggle(branch.id)}
                            className="w-4 h-4 text-purple-600 bg-gray-800 border-purple-500 rounded focus:ring-purple-500"
                          />
                          <Label htmlFor={branch.id} className="text-purple-300 cursor-pointer flex-1 text-sm">
                            {branch.name}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setSelectedBranches([]);
                      form.reset();
                    }}
                    className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || selectedBranches.length === 0}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Link"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
        
        {/* Search Bar - Only show when multiple branches have been sent links */}
        {shouldShowSearch && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search links by title, URL, description, or branch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black/30 border-purple-500/30 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-purple-400"
                autoComplete="off"
              />
            </div>
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="text-purple-300 hover:text-white hover:bg-purple-500/20 px-2"
              >
                Clear
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4 lg:p-6">
        {linksLoading ? (
          <div className="text-center py-8 lg:py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-purple-300">Loading useful links...</p>
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-8 lg:py-12 text-purple-300">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Link className="w-6 h-6 lg:w-8 lg:h-8" />
            </div>
            <h3 className="text-base lg:text-lg font-medium text-white mb-2">No Useful Links Yet</h3>
            <p className="text-sm">Create your first useful link to share with branches.</p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-2 text-sm"
            >
              <Plus className="mr-2" size={14} />
              Add First Link
            </Button>
          </div>
        ) : filteredLinks.length === 0 && searchTerm ? (
          <div className="text-center py-8 lg:py-12">
            <Search className="mx-auto h-10 w-10 lg:h-12 lg:w-12 text-purple-400 mb-4" />
            <h3 className="text-base lg:text-lg font-medium text-white mb-2">No matching links found</h3>
            <p className="text-purple-300 mb-4 text-sm lg:text-base">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="grid gap-3 lg:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full max-w-full">
            {filteredLinks.map((link) => (
              <div
                key={link.id}
                className="bg-black/40 rounded-lg p-3 lg:p-4 border border-purple-500/30 hover:border-purple-400/50 transition-colors w-full max-w-full overflow-hidden"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white text-sm lg:text-base truncate flex-1 pr-2">{link.title}</h3>
                  <div className="flex space-x-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSendingLink(link);
                        setSendSelectedBranches([]);
                        setSendBranchSearchTerm("");
                        setIsSendDialogOpen(true);
                      }}
                      className="text-green-400 hover:text-green-300 hover:bg-green-500/20 p-1 h-7 w-7 lg:h-8 lg:w-8"
                      title="Send to Branches"
                    >
                      <Send size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingLink(link);
                        // Pre-select branches that have this link
                        const linkBranches = links
                          .filter(l => l.url === link.url && l.title === link.title)
                          .map(l => l.branchId)
                          .filter(Boolean) as string[];
                        setSelectedBranches(linkBranches);
                        // Populate edit form with existing data
                        editForm.setValue('title', link.title);
                        editForm.setValue('url', link.url);
                        editForm.setValue('description', link.description || '');
                        setIsEditDialogOpen(true);
                      }}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 p-1 h-7 w-7 lg:h-8 lg:w-8"
                      title="Edit Link"
                    >
                      <Edit3 size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        // Delete all instances of this link (by URL and title)
                        const linksToDelete = links.filter(l => l.url === link.url && l.title === link.title);
                        linksToDelete.forEach(linkToDelete => {
                          deleteMutation.mutate(linkToDelete.id);
                        });
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1 h-7 w-7 lg:h-8 lg:w-8"
                      title="Delete Link"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs lg:text-sm text-purple-300 mb-3 line-clamp-2">
                  {link.description || "Food safety management pack for restaurants, cafés, takeaways and other small catering businesses."}
                </p>
                
                <div className="flex items-center justify-between text-xs">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-400 hover:text-pink-300 flex items-center truncate"
                  >
                    <ExternalLink size={12} className="mr-1 flex-shrink-0" />
                    <span className="truncate">View Link</span>
                  </a>
                  <div className="text-green-400">
                    {(() => {
                      const linkBranches = links
                        .filter(l => l.url === link.url && l.title === link.title)
                        .map(l => l.branchId)
                        .filter(Boolean);
                      
                      const branchNames = linkBranches
                        .map(branchId => branches.find(b => b.id === branchId)?.name)
                        .filter(Boolean);

                      if (branchNames.length === 0) {
                        return <span>✓ Not sent yet</span>;
                      }
                      
                      if (branchNames.length <= 2) {
                        return <span>✓ Sent to {branchNames.join(', ')}</span>;
                      }
                      
                      return <span>✓ Sent to {branchNames.slice(0, 2).join(', ')} +{branchNames.length - 2} more</span>;
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Link Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-purple-500/30 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Link</DialogTitle>
          </DialogHeader>
          
          {editingLink && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((values) => {
                if (!selectedBranches.length) {
                  toast({
                    title: "Error",
                    description: "Please select at least one branch",
                    variant: "destructive",
                  });
                  return;
                }

                updateMutation.mutate({
                  updateData: {
                    ...values,
                    branchIds: selectedBranches,
                  },
                });
              })} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormField
                      control={editForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Link Title</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-slate-800 border-purple-500/30 text-white"
                              placeholder="Enter link title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">URL</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-slate-800 border-purple-500/30 text-white"
                              placeholder="https://example.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="bg-slate-800 border-purple-500/30 text-white"
                              placeholder="Brief description of the link"
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-white mb-2 block">Select Branches</Label>
                      
                      {/* Branch Search - only show if multiple branches */}
                      {branches.length > 1 && (
                        <div className="relative mb-4">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
                          <Input
                            type="text"
                            placeholder="Search branches..."
                            value={branchSearchTerm}
                            onChange={(e) => setBranchSearchTerm(e.target.value)}
                            className="bg-slate-800 border-purple-500/30 text-white pl-10 pr-10"
                            autoComplete="off"
                          />
                          {branchSearchTerm && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setBranchSearchTerm("")}
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300 p-1 h-6 w-6"
                            >
                              <X size={14} />
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Select All Checkbox - inline with search */}
                      {branches.length > 1 && (
                        <div className="flex items-center space-x-2 mb-4">
                          <input
                            type="checkbox"
                            id="select-all-edit"
                            checked={selectAllBranches}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectAllBranches(checked);
                              if (checked) {
                                setSelectedBranches(filteredBranches.map(branch => branch.id));
                              } else {
                                setSelectedBranches([]);
                              }
                            }}
                            className="rounded border-purple-500/30 bg-slate-800 text-purple-500 focus:ring-purple-500"
                          />
                          <Label htmlFor="select-all-edit" className="text-sm text-purple-300">
                            Select All ({filteredBranches.length} branches)
                          </Label>
                        </div>
                      )}

                      {/* Branch List */}
                      <div className="max-h-60 overflow-y-auto border border-purple-500/30 rounded-lg bg-slate-800/50">
                        {filteredBranches.length === 0 ? (
                          <div className="p-4 text-center text-purple-300">
                            {branchSearchTerm ? "No branches found matching your search" : "No branches available"}
                          </div>
                        ) : (
                          <div className="p-2 space-y-1">
                            {filteredBranches.map((branch) => (
                              <div key={branch.id} className="flex items-center space-x-2 p-2 hover:bg-slate-700/50 rounded">
                                <input
                                  type="checkbox"
                                  id={`branch-edit-${branch.id}`}
                                  checked={selectedBranches.includes(branch.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedBranches([...selectedBranches, branch.id]);
                                    } else {
                                      setSelectedBranches(selectedBranches.filter(id => id !== branch.id));
                                      setSelectAllBranches(false);
                                    }
                                  }}
                                  className="rounded border-purple-500/30 bg-slate-800 text-purple-500 focus:ring-purple-500"
                                />
                                <Label htmlFor={`branch-edit-${branch.id}`} className="text-sm text-white flex-1 cursor-pointer">
                                  {branch.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {selectedBranches.length > 0 && (
                        <p className="text-sm text-purple-300 mt-2">
                          {selectedBranches.length} branch{selectedBranches.length !== 1 ? 'es' : ''} selected
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t border-purple-500/30">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingLink(null);
                      setSelectedBranches([]);
                      setBranchSearchTerm("");
                      editForm.reset();
                    }}
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={selectedBranches.length === 0}
                  >
                    Update Link
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Link Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="bg-slate-900 border-purple-500/30 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white">Send Link to Branches</DialogTitle>
          </DialogHeader>
          
          {sendingLink && (
            <div className="space-y-6">
              <div className="bg-black/40 rounded-lg p-4 border border-purple-500/30">
                <h3 className="font-semibold text-white text-lg mb-2">{sendingLink.title}</h3>
                <p className="text-purple-300 text-sm mb-2">{sendingLink.description}</p>
                <a
                  href={sendingLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 flex items-center text-sm"
                >
                  <ExternalLink size={12} className="mr-1" />
                  {sendingLink.url}
                </a>
              </div>

              <div className="space-y-4">
                <Label className="text-purple-300">Select Branches to Send To</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Search branches..."
                        value={sendBranchSearchTerm}
                        onChange={(e) => setSendBranchSearchTerm(e.target.value)}
                        className="bg-gray-800 border-purple-500/30 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sendSelectAll"
                        checked={sendSelectAllBranches}
                        onChange={(e) => handleSendSelectAllChange(e.target.checked)}
                        className="w-4 h-4 text-purple-600 bg-gray-800 border-purple-500 rounded focus:ring-purple-500"
                      />
                      <Label htmlFor="sendSelectAll" className="text-purple-300 cursor-pointer text-sm">
                        Select All ({sendFilteredBranches.length})
                      </Label>
                    </div>
                  </div>
                  
                  {sendSelectedBranches.length > 0 && (
                    <div className="text-center">
                      <p className="text-green-400 text-sm">
                        {sendSelectedBranches.length} branch{sendSelectedBranches.length !== 1 ? 'es' : ''} selected
                      </p>
                    </div>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto border border-purple-500/30 rounded-md p-3 space-y-2">
                  {sendFilteredBranches.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">
                      No branches found matching "{sendBranchSearchTerm}"
                    </p>
                  ) : (
                    sendFilteredBranches.map((branch) => (
                      <div key={branch.id} className="flex items-center space-x-2 p-1 hover:bg-purple-500/10 rounded">
                        <input
                          type="checkbox"
                          id={`send-${branch.id}`}
                          checked={sendSelectedBranches.includes(branch.id)}
                          onChange={() => handleSendBranchToggle(branch.id)}
                          className="w-4 h-4 text-purple-600 bg-gray-800 border-purple-500 rounded focus:ring-purple-500"
                        />
                        <Label htmlFor={`send-${branch.id}`} className="text-purple-300 cursor-pointer flex-1 text-sm">
                          {branch.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-purple-500/30">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsSendDialogOpen(false);
                    setSendingLink(null);
                    setSendSelectedBranches([]);
                    setSendBranchSearchTerm("");
                  }}
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (sendingLink && sendSelectedBranches.length > 0) {
                      sendMutation.mutate({
                        linkData: sendingLink,
                        branchIds: sendSelectedBranches
                      });
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={sendSelectedBranches.length === 0 || sendMutation.isPending}
                >
                  {sendMutation.isPending ? "Sending..." : `Send to ${sendSelectedBranches.length} Branch${sendSelectedBranches.length !== 1 ? 'es' : ''}`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}