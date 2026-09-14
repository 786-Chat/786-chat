import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ShopLayoutDesigner from "@/components/ShopLayoutDesigner";
import { Plus, Edit, Trash2, Calendar, ArrowLeft, Layout, Loader2, Home } from "lucide-react";
import type { ShopLayout, InsertShopLayout } from "@shared/schema";

interface LayoutWithData extends ShopLayout {
  layoutData: {
    elements: any[];
    title?: string;
  };
}

export default function BranchChartPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // UI State
  const [showDesigner, setShowDesigner] = useState(false);
  const [editingLayout, setEditingLayout] = useState<LayoutWithData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [layoutToDelete, setLayoutToDelete] = useState<LayoutWithData | null>(null);

  // Fetch layouts for this branch
  const { 
    data: layouts = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['/api/shop-layouts'],
    queryFn: async (): Promise<LayoutWithData[]> => {
      const response = await fetch('/api/shop-layouts', {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You need to be logged in to view layouts');
        }
        throw new Error('Failed to fetch layouts');
      }
      return await response.json();
    },
  });

  // Create layout mutation
  const createLayoutMutation = useMutation({
    mutationFn: async (layoutData: InsertShopLayout): Promise<LayoutWithData> => {
      const response = await apiRequest('POST', '/api/shop-layouts', layoutData);
      return await response.json();
    },
    onSuccess: (createdLayout: LayoutWithData) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop-layouts'] });
      
      // Set the newly created layout as editing layout for auto-save updates
      setEditingLayout(createdLayout);
      
      // Silent auto-save - no toast notification
      // Don't close designer on auto-save - only close on manual save
      // setShowDesigner(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Layout",
        description: error.message || "Failed to create layout. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update layout mutation
  const updateLayoutMutation = useMutation({
    mutationFn: async ({ id, layoutData }: { id: string; layoutData: Partial<InsertShopLayout> }) => {
      return apiRequest('PATCH', `/api/shop-layouts/${id}`, layoutData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop-layouts'] });
      // Silent update - no toast notification for auto-save
      // Don't close designer when updating - stay in edit mode
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Layout",
        description: error.message || "Failed to update layout. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete layout mutation
  const deleteLayoutMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/shop-layouts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop-layouts'] });
      toast({
        title: "Layout Deleted",
        description: "The layout has been deleted successfully.",
      });
      setShowDeleteDialog(false);
      setLayoutToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Layout",
        description: error.message || "Failed to delete layout. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send to My Documents mutation
  const sendToMyDocumentsMutation = useMutation({
    mutationFn: async (layoutData: any) => {
      const documentData = {
        title: `Layout: ${layoutData.title}`,
        type: 'layout',
        layoutData: layoutData, // Send the layout data in the correct format
        category: 'saved-layouts'
      };
      return apiRequest('POST', '/api/branch/documents', documentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/branch/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop-layouts'] });
      toast({
        title: "Layout Saved to Documents",
        description: "Your layout has been saved to My Documents successfully.",
      });
      setShowDesigner(false);
      setEditingLayout(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error Saving to Documents",
        description: error.message || "Failed to save layout to documents. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = (layoutData: any) => {
    const title = layoutData.title || 'Untitled Layout';
    
    console.log('📝 handleSave called:', { 
      title, 
      hasEditingLayout: !!editingLayout, 
      editingLayoutId: editingLayout?.id,
      elementCount: layoutData.elements?.length 
    });
    
    if (editingLayout) {
      // Update existing layout
      console.log('🔄 Updating existing layout ID:', editingLayout.id);
      updateLayoutMutation.mutate({
        id: editingLayout.id,
        layoutData: {
          title,
          elements: layoutData.elements || [],
          dimensions: layoutData.dimensions || { width: 420, height: 594 },
        },
      });
    } else {
      // Create new layout - server will automatically set branchId from session
      console.log('➕ Creating new layout');
      createLayoutMutation.mutate({
        title,
        elements: layoutData.elements || [],
        dimensions: layoutData.dimensions || { width: 420, height: 594 },
        createdBy: 'branch_user', // This will be overridden by the server based on session
        isActive: true,
      });
    }
  };

  const handleEdit = (layout: LayoutWithData) => {
    setEditingLayout(layout);
    setShowDesigner(true);
  };

  const handleDelete = (layout: LayoutWithData) => {
    setLayoutToDelete(layout);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (layoutToDelete) {
      deleteLayoutMutation.mutate(layoutToDelete.id);
    }
  };

  const handleNewLayout = () => {
    setEditingLayout(null);
    setShowDesigner(true);
  };

  const handleCloseDesigner = () => {
    setShowDesigner(false);
    setEditingLayout(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
              </div>
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
            </div>
            
            {/* Grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
                      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Failed to Load Layouts
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error.message || 'There was an error loading your layouts.'}
              </p>
              <Button onClick={() => refetch()} data-testid="retry-button">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Designer view
  if (showDesigner) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseDesigner}
                data-testid="back-to-layouts-button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Layouts
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {editingLayout ? 'Edit Layout' : 'Create New Layout'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {editingLayout ? `Editing: ${editingLayout.title}` : 'Design your shop layout'}
                </p>
              </div>
            </div>
            
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setLocation('/branch-dashboard');
              }}
              data-testid="back-to-dashboard-button"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Home className="w-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
        
        <ShopLayoutDesigner
          onSave={handleSave}
          onSendToBranch={() => {}} // Empty function - hide admin functionality
          onSendToMyDocuments={(layoutData) => sendToMyDocumentsMutation.mutate(layoutData)}
          branches={[]} // Empty array - hide admin functionality
          initialData={editingLayout}
          onClose={handleCloseDesigner}
        />
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                My Shop Layouts
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Create and manage your shop layout charts for pest control planning
              </p>
            </div>
            <Button 
              onClick={handleNewLayout}
              data-testid="new-layout-button"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Layout
            </Button>
          </div>

          {/* Layouts Grid */}
          {layouts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Layout className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No Layouts Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first shop layout to get started with pest control planning.
                </p>
                <Button 
                  onClick={handleNewLayout}
                  data-testid="create-first-layout-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Layout
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {layouts.map((layout) => (
                <Card key={layout.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                          {layout.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {layout.createdAt ? new Date(layout.createdAt).toLocaleDateString() : 'Unknown date'}
                          </span>
                          {layout.isActive && (
                            <Badge variant="secondary" className="ml-2">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(layout)}
                        data-testid={`edit-layout-${layout.id}`}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(layout)}
                        data-testid={`delete-layout-${layout.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent data-testid="delete-confirmation-dialog">
            <DialogHeader>
              <DialogTitle>Delete Layout</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{layoutToDelete?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                data-testid="cancel-delete-button"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteLayoutMutation.isPending}
                data-testid="confirm-delete-button"
              >
                {deleteLayoutMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}