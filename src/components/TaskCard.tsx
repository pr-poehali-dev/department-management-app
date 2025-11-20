import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  dueDate: Date;
}

interface TaskCardProps {
  task: Task;
  onTaskUpdated: () => void;
  userRole: string;
  userGroupId: string | null;
}

const TASKS_API_URL = 'https://functions.poehali.dev/80732aa0-05d2-408c-873e-94e2c87320be';

const TaskCard = ({ task, onTaskUpdated, userRole, userGroupId }: TaskCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const canEdit = userRole === 'department_head' || userRole === 'group_head';

  const getStatusBadge = (status: Task['status']) => {
    const variants: Record<Task['status'], { variant: any; label: string }> = {
      completed: { variant: 'default', label: 'Выполнено' },
      'in-progress': { variant: 'secondary', label: 'В работе' },
      pending: { variant: 'outline', label: 'Ожидает' },
      overdue: { variant: 'destructive', label: 'Просрочено' },
    };
    return variants[status];
  };

  const getPriorityColor = (priority: Task['priority']) => {
    const colors: Record<Task['priority'], string> = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600',
    };
    return colors[priority];
  };

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${TASKS_API_URL}/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userRole,
          'X-User-Group-Id': userGroupId || '',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task');
      }

      toast({
        title: 'Успешно!',
        description: 'Статус поручения обновлен',
      });

      onTaskUpdated();
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось обновить поручение',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${TASKS_API_URL}/${task.id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Role': userRole,
          'X-User-Group-Id': userGroupId || '',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete task');
      }

      toast({
        title: 'Успешно!',
        description: 'Поручение удалено',
      });

      onTaskUpdated();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось удалить поручение',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3 mb-2">
                <h3 className="font-semibold text-lg">{task.title}</h3>
                <Badge {...getStatusBadge(task.status)} className="shrink-0">
                  {getStatusBadge(task.status).label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Icon name="User" size={16} className="text-muted-foreground" />
                  <span>{task.assignee}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Calendar" size={16} className="text-muted-foreground" />
                  <span>{format(task.dueDate, 'dd MMM yyyy', { locale: ru })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Flag" size={16} className={getPriorityColor(task.priority)} />
                  <span className={getPriorityColor(task.priority)}>
                    {task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}
                  </span>
                </div>
              </div>
            </div>
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={loading}>
                    <Icon name="MoreVertical" size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleStatusChange('in-progress')}>
                    <Icon name="PlayCircle" size={16} className="mr-2" />
                    В работу
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                    <Icon name="CheckCircle2" size={16} className="mr-2" />
                    Завершить
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('pending')}>
                    <Icon name="Clock" size={16} className="mr-2" />
                    В ожидание
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Icon name="Trash2" size={16} className="mr-2" />
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить поручение?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Поручение "{task.title}" будет удалено безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TaskCard;
