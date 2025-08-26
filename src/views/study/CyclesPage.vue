<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';
import type { StudyCycle, CycleSubject } from '@/types/study';

const studyStore = useStudyStore();
const page = ref({ title: 'Gerenciar Ciclos de Estudo' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Ciclos de Estudo', disabled: true, href: '#' }
]);

// Estados da interface
const selectedCycle = ref<StudyCycle | null>(null);
const viewMode = ref<'list' | 'kanban'>('list');
const editDialog = ref(false);
const deleteDialog = ref(false);
const cycleToDelete = ref<StudyCycle | null>(null);

// Estados de drag and drop
const draggedCycle = ref<StudyCycle | null>(null);
const draggedSubject = ref<CycleSubject | null>(null);
const dragOverCycle = ref<string | null>(null);
const dragOverStatus = ref<string | null>(null);

// Form para edição
const editForm = ref({
  id: '',
  name: '',
  description: '',
  examDate: '',
  weeklyGoal: 40,
  dailyGoal: 6,
  status: 'draft' as 'active' | 'paused' | 'completed' | 'draft'
});

// Computed properties
const cyclesByStatus = computed(() => {
  const cycles = studyStore.studyCycles;
  return {
    active: cycles.filter(c => c.status === 'active'),
    draft: cycles.filter(c => c.status === 'draft'),
    paused: cycles.filter(c => c.status === 'paused'),
    completed: cycles.filter(c => c.status === 'completed')
  };
});

const activeCycle = computed(() => studyStore.getActiveCycle);

const subjectsByStatus = computed(() => {
  if (!selectedCycle.value) return { to_study: [], studying: [], completed: [] };
  
  const subjects = selectedCycle.value.subjects || [];
  return {
    to_study: subjects.filter(s => s.status === 'to_study'),
    studying: subjects.filter(s => s.status === 'studying'),
    completed: subjects.filter(s => s.status === 'completed')
  };
});

// Funções de drag and drop para ciclos
const onCycleDragStart = (cycle: StudyCycle) => {
  draggedCycle.value = cycle;
};

const onCycleDragEnd = () => {
  draggedCycle.value = null;
  dragOverCycle.value = null;
};

const onCycleDragOver = (e: DragEvent, targetCycleId: string) => {
  e.preventDefault();
  dragOverCycle.value = targetCycleId;
};

const onCycleDragLeave = () => {
  dragOverCycle.value = null;
};

const onCycleDrop = (e: DragEvent, targetCycleId: string) => {
  e.preventDefault();
  if (!draggedCycle.value || draggedCycle.value.id === targetCycleId) return;
  
  // Reordenar ciclos
  const cycles = [...studyStore.studyCycles];
  const draggedIndex = cycles.findIndex(c => c.id === draggedCycle.value!.id);
  const targetIndex = cycles.findIndex(c => c.id === targetCycleId);
  
  if (draggedIndex !== -1 && targetIndex !== -1) {
    const [draggedItem] = cycles.splice(draggedIndex, 1);
    cycles.splice(targetIndex, 0, draggedItem);
    
    // Atualizar no store (seria necessário adicionar esta função)
    // studyStore.reorderCycles(cycles);
  }
  
  dragOverCycle.value = null;
};

// Funções de drag and drop para disciplinas
const onSubjectDragStart = (subject: CycleSubject) => {
  draggedSubject.value = subject;
};

const onSubjectDragEnd = () => {
  draggedSubject.value = null;
  dragOverStatus.value = null;
};

const onSubjectDragOver = (e: DragEvent, status: string) => {
  e.preventDefault();
  dragOverStatus.value = status;
};

const onSubjectDragLeave = () => {
  dragOverStatus.value = null;
};

const onSubjectDrop = (e: DragEvent, newStatus: 'to_study' | 'studying' | 'completed') => {
  e.preventDefault();
  if (!draggedSubject.value || !selectedCycle.value) return;
  
  // Atualizar status da disciplina
  studyStore.updateCycleSubject(
    selectedCycle.value.id,
    draggedSubject.value.id,
    { status: newStatus }
  );

// Funções de gerenciamento
const selectCycle = (cycle: StudyCycle) => {
  selectedCycle.value = cycle;
  viewMode.value = 'kanban';
};

const openEditDialog = (cycle: StudyCycle) => {
  editForm.value = {
    id: cycle.id,
    name: cycle.name,
    description: cycle.description,
    examDate: new Date(cycle.examDate).toISOString().split('T')[0],
    weeklyGoal: cycle.weeklyGoal,
    dailyGoal: cycle.dailyGoal,
    status: cycle.status
  };
  editDialog.value = true;
};

const saveCycle = () => {
  const updates = {
    name: editForm.value.name,
    description: editForm.value.description,
    examDate: new Date(editForm.value.examDate),
    weeklyGoal: editForm.value.weeklyGoal,
    dailyGoal: editForm.value.dailyGoal,
    status: editForm.value.status
  };
  
  studyStore.updateStudyCycle(editForm.value.id, updates);
  editDialog.value = false;
};

const openDeleteDialog = (cycle: StudyCycle) => {
  cycleToDelete.value = cycle;
  deleteDialog.value = true;
};

const confirmDelete = () => {
  if (cycleToDelete.value) {
    // Implementar função de deletar no store
    // studyStore.deleteStudyCycle(cycleToDelete.value.id);
    deleteDialog.value = false;
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

// Funções utilitárias
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'success';
    case 'paused': return 'warning';
    case 'completed': return 'info';
    case 'draft': return 'secondary';
    default: return 'primary';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return 'Ativo';
    case 'paused': return 'Pausado';
    case 'completed': return 'Concluído';
    case 'draft': return 'Rascunho';
    default: return status;
  }
};

const getDaysUntilExam = (examDate: Date) => {
  const now = new Date();
  const exam = new Date(examDate);
  const diffTime = exam.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

const getCycleProgress = (cycle: StudyCycle) => {
  if (!cycle.subjects || cycle.subjects.length === 0) return 0;
  const completed = cycle.subjects.filter(s => s.status === 'completed').length;
  return Math.round((completed / cycle.subjects.length) * 100);
};

onMounted(() => {
  studyStore.loadFromLocalStorage();
  if (activeCycle.value) {
    selectedCycle.value = activeCycle.value;
  }
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  
  <!-- Header com Controles -->
  <v-card class="mb-6" elevation="2">
    <v-card-text class="pa-6">
      <div class="d-flex align-center justify-space-between flex-wrap gap-4">
        <div class="d-flex align-center gap-4">
          <v-btn-toggle v-model="viewMode" mandatory variant="outlined" divided>
            <v-btn value="list" prepend-icon="mdi-view-list">
              Lista de Ciclos
            </v-btn>
            <v-btn value="kanban" prepend-icon="mdi-view-kanban" :disabled="!selectedCycle">
              Kanban
            </v-btn>
          </v-btn-toggle>
          
          <v-select
            v-if="viewMode === 'kanban'"
            v-model="selectedCycle"
            :items="studyStore.studyCycles"
            item-title="name"
            return-object
            label="Selecionar Ciclo"
            variant="outlined"
            density="compact"
            style="min-width: 250px"
          />
        </div>
        
        <div class="d-flex gap-2">
          <v-btn color="primary" prepend-icon="mdi-plus">
            <router-link to="/main/cycles/new" class="text-decoration-none text-white">
              Novo Ciclo
            </router-link>
          </v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>

  <!-- Visualização em Lista -->
  <div v-if="viewMode === 'list'" class="cycles-list">
    <!-- Ciclo Ativo -->
    <UiParentCard v-if="cyclesByStatus.active.length > 0" title="Ciclo Ativo" class="mb-6">
      <v-row>
        <v-col
          v-for="cycle in cyclesByStatus.active"
          :key="cycle.id"
          cols="12"
        >
          <v-card
            class="cycle-card active-cycle"
            elevation="4"
            draggable="true"
            @dragstart="onCycleDragStart(cycle)"
            @dragend="onCycleDragEnd"
            @dragover="onCycleDragOver($event, cycle.id)"
            @dragleave="onCycleDragLeave"
            @drop="onCycleDrop($event, cycle.id)"
            :class="{ 'drag-over': dragOverCycle === cycle.id }"
          >
            <v-card-text class="pa-6">
              <div class="d-flex align-center justify-space-between mb-4">
                <div class="d-flex align-center">
                  <v-avatar color="success" size="48" class="me-4">
                    <SvgSprite name="custom-refresh" style="width: 24px; height: 24px" />
                  </v-avatar>
                  <div>
                    <h5 class="text-h5 mb-1">{{ cycle.name }}</h5>
                    <v-chip color="success" size="small" variant="tonal">
                      {{ getStatusText(cycle.status) }}
                    </v-chip>
                  </div>
                </div>
                
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn icon variant="text" v-bind="props">
                      <SvgSprite name="custom-more" style="width: 20px; height: 20px" />
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item @click="selectCycle(cycle)">
                      <template v-slot:prepend>
                        <SvgSprite name="custom-eye" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Ver Kanban</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="openEditDialog(cycle)">
                      <template v-slot:prepend>
                        <SvgSprite name="custom-edit" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Editar</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="pauseCycle(cycle.id)">
                      <template v-slot:prepend>
                        <SvgSprite name="custom-pause" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Pausar</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="completeCycle(cycle.id)">
                      <template v-slot:prepend>
                        <SvgSprite name="custom-check" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Concluir</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
              
              <p class="text-body-2 text-lightText mb-4">{{ cycle.description }}</p>
              
              <v-row class="mb-4">
                <v-col cols="12" sm="4">
                  <div class="stat-item">
                    <SvgSprite name="custom-calendar" style="width: 20px; height: 20px" class="me-2" />
                    <div>
                      <div class="text-h6">{{ getDaysUntilExam(cycle.examDate) }}</div>
                      <div class="text-caption text-lightText">dias restantes</div>
                    </div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="stat-item">
                    <SvgSprite name="custom-clock" style="width: 20px; height: 20px" class="me-2" />
                    <div>
                      <div class="text-h6">{{ cycle.weeklyGoal }}h</div>
                      <div class="text-caption text-lightText">meta semanal</div>
                    </div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="stat-item">
                    <SvgSprite name="custom-target" style="width: 20px; height: 20px" class="me-2" />
                    <div>
                      <div class="text-h6">{{ getCycleProgress(cycle) }}%</div>
                      <div class="text-caption text-lightText">progresso</div>
                    </div>
                  </div>
                </v-col>
              </v-row>
              
              <v-progress-linear
                :model-value="getCycleProgress(cycle)"
                color="success"
                height="8"
                rounded
                class="mb-4"
              />
              
              <div class="subjects-preview">
                <h6 class="text-h6 mb-2">Disciplinas ({{ cycle.subjects?.length || 0 }})</h6>
                <div class="d-flex flex-wrap gap-2">
                  <v-chip
                    v-for="subject in (cycle.subjects || []).slice(0, 5)"
                    :key="subject.id"
                    :color="subject.color"
                    size="small"
                    variant="tonal"
                  >
                    {{ subject.name }}
                  </v-chip>
                  <v-chip
                    v-if="(cycle.subjects?.length || 0) > 5"
                    size="small"
                    variant="outlined"
                  >
                    +{{ (cycle.subjects?.length || 0) - 5 }} mais
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </UiParentCard>

    <!-- Próximos Ciclos -->
    <UiParentCard v-if="cyclesByStatus.draft.length > 0 || cyclesByStatus.paused.length > 0" title="Próximos Ciclos" class="mb-6">
      <v-row>
        <v-col
          v-for="cycle in [...cyclesByStatus.draft, ...cyclesByStatus.paused]"
          :key="cycle.id"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card
            class="cycle-card h-100"
            draggable="true"
            @dragstart="onCycleDragStart(cycle)"
            @dragend="onCycleDragEnd"
            @dragover="onCycleDragOver($event, cycle.id)"
            @dragleave="onCycleDragLeave"
            @drop="onCycleDrop($event, cycle.id)"
            :class="{ 'drag-over': dragOverCycle === cycle.id }"
          >
            <v-card-text class="pa-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <v-chip :color="getStatusColor(cycle.status)" size="small" variant="tonal">
                  {{ getStatusText(cycle.status) }}
                </v-chip>
                
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
                    <v-list-item @click="selectCycle(cycle)">
                      <template v-slot:prepend>
                        <SvgSprite name="custom-eye" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Ver Detalhes</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="openEditDialog(cycle)">
                      <template v-slot:prepend>
                        <SvgSprite name="custom-edit" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Editar</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="openDeleteDialog(cycle)" class="text-error">
                      <template v-slot:prepend>
                        <SvgSprite name="custom-trash" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Excluir</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
              
              <h6 class="text-h6 mb-2">{{ cycle.name }}</h6>
              <p class="text-caption text-lightText mb-3">{{ cycle.description }}</p>
              
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption">Progresso</span>
                <span class="text-caption">{{ getCycleProgress(cycle) }}%</span>
              </div>
              
              <v-progress-linear
                :model-value="getCycleProgress(cycle)"
                :color="getStatusColor(cycle.status)"
                height="6"
                rounded
                class="mb-3"
              />
              
              <div class="d-flex align-center justify-space-between text-caption">
                <span>{{ cycle.subjects?.length || 0 }} disciplinas</span>
                <span>{{ getDaysUntilExam(cycle.examDate) }} dias</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </UiParentCard>

    <!-- Ciclos Finalizados -->
    <UiParentCard v-if="cyclesByStatus.completed.length > 0" title="Ciclos Finalizados">
      <v-row>
        <v-col
          v-for="cycle in cyclesByStatus.completed"
          :key="cycle.id"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card
            class="cycle-card h-100 completed-cycle"
            draggable="true"
            @dragstart="onCycleDragStart(cycle)"
            @dragend="onCycleDragEnd"
            @dragover="onCycleDragOver($event, cycle.id)"
            @dragleave="onCycleDragLeave"
            @drop="onCycleDrop($event, cycle.id)"
            :class="{ 'drag-over': dragOverCycle === cycle.id }"
          >
            <v-card-text class="pa-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <v-chip color="info" size="small" variant="tonal">
                  Concluído
                </v-chip>
                
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn icon size="small" variant="text" v-bind="props">
                      <SvgSprite name="custom-more" style="width: 16px; height: 16px" />
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item @click="selectCycle(cycle)">
                      <template v-slot:prepend>
                        <SvgSprite name="custom-eye" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Ver Detalhes</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="openDeleteDialog(cycle)" class="text-error">
                      <template v-slot:prepend>
                        <SvgSprite name="custom-trash" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Excluir</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
              
              <h6 class="text-h6 mb-2">{{ cycle.name }}</h6>
              <p class="text-caption text-lightText mb-3">{{ cycle.description }}</p>
              
              <div class="d-flex align-center mb-2">
                <SvgSprite name="custom-check" style="width: 16px; height: 16px" class="me-2 text-success" />
                <span class="text-caption">100% Concluído</span>
              </div>
              
              <div class="d-flex align-center justify-space-between text-caption">
                <span>{{ cycle.subjects?.length || 0 }} disciplinas</span>
                <span>Finalizado</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </UiParentCard>

    <!-- Estado Vazio -->
    <div v-if="studyStore.studyCycles.length === 0" class="text-center py-12">
      <v-avatar color="grey-lighten-2" size="80" class="mb-4">
        <SvgSprite name="custom-refresh" style="width: 40px; height: 40px; opacity: 0.5" />
      </v-avatar>
      <h5 class="text-h5 mb-2">Nenhum ciclo de estudo criado</h5>
      <p class="text-subtitle-1 text-lightText mb-6">
        Organize seus estudos criando ciclos estruturados com disciplinas e cronogramas
      </p>
      <v-btn color="primary" size="large" prepend-icon="mdi-plus">
        <router-link to="/main/cycles/new" class="text-decoration-none text-white">
          Criar Primeiro Ciclo
        </router-link>
      </v-btn>
    </div>
  </div>

  <!-- Visualização Kanban -->
  <div v-if="viewMode === 'kanban' && selectedCycle" class="kanban-view">
    <UiParentCard :title="`${selectedCycle.name} - Kanban`">
      <template v-slot:action>
        <div class="d-flex align-center gap-2">
          <v-chip :color="getStatusColor(selectedCycle.status)" variant="tonal">
            {{ getStatusText(selectedCycle.status) }}
          </v-chip>
          <v-btn color="primary" variant="outlined" @click="openEditDialog(selectedCycle)">
            Editar Ciclo
          </v-btn>
        </div>
      </template>

      <div class="kanban-board">
        <!-- Coluna A Estudar -->
        <div
          class="kanban-column"
          @dragover="onSubjectDragOver($event, 'to_study')"
          @dragleave="onSubjectDragLeave"
          @drop="onSubjectDrop($event, 'to_study')"
          :class="{ 'drag-over': dragOverStatus === 'to_study' }"
        >
          <div class="column-header to-study">
            <div class="d-flex align-center">
              <SvgSprite name="custom-book" style="width: 20px; height: 20px" class="me-2" />
              <h6 class="text-h6 mb-0">A Estudar</h6>
            </div>
            <v-chip size="small" variant="tonal">{{ subjectsByStatus.to_study.length }}</v-chip>
          </div>
          
          <div class="column-content">
            <div
              v-for="subject in subjectsByStatus.to_study"
              :key="subject.id"
              class="subject-card"
              draggable="true"
              @dragstart="onSubjectDragStart(subject)"
              @dragend="onSubjectDragEnd"
            >
              <div class="d-flex align-center justify-space-between mb-2">
                <v-avatar :color="subject.color" size="24">
                  <span class="text-caption font-weight-bold">{{ subject.name.charAt(0) }}</span>
                </v-avatar>
                <v-chip size="x-small" color="info" variant="tonal">
                  {{ formatMinutes(subject.estimatedMinutes) }}
                </v-chip>
              </div>
              <h6 class="text-subtitle-2 mb-1">{{ subject.name }}</h6>
              <p v-if="subject.notes" class="text-caption text-lightText mb-0">{{ subject.notes }}</p>
            </div>
          </div>
        </div>

        <!-- Coluna Em Estudo -->
        <div
          class="kanban-column studying"
          @dragover="onSubjectDragOver($event, 'studying')"
          @dragleave="onSubjectDragLeave"
          @drop="onSubjectDrop($event, 'studying')"
          :class="{ 'drag-over': dragOverStatus === 'studying' }"
        >
          <div class="column-header studying">
            <div class="d-flex align-center">
              <SvgSprite name="custom-play" style="width: 20px; height: 20px" class="me-2" />
              <h6 class="text-h6 mb-0">Em Estudo</h6>
            </div>
            <v-chip size="small" variant="tonal" color="warning">{{ subjectsByStatus.studying.length }}</v-chip>
          </div>
          
          <div class="column-content">
            <div
              v-for="subject in subjectsByStatus.studying"
              :key="subject.id"
              class="subject-card studying"
              draggable="true"
              @dragstart="onSubjectDragStart(subject)"
              @dragend="onSubjectDragEnd"
            >
              <div class="d-flex align-center justify-space-between mb-2">
                <v-avatar :color="subject.color" size="24">
                  <span class="text-caption font-weight-bold">{{ subject.name.charAt(0) }}</span>
                </v-avatar>
                <v-chip size="x-small" color="warning" variant="tonal">
                  {{ formatMinutes(subject.actualMinutes) }}
                </v-chip>
              </div>
              <h6 class="text-subtitle-2 mb-1">{{ subject.name }}</h6>
              <div class="progress-bar">
                <v-progress-linear
                  :model-value="(subject.actualMinutes / subject.estimatedMinutes) * 100"
                  color="warning"
                  height="4"
                  rounded
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna Concluído -->
        <div
          class="kanban-column"
          @dragover="onSubjectDragOver($event, 'completed')"
          @dragleave="onSubjectDragLeave"
          @drop="onSubjectDrop($event, 'completed')"
          :class="{ 'drag-over': dragOverStatus === 'completed' }"
        >
          <div class="column-header completed">
            <div class="d-flex align-center">
              <SvgSprite name="custom-check" style="width: 20px; height: 20px" class="me-2" />
              <h6 class="text-h6 mb-0">Concluído</h6>
            </div>
            <v-chip size="small" variant="tonal" color="success">{{ subjectsByStatus.completed.length }}</v-chip>
          </div>
          
          <div class="column-content">
            <div
              v-for="subject in subjectsByStatus.completed"
              :key="subject.id"
              class="subject-card completed"
              draggable="true"
              @dragstart="onSubjectDragStart(subject)"
              @dragend="onSubjectDragEnd"
            >
              <div class="d-flex align-center justify-space-between mb-2">
                <v-avatar :color="subject.color" size="24">
                  <SvgSprite name="custom-check" style="width: 12px; height: 12px" />
                </v-avatar>
                <v-chip size="x-small" color="success" variant="tonal">
                  {{ formatMinutes(subject.actualMinutes) }}
                </v-chip>
              </div>
              <h6 class="text-subtitle-2 mb-1">{{ subject.name }}</h6>
              <p v-if="subject.completedAt" class="text-caption text-lightText mb-0">
                Concluído em {{ new Date(subject.completedAt).toLocaleDateString() }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </UiParentCard>
  </div>

  <!-- Dialog de Edição -->
  <v-dialog v-model="editDialog" max-width="600px" persistent>
    <v-card>
      <v-card-title>Editar Ciclo</v-card-title>
      
      <v-card-text>
        <v-form>
          <v-text-field
            v-model="editForm.name"
            label="Nome do Ciclo"
            variant="outlined"
            class="mb-4"
          />
          
          <v-textarea
            v-model="editForm.description"
            label="Descrição"
            variant="outlined"
            rows="3"
            class="mb-4"
          />
          
          <v-text-field
            v-model="editForm.examDate"
            label="Data da Prova"
            type="date"
            variant="outlined"
            class="mb-4"
          />
          
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="editForm.dailyGoal"
                label="Meta Diária (horas)"
                type="number"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="editForm.weeklyGoal"
                label="Meta Semanal (horas)"
                type="number"
                variant="outlined"
              />
            </v-col>
          </v-row>
          
          <v-select
            v-model="editForm.status"
            :items="[
              { title: 'Rascunho', value: 'draft' },
              { title: 'Ativo', value: 'active' },
              { title: 'Pausado', value: 'paused' },
              { title: 'Concluído', value: 'completed' }
            ]"
            label="Status"
            variant="outlined"
          />
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="editDialog = false">Cancelar</v-btn>
        <v-btn color="primary" @click="saveCycle">Salvar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog de Confirmação de Exclusão -->
  <v-dialog v-model="deleteDialog" max-width="500px" persistent>
    <v-card>
      <v-card-title class="text-error">Excluir Ciclo</v-card-title>
      
      <v-card-text>
        <p class="text-subtitle-1 mb-4">
          Tem certeza que deseja excluir o ciclo <strong>{{ cycleToDelete?.name }}</strong>?
        </p>
        
        <v-alert type="warning" variant="tonal">
          Esta ação não pode ser desfeita e todos os dados do ciclo serão perdidos.
        </v-alert>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="deleteDialog = false; cycleToDelete = null;">Cancelar</v-btn>
        <v-btn color="error" @click="confirmDelete">Excluir</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Layout Principal */
.cycles-list {
  min-height: 400px;
}

/* Cards de Ciclo */
.cycle-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: grab;
  border-radius: 16px;
}

.cycle-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.cycle-card:active {
  cursor: grabbing;
}

.cycle-card.drag-over {
  transform: scale(1.02);
  box-shadow: 0 8px 30px rgba(var(--v-theme-primary), 0.3);
  border: 2px dashed rgb(var(--v-theme-primary));
}

.active-cycle {
  border: 2px solid rgb(var(--v-theme-success));
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.05), rgba(var(--v-theme-surface), 1));
}

.completed-cycle {
  opacity: 0.8;
  background: rgba(var(--v-theme-containerBg), 0.5);
}

/* Estatísticas */
.stat-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: rgba(var(--v-theme-containerBg), 0.5);
  transform: translateY(-2px);
}

/* Preview de Disciplinas */
.subjects-preview {
  padding: 1rem;
  background: rgba(var(--v-theme-containerBg), 0.2);
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

/* Kanban Board */
.kanban-view {
  min-height: 600px;
}

.kanban-board {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1.5rem;
  min-height: 500px;
  padding: 1rem;
}

.kanban-column {
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  min-height: 400px;
}

.kanban-column.drag-over {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
  transform: scale(1.02);
}

.column-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(var(--v-theme-borderLight), 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(var(--v-theme-surface), 0.8);
  border-radius: 16px 16px 0 0;
}

.column-header.to-study {
  background: linear-gradient(135deg, rgba(var(--v-theme-info), 0.1), rgba(var(--v-theme-surface), 0.9));
}

.column-header.studying {
  background: linear-gradient(135deg, rgba(var(--v-theme-warning), 0.1), rgba(var(--v-theme-surface), 0.9));
}

.column-header.completed {
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.1), rgba(var(--v-theme-surface), 0.9));
}

.column-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 300px;
}

/* Cards de Disciplina */
.subject-card {
  background: rgba(var(--v-theme-surface), 0.9);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
  cursor: grab;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.subject-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.subject-card:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.subject-card.studying {
  border-left: 4px solid rgb(var(--v-theme-warning));
  background: linear-gradient(135deg, rgba(var(--v-theme-warning), 0.05), rgba(var(--v-theme-surface), 0.95));
}

.subject-card.completed {
  border-left: 4px solid rgb(var(--v-theme-success));
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.05), rgba(var(--v-theme-surface), 0.95));
  opacity: 0.9;
}

.progress-bar {
  margin-top: 0.5rem;
}

/* Responsividade */
@media (max-width: 1200px) {
  .kanban-board {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .kanban-column {
    min-height: 200px;
  }
  
  .column-content {
    min-height: 150px;
  }
}

@media (max-width: 768px) {
  .stat-item {
    padding: 0.75rem;
  }
  
  .cycle-card .pa-6 {
    padding: 1rem !important;
  }
  
  .subjects-preview {
    padding: 0.75rem;
  }
}

/* Animações */
@keyframes dragPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.cycle-card:active,
.subject-card:active {
  animation: dragPulse 0.6s ease-in-out infinite;
}

/* Estados de Loading */
.loading-state {
  opacity: 0.6;
  pointer-events: none;
}

/* Melhorias visuais */
.v-card {
  overflow: visible;
}

.v-chip {
  font-weight: 500;
}

.text-h6 {
  font-weight: 600;
}
</style>