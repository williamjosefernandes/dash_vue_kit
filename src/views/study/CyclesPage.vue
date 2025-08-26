<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';

const studyStore = useStudyStore();
const page = ref({ title: 'Ciclos de Estudos' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Ciclos de Estudos', disabled: true, href: '#' }
]);

const dialog = ref(false);
const form = ref();
const valid = ref(false);
const loading = ref(false);

const cycleData = ref({
  name: '',
  description: '',
  planId: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 semanas
  status: 'draft' as 'active' | 'paused' | 'completed' | 'draft',
  objectives: [''],
  totalHours: 0,
  completedHours: 0,
  tasks: []
});

const rules = {
  required: (v: string) => !!v || 'Campo obrigatório',
  minHours: (v: number) => v >= 0 || 'Horas devem ser positivas',
  dateRange: () => {
    return new Date(cycleData.value.endDate) > new Date(cycleData.value.startDate) || 
           'Data final deve ser posterior à inicial';
  }
};

const statusOptions = [
  { title: 'Rascunho', value: 'draft', description: 'Ciclo em preparação' },
  { title: 'Ativo', value: 'active', description: 'Ciclo em execução' },
  { title: 'Pausado', value: 'paused', description: 'Ciclo temporariamente pausado' }
];

const cycleDuration = computed(() => {
  const start = new Date(cycleData.value.startDate);
  const end = new Date(cycleData.value.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

const selectedPlan = computed(() => {
  return studyStore.studyPlans.find(plan => plan.id === cycleData.value.planId);
});

const openDialog = () => {
  cycleData.value = {
    name: '',
    description: '',
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    objectives: [''],
    totalHours: 0,
    completedHours: 0,
    tasks: []
  };
  dialog.value = true;
};

const addObjective = () => {
  cycleData.value.objectives.push('');
};

const removeObjective = (index: number) => {
  if (cycleData.value.objectives.length > 1) {
    cycleData.value.objectives.splice(index, 1);
  }
};

const saveCycle = async () => {
  if (!form.value.validate()) return;
  
  loading.value = true;
  
  try {
    const newCycle = {
      ...cycleData.value,
      startDate: new Date(cycleData.value.startDate),
      endDate: new Date(cycleData.value.endDate),
      objectives: cycleData.value.objectives.filter(obj => obj.trim() !== '')
    };
    
    studyStore.addStudyCycle(newCycle);
    
    // Simular delay para melhor UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    dialog.value = false;
  } catch (error) {
    console.error('Erro ao salvar ciclo:', error);
  } finally {
    loading.value = false;
  }
};

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

const formatHours = (hours: number) => {
  return `${(hours || 0).toFixed(1)}h`;
};

const getPlanName = (planId: string) => {
  const plan = studyStore.studyPlans.find(p => p.id === planId);
  return plan?.name || 'Plano não encontrado';
};

const dialog = ref(false);
const form = ref();
const valid = ref(false);
const loading = ref(false);

const cycleData = ref({
  name: '',
  description: '',
  planId: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 semanas
  status: 'draft' as 'active' | 'paused' | 'completed' | 'draft',
  objectives: [''],
  totalHours: 0,
  completedHours: 0,
  tasks: []
});

const rules = {
  required: (v: string) => !!v || 'Campo obrigatório',
  minHours: (v: number) => v >= 0 || 'Horas devem ser positivas',
  dateRange: () => {
    return new Date(cycleData.value.endDate) > new Date(cycleData.value.startDate) || 
           'Data final deve ser posterior à inicial';
  }
};

const statusOptions = [
  { title: 'Rascunho', value: 'draft', description: 'Ciclo em preparação' },
  { title: 'Ativo', value: 'active', description: 'Ciclo em execução' },
  { title: 'Pausado', value: 'paused', description: 'Ciclo temporariamente pausado' }
];

const cycleDuration = computed(() => {
  const start = new Date(cycleData.value.startDate);
  const end = new Date(cycleData.value.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

const selectedPlan = computed(() => {
  return studyStore.studyPlans.find(plan => plan.id === cycleData.value.planId);
});

const openDialog = () => {
  cycleData.value = {
    name: '',
    description: '',
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    objectives: [''],
    totalHours: 0,
    completedHours: 0,
    tasks: []
  };
  dialog.value = true;
};

const addObjective = () => {
  cycleData.value.objectives.push('');
};

const removeObjective = (index: number) => {
  if (cycleData.value.objectives.length > 1) {
    cycleData.value.objectives.splice(index, 1);
  }
};

const saveCycle = async () => {
  if (!form.value.validate()) return;
  
  loading.value = true;
  
  try {
    const newCycle = {
      ...cycleData.value,
      startDate: new Date(cycleData.value.startDate),
      endDate: new Date(cycleData.value.endDate),
      objectives: cycleData.value.objectives.filter(obj => obj.trim() !== '')
    };
    
    studyStore.addStudyCycle(newCycle);
    
    // Simular delay para melhor UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    dialog.value = false;
  } catch (error) {
    console.error('Erro ao salvar ciclo:', error);
  } finally {
    loading.value = false;
  }
};

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

const formatHours = (hours: number) => {
  return `${(hours || 0).toFixed(1)}h`;
};

const getPlanName = (planId: string) => {
  const plan = studyStore.studyPlans.find(p => p.id === planId);
  return plan?.name || 'Plano não encontrado';
};

onMounted(() => {
  studyStore.loadFromLocalStorage();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  
  <UiParentCard title="Ciclos de Estudos">
    <template v-slot:action>
      <v-btn color="primary" @click="openDialog()" prepend-icon="mdi-plus">
        Novo Ciclo
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
        <v-card class="h-100" :class="{ 'border-primary': cycle.status === 'active' }">
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
                  <v-list-item>
                    <template v-slot:prepend>
                      <SvgSprite name="custom-edit" style="width: 16px; height: 16px" />
                    </template>
                    <v-list-item-title>Editar</v-list-item-title>
                  </v-list-item>
                  <v-list-item class="text-error">
                    <template v-slot:prepend>
                      <SvgSprite name="custom-trash" style="width: 16px; height: 16px" />
                    </template>
                    <v-list-item-title>Excluir</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
            
            <div class="d-flex align-center mb-2">
              <v-avatar color="primary" size="32" class="me-3">
                <SvgSprite name="custom-refresh" style="width: 16px; height: 16px" />
              </v-avatar>
              <div>
                <h6 class="text-h6 mb-0">{{ cycle.name }}</h6>
                <p class="text-caption mb-0">{{ getPlanName(cycle.planId) }}</p>
              </div>
            </div>
            
            <p class="text-caption text-lightText mb-3">{{ cycle.description }}</p>
            
            <!-- Progresso do Ciclo -->
            <div class="mb-3">
              <div class="d-flex justify-space-between mb-1">
                <span class="text-caption">Progresso</span>
                <span class="text-caption">{{ formatHours(cycle.completedHours) }} / {{ formatHours(cycle.totalHours) }}</span>
              </div>
              <v-progress-linear
                :model-value="cycle.totalHours > 0 ? (cycle.completedHours / cycle.totalHours) * 100 : 0"
                color="primary"
                height="6"
                rounded
              />
            </div>
            
            <!-- Informações do Ciclo -->
            <div class="mb-3">
              <div class="d-flex align-center mb-1">
                <SvgSprite name="custom-calendar" style="width: 12px; height: 12px" class="me-2" />
                <span class="text-caption">
                  {{ new Date(cycle.startDate).toLocaleDateString() }} - 
                  {{ new Date(cycle.endDate).toLocaleDateString() }}
                </span>
              </div>
              
              <div class="d-flex align-center">
                <SvgSprite name="custom-check" style="width: 12px; height: 12px" class="me-2" />
                <span class="text-caption">{{ cycle.tasks.length }} tarefa(s)</span>
              </div>
            </div>
            
            <!-- Objetivos -->
            <div v-if="cycle.objectives.length > 0">
              <p class="text-caption mb-1">Objetivos:</p>
              <div class="d-flex flex-wrap gap-1">
                <v-chip 
                  v-for="(objective, index) in cycle.objectives.slice(0, 2)" 
                  :key="index"
                  size="x-small" 
                  variant="tonal"
                >
                  {{ objective }}
                </v-chip>
                <v-chip 
                  v-if="cycle.objectives.length > 2"
                  size="x-small" 
                  variant="outlined"
                >
                  +{{ cycle.objectives.length - 2 }}
                </v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <div v-else class="text-center py-12">
      <SvgSprite name="custom-refresh" style="width: 64px; height: 64px; opacity: 0.3" />
      <h5 class="text-h5 mt-4 mb-2">Nenhum ciclo de estudos criado</h5>
      <p class="text-subtitle-1 text-lightText mb-4">
        Organize seus estudos em ciclos estruturados para melhor aproveitamento
      </p>
      <v-btn color="primary" @click="openDialog()" prepend-icon="mdi-plus">
        Criar Primeiro Ciclo
      </v-btn>
    </div>
  </UiParentCard>

  <!-- Dialog para Criar Novo Ciclo -->
  <v-dialog v-model="dialog" max-width="800px" persistent>
    <v-card>
      <v-card-title class="pa-6">
        <div class="d-flex align-center">
          <v-avatar color="primary" size="32" class="me-3">
            <SvgSprite name="custom-refresh" style="width: 16px; height: 16px" />
          </v-avatar>
          <span>Novo Ciclo de Estudos</span>
        </div>
      </v-card-title>
      
      <v-card-text class="pa-6">
        <v-form ref="form" v-model="valid">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="cycleData.name"
                label="Nome do Ciclo *"
                :rules="[rules.required]"
                variant="outlined"
                placeholder="Ex: Sprint de Matemática - Janeiro 2024"
                prepend-inner-icon="mdi-book-outline"
                density="comfortable"
              />
            </v-col>
            
            <v-col cols="12">
              <v-textarea
                v-model="cycleData.description"
                label="Descrição"
                variant="outlined"
                rows="3"
                placeholder="Descreva os objetivos e foco deste ciclo de estudos..."
                prepend-inner-icon="mdi-text"
                density="comfortable"
              />
            </v-col>
            
            <v-col cols="12">
              <v-select
                v-model="cycleData.planId"
                :items="studyStore.studyPlans"
                item-title="name"
                item-value="id"
                label="Plano Base *"
                :rules="[rules.required]"
                variant="outlined"
                prepend-inner-icon="mdi-calendar"
                density="comfortable"
                hint="Selecione o plano de estudos que será base para este ciclo"
                persistent-hint
              />
            </v-col>
            
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="cycleData.startDate"
                label="Data de Início *"
                type="date"
                :rules="[rules.required]"
                variant="outlined"
                prepend-inner-icon="mdi-calendar-start"
                density="comfortable"
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
                density="comfortable"
              />
            </v-col>
            
            <v-col cols="12">
              <v-text-field
                v-model.number="cycleData.totalHours"
                label="Horas Totais Planejadas"
                type="number"
                :rules="[rules.minHours]"
                variant="outlined"
                min="0"
                step="0.5"
                prepend-inner-icon="mdi-clock-outline"
                density="comfortable"
                hint="Total de horas que você planeja estudar neste ciclo"
                persistent-hint
              />
            </v-col>
            
            <v-col cols="12">
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
            </v-col>
            
            <v-col cols="12">
              <div class="mb-4">
                <v-label class="mb-2">Objetivos do Ciclo</v-label>
                <div v-for="(objective, index) in cycleData.objectives" :key="index" class="d-flex align-center mb-2">
                  <v-text-field
                    v-model="cycleData.objectives[index]"
                    :label="`Objetivo ${index + 1}`"
                    variant="outlined"
                    density="comfortable"
                    class="me-2"
                    placeholder="Ex: Dominar equações de segundo grau"
                  />
                  <v-btn
                    v-if="cycleData.objectives.length > 1"
                    icon
                    size="small"
                    color="error"
                    variant="text"
                    @click="removeObjective(index)"
                  >
                    <SvgSprite name="custom-trash" style="width: 16px; height: 16px" />
                  </v-btn>
                </div>
                <v-btn
                  variant="outlined"
                  size="small"
                  @click="addObjective"
                  prepend-icon="mdi-plus"
                >
                  Adicionar Objetivo
                </v-btn>
              </div>
            </v-col>
          </v-row>
          
          <!-- Preview do Ciclo -->
          <v-alert type="info" variant="tonal" class="mt-4">
            <div class="text-body-2">
              <strong>Resumo do Ciclo:</strong><br>
              Duração: {{ cycleDuration }} dias<br>
              <span v-if="selectedPlan">Baseado no plano: {{ selectedPlan.name }}</span><br>
              <span v-if="cycleData.totalHours > 0">Total estimado: {{ formatHours(cycleData.totalHours) }} de estudo</span>
            </div>
          </v-alert>
        </v-form>
      </v-card-text>
      
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn @click="dialog = false" variant="outlined" :disabled="loading">
          Cancelar
        </v-btn>
        <v-btn 
          color="primary" 
          @click="saveCycle"
          :loading="loading"
          :disabled="!valid"
          variant="flat"
          prepend-icon="mdi-content-save"
        >
          Criar Ciclo
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>