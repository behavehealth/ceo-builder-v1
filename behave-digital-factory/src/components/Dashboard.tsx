import { useState, useEffect } from 'react';

// Types
interface Task {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  projectId: string;
  createdAt: number;
}

interface Project {
  id: string;
  name: string;
  color: string;
}

interface Sprite {
  name: string;
  status: 'running' | 'stopped';
  url?: string;
}

interface Resource {
  name: string;
  url: string;
  status: 'online' | 'offline';
}

// Initial data
const initialProjects: Project[] = [
  { id: 'infra', name: 'Infrastructure', color: 'blue' },
  { id: 'features', name: 'Features', color: 'emerald' },
  { id: 'docs', name: 'Documentation', color: 'purple' },
];

const initialTasks: Task[] = [
  { id: '1', content: 'Deploy Coder control plane to Sprites', status: 'completed', projectId: 'infra', createdAt: Date.now() - 3600000 },
  { id: '2', content: 'Configure GitHub OAuth for Coder', status: 'completed', projectId: 'infra', createdAt: Date.now() - 3500000 },
  { id: '3', content: 'Set up PlanetScale database', status: 'completed', projectId: 'infra', createdAt: Date.now() - 3400000 },
  { id: '4', content: 'Deploy Command Center to Sprites', status: 'completed', projectId: 'infra', createdAt: Date.now() - 3300000 },
  { id: '5', content: 'Build task tracking system', status: 'in_progress', projectId: 'features', createdAt: Date.now() - 1000 },
  { id: '6', content: 'Add real-time sprite status', status: 'pending', projectId: 'features', createdAt: Date.now() },
  { id: '7', content: 'Integrate Better-T-Stack patterns', status: 'pending', projectId: 'features', createdAt: Date.now() },
];

const sprites: Sprite[] = [
  { name: 'coder-control-plane', status: 'running', url: 'https://coder-control-plane-jmur.sprites.app' },
  { name: 'ceo-command-center', status: 'running', url: 'https://ceo-command-center-jmur.sprites.app' },
  { name: 'behave-data-platform', status: 'running', url: 'https://behave-data-platform-jmur.sprites.app' },
  { name: 'behave-platform-data-guide', status: 'stopped' },
];

const resources: Resource[] = [
  { name: 'Coder', url: 'https://coder-control-plane-jmur.sprites.app', status: 'online' },
  { name: 'Command Center', url: 'https://ceo-command-center-jmur.sprites.app', status: 'online' },
  { name: 'Dev IDE', url: 'http://localhost:8082', status: 'online' },
  { name: 'GitHub Repo', url: 'https://github.com/behavehealth/ceo-builder-v1', status: 'online' },
];

// Helpers
const STORAGE_KEY = 'ceo-command-center-tasks';

function loadTasks(): Task[] {
  if (typeof window === 'undefined') return initialTasks;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : initialTasks;
}

function saveTasks(tasks: Task[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }
}

const projectColors: Record<string, string> = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

const statusColors: Record<string, string> = {
  running: 'bg-emerald-500',
  stopped: 'bg-slate-500',
  online: 'bg-emerald-500',
  offline: 'bg-red-500',
  completed: 'bg-emerald-500',
  in_progress: 'bg-blue-500',
  pending: 'bg-slate-600',
};

// Components
function StatusDot({ status }: { status: string }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${statusColors[status] || 'bg-slate-500'}`} />
  );
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects] = useState<Project[]>(initialProjects);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('features');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [filterProject, setFilterProject] = useState<string | null>(null);

  // Load tasks on mount
  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  // Save tasks when changed
  useEffect(() => {
    if (tasks.length > 0) {
      saveTasks(tasks);
    }
  }, [tasks]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Task operations
  const addTask = () => {
    if (!newTaskContent.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      content: newTaskContent.trim(),
      status: 'pending',
      projectId: newTaskProject,
      createdAt: Date.now(),
    };
    setTasks([...tasks, newTask]);
    setNewTaskContent('');
    setIsAddingTask(false);
  };

  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const cycleStatus = (task: Task) => {
    const order: Task['status'][] = ['pending', 'in_progress', 'completed'];
    const currentIndex = order.indexOf(task.status);
    const nextStatus = order[(currentIndex + 1) % order.length];
    updateTaskStatus(task.id, nextStatus);
  };

  // Stats
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const runningSprites = sprites.filter(s => s.status === 'running').length;

  // Filtered tasks
  const filteredTasks = filterProject
    ? tasks.filter(t => t.projectId === filterProject)
    : tasks;

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const statusOrder = { in_progress: 0, pending: 1, completed: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">CEO Command Center</h1>
            <p className="text-slate-400 text-sm">Behave Digital Design Factory</p>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-sm">{currentTime.toLocaleDateString()}</div>
            <div className="text-xl font-mono text-slate-300">{currentTime.toLocaleTimeString()}</div>
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-emerald-400">{runningSprites}/{sprites.length}</div>
          <div className="text-slate-400 text-sm">Sprites Running</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{inProgressTasks}</div>
          <div className="text-slate-400 text-sm">In Progress</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-amber-400">{tasks.length - completedTasks}</div>
          <div className="text-slate-400 text-sm">Remaining</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-emerald-400">{completedTasks}/{tasks.length}</div>
          <div className="text-slate-400 text-sm">Completed</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Resources Panel */}
        <Card title="Resources">
          <div className="space-y-2">
            {resources.map((resource) => (
              <a
                key={resource.name}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-2 px-3 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <StatusDot status={resource.status} />
                  <span className="text-sm group-hover:text-blue-400 transition-colors">{resource.name}</span>
                </div>
                <span className="text-slate-500 text-xs">↗</span>
              </a>
            ))}
          </div>
        </Card>

        {/* Sprites Panel */}
        <Card title="Fly.io Sprites">
          <div className="space-y-2">
            {sprites.map((sprite) => (
              <div key={sprite.name} className="flex items-center justify-between py-2 px-3 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-2">
                  <StatusDot status={sprite.status} />
                  <span className="font-mono text-sm truncate max-w-[140px]">{sprite.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs uppercase">{sprite.status}</span>
                  {sprite.url && (
                    <a href={sprite.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs">
                      ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Projects Filter */}
        <Card title="Projects">
          <div className="space-y-2">
            <button
              onClick={() => setFilterProject(null)}
              className={`w-full flex items-center justify-between py-2 px-3 rounded transition-colors ${
                filterProject === null ? 'bg-slate-700 border border-slate-600' : 'bg-slate-800/50 hover:bg-slate-800'
              }`}
            >
              <span className="text-sm">All Tasks</span>
              <span className="text-slate-400 text-xs">{tasks.length}</span>
            </button>
            {projects.map((project) => {
              const count = tasks.filter(t => t.projectId === project.id).length;
              return (
                <button
                  key={project.id}
                  onClick={() => setFilterProject(project.id)}
                  className={`w-full flex items-center justify-between py-2 px-3 rounded transition-colors ${
                    filterProject === project.id ? 'bg-slate-700 border border-slate-600' : 'bg-slate-800/50 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${projectColors[project.color]}`} />
                    <span className="text-sm">{project.name}</span>
                  </div>
                  <span className="text-slate-400 text-xs">{count}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Tasks Section */}
      <div className="mt-6">
        <Card
          title={`Tasks ${filterProject ? `- ${projects.find(p => p.id === filterProject)?.name}` : ''}`}
          action={
            <button
              onClick={() => setIsAddingTask(true)}
              className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded transition-colors"
            >
              + Add Task
            </button>
          }
        >
          {/* Add Task Form */}
          {isAddingTask && (
            <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTaskContent}
                  onChange={(e) => setNewTaskContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  placeholder="What needs to be done?"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <select
                  value={newTaskProject}
                  onChange={(e) => setNewTaskProject(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsAddingTask(false)}
                  className="text-xs text-slate-400 hover:text-slate-300 px-3 py-1"
                >
                  Cancel
                </button>
                <button
                  onClick={addTask}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded"
                >
                  Add Task
                </button>
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sortedTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No tasks yet. Click "+ Add Task" to create one.
              </div>
            ) : (
              sortedTasks.map((task) => {
                const project = projects.find(p => p.id === task.projectId);
                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 py-2 px-3 rounded transition-colors group ${
                      task.status === 'in_progress'
                        ? 'bg-blue-900/30 border border-blue-800'
                        : 'bg-slate-800/50 hover:bg-slate-800'
                    }`}
                  >
                    <button
                      onClick={() => cycleStatus(task)}
                      className="mt-0.5 focus:outline-none"
                      title="Click to change status"
                    >
                      <StatusDot status={task.status} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {task.content}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {project && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${projectColors[project.color]} bg-opacity-20 text-${project.color}-400`}>
                            {project.name}
                          </span>
                        )}
                        {task.status === 'in_progress' && (
                          <span className="text-xs text-blue-400">In progress...</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all text-xs"
                      title="Delete task"
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <Card title="Quick Actions">
          <div className="grid grid-cols-4 gap-3">
            <a
              href="https://coder-control-plane-jmur.sprites.app"
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700 text-center"
            >
              Open Coder
            </a>
            <a
              href="http://localhost:8082"
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700 text-center"
            >
              Open Dev IDE
            </a>
            <a
              href="https://github.com/behavehealth/ceo-builder-v1"
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700 text-center"
            >
              GitHub Repo
            </a>
            <a
              href="https://app.planetscale.com"
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700 text-center"
            >
              PlanetScale
            </a>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-slate-600 text-sm">
        Behave Digital Factory v0.2.0 | CEO Command Center
      </footer>
    </div>
  );
}
