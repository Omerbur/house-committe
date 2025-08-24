
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Home, 
  User as UserIcon,
  Mail,
  Building,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { createPageUrl } from "@/utils";

export default function ProfileSetup() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    apartmentNumber: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      // Check if user already has profile data
      if (currentUser.apartment_number) {
        // User already has profile set up, redirect to dashboard
        window.location.href = createPageUrl("Dashboard");
        return;
      }

      // Pre-fill form with existing data if available
      const nameParts = currentUser.full_name ? currentUser.full_name.split(' ') : ['', ''];
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        apartmentNumber: currentUser.apartment_number || '',
        phone: currentUser.phone || ''
      });
    } catch (error) {
      console.error("Error loading user data:", error);
      // User not authenticated, redirect to login
      await User.loginWithRedirect(window.location.href);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.apartmentNumber) {
        setMessage({
          type: 'error',
          text: 'אנא מלאו את כל השדות הנדרשים.'
        });
        setIsSubmitting(false);
        return;
      }

      // Check if apartment number is already taken
      const existingUsers = await User.list();
      const apartmentTaken = existingUsers.some(
        u => u.apartment_number === formData.apartmentNumber && u.id !== user.id
      );

      if (apartmentTaken) {
        setMessage({
          type: 'error',
          text: 'מספר דירה זה כבר רשום במערכת. אנא פנו למנהל אם זו טעות.'
        });
        setIsSubmitting(false);
        return;
      }

      // Update user data with the provided information
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      await User.updateMyUserData({
        full_name: fullName,
        apartment_number: formData.apartmentNumber,
        phone: formData.phone,
        bank_reference: '' // Will be set later by admin or user
      });

      setMessage({
        type: 'success',
        text: 'ברוכים הבאים לבילדינגהאב! הפרופיל שלכם הוקם בהצלחה.'
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = createPageUrl("Dashboard");
      }, 2000);

    } catch (error) {
      console.error("Profile setup error:", error);
      setMessage({
        type: 'error',
        text: 'אירעה שגיאה בהקמת הפרופיל. אנא נסו שוב או פנו לתמיכה.'
      });
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#F5F5EB'}} dir="rtl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{borderColor: '#2E5A8A'}}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#F5F5EB'}} dir="rtl">
      <div className="w-full max-w-md">
        <Card className="glass-effect border-none shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{backgroundColor: '#2E5A8A'}}>
              <Home className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold mb-2" style={{color: '#2E5A8A'}}>
              השלימו את הפרופיל שלכם
            </CardTitle>
            <p className="text-gray-600">
              הוסיפו את הפרטים שלכם לגישה לפלטפורמת הקהילה
            </p>
          </CardHeader>

          <CardContent>
            {message.text && (
              <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <div className="flex items-center gap-2">
                  {message.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                    {message.text}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" style={{color: '#2E5A8A'}} />
                    שם פרטי *
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="יוסי"
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">
                    שם משפחה *
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="כהן"
                    required
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{color: '#2E5A8A'}} />
                  כתובת מייל
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="mt-2 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">לא ניתן לשנות את כתובת המייל</p>
              </div>

              <div>
                <Label htmlFor="apartmentNumber" className="flex items-center gap-2">
                  <Building className="w-4 h-4" style={{color: '#2E5A8A'}} />
                  מספר דירה *
                </Label>
                <Input
                  id="apartmentNumber"
                  name="apartmentNumber"
                  type="text"
                  value={formData.apartmentNumber}
                  onChange={handleInputChange}
                  placeholder="למשל: 1א, 205, ב12"
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="phone">
                  מספר טלפון (אופציונלי)
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="050-1234567"
                  className="mt-2"
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-white font-medium py-3 rounded-xl transition-all"
                  style={{backgroundColor: '#2E5A8A'}}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      מקימים את הפרופיל שלכם...
                    </div>
                  ) : (
                    'השלמת הגדרה'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
