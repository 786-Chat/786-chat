import { useState } from 'react';
import { cn } from '@/lib/utils';
const starIcon = "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087876186-2e18a970-654c-4f26-a152-fb171d380591-star-qeCWdE0CnV8I6tAWaYKkiSze55M4oY.png"; // 786.Chat: imported binary asset URL

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const getRatingText = (rating: number): string => {
  if (rating === 0) return 'Not Rated';
  if (rating === 1) return 'Poor';
  if (rating === 2) return 'Fair';
  if (rating === 3) return 'Good';
  if (rating === 4) return 'Very Good';
  if (rating === 5) return 'Excellent';
  return `${rating} Stars`;
};

export default function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  showText = false,
  className
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (starValue: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const handleMouseEnter = (starValue: number) => {
    if (interactive) {
      setHoverRating(starValue);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;
          const isActive = starValue <= displayRating;
          
          return (
            <button
              key={index}
              type="button"
              className={cn(
                'relative transition-all duration-200',
                sizeClasses[size],
                interactive && 'hover:scale-110 cursor-pointer',
                !interactive && 'cursor-default'
              )}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive}
            >
              <img
                src={starIcon}
                alt={`${starValue} star${starValue !== 1 ? 's' : ''}`}
                className={cn(
                  'w-full h-full transition-all duration-200',
                  isActive ? 'opacity-100 filter-none' : 'opacity-30 grayscale',
                  interactive && hoverRating === starValue && 'drop-shadow-lg'
                )}
              />
              
              {/* Glow effect for active stars */}
              {isActive && (
                <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-20 blur-sm -z-10" />
              )}
            </button>
          );
        })}
      </div>
      
      {showText && (
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {getRatingText(displayRating)} {displayRating > 0 && `(${displayRating}/${maxRating})`}
        </span>
      )}
    </div>
  );
}

// Food Safety Rating Component with specific styling
export function FoodSafetyRating({ 
  rating, 
  interactive = false, 
  onRatingChange,
  className 
}: {
  rating: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}) {
  return (
    <div className={cn('p-4 bg-gradient-to-r from-green-500 to-yellow-500 rounded-lg shadow-lg', className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-bold text-lg">Food Hygiene Rating</h3>
        <div className="bg-black text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
          {rating}
        </div>
      </div>
      
      <StarRating
        rating={rating}
        maxRating={5}
        size="lg"
        interactive={interactive}
        onRatingChange={onRatingChange}
        showText={true}
        className="justify-center"
      />
      
      <div className="mt-2 text-center">
        <span className="text-white font-semibold">
          {rating === 5 ? 'VERY GOOD' : 
           rating === 4 ? 'GOOD' : 
           rating === 3 ? 'GENERALLY SATISFACTORY' : 
           rating === 2 ? 'IMPROVEMENT NECESSARY' : 
           rating === 1 ? 'MAJOR IMPROVEMENT NECESSARY' : 
           rating === 0 ? 'URGENT IMPROVEMENT NECESSARY' : 'NOT RATED'}
        </span>
      </div>
    </div>
  );
}