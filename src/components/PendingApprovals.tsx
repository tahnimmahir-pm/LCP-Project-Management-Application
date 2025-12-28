import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserCheck, UserX, AlertCircle } from 'lucide-react';
import type { Database } from '../lib/database.types';

type User = Database['public']['Tables']['users']['Row'];

export default function PendingApprovals() {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending users:', error);
    } else {
      const filtered = data?.filter(u => {
        if (currentUser?.role === 'Super User') return true;
        return u.line_manager_id === currentUser?.id;
      }) || [];
      setPendingUsers(filtered);
    }
    setLoading(false);
  };

  const handleApproval = async (userId: string, approved: boolean, newRole?: string) => {
    setProcessingId(userId);

    const updateData: any = {
      status: approved ? 'Active' : 'Rejected'
    };

    if (approved && newRole) {
      updateData.role = newRole;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user status');
    } else {
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    }

    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (pendingUsers.length === 0) {
    return null;
  }

  return (
    <div className="card bg-blue-50 border border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="text-blue-600" size={24} />
        <h3 className="text-xl font-bold text-lcp-blue">Pending User Approvals</h3>
        <span className="ml-auto bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          {pendingUsers.length}
        </span>
      </div>

      <div className="space-y-4">
        {pendingUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-lg text-gray-900">{user.full_name}</h4>
                <p className="text-gray-600 text-sm">{user.email}</p>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    <strong>Role:</strong> {user.role}
                  </span>
                  {user.department && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      <strong>Dept:</strong> {user.department}
                    </span>
                  )}
                  {user.phone && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      <strong>Phone:</strong> {user.phone}
                    </span>
                  )}
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    <strong>Registered:</strong> {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleApproval(user.id, true, user.role)}
                  disabled={processingId === user.id}
                  className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <UserCheck size={18} />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to reject ${user.full_name}'s registration?`)) {
                      handleApproval(user.id, false);
                    }
                  }}
                  disabled={processingId === user.id}
                  className="flex items-center gap-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <UserX size={18} />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
