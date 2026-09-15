import React, { useState } from "react";
import { X, Send, Calendar, Clock, MessageSquare, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Branch {
  id: string;
  name: string;
  address: string;
}

interface NotificationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const visitTypes = [
  { id: "routine", label: "Routine" },
  { id: "follow-up", label: "Follow up" },
  { id: "call-out", label: "Call out" },
  { id: "it", label: "I.T", tooltip: "Initial Treatment" },
  { id: "itf", label: "I.T.F", tooltip: "Initial Treatment Follow" },
  { id: "other", label: "Other" }
];

export default function NotificationSidebar({ isOpen, onClose }: NotificationSidebarProps) {
  const { toast } = useToast();
  
  // Form state
  const [selectedBranch, setSelectedBranch] = useState("");
  const [message, setMessage] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [visitPurpose, setVisitPurpose] = useState("");
  const [selectedVisitTypes, setSelectedVisitTypes] = useState<string[]>([]);

  // Fetch branches
  const { data: branchesResponse } = useQuery<{branches: Branch[]}>({
    queryKey: ["/api/branches"],
  });
  
  const branches = branchesResponse?.branches || [];

  // Create notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: async (notificationData: any) => {
      return apiRequest("POST", "/api/notifications", notificationData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification sent successfully",
      });
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedBranch("");
    setMessage("");
    setVisitDate("");
    setVisitTime("");
    setVisitPurpose("");
    setSelectedVisitTypes([]);
  };

  const handleVisitTypeChange = (typeId: string, checked: boolean) => {
    if (checked) {
      setSelectedVisitTypes(prev => [...prev, typeId]);
    } else {
      setSelectedVisitTypes(prev => prev.filter(id => id !== typeId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submission data:", {
      selectedBranch,
      message,
      visitDate,
      visitTime,
      visitPurpose,
      selectedVisitTypes
    });
    
    if (!selectedBranch || !message || !visitDate || !visitTime || !visitPurpose) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (selectedVisitTypes.length === 0) {
      toast({
        title: "Validation Error", 
        description: "Please select at least one visit type",
        variant: "destructive",
      });
      return;
    }

    createNotificationMutation.mutate({
      branchId: selectedBranch,
      message,
      visitDate,
      visitTime,
      purposeOfVisit: visitPurpose,
      visitTypes: selectedVisitTypes,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="relative ml-auto w-96 h-full bg-slate-900 shadow-2xl border-l border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Send Notification</span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form Content */}
        <div className="p-4 h-full overflow-y-auto pb-20">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Branch Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>Select Branch *</span>
              </label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Choose a branch" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {branches.map((branch) => (
                    <SelectItem 
                      key={branch.id} 
                      value={branch.id}
                      className="text-white hover:bg-slate-700 focus:bg-slate-700"
                    >
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notification Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center space-x-1">
                <MessageSquare className="h-4 w-4" />
                <span>Notification Message *</span>
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your notification message..."
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 min-h-[80px]"
              />
            </div>

            {/* Visit Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Visit Date *</span>
                </label>
                <Input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Visit Time *</span>
                </label>
                <Input
                  type="time"
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>

            {/* Visit Purpose */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Visit Purpose *
              </label>
              <Textarea
                value={visitPurpose}
                onChange={(e) => setVisitPurpose(e.target.value)}
                placeholder="Describe the purpose of the visit..."
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 min-h-[60px]"
              />
            </div>

            {/* Type of Visit */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300">
                Type of Visit *
              </label>
              <div className="space-y-3">
                {visitTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.id}
                      checked={selectedVisitTypes.includes(type.id)}
                      onCheckedChange={(checked) => handleVisitTypeChange(type.id, checked as boolean)}
                      className="border-slate-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                    <label 
                      htmlFor={type.id} 
                      className="text-sm text-slate-300 cursor-pointer flex-1"
                      title={type.tooltip}
                    >
                      {type.label}
                      {type.tooltip && (
                        <span className="text-xs text-slate-500 ml-1">({type.tooltip})</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={createNotificationMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {createNotificationMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}