<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';

const studyStore = useStudyStore();
const page = ref({ title: 'Planos de Estudo' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Planos', disabled: true, href: '#' }
]);

const dialog = ref(false);
const editMode = ref(false);
const currentPlan = ref({
  id: '',
  name: '',
  description: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  subjects: [] as string[],
  dailyGoal: 2,
  weeklyGoal: 14,
  status: 'draft' as 'active' | 'paused' | 'completed' | 'draft',
  color: 'primary',
  priority: 'medium' as 'low' | 'medium' | 'high',
  active: false
});

const colors = [
  { name: 'Azul', value: 'primary' },
  { name: 'Verde', value: 'success' },
  { name: 'Laranja', value: 'warning' },
  { name: 'Vermelho', value: 'error' },
  { name: 'Roxo', value: 'secondary' },
  { name: 'Ciano', value: 'info' }
];

const statusOptions = [
  { title: 'Rascunho', value: 'draft' },
  { title: 'Ativo', value: 'active' },
  { title: 'Pausado', value: 'paused' },
  { title: 'Concluído', value: 'completed' }
];

const rules = {
  required: (v: string) => !!v || 'Campo obrigatório',
  minGoal: (v: number) => v > 0 || 'Meta deve ser maior que zero',
  dateRange: (startDate: string, endDate: string) => {
    return new Date(endDate) > new Date(startDate) || 'Data final deve ser posterior à inicial';
  }
};

const openDialog = (plan?: any) => {
  if (plan) {
    editMode.value = true;
    currentPlan.value = { 
      ...plan,
      startDate: new Date(plan.startDate).toISOString().split('T')[0],
      endDate: new Date(plan.endDate).toISOString().split('T')[0]
    };
  } else {
    editMode.value = false;
    currentPlan.value = {
      id: '',
      name: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subjects: [],
      dailyGoal: 2,
      weeklyGoal: 14,
      status: 'draft',
      color: 'primary',
      priority: 'medium',
      active: false
    };
  }
  dialog.value = true;
};

const savePlan = () => {
  const planData = {
    ...currentPlan.value,
    startDate: new Date(currentPlan.value.startDate),
    endDate: new Date(currentPlan.value.endDate)
  };
  
  if (editMode.value) {
    studyStore.updateStudyPlan(currentPlan.value.id, planData);
  } else {
    studyStore.addStudyPlan(planData);
  }
  dialog.value = false;
};

const deletePlan = (id: string) => {
  if (confirm('Tem certeza que deseja excluir este plano?')) {
    studyStore.deleteStudyPlan(id);
  }
};

const activatePlan = (planId: string) => {
  studyStore.setActiveStudyPlan(planId);
  studyStore.updateStudyPlan(planId, { status: 'active', active: true });
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

const getPlanProgress = (plan: any) => {
  const now = new Date();
  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);
  
  if (now < start) return 0;
  if (now > end) return 100;
  
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  
  return Math.round((elapsed / total) * 100);
};

const getDaysRemaining = (endDate: Date) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
};

const getSubjectNames = (subjectIds: string[]) => {
  return subjectIds
    .map(id => studyStore.getSubjectById(id)?.name)
    .filter(Boolean)
    .join(', ');
};
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  
  <UiParentCard title="Meus Planos de Estudo">
    <template v-slot:action>
      <v-btn color="primary" @click="openDialog()" prepend-icon="mdi-plus">
        Novo Plano
      </v-btn>
    </template>

    <v-row v-if="studyStore.studyPlans.length > 0">
      <v-col 
        v-for="plan in studyStore.studyPlans" 
        :key="plan.id"
        cols="12" 
        md="6" 
        lg="4"
      >
        <v-card class="h-100" :class="{ 'border-primary': plan.active }">
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-3">
              <v-chip 
                :color="getStatusColor(plan.status)" 
                size="small" 
                variant="tonal"
              >
                {{ getStatusText(plan.status) }}
              </v-chip>
              
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn icon size="small" variant="text" v-bind="props">
                    <SvgSprite name="custom-more" style="width: 16px; height: 16px" />
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item @click="openDialog(plan)">
                    <template v-slot:prepend>
                      <SvgSprite name="custom-edit" style="width: 16px; height: 16px" />
                    </template>
                    <v-list-item-title>Editar</v-list-item-title>
                  </v-list-item>
                  <v-list-item 
                    v-if="plan.status === 'draft' || plan.status === 'paused'"
                    @click="activatePlan(plan.id)"
                  >
                    <template v-slot:prepend>
                      <SvgSprite name="custom-play" style="width: 16px; height: 16px" />
                    </template>
                    <v-list-item-title>Ativar</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="deletePlan(plan.id)" class="text-error">
                    <template v-slot:prepend>
                      <SvgSprite name="custom-trash" style="width: 16px; height: 16px" />
                    </template>
                    <v-list-item-title>Excluir</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
            
            <div class="d-flex align-center mb-2">
              <v-avatar :color="plan.color" size="32" class="me-3">
                <SvgSprite name="custom-calendar" style="width: 16px; height: 16px" />
              </v-avatar>
              <div>
                <h6 class="text-h6 mb-0">{{ plan.name }}</h6>
                <v-chip 
                  :color="getPriorityColor(plan.priority)" 
                  size="x-small" 
                  variant="tonal"
                >
                  {{ getPriorityText(plan.priority) }}
                </v-chip>
              </div>
            </div>
            
            <p class="text-caption text-lightText mb-3">{{ plan.description }}</p>
            
            <!-- Progresso do Plano -->
            <div class="mb-3">
              <div class="d-flex justify-space-between mb-1">
                <span class="text-caption">Progresso</span>
                <span class="text-caption">{{ getPlanProgress(plan) }}%</span>
              </div>
              <v-progress-linear
                :model-value="getPlanProgress(plan)"
                :color="plan.color"
                height="6"
                rounded
              />
            </div>
            
            <!-- Informações do Plano -->
            <div class="mb-3">
              <div class="d-flex align-center mb-1">
                <SvgSprite name="custom-clock" style="width: 12px; height: 12px" class="me-2" />
                <span class="text-caption">{{ plan.dailyGoal }}h/dia • {{ plan.weeklyGoal }}h/semana</span>
              </div>
              
              <div class="d-flex align-center mb-1">
                <SvgSprite name="custom-calendar" style="width: 12px; height: 12px" class="me-2" />
                <span class="text-caption">
                  {{ new Date(plan.startDate).toLocaleDateString() }} - 
                  {{ new Date(plan.endDate).toLocaleDateString() }}
                </span>
              </div>
              
              <div v-if="plan.status === 'active'" class="d-flex align-center">
                <SvgSprite name="custom-alert" style="width: 12px; height: 12px" class="me-2" />
                <span class="text-caption">{{ getDaysRemaining(plan.endDate) }} dias restantes</span>
              </div>
            </div>
            
            <!-- Disciplinas -->
            <div v-if="plan.subjects.length > 0">
              <p class="text-caption mb-1">Disciplinas:</p>
              <p class="text-caption text-lightText">{{ getSubjectNames(plan.subjects) }}</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <div v-else class="text-center py-12">
      <SvgSprite name="custom-calendar" style="width: 64px; height: 64px; opacity: 0.3" />
      <h5 class="text-h5 mt-4 mb-2">Nenhum plano de estudo criado</h5>
      <p class="text-subtitle-1 text-lightText mb-4">
        Organize seus estudos criando planos estruturados com metas e cronogramas
      </p>
      <v-btn color="primary" @click="openDialog()" prepend-icon="mdi-plus">
        Criar Primeiro Plano
      </v-btn>
    </div>
  </UiParentCard>

  <!-- Dialog para Adicionar/Editar Plano -->
  <v-dialog v-model="dialog" max-width="600px">
    <v-card>
      <v-card-title>
        {{ editMode ? 'Editar Plano' : 'Novo Plano de Estudo' }}
      </v-card-title>
      
      <v-card-text>
        <v-form>
          <v-text-field
            v-model="currentPlan.name"
            label="Nome do Plano"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-4"
            placeholder="Ex: Preparação para ENEM 2024"
          />
          
          <v-textarea
            v-model="currentPlan.description"
            label="Descrição"
            variant="outlined"
            rows="3"
            class="mb-4"
            placeholder="Descreva os objetivos e estratégias do plano"
          />
          
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="currentPlan.startDate"
                label="Data de Início"
                type="date"
                :rules="[rules.required]"
                variant="outlined"
                class="mb-4"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="currentPlan.endDate"
                label="Data de Término"
                type="date"
                :rules="[rules.required]"
                variant="outlined"
                class="mb-4"
              />
            </v-col>
          </v-row>
          
          <v-select
            v-model="currentPlan.subjects"
            :items="studyStore.subjects"
            item-title="name"
            item-value="id"
            label="Disciplinas do Plano"
            variant="outlined"
            multiple
            chips
            class="mb-4"
          />
          
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="currentPlan.dailyGoal"
                label="Meta Diária (horas)"
                type="number"
                :rules="[rules.required, rules.minGoal]"
                variant="outlined"
                class="mb-4"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="currentPlan.weeklyGoal"
                label="Meta Semanal (horas)"
                type="number"
                :rules="[rules.required, rules.minGoal]"
                variant="outlined"
                class="mb-4"
              />
            </v-col>
          </v-row>
          
          <v-select
            v-model="currentPlan.status"
            :items="statusOptions"
            label="Status do Plano"
            variant="outlined"
            class="mb-4"
          />
          
          <div class="mb-4">
            <v-label class="mb-2">Prioridade</v-label>
            <v-chip-group v-model="currentPlan.priority" mandatory>
              <v-chip value="low" color="success" variant="tonal">Baixa</v-chip>
              <v-chip value="medium" color="warning" variant="tonal">Média</v-chip>
              <v-chip value="high" color="error" variant="tonal">Alta</v-chip>
            </v-chip-group>
          </div>
          
          <div class="mb-4">
            <v-label class="mb-2">Cor do Plano</v-label>
            <v-chip-group v-model="currentPlan.color" mandatory>
              <v-chip
                v-for="color in colors"
                :key="color.value"
                :value="color.value"
                :color="color.value"
                variant="tonal"
              >
                {{ color.name }}
              </v-chip>
            </v-chip-group>
          </div>
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="dialog = false">Cancelar</v-btn>
        <v-btn color="primary" @click="savePlan">
          {{ editMode ? 'Salvar' : 'Criar Plano' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>