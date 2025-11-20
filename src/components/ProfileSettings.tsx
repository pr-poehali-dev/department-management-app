import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  employeeId: string | null;
  employeeName: string | null;
  position: string | null;
  groupId: string | null;
  groupName: string | null;
}

const EMPLOYEES_API_URL = 'https://functions.poehali.dev/7b3cb6bf-5117-425b-968c-4173f2e6d4f4';

const ProfileSettings = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    position: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setFormData({
        fullName: parsedUser.fullName || '',
        email: '',
        position: parsedUser.position || '',
      });
      
      if (parsedUser.employeeId) {
        fetchEmployeeDetails(parsedUser.employeeId);
      }
    }
  }, []);

  const fetchEmployeeDetails = async (employeeId: string) => {
    try {
      const response = await fetch(`${EMPLOYEES_API_URL}?resource=employees`);
      const data = await response.json();
      const employee = data.employees.find((e: any) => e.id === employeeId);
      
      if (employee) {
        setFormData({
          fullName: employee.fullName || '',
          email: employee.email || '',
          position: employee.position || '',
        });
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.employeeId) {
      toast({
        title: 'Ошибка',
        description: 'Не найден профиль сотрудника',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${EMPLOYEES_API_URL}/${user.employeeId}?resource=employees`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          position: formData.position,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = {
        ...user,
        fullName: formData.fullName,
        position: formData.position,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast({
        title: 'Успешно!',
        description: 'Профиль обновлен',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить профиль',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      department_head: 'Начальник отдела',
      group_head: 'Начальник группы',
      employee: 'Сотрудник',
    };
    return roleLabels[role] || role;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="User" size={24} className="text-primary" />
            </div>
            <div>
              <CardTitle className="font-heading">Настройки профиля</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{getRoleLabel(user.role)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Логин</Label>
                <Input id="username" value={user.username} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Логин нельзя изменить</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">ФИО *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Введите ФИО"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Должность</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Введите должность"
                  disabled={loading}
                />
              </div>

              {user.groupName && (
                <div className="space-y-2">
                  <Label>Группа</Label>
                  <Input value={user.groupName} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Группу может изменить только начальник отдела</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Icon name="Save" size={18} className="mr-2" />
                    Сохранить изменения
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;
