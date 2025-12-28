import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';

interface CreateTaskModalProps {
    onClose: () => void;
    onSuccess: () => void;
    taskToEdit?: any; // Optional for Edit Mode
}

interface Project {
    id: string;
    title: string;
}

interface Pillar {
    id: string;
    title: string;
}

interface Assignee {
    id: string;
    full_name: string;
}

export default function CreateTaskModal({ onClose, onSuccess, taskToEdit }: CreateTaskModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Dropdown Data
    const [projects, setProjects] = useState<Project[]>([]);
    const [pillars, setPillars] = useState<Pillar[]>([]);
    const [assignees, setAssignees] = useState<Assignee[]>([]);

    // Selection Logic
    const [selectedProject, setSelectedProject] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        pillar_id: '',
        assignee_ids: [] as string[], // Changed to array
        status: 'Todo',
        priority: 'Medium',
        due_date: ''
    });

    // Load data if editing
    useEffect(() => {
        if (taskToEdit) {
            setSelectedProject(taskToEdit.project_id);
            setFormData({
                title: taskToEdit.title,
                description: taskToEdit.description || '',
                pillar_id: taskToEdit.pillar_id || '',
                assignee_ids: taskToEdit.assignee_ids || (taskToEdit.assignee_id ? [taskToEdit.assignee_id] : []),
                status: taskToEdit.status,
                priority: taskToEdit.priority,
                due_date: taskToEdit.due_date ? taskToEdit.due_date.split('T')[0] : ''
            });
        }
    }, [taskToEdit]);

    useEffect(() => {
        fetchProjects();
        fetchAssignees();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            fetchPillars(selectedProject);
        } else {
            setPillars([]);
        }
    }, [selectedProject]);

    const fetchProjects = async () => {
        const { data } = await supabase
            .from('projects')
            .select('id, title, lead_id, lead:lead_id(role)')
            .eq('status', 'Active')
            .order('title');

        if (data) {
            // Filter: 
            // 1. Super Users see all
            // 2. Managers see projects they Lead OR projects Led by Super Users
            const isSuperUser = user?.role === 'Super User';

            const allowedProjects = isSuperUser
                ? data
                : data.filter((p: any) =>
                    p.lead_id === user?.id ||
                    p.lead?.role === 'Super User'
                );

            setProjects(allowedProjects);
        }
    };

    const fetchPillars = async (projectId: string) => {
        const { data } = await supabase
            .from('project_pillars')
            .select('id, title')
            .eq('project_id', projectId)
            .order('title');

        if (data) setPillars(data);
    };

    const fetchAssignees = async () => {
        // Line Manager Constraint:
        // Managers can only assign to their direct reports (users who selected them as Line Manager).
        // Super Users can assign to anyone.

        const isSuperUser = user?.role === 'Super User';

        let query = supabase
            .from('users')
            .select('id, full_name')
            .eq('status', 'Active')
            .order('full_name');

        if (!isSuperUser && user) {
            // Constrain to direct reports
            query = query.eq('line_manager_id', user.id);
        }

        const { data } = await query;
        if (data) setAssignees(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!selectedProject) throw new Error('Project is required');

            const payload = {
                title: formData.title,
                description: formData.description,
                project_id: selectedProject,
                pillar_id: formData.pillar_id || null, // Allow generic tasks without pillar
                assignee_ids: formData.assignee_ids, // Use array
                assignee_id: null, // Legacy field null
                created_by: taskToEdit ? undefined : user?.id, // Don't overwrite creator on edit
                status: formData.status as any,
                priority: formData.priority as any,
                due_date: formData.due_date || null
            };

            let error;

            if (taskToEdit) {
                // UPDATE
                const { error: updateError } = await supabase
                    .from('project_tasks')
                    .update(payload as any)
                    .eq('id', taskToEdit.id);
                error = updateError;
            } else {
                // INSERT
                const { error: insertError } = await supabase
                    .from('project_tasks')
                    .insert({ ...payload, created_by: user?.id } as any);
                error = insertError;
            }

            if (error) throw error;
            onSuccess();
        } catch (err: any) {
            console.error('Error saving task:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {taskToEdit ? 'Edit Task' : 'Create New Task'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
                                <select
                                    className="input-field"
                                    value={selectedProject}
                                    onChange={e => setSelectedProject(e.target.value)}
                                    required
                                >
                                    <option value="">Select Project</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pillar</label>
                                <select
                                    className="input-field"
                                    value={formData.pillar_id}
                                    onChange={e => setFormData({ ...formData, pillar_id: e.target.value })}
                                    disabled={!selectedProject}
                                >
                                    <option value="">Select Project Pillar</option>
                                    {pillars.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="What needs to be done?"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                className="input-field h-24"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Add details, acceptance criteria, etc."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assignees (Multi-select)</label>
                                <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50">
                                    {assignees.length === 0 ? (
                                        <p className="text-gray-500 text-sm italic">
                                            {user?.role === 'Manager'
                                                ? "No employees have selected you as their Line Manager."
                                                : "No active users found."}
                                        </p>
                                    ) : (
                                        assignees.map(a => (
                                            <label key={a.id} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-white rounded px-1 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.assignee_ids.includes(a.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({ ...formData, assignee_ids: [...formData.assignee_ids, a.id] });
                                                        } else {
                                                            setFormData({ ...formData, assignee_ids: formData.assignee_ids.filter(id => id !== a.id) });
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-lcp-blue focus:ring-lcp-blue"
                                                />
                                                <span className="text-sm text-gray-700">{a.full_name}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {user?.role === 'Manager' ? "Showing only your direct reports." : "Select one or more assignees."}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={formData.due_date}
                                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select
                                    className="input-field"
                                    value={formData.priority}
                                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    className="input-field"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Todo">Todo</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="In Review">In Review</option>
                                    <option value="Done">Done</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button onClick={onClose} type="button" className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                            >
                                {loading ? 'Saving...' : (taskToEdit ? 'Save Changes' : 'Create Task')}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
