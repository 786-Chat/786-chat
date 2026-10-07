import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { getRestaurantBySlug } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Edit2, TrendingUp, TrendingDown, DollarSign, BarChart3, Users, Receipt, Calendar, Loader2, Building, Banknote, CreditCard, Wallet, ArrowUpRight, ArrowDownRight, FileText, Download, Printer, MessageCircle, ExternalLink } from "lucide-react";
import html2canvas from "html2canvas";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import type { FinancialTransaction, RecurringExpense, StaffMember, StaffWagePayment, CashDeposit, FinancialSummary } from "@shared/schema";
import { getCurrencySymbol } from "@shared/schema";
import { InstallPrompt } from "@/components/install-prompt";

const EXPENSE_CATEGORIES = [
  { value: "supplier_invoice", label: "Supplier Invoice", icon: "📦" },
  { value: "staff_wages", label: "Staff Wages", icon: "👥" },
  { value: "rent", label: "Rent", icon: "🏠" },
  { value: "electric", label: "Electric", icon: "⚡" },
  { value: "gas", label: "Gas", icon: "🔥" },
  { value: "water", label: "Water", icon: "💧" },
  { value: "business_rates", label: "Business Rates", icon: "📋" },
  { value: "rubbish", label: "Rubbish", icon: "🗑️" },
  { value: "vehicle_insurance", label: "Vehicle Insurance", icon: "🚗" },
  { value: "business_insurance", label: "Business Insurance", icon: "🛡️" },
  { value: "mot", label: "MOT", icon: "🔧" },
  { value: "wastage", label: "Wastage", icon: "🚮" },
  { value: "extra_expense", label: "Extra Expense", icon: "💸" },
  { value: "vat", label: "VAT", icon: "📑" },
  { value: "tax", label: "Tax", icon: "📊" },
  { value: "other", label: "Other", icon: "📌" },
];

const INCOME_SOURCES = [
  { value: "customer_order", label: "Customer Order", icon: "🛒" },
  { value: "epos_sale", label: "EPOS Sale", icon: "💳" },
  { value: "waiter_order", label: "Waiter Order", icon: "🍽️" },
  { value: "cash_deposit", label: "Cash Deposit", icon: "💵" },
  { value: "other_income", label: "Other Income", icon: "💰" },
];

const FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const CHART_COLORS = [
  "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", 
  "#06B6D4", "#EC4899", "#84CC16", "#F97316", "#6366F1"
];

export default function FinancesPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    const originalManifest = document.querySelector('link[rel="manifest"]');
    const originalManifestHref = originalManifest?.getAttribute('href');
    
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]:not([sizes])');
    const originalIconHref = appleTouchIcon?.getAttribute('href');
    
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const originalThemeColor = metaThemeColor?.getAttribute('content');
    
    const appleAppTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    const originalAppleTitle = appleAppTitle?.getAttribute('content');

    if (originalManifest) {
      originalManifest.setAttribute('href', '/manifest-finances.json');
    }
    if (appleTouchIcon) {
      appleTouchIcon.setAttribute('href', '/icon-finances-512.png');
    }
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#dc2626');
    }
    if (appleAppTitle) {
      appleAppTitle.setAttribute('content', 'Link24-Finances');
    }
    
    return () => {
      if (originalManifest && originalManifestHref) {
        originalManifest.setAttribute('href', originalManifestHref);
      }
      if (appleTouchIcon && originalIconHref) {
        appleTouchIcon.setAttribute('href', originalIconHref);
      }
      if (metaThemeColor && originalThemeColor) {
        metaThemeColor.setAttribute('content', originalThemeColor);
      }
      if (appleAppTitle && originalAppleTitle) {
        appleAppTitle.setAttribute('content', originalAppleTitle);
      }
    };
  }, []);

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug!),
    enabled: !!slug,
  });

  const restaurantId = restaurant?.id || null;
  const currencySymbol = getCurrencySymbol(restaurant?.currency || "GBP");

  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAddDeposit, setShowAddDeposit] = useState(false);
  const [showWageSlip, setShowWageSlip] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [wageSlipData, setWageSlipData] = useState({
    periodStart: "",
    periodEnd: "",
    hoursWorked: "",
    payDate: new Date().toISOString().split('T')[0],
  });

  const [newTransaction, setNewTransaction] = useState({
    type: "expense" as "income" | "expense",
    incomeSource: "",
    expenseCategory: "",
    amount: "",
    description: "",
  });

  const [newRecurring, setNewRecurring] = useState({
    category: "",
    name: "",
    amount: "",
    frequency: "monthly",
    dayOfMonth: "1",
    includeVat: false,
    notes: "",
  });

  const [newStaff, setNewStaff] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    payType: "hourly",
    payRate: "",
    hoursPerWeek: "",
    niNumber: "",
    taxCode: "1257L",
    niTableLetter: "A",
    address: "",
    postcode: "",
    paymentMethod: "cash",
    employeeNumber: "",
  });

  const [newDeposit, setNewDeposit] = useState({
    amount: "",
    notes: "",
    depositedBy: "",
  });

  const { data: summary } = useQuery<FinancialSummary>({
    queryKey: ["/api/finances/summary", restaurantId, timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/finances/summary?range=${timeRange}`);
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
    enabled: !!restaurantId,
  });

  const { data: transactions = [] } = useQuery<FinancialTransaction[]>({
    queryKey: ["/api/finances/transactions", restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/finances/transactions`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    enabled: !!restaurantId,
  });

  const { data: recurringExpenses = [] } = useQuery<RecurringExpense[]>({
    queryKey: ["/api/finances/recurring", restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/finances/recurring`);
      if (!res.ok) throw new Error("Failed to fetch recurring expenses");
      return res.json();
    },
    enabled: !!restaurantId,
  });

  const { data: staffMembers = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/finances/staff", restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/finances/staff`);
      if (!res.ok) throw new Error("Failed to fetch staff");
      return res.json();
    },
    enabled: !!restaurantId,
  });

  const { data: deposits = [] } = useQuery<CashDeposit[]>({
    queryKey: ["/api/finances/deposits", restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/finances/deposits`);
      if (!res.ok) throw new Error("Failed to fetch deposits");
      return res.json();
    },
    enabled: !!restaurantId,
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: typeof newTransaction) => {
      const res = await fetch(`/api/restaurants/${restaurantId}/finances/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount),
          transactionDate: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to create transaction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finances/transactions", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["/api/finances/summary", restaurantId] });
      setShowAddTransaction(false);
      setNewTransaction({ type: "expense", incomeSource: "", expenseCategory: "", amount: "", description: "" });
      toast({ title: "Transaction Added", description: "Financial record has been saved." });
    },
  });

  const createRecurringMutation = useMutation({
    mutationFn: async (data: typeof newRecurring) => {
      const res = await fetch(`/api/restaurants/${restaurantId}/finances/recurring`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount),
          dayOfMonth: parseInt(data.dayOfMonth),
        }),
      });
      if (!res.ok) throw new Error("Failed to create recurring expense");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finances/recurring", restaurantId] });
      setShowAddRecurring(false);
      setNewRecurring({ category: "", name: "", amount: "", frequency: "monthly", dayOfMonth: "1", includeVat: false, notes: "" });
      toast({ title: "Recurring Expense Added", description: "Expense will be tracked automatically." });
    },
  });

  const createStaffMutation = useMutation({
    mutationFn: async (data: typeof newStaff) => {
      const res = await fetch(`/api/restaurants/${restaurantId}/finances/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          payRate: parseFloat(data.payRate),
          hoursPerWeek: data.hoursPerWeek ? parseFloat(data.hoursPerWeek) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create staff member");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finances/staff", restaurantId] });
      setShowAddStaff(false);
      setNewStaff({ name: "", role: "", phone: "", email: "", payType: "hourly", payRate: "", hoursPerWeek: "", niNumber: "", taxCode: "1257L", niTableLetter: "A", address: "", postcode: "", paymentMethod: "cash", employeeNumber: "" });
      toast({ title: "Staff Member Added", description: "Employee added to payroll." });
    },
  });

  const createDepositMutation = useMutation({
    mutationFn: async (data: typeof newDeposit) => {
      const res = await fetch(`/api/restaurants/${restaurantId}/finances/deposits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount),
          depositDate: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to create deposit");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finances/deposits", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["/api/finances/summary", restaurantId] });
      setShowAddDeposit(false);
      setNewDeposit({ amount: "", notes: "", depositedBy: "" });
      toast({ title: "Deposit Recorded", description: "Cash deposit has been logged." });
    },
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/finances/recurring/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finances/recurring", restaurantId] });
      toast({ title: "Deleted", description: "Recurring expense removed." });
    },
  });

  const incomeData = summary?.incomeBySource 
    ? Object.entries(summary.incomeBySource).map(([name, value]) => ({ name: INCOME_SOURCES.find(s => s.value === name)?.label || name, value }))
    : [];

  const expenseData = summary?.expensesByCategory
    ? Object.entries(summary.expensesByCategory).map(([name, value]) => ({ name: EXPENSE_CATEGORIES.find(c => c.value === name)?.label || name, value }))
    : [];

  const recentTransactions = transactions.slice(0, 10);

  const generateTrendData = () => {
    if (transactions.length === 0) {
      return [{ name: "No Data", income: 0, expenses: 0 }];
    }
    const grouped: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach(t => {
      const date = new Date(t.transactionDate || t.createdAt || "");
      let key = "";
      if (timeRange === "week") {
        key = date.toLocaleDateString("en-GB", { weekday: "short" });
      } else if (timeRange === "month") {
        key = `Week ${Math.ceil(date.getDate() / 7)}`;
      } else {
        key = date.toLocaleDateString("en-GB", { month: "short" });
      }
      if (!grouped[key]) grouped[key] = { income: 0, expenses: 0 };
      const amount = parseFloat(t.amount);
      if (t.type === "income") {
        grouped[key].income += amount;
      } else {
        grouped[key].expenses += amount;
      }
    });
    return Object.entries(grouped).map(([name, data]) => ({ name, ...data }));
  };
  
  const trendData = generateTrendData();

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card px-4 py-4 flex items-center gap-4 sticky top-0 z-40">
        <Link href={`/dashboard/${slug}`}>
          <Button variant="ghost" size="icon" data-testid="button-back-dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl">{restaurant?.name} - Finances</h1>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Financial Dashboard</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v: "week" | "month" | "year") => setTimeRange(v)}>
            <SelectTrigger className="w-32" data-testid="select-time-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="p-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold text-emerald-500">{currencySymbol}{(summary?.totalIncome || 0).toFixed(2)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <ArrowUpRight className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-500">{currencySymbol}{(summary?.totalExpenses || 0).toFixed(2)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <ArrowDownRight className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className={`text-2xl font-bold ${(summary?.netProfit || 0) >= 0 ? "text-blue-500" : "text-red-500"}`}>
                    {currencySymbol}{(summary?.netProfit || 0).toFixed(2)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profit Margin</p>
                  <p className={`text-2xl font-bold ${(summary?.profitPercentage || 0) >= 0 ? "text-purple-500" : "text-red-500"}`}>
                    {(summary?.profitPercentage || 0).toFixed(1)}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
            <TabsTrigger value="recurring" data-testid="tab-recurring">Recurring Bills</TabsTrigger>
            <TabsTrigger value="staff" data-testid="tab-staff">Staff & Wages</TabsTrigger>
            <TabsTrigger value="deposits" data-testid="tab-deposits">Cash Deposits</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Income vs Expenses Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                          formatter={(value: number) => [`${currencySymbol}${value}`, '']}
                        />
                        <Area type="monotone" dataKey="income" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Income" />
                        <Area type="monotone" dataKey="expenses" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Expenses" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-blue-500" />
                    Expenses by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseData.length > 0 ? expenseData : [{ name: "No data", value: 1 }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {(expenseData.length > 0 ? expenseData : [{ name: "No data", value: 1 }]).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                          formatter={(value: number) => [`${currencySymbol}${value}`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-amber-500" />
                    Income Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incomeData.length > 0 ? incomeData : [{ name: "No data", value: 0 }]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                          formatter={(value: number) => [`${currencySymbol}${value}`, '']}
                        />
                        <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-violet-500" />
                    Recent Transactions
                  </CardTitle>
                  <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-transaction">
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Transaction</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label>Type</Label>
                          <Select value={newTransaction.type} onValueChange={(v: "income" | "expense") => setNewTransaction({ ...newTransaction, type: v, incomeSource: "", expenseCategory: "" })}>
                            <SelectTrigger data-testid="select-transaction-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Income</SelectItem>
                              <SelectItem value="expense">Expense</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {newTransaction.type === "income" ? (
                          <div>
                            <Label>Income Source</Label>
                            <Select value={newTransaction.incomeSource} onValueChange={(v) => setNewTransaction({ ...newTransaction, incomeSource: v })}>
                              <SelectTrigger data-testid="select-income-source">
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                              <SelectContent>
                                {INCOME_SOURCES.map(s => (
                                  <SelectItem key={s.value} value={s.value}>{s.icon} {s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div>
                            <Label>Expense Category</Label>
                            <Select value={newTransaction.expenseCategory} onValueChange={(v) => setNewTransaction({ ...newTransaction, expenseCategory: v })}>
                              <SelectTrigger data-testid="select-expense-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {EXPENSE_CATEGORIES.map(c => (
                                  <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div>
                          <Label>Amount ({currencySymbol})</Label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={newTransaction.amount}
                            onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                            placeholder="0.00"
                            data-testid="input-transaction-amount"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea 
                            value={newTransaction.description}
                            onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                            placeholder="Optional notes..."
                            data-testid="input-transaction-description"
                          />
                        </div>
                        <Button 
                          className="w-full"
                          onClick={() => createTransactionMutation.mutate(newTransaction)}
                          disabled={!newTransaction.amount || (!newTransaction.incomeSource && !newTransaction.expenseCategory) || createTransactionMutation.isPending}
                          data-testid="button-save-transaction"
                        >
                          {createTransactionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                          Save Transaction
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {recentTransactions.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No transactions yet</p>
                    ) : (
                      recentTransactions.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/30" data-testid={`transaction-${t.id}`}>
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${t.type === "income" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                              {t.type === "income" ? <ArrowUpRight className="h-4 w-4 text-emerald-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{t.description || (t.type === "income" ? t.incomeSource : t.expenseCategory)}</p>
                              <p className="text-xs text-muted-foreground">{new Date(t.transactionDate || t.createdAt || "").toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className={`font-semibold ${t.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                            {t.type === "income" ? "+" : "-"}{currencySymbol}{parseFloat(t.amount).toFixed(2)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All Transactions</CardTitle>
                <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-transaction-2">
                      <Plus className="h-4 w-4 mr-1" /> Add Transaction
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No transactions recorded. Add your first transaction above.</p>
                  ) : (
                    transactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border" data-testid={`transaction-row-${t.id}`}>
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${t.type === "income" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                            {t.type === "income" ? <ArrowUpRight className="h-5 w-5 text-emerald-500" /> : <ArrowDownRight className="h-5 w-5 text-red-500" />}
                          </div>
                          <div>
                            <p className="font-medium">{t.description || (t.type === "income" ? INCOME_SOURCES.find(s => s.value === t.incomeSource)?.label : EXPENSE_CATEGORIES.find(c => c.value === t.expenseCategory)?.label) || "Transaction"}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{new Date(t.transactionDate || t.createdAt || "").toLocaleDateString()}</span>
                              <Badge variant="outline" className="text-xs">
                                {t.type === "income" ? t.incomeSource : t.expenseCategory}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <span className={`text-lg font-bold ${t.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                          {t.type === "income" ? "+" : "-"}{currencySymbol}{parseFloat(t.amount).toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recurring">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Recurring Bills & Expenses
                </CardTitle>
                <Dialog open={showAddRecurring} onOpenChange={setShowAddRecurring}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-recurring">
                      <Plus className="h-4 w-4 mr-1" /> Add Recurring
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Recurring Expense</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>Category</Label>
                        <Select value={newRecurring.category} onValueChange={(v) => setNewRecurring({ ...newRecurring, category: v })}>
                          <SelectTrigger data-testid="select-recurring-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPENSE_CATEGORIES.map(c => (
                              <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Name</Label>
                        <Input 
                          value={newRecurring.name}
                          onChange={(e) => setNewRecurring({ ...newRecurring, name: e.target.value })}
                          placeholder="e.g., Monthly Rent"
                          data-testid="input-recurring-name"
                        />
                      </div>
                      <div>
                        <Label>Amount ({currencySymbol})</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          value={newRecurring.amount}
                          onChange={(e) => setNewRecurring({ ...newRecurring, amount: e.target.value })}
                          placeholder="0.00"
                          data-testid="input-recurring-amount"
                        />
                      </div>
                      <div>
                        <Label>Frequency</Label>
                        <Select value={newRecurring.frequency} onValueChange={(v) => setNewRecurring({ ...newRecurring, frequency: v })}>
                          <SelectTrigger data-testid="select-recurring-frequency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FREQUENCIES.map(f => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Day of Month</Label>
                        <Input 
                          type="number"
                          min="1"
                          max="31"
                          value={newRecurring.dayOfMonth}
                          onChange={(e) => setNewRecurring({ ...newRecurring, dayOfMonth: e.target.value })}
                          data-testid="input-recurring-day"
                        />
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Textarea 
                          value={newRecurring.notes}
                          onChange={(e) => setNewRecurring({ ...newRecurring, notes: e.target.value })}
                          placeholder="Optional notes..."
                          data-testid="input-recurring-notes"
                        />
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => createRecurringMutation.mutate(newRecurring)}
                        disabled={!newRecurring.name || !newRecurring.amount || !newRecurring.category || createRecurringMutation.isPending}
                        data-testid="button-save-recurring"
                      >
                        {createRecurringMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Save Recurring Expense
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recurringExpenses.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No recurring expenses set up. Add rent, utilities, and other regular bills.</p>
                  ) : (
                    recurringExpenses.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-4 rounded-lg border border-border" data-testid={`recurring-${r.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="font-medium">{r.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline">{r.category}</Badge>
                              <span>{FREQUENCIES.find(f => f.value === r.frequency)?.label}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-red-500">{currencySymbol}{parseFloat(r.amount).toFixed(2)}</span>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteRecurringMutation.mutate(r.id)}
                            data-testid={`delete-recurring-${r.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Staff Members
                </CardTitle>
                <Dialog open={showAddStaff} onOpenChange={setShowAddStaff}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-staff">
                      <Plus className="h-4 w-4 mr-1" /> Add Staff
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Staff Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>Name *</Label>
                        <Input 
                          value={newStaff.name}
                          onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value.toUpperCase() })}
                          placeholder="MUJEEB SARDAR"
                          data-testid="input-staff-name"
                        />
                      </div>
                      <div>
                        <Label>Address</Label>
                        <Input 
                          value={newStaff.address}
                          onChange={(e) => setNewStaff({ ...newStaff, address: e.target.value })}
                          placeholder="41 HAMILTON ROAD"
                          data-testid="input-staff-address"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>City</Label>
                          <Input 
                            value={newStaff.role}
                            onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value.toUpperCase() })}
                            placeholder="ILFORD"
                            data-testid="input-staff-city"
                          />
                        </div>
                        <div>
                          <Label>Postcode</Label>
                          <Input 
                            value={newStaff.postcode}
                            onChange={(e) => setNewStaff({ ...newStaff, postcode: e.target.value.toUpperCase() })}
                            placeholder="IG1 2EU"
                            data-testid="input-staff-postcode"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Pay Type</Label>
                          <Select value={newStaff.payType} onValueChange={(v) => setNewStaff({ ...newStaff, payType: v })}>
                            <SelectTrigger data-testid="select-staff-pay-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hourly">Hourly</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Payment Method</Label>
                          <Select value={newStaff.paymentMethod} onValueChange={(v) => setNewStaff({ ...newStaff, paymentMethod: v })}>
                            <SelectTrigger data-testid="select-staff-payment-method">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Pay Rate ({currencySymbol}) *</Label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={newStaff.payRate}
                            onChange={(e) => setNewStaff({ ...newStaff, payRate: e.target.value })}
                            placeholder="9.50"
                            data-testid="input-staff-pay-rate"
                          />
                        </div>
                        <div>
                          <Label>Tax Code</Label>
                          <Input 
                            value={newStaff.taxCode}
                            onChange={(e) => setNewStaff({ ...newStaff, taxCode: e.target.value.toUpperCase() })}
                            placeholder="1257L"
                            data-testid="input-staff-tax-code"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>NI Number</Label>
                          <Input 
                            value={newStaff.niNumber}
                            onChange={(e) => setNewStaff({ ...newStaff, niNumber: e.target.value.toUpperCase() })}
                            placeholder="SP 67 42 76 A"
                            data-testid="input-staff-ni"
                          />
                        </div>
                        <div>
                          <Label>NI Table Letter</Label>
                          <Select value={newStaff.niTableLetter} onValueChange={(v) => setNewStaff({ ...newStaff, niTableLetter: v })}>
                            <SelectTrigger data-testid="select-staff-ni-table">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A">A</SelectItem>
                              <SelectItem value="B">B</SelectItem>
                              <SelectItem value="C">C</SelectItem>
                              <SelectItem value="H">H</SelectItem>
                              <SelectItem value="M">M</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>WhatsApp Number</Label>
                        <Input 
                          value={newStaff.phone}
                          onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                          placeholder="44 7911 123456"
                          data-testid="input-staff-whatsapp"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Include country code (e.g., 44 for UK)</p>
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => createStaffMutation.mutate(newStaff)}
                        disabled={!newStaff.name || !newStaff.payRate || createStaffMutation.isPending}
                        data-testid="button-save-staff"
                      >
                        {createStaffMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Save Staff Member
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {staffMembers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No staff members added. Add your team to track wages.</p>
                  ) : (
                    staffMembers.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-4 rounded-lg border border-border" data-testid={`staff-${s.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium">{s.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {s.role && <Badge variant="outline">{s.role}</Badge>}
                              <span>{s.payType}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold">{currencySymbol}{parseFloat(s.payRate).toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">
                              per {s.payType === "hourly" ? "hour" : s.payType === "weekly" ? "week" : "month"}
                            </p>
                          </div>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                            onClick={() => {
                              setSelectedStaff(s);
                              setWageSlipData({
                                periodStart: new Date(new Date().setDate(1)).toISOString().split('T')[0],
                                periodEnd: new Date().toISOString().split('T')[0],
                                hoursWorked: s.hoursPerWeek ? (parseFloat(s.hoursPerWeek) * 4).toString() : "",
                                payDate: new Date().toISOString().split('T')[0],
                              });
                              setShowWageSlip(true);
                            }}
                            data-testid={`button-wageslip-${s.id}`}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Wage Slip
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* HMRC Reporting Info Card */}
            <Card className="mt-4 border-blue-500/30 bg-blue-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <FileText className="h-5 w-5" />
                  HMRC Reporting (Free for Small Businesses)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Payslips generated here are for your staff records. You must also report wages to HMRC using their free tool:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/10">
                    <h4 className="font-bold text-blue-400 mb-2">Step 1: Download Free PAYE Tool</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      HMRC's Basic PAYE Tools - completely FREE for small businesses
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                      <li>• Enter your Employer Reference Number (ERN)</li>
                      <li>• Add each employee's details</li>
                      <li>• Each payday, enter wages paid</li>
                      <li>• Software calculates tax/NI automatically</li>
                      <li>• Click "Submit" - sends to HMRC directly</li>
                    </ul>
                    <a 
                      href="https://www.gov.uk/basic-paye-tools" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium"
                      data-testid="link-hmrc-paye-tools"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Download HMRC Basic PAYE Tools
                    </a>
                  </div>

                  <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/10">
                    <h4 className="font-bold text-green-400 mb-2">Step 2: Pay HMRC Monthly</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      By the 22nd of each month, pay the tax & NI you've deducted from staff wages
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                      <li>• Income Tax deducted</li>
                      <li>• National Insurance (employee + employer)</li>
                      <li>• Pay online - quick and easy</li>
                    </ul>
                    <a 
                      href="https://www.gov.uk/pay-paye-tax" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium"
                      data-testid="link-hmrc-pay-tax"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Pay HMRC Online
                    </a>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground border-t border-border pt-3">
                  <strong>Note:</strong> You must register as an employer with HMRC first. Visit{" "}
                  <a 
                    href="https://www.gov.uk/register-employer" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                    data-testid="link-hmrc-register"
                  >
                    gov.uk/register-employer
                  </a>
                  {" "}to get your Employer Reference Number (ERN).
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposits">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Cash Deposits
                </CardTitle>
                <Dialog open={showAddDeposit} onOpenChange={setShowAddDeposit}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-deposit">
                      <Plus className="h-4 w-4 mr-1" /> Add Deposit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Cash Deposit</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>Amount ({currencySymbol}) *</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          value={newDeposit.amount}
                          onChange={(e) => setNewDeposit({ ...newDeposit, amount: e.target.value })}
                          placeholder="0.00"
                          data-testid="input-deposit-amount"
                        />
                      </div>
                      <div>
                        <Label>Deposited By</Label>
                        <Input 
                          value={newDeposit.depositedBy}
                          onChange={(e) => setNewDeposit({ ...newDeposit, depositedBy: e.target.value })}
                          placeholder="Name of person"
                          data-testid="input-deposit-by"
                        />
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Textarea 
                          value={newDeposit.notes}
                          onChange={(e) => setNewDeposit({ ...newDeposit, notes: e.target.value })}
                          placeholder="Optional notes..."
                          data-testid="input-deposit-notes"
                        />
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => createDepositMutation.mutate(newDeposit)}
                        disabled={!newDeposit.amount || createDepositMutation.isPending}
                        data-testid="button-save-deposit"
                      >
                        {createDepositMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Record Deposit
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deposits.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No cash deposits recorded yet.</p>
                  ) : (
                    deposits.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-4 rounded-lg border border-border" data-testid={`deposit-${d.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Banknote className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="font-medium">Cash Deposit</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{new Date(d.depositDate || d.createdAt || "").toLocaleDateString()}</span>
                              {d.depositedBy && <span>by {d.depositedBy}</span>}
                            </div>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-emerald-500">+{currencySymbol}{parseFloat(d.amount).toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <InstallPrompt restaurantName="Finances" themeColor="#dc2626" />

      {/* Wage Slip Dialog */}
      <Dialog open={showWageSlip} onOpenChange={setShowWageSlip}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Wage Slip
            </DialogTitle>
          </DialogHeader>
          
          {selectedStaff && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Form inputs - sticky at top */}
              <div className="flex-shrink-0 space-y-4 pb-4 border-b">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pay Period Start</Label>
                    <Input 
                      type="date"
                      value={wageSlipData.periodStart}
                      onChange={(e) => setWageSlipData({ ...wageSlipData, periodStart: e.target.value })}
                      data-testid="input-wageslip-start"
                    />
                  </div>
                  <div>
                    <Label>Pay Period End</Label>
                    <Input 
                      type="date"
                      value={wageSlipData.periodEnd}
                      onChange={(e) => setWageSlipData({ ...wageSlipData, periodEnd: e.target.value })}
                      data-testid="input-wageslip-end"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {selectedStaff.payType === 'hourly' && (
                    <div>
                      <Label>Hours Worked</Label>
                      <Input 
                        type="number"
                        step="0.5"
                        value={wageSlipData.hoursWorked}
                        onChange={(e) => setWageSlipData({ ...wageSlipData, hoursWorked: e.target.value })}
                        placeholder="0"
                        data-testid="input-wageslip-hours"
                      />
                    </div>
                  )}
                  <div>
                    <Label>Pay Date</Label>
                    <Input 
                      type="date"
                      value={wageSlipData.payDate}
                      onChange={(e) => setWageSlipData({ ...wageSlipData, payDate: e.target.value })}
                      data-testid="input-wageslip-paydate"
                    />
                  </div>
                </div>
              </div>

              {/* Scrollable preview section - Exact Match Layout */}
              <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0 mt-4">
                <div id="wage-slip-preview" className="text-black" style={{ 
                  backgroundColor: '#b8f5c8', 
                  padding: '12px',
                  minWidth: '800px',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  {/* TOP HEADER - Company Name */}
                  <div style={{ border: '3px solid #22c55e', backgroundColor: '#fff', padding: '8px 16px', marginBottom: '10px' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px', textAlign: 'center' }}>{restaurant?.name || "FOOD & SAFETY Ltd"}</p>
                  </div>
                  
                  {/* 3-Column Layout */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    
                    {/* COLUMN 1: Address + NHS Note */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Empty top box */}
                      <div style={{ border: '3px solid #22c55e', backgroundColor: '#fff', padding: '20px', minHeight: '80px' }}></div>
                      
                      {/* Employee Address */}
                      <div style={{ border: '3px solid #22c55e', backgroundColor: '#fff', padding: '12px', flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '12px' }}>{selectedStaff.name?.toUpperCase() || 'MUJEEB SARDAR'}</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>{selectedStaff.address || '41 HAMILTON ROAD'}</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px' }}>{selectedStaff.role || 'ILFORD'}</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px' }}>{selectedStaff.postcode || 'IG1 2EU'}</p>
                      </div>
                      
                      {/* NHS Note */}
                      <p style={{ margin: '6px 0', fontSize: '9px', color: '#333' }}>1.25% uplift in NICs funds NHS, health & social care</p>
                      
                      {/* Empty bottom box */}
                      <div style={{ border: '3px solid #22c55e', backgroundColor: '#fff', padding: '12px', minHeight: '30px' }}></div>
                    </div>
                    
                    {/* COLUMN 2: Pay Period + Year to Date */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Pay Period Details */}
                      <div style={{ border: '3px solid #22c55e', backgroundColor: '#fff', padding: '12px' }}>
                        <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr><td style={{ padding: '3px 0' }}>Pay Period</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{wageSlipData.periodStart ? new Date(wageSlipData.periodStart).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).replace(' ', '-') : 'Apr-2022'}</td></tr>
                            <tr><td style={{ padding: '3px 0' }}>Pay Date</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{wageSlipData.payDate ? new Date(wageSlipData.payDate).toLocaleDateString('en-GB').replace(/\//g, '-') : '30-Apr-2022'}</td></tr>
                            <tr><td style={{ padding: '3px 0' }}>Pay Type</td><td style={{ textAlign: 'right', fontWeight: 'bold', textTransform: 'capitalize' }}>{selectedStaff.payType || 'Monthly'}</td></tr>
                            <tr><td style={{ padding: '3px 0' }}>Payment Method</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{selectedStaff.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : selectedStaff.paymentMethod === 'cheque' ? 'Cheque' : 'Cash'}</td></tr>
                            <tr><td style={{ padding: '8px 0 3px 0' }}>Tax Code</td><td style={{ textAlign: 'right', fontWeight: 'bold', paddingTop: '8px' }}>{selectedStaff.taxCode || '1257L'}</td></tr>
                            <tr><td style={{ padding: '3px 0' }}>NI Number</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{selectedStaff.niNumber || 'SP 67 42 76 A'}</td></tr>
                            <tr><td style={{ padding: '3px 0' }}>NI Table Letter</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{selectedStaff.niTableLetter || 'A'}</td></tr>
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Year to Date */}
                      <div style={{ border: '3px solid #22c55e', backgroundColor: '#fff', padding: '12px', flex: 1 }}>
                        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>Year to Date</p>
                        <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr><td style={{ padding: '3px 0' }}>Taxable Gross Pay</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{(() => {
                              const rate = parseFloat(selectedStaff.payRate) || 0;
                              if (selectedStaff.payType === 'hourly') {
                                const hours = parseFloat(wageSlipData.hoursWorked) || 0;
                                return (hours * rate).toFixed(2);
                              } else if (selectedStaff.payType === 'weekly') {
                                return (rate * 4).toFixed(2);
                              } else {
                                return rate.toFixed(2);
                              }
                            })()}</td></tr>
                            <tr><td style={{ padding: '3px 0' }}>Income Tax</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>0.00</td></tr>
                            <tr><td style={{ padding: '3px 0' }}>Employee NIC</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>0.00</td></tr>
                            <tr><td style={{ padding: '3px 0' }}>Employer NIC</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>0.00</td></tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* COLUMN 3: Payments + Deductions + Net Pay */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Payments Section */}
                      <div style={{ border: '3px solid #22c55e', backgroundColor: '#fff', padding: '12px' }}>
                        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>Payments</p>
                        <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '3px 2px', fontWeight: 'bold' }}>Description</th>
                              <th style={{ textAlign: 'right', padding: '3px 2px', fontWeight: 'bold' }}>Hours</th>
                              <th style={{ textAlign: 'right', padding: '3px 2px', fontWeight: 'bold' }}>Rate</th>
                              <th style={{ textAlign: 'right', padding: '3px 2px', fontWeight: 'bold' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '3px 2px' }}>Rate 1</td>
                              <td style={{ textAlign: 'right', padding: '3px 2px' }}>{wageSlipData.hoursWorked || '64.00'}</td>
                              <td style={{ textAlign: 'right', padding: '3px 2px' }}>{parseFloat(selectedStaff.payRate || '9.50').toFixed(2)}</td>
                              <td style={{ textAlign: 'right', padding: '3px 2px' }}>{(() => {
                                const rate = parseFloat(selectedStaff.payRate) || 9.50;
                                const hours = parseFloat(wageSlipData.hoursWorked) || 64;
                                return (hours * rate).toFixed(2);
                              })()}</td>
                            </tr>
                            <tr>
                              <td colSpan={3} style={{ padding: '3px 2px' }}>Total Hourly Pay</td>
                              <td style={{ textAlign: 'right', padding: '3px 2px', fontWeight: 'bold' }}>{(() => {
                                const rate = parseFloat(selectedStaff.payRate) || 9.50;
                                const hours = parseFloat(wageSlipData.hoursWorked) || 64;
                                return (hours * rate).toFixed(2);
                              })()}</td>
                            </tr>
                            <tr>
                              <td colSpan={3} style={{ padding: '3px 2px', fontWeight: 'bold' }}>Total Payments</td>
                              <td style={{ textAlign: 'right', padding: '3px 2px', fontWeight: 'bold' }}>{(() => {
                                const rate = parseFloat(selectedStaff.payRate) || 9.50;
                                const hours = parseFloat(wageSlipData.hoursWorked) || 64;
                                return (hours * rate).toFixed(2);
                              })()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Deductions Section */}
                      <div style={{ border: '3px solid #22c55e', backgroundColor: '#fff', padding: '12px' }}>
                        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>Deductions</p>
                        <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr><td style={{ padding: '3px 0' }}>Income Tax</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>0.00</td></tr>
                            <tr><td style={{ padding: '3px 0' }}>National Insurance</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>0.00</td></tr>
                            <tr><td style={{ padding: '3px 0', fontWeight: 'bold' }}>Total Deductions</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>0.00</td></tr>
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Net Pay */}
                      <div style={{ border: '3px solid #22c55e', backgroundColor: '#fff', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Net Pay</span>
                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{(() => {
                          const rate = parseFloat(selectedStaff.payRate) || 9.50;
                          const hours = parseFloat(wageSlipData.hoursWorked) || 64;
                          return (hours * rate).toFixed(2);
                        })()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* End scrollable preview section */}

              {/* Action buttons - sticky at bottom */}
              <div className="flex-shrink-0 flex flex-col gap-2 pt-4 border-t mt-4">
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      const printContent = document.getElementById('wage-slip-preview');
                      if (printContent) {
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>Wage Slip - ${selectedStaff.name}</title>
                                <style>
                                  @page { size: A4 landscape; margin: 8mm; }
                                  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                                  body { 
                                    font-family: Arial, sans-serif; 
                                    padding: 0; 
                                    margin: 0; 
                                    color: #000; 
                                    background-color: #c8f7dc !important; 
                                  }
                                  .wage-slip-container {
                                    width: 100%;
                                    height: 100vh;
                                    background-color: #c8f7dc !important;
                                    padding: 8px;
                                  }
                                  .border-2 { border: 2px solid #16a34a !important; }
                                  .border-green-600 { border-color: #16a34a !important; }
                                  .bg-white { background-color: #ffffff !important; }
                                  table { border-collapse: collapse; width: 100%; }
                                </style>
                              </head>
                              <body>
                                <div class="wage-slip-container">${printContent.innerHTML}</div>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                          setTimeout(() => printWindow.print(), 250);
                        }
                      }
                    }}
                    data-testid="button-print-wageslip"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowWageSlip(false)}
                    data-testid="button-close-wageslip"
                  >
                    Close
                  </Button>
                </div>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={async () => {
                    const printContent = document.getElementById('wage-slip-preview');
                    if (!printContent) return;
                    
                    try {
                      toast({ title: "Generating payslip image...", description: "Please wait" });
                      
                      const canvas = await html2canvas(printContent, {
                        scale: 2,
                        backgroundColor: '#b8f5c8',
                        useCORS: true,
                      });
                      
                      canvas.toBlob(async (blob) => {
                        if (!blob) {
                          toast({ title: "Error", description: "Failed to generate image", variant: "destructive" });
                          return;
                        }
                        
                        const fileName = `Payslip_${selectedStaff.name?.replace(/\s+/g, '_')}_${wageSlipData.payDate || 'date'}.png`;
                        const file = new File([blob], fileName, { type: 'image/png' });
                        
                        if (navigator.share && navigator.canShare) {
                          const shareData = { files: [file] };
                          
                          if (navigator.canShare(shareData)) {
                            try {
                              await navigator.share(shareData);
                              toast({ title: "Shared!", description: "Payslip sent successfully" });
                              return;
                            } catch (err) {
                              console.log('Share cancelled, continuing with download');
                            }
                          }
                        }
                        
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        const phoneNumber = selectedStaff.phone?.replace(/\s+/g, '').replace(/[^0-9]/g, '') || '';
                        
                        if (phoneNumber) {
                          const whatsappUrl = `https://wa.me/${phoneNumber}`;
                          window.open(whatsappUrl, '_blank');
                        }
                        
                        toast({ 
                          title: "Payslip Image Downloaded!", 
                          description: "Now attach the downloaded image in WhatsApp and send it." 
                        });
                      }, 'image/png');
                    } catch (error) {
                      console.error('Error generating payslip:', error);
                      toast({ title: "Error", description: "Failed to generate payslip image", variant: "destructive" });
                    }
                  }}
                  data-testid="button-whatsapp-wageslip"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send via WhatsApp
                </Button>
                <p className="text-xs text-center text-muted-foreground">On mobile: Share directly. On desktop: Image downloads, then attach it in WhatsApp.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
