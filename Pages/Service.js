
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Service } from "@/entities/Service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Plus, 
  Phone,
  Mail,
  Star,
  Wrench,
  Zap,
  Droplets,
  Paintbrush,
  Sparkles,
  Settings
} from "lucide-react";

const categoryIcons = {
  plumbing: Droplets,
  electrical: Zap,
  cleaning: Sparkles,
  maintenance: Wrench,
  painting: Paintbrush,
  other: Settings
};

const categoryLabels = {
  plumbing: "אינסטלציה",
  electrical: "חשמל",
  cleaning: "ניקיון",
  maintenance: "תחזוקה",
  painting: "צביעה",
  other: "אחר"
};

const categoryColors = {
  plumbing: 'bg-blue-100 text-blue-800',
  electrical: 'bg-yellow-100 text-yellow-800',
  cleaning: 'bg-green-100 text-green-800',
  maintenance: 'bg-purple-100 text-purple-800',
  painting: 'bg-pink-100 text-pink-800',
  other: 'bg-gray-100 text-gray-800'
};

export default function Services() {
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    category: 'maintenance',
    phone: '',
    email: '',
    description: '',
    rating: 5
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await User.me();
    setUser(currentUser);
    
    const allServices = await Service.list('-created_date');
    setServices(allServices);
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    try {
      await Service.create({
        ...formData,
        rating: parseFloat(formData.rating),
        recommended_by: user.id
      });
      
      setFormData({
        name: '',
        category: 'maintenance',
        phone: '',
        email: '',
        description: '',
        rating: 5
      });
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error("Error creating service:", error);
    }
  };

  const filteredServices = filterCategory === 'all' 
    ? services 
    : services.filter(s => s.category === filterCategory);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6" dir="rtl">
      {/* Header */}
      <div className="glass-effect rounded-3xl p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{color: '#2E5A8A'}}>
              בעלי מקצוע
            </h1>
            <p className="text-gray-600">
              בעלי מקצוע מומלצים לתחזוקה ותיקונים בבניין
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
            style={{backgroundColor: '#5B8C5A'}}
          >
            <Plus className="w-4 h-4 ml-2" />
            המלץ על שירות
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-effect border-none shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory('all')}
              style={{
                backgroundColor: filterCategory === 'all' ? '#2E5A8A' : 'transparent',
                color: filterCategory === 'all' ? 'white' : '#2E5A8A'
              }}
            >
              כל השירותים
            </Button>
            {Object.keys(categoryIcons).map((category) => {
              const Icon = categoryIcons[category];
              return (
                <Button
                  key={category}
                  variant={filterCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory(category)}
                  className="flex items-center gap-2"
                  style={{
                    backgroundColor: filterCategory === category ? '#2E5A8A' : 'transparent',
                    color: filterCategory === category ? 'white' : '#2E5A8A'
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {categoryLabels[category]}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Create Service Form */}
      {showCreateForm && (
        <Card className="glass-effect border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{color: '#2E5A8A'}}>
              <Users className="w-5 h-5" />
              המלצה על בעל מקצוע
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateService} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">שם בעל המקצוע</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="שם החברה או האיש"
                    required
                  />
                </div>
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
                      <SelectItem value="plumbing">אינסטלציה</SelectItem>
                      <SelectItem value="electrical">חשמל</SelectItem>
                      <SelectItem value="cleaning">ניקיון</SelectItem>
                      <SelectItem value="maintenance">תחזוקה</SelectItem>
                      <SelectItem value="painting">צביעה</SelectItem>
                      <SelectItem value="other">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">מספר טלפון</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="מספר טלפון ליצירת קשר"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">אימייל (אופציונלי)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="כתובת אימייל"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">תיאור</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="תארו את השירותים שהם מספקים..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="rating">הדירוג שלכם (1-5 כוכבים)</Label>
                <Select
                  value={formData.rating.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, rating: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">⭐</SelectItem>
                    <SelectItem value="2">⭐⭐</SelectItem>
                    <SelectItem value="3">⭐⭐⭐</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐</SelectItem>
                    <SelectItem value="5">⭐⭐⭐⭐⭐</SelectItem>
                  </SelectContent>
                </Select>
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
                  הוסף שירות
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => {
            const Icon = categoryIcons[service.category];
            return (
              <Card key={service.id} className="glass-effect border-none shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{backgroundColor: '#2E5A8A20'}}>
                        <Icon className="w-6 h-6" style={{color: '#2E5A8A'}} />
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{color: '#2E5A8A'}}>
                          {service.name}
                        </h3>
                        <Badge className={categoryColors[service.category]}>
                          {categoryLabels[service.category]}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {service.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {service.description}
                    </p>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" style={{color: '#5B8C5A'}} />
                      <a 
                        href={`tel:${service.phone}`}
                        className="text-sm hover:underline"
                        style={{color: '#2E5A8A'}}
                      >
                        {service.phone}
                      </a>
                    </div>
                    
                    {service.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" style={{color: '#5B8C5A'}} />
                        <a 
                          href={`mailto:${service.email}`}
                          className="text-sm hover:underline"
                          style={{color: '#2E5A8A'}}
                        >
                          {service.email}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        {renderStars(service.rating)}
                      </div>
                      <span className="text-xs text-gray-500">
                        מומלץ על ידי דייר
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full">
            <Card className="glass-effect border-none shadow-lg">
              <CardContent className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-4">
                  {filterCategory === 'all' 
                    ? 'עדיין אין המלצות על בעלי מקצוע' 
                    : `לא נמצאו שירותי ${categoryLabels[filterCategory]}`}
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="text-white"
                  style={{backgroundColor: '#5B8C5A'}}
                >
                  המלץ על שירות
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
