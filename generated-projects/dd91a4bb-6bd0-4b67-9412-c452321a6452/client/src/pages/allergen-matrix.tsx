import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRestaurantBySlug, getMenuItems, deleteMenuItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Save, Printer, ArrowLeft, Edit2, Trash2, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { MenuItem, Restaurant } from "@shared/schema";

const ALLERGEN_KEYS = [
  "gluten", "crustaceans", "eggs", "fish", "peanuts", "soybeans", 
  "milk", "nuts", "celery", "mustard", "sesame", "sulphites", "lupin", "molluscs"
];

export default function AllergenMatrixPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const queryClient = useQueryClient();
  const allergenPrintRef = useRef<HTMLDivElement>(null);
  
  const [allergenEditItem, setAllergenEditItem] = useState<MenuItem | null>(null);
  const [allergenEditProfile, setAllergenEditProfile] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const { data: restaurant } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug!),
    enabled: !!slug,
  });

  const restaurantId = restaurant?.id;

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu", restaurantId],
    queryFn: () => getMenuItems(restaurantId!),
    enabled: !!restaurantId,
  });

  const handlePrint = () => {
    window.print();
  };

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #allergen-matrix-print, #allergen-matrix-print * { visibility: visible !important; }
          #allergen-matrix-print { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important;
            background: white !important;
            padding: 20px !important;
          }
          .print-hidden { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="text-center py-6 px-4">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          {restaurant?.name || 'Branch'}
        </h1>
        <h2 className="text-2xl font-bold text-yellow-300 mt-2">ALLERGEN MATRIX</h2>
        <p className="text-white/80 text-sm mt-2 max-w-2xl mx-auto">
          The Food Information Regulations 2014 requires all food businesses to provide information about the 14 major allergenic ingredients.
        </p>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-4 print-hidden">
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search menu items or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/90 border-white/50 text-gray-900 placeholder:text-gray-500 h-12 text-lg rounded-xl"
            data-testid="input-search-allergens"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 flex flex-wrap gap-3 justify-center print-hidden">
        <Button 
          onClick={() => {
            toast({ title: "Saved", description: "Allergen matrix saved successfully" });
          }}
          className="bg-green-500 hover:bg-green-600 text-white font-medium px-6"
          data-testid="button-save-matrix"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Matrix
        </Button>
        <Button 
          onClick={handlePrint}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6"
          data-testid="button-print-matrix"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Matrix
        </Button>
        <Link href={`/dashboard/${slug}`}>
          <Button 
            className="bg-slate-700 hover:bg-slate-800 text-white font-medium px-6"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Matrix Content */}
      <div ref={allergenPrintRef} className="px-4 pb-8 space-y-6" id="allergen-matrix-print">
        {/* Print Header - only visible in print */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{restaurant?.name || 'Branch'}</h1>
          <h2 className="text-xl font-bold text-pink-600">ALLERGEN MATRIX</h2>
        </div>

        {categories.map(category => {
          const searchLower = searchQuery.toLowerCase().trim();
          const categoryMatches = category.toLowerCase().includes(searchLower);
          const categoryItems = menuItems.filter(item => {
            if (item.category !== category) return false;
            if (!searchLower) return true;
            if (categoryMatches) return true;
            return item.name.toLowerCase().includes(searchLower);
          });
          if (categoryItems.length === 0) return null;
          return (
            <div key={category} className="bg-white rounded-xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3">
                <h3 className="text-white font-bold text-lg uppercase">{category}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {categoryItems.map(item => {
                  const profile = (item as any).allergenProfile as Record<string, string> | undefined;
                  const activeAllergens = profile 
                    ? Object.entries(profile).filter(([_, val]) => val === "contains").map(([key]) => key)
                    : [];
                  return (
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {activeAllergens.length > 0 ? (
                            activeAllergens.map(allergen => (
                              <span 
                                key={allergen} 
                                className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700 capitalize"
                              >
                                {allergen === "gluten" ? "Cereals" : allergen}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">No allergens set</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4 print-hidden">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                          onClick={() => {
                            setAllergenEditItem(item);
                            setAllergenEditProfile(profile || {});
                          }}
                          data-testid={`edit-allergen-${item.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          onClick={async () => {
                            try {
                              await deleteMenuItem(item.id);
                              queryClient.invalidateQueries({ queryKey: ["/api/menu", restaurantId] });
                              toast({ title: "Deleted", description: `${item.name} has been removed` });
                            } catch (err) {
                              toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
                            }
                          }}
                          data-testid={`delete-item-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {menuItems.length === 0 && (
          <div className="text-center py-12 text-white/70">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No menu items found</p>
            <p className="text-sm mt-1">Add menu items first to configure their allergen information</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-8 text-center print-hidden">
        <div className="text-white/80 text-sm space-y-2">
          <p>&copy; 2026 {restaurant?.name || 'Restaurant'}. All rights reserved.</p>
          <p className="text-white/60">Developer Mujeeb Sardar</p>
          <Link href="/terms" className="text-yellow-300 hover:text-yellow-200 underline">
            Terms & Conditions
          </Link>
        </div>
      </div>

      {/* Edit Allergen Modal */}
      <Dialog open={!!allergenEditItem} onOpenChange={(open) => !open && setAllergenEditItem(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Allergens for {allergenEditItem?.name}</DialogTitle>
            <DialogDescription>
              Click on allergens to toggle them on or off for this menu item.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            {ALLERGEN_KEYS.map(allergen => {
              const isActive = allergenEditProfile[allergen] === "contains";
              return (
                <button
                  key={allergen}
                  onClick={() => {
                    setAllergenEditProfile(prev => ({
                      ...prev,
                      [allergen]: isActive ? "unknown" : "contains"
                    }));
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    isActive 
                      ? 'bg-red-100 text-red-700 border-red-300' 
                      : 'bg-gray-100 text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                  data-testid={`toggle-allergen-${allergen}`}
                >
                  <span className="mr-1">
                    {allergen === "gluten" ? "🌾" :
                     allergen === "crustaceans" ? "🦐" :
                     allergen === "eggs" ? "🥚" :
                     allergen === "fish" ? "🐟" :
                     allergen === "peanuts" ? "🥜" :
                     allergen === "soybeans" ? "🫘" :
                     allergen === "milk" ? "🥛" :
                     allergen === "nuts" ? "🌰" :
                     allergen === "celery" ? "🥬" :
                     allergen === "mustard" ? "🟡" :
                     allergen === "sesame" ? "⚪" :
                     allergen === "sulphites" ? "🍷" :
                     allergen === "lupin" ? "🌸" :
                     "🐚"}
                  </span>
                  {allergen === "gluten" ? "Cereals" : allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllergenEditItem(null)}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!allergenEditItem) return;
                try {
                  await fetch(`/api/menu/${allergenEditItem.id}/allergens`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(allergenEditProfile)
                  });
                  queryClient.invalidateQueries({ queryKey: ["/api/menu", restaurantId] });
                  toast({ title: "Allergens Updated", description: `Updated allergens for ${allergenEditItem.name}` });
                  setAllergenEditItem(null);
                } catch (err) {
                  toast({ title: "Error", description: "Failed to update allergens", variant: "destructive" });
                }
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
