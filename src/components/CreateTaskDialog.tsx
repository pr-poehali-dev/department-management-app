import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '@/components/FileUpload';

interface Employee {
  id: string;
  fullName: string;
  email: string;
  position: string;
  groupId: string | null;
  groupName: string | null;
}

interface CreateTaskDialogProps {
  onTaskCreated: () => void;
}

const EMPLOYEES_API_URL = 'https://functions.poehali.dev/7b3cb6bf-5117-425b-968c-4173f2e6d4f4';
const TASKS_API_URL = 'https://functions.poehali.dev/80732aa0-05d2-408c-873e-94e2c87320be';

const CreateTaskDialog = ({ onTaskCreated }: CreateTaskDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dueDate, setDueDate] = useState<Date>();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    assignee: '',
  });
  const [attachments, setAttachments] = useState<Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    uploadedAt: string;
  }>>([]);

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  const fetchEmployees = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      let url = `${EMPLOYEES_API_URL}?resource=employees`;
      
      if (user.role === 'group_head' && user.groupId) {
        url += `&group_id=${user.groupId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список сотрудников',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.assignee || !dueDate) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(TASKS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          assignee: formData.assignee,
          dueDate: dueDate.toISOString(),
          attachments: attachments,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      toast({
        title: 'Успешно!',
        description: 'Поручение создано',
      });

      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        assignee: '',
      });
      setDueDate(undefined);
      setAttachments([]);
      setOpen(false);
      onTaskCreated();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать поручение',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Icon name="Plus" size={20} />
          Новое поручение
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Создать поручение</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Введите название поручения"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Добавьте подробное описание"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Исполнитель *</Label>
              <Select value={formData.assignee} onValueChange={(value) => setFormData({ ...formData, assignee: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите сотрудника" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.fullName}>
                      {emp.fullName} {emp.position ? `— ${emp.position}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Срок выполнения *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Icon name="Calendar" className="mr-2" size={16} />
                    {dueDate ? format(dueDate, 'dd MMMM yyyy', { locale: ru }) : 'Выберите дату'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} locale={ru} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Ожидает</SelectItem>
                  <SelectItem value="in-progress">В работе</SelectItem>
                  <SelectItem value="completed">Выполнено</SelectItem>
                  <SelectItem value="overdue">Просрочено</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Приоритет</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Низкий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="high">Высокий</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Вложения</Label>
            <FileUpload
              attachments={attachments}
              onChange={setAttachments}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Создание...' : 'Создать поручение'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;