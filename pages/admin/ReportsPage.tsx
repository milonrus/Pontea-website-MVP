import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/shared/Header';
import Button from '../../components/shared/Button';
import { getReports, updateReport, deleteReport, getQuestion } from '../../services/db';
import { QuestionReport, QuestionModel } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Eye,
  Trash2,
  Loader2,
  X,
  Save,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'pending' | 'reviewed' | 'resolved' | 'all';

const ReportsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [selectedReport, setSelectedReport] = useState<QuestionReport | null>(null);
  const [question, setQuestion] = useState<QuestionModel | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [counts, setCounts] = useState({ pending: 0, reviewed: 0, resolved: 0, all: 0 });

  useEffect(() => {
    loadReports();
  }, [activeTab]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const status = activeTab === 'all' ? undefined : activeTab;
      const data = await getReports(status);
      setReports(data);

      // Load counts for tabs
      const allReports = await getReports();
      setCounts({
        pending: allReports.filter(r => r.status === 'pending').length,
        reviewed: allReports.filter(r => r.status === 'reviewed').length,
        resolved: allReports.filter(r => r.status === 'resolved').length,
        all: allReports.length
      });
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReportDetail = async (report: QuestionReport) => {
    setSelectedReport(report);
    setAdminNotes(report.adminNotes || '');
    try {
      const q = await getQuestion(report.questionId);
      setQuestion(q);
    } catch (error) {
      console.error('Error loading question:', error);
    }
  };

  const handleStatusChange = async (status: 'reviewed' | 'resolved') => {
    if (!selectedReport || !currentUser) return;
    setSaving(true);
    try {
      await updateReport(selectedReport.id, {
        status,
        adminNotes,
        reviewedBy: currentUser.uid
      });
      setSelectedReport(null);
      setQuestion(null);
      loadReports();
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    try {
      await deleteReport(reportId);
      loadReports();
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Eye className="w-3 h-3" /> Reviewed
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" /> Resolved
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'reviewed', label: 'Reviewed' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'all', label: 'All' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <Link to="/admin" className="hover:text-primary">Admin</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Question Reports</span>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Question Reports</h1>
          <p className="text-gray-500">Review and resolve student-reported issues with questions.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-500">
              {activeTab === 'pending'
                ? 'No pending reports to review.'
                : `No ${activeTab} reports at this time.`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {reports.map(report => (
              <div
                key={report.id}
                className="flex items-center justify-between px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => openReportDetail(report)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    {getStatusBadge(report.status)}
                    <span className="text-xs text-gray-400">{formatDate(report.createdAt)}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {report.questionText.substring(0, 100)}...
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>Reported by: {report.reporterName}</span>
                    <span>Reason: {report.reason}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(report.id); }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Report Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => { setSelectedReport(null); setQuestion(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Report Details</h2>
                <button
                  onClick={() => { setSelectedReport(null); setQuestion(null); }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Report Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    {getStatusBadge(selectedReport.status)}
                    <span className="text-xs text-gray-500">{formatDate(selectedReport.createdAt)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Reporter:</span>
                      <span className="ml-2 font-medium">{selectedReport.reporterName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Reason:</span>
                      <span className="ml-2 font-medium">{selectedReport.reason}</span>
                    </div>
                  </div>
                </div>

                {/* Question Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Reported Question</h3>
                    <Link
                      to={`/admin/questions/${selectedReport.questionId}/edit`}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Edit Question <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-900">{selectedReport.questionText}</p>
                    {question && (
                      <div className="mt-4 space-y-2">
                        {question.options.map(opt => (
                          <div
                            key={opt.id}
                            className={`flex items-center gap-2 text-sm ${
                              opt.id === question.correctAnswer ? 'text-green-600 font-medium' : 'text-gray-600'
                            }`}
                          >
                            <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-bold">
                              {opt.id.toUpperCase()}
                            </span>
                            {opt.text}
                            {opt.id === question.correctAnswer && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Admin Notes
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                    placeholder="Add notes about this report..."
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => { setSelectedReport(null); setQuestion(null); }}
                  >
                    Cancel
                  </Button>
                  {selectedReport.status !== 'reviewed' && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange('reviewed')}
                      isLoading={saving}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Mark as Reviewed
                    </Button>
                  )}
                  {selectedReport.status !== 'resolved' && (
                    <Button
                      onClick={() => handleStatusChange('resolved')}
                      isLoading={saving}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Resolved
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportsPage;
