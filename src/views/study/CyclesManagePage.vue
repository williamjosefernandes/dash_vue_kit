<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';
import type { StudyCycle, CycleSubject } from '@/types/study';

const studyStore = useStudyStore();
const page = ref({ title: 'Gerenciar Ciclos' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Ciclos de Estudo', disabled: false, href: '/main/cycles' },
  { title: 'Gerenciar Ciclos', disabled: true, href: '#' }
]);

// Estados dos dialogs
const editDialog = ref(false);
const deleteDialog = ref(false);
const viewDialog = ref(false);
const topicsDialog = ref(false);
const currentCycle = ref<StudyCycle | null>(null);
const cycleToDelete = ref<StudyCycle | null>(null);
const selectedCycleForTopics = ref<StudyCycle | null>(null);

// Estados de drag and drop
const draggedSubject = ref<CycleSubject | null>(null);
const dragOverCycle = ref<string | null>(null);

// Form para editar ciclo
const form = ref();
const valid = ref(false);
const editForm = ref({
  name: '',
  description: '',
  examDate: '',
  weeklyGoal: 40,
  dailyGoal: 6,
  status: 'draft' as 'active' | 'paused' | 'completed' | 'draft'
});

// Filtros e ordenação
const statusFilter = ref('all');
const sortBy = ref('examDate');
const viewMode = ref<'cards' | 'detailed'>('cards');

const rules = {
  required: (v: string) => !!v || 'Campo obrigatório',
  minGoal: (v: number) => v > 0 || 'Meta deve ser maior que zero',
  futureDate: (v: string) => {
    const selected = new Date(v);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected >= today || 'Data deve ser futura';
  }
};

// Computed properties
const filteredCycles = computed(() => {
  let cycles = [...studyStore.studyCycles];
  
  // Filtrar por status
  if (statusFilter.value !== 'all') {
    cycles = cycles.filter(cycle => cycle.status === statusFilter.value);
  }
  
  // Ordenar
  return cycles.sort((a, b) => {
    if (sortBy.value === 'examDate') {
      return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
    } else if (sortBy.value === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy.value === 'created') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });
});

const cyclesByStatus = computed(() => {
  const cycles = studyStore.studyCycles;
  return {
    active: cycles.filter(cycle => cycle.status === 'active'),
    draft: cycles.filter(cycle => cycle.status === 'draft'),
    paused: cycles.filter(cycle => cycle.status === 'paused'),
    completed: cycles.filter(cycle => cycle.status === 'completed')
  };
});

// Methods
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
  return diffDays;
};

const getCycleProgress = (cycle: StudyCycle) => {
  if (!cycle.subjects || cycle.subjects.length === 0) return 0;
  
  const completedSubjects = cycle.subjects.filter(s => s.status === 'completed').length;
  return Math.round((completedSubjects / cycle.subjects.length) * 100);
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('pt-BR');
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

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'high': return 'Alta';
    case 'medium': return 'Média';
    case 'low': return 'Baixa';
    default: return priority;
  }
};

const getSubjectTopics = (subjectId: string) => {
  const subject = studyStore.getSubjectById(subjectId);
  return subject?.topics || [];
};

const getTotalSubtopics = (subjectId: string) => {
  const topics = getSubjectTopics(subjectId);
  return topics.reduce((total, topic) => total + topic.subtopics.length, 0);
};

// Dialog methods
const openEditDialog = (cycle: StudyCycle) => {
  currentCycle.value = cycle;
  editForm.value = {
    name: cycle.name,
    description: cycle.description,
    examDate: new Date(cycle.examDate).toISOString().split('T')[0],
    weeklyGoal: cycle.weeklyGoal,
    dailyGoal: cycle.dailyGoal,
    status: cycle.status
  };
  editDialog.value = true;
};

const openViewDialog = (cycle: StudyCycle) => {
  currentCycle.value = cycle;
  viewDialog.value = true;
};

const openDeleteDialog = (cycle: StudyCycle) => {
  cycleToDelete.value = cycle;
  deleteDialog.value = true;
};

const openTopicsDialog = (cycle: StudyCycle) => {
  selectedCycleForTopics.value = cycle;
  topicsDialog.value = true;
};

const saveCycle = () => {
  if (!form.value.validate()) return;
  
  const updates = {
    ...editForm.value,
    examDate: new Date(editForm.value.examDate)
  };
  
  studyStore.updateStudyCycle(currentCycle.value!.id, updates);
  editDialog.value = false;
};

const confirmDelete = () => {
  if (cycleToDelete.value) {
    // Remove do array de ciclos
    studyStore.studyCycles = studyStore.studyCycles.filter(c => c.id !== cycleToDelete.value!.id);
    
    // Se for o ciclo ativo, remove a referência
    if (studyStore.activeCycle?.id === cycleToDelete.value.id) {
      studyStore.activeCycle = null;
    }
    
    studyStore.saveToLocalStorage();
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

const duplicateCycle = (cycle: StudyCycle) => {
  const newCycle = {
    name: `${cycle.name} (Cópia)`,
    description: cycle.description,
    examDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 dias no futuro
    weeklyGoal: cycle.weeklyGoal,
    dailyGoal: cycle.dailyGoal,
    subjects: cycle.subjects.map(subject => ({
      ...subject,
      id: Date.now().toString() + Math.random(),
      status: 'to_study' as const,
      actualMinutes: 0,
      completedAt: undefined,
      reviewDate: undefined,
      reviewType: undefined
    })),
    status: 'draft' as const
  };
  
  studyStore.addStudyCycle(newCycle);
};

// Drag and Drop methods
const onDragStart = (event: DragEvent, subject: CycleSubject, sourceCycleId: string) => {
  draggedSubject.value = { ...subject, sourceCycleId };
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify({ subject, sourceCycleId }));
  }
};

const onDragOver = (event: DragEvent, targetCycleId: string) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  dragOverCycle.value = targetCycleId;
};

const onDragLeave = () => {
  dragOverCycle.value = null;
};

const onDrop = (event: DragEvent, targetCycleId: string) => {
  event.preventDefault();
  dragOverCycle.value = null;
  
  if (!draggedSubject.value) return;
  
  const sourceCycleId = (draggedSubject.value as any).sourceCycleId;
  
  // Não fazer nada se for o mesmo ciclo
  if (sourceCycleId === targetCycleId) {
    draggedSubject.value = null;
    return;
  }
  
  // Remover do ciclo origem
  const sourceCycle = studyStore.studyCycles.find(c => c.id === sourceCycleId);
  if (sourceCycle) {
    sourceCycle.subjects = sourceCycle.subjects.filter(s => s.id !== draggedSubject.value!.id);
    studyStore.updateStudyCycle(sourceCycleId, { subjects: sourceCycle.subjects });
  }
  
  // Adicionar ao ciclo destino
  const targetCycle = studyStore.studyCycles.find(c => c.id === targetCycleId);
  if (targetCycle) {
    const newSubject = {
      ...draggedSubject.value,
      status: 'to_study' as const,
      actualMinutes: 0,
      completedAt: undefined,
      reviewDate: undefined,
      reviewType: undefined
    };
    delete (newSubject as any).sourceCycleId;
    
    targetCycle.subjects = [...(targetCycle.subjects || []), newSubject];
    studyStore.updateStudyCycle(targetCycleId, { subjects: targetCycle.subjects });
  }
  
  draggedSubject.value = null;
};

onMounted(() => {
  studyStore.loadFromLocalStorage();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  
  <!-- Estatísticas Resumidas -->
  <v-row class="mb-6">
    <v-col cols="12" sm="6" md="3">
      <v-card color="success" variant="tonal">
        <v-card-text class="text-center">
          <div class="d-flex align-center justify-center mb-2">
            <SvgSprite name="custom-play" style="width: 24px; height: 24px" />
          </div>
          <h3 class="text-h3">{{ cyclesByStatus.active.length }}</h3>
          <p class="text-subtitle-2 mb-0">Ativos</p>
        </v-card-text>
      </v-card>
    </v-col>
    
    <v-col cols="12" sm="6" md="3">
      <v-card color="secondary" variant="tonal">
        <v-card-text class="text-center">
          <div class="d-flex align-center justify-center mb-2">
            <SvgSprite name="custom-edit" style="width: 24px; height: 24px" />
          </div>
          <h3 class="text-h3">{{ cyclesByStatus.draft.length }}</h3>
          <p class="text-subtitle-2 mb-0">Rascunhos</p>
        </v-card-text>
      </v-card>
    </v-col>
    
    <v-col cols="12" sm="6" md="3">
      <v-card color="warning" variant="tonal">
        <v-card-text class="text-center">
          <div class="d-flex align-center justify-center mb-2">
            <SvgSprite name="custom-pause" style="width: 24px; height: 24px" />
          </div>
          <h3 class="text-h3">{{ cyclesByStatus.paused.length }}</h3>
          <p class="text-subtitle-2 mb-0">Pausados</p>
        </v-card-text>
      </v-card>
    </v-col>
    
    <v-col cols="12" sm="6" md="3">
      <v-card color="info" variant="tonal">
        <v-card-text class="text-center">
          <div class="d-flex align-center justify-center mb-2">
            <SvgSprite name="custom-check" style="width: 24px; height: 24px" />
          </div>
          <h3 class="text-h3">{{ cyclesByStatus.completed.length }}</h3>
          <p class="text-subtitle-2 mb-0">Concluídos</p>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- Controles -->
  <UiParentCard title="Lista de Ciclos">
    <template v-slot:action>
      <div class="d-flex gap-2 align-center flex-wrap">
        <v-btn-toggle v-model="viewMode" mandatory variant="outlined" density="compact">
          <v-btn value="cards" size="small">
            <SvgSprite name="custom-grid" style="width: 16px; height: 16px" />
          </v-btn>
          <v-btn value="detailed" size="small">
            <SvgSprite name="custom-list" style="width: 16px; height: 16px" />
          </v-btn>
        </v-btn-toggle>
        
        <v-select
          v-model="statusFilter"
          :items="[
            { title: 'Todos', value: 'all' },
            { title: 'Ativos', value: 'active' },
            { title: 'Rascunhos', value: 'draft' },
            { title: 'Pausados', value: 'paused' },
            { title: 'Concluídos', value: 'completed' }
          ]"
          label="Status"
          variant="outlined"
          density="compact"
          style="min-width: 120px"
          hide-details
        />
        
        <v-select
          v-model="sortBy"
          :items="[
            { title: 'Data da Prova', value: 'examDate' },
            { title: 'Nome', value: 'name' },
            { title: 'Criação', value: 'created' }
          ]"
          label="Ordenar"
          variant="outlined"
          density="compact"
          style="min-width: 120px"
          hide-details
        />
        
        <v-btn color="primary" prepend-icon="mdi-plus">
          <router-link to="/main/cycles/new" class="text-decoration-none text-white">
            Novo Ciclo
          </router-link>
        </v-btn>
      </div>
    </template>

    <!-- Visualização em Cards -->
    <div v-if="viewMode === 'cards' && filteredCycles.length > 0">
      <v-row>
        <v-col 
          v-for="cycle in filteredCycles" 
          :key="cycle.id"
          cols="12" 
          md="6" 
          lg="4"
        >
          <v-card 
            class="cycle-card h-100"
            :class="{ 
              'active-cycle': cycle.status === 'active',
              'drag-over': dragOverCycle === cycle.id 
            }"
            variant="outlined"
            @dragover="onDragOver($event, cycle.id)"
            @dragleave="onDragLeave"
            @drop="onDrop($event, cycle.id)"
          >
            <v-card-text class="pa-4">
              <div class="d-flex justify-space-between align-center mb-3">
                <v-chip 
                  :color="getStatusColor(cycle.status)" 
                  size="small" 
                  variant="tonal"
                >
                  {{ getStatusText(cycle.status) }}
                </v-chip>
                
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn icon size="small" variant="text" v-bind="props">
                      <SvgSprite name="custom-more" style="width: 16px; height: 16px" />
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item @click="openViewDialog(cycle)">
                      <template v-slot:prepend>
                        <SvgSprite name="custom-eye" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Visualizar</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="openTopicsDialog(cycle)">
                      <template v-slot:prepend>
                        <SvgSprite name="custom-list" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Ver Tópicos</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="openEditDialog(cycle)">
                      <template v-slot:prepend>
                        <SvgSprite name="custom-edit" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Editar</v-list-item-title>
                    </v-list-item>
                    <v-divider />
                    <v-list-item @click="duplicateCycle(cycle)">
                      <template v-slot:prepend>
                        <SvgSprite name="custom-copy" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Duplicar</v-list-item-title>
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
              
              <div class="d-flex align-center mb-3">
                <v-avatar :color="getStatusColor(cycle.status)" size="40" class="me-3">
                  <SvgSprite name="custom-refresh" style="width: 20px; height: 20px" />
                </v-avatar>
                <div>
                  <h6 class="text-h6 mb-1">{{ cycle.name }}</h6>
                  <p class="text-caption text-lightText mb-0">
                    {{ formatDate(cycle.examDate) }} • {{ getDaysUntilExam(cycle.examDate) }} dias
                  </p>
                </div>
              </div>
              
              <p class="text-caption text-lightText mb-3">{{ cycle.description || 'Sem descrição' }}</p>
              
              <!-- Progresso -->
              <div class="mb-3">
                <div class="d-flex justify-space-between mb-1">
                  <span class="text-caption">Progresso</span>
                  <span class="text-caption">{{ getCycleProgress(cycle) }}%</span>
                </div>
                <v-progress-linear
                  :model-value="getCycleProgress(cycle)"
                  :color="getStatusColor(cycle.status)"
                  height="6"
                  rounded
                />
              </div>
              
              <!-- Disciplinas -->
              <div class="subjects-preview">
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-caption font-weight-medium">Disciplinas</span>
                  <v-chip size="x-small" color="info" variant="tonal">
                    {{ (cycle.subjects || []).length }}
                  </v-chip>
                </div>
                
                <div class="subjects-grid">
                  <div
                    v-for="subject in (cycle.subjects || []).slice(0, 3)"
                    :key="subject.id"
                    class="subject-chip"
                    :draggable="cycle.status !== 'completed'"
                    @dragstart="onDragStart($event, subject, cycle.id)"
                  >
                    <v-chip 
                      size="x-small" 
                      :color="subject.color" 
                      variant="tonal"
                      :class="{ 'draggable-chip': cycle.status !== 'completed' }"
                    >
                      {{ subject.name }}
                    </v-chip>
                  </div>
                  
                  <v-chip 
                    v-if="(cycle.subjects || []).length > 3"
                    size="x-small" 
                    color="grey" 
                    variant="tonal"
                  >
                    +{{ (cycle.subjects || []).length - 3 }}
                  </v-chip>
                </div>
              </div>
              
              <!-- Ações Rápidas -->
              <div class="d-flex gap-2 mt-4">
                <v-btn
                  v-if="cycle.status === 'draft' || cycle.status === 'paused'"
                  size="small"
                  color="success"
                  variant="tonal"
                  @click="activateCycle(cycle.id)"
                  block
                >
                  Ativar
                </v-btn>
                
                <v-btn
                  v-if="cycle.status === 'active'"
                  size="small"
                  color="warning"
                  variant="tonal"
                  @click="pauseCycle(cycle.id)"
                  block
                >
                  Pausar
                </v-btn>
                
                <v-btn
                  size="small"
                  color="primary"
                  variant="outlined"
                  @click="openTopicsDialog(cycle)"
                  block
                >
                  Ver Tópicos
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Visualização Detalhada -->
    <div v-else-if="viewMode === 'detailed' && filteredCycles.length > 0" class="detailed-view">
      <v-card
        v-for="cycle in filteredCycles"
        :key="cycle.id"
        class="mb-4 cycle-detailed-card"
        :class="{ 
          'active-cycle': cycle.status === 'active',
          'drag-over': dragOverCycle === cycle.id 
        }"
        variant="outlined"
        @dragover="onDragOver($event, cycle.id)"
        @dragleave="onDragLeave"
        @drop="onDrop($event, cycle.id)"
      >
        <v-card-text class="pa-6">
          <div class="d-flex align-start justify-space-between mb-4">
            <!-- Informações Principais -->
            <div class="flex-grow-1">
              <div class="d-flex align-center mb-3">
                <v-avatar 
                  :color="getStatusColor(cycle.status)" 
                  size="48" 
                  class="me-4"
                >
                  <SvgSprite name="custom-refresh" style="width: 24px; height: 24px" />
                </v-avatar>
                
                <div>
                  <div class="d-flex align-center gap-2 mb-1">
                    <h5 class="text-h5 mb-0">{{ cycle.name }}</h5>
                    <v-chip 
                      :color="getStatusColor(cycle.status)" 
                      size="small" 
                      variant="tonal"
                    >
                      {{ getStatusText(cycle.status) }}
                    </v-chip>
                    <v-chip 
                      v-if="cycle.status === 'active'"
                      color="primary" 
                      size="small" 
                      variant="flat"
                    >
                      <SvgSprite name="custom-star" style="width: 12px; height: 12px" class="me-1" />
                      Ciclo Atual
                    </v-chip>
                  </div>
                  
                  <p class="text-body-2 text-lightText mb-0">
                    {{ cycle.description || 'Sem descrição' }}
                  </p>
                </div>
              </div>
              
              <!-- Estatísticas do Ciclo -->
              <v-row class="mb-4">
                <v-col cols="12" sm="6" md="3">
                  <div class="stat-item">
                    <div class="d-flex align-center mb-1">
                      <SvgSprite name="custom-calendar" style="width: 16px; height: 16px" class="me-2" />
                      <span class="text-caption font-weight-medium">Data da Prova</span>
                    </div>
                    <p class="text-body-2 mb-0">{{ formatDate(cycle.examDate) }}</p>
                    <p class="text-caption text-lightText mb-0">
                      {{ getDaysUntilExam(cycle.examDate) > 0 ? 
                         `${getDaysUntilExam(cycle.examDate)} dias restantes` : 
                         'Prova já passou' }}
                    </p>
                  </div>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <div class="stat-item">
                    <div class="d-flex align-center mb-1">
                      <SvgSprite name="custom-target" style="width: 16px; height: 16px" class="me-2" />
                      <span class="text-caption font-weight-medium">Metas</span>
                    </div>
                    <p class="text-body-2 mb-0">{{ cycle.dailyGoal }}h/dia</p>
                    <p class="text-caption text-lightText mb-0">{{ cycle.weeklyGoal }}h/semana</p>
                  </div>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <div class="stat-item">
                    <div class="d-flex align-center mb-1">
                      <SvgSprite name="custom-book" style="width: 16px; height: 16px" class="me-2" />
                      <span class="text-caption font-weight-medium">Disciplinas</span>
                    </div>
                    <p class="text-body-2 mb-0">{{ (cycle.subjects || []).length }} disciplinas</p>
                    <p class="text-caption text-lightText mb-0">
                      {{ (cycle.subjects || []).filter(s => s.status === 'completed').length }} concluídas
                    </p>
                  </div>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <div class="stat-item">
                    <div class="d-flex align-center mb-1">
                      <SvgSprite name="custom-chart" style="width: 16px; height: 16px" class="me-2" />
                      <span class="text-caption font-weight-medium">Progresso</span>
                    </div>
                    <div class="d-flex align-center">
                      <v-progress-circular
                        :model-value="getCycleProgress(cycle)"
                        :color="getStatusColor(cycle.status)"
                        size="32"
                        width="3"
                        class="me-2"
                      >
                        <span class="text-caption">{{ getCycleProgress(cycle) }}%</span>
                      </v-progress-circular>
                      <span class="text-caption text-lightText">completo</span>
                    </div>
                  </div>
                </v-col>
              </v-row>
              
              <!-- Disciplinas com Drag & Drop -->
              <div v-if="(cycle.subjects || []).length > 0" class="subjects-section">
                <h6 class="text-h6 mb-3">Disciplinas do Ciclo:</h6>
                <div class="subjects-detailed-grid">
                  <div
                    v-for="subject in (cycle.subjects || [])"
                    :key="subject.id"
                    class="subject-detailed-card"
                    :draggable="cycle.status !== 'completed'"
                    @dragstart="onDragStart($event, subject, cycle.id)"
                  >
                    <div class="d-flex align-center justify-space-between mb-2">
                      <div class="d-flex align-center">
                        <v-avatar :color="subject.color" size="24" class="me-2">
                          <SvgSprite name="custom-book" style="width: 12px; height: 12px" />
                        </v-avatar>
                        <h6 class="text-subtitle-2 mb-0">{{ subject.name }}</h6>
                      </div>
                      
                      <div class="d-flex align-center gap-1">
                        <v-chip 
                          size="x-small" 
                          :color="getPriorityColor(subject.priority)" 
                          variant="tonal"
                        >
                          {{ getPriorityText(subject.priority) }}
                        </v-chip>
                        
                        <v-chip 
                          size="x-small" 
                          :color="subject.status === 'completed' ? 'success' : 
                                  subject.status === 'studying' ? 'primary' : 'secondary'" 
                          variant="tonal"
                        >
                          {{ subject.status === 'completed' ? 'Concluído' :
                             subject.status === 'studying' ? 'Estudando' :
                             subject.status === 'to_study' ? 'A Estudar' : subject.status }}
                        </v-chip>
                      </div>
                    </div>
                    
                    <div class="d-flex justify-space-between align-center">
                      <div class="text-caption text-lightText">
                        {{ getSubjectTopics(subject.subjectId).length }} tópicos • 
                        {{ getTotalSubtopics(subject.subjectId) }} subtópicos
                      </div>
                      <div class="text-caption">{{ formatMinutes(subject.estimatedMinutes) }}</div>
                    </div>
                    
                    <!-- Indicador de drag -->
                    <div v-if="cycle.status !== 'completed'" class="drag-indicator">
                      <SvgSprite name="custom-move" style="width: 12px; height: 12px; opacity: 0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Ações -->
            <div class="d-flex flex-column gap-2 ml-4">
              <v-btn
                size="small"
                color="info"
                variant="tonal"
                @click="openViewDialog(cycle)"
                prepend-icon="mdi-eye"
              >
                Visualizar
              </v-btn>
              
              <v-btn
                size="small"
                color="primary"
                variant="tonal"
                @click="openTopicsDialog(cycle)"
                prepend-icon="mdi-format-list-bulleted"
              >
                Tópicos
              </v-btn>
              
              <v-btn
                size="small"
                color="secondary"
                variant="tonal"
                @click="openEditDialog(cycle)"
                prepend-icon="mdi-pencil"
              >
                Editar
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Estado Vazio -->
    <div v-else-if="filteredCycles.length === 0" class="text-center py-12">
      <SvgSprite name="custom-refresh" style="width: 64px; height: 64px; opacity: 0.3" />
      <h5 class="text-h5 mt-4 mb-2">
        {{ statusFilter === 'all' ? 'Nenhum ciclo criado' : `Nenhum ciclo ${getStatusText(statusFilter).toLowerCase()}` }}
      </h5>
      <p class="text-subtitle-1 text-lightText mb-4">
        {{ statusFilter === 'all' ? 
           'Comece criando seu primeiro ciclo de estudos' : 
           'Altere o filtro para ver outros ciclos' }}
      </p>
      <v-btn 
        v-if="statusFilter === 'all'" 
        color="primary" 
        prepend-icon="mdi-plus"
      >
        <router-link to="/main/cycles/new" class="text-decoration-none text-white">
          Criar Primeiro Ciclo
        </router-link>
      </v-btn>
    </div>
  </UiParentCard>

  <!-- Dialog para Visualizar Tópicos -->
  <v-dialog v-model="topicsDialog" max-width="900px">
    <v-card v-if="selectedCycleForTopics" class="dialog-card">
      <v-card-title class="dialog-header">
        <div class="d-flex align-center">
          <v-avatar color="info" size="32" class="me-3">
            <SvgSprite name="custom-list" style="width: 16px; height: 16px" />
          </v-avatar>
          <div>
            <span>Tópicos e Subtópicos</span>
            <v-chip size="small" color="info" variant="tonal" class="ml-2">
              {{ selectedCycleForTopics.name }}
            </v-chip>
          </div>
        </div>
      </v-card-title>
      
      <v-card-text class="pa-6">
        <div v-if="(selectedCycleForTopics.subjects || []).length > 0">
          <v-expansion-panels variant="accordion" multiple>
            <v-expansion-panel
              v-for="subject in (selectedCycleForTopics.subjects || [])"
              :key="subject.id"
              class="mb-3"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center justify-space-between w-100">
                  <div class="d-flex align-center">
                    <v-avatar :color="subject.color" size="32" class="me-3">
                      <SvgSprite name="custom-book" style="width: 16px; height: 16px" />
                    </v-avatar>
                    <div>
                      <h6 class="text-h6 mb-1">{{ subject.name }}</h6>
                      <div class="d-flex align-center gap-2">
                        <v-chip size="x-small" :color="subject.color" variant="tonal">
                          {{ getSubjectTopics(subject.subjectId).length }} tópicos
                        </v-chip>
                        <v-chip size="x-small" color="info" variant="tonal">
                          {{ getTotalSubtopics(subject.subjectId) }} subtópicos
                        </v-chip>
                        <v-chip size="x-small" color="warning" variant="tonal">
                          {{ formatMinutes(subject.estimatedMinutes) }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                  
                  <v-chip 
                    size="small" 
                    :color="getPriorityColor(subject.priority)" 
                    variant="tonal"
                  >
                    {{ getPriorityText(subject.priority) }}
                  </v-chip>
                </div>
              </v-expansion-panel-title>
              
              <v-expansion-panel-text>
                <div class="topics-container">
                  <div 
                    v-for="(topic, topicIndex) in getSubjectTopics(subject.subjectId)" 
                    :key="topic.id"
                    class="topic-item mb-4"
                  >
                    <div class="d-flex align-center mb-2">
                      <v-avatar color="primary" size="24" class="me-3">
                        <span class="text-caption font-weight-bold">{{ topicIndex + 1 }}</span>
                      </v-avatar>
                      <div class="flex-grow-1">
                        <h6 class="text-subtitle-1 mb-0">{{ topic.name }}</h6>
                        <p v-if="topic.description" class="text-caption text-lightText mb-0">
                          {{ topic.description }}
                        </p>
                      </div>
                      <v-chip size="x-small" color="warning" variant="tonal">
                        {{ topic.estimatedHours }}h
                      </v-chip>
                    </div>
                    
                    <!-- Subtópicos -->
                    <div v-if="topic.subtopics.length > 0" class="subtopics-container ml-8">
                      <div 
                        v-for="(subtopic, subIndex) in topic.subtopics" 
                        :key="subtopic.id"
                        class="subtopic-item"
                      >
                        <div class="d-flex align-center justify-space-between">
                          <div class="d-flex align-center">
                            <v-avatar color="grey-lighten-1" size="16" class="me-2">
                              <span style="font-size: 10px;">{{ subIndex + 1 }}</span>
                            </v-avatar>
                            <div>
                              <span class="text-body-2">{{ subtopic.name }}</span>
                              <p v-if="subtopic.description" class="text-caption text-lightText mb-0">
                                {{ subtopic.description }}
                              </p>
                            </div>
                          </div>
                          <v-chip size="x-small" color="info" variant="tonal">
                            {{ subtopic.estimatedHours }}h
                          </v-chip>
                        </div>
                      </div>
                    </div>
                    
                    <div v-else class="ml-8">
                      <p class="text-caption text-lightText">Nenhum subtópico definido</p>
                    </div>
                  </div>
                  
                  <div v-if="getSubjectTopics(subject.subjectId).length === 0" class="text-center py-4">
                    <SvgSprite name="custom-book" style="width: 32px; height: 32px; opacity: 0.3" />
                    <p class="text-subtitle-2 mt-2 mb-0">Nenhum tópico definido</p>
                    <p class="text-caption text-lightText">Esta disciplina não possui estrutura de tópicos</p>
                  </div>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
        
        <div v-else class="text-center py-8">
          <SvgSprite name="custom-book" style="width: 48px; height: 48px; opacity: 0.3" />
          <p class="text-subtitle-1 mt-3 mb-0">Nenhuma disciplina no ciclo</p>
          <p class="text-caption text-lightText">Adicione disciplinas para ver os tópicos</p>
        </div>
      </v-card-text>
      
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn @click="topicsDialog = false" variant="outlined">
          Fechar
        </v-btn>
        <v-btn 
          color="primary" 
          @click="topicsDialog = false; openEditDialog(selectedCycleForTopics)"
          variant="flat"
          prepend-icon="mdi-pencil"
        >
          Editar Ciclo
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog para Editar Ciclo -->
  <v-dialog v-model="editDialog" max-width="600px" persistent>
    <v-card class="dialog-card">
      <v-card-title class="dialog-header">
        <div class="d-flex align-center">
          <v-avatar color="primary" size="32" class="me-3">
            <SvgSprite name="custom-edit" style="width: 16px; height: 16px" />
          </v-avatar>
          <span>Editar Ciclo</span>
        </div>
      </v-card-title>
      
      <v-card-text class="pa-6">
        <v-form ref="form" v-model="valid">
          <v-text-field
            v-model="editForm.name"
            label="Nome do Ciclo *"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-4"
            prepend-inner-icon="mdi-book-outline"
          />
          
          <v-textarea
            v-model="editForm.description"
            label="Descrição"
            variant="outlined"
            rows="3"
            class="mb-4"
            prepend-inner-icon="mdi-text"
          />
          
          <v-text-field
            v-model="editForm.examDate"
            label="Data da Prova *"
            type="date"
            :rules="[rules.required, rules.futureDate]"
            variant="outlined"
            class="mb-4"
            prepend-inner-icon="mdi-calendar"
          />
          
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="editForm.dailyGoal"
                label="Meta Diária (h) *"
                type="number"
                :rules="[rules.required, rules.minGoal]"
                variant="outlined"
                min="1"
                max="16"
                prepend-inner-icon="mdi-clock-outline"
              />
            </v-col>
            
            <v-col cols="6">
              <v-text-field
                v-model.number="editForm.weeklyGoal"
                label="Meta Semanal (h) *"
                type="number"
                :rules="[rules.required, rules.minGoal]"
                variant="outlined"
                min="7"
                max="112"
                prepend-inner-icon="mdi-calendar-week"
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
            label="Status *"
            variant="outlined"
            prepend-inner-icon="mdi-flag"
          />
        </v-form>
      </v-card-text>
      
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn @click="editDialog = false" variant="outlined">
          Cancelar
        </v-btn>
        <v-btn 
          color="primary" 
          @click="saveCycle"
          :disabled="!valid"
          variant="flat"
        >
          Salvar Alterações
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog para Visualizar Ciclo -->
  <v-dialog v-model="viewDialog" max-width="800px">
    <v-card v-if="currentCycle" class="dialog-card">
      <v-card-title class="dialog-header">
        <div class="d-flex align-center">
          <v-avatar :color="getStatusColor(currentCycle.status)" size="32" class="me-3">
            <SvgSprite name="custom-eye" style="width: 16px; height: 16px" />
          </v-avatar>
          <div>
            <span>{{ currentCycle.name }}</span>
            <v-chip 
              :color="getStatusColor(currentCycle.status)" 
              size="small" 
              variant="tonal"
              class="ml-2"
            >
              {{ getStatusText(currentCycle.status) }}
            </v-chip>
          </div>
        </div>
      </v-card-title>
      
      <v-card-text class="pa-6">
        <!-- Informações Gerais -->
        <div class="mb-6">
          <h6 class="text-h6 mb-3">Informações Gerais</h6>
          <v-row>
            <v-col cols="12" sm="6">
              <div class="info-item">
                <span class="text-caption text-lightText">Descrição:</span>
                <p class="text-body-2 mb-0">{{ currentCycle.description || 'Sem descrição' }}</p>
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="info-item">
                <span class="text-caption text-lightText">Data da Prova:</span>
                <p class="text-body-2 mb-0">{{ formatDate(currentCycle.examDate) }}</p>
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="info-item">
                <span class="text-caption text-lightText">Meta Diária:</span>
                <p class="text-body-2 mb-0">{{ currentCycle.dailyGoal }} horas</p>
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="info-item">
                <span class="text-caption text-lightText">Meta Semanal:</span>
                <p class="text-body-2 mb-0">{{ currentCycle.weeklyGoal }} horas</p>
              </div>
            </v-col>
          </v-row>
        </div>
        
        <!-- Disciplinas do Ciclo -->
        <div v-if="(currentCycle.subjects || []).length > 0">
          <h6 class="text-h6 mb-3">Disciplinas ({{ (currentCycle.subjects || []).length }})</h6>
          <v-row>
            <v-col 
              v-for="subject in (currentCycle.subjects || [])" 
              :key="subject.id"
              cols="12" 
              sm="6" 
              md="4"
            >
              <v-card variant="outlined" :color="subject.color" class="subject-preview">
                <v-card-text class="pa-4">
                  <div class="d-flex align-center mb-2">
                    <v-avatar :color="subject.color" size="24" class="me-2">
                      <SvgSprite name="custom-book" style="width: 12px; height: 12px" />
                    </v-avatar>
                    <h6 class="text-subtitle-2 mb-0">{{ subject.name }}</h6>
                  </div>
                  
                  <div class="d-flex justify-space-between align-center mb-2">
                    <v-chip 
                      size="x-small" 
                      :color="subject.status === 'completed' ? 'success' : 
                              subject.status === 'studying' ? 'primary' : 'secondary'" 
                      variant="tonal"
                    >
                      {{ subject.status === 'completed' ? 'Concluído' :
                         subject.status === 'studying' ? 'Estudando' :
                         subject.status === 'to_study' ? 'A Estudar' : subject.status }}
                    </v-chip>
                    
                    <span class="text-caption">{{ formatMinutes(subject.estimatedMinutes) }}</span>
                  </div>
                  
                  <div class="text-caption text-lightText">
                    {{ getSubjectTopics(subject.subjectId).length }} tópicos • 
                    {{ getTotalSubtopics(subject.subjectId) }} subtópicos
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>
        
        <div v-else class="text-center py-6">
          <SvgSprite name="custom-book" style="width: 48px; height: 48px; opacity: 0.3" />
          <p class="text-subtitle-1 mt-3 mb-0">Nenhuma disciplina adicionada</p>
        </div>
      </v-card-text>
      
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn @click="viewDialog = false" variant="outlined">
          Fechar
        </v-btn>
        <v-btn 
          color="primary" 
          @click="viewDialog = false; openEditDialog(currentCycle)"
          variant="flat"
          prepend-icon="mdi-pencil"
        >
          Editar Ciclo
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog de Confirmação de Exclusão -->
  <v-dialog v-model="deleteDialog" max-width="500px" persistent>
    <v-card v-if="cycleToDelete" class="dialog-card">
      <v-card-title class="dialog-header text-error">
        <div class="d-flex align-center">
          <v-avatar color="error" size="32" class="me-3">
            <SvgSprite name="custom-trash" style="width: 16px; height: 16px" />
          </v-avatar>
          <span>Excluir Ciclo</span>
        </div>
      </v-card-title>
      
      <v-card-text class="pa-6">
        <div class="text-center mb-4">
          <v-avatar color="error" size="64" class="mb-4">
            <SvgSprite name="custom-refresh" style="width: 32px; height: 32px" />
          </v-avatar>
          
          <h5 class="text-h5 mb-2">{{ cycleToDelete.name }}</h5>
          <p class="text-subtitle-1 text-lightText mb-4">
            Tem certeza que deseja excluir este ciclo?
          </p>
        </div>
        
        <v-alert type="warning" variant="tonal" class="mb-4">
          <div class="text-body-2">
            <strong>Atenção:</strong> Esta ação não pode ser desfeita e irá excluir:
            <ul class="mt-2 ml-4">
              <li>Todas as configurações do ciclo</li>
              <li>Progresso das disciplinas</li>
              <li>Histórico de estudos deste ciclo</li>
            </ul>
          </div>
        </v-alert>
        
        <div class="text-center">
          <div class="d-flex align-center justify-center gap-4">
            <div class="text-center">
              <div class="d-flex align-center mb-1">
                <SvgSprite name="custom-book" style="width: 16px; height: 16px" class="me-2" />
                <span class="text-body-2">{{ (cycleToDelete.subjects || []).length }} disciplinas</span>
              </div>
            </div>
            <div class="text-center">
              <div class="d-flex align-center mb-1">
                <SvgSprite name="custom-calendar" style="width: 16px; height: 16px" class="me-2" />
                <span class="text-body-2">{{ getDaysUntilExam(cycleToDelete.examDate) }} dias restantes</span>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
      
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn @click="deleteDialog = false; cycleToDelete = null;" variant="outlined">
          Cancelar
        </v-btn>
        <v-btn 
          color="error" 
          @click="confirmDelete"
          variant="flat"
          prepend-icon="mdi-delete"
        >
          Excluir Ciclo
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.cycle-card,
.cycle-detailed-card {
  transition: all 0.3s ease;
  border-radius: 16px;
  position: relative;
}

.cycle-card:hover,
.cycle-detailed-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.active-cycle {
  border: 2px solid rgb(var(--v-theme-success));
  background: rgba(var(--v-theme-success), 0.02);
}

.drag-over {
  border: 2px dashed rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
  transform: scale(1.02);
}

.stat-item {
  padding: 1rem;
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 12px;
  height: 100%;
}

.info-item {
  padding: 0.75rem;
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 8px;
}

.subject-preview {
  transition: all 0.2s ease;
}

.subject-preview:hover {
  transform: translateY(-1px);
}

.subjects-preview {
  border-top: 1px solid rgba(var(--v-theme-borderLight), 0.5);
  padding-top: 1rem;
}

.subjects-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.subjects-detailed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.subject-detailed-card {
  padding: 1rem;
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
  transition: all 0.3s ease;
  position: relative;
  cursor: grab;
}

.subject-detailed-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.subject-detailed-card:active {
  cursor: grabbing;
}

.draggable-chip {
  cursor: grab;
}

.draggable-chip:active {
  cursor: grabbing;
}

.drag-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.subject-detailed-card:hover .drag-indicator {
  opacity: 1;
}

.topics-container {
  max-height: 400px;
  overflow-y: auto;
}

.topic-item {
  padding: 1rem;
  background: rgba(var(--v-theme-surface), 0.8);
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

.subtopics-container {
  background: rgba(var(--v-theme-containerBg), 0.2);
  border-radius: 8px;
  padding: 0.75rem;
}

.subtopic-item {
  padding: 0.5rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  background: rgba(var(--v-theme-surface), 0.5);
}

.subtopic-item:last-child {
  margin-bottom: 0;
}

.subjects-section {
  border-top: 1px solid rgba(var(--v-theme-borderLight), 0.5);
  padding-top: 1rem;
  margin-top: 1rem;
}

.detailed-view {
  max-height: 70vh;
  overflow-y: auto;
}

.dialog-card {
  border-radius: 16px;
}

.dialog-header {
  background: rgba(var(--v-theme-containerBg), 0.5);
  padding: 1.5rem !important;
}

/* Scrollbar customizada */
.detailed-view::-webkit-scrollbar,
.topics-container::-webkit-scrollbar {
  width: 6px;
}

.detailed-view::-webkit-scrollbar-track,
.topics-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.detailed-view::-webkit-scrollbar-thumb,
.topics-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.detailed-view::-webkit-scrollbar-thumb:hover,
.topics-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

@media (max-width: 960px) {
  .subjects-detailed-grid {
    grid-template-columns: 1fr;
  }
  
  .d-flex.flex-column.gap-2 {
    flex-direction: row !important;
    flex-wrap: wrap;
    gap: 0.5rem !important;
  }
}
</style>
</v-card-text>