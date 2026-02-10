import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/shared/Header';
import Button from '@/components/shared/Button';
import { getQuestionCount, getStudentCount, getQuestionsAddedThisWeek, getReportCounts } from '@/lib/db';
import {
  BookOpen,
  HelpCircle,
  Users,
  Plus,
  AlertCircle,
  TrendingUp,
  FileText,
  Upload,
  Loader2,
  Palette,
  FlaskConical
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Stats {
  totalQuestions: number;
  totalStudents: number;
  questionsThisWeek: number;
  pendingReports: number;
}

const AdminCard = ({ title, icon: Icon, desc, link, action, count }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-primary/5 text-primary rounded-lg">
        <Icon className="w-6 h-6" />
      </div>
      {count !== undefined && (
        <span className="text-2xl font-bold text-gray-900">{count}</span>
      )}
      {action && !count && (
        <Link href={action.link}>
          <Button size="sm" variant="outline" className="text-xs">{action.label}</Button>
        </Link>
      )}
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-500 mb-4">{desc}</p>
    <Link href={link} className="text-primary font-semibold text-sm hover:underline">
      Manage &rarr;
    </Link>
  </motion.div>
);

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm"
  >
    <div className="flex items-center gap-4">
      <div className={`p-3 ${color} rounded-lg`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  </motion.div>
);

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [totalQuestions, totalStudents, questionsThisWeek, reportCounts] = await Promise.all([
        getQuestionCount(),
        getStudentCount(),
        getQuestionsAddedThisWeek(),
        getReportCounts()
      ]);

      setStats({
        totalQuestions,
        totalStudents,
        questionsThisWeek,
        pendingReports: reportCounts.pending
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500">Manage content and view statistics.</p>
          </div>
          <Link href="/admin/questions/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Question
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Questions"
              value={stats.totalQuestions}
              icon={HelpCircle}
              color="bg-blue-50 text-blue-600"
              delay={0.1}
            />
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon={Users}
              color="bg-green-50 text-green-600"
              delay={0.2}
            />
            <StatCard
              title="Added This Week"
              value={stats.questionsThisWeek}
              icon={TrendingUp}
              color="bg-purple-50 text-purple-600"
              delay={0.3}
            />
            <StatCard
              title="Pending Reports"
              value={stats.pendingReports}
              icon={AlertCircle}
              color={stats.pendingReports > 0 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600"}
              delay={0.4}
            />
          </div>
        )}

        {/* Quick Actions */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/admin/questions/new"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all"
          >
            <div className="p-2 bg-primary/10 rounded-lg">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <span className="font-medium text-gray-900">Add Question</span>
          </Link>
          <Link
            href="/admin/questions/import"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all"
          >
            <div className="p-2 bg-green-50 rounded-lg">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <span className="font-medium text-gray-900">Bulk Import</span>
          </Link>
          <Link
            href="/admin/subjects"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all"
          >
            <div className="p-2 bg-blue-50 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-medium text-gray-900">Manage Subjects</span>
          </Link>
          <Link
            href="/admin/reports"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all"
          >
            <div className="p-2 bg-orange-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <span className="font-medium text-gray-900">View Reports</span>
          </Link>
          <Link
            href="/admin/templates"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all"
          >
            <div className="p-2 bg-indigo-50 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="font-medium text-gray-900">Test Templates</span>
          </Link>
          <Link
            href="/admin/color-playground"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all"
          >
            <div className="p-2 bg-pink-50 rounded-lg">
              <Palette className="w-5 h-5 text-pink-600" />
            </div>
            <span className="font-medium text-gray-900">Color Playground</span>
          </Link>
          <Link
            href="/admin/roadmap-playground"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all"
          >
            <div className="p-2 bg-violet-50 rounded-lg">
              <FlaskConical className="w-5 h-5 text-violet-600" />
            </div>
            <span className="font-medium text-gray-900">Roadmap Playground</span>
          </Link>
        </div>

        {/* Management Cards */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">Management</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdminCard
            title="Questions Bank"
            desc="Create, edit and organize exam questions."
            icon={HelpCircle}
            link="/admin/questions"
            count={stats?.totalQuestions}
          />
          <AdminCard
            title="Subjects & Topics"
            desc="Manage the curriculum structure."
            icon={BookOpen}
            link="/admin/subjects"
          />
          <AdminCard
            title="Students"
            desc="View registered students and progress."
            icon={Users}
            link="/admin/students"
            count={stats?.totalStudents}
          />
          <AdminCard
            title="Question Reports"
            desc="Review and resolve student-reported issues."
            icon={AlertCircle}
            link="/admin/reports"
            count={stats?.pendingReports}
          />
          <AdminCard
            title="Bulk Import"
            desc="Import multiple questions via CSV file."
            icon={Upload}
            link="/admin/questions/import"
          />
          <AdminCard
            title="Test Templates"
            desc="Create and manage timed test templates."
            icon={FileText}
            link="/admin/templates"
          />
          <AdminCard
            title="Color Playground"
            desc="Explore and compare color palettes for the platform."
            icon={Palette}
            link="/admin/color-playground"
          />
          <AdminCard
            title="Roadmap Playground"
            desc="Test and tune deterministic roadmap generation in playground mode."
            icon={FlaskConical}
            link="/admin/roadmap-playground"
          />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
