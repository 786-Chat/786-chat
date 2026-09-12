import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileImage, Eye, AlertTriangle, Calendar, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PDFViewer from "@/components/PDFViewer";

export const YearlyDocsSection = () => {
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showViewer, setShowViewer] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleViewDoc = (doc: any) => {
    setSelectedDoc(doc);
    setShowViewer(true);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setSelectedDoc(null);
  };
  
  const { data: yearlyDocs = [], isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/branch/yearly-docs"],
    retry: false,
  });

  // Save yearly doc to My Documents mutation
  const saveToMyDocsMutation = useMutation({
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
        description: "Document saved to My Documents successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/branch/documents'] });
    },
    onError: (error: any) => {
      if (error.message.includes('409')) {
        toast({
          title: "Already Saved",
          description: "This document is already in your My Documents",
          variant: "default",
        });
      } else {
        toast({
          title: "Error", 
          description: error.message || "Failed to save document to My Documents",
          variant: "destructive",
        });
      }
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
        <p className="mt-2 text-slate-400">Loading yearly documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-400">Error loading documents</p>
        <p className="text-slate-500 text-sm">{error.message}</p>
      </div>
    );
  }

  if (!yearlyDocs || yearlyDocs.length === 0) {
    return (
      <div className="text-center py-8">
        <FileImage className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No yearly documents received yet</p>
        <p className="text-slate-500 text-sm">Documents sent by admin will appear here</p>
      </div>
    );
  }



  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {yearlyDocs.map((doc) => (
          <div key={doc.id} className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <FileImage className="h-5 w-5 text-white" />
              </div>
              <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
                {doc.docType === 'yearly-contract' ? 'Yearly Contract' :
                 doc.docType === 'yearly-membership-certificate' ? 'Membership Certificate' :
                 doc.docType === 'guideline-chart-3d' ? 'Guideline Chart 3D' :
                 doc.docType}
              </Badge>
            </div>
            
            <h4 className="text-white font-medium mb-2">{doc.title}</h4>
            
            {/* Document dates */}
            <div className="space-y-1 mb-3">
              {doc.issueDate && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3 text-blue-400" />
                  <span className="text-xs text-blue-300">
                    Issue: {new Date(doc.issueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {doc.expiryDate && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3 text-orange-400" />
                  <span className={`text-xs ${
                    new Date(doc.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
                      ? 'text-red-400' : 'text-orange-300'
                  }`}>
                    Expiry: {new Date(doc.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              <p className="text-slate-400 text-xs">
                View Size: {doc.viewSize} • {(() => {
                  const mimeType = doc.mimeType?.toLowerCase() || '';
                  const filename = doc.filename?.toLowerCase() || '';
                  
                  if (mimeType.includes('pdf') || filename.endsWith('.pdf')) return 'PDF';
                  if (mimeType.includes('image') || filename.endsWith('.png') || filename.endsWith('.jpg') || 
                      filename.endsWith('.jpeg') || filename.endsWith('.gif') || filename.endsWith('.svg')) return 'Image';
                  if (mimeType.includes('text') || filename.endsWith('.txt') || 
                      filename.endsWith('.doc') || filename.endsWith('.docx')) return 'Text';
                  return 'Document';
                })()}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleViewDoc(doc)}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button
                size="sm"
                onClick={() => saveToMyDocsMutation.mutate(doc.id)}
                disabled={saveToMyDocsMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 flex-1"
                title="Save to My Documents"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveToMyDocsMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Universal Document Viewer */}
      {showViewer && selectedDoc && (
        <PDFViewer
          fileUrl={`/api/yearly-docs/${selectedDoc.id}/view`}
          fileName={selectedDoc.filename || selectedDoc.title}
          title={selectedDoc.title}
          onClose={handleCloseViewer}
        />
      )}
    </>
  );
};