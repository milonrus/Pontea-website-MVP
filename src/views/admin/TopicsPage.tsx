import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';
import Button from '@/components/shared/Button';
import { getSubjects, getTopics, createTopic, updateTopic, deleteTopic } from '@/lib/db';
import { SubjectModel, TopicModel } from '@/types';
import { Plus, Edit2, Trash2, ChevronRight, FileText, ArrowUp, ArrowDown, X, Save, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TopicsPage: React.FC = () => {
  const params = useParams();
  const subjectIdParam = params?.subjectId;
  const subjectId = Array.isArray(subjectIdParam) ? subjectIdParam[0] : subjectIdParam;
  const router = useRouter();
  const [subject, setSubject] = useState<SubjectModel | null>(null);
  const [topics, setTopics] = useState<TopicModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicModel | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [subjectId]);

  const loadData = async () => {
    if (!subjectId) return;
    try {
      const subjects = await getSubjects();
      const currentSubject = subjects.find(s => s.id === subjectId);
      if (!currentSubject) {
        router.replace('/admin/subjects');
        return;
      }
      setSubject(currentSubject);

      const topicsData = await getTopics(subjectId);
      setTopics(topicsData);
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingTopic(null);
    setFormData({ name: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (topic: TopicModel) => {
    setEditingTopic(topic);
    setFormData({ name: topic.name });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !subjectId) return;
    setSaving(true);
    try {
      if (editingTopic) {
        await updateTopic(editingTopic.id, {
          name: formData.name.trim()
        });
      } else {
        await createTopic({
          subjectId,
          name: formData.name.trim(),
          order: topics.length + 1,
          questionCount: 0
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving topic:', error);
      alert('Failed to save topic');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (topic: TopicModel) => {
    if (topic.questionCount && topic.questionCount > 0) {
      alert('Cannot delete a topic that has questions. Remove all questions first.');
      return;
    }
    if (!confirm(`Are you sure you want to delete "${topic.name}"?`)) return;

    setDeleting(topic.id);
    try {
      await deleteTopic(topic.id);
      loadData();
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Failed to delete topic');
    } finally {
      setDeleting(null);
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= topics.length) return;

    const newTopics = [...topics];
    [newTopics[index], newTopics[newIndex]] = [newTopics[newIndex], newTopics[index]];

    try {
      await Promise.all([
        updateTopic(newTopics[index].id, { order: index + 1 }),
        updateTopic(newTopics[newIndex].id, { order: newIndex + 1 })
      ]);
      setTopics(newTopics);
    } catch (error) {
      console.error('Error reordering topics:', error);
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
          <Link href="/admin/subjects" className="hover:text-primary">Subjects</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">{subject?.name || 'Topics'}</span>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/admin/subjects')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Topics in {subject?.name}</h1>
            <p className="text-gray-500">Manage topics for this subject.</p>
          </div>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Topic
          </Button>
        </div>

        {topics.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No topics yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first topic for {subject?.name}.</p>
            <Button onClick={openCreateModal}>Create Topic</Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-1">Order</div>
              <div className="col-span-7">Name</div>
              <div className="col-span-2 text-center">Questions</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <AnimatePresence>
              {topics.map((topic, index) => (
                <motion.div
                  key={topic.id}
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
                      disabled={index === topics.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="col-span-7">
                    <span className="font-medium text-gray-900">{topic.name}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {topic.questionCount || 0}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button
                      onClick={() => openEditModal(topic)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(topic)}
                      disabled={deleting === topic.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deleting === topic.id ? (
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
                  {editingTopic ? 'Edit Topic' : 'Add Topic'}
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
                    Topic Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="e.g., Algebra"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} isLoading={saving} disabled={!formData.name.trim()}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingTopic ? 'Save Changes' : 'Create Topic'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TopicsPage;
