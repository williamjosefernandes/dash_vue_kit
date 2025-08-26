<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';
import type { CycleSubject } from '@/types/study';

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
const currentSubject = ref<CycleSubject | null>(null);
const subjectNotes = ref('');

// Form para novo subject
const newSubjectForm = ref({
  subjectId: '',
  estimatedMinutes: 25,
  priority: 'medium' as 'low' | 'medium' | 'high'
});

// Timer display
const timerDisplay = ref('00:00');
let timerInterval: number | null = null;

// Computed properties
const activeCycle = computed(() => studyStore.getActiveCycle);
const daysUntilExam = computed(() => studyStore.getDaysUntilExam);
const weeklyProgress = computed(() => studyStore.getWeeklyProgress);
const weeklyHours = computed(() => studyStore.getStudyStats.weeklyHours);

const toStudySubjects = computed(() => studyStore.getCycleSubjectsByStatus('to_study'));
const studyingSubjects = computed(() => studyStore.getCycleSubjectsByStatus('studying'));
const reviewSubjects = computed(() => studyStore.getCycleSubjectsByStatus('review'));
const completedSubjects = computed(() => studyStore.getCycleSubjectsByStatus('completed'));

const currentStudyingSubject = computed(() => {
  return studyingSubjects.value.length > 0 ? studyingSubjects.value[0] : null;
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

const getReviewUrgencyColor = (reviewType?: string) => {
  switch (reviewType) {
    case '24h': return 'info';
    case '7d': return 'warning';
    case '30d': return 'error';
    default: return 'secondary';
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
  
  // Mostrar mensagem de parabéns
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
  // Implementar notificação de parabéns
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

const moveToReview = (subject: CycleSubject) => {
  studyStore.moveSubjectToStatus(subject.id, 'review');
};

// Drag and drop
const onDragStart = (event: DragEvent, subject: CycleSubject) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', JSON.stringify(subject));
  }
};

const onDrop = (event: DragEvent, status: 'to_study' | 'studying' | 'review' | 'completed') => {
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
  <!-- Header Fixo -->
  <div class="cycles-header">
    <div class="header-stats">
      <div class="stat-item">
        <div class="stat-icon">
          <SvgSprite name="custom-calendar" style="width: 24px; height: 24px" />
        </div>
        <div>
          <h3 class="text-h3 text-white mb-0">{{ daysUntilExam }}</h3>
          <p class="text-caption text-white opacity-80 mb-0">dias para a prova</p>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icon">
          <SvgSprite name="custom-clock" style="width: 24px; height: 24px" />
        </div>
        <div>
          <h3 class="text-h3 text-white mb-0">{{ weeklyHours.toFixed(1) }}h</h3>
          <p class="text-caption text-white opacity-80 mb-0">estudadas esta semana</p>
        </div>
      </div>
      
      <div class="stat-item progress-item">
        <div class="stat-icon">
          <SvgSprite name="custom-target" style="width: 24px; height: 24px" />
        </div>
        <div class="flex-grow-1">
          <div class="d-flex align-center justify-space-between mb-1">
            <p class="text-caption text-white opacity-80 mb-0">Meta semanal</p>
            <span class="text-caption text-white font-weight-bold">{{ Math.round(weeklyProgress) }}%</span>
          </div>
          <v-progress-linear
            :model-value="weeklyProgress"
            color="success"
            height="8"
            rounded
            class="weekly-progress"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Conteúdo Principal -->
  <div class="cycles-content">
    <div v-if="!activeCycle" class="no-cycle-state">
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

  <!-- Rodapé com Métricas -->
  <div v-if="activeCycle" class="cycles-footer">
    <div class="footer-metrics">
      <div class="metric-item">
        <SvgSprite name="custom-clock" style="width: 20px; height: 20px" class="me-2" />
        <div>
          <span class="text-caption text-lightText">Hoje:</span>
          <span class="text-subtitle-2 font-weight-bold ml-1">2.5h</span>
        </div>
      </div>
      
      <div class="metric-item">
        <SvgSprite name="custom-calendar" style="width: 20px; height: 20px" class="me-2" />
        <div>
          <span class="text-caption text-lightText">Semana:</span>
          <span class="text-subtitle-2 font-weight-bold ml-1">{{ weeklyHours.toFixed(1) }}h</span>
        </div>
      </div>
      
      <div class="metric-item">
        <SvgSprite name="custom-trophy" style="width: 20px; height: 20px" class="me-2" />
        <div>
          <span class="text-caption text-lightText">Ranking:</span>
          <span class="text-subtitle-2 font-weight-bold ml-1">#15</span>
        </div>
      </div>
    </div>
    
    <v-btn 
      color="success" 
      size="large" 
      icon
      class="add-fab"
      @click="openAddSubjectDialog"
    >
      <SvgSprite name="custom-plus" style="width: 24px; height: 24px" />
    </v-btn>
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
/* Header Fixo */
.cycles-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.header-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 1rem 2rem;
  gap: 2rem;
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
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgb(var(--v-theme-darkText));
}

.weekly-progress {
  background: rgba(0, 0, 0, 0.1) !important;
}

/* Conteúdo Principal */
.cycles-content {
  padding: 2rem;
  min-height: calc(100vh - 200px);
}

.no-cycle-state {
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
  height: calc(100vh - 300px);
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

.review-card {
  border-left-color: #f59e0b;
  position: relative;
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

/* Performance Indicator */
.performance-indicator {
  display: flex;
  align-items: center;
}

/* Rodapé */
.cycles-footer {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.footer-metrics {
  display: flex;
  gap: 2rem;
}

.metric-item {
  display: flex;
  align-items: center;
}

.add-fab {
  box-shadow: 0 4px 16px rgba(var(--v-theme-success), 0.3);
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
    padding: 1rem;
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
    grid-template-rows: repeat(4, auto);
  }
  
  .kanban-column {
    min-height: 300px;
  }
  
  .header-top {
    padding: 1rem;
  }
  
  .header-stats {
    padding: 1rem;
  }
  
  .footer-metrics {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .timer-controls {
    flex-direction: column;
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
.column-content::-webkit-scrollbar {
  width: 6px;
}

.column-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>