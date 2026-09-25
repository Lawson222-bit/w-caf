import { Heart, LogOut } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  pairingCode?: string | null;
  onExit?: () => void;
}

export default function AppLayout({
  children,
  pairingCode,
  onExit,
}: AppLayoutProps) {
  const appIdentifier = encodeURIComponent(
    typeof window !== "undefined" ? window.location.hostname : "pos-app",
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/assets/generated/pos-logo.dim_512x512.png"
                alt="W Café Logo"
                className="w-12 h-12 rounded-xl"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">W Café</h1>
                <span className="fake-money-badge">
                  🎮 Fake Money Only - For Fun!
                </span>
              </div>
            </div>
            {onExit && (
              <button
                type="button"
                data-ocid="cashier.exit_button"
                onClick={onExit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-accent text-sm font-medium text-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Exit
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} W Café. All transactions are
              simulated.
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Built with <Heart className="w-4 h-4 text-primary fill-primary" />{" "}
              using{" "}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                caffeine.ai
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Pairing Code — bottom left */}
      {pairingCode && (
        <div
          data-ocid="cashier.pairing_code"
          className="fixed bottom-4 left-4 z-50"
        >
          <div className="bg-card border border-border rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold leading-none">
                Pairing Code
              </p>
              <p className="text-xl font-mono font-bold text-foreground tracking-widest leading-tight mt-0.5">
                {pairingCode}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
