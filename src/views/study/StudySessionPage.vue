<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';

const studyStore = useStudyStore();
const page = ref({ title: 'Sessão de Estudo' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Sessão de Estudo', disabled: true, href: '#' }
]);

const startDialog = ref(false);
const endDialog = ref(false);
const sessionForm = ref({
  subjectId: '',
  title: '',
  description: ''
});
const sessionNotes = ref('');

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const currentSubject = computed(() => {
  if (studyStore.currentSession) {
    return studyStore.getSubjectById(studyStore.currentSession.subjectId);
  }
  return null;
});

const recentSessions = computed(() => 
  studyStore.studySessions
    .filter(session => session.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
);

const startSession = () => {
  if (sessionForm.value.subjectId && sessionForm.value.title) {
    studyStore.startStudySession(
      sessionForm.value.subjectId,
      sessionForm.value.title,
      sessionForm.value.description
    );
    startDialog.value = false;
    // Reset form
    sessionForm.value = {
      subjectId: '',
      title: '',
      description: ''
    };
  }
};

const pauseSession = () => {
  studyStore.pauseStudySession();
};

const resumeSession = () => {
  studyStore.resumeStudySession();
};

const openEndDialog = () => {
  endDialog.value = true;
};

const endSession = () => {
  studyStore.endStudySession(sessionNotes.value);
  endDialog.value = false;
  sessionNotes.value = '';
};

const getSubjectName = (subjectId: string) => {
  const subject = studyStore.getSubjectById(subjectId);
  return subject?.name || 'Disciplina não encontrada';
};

const getSubjectColor = (subjectId: string) => {
  const subject = studyStore.getSubjectById(subjectId);
  return subject?.color || 'primary';
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

// Atualizar o timer na interface
let timerInterval: number | null = null;

onMounted(() => {
  studyStore.loadFromLocalStorage();
  
  // Atualizar o timer a cada segundo se estiver estudando
  timerInterval = setInterval(() => {
    if (studyStore.isStudying) {
      // O timer já é atualizado no store
    }
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  
  <!-- Sessão Atual -->
  <v-row class="mb-6">
    <v-col cols="12">
      <UiParentCard v-if="!studyStore.currentSession" title="Iniciar Nova Sessão">
        <div class="text-center py-8">
          <SvgSprite name="custom-play" style="width: 64px; height: 64px; opacity: 0.3" />
          <h5 class="text-h5 mt-4 mb-2">Pronto para estudar?</h5>
          <p class="text-subtitle-1 text-lightText mb-4">
            Inicie uma nova sessão de estudo para acompanhar seu progresso
          </p>
          <v-btn color="primary" size="large" @click="startDialog = true" prepend-icon="mdi-play">
            Iniciar Sessão
          </v-btn>
        </div>
      </UiParentCard>
      
      <UiParentCard v-else title="Sessão em Andamento">
        <div class="text-center py-6">
          <v-avatar :color="currentSubject?.color || 'primary'" size="80" class="mb-4">
            <SvgSprite name="custom-book" style="width: 40px; height: 40px" />
          </v-avatar>
          
          <h4 class="text-h4 mb-2">{{ studyStore.currentSession.title }}</h4>
          <p class="text-subtitle-1 text-lightText mb-2">{{ currentSubject?.name }}</p>
          
          <div class="my-6">
            <h2 class="text-h2 font-weight-bold" :class="studyStore.isStudying ? 'text-primary' : 'text-warning'">
              {{ formatTime(studyStore.sessionTimer) }}
            </h2>
            <p class="text-caption">
              {{ studyStore.isStudying ? 'Estudando...' : 'Pausado' }}
            </p>
          </div>
          
          <div class="d-flex justify-center gap-3">
            <v-btn
              v-if="studyStore.isStudying"
              color="warning"
              @click="pauseSession"
              prepend-icon="mdi-pause"
            >
              Pausar
            </v-btn>
            
            <v-btn
              v-else
              color="primary"
              @click="resumeSession"
              prepend-icon="mdi-play"
            >
              Continuar
            </v-btn>
            
            <v-btn
              color="success"
              @click="openEndDialog"
              prepend-icon="mdi-stop"
            >
              Finalizar
            </v-btn>
          </div>
          
          <p v-if="studyStore.currentSession.description" class="text-body-2 text-lightText mt-4">
            {{ studyStore.currentSession.description }}
          </p>
        </div>
      </UiParentCard>
    </v-col>
  </v-row>

  <!-- Histórico de Sessões -->
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Histórico de Sessões">
        <div v-if="recentSessions.length > 0">
          <v-list>
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
                {{ getSubjectName(session.subjectId) }} • {{ formatDuration(session.duration) }}
                <br>
                {{ new Date(session.date).toLocaleDateString() }} às {{ new Date(session.date).toLocaleTimeString() }}
              </v-list-item-subtitle>
              
              <template v-slot:append>
                <v-chip size="small" color="success" variant="tonal">
                  Concluída
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </div>
        
        <div v-else class="text-center py-8">
          <SvgSprite name="custom-history" style="width: 48px; height: 48px; opacity: 0.3" />
          <p class="text-subtitle-1 mt-4 mb-0">Nenhuma sessão concluída ainda</p>
          <p class="text-caption text-lightText">Suas sessões de estudo aparecerão aqui</p>
        </div>
      </UiParentCard>
    </v-col>
  </v-row>

  <!-- Dialog para Iniciar Sessão -->
  <v-dialog v-model="startDialog" max-width="500px">
    <v-card>
      <v-card-title>Iniciar Nova Sessão</v-card-title>
      
      <v-card-text>
        <v-form>
          <v-select
            v-model="sessionForm.subjectId"
            :items="studyStore.subjects"
            item-title="name"
            item-value="id"
            label="Disciplina"
            variant="outlined"
            class="mb-4"
            required
          />
          
          <v-text-field
            v-model="sessionForm.title"
            label="Título da Sessão"
            variant="outlined"
            class="mb-4"
            placeholder="Ex: Revisão de Matemática"
            required
          />
          
          <v-textarea
            v-model="sessionForm.description"
            label="Descrição (opcional)"
            variant="outlined"
            rows="3"
            placeholder="O que você vai estudar nesta sessão?"
          />
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="startDialog = false">Cancelar</v-btn>
        <v-btn 
          color="primary" 
          @click="startSession"
          :disabled="!sessionForm.subjectId || !sessionForm.title"
        >
          Iniciar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog para Finalizar Sessão -->
  <v-dialog v-model="endDialog" max-width="500px">
    <v-card>
      <v-card-title>Finalizar Sessão</v-card-title>
      
      <v-card-text>
        <p class="text-subtitle-1 mb-4">
          Você estudou por <strong>{{ formatTime(studyStore.sessionTimer) }}</strong>
        </p>
        
        <v-textarea
          v-model="sessionNotes"
          label="Anotações da Sessão (opcional)"
          variant="outlined"
          rows="4"
          placeholder="Como foi a sessão? O que você aprendeu?"
        />
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="endDialog = false">Cancelar</v-btn>
        <v-btn color="success" @click="endSession">
          Finalizar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>