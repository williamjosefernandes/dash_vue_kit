<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';
import type { CycleTask } from '@/types/study';

const route = useRoute();
const router = useRouter();
const studyStore = useStudyStore();

const cycleId = route.params.id as string;
const cycle = computed(() => studyStore.getCycleById(cycleId));

const page = ref({ title: 'Ciclo Ativo - Kanban' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Ciclos', disabled: false, href: '/main/cycles' },
  { title: 'Kanban', disabled: true, href: '#' }
]);

const taskDialog = ref(false);
const newTaskDialog = ref(false);
const currentTask = ref({
  id: '',
  subjectId: '',
  title: '',
  description: '',
  estimatedHours: 1,
  actualHours: 0,
  status: 'todo' as 'todo' | 'in-progress' | 'review' | 'done',
  priority: 'medium' as 'low' | 'medium' | 'high',
  notes: '',
  order: 0
});

const columns = [
  { 
    title: 'Backlog', 
    status: 'todo', 
    color: 'grey-lighten-1',
    icon: 'custom-list',
    description: 'Tarefas planejadas'
  },
  { 
    title: 'Em Progresso', 
    status: 'in-progress', 
    color: 'warning',
    icon: 'custom-play',
    description: 'Trabalhando agora'
  },
  { 
    title: 'Revisão', 
    status: 'review', 
    color: 'info',
    icon: 'custom-eye',
    description: 'Aguardando revisão'
  },
  { 
    title: 'Concluído', 
    status: 'done', 
    color: 'success',
    icon: 'custom-check',
    description: 'Tarefas finalizadas'
  }
];

const getTasksByStatus = (status: string) => {
  return cycle.value?.tasks.filter(task => task.status === status).sort((a, b) => a.order - b.order) || [];
};

const getSubjectName = (subjectId: string) => {
  const subject = studyStore.getSubjectById(subjectId);
  return subject?.name || 'Disciplina não encontrada';
};

const getSubjectColor = (subjectId: string) => {
  const subject = studyStore.getSubjectById(subjectId);
  return subject?.color || 'primary';
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

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'high': return 'custom-alert';
    case 'medium': return 'custom-clock';
    case 'low': return 'custom-check';
    default: return 'custom-info';
  }
};

const formatHours = (hours: number) => {
  return `${hours.toFixed(1)}h`;
};

const getCycleProgress = () => {
  if (!cycle.value) return 0;
  return cycle.value.totalHours > 0 ? (cycle.value.completedHours / cycle.value.totalHours) * 100 : 0;
};

const getDaysRemaining = () => {
  if (!cycle.value) return 0;
  const now = new Date();
  const end = new Date(cycle.value.endDate);
  const diff = end.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
};

const getTaskProgress = (task: CycleTask) => {
  return task.estimatedHours > 0 ? (task.actualHours / task.estimatedHours) * 100 : 0;
};

const moveTask = (taskId: string, newStatus: CycleTask['status']) => {
  if (cycle.value) {
    studyStore.moveCycleTask(cycle.value.id, taskId, newStatus);
  }
};

const openTaskDialog = (task: CycleTask) => {
  currentTask.value = { ...task };
  taskDialog.value = true;
};

const openNewTaskDialog = () => {
  currentTask.value = {
    id: '',
    subjectId: '',
    title: '',
    description: '',
    estimatedHours: 1,
    actualHours: 0,
    status: 'todo',
    priority: 'medium',
    notes: '',
    order: cycle.value?.tasks.length || 0
  };
  newTaskDialog.value = true;
};

const saveTask = () => {
  if (cycle.value) {
    studyStore.updateCycleTask(cycle.value.id, currentTask.value.id, currentTask.value);
    taskDialog.value = false;
  }
};

const addNewTask = () => {
  if (cycle.value) {
    studyStore.addCycleTask(cycle.value.id, currentTask.value);
    newTaskDialog.value = false;
  }
};

const deleteTask = (taskId: string) => {
  if (cycle.value && confirm('Tem certeza que deseja excluir esta tarefa?')) {
    studyStore.deleteCycleTask(cycle.value.id, taskId);
  }
};

const completeCycle = () => {
  if (cycle.value && confirm('Tem certeza que deseja marcar este ciclo como concluído?')) {
    studyStore.updateStudyCycle(cycle.value.id, { 
      status: 'completed',
      completedHours: cycle.value.totalHours
    });
    router.push('/main/cycles');
  }
};

const startTask = (taskId: string) => {
  moveTask(taskId, 'in-progress');
};

const completeTask = (taskId: string) => {
  moveTask(taskId, 'done');
};

const sendToReview = (taskId: string) => {
  moveTask(taskId, 'review');
};

const backToProgress = (taskId: string) => {
  moveTask(taskId, 'in-progress');
};

const getColumnStats = (status: string) => {
  const tasks = getTasksByStatus(status);
  const totalHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
  const completedHours = tasks.reduce((sum, task) => sum + task.actualHours, 0);
  return { count: tasks.length, totalHours, completedHours };
};

const planSubjects = computed(() => {
  if (!cycle.value) return [];
  const plan = studyStore.studyPlans.find(p => p.id === cycle.value.planId);
  if (!plan) return [];
  return studyStore.subjects.filter(subject => plan.subjects.includes(subject.id));
});

onMounted(() => {
  studyStore.loadFromLocalStorage();
  
  if (!cycle.value) {
    router.push('/main/cycles');
  } else {
    page.value.title = `${cycle.value.name} - Kanban`;
    breadcrumbs.value[2].title = cycle.value.name;
  }
});
</script>

<template>
  <div v-if="cycle">
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
    
    <!-- Header do Ciclo Ativo -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card :color="cycle.color" variant="tonal" class="cycle-header">
          <v-card-text class="pa-6">
            <div class="d-flex align-center justify-space-between mb-4">
              <div class="d-flex align-center">
                <v-avatar :color="cycle.color" size="72" class="me-4 cycle-avatar">
                  <SvgSprite name="custom-refresh" style="width: 36px; height: 36px" />
                </v-avatar>
                <div>
                  <h2 class="text-h2 mb-1">{{ cycle.name }}</h2>
                  <div class="d-flex align-center gap-2 mb-2">
                    <v-chip :color="cycle.color" variant="flat" size="small">
                      Sprint Ativo
                    </v-chip>
                    <v-chip color="info" variant="tonal" size="small">
                      {{ getDaysRemaining() }} dias restantes
                    </v-chip>
                  </div>
                  <p class="text-subtitle-1 mb-0 cycle-description">{{ cycle.description }}</p>
                </div>
              </div>
              
              <div class="text-end cycle-actions">
                <v-btn
                  color="success"
                  @click="completeCycle"
                  prepend-icon="mdi-check-circle"
                  class="mb-2"
                  size="large"
                  variant="flat"
                >
                  Finalizar Sprint
                </v-btn>
                <div class="cycle-stats">
                  <div class="stat-item">
                    <SvgSprite name="custom-clock" style="width: 16px; height: 16px" class="me-2" />
                    <span>{{ formatHours(cycle.completedHours) }} / {{ formatHours(cycle.totalHours) }}</span>
                  </div>
                  <div class="stat-item">
                    <SvgSprite name="custom-target" style="width: 16px; height: 16px" class="me-2" />
                    <span>{{ cycle.goals.length }} objetivos</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Progresso Geral -->
            <div class="progress-section">
              <div class="d-flex justify-space-between mb-2">
                <span class="text-subtitle-1 font-weight-medium">Progresso do Sprint</span>
                <span class="text-subtitle-1 font-weight-bold">{{ Math.round(getCycleProgress()) }}%</span>
              </div>
              <v-progress-linear
                :model-value="getCycleProgress()"
                :color="cycle.color"
                height="12"
                rounded
                class="progress-bar"
              />
            </div>
            
            <!-- Objetivos -->
            <div v-if="cycle.goals.length > 0" class="goals-section mt-4">
              <h6 class="text-h6 mb-3 d-flex align-center">
                <SvgSprite name="custom-target" style="width: 18px; height: 18px" class="me-2" />
                Objetivos do Sprint
              </h6>
              <div class="goals-grid">
                <v-chip
                  v-for="(goal, index) in cycle.goals"
                  :key="index"
                  :color="cycle.color"
                  variant="outlined"
                  size="small"
                  class="goal-chip"
                >
                  <SvgSprite name="custom-target" style="width: 12px; height: 12px" class="me-1" />
                  {{ goal }}
                </v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Kanban Board -->
    <UiParentCard>
      <template v-slot:title>
        <div class="d-flex align-center">
          <v-avatar color="primary" size="32" class="me-3">
            <SvgSprite name="custom-window" style="width: 16px; height: 16px" />
          </v-avatar>
          <span>Quadro Kanban - {{ cycle.name }}</span>
        </div>
      </template>
      
      <template v-slot:action>
        <v-btn
          color="primary"
          @click="openNewTaskDialog"
          prepend-icon="mdi-plus"
          variant="flat"
          rounded="lg"
        >
          Nova Tarefa
        </v-btn>
      </template>

      <div class="kanban-board">
        <v-row class="kanban-columns">
          <v-col
            v-for="column in columns"
            :key="column.status"
            cols="12"
            sm="6"
            lg="3"
            class="kanban-column-wrapper"
          >
            <div class="kanban-column" :class="`column-${column.status}`">
              <!-- Header da Coluna -->
              <div class="column-header">
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="d-flex align-center">
                    <v-avatar :color="column.color" size="32" class="me-3 column-icon">
                      <SvgSprite :name="column.icon" style="width: 16px; height: 16px" />
                    </v-avatar>
                    <div>
                      <h6 class="text-h6 mb-0 column-title">{{ column.title }}</h6>
                      <p class="text-caption text-lightText mb-0">{{ column.description }}</p>
                    </div>
                  </div>
                  
                  <v-chip 
                    :color="column.color" 
                    size="small" 
                    variant="tonal"
                    class="task-counter"
                  >
                    {{ getColumnStats(column.status).count }}
                  </v-chip>
                </div>
                
                <!-- Estatísticas da Coluna -->
                <div class="column-stats">
                  <div class="d-flex justify-space-between text-caption">
                    <span>{{ formatHours(getColumnStats(column.status).totalHours) }} estimadas</span>
                    <span>{{ formatHours(getColumnStats(column.status).completedHours) }} reais</span>
                  </div>
                  <v-progress-linear
                    :model-value="getColumnStats(column.status).totalHours > 0 ? 
                      (getColumnStats(column.status).completedHours / getColumnStats(column.status).totalHours) * 100 : 0"
                    :color="column.color"
                    height="4"
                    rounded
                    class="mt-1"
                  />
                </div>
              </div>
              
              <!-- Lista de Tarefas -->
              <div class="tasks-container">
                <div
                  v-for="task in getTasksByStatus(column.status)"
                  :key="task.id"
                  class="task-card"
                  @click="openTaskDialog(task)"
                >
                  <v-card 
                    variant="outlined" 
                    hover
                    class="task-item"
                    :class="`priority-${task.priority}`"
                  >
                    <v-card-text class="pa-4">
                      <!-- Header da Tarefa -->
                      <div class="d-flex align-center justify-space-between mb-3">
                        <v-chip
                          :color="getSubjectColor(task.subjectId)"
                          size="x-small"
                          variant="tonal"
                          class="subject-chip"
                        >
                          {{ getSubjectName(task.subjectId) }}
                        </v-chip>
                        
                        <div class="d-flex align-center gap-1">
                          <v-tooltip :text="getPriorityText(task.priority)">
                            <template v-slot:activator="{ props }">
                              <v-icon
                                v-bind="props"
                                :color="getPriorityColor(task.priority)"
                                :icon="`mdi-${task.priority === 'high' ? 'alert' : task.priority === 'medium' ? 'clock' : 'check'}`"
                                size="16"
                              />
                            </template>
                          </v-tooltip>
                          
                          <v-menu>
                            <template v-slot:activator="{ props }">
                              <v-btn
                                v-bind="props"
                                icon
                                size="x-small"
                                variant="text"
                                @click.stop
                                class="task-menu-btn"
                              >
                                <SvgSprite name="custom-more" style="width: 12px; height: 12px" />
                              </v-btn>
                            </template>
                            <v-list density="compact">
                              <!-- Ações de Movimento -->
                              <v-list-subheader>Mover para</v-list-subheader>
                              <v-list-item
                                v-for="col in columns.filter(c => c.status !== task.status)"
                                :key="col.status"
                                @click="moveTask(task.id, col.status as CycleTask['status'])"
                                class="move-action"
                              >
                                <template v-slot:prepend>
                                  <v-avatar :color="col.color" size="20" class="me-2">
                                    <SvgSprite :name="col.icon" style="width: 10px; height: 10px" />
                                  </v-avatar>
                                </template>
                                <v-list-item-title class="text-body-2">{{ col.title }}</v-list-item-title>
                              </v-list-item>
                              
                              <!-- Ações Rápidas -->
                              <v-divider class="my-1" />
                              <v-list-subheader>Ações Rápidas</v-list-subheader>
                              
                              <v-list-item
                                v-if="task.status === 'todo'"
                                @click="startTask(task.id)"
                                class="quick-action"
                              >
                                <template v-slot:prepend>
                                  <SvgSprite name="custom-play" style="width: 14px; height: 14px" class="me-2" />
                                </template>
                                <v-list-item-title class="text-body-2">Iniciar Tarefa</v-list-item-title>
                              </v-list-item>
                              
                              <v-list-item
                                v-if="task.status === 'in-progress'"
                                @click="sendToReview(task.id)"
                                class="quick-action"
                              >
                                <template v-slot:prepend>
                                  <SvgSprite name="custom-eye" style="width: 14px; height: 14px" class="me-2" />
                                </template>
                                <v-list-item-title class="text-body-2">Enviar p/ Revisão</v-list-item-title>
                              </v-list-item>
                              
                              <v-list-item
                                v-if="task.status === 'review'"
                                @click="completeTask(task.id)"
                                class="quick-action"
                              >
                                <template v-slot:prepend>
                                  <SvgSprite name="custom-check" style="width: 14px; height: 14px" class="me-2" />
                                </template>
                                <v-list-item-title class="text-body-2">Marcar Concluída</v-list-item-title>
                              </v-list-item>
                              
                              <v-list-item
                                v-if="task.status === 'review'"
                                @click="backToProgress(task.id)"
                                class="quick-action"
                              >
                                <template v-slot:prepend>
                                  <SvgSprite name="custom-refresh" style="width: 14px; height: 14px" class="me-2" />
                                </template>
                                <v-list-item-title class="text-body-2">Voltar p/ Progresso</v-list-item-title>
                              </v-list-item>
                              
                              <v-divider class="my-1" />
                              <v-list-item @click="deleteTask(task.id)" class="text-error">
                                <template v-slot:prepend>
                                  <SvgSprite name="custom-trash" style="width: 14px; height: 14px" class="me-2" />
                                </template>
                                <v-list-item-title class="text-body-2">Excluir</v-list-item-title>
                              </v-list-item>
                            </v-list>
                          </v-menu>
                        </div>
                      </div>
                      
                      <!-- Título da Tarefa -->
                      <h6 class="text-subtitle-1 mb-2 task-title">{{ task.title }}</h6>
                      
                      <!-- Descrição -->
                      <p v-if="task.description" class="text-caption text-lightText mb-3 task-description">
                        {{ task.description }}
                      </p>
                      
                      <!-- Progresso da Tarefa -->
                      <div v-if="task.status !== 'todo'" class="task-progress mb-3">
                        <div class="d-flex justify-space-between mb-1">
                          <span class="text-caption">Progresso</span>
                          <span class="text-caption">{{ Math.round(getTaskProgress(task)) }}%</span>
                        </div>
                        <v-progress-linear
                          :model-value="getTaskProgress(task)"
                          :color="getSubjectColor(task.subjectId)"
                          height="4"
                          rounded
                        />
                      </div>
                      
                      <!-- Footer da Tarefa -->
                      <div class="d-flex align-center justify-space-between task-footer">
                        <div class="d-flex align-center gap-2">
                          <v-chip
                            :color="getPriorityColor(task.priority)"
                            size="x-small"
                            variant="tonal"
                          >
                            {{ getPriorityText(task.priority) }}
                          </v-chip>
                        </div>
                        
                        <div class="time-info">
                          <span class="text-caption">
                            <SvgSprite name="custom-clock" style="width: 12px; height: 12px" class="me-1" />
                            {{ formatHours(task.estimatedHours) }}
                          </span>
                          <span v-if="task.actualHours > 0" class="text-caption ms-2">
                            ({{ formatHours(task.actualHours) }} real)
                          </span>
                        </div>
                      </div>
                      
                      <!-- Ações Rápidas -->
                      <div class="quick-actions mt-3">
                        <v-btn
                          v-if="task.status === 'todo'"
                          @click.stop="startTask(task.id)"
                          color="warning"
                          size="small"
                          variant="tonal"
                          block
                          prepend-icon="mdi-play"
                        >
                          Iniciar
                        </v-btn>
                        
                        <v-btn
                          v-if="task.status === 'in-progress'"
                          @click.stop="sendToReview(task.id)"
                          color="info"
                          size="small"
                          variant="tonal"
                          block
                          prepend-icon="mdi-eye"
                        >
                          Revisar
                        </v-btn>
                        
                        <div v-if="task.status === 'review'" class="d-flex gap-2">
                          <v-btn
                            @click.stop="backToProgress(task.id)"
                            color="warning"
                            size="small"
                            variant="tonal"
                            prepend-icon="mdi-arrow-left"
                            class="flex-grow-1"
                          >
                            Voltar
                          </v-btn>
                          <v-btn
                            @click.stop="completeTask(task.id)"
                            color="success"
                            size="small"
                            variant="tonal"
                            prepend-icon="mdi-check"
                            class="flex-grow-1"
                          >
                            Concluir
                          </v-btn>
                        </div>
                        
                        <v-chip
                          v-if="task.status === 'done'"
                          color="success"
                          size="small"
                          variant="flat"
                          block
                          prepend-icon="mdi-check-circle"
                        >
                          Concluída
                        </v-chip>
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
                
                <!-- Estado Vazio da Coluna -->
                <div v-if="getTasksByStatus(column.status).length === 0" class="empty-column">
                  <div class="empty-state">
                    <v-avatar :color="column.color" size="48" class="mb-3 empty-icon">
                      <SvgSprite :name="column.icon" style="width: 24px; height: 24px; opacity: 0.5" />
                    </v-avatar>
                    <p class="text-subtitle-2 mb-1">Nenhuma tarefa</p>
                    <p class="text-caption text-lightText mb-0">{{ column.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </div>
    </UiParentCard>

    <!-- Dialog para Editar Tarefa -->
    <v-dialog v-model="taskDialog" max-width="700px" persistent>
      <v-card class="task-dialog">
        <v-card-title class="dialog-header">
          <div class="d-flex align-center">
            <v-avatar :color="getSubjectColor(currentTask.subjectId)" size="32" class="me-3">
              <SvgSprite name="custom-edit" style="width: 16px; height: 16px" />
            </v-avatar>
            <div>
              <span class="text-h6">Editar Tarefa</span>
              <p class="text-caption text-lightText mb-0">{{ currentTask.title }}</p>
            </div>
          </div>
        </v-card-title>
        
        <v-card-text class="pa-6">
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="currentTask.title"
                  label="Título da Tarefa"
                  variant="outlined"
                  readonly
                  class="mb-4"
                  prepend-inner-icon="mdi-format-title"
                />
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="currentTask.description"
                  label="Descrição"
                  variant="outlined"
                  rows="3"
                  readonly
                  class="mb-4"
                  prepend-inner-icon="mdi-text"
                />
              </v-col>
              
              <v-col cols="6">
                <v-text-field
                  v-model.number="currentTask.estimatedHours"
                  label="Horas Estimadas"
                  type="number"
                  variant="outlined"
                  readonly
                  prepend-inner-icon="mdi-clock-outline"
                />
              </v-col>
              
              <v-col cols="6">
                <v-text-field
                  v-model.number="currentTask.actualHours"
                  label="Horas Reais *"
                  type="number"
                  variant="outlined"
                  min="0"
                  step="0.5"
                  prepend-inner-icon="mdi-clock"
                  :color="getSubjectColor(currentTask.subjectId)"
                />
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="currentTask.notes"
                  label="Anotações da Sessão"
                  variant="outlined"
                  rows="4"
                  placeholder="Como foi o estudo? Dificuldades encontradas? Pontos importantes..."
                  prepend-inner-icon="mdi-note-text"
                  counter="500"
                  maxlength="500"
                />
              </v-col>
            </v-row>
            
            <!-- Status Atual -->
            <v-alert 
              :type="currentTask.status === 'done' ? 'success' : 'info'" 
              variant="tonal" 
              class="mt-4"
            >
              <div class="d-flex align-center">
                <SvgSprite :name="columns.find(c => c.status === currentTask.status)?.icon || 'custom-info'" 
                          style="width: 18px; height: 18px" class="me-2" />
                <div>
                  <strong>Status Atual:</strong> {{ columns.find(c => c.status === currentTask.status)?.title }}
                  <br>
                  <small>{{ columns.find(c => c.status === currentTask.status)?.description }}</small>
                </div>
              </div>
            </v-alert>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn @click="taskDialog = false" variant="outlined">
            Cancelar
          </v-btn>
          <v-btn 
            color="primary" 
            @click="saveTask"
            variant="flat"
            prepend-icon="mdi-content-save"
          >
            Salvar Alterações
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog para Nova Tarefa -->
    <v-dialog v-model="newTaskDialog" max-width="600px" persistent>
      <v-card class="task-dialog">
        <v-card-title class="dialog-header">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="32" class="me-3">
              <SvgSprite name="custom-plus" style="width: 16px; height: 16px" />
            </v-avatar>
            <span>Nova Tarefa do Sprint</span>
          </div>
        </v-card-title>
        
        <v-card-text class="pa-6">
          <v-form>
            <v-select
              v-model="currentTask.subjectId"
              :items="planSubjects"
              item-title="name"
              item-value="id"
              label="Disciplina *"
              variant="outlined"
              class="mb-4"
              prepend-inner-icon="mdi-school"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <v-avatar :color="item.raw.color" size="24">
                      <SvgSprite name="custom-book" style="width: 12px; height: 12px" />
                    </v-avatar>
                  </template>
                </v-list-item>
              </template>
            </v-select>
            
            <v-text-field
              v-model="currentTask.title"
              label="Título da Tarefa *"
              variant="outlined"
              class="mb-4"
              placeholder="Ex: Resolver exercícios de derivadas"
              prepend-inner-icon="mdi-format-title"
            />
            
            <v-textarea
              v-model="currentTask.description"
              label="Descrição"
              variant="outlined"
              rows="3"
              class="mb-4"
              placeholder="Descreva o que será estudado nesta tarefa..."
              prepend-inner-icon="mdi-text"
            />
            
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model.number="currentTask.estimatedHours"
                  label="Horas Estimadas *"
                  type="number"
                  variant="outlined"
                  min="0.5"
                  step="0.5"
                  prepend-inner-icon="mdi-clock-outline"
                />
              </v-col>
              
              <v-col cols="6">
                <div class="mb-2">
                  <v-label>Prioridade</v-label>
                </div>
                <v-chip-group v-model="currentTask.priority" mandatory>
                  <v-chip value="low" color="success" variant="tonal" size="small">
                    Baixa
                  </v-chip>
                  <v-chip value="medium" color="warning" variant="tonal" size="small">
                    Média
                  </v-chip>
                  <v-chip value="high" color="error" variant="tonal" size="small">
                    Alta
                  </v-chip>
                </v-chip-group>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn @click="newTaskDialog = false" variant="outlined">
            Cancelar
          </v-btn>
          <v-btn 
            color="primary" 
            @click="addNewTask"
            :disabled="!currentTask.subjectId || !currentTask.title"
            variant="flat"
            prepend-icon="mdi-plus"
          >
            Adicionar Tarefa
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
  
  <div v-else class="text-center py-12">
    <SvgSprite name="custom-refresh" style="width: 64px; height: 64px; opacity: 0.3" />
    <h5 class="text-h5 mt-4 mb-2">Ciclo não encontrado</h5>
    <p class="text-subtitle-1 text-lightText mb-4">
      O ciclo solicitado não existe ou foi removido
    </p>
    <v-btn color="primary" to="/main/cycles">
      Voltar aos Ciclos
    </v-btn>
  </div>
</template>

<style scoped>
/* Header do Ciclo */
.cycle-header {
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(var(--v-theme-surface), 0.95), rgba(var(--v-theme-containerBg), 0.8));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

.cycle-avatar {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.cycle-description {
  max-width: 400px;
  line-height: 1.5;
}

.cycle-actions {
  min-width: 200px;
}

.cycle-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-lightText));
}

.progress-section {
  background: rgba(var(--v-theme-surface), 0.8);
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

.progress-bar {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.goals-section {
  background: rgba(var(--v-theme-surface), 0.6);
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

.goals-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.goal-chip {
  transition: all 0.3s ease;
}

.goal-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Kanban Board */
.kanban-board {
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

.kanban-columns {
  gap: 1rem;
}

.kanban-column-wrapper {
  padding: 0.5rem;
}

.kanban-column {
  background: rgba(var(--v-theme-surface), 0.8);
  border-radius: 16px;
  padding: 1.5rem;
  min-height: 600px;
  border: 2px solid rgba(var(--v-theme-borderLight), 0.3);
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.kanban-column:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.column-todo {
  border-left: 4px solid rgb(var(--v-theme-grey-lighten-1));
}

.column-in-progress {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.column-review {
  border-left: 4px solid rgb(var(--v-theme-info));
}

.column-done {
  border-left: 4px solid rgb(var(--v-theme-success));
}

/* Header da Coluna */
.column-header {
  border-bottom: 2px solid rgba(var(--v-theme-borderLight), 0.5);
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.column-icon {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.column-title {
  font-weight: 600;
}

.task-counter {
  font-weight: 600;
}

.column-stats {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(var(--v-theme-containerBg), 0.5);
  border-radius: 8px;
}

/* Container de Tarefas */
.tasks-container {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.tasks-container::-webkit-scrollbar {
  width: 6px;
}

.tasks-container::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-borderLight), 0.3);
  border-radius: 3px;
}

.tasks-container::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.5);
  border-radius: 3px;
}

/* Cards de Tarefa */
.task-card {
  margin-bottom: 1rem;
  cursor: pointer;
}

.task-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.task-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.task-item.priority-high {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.task-item.priority-medium {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.task-item.priority-low {
  border-left: 4px solid rgb(var(--v-theme-success));
}

.subject-chip {
  font-weight: 500;
}

.task-title {
  font-weight: 600;
  line-height: 1.3;
}

.task-description {
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-progress {
  background: rgba(var(--v-theme-containerBg), 0.3);
  padding: 0.5rem;
  border-radius: 6px;
}

.task-footer {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

.time-info {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.task-menu-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.task-item:hover .task-menu-btn {
  opacity: 1;
}

/* Ações Rápidas */
.quick-actions {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

/* Estado Vazio */
.empty-column {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border: 2px dashed rgba(var(--v-theme-borderLight), 0.5);
  border-radius: 12px;
  background: rgba(var(--v-theme-containerBg), 0.2);
}

.empty-state {
  text-align: center;
  padding: 2rem;
}

.empty-icon {
  background: rgba(var(--v-theme-containerBg), 0.5) !important;
}

/* Dialogs */
.task-dialog {
  border-radius: 16px;
}

.dialog-header {
  background: linear-gradient(135deg, rgba(var(--v-theme-containerBg), 0.8), rgba(var(--v-theme-surface), 0.9));
  padding: 1.5rem !important;
  border-bottom: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

/* Menu Actions */
.move-action:hover {
  background: rgba(var(--v-theme-primary), 0.1);
}

.quick-action:hover {
  background: rgba(var(--v-theme-success), 0.1);
}

/* Responsividade */
@media (max-width: 1024px) {
  .kanban-columns {
    gap: 0.5rem;
  }
  
  .kanban-column {
    padding: 1rem;
    min-height: 400px;
  }
  
  .cycle-actions {
    min-width: auto;
    text-align: center;
  }
  
  .cycle-description {
    max-width: none;
  }
}

@media (max-width: 768px) {
  .kanban-board {
    padding: 1rem;
  }
  
  .tasks-container {
    max-height: 300px;
  }
  
  .task-item {
    margin-bottom: 0.75rem;
  }
  
  .quick-actions .d-flex {
    flex-direction: column;
    gap: 0.5rem;
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

.task-card {
  animation: slideIn 0.3s ease-out;
}

/* Estados de Hover */
.v-card:hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-btn:hover {
  transform: translateY(-1px);
}

.v-chip:hover {
  transform: translateY(-1px);
}
</style>
</template>