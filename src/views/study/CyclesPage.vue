<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';
import type { CycleSubject, StudyCycle } from '@/types/study';

const studyStore = useStudyStore();
const page = ref({ title: 'Ciclos de Estudo' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Ciclos de Estudo', disabled: true, href: '#' }
]);

// Estados dos dialogs
const addSubjectDialog = ref(false);
const editSubjectDialog = ref(false);
const notesDialog = ref(false);
const editCycleDialog = ref(false);
const deleteCycleDialog = ref(false);
const currentSubject = ref<CycleSubject | null>(null);
const subjectNotes = ref('');
const cycleToDelete = ref<StudyCycle | null>(null);

// Estados da interface
const currentView = ref<'kanban' | 'list'>('kanban');
const selectedCycleId = ref<string>('');

// Form para novo subject
const newSubjectForm = ref({
  subjectId: '',
  estimatedMinutes: 25,
  priority: 'medium' as 'low' | 'medium' | 'high'
});

// Form para editar ciclo
const editCycleForm = ref({
  id: '',
  name: '',
  description: '',
  examDate: '',
  weeklyGoal: 40,
  dailyGoal: 6,
  status: 'active' as 'active' | 'paused' | 'completed'
});

// Timer display
const timerDisplay = ref('00:00');
let timerInterval: number | null = null;

// Computed properties
const activeCycle = computed(() => studyStore.getActiveCycle);
const allCycles = computed(() => studyStore.studyCycles);
const daysUntilExam = computed(() => studyStore.getDaysUntilExam);
const weeklyProgress = computed(() => studyStore.getWeeklyProgress);
const weeklyHours = computed(() => studyStore.getStudyStats.weeklyHours);

const completedCycles = computed(() => 
  studyStore.studyCycles.filter(cycle => cycle.status === 'completed')
);

const upcomingCycles = computed(() => 
  studyStore.studyCycles.filter(cycle => cycle.status === 'draft' || cycle.status === 'paused')
);

const toStudySubjects = computed(() => studyStore.getCycleSubjectsByStatus('to_study'));
const studyingSubjects = computed(() => studyStore.getCycleSubjectsByStatus('studying'));
const completedSubjects = computed(() => studyStore.getCycleSubjectsByStatus('completed'));

const currentStudyingSubject = computed(() => {
  return studyingSubjects.value.length > 0 ? studyingSubjects.value[0] : null;
});

const selectedCycle = computed(() => {
  if (selectedCycleId.value) {
    return studyStore.studyCycles.find(c => c.id === selectedCycleId.value);
  }
  return activeCycle.value;
});

// Methods
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'success';
    default: return 'primary';
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'high': return 'custom-alert';
    case 'medium': return 'custom-clock';
    case 'low': return 'custom-check';
    default: return 'custom-info';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'success';
    case 'paused': return 'warning';
    case 'completed': return 'info';
    default: return 'secondary';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return 'Ativo';
    case 'paused': return 'Pausado';
    case 'completed': return 'Concluído';
    default: return 'Rascunho';
  }
};

const getSubjectColor = (subjectId: string) => {
  const subject = studyStore.getSubjectById(subjectId);
  return subject?.color || 'primary';
};

const getSubjectName = (subjectId: string) => {
  const subject = studyStore.getSubjectById(subjectId);
  return subject?.name || 'Disciplina';
};

const getDaysUntilExam = (examDate: Date) => {
  const now = new Date();
  const exam = new Date(examDate);
  const diffTime = exam.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const getCycleProgress = (cycle: StudyCycle) => {
  if (!cycle.subjects || cycle.subjects.length === 0) return 0;
  const completed = cycle.subjects.filter(s => s.status === 'completed').length;
  return Math.round((completed / cycle.subjects.length) * 100);
};

// Cycle Management
const openEditCycleDialog = (cycle: StudyCycle) => {
  editCycleForm.value = {
    id: cycle.id,
    name: cycle.name,
    description: cycle.description,
    examDate: new Date(cycle.examDate).toISOString().split('T')[0],
    weeklyGoal: cycle.weeklyGoal,
    dailyGoal: cycle.dailyGoal,
    status: cycle.status
  };
  editCycleDialog.value = true;
};

const saveEditedCycle = () => {
  const updates = {
    name: editCycleForm.value.name,
    description: editCycleForm.value.description,
    examDate: new Date(editCycleForm.value.examDate),
    weeklyGoal: editCycleForm.value.weeklyGoal,
    dailyGoal: editCycleForm.value.dailyGoal,
    status: editCycleForm.value.status
  };
  
  studyStore.updateStudyCycle(editCycleForm.value.id, updates);
  editCycleDialog.value = false;
};

const openDeleteCycleDialog = (cycle: StudyCycle) => {
  cycleToDelete.value = cycle;
  deleteCycleDialog.value = true;
};

const confirmDeleteCycle = () => {
  if (cycleToDelete.value) {
    // Se for o ciclo ativo, limpar
    if (activeCycle.value?.id === cycleToDelete.value.id) {
      studyStore.activeCycle = null;
    }
    
    // Remover da lista
    studyStore.studyCycles = studyStore.studyCycles.filter(c => c.id !== cycleToDelete.value!.id);
    studyStore.saveToLocalStorage();
    
    deleteCycleDialog.value = false;
    cycleToDelete.value = null;
  }
};

const activateCycle = (cycleId: string) => {
  studyStore.setActiveCycle(cycleId);
};

const pauseCycle = (cycleId: string) => {
  studyStore.updateStudyCycle(cycleId, { status: 'paused' });
};

const completeCycle = (cycleId: string) => {
  studyStore.updateStudyCycle(cycleId, { status: 'completed' });
};

// Timer functions
const startStudy = (subject: CycleSubject) => {
  studyStore.startTimer(subject);
  startTimerDisplay();
};

const pauseStudy = () => {
  studyStore.pauseTimer();
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

const resumeStudy = () => {
  studyStore.resumeTimer();
  startTimerDisplay();
};

const completeStudy = () => {
  studyStore.stopTimer();
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerDisplay.value = '00:00';
  showCongratulations();
};

const skipSubject = () => {
  if (studyStore.studyTimer.currentSubject) {
    studyStore.moveSubjectToStatus(studyStore.studyTimer.currentSubject.id, 'to_study');
    studyStore.studyTimer = {
      isActive: false,
      pausedTime: 0,
      totalTime: 0,
      currentSubject: null
    };
  }
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerDisplay.value = '00:00';
};

const startTimerDisplay = () => {
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    const seconds = studyStore.getCurrentTimerTime();
    timerDisplay.value = formatTime(seconds);
  }, 1000);
};

const showCongratulations = () => {
  console.log('Parabéns! Você concluiu uma disciplina!');
};

// Subject management
const openAddSubjectDialog = () => {
  newSubjectForm.value = {
    subjectId: '',
    estimatedMinutes: 25,
    priority: 'medium'
  };
  addSubjectDialog.value = true;
};

const addSubjectToCycle = () => {
  if (!activeCycle.value || !newSubjectForm.value.subjectId) return;
  
  const subject = studyStore.getSubjectById(newSubjectForm.value.subjectId);
  if (!subject) return;
  
  // Garantir que subjects seja um array
  if (!Array.isArray(activeCycle.value.subjects)) {
    activeCycle.value.subjects = [];
  }
  
  const newCycleSubject: CycleSubject = {
    id: Date.now().toString(),
    subjectId: subject.id,
    name: subject.name,
    color: subject.color,
    estimatedMinutes: newSubjectForm.value.estimatedMinutes,
    actualMinutes: 0,
    priority: newSubjectForm.value.priority,
    status: 'to_study',
    order: activeCycle.value.subjects.length
  };
  
  const updatedSubjects = [...activeCycle.value.subjects, newCycleSubject];
  studyStore.updateStudyCycle(activeCycle.value.id, { subjects: updatedSubjects });
  
  addSubjectDialog.value = false;
};

const openNotesDialog = (subject: CycleSubject) => {
  currentSubject.value = subject;
  subjectNotes.value = subject.notes || '';
  notesDialog.value = true;
};

const saveNotes = () => {
  if (currentSubject.value && activeCycle.value) {
    studyStore.updateCycleSubject(
      activeCycle.value.id,
      currentSubject.value.id,
      { notes: subjectNotes.value }
    );
    notesDialog.value = false;
  }
};

// Drag and drop
const onDragStart = (event: DragEvent, subject: CycleSubject) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', JSON.stringify(subject));
  }
};

const onDrop = (event: DragEvent, status: 'to_study' | 'studying' | 'completed') => {
  event.preventDefault();
  if (event.dataTransfer) {
    const subjectData = JSON.parse(event.dataTransfer.getData('text/plain'));
    studyStore.moveSubjectToStatus(subjectData.id, status);
  }
};

const onDragOver = (event: DragEvent) => {
  event.preventDefault();
};

// Lifecycle
onMounted(() => {
  studyStore.loadFromLocalStorage();
  
  // Se há um timer ativo, iniciar display
  if (studyStore.studyTimer.isActive) {
    startTimerDisplay();
  }
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});
</script>

<template>
  <!-- Header com Navegação -->
  <div class="cycles-header">
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
    
    <div class="header-controls">
      <div class="d-flex align-center gap-4">
        <!-- Seletor de Ciclo -->
        <v-select
          v-model="selectedCycleId"
          :items="allCycles"
          item-title="name"
          item-value="id"
          label="Selecionar Ciclo"
          variant="outlined"
          density="compact"
          style="min-width: 250px"
          clearable
          placeholder="Ciclo Ativo"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props">
              <template v-slot:prepend>
                <v-avatar :color="getStatusColor(item.raw.status)" size="24">
                  <SvgSprite name="custom-refresh" style="width: 12px; height: 12px" />
                </v-avatar>
              </template>
              <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ getStatusText(item.raw.status) }} • {{ getDaysUntilExam(item.raw.examDate) }} dias
              </v-list-item-subtitle>
            </v-list-item>
          </template>
        </v-select>

        <!-- Controles de Visualização -->
        <v-btn-toggle v-model="currentView" mandatory variant="outlined" divided>
          <v-btn value="kanban" icon>
            <v-tooltip text="Visualização Kanban" activator="parent" />
            <SvgSprite name="custom-grid" style="width: 18px; height: 18px" />
          </v-btn>
          <v-btn value="list" icon>
            <v-tooltip text="Lista de Ciclos" activator="parent" />
            <SvgSprite name="custom-list" style="width: 18px; height: 18px" />
          </v-btn>
        </v-btn-toggle>

        <!-- Ações -->
        <v-btn color="primary" prepend-icon="mdi-plus" to="/main/cycles/new">
          Novo Ciclo
        </v-btn>
      </div>
    </div>

    <!-- Estatísticas do Ciclo Ativo -->
    <div v-if="selectedCycle" class="header-stats">
      <div class="stat-item">
        <div class="stat-icon">
          <SvgSprite name="custom-calendar" style="width: 24px; height: 24px" />
        </div>
        <div>
          <h3 class="text-h3 mb-0">{{ getDaysUntilExam(selectedCycle.examDate) }}</h3>
          <p class="text-caption text-lightText mb-0">dias para a prova</p>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icon">
          <SvgSprite name="custom-clock" style="width: 24px; height: 24px" />
        </div>
        <div>
          <h3 class="text-h3 mb-0">{{ weeklyHours.toFixed(1) }}h</h3>
          <p class="text-caption text-lightText mb-0">estudadas esta semana</p>
        </div>
      </div>
      
      <div class="stat-item progress-item">
        <div class="stat-icon">
          <SvgSprite name="custom-target" style="width: 24px; height: 24px" />
        </div>
        <div class="flex-grow-1">
          <div class="d-flex align-center justify-space-between mb-1">
            <p class="text-caption text-lightText mb-0">Progresso do ciclo</p>
            <span class="text-caption font-weight-bold">{{ getCycleProgress(selectedCycle) }}%</span>
          </div>
          <v-progress-linear
            :model-value="getCycleProgress(selectedCycle)"
            color="success"
            height="8"
            rounded
            class="cycle-progress"
          />
        </div>
      </div>

      <!-- Ações do Ciclo -->
      <div class="cycle-actions">
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon variant="text" v-bind="props">
              <SvgSprite name="custom-more" style="width: 20px; height: 20px" />
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="openEditCycleDialog(selectedCycle)">
              <template v-slot:prepend>
                <SvgSprite name="custom-edit" style="width: 16px; height: 16px" />
              </template>
              <v-list-item-title>Editar Ciclo</v-list-item-title>
            </v-list-item>
            <v-list-item 
              v-if="selectedCycle.status === 'active'"
              @click="pauseCycle(selectedCycle.id)"
            >
              <template v-slot:prepend>
                <SvgSprite name="custom-pause" style="width: 16px; height: 16px" />
              </template>
              <v-list-item-title>Pausar Ciclo</v-list-item-title>
            </v-list-item>
            <v-list-item 
              v-if="selectedCycle.status === 'paused'"
              @click="activateCycle(selectedCycle.id)"
            >
              <template v-slot:prepend>
                <SvgSprite name="custom-play" style="width: 16px; height: 16px" />
              </template>
              <v-list-item-title>Reativar Ciclo</v-list-item-title>
            </v-list-item>
            <v-list-item 
              v-if="selectedCycle.status !== 'completed'"
              @click="completeCycle(selectedCycle.id)"
            >
              <template v-slot:prepend>
                <SvgSprite name="custom-check" style="width: 16px; height: 16px" />
              </template>
              <v-list-item-title>Marcar como Concluído</v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item @click="openDeleteCycleDialog(selectedCycle)" class="text-error">
              <template v-slot:prepend>
                <SvgSprite name="custom-trash" style="width: 16px; height: 16px" />
              </template>
              <v-list-item-title>Excluir Ciclo</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>
  </div>

  <!-- Conteúdo Principal -->
  <div class="cycles-content">
    <!-- Visualização Kanban -->
    <div v-if="currentView === 'kanban'" class="kanban-view">
      <div v-if="!selectedCycle" class="no-cycle-state">
        <div class="text-center py-12">
          <v-avatar color="primary" size="120" class="mb-6">
            <SvgSprite name="custom-refresh" style="width: 60px; height: 60px" />
          </v-avatar>
          <h2 class="text-h2 mb-4">Bem-vindo aos Ciclos de Estudo!</h2>
          <p class="text-h6 text-lightText mb-6 max-width-600">
            Organize sua rotina de estudos com nosso sistema Kanban inteligente. 
            Crie ciclos focados, acompanhe seu progresso e maximize seu aprendizado.
          </p>
          <v-btn 
            color="primary" 
            size="large" 
            prepend-icon="mdi-plus"
            to="/main/cycles/new"
          >
            Criar Primeiro Ciclo
          </v-btn>
        </div>
      </div>

      <div v-else class="kanban-board">
        <!-- Coluna: A Estudar -->
        <div 
          class="kanban-column to-study-column"
          @drop="onDrop($event, 'to_study')"
          @dragover="onDragOver"
        >
          <div class="column-header">
            <div class="d-flex align-center">
              <v-avatar color="info" size="32" class="me-3">
                <SvgSprite name="custom-book" style="width: 16px; height: 16px" />
              </v-avatar>
              <div>
                <h5 class="text-h5 mb-0">A Estudar</h5>
                <p class="text-caption mb-0">{{ toStudySubjects.length }} disciplinas</p>
              </div>
            </div>
            <v-btn 
              icon 
              size="small" 
              color="info" 
              variant="tonal"
              @click="openAddSubjectDialog"
            >
              <SvgSprite name="custom-plus" style="width: 16px; height: 16px" />
            </v-btn>
          </div>
          
          <div class="column-content">
            <div
              v-for="subject in toStudySubjects"
              :key="subject.id"
              class="subject-card to-study-card"
              draggable="true"
              @dragstart="onDragStart($event, subject)"
            >
              <div class="card-header">
                <h6 class="text-h6 mb-1">{{ subject.name }}</h6>
                <v-chip 
                  :color="getPriorityColor(subject.priority)" 
                  size="x-small" 
                  variant="tonal"
                >
                  <SvgSprite :name="getPriorityIcon(subject.priority)" style="width: 12px; height: 12px" class="me-1" />
                  {{ subject.priority === 'high' ? 'Crítico' : subject.priority === 'medium' ? 'Médio' : 'Baixo' }}
                </v-chip>
              </div>
              
              <div class="card-content">
                <div class="d-flex align-center mb-2">
                  <SvgSprite name="custom-clock" style="width: 14px; height: 14px" class="me-2" />
                  <span class="text-body-2">{{ formatMinutes(subject.estimatedMinutes) }}</span>
                </div>
              </div>
              
              <div class="card-actions">
                <v-btn 
                  size="small" 
                  color="primary" 
                  variant="flat"
                  @click="startStudy(subject)"
                  block
                >
                  Iniciar Estudo
                </v-btn>
              </div>
            </div>
            
            <div v-if="toStudySubjects.length === 0" class="empty-column">
              <SvgSprite name="custom-book" style="width: 32px; height: 32px; opacity: 0.3" />
              <p class="text-caption text-lightText mt-2 mb-0">Nenhuma disciplina pendente</p>
            </div>
          </div>
        </div>

        <!-- Coluna: Em Estudo -->
        <div 
          class="kanban-column studying-column"
          @drop="onDrop($event, 'studying')"
          @dragover="onDragOver"
        >
          <div class="column-header">
            <div class="d-flex align-center">
              <v-avatar color="primary" size="32" class="me-3">
                <SvgSprite name="custom-play" style="width: 16px; height: 16px" />
              </v-avatar>
              <div>
                <h5 class="text-h5 mb-0">Em Estudo</h5>
                <p class="text-caption mb-0">Foco total</p>
              </div>
            </div>
          </div>
          
          <div class="column-content">
            <div v-if="currentStudyingSubject" class="study-card-expanded">
              <div class="study-header">
                <h4 class="text-h4 mb-2">{{ currentStudyingSubject.name }}</h4>
                <v-chip 
                  :color="getSubjectColor(currentStudyingSubject.subjectId)" 
                  variant="tonal"
                >
                  {{ formatMinutes(currentStudyingSubject.estimatedMinutes) }}
                </v-chip>
              </div>
              
              <div class="pomodoro-timer">
                <div class="timer-display">
                  <h1 class="text-h1 font-weight-bold text-primary">{{ timerDisplay }}</h1>
                  <v-progress-circular
                    :model-value="75"
                    :size="120"
                    :width="8"
                    color="primary"
                    class="timer-circle"
                  >
                    <SvgSprite name="custom-clock" style="width: 32px; height: 32px" />
                  </v-progress-circular>
                </div>
              </div>
              
              <div class="timer-controls">
                <v-btn
                  v-if="studyStore.studyTimer.isActive"
                  color="warning"
                  variant="flat"
                  @click="pauseStudy"
                  prepend-icon="mdi-pause"
                  class="me-2"
                >
                  Pausar
                </v-btn>
                
                <v-btn
                  v-else
                  color="primary"
                  variant="flat"
                  @click="resumeStudy"
                  prepend-icon="mdi-play"
                  class="me-2"
                >
                  Continuar
                </v-btn>
                
                <v-btn
                  color="success"
                  variant="flat"
                  @click="completeStudy"
                  prepend-icon="mdi-check"
                  class="me-2"
                >
                  Concluir
                </v-btn>
                
                <v-btn
                  color="secondary"
                  variant="outlined"
                  @click="skipSubject"
                  prepend-icon="mdi-skip-next"
                  class="me-2"
                >
                  Pular
                </v-btn>
                
                <v-btn
                  color="info"
                  variant="outlined"
                  @click="openNotesDialog(currentStudyingSubject)"
                  prepend-icon="mdi-note-edit"
                >
                  Anotações
                </v-btn>
              </div>
            </div>
            
            <div v-else class="empty-study-area">
              <SvgSprite name="custom-play" style="width: 48px; height: 48px; opacity: 0.3" />
              <h6 class="text-h6 mt-3 mb-2">Pronto para estudar?</h6>
              <p class="text-caption text-lightText mb-0">
                Arraste uma disciplina para cá ou clique em "Iniciar Estudo"
              </p>
            </div>
          </div>
        </div>

        <!-- Coluna: Concluído -->
        <div 
          class="kanban-column completed-column"
          @drop="onDrop($event, 'completed')"
          @dragover="onDragOver"
        >
          <div class="column-header">
            <div class="d-flex align-center">
              <v-avatar color="success" size="32" class="me-3">
                <SvgSprite name="custom-check" style="width: 16px; height: 16px" />
              </v-avatar>
              <div>
                <h5 class="text-h5 mb-0">Concluído</h5>
                <p class="text-caption mb-0">{{ completedSubjects.length }} disciplinas</p>
              </div>
            </div>
          </div>
          
          <div class="column-content">
            <div
              v-for="subject in completedSubjects"
              :key="subject.id"
              class="subject-card completed-card"
            >
              <div class="card-header">
                <h6 class="text-h6 mb-1">{{ subject.name }}</h6>
                <div class="performance-indicator">
                  <v-icon 
                    :color="subject.actualMinutes >= subject.estimatedMinutes ? 'success' : 
                            subject.actualMinutes >= subject.estimatedMinutes * 0.8 ? 'warning' : 'error'"
                    size="16"
                  >
                    {{ subject.actualMinutes >= subject.estimatedMinutes ? 'mdi-check-circle' : 
                       subject.actualMinutes >= subject.estimatedMinutes * 0.8 ? 'mdi-clock-alert' : 'mdi-alert-circle' }}
                  </v-icon>
                </div>
              </div>
              
              <div class="card-content">
                <div class="d-flex justify-space-between mb-1">
                  <span class="text-caption">Planejado:</span>
                  <span class="text-caption">{{ formatMinutes(subject.estimatedMinutes) }}</span>
                </div>
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-caption">Estudado:</span>
                  <span class="text-caption font-weight-bold">{{ formatMinutes(subject.actualMinutes) }}</span>
                </div>
                <p v-if="subject.completedAt" class="text-caption text-lightText mb-0">
                  {{ new Date(subject.completedAt).toLocaleTimeString() }}
                </p>
              </div>
              
              <div class="card-actions">
                <v-btn 
                  size="small" 
                  color="info" 
                  variant="outlined"
                  @click="startStudy(subject)"
                  block
                >
                  Estudar Novamente
                </v-btn>
              </div>
            </div>
            
            <div v-if="completedSubjects.length === 0" class="empty-column">
              <SvgSprite name="custom-check" style="width: 32px; height: 32px; opacity: 0.3" />
              <p class="text-caption text-lightText mt-2 mb-0">Nenhuma disciplina concluída</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Visualização em Lista -->
    <div v-if="currentView === 'list'" class="list-view">
      <v-row>
        <!-- Ciclo Ativo -->
        <v-col v-if="activeCycle" cols="12">
          <UiParentCard>
            <template v-slot:title>
              <div class="d-flex align-center">
                <v-avatar color="success" size="32" class="me-3">
                  <SvgSprite name="custom-play" style="width: 16px; height: 16px" />
                </v-avatar>
                <span>Ciclo Ativo</span>
              </div>
            </template>

            <v-card variant="outlined" color="success" class="active-cycle-card">
              <v-card-text class="pa-6">
                <div class="d-flex align-center justify-space-between mb-4">
                  <div>
                    <h4 class="text-h4 mb-2">{{ activeCycle.name }}</h4>
                    <p class="text-body-1 text-lightText mb-3">{{ activeCycle.description }}</p>
                    
                    <div class="d-flex align-center gap-4 mb-3">
                      <div class="d-flex align-center">
                        <SvgSprite name="custom-calendar" style="width: 16px; height: 16px" class="me-2" />
                        <span class="text-body-2">{{ getDaysUntilExam(activeCycle.examDate) }} dias até a prova</span>
                      </div>
                      <div class="d-flex align-center">
                        <SvgSprite name="custom-clock" style="width: 16px; height: 16px" class="me-2" />
                        <span class="text-body-2">{{ activeCycle.dailyGoal }}h/dia</span>
                      </div>
                      <div class="d-flex align-center">
                        <SvgSprite name="custom-target" style="width: 16px; height: 16px" class="me-2" />
                        <span class="text-body-2">{{ getCycleProgress(activeCycle) }}% concluído</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="text-center">
                    <v-progress-circular
                      :model-value="getCycleProgress(activeCycle)"
                      :size="80"
                      :width="8"
                      color="success"
                      class="mb-2"
                    >
                      <span class="text-h6 font-weight-bold">{{ getCycleProgress(activeCycle) }}%</span>
                    </v-progress-circular>
                  </div>
                </div>
                
                <v-progress-linear
                  :model-value="getCycleProgress(activeCycle)"
                  color="success"
                  height="8"
                  rounded
                  class="mb-4"
                />
                
                <div class="d-flex justify-end gap-2">
                  <v-btn 
                    color="primary" 
                    variant="outlined"
                    @click="currentView = 'kanban'"
                    prepend-icon="mdi-view-dashboard"
                  >
                    Ir para Kanban
                  </v-btn>
                  <v-btn 
                    color="info" 
                    variant="outlined"
                    @click="openEditCycleDialog(activeCycle)"
                    prepend-icon="mdi-pencil"
                  >
                    Editar
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </UiParentCard>
        </v-col>

        <!-- Próximos Ciclos -->
        <v-col v-if="upcomingCycles.length > 0" cols="12" md="6">
          <UiParentCard>
            <template v-slot:title>
              <div class="d-flex align-center">
                <v-avatar color="warning" size="32" class="me-3">
                  <SvgSprite name="custom-clock" style="width: 16px; height: 16px" />
                </v-avatar>
                <span>Próximos Ciclos</span>
              </div>
            </template>

            <div class="cycles-list">
              <v-card
                v-for="cycle in upcomingCycles"
                :key="cycle.id"
                variant="outlined"
                class="mb-3 cycle-list-card"
                hover
              >
                <v-card-text class="pa-4">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <div class="d-flex align-center">
                      <v-avatar :color="getStatusColor(cycle.status)" size="32" class="me-3">
                        <SvgSprite name="custom-refresh" style="width: 16px; height: 16px" />
                      </v-avatar>
                      <div>
                        <h6 class="text-h6 mb-0">{{ cycle.name }}</h6>
                        <v-chip size="x-small" :color="getStatusColor(cycle.status)" variant="tonal">
                          {{ getStatusText(cycle.status) }}
                        </v-chip>
                      </div>
                    </div>
                    
                    <v-menu>
                      <template v-slot:activator="{ props }">
                        <v-btn icon size="small" variant="text" v-bind="props">
                          <SvgSprite name="custom-more" style="width: 16px; height: 16px" />
                        </v-btn>
                      </template>
                      <v-list>
                        <v-list-item @click="activateCycle(cycle.id)">
                          <template v-slot:prepend>
                            <SvgSprite name="custom-play" style="width: 16px; height: 16px" />
                          </template>
                          <v-list-item-title>Ativar</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="openEditCycleDialog(cycle)">
                          <template v-slot:prepend>
                            <SvgSprite name="custom-edit" style="width: 16px; height: 16px" />
                          </template>
                          <v-list-item-title>Editar</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="openDeleteCycleDialog(cycle)" class="text-error">
                          <template v-slot:prepend>
                            <SvgSprite name="custom-trash" style="width: 16px; height: 16px" />
                          </template>
                          <v-list-item-title>Excluir</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </div>
                  
                  <p class="text-caption text-lightText mb-3">{{ cycle.description }}</p>
                  
                  <div class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                      <SvgSprite name="custom-calendar" style="width: 14px; height: 14px" class="me-2" />
                      <span class="text-caption">{{ getDaysUntilExam(cycle.examDate) }} dias</span>
                    </div>
                    <div class="d-flex align-center">
                      <SvgSprite name="custom-book" style="width: 14px; height: 14px" class="me-2" />
                      <span class="text-caption">{{ (cycle.subjects || []).length }} disciplinas</span>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </UiParentCard>
        </v-col>

        <!-- Ciclos Finalizados -->
        <v-col v-if="completedCycles.length > 0" cols="12" md="6">
          <UiParentCard>
            <template v-slot:title>
              <div class="d-flex align-center">
                <v-avatar color="info" size="32" class="me-3">
                  <SvgSprite name="custom-trophy" style="width: 16px; height: 16px" />
                </v-avatar>
                <span>Ciclos Finalizados</span>
              </div>
            </template>

            <div class="cycles-list">
              <v-card
                v-for="cycle in completedCycles"
                :key="cycle.id"
                variant="outlined"
                class="mb-3 cycle-list-card completed-cycle"
                hover
              >
                <v-card-text class="pa-4">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <div class="d-flex align-center">
                      <v-avatar color="info" size="32" class="me-3">
                        <SvgSprite name="custom-trophy" style="width: 16px; height: 16px" />
                      </v-avatar>
                      <div>
                        <h6 class="text-h6 mb-0">{{ cycle.name }}</h6>
                        <v-chip size="x-small" color="info" variant="tonal">
                          Concluído
                        </v-chip>
                      </div>
                    </div>
                    
                    <v-menu>
                      <template v-slot:activator="{ props }">
                        <v-btn icon size="small" variant="text" v-bind="props">
                          <SvgSprite name="custom-more" style="width: 16px; height: 16px" />
                        </v-btn>
                      </template>
                      <v-list>
                        <v-list-item @click="selectedCycleId = cycle.id; currentView = 'kanban'">
                          <template v-slot:prepend>
                            <SvgSprite name="custom-eye" style="width: 16px; height: 16px" />
                          </template>
                          <v-list-item-title>Visualizar</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="openDeleteCycleDialog(cycle)" class="text-error">
                          <template v-slot:prepend>
                            <SvgSprite name="custom-trash" style="width: 16px; height: 16px" />
                          </template>
                          <v-list-item-title>Excluir</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </div>
                  
                  <p class="text-caption text-lightText mb-3">{{ cycle.description }}</p>
                  
                  <div class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                      <SvgSprite name="custom-calendar" style="width: 14px; height: 14px" class="me-2" />
                      <span class="text-caption">{{ new Date(cycle.examDate).toLocaleDateString() }}</span>
                    </div>
                    <div class="d-flex align-center">
                      <SvgSprite name="custom-check" style="width: 14px; height: 14px" class="me-2" />
                      <span class="text-caption">{{ getCycleProgress(cycle) }}% concluído</span>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </UiParentCard>
        </v-col>

        <!-- Estado Vazio -->
        <v-col v-if="!activeCycle && upcomingCycles.length === 0 && completedCycles.length === 0" cols="12">
          <div class="no-cycles-state">
            <div class="text-center py-12">
              <v-avatar color="primary" size="120" class="mb-6">
                <SvgSprite name="custom-refresh" style="width: 60px; height: 60px" />
              </v-avatar>
              <h2 class="text-h2 mb-4">Nenhum ciclo encontrado</h2>
              <p class="text-h6 text-lightText mb-6 max-width-600">
                Crie seu primeiro ciclo de estudos para começar a organizar sua rotina de aprendizado.
              </p>
              <v-btn 
                color="primary" 
                size="large" 
                prepend-icon="mdi-plus"
                to="/main/cycles/new"
              >
                Criar Primeiro Ciclo
              </v-btn>
            </div>
          </div>
        </v-col>
      </v-row>
    </div>
  </div>

  <!-- Dialog: Adicionar Disciplina -->
  <v-dialog v-model="addSubjectDialog" max-width="500px">
    <v-card>
      <v-card-title>Adicionar Disciplina ao Ciclo</v-card-title>
      
      <v-card-text>
        <v-form>
          <v-select
            v-model="newSubjectForm.subjectId"
            :items="studyStore.subjects"
            item-title="name"
            item-value="id"
            label="Disciplina"
            variant="outlined"
            class="mb-4"
          />
          
          <v-text-field
            v-model.number="newSubjectForm.estimatedMinutes"
            label="Tempo Estimado (minutos)"
            type="number"
            variant="outlined"
            min="5"
            step="5"
            class="mb-4"
          />
          
          <div class="mb-4">
            <v-label class="mb-2">Prioridade</v-label>
            <v-chip-group v-model="newSubjectForm.priority" mandatory>
              <v-chip value="low" color="success" variant="tonal">Baixa</v-chip>
              <v-chip value="medium" color="warning" variant="tonal">Média</v-chip>
              <v-chip value="high" color="error" variant="tonal">Alta</v-chip>
            </v-chip-group>
          </div>
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="addSubjectDialog = false">Cancelar</v-btn>
        <v-btn 
          color="primary" 
          @click="addSubjectToCycle"
          :disabled="!newSubjectForm.subjectId"
        >
          Adicionar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog: Editar Ciclo -->
  <v-dialog v-model="editCycleDialog" max-width="600px" persistent>
    <v-card>
      <v-card-title>Editar Ciclo de Estudo</v-card-title>
      
      <v-card-text>
        <v-form>
          <v-text-field
            v-model="editCycleForm.name"
            label="Nome do Ciclo"
            variant="outlined"
            class="mb-4"
          />
          
          <v-textarea
            v-model="editCycleForm.description"
            label="Descrição"
            variant="outlined"
            rows="3"
            class="mb-4"
          />
          
          <v-text-field
            v-model="editCycleForm.examDate"
            label="Data da Prova"
            type="date"
            variant="outlined"
            class="mb-4"
          />
          
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="editCycleForm.dailyGoal"
                label="Meta Diária (horas)"
                type="number"
                variant="outlined"
                min="1"
                max="16"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="editCycleForm.weeklyGoal"
                label="Meta Semanal (horas)"
                type="number"
                variant="outlined"
                min="7"
                max="112"
              />
            </v-col>
          </v-row>
          
          <div class="mb-4">
            <v-label class="mb-2">Status</v-label>
            <v-chip-group v-model="editCycleForm.status" mandatory>
              <v-chip value="active" color="success" variant="tonal">Ativo</v-chip>
              <v-chip value="paused" color="warning" variant="tonal">Pausado</v-chip>
              <v-chip value="completed" color="info" variant="tonal">Concluído</v-chip>
            </v-chip-group>
          </div>
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="editCycleDialog = false">Cancelar</v-btn>
        <v-btn color="primary" @click="saveEditedCycle">Salvar Alterações</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog: Confirmar Exclusão -->
  <v-dialog v-model="deleteCycleDialog" max-width="500px" persistent>
    <v-card>
      <v-card-title class="text-error">Excluir Ciclo</v-card-title>
      
      <v-card-text>
        <div class="text-center mb-4">
          <v-avatar color="error" size="64" class="mb-4">
            <SvgSprite name="custom-trash" style="width: 32px; height: 32px" />
          </v-avatar>
          
          <h5 class="text-h5 mb-2">{{ cycleToDelete?.name }}</h5>
          <p class="text-subtitle-1 text-lightText mb-4">
            Tem certeza que deseja excluir este ciclo?
          </p>
        </div>
        
        <v-alert type="warning" variant="tonal">
          <div class="text-body-2">
            <strong>Atenção:</strong> Esta ação não pode ser desfeita e irá excluir:
            <ul class="mt-2 ml-4">
              <li>Todo o progresso das disciplinas</li>
              <li>Configurações e metas do ciclo</li>
              <li>Histórico de estudos relacionado</li>
            </ul>
          </div>
        </v-alert>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="deleteCycleDialog = false; cycleToDelete = null;">Cancelar</v-btn>
        <v-btn color="error" @click="confirmDeleteCycle" prepend-icon="mdi-delete">
          Excluir Ciclo
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog: Anotações -->
  <v-dialog v-model="notesDialog" max-width="600px">
    <v-card>
      <v-card-title>Anotações - {{ currentSubject?.name }}</v-card-title>
      
      <v-card-text>
        <v-textarea
          v-model="subjectNotes"
          label="Suas anotações"
          variant="outlined"
          rows="6"
          placeholder="Anote aqui suas observações, dúvidas ou pontos importantes..."
        />
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="notesDialog = false">Cancelar</v-btn>
        <v-btn color="primary" @click="saveNotes">Salvar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Header */
.cycles-header {
  background: white;
  border-bottom: 1px solid rgba(var(--v-theme-borderLight), 0.5);
  padding: 1rem 2rem;
  margin-bottom: 2rem;
}

.header-controls {
  margin: 1rem 0;
}

.header-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 1.5rem 0;
  gap: 2rem;
  background: rgba(var(--v-theme-containerBg), 0.5);
  border-radius: 16px;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.stat-item.progress-item {
  flex: 2;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 12px;
  color: rgb(var(--v-theme-primary));
}

.cycle-progress {
  background: rgba(0, 0, 0, 0.1) !important;
}

.cycle-actions {
  margin-left: auto;
}

/* Conteúdo Principal */
.cycles-content {
  padding: 0 2rem 2rem;
  min-height: calc(100vh - 300px);
}

.no-cycle-state,
.no-cycles-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.max-width-600 {
  max-width: 600px;
  margin: 0 auto;
}

/* Kanban Board */
.kanban-board {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  gap: 1.5rem;
  height: calc(100vh - 400px);
  min-height: 600px;
}

.kanban-column {
  background: #f8fafc;
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px dashed transparent;
  transition: all 0.3s ease;
}

.kanban-column:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.column-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Subject Cards */
.subject-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: grab;
  transition: all 0.3s ease;
  border-left: 4px solid;
}

.subject-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.subject-card:active {
  cursor: grabbing;
}

.to-study-card {
  border-left-color: #3b82f6;
}

.completed-card {
  border-left-color: #10b981;
  opacity: 0.9;
}

/* Study Card Expandida */
.study-card-expanded {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(var(--v-theme-primary), 0.2);
}

.study-header {
  margin-bottom: 2rem;
}

.pomodoro-timer {
  margin: 2rem 0;
}

.timer-display {
  position: relative;
  display: inline-block;
}

.timer-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.timer-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 2rem;
}

/* Empty States */
.empty-column,
.empty-study-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  flex: 1;
}

.empty-study-area {
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 12px;
  border: 2px dashed rgba(var(--v-theme-primary), 0.2);
}

/* Lista de Ciclos */
.cycles-list {
  max-height: 500px;
  overflow-y: auto;
}

.cycle-list-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.cycle-list-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.active-cycle-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.05), rgba(var(--v-theme-surface), 1));
  border: 2px solid rgba(var(--v-theme-success), 0.2);
}

.completed-cycle {
  opacity: 0.8;
  background: rgba(var(--v-theme-info), 0.02);
}

/* Performance Indicator */
.performance-indicator {
  display: flex;
  align-items: center;
}

/* Responsividade */
@media (max-width: 1200px) {
  .kanban-board {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    height: auto;
    gap: 1rem;
  }
  
  .cycles-content {
    padding: 0 1rem 1rem;
  }
  
  .header-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .stat-item {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .kanban-board {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(3, auto);
  }
  
  .kanban-column {
    min-height: 300px;
  }
  
  .header-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .header-stats {
    padding: 1rem;
  }
  
  .timer-controls {
    flex-direction: column;
  }
  
  .cycles-header {
    padding: 1rem;
  }
}

/* Animações */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.subject-card {
  animation: slideIn 0.3s ease;
}

/* Scrollbar customizada */
.column-content::-webkit-scrollbar,
.cycles-list::-webkit-scrollbar {
  width: 6px;
}

.column-content::-webkit-scrollbar-track,
.cycles-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb,
.cycles-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb:hover,
.cycles-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>