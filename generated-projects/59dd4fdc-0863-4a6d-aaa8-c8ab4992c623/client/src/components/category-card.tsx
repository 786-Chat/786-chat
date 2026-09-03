import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CategoryCardProps {
  name: string;
  slug: string;
  icon?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  gifUrl?: string | null;
  description?: string | null;
  onClick?: () => void;
  isActive?: boolean;
}

export function CategoryCard({
  name,
  slug,
  icon,
  imageUrl,
  videoUrl,
  gifUrl,
  description,
  onClick,
  isActive = false,
}: CategoryCardProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const mediaItems: { type: "image" | "video" | "gif"; url: string }[] = [];
  if (imageUrl) mediaItems.push({ type: "image", url: imageUrl });
  if (gifUrl) mediaItems.push({ type: "gif", url: gifUrl });
  if (videoUrl) mediaItems.push({ type: "video", url: videoUrl });

  const hasMedia = mediaItems.length > 0;
  const hasMultipleMedia = mediaItems.length > 1;

  useEffect(() => {
    if (!hasMultipleMedia) return;
    
    const currentMedia = mediaItems[currentSlide];
    if (currentMedia?.type === "video") return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mediaItems.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [currentSlide, hasMultipleMedia, mediaItems.length]);

  const toggleVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % mediaItems.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const currentMedia = mediaItems[currentSlide];

  return (
    <div
      onClick={onClick}
      data-testid={`category-card-${slug}`}
      className={`
        relative overflow-hidden rounded-2xl cursor-pointer
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:shadow-2xl
        ${isActive 
          ? "ring-4 ring-primary ring-offset-2 shadow-xl" 
          : "shadow-lg hover:ring-2 hover:ring-primary/50"
        }
      `}
      style={{
        width: "100%",
        aspectRatio: "1.6/1",
        minHeight: "140px",
        maxHeight: "200px",
      }}
    >
      {hasMedia ? (
        <div className="absolute inset-0">
          {currentMedia?.type === "video" ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={currentMedia.url}
                className="w-full h-full object-cover"
                loop
                muted
                playsInline
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80"
                onClick={toggleVideo}
              >
                {isVideoPlaying ? (
                  <Pause className="h-4 w-4 text-white" />
                ) : (
                  <Play className="h-4 w-4 text-white" />
                )}
              </Button>
            </div>
          ) : (
            <img
              src={currentMedia?.url}
              alt={name}
              className="w-full h-full object-cover"
            />
          )}
          
          {hasMultipleMedia && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/40 hover:bg-black/60"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/40 hover:bg-black/60"
                onClick={nextSlide}
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </Button>
              
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {mediaItems.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentSlide 
                        ? "w-4 bg-white" 
                        : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-orange-500 to-red-600">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent)]" />
        </div>
      )}
      
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="text-3xl drop-shadow-lg">{icon}</span>
          )}
          <div>
            <h3 className="text-xl font-bold text-white drop-shadow-lg leading-tight">
              {name}
            </h3>
            {description && (
              <p className="text-sm text-white/80 drop-shadow line-clamp-1 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CategoryCardsGridProps {
  categories: {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
    imageUrl?: string | null;
    videoUrl?: string | null;
    gifUrl?: string | null;
    description?: string | null;
  }[];
  activeCategory?: string | null;
  onCategoryClick?: (slug: string) => void;
}

export function CategoryCardsGrid({
  categories,
  activeCategory,
  onCategoryClick,
}: CategoryCardsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          name={category.name}
          slug={category.slug}
          icon={category.icon || undefined}
          imageUrl={category.imageUrl}
          videoUrl={category.videoUrl}
          gifUrl={category.gifUrl}
          description={category.description}
          isActive={activeCategory === category.slug}
          onClick={() => onCategoryClick?.(category.slug)}
        />
      ))}
    </div>
  );
}
