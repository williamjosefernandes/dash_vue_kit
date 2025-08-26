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
    case 'high': return 'mdi-arrow-up';
    case 'medium': return 'mdi-minus';
    case 'low': return 'mdi-arrow-down';
    default: return 'mdi-minus';
  }
};

const startStudy = (subject: CycleSubject) => {
  studyStore.startStudySession(subject.id);
};

const completeSubject = (subject: CycleSubject) => {
  studyStore.completeSubject(subject.id);
};

const addSubjectToCycle = () => {
  if (activeCycle.value && newSubjectForm.value.subjectId) {
    studyStore.addSubjectToCycle(activeCycle.value.id, {
      subjectId: newSubjectForm.value.subjectId,
      estimatedMinutes: newSubjectForm.value.estimatedMinutes,
      priority: newSubjectForm.value.priority
    });
    addSubjectDialog.value = false;
    newSubjectForm.value = {
      subjectId: '',
      estimatedMinutes: 25,
      priority: 'medium'
    };
  }
};

onMounted(() => {
  studyStore.loadFromLocalStorage();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  
  <!-- Header com Estatísticas -->
  <v-row class="mb-6">
    <v-col cols="12">
      <v-card class="pa-4" style="background: white;">
        <v-row align="center" justify="space-between">
          <v-col cols="auto">
            <div class="d-flex align-center gap-8">
              <div class="text-center">
                <div class="text-h4 font-weight-bold text-primary">{{ daysUntilExam }}</div>
                <div class="text-caption text-medium-emphasis">Dias até a prova</div>
              </div>
              <div class="text-center">
                <div class="text-h4 font-weight-bold text-success">{{ weeklyHours }}h</div>
                <div class="text-caption text-medium-emphasis">Horas semanais</div>
              </div>
              <div class="text-center">
                <div class="text-h4 font-weight-bold text-info">{{ weeklyProgress }}%</div>
                <div class="text-caption text-medium-emphasis">Progresso</div>
              </div>
            </div>
          </v-col>
          <v-col cols="auto">
            <v-btn color="primary" variant="outlined" prepend-icon="mdi-cog">
              <router-link to="/main/cycles/manage" class="text-decoration-none">
                Gerenciar Ciclos
              </router-link>
            </v-btn>
          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-row>

  <!-- Conteúdo Principal -->
  <UiParentCard v-if="activeCycle" :title="activeCycle.name">
    <template v-slot:action>
      <div class="d-flex gap-2">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="addSubjectDialog = true">
          Adicionar Matéria
        </v-btn>
      </div>
    </template>

    <!-- Kanban Board -->
    <div class="kanban-board">
      <div class="kanban-columns">
        <!-- A Estudar -->
        <div class="kanban-column">
          <div class="column-header to-study">
            <h6 class="text-h6 mb-0">A Estudar</h6>
            <v-chip size="small" color="secondary">{{ toStudySubjects.length }}</v-chip>
          </div>
          <div class="column-content">
            <div 
              v-for="subject in toStudySubjects" 
              :key="subject.id"
              class="subject-card"
            >
              <div class="d-flex justify-space-between align-center mb-2">
                <h6 class="text-subtitle-1 font-weight-medium">{{ subject.name }}</h6>
                <v-chip 
                  size="x-small" 
                  :color="getPriorityColor(subject.priority)"
                  :prepend-icon="getPriorityIcon(subject.priority)"
                >
                  {{ subject.priority }}
                </v-chip>
              </div>
              <div class="text-caption text-medium-emphasis mb-3">
                {{ formatMinutes(subject.estimatedMinutes) }}
              </div>
              <v-btn 
                color="primary" 
                size="small" 
                block
                @click="startStudy(subject)"
              >
                Iniciar Estudo
              </v-btn>
            </div>
          </div>
        </div>

        <!-- Em Estudo -->
        <div class="kanban-column studying">
          <div class="column-header studying">
            <h6 class="text-h6 mb-0">Em Estudo</h6>
            <v-chip size="small" color="primary">{{ studyingSubjects.length }}</v-chip>
          </div>
          <div class="column-content">
            <div 
              v-for="subject in studyingSubjects" 
              :key="subject.id"
              class="subject-card studying-card"
            >
              <div class="d-flex justify-space-between align-center mb-2">
                <h6 class="text-subtitle-1 font-weight-medium">{{ subject.name }}</h6>
                <v-chip size="x-small" color="primary">
                  Em andamento
                </v-chip>
              </div>
              <div class="text-caption text-medium-emphasis mb-3">
                {{ formatMinutes(subject.studiedMinutes || 0) }} / {{ formatMinutes(subject.estimatedMinutes) }}
              </div>
              <div class="d-flex gap-2">
                <v-btn 
                  color="success" 
                  size="small" 
                  variant="outlined"
                  @click="completeSubject(subject)"
                >
                  Concluir
                </v-btn>
              </div>
            </div>
          </div>
        </div>

        <!-- Concluído -->
        <div class="kanban-column">
          <div class="column-header completed">
            <h6 class="text-h6 mb-0">Concluído</h6>
            <v-chip size="small" color="success">{{ completedSubjects.length }}</v-chip>
          </div>
          <div class="column-content">
            <div 
              v-for="subject in completedSubjects" 
              :key="subject.id"
              class="subject-card completed-card"
            >
              <div class="d-flex justify-space-between align-center mb-2">
                <h6 class="text-subtitle-1 font-weight-medium">{{ subject.name }}</h6>
                <v-chip size="x-small" color="success">
                  Concluído
                </v-chip>
              </div>
              <div class="text-caption text-medium-emphasis mb-3">
                {{ formatMinutes(subject.studiedMinutes || 0) }}
              </div>
              <v-btn 
                color="primary" 
                size="small" 
                variant="outlined"
                block
                @click="startStudy(subject)"
              >
                Estudar Novamente
              </v-btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UiParentCard>

  <!-- Estado Vazio -->
  <UiParentCard v-else title="Nenhum Ciclo Ativo">
    <div class="text-center py-8">
      <SvgSprite name="custom-calendar" style="width: 64px; height: 64px; opacity: 0.5;" class="mb-4" />
      <h6 class="text-h6 mb-2">Nenhum ciclo de estudo ativo</h6>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Crie um novo ciclo ou ative um existente para começar a estudar
      </p>
      <div class="d-flex gap-2 justify-center">
        <v-btn color="primary" prepend-icon="mdi-plus">
          <router-link to="/main/cycles/new" class="text-decoration-none text-white">
            Criar Novo Ciclo
          </router-link>
        </v-btn>
        <v-btn color="secondary" variant="outlined" prepend-icon="mdi-cog">
          <router-link to="/main/cycles/manage" class="text-decoration-none">
            Gerenciar Ciclos
          </router-link>
        </v-btn>
      </div>
    </div>
  </UiParentCard>

  <!-- Dialog: Adicionar Matéria -->
  <v-dialog v-model="addSubjectDialog" max-width="500">
    <v-card>
      <v-card-title>Adicionar Matéria ao Ciclo</v-card-title>
      <v-card-text>
        <v-form>
          <v-select
            v-model="newSubjectForm.subjectId"
            :items="studyStore.subjects"
            item-title="name"
            item-value="id"
            label="Matéria"
            required
          />
          <v-text-field
            v-model.number="newSubjectForm.estimatedMinutes"
            label="Tempo Estimado (minutos)"
            type="number"
            min="1"
            required
          />
          <v-select
            v-model="newSubjectForm.priority"
            :items="[
              { title: 'Alta', value: 'high' },
              { title: 'Média', value: 'medium' },
              { title: 'Baixa', value: 'low' }
            ]"
            label="Prioridade"
            required
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="addSubjectDialog = false">Cancelar</v-btn>
        <v-btn color="primary" @click="addSubjectToCycle">Adicionar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.kanban-board {
  width: 100%;
  overflow-x: auto;
}

.kanban-columns {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  gap: 24px;
  min-width: 800px;
  padding: 16px 0;
}

.kanban-column {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  min-height: 400px;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e0e0e0;
}

.column-header.studying {
  border-bottom-color: #1976d2;
}

.column-header.completed {
  border-bottom-color: #4caf50;
}

.column-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subject-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.subject-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.studying-card {
  border-left: 4px solid #1976d2;
}

.completed-card {
  border-left: 4px solid #4caf50;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .kanban-columns {
    grid-template-columns: 1fr;
    min-width: unset;
  }
}
</style>