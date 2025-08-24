
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Payment } from "@/entities/Payment";
import { Vote } from "@/entities/Vote";
import { MaintenanceRequest } from "@/entities/MaintenanceRequest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  Mail,
  Home,
  CreditCard,
  Wrench,
  Vote as VoteIcon,
  AlertTriangle,
  Pencil
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale"; // New import

export default function UserManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [votes, setVotes] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Only allow admin access
      if (user.role !== 'admin') {
        return;
      }

      const [allUsers, allPayments, allVotes, allMaintenance] = await Promise.all([
        User.list('-created_date'),
        Payment.list('-created_date'),
        Vote.list('-created_date'),
        MaintenanceRequest.list('-created_date')
      ]);

      setUsers(allUsers);
      setPayments(allPayments);
      setVotes(allVotes);
      setMaintenance(allMaintenance);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      // Destructure to exclude fields that should not be sent for update
      const { id, created_date, updated_date, email, ...updateData } = editingUser;
      await User.update(id, updateData);
      setEditingUser(null); // Close dialog
      loadData(); // Reload data to show updated user list
    } catch (error) {
      console.error("Error updating user:", error);
      // Potentially add a user-facing error message here
    }
  };

  const getUserStats = (userId) => {
    const userPayments = payments.filter(p => p.tenant_id === userId);
    const userVotes = votes.reduce((count, vote) => {
      return count + (vote.votes?.filter(v => v.user_id === userId).length || 0);
    }, 0);
    const userMaintenance = maintenance.filter(m => m.created_by === userId);

    return {
      paymentsCount: userPayments.length,
      verifiedPayments: userPayments.filter(p => p.status === 'verified').length,
      totalPaid: userPayments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount, 0),
      votesCount: userVotes,
      maintenanceCount: userMaintenance.length
    };
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.apartment_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 lg:p-8">
        <Card className="glass-effect border-none shadow-lg">
          <CardContent className="text-center py-12">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-semibold mb-2" style={{color: '#2E5A8A'}}>גישה נדחתה</h2>
            <p className="text-gray-600">עמוד זה נגיש למנהלי ועד בלבד.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.role === 'user').length;
  const admins = users.filter(u => u.role === 'admin').length;
  const usersWithApartments = users.filter(u => u.apartment_number).length;

  return (
    <div className="p-6 lg:p-8 space-y-6" dir="rtl"> {/* Added dir="rtl" */}
      {/* Header */}
      <div className="glass-effect rounded-3xl p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{color: '#2E5A8A'}}>
              ניהול דיירים
            </h1>
            <p className="text-gray-600">
              נהלו דיירים, צפו בסיכומי פעילות ועקבו אחר השתתפות בבניין
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" /> {/* Changed left-3 to right-3 */}
              <Input
                placeholder="חפש דיירים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 w-64" // Changed pl-10 to pr-10
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-effect border-none shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">סך הכל משתמשים</CardTitle>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: '#2E5A8A20'}}>
                <Users className="w-5 h-5" style={{color: '#2E5A8A'}} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{color: '#2E5A8A'}}>
              {totalUsers}
            </div>
            <p className="text-sm text-gray-500 mt-1">משתמשים רשומים</p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-none shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">דיירים פעילים</CardTitle>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: '#5B8C5A20'}}>
                <Home className="w-5 h-5" style={{color: '#5B8C5A'}} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{color: '#5B8C5A'}}>
              {activeUsers}
            </div>
            <p className="text-sm text-gray-500 mt-1">חשבונות דיירים</p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-none shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">מנהלים</CardTitle>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: '#EFC75E20'}}>
                <Users className="w-5 h-5" style={{color: '#EFC75E'}} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{color: '#EFC75E'}}>
              {admins}
            </div>
            <p className="text-sm text-gray-500 mt-1">חשבונות מנהלים</p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-none shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">דירות משויכות</CardTitle>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: '#5B8C5A20'}}>
                <Home className="w-5 h-5" style={{color: '#5B8C5A'}} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{color: '#5B8C5A'}}>
              {usersWithApartments}
            </div>
            <p className="text-sm text-gray-500 mt-1">מתוך 26 דירות סה"כ</p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="glass-effect border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{color: '#2E5A8A'}}>
            <Users className="w-5 h-5" />
            ספריית דיירים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const stats = getUserStats(user.id);
                return (
                  <div key={user.id} className="border rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                            backgroundColor: user.role === 'admin' ? '#EFC75E20' : '#2E5A8A20'
                          }}>
                            <Users className="w-5 h-5" style={{
                              color: user.role === 'admin' ? '#EFC75E' : '#2E5A8A'
                            }} />
                          </div>
                          <div>
                            <h3 className="font-semibold" style={{color: '#2E5A8A'}}>
                              {user.full_name || 'אין שם'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          </div>
                          <Badge className={user.role === 'admin' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}>
                            {user.role === 'admin' ? 'מנהל' : 'דייר'}
                          </Badge>
                          <Button variant="ghost" size="icon" className="mr-auto" onClick={() => setEditingUser({...user})}> {/* Changed ml-auto to mr-auto */}
                            <Pencil className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">דירה:</span>
                            <p className="font-medium">{user.apartment_number || 'לא שויך'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">אסמכתא בנקאית:</span>
                            <p className="font-medium">{user.bank_reference || 'לא סופק'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">טלפון:</span>
                            <p className="font-medium">{user.phone || 'לא סופק'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">הצטרף:</span>
                            <p className="font-medium">{format(new Date(user.created_date), 'MMM yyyy', { locale: he })}</p> {/* Added locale */}
                          </div>
                        </div>
                      </div>

                      {user.role !== 'admin' && (
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="flex items-center gap-1 mb-1">
                              <CreditCard className="w-3 h-3" style={{color: '#5B8C5A'}} />
                              <span className="font-semibold" style={{color: '#5B8C5A'}}>
                                {stats.verifiedPayments}/{stats.paymentsCount}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">תשלומים</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 mb-1">
                              <VoteIcon className="w-3 h-3" style={{color: '#2E5A8A'}} />
                              <span className="font-semibold" style={{color: '#2E5A8A'}}>
                                {stats.votesCount}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">הצבעות</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 mb-1">
                              <Wrench className="w-3 h-3" style={{color: '#EFC75E'}} />
                              <span className="font-semibold" style={{color: '#EFC75E'}}>
                                {stats.maintenanceCount}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">קריאות</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 mb-1">
                              <span className="font-semibold" style={{color: '#5B8C5A'}}>
                                ₪{stats.totalPaid} {/* Changed $ to ₪ */}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">סך הכל שולם</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">לא נמצאו משתמשים התואמים לחיפוש</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
        <DialogContent dir="rtl"> {/* Added dir="rtl" to DialogContent */}
          <DialogHeader>
            <DialogTitle>עריכת משתמש</DialogTitle>
            <DialogDescription>
              עדכנו את פרטי המשתמש. לא ניתן לשנות את כתובת המייל.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="full_name">שם מלא</Label>
                <Input
                  id="full_name"
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, full_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  value={editingUser.email || ''}
                  disabled // Email cannot be changed
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="apartment_number">מספר דירה</Label>
                  <Input
                    id="apartment_number"
                    value={editingUser.apartment_number || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, apartment_number: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">מספר טלפון</Label>
                  <Input
                    id="phone"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bank_reference">אסמכתא בנקאית</Label>
                <Input
                  id="bank_reference"
                  value={editingUser.bank_reference || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, bank_reference: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="role">תפקיד</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => setEditingUser(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תפקיד" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">דייר</SelectItem>
                    <SelectItem value="admin">מנהל</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              ביטול
            </Button>
            <Button onClick={handleUpdateUser} className="text-white" style={{backgroundColor: '#5B8C5A'}}>
              שמור שינויים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
