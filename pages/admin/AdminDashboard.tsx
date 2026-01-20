import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/shared/Header';
import { BookOpen, HelpCircle, Users, BarChart3, Plus } from 'lucide-react';
import Button from '../../components/shared/Button';

const AdminCard = ({ title, icon: Icon, desc, link, action }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-primary/5 text-primary rounded-lg">
        <Icon className="w-6 h-6" />
      </div>
      {action && (
        <Link to={action.link}>
            <Button size="sm" variant="outline" className="text-xs">{action.label}</Button>
        </Link>
      )}
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-500 mb-4">{desc}</p>
    <Link to={link} className="text-primary font-semibold text-sm hover:underline">
      Manage &rarr;
    </Link>
  </div>
);

const AdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500">Manage content and view statistics.</p>
            </div>
            <Link to="/admin/questions/new">
                <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Question
                </Button>
            </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AdminCard 
                title="Questions Bank"
                desc="Create, edit and organize exam questions."
                icon={HelpCircle}
                link="/admin/questions"
                action={{ label: 'Add New', link: '/admin/questions/new' }}
            />
            {/* 
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
            />
             */}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;