import { useState } from 'react';
import { Plus, Filter, Grid, List } from 'lucide-react';
import { KanbanBoard } from '../components/Tasks/KanbanBoard';
import { TaskCard } from '../components/Tasks/TaskCard';
import CreateTaskModal from '../components/Tasks/CreateTaskModal';
import EditTaskModal from '../components/Tasks/EditTaskModal';
import { useAuth } from '../context/AuthContext';
import { useRbac } from '../contexts/RbacContext';
import { mockTasks } from '../data/mockData';
import { Task, TaskStatus, TaskPriority } from '../types';
import { Permission } from '../types/roles';

export function Tasks() {
  const { user } = useAuth();
  const { hasPermission } = useRbac();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Filter tasks based on user role and permissions
  const userTasks = tasks.filter(task => 
    task.assigneeId === user?.id || task.assignerId === user?.id
  );

  const filteredTasks = userTasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    return true;
  });

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'assignerId'>) => {
    if (!user) return;

    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      assignerId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: undefined
    };

    setTasks([...tasks, newTask]);
    setShowCreateModal(false);
  };

  const handleEditTask = (updatedTask: Task) => {
    setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
    setShowEditModal(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  const canEditTask = (task: Task) => {
    if (!user) return false;
    // User can edit if they are the assigner or assigned to the task
    // Or if they have permission to edit all tasks or team tasks
    return (
      task.assignerId === user.id ||
      task.assigneeId === user.id ||
      hasPermission(Permission.EDIT_ALL_TASKS) ||
      hasPermission(Permission.EDIT_TEAM_TASKS)
    );
  };

  const canDeleteTask = (task: Task) => {
    if (!user) return false;
    // User can delete if they are the assigner or have delete permission
    return (
      task.assignerId === user.id ||
      hasPermission(Permission.DELETE_TASKS)
    );
  };

  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task);
    setShowEditModal(true);
  };

  const handleTaskClick = (task: Task) => {
    // In a real app, this would open a task detail modal or navigate to task page
    console.log('Task clicked:', task);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Manage and track your tasks and assignments
          </p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">New Task</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
                className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
                className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-end space-x-2">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Task Views */}
      {viewMode === 'kanban' ? (
        <KanbanBoard 
          tasks={filteredTasks} 
          onTaskClick={handleTaskClick}
          onTaskEdit={handleTaskEdit}
          onTaskDelete={handleDeleteTask}
          canEditTask={canEditTask}
          canDeleteTask={canDeleteTask}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onClick={() => handleTaskClick(task)}
              onEdit={() => handleTaskEdit(task)}
              onDelete={() => handleDeleteTask(task.id)}
              canEdit={canEditTask(task)}
              canDelete={canDeleteTask(task)}
            />
          ))}
        </div>
      )}

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <List className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500 text-sm sm:text-base">
            {statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your filters to see more tasks.'
              : 'Create your first task to get started.'}
          </p>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {/* Edit Task Modal */}
      {showEditModal && selectedTask && (
        <EditTaskModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onSubmit={handleEditTask}
        />
      )}
    </div>
  );
}