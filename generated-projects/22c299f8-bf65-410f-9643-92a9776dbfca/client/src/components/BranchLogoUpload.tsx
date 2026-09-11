import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BranchLogoUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BranchLogoUpload({ isOpen, onClose }: BranchLogoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    onSuccess: (result) => {
      console.log('✅ Logo upload successful:', result);
      
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
      
      // Comprehensive cache invalidation for immediate update across all views
      queryClient.invalidateQueries({ queryKey: ['/api/branch/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/branches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      
      // Force immediate logo image refresh with cache busting
      setTimeout(() => {
        const logoImages = document.querySelectorAll('img[src*="/logo"]');
        logoImages.forEach((img: any) => {
          const src = img.src.split('?')[0];
          img.src = `${src}?t=${Date.now()}`;
        });
      }, 100);
      
      setSelectedFile(null);
      onClose();
    },
    onError: (error) => {
      console.error('❌ Logo upload failed:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadLogoMutation.mutate(selectedFile);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Upload Branch Logo</DialogTitle>
          <DialogDescription className="text-slate-400">
            Upload a new logo for your branch. Supported formats: JPG, PNG, GIF, SVG
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-slate-600 hover:border-slate-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-3">
                <div className="w-20 h-20 mx-auto rounded-lg border border-slate-600 overflow-hidden">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-slate-400 text-sm">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  onClick={() => setSelectedFile(null)}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                <div>
                  <p className="text-white font-medium">Drop your logo here</p>
                  <p className="text-slate-400 text-sm">or click to browse</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadLogoMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {uploadLogoMutation.isPending ? "Uploading..." : "Upload Logo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}