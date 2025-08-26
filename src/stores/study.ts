import { defineStore } from 'pinia';
import type { Subject, StudySession, Task, StudyPlan, StudyStats, StudyCycle, CycleSubject, StudyTimer } from '@/types/study';

export const useStudyStore = defineStore('study', {
  state: () => ({
    subjects: [] as Subject[],
    studySessions: [] as StudySession[],
    tasks: [] as Task[],
    studyPlans: [] as StudyPlan[],
    activeStudyPlan: null as StudyPlan | null,
    studyCycles: [] as StudyCycle[],
    activeCycle: null as StudyCycle | null,
    studyTimer: {
      isActive: false,
      pausedTime: 0,
      totalTime: 0,
      currentSubject: null
    } as StudyTimer,
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
    addSubject(subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt' | 'topics'> & { topics?: any[] }) {
      const newSubject: Subject = {
        ...subject,
        topics: subject.topics || [],
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

    // Study Cycles
    addStudyCycle(cycle: Omit<StudyCycle, 'id' | 'createdAt' | 'updatedAt'>) {
      const newCycle: StudyCycle = {
        ...cycle,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.studyCycles.push(newCycle);
      this.saveToLocalStorage();
    },

    updateStudyCycle(id: string, updates: Partial<StudyCycle>) {
      const index = this.studyCycles.findIndex(cycle => cycle.id === id);
      if (index !== -1) {
        this.studyCycles[index] = {
          ...this.studyCycles[index],
          ...updates,
          updatedAt: new Date()
        };
        if (this.activeCycle?.id === id) {
          this.activeCycle = this.studyCycles[index];
        }
        this.saveToLocalStorage();
      }
    },

    setActiveCycle(cycleId: string) {
      const cycle = this.studyCycles.find(c => c.id === cycleId);
      if (cycle) {
        // Desativar ciclo anterior
        if (this.activeCycle) {
          this.updateStudyCycle(this.activeCycle.id, { status: 'paused' });
        }
        // Ativar novo ciclo
        this.activeCycle = cycle;
        this.updateStudyCycle(cycleId, { status: 'active' });
      }
    },

    updateCycleSubject(cycleId: string, subjectId: string, updates: Partial<CycleSubject>) {
      const cycle = this.studyCycles.find(c => c.id === cycleId);
      if (cycle) {
        const subjectIndex = cycle.subjects.findIndex(s => s.id === subjectId);
        if (subjectIndex !== -1) {
          cycle.subjects[subjectIndex] = { ...cycle.subjects[subjectIndex], ...updates };
          this.updateStudyCycle(cycleId, { subjects: cycle.subjects });
        }
      }
    },

    moveSubjectToStatus(subjectId: string, newStatus: 'to_study' | 'studying' | 'review' | 'completed') {
      if (!this.activeCycle) return;
      
      const subject = this.activeCycle.subjects.find(s => s.id === subjectId);
      if (subject) {
        // Se movendo para "studying", pausar timer atual se houver
        if (newStatus === 'studying' && this.studyTimer.currentSubject && this.studyTimer.currentSubject.id !== subjectId) {
          this.pauseTimer();
        }
        
        // Se movendo para "completed", definir data de conclusão
        if (newStatus === 'completed') {
          subject.completedAt = new Date();
          // Definir próxima revisão
          const reviewDate = new Date();
          reviewDate.setHours(reviewDate.getHours() + 24);
          subject.reviewDate = reviewDate;
          subject.reviewType = '24h';
        }
        
        this.updateCycleSubject(this.activeCycle.id, subjectId, { 
          status: newStatus,
          ...(newStatus === 'completed' && { completedAt: new Date() })
        });
      }
    },

    // Study Timer
    startTimer(subject: CycleSubject) {
      this.studyTimer = {
        isActive: true,
        startTime: new Date(),
        pausedTime: 0,
        totalTime: 0,
        currentSubject: subject
      };
      this.moveSubjectToStatus(subject.id, 'studying');
    },

    pauseTimer() {
      if (this.studyTimer.isActive && this.studyTimer.startTime) {
        const now = new Date();
        this.studyTimer.totalTime += now.getTime() - this.studyTimer.startTime.getTime();
        this.studyTimer.isActive = false;
        this.studyTimer.startTime = undefined;
      }
    },

    resumeTimer() {
      if (!this.studyTimer.isActive && this.studyTimer.currentSubject) {
        this.studyTimer.isActive = true;
        this.studyTimer.startTime = new Date();
      }
    },

    stopTimer() {
      if (this.studyTimer.currentSubject) {
        const totalMinutes = Math.round(this.studyTimer.totalTime / (1000 * 60));
        this.updateCycleSubject(
          this.activeCycle!.id, 
          this.studyTimer.currentSubject.id, 
          { actualMinutes: totalMinutes }
        );
        this.moveSubjectToStatus(this.studyTimer.currentSubject.id, 'completed');
      }
      
      this.studyTimer = {
        isActive: false,
        pausedTime: 0,
        totalTime: 0,
        currentSubject: null
      };
    },

    getCurrentTimerTime() {
      if (!this.studyTimer.currentSubject) return 0;
      
      let totalTime = this.studyTimer.totalTime;
      if (this.studyTimer.isActive && this.studyTimer.startTime) {
        totalTime += new Date().getTime() - this.studyTimer.startTime.getTime();
      }
      
      return Math.round(totalTime / 1000); // retorna em segundos
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

    getActiveCycle: (state) => {
      return state.studyCycles.find(cycle => cycle.status === 'active') || null;
    },

    getCycleSubjectsByStatus: (state) => (status: string) => {
      if (!state.activeCycle) return [];
      return state.activeCycle.subjects.filter(subject => subject.status === status);
    },

    getWeeklyProgress: (state) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      
      const weeklyHours = state.studySessions
        .filter(session => session.completed && session.date >= weekStart)
        .reduce((total, session) => total + session.duration / 60, 0);
      
      const weeklyGoal = state.activeCycle?.weeklyGoal || 40;
      return Math.min((weeklyHours / weeklyGoal) * 100, 100);
    },

    getDaysUntilExam: (state) => {
      if (!state.activeCycle) return 0;
      const now = new Date();
      const examDate = new Date(state.activeCycle.examDate);
      const diffTime = examDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }



    // Local Storage
    saveToLocalStorage() {
      localStorage.setItem('study-data', JSON.stringify({
        subjects: this.subjects,
        studySessions: this.studySessions,
        tasks: this.tasks,
        studyPlans: this.studyPlans,
        activeStudyPlan: this.activeStudyPlan,
        studyCycles: this.studyCycles,
        activeCycle: this.activeCycle,
        studyTimer: this.studyTimer
      }));
    },

    loadFromLocalStorage() {
      const data = localStorage.getItem('study-data');
      if (data) {
        const parsed = JSON.parse(data);
        this.subjects = (parsed.subjects || []).map((subject: any) => ({
          ...subject,
          studiedHours: subject.studiedHours || 0,
          totalHours: subject.totalHours || 0,
          createdAt: subject.createdAt ? new Date(subject.createdAt) : new Date(),
          updatedAt: subject.updatedAt ? new Date(subject.updatedAt) : new Date()
        }));
        this.studySessions = (parsed.studySessions || []).map((session: any) => ({
          ...session,
          duration: session.duration || 0,
          date: session.date ? new Date(session.date) : new Date()
        }));
        this.tasks = (parsed.tasks || []).map((task: any) => ({
          ...task,
          createdAt: task.createdAt ? new Date(task.createdAt) : new Date()
        }));
        this.studyPlans = (parsed.studyPlans || []).map((plan: any) => ({
          ...plan,
          startDate: plan.startDate ? new Date(plan.startDate) : new Date(),
          endDate: plan.endDate ? new Date(plan.endDate) : new Date(),
          createdAt: plan.createdAt ? new Date(plan.createdAt) : new Date(),
          updatedAt: plan.updatedAt ? new Date(plan.updatedAt) : new Date()
        }));
        this.activeStudyPlan = parsed.activeStudyPlan || null;
        this.studyCycles = (parsed.studyCycles || []).map((cycle: any) => ({
          ...cycle,
          examDate: cycle.examDate ? new Date(cycle.examDate) : new Date(),
          createdAt: cycle.createdAt ? new Date(cycle.createdAt) : new Date(),
          updatedAt: cycle.updatedAt ? new Date(cycle.updatedAt) : new Date(),
          subjects: (cycle.subjects || []).map((subject: any) => ({
            ...subject,
            reviewDate: subject.reviewDate ? new Date(subject.reviewDate) : undefined,
            completedAt: subject.completedAt ? new Date(subject.completedAt) : undefined
          }))
        }));
        this.activeCycle = parsed.activeCycle ? {
          ...parsed.activeCycle,
          examDate: parsed.activeCycle.examDate ? new Date(parsed.activeCycle.examDate) : new Date(),
          createdAt: parsed.activeCycle.createdAt ? new Date(parsed.activeCycle.createdAt) : new Date(),
          updatedAt: parsed.activeCycle.updatedAt ? new Date(parsed.activeCycle.updatedAt) : new Date(),
          subjects: (parsed.activeCycle.subjects || []).map((subject: any) => ({
            ...subject,
            reviewDate: subject.reviewDate ? new Date(subject.reviewDate) : undefined,
            completedAt: subject.completedAt ? new Date(subject.completedAt) : undefined
          }))
        } : null;
        this.studyTimer = parsed.studyTimer || {
          isActive: false,
          pausedTime: 0,
          totalTime: 0,
          currentSubject: null
        };
      }
    }
  }
});