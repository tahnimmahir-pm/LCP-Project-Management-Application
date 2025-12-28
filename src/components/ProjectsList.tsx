import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { FolderKanban, Plus, Calendar, User, ExternalLink, MoreVertical, Edit2, Trash2 } from 'lucide-react';

type Project = Database['public']['Tables']['projects']['Row'] & {
    lead?: { full_name: string } | null;
};

interface ProjectsListProps {
    onCreateClick: () => void;
    onEditClick?: (project: Project) => void;
}

export default function ProjectsList({ onCreateClick, onEditClick }: ProjectsListProps) {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select(`
          *,
          lead:lead_id(full_name)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const projectsWithProgress = await Promise.all((data || []).map(async (project: any) => {
                const { data: progress } = await supabase
                    .rpc('get_project_progress', { p_id: project.id } as any);
                return { ...project, progress: progress || 0 };
            }));

            setProjects(projectsWithProgress);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this project? This will verify delete all associated pillars and tasks.')) return;

        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId);

            if (error) throw error;
            fetchProjects(); // Refresh list
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Failed to delete project');
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading projects...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FolderKanban className="text-lcp-blue" />
                    Active Projects
                </h2>
                <button
                    onClick={onCreateClick}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    <span>New Project</span>
                </button>
            </div>

            {projects.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FolderKanban className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No projects yet</h3>
                    <p className="text-gray-500 mb-6">Create your first project to get started.</p>
                    <button onClick={onCreateClick} className="btn-secondary">
                        Create Project
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => {
                        const canManage = user?.role === 'Super User' || user?.id === project.lead_id;

                        return (
                            <div key={project.id} className="card hover:shadow-lg transition-all group relative">
                                <div className="flex items-start justify-between mb-4 pr-8">
                                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                                        {project.status}
                                    </div>
                                    {project.drive_folder_url && (
                                        <a
                                            href={project.drive_folder_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-400 hover:text-lcp-blue p-1"
                                            title="Open Drive Folder"
                                        >
                                            <ExternalLink size={18} />
                                        </a>
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-lcp-blue transition-colors">
                                    {project.title}
                                </h3>

                                <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                                    {project.description || 'No description provided.'}
                                </p>

                                <div className="space-y-2 border-t pt-4">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <User size={16} className="mr-2" />
                                        <span>Lead: {project.lead?.full_name || 'Unassigned'}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Calendar size={16} className="mr-2" />
                                        <span>
                                            {project.end_date
                                                ? `Due ${new Date(project.end_date).toLocaleDateString()}`
                                                : 'No deadline'}
                                        </span>
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-semibold text-gray-700">Progress</span>
                                            <span className="text-xs font-bold text-lcp-yellow">{(project as any).progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className="bg-lcp-yellow h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${(project as any).progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Menu */}
                                {canManage && (
                                    <div className="absolute top-4 right-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenu(activeMenu === project.id ? null : project.id);
                                            }}
                                            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {activeMenu === project.id && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-30 overflow-hidden">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenu(null);
                                                        if (onEditClick) onEditClick(project);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <Edit2 size={16} /> Edit Project
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        handleDelete(e, project.id);
                                                        setActiveMenu(null);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                                                >
                                                    <Trash2 size={16} /> Delete Project
                                                </button>
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
