
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  canEditTask?: (task: Task) => boolean;
  canDeleteTask?: (task: Task) => boolean;
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'not_started', title: 'Not Started', color: 'border-gray-300' },
  { id: 'in_progress', title: 'In Progress', color: 'border-blue-300' },
  { id: 'in_review', title: 'In Review', color: 'border-yellow-300' },
  { id: 'completed', title: 'Completed', color: 'border-green-300' },
];

export function KanbanBoard({ 
  tasks, 
  onTaskClick, 
  onTaskEdit, 
  onTaskDelete, 
  canEditTask, 
  canDeleteTask 
}: KanbanBoardProps) {
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:gap-6">
      <div className="flex lg:contents space-x-4 lg:space-x-0 overflow-x-auto pb-4 lg:pb-0">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          
          return (
            <div key={column.id} className="bg-gray-50 rounded-lg p-4 min-w-[280px] lg:min-w-0 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-sm lg:text-base">{column.title}</h3>
                <span className="bg-gray-200 text-gray-700 text-xs lg:text-sm px-2 py-1 rounded-full">
                  {columnTasks.length}
                </span>
              </div>
              
              <div className="space-y-3 max-h-[60vh] lg:max-h-[70vh] overflow-y-auto">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick?.(task)}
                    onEdit={() => onTaskEdit?.(task)}
                    onDelete={() => onTaskDelete?.(task.id)}
                    canEdit={canEditTask?.(task) || false}
                    canDelete={canDeleteTask?.(task) || false}
                  />
                ))}
                
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}