import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../components/shared/Header';
import Button from '../../components/shared/Button';
import { getSubjects, createSubject, updateSubject, deleteSubject, getTopics } from '../../services/db';
import { SubjectModel, TopicModel } from '../../types';
import { Plus, Edit2, Trash2, ChevronRight, BookOpen, ArrowUp, ArrowDown, X, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SubjectsPage: React.FC = () => {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectModel | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const subjectsData = await getSubjects();
      setSubjects(subjectsData);

      // Get topic counts for each subject
      const counts: Record<string, number> = {};
      for (const subject of subjectsData) {
        const topics = await getTopics(subject.id);
        counts[subject.id] = topics.length;
      }
      setTopicCounts(counts);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (subject: SubjectModel) => {
    setEditingSubject(subject);
    setFormData({ name: subject.name, description: subject.description || '' });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined
        });
      } else {
        await createSubject({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          order: subjects.length + 1,
          questionCount: 0
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (subject: SubjectModel) => {
    if (subject.questionCount && subject.questionCount > 0) {
      alert('Cannot delete a subject that has questions. Remove all questions first.');
      return;
    }
    if (topicCounts[subject.id] > 0) {
      alert('Cannot delete a subject that has topics. Remove all topics first.');
      return;
    }
    if (!confirm(`Are you sure you want to delete "${subject.name}"?`)) return;

    setDeleting(subject.id);
    try {
      await deleteSubject(subject.id);
      loadData();
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Failed to delete subject');
    } finally {
      setDeleting(null);
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= subjects.length) return;

    const newSubjects = [...subjects];
    [newSubjects[index], newSubjects[newIndex]] = [newSubjects[newIndex], newSubjects[index]];

    // Update order in database
    try {
      await Promise.all([
        updateSubject(newSubjects[index].id, { order: index + 1 }),
        updateSubject(newSubjects[newIndex].id, { order: newIndex + 1 })
      ]);
      setSubjects(newSubjects);
    } catch (error) {
      console.error('Error reordering subjects:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <Link href="/admin" className="hover:text-primary">Admin</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Subjects</span>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subjects Management</h1>
            <p className="text-gray-500">Manage curriculum subjects and their topics.</p>
          </div>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Subject
          </Button>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first subject.</p>
            <Button onClick={openCreateModal}>Create Subject</Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-1">Order</div>
              <div className="col-span-4">Name</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1 text-center">Topics</div>
              <div className="col-span-1 text-center">Questions</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <AnimatePresence>
              {subjects.map((subject, index) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center"
                >
                  <div className="col-span-1 flex items-center gap-1">
                    <button
                      onClick={() => handleReorder(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReorder(index, 'down')}
                      disabled={index === subjects.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="col-span-4">
                    <Link
                      href={`/admin/subjects/${subject.id}/topics`}
                      className="font-medium text-gray-900 hover:text-primary"
                    >
                      {subject.name}
                    </Link>
                  </div>
                  <div className="col-span-3 text-gray-500 text-sm truncate">
                    {subject.description || '-'}
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {topicCounts[subject.id] || 0}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {subject.questionCount || 0}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button
                      onClick={() => router.push(`/admin/subjects/${subject.id}/topics`)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      title="Manage Topics"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(subject)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(subject)}
                      disabled={deleting === subject.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deleting === subject.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingSubject ? 'Edit Subject' : 'Add Subject'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                    placeholder="Brief description of the subject..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} isLoading={saving} disabled={!formData.name.trim()}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubjectsPage;
