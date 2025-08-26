import { defineStore } from 'pinia';
import type { Subject, StudySession, Task, StudyPlan, StudyStats } from '@/types/study';

export const useStudyStore = defineStore('study', {
  state: () => ({
    subjects: [] as Subject[],
    studySessions: [] as StudySession[],
    tasks: [] as Task[],
    studyPlans: [] as StudyPlan[],
    activeStudyPlan: null as StudyPlan | null,
    currentSession: null as StudySession | null,
    sessionTimer: 0,
    isStudying: false
  }),

  getters: {
    getSubjectById: (state) => (id: string) => {
      return state.subjects.find(subject => subject.id === id);
    },

    getTasksBySubject: (state) => (subjectId: string) => {
      return state.tasks.filter(task => task.subjectId === subjectId);
    },

    getPendingTasks: (state) => {
      return state.tasks.filter(task => !task.completed);
    },

    getCompletedTasks: (state) => {
      return state.tasks.filter(task => task.completed);
    },

    getStudyStats: (state): StudyStats => {
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalHours = state.studySessions
        .filter(session => session.completed)
        .reduce((total, session) => total + session.duration / 60, 0);

      const weeklyHours = state.studySessions
        .filter(session => session.completed && session.date >= weekStart)
        .reduce((total, session) => total + session.duration / 60, 0);

      const monthlyHours = state.studySessions
        .filter(session => session.completed && session.date >= monthStart)
        .reduce((total, session) => total + session.duration / 60, 0);

      const completedTasks = state.tasks.filter(task => task.completed).length;
      const pendingTasks = state.tasks.filter(task => !task.completed).length;

      const subjectProgress: { [subjectId: string]: number } = {};
      state.subjects.forEach(subject => {
        subjectProgress[subject.id] = subject.totalHours > 0 
          ? (subject.studiedHours / subject.totalHours) * 100 
          : 0;
      });

      return {
        totalHours,
        weeklyHours,
        monthlyHours,
        completedTasks,
        pendingTasks,
        subjectProgress
      };
    }
  },

  actions: {
    // Subjects
    addSubject(subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>) {
      const newSubject: Subject = {
        ...subject,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.subjects.push(newSubject);
      this.saveToLocalStorage();
    },

    updateSubject(id: string, updates: Partial<Subject>) {
      const index = this.subjects.findIndex(subject => subject.id === id);
      if (index !== -1) {
        this.subjects[index] = {
          ...this.subjects[index],
          ...updates,
          updatedAt: new Date()
        };
        this.saveToLocalStorage();
      }
    },

    deleteSubject(id: string) {
      this.subjects = this.subjects.filter(subject => subject.id !== id);
      this.tasks = this.tasks.filter(task => task.subjectId !== id);
      this.studySessions = this.studySessions.filter(session => session.subjectId !== id);
      this.saveToLocalStorage();
    },

    // Tasks
    addTask(task: Omit<Task, 'id' | 'createdAt'>) {
      const newTask: Task = {
        ...task,
        id: Date.now().toString(),
        createdAt: new Date()
      };
      this.tasks.push(newTask);
      this.saveToLocalStorage();
    },

    updateTask(id: string, updates: Partial<Task>) {
      const index = this.tasks.findIndex(task => task.id === id);
      if (index !== -1) {
        this.tasks[index] = { ...this.tasks[index], ...updates };
        this.saveToLocalStorage();
      }
    },

    deleteTask(id: string) {
      this.tasks = this.tasks.filter(task => task.id !== id);
      this.saveToLocalStorage();
    },

    toggleTaskComplete(id: string) {
      const task = this.tasks.find(task => task.id === id);
      if (task) {
        task.completed = !task.completed;
        this.saveToLocalStorage();
      }
    },

    // Study Sessions
    startStudySession(subjectId: string, title: string, description?: string) {
      if (this.isStudying) return;

      this.currentSession = {
        id: Date.now().toString(),
        subjectId,
        title,
        description,
        duration: 0,
        date: new Date(),
        completed: false
      };
      this.isStudying = true;
      this.sessionTimer = 0;
      this.startTimer();
    },

    pauseStudySession() {
      this.isStudying = false;
    },

    resumeStudySession() {
      if (this.currentSession) {
        this.isStudying = true;
        this.startTimer();
      }
    },

    endStudySession(notes?: string) {
      if (this.currentSession) {
        this.currentSession.duration = this.sessionTimer;
        this.currentSession.completed = true;
        this.currentSession.notes = notes;
        
        this.studySessions.push(this.currentSession);
        
        // Atualizar horas estudadas da disciplina
        const subject = this.subjects.find(s => s.id === this.currentSession!.subjectId);
        if (subject) {
          subject.studiedHours += this.sessionTimer / 60;
        }
        
        this.currentSession = null;
        this.isStudying = false;
        this.sessionTimer = 0;
        this.saveToLocalStorage();
      }
    },

    startTimer() {
      const interval = setInterval(() => {
        if (this.isStudying) {
          this.sessionTimer++;
        } else {
          clearInterval(interval);
        }
      }, 1000);
    },

    // Study Plans
    addStudyPlan(plan: Omit<StudyPlan, 'id'>) {
      const newPlan: StudyPlan = {
        ...plan,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.studyPlans.push(newPlan);
      this.saveToLocalStorage();
    },

    updateStudyPlan(id: string, updates: Partial<StudyPlan>) {
      const index = this.studyPlans.findIndex(plan => plan.id === id);
      if (index !== -1) {
        this.studyPlans[index] = {
          ...this.studyPlans[index],
          ...updates,
          updatedAt: new Date()
        };
        this.saveToLocalStorage();
      }
    },

    deleteStudyPlan(id: string) {
      this.studyPlans = this.studyPlans.filter(plan => plan.id !== id);
      if (this.activeStudyPlan?.id === id) {
        this.activeStudyPlan = null;
      }
      this.saveToLocalStorage();
    },

    setActiveStudyPlan(planId: string) {
      const plan = this.studyPlans.find(p => p.id === planId);
      if (plan) {
        this.activeStudyPlan = plan;
        this.saveToLocalStorage();
      }
    },

    getStudyPlanById: (state) => (id: string) => {
      return state.studyPlans.find(plan => plan.id === id);
    },

    getActivePlans: (state) => {
      return state.studyPlans.filter(plan => plan.status === 'active');
    },

    getPlanProgress: (state) => (planId: string) => {
      const plan = state.studyPlans.find(p => p.id === planId);
      if (!plan) return 0;
      
      const totalDays = Math.ceil((new Date(plan.endDate).getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const passedDays = Math.ceil((new Date().getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24));
      
      return Math.min((passedDays / totalDays) * 100, 100);
    },
    // Local Storage
    saveToLocalStorage() {
      localStorage.setItem('study-data', JSON.stringify({
        subjects: this.subjects,
        studySessions: this.studySessions,
        tasks: this.tasks,
        studyPlans: this.studyPlans,
        activeStudyPlan: this.activeStudyPlan
      }));
    },

    loadFromLocalStorage() {
      const data = localStorage.getItem('study-data');
      if (data) {
        const parsed = JSON.parse(data);
        this.subjects = parsed.subjects || [];
        this.studySessions = parsed.studySessions || [];
        this.tasks = parsed.tasks || [];
        this.studyPlans = parsed.studyPlans || [];
        this.activeStudyPlan = parsed.activeStudyPlan || null;
      }
    }
  }
});