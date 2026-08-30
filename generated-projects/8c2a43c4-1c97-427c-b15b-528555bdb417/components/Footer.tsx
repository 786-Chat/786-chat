import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-200">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4">786 Journey Coffee</h3>
            <p className="text-sm">Craft coffee for the modern journey.</p>
          </div>
          <div>
            <h4 className="font-medium mb-3">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li><Link href="/services" className="hover:underline">Services</Link></li>
              <li><Link href="/contact" className="hover:underline">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>hello@786journey.coffee</li>
              <li>+1 (555) 123-4567</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3">Follow</h4>
            <ul className="space-y-2 text-sm">
              <li>Instagram</li>
              <li>Facebook</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-neutral-200 text-center text-sm text-muted-foreground">
          © 2024 786 Journey Coffee. All rights reserved.
        </div>
      </div>
    </footer>
  );
}