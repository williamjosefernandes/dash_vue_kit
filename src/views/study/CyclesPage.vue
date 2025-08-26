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
  return `${(hours || 0).toFixed(1)}h`;
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

const completeCycle = (cycleId: string) => {
  if (confirm('Tem certeza que deseja marcar este ciclo como concluído?')) {
    studyStore.updateStudyCycle(cycleId, { 
      status: 'completed',
      completedHours: studyStore.getCycleById(cycleId)?.totalHours || 0
    });
  }
};

const pauseCycle = (cycleId: string) => {
  studyStore.updateStudyCycle(cycleId, { status: 'planning' });
};

const getCyclesByStatus = (status: string) => {
  return studyStore.studyCycles.filter(cycle => cycle.status === status);
};

const getTasksCompletionRate = (cycle: any) => {
  if (cycle.tasks.length === 0) return 0;
  const completedTasks = cycle.tasks.filter((task: any) => task.status === 'done').length;
  return Math.round((completedTasks / cycle.tasks.length) * 100);
};

onMounted(() => {
  studyStore.loadFromLocalStorage();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  
  <!-- Header Explicativo -->
  <v-row class="mb-6">
    <v-col cols="12">
      <v-card color="primary" variant="tonal" class="explanation-card">
        <v-card-text class="pa-6">
          <div class="d-flex align-center mb-4">
            <v-avatar color="primary" size="48" class="me-4">
              <SvgSprite name="custom-refresh" style="width: 24px; height: 24px" />
            </v-avatar>
            <div>
              <h4 class="text-h4 mb-1">Ciclos de Estudo</h4>
              <p class="text-subtitle-1 mb-0">Organize seus estudos em sprints focados baseados nos seus planos</p>
            </div>
          </div>
          
          <div class="explanation-content">
            <v-row>
              <v-col cols="12" md="8">
                <p class="text-body-1 mb-3">
                  Os <strong>Ciclos de Estudo</strong> são períodos focados onde você executa partes específicas dos seus 
                  <strong>Planos de Estudo</strong>. Cada ciclo tem objetivos claros, prazo definido e tarefas organizadas 
                  em um quadro kanban para máxima produtividade.
                </p>
                
                <div class="features-list">
                  <div class="d-flex align-center mb-2">
                    <SvgSprite name="custom-check" style="width: 16px; height: 16px" class="me-2 text-success" />
                    <span class="text-body-2">Baseados nos seus Planos de Estudo existentes</span>
                  </div>
                  <div class="d-flex align-center mb-2">
                    <SvgSprite name="custom-target" style="width: 16px; height: 16px" class="me-2 text-success" />
                    <span class="text-body-2">Objetivos específicos e mensuráveis</span>
                  </div>
                  <div class="d-flex align-center mb-2">
                    <SvgSprite name="custom-window" style="width: 16px; height: 16px" class="me-2 text-success" />
                    <span class="text-body-2">Gestão visual com quadro kanban</span>
                  </div>
                  <div class="d-flex align-center">
                    <SvgSprite name="custom-clock" style="width: 16px; height: 16px" class="me-2 text-success" />
                    <span class="text-body-2">Controle de tempo e progresso em tempo real</span>
                  </div>
                </div>
              </v-col>
              
              <v-col cols="12" md="4">
                <div class="quick-stats">
                  <div class="stat-card">
                    <h3 class="text-h3 text-primary mb-1">{{ stats.totalCycles }}</h3>
                    <p class="text-caption mb-0">Ciclos Criados</p>
                  </div>
                  <div class="stat-card">
                    <h3 class="text-h3 text-success mb-1">{{ stats.activeCycles }}</h3>
                    <p class="text-caption mb-0">Ativos Agora</p>
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>
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
            <span>{{ activeCycle.name }}</span>
            <p class="text-caption text-lightText mb-0">Sprint Ativo • {{ getPlanName(activeCycle.planId) }}</p>
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
            Kanban Completo
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
              <div class="flex-grow-1">
                <h5 class="text-h5 mb-1">{{ activeCycle.name }}</h5>
                <p class="text-subtitle-2 text-lightText mb-2">{{ activeCycle.description }}</p>
                
                <!-- Objetivos do Sprint -->
                <div v-if="activeCycle.goals.length > 0" class="goals-preview">
                  <div class="d-flex align-center mb-1">
                    <SvgSprite name="custom-target" style="width: 14px; height: 14px" class="me-2" />
                    <span class="text-caption font-weight-medium">Objetivos:</span>
                  </div>
                  <div class="d-flex flex-wrap gap-1">
                    <v-chip
                      v-for="(goal, index) in activeCycle.goals.slice(0, 3)"
                      :key="index"
                      size="x-small"
                      :color="activeCycle.color"
                      variant="tonal"
                    >
                      {{ goal }}
                    </v-chip>
                    <v-chip
                      v-if="activeCycle.goals.length > 3"
                      size="x-small"
                      color="grey"
                      variant="tonal"
                    >
                      +{{ activeCycle.goals.length - 3 }}
                    </v-chip>
                  </div>
                </div>
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
              <div class="d-flex justify-space-between mt-1">
                <span class="text-caption">{{ formatHours(activeCycle.completedHours) }} concluídas</span>
                <span class="text-caption">{{ formatHours(activeCycle.totalHours) }} totais</span>
              </div>
            </div>
          </v-col>
          
          <v-col cols="12" md="4">
            <div class="sprint-stats">
              <div class="stat-item">
                <SvgSprite name="custom-calendar" style="width: 16px; height: 16px" class="me-2" />
                <span>{{ getDaysRemaining(activeCycle.endDate) }} dias restantes</span>
              </div>
              <div class="stat-item">
                <SvgSprite name="custom-list" style="width: 16px; height: 16px" class="me-2" />
                <span>{{ activeCycle.tasks.length }} tarefa(s) total</span>
              </div>
              <div class="stat-item">
                <SvgSprite name="custom-check" style="width: 16px; height: 16px" class="me-2" />
                <span>{{ getTasksCompletionRate(activeCycle) }}% das tarefas concluídas</span>
              </div>
              
              <!-- Ações do Sprint -->
              <div class="sprint-actions mt-3">
                <v-btn
                  color="success"
                  @click="completeCycle(activeCycle.id)"
                  prepend-icon="mdi-check-circle"
                  variant="tonal"
                  size="small"
                  block
                  class="mb-2"
                >
                  Finalizar Sprint
                </v-btn>
                <v-btn
                  color="warning"
                  @click="pauseCycle(activeCycle.id)"
                  prepend-icon="mdi-pause"
                  variant="outlined"
                  size="small"
                  block
                >
                  Pausar Sprint
                </v-btn>
              </div>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- Quadro Kanban Resumido -->
      <div class="kanban-board-summary">
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
                    <span>{{ formatHours(getColumnStats(column.status).totalHours) }} est.</span>
                    <span>{{ formatHours(getColumnStats(column.status).completedHours) }} real</span>
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
              
              <!-- Lista de Tarefas Resumida -->
              <div class="tasks-container-summary">
                <div
                  v-for="task in getTasksByStatus(column.status).slice(0, 3)"
                  :key="task.id"
                  class="task-card-summary"
                  @click="openTaskDialog(task)"
                >
                  <v-card 
                    variant="outlined" 
                    hover
                    class="task-item-summary"
                    :class="`priority-${task.priority}`"
                  >
                    <v-card-text class="pa-2">
                      <div class="d-flex align-center justify-space-between mb-1">
                        <v-chip
                          :color="getSubjectColor(task.subjectId)"
                          size="x-small"
                          variant="tonal"
                        >
                          {{ getSubjectName(task.subjectId).substring(0, 8) }}{{ getSubjectName(task.subjectId).length > 8 ? '...' : '' }}
                        </v-chip>
                        
                        <span class="text-caption">
                          {{ formatHours(task.estimatedHours) }}
                        </span>
                      </div>
                      
                      <h6 class="text-caption font-weight-medium mb-1">
                        {{ task.title.length > 25 ? task.title.substring(0, 25) + '...' : task.title }}
                      </h6>
                      
                      <div class="d-flex align-center justify-space-between">
                        <v-chip
                          :color="getPriorityColor(task.priority)"
                          size="x-small"
                          variant="tonal"
                        >
                          {{ task.priority === 'high' ? 'A' : task.priority === 'medium' ? 'M' : 'B' }}
                        </v-chip>
                        
                        <!-- Ação Rápida -->
                        <v-btn
                          v-if="task.status === 'todo'"
                          @click.stop="startTask(task.id)"
                          color="warning"
                          size="x-small"
                          variant="text"
                          icon
                        >
                          <SvgSprite name="custom-play" style="width: 10px; height: 10px" />
                        </v-btn>
                        
                        <v-btn
                          v-if="task.status === 'in-progress'"
                          @click.stop="completeTask(task.id)"
                          color="success"
                          size="x-small"
                          variant="text"
                          icon
                        >
                          <SvgSprite name="custom-check" style="width: 10px; height: 10px" />
                        </v-btn>
                        
                        <v-icon
                          v-if="task.status === 'done'"
                          color="success"
                          size="12"
                          icon="mdi-check-circle"
                        />
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
                
                <!-- Indicador de Mais Tarefas -->
                <div v-if="getTasksByStatus(column.status).length > 3" class="more-tasks">
                  <v-chip
                    :color="column.color"
                    size="small"
                    variant="outlined"
                    @click="$router.push(`/main/cycles/${activeCycle.id}`)"
                  >
                    +{{ getTasksByStatus(column.status).length - 3 }} mais
                  </v-chip>
                </div>
                
                <!-- Estado Vazio da Coluna -->
                <div v-if="getTasksByStatus(column.status).length === 0" class="empty-column-summary">
                  <div class="empty-state-summary">
                    <v-avatar :color="column.color" size="24" class="mb-1">
                      <SvgSprite :name="column.icon" style="width: 12px; height: 12px; opacity: 0.5" />
                    </v-avatar>
                    <p class="text-caption mb-0">Vazio</p>
                  </div>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </div>
    </UiParentCard>
  </div>

  <!-- Todos os Ciclos Organizados por Status -->
  <div class="cycles-by-status">
    <!-- Ciclos Ativos -->
    <div v-if="getCyclesByStatus('active').length > 0" class="mb-6">
      <UiParentCard>
        <template v-slot:title>
          <div class="d-flex align-center">
            <v-avatar color="success" size="32" class="me-3">
              <SvgSprite name="custom-play" style="width: 16px; height: 16px" />
            </v-avatar>
            <span>Ciclos Ativos</span>
          </div>
        </template>

        <v-row>
          <v-col 
            v-for="cycle in getCyclesByStatus('active')" 
            :key="cycle.id"
            cols="12" 
            md="6" 
            lg="4"
          >
            <v-card class="h-100 active-cycle-card" :color="cycle.color" variant="tonal">
              <v-card-text>
                <div class="d-flex align-center justify-space-between mb-3">
                  <v-chip 
                    color="success" 
                    size="small" 
                    variant="flat"
                    prepend-icon="mdi-play"
                  >
                    ATIVO
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
                          <SvgSprite name="custom-window" style="width: 16px; height: 16px" />
                        </template>
                        <v-list-item-title>Abrir Kanban</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="completeCycle(cycle.id)" class="text-success">
                        <template v-slot:prepend>
                          <SvgSprite name="custom-check" style="width: 16px; height: 16px" />
                        </template>
                        <v-list-item-title>Finalizar</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="pauseCycle(cycle.id)" class="text-warning">
                        <template v-slot:prepend>
                          <SvgSprite name="custom-pause" style="width: 16px; height: 16px" />
                        </template>
                        <v-list-item-title>Pausar</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </div>
                
                <div class="d-flex align-center mb-3">
                  <v-avatar :color="cycle.color" size="40" class="me-3">
                    <SvgSprite name="custom-refresh" style="width: 20px; height: 20px" />
                  </v-avatar>
                  <div>
                    <h6 class="text-h6 mb-1">{{ cycle.name }}</h6>
                    <p class="text-caption text-lightText mb-0">{{ getPlanName(cycle.planId) }}</p>
                  </div>
                </div>
                
                <!-- Progresso Visual -->
                <div class="mb-3">
                  <div class="d-flex justify-space-between mb-1">
                    <span class="text-caption">Progresso</span>
                    <span class="text-caption font-weight-bold">{{ Math.round(getCycleProgress(cycle)) }}%</span>
                  </div>
                  <v-progress-linear
                    :model-value="getCycleProgress(cycle)"
                    :color="cycle.color"
                    height="6"
                    rounded
                  />
                </div>
                
                <!-- Estatísticas Rápidas -->
                <div class="cycle-quick-stats">
                  <div class="d-flex justify-space-between mb-2">
                    <div class="text-center">
                      <h6 class="text-h6 mb-0">{{ cycle.tasks.filter(t => t.status === 'done').length }}</h6>
                      <p class="text-caption mb-0">Concluídas</p>
                    </div>
                    <div class="text-center">
                      <h6 class="text-h6 mb-0">{{ cycle.tasks.filter(t => t.status === 'in-progress').length }}</h6>
                      <p class="text-caption mb-0">Em Progresso</p>
                    </div>
                    <div class="text-center">
                      <h6 class="text-h6 mb-0">{{ cycle.tasks.filter(t => t.status === 'todo').length }}</h6>
                      <p class="text-caption mb-0">A Fazer</p>
                    </div>
                  </div>
                </div>
                
                <!-- Informações Adicionais -->
                <div class="cycle-info">
                  <div class="d-flex align-center mb-1">
                    <SvgSprite name="custom-clock" style="width: 12px; height: 12px" class="me-2" />
                    <span class="text-caption">{{ formatHours(cycle.completedHours) }} / {{ formatHours(cycle.totalHours) }}</span>
                  </div>
                  <div class="d-flex align-center">
                    <SvgSprite name="custom-calendar" style="width: 12px; height: 12px" class="me-2" />
                    <span class="text-caption">
                      {{ new Date(cycle.startDate).toLocaleDateString() }} - 
                      {{ new Date(cycle.endDate).toLocaleDateString() }}
                    </span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </UiParentCard>
    </div>

    <!-- Outros Ciclos -->
    <UiParentCard title="Todos os Ciclos de Estudo">
      <template v-slot:action>
        <div class="d-flex gap-2">
          <v-btn color="primary" prepend-icon="mdi-plus">
            <router-link to="/main/cycles/new" class="text-decoration-none text-white">
              Novo Ciclo
            </router-link>
          </v-btn>
          <v-btn 
            v-if="studyStore.studyPlans.length === 0"
            color="secondary" 
            variant="outlined"
            prepend-icon="mdi-calendar"
          >
            <router-link to="/main/plans/new" class="text-decoration-none">
              Criar Plano Primeiro
            </router-link>
          </v-btn>
        </div>
      </template>

      <!-- Filtros por Status -->
      <div class="status-filters mb-4">
        <v-chip-group>
          <v-chip 
            v-for="status in ['planning', 'active', 'completed', 'cancelled']"
            :key="status"
            :color="getStatusColor(status)"
            variant="tonal"
            size="small"
          >
            {{ getStatusText(status) }} ({{ getCyclesByStatus(status).length }})
          </v-chip>
        </v-chip-group>
      </div>

      <v-row v-if="studyStore.studyCycles.length > 0">
        <v-col 
          v-for="cycle in studyStore.studyCycles" 
          :key="cycle.id"
          cols="12" 
          md="6" 
          lg="4"
        >
          <v-card 
            class="h-100 cycle-card" 
            :class="{ 
              'active-border': cycle.status === 'active',
              'completed-card': cycle.status === 'completed'
            }"
            variant="outlined"
          >
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
                        <SvgSprite name="custom-window" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Ver Kanban</v-list-item-title>
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
                    <v-list-item 
                      v-if="cycle.status === 'active'"
                      @click="completeCycle(cycle.id)"
                      class="text-success"
                    >
                      <template v-slot:prepend>
                        <SvgSprite name="custom-check" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Finalizar</v-list-item-title>
                    </v-list-item>
                    <v-divider />
                    <v-list-item @click="deleteCycle(cycle.id)" class="text-error">
                      <template v-slot:prepend>
                        <SvgSprite name="custom-trash" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Excluir</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
              
              <div class="d-flex align-center mb-3">
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
              
              <!-- Objetivos Preview -->
              <div v-if="cycle.goals.length > 0">
                <p class="text-caption mb-1 font-weight-medium">Objetivos:</p>
                <div class="d-flex flex-wrap gap-1">
                  <v-chip 
                    v-for="(goal, index) in cycle.goals.slice(0, 2)" 
                    :key="index"
                    size="x-small" 
                    variant="tonal"
                    :color="cycle.color"
                  >
                    {{ goal.length > 15 ? goal.substring(0, 15) + '...' : goal }}
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
    </UiParentCard>
  </div>

  <!-- Outros Ciclos (Planejamento, Concluídos, etc.) -->
  <UiParentCard title="Histórico de Ciclos">
    <v-row v-if="studyStore.studyCycles.filter(c => c.status !== 'active').length > 0">
      <v-col 
        v-for="cycle in studyStore.studyCycles.filter(c => c.status !== 'active')" 
        :key="cycle.id"
        cols="12" 
        md="6" 
        lg="4"
      >
        <v-card class="h-100 cycle-card" variant="outlined">
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
                    <v-list-item-title>Visualizar</v-list-item-title>
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
                  <v-divider />
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
              
              <div v-if="cycle.status === 'planning'" class="d-flex align-center">
                <SvgSprite name="custom-clock" style="width: 12px; height: 12px" class="me-2" />
                <span class="text-caption">Aguardando ativação</span>
              </div>
            </div>
            
            <!-- Objetivos -->
            <div v-if="cycle.goals.length > 0">
              <p class="text-caption mb-1 font-weight-medium">Objetivos:</p>
              <div class="d-flex flex-wrap gap-1">
                <v-chip 
                  v-for="(goal, index) in cycle.goals.slice(0, 2)" 
                  :key="index"
                  size="x-small" 
                  variant="tonal"
                  :color="cycle.color"
                >
                  {{ goal.length > 12 ? goal.substring(0, 12) + '...' : goal }}
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
      <div class="empty-state-container">
        <v-avatar color="grey-lighten-2" size="80" class="mb-4">
          <SvgSprite name="custom-refresh" style="width: 40px; height: 40px; opacity: 0.5" />
        </v-avatar>
        <h5 class="text-h5 mb-2">Nenhum ciclo de estudo criado</h5>
        <p class="text-subtitle-1 text-lightText mb-6">
          Ciclos são períodos focados para executar partes dos seus planos de estudo.<br>
          Organize seus estudos em sprints com objetivos claros e prazos definidos.
        </p>
        
        <div v-if="studyStore.studyPlans.length === 0" class="no-plans-warning">
          <v-alert type="info" variant="tonal" class="mb-4">
            <div class="d-flex align-center">
              <SvgSprite name="custom-info" style="width: 20px; height: 20px" class="me-2" />
              <div>
                <strong>Primeiro, crie um Plano de Estudo!</strong><br>
                Os ciclos são baseados nos planos existentes. Você precisa ter pelo menos um plano criado.
              </div>
            </div>
          </v-alert>
          
          <div class="d-flex gap-3 justify-center">
            <v-btn color="primary" prepend-icon="mdi-calendar" size="large">
              <router-link to="/main/plans/new" class="text-decoration-none text-white">
                Criar Plano de Estudo
              </router-link>
            </v-btn>
            <v-btn color="secondary" variant="outlined" prepend-icon="mdi-help-circle">
              <router-link to="/main/plans" class="text-decoration-none">
                Ver Planos Existentes
              </router-link>
            </v-btn>
          </div>
        </div>
        
        <div v-else>
          <v-btn color="primary" prepend-icon="mdi-plus" size="large">
            <router-link to="/main/cycles/new" class="text-decoration-none text-white">
              Criar Primeiro Ciclo
            </router-link>
          </v-btn>
        </div>
      </div>
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
/* Header Explicativo */
.explanation-card {
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1), rgba(var(--v-theme-primary), 0.05));
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.explanation-content {
  margin-top: 1rem;
}

.features-list {
  background: rgba(var(--v-theme-surface), 0.8);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

.quick-stats {
  display: flex;
  gap: 1rem;
}

.stat-card {
  text-align: center;
  padding: 1rem;
  background: rgba(var(--v-theme-surface), 0.8);
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
  flex: 1;
}

/* Sprint Header */
.sprint-header {
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

.goals-preview {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(var(--v-theme-surface), 0.6);
  border-radius: 8px;
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

.sprint-actions {
  padding-top: 0.75rem;
  border-top: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

/* Kanban Board Resumido */
.kanban-board-summary {
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
  min-height: 300px;
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

/* Container de Tarefas Resumido */
.tasks-container-summary {
  max-height: 200px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.tasks-container-summary::-webkit-scrollbar {
  width: 3px;
}

.tasks-container-summary::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-borderLight), 0.3);
  border-radius: 2px;
}

.tasks-container-summary::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.5);
  border-radius: 2px;
}

/* Cards de Tarefa Resumidos */
.task-card-summary {
  margin-bottom: 0.5rem;
  cursor: pointer;
}

.task-item-summary {
  transition: all 0.3s ease;
  border-radius: 6px;
  position: relative;
}

.task-item-summary:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-item-summary.priority-high {
  border-left: 2px solid rgb(var(--v-theme-error));
}

.task-item-summary.priority-medium {
  border-left: 2px solid rgb(var(--v-theme-warning));
}

.task-item-summary.priority-low {
  border-left: 2px solid rgb(var(--v-theme-success));
}

.more-tasks {
  text-align: center;
  margin-top: 0.5rem;
}

/* Estados Vazios */
.empty-column-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  border: 1px dashed rgba(var(--v-theme-borderLight), 0.5);
  border-radius: 6px;
  background: rgba(var(--v-theme-containerBg), 0.2);
}

.empty-state-summary {
  text-align: center;
  padding: 0.5rem;
}

/* Cards de Ciclo */
.cycle-card {
  transition: all 0.3s ease;
  border-radius: 12px;
}

.cycle-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.active-cycle-card {
  border: 2px solid rgba(var(--v-theme-success), 0.3);
  box-shadow: 0 4px 16px rgba(var(--v-theme-success), 0.1);
}

.active-border {
  border: 2px solid rgba(var(--v-theme-success), 0.5) !important;
}

.completed-card {
  opacity: 0.8;
}

.cycle-quick-stats {
  background: rgba(var(--v-theme-containerBg), 0.3);
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

.cycle-info {
  background: rgba(var(--v-theme-surface), 0.5);
  padding: 0.5rem;
  border-radius: 6px;
}

/* Filtros de Status */
.status-filters {
  background: rgba(var(--v-theme-containerBg), 0.3);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

/* Estado Vazio Melhorado */
.empty-state-container {
  max-width: 600px;
  margin: 0 auto;
}

.no-plans-warning {
  background: rgba(var(--v-theme-info), 0.05);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-info), 0.2);
}

/* Responsividade */
@media (max-width: 960px) {
  .kanban-columns {
    gap: 0.5rem;
  }
  
  .kanban-column {
    padding: 0.75rem;
    min-height: 250px;
  }
  
  .tasks-container-summary {
    max-height: 150px;
  }
  
  .quick-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .explanation-content .features-list {
    margin-top: 1rem;
  }
}

@media (max-width: 600px) {
  .sprint-header {
    padding: 1rem;
  }
  
  .explanation-card .v-card-text {
    padding: 1rem !important;
  }
  
  .cycle-quick-stats {
    padding: 0.5rem;
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

.task-card-summary {
  animation: slideIn 0.3s ease-out;
}

.cycle-card {
  animation: slideIn 0.4s ease-out;
}

/* Melhorias visuais */
.v-chip {
  transition: all 0.3s ease;
}

.v-chip:hover {
  transform: translateY(-1px);
}

.v-progress-linear {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>