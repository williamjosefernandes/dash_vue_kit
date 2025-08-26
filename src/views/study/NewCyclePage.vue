<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';
import type { CycleSubject } from '@/types/study';

const router = useRouter();
const studyStore = useStudyStore();

const page = ref({ title: 'Novo Ciclo de Estudo' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Ciclos de Estudo', disabled: false, href: '/main/cycles' },
  { title: 'Novo Ciclo', disabled: true, href: '#' }
]);

const form = ref();
const valid = ref(false);
const loading = ref(false);

const cycleData = ref({
  name: '',
  description: '',
  examDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  weeklyGoal: 40,
  dailyGoal: 6,
  selectedSubjects: [] as string[]
});

const selectedSubjectsDetails = ref<CycleSubject[]>([]);

const rules = {
  required: (v: string) => !!v || 'Campo obrigatório',
  minGoal: (v: number) => v > 0 || 'Meta deve ser maior que zero',
  futureDate: (v: string) => {
    const selected = new Date(v);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected >= today || 'Data deve ser futura';
  }
};

const daysUntilExam = computed(() => {
  const examDate = new Date(cycleData.value.examDate);
  const today = new Date();
  const diffTime = examDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

const totalEstimatedHours = computed(() => {
  return selectedSubjectsDetails.value.reduce((total, subject) => {
    return total + (subject.estimatedMinutes / 60);
  }, 0);
});

const addSubjectToDetails = (subjectId: string) => {
  const subject = studyStore.getSubjectById(subjectId);
  if (subject && !selectedSubjectsDetails.value.find(s => s.subjectId === subjectId)) {
    const cycleSubject: CycleSubject = {
      id: Date.now().toString() + Math.random(),
      subjectId: subject.id,
      name: subject.name,
      color: subject.color,
      estimatedMinutes: 30, // Padrão de 30 minutos
      actualMinutes: 0,
      priority: 'medium',
      status: 'to_study',
      order: selectedSubjectsDetails.value.length
    };
    selectedSubjectsDetails.value.push(cycleSubject);
  }
};

const removeSubjectFromDetails = (subjectId: string) => {
  const index = selectedSubjectsDetails.value.findIndex(s => s.subjectId === subjectId);
  if (index !== -1) {
    selectedSubjectsDetails.value.splice(index, 1);
    // Atualizar array de IDs selecionados
    cycleData.value.selectedSubjects = cycleData.value.selectedSubjects.filter(id => id !== subjectId);
  }
};

const updateSubjectDetails = (subjectId: string, field: keyof CycleSubject, value: any) => {
  const subject = selectedSubjectsDetails.value.find(s => s.subjectId === subjectId);
  if (subject) {
    (subject as any)[field] = value;
  }
};

const onSubjectsChange = (selectedIds: string[]) => {
  // Adicionar novos subjects
  selectedIds.forEach(id => {
    if (!selectedSubjectsDetails.value.find(s => s.subjectId === id)) {
      addSubjectToDetails(id);
    }
  });
  
  // Remover subjects desmarcados
  selectedSubjectsDetails.value.forEach(subject => {
    if (!selectedIds.includes(subject.subjectId)) {
      removeSubjectFromDetails(subject.subjectId);
    }
  });
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'success';
    default: return 'primary';
  }
};

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

const saveCycle = async () => {
  if (!form.value.validate() || selectedSubjectsDetails.value.length === 0) return;
  
  loading.value = true;
  
  try {
    const newCycle = {
      name: cycleData.value.name,
      description: cycleData.value.description,
      examDate: new Date(cycleData.value.examDate),
      weeklyGoal: cycleData.value.weeklyGoal,
      dailyGoal: cycleData.value.dailyGoal,
      subjects: selectedSubjectsDetails.value,
      status: 'active' as const
    };
    
    studyStore.addStudyCycle(newCycle);
    
    // Definir como ciclo ativo
    const cycles = studyStore.studyCycles;
    const newCycleId = cycles[cycles.length - 1].id;
    studyStore.setActiveCycle(newCycleId);
    
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
                placeholder="Ex: Preparação ENEM 2024, Concurso TRT, etc."
                prepend-inner-icon="mdi-book-outline"
              />
            </v-col>
            
            <v-col cols="12">
              <v-textarea
                v-model="cycleData.description"
                label="Descrição"
                variant="outlined"
                rows="4"
                placeholder="Descreva os objetivos e estratégias deste ciclo de estudos..."
                prepend-inner-icon="mdi-text"
              />
            </v-col>
            
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="cycleData.examDate"
                label="Data da Prova/Exame *"
                type="date"
                :rules="[rules.required, rules.futureDate]"
                variant="outlined"
                prepend-inner-icon="mdi-calendar"
              />
            </v-col>
            
            <v-col cols="12" sm="6">
              <v-alert type="info" variant="tonal" density="compact">
                <div class="d-flex align-center">
                  <SvgSprite name="custom-calendar" style="width: 16px; height: 16px" class="me-2" />
                  <span class="text-body-2">{{ daysUntilExam }} dias até a prova</span>
                </div>
              </v-alert>
            </v-col>
          </v-row>
        </UiParentCard>

        <!-- Metas de Estudo -->
        <UiParentCard title="Metas de Estudo" class="mt-6">
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="cycleData.dailyGoal"
                label="Meta Diária (horas) *"
                type="number"
                :rules="[rules.required, rules.minGoal]"
                variant="outlined"
                min="1"
                max="16"
                prepend-inner-icon="mdi-clock-outline"
              />
            </v-col>
            
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="cycleData.weeklyGoal"
                label="Meta Semanal (horas) *"
                type="number"
                :rules="[rules.required, rules.minGoal]"
                variant="outlined"
                min="7"
                max="112"
                prepend-inner-icon="mdi-calendar-week"
              />
            </v-col>
          </v-row>
          
          <v-alert type="success" variant="tonal" class="mt-4">
            <div class="d-flex align-center">
              <SvgSprite name="custom-info" style="width: 20px; height: 20px" class="me-2" />
              <div>
                <strong>Planejamento:</strong><br>
                Com {{ cycleData.dailyGoal }}h/dia e {{ cycleData.weeklyGoal }}h/semana, você terá 
                {{ Math.round((daysUntilExam / 7) * cycleData.weeklyGoal) }}h totais até a prova.
              </div>
            </div>
          </v-alert>
        </UiParentCard>

        <!-- Disciplinas -->
        <UiParentCard title="Disciplinas do Ciclo" class="mt-6">
          <v-select
            v-model="cycleData.selectedSubjects"
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
            @update:model-value="onSubjectsChange"
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
          
          <!-- Configuração Detalhada das Disciplinas -->
          <div v-if="selectedSubjectsDetails.length > 0" class="mt-6">
            <h6 class="text-h6 mb-4">Configuração das Disciplinas:</h6>
            
            <div class="subjects-config">
              <v-card
                v-for="subject in selectedSubjectsDetails"
                :key="subject.id"
                variant="outlined"
                class="mb-4"
              >
                <v-card-text class="pa-4">
                  <div class="d-flex align-center mb-3">
                    <v-avatar :color="subject.color" size="32" class="me-3">
                      <SvgSprite name="custom-book" style="width: 16px; height: 16px" />
                    </v-avatar>
                    <h6 class="text-h6">{{ subject.name }}</h6>
                  </div>
                  
                  <v-row>
                    <v-col cols="12" sm="4">
                      <v-text-field
                        :model-value="subject.estimatedMinutes"
                        @update:model-value="updateSubjectDetails(subject.subjectId, 'estimatedMinutes', $event)"
                        label="Tempo por sessão (min)"
                        type="number"
                        variant="outlined"
                        density="compact"
                        min="5"
                        step="5"
                      />
                    </v-col>
                    
                    <v-col cols="12" sm="4">
                      <v-select
                        :model-value="subject.priority"
                        @update:model-value="updateSubjectDetails(subject.subjectId, 'priority', $event)"
                        :items="[
                          { title: 'Baixa', value: 'low' },
                          { title: 'Média', value: 'medium' },
                          { title: 'Alta', value: 'high' }
                        ]"
                        label="Prioridade"
                        variant="outlined"
                        density="compact"
                      />
                    </v-col>
                    
                    <v-col cols="12" sm="4" class="d-flex align-center">
                      <v-chip 
                        :color="getPriorityColor(subject.priority)" 
                        variant="tonal"
                        class="me-2"
                      >
                        {{ formatMinutes(subject.estimatedMinutes) }}
                      </v-chip>
                      
                      <v-btn
                        icon
                        size="small"
                        color="error"
                        variant="text"
                        @click="removeSubjectFromDetails(subject.subjectId)"
                      >
                        <SvgSprite name="custom-trash" style="width: 16px; height: 16px" />
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </UiParentCard>
      </v-col>

      <!-- Sidebar com Preview -->
      <v-col cols="12" lg="4">
        <!-- Preview do Ciclo -->
        <UiParentCard title="Preview do Ciclo">
          <v-card variant="outlined" color="primary" class="pa-4">
            <div class="d-flex align-center mb-3">
              <v-avatar color="primary" size="40" class="me-3">
                <SvgSprite name="custom-refresh" style="width: 20px; height: 20px" />
              </v-avatar>
              <div>
                <h6 class="text-h6 mb-0">{{ cycleData.name || 'Nome do Ciclo' }}</h6>
                <v-chip size="small" color="primary" variant="tonal">
                  {{ daysUntilExam }} dias restantes
                </v-chip>
              </div>
            </div>
            
            <p class="text-caption text-lightText mb-3">
              {{ cycleData.description || 'Descrição do ciclo aparecerá aqui...' }}
            </p>
            
            <div class="text-caption">
              <div class="d-flex align-center mb-1">
                <SvgSprite name="custom-clock" style="width: 12px; height: 12px" class="me-2" />
                {{ cycleData.dailyGoal }}h/dia • {{ cycleData.weeklyGoal }}h/semana
              </div>
              <div class="d-flex align-center mb-1">
                <SvgSprite name="custom-calendar" style="width: 12px; height: 12px" class="me-2" />
                Prova em {{ new Date(cycleData.examDate).toLocaleDateString() }}
              </div>
              <div class="d-flex align-center">
                <SvgSprite name="custom-book" style="width: 12px; height: 12px" class="me-2" />
                {{ selectedSubjectsDetails.length }} disciplina(s)
              </div>
            </div>
          </v-card>
        </UiParentCard>

        <!-- Estatísticas -->
        <UiParentCard title="Estatísticas do Ciclo" class="mt-6">
          <div class="stats-container">
            <v-row>
              <v-col cols="6">
                <div class="stat-card text-center">
                  <h3 class="text-h3 text-primary mb-1">{{ selectedSubjectsDetails.length }}</h3>
                  <p class="text-caption mb-0">Disciplinas</p>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="stat-card text-center">
                  <h3 class="text-h3 text-success mb-1">{{ daysUntilExam }}</h3>
                  <p class="text-caption mb-0">Dias</p>
                </div>
              </v-col>
            </v-row>
            
            <v-divider class="my-4" />
            
            <div class="text-center">
              <h2 class="text-h2 text-warning mb-2">{{ totalEstimatedHours.toFixed(1) }}h</h2>
              <p class="text-subtitle-2 text-lightText mb-0">Tempo Total Estimado</p>
            </div>

            <v-alert 
              v-if="selectedSubjectsDetails.length > 0" 
              type="info" 
              variant="tonal" 
              class="mt-4"
              density="compact"
            >
              <div class="text-caption">
                <strong>Dica:</strong> Organize as disciplinas por prioridade para otimizar seu tempo de estudo.
              </div>
            </v-alert>
          </div>
        </UiParentCard>

        <!-- Guia Rápido -->
        <UiParentCard title="Como Funciona" class="mt-6">
          <div class="guide-steps">
            <div class="step-item">
              <v-avatar color="info" size="24" class="me-3">
                <span class="text-caption font-weight-bold">1</span>
              </v-avatar>
              <div>
                <p class="text-body-2 mb-1 font-weight-medium">Kanban Inteligente</p>
                <p class="text-caption text-lightText mb-0">
                  Arraste disciplinas entre as colunas: A Estudar → Em Estudo → Revisão → Concluído
                </p>
              </div>
            </div>
            
            <div class="step-item">
              <v-avatar color="warning" size="24" class="me-3">
                <span class="text-caption font-weight-bold">2</span>
              </v-avatar>
              <div>
                <p class="text-body-2 mb-1 font-weight-medium">Timer Pomodoro</p>
                <p class="text-caption text-lightText mb-0">
                  Cronômetro integrado para manter foco e registrar tempo real de estudo
                </p>
              </div>
            </div>
            
            <div class="step-item">
              <v-avatar color="success" size="24" class="me-3">
                <span class="text-caption font-weight-bold">3</span>
              </v-avatar>
              <div>
                <p class="text-body-2 mb-1 font-weight-medium">Revisão Automática</p>
                <p class="text-caption text-lightText mb-0">
                  Sistema de revisão espaçada: 24h, 7 dias e 30 dias
                </p>
              </div>
            </div>
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
              :disabled="!valid || selectedSubjectsDetails.length === 0"
              prepend-icon="mdi-rocket-launch"
            >
              Criar e Iniciar Ciclo
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-form>
</template>

<style scoped>
.subjects-config {
  max-height: 400px;
  overflow-y: auto;
}

.stat-card {
  padding: 1rem;
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 12px;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}

/* Scrollbar customizada */
.subjects-config::-webkit-scrollbar {
  width: 6px;
}

.subjects-config::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.subjects-config::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.subjects-config::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>