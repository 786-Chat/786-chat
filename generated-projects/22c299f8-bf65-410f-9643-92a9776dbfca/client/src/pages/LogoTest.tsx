import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BranchLogoUpload } from "@/components/BranchLogoUpload";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Upload } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
}

export default function LogoTest() {
  const [showLogoUpload, setShowLogoUpload] = useState(false);

  // Fetch branch profile (simulated for testing)
  const { data: branchProfile, isLoading } = useQuery<Branch>({
    queryKey: ['/api/branch/profile'],
    queryFn: async () => {
      // This would normally fetch from the API
      // For testing, return mock data
      return {
        id: '1',
        name: 'Test Branch',
        logoUrl: '/uploads/test-logo.png',
        address: '123 Test Street'
      };
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">
            Branch Logo Upload Test
          </h1>
          
          <div className="bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8">
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-semibold">Current Branch Logo</h2>
              
              {/* Current Logo Display */}
              <div className="relative group inline-block">
                {branchProfile?.logoUrl ? (
                  <Avatar className="w-24 h-24 border-4 border-white/20 cursor-pointer mx-auto" onClick={() => setShowLogoUpload(true)}>
                    <AvatarImage 
                      src={`/api/branches/${branchProfile.id}/logo?v=${Date.now()}`}
                      alt={`${branchProfile.name} Logo`}
                      onError={(e) => {
                        // Try alternate paths if initial path fails
                        const target = e.target as HTMLImageElement;
                        const originalUrl = branchProfile?.logoUrl;
                        
                        if (originalUrl && !target.src.includes('/attached_assets/')) {
                          // Try attached_assets directory
                          if (originalUrl.startsWith('/uploads/')) {
                            target.src = originalUrl.replace('/uploads/', '/attached_assets/');
                          } else if (originalUrl.startsWith('/data/')) {
                            target.src = originalUrl.replace('/data/', '/uploads/');
                          } else {
                            target.src = `/attached_assets/${originalUrl}`;
                          }
                        } else if (originalUrl && !target.src.includes('/data/')) {
                          // Try data directory
                          target.src = originalUrl.replace('/uploads/', '/data/').replace('/attached_assets/', '/data/');
                        }
                      }}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-lg font-bold">
                      {branchProfile.name?.substring(0, 2).toUpperCase() || 'BR'}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div 
                    className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center border-4 border-white/20 cursor-pointer mx-auto"
                    onClick={() => setShowLogoUpload(true)}
                  >
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                )}
                
                {/* Upload overlay on hover */}
                <div 
                  className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => setShowLogoUpload(true)}
                >
                  <Upload className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-medium text-white">
                  {branchProfile?.name || 'Branch Name'}
                </h3>
                <p className="text-slate-400">
                  {branchProfile?.address || 'Branch Address'}
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-slate-300">
                  Click on the logo above or use the button below to upload a new logo
                </p>
                
                <Button
                  onClick={() => setShowLogoUpload(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload New Logo
                </Button>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-4 text-left">
                <h4 className="font-semibold text-blue-300 mb-2">Features:</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>✓ Drag and drop support</li>
                  <li>✓ Multiple image formats (JPG, PNG, GIF, SVG)</li>
                  <li>✓ Automatic file backup across multiple directories</li>
                  <li>✓ Deployment-persistent storage</li>
                  <li>✓ Branch-specific logo management</li>
                  <li>✓ Immediate logo preview and updates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Upload Dialog */}
      <BranchLogoUpload
        isOpen={showLogoUpload}
        onClose={() => setShowLogoUpload(false)}
      />
    </div>
  );
}