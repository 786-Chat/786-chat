import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Code, AlertTriangle, CheckCircle, Timer, Eye, EyeOff } from "lucide-react";
import SecurityPinModal from "./SecurityPinModal";
import { useSecurityPin } from "@/hooks/useSecurityPin";

export default function CodeProtectionPanel() {
  const [showPinModal, setShowPinModal] = useState(false);
  const [showProtectedArea, setShowProtectedArea] = useState(false);
  const { isSecurityAuthenticated, authenticateWithPin, clearSecuritySession } = useSecurityPin();

  const handleSecurityAccess = () => {
    if (isSecurityAuthenticated) {
      setShowProtectedArea(!showProtectedArea);
    } else {
      setShowPinModal(true);
    }
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    setShowProtectedArea(true);
  };

  const protectedFeatures = [
    {
      name: "Database Schema Changes",
      status: "Protected",
      risk: "High",
      description: "Modifications to database structure and relationships"
    },
    {
      name: "Authentication System",
      status: "Protected", 
      risk: "Critical",
      description: "Login, session management, and security configurations"
    },
    {
      name: "File Storage System",
      status: "Protected",
      risk: "High", 
      description: "Upload paths, file validation, and storage logic"
    },
    {
      name: "API Routes & Endpoints",
      status: "Protected",
      risk: "High",
      description: "Server routes, middleware, and request handling"
    },
    {
      name: "Core Business Logic",
      status: "Protected",
      risk: "Critical",
      description: "Document retention, branch isolation, payment processing"
    }
  ];

  return (
    <>
      <SecurityPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
        title="Code Protection Access"
        description="Enter security PIN to access protected code modification features"
      />

      <Card className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-300 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span>Code Protection System</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-xs ${isSecurityAuthenticated ? 'bg-green-600/20 text-green-300 border-green-500/30' : 'bg-red-600/20 text-red-300 border-red-500/30'}`}>
                    {isSecurityAuthenticated ? "Authenticated" : "Protected"}
                  </Badge>
                  <Badge className="bg-orange-600/20 text-orange-300 border-orange-500/30 text-xs">
                    PIN: 121212
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              onClick={handleSecurityAccess}
              className={`${isSecurityAuthenticated ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
            >
              {showProtectedArea ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {isSecurityAuthenticated ? (showProtectedArea ? "Hide" : "Show") : "Access"} Protected Features
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Security Status */}
          <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-300 font-medium">Security Notice</span>
            </div>
            <p className="text-red-200 text-sm mb-3">
              Critical system components are protected to prevent unauthorized modifications that could break the working application.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Timer className="w-4 h-4 text-red-400" />
              <span className="text-red-300">
                {isSecurityAuthenticated ? "Session expires in 2 hours" : "Authentication required for access"}
              </span>
            </div>
          </div>

          {/* Protected Features List */}
          {showProtectedArea && isSecurityAuthenticated && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium">Protected System Components</h4>
                <Button
                  onClick={clearSecuritySession}
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 text-red-300 hover:bg-red-900/20"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  Lock Session
                </Button>
              </div>

              <div className="grid gap-3">
                {protectedFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Code className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">{feature.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`text-xs ${
                            feature.risk === 'Critical' 
                              ? 'bg-red-600/20 text-red-300 border-red-500/30'
                              : 'bg-orange-600/20 text-orange-300 border-orange-500/30'
                          }`}
                        >
                          {feature.risk} Risk
                        </Badge>
                        <Badge className="bg-green-600/20 text-green-300 border-green-500/30 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {feature.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>

              {/* Access Warning */}
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <span className="text-orange-300 font-medium">Code Modification Warning</span>
                </div>
                <p className="text-orange-200 text-sm">
                  Only modify protected components if you understand the full impact. The system is currently working perfectly - 
                  unauthorized changes may break critical functionality including authentication, file uploads, and data retention.
                </p>
              </div>
            </div>
          )}

          {/* Quick Actions for Authenticated Users */}
          {isSecurityAuthenticated && showProtectedArea && (
            <div className="border-t border-slate-600 pt-4">
              <h4 className="text-white font-medium mb-3">Safe Modification Areas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="border-blue-500/30 text-blue-300 hover:bg-blue-900/20 justify-start"
                >
                  <Code className="w-4 h-4 mr-2" />
                  UI Components & Styling
                </Button>
                <Button
                  variant="outline"
                  className="border-green-500/30 text-green-300 hover:bg-green-900/20 justify-start"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Dashboard Text & Labels
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}