import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save, Send, Download, Upload, X } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function PDFBuilder() {
  const [zoom, setZoom] = useState(100);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundFit, setBackgroundFit] = useState<'cover' | 'contain' | 'fill'>('cover');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // A4 dimensions at 96 DPI: 210mm x 297mm = 793.7px x 1122.5px
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("File selected:", file.name, file.type, file.size);

    // Check file type - accept images and PDFs
    const isValidType = file.type.startsWith('image/') || 
                        file.type === 'application/pdf' || 
                        file.name.toLowerCase().endsWith('.pdf');
    
    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image or PDF file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    // For PDF files, convert first page to image
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // For now, use the attached background image directly
      // Since your file is a PDF, let's use a placeholder approach
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          // Create a data URL for the PDF
          setBackgroundImage(e.target.result as string);
          toast({
            title: "PDF background added!",
            description: "PDF loaded as background successfully",
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Handle regular images
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setBackgroundImage(e.target.result as string);
          toast({
            title: "Background added!",
            description: "Background image loaded successfully",
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBackground = () => {
    setBackgroundImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Background removed",
      description: "Canvas reset to white background",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin-dashboard">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">PDF Document Builder</h1>
                <p className="text-sm text-slate-400">Create custom documents with backgrounds and editable content</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-400">Zoom: {zoom}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(25, zoom - 25))}
                disabled={zoom <= 25}
                className="border-slate-600 text-slate-300"
              >
                -
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                disabled={zoom >= 200}
                className="border-slate-600 text-slate-300"
              >
                +
              </Button>
              
              <div className="h-6 w-px bg-slate-600 mx-2" />
              
              <Button 
                variant="outline" 
                size="sm"
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="border-green-500/50 text-green-400 hover:bg-green-500/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
              >
                <Send className="h-4 w-4 mr-2" />
                Send to Branch
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Toolbar */}
          <div className="col-span-3">
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Tools</h3>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                    data-testid="button-add-background"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add Background
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleBackgroundUpload}
                    className="hidden"
                  />
                  {backgroundImage && (
                    <Button 
                      variant="outline" 
                      onClick={removeBackground}
                      className="w-full justify-start border-red-600 text-red-300 hover:bg-red-500/10"
                      data-testid="button-remove-background"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove Background
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    📝 Add Text
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    🖼️ Add Image
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Canvas Area */}
          <div className="col-span-6">
            <div className="flex justify-center">
              <div 
                className="bg-white shadow-2xl border border-slate-600"
                style={{
                  width: `${(A4_WIDTH * zoom) / 100}px`,
                  height: `${(A4_HEIGHT * zoom) / 100}px`,
                  minWidth: `${(A4_WIDTH * zoom) / 100}px`,
                  minHeight: `${(A4_HEIGHT * zoom) / 100}px`,
                  position: 'relative',
                  transform: 'scale(1)',
                  transformOrigin: 'center top'
                }}
                data-testid="pdf-canvas"
              >
                {/* A4 Canvas with Background */}
                <div className="absolute inset-0 bg-white overflow-hidden">
                  {/* Background Image */}
                  {backgroundImage && (
                    <div className="absolute inset-0">
                      {backgroundImage.includes('application/pdf') ? (
                        // For PDF files, use iframe
                        <iframe
                          src={backgroundImage}
                          className="w-full h-full border-0"
                          style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            objectFit: backgroundFit === 'cover' ? 'cover' : backgroundFit === 'contain' ? 'contain' : 'fill'
                          }}
                        />
                      ) : (
                        // For regular images
                        <div 
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `url(${backgroundImage})`,
                            backgroundSize: backgroundFit,
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                          }}
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Grid overlay for positioning */}
                  <div 
                    className={`absolute inset-0 ${backgroundImage ? 'opacity-10' : 'opacity-20'}`}
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, #e2e8f0 1px, transparent 1px),
                        linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px'
                    }}
                  />
                  
                  {/* Content will be added here */}
                  <div className="absolute inset-0 p-4">
                    {!backgroundImage ? (
                      <div className="text-slate-400 text-center mt-20">
                        <p className="text-lg">A4 Document Canvas</p>
                        <p className="text-sm mt-2">210mm × 297mm ({A4_WIDTH}px × {A4_HEIGHT}px)</p>
                        <p className="text-xs mt-4">Click "Add Background" to upload your background image</p>
                      </div>
                    ) : (
                      <div className="text-white text-center mt-20 bg-black/20 backdrop-blur-sm rounded-lg p-4 inline-block">
                        <p className="text-sm font-medium">Background Active</p>
                        <p className="text-xs mt-1">Ready for content placement</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="col-span-3">
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Properties</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Document Size</label>
                    <p className="text-white text-sm">A4 (210 × 297 mm)</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Zoom Level</label>
                    <p className="text-white text-sm">{zoom}%</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Background</label>
                    {backgroundImage ? (
                      <div className="space-y-2">
                        <p className="text-green-400 text-sm">✓ Image loaded</p>
                        <div className="space-y-1">
                          <label className="text-xs text-slate-400 block">Fit Mode</label>
                          <select 
                            value={backgroundFit} 
                            onChange={(e) => setBackgroundFit(e.target.value as 'cover' | 'contain' | 'fill')}
                            className="w-full bg-slate-800 border border-slate-600 text-white text-xs rounded px-2 py-1"
                          >
                            <option value="cover">Cover (fit & crop)</option>
                            <option value="contain">Contain (fit all)</option>
                            <option value="fill">Fill (stretch)</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">None</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Elements</label>
                    <p className="text-slate-500 text-sm">0 items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}