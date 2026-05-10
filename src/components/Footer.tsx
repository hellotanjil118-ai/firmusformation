import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-[color:var(--surface)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-primary">
              <span className="font-display text-lg font-bold text-primary-foreground">F</span>
            </div>
            <span className="font-display text-lg font-semibold">
              Firmus <span className="text-gradient-gold">Formation</span>
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            End-to-end Amazon FBA setup and management for international sellers. LLC, EIN, sourcing, PPC and beyond.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About Us</Link></li>
            <li><Link to="/services" className="hover:text-foreground">Services</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
            <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">Terms & Conditions</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Contact</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><Mail size={16} className="mt-0.5 text-gold" /> hello@firmusformation.com</li>
            <li className="flex items-start gap-2"><Phone size={16} className="mt-0.5 text-gold" /> +1 (555) 010-0199</li>
            <li className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 text-gold" /> Wilmington, Delaware, USA</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Firmus Formation. All rights reserved.
      </div>
    </footer>
  );
}
