import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Fresh Coffee, Better Mornings</h1>
      <p className="text-lg text-stone-600 mb-8">
        Start your day with our handcrafted coffee.
      </p>
      <Button asChild size="lg">
        <Link href="/menu">Order Now</Link>
      </Button>
    </main>
  );
}
