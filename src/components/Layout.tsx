import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, ClipboardList, DollarSign, LogOut } from "lucide-react";
import { toast } from "sonner";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    toast.success("آپ کامیابی سے لاگ آؤٹ ہو گئے");
  };

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "ڈیش بورڈ" },
    { path: "/students", icon: Users, label: "طلباء" },
    { path: "/attendance", icon: ClipboardList, label: "حاضری" },
    { path: "/fees", icon: DollarSign, label: "فیس" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-gradient-primary text-white shadow-soft sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold">مدرسہ دارالاحسان</h1>
            <Button
              onClick={handleSignOut}
              variant="secondary"
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>لاگ آؤٹ</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b border-border sticky top-[72px] z-40">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-2 py-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="gap-2 whitespace-nowrap"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
