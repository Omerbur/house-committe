
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Payment } from "@/entities/Payment";
import { Vote } from "@/entities/Vote";
import { MaintenanceRequest } from "@/entities/MaintenanceRequest";
import { Announcement } from "@/entities/Announcement";
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  MessageCircle,
  Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isAfter, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { he } from "date-fns/locale";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    buildingBalance: 0,
    myPaymentStatus: 'pending',
    activeVotes: 0,
    pendingMaintenance: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentReminder, setShowPaymentReminder] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Load payments for building balance and user status
      const payments = await Payment.list();
      const totalVerified = payments
        .filter(p => p.status === 'verified')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const myLatestPayment = payments
        .filter(p => p.tenant_id === currentUser.id)
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

      // Check for monthly payment reminder for tenants
      if (currentUser.role !== 'admin') {
        const now = new Date();
        const monthInterval = { start: startOfMonth(now), end: endOfMonth(now) };
        const hasPaidThisMonth = payments.some(p => 
            p.tenant_id === currentUser.id &&
            p.status === 'verified' &&
            isWithinInterval(new Date(p.payment_date), monthInterval)
        );
        setShowPaymentReminder(!hasPaidThisMonth);
      }

      // Load active votes
      const votes = await Vote.list();
      const activeVotes = votes.filter(v => 
        v.status === 'active' && isAfter(new Date(v.deadline), new Date())
      );

      // Load maintenance requests
      const maintenance = await MaintenanceRequest.list();
      const pendingMaintenance = maintenance.filter(m => m.status !== 'resolved');

      // Load recent announcements
      const announcements = await Announcement.list('-created_date', 5);

      setStats({
        buildingBalance: totalVerified,
        myPaymentStatus: myLatestPayment?.status || 'pending',
        activeVotes: activeVotes.length,
        pendingMaintenance: pendingMaintenance.length
      });

      setRecentActivity(announcements);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8" dir="rtl">
      {/* Welcome Header */}
      <div className="glass-effect rounded-3xl p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{color: '#2E5A8A'}}>
              שלום, {user?.full_name?.split(' ')[0] || 'דייר'} 👋
            </h1>
            <p className="text-gray-600">
              הנה מה שקורה היום בקהילת הבניין שלכם
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {format(new Date(), 'EEEE, MMMM do', { locale: he })}
            </p>
            <p className="font-medium" style={{color: '#2E5A8A'}}>
              {user?.role === 'admin' ? 'מנהל ועד' : `דירה ${user?.apartment_number || 'לא צוין'}`}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Reminder */}
      {showPaymentReminder && (
        <div className="glass-effect rounded-3xl p-6 shadow-lg flex items-center gap-4" style={{backgroundColor: '#EFC75E30', borderColor: '#EFC75E'}}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#EFC75E80'}}>
            <Bell className="w-6 h-6" style={{color: '#2E5A8A'}}/>
          </div>
          <div>
            <h3 className="font-bold" style={{color: '#2E5A8A'}}>תזכורת תשלום חודשי</h3>
            <p className="text-gray-600 text-sm mt-1">
              התשלום שלכם לחודש זה ממתין לאישור. אנא העלו אישור תשלום כדי לעדכן את החשבון שלכם.
            </p>
          </div>
          <Link to={createPageUrl("Payments")} className="mr-auto">
            <Button className="text-white rounded-xl shadow-lg" style={{backgroundColor: '#EFC75E'}}>
              שלמו עכשיו
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-effect border-none shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">יתרת בניין</CardTitle>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: '#5B8C5A20'}}>
                <DollarSign className="w-5 h-5" style={{color: '#5B8C5A'}} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{color: '#5B8C5A'}}>
              ₪{stats.buildingBalance.toLocaleString()}
            </div>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <TrendingUp className="w-3 h-3 ml-1" />
              סך תשלומים מאושרים
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-none shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">סטטוס התשלום שלי</CardTitle>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                backgroundColor: stats.myPaymentStatus === 'verified' ? '#5B8C5A20' : '#EFC75E20'
              }}>
                {stats.myPaymentStatus === 'verified' ? (
                  <CheckCircle className="w-5 h-5" style={{color: '#5B8C5A'}} />
                ) : (
                  <Clock className="w-5 h-5" style={{color: '#EFC75E'}} />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge className={`text-sm font-medium ${
              stats.myPaymentStatus === 'verified' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {stats.myPaymentStatus === 'verified' ? 'שולם ✓' : 'ממתין'}
            </Badge>
            <p className="text-sm text-gray-500 mt-2">
              {stats.myPaymentStatus === 'verified' ? 'כל התשלומים אושרו' : 'התשלום ממתין לאישור'}
            </p>
          </CardContent>
        </Card>

        <Link to={createPageUrl("Voting")}>
          <Card className="glass-effect border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">הצבעות פעילות</CardTitle>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{backgroundColor: '#2E5A8A20'}}>
                  <Calendar className="w-5 h-5" style={{color: '#2E5A8A'}} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{color: '#2E5A8A'}}>
                {stats.activeVotes}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {stats.activeVotes > 0 ? 'לחצו להצבעה' : 'אין הצבעות פעילות'}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl("Maintenance")}>
          <Card className="glass-effect border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">תחזוקה</CardTitle>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{
                  backgroundColor: stats.pendingMaintenance > 0 ? '#EFC75E20' : '#5B8C5A20'
                }}>
                  <AlertTriangle className="w-5 h-5" style={{
                    color: stats.pendingMaintenance > 0 ? '#EFC75E' : '#5B8C5A'
                  }} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{
                color: stats.pendingMaintenance > 0 ? '#EFC75E' : '#5B8C5A'
              }}>
                {stats.pendingMaintenance}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {stats.pendingMaintenance > 0 ? 'לחצו לצפייה בבקשות' : 'הכל טופל'}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-effect border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{color: '#2E5A8A'}}>
              <MessageCircle className="w-5 h-5" />
              הודעות אחרונות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="border-r-4 pr-4 py-2" style={{borderColor: '#5B8C5A'}}>
                  <h4 className="font-medium" style={{color: '#2E5A8A'}}>{announcement.title}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {format(new Date(announcement.created_date), 'MMM d, h:mm a', { locale: he })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">אין הודעות אחרונות</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-effect border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{color: '#2E5A8A'}}>
              <Calendar className="w-5 h-5" />
              פעולות מהירות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Link to={createPageUrl("Payments")}>
                <button className="p-4 w-full rounded-xl text-center transition-all hover:scale-105" style={{backgroundColor: '#EFC75E20'}}>
                  <DollarSign className="w-6 h-6 mx-auto mb-2" style={{color: '#EFC75E'}} />
                  <span className="text-sm font-medium" style={{color: '#2E5A8A'}}>העלאת תשלום</span>
                </button>
              </Link>
              <Link to={createPageUrl("Maintenance")}>
                <button className="p-4 w-full rounded-xl text-center transition-all hover:scale-105" style={{backgroundColor: '#5B8C5A20'}}>
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2" style={{color: '#5B8C5A'}} />
                  <span className="text-sm font-medium" style={{color: '#2E5A8A'}}>דיווח תקלה</span>
                </button>
              </Link>
              <Link to={createPageUrl("Voting")}>
                <button className="p-4 w-full rounded-xl text-center transition-all hover:scale-105" style={{backgroundColor: '#2E5A8A20'}}>
                  <Calendar className="w-6 h-6 mx-auto mb-2" style={{color: '#2E5A8A'}} />
                  <span className="text-sm font-medium" style={{color: '#2E5A8A'}}>צפייה בהצבעות</span>
                </button>
              </Link>
              <Link to={createPageUrl("Community")}>
                <button className="p-4 w-full rounded-xl text-center transition-all hover:scale-105" style={{backgroundColor: '#5B8C5A20'}}>
                  <MessageCircle className="w-6 h-6 mx-auto mb-2" style={{color: '#5B8C5A'}} />
                  <span className="text-sm font-medium" style={{color: '#2E5A8A'}}>קהילה</span>
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
