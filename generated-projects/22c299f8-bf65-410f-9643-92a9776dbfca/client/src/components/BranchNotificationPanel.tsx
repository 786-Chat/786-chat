import React, { useState } from "react";
import { Bell, Calendar, Clock, MessageSquare, CheckCircle, AlertCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Notification {
  id: string;
  branchId: string;
  message: string;
  visitDate: string;
  visitTime: string;
  purposeOfVisit: string;
  visitTypes?: string[];
  sentAt: string;
  createdAt: string;
  isRead?: boolean;
  readAt?: string;
}

interface BranchNotificationPanelProps {
  branchId: string;
}

const visitTypeLabels: Record<string, string> = {
  'routine': 'Routine',
  'follow-up': 'Follow up',
  'call-out': 'Call out',
  'it': 'I.T (Initial Treatment)',
  'itf': 'I.T.F (Initial Treatment Follow)',
  'other': 'Other'
};

export default function BranchNotificationPanel({ branchId }: BranchNotificationPanelProps) {
  const { toast } = useToast();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Fetch notifications for this branch
  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications/branch", branchId],
    queryFn: async () => {
      console.log("Fetching notifications for branch:", branchId);
      const response = await fetch(`/api/notifications/branch/${branchId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error("Failed to fetch notifications:", response.status, response.statusText);
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched notifications:", data);
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest("PATCH", `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/branch", branchId] });
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      console.log("Deleting notification:", notificationId);
      return apiRequest("DELETE", `/api/notifications/${notificationId}`, {});
    },
    onSuccess: () => {
      console.log("Notification deleted successfully, invalidating cache");
      // Invalidate and refetch the notifications
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/branch", branchId] });
      // Also force a refetch to ensure fresh data
      refetch();
      toast({
        title: "Success",
        description: "Notification deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to delete notification:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete notification",
        variant: "destructive",
      });
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const formatVisitTypes = (types: string[] = []) => {
    return types.map(type => visitTypeLabels[type] || type).join(", ");
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
        <CardContent className="p-6">
          <div className="text-center text-slate-400">Loading notifications...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-slate-400 hover:text-white"
            >
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No notifications yet</p>
              <p className="text-xs text-slate-500">Visit notifications will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-slate-900/60 ${
                    notification.isRead
                      ? 'bg-slate-900/30 border-slate-700'
                      : 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30'
                  }`}
                  onClick={() => setSelectedNotification(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <p className="text-white font-medium text-sm">Visit Scheduled</p>
                        <Badge variant="outline" className="text-xs">
                          New Visit
                        </Badge>
                      </div>
                      
                      <p className="text-slate-300 text-sm line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-slate-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{notification.visitDate}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{notification.visitTime}</span>
                        </div>
                      </div>
                      
                      {/* Visit Types Display */}
                      {notification.visitTypes && notification.visitTypes.length > 0 && (
                        <div className="flex items-center flex-wrap gap-1">
                          {notification.visitTypes.map((type: string, index: number) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30"
                            >
                              {visitTypeLabels[type] || type}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-slate-500">
                        Sent {format(new Date(notification.sentAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-2"
                      title="Delete notification"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedNotification(null)}
          />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Visit Notification</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNotification(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300">Message</label>
                <p className="text-white mt-1">{selectedNotification.message}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Visit Date</label>
                  <p className="text-white mt-1">{selectedNotification.visitDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Visit Time</label>
                  <p className="text-white mt-1">{selectedNotification.visitTime}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-300">Visit Purpose</label>
                <p className="text-white mt-1">{selectedNotification.purposeOfVisit}</p>
              </div>
              
              <div className="pt-2 border-t border-slate-700">
                <p className="text-xs text-slate-400">
                  Sent on {format(new Date(selectedNotification.sentAt), 'MMMM dd, yyyy at HH:mm')}
                </p>
                {selectedNotification.readAt && (
                  <p className="text-xs text-slate-400">
                    Read on {format(new Date(selectedNotification.readAt), 'MMMM dd, yyyy at HH:mm')}
                  </p>
                )}
              </div>
              
              {!selectedNotification.isRead && (
                <Button
                  onClick={() => {
                    handleMarkAsRead(selectedNotification.id);
                    setSelectedNotification(null);
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  disabled={markAsReadMutation.isPending}
                >
                  {markAsReadMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Marking as Read...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Read
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}