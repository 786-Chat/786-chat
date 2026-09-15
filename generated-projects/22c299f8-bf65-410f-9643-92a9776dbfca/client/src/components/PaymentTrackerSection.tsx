import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Plus, Trash2, DollarSign, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const paymentSchema = z.object({
  branchId: z.string().min(1, "Branch selection is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  visitFrequency: z.string().min(1, "Visit frequency is required"),
  paymentAgreement: z.string().min(1, "Payment agreement amount is required"),
});

type PaymentRecord = {
  id: string;
  branchId: string;
  paymentMethod: string;
  visitFrequency: string;
  paymentAgreement: string;
  createdBy: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
};

type Branch = {
  id: string;
  name: string;
};

export default function PaymentTrackerSection() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: paymentRecords = [], isLoading: recordsLoading } = useQuery<PaymentRecord[]>({
    queryKey: ["/api/payment-records"],
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  const { data: branchesResponse } = useQuery<{ branches: Branch[] }>({
    queryKey: ["/api/branches"],
    queryFn: async () => {
      const response = await fetch('/api/branches?limit=1000');
      if (!response.ok) throw new Error('Failed to fetch branches');
      return response.json();
    },
  });

  const branches: Branch[] = branchesResponse?.branches || [];

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      branchId: "",
      paymentMethod: "online",
      visitFrequency: "monthly",
      paymentAgreement: "50",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof paymentSchema>) => {
      return await apiRequest("POST", "/api/payment-records", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-records"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Payment record created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment record",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/payment-records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-records"] });
      toast({
        title: "Success",
        description: "Payment record deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete payment record",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof paymentSchema>) => {
    createMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const groupedRecords = paymentRecords.reduce((acc, record) => {
    const key = `${record.branchId}-${record.paymentAgreement}-${record.paymentMethod}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(record);
    return acc;
  }, {} as Record<string, PaymentRecord[]>);

  // Filter records based on search term
  const filteredGroupedRecords = useMemo(() => {
    if (!searchTerm.trim()) {
      return groupedRecords;
    }

    const filtered: Record<string, PaymentRecord[]> = {};
    Object.entries(groupedRecords).forEach(([key, records]) => {
      const mainRecord = records[0];
      const branch = branches.find((b: Branch) => b.id === mainRecord.branchId);
      const branchName = branch?.name || 'Unknown Branch';
      
      // Search in branch name, payment method, visit frequency, and payment amount
      const searchLower = searchTerm.toLowerCase();
      const matchesBranch = branchName.toLowerCase().includes(searchLower);
      const matchesMethod = mainRecord.paymentMethod.toLowerCase().includes(searchLower);
      const matchesFrequency = mainRecord.visitFrequency.toLowerCase().includes(searchLower);
      const matchesAmount = mainRecord.paymentAgreement.includes(searchTerm);
      
      if (matchesBranch || matchesMethod || matchesFrequency || matchesAmount) {
        filtered[key] = records;
      }
    });
    
    return filtered;
  }, [groupedRecords, searchTerm, branches]);

  // Check if we should show search bar (more than 1 payment record group)
  const shouldShowSearch = Object.keys(groupedRecords).length > 1;

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 w-full max-w-full overflow-hidden">
      <CardHeader className="space-y-4 w-full max-w-full">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <CardTitle className="text-xl lg:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-center lg:text-left">
            <CreditCard className="inline mr-2" size={20} />
            Payment Tracker
          </CardTitle>
          <div className="flex justify-center lg:justify-end lg:ml-6">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-purple-500/25 transition-all duration-300 px-4 lg:px-6 py-2 text-sm lg:text-base"
              >
                <Plus className="mr-2" size={16} />
                Add Payment Record
              </Button>
            </DialogTrigger>
          <DialogContent className="bg-black/90 border-purple-500/30 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Payment & Agreement Settings
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-300">Select Branch</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-black/30 border-purple-500/30 text-white">
                            <SelectValue placeholder="Choose a branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-black/90 border-purple-500/30">
                          {branches.map((branch: Branch) => (
                            <SelectItem key={branch.id} value={branch.id} className="text-white hover:bg-purple-500/20">
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-300">Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-800 border-purple-500/30 text-white">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-black/90 border-purple-500/30">
                          <SelectItem value="online" className="text-white hover:bg-purple-500/20">Online</SelectItem>
                          <SelectItem value="cash" className="text-white hover:bg-purple-500/20">Cash</SelectItem>
                          <SelectItem value="card" className="text-white hover:bg-purple-500/20">Card</SelectItem>
                          <SelectItem value="bank-transfer" className="text-white hover:bg-purple-500/20">Bank Transfer</SelectItem>
                          <SelectItem value="cheque" className="text-white hover:bg-purple-500/20">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visitFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-300">Visit Agreement Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-800 border-purple-500/30 text-white">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-black/90 border-purple-500/30">
                          <SelectItem value="monthly" className="text-white hover:bg-purple-500/20">Monthly</SelectItem>
                          <SelectItem value="weekly" className="text-white hover:bg-purple-500/20">Weekly</SelectItem>
                          <SelectItem value="bi-weekly" className="text-white hover:bg-purple-500/20">Bi-weekly</SelectItem>
                          <SelectItem value="quarterly" className="text-white hover:bg-purple-500/20">Quarterly</SelectItem>
                          <SelectItem value="yearly" className="text-white hover:bg-purple-500/20">Yearly</SelectItem>
                          <SelectItem value="one-time" className="text-white hover:bg-purple-500/20">One-time</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentAgreement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-300">Payment Agreement (£)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="50"
                          className="bg-gray-800 border-purple-500/30 text-white placeholder:text-gray-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {createMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2" size={18} />
                        Save Agreement
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
          </div>
        </div>
        
        {/* Search Bar - Only show when there are multiple payment records */}
        {shouldShowSearch && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search payment records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black/30 border-purple-500/30 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-purple-400"
                autoComplete="off"
              />
            </div>
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="text-purple-300 hover:text-white hover:bg-purple-500/20 px-2"
              >
                Clear
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 lg:p-6">
        {recordsLoading ? (
          <div className="text-center py-8 lg:py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-purple-300">Loading payment records...</p>
          </div>
        ) : Object.keys(filteredGroupedRecords).length === 0 && Object.keys(groupedRecords).length === 0 ? (
          <div className="text-center py-8 lg:py-12">
            <CreditCard className="mx-auto h-10 w-10 lg:h-12 lg:w-12 text-purple-400 mb-4" />
            <h3 className="text-base lg:text-lg font-medium text-white mb-2">No payment records yet</h3>
            <p className="text-purple-300 mb-4 text-sm lg:text-base">Create your first payment record to start tracking payments</p>
          </div>
        ) : Object.keys(filteredGroupedRecords).length === 0 && searchTerm ? (
          <div className="text-center py-8 lg:py-12">
            <Search className="mx-auto h-10 w-10 lg:h-12 lg:w-12 text-purple-400 mb-4" />
            <h3 className="text-base lg:text-lg font-medium text-white mb-2">No matching records found</h3>
            <p className="text-purple-300 mb-4 text-sm lg:text-base">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="grid gap-3 lg:gap-4 w-full max-w-full">
            {Object.entries(filteredGroupedRecords).map(([key, records]) => {
              const mainRecord = records[0];
              const branch = branches.find((b: Branch) => b.id === mainRecord.branchId);
              return (
                <div
                  key={key}
                  className="bg-black/40 rounded-lg p-3 lg:p-4 border border-purple-500/30 hover:border-purple-400/50 transition-colors w-full max-w-full overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-base lg:text-lg truncate">{branch?.name || 'Unknown Branch'}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 lg:h-4 lg:w-4 text-purple-400 mr-1 flex-shrink-0" />
                          <span className="text-purple-300 text-xs lg:text-sm">£{mainRecord.paymentAgreement}</span>
                        </div>
                        <span className="text-gray-400 text-xs lg:text-sm truncate">{mainRecord.paymentMethod}</span>
                        <span className="text-gray-400 text-xs lg:text-sm truncate">{mainRecord.visitFrequency}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(mainRecord.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 lg:h-8 lg:w-8 p-0"
                      >
                        <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                      </Button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}