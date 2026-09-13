import { Heart, DollarSign, Siren, Clock } from 'lucide-react';

export function HUD({ health, money, wanted, time }: { health: number; money: number; wanted: number; time: number }) {
  const hours = Math.floor(time);
  const minutes = Math.floor((time % 1) * 60);
  return (
    <div className="absolute top-4 left-4 z-20 bg-black/50 text-white p-4 rounded-lg space-y-2">
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-red-500" />
        <span>{health}</span>
      </div>
      <div className="flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-yellow-500" />
        <span>{money}</span>
      </div>
      <div className="flex items-center gap-2">
        <Siren className="w-5 h-5 text-blue-500" />
        <span>{wanted}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-white" />
        <span>{hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}</span>
      </div>
    </div>
  );
}