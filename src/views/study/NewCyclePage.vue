<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';
import type { CycleTask } from '@/types/study';

const router = useRouter();
const studyStore = useStudyStore();

const page = ref({ title: 'Novo Ciclo de Estudo' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Ciclos', disabled: false, href: '/main/cycles' },
  { title: 'Novo Ciclo', disabled: true, href: '#' }
]);

const form = ref();
const valid = ref(false);
const loading = ref(false);

const cycleData = ref({
  name: '',
  description: '',
  planId: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 semanas
  status: 'planning' as 'planning' | 'active' | 'completed' | 'cancelled',
  goals: [] as string[],
  tasks: [] as CycleTask[],
  totalHours: 0,
  completedHours: 0,
  color: 'primary'
});

const newGoal = ref('');
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
  order: 0
});

const colors = [
  { name: 'Azul', value: 'primary', color: '#4680FF' },
  { name: 'Verde', value: 'success', color: '#2ca87f' },
  { name: 'Laranja', value: 'warning', color: '#e58a00' },
  { name: 'Vermelho', value: 'error', color: '#dc2626' },
  { name: 'Roxo', value: 'secondary', color: '#5B6B79' },
  { name: 'Ciano', value: 'info', color: '#3ec9d6' }
];

const statusOptions = [
  { title: 'Planejamento', value: 'planning', description: 'Ciclo em preparação' },
  { title: 'Ativo', value: 'active', description: 'Ciclo em execução' }
];

const priorityOptions = [
  { title: 'Baixa', value: 'low', color: 'success' },
  { title: 'Média', value: 'medium', color: 'warning' },
  { title: 'Alta', value: 'high', color: 'error' }
];

const rules = {
  required: (v: string) => !!v || 'Campo obrigatório',
  minHours: (v: number) => v > 0 || 'Deve ser maior que zero',
  dateRange: () => {
    return new Date(cycleData.value.endDate) > new Date(cycleData.value.startDate) || 
           'Data final deve ser posterior à inicial';
  }
};

const cycleDuration = computed(() => {
  const start = new Date(cycleData.value.startDate);
  const end = new Date(cycleData.value.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

const totalEstimatedHours = computed(() => {
  return cycleData.value.tasks.reduce((total, task) => total + task.estimatedHours, 0);
});

const selectedPlan = computed(() => {
  return studyStore.studyPlans.find(plan => plan.id === cycleData.value.planId);
});

const planSubjects = computed(() => {
  if (!selectedPlan.value) return [];
  return studyStore.subjects.filter(subject => 
    selectedPlan.value!.subjects.includes(subject.id)
  );
});

const addGoal = () => {
  if (newGoal.value.trim()) {
    cycleData.value.goals.push(newGoal.value.trim());
    newGoal.value = '';
  }
};

const removeGoal = (index: number) => {
  cycleData.value.goals.splice(index, 1);
};

const openTaskDialog = (task?: CycleTask) => {
  if (task) {
    currentTask.value = { ...task };
  } else {
    currentTask.value = {
      id: '',
      subjectId: '',
      title: '',
      description: '',
      estimatedHours: 1,
      actualHours: 0,
      status: 'todo',
      priority: 'medium',
      order: cycleData.value.tasks.length
    };
  }
  taskDialog.value = true;
};

const saveTask = () => {
  if (currentTask.value.id) {
    // Editar tarefa existente
    const index = cycleData.value.tasks.findIndex(t => t.id === currentTask.value.id);
    if (index !== -1) {
      cycleData.value.tasks[index] = { ...currentTask.value };
    }
  } else {
    // Adicionar nova tarefa
    const newTask: CycleTask = {
      ...currentTask.value,
      id: Date.now().toString(),
      cycleId: ''
    };
    cycleData.value.tasks.push(newTask);
  }
  
  updateTotalHours();
  taskDialog.value = false;
};

const deleteTask = (taskId: string) => {
  if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
    cycleData.value.tasks = cycleData.value.tasks.filter(t => t.id !== taskId);
    updateTotalHours();
  }
};

const updateTotalHours = () => {
  cycleData.value.totalHours = totalEstimatedHours.value;
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

const saveCycle = async () => {
  if (!form.value.validate()) return;
  
  loading.value = true;
  
  try {
    const newCycle = {
      ...cycleData.value,
      startDate: new Date(cycleData.value.startDate),
      endDate: new Date(cycleData.value.endDate)
    };
    
    studyStore.addStudyCycle(newCycle);
    
    // Simular delay para melhor UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    router.push('/main/cycles');
  } catch (error) {
    console.error('Erro ao salvar ciclo:', error);
  } finally {
    loading.value = false;
  }
};

const cancel = () => {
  router.push('/main/cycles');
};

onMounted(() => {
  studyStore.loadFromLocalStorage();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  
  <v-form ref="form" v-model="valid" @submit.prevent="saveCycle">
    <v-row>
      <!-- Formulário Principal -->
      <v-col cols="12" lg="8">
        <!-- Informações Básicas -->
        <UiParentCard title="Informações do Ciclo">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="cycleData.name"
                label="Nome do Ciclo *"
                :rules="[rules.required]"
                variant="outlined"
                placeholder="Ex: Sprint de Matemática - Janeiro 2024"
                prepend-inner-icon="mdi-refresh"
              />
            </v-col>
            
            <v-col cols="12">
              <v-textarea
                v-model="cycleData.description"
                label="Descrição"
                variant="outlined"
                rows="3"
                placeholder="Descreva os objetivos e foco deste ciclo de estudo..."
                prepend-inner-icon="mdi-text"
              />
            </v-col>
            
            <v-col cols="12">
              <v-select
                v-model="cycleData.planId"
                :items="studyStore.studyPlans"
                item-title="name"
                item-value="id"
                label="Plano de Estudo Base *"
                :rules="[rules.required]"
                variant="outlined"
                prepend-inner-icon="mdi-calendar"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <v-avatar :color="item.raw.color" size="32">
                        <SvgSprite name="custom-calendar" style="width: 16px; height: 16px" />
                      </v-avatar>
                    </template>
                    <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.raw.description }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>
            
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="cycleData.startDate"
                label="Data de Início *"
                type="date"
                :rules="[rules.required]"
                variant="outlined"
                prepend-inner-icon="mdi-calendar-start"
              />
            </v-col>
            
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="cycleData.endDate"
                label="Data de Término *"
                type="date"
                :rules="[rules.required, rules.dateRange]"
                variant="outlined"
                prepend-inner-icon="mdi-calendar-end"
              />
            </v-col>
          </v-row>
        </UiParentCard>

        <!-- Objetivos do Ciclo -->
        <UiParentCard title="Objetivos do Ciclo" class="mt-6">
          <div class="mb-4">
            <v-text-field
              v-model="newGoal"
              label="Adicionar Objetivo"
              variant="outlined"
              placeholder="Ex: Dominar equações de segundo grau"
              @keyup.enter="addGoal"
            >
              <template v-slot:append-inner>
                <v-btn
                  icon
                  size="small"
                  color="primary"
                  @click="addGoal"
                  :disabled="!newGoal.trim()"
                >
                  <SvgSprite name="custom-plus" style="width: 16px; height: 16px" />
                </v-btn>
              </template>
            </v-text-field>
          </div>
          
          <div v-if="cycleData.goals.length > 0">
            <v-chip
              v-for="(goal, index) in cycleData.goals"
              :key="index"
              :color="cycleData.color"
              variant="tonal"
              closable
              @click:close="removeGoal(index)"
              class="ma-1"
            >
              {{ goal }}
            </v-chip>
          </div>
          
          <div v-else class="text-center py-6">
            <SvgSprite name="custom-target" style="width: 48px; height: 48px; opacity: 0.3" />
            <p class="text-subtitle-1 mt-3 mb-0">Nenhum objetivo definido</p>
            <p class="text-caption text-lightText">Adicione objetivos claros para este ciclo</p>
          </div>
        </UiParentCard>

        <!-- Tarefas do Ciclo -->
        <UiParentCard title="Tarefas do Ciclo" class="mt-6">
          <template v-slot:action>
            <v-btn
              color="primary"
              @click="openTaskDialog()"
              prepend-icon="mdi-plus"
              :disabled="!cycleData.planId"
            >
              Nova Tarefa
            </v-btn>
          </template>

          <div v-if="!cycleData.planId" class="text-center py-8">
            <SvgSprite name="custom-info" style="width: 48px; height: 48px; opacity: 0.3" />
            <p class="text-subtitle-1 mt-3 mb-0">Selecione um plano primeiro</p>
            <p class="text-caption text-lightText">Escolha um plano de estudo para adicionar tarefas</p>
          </div>

          <div v-else-if="cycleData.tasks.length > 0">
            <v-row>
              <v-col
                v-for="task in cycleData.tasks"
                :key="task.id"
                cols="12"
                sm="6"
                md="4"
              >
                <v-card variant="outlined" class="h-100">
                  <v-card-text>
                    <div class="d-flex align-center justify-space-between mb-2">
                      <v-chip
                        :color="getSubjectColor(task.subjectId)"
                        size="small"
                        variant="tonal"
                      >
                        {{ getSubjectName(task.subjectId) }}
                      </v-chip>
                      
                      <v-menu>
                        <template v-slot:activator="{ props }">
                          <v-btn icon size="small" variant="text" v-bind="props">
                            <SvgSprite name="custom-more" style="width: 16px; height: 16px" />
                          </v-btn>
                        </template>
                        <v-list>
                          <v-list-item @click="openTaskDialog(task)">
                            <template v-slot:prepend>
                              <SvgSprite name="custom-edit" style="width: 16px; height: 16px" />
                            </template>
                            <v-list-item-title>Editar</v-list-item-title>
                          </v-list-item>
                          <v-list-item @click="deleteTask(task.id)" class="text-error">
                            <template v-slot:prepend>
                              <SvgSprite name="custom-trash" style="width: 16px; height: 16px" />
                            </template>
                            <v-list-item-title>Excluir</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </div>
                    
                    <h6 class="text-h6 mb-2">{{ task.title }}</h6>
                    <p v-if="task.description" class="text-caption text-lightText mb-3">
                      {{ task.description }}
                    </p>
                    
                    <div class="d-flex align-center justify-space-between">
                      <v-chip
                        :color="getPriorityColor(task.priority)"
                        size="x-small"
                        variant="tonal"
                      >
                        {{ task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa' }}
                      </v-chip>
                      
                      <span class="text-caption">{{ task.estimatedHours }}h</span>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>
          
          <div v-else class="text-center py-8">
            <SvgSprite name="custom-list" style="width: 48px; height: 48px; opacity: 0.3" />
            <p class="text-subtitle-1 mt-3 mb-0">Nenhuma tarefa adicionada</p>
            <p class="text-caption text-lightText mb-4">Adicione tarefas para organizar este ciclo</p>
            <v-btn
              color="primary"
              @click="openTaskDialog()"
              prepend-icon="mdi-plus"
            >
              Adicionar Primeira Tarefa
            </v-btn>
          </div>
        </UiParentCard>
      </v-col>

      <!-- Sidebar -->
      <v-col cols="12" lg="4">
        <!-- Configurações -->
        <UiParentCard title="Configurações">
          <div class="mb-4">
            <v-label class="mb-2">Status do Ciclo</v-label>
            <v-radio-group v-model="cycleData.status" hide-details>
              <v-radio
                v-for="status in statusOptions"
                :key="status.value"
                :value="status.value"
                :label="status.title"
                color="primary"
              >
                <template v-slot:label>
                  <div>
                    <div class="font-weight-medium">{{ status.title }}</div>
                    <div class="text-caption text-lightText">{{ status.description }}</div>
                  </div>
                </template>
              </v-radio>
            </v-radio-group>
          </div>
          
          <v-divider class="my-4" />
          
          <div>
            <v-label class="mb-2">Cor do Ciclo</v-label>
            <v-chip-group v-model="cycleData.color" mandatory>
              <v-chip
                v-for="color in colors"
                :key="color.value"
                :value="color.value"
                :color="color.value"
                variant="tonal"
                class="ma-1"
              >
                <v-avatar :color="color.value" size="16" class="me-2"></v-avatar>
                {{ color.name }}
              </v-chip>
            </v-chip-group>
          </div>
        </UiParentCard>

        <!-- Preview -->
        <UiParentCard title="Preview do Ciclo" class="mt-6">
          <v-card variant="outlined" :color="cycleData.color" class="pa-4">
            <div class="d-flex align-center mb-3">
              <v-avatar :color="cycleData.color" size="40" class="me-3">
                <SvgSprite name="custom-refresh" style="width: 20px; height: 20px" />
              </v-avatar>
              <div>
                <h6 class="text-h6 mb-0">{{ cycleData.name || 'Nome do Ciclo' }}</h6>
                <v-chip size="small" :color="cycleData.color" variant="tonal">
                  {{ statusOptions.find(s => s.value === cycleData.status)?.title }}
                </v-chip>
              </div>
            </div>
            
            <p class="text-caption text-lightText mb-3">
              {{ cycleData.description || 'Descrição do ciclo...' }}
            </p>
            
            <div class="text-caption">
              <div class="d-flex align-center mb-1">
                <SvgSprite name="custom-calendar" style="width: 12px; height: 12px" class="me-2" />
                {{ cycleDuration }} dias de duração
              </div>
              <div class="d-flex align-center mb-1">
                <SvgSprite name="custom-clock" style="width: 12px; height: 12px" class="me-2" />
                {{ totalEstimatedHours }}h estimadas
              </div>
              <div class="d-flex align-center mb-1">
                <SvgSprite name="custom-target" style="width: 12px; height: 12px" class="me-2" />
                {{ cycleData.goals.length }} objetivo(s)
              </div>
              <div class="d-flex align-center">
                <SvgSprite name="custom-list" style="width: 12px; height: 12px" class="me-2" />
                {{ cycleData.tasks.length }} tarefa(s)
              </div>
            </div>
          </v-card>
        </UiParentCard>

        <!-- Estatísticas -->
        <UiParentCard title="Estatísticas" class="mt-6">
          <v-row>
            <v-col cols="6">
              <div class="text-center">
                <h3 class="text-h3 text-primary mb-1">{{ cycleData.goals.length }}</h3>
                <p class="text-caption mb-0">Objetivos</p>
              </div>
            </v-col>
            <v-col cols="6">
              <div class="text-center">
                <h3 class="text-h3 text-success mb-1">{{ cycleData.tasks.length }}</h3>
                <p class="text-caption mb-0">Tarefas</p>
              </div>
            </v-col>
          </v-row>
          
          <v-divider class="my-4" />
          
          <div class="text-center">
            <h2 class="text-h2 text-warning mb-2">{{ totalEstimatedHours }}h</h2>
            <p class="text-subtitle-2 text-lightText mb-0">Total Estimado</p>
          </div>
        </UiParentCard>
      </v-col>
    </v-row>

    <!-- Ações -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card variant="outlined" class="pa-4">
          <div class="d-flex justify-end gap-3">
            <v-btn
              @click="cancel"
              variant="outlined"
              :disabled="loading"
            >
              Cancelar
            </v-btn>
            
            <v-btn
              type="submit"
              color="primary"
              :loading="loading"
              :disabled="!valid"
              prepend-icon="mdi-content-save"
            >
              Criar Ciclo
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-form>

  <!-- Dialog para Tarefa -->
  <v-dialog v-model="taskDialog" max-width="600px" persistent>
    <v-card>
      <v-card-title>
        {{ currentTask.id ? 'Editar Tarefa' : 'Nova Tarefa' }}
      </v-card-title>
      
      <v-card-text>
        <v-form>
          <v-select
            v-model="currentTask.subjectId"
            :items="planSubjects"
            item-title="name"
            item-value="id"
            label="Disciplina *"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-4"
          />
          
          <v-text-field
            v-model="currentTask.title"
            label="Título da Tarefa *"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-4"
          />
          
          <v-textarea
            v-model="currentTask.description"
            label="Descrição"
            variant="outlined"
            rows="3"
            class="mb-4"
          />
          
          <v-text-field
            v-model.number="currentTask.estimatedHours"
            label="Horas Estimadas *"
            type="number"
            :rules="[rules.required, rules.minHours]"
            variant="outlined"
            min="0.5"
            step="0.5"
            class="mb-4"
          />
          
          <div class="mb-4">
            <v-label class="mb-2">Prioridade</v-label>
            <v-chip-group v-model="currentTask.priority" mandatory>
              <v-chip
                v-for="priority in priorityOptions"
                :key="priority.value"
                :value="priority.value"
                :color="priority.color"
                variant="tonal"
              >
                {{ priority.title }}
              </v-chip>
            </v-chip-group>
          </div>
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="taskDialog = false">Cancelar</v-btn>
        <v-btn color="primary" @click="saveTask">
          {{ currentTask.id ? 'Salvar' : 'Adicionar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>