import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/shared/Header';
import Button from '../components/shared/Button';
import { LogOut, User as UserIcon, Shield, RefreshCw, Check, AlertTriangle } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { currentUser, isAdmin, refreshProfile } = useAuth();
  const router = useRouter();
  const [repairing, setRepairing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!currentUser) {
      router.replace('/auth');
    }
  }, [currentUser, router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/auth');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleRepairPermissions = async () => {
    if (!currentUser) return;
    setRepairing(true);
    setMessage('');
    try {
        await supabase.from('users').update({ role: 'admin' }).eq('id', currentUser.id);
        await refreshProfile();
        setMessage('Success! You are now an Admin in Supabase.');
    } catch (e: any) {
        console.error(e);
        setMessage('Failed: ' + e.message);
    } finally {
        setRepairing(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="bg-white shadow rounded-2xl p-8 border border-gray-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-gray-100 pb-8">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                <p className="text-gray-500">{currentUser.email}</p>
                {isAdmin ? (
                    <span className="inline-flex items-center mt-1 text-xs font-bold bg-primary text-white px-2 py-0.5 rounded">
                        <Shield className="w-3 h-3 mr-1" /> ADMIN
                    </span>
                ) : (
                    <span className="inline-block mt-1 text-xs font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded">STUDENT</span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleLogout} className="border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
                </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border-2 border-primary/10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Shield className="w-16 h-16 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-primary mb-2">Admin Portal</h2>
                <p className="text-gray-600 text-sm mb-4 relative z-10">Manage questions, users, and app content.</p>
                {isAdmin ? (
                     <Button variant="primary" size="sm" onClick={() => router.push('/admin')}>
                        Access Admin
                    </Button>
                ) : (
                    <div className="space-y-2">
                        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-100 flex items-center gap-2">
                             <AlertTriangle className="w-3 h-3" /> Admin access required
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRepairPermissions} 
                            isLoading={repairing}
                            className="w-full"
                        >
                            <RefreshCw className="w-3 h-3 mr-2" />
                            Repair Permissions
                        </Button>
                        {message && <p className="text-xs text-green-600 font-bold">{message}</p>}
                    </div>
                )}
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-lg font-bold text-primary mb-2">My Assessments</h2>
              <p className="text-gray-600 text-sm mb-4">View your past results and progress.</p>
              <Button variant="outline" className="bg-white" size="sm" onClick={() => router.push('/results')}>View Results</Button>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-lg font-bold text-primary mb-2">Practice Session</h2>
              <p className="text-gray-600 text-sm mb-4">Start a new generated exercise set.</p>
              <Button variant="outline" className="bg-white" size="sm" onClick={() => router.push('/exercise/new')}>Start Practice</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
