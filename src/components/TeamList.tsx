import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { Mail, User, Shield, Briefcase } from 'lucide-react';

type UserProfile = Database['public']['Tables']['users']['Row'];

export default function TeamList() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'Managers' | 'Members'>('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('full_name');

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching team:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        if (filter === 'all') return true;
        if (filter === 'Managers') return user.role === 'Manager' || user.role === 'Super User';
        return !['Manager', 'Super User'].includes(user.role); // Everyone else matches "Members" filter
    });

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'Super User': return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'Manager': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'Project Lead': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
            case 'Finance': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200'; // Regular User
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-700';
            case 'Pending': return 'bg-yellow-100 text-yellow-700';
            case 'Inactive': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-gray-500">Loading directory...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <User className="text-lcp-blue" />
                        Team Directory
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">View all team members and roles</p>
                </div>

                <div className="flex bg-white border border-gray-200 rounded-lg p-1 w-fit">
                    {(['all', 'Managers', 'Members'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === type ? 'bg-lcp-blue text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {type === 'all' ? 'All Staff' : type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                    <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-600">
                                {user.full_name?.charAt(0) || 'U'}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(user.status)}`}>
                                {user.status}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-800 mb-1">{user.full_name}</h3>

                        <div className="flex items-center gap-2 mb-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide border ${getRoleColor(user.role)}`}>
                                {user.role}
                            </span>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail size={14} className="text-gray-400" />
                                <a href={`mailto:${user.email}`} className="hover:text-lcp-blue truncate">
                                    {user.email}
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
