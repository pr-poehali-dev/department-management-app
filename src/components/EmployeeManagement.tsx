import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  fullName: string;
  email: string;
  position: string;
  groupId: string | null;
  groupName: string | null;
}

interface Group {
  id: string;
  name: string;
  description: string;
  employeeCount: number;
}

const EMPLOYEES_API_URL = 'https://functions.poehali.dev/7b3cb6bf-5117-425b-968c-4173f2e6d4f4';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false);
  const [openGroupDialog, setOpenGroupDialog] = useState(false);
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || '';
  const userGroupId = user.groupId || null;

  const [employeeForm, setEmployeeForm] = useState({
    fullName: '',
    email: '',
    position: '',
    groupId: '',
  });

  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [employeesRes, groupsRes] = await Promise.all([
        fetch(`${EMPLOYEES_API_URL}?resource=employees`),
        fetch(`${EMPLOYEES_API_URL}?resource=groups`),
      ]);

      const employeesData = await employeesRes.json();
      const groupsData = await groupsRes.json();

      setEmployees(employeesData.employees || []);
      setGroups(groupsData.groups || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeForm.fullName) {
      toast({
        title: 'Ошибка',
        description: 'Введите имя сотрудника',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`${EMPLOYEES_API_URL}?resource=employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: employeeForm.fullName,
          email: employeeForm.email,
          position: employeeForm.position,
          groupId: employeeForm.groupId || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create employee');

      toast({
        title: 'Успешно!',
        description: 'Сотрудник добавлен',
      });

      setEmployeeForm({ fullName: '', email: '', position: '', groupId: '' });
      setOpenEmployeeDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error creating employee:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить сотрудника',
        variant: 'destructive',
      });
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupForm.name) {
      toast({
        title: 'Ошибка',
        description: 'Введите название группы',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`${EMPLOYEES_API_URL}?resource=groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupForm.name,
          description: groupForm.description,
        }),
      });

      if (!response.ok) throw new Error('Failed to create group');

      toast({
        title: 'Успешно!',
        description: 'Группа создана',
      });

      setGroupForm({ name: '', description: '' });
      setOpenGroupDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать группу',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого сотрудника?')) return;

    try {
      const response = await fetch(`${EMPLOYEES_API_URL}/${employeeId}?resource=employees`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete employee');

      toast({
        title: 'Успешно!',
        description: 'Сотрудник удален',
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить сотрудника',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту группу? Все сотрудники группы останутся без группы.')) return;

    try {
      const response = await fetch(`${EMPLOYEES_API_URL}/${groupId}?resource=groups`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete group');

      toast({
        title: 'Успешно!',
        description: 'Группа удалена',
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить группу',
        variant: 'destructive',
      });
    }
  };

  const canDeleteEmployee = (employee: Employee): boolean => {
    if (userRole === 'department_head') return true;
    if (userRole === 'group_head' && employee.groupId === userGroupId) return true;
    return false;
  };

  const canAddEmployee = (): boolean => {
    return userRole === 'department_head' || userRole === 'group_head';
  };

  const canDeleteGroup = (): boolean => {
    return userRole === 'department_head';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="employees">Сотрудники</TabsTrigger>
          <TabsTrigger value="groups">Группы</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-heading font-semibold">Сотрудники</h3>
              <p className="text-sm text-muted-foreground">Всего: {employees.length}</p>
            </div>
            {canAddEmployee() && (
              <Dialog open={openEmployeeDialog} onOpenChange={setOpenEmployeeDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Icon name="UserPlus" size={18} />
                  Добавить сотрудника
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">Новый сотрудник</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateEmployee} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">ФИО *</Label>
                    <Input
                      id="fullName"
                      value={employeeForm.fullName}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, fullName: e.target.value })}
                      placeholder="Иванов Иван Иванович"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={employeeForm.email}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                      placeholder="ivanov@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Должность</Label>
                    <Input
                      id="position"
                      value={employeeForm.position}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                      placeholder="Менеджер"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groupId">Группа</Label>
                    <Select value={employeeForm.groupId} onValueChange={(value) => setEmployeeForm({ ...employeeForm, groupId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите группу" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Без группы</SelectItem>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpenEmployeeDialog(false)}>
                      Отмена
                    </Button>
                    <Button type="submit">Добавить</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {employees.map((employee) => (
              <Card key={employee.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon name="User" className="text-primary" size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold">{employee.fullName}</h4>
                        {employee.position && <p className="text-sm text-muted-foreground">{employee.position}</p>}
                      </div>
                    </div>
                    {canDeleteEmployee(employee) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Icon name="Trash2" size={18} />
                      </Button>
                    )}
                  </div>
                  {employee.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Icon name="Mail" size={14} />
                      <span>{employee.email}</span>
                    </div>
                  )}
                  {employee.groupName && (
                    <Badge variant="secondary" className="mt-2">
                      {employee.groupName}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-heading font-semibold">Группы</h3>
              <p className="text-sm text-muted-foreground">Всего: {groups.length}</p>
            </div>
            {userRole === 'department_head' && (
              <Dialog open={openGroupDialog} onOpenChange={setOpenGroupDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Icon name="Plus" size={18} />
                  Создать группу
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">Новая группа</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateGroup} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Название *</Label>
                    <Input
                      id="groupName"
                      value={groupForm.name}
                      onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                      placeholder="Отдел разработки"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groupDescription">Описание</Label>
                    <Input
                      id="groupDescription"
                      value={groupForm.description}
                      onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                      placeholder="Описание группы"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpenGroupDialog(false)}>
                      Отмена
                    </Button>
                    <Button type="submit">Создать</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon name="Users" className="text-primary" size={20} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{group.employeeCount} сотрудников</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                  )}
                  {canDeleteGroup() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-destructive hover:text-destructive w-full"
                    >
                      <Icon name="Trash2" size={16} className="mr-2" />
                      Удалить группу
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeManagement;