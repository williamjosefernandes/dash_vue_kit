export interface Subject {
  id: string;
  name: string;
  description: string;
  color: string;
  totalHours: number;
  studiedHours: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudySession {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  duration: number; // em minutos
  date: Date;
  completed: boolean;
  notes?: string;
}

export interface Task {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: Date;
}

export interface StudyPlan {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  subjects: string[]; // IDs das disciplinas
  dailyGoal: number; // horas por dia
  active: boolean;
}

export interface StudyStats {
  totalHours: number;
  weeklyHours: number;
  monthlyHours: number;
  completedTasks: number;
  pendingTasks: number;
  subjectProgress: { [subjectId: string]: number };
}