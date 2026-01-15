import { useState, useEffect } from 'react';

interface Tool {
  name: string;
  status: 'ready' | 'installing' | 'error' | 'not-installed';
  version?: string;
  path?: string;
}

interface Sprite {
  name: string;
  status: 'running' | 'stopped' | 'unknown';
}

interface Task {
  id: number;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm: string;
}

// Initial data - will be replaced with live API calls
const initialTools: Tool[] = [
  { name: 'agent-browser', status: 'ready', version: '0.5.0', path: '~/.bun/bin/agent-browser' },
  { name: 'vercel', status: 'ready', version: '50.4.0', path: '~/.bun/bin/vercel' },
  { name: 'flyctl', status: 'ready', version: '0.4.3', path: '/opt/homebrew/bin/flyctl' },
  { name: 'sprite', status: 'ready', version: '0.0.1-rc29', path: '~/.local/bin/sprite' },
  { name: 'sqlite3', status: 'ready', version: '3.51.0', path: '/usr/bin/sqlite3' },
  { name: 'node', status: 'ready', version: '22.x', path: '/usr/local/bin/node' },
  { name: 'bun', status: 'ready', path: '/opt/homebrew/bin/bun' },
  { name: 'pnpm', status: 'ready', path: '/opt/homebrew/bin/pnpm' },
];

const initialSprites: Sprite[] = [
  { name: 'behave-data-platform', status: 'stopped' },
  { name: 'behave-platform-data-guide', status: 'stopped' },
];

const initialTasks: Task[] = [
  { id: 1, content: 'Scan environment for available tools', status: 'completed', activeForm: 'Scanning environment' },
  { id: 2, content: 'Install CLI tools', status: 'completed', activeForm: 'Installing tools' },
  { id: 3, content: 'Initialize Astro project', status: 'completed', activeForm: 'Initializing Astro' },
  { id: 4, content: 'Add Shadcn/ui components', status: 'pending', activeForm: 'Adding components' },
  { id: 5, content: 'Set up SQLite with Drizzle ORM', status: 'pending', activeForm: 'Setting up database' },
  { id: 6, content: 'Design agent orchestration layer', status: 'pending', activeForm: 'Designing orchestration' },
];

const statusColors = {
  ready: 'bg-emerald-500',
  running: 'bg-emerald-500',
  installing: 'bg-amber-500',
  stopped: 'bg-slate-500',
  error: 'bg-red-500',
  'not-installed': 'bg-slate-700',
  unknown: 'bg-slate-600',
  completed: 'bg-emerald-500',
  in_progress: 'bg-blue-500',
  pending: 'bg-slate-600',
};

function StatusDot({ status }: { status: string }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-slate-500'}`} />
  );
}

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-lg p-4 ${className}`}>
      <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [tools] = useState<Tool[]>(initialTools);
  const [sprites] = useState<Sprite[]>(initialSprites);
  const [tasks] = useState<Task[]>(initialTasks);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const readyTools = tools.filter(t => t.status === 'ready').length;

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
          <div className="text-3xl font-bold text-emerald-400">{readyTools}/{tools.length}</div>
          <div className="text-slate-400 text-sm">Tools Ready</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{sprites.length}</div>
          <div className="text-slate-400 text-sm">Sprites</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-amber-400">{inProgressTasks}</div>
          <div className="text-slate-400 text-sm">In Progress</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-emerald-400">{completedTasks}/{tasks.length}</div>
          <div className="text-slate-400 text-sm">Completed</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Tools Panel */}
        <Card title="Infrastructure Tools">
          <div className="space-y-2">
            {tools.map((tool) => (
              <div key={tool.name} className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-2">
                  <StatusDot status={tool.status} />
                  <span className="font-mono text-sm">{tool.name}</span>
                </div>
                <span className="text-slate-500 text-xs">{tool.version || '-'}</span>
              </div>
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
                  <span className="font-mono text-sm">{sprite.name}</span>
                </div>
                <span className="text-slate-500 text-xs uppercase">{sprite.status}</span>
              </div>
            ))}
            <button className="w-full mt-3 py-2 px-3 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors">
              + Create New Sprite
            </button>
          </div>
        </Card>

        {/* Tasks Panel */}
        <Card title="Current Tasks">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {tasks.map((task) => (
              <div key={task.id} className={`flex items-start gap-2 py-2 px-3 rounded transition-colors ${
                task.status === 'in_progress' ? 'bg-blue-900/30 border border-blue-800' : 'bg-slate-800/50'
              }`}>
                <StatusDot status={task.status} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {task.content}
                  </div>
                  {task.status === 'in_progress' && (
                    <div className="text-xs text-blue-400 mt-1">{task.activeForm}...</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Agent Browser Quick Actions */}
      <div className="mt-6">
        <Card title="Quick Actions">
          <div className="grid grid-cols-4 gap-3">
            <button className="py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700">
              Run agent-browser
            </button>
            <button className="py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700">
              Start Sprite
            </button>
            <button className="py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700">
              Deploy to Vercel
            </button>
            <button className="py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700">
              View Logs
            </button>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-slate-600 text-sm">
        Behave Digital Factory v0.1.0 | Phase 1: Foundation
      </footer>
    </div>
  );
}
