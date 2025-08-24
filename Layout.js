import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { 
  Home, 
  CreditCard, 
  Vote, 
  Wrench, 
  MessageSquare, 
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "לוח בקרה", url: createPageUrl("Dashboard"), icon: Home },
  { title: "תשלומים", url: createPageUrl("Payments"), icon: CreditCard },
  { title: "הצבעות", url: createPageUrl("Voting"), icon: Vote },
  { title: "תחזוקה", url: createPageUrl("Maintenance"), icon: Wrench },
  { title: "קהילה", url: createPageUrl("Community"), icon: MessageSquare },
  { title: "שירותים", url: createPageUrl("Services"), icon: Users },
];

const adminNavigationItems = [
  { title: "ניהול דיירים", url: createPageUrl("UserManagement"), icon: UserCheck },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.log("User not authenticated");
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await User.logout();
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#F5F5EB'}} dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{borderColor: '#2E5A8A'}}></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#F5F5EB'}} dir="rtl">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{backgroundColor: '#2E5A8A'}}>
              <Home className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{color: '#2E5A8A'}}>ברוכים הבאים לבילדינגהאב</h1>
            <p className="text-gray-600 mb-8">פלטפורמת ניהול הקהילה שלכם</p>
            <Button
              onClick={() => User.login()}
              className="w-full text-white font-medium py-3 rounded-xl transition-all"
              style={{backgroundColor: '#2E5A8A'}}
            >
              התחברו כדי להמשיך
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Combine navigation items based on user role
  const allNavigationItems = [
    ...navigationItems,
    ...(user.role === 'admin' ? adminNavigationItems : [])
  ];

  return (
    <div className="min-h-screen" style={{backgroundColor: '#F5F5EB'}} dir="rtl">
      <style>
        {`
          .nav-gradient {
            background: linear-gradient(135deg, #2E5A8A 0%, #1e3a5f 100%);
          }
          .glass-effect {
            backdrop-filter: blur(12px);
            background: rgba(255, 255, 255, 0.9);
          }
          .top-nav-sticky {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 50;
          }
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            direction: rtl;
          }
          * {
            direction: rtl;
          }
        `}
      </style>

      {/* Mobile Header - Now Sticky */}
      <header className="lg:hidden nav-gradient text-white p-4 top-nav-sticky">
        <div className="flex items-center justify-between">
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-semibold">בילדינגהאב</h1>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white hover:bg-white/20"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Desktop Top Navigation */}
      <nav className="hidden lg:block top-nav-sticky">
        <div className="nav-gradient text-white">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo - Now on the Right */}
              <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <div className="text-right">
                  <h2 className="font-bold text-lg">בילדינגהאב</h2>
                  <p className="text-white/70 text-sm">ניהול קהילה</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Home className="w-6 h-6" />
                </div>
              </Link>

              {/* Navigation Items - Centered */}
              <div className="flex items-center gap-4">
                {allNavigationItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <Link
                      key={item.title}
                      to={item.url}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-white/20 text-white shadow-lg' 
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  );
                })}
              </div>

              {/* User Info and Logout - Left Side */}
              <div className="flex items-center gap-4">
                <div className="text-sm text-right">
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-white/70">
                    {user.role === 'admin' ? 'מנהל ועד' : `דירה ${user.apartment_number || 'לא צוין'}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>התנתקות</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[80vw] nav-gradient text-white">
            <div className="p-6 border-b border-white/10 mt-16">
              <div className="text-sm">
                <p className="font-medium">{user.full_name}</p>
                <p className="text-white/70">
                  {user.role === 'admin' ? 'מנהל ועד' : `דירה ${user.apartment_number || 'לא צוין'}`}
                </p>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-2">
                {allNavigationItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <Link
                      key={item.title}
                      to={item.url}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="w-5 h-5 ml-3" />
                התנתקות
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-20">
        {children}
      </main>
    </div>
  );
}