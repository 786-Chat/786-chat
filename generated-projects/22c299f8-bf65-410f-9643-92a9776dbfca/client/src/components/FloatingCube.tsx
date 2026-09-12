import { useEffect, useRef, useState } from 'react';
const logo1 = "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087871673-1829269c-78e7-4c76-a6e2-0c1090fd8c2e-logo1-m5BHauMOSuVvkp1yxc1LjRvdzjOuL4.png"; // 786.Chat: imported binary asset URL
const logo2 = "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087872596-7c3dec17-9044-4dd6-a870-6595396b61ca-logo2-4QPqPg5WqzqAdqmEY7rLQnJdrTTlf7.png"; // 786.Chat: imported binary asset URL
const logo3 = "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087873423-05924ff1-ac2f-4d93-b68c-224bd139a7d8-logo3-CxaNcaWzudsiU7GosFusQ7OJlxlKx4.png"; // 786.Chat: imported binary asset URL
const logo4 = "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087874448-db35fc63-5281-4768-abcc-5bec4afb1c06-logo4-OtkAHniroCMOYCjhvbIKDaY0dXtEEe.png"; // 786.Chat: imported binary asset URL
const logo5 = "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087874880-ed9be19a-df6d-4a0d-9bbe-6a1d0289e8ff-logo5-g62bnyhukzs6ZDnbFNaBBNatmWbadn.png"; // 786.Chat: imported binary asset URL
const logo6 = "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087870687-000adb4f-18c5-4442-a78b-29271b8fb56a-fallback-logo-bzJbp8iGJMwBwZsANVpxPe051OEHfY.png"; // 786.Chat: imported binary asset URL

interface FloatingCube {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  rotationSpeedX: number;
  rotationSpeedY: number;
  rotationSpeedZ: number;
  scale: number;
  opacity: number;
}

interface FloatingCubeProps {
  variant?: 'admin' | 'branch';
}

export default function FloatingCube({ variant = 'admin' }: FloatingCubeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cubesRef = useRef<FloatingCube[]>([]);
  const animationRef = useRef<number>();

  const logos = [logo1, logo2, logo3, logo4, logo5, logo6];
  const [cubes, setCubes] = useState<FloatingCube[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initialize 6 floating 3D cubes
    const initialCubes: FloatingCube[] = Array.from({ length: 6 }, (_, index) => ({
      id: index,
      x: Math.random() * (window.innerWidth - 120),
      y: Math.random() * (window.innerHeight - 120),
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      rotationX: Math.random() * 360,
      rotationY: Math.random() * 360,
      rotationZ: Math.random() * 360,
      rotationSpeedX: (Math.random() - 0.5) * 2,
      rotationSpeedY: (Math.random() - 0.5) * 2,
      rotationSpeedZ: (Math.random() - 0.5) * 2,
      scale: 0.7 + Math.random() * 0.5,
      opacity: 0.7 + Math.random() * 0.3,
    }));

    cubesRef.current = initialCubes;
    setCubes([...initialCubes]);

    const animate = () => {
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      cubesRef.current = cubesRef.current.map(cube => {
        let newX = cube.x + cube.vx;
        let newY = cube.y + cube.vy;
        let newVx = cube.vx;
        let newVy = cube.vy;

        // Bounce off walls
        if (newX <= 0 || newX >= containerWidth - 120) {
          newVx = -newVx;
          newX = Math.max(0, Math.min(containerWidth - 120, newX));
        }
        if (newY <= 0 || newY >= containerHeight - 120) {
          newVy = -newVy;
          newY = Math.max(0, Math.min(containerHeight - 120, newY));
        }

        return {
          ...cube,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          rotationX: cube.rotationX + cube.rotationSpeedX,
          rotationY: cube.rotationY + cube.rotationSpeedY,
          rotationZ: cube.rotationZ + cube.rotationSpeedZ,
        };
      });

      setCubes([...cubesRef.current]);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (container) {
        const rect = container.getBoundingClientRect();
        cubesRef.current = cubesRef.current.map(cube => ({
          ...cube,
          x: Math.min(cube.x, rect.width - 120),
          y: Math.min(cube.y, rect.height - 120),
        }));
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {cubes.map((cube) => (
        <div
          key={cube.id}
          className="absolute"
          style={{
            left: `${cube.x}px`,
            top: `${cube.y}px`,
            transform: `scale(${cube.scale})`,
            opacity: cube.opacity,
            perspective: '1000px',
          }}
        >
          {/* 3D Cube Container */}
          <div
            className="w-24 h-24 relative preserve-3d"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(${cube.rotationX}deg) rotateY(${cube.rotationY}deg) rotateZ(${cube.rotationZ}deg)`,
            }}
          >
            {/* Front Face */}
            <div
              className="absolute w-24 h-24 border-2 backdrop-blur-md overflow-hidden rounded-lg shadow-2xl"
              style={{
                transform: 'translateZ(48px)',
                background: variant === 'admin' 
                  ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.3))'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(16, 185, 129, 0.3))',
                borderColor: variant === 'admin' ? '#a855f7' : '#3b82f6',
              }}
            >
              <img
                src={logos[cube.id % logos.length]}
                alt="Food Safety Logo"
                className="w-full h-full object-contain p-2"
              />
            </div>

            {/* Back Face */}
            <div
              className="absolute w-24 h-24 border-2 backdrop-blur-md overflow-hidden rounded-lg shadow-2xl"
              style={{
                transform: 'translateZ(-48px) rotateY(180deg)',
                background: variant === 'admin' 
                  ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(168, 85, 247, 0.3))'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(59, 130, 246, 0.3))',
                borderColor: variant === 'admin' ? '#ec4899' : '#10b981',
              }}
            >
              <img
                src={logos[(cube.id + 1) % logos.length]}
                alt="Food Safety Logo"
                className="w-full h-full object-contain p-2"
              />
            </div>

            {/* Right Face */}
            <div
              className="absolute w-24 h-24 border-2 backdrop-blur-md overflow-hidden rounded-lg shadow-2xl"
              style={{
                transform: 'rotateY(90deg) translateZ(48px)',
                background: variant === 'admin' 
                  ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.2))',
                borderColor: variant === 'admin' ? '#a855f7' : '#3b82f6',
              }}
            >
              <img
                src={logos[(cube.id + 2) % logos.length]}
                alt="Food Safety Logo"
                className="w-full h-full object-contain p-2"
              />
            </div>

            {/* Left Face */}
            <div
              className="absolute w-24 h-24 border-2 backdrop-blur-md overflow-hidden rounded-lg shadow-2xl"
              style={{
                transform: 'rotateY(-90deg) translateZ(48px)',
                background: variant === 'admin' 
                  ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.2))'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2))',
                borderColor: variant === 'admin' ? '#ec4899' : '#10b981',
              }}
            >
              <img
                src={logos[(cube.id + 3) % logos.length]}
                alt="Food Safety Logo"
                className="w-full h-full object-contain p-2"
              />
            </div>

            {/* Top Face */}
            <div
              className="absolute w-24 h-24 border-2 backdrop-blur-md overflow-hidden rounded-lg shadow-2xl"
              style={{
                transform: 'rotateX(90deg) translateZ(48px)',
                background: variant === 'admin' 
                  ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(236, 72, 153, 0.25))'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(16, 185, 129, 0.25))',
                borderColor: variant === 'admin' ? '#a855f7' : '#3b82f6',
              }}
            >
              <img
                src={logos[(cube.id + 4) % logos.length]}
                alt="Food Safety Logo"
                className="w-full h-full object-contain p-2"
              />
            </div>

            {/* Bottom Face */}
            <div
              className="absolute w-24 h-24 border-2 backdrop-blur-md overflow-hidden rounded-lg shadow-2xl"
              style={{
                transform: 'rotateX(-90deg) translateZ(48px)',
                background: variant === 'admin' 
                  ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(168, 85, 247, 0.25))'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(59, 130, 246, 0.25))',
                borderColor: variant === 'admin' ? '#ec4899' : '#10b981',
              }}
            >
              <img
                src={logos[(cube.id + 5) % logos.length]}
                alt="Food Safety Logo"
                className="w-full h-full object-contain p-2"
              />
            </div>
          </div>

          {/* Glowing effect */}
          <div 
            className="absolute inset-0 rounded-xl animate-pulse pointer-events-none"
            style={{
              background: variant === 'admin'
                ? 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
              filter: 'blur(15px)',
              transform: 'scale(1.5)',
            }}
          />
        </div>
      ))}
    </div>
  );
}