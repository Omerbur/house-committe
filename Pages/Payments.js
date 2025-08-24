
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Payment } from "@/entities/Payment";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle,
  DollarSign,
  Calendar,
  FileImage,
  User as UserIcon, // Added UserIcon
  Home // Added Home icon
} from "lucide-react";
import { format } from "date-fns";

export default function Payments() {
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [usersList, setUsersList] = useState([]); // To store all users for admin view
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: '',
    proof_image_url: ''
  });
  const [paymentToReject, setPaymentToReject] = useState(null);
  const [rejectionNotes, setRejectionNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await User.me();
    setUser(currentUser);
    
    if (currentUser.role === 'admin') {
      const [allPayments, allUsers] = await Promise.all([
        Payment.list('-created_date'),
        User.list()
      ]);
      setPayments(allPayments);
      setUsersList(allUsers);
    } else {
      const myPayments = await Payment.filter({ tenant_id: currentUser.id }, '-created_date');
      setPayments(myPayments);
    }
  };

  const findUserById = (id) => {
    return usersList.find(u => u.id === id);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, proof_image_url: file_url }));
    } catch (error) {
      console.error("Upload error:", error);
    }
    setIsUploading(false);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.payment_date) return;

    try {
      await Payment.create({
        ...formData,
        tenant_id: user.id,
        amount: parseFloat(formData.amount),
        status: 'pending'
      });
      
      setFormData({ amount: '', payment_date: '', proof_image_url: '' });
      setShowUploadForm(false);
      loadData();
    } catch (error) {
      console.error("Error submitting payment:", error);
    }
  };

  const handleVerifyPayment = async (paymentId, status, notes = '') => {
    try {
      await Payment.update(paymentId, { status, notes });
      loadData();
    } catch (error) {
      console.error("Error updating payment:", error);
    }
  };

  const handleRejectSubmit = () => {
    if (!paymentToReject) return;
    handleVerifyPayment(paymentToReject.id, 'rejected', rejectionNotes);
    setPaymentToReject(null);
    setRejectionNotes('');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const totalVerified = payments
    .filter(p => p.status === 'verified')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6" dir="rtl">
      {/* Header */}
      <div className="glass-effect rounded-3xl p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{color: '#2E5A8A'}}>
              ניהול תשלומים
            </h1>
            <p className="text-gray-600">
              {user?.role === 'admin' 
                ? 'סקירה ואישור תשלומי דיירים' 
                : 'העלאת אישורי תשלום ומעקב אחר התרומות שלכם'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">יתרה מאושרת</p>
              <p className="text-2xl font-bold" style={{color: '#5B8C5A'}}>
                ₪{totalVerified.toLocaleString()}
              </p>
            </div>
            {user?.role !== 'admin' && (
              <Button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                style={{backgroundColor: '#EFC75E'}}
              >
                <Upload className="w-4 h-4 ml-2" />
                העלאת תשלום
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Upload Form */}
      {showUploadForm && user?.role !== 'admin' && (
        <Card className="glass-effect border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{color: '#2E5A8A'}}>
              <DollarSign className="w-5 h-5 ml-2" />
              העלאת אישור תשלום
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">סכום (₪)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="הזינו את סכום התשלום"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="payment_date">תאריך תשלום</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="proof">אישור תשלום (קבלה/צילום מסך)</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload').click()}
                    disabled={isUploading}
                    className="w-full h-24 border-2 border-dashed border-gray-300 hover:border-gray-400"
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        מעלה...
                      </div>
                    ) : formData.proof_image_url ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        התמונה הועלתה בהצלחה
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <FileImage className="w-8 h-8 text-gray-400" />
                        <span>לחצו להעלאת קבלה</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadForm(false)}
                  className="flex-1"
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.amount || !formData.payment_date || isUploading}
                  className="flex-1 text-white"
                  style={{backgroundColor: '#5B8C5A'}}
                >
                  שלח תשלום
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Payments List */}
      <Card className="glass-effect border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{color: '#2E5A8A'}}>
            <Calendar className="w-5 h-5 ml-2" />
            {user?.role === 'admin' ? 'כל התשלומים' : 'התשלומים שלי'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.length > 0 ? (
              payments.map((payment) => {
                const payingUser = user?.role === 'admin' ? findUserById(payment.tenant_id) : user;
                return (
                  <div key={payment.id} className="border rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        {user?.role === 'admin' && payingUser && (
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2 text-sm">
                              <UserIcon className="w-4 h-4 text-gray-500" />
                              <span className="font-semibold" style={{color: '#2E5A8A'}}>{payingUser.full_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Home className="w-4 h-4 text-gray-500" />
                              <span>דירה: {payingUser.apartment_number || 'לא צוין'}</span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(payment.status)}
                          <span className="font-medium" style={{color: '#2E5A8A'}}>
                            ₪{payment.amount}
                          </span>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status === 'verified' ? 'מאושר' : payment.status === 'rejected' ? 'נדחה' : 'ממתין'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          תאריך תשלום: {format(new Date(payment.payment_date), 'd MMM yyyy')}
                        </p>
                        <p className="text-xs text-gray-400">
                          הוגש: {format(new Date(payment.created_date), 'd MMM yyyy, HH:mm')}
                        </p>
                        {payment.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">
                            הערה: {payment.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {payment.proof_image_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(payment.proof_image_url, '_blank')}
                          >
                            <FileImage className="w-4 h-4 ml-2" />
                            צפה בהוכחה
                          </Button>
                        )}
                        
                        {user?.role === 'admin' && payment.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleVerifyPayment(payment.id, 'verified')}
                              className="text-white"
                              style={{backgroundColor: '#5B8C5A'}}
                            >
                              <CheckCircle className="w-4 h-4 ml-1" />
                              אשר
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPaymentToReject(payment)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 ml-1" />
                              דחה
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">לא נמצאו תשלומים</p>
                {user?.role !== 'admin' && (
                  <Button
                    onClick={() => setShowUploadForm(true)}
                    className="mt-4 text-white"
                    style={{backgroundColor: '#EFC75E'}}
                  >
                    העלה את התשלום הראשון שלך
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={!!paymentToReject} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setPaymentToReject(null);
          setRejectionNotes(''); // Clear notes when dialog is closed
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>דחיית תשלום</DialogTitle>
            <DialogDescription>
              אנא ספקו סיבה לדחיית תשלום זה. ההערה תהיה גלויה לדייר.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-notes">סיבת הדחייה (אופציונלי)</Label>
            <Textarea
              id="rejection-notes"
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="למשל, סכום שגוי, קבלה לא ברורה..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPaymentToReject(null);
              setRejectionNotes('');
            }}>
              ביטול
            </Button>
            <Button onClick={handleRejectSubmit} className="bg-red-600 hover:bg-red-700 text-white">
              אישור דחייה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
