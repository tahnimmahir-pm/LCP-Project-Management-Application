import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { CheckSquare, Plus, Calendar, User, MoreVertical, Edit2, Trash2 } from 'lucide-react';

type Task = Database['public']['Tables']['project_tasks']['Row'] & {
    project: { title: string } | null;
    assignee: { full_name: string } | null;
    pillar: { title: string } | null;
    assignee_ids: string[] | null;
    created_by: string;
};

interface TasksListProps {
    onCreateClick: () => void;
    onEditClick?: (task: Task) => void;
    initialFilter?: 'all' | 'my' | 'created';
}

export default function TasksList({ onCreateClick, onEditClick, initialFilter = 'all' }: TasksListProps) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'my' | 'created'>(initialFilter);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [usersMap, setUsersMap] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchUsers = async () => {
            const { data } = await supabase.from('users').select('id, full_name');
            if (data) {
                const map = data.reduce<Record<string, string>>((acc, user) => ({ ...acc, [user.id]: user.full_name }), {});
                setUsersMap(map);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [filter]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('project_tasks')
                .select(`
          *,
          project:project_id(title, lead_id),
          assignee:assignee_id(full_name),
          pillar:pillar_id(title)
        `)
                .order('due_date', { ascending: true });

            if (filter === 'my' && user) {
                query = query.eq('assignee_id', user.id);
            } else if (filter === 'created' && user) {
                query = query.eq('created_by', user.id);
            }

            const { data, error } = await query;

            if (error) throw error;
            setTasks(data as any || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, taskId: string) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        try {
            const { error } = await supabase
                .from('project_tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;
            fetchTasks(); // Refresh list
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task');
        }
    };

    const handleStatusUpdate = async (e: React.MouseEvent, taskId: string, newStatus: string) => {
        e.stopPropagation();
        try {
            const { error } = await supabase
                .from('project_tasks')
                .update({ status: newStatus as any } as any)
                .eq('id', taskId);

            if (error) throw error;

            // Optimistic update
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'text-red-600 bg-red-50 border-red-200';
            case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'Low': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Done': return 'bg-green-100 text-green-700';
            case 'In Progress': return 'bg-blue-100 text-blue-700';
            case 'In Review': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700'; // Todo
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-gray-500">Loading tasks...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <CheckSquare className="text-lcp-blue" />
                        Task Board
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Manage deliverables and assignments</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-1 flex">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'all' ? 'bg-lcp-blue text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            All Tasks
                        </button>
                        <button
                            onClick={() => setFilter('my')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'my' ? 'bg-lcp-blue text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Assigned to Me
                        </button>
                        <button
                            onClick={() => setFilter('created')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'created' ? 'bg-lcp-blue text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Created by Me
                        </button>
                    </div>

                    <button
                        onClick={onCreateClick}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={20} />
                        <span className="hidden md:inline">New Task</span>
                    </button>
                </div>
            </div>

            {tasks.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckSquare className="text-green-400" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No tasks found</h3>
                    <p className="text-gray-500 mb-6">
                        {filter === 'my' ? "You don't have any assigned tasks." : "No tasks have been created yet."}
                    </p>
                    <button onClick={onCreateClick} className="btn-secondary">
                        Create First Task
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {tasks.map((task) => {
                        const isSuper = user?.role === 'Super User';
                        const isLead = user?.id === (task.project as any)?.lead_id;
                        const isAssignee = user?.id === task.assignee_id || (task.assignee_ids && task.assignee_ids.includes(user?.id || ''));
                        const isCreator = user?.id === task.created_by;

                        const canDelete = isSuper || isLead || isCreator;
                        const canEdit = isSuper || isLead || isAssignee || isCreator;
                        const canChangeStatus = canEdit;

                        return (
                            <div key={task.id} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative">
                                <div className="flex items-start justify-between gap-4 pr-10">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide border ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                            <div className="relative group/status">
                                                <button
                                                    disabled={!canChangeStatus}
                                                    className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${getStatusColor(task.status)} ${canChangeStatus ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                                                >
                                                    {task.status}
                                                </button>
                                                {/* Minimal Status Dropdown on Hover */}
                                                {canChangeStatus && (
                                                    <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 shadow-xl rounded-lg z-20 hidden group-hover/status:block min-w-[120px]">
                                                        {['Todo', 'In Progress', 'In Review', 'Done'].map(s => (
                                                            <button
                                                                key={s}
                                                                onClick={(e) => handleStatusUpdate(e, task.id, s)}
                                                                className={`block w-full text-left px-4 py-2 text-xs hover:bg-gray-50 ${task.status === s ? 'font-bold text-lcp-blue' : 'text-gray-700'}`}
                                                            >
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-400 font-medium">#{task.id.slice(0, 6)}</span>
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                                            {task.title}
                                        </h3>

                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                            <span className="font-medium text-gray-700">{task.project?.title}</span>
                                            {task.pillar && (
                                                <>
                                                    <span className="text-gray-300">•</span>
                                                    <span>{task.pillar.title}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-1 text-sm text-gray-600 mb-1">
                                            <Calendar size={14} className={task.due_date && new Date(task.due_date) < new Date() ? 'text-red-500' : 'text-gray-400'} />
                                            <span className={task.due_date && new Date(task.due_date) < new Date() ? 'text-red-600 font-medium' : ''}>
                                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-end gap-1 text-sm text-gray-600">
                                            <User size={14} className="text-gray-400" />
                                            <span className="max-w-[150px] truncate" title={task.assignee_ids && task.assignee_ids.length > 0 ? task.assignee_ids.map(id => usersMap[id] || 'Unknown').join(', ') : ''}>
                                                {task.assignee_ids && task.assignee_ids.length > 0
                                                    ? task.assignee_ids.map(id => usersMap[id] || 'Unknown').join(', ')
                                                    : (task.assignee?.full_name || 'Unassigned')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Menu (Three Dots) - Absolute Positioned */}
                                {canEdit && (
                                    <div className="absolute top-4 right-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenu(activeMenu === task.id ? null : task.id);
                                            }}
                                            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {activeMenu === task.id && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-30 overflow-hidden">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenu(null);
                                                        if (onEditClick) onEditClick(task);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <Edit2 size={16} /> Edit Task
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        onClick={(e) => {
                                                            handleDelete(e, task.id);
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                                                    >
                                                        <Trash2 size={16} /> Delete Task
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
