export interface Subject {
  id: string;
  name: string;
  description: string;
  color: string;
  totalHours: number;
  studiedHours: number;
  topics: Topic[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
  estimatedHours: number;
  studiedHours: number;
  completed: boolean;
  subtopics: Subtopic[];
  order: number;
}

export interface Subtopic {
  id: string;
  name: string;
  description?: string;
  estimatedHours: number;
  studiedHours: number;
  completed: boolean;
  order: number;
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
  weeklyGoal: number; // horas por semana
  status: 'active' | 'paused' | 'completed' | 'draft';
  color: string;
  priority: 'low' | 'medium' | 'high';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyCycle {
  id: string;
  name: string;
  description: string;
  planId: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  goals: string[];
  tasks: CycleTask[];
  totalHours: number;
  completedHours: number;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CycleTask {
  id: string;
  cycleId: string;
  subjectId: string;
  title: string;
  description?: string;
  estimatedHours: number;
  actualHours: number;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignedDate?: Date;
  completedDate?: Date;
  notes?: string;
  order: number;
}

export interface CycleStats {
  totalCycles: number;
  activeCycles: number;
  completedCycles: number;
  totalHours: number;
  completedHours: number;
  averageCompletion: number;
}

export interface PlanSession {
  id: string;
  planId: string;
  subjectId: string;
  date: Date;
  plannedHours: number;
  actualHours: number;
  completed: boolean;
  notes?: string;
}

export interface StudyStats {
  totalHours: number;
  weeklyHours: number;
  monthlyHours: number;
  completedTasks: number;
  pendingTasks: number;
  subjectProgress: { [subjectId: string]: number };
}