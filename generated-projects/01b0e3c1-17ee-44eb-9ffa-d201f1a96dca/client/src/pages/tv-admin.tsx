import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Tv, Copy, RefreshCw, Power, Trash2, Plus, Eye, EyeOff, Lock, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TvAssignment {
  id: string;
  branchId: string;
  tvType: number;
  name: string;
  config: any;
  accessToken: string;
  accessPassword: string | null;
  isActive: boolean;
  branchEnabled: boolean;
  orientation: string;
  createdAt: string;
  updatedAt: string;
  branchName: string;
  branchSlug: string;
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;
}

export default function TvAdmin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newBranchId, setNewBranchId] = useState("");
  const [newTvType, setNewTvType] = useState("1");
  const [newName, setNewName] = useState("");
  const [newOrientation, setNewOrientation] = useState("landscape");
  const [newPassword, setNewPassword] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery<TvAssignment[]>({
    queryKey: ["/api/tv-assignments"],
    queryFn: async () => {
      const res = await fetch("/api/tv-assignments");
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
  });

  const { data: restaurants = [], isLoading: loadingRestaurants } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
    queryFn: async () => {
      const res = await fetch("/api/restaurants");
      if (!res.ok) throw new Error("Failed to fetch restaurants");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { branchId: string; tvType: number; name: string; orientation: string; accessPassword?: string }) => {
      const res = await fetch("/api/tv-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create assignment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tv-assignments"] });
      toast({ title: "TV Assignment Created" });
      setNewBranchId("");
      setNewTvType("1");
      setNewName("");
      setNewOrientation("landscape");
      setNewPassword("");
      setShowCreateForm(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/tv-assignments/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tv-assignments"] });
    },
  });

  const resetTokenMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tv-assignments/${id}/reset-token`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset token");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tv-assignments"] });
      toast({ title: "Access URL Reset" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const res = await fetch(`/api/tv-assignments/${id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) throw new Error("Failed to reset password");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tv-assignments"] });
      toast({ title: "Password Reset" });
      setResetPasswordId(null);
      setResetPasswordValue("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tv-assignments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tv-assignments"] });
      toast({ title: "TV Assignment Deleted" });
    },
  });

  const branchToggleMutation = useMutation({
    mutationFn: async ({ branchId, branchEnabled }: { branchId: string; branchEnabled: boolean }) => {
      const res = await fetch(`/api/tv-assignments/branch/${branchId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchEnabled }),
      });
      if (!res.ok) throw new Error("Failed to toggle branch");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tv-assignments"] });
    },
  });

  const handleCreate = () => {
    if (!newBranchId || !newName) {
      toast({ title: "Error", description: "Branch and Name are required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      branchId: newBranchId,
      tvType: parseInt(newTvType),
      name: newName,
      orientation: newOrientation,
      accessPassword: newPassword || undefined,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const grouped = assignments.reduce<Record<string, TvAssignment[]>>((acc, a) => {
    const key = a.branchId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const branchesWithAssignments = Object.keys(grouped).map((branchId) => {
    const items = grouped[branchId];
    return {
      branchId,
      branchName: items[0]?.branchName || "Unknown",
      branchEnabled: items[0]?.branchEnabled ?? true,
      assignments: items,
    };
  });

  const isLoading = loadingAssignments || loadingRestaurants;

  return (
    <div className="min-h-screen bg-slate-950 text-white" data-testid="tv-admin-page">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/portal-admin")}
            data-testid="button-back"
            className="text-white hover:bg-slate-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Tv className="h-7 w-7 text-purple-400" />
            <h1 className="text-2xl font-bold" data-testid="text-page-title">TV Display Management</h1>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" data-testid="loading-spinner" />
          </div>
        ) : (
          <>
            {/* Create New Assignment */}
            <div className="mb-8">
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-toggle-create"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showCreateForm ? "Cancel" : "New TV Assignment"}
              </Button>

              {showCreateForm && (
                <div className="mt-4 bg-slate-900 border border-slate-700 rounded-lg p-6" data-testid="form-create-assignment">
                  <h2 className="text-lg font-semibold mb-4">Create TV Assignment</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-slate-300">Branch</Label>
                      <select
                        value={newBranchId}
                        onChange={(e) => setNewBranchId(e.target.value)}
                        className="w-full mt-1 bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white"
                        data-testid="select-branch"
                      >
                        <option value="">Select branch...</option>
                        {restaurants.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-slate-300">TV Type</Label>
                      <select
                        value={newTvType}
                        onChange={(e) => setNewTvType(e.target.value)}
                        className="w-full mt-1 bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white"
                        data-testid="select-tv-type"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <option key={n} value={n}>TV {n}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Display Name</Label>
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Front Counter TV"
                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                        data-testid="input-name"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Orientation</Label>
                      <select
                        value={newOrientation}
                        onChange={(e) => setNewOrientation(e.target.value)}
                        className="w-full mt-1 bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white"
                        data-testid="select-orientation"
                      >
                        <option value="landscape">Landscape</option>
                        <option value="portrait">Portrait</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Password (optional)</Label>
                      <Input
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Leave empty for no password"
                        type="password"
                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                        data-testid="input-password"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleCreate}
                        disabled={createMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 w-full"
                        data-testid="button-create-submit"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {createMutation.isPending ? "Creating..." : "Create"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Branch Control Section */}
            {branchesWithAssignments.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" data-testid="text-branch-control-title">
                  <Power className="h-5 w-5 text-yellow-400" />
                  Branch Control
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {branchesWithAssignments.map((b) => (
                    <div
                      key={b.branchId}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        b.branchEnabled
                          ? "bg-slate-900 border-green-700"
                          : "bg-slate-900/50 border-red-800"
                      }`}
                      data-testid={`branch-control-${b.branchId}`}
                    >
                      <div>
                        <p className="font-medium" data-testid={`text-branch-name-${b.branchId}`}>{b.branchName}</p>
                        <p className="text-xs text-slate-400">{b.assignments.length} TV(s)</p>
                      </div>
                      <Button
                        size="sm"
                        variant={b.branchEnabled ? "default" : "outline"}
                        className={b.branchEnabled ? "bg-green-600 hover:bg-green-700" : "border-red-600 text-red-400 hover:bg-red-900"}
                        onClick={() =>
                          branchToggleMutation.mutate({
                            branchId: b.branchId,
                            branchEnabled: !b.branchEnabled,
                          })
                        }
                        data-testid={`button-branch-toggle-${b.branchId}`}
                      >
                        <Power className="h-4 w-4 mr-1" />
                        {b.branchEnabled ? "ON" : "OFF"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TV Assignments grouped by branch */}
            {branchesWithAssignments.length === 0 ? (
              <div className="text-center py-20 text-slate-400" data-testid="text-no-assignments">
                <Tv className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No TV assignments yet</p>
                <p className="text-sm">Create your first TV assignment above</p>
              </div>
            ) : (
              branchesWithAssignments.map((branch) => (
                <div key={branch.branchId} className="mb-8" data-testid={`branch-group-${branch.branchId}`}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Tv className="h-5 w-5 text-blue-400" />
                    {branch.branchName}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${branch.branchEnabled ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                      {branch.branchEnabled ? "Branch ON" : "Branch OFF"}
                    </span>
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid={`table-assignments-${branch.branchId}`}>
                      <thead>
                        <tr className="text-left text-slate-400 border-b border-slate-700">
                          <th className="pb-2 pr-4">TV Type</th>
                          <th className="pb-2 pr-4">Display Name</th>
                          <th className="pb-2 pr-4">Orientation</th>
                          <th className="pb-2 pr-4">Status</th>
                          <th className="pb-2 pr-4">Access URL</th>
                          <th className="pb-2 pr-4">Password</th>
                          <th className="pb-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {branch.assignments.map((a) => {
                          const tvUrl = `${window.location.origin}/tv/${a.accessToken}`;
                          return (
                            <tr key={a.id} className="border-b border-slate-800 hover:bg-slate-900/50" data-testid={`row-assignment-${a.id}`}>
                              <td className="py-3 pr-4">
                                <span className="bg-purple-900 text-purple-200 px-2 py-1 rounded text-xs font-medium" data-testid={`text-tv-type-${a.id}`}>
                                  TV {a.tvType}
                                </span>
                              </td>
                              <td className="py-3 pr-4" data-testid={`text-display-name-${a.id}`}>{a.name}</td>
                              <td className="py-3 pr-4">
                                <span className="text-slate-300 capitalize" data-testid={`text-orientation-${a.id}`}>{a.orientation}</span>
                              </td>
                              <td className="py-3 pr-4">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    a.isActive ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                                  }`}
                                  data-testid={`text-status-${a.id}`}
                                >
                                  {a.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-1">
                                  <code className="text-xs text-blue-300 bg-slate-800 px-2 py-1 rounded max-w-[200px] truncate" data-testid={`text-access-url-${a.id}`}>
                                    /tv/{a.accessToken.slice(0, 8)}...
                                  </code>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-slate-400 hover:text-white"
                                    onClick={() => copyToClipboard(tvUrl)}
                                    data-testid={`button-copy-url-${a.id}`}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                              <td className="py-3 pr-4">
                                {a.accessPassword ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-slate-300" data-testid={`text-password-${a.id}`}>
                                      {showPasswords[a.id] ? a.accessPassword : "••••"}
                                    </span>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 text-slate-400"
                                      onClick={() => setShowPasswords((p) => ({ ...p, [a.id]: !p[a.id] }))}
                                      data-testid={`button-toggle-password-${a.id}`}
                                    >
                                      {showPasswords[a.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-500" data-testid={`text-no-password-${a.id}`}>None</span>
                                )}
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <Button
                                    size="sm"
                                    variant={a.isActive ? "default" : "outline"}
                                    className={`h-7 text-xs ${a.isActive ? "bg-green-600 hover:bg-green-700" : "border-slate-600 hover:bg-slate-800"}`}
                                    onClick={() => toggleMutation.mutate({ id: a.id, isActive: !a.isActive })}
                                    data-testid={`button-toggle-${a.id}`}
                                  >
                                    <Power className="h-3 w-3 mr-1" />
                                    {a.isActive ? "ON" : "OFF"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-slate-600 hover:bg-slate-800"
                                    onClick={() => resetTokenMutation.mutate(a.id)}
                                    data-testid={`button-reset-url-${a.id}`}
                                  >
                                    <Link className="h-3 w-3 mr-1" />
                                    Reset URL
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-slate-600 hover:bg-slate-800"
                                    onClick={() => {
                                      if (resetPasswordId === a.id) {
                                        setResetPasswordId(null);
                                        setResetPasswordValue("");
                                      } else {
                                        setResetPasswordId(a.id);
                                        setResetPasswordValue("");
                                      }
                                    }}
                                    data-testid={`button-reset-password-${a.id}`}
                                  >
                                    <Lock className="h-3 w-3 mr-1" />
                                    Reset PW
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-red-800 text-red-400 hover:bg-red-900"
                                    onClick={() => {
                                      if (confirm("Delete this TV assignment?")) {
                                        deleteMutation.mutate(a.id);
                                      }
                                    }}
                                    data-testid={`button-delete-${a.id}`}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                                {resetPasswordId === a.id && (
                                  <div className="flex items-center gap-2 mt-2" data-testid={`form-reset-password-${a.id}`}>
                                    <Input
                                      value={resetPasswordValue}
                                      onChange={(e) => setResetPasswordValue(e.target.value)}
                                      placeholder="New password (empty to remove)"
                                      className="h-7 text-xs bg-slate-800 border-slate-600 text-white w-48"
                                      data-testid={`input-new-password-${a.id}`}
                                    />
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                                      onClick={() =>
                                        resetPasswordMutation.mutate({
                                          id: a.id,
                                          newPassword: resetPasswordValue,
                                        })
                                      }
                                      data-testid={`button-submit-password-${a.id}`}
                                    >
                                      Save
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
