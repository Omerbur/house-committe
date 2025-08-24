
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Announcement } from "@/entities/Announcement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  Plus, 
  Pin,
  MessageCircle,
  Send,
  Calendar,
  User as UserIcon
} from "lucide-react";
import { format } from "date-fns";

export default function Community() {
  const [user, setUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newComment, setNewComment] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    pinned: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await User.me();
    setUser(currentUser);
    
    const allAnnouncements = await Announcement.list('-created_date');
    setAnnouncements(allAnnouncements);
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    try {
      await Announcement.create(formData);
      
      setFormData({
        title: '',
        content: '',
        category: 'general',
        pinned: false
      });
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error("Error creating announcement:", error);
    }
  };

  const handleAddComment = async (announcementId) => {
    const commentText = newComment[announcementId];
    if (!commentText?.trim()) return;

    try {
      const announcement = announcements.find(a => a.id === announcementId);
      const updatedComments = [
        ...(announcement.comments || []),
        {
          user_id: user.id,
          content: commentText.trim(),
          timestamp: new Date().toISOString()
        }
      ];

      await Announcement.update(announcementId, { comments: updatedComments });
      setNewComment(prev => ({ ...prev, [announcementId]: '' }));
      loadData();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      case 'event': return 'bg-purple-100 text-purple-800';
      case 'general': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pinnedAnnouncements = announcements.filter(a => a.pinned);
  const regularAnnouncements = announcements.filter(a => !a.pinned);

  return (
    <div className="p-6 lg:p-8 space-y-6" dir="rtl"> {/* Added dir="rtl" for Right-to-Left support */}
      {/* Header */}
      <div className="glass-effect rounded-3xl p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{color: '#2E5A8A'}}>
              פורום קהילה
            </h1>
            <p className="text-gray-600">
              הישארו מחוברים עם הודעות, דיונים ועדכונים קהילתיים
            </p>
          </div>
          {user?.role === 'admin' && (
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
              style={{backgroundColor: '#5B8C5A'}}
            >
              <Plus className="w-4 h-4 ml-2" /> {/* Changed mr-2 to ml-2 for RTL icon placement */}
              הודעה חדשה
            </Button>
          )}
        </div>
      </div>

      {/* Create Announcement Form */}
      {showCreateForm && user?.role === 'admin' && (
        <Card className="glass-effect border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{color: '#2E5A8A'}}>
              <MessageSquare className="w-5 h-5" />
              יצירת הודעה חדשה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <Label htmlFor="title">כותרת</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="כותרת ההודעה"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="content">תוכן</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="כתבו את הודעתכם..."
                  rows={5}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">קטגוריה</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">כללי</SelectItem>
                      <SelectItem value="maintenance">תחזוקה</SelectItem>
                      <SelectItem value="event">אירוע</SelectItem>
                      <SelectItem value="urgent">דחוף</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="pinned"
                    checked={formData.pinned}
                    onChange={(e) => setFormData(prev => ({ ...prev, pinned: e.target.checked }))}
                    className="rounded border-gray-300 ml-2" // Added ml-2 as per outline
                  />
                  <Label htmlFor="pinned" className="flex items-center gap-2">
                    <Pin className="w-4 h-4" />
                    נעץ לראש העמוד
                  </Label>
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
                  className="flex-1 text-white"
                  style={{backgroundColor: '#5B8C5A'}}
                >
                  פרסם הודעה
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Announcements */}
      <div className="space-y-6">
        {/* Pinned Announcements */}
        {pinnedAnnouncements.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{color: '#2E5A8A'}}>
              <Pin className="w-5 h-5" />
              הודעות נעוצות
            </h2>
            <div className="space-y-4">
              {pinnedAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="glass-effect border-none shadow-lg border-r-4" style={{borderRightColor: '#EFC75E'}}> {/* Changed border-l-4 to border-r-4 for RTL */}
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Pin className="w-4 h-4" style={{color: '#EFC75E'}} />
                          <h3 className="font-semibold text-lg" style={{color: '#2E5A8A'}}>
                            {announcement.title}
                          </h3>
                          <Badge className={getCategoryColor(announcement.category)}>
                            {announcement.category === 'general' ? 'כללי' : 
                             announcement.category === 'maintenance' ? 'תחזוקה' : 
                             announcement.category === 'event' ? 'אירוע' : 
                             'דחוף'}
                          </Badge>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{announcement.content}</p>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(announcement.created_date), 'd MMM yyyy, HH:mm')} {/* Changed date format */}
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="border-t pt-4">
                      <div className="space-y-3 mb-4">
                        {announcement.comments?.map((comment, index) => (
                          <div key={index} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#2E5A8A20'}}>
                              <UserIcon className="w-4 h-4" style={{color: '#2E5A8A'}} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-600">{comment.content}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {format(new Date(comment.timestamp), 'd MMM, HH:mm')} {/* Changed date format */}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-3">
                        <Input
                          placeholder="הוסף תגובה..."
                          value={newComment[announcement.id] || ''}
                          onChange={(e) => setNewComment(prev => ({ 
                            ...prev, 
                            [announcement.id]: e.target.value 
                          }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddComment(announcement.id);
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          onClick={() => handleAddComment(announcement.id)}
                          style={{backgroundColor: '#5B8C5A'}}
                          className="text-white"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Announcements */}
        {regularAnnouncements.length > 0 && (
          <div>
            {pinnedAnnouncements.length > 0 && (
              <h2 className="text-xl font-semibold mb-4" style={{color: '#2E5A8A'}}>
                הודעות אחרונות
              </h2>
            )}
            <div className="space-y-4">
              {regularAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="glass-effect border-none shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg" style={{color: '#2E5A8A'}}>
                            {announcement.title}
                          </h3>
                          <Badge className={getCategoryColor(announcement.category)}>
                             {announcement.category === 'general' ? 'כללי' : 
                             announcement.category === 'maintenance' ? 'תחזוקה' : 
                             announcement.category === 'event' ? 'אירוע' : 
                             'דחוף'}
                          </Badge>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{announcement.content}</p>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(announcement.created_date), 'd MMM yyyy, HH:mm')} {/* Changed date format */}
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="border-t pt-4">
                      <div className="space-y-3 mb-4">
                        {announcement.comments?.map((comment, index) => (
                          <div key={index} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#2E5A8A20'}}>
                              <UserIcon className="w-4 h-4" style={{color: '#2E5A8A'}} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-600">{comment.content}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {format(new Date(comment.timestamp), 'd MMM, HH:mm')} {/* Changed date format */}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-3">
                        <Input
                          placeholder="הוסף תגובה..."
                          value={newComment[announcement.id] || ''}
                          onChange={(e) => setNewComment(prev => ({ 
                            ...prev, 
                            [announcement.id]: e.target.value 
                          }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddComment(announcement.id);
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          onClick={() => handleAddComment(announcement.id)}
                          style={{backgroundColor: '#5B8C5A'}}
                          className="text-white"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {announcements.length === 0 && (
          <Card className="glass-effect border-none shadow-lg">
            <CardContent className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">אין עדיין הודעות</p>
              {user?.role === 'admin' && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="text-white"
                  style={{backgroundColor: '#5B8C5A'}}
                >
                  צור את ההודעה הראשונה שלך
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
