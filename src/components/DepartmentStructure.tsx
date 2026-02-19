import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_URLS } from '@/config/api';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  email: string;
}

interface GroupStructure {
  groupId: string;
  groupName: string;
  description: string;
  managerId: string | null;
  managerName: string | null;
  managerPosition: string | null;
  employeeCount: number;
  employees: Employee[];
}

const EMPLOYEES_API_URL = API_URLS.employees;

const DepartmentStructure = () => {
  const [structure, setStructure] = useState<GroupStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStructure();
  }, []);

  const fetchStructure = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${EMPLOYEES_API_URL}?resource=department-structure`);
      const data = await response.json();
      setStructure(data.structure || []);
    } catch (error) {
      console.error('Error fetching structure:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить структуру отдела',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-heading font-bold">Структура отдела</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Иерархия групп и сотрудников
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Icon name="Users" size={16} className="mr-2" />
          {structure.reduce((sum, g) => sum + g.employeeCount, 0)} сотрудников
        </Badge>
      </div>

      <div className="space-y-6">
        {structure.map((group) => (
          <Card key={group.groupId} className="overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="Building2" className="text-primary" size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-heading">{group.groupName}</CardTitle>
                    {group.description && (
                      <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {group.employeeCount} {group.employeeCount === 1 ? 'сотрудник' : 'сотрудников'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {group.managerName && (
                <div className="mb-6 pb-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Icon name="Crown" className="text-amber-600" size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{group.managerName}</p>
                        <Badge variant="default" className="text-xs">
                          Начальник группы
                        </Badge>
                      </div>
                      {group.managerPosition && (
                        <p className="text-sm text-muted-foreground">{group.managerPosition}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {group.employees && group.employees.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {group.employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon name="User" className="text-primary" size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{employee.fullName}</p>
                        {employee.position && (
                          <p className="text-sm text-muted-foreground truncate">{employee.position}</p>
                        )}
                        {employee.email && (
                          <div className="flex items-center gap-1 mt-1">
                            <Icon name="Mail" size={12} className="text-muted-foreground" />
                            <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="Users" className="mx-auto mb-2" size={32} />
                  <p className="text-sm">В группе пока нет сотрудников</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {structure.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Icon name="Building2" className="mx-auto text-muted-foreground mb-3" size={48} />
            <p className="text-muted-foreground">Структура отдела не настроена</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DepartmentStructure;