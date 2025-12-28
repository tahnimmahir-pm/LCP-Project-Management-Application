import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DashboardTaskListProps {
    title: string;
    type: 'assigned_to_me' | 'created_by_me';
    onViewAll: () => void;
}

export default function DashboardTaskList({ title, type, onViewAll }: DashboardTaskListProps) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchTasks();
        }
    }, [user]);

    const fetchTasks = async () => {
        if (!user) return;

        try {
            let query = supabase
                .from('project_tasks')
                .select(`
          id,
          title,
          status,
          priority,
          due_date,
          assignee_ids,
          assignee:assignee_id(full_name)
        `)
                .order('due_date', { ascending: true })
                .limit(5);

            if (type === 'assigned_to_me') {
                // Updated for Multi-Assignee: ID in array OR legacy single ID
                query = query.or(`assignee_id.eq.${user.id},assignee_ids.cs.{${user.id}}`);
            } else {
                query = query.eq('created_by', user.id);
            }

            const { data, error } = await query;
            if (error) throw error;
            setTasks(data || []);
        } catch (error) {
            console.error('Error fetching dashboard tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Done': return 'bg-green-100 text-green-700';
            case 'In Progress': return 'bg-blue-100 text-blue-700';
            case 'In Review': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">{title}</h3>
                <button
                    onClick={onViewAll}
                    className="text-xs text-lcp-blue hover:underline flex items-center gap-1"
                >
                    View All <ArrowRight size={12} />
                </button>
            </div>

            <div className="flex-1 p-2">
                {tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                        <p className="text-sm">No tasks found</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {tasks.map(task => (
                            <div key={task.id} className="p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-medium text-gray-800 text-sm line-clamp-1">{task.title}</h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(task.status)}`}>
                                        {task.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} className={task.due_date && new Date(task.due_date) < new Date() ? 'text-red-400' : ''} />
                                        <span className={task.due_date && new Date(task.due_date) < new Date() ? 'text-red-500 font-medium' : ''}>
                                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
