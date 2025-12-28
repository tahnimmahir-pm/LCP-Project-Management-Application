import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Users, FolderKanban, CheckSquare, Home, DollarSign } from 'lucide-react';
import PendingApprovals from './PendingApprovals';
import ProjectsList from './ProjectsList';
import CreateProjectModal from './CreateProjectModal';
import TasksList from './TasksList';
import DashboardTaskList from './DashboardTaskList';
import CreateTaskModal from './CreateTaskModal';
import TeamList from './TeamList';
import FinanceList from './FinanceList';
import CreateClaimModal from './CreateClaimModal';

type ViewState = 'dashboard' | 'projects' | 'tasks' | 'team' | 'finance';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [defaultTaskFilter, setDefaultTaskFilter] = useState<'all' | 'my' | 'created'>('all');
  const [showCreateClaim, setShowCreateClaim] = useState(false);

  if (!user) return null;

  const showApprovals = user.role === 'Manager' || user.role === 'Super User';

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${currentView === view
        ? 'bg-white bg-opacity-20 text-white font-medium'
        : 'text-blue-100 hover:bg-white hover:bg-opacity-10'
        }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-lcp-blue text-white shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-4 md:mb-0">
            <div>
              <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <Home className="text-blue-300" />
                LightCastle Partners
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="font-medium">{user.full_name}</p>
                <p className="text-xs text-blue-200">{user.role}</p>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 bg-white bg-opacity-10 hover:bg-opacity-20 px-3 py-1.5 rounded-lg transition-all text-sm"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <NavItem view="dashboard" icon={Home} label="Dashboard" />
            <NavItem view="projects" icon={FolderKanban} label="Projects" />
            <NavItem view="tasks" icon={CheckSquare} label="Tasks" />
            <NavItem view="team" icon={Users} label="Team" />
            <NavItem view="finance" icon={DollarSign} label="Finance" />
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {currentView === 'dashboard' && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Welcome back, {user.full_name.split(' ')[0]}!
              </h2>
              <p className="text-gray-600">Here's what's happening today.</p>
            </div>

            {showApprovals && <PendingApprovals />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              <div
                onClick={() => setCurrentView('projects')}
                className="card hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <FolderKanban className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Projects</h3>
                    <p className="text-gray-500">Manage timelines</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setCurrentView('tasks')}
                className="card hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <CheckSquare className="text-green-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Tasks</h3>
                    <p className="text-gray-500">Track deliverables</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setCurrentView('team')}
                className="card hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Users className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Team</h3>
                    <p className="text-gray-500">View directory</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setCurrentView('finance')}
                className="card hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <DollarSign className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Finance</h3>
                    <p className="text-gray-500">Expense claims</p>
                  </div>
                </div>
              </div>
            </div>

            {/* New Task Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <DashboardTaskList
                title="Tasks Assigned to Me"
                type="assigned_to_me"
                onViewAll={() => {
                  setDefaultTaskFilter('my');
                  setCurrentView('tasks');
                }}
              />
              <DashboardTaskList
                title="Tasks Assigned by Me"
                type="created_by_me"
                onViewAll={() => {
                  setDefaultTaskFilter('created');
                  setCurrentView('tasks');
                }}
              />
            </div>
          </>
        )}

        {currentView === 'projects' && (
          <ProjectsList
            onCreateClick={() => {
              setEditingProject(null);
              setShowCreateProject(true);
            }}
            onEditClick={(project) => {
              setEditingProject(project);
              setShowCreateProject(true);
            }}
          />
        )}

        {currentView === 'tasks' && (
          <TasksList
            initialFilter={defaultTaskFilter}
            onCreateClick={() => {
              setEditingTask(null);
              setShowCreateTask(true);
            }}
            onEditClick={(task) => {
              setEditingTask(task);
              setShowCreateTask(true);
            }}
          />
        )}

        {currentView === 'team' && (
          <TeamList />
        )}

        {currentView === 'finance' && (
          <FinanceList
            onCreateClick={() => setShowCreateClaim(true)}
          />
        )}
      </div>

      {showCreateProject && (
        <CreateProjectModal
          onClose={() => {
            setShowCreateProject(false);
            setEditingProject(null);
          }}
          onSuccess={() => {
            setShowCreateProject(false);
            setEditingProject(null);
            window.location.reload();
          }}
          projectToEdit={editingProject}
        />
      )}

      {showCreateTask && (
        <CreateTaskModal
          onClose={() => {
            setShowCreateTask(false);
            setEditingTask(null);
          }}
          onSuccess={() => {
            setShowCreateTask(false);
            setEditingTask(null);
            window.location.reload();
          }}
          taskToEdit={editingTask}
        />
      )}

      {showCreateClaim && (
        <CreateClaimModal
          onClose={() => setShowCreateClaim(false)}
          onSuccess={() => {
            setShowCreateClaim(false);
            // We don't strictly need reload here since FinanceList fetches on mount, but if we want to reset view
            // window.location.reload(); 
            // Better UX: Just close it. FinanceList should ideally refresh but it's not a child here if we switch views?
            // Since FinanceList is remounted if we stay on view 'finance', it might not refresh.
            // Ideally we pass a key or a callback. But simple reload ensures everything is clean.
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
