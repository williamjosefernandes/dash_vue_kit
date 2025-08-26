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

export interface StudyCycle {
  id: string;
  name: string;
  description: string;
  examDate: Date;
  weeklyGoal: number;
  dailyGoal: number;
  subjects: CycleSubject[];
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface CycleSubject {
  id: string;
  subjectId: string;
  name: string;
  color: string;
  estimatedMinutes: number;
  actualMinutes: number;
  priority: 'low' | 'medium' | 'high';
  status: 'to_study' | 'studying' | 'review' | 'completed';
  reviewDate?: Date;
  reviewType?: '24h' | '7d' | '30d';
  notes?: string;
  completedAt?: Date;
  order: number;
}

export interface StudyTimer {
  isActive: boolean;
  startTime?: Date;
  pausedTime: number;
  totalTime: number;
  currentSubject?: CycleSubject;
}