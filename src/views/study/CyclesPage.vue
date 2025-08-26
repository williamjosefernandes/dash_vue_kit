<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';

const studyStore = useStudyStore();
const page = ref({ title: 'Ciclos de Estudo' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Ciclos de Estudo', disabled: true, href: '#' }
]);

const stats = computed(() => studyStore.getCycleStats);

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

const formatHours = (hours: number) => {
  return `${hours.toFixed(1)}h`;
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
                    <v-list-item-title>Ver Detalhes</v-list-item-title>
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
</template>