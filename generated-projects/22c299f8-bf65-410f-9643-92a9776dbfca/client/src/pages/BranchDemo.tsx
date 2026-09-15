import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  FileText, 
  Camera, 
  Calendar, 
  Link as LinkIcon, 
  Receipt,
  Bell,
  Settings,
  Download,
  Eye,
  Upload,
  Star,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Search,
  Plus,
  Send,
  ArrowLeft
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function BranchDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [, setLocation] = useLocation();

  const demoSteps = [
    {
      title: "Welcome to Your Branch Dashboard",
      description: "This is your personal pest control services where you can access all documents, photos, and resources sent by the admin.",
      highlight: "overview",
      content: "View your branch information, check notifications, and access all the materials provided by your admin team."
    },
    {
      title: "My Documents",
      description: "Access all documents sent to your branch, including policies, procedures, and important notices.",
      highlight: "documents",
      content: "View PDF files, Word documents, and other materials. Save important documents for easy access later."
    },
    {
      title: "Photos Gallery",
      description: "View before/after photos sent by admin and upload your own photos for documentation.",
      highlight: "photos",
      content: "Browse photos by category (before/after), view in full size, and upload your own images when needed."
    },
    {
      title: "Pest Control Documentation",
      description: "Access pest control reports, treatment schedules, and compliance documentation.",
      highlight: "pest-control",
      content: "Stay up-to-date with pest control requirements, view treatment reports, and track compliance status."
    },
    {
      title: "Monthly Reports",
      description: "Submit your monthly compliance reports and view previously submitted reports.",
      highlight: "reports",
      content: "Upload monthly reports, track submission status, and maintain compliance with regulations."
    },
    {
      title: "Yearly Documents",
      description: "Access annual documentation, certificates, and yearly compliance materials.",
      highlight: "yearly",
      content: "View yearly certificates, annual reports, and important yearly documentation for your records."
    },
    {
      title: "Useful Links",
      description: "Quick access to important websites, training materials, and online resources.",
      highlight: "links",
      content: "Access training portals, regulatory websites, and other important online resources shared by admin."
    },
    {
      title: "Payment Information",
      description: "View payment history, upcoming payments, and payment-related messages.",
      highlight: "payments",
      content: "Stay informed about payment schedules, view payment history, and receive important payment notifications."
    },
    {
      title: "Notifications",
      description: "Stay updated with important messages and announcements from admin.",
      highlight: "notifications",
      content: "Receive real-time notifications about new documents, important updates, and system announcements."
    },
    {
      title: "Branch Settings",
      description: "Customize your dashboard appearance and manage your branch profile settings.",
      highlight: "settings",
      content: "Change dashboard theme, update contact information, and customize your dashboard experience."
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Branch Dashboard Demo</h1>
          <p className="text-slate-300 text-lg">Learn how to use your branch dashboard to access documents, upload content, and stay organized</p>
          
          {/* Demo Controls */}
          <div className="flex justify-center gap-4 flex-wrap">
            <Button
              onClick={() => setLocation('/branch-login')}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Branch Login
            </Button>
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
                <Badge className="bg-blue-600 text-white">
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
                  <div className="space-y-4">
                    {/* Branch Header Demo */}
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 border-2 border-white/20">
                          <AvatarFallback className="bg-red-600 text-white font-bold">
                            CB
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-white font-bold">Cake Box Test 1</h3>
                          <p className="text-slate-400 text-sm">41 Hamilton Road, KT1 2EU</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-slate-600'}`} />
                          ))}
                          <span className="text-white ml-2">4.0</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-blue-600/20 p-3 rounded-lg text-center">
                        <FileText className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                        <p className="text-white text-xs">8 Documents</p>
                      </div>
                      <div className="bg-green-600/20 p-3 rounded-lg text-center">
                        <Camera className="w-6 h-6 text-green-400 mx-auto mb-1" />
                        <p className="text-white text-xs">12 Photos</p>
                      </div>
                      <div className="bg-purple-600/20 p-3 rounded-lg text-center">
                        <Calendar className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                        <p className="text-white text-xs">3 Reports</p>
                      </div>
                      <div className="bg-yellow-600/20 p-3 rounded-lg text-center">
                        <Bell className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                        <p className="text-white text-xs">2 Notifications</p>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-4">
                      <Search className="w-5 h-5 text-slate-400" />
                      <div className="flex-1 bg-slate-700/50 rounded-lg p-2">
                        <p className="text-slate-400 text-sm">Search documents...</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { title: "Food Safety Policy", type: "PDF", date: "Dec 2024" },
                        { title: "Training Manual", type: "DOC", date: "Nov 2024" },
                        { title: "Compliance Guide", type: "PDF", date: "Nov 2024" }
                      ].map((doc, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-700/30 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-400" />
                            <div>
                              <p className="text-white text-sm font-medium">{doc.title}</p>
                              <p className="text-slate-400 text-xs">{doc.type} • {doc.date}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-white/30 text-white h-8">
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-white/30 text-white h-8">
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="border-white/30 text-white p-4 h-auto">
                        <div className="text-center">
                          <Camera className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">Before Photos</p>
                          <Badge className="mt-1 bg-blue-600">6 photos</Badge>
                        </div>
                      </Button>
                      <Button variant="outline" className="border-white/30 text-white p-4 h-auto">
                        <div className="text-center">
                          <Camera className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">After Photos</p>
                          <Badge className="mt-1 bg-green-600">8 photos</Badge>
                        </div>
                      </Button>
                    </div>
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-300 text-sm mb-3">Upload your own photos</p>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Select Files
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep >= 3 && currentStep <= 6 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        {currentStep === 3 && <FileText className="w-6 h-6 text-orange-400" />}
                        {currentStep === 4 && <Calendar className="w-6 h-6 text-purple-400" />}
                        {currentStep === 5 && <FileText className="w-6 h-6 text-blue-400" />}
                        {currentStep === 6 && <LinkIcon className="w-6 h-6 text-green-400" />}
                        <h5 className="text-white font-medium">
                          {currentStep === 3 && "Latest Documents"}
                          {currentStep === 4 && "Report Status"}
                          {currentStep === 5 && "Annual Certificates"}
                          {currentStep === 6 && "Quick Links"}
                        </h5>
                      </div>
                      <p className="text-slate-300 text-sm mb-3">
                        {currentStep === 3 && "3 new pest control documents"}
                        {currentStep === 4 && "Next report due: Jan 15, 2025"}
                        {currentStep === 5 && "2 yearly documents available"}
                        {currentStep === 6 && "5 important links shared"}
                      </p>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        View All
                      </Button>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Eye className="w-6 h-6 text-cyan-400" />
                        <h5 className="text-white font-medium">Quick Actions</h5>
                      </div>
                      <div className="space-y-2">
                        <Button size="sm" variant="outline" className="w-full border-white/30 text-white">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Content
                        </Button>
                        <Button size="sm" variant="outline" className="w-full border-white/30 text-white">
                          <Download className="w-4 h-4 mr-2" />
                          Download All
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep >= 7 && (
                  <div className="space-y-4">
                    {currentStep === 7 && (
                      <div className="bg-slate-700/30 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-white font-medium">Payment Status</h5>
                          <Badge className="bg-green-600">Up to Date</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">Monthly Amount</p>
                            <p className="text-white font-medium">£35.00</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Next Payment</p>
                            <p className="text-white font-medium">Jan 1, 2025</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {currentStep === 8 && (
                      <div className="space-y-2">
                        {[
                          { title: "New documents uploaded", time: "2 hours ago", type: "info" },
                          { title: "Monthly report reminder", time: "1 day ago", type: "warning" },
                          { title: "Payment processed successfully", time: "3 days ago", type: "success" }
                        ].map((notif, i) => (
                          <div key={i} className="flex items-center gap-3 bg-slate-700/30 p-3 rounded-lg">
                            <div className={`w-2 h-2 rounded-full ${
                              notif.type === 'info' ? 'bg-blue-400' :
                              notif.type === 'warning' ? 'bg-yellow-400' : 'bg-green-400'
                            }`}></div>
                            <div className="flex-1">
                              <p className="text-white text-sm">{notif.title}</p>
                              <p className="text-slate-400 text-xs">{notif.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {currentStep === 9 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h5 className="text-white font-medium">Theme Settings</h5>
                          <div className="flex gap-2">
                            {['blue', 'purple', 'green', 'orange'].map(color => (
                              <div key={color} className={`w-8 h-8 rounded-lg bg-${color}-600 cursor-pointer border-2 border-transparent hover:border-white/50`}></div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h5 className="text-white font-medium">Profile Info</h5>
                          <Button size="sm" variant="outline" className="w-full border-white/30 text-white">
                            Update Contact Info
                          </Button>
                        </div>
                      </div>
                    )}
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
                  className="bg-blue-600 hover:bg-blue-700"
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
                      ? 'bg-blue-600/30 border-blue-500'
                      : index < currentStep
                      ? 'bg-green-600/20 border-green-600/30'
                      : 'bg-slate-700/20 border-slate-600/30'
                  }`}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === currentStep
                        ? 'bg-blue-600 text-white'
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
              <CardTitle className="text-white text-lg">💡 Branch Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-slate-300 text-sm space-y-2">
                <p>• Check notifications regularly for important updates</p>
                <p>• Save important documents to My Documents for quick access</p>
                <p>• Upload monthly reports on time to maintain compliance</p>
                <p>• Use the search function to quickly find specific documents</p>
                <p>• Contact admin if you need help or have questions</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}