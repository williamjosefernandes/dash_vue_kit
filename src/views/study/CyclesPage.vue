<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';
import type { CycleTask } from '@/types/study';

const studyStore = useStudyStore();
const page = ref({ title: 'Ciclos de Estudo' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Ciclos de Estudo', disabled: true, href: '#' }
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
  status: 'todo' as 'todo' | 'in-progress' | 'done',
  priority: 'medium' as 'low' | 'medium' | 'high',
  notes: '',
  order: 0
});

const kanbanColumns = [
  { 
    title: 'A Fazer', 
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
    title: 'Concluído', 
    status: 'done', 
    color: 'success',
    icon: 'custom-check',
    description: 'Tarefas finalizadas'
  }
];

const stats = computed(() => studyStore.getCycleStats);

const activeCycle = computed(() => {
  return studyStore.studyCycles.find(cycle => cycle.status === 'active');
});

const getTasksByStatus = (status: string) => {
  return activeCycle.value?.tasks.filter(task => task.status === status).sort((a, b) => a.order - b.order) || [];
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

const formatHours = (hours: number) => {
  return `${hours.toFixed(1)}h`;
};

const getCycleProgress = (cycle: any) => {
  return cycle.totalHours > 0 ? (cycle.completedHours / cycle.totalHours) * 100 : 0;
};

const getDaysRemaining = (endDate: Date) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
};

const getColumnStats = (status: string) => {
  const tasks = getTasksByStatus(status);
  const totalHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
  const completedHours = tasks.reduce((sum, task) => sum + task.actualHours, 0);
  return { count: tasks.length, totalHours, completedHours };
};

const moveTask = (taskId: string, newStatus: CycleTask['status']) => {
  if (activeCycle.value) {
    studyStore.moveCycleTask(activeCycle.value.id, taskId, newStatus);
  }
};

const openTaskDialog = (task: CycleTask) => {
  currentTask.value = { ...task };
  taskDialog.value = true;
};

const openNewTaskDialog = () => {
  if (!activeCycle.value) return;
  
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
    order: activeCycle.value.tasks.length
  };
  newTaskDialog.value = true;
};

const saveTask = () => {
  if (activeCycle.value) {
    studyStore.updateCycleTask(activeCycle.value.id, currentTask.value.id, currentTask.value);
    taskDialog.value = false;
  }
};

const addNewTask = () => {
  if (activeCycle.value) {
    studyStore.addCycleTask(activeCycle.value.id, currentTask.value);
    newTaskDialog.value = false;
  }
};

const deleteTask = (taskId: string) => {
  if (activeCycle.value && confirm('Tem certeza que deseja excluir esta tarefa?')) {
    studyStore.deleteCycleTask(activeCycle.value.id, taskId);
  }
};

const startTask = (taskId: string) => {
  moveTask(taskId, 'in-progress');
};

const completeTask = (taskId: string) => {
  moveTask(taskId, 'done');
};

const backToTodo = (taskId: string) => {
  moveTask(taskId, 'todo');
};

const planSubjects = computed(() => {
  if (!activeCycle.value) return [];
  const plan = studyStore.studyPlans.find(p => p.id === activeCycle.value.planId);
  if (!plan) return [];
  return studyStore.subjects.filter(subject => plan.subjects.includes(subject.id));
});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'success';
    case 'completed': return 'info';
    case 'planning': return 'warning';
    case 'cancelled': return 'error';
    default: return 'primary';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return 'Ativo';
    case 'completed': return 'Concluído';
    case 'planning': return 'Planejamento';
    case 'cancelled': return 'Cancelado';
    default: return status;
  }
};

const getPlanName = (planId: string) => {
  const plan = studyStore.studyPlans.find(p => p.id === planId);
  return plan?.name || 'Plano não encontrado';
};

const deleteCycle = (id: string) => {
  if (confirm('Tem certeza que deseja excluir este ciclo?')) {
    studyStore.deleteStudyCycle(id);
  }
};

const activateCycle = (cycleId: string) => {
  studyStore.setActiveCycle(cycleId);
  studyStore.updateStudyCycle(cycleId, { status: 'active' });
};

onMounted(() => {
  studyStore.loadFromLocalStorage();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  
  <!-- Cards de Estatísticas -->
  <v-row class="mb-6">
    <v-col cols="12" sm="6" md="3">
      <v-card class="text-center" color="primary" variant="tonal">
        <v-card-text>
          <div class="d-flex align-center justify-center mb-2">
            <SvgSprite name="custom-refresh" style="width: 24px; height: 24px" />
          </div>
          <h3 class="text-h3">{{ stats.totalCycles }}</h3>
          <p class="text-subtitle-2 mb-0">Total de Ciclos</p>
        </v-card-text>
      </v-card>
    </v-col>
    
    <v-col cols="12" sm="6" md="3">
      <v-card class="text-center" color="success" variant="tonal">
        <v-card-text>
          <div class="d-flex align-center justify-center mb-2">
            <SvgSprite name="custom-play" style="width: 24px; height: 24px" />
          </div>
          <h3 class="text-h3">{{ stats.activeCycles }}</h3>
          <p class="text-subtitle-2 mb-0">Ciclos Ativos</p>
        </v-card-text>
      </v-card>
    </v-col>
    
    <v-col cols="12" sm="6" md="3">
      <v-card class="text-center" color="info" variant="tonal">
        <v-card-text>
          <div class="d-flex align-center justify-center mb-2">
            <SvgSprite name="custom-check" style="width: 24px; height: 24px" />
          </div>
          <h3 class="text-h3">{{ stats.completedCycles }}</h3>
          <p class="text-subtitle-2 mb-0">Concluídos</p>
        </v-card-text>
      </v-card>
    </v-col>
    
    <v-col cols="12" sm="6" md="3">
      <v-card class="text-center" color="warning" variant="tonal">
        <v-card-text>
          <div class="d-flex align-center justify-center mb-2">
            <SvgSprite name="custom-clock" style="width: 24px; height: 24px" />
          </div>
          <h3 class="text-h3">{{ Math.round(stats.averageCompletion) }}%</h3>
          <p class="text-subtitle-2 mb-0">Média de Conclusão</p>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- Quadro Kanban do Ciclo Ativo -->
  <div v-if="activeCycle" class="mb-6">
    <UiParentCard>
      <template v-slot:title>
        <div class="d-flex align-center">
          <v-avatar :color="activeCycle.color" size="32" class="me-3">
            <SvgSprite name="custom-refresh" style="width: 16px; height: 16px" />
          </v-avatar>
          <div>
            <span>{{ activeCycle.name }} - Kanban</span>
            <p class="text-caption text-lightText mb-0">Sprint Ativo</p>
          </div>
        </div>
      </template>
      
      <template v-slot:action>
        <div class="d-flex gap-2">
          <v-btn
            color="primary"
            @click="openNewTaskDialog"
            prepend-icon="mdi-plus"
            variant="flat"
            size="small"
          >
            Nova Tarefa
          </v-btn>
          <v-btn
            :to="`/main/cycles/${activeCycle.id}`"
            color="info"
            prepend-icon="mdi-fullscreen"
            variant="outlined"
            size="small"
          >
            Tela Cheia
          </v-btn>
        </div>
      </template>

      <!-- Header do Sprint Ativo -->
      <div class="sprint-header mb-6">
        <v-row>
          <v-col cols="12" md="8">
            <div class="d-flex align-center mb-3">
              <v-avatar :color="activeCycle.color" size="48" class="me-3">
                <SvgSprite name="custom-refresh" style="width: 24px; height: 24px" />
              </v-avatar>
              <div>
                <h5 class="text-h5 mb-1">{{ activeCycle.name }}</h5>
                <p class="text-subtitle-2 text-lightText mb-0">{{ activeCycle.description }}</p>
              </div>
            </div>
            
            <!-- Progresso do Sprint -->
            <div class="progress-section">
              <div class="d-flex justify-space-between mb-2">
                <span class="text-subtitle-2">Progresso do Sprint</span>
                <span class="text-subtitle-2 font-weight-bold">{{ Math.round(getCycleProgress(activeCycle)) }}%</span>
              </div>
              <v-progress-linear
                :model-value="getCycleProgress(activeCycle)"
                :color="activeCycle.color"
                height="8"
                rounded
              />
            </div>
          </v-col>
          
          <v-col cols="12" md="4">
            <div class="sprint-stats">
              <div class="stat-item">
                <SvgSprite name="custom-clock" style="width: 16px; height: 16px" class="me-2" />
                <span>{{ formatHours(activeCycle.completedHours) }} / {{ formatHours(activeCycle.totalHours) }}</span>
              </div>
              <div class="stat-item">
                <SvgSprite name="custom-calendar" style="width: 16px; height: 16px" class="me-2" />
                <span>{{ getDaysRemaining(activeCycle.endDate) }} dias restantes</span>
              </div>
              <div class="stat-item">
                <SvgSprite name="custom-list" style="width: 16px; height: 16px" class="me-2" />
                <span>{{ activeCycle.tasks.length }} tarefa(s)</span>
              </div>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- Quadro Kanban -->
      <div class="kanban-board">
        <v-row class="kanban-columns">
          <v-col
            v-for="column in kanbanColumns"
            :key="column.status"
            cols="12"
            md="4"
            class="kanban-column-wrapper"
          >
            <div class="kanban-column" :class="`column-${column.status}`">
              <!-- Header da Coluna -->
              <div class="column-header">
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="d-flex align-center">
                    <v-avatar :color="column.color" size="28" class="me-2">
                      <SvgSprite :name="column.icon" style="width: 14px; height: 14px" />
                    </v-avatar>
                    <div>
                      <h6 class="text-subtitle-1 mb-0">{{ column.title }}</h6>
                      <p class="text-caption text-lightText mb-0">{{ column.description }}</p>
                    </div>
                  </div>
                  
                  <v-chip 
                    :color="column.color" 
                    size="small" 
                    variant="tonal"
                  >
                    {{ getColumnStats(column.status).count }}
                  </v-chip>
                </div>
                
                <!-- Estatísticas da Coluna -->
                <div class="column-stats">
                  <div class="d-flex justify-space-between text-caption mb-1">
                    <span>{{ formatHours(getColumnStats(column.status).totalHours) }} estimadas</span>
                    <span>{{ formatHours(getColumnStats(column.status).completedHours) }} reais</span>
                  </div>
                  <v-progress-linear
                    :model-value="getColumnStats(column.status).totalHours > 0 ? 
                      (getColumnStats(column.status).completedHours / getColumnStats(column.status).totalHours) * 100 : 0"
                    :color="column.color"
                    height="3"
                    rounded
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
                    <v-card-text class="pa-3">
                      <!-- Header da Tarefa -->
                      <div class="d-flex align-center justify-space-between mb-2">
                        <v-chip
                          :color="getSubjectColor(task.subjectId)"
                          size="x-small"
                          variant="tonal"
                        >
                          {{ getSubjectName(task.subjectId) }}
                        </v-chip>
                        
                        <v-menu>
                          <template v-slot:activator="{ props }">
                            <v-btn
                              v-bind="props"
                              icon
                              size="x-small"
                              variant="text"
                              @click.stop
                            >
                              <SvgSprite name="custom-more" style="width: 12px; height: 12px" />
                            </v-btn>
                          </template>
                          <v-list density="compact">
                            <!-- Ações de Movimento -->
                            <v-list-item
                              v-for="col in kanbanColumns.filter(c => c.status !== task.status)"
                              :key="col.status"
                              @click="moveTask(task.id, col.status as CycleTask['status'])"
                            >
                              <template v-slot:prepend>
                                <v-avatar :color="col.color" size="16" class="me-2">
                                  <SvgSprite :name="col.icon" style="width: 8px; height: 8px" />
                                </v-avatar>
                              </template>
                              <v-list-item-title class="text-caption">{{ col.title }}</v-list-item-title>
                            </v-list-item>
                            
                            <v-divider class="my-1" />
                            <v-list-item @click="deleteTask(task.id)" class="text-error">
                              <template v-slot:prepend>
                                <SvgSprite name="custom-trash" style="width: 12px; height: 12px" class="me-2" />
                              </template>
                              <v-list-item-title class="text-caption">Excluir</v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-menu>
                      </div>
                      
                      <!-- Título da Tarefa -->
                      <h6 class="text-subtitle-2 mb-2">{{ task.title }}</h6>
                      
                      <!-- Descrição -->
                      <p v-if="task.description" class="text-caption text-lightText mb-2">
                        {{ task.description.length > 50 ? task.description.substring(0, 50) + '...' : task.description }}
                      </p>
                      
                      <!-- Footer da Tarefa -->
                      <div class="d-flex align-center justify-space-between">
                        <v-chip
                          :color="getPriorityColor(task.priority)"
                          size="x-small"
                          variant="tonal"
                        >
                          {{ getPriorityText(task.priority) }}
                        </v-chip>
                        
                        <span class="text-caption">
                          <SvgSprite name="custom-clock" style="width: 10px; height: 10px" class="me-1" />
                          {{ formatHours(task.estimatedHours) }}
                        </span>
                      </div>
                      
                      <!-- Ações Rápidas -->
                      <div class="quick-actions mt-2">
                        <v-btn
                          v-if="task.status === 'todo'"
                          @click.stop="startTask(task.id)"
                          color="warning"
                          size="x-small"
                          variant="tonal"
                          block
                          prepend-icon="mdi-play"
                        >
                          Iniciar
                        </v-btn>
                        
                        <v-btn
                          v-if="task.status === 'in-progress'"
                          @click.stop="completeTask(task.id)"
                          color="success"
                          size="x-small"
                          variant="tonal"
                          block
                          prepend-icon="mdi-check"
                        >
                          Concluir
                        </v-btn>
                        
                        <div v-if="task.status === 'done'" class="text-center">
                          <v-chip
                            color="success"
                            size="x-small"
                            variant="flat"
                            prepend-icon="mdi-check-circle"
                          >
                            Finalizada
                          </v-chip>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
                
                <!-- Estado Vazio da Coluna -->
                <div v-if="getTasksByStatus(column.status).length === 0" class="empty-column">
                  <div class="empty-state">
                    <v-avatar :color="column.color" size="32" class="mb-2">
                      <SvgSprite :name="column.icon" style="width: 16px; height: 16px; opacity: 0.5" />
                    </v-avatar>
                    <p class="text-caption mb-0">{{ column.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </div>
    </UiParentCard>
  </div>

  <UiParentCard title="Meus Ciclos de Estudo">
    <template v-slot:action>
      <v-btn color="primary" prepend-icon="mdi-plus">
        <router-link to="/main/cycles/new" class="text-decoration-none text-white">
          Novo Ciclo
        </router-link>
      </v-btn>
    </template>

    <v-row v-if="studyStore.studyCycles.length > 0">
      <v-col 
        v-for="cycle in studyStore.studyCycles" 
        :key="cycle.id"
        cols="12" 
        md="6" 
        lg="4"
      >
        <v-card class="h-100" :class="{ 'border-primary': cycle.id === studyStore.activeCycle?.id }">
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-3">
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
                  <v-list-item :to="`/main/cycles/${cycle.id}`">
                    <template v-slot:prepend>
                      <SvgSprite name="custom-eye" style="width: 16px; height: 16px" />
                    </template>
                    <v-list-item-title>Abrir Kanban</v-list-item-title>
                  </v-list-item>
                  <v-list-item 
                    v-if="cycle.status === 'planning'"
                    @click="activateCycle(cycle.id)"
                  >
                    <template v-slot:prepend>
                      <SvgSprite name="custom-play" style="width: 16px; height: 16px" />
                    </template>
                    <v-list-item-title>Ativar Ciclo</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="deleteCycle(cycle.id)" class="text-error">
                    <template v-slot:prepend>
                      <SvgSprite name="custom-trash" style="width: 16px; height: 16px" />
                    </template>
                    <v-list-item-title>Excluir</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
            
            <div class="d-flex align-center mb-2">
              <v-avatar :color="cycle.color" size="32" class="me-3">
                <SvgSprite name="custom-refresh" style="width: 16px; height: 16px" />
              </v-avatar>
              <div>
                <h6 class="text-h6 mb-0">{{ cycle.name }}</h6>
                <p class="text-caption text-lightText mb-0">{{ getPlanName(cycle.planId) }}</p>
              </div>
            </div>
            
            <p class="text-caption text-lightText mb-3">{{ cycle.description }}</p>
            
            <!-- Progresso do Ciclo -->
            <div class="mb-3">
              <div class="d-flex justify-space-between mb-1">
                <span class="text-caption">Progresso</span>
                <span class="text-caption">{{ Math.round(getCycleProgress(cycle)) }}%</span>
              </div>
              <v-progress-linear
                :model-value="getCycleProgress(cycle)"
                :color="cycle.color"
                height="6"
                rounded
              />
            </div>
            
            <!-- Informações do Ciclo -->
            <div class="mb-3">
              <div class="d-flex align-center mb-1">
                <SvgSprite name="custom-clock" style="width: 12px; height: 12px" class="me-2" />
                <span class="text-caption">{{ formatHours(cycle.completedHours) }} / {{ formatHours(cycle.totalHours) }}</span>
              </div>
              
              <div class="d-flex align-center mb-1">
                <SvgSprite name="custom-calendar" style="width: 12px; height: 12px" class="me-2" />
                <span class="text-caption">
                  {{ new Date(cycle.startDate).toLocaleDateString() }} - 
                  {{ new Date(cycle.endDate).toLocaleDateString() }}
                </span>
              </div>
              
              <div class="d-flex align-center mb-1">
                <SvgSprite name="custom-list" style="width: 12px; height: 12px" class="me-2" />
                <span class="text-caption">{{ cycle.tasks.length }} tarefa(s)</span>
              </div>
              
              <div v-if="cycle.status === 'active'" class="d-flex align-center">
                <SvgSprite name="custom-alert" style="width: 12px; height: 12px" class="me-2" />
                <span class="text-caption">{{ getDaysRemaining(cycle.endDate) }} dias restantes</span>
              </div>
            </div>
            
            <!-- Objetivos -->
            <div v-if="cycle.goals.length > 0">
              <p class="text-caption mb-1">Objetivos:</p>
              <div class="d-flex flex-wrap gap-1">
                <v-chip 
                  v-for="(goal, index) in cycle.goals.slice(0, 2)" 
                  :key="index"
                  size="x-small" 
                  variant="tonal"
                  :color="cycle.color"
                >
                  {{ goal }}
                </v-chip>
                <v-chip 
                  v-if="cycle.goals.length > 2"
                  size="x-small" 
                  variant="tonal"
                  color="grey"
                >
                  +{{ cycle.goals.length - 2 }}
                </v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <div v-else class="text-center py-12">
      <SvgSprite name="custom-refresh" style="width: 64px; height: 64px; opacity: 0.3" />
      <h5 class="text-h5 mt-4 mb-2">Nenhum ciclo de estudo criado</h5>
      <p class="text-subtitle-1 text-lightText mb-4">
        Organize seus estudos em ciclos focados com objetivos claros e prazos definidos
      </p>
      <v-btn color="primary" prepend-icon="mdi-plus">
        <router-link to="/main/cycles/new" class="text-decoration-none text-white">
          Criar Primeiro Ciclo
        </router-link>
      </v-btn>
    </div>
  </UiParentCard>

  <!-- Dialog para Editar Tarefa -->
  <v-dialog v-model="taskDialog" max-width="600px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-avatar :color="getSubjectColor(currentTask.subjectId)" size="32" class="me-3">
          <SvgSprite name="custom-edit" style="width: 16px; height: 16px" />
        </v-avatar>
        <div>
          <span>Editar Tarefa</span>
          <p class="text-caption text-lightText mb-0">{{ currentTask.title }}</p>
        </div>
      </v-card-title>
      
      <v-card-text>
        <v-form>
          <v-text-field
            v-model="currentTask.title"
            label="Título da Tarefa"
            variant="outlined"
            readonly
            class="mb-4"
          />
          
          <v-textarea
            v-model="currentTask.description"
            label="Descrição"
            variant="outlined"
            rows="2"
            readonly
            class="mb-4"
          />
          
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="currentTask.estimatedHours"
                label="Horas Estimadas"
                type="number"
                variant="outlined"
                readonly
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
                :color="getSubjectColor(currentTask.subjectId)"
              />
            </v-col>
          </v-row>
          
          <v-textarea
            v-model="currentTask.notes"
            label="Anotações da Sessão"
            variant="outlined"
            rows="3"
            placeholder="Como foi o estudo? Dificuldades? Pontos importantes..."
          />
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="taskDialog = false">Cancelar</v-btn>
        <v-btn color="primary" @click="saveTask">Salvar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- Dialog para Nova Tarefa -->
  <v-dialog v-model="newTaskDialog" max-width="500px" persistent>
    <v-card>
      <v-card-title>Nova Tarefa do Sprint</v-card-title>
      
      <v-card-text>
        <v-form>
          <v-select
            v-model="currentTask.subjectId"
            :items="planSubjects"
            item-title="name"
            item-value="id"
            label="Disciplina *"
            variant="outlined"
            class="mb-4"
          />
          
          <v-text-field
            v-model="currentTask.title"
            label="Título da Tarefa *"
            variant="outlined"
            class="mb-4"
          />
          
          <v-textarea
            v-model="currentTask.description"
            label="Descrição"
            variant="outlined"
            rows="2"
            class="mb-4"
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
              />
            </v-col>
            
            <v-col cols="6">
              <div class="mb-2">
                <v-label>Prioridade</v-label>
              </div>
              <v-chip-group v-model="currentTask.priority" mandatory>
                <v-chip value="low" color="success" variant="tonal" size="small">Baixa</v-chip>
                <v-chip value="medium" color="warning" variant="tonal" size="small">Média</v-chip>
                <v-chip value="high" color="error" variant="tonal" size="small">Alta</v-chip>
              </v-chip-group>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="newTaskDialog = false">Cancelar</v-btn>
        <v-btn 
          color="primary" 
          @click="addNewTask"
          :disabled="!currentTask.subjectId || !currentTask.title"
        >
          Adicionar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Sprint Header */
.sprint-header {
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

.progress-section {
  background: rgba(var(--v-theme-surface), 0.8);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

.sprint-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(var(--v-theme-surface), 0.8);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

.stat-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-lightText));
}

/* Kanban Board */
.kanban-board {
  background: rgba(var(--v-theme-containerBg), 0.2);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

.kanban-columns {
  gap: 1rem;
}

.kanban-column-wrapper {
  padding: 0.5rem;
}

.kanban-column {
  background: rgba(var(--v-theme-surface), 0.9);
  border-radius: 12px;
  padding: 1rem;
  min-height: 400px;
  border: 2px solid rgba(var(--v-theme-borderLight), 0.3);
  transition: all 0.3s ease;
}

.kanban-column:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.column-todo {
  border-left: 4px solid rgb(var(--v-theme-grey-lighten-1));
}

.column-in-progress {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.column-done {
  border-left: 4px solid rgb(var(--v-theme-success));
}

/* Header da Coluna */
.column-header {
  border-bottom: 1px solid rgba(var(--v-theme-borderLight), 0.5);
  padding-bottom: 0.75rem;
  margin-bottom: 0.75rem;
}

.column-stats {
  padding: 0.5rem;
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 6px;
}

/* Container de Tarefas */
.tasks-container {
  max-height: 350px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.tasks-container::-webkit-scrollbar {
  width: 4px;
}

.tasks-container::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-borderLight), 0.3);
  border-radius: 2px;
}

.tasks-container::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.5);
  border-radius: 2px;
}

/* Cards de Tarefa */
.task-card {
  margin-bottom: 0.75rem;
  cursor: pointer;
}

.task-item {
  transition: all 0.3s ease;
  border-radius: 8px;
  position: relative;
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.task-item.priority-high {
  border-left: 3px solid rgb(var(--v-theme-error));
}

.task-item.priority-medium {
  border-left: 3px solid rgb(var(--v-theme-warning));
}

.task-item.priority-low {
  border-left: 3px solid rgb(var(--v-theme-success));
}

/* Ações Rápidas */
.quick-actions {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

/* Estado Vazio */
.empty-column {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  border: 2px dashed rgba(var(--v-theme-borderLight), 0.5);
  border-radius: 8px;
  background: rgba(var(--v-theme-containerBg), 0.2);
}

.empty-state {
  text-align: center;
  padding: 1rem;
}

/* Responsividade */
@media (max-width: 960px) {
  .kanban-columns {
    gap: 0.5rem;
  }
  
  .kanban-column {
    padding: 0.75rem;
    min-height: 300px;
  }
  
  .tasks-container {
    max-height: 250px;
  }
}
</style>