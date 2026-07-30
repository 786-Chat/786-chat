import Link from "next/link";
import { Smile as Tooth, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                <Tooth className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">
                Pearl<span className="text-emerald-400">Care</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Premium dental care with a gentle touch. Your smile is our passion.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-400 hover:text-emerald-400 transition text-sm">Home</Link></li>
              <li><Link href="/services" className="text-gray-400 hover:text-emerald-400 transition text-sm">Services</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-emerald-400 transition text-sm">About</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-emerald-400 transition text-sm">Contact</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li><Link href="/services" className="text-gray-400 hover:text-emerald-400 transition text-sm">General Dentistry</Link></li>
              <li><Link href="/services" className="text-gray-400 hover:text-emerald-400 transition text-sm">Cosmetic Dentistry</Link></li>
              <li><Link href="/services" className="text-gray-400 hover:text-emerald-400 transition text-sm">Orthodontics</Link></li>
              <li><Link href="/services" className="text-gray-400 hover:text-emerald-400 transition text-sm">Pediatric Dentistry</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 text-emerald-400" />
                123 Smile Avenue, NY
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Phone className="w-4 h-4 text-emerald-400" />
                (555) 123-4567
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail className="w-4 h-4 text-emerald-400" />
                info@pearlcare.com
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} PearlCare Dental Clinic. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
