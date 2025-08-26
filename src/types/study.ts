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

    <!-- Lista de Ciclos -->
    <v-row v-if="studyStore.studyCycles.length > 0">
      <v-col 
        v-for="cycle in studyStore.studyCycles" 
        :key="cycle.id"
        cols="12" 
        md="6" 
        lg="4"
      >
        <v-card class="h-100">
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
                <p class="text-caption text-lightText mb-0">{{ getPlanName(cycle.planId) }}</p>
              </div>
            </div>
            
            <p class="text-caption text-lightText mb-3">{{ cycle.description }}</p>
            
            <!-- Progresso -->
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
            
            <!-- Informações -->
            <div class="mb-3">
              <div class="d-flex align-center mb-1">
                <SvgSprite name="custom-calendar" style="width: 12px; height: 12px" class="me-2" />
                <span class="text-caption">
                  {{ new Date(cycle.startDate).toLocaleDateString() }} - 
                  {{ new Date(cycle.endDate).toLocaleDateString() }}
                </span>
              </div>
              
              <div class="d-flex align-center">
                <SvgSprite name="custom-target" style="width: 12px; height: 12px" class="me-2" />
                <span class="text-caption">{{ cycle.objectives.length }} objetivo(s)</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Estado Vazio -->
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

  <!-- Dialog para Criar Ciclo -->
</template>