<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';

const studyStore = useStudyStore();
const page = ref({ title: 'Dashboard de Estudos' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Dashboard', disabled: true, href: '#' }
]);

const stats = computed(() => studyStore.getStudyStats);
const recentSessions = computed(() => 
  studyStore.studySessions
    .filter(session => session.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
);

const upcomingTasks = computed(() =>
  studyStore.getPendingTasks
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)
);

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const formatHours = (hours: number) => {
  return `${hours.toFixed(1)}h`;
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
            <SvgSprite name="custom-clock" style="width: 24px; height: 24px" />
          </div>
          <h3 class="text-h3">{{ formatHours(stats.totalHours) }}</h3>
          <p class="text-subtitle-2 mb-0">Total de Horas</p>
        </v-card-text>
      </v-card>
    </v-col>
    
    <v-col cols="12" sm="6" md="3">
      <v-card class="text-center" color="success" variant="tonal">
        <v-card-text>
          <div class="d-flex align-center justify-center mb-2">
            <SvgSprite name="custom-calendar" style="width: 24px; height: 24px" />
          </div>
          <h3 class="text-h3">{{ formatHours(stats.weeklyHours) }}</h3>
          <p class="text-subtitle-2 mb-0">Esta Semana</p>
        </v-card-text>
      </v-card>
    </v-col>
    
    <v-col cols="12" sm="6" md="3">
      <v-card class="text-center" color="info" variant="tonal">
        <v-card-text>
          <div class="d-flex align-center justify-center mb-2">
            <SvgSprite name="custom-check" style="width: 24px; height: 24px" />
          </div>
          <h3 class="text-h3">{{ stats.completedTasks }}</h3>
          <p class="text-subtitle-2 mb-0">Tarefas Concluídas</p>
        </v-card-text>
      </v-card>
    </v-col>
    
    <v-col cols="12" sm="6" md="3">
      <v-card class="text-center" color="warning" variant="tonal">
        <v-card-text>
          <div class="d-flex align-center justify-center mb-2">
            <SvgSprite name="custom-alert" style="width: 24px; height: 24px" />
          </div>
          <h3 class="text-h3">{{ stats.pendingTasks }}</h3>
          <p class="text-subtitle-2 mb-0">Tarefas Pendentes</p>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-row>
    <!-- Sessões Recentes -->
    <v-col cols="12" md="6">
      <UiParentCard title="Sessões de Estudo Recentes">
        <v-list v-if="recentSessions.length > 0">
          <v-list-item
            v-for="session in recentSessions"
            :key="session.id"
            class="px-0"
          >
            <template v-slot:prepend>
              <v-avatar :color="getSubjectColor(session.subjectId)" size="40">
                <SvgSprite name="custom-book" style="width: 20px; height: 20px" />
              </v-avatar>
            </template>
            
            <v-list-item-title>{{ session.title }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ getSubjectName(session.subjectId) }} • {{ formatTime(session.duration) }}
            </v-list-item-subtitle>
            
            <template v-slot:append>
              <v-chip size="small" color="success" variant="tonal">
                {{ new Date(session.date).toLocaleDateString() }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
        
        <div v-else class="text-center py-8">
          <SvgSprite name="custom-book" style="width: 48px; height: 48px; opacity: 0.3" />
          <p class="text-subtitle-1 mt-4 mb-0">Nenhuma sessão de estudo ainda</p>
          <p class="text-caption text-lightText">Comece a estudar para ver suas sessões aqui</p>
        </div>
      </UiParentCard>
    </v-col>

    <!-- Próximas Tarefas -->
    <v-col cols="12" md="6">
      <UiParentCard title="Próximas Tarefas">
        <v-list v-if="upcomingTasks.length > 0">
          <v-list-item
            v-for="task in upcomingTasks"
            :key="task.id"
            class="px-0"
          >
            <template v-slot:prepend>
              <v-checkbox
                :model-value="task.completed"
                @update:model-value="studyStore.toggleTaskComplete(task.id)"
                color="primary"
                hide-details
              />
            </template>
            
            <v-list-item-title>{{ task.title }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ getSubjectName(task.subjectId) }}
            </v-list-item-subtitle>
            
            <template v-slot:append>
              <div class="d-flex flex-column align-end">
                <v-chip 
                  size="small" 
                  :color="getPriorityColor(task.priority)" 
                  variant="tonal"
                  class="mb-1"
                >
                  {{ task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa' }}
                </v-chip>
                <span class="text-caption">
                  {{ new Date(task.dueDate).toLocaleDateString() }}
                </span>
              </div>
            </template>
          </v-list-item>
        </v-list>
        
        <div v-else class="text-center py-8">
          <SvgSprite name="custom-check" style="width: 48px; height: 48px; opacity: 0.3" />
          <p class="text-subtitle-1 mt-4 mb-0">Nenhuma tarefa pendente</p>
          <p class="text-caption text-lightText">Adicione tarefas para acompanhar seu progresso</p>
        </div>
      </UiParentCard>
    </v-col>
  </v-row>

  <!-- Progresso das Disciplinas -->
  <v-row v-if="studyStore.subjects.length > 0">
    <v-col cols="12">
      <UiParentCard title="Progresso das Disciplinas">
        <v-row>
          <v-col 
            v-for="subject in studyStore.subjects" 
            :key="subject.id"
            cols="12" 
            sm="6" 
            md="4"
          >
            <v-card variant="outlined">
              <v-card-text>
                <div class="d-flex align-center mb-3">
                  <v-avatar :color="subject.color" size="32" class="me-3">
                    <SvgSprite name="custom-book" style="width: 16px; height: 16px" />
                  </v-avatar>
                  <div>
                    <h6 class="text-h6 mb-0">{{ subject.name }}</h6>
                    <p class="text-caption mb-0">
                      {{ formatHours(subject.studiedHours) }} / {{ formatHours(subject.totalHours) }}
                    </p>
                  </div>
                </div>
                
                <v-progress-linear
                  :model-value="stats.subjectProgress[subject.id] || 0"
                  :color="subject.color"
                  height="8"
                  rounded
                />
                
                <p class="text-caption text-center mt-2 mb-0">
                  {{ Math.round(stats.subjectProgress[subject.id] || 0) }}% concluído
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </UiParentCard>
    </v-col>
  </v-row>
</template>