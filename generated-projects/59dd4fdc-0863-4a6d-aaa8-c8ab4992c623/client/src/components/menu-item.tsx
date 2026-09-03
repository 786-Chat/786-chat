import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { MenuItem as MenuItemType } from "@shared/schema";

interface MenuItemProps {
  item: MenuItemType;
  onAdd: () => void;
  currencySymbol?: string;
}

export function MenuItem({ item, onAdd, currencySymbol = "£" }: MenuItemProps) {
  const price = Number(item.price);
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group border-none shadow-sm bg-white">
      <div className="aspect-[4/3] overflow-hidden relative">
        <img 
          src={item.image} 
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <p className="text-white font-medium text-sm line-clamp-2">{item.description}</p>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
          <span className="font-bold text-primary whitespace-nowrap">{currencySymbol}{price.toFixed(2)}</span>
        </div>
        <p className="text-muted-foreground text-sm line-clamp-2 group-hover:opacity-0 transition-opacity duration-300 absolute">
          {item.description}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={onAdd} 
          className="w-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-semibold"
        >
          <Plus className="h-4 w-4 mr-2" /> Add to Basket
        </Button>
      </CardFooter>
    </Card>
  );
}
