import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import EmployeeManagement from '@/components/EmployeeManagement';
import DepartmentStructure from '@/components/DepartmentStructure';
import TaskCard from '@/components/TaskCard';
import ProfileSettings from '@/components/ProfileSettings';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  dueDate: Date;
  createdAt: Date;
  updatedAt?: Date;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    uploadedAt: string;
  }>;
}

const API_URL = 'https://functions.poehali.dev/80732aa0-05d2-408c-873e-94e2c87320be';

const Index = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignees, setAssignees] = useState<string[]>([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      const data = await response.json();
      const tasksData = data.tasks.map((task: any) => ({
        ...task,
        dueDate: new Date(task.dueDate),
        createdAt: new Date(task.createdAt),
        updatedAt: task.updatedAt ? new Date(task.updatedAt) : undefined,
      }));
      setTasks(tasksData);
      
      const uniqueAssignees = Array.from(new Set(tasksData.map((t: Task) => t.assignee)));
      setAssignees(uniqueAssignees);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;
  const overdueTasks = tasks.filter((t) => t.status === 'overdue').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const totalTasks = tasks.length;
  const completionRate = Math.round((completedTasks / totalTasks) * 100);

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesAssignee = filterAssignee === 'all' || task.assignee === filterAssignee;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignee.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesAssignee && matchesSearch;
  });

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

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      'department_head': 'Начальник отдела',
      'group_head': 'Начальник группы',
      'employee': 'Сотрудник'
    };
    return roleLabels[role] || role;
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('sessionToken');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка поручений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold font-heading text-foreground">Управление поручениями</h1>
            <p className="text-muted-foreground mt-1">Отслеживайте выполнение задач в реальном времени</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <Icon name="LogOut" size={16} />
              Выход
            </Button>
          </div>
        </div>
        <CreateTaskDialog onTaskCreated={fetchTasks} />

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-4xl grid-cols-6">
            <TabsTrigger value="dashboard">Дашборд</TabsTrigger>
            <TabsTrigger value="tasks">Поручения</TabsTrigger>
            <TabsTrigger value="calendar">Календарь</TabsTrigger>
            <TabsTrigger value="employees">Сотрудники</TabsTrigger>
            <TabsTrigger value="structure">Структура</TabsTrigger>
            <TabsTrigger value="profile">Профиль</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="animate-scale-in" style={{ animationDelay: '0ms' }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Всего поручений</CardTitle>
                  <Icon name="FileText" className="text-primary" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-heading">{totalTasks}</div>
                  <Progress value={100} className="mt-3" />
                </CardContent>
              </Card>

              <Card className="animate-scale-in" style={{ animationDelay: '100ms' }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Выполнено</CardTitle>
                  <Icon name="CheckCircle2" className="text-green-600" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-heading text-green-600">{completedTasks}</div>
                  <Progress value={completionRate} className="mt-3" />
                  <p className="text-xs text-muted-foreground mt-2">{completionRate}% от общего числа</p>
                </CardContent>
              </Card>

              <Card className="animate-scale-in" style={{ animationDelay: '200ms' }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">В работе</CardTitle>
                  <Icon name="Clock" className="text-blue-600" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-heading text-blue-600">{inProgressTasks}</div>
                  <Progress value={(inProgressTasks / totalTasks) * 100} className="mt-3" />
                </CardContent>
              </Card>

              <Card className="animate-scale-in" style={{ animationDelay: '300ms' }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Просрочено</CardTitle>
                  <Icon name="AlertCircle" className="text-red-600" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-heading text-red-600">{overdueTasks}</div>
                  <Progress value={(overdueTasks / totalTasks) * 100} className="mt-3" />
                  <p className="text-xs text-red-600 mt-2">Требуют внимания</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="font-heading">Распределение по статусам</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-600"></div>
                        <span className="text-sm">Выполнено</span>
                      </div>
                      <span className="font-semibold">{completedTasks}</span>
                    </div>
                    <Progress value={(completedTasks / totalTasks) * 100} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                        <span className="text-sm">В работе</span>
                      </div>
                      <span className="font-semibold">{inProgressTasks}</span>
                    </div>
                    <Progress value={(inProgressTasks / totalTasks) * 100} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span className="text-sm">Ожидает</span>
                      </div>
                      <span className="font-semibold">{pendingTasks}</span>
                    </div>
                    <Progress value={(pendingTasks / totalTasks) * 100} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-600"></div>
                        <span className="text-sm">Просрочено</span>
                      </div>
                      <span className="font-semibold">{overdueTasks}</span>
                    </div>
                    <Progress value={(overdueTasks / totalTasks) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="font-heading">Последние активности</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          task.status === 'completed'
                            ? 'bg-green-600'
                            : task.status === 'overdue'
                            ? 'bg-red-600'
                            : 'bg-blue-600'
                        }`}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.assignee}</p>
                      </div>
                      <Badge {...getStatusBadge(task.status)} className="text-xs">
                        {getStatusBadge(task.status).label}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  <CardTitle className="font-heading">Список поручений</CardTitle>
                  <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:flex-initial lg:w-64">
                      <Icon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        placeholder="Поиск..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full lg:w-40">
                        <SelectValue placeholder="Статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все статусы</SelectItem>
                        <SelectItem value="completed">Выполнено</SelectItem>
                        <SelectItem value="in-progress">В работе</SelectItem>
                        <SelectItem value="pending">Ожидает</SelectItem>
                        <SelectItem value="overdue">Просрочено</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger className="w-full lg:w-40">
                        <SelectValue placeholder="Приоритет" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все приоритеты</SelectItem>
                        <SelectItem value="high">Высокий</SelectItem>
                        <SelectItem value="medium">Средний</SelectItem>
                        <SelectItem value="low">Низкий</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                      <SelectTrigger className="w-full lg:w-48">
                        <SelectValue placeholder="Исполнитель" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все исполнители</SelectItem>
                        {assignees.map((assignee) => (
                          <SelectItem key={assignee} value={assignee}>
                            {assignee}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon name="Inbox" className="mx-auto text-muted-foreground mb-3" size={48} />
                    <p className="text-muted-foreground">Поручений не найдено</p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onTaskUpdated={fetchTasks}
                      userRole={user.role}
                      userGroupId={user.groupId}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6 animate-fade-in">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="font-heading">Календарь</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={ru}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="font-heading">
                    Поручения на {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: ru }) : 'выбранную дату'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tasks
                    .filter((task) => selectedDate && task.dueDate.toDateString() === selectedDate.toDateString())
                    .map((task) => (
                      <Card key={task.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{task.title}</h3>
                                <Badge {...getStatusBadge(task.status)} className="text-xs">
                                  {getStatusBadge(task.status).label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                              <div className="flex items-center gap-2 text-sm">
                                <Icon name="User" size={14} className="text-muted-foreground" />
                                <span>{task.assignee}</span>
                              </div>
                            </div>
                            <Icon name="Flag" size={20} className={getPriorityColor(task.priority)} />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {selectedDate &&
                    tasks.filter((task) => task.dueDate.toDateString() === selectedDate.toDateString()).length === 0 && (
                      <div className="text-center py-12">
                        <Icon name="CalendarOff" className="mx-auto text-muted-foreground mb-3" size={48} />
                        <p className="text-muted-foreground">На эту дату поручений нет</p>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Ближайшие дедлайны</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks
                    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
                    .slice(0, 5)
                    .map((task) => (
                      <div key={task.id} className="flex items-center gap-4 pb-4 border-b last:border-0">
                        <div className="flex flex-col items-center justify-center min-w-[60px] p-2 bg-primary/10 rounded-lg">
                          <span className="text-2xl font-bold text-primary">{format(task.dueDate, 'dd')}</span>
                          <span className="text-xs text-muted-foreground">{format(task.dueDate, 'MMM', { locale: ru })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{task.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Icon name="User" size={14} className="text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{task.assignee}</span>
                          </div>
                        </div>
                        <Badge {...getStatusBadge(task.status)}>{getStatusBadge(task.status).label}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6 animate-fade-in">
            <EmployeeManagement />
          </TabsContent>

          <TabsContent value="structure" className="space-y-6 animate-fade-in">
            <DepartmentStructure />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6 animate-fade-in">
            <ProfileSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;