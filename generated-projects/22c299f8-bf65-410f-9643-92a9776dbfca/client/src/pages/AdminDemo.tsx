import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  FileText, 
  Camera, 
  Users, 
  Settings, 
  Plus, 
  Search,
  Upload,
  Send,
  Eye,
  Delete,
  ChevronRight,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";

export default function AdminDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const demoSteps = [
    {
      title: "Welcome to Admin Dashboard",
      description: "This is your central control panel for managing all branches, documents, and system settings.",
      highlight: "overview",
      content: "From here you can view system statistics, manage branches, and control all content distribution."
    },
    {
      title: "Branch Management",
      description: "Create and manage all your branch locations with complete control over their access and settings.",
      highlight: "branches",
      content: "Add new branches, edit existing ones, set passwords, and manage their status (active/inactive)."
    },
    {
      title: "Upload Photos",
      description: "Upload before/after photos and send them to specific branches for their documentation.",
      highlight: "photos",
      content: "Choose photo type (before/after), add descriptions, and select which branches should receive them."
    },
    {
      title: "Document Management",
      description: "Upload important documents like policies, procedures, and send them to selected branches.",
      highlight: "documents",
      content: "Upload PDF, DOC, XLS files and distribute them to specific branches or all branches at once."
    },
    {
      title: "Pest Control Tracking",
      description: "Manage pest control documentation and track compliance across all branches.",
      highlight: "pest-control",
      content: "Upload treatment reports, inspection documents, and monitor compliance for each location."
    },
    {
      title: "Monthly Reports",
      description: "Review and manage monthly compliance reports submitted by branches.",
      highlight: "reports",
      content: "View submitted reports, track compliance rates, and manage report approvals."
    },
    {
      title: "Useful Links",
      description: "Share important resources and links with branches for easy access to tools and information.",
      highlight: "links",
      content: "Add web resources, training materials, and important links that branches need regularly."
    },
    {
      title: "Payment Tracking",
      description: "Monitor payment status and send automated payment reminders to branches.",
      highlight: "payments",
      content: "Track payment history, set payment amounts, and send automated reminder messages."
    },
    {
      title: "System Settings",
      description: "Customize the system appearance, manage user settings, and configure system preferences.",
      highlight: "settings",
      content: "Modify dashboard themes, update system settings, and manage user access controls."
    }
  ];

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= demoSteps.length - 1) {
            setIsPlaying(false);
            clearInterval(interval);
            return 0;
          }
          return prev + 1;
        });
      }, 3000);
    }
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Admin Dashboard Demo</h1>
          <p className="text-slate-300 text-lg">Learn how to use all the powerful features of your admin dashboard</p>
          
          {/* Demo Controls */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={togglePlayback}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? 'Pause Demo' : 'Auto Play'}
            </Button>
            <Button
              onClick={resetDemo}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step Content */}
        <div className="lg:col-span-2">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge className="bg-purple-600 text-white">
                  Step {currentStep + 1} of {demoSteps.length}
                </Badge>
                <div className="text-slate-400 text-sm">
                  {Math.round(((currentStep + 1) / demoSteps.length) * 100)}% Complete
                </div>
              </div>
              <CardTitle className="text-white text-2xl">
                {demoSteps[currentStep].title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-300 text-lg leading-relaxed">
                {demoSteps[currentStep].description}
              </p>
              
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-600/30">
                <h4 className="text-white font-semibold mb-3">What you can do:</h4>
                <p className="text-slate-300">
                  {demoSteps[currentStep].content}
                </p>
              </div>

              {/* Interactive Demo Section */}
              <div className="bg-gradient-to-r from-slate-800/30 to-slate-700/20 rounded-xl p-6 border border-slate-600/30">
                <h4 className="text-white font-semibold mb-4">Feature Showcase</h4>
                
                {currentStep === 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-600/20 p-4 rounded-lg text-center">
                      <Building2 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-white text-sm">3 Branches</p>
                    </div>
                    <div className="bg-green-600/20 p-4 rounded-lg text-center">
                      <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-white text-sm">12 Users</p>
                    </div>
                    <div className="bg-purple-600/20 p-4 rounded-lg text-center">
                      <FileText className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-white text-sm">45 Documents</p>
                    </div>
                    <div className="bg-yellow-600/20 p-4 rounded-lg text-center">
                      <Camera className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                      <p className="text-white text-sm">23 Photos</p>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-700/30 p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">CB</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">Cake Box Test 1</p>
                          <p className="text-slate-400 text-sm">41 Hamilton Road, KT1 2EU</p>
                        </div>
                      </div>
                      <Badge className="bg-green-600">Active</Badge>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Branch
                    </Button>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                      <Camera className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-300 mb-4">Upload photos here</p>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Upload className="w-4 h-4 mr-2" />
                        Select Photos
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-white/30 text-white">Before</Button>
                      <Button size="sm" variant="outline" className="border-white/30 text-white">After</Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 ml-auto">
                        <Send className="w-4 h-4 mr-2" />
                        Send to Branches
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep >= 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="border-white/30 text-white p-6 h-auto flex-col">
                      <Eye className="w-8 h-8 mb-2" />
                      View Content
                    </Button>
                    <Button variant="outline" className="border-white/30 text-white p-6 h-auto flex-col">
                      <Upload className="w-8 h-8 mb-2" />
                      Upload New
                    </Button>
                    <Button variant="outline" className="border-white/30 text-white p-6 h-auto flex-col">
                      <Send className="w-8 h-8 mb-2" />
                      Send to Branches
                    </Button>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Previous
                </Button>
                <Button
                  onClick={nextStep}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {currentStep === demoSteps.length - 1 ? 'Start Over' : 'Next'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Sidebar */}
        <div className="space-y-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Demo Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {demoSteps.map((step, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    index === currentStep
                      ? 'bg-purple-600/30 border-purple-500'
                      : index < currentStep
                      ? 'bg-green-600/20 border-green-600/30'
                      : 'bg-slate-700/20 border-slate-600/30'
                  }`}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === currentStep
                        ? 'bg-purple-600 text-white'
                        : index < currentStep
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-600 text-slate-300'
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`text-sm font-medium ${
                      index <= currentStep ? 'text-white' : 'text-slate-400'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-lg">💡 Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-slate-300 text-sm space-y-2">
                <p>• Use the search function to quickly find specific branches</p>
                <p>• All documents are automatically retained for 24 months</p>
                <p>• You can send content to specific branches or all branches</p>
                <p>• Payment reminders can be automated</p>
                <p>• Use Master PIN "smrptt77" to unlock protected sections</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}