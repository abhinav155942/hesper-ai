import { Menu, ChevronDown } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  onMenuClick: () => void;
  selectedModel: "hesper-1.0v" | "hesper-pro";
  onModelChange: (model: "hesper-1.0v" | "hesper-pro") => void;
}

export default function Header({ onMenuClick, selectedModel, onModelChange }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Left: Hamburger Menu */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <Menu className="h-6 w-6 text-foreground" />
      </button>

      {/* Center: Logo/Title */}
      <div className="flex items-center space-x-2">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary">Hesper</span>
          <span className="text-sm text-muted-foreground">AI</span>
        </Link>
      </div>

      {/* Right: Model Selector */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1 bg-muted rounded-full px-2 py-1">
          <span className="text-sm text-muted-foreground">Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value as "hesper-1.0v" | "hesper-pro")}
            className="bg-transparent outline-none text-primary font-medium"
          >
            <option value="hesper-1.0v">Hesper 1.0v</option>
            <option value="hesper-pro">Hesper Pro</option>
          </select>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/about-hesper" className="text-sm text-secondary-foreground hover:text-foreground transition-colors">
            About Hesper
          </Link>
          <Link href="/privacy" className="text-sm text-secondary-foreground hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="text-sm text-secondary-foreground hover:text-foreground transition-colors">
            Terms
          </Link>
        </nav>

        {/* Sign In Button */}
        <Link
          href="/sign-in"
          className="hidden md:block bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}