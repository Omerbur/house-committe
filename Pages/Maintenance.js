
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { MaintenanceRequest } from "@/entities/MaintenanceRequest";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Wrench, 
  Plus, 
  AlertTriangle,
  Clock,
  CheckCircle,
  FileImage,
  MapPin,
  User as UserIcon
} from "lucide-react";
import { format } from "date-fns";

export default function Maintenance() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    priority: 'medium',
    image_url: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await User.me();
    setUser(currentUser);
    
    const allRequests = await MaintenanceRequest.list('-created_date');
    setRequests(allRequests);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
    } catch (error) {
      console.error("Upload error:", error);
    }
    setIsUploading(false);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    try {
      await MaintenanceRequest.create(formData);
      
      setFormData({
        title: '',
        description: '',
        location: '',
        priority: 'medium',
        image_url: ''
      });
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error("Error submitting request:", error);
    }
  };

  const handleUpdateStatus = async (requestId, status, adminNotes = '') => {
    try {
      await MaintenanceRequest.update(requestId, { status, admin_notes: adminNotes });
      loadData();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'open': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'open': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const openRequests = requests.filter(r => r.status === 'open').length;
  const inProgressRequests = requests.filter(r => r.status === 'in_progress').length;
  const resolvedRequests = requests.filter(r => r.status === 'resolved').length;

  return (
    <div className="p-6 lg:p-8 space-y-6" dir="rtl">
      {/* Header */}
      <div className="glass-effect rounded-3xl p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{color: '#2E5A8A'}}>
              קריאות שירות
            </h1>
            <p className="text-gray-600">
              {user?.role === 'admin' 
                ? 'ניהול בקשות תחזוקה ותיקונים בבניין' 
                : 'דיווח על תקלות ומעקב אחר התקדמות התיקון'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            {/* Stats */}
            <div className="hidden lg:flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="font-bold text-xl" style={{color: '#EFC75E'}}>{openRequests}</p>
                <p className="text-gray-500">פתוחות</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-xl" style={{color: '#2E5A8A'}}>{inProgressRequests}</p>
                <p className="text-gray-500">בטיפול</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-xl" style={{color: '#5B8C5A'}}>{resolvedRequests}</p>
                <p className="text-gray-500">טופלו</p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
              style={{backgroundColor: '#EFC75E'}}
            >
              <Plus className="w-4 h-4 ml-2" />
              דיווח תקלה
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Mobile */}
      <div className="lg:hidden grid grid-cols-3 gap-4">
        <Card className="glass-effect border-none shadow-lg">
          <CardContent className="p-4 text-center">
            <p className="font-bold text-2xl" style={{color: '#EFC75E'}}>{openRequests}</p>
            <p className="text-sm text-gray-500">פתוחות</p>
          </CardContent>
        </Card>
        <Card className="glass-effect border-none shadow-lg">
          <CardContent className="p-4 text-center">
            <p className="font-bold text-2xl" style={{color: '#2E5A8A'}}>{inProgressRequests}</p>
            <p className="text-sm text-gray-500">בטיפול</p>
          </CardContent>
        </Card>
        <Card className="glass-effect border-none shadow-lg">
          <CardContent className="p-4 text-center">
            <p className="font-bold text-2xl" style={{color: '#5B8C5A'}}>{resolvedRequests}</p>
            <p className="text-sm text-gray-500">טופלו</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Request Form */}
      {showCreateForm && (
        <Card className="glass-effect border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{color: '#2E5A8A'}}>
              <Wrench className="w-5 h-5" />
              דיווח על תקלה חדשה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <Label htmlFor="title">כותרת התקלה</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="תיאור קצר של הבעיה"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">תיאור מפורט</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="ספקו פרטים נוספים על התקלה..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">מיקום</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="למשל, לובי, קומה 3, חניון"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">עדיפות</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">נמוכה</SelectItem>
                      <SelectItem value="medium">בינונית</SelectItem>
                      <SelectItem value="high">גבוהה</SelectItem>
                      <SelectItem value="urgent">דחופה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="image">תמונה (אופציונלי)</Label>
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
                    className="w-full h-20 border-2 border-dashed border-gray-300 hover:border-gray-400"
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        מעלה...
                      </div>
                    ) : formData.image_url ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        התמונה הועלתה בהצלחה
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <FileImage className="w-6 h-6 text-gray-400" />
                        <span>לחצו להעלאת תמונה</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.title || !formData.description || isUploading}
                  className="flex-1 text-white"
                  style={{backgroundColor: '#5B8C5A'}}
                >
                  שלח קריאה
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length > 0 ? (
          requests.map((request) => (
            <Card key={request.id} className="glass-effect border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(request.status)}
                      <h3 className="font-semibold text-lg" style={{color: '#2E5A8A'}}>
                        {request.title}
                      </h3>
                      <Badge className={getPriorityColor(request.priority)}>
                        עדיפות {request.priority === 'low' ? 'נמוכה' : request.priority === 'medium' ? 'בינונית' : request.priority === 'high' ? 'גבוהה' : 'דחופה'}
                      </Badge>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status === 'open' ? 'פתוחה' : request.status === 'in_progress' ? 'בטיפול' : 'טופלה'}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{request.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                      {request.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{request.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-4 h-4" />
                        <span>דווח ב-{format(new Date(request.created_date), 'd MMM yyyy')}</span>
                      </div>
                    </div>

                    {request.admin_notes && (
                      <div className="p-3 rounded-lg mb-3" style={{backgroundColor: '#2E5A8A10'}}>
                        <p className="text-sm"><strong>הערות מנהל:</strong> {request.admin_notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {request.image_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(request.image_url, '_blank')}
                      >
                        <FileImage className="w-4 h-4 ml-2" />
                        צפה בתמונה
                      </Button>
                    )}
                    
                    {user?.role === 'admin' && request.status !== 'resolved' && (
                      <div className="flex gap-2">
                        {request.status === 'open' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(request.id, 'in_progress')}
                            className="text-white"
                            style={{backgroundColor: '#2E5A8A'}}
                          >
                            התחל טיפול
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => {
                            const notes = prompt('הערות לסיכום (אופציונלי):');
                            handleUpdateStatus(request.id, 'resolved', notes || '');
                          }}
                          className="text-white"
                          style={{backgroundColor: '#5B8C5A'}}
                        >
                          סמן כטופל
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="glass-effect border-none shadow-lg">
            <CardContent className="text-center py-12">
              <Wrench className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">לא נמצאו קריאות שירות</p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="text-white"
                style={{backgroundColor: '#EFC75E'}}
              >
                דווח על התקלה הראשונה שלך
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
