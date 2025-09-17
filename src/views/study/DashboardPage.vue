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
const activeCycle = computed(() => studyStore.getActiveCycle);
const daysUntilExam = computed(() => studyStore.getDaysUntilExam);
const weeklyProgress = computed(() => studyStore.getWeeklyProgress);

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

// Dados para o gráfico de consistência (últimos 30 dias)
const consistencyData = computed(() => {
  const days = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dayStudyTime = studyStore.studySessions
      .filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate.toDateString() === date.toDateString() && session.completed;
      })
      .reduce((total, session) => total + session.duration, 0);
    
    days.push({
      date: date.toISOString().split('T')[0],
      minutes: dayStudyTime,
      hasStudy: dayStudyTime > 0
    });
  }
  
  return days;
});

// Dados para distribuição de tempo por disciplina
const subjectDistribution = computed(() => {
  const distribution = studyStore.subjects.map(subject => {
    const totalMinutes = studyStore.studySessions
      .filter(session => session.subjectId === subject.id && session.completed)
      .reduce((total, session) => total + session.duration, 0);
    
    return {
      name: subject.name,
      color: subject.color,
      minutes: totalMinutes,
      percentage: 0
    };
  });
  
  const totalMinutes = distribution.reduce((sum, item) => sum + item.minutes, 0);
  
  return distribution.map(item => ({
    ...item,
    percentage: totalMinutes > 0 ? (item.minutes / totalMinutes) * 100 : 0
  })).filter(item => item.minutes > 0);
});

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

const getConsistencyStreak = () => {
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const hasStudy = studyStore.studySessions.some(session => {
      const sessionDate = new Date(session.date);
      return sessionDate.toDateString() === date.toDateString() && session.completed;
    });
    
    if (hasStudy) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

const getTodayStudyTime = () => {
  const today = new Date();
  return studyStore.studySessions
    .filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate.toDateString() === today.toDateString() && session.completed;
    })
    .reduce((total, session) => total + session.duration, 0);
};

const getWeeklyGoalProgress = () => {
  if (!activeCycle.value) return 0;
  return Math.min((stats.value.weeklyHours / activeCycle.value.weeklyGoal) * 100, 100);
};

onMounted(() => {
  studyStore.loadFromLocalStorage();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  
  <!-- Cards de Estatísticas Principais -->
  <v-row class="mb-6">
    <!-- Tempo de Estudo Hoje -->
    <v-col cols="12" sm="6" md="3">
      <v-card class="stat-card" color="primary" variant="tonal" height="140">
        <v-card-text class="pa-6">
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="stat-icon">
              <SvgSprite name="custom-clock" style="width: 28px; height: 28px" />
            </div>
            <v-chip size="small" color="primary" variant="flat">Hoje</v-chip>
          </div>
          <h2 class="text-h2 font-weight-bold mb-1">{{ formatTime(getTodayStudyTime()) }}</h2>
          <p class="text-subtitle-2 mb-0 opacity-80">Tempo de Estudo</p>
        </v-card-text>
      </v-card>
    </v-col>
    
    <!-- Desempenho Semanal -->
    <v-col cols="12" sm="6" md="3">
      <v-card class="stat-card" color="success" variant="tonal" height="140">
        <v-card-text class="pa-6">
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="stat-icon">
              <SvgSprite name="custom-trending-up" style="width: 28px; height: 28px" />
            </div>
            <v-chip size="small" color="success" variant="flat">{{ Math.round(getWeeklyGoalProgress()) }}%</v-chip>
          </div>
          <h2 class="text-h2 font-weight-bold mb-1">{{ formatHours(stats.weeklyHours) }}</h2>
          <p class="text-subtitle-2 mb-0 opacity-80">Desempenho</p>
          <div class="text-caption mt-1">
            Meta: {{ activeCycle?.weeklyGoal || 40 }}h/semana
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    
    <!-- Progresso no Edital -->
    <v-col cols="12" sm="6" md="3">
      <v-card class="stat-card" color="info" variant="tonal" height="140">
        <v-card-text class="pa-6">
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="stat-icon">
              <SvgSprite name="custom-chart" style="width: 28px; height: 28px" />
            </div>
            <v-chip size="small" color="info" variant="flat">96%</v-chip>
          </div>
          <h2 class="text-h2 font-weight-bold mb-1">96%</h2>
          <p class="text-subtitle-2 mb-0 opacity-80">Progresso no Edital</p>
          <div class="text-caption mt-1">
            {{ stats.completedTasks }} Tópicos Concluídos
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    
    <!-- Dias até a Prova -->
    <v-col cols="12" sm="6" md="3">
      <v-card class="stat-card" color="warning" variant="tonal" height="140">
        <v-card-text class="pa-6">
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="stat-icon">
              <SvgSprite name="custom-calendar" style="width: 28px; height: 28px" />
            </div>
            <v-chip size="small" color="warning" variant="flat">Prova</v-chip>
          </div>
          <h2 class="text-h2 font-weight-bold mb-1">{{ daysUntilExam || 0 }}</h2>
          <p class="text-subtitle-2 mb-0 opacity-80">Dias Restantes</p>
          <div class="text-caption mt-1">
            {{ activeCycle?.name || 'Nenhum ciclo ativo' }}
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-row>
    <!-- Consistência nos Estudos -->
    <v-col cols="12" lg="8">
      <UiParentCard>
        <template v-slot:title>
          <div class="d-flex align-center">
            <SvgSprite name="custom-calendar" style="width: 24px; height: 24px" class="me-3" />
            <div>
              <h5 class="text-h5 mb-0">Consistência nos Estudos</h5>
              <p class="text-caption text-lightText mb-0">
                Você está há {{ getConsistencyStreak() }} dias sem falhar! 🔥
              </p>
            </div>
          </div>
        </template>

        <div class="consistency-chart pa-4">
          <div class="d-flex justify-space-between align-center mb-4">
            <div class="text-caption text-lightText">Últimos 30 dias</div>
            <div class="d-flex align-center gap-4">
              <div class="d-flex align-center">
                <div class="consistency-dot success me-2"></div>
                <span class="text-caption">Estudou</span>
              </div>
              <div class="d-flex align-center">
                <div class="consistency-dot error me-2"></div>
                <span class="text-caption">Não estudou</span>
              </div>
            </div>
          </div>
          
          <div class="consistency-grid">
            <div
              v-for="(day, index) in consistencyData"
              :key="index"
              class="consistency-day"
              :class="day.hasStudy ? 'has-study' : 'no-study'"
              :title="`${new Date(day.date).toLocaleDateString()}: ${formatTime(day.minutes)}`"
            >
            </div>
          </div>
        </div>
      </UiParentCard>

      <!-- Painel de Disciplinas -->
      <UiParentCard title="Painel" class="mt-6">
        <div class="subjects-panel">
          <div class="panel-header mb-4">
            <div class="d-flex align-center justify-space-between">
              <h6 class="text-h6">Disciplinas</h6>
              <div class="d-flex align-center gap-2">
                <span class="text-caption">Tempo</span>
                <v-icon icon="mdi-check" size="16" color="success" />
                <v-icon icon="mdi-close" size="16" color="error" />
                <v-icon icon="mdi-pencil" size="16" color="warning" />
                <v-icon icon="mdi-close" size="16" color="error" />
              </div>
            </div>
          </div>
          
          <div class="subjects-table">
            <div
              v-for="subject in studyStore.subjects"
              :key="subject.id"
              class="subject-row"
            >
              <div class="d-flex align-center">
                <v-avatar :color="subject.color" size="24" class="me-3">
                  <span class="text-caption font-weight-bold">
                    {{ subject.name.charAt(0).toUpperCase() }}
                  </span>
                </v-avatar>
                <div class="subject-info">
                  <h6 class="text-subtitle-2 mb-0">{{ subject.name }}</h6>
                </div>
              </div>
              
              <div class="subject-stats">
                <div class="time-cell">{{ formatHours(subject.studiedHours) }}</div>
                <div class="status-indicators">
                  <v-icon 
                    :icon="subject.studiedHours > 0 ? 'mdi-check' : 'mdi-minus'" 
                    size="16" 
                    :color="subject.studiedHours > 0 ? 'success' : 'grey'"
                  />
                  <v-icon 
                    :icon="subject.studiedHours >= subject.totalHours * 0.5 ? 'mdi-check' : 'mdi-minus'" 
                    size="16" 
                    :color="subject.studiedHours >= subject.totalHours * 0.5 ? 'success' : 'grey'"
                  />
                  <v-icon 
                    :icon="subject.studiedHours >= subject.totalHours * 0.8 ? 'mdi-check' : 'mdi-minus'" 
                    size="16" 
                    :color="subject.studiedHours >= subject.totalHours * 0.8 ? 'success' : 'grey'"
                  />
                  <v-icon 
                    :icon="subject.studiedHours >= subject.totalHours ? 'mdi-check' : 'mdi-minus'" 
                    size="16" 
                    :color="subject.studiedHours >= subject.totalHours ? 'success' : 'grey'"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </UiParentCard>
    </v-col>

    <!-- Sidebar Direita -->
    <v-col cols="12" lg="4">
      <!-- Data da Prova -->
      <UiParentCard v-if="activeCycle">
        <template v-slot:title>
          <div class="d-flex align-center">
            <SvgSprite name="custom-calendar" style="width: 20px; height: 20px" class="me-2" />
            <span class="text-h6">Data da Prova</span>
          </div>
        </template>

        <div class="exam-info text-center pa-4">
          <div class="exam-countdown mb-3">
            <h1 class="text-h1 font-weight-bold text-primary">{{ daysUntilExam }}</h1>
            <p class="text-subtitle-1 text-lightText">dias restantes</p>
          </div>
          
          <v-divider class="my-3" />
          
          <div class="exam-details">
            <p class="text-body-2 mb-2">
              <strong>{{ activeCycle.name }}</strong>
            </p>
            <p class="text-caption text-lightText">
              Acompanhe aqui quantos dias faltam para a sua prova
              <router-link to="/main/cycles" class="text-primary text-decoration-none ml-1">
                Gear Prova
              </router-link>
            </p>
          </div>
        </div>
      </UiParentCard>

      <!-- Metas de Estudos Semanal -->
      <UiParentCard title="Metas de Estudos Semanal" class="mt-6">
        <div class="weekly-goals pa-4">
          <div class="goal-item mb-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-body-2">Horas de Estudo</span>
              <span class="text-body-2 font-weight-bold">{{ formatHours(stats.weeklyHours) }}</span>
            </div>
            <v-progress-linear
              :model-value="getWeeklyGoalProgress()"
              color="success"
              height="8"
              rounded
              class="mb-1"
            />
            <div class="text-caption text-lightText">
              Meta: {{ activeCycle?.weeklyGoal || 40 }}h
            </div>
          </div>
          
          <div class="goal-item">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-body-2">Questões</span>
              <span class="text-body-2 font-weight-bold">{{ stats.completedTasks }}</span>
            </div>
            <v-progress-linear
              :model-value="Math.min((stats.completedTasks / 100) * 100, 100)"
              color="info"
              height="8"
              rounded
              class="mb-1"
            />
            <div class="text-caption text-lightText">
              Meta: 100 questões
            </div>
          </div>
        </div>
      </UiParentCard>

      <!-- Estudos Semanal (Gráfico) -->
      <UiParentCard title="Estudos Semanal" class="mt-6">
        <div class="weekly-chart pa-4">
          <div class="chart-container">
            <div class="chart-bars">
              <div class="chart-bar">
                <div class="bar-container">
                  <div class="bar" style="height: 60%; background-color: #4caf50;"></div>
                </div>
                <span class="bar-label">SEG</span>
              </div>
              <div class="chart-bar">
                <div class="bar-container">
                  <div class="bar" style="height: 80%; background-color: #4caf50;"></div>
                </div>
                <span class="bar-label">TER</span>
              </div>
              <div class="chart-bar">
                <div class="bar-container">
                  <div class="bar" style="height: 40%; background-color: #4caf50;"></div>
                </div>
                <span class="bar-label">QUA</span>
              </div>
              <div class="chart-bar">
                <div class="bar-container">
                  <div class="bar" style="height: 90%; background-color: #4caf50;"></div>
                </div>
                <span class="bar-label">QUI</span>
              </div>
              <div class="chart-bar">
                <div class="bar-container">
                  <div class="bar" style="height: 70%; background-color: #4caf50;"></div>
                </div>
                <span class="bar-label">SEX</span>
              </div>
              <div class="chart-bar">
                <div class="bar-container">
                  <div class="bar" style="height: 30%; background-color: #4caf50;"></div>
                </div>
                <span class="bar-label">SAB</span>
              </div>
              <div class="chart-bar">
                <div class="bar-container">
                  <div class="bar" style="height: 50%; background-color: #4caf50;"></div>
                </div>
                <span class="bar-label">DOM</span>
              </div>
            </div>
            
            <div class="chart-legend mt-3">
              <div class="d-flex align-center">
                <div class="legend-dot" style="background-color: #4caf50;"></div>
                <span class="text-caption ml-2">Total Estudado: {{ formatHours(stats.weeklyHours) }}</span>
              </div>
            </div>
          </div>
        </div>
      </UiParentCard>

      <!-- Tempo de Estudo (Gráfico Pizza) -->
      <UiParentCard title="Tempo de Estudo" class="mt-6">
        <div class="study-time-chart pa-4">
          <div class="chart-container text-center">
            <!-- Simulação de gráfico pizza -->
            <div class="pie-chart-container">
              <div class="pie-chart">
                <div class="pie-center">
                  <h3 class="text-h3 font-weight-bold">{{ formatTime(getTodayStudyTime()) }}</h3>
                  <p class="text-caption">Hoje</p>
                </div>
              </div>
            </div>
            
            <div class="chart-legend mt-4">
              <div v-if="subjectDistribution.length > 0">
                <div
                  v-for="item in subjectDistribution.slice(0, 3)"
                  :key="item.name"
                  class="legend-item mb-2"
                >
                  <div class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                      <div 
                        class="legend-dot me-2" 
                        :style="{ backgroundColor: getSubjectColor(studyStore.subjects.find(s => s.name === item.name)?.id || '') }"
                      ></div>
                      <span class="text-caption">{{ item.name }}</span>
                    </div>
                    <span class="text-caption font-weight-bold">{{ formatTime(item.minutes) }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4">
                <p class="text-caption text-lightText">Nenhum estudo registrado hoje</p>
              </div>
            </div>
          </div>
        </div>
      </UiParentCard>
    </v-col>
  </v-row>

  <!-- Seção Inferior -->
  <v-row>
    <!-- Revisões -->
    <v-col cols="12" md="6">
      <UiParentCard title="Revisões">
        <div class="reviews-section">
          <div class="empty-state text-center py-8">
            <SvgSprite name="custom-refresh" style="width: 48px; height: 48px; opacity: 0.3" />
            <p class="text-subtitle-1 mt-4 mb-2">Você não tem revisões agendadas para hoje.</p>
          </div>
        </div>
      </UiParentCard>
    </v-col>

    <!-- Planejamento -->
    <v-col cols="12" md="6">
      <UiParentCard title="Planejamento">
        <div class="planning-section">
          <div v-if="studyStore.studyPlans.length > 0" class="planning-list">
            <div
              v-for="plan in studyStore.studyPlans.slice(0, 4)"
              :key="plan.id"
              class="planning-item"
            >
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-avatar :color="plan.color" size="24" class="me-3">
                    <SvgSprite name="custom-calendar" style="width: 12px; height: 12px" />
                  </v-avatar>
                  <div>
                    <h6 class="text-subtitle-2 mb-0">{{ plan.name }}</h6>
                    <p class="text-caption text-lightText mb-0">
                      {{ new Date(plan.startDate).toLocaleDateString() }} - {{ new Date(plan.endDate).toLocaleDateString() }}
                    </p>
                  </div>
                </div>
                <div class="text-caption">
                  {{ plan.dailyGoal }}h/{{ plan.weeklyGoal }}h
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state text-center py-8">
            <SvgSprite name="custom-calendar" style="width: 48px; height: 48px; opacity: 0.3" />
            <p class="text-subtitle-1 mt-4 mb-2">Nenhum plano criado</p>
            <v-btn color="primary" size="small" prepend-icon="mdi-plus">
              <router-link to="/main/plans/new" class="text-decoration-none text-white">
                Criar Plano
              </router-link>
            </v-btn>
          </div>
        </div>
      </UiParentCard>
    </v-col>
  </v-row>

  <!-- Lembretes e Últimas Atividades -->
  <v-row>
    <!-- Lembretes -->
    <v-col cols="12" md="6">
      <UiParentCard title="Lembretes">
        <div class="reminders-section">
          <div class="reminder-item mb-3">
            <v-card variant="outlined" class="pa-3">
              <div class="d-flex align-center">
                <v-avatar color="info" size="32" class="me-3">
                  <SvgSprite name="custom-bell" style="width: 16px; height: 16px" />
                </v-avatar>
                <div>
                  <h6 class="text-subtitle-2 mb-1">Lembrete teste</h6>
                  <div class="d-flex align-center gap-2">
                    <v-chip size="x-small" color="info" variant="tonal">IMPORTANTE</v-chip>
                    <v-chip size="x-small" color="success" variant="tonal">PRIVADO</v-chip>
                    <v-chip size="x-small" color="warning" variant="tonal">GERAL</v-chip>
                    <v-icon icon="mdi-link" size="16" color="primary" />
                  </div>
                </div>
              </div>
            </v-card>
          </div>
          
          <div class="text-center">
            <v-btn color="success" size="small" prepend-icon="mdi-plus">
              Adicionar Lembrete
            </v-btn>
          </div>
        </div>
      </UiParentCard>
    </v-col>

    <!-- Últimas Atividades -->
    <v-col cols="12" md="6">
      <UiParentCard title="Últimas Atividades">
        <template v-slot:action>
          <span class="text-caption">HOJE</span>
        </template>

        <div class="activities-section">
          <div v-if="recentSessions.length > 0">
            <div
              v-for="session in recentSessions.slice(0, 3)"
              :key="session.id"
              class="activity-item mb-3"
            >
              <div class="d-flex align-center">
                <v-avatar :color="getSubjectColor(session.subjectId)" size="32" class="me-3">
                  <SvgSprite name="custom-book" style="width: 16px; height: 16px" />
                </v-avatar>
                <div class="flex-grow-1">
                  <h6 class="text-subtitle-2 mb-1">{{ getSubjectName(session.subjectId) }}</h6>
                  <p class="text-caption text-lightText mb-0">
                    {{ session.title }} • {{ formatTime(session.duration) }}
                  </p>
                </div>
                <div class="text-caption text-lightText">
                  {{ new Date(session.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }}
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state text-center py-6">
            <SvgSprite name="custom-clock" style="width: 40px; height: 40px; opacity: 0.3" />
            <p class="text-subtitle-2 mt-3 mb-0">Nenhuma atividade hoje</p>
          </div>
        </div>
      </UiParentCard>
    </v-col>
  </v-row>
</template>

<style scoped>
/* Cards de Estatísticas */
.stat-card {
  transition: all 0.3s ease;
  border-radius: 16px;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Gráfico de Consistência */
.consistency-chart {
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 12px;
}

.consistency-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
  max-width: 100%;
}

.consistency-day {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.consistency-day.has-study {
  background-color: #4caf50;
}

.consistency-day.no-study {
  background-color: #f44336;
  opacity: 0.3;
}

.consistency-day:hover {
  transform: scale(1.2);
  opacity: 1;
}

.consistency-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.consistency-dot.success {
  background-color: #4caf50;
}

.consistency-dot.error {
  background-color: #f44336;
}

/* Painel de Disciplinas */
.subjects-panel {
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 12px;
  padding: 1rem;
}

.subjects-table {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.subject-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: rgba(var(--v-theme-surface), 0.8);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
  transition: all 0.2s ease;
}

.subject-row:hover {
  background: rgba(var(--v-theme-surface), 1);
  transform: translateX(4px);
}

.subject-info {
  flex-grow: 1;
}

.subject-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.time-cell {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  min-width: 60px;
  text-align: right;
}

.status-indicators {
  display: flex;
  gap: 0.5rem;
}

/* Gráfico Semanal */
.weekly-chart {
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 12px;
}

.chart-bars {
  display: flex;
  align-items: end;
  justify-content: space-between;
  height: 120px;
  padding: 0 1rem;
}

.chart-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-container {
  height: 80px;
  width: 20px;
  background: rgba(var(--v-theme-borderLight), 0.2);
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: end;
  margin-bottom: 0.5rem;
}

.bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
}

.bar-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(var(--v-theme-lightText));
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

/* Gráfico Pizza */
.pie-chart-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
}

.pie-chart {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(
    #2196f3 0deg 270deg,
    #e3f2fd 270deg 360deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.pie-center {
  width: 80px;
  height: 80px;
  background: rgb(var(--v-theme-surface));
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Seções Gerais */
.exam-info {
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 12px;
}

.exam-countdown h1 {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-darkprimary)));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.weekly-goals {
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 12px;
}

.goal-item {
  padding: 1rem;
  background: rgba(var(--v-theme-surface), 0.8);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

.planning-item {
  padding: 0.75rem;
  background: rgba(var(--v-theme-surface), 0.8);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
  margin-bottom: 0.75rem;
  transition: all 0.2s ease;
}

.planning-item:hover {
  background: rgba(var(--v-theme-surface), 1);
  transform: translateX(4px);
}

.activity-item {
  padding: 0.75rem;
  background: rgba(var(--v-theme-surface), 0.8);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
  transition: all 0.2s ease;
}

.activity-item:hover {
  background: rgba(var(--v-theme-surface), 1);
  transform: translateX(4px);
}

.reminder-item {
  transition: all 0.2s ease;
}

.reminder-item:hover {
  transform: translateX(4px);
}

/* Estados Vazios */
.empty-state {
  background: rgba(var(--v-theme-containerBg), 0.1);
  border-radius: 8px;
  border: 2px dashed rgba(var(--v-theme-borderLight), 0.3);
}

/* Responsividade */
@media (max-width: 960px) {
  .consistency-grid {
    grid-template-columns: repeat(7, 1fr);
  }
  
  .chart-bars {
    padding: 0 0.5rem;
  }
  
  .bar-container {
    width: 16px;
  }
}

@media (max-width: 600px) {
  .consistency-grid {
    grid-template-columns: repeat(5, 1fr);
  }
  
  .consistency-day {
    width: 16px;
    height: 16px;
  }
}

/* Animações */
.v-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-bar:hover .bar {
  filter: brightness(1.1);
  transform: scaleY(1.05);
}

/* Melhorias visuais */
.v-progress-linear {
  border-radius: 8px;
}

.v-chip {
  font-weight: 500;
}
</style>