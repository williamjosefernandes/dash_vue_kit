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

const page = ref({ title: 'Detalhes do Ciclo' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Ciclos', disabled: false, href: '/main/cycles' },
  { title: 'Detalhes', disabled: true, href: '#' }
]);

const taskDialog = ref(false);
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
  { title: 'A Fazer', status: 'todo', color: 'grey' },
  { title: 'Em Progresso', status: 'in-progress', color: 'warning' },
  { title: 'Revisão', status: 'review', color: 'info' },
  { title: 'Concluído', status: 'done', color: 'success' }
];

const getTasksByStatus = (status: string) => {
  return cycle.value?.tasks.filter(task => task.status === status) || [];
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

const moveTask = (taskId: string, newStatus: CycleTask['status']) => {
  if (cycle.value) {
    studyStore.moveCycleTask(cycle.value.id, taskId, newStatus);
  }
};

const openTaskDialog = (task: CycleTask) => {
  currentTask.value = { ...task };
  taskDialog.value = true;
};

const saveTask = () => {
  if (cycle.value) {
    studyStore.updateCycleTask(cycle.value.id, currentTask.value.id, currentTask.value);
    taskDialog.value = false;
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
  }
};

onMounted(() => {
  studyStore.loadFromLocalStorage();
  
  if (!cycle.value) {
    router.push('/main/cycles');
  } else {
    page.value.title = cycle.value.name;
    breadcrumbs.value[2].title = cycle.value.name;
  }
});
</script>

<template>
  <div v-if="cycle">
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
    
    <!-- Header do Ciclo -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card :color="cycle.color" variant="tonal">
          <v-card-text class="pa-6">
            <div class="d-flex align-center justify-space-between mb-4">
              <div class="d-flex align-center">
                <v-avatar :color="cycle.color" size="64" class="me-4">
                  <SvgSprite name="custom-refresh" style="width: 32px; height: 32px" />
                </v-avatar>
                <div>
                  <h3 class="text-h3 mb-1">{{ cycle.name }}</h3>
                  <v-chip :color="cycle.color" variant="flat" class="mb-2">
                    {{ cycle.status === 'active' ? 'Ativo' : 
                       cycle.status === 'completed' ? 'Concluído' : 
                       cycle.status === 'planning' ? 'Planejamento' : 'Cancelado' }}
                  </v-chip>
                  <p class="text-subtitle-1 mb-0">{{ cycle.description }}</p>
                </div>
              </div>
              
              <div class="text-end">
                <v-btn
                  v-if="cycle.status === 'active'"
                  color="success"
                  @click="completeCycle"
                  prepend-icon="mdi-check"
                  class="mb-2"
                >
                  Concluir Ciclo
                </v-btn>
                <div class="text-caption">
                  <div class="mb-1">
                    <SvgSprite name="custom-calendar" style="width: 12px; height: 12px" class="me-1" />
                    {{ getDaysRemaining() }} dias restantes
                  </div>
                  <div>
                    <SvgSprite name="custom-clock" style="width: 12px; height: 12px" class="me-1" />
                    {{ formatHours(cycle.completedHours) }} / {{ formatHours(cycle.totalHours) }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Progresso -->
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-2">
                <span class="text-subtitle-2">Progresso Geral</span>
                <span class="text-subtitle-2">{{ Math.round(getCycleProgress()) }}%</span>
              </div>
              <v-progress-linear
                :model-value="getCycleProgress()"
                :color="cycle.color"
                height="8"
                rounded
              />
            </div>
            
            <!-- Objetivos -->
            <div v-if="cycle.goals.length > 0">
              <h6 class="text-h6 mb-2">Objetivos do Ciclo:</h6>
              <div class="d-flex flex-wrap gap-2">
                <v-chip
                  v-for="(goal, index) in cycle.goals"
                  :key="index"
                  :color="cycle.color"
                  variant="outlined"
                  size="small"
                >
                  {{ goal }}
                </v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Kanban Board -->
    <UiParentCard title="Quadro Kanban - Tarefas do Ciclo">
      <v-row>
        <v-col
          v-for="column in columns"
          :key="column.status"
          cols="12"
          sm="6"
          lg="3"
        >
          <div class="kanban-column">
            <div class="column-header mb-4">
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-avatar :color="column.color" size="24" class="me-2">
                    <span class="text-caption font-weight-bold">
                      {{ getTasksByStatus(column.status).length }}
                    </span>
                  </v-avatar>
                  <h6 class="text-h6 mb-0">{{ column.title }}</h6>
                </div>
              </div>
            </div>
            
            <div class="tasks-container" style="min-height: 400px;">
              <v-card
                v-for="task in getTasksByStatus(column.status)"
                :key="task.id"
                class="task-card mb-3"
                variant="outlined"
                hover
                @click="openTaskDialog(task)"
              >
                <v-card-text class="pa-4">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <v-chip
                      :color="getSubjectColor(task.subjectId)"
                      size="x-small"
                      variant="tonal"
                    >
                      {{ getSubjectName(task.subjectId) }}
                    </v-chip>
                    
                    <v-chip
                      :color="getPriorityColor(task.priority)"
                      size="x-small"
                      variant="tonal"
                    >
                      {{ getPriorityText(task.priority) }}
                    </v-chip>
                  </div>
                  
                  <h6 class="text-subtitle-2 mb-2">{{ task.title }}</h6>
                  
                  <p v-if="task.description" class="text-caption text-lightText mb-2">
                    {{ task.description }}
                  </p>
                  
                  <div class="d-flex align-center justify-space-between">
                    <span class="text-caption">
                      <SvgSprite name="custom-clock" style="width: 12px; height: 12px" class="me-1" />
                      {{ formatHours(task.estimatedHours) }}
                    </span>
                    
                    <div class="task-actions">
                      <v-menu>
                        <template v-slot:activator="{ props }">
                          <v-btn
                            icon
                            size="x-small"
                            variant="text"
                            v-bind="props"
                            @click.stop
                          >
                            <SvgSprite name="custom-more" style="width: 12px; height: 12px" />
                          </v-btn>
                        </template>
                        <v-list>
                          <v-list-item
                            v-for="col in columns.filter(c => c.status !== task.status)"
                            :key="col.status"
                            @click="moveTask(task.id, col.status as CycleTask['status'])"
                          >
                            <template v-slot:prepend>
                              <v-avatar :color="col.color" size="16" class="me-2" />
                            </template>
                            <v-list-item-title>Mover para {{ col.title }}</v-list-item-title>
                          </v-list-item>
                          <v-divider />
                          <v-list-item @click="deleteTask(task.id)" class="text-error">
                            <template v-slot:prepend>
                              <SvgSprite name="custom-trash" style="width: 14px; height: 14px" />
                            </template>
                            <v-list-item-title>Excluir</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
              
              <div v-if="getTasksByStatus(column.status).length === 0" class="empty-column">
                <div class="text-center py-8">
                  <SvgSprite name="custom-list" style="width: 32px; height: 32px; opacity: 0.3" />
                  <p class="text-caption text-lightText mt-2 mb-0">Nenhuma tarefa</p>
                </div>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </UiParentCard>

    <!-- Dialog para Editar Tarefa -->
    <v-dialog v-model="taskDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>Editar Tarefa</v-card-title>
        
        <v-card-text>
          <v-form>
            <v-text-field
              v-model="currentTask.title"
              label="Título da Tarefa"
              variant="outlined"
              class="mb-4"
              readonly
            />
            
            <v-textarea
              v-model="currentTask.description"
              label="Descrição"
              variant="outlined"
              rows="3"
              class="mb-4"
              readonly
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
                  label="Horas Reais"
                  type="number"
                  variant="outlined"
                  min="0"
                  step="0.5"
                />
              </v-col>
            </v-row>
            
            <v-textarea
              v-model="currentTask.notes"
              label="Anotações"
              variant="outlined"
              rows="3"
              placeholder="Adicione suas anotações sobre esta tarefa..."
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
.kanban-column {
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 12px;
  padding: 1rem;
  min-height: 500px;
}

.column-header {
  border-bottom: 2px solid rgba(var(--v-theme-borderLight), 0.5);
  padding-bottom: 0.75rem;
}

.task-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tasks-container {
  max-height: 600px;
  overflow-y: auto;
}

.empty-column {
  border: 2px dashed rgba(var(--v-theme-borderLight), 0.5);
  border-radius: 8px;
  background: rgba(var(--v-theme-surface), 0.5);
}

.task-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.task-card:hover .task-actions {
  opacity: 1;
}
</style>