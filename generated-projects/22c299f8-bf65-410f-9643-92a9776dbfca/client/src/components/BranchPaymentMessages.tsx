import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Clock, CheckCircle, AlertTriangle, Calendar, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type PaymentMessage = {
  id: string;
  paymentRecordId: string;
  branchId: string;
  messageType: string;
  messageContent: string;
  isAutomatic: boolean;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
};

export default function BranchPaymentMessages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<PaymentMessage[]>({
    queryKey: ["/api/payment-messages"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await fetch(`/api/payment-messages/${messageId}/read`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark message as read");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-messages"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getMessageIcon = (messageType: string) => {
    switch (messageType) {
      case 'price-agreed': return <CreditCard size={16} className="text-green-400" />;
      case 'payment-due': return <Clock size={16} className="text-yellow-400" />;
      case 'visit-reminder': return <Calendar size={16} className="text-blue-400" />;
      case 'overdue-warning': return <AlertTriangle size={16} className="text-red-400" />;
      default: return <MessageSquare size={16} className="text-purple-400" />;
    }
  };

  const getMessageTypeLabel = (messageType: string) => {
    switch (messageType) {
      case 'price-agreed': return 'Price Agreed';
      case 'payment-due': return 'Payment Due';
      case 'visit-reminder': return 'Visit Reminder';
      case 'overdue-warning': return 'Overdue Warning';
      default: return 'Message';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          <MessageSquare className="inline mr-2" size={24} />
          Payment Messages
        </CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-purple-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No messages yet</h3>
            <p className="text-purple-300">Payment updates and reminders will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`bg-black/40 rounded-lg p-4 border transition-colors ${
                  message.readAt 
                    ? "border-purple-500/30" 
                    : "border-purple-400/50 bg-purple-500/10"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getMessageIcon(message.messageType)}
                    <Badge 
                      variant="outline" 
                      className="border-purple-500/50 text-purple-300"
                    >
                      {getMessageTypeLabel(message.messageType)}
                    </Badge>
                    {message.isAutomatic && (
                      <Badge 
                        variant="outline" 
                        className="border-blue-500/50 text-blue-300"
                      >
                        Auto
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!message.readAt && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsReadMutation.mutate(message.id)}
                        className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                      >
                        <CheckCircle size={16} />
                        Mark Read
                      </Button>
                    )}
                    <span className="text-xs text-purple-400">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="text-white mb-3">
                  {message.messageContent}
                </div>

                {message.readAt && (
                  <div className="text-xs text-green-400 flex items-center">
                    <CheckCircle size={12} className="mr-1" />
                    Read on {new Date(message.readAt).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}