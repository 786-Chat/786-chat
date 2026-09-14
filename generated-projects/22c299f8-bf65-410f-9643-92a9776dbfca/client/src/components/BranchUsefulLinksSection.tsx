import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, ExternalLink, Clock, Eye, ArrowLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

type UsefulLink = {
  id: string;
  title: string;
  url: string;
  description?: string;
  branchId: string;
  isActive: boolean;
  createdBy: string;
  sentAt: string;
  clickedAt?: string;
  viewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export function BranchUsefulLinksSection() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: linksResponse, isLoading } = useQuery<{success: boolean, data: UsefulLink[]}>({
    queryKey: ["/api/branch/useful-links"],
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });
  
  const links = linksResponse?.data || [];

  const handleLinkClick = (link: UsefulLink) => {
    // Validate URL before opening
    let validUrl = link.url;
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = `https://${validUrl}`;
    }
    
    // Open the link in a new tab
    window.open(validUrl, '_blank', 'noopener,noreferrer');
    
    toast({
      title: "Link Opened",
      description: `${link.title} opened in a new tab`,
    });
  };

  const deleteUsefulLink = useMutation({
    mutationFn: async (linkId: string) => {
      const response = await fetch(`/api/branch/useful-links/${linkId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete link');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Link Deleted",
        description: "Useful link deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/branch/useful-links"] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete link",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-purple-300 mt-2">Loading useful links...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              <Link className="inline mr-2" size={20} />
              Useful Links
            </CardTitle>
            <p className="text-purple-300 text-sm mt-1">External resources and important links</p>
          </div>
          <Button
            onClick={() => setLocation('/branch-dashboard')}
            variant="outline"
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 shrink-0"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Dashboard
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6">
        {links.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-purple-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Link className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Links Available</h3>
            <p className="text-sm px-4">No useful links have been shared with your branch yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => (
              <div
                key={link.id}
                className="bg-black/40 rounded-lg p-3 sm:p-4 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 min-w-0"
              >
                <div className="flex items-start mb-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                    <ExternalLink className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-base sm:text-lg leading-tight truncate">
                      {link.title}
                    </h3>
                  </div>
                </div>
                
                {link.description && (
                  <p className="text-sm text-purple-300 mb-4 line-clamp-3 ml-11 pr-1">
                    {link.description}
                  </p>
                )}
                
                <div className="flex flex-col gap-3 border-t border-purple-500/20 pt-3">
                  <div className="flex items-center text-xs text-purple-400">
                    <Clock size={12} className="mr-1 flex-shrink-0" />
                    <span className="truncate">Shared: {new Date(link.sentAt).toLocaleDateString('en-GB')}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => deleteUsefulLink.mutate(link.id)}
                      disabled={deleteUsefulLink.isPending}
                      className="h-8 bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-all duration-200 flex items-center justify-center px-2"
                      title="Delete Link"
                      data-testid={`button-delete-useful-link-${link.id}`}
                    >
                      <Trash2 size={12} />
                    </Button>
                    <Button
                      onClick={() => handleLinkClick(link)}
                      className="flex-1 h-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-medium transition-all duration-200 flex items-center justify-center"
                      title="Open Link"
                      data-testid={`button-open-useful-link-${link.id}`}
                    >
                      <ExternalLink size={12} className="mr-1" />
                      Open Link
                    </Button>
                  </div>
                </div>
                
                {/* Display URL in a subtle way */}
                <div className="mt-2 text-xs text-purple-400/70 truncate">
                  {link.url}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}