import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { getRestaurantBySlug } from "@/lib/api";
import type { KitchenStation, InsertKitchenStation } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, ArrowLeft, GripVertical, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

async function getKitchenStations(restaurantId: string): Promise<KitchenStation[]> {
  const res = await fetch(`/api/restaurants/${restaurantId}/kitchen-stations`);
  if (!res.ok) throw new Error("Failed to fetch kitchen stations");
  return res.json();
}

async function createKitchenStation(restaurantId: string, station: Omit<InsertKitchenStation, "restaurantId">): Promise<KitchenStation> {
  const res = await fetch(`/api/restaurants/${restaurantId}/kitchen-stations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(station),
  });
  if (!res.ok) throw new Error("Failed to create kitchen station");
  return res.json();
}

async function updateKitchenStation(id: string, updates: Partial<KitchenStation>): Promise<KitchenStation> {
  const res = await fetch(`/api/kitchen-stations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update kitchen station");
  return res.json();
}

async function deleteKitchenStation(id: string): Promise<void> {
  const res = await fetch(`/api/kitchen-stations/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete kitchen station");
}

const STATION_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
];

const SUGGESTED_STATIONS = [
  { name: "Grill", slug: "grill", color: "#ef4444", categories: ["burger", "steak", "bbq", "grill"] },
  { name: "Pizza", slug: "pizza", color: "#f97316", categories: ["pizza", "garlic bread"] },
  { name: "Tandoori", slug: "tandoori", color: "#eab308", categories: ["tandoori", "kebab", "naan", "tikka"] },
  { name: "Fryer", slug: "fryer", color: "#22c55e", categories: ["chips", "fries", "fried", "wings"] },
  { name: "Drinks", slug: "drinks", color: "#3b82f6", categories: ["drink", "coffee", "tea", "shake", "juice"] },
  { name: "Starters", slug: "starters", color: "#8b5cf6", categories: ["starter", "appetizer", "soup", "salad"] },
];

export default function KitchenSettings() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [, navigate] = useLocation();
  
  const [newStation, setNewStation] = useState({
    name: "",
    slug: "",
    color: "#3b82f6",
    categories: "",
  });

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug!),
    enabled: !!slug,
  });

  const restaurantId = restaurant?.id || null;

  const { data: stations = [], isLoading: loadingStations } = useQuery({
    queryKey: ["/api/kitchen-stations", restaurantId],
    queryFn: () => getKitchenStations(restaurantId!),
    enabled: !!restaurantId,
  });

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  const createMutation = useMutation({
    mutationFn: (station: Omit<InsertKitchenStation, "restaurantId">) => 
      createKitchenStation(restaurantId!, station),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kitchen-stations", restaurantId] });
      setNewStation({ name: "", slug: "", color: "#3b82f6", categories: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<KitchenStation> }) =>
      updateKitchenStation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kitchen-stations", restaurantId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteKitchenStation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kitchen-stations", restaurantId] });
    },
  });

  const handleCreateStation = () => {
    if (!newStation.name || !newStation.slug) return;
    
    createMutation.mutate({
      name: newStation.name,
      slug: newStation.slug.toLowerCase().replace(/\s+/g, "-"),
      color: newStation.color,
      categories: newStation.categories.split(",").map(c => c.trim()).filter(c => c),
      displayOrder: stations.length,
      isActive: true,
    });
  };

  const handleAddSuggestedStation = (suggested: typeof SUGGESTED_STATIONS[0]) => {
    if (stations.some(s => s.slug === suggested.slug)) return;
    
    createMutation.mutate({
      name: suggested.name,
      slug: suggested.slug,
      color: suggested.color,
      categories: suggested.categories,
      displayOrder: stations.length,
      isActive: true,
    });
  };

  const handleToggleActive = (station: KitchenStation) => {
    updateMutation.mutate({ id: station.id, updates: { isActive: !station.isActive } });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this station?")) {
      deleteMutation.mutate(id);
    }
  };

  if (loadingRestaurant || loadingStations) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/kitchen/${slug}`)}
          data-testid="button-back-to-kitchen"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <ChefHat className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Kitchen Station Settings</h1>
            <p className="text-sm text-muted-foreground">{restaurant?.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Quick Add Suggested Stations */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Add Stations</CardTitle>
            <CardDescription>Click to add common kitchen stations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_STATIONS.map(suggested => {
                const exists = stations.some(s => s.slug === suggested.slug);
                return (
                  <Button
                    key={suggested.slug}
                    variant={exists ? "secondary" : "outline"}
                    size="sm"
                    disabled={exists || createMutation.isPending}
                    onClick={() => handleAddSuggestedStation(suggested)}
                    style={{ borderColor: suggested.color, color: exists ? undefined : suggested.color }}
                    data-testid={`button-add-${suggested.slug}`}
                  >
                    {exists ? "✓ " : "+ "}
                    {suggested.name}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Existing Stations */}
        <Card>
          <CardHeader>
            <CardTitle>Your Stations ({stations.length})</CardTitle>
            <CardDescription>Manage your kitchen display stations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No stations created yet. Add stations above or create a custom one below.
              </p>
            ) : (
              stations.map(station => (
                <div
                  key={station.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border-2 transition-all",
                    station.isActive ? "bg-card" : "bg-muted/30 opacity-60"
                  )}
                  style={{ borderColor: station.color || "#3b82f6" }}
                  data-testid={`station-item-${station.slug}`}
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: station.color || "#3b82f6" }}
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-semibold">{station.name}</h3>
                    <p className="text-sm text-muted-foreground">/{station.slug}</p>
                    {station.categories && station.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {station.categories.map(cat => (
                          <Badge key={cat} variant="secondary" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${station.id}`} className="text-sm">
                        {station.isActive ? "Active" : "Inactive"}
                      </Label>
                      <Switch
                        id={`active-${station.id}`}
                        checked={station.isActive ?? true}
                        onCheckedChange={() => handleToggleActive(station)}
                        data-testid={`switch-active-${station.slug}`}
                      />
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(station.id)}
                      data-testid={`button-delete-${station.slug}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Create Custom Station */}
        <Card>
          <CardHeader>
            <CardTitle>Create Custom Station</CardTitle>
            <CardDescription>Add a new station with custom settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="station-name">Station Name</Label>
                <Input
                  id="station-name"
                  placeholder="e.g., Salad Bar"
                  value={newStation.name}
                  onChange={(e) => setNewStation(prev => ({ 
                    ...prev, 
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, "-")
                  }))}
                  data-testid="input-station-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="station-slug">URL Slug</Label>
                <Input
                  id="station-slug"
                  placeholder="e.g., salad-bar"
                  value={newStation.slug}
                  onChange={(e) => setNewStation(prev => ({ ...prev, slug: e.target.value }))}
                  data-testid="input-station-slug"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Station Color</Label>
              <div className="flex gap-2">
                {STATION_COLORS.map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      newStation.color === color && "ring-2 ring-offset-2 ring-offset-background ring-white scale-110"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewStation(prev => ({ ...prev, color }))}
                    data-testid={`color-${color}`}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categories">Categories (comma-separated)</Label>
              <Input
                id="categories"
                placeholder="e.g., salad, bowl, healthy"
                value={newStation.categories}
                onChange={(e) => setNewStation(prev => ({ ...prev, categories: e.target.value }))}
                data-testid="input-categories"
              />
              <p className="text-xs text-muted-foreground">
                Items containing these keywords in their name will appear at this station
              </p>
            </div>
            
            <Button
              onClick={handleCreateStation}
              disabled={!newStation.name || !newStation.slug || createMutation.isPending}
              className="w-full"
              data-testid="button-create-station"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Station
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
