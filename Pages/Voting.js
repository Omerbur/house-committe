
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Vote } from "@/entities/Vote";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Vote as VoteIcon,
  Plus,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  BarChart3,
  Pencil
} from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";
import { he } from "date-fns/locale"; // Import Hebrew locale

export default function Voting() {
  const [user, setUser] = useState(null);
  const [votes, setVotes] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingVote, setEditingVote] = useState(null); // New state for editing vote
  const [newVote, setNewVote] = useState({
    title: '',
    description: '',
    options: ['', ''],
    deadline: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await User.me();
    setUser(currentUser);

    const allVotes = await Vote.list('-created_date');
    setVotes(allVotes);
  };

  const addOption = () => {
    setNewVote(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updateOption = (index, value) => {
    setNewVote(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeOption = (index) => {
    if (newVote.options.length > 2) {
      setNewVote(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const handleCreateVote = async (e) => {
    e.preventDefault();
    if (!newVote.title || !newVote.description || !newVote.deadline) return;

    const filteredOptions = newVote.options.filter(opt => opt.trim() !== '');
    if (filteredOptions.length < 2) return;

    try {
      await Vote.create({
        ...newVote,
        options: filteredOptions,
        deadline: new Date(newVote.deadline).toISOString()
      });

      setNewVote({ title: '', description: '', options: ['', ''], deadline: '' });
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error("Error creating vote:", error);
    }
  };

  const handleUpdateVote = async () => {
    if (!editingVote) return;

    try {
      const { id, title, description, deadline } = editingVote;
      await Vote.update(id, {
        title,
        description,
        deadline: new Date(deadline).toISOString()
      });
      setEditingVote(null); // Close the dialog
      loadData(); // Reload votes to show updated deadline
    } catch (error) {
      console.error("Error updating vote:", error);
    }
  };

  const handleVote = async (voteId, selectedOption) => {
    try {
      const vote = votes.find(v => v.id === voteId);
      const existingVoteIndex = vote.votes?.findIndex(v => v.user_id === user.id);

      let updatedVotes = vote.votes || [];

      if (existingVoteIndex >= 0) {
        // Update existing vote
        updatedVotes[existingVoteIndex] = {
          user_id: user.id,
          option: selectedOption,
          timestamp: new Date().toISOString()
        };
      } else {
        // Add new vote
        updatedVotes.push({
          user_id: user.id,
          option: selectedOption,
          timestamp: new Date().toISOString()
        });
      }

      await Vote.update(voteId, { votes: updatedVotes });
      loadData();
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const getVoteResults = (vote) => {
    const voteCounts = {};
    vote.options.forEach(option => {
      voteCounts[option] = 0;
    });

    vote.votes?.forEach(v => {
      if (voteCounts.hasOwnProperty(v.option)) {
        voteCounts[v.option]++;
      }
    });

    const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

    return Object.entries(voteCounts).map(([option, count]) => ({
      option,
      count,
      percentage: totalVotes > 0 ? (count / totalVotes) * 100 : 0
    }));
  };

  const hasUserVoted = (vote) => {
    return vote.votes?.some(v => v.user_id === user?.id);
  };

  const getUserVote = (vote) => {
    return vote.votes?.find(v => v.user_id === user?.id)?.option;
  };

  const isVoteActive = (vote) => {
    // A vote is active if its status is 'active' AND its deadline is in the future
    return vote.status === 'active' && isAfter(new Date(vote.deadline), new Date());
  };

  return (
    <div className="p-6 lg:p-8 space-y-6" dir="rtl"> {/* Added dir="rtl" */}
      {/* Header */}
      <div className="glass-effect rounded-3xl p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{color: '#2E5A8A'}}>
              הצבעות קהילתיות
            </h1>
            <p className="text-gray-600">
              {user?.role === 'admin'
                ? 'צרו סקרים וצפו בהחלטות הקהילה'
                : 'השתתפו בהחלטות הבניין וצפו בתוצאות'}
            </p>
          </div>
          {user?.role === 'admin' && (
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
              style={{backgroundColor: '#2E5A8A'}}
            >
              <Plus className="w-4 h-4 ml-2" /> {/* Changed mr-2 to ml-2 */}
              צור סקר
            </Button>
          )}
        </div>
      </div>

      {/* Create Vote Form */}
      {showCreateForm && user?.role === 'admin' && (
        <Card className="glass-effect border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{color: '#2E5A8A'}}>
              <VoteIcon className="w-5 h-5" />
              יצירת סקר חדש
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateVote} className="space-y-4">
              <div>
                <Label htmlFor="title">כותרת הסקר</Label>
                <Input
                  id="title"
                  value={newVote.title}
                  onChange={(e) => setNewVote(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="על מה נצביע?"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">תיאור</Label>
                <Textarea
                  id="description"
                  value={newVote.description}
                  onChange={(e) => setNewVote(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="ספקו פרטים נוספים על הסקר..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label>אפשרויות</Label>
                <div className="space-y-2 mt-2">
                  {newVote.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`אפשרות ${index + 1}`}
                      />
                      {newVote.options.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeOption(index)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 ml-2" /> {/* Changed mr-2 to ml-2 */}
                  הוסף אפשרות
                </Button>
              </div>

              <div>
                <Label htmlFor="deadline">מועד אחרון להצבעה</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={newVote.deadline}
                  onChange={(e) => setNewVote(prev => ({ ...prev, deadline: e.target.value }))}
                  required
                />
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
                  צור סקר
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Votes List */}
      <div className="space-y-6">
        {votes.length > 0 ? (
          votes.map((vote) => {
            const results = getVoteResults(vote);
            const userHasVoted = hasUserVoted(vote);
            const userVote = getUserVote(vote);
            const isActive = isVoteActive(vote);
            const totalVotes = results.reduce((sum, r) => sum + r.count, 0);

            return (
              <Card key={vote.id} className="glass-effect border-none shadow-lg">
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="mb-2" style={{color: '#2E5A8A'}}>
                        {vote.title}
                      </CardTitle>
                      <p className="text-gray-600 mb-4">{vote.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" style={{color: '#2E5A8A'}} />
                          <span>מסתיים: {format(new Date(vote.deadline), 'd MMM yyyy, HH:mm', { locale: he })}</span> {/* Changed format and added locale */}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" style={{color: '#5B8C5A'}} />
                          <span>{totalVotes} הצבעות</span>
                        </div>
                        <Badge className={isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {isActive ? 'פעיל' : 'סגור'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {userHasVoted && (
                        <div className="flex items-center gap-2 text-sm" style={{color: '#5B8C5A'}}>
                          <CheckCircle className="w-4 h-4" />
                          <span>הצבעת: <strong>{userVote}</strong></span>
                        </div>
                      )}
                      {user?.role === 'admin' && (
                        <Button variant="ghost" size="icon" onClick={() => setEditingVote({ ...vote })}>
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {vote.options.map((option) => {
                      const result = results.find(r => r.option === option);
                      const isUserChoice = userVote === option;

                      return (
                        <div key={option} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isActive && !userHasVoted ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVote(vote.id, option)}
                                  className="min-w-0"
                                >
                                  <VoteIcon className="w-4 h-4" />
                                </Button>
                              ) : (
                                <div className="w-10 h-8 flex items-center justify-center">
                                  {isUserChoice && <CheckCircle className="w-4 h-4" style={{color: '#5B8C5A'}} />}
                                </div>
                              )}
                              <span className={isUserChoice ? 'font-semibold' : ''}>{option}</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {result?.count || 0} הצבעות ({(result?.percentage || 0).toFixed(1)}%)
                            </div>
                          </div>

                          {(!isActive || userHasVoted || user?.role === 'admin') && (
                            <Progress
                              value={result?.percentage || 0}
                              className="h-2"
                              style={{
                                background: isUserChoice ? '#5B8C5A20' : '#e5e7eb'
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {isActive && !userHasVoted && (
                    <div className="mt-4 p-4 rounded-lg" style={{backgroundColor: '#EFC75E20'}}>
                      <div className="flex items-center gap-2 text-sm" style={{color: '#2E5A8A'}}>
                        <Clock className="w-4 h-4" />
                        <span>לחצו על כפתור ההצבעה ליד האפשרות המועדפת עליכם</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="glass-effect border-none shadow-lg">
            <CardContent className="text-center py-12">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">עדיין לא נוצרו סקרים</p>
              {user?.role === 'admin' && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="text-white"
                  style={{backgroundColor: '#2E5A8A'}}
                >
                  צרו את הסקר הראשון שלכם
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Vote Dialog */}
      <Dialog open={!!editingVote} onOpenChange={(isOpen) => !isOpen && setEditingVote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עריכת סקר</DialogTitle>
            <DialogDescription>
              עדכנו את פרטי הסקר. ניתן להאריך את המועד האחרון כדי לפתוח מחדש סקר שנסגר.
            </DialogDescription>
          </DialogHeader>
          {editingVote && (
            <div className="py-4 space-y-4">
               <div>
                  <Label htmlFor="edit-title">כותרת הסקר</Label>
                  <Input
                    id="edit-title"
                    value={editingVote.title}
                    onChange={(e) => setEditingVote(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">תיאור</Label>
                  <Textarea
                    id="edit-description"
                    value={editingVote.description}
                    onChange={(e) => setEditingVote(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              <div>
                <Label htmlFor="edit-deadline">מועד אחרון להצבעה</Label>
                <Input
                  id="edit-deadline"
                  type="datetime-local"
                  value={format(new Date(editingVote.deadline), "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => setEditingVote(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVote(null)}>
              ביטול
            </Button>
            <Button onClick={handleUpdateVote} className="text-white" style={{backgroundColor: '#5B8C5A'}}>
              שמור שינויים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
