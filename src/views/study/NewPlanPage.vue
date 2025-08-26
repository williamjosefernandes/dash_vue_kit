<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';

const router = useRouter();
const studyStore = useStudyStore();

const page = ref({ title: 'Novo Plano de Estudo' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Planos', disabled: false, href: '/main/plans' },
  { title: 'Novo Plano', disabled: true, href: '#' }
]);

const form = ref();
const valid = ref(false);
const loading = ref(false);

const planData = ref({
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
  { name: 'Azul', value: 'primary', color: '#4680FF' },
  { name: 'Verde', value: 'success', color: '#2ca87f' },
  { name: 'Laranja', value: 'warning', color: '#e58a00' },
  { name: 'Vermelho', value: 'error', color: '#dc2626' },
  { name: 'Roxo', value: 'secondary', color: '#5B6B79' },
  { name: 'Ciano', value: 'info', color: '#3ec9d6' }
];

const statusOptions = [
  { title: 'Rascunho', value: 'draft', description: 'Plano em preparação' },
  { title: 'Ativo', value: 'active', description: 'Plano em execução' },
  { title: 'Pausado', value: 'paused', description: 'Plano temporariamente pausado' }
];

const priorityOptions = [
  { title: 'Baixa', value: 'low', color: 'success', description: 'Prioridade baixa' },
  { title: 'Média', value: 'medium', color: 'warning', description: 'Prioridade média' },
  { title: 'Alta', value: 'high', color: 'error', description: 'Prioridade alta' }
];

const rules = {
  required: (v: string) => !!v || 'Campo obrigatório',
  minGoal: (v: number) => v > 0 || 'Meta deve ser maior que zero',
  maxGoal: (v: number) => v <= 24 || 'Meta não pode exceder 24 horas',
  dateRange: () => {
    return new Date(planData.value.endDate) > new Date(planData.value.startDate) || 
           'Data final deve ser posterior à inicial';
  },
  weeklyGoal: () => {
    return planData.value.weeklyGoal >= planData.value.dailyGoal || 
           'Meta semanal deve ser maior ou igual à meta diária';
  }
};

const planDuration = computed(() => {
  const start = new Date(planData.value.startDate);
  const end = new Date(planData.value.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

const totalPlannedHours = computed(() => {
  const weeks = Math.ceil(planDuration.value / 7);
  return weeks * planData.value.weeklyGoal;
});

const selectedSubjects = computed(() => {
  return studyStore.subjects.filter(subject => 
    planData.value.subjects.includes(subject.id)
  );
});

const savePlan = async () => {
  if (!form.value.validate()) return;
  
  loading.value = true;
  
  try {
    const newPlan = {
      ...planData.value,
      startDate: new Date(planData.value.startDate),
      endDate: new Date(planData.value.endDate)
    };
    
    studyStore.addStudyPlan(newPlan);
    
    // Simular delay para melhor UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    router.push('/main/plans');
  } catch (error) {
    console.error('Erro ao salvar plano:', error);
  } finally {
    loading.value = false;
  }
};

const cancel = () => {
  router.push('/main/plans');
};

// Auto-calcular meta semanal baseada na diária
const updateWeeklyGoal = () => {
  planData.value.weeklyGoal = planData.value.dailyGoal * 7;
};

onMounted(() => {
  studyStore.loadFromLocalStorage();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  
  <v-form ref="form" v-model="valid" @submit.prevent="savePlan">
    <v-row>
      <!-- Formulário Principal -->
      <v-col cols="12" lg="8">
        <UiParentCard title="Informações do Plano">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="planData.name"
                label="Nome do Plano *"
                :rules="[rules.required]"
                variant="outlined"
                placeholder="Ex: Preparação para ENEM 2024"
                prepend-inner-icon="mdi-book-outline"
              />
            </v-col>
            
            <v-col cols="12">
              <v-textarea
                v-model="planData.description"
                label="Descrição"
                variant="outlined"
                rows="4"
                placeholder="Descreva os objetivos e estratégias do seu plano de estudo..."
                prepend-inner-icon="mdi-text"
              />
            </v-col>
            
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="planData.startDate"
                label="Data de Início *"
                type="date"
                :rules="[rules.required]"
                variant="outlined"
                prepend-inner-icon="mdi-calendar-start"
              />
            </v-col>
            
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="planData.endDate"
                label="Data de Término *"
                type="date"
                :rules="[rules.required, rules.dateRange]"
                variant="outlined"
                prepend-inner-icon="mdi-calendar-end"
              />
            </v-col>
          </v-row>
        </UiParentCard>

        <!-- Disciplinas -->
        <UiParentCard title="Disciplinas do Plano" class="mt-6">
          <v-select
            v-model="planData.subjects"
            :items="studyStore.subjects"
            item-title="name"
            item-value="id"
            label="Selecione as disciplinas *"
            variant="outlined"
            multiple
            chips
            closable-chips
            :rules="[v => v.length > 0 || 'Selecione pelo menos uma disciplina']"
            prepend-inner-icon="mdi-school"
          >
            <template v-slot:chip="{ props, item }">
              <v-chip
                v-bind="props"
                :color="item.raw.color"
                variant="tonal"
              >
                {{ item.raw.name }}
              </v-chip>
            </template>
          </v-select>
          
          <!-- Preview das disciplinas selecionadas -->
          <div v-if="selectedSubjects.length > 0" class="mt-4">
            <h6 class="text-h6 mb-3">Disciplinas Selecionadas:</h6>
            <v-row>
              <v-col 
                v-for="subject in selectedSubjects" 
                :key="subject.id"
                cols="12" 
                sm="6" 
                md="4"
              >
                <v-card variant="outlined" :color="subject.color" class="pa-3">
                  <div class="d-flex align-center">
                    <v-avatar :color="subject.color" size="32" class="me-3">
                      <SvgSprite name="custom-book" style="width: 16px; height: 16px" />
                    </v-avatar>
                    <div>
                      <h6 class="text-subtitle-2 mb-0">{{ subject.name }}</h6>
                      <p class="text-caption mb-0">{{ subject.totalHours }}h planejadas</p>
                    </div>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </UiParentCard>

        <!-- Metas de Estudo -->
        <UiParentCard title="Metas de Estudo" class="mt-6">
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="planData.dailyGoal"
                label="Meta Diária (horas) *"
                type="number"
                :rules="[rules.required, rules.minGoal, rules.maxGoal]"
                variant="outlined"
                min="0.5"
                max="24"
                step="0.5"
                prepend-inner-icon="mdi-clock-outline"
                @input="updateWeeklyGoal"
              />
            </v-col>
            
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="planData.weeklyGoal"
                label="Meta Semanal (horas) *"
                type="number"
                :rules="[rules.required, rules.minGoal, rules.weeklyGoal]"
                variant="outlined"
                min="1"
                max="168"
                prepend-inner-icon="mdi-calendar-week"
              />
            </v-col>
          </v-row>
          
          <!-- Estatísticas das metas -->
          <v-alert type="info" variant="tonal" class="mt-4">
            <div class="d-flex align-center">
              <SvgSprite name="custom-info" style="width: 20px; height: 20px" class="me-2" />
              <div>
                <strong>Resumo do Plano:</strong><br>
                Duração: {{ planDuration }} dias • 
                Total estimado: {{ totalPlannedHours }}h de estudo
              </div>
            </div>
          </v-alert>
        </UiParentCard>
      </v-col>

      <!-- Configurações Laterais -->
      <v-col cols="12" lg="4">
        <!-- Status e Prioridade -->
        <UiParentCard title="Configurações">
          <div class="mb-4">
            <v-label class="mb-2">Status do Plano</v-label>
            <v-radio-group v-model="planData.status" hide-details>
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
          
          <div class="mb-4">
            <v-label class="mb-2">Prioridade</v-label>
            <v-chip-group v-model="planData.priority" mandatory>
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
          
          <v-divider class="my-4" />
          
          <div>
            <v-label class="mb-2">Cor do Plano</v-label>
            <v-chip-group v-model="planData.color" mandatory>
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

        <!-- Preview do Plano -->
        <UiParentCard title="Preview do Plano" class="mt-6">
          <v-card variant="outlined" :color="planData.color" class="pa-4">
            <div class="d-flex align-center mb-3">
              <v-avatar :color="planData.color" size="40" class="me-3">
                <SvgSprite name="custom-calendar" style="width: 20px; height: 20px" />
              </v-avatar>
              <div>
                <h6 class="text-h6 mb-0">{{ planData.name || 'Nome do Plano' }}</h6>
                <v-chip size="small" :color="planData.color" variant="tonal">
                  {{ statusOptions.find(s => s.value === planData.status)?.title }}
                </v-chip>
              </div>
            </div>
            
            <p class="text-caption text-lightText mb-3">
              {{ planData.description || 'Descrição do plano...' }}
            </p>
            
            <div class="text-caption">
              <div class="d-flex align-center mb-1">
                <SvgSprite name="custom-clock" style="width: 12px; height: 12px" class="me-2" />
                {{ planData.dailyGoal }}h/dia • {{ planData.weeklyGoal }}h/semana
              </div>
              <div class="d-flex align-center mb-1">
                <SvgSprite name="custom-calendar" style="width: 12px; height: 12px" class="me-2" />
                {{ planDuration }} dias de duração
              </div>
              <div class="d-flex align-center">
                <SvgSprite name="custom-book" style="width: 12px; height: 12px" class="me-2" />
                {{ planData.subjects.length }} disciplina(s)
              </div>
            </div>
          </v-card>
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
              Criar Plano
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-form>
</template>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}
</style>