<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';

const studyStore = useStudyStore();
const page = ref({ title: 'Disciplinas' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Disciplinas', disabled: true, href: '#' }
]);

const form = ref();
const valid = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const editMode = ref(false);
const currentSubject = ref({
  id: '',
  name: '',
  description: '',
  color: 'primary',
  totalHours: 0,
  studiedHours: 0
});
const subjectToDelete = ref<any>(null);

const colors = [
  { name: 'Azul', value: 'primary' },
  { name: 'Verde', value: 'success' },
  { name: 'Laranja', value: 'warning' },
  { name: 'Vermelho', value: 'error' },
  { name: 'Roxo', value: 'secondary' },
  { name: 'Ciano', value: 'info' }
];

const rules = {
  required: (v: string) => !!v || 'Campo obrigatório',
  minHours: (v: number) => v >= 0 || 'Horas devem ser positivas'
};

const openDialog = (subject?: any) => {
  if (subject) {
    editMode.value = true;
    currentSubject.value = { ...subject };
  } else {
    editMode.value = false;
    currentSubject.value = {
      id: '',
      name: '',
      description: '',
      color: 'primary',
      totalHours: 0,
      studiedHours: 0
    };
  }
  dialog.value = true;
};

const saveSubject = () => {
  if (!form.value.validate()) return;
  
  if (editMode.value) {
    studyStore.updateSubject(currentSubject.value.id, currentSubject.value);
  } else {
    studyStore.addSubject(currentSubject.value);
  }
  dialog.value = false;
};

const openDeleteDialog = (subject: any) => {
  subjectToDelete.value = subject;
  deleteDialog.value = true;
};

const confirmDelete = () => {
  if (subjectToDelete.value) {
    studyStore.deleteSubject(subjectToDelete.value.id);
    deleteDialog.value = false;
    subjectToDelete.value = null;
  }
};

const getProgressPercentage = (subject: any) => {
  return subject.totalHours > 0 ? (subject.studiedHours / subject.totalHours) * 100 : 0;
};

const formatHours = (hours: number) => {
  return `${hours.toFixed(1)}h`;
};
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  
  <UiParentCard title="Minhas Disciplinas">
    <template v-slot:action>
      <div class="d-flex gap-2">
        <v-btn color="primary" @click="openDialog()" prepend-icon="mdi-plus">
          Nova Disciplina
        </v-btn>
        <v-btn color="secondary" variant="outlined" prepend-icon="mdi-plus">
          <router-link to="/main/subjects/new" class="text-decoration-none">
            Criar Avançada
          </router-link>
        </v-btn>
      </div>
    </template>

    <v-row v-if="studyStore.subjects.length > 0">
      <v-col 
        v-for="subject in studyStore.subjects" 
        :key="subject.id"
        cols="12" 
        sm="6" 
        md="4"
      >
        <v-card class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-3">
              <v-avatar :color="subject.color" size="40">
                <SvgSprite name="custom-book" style="width: 20px; height: 20px" />
              </v-avatar>
              
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn icon size="small" variant="text" v-bind="props">
                    <SvgSprite name="custom-more" style="width: 16px; height: 16px" />
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item @click="openDialog(subject)">
                    <template v-slot:prepend>
                      <SvgSprite name="custom-edit" style="width: 16px; height: 16px" />
                    </template>
                    <v-list-item-title>Editar</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="openDeleteDialog(subject)" class="text-error">
                    <template v-slot:prepend>
                      <SvgSprite name="custom-trash" style="width: 16px; height: 16px" />
                    </template>
                    <v-list-item-title>Excluir</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
            
            <h6 class="text-h6 mb-2">{{ subject.name }}</h6>
            <p class="text-caption text-lightText mb-3">{{ subject.description }}</p>
            
            <div class="mb-3">
              <div class="d-flex justify-space-between mb-1">
                <span class="text-caption">Progresso</span>
                <span class="text-caption">
                  {{ formatHours(subject.studiedHours) }} / {{ formatHours(subject.totalHours) }}
                </span>
              </div>
              <v-progress-linear
                :model-value="getProgressPercentage(subject)"
                :color="subject.color"
                height="6"
                rounded
              />
              <p class="text-caption text-center mt-1 mb-0">
                {{ Math.round(getProgressPercentage(subject)) }}% concluído
              </p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <div v-else class="text-center py-12">
      <SvgSprite name="custom-book" style="width: 64px; height: 64px; opacity: 0.3" />
      <h5 class="text-h5 mt-4 mb-2">Nenhuma disciplina cadastrada</h5>
      <p class="text-subtitle-1 text-lightText mb-4">
        Comece adicionando suas disciplinas para organizar seus estudos
      </p>
      <v-btn color="primary" prepend-icon="mdi-plus">
        <router-link to="/main/subjects/new" class="text-decoration-none text-white">
          Adicionar Primeira Disciplina
        </router-link>
      </v-btn>
    </div>
  </UiParentCard>

  <!-- Dialog para Adicionar/Editar Disciplina -->
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card class="dialog-card">
      <v-card-title class="dialog-header">
        <div class="d-flex align-center">
          <v-avatar :color="currentSubject.color" size="32" class="me-3">
            <SvgSprite name="custom-book" style="width: 16px; height: 16px" />
          </v-avatar>
          <span>{{ editMode ? 'Editar Disciplina' : 'Nova Disciplina' }}</span>
        </div>
      </v-card-title>
      
      <v-card-text class="pa-6">
        <v-form ref="form" v-model="valid">
          <div class="mb-4">
            <v-label class="mb-2">Nome da Disciplina *</v-label>
            <v-text-field
              v-model="currentSubject.name"
              :rules="[rules.required]"
              variant="outlined"
              placeholder="Ex: Matemática, Física, História..."
              density="comfortable"
              hide-details="auto"
            />
          </div>
          
          <div class="mb-4">
            <v-label class="mb-2">Descrição</v-label>
            <v-textarea
              v-model="currentSubject.description"
              variant="outlined"
              rows="3"
              placeholder="Descreva os objetivos e conteúdo desta disciplina..."
              density="comfortable"
              hide-details="auto"
            />
          </div>
          
          <div class="mb-4">
            <v-label class="mb-2">Horas Totais Planejadas</v-label>
            <v-text-field
              v-model.number="currentSubject.totalHours"
              type="number"
              :rules="[rules.minHours]"
              variant="outlined"
              min="0"
              step="0.5"
              placeholder="0"
              density="comfortable"
              hide-details="auto"
            />
          </div>
          
          <div class="mb-4">
            <v-label class="mb-2">Cor da Disciplina</v-label>
            <div class="color-selection mt-3">
              <div class="color-grid">
                <div
                  v-for="color in colors"
                  :key="color.value"
                  class="color-option"
                  :class="{ 'selected': currentSubject.color === color.value }"
                  @click="currentSubject.color = color.value"
                >
                  <div class="color-circle" :style="{ backgroundColor: color.color }">
                    <v-icon 
                      v-if="currentSubject.color === color.value"
                      icon="mdi-check"
                      color="white"
                      size="16"
                    />
                  </div>
                  <span class="color-name">{{ color.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-form>
      </v-card-text>
      
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn @click="dialog = false" variant="outlined">
          Cancelar
        </v-btn>
        <v-btn 
          color="primary" 
          @click="saveSubject"
          :disabled="!valid"
          variant="flat"
        >
          {{ editMode ? 'Salvar Alterações' : 'Criar Disciplina' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog de Confirmação de Exclusão -->
  <v-dialog v-model="deleteDialog" max-width="500px" persistent>
    <v-card class="dialog-card">
      <v-card-title class="dialog-header text-error">
        <div class="d-flex align-center">
          <v-avatar color="error" size="32" class="me-3">
            <SvgSprite name="custom-trash" style="width: 16px; height: 16px" />
          </v-avatar>
          <span>Excluir Disciplina</span>
        </div>
      </v-card-title>
      
      <v-card-text class="pa-6">
        <div class="text-center mb-4">
          <v-avatar :color="subjectToDelete?.color || 'error'" size="64" class="mb-4">
            <SvgSprite name="custom-book" style="width: 32px; height: 32px" />
          </v-avatar>
          
          <h5 class="text-h5 mb-2">{{ subjectToDelete?.name }}</h5>
          <p class="text-subtitle-1 text-lightText mb-4">
            Tem certeza que deseja excluir esta disciplina?
          </p>
        </div>
        
        <v-alert type="warning" variant="tonal" class="mb-4">
          <div class="text-body-2">
            <strong>Atenção:</strong> Esta ação não pode ser desfeita e irá excluir:
            <ul class="mt-2 ml-4">
              <li>Todas as tarefas relacionadas a esta disciplina</li>
              <li>Todas as sessões de estudo registradas</li>
              <li>Todo o progresso e estatísticas</li>
            </ul>
          </div>
        </v-alert>
        
        <div class="d-flex align-center justify-center">
          <div class="text-center">
            <div class="d-flex align-center mb-2">
              <SvgSprite name="custom-clock" style="width: 16px; height: 16px" class="me-2" />
              <span class="text-body-2">{{ formatHours(subjectToDelete?.studiedHours || 0) }} estudadas</span>
            </div>
            <div class="d-flex align-center">
              <SvgSprite name="custom-target" style="width: 16px; height: 16px" class="me-2" />
              <span class="text-body-2">{{ formatHours(subjectToDelete?.totalHours || 0) }} planejadas</span>
            </div>
          </div>
        </div>
      </v-card-text>
      
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn @click="deleteDialog = false; subjectToDelete = null;" variant="outlined">
          Cancelar
        </v-btn>
        <v-btn 
          color="error" 
          @click="confirmDelete"
          variant="flat"
          prepend-icon="mdi-delete"
        >
          Excluir Disciplina
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Dialog Styling */
.dialog-card {
  border-radius: 16px;
}

.dialog-header {
  background: rgba(var(--v-theme-containerBg), 0.5);
  padding: 1.5rem !important;
}

/* Color Selection */
.color-selection {
  padding: 1rem;
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-borderLight), 0.3);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.75rem;
}

.color-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(var(--v-theme-surface), 0.8);
  border: 2px solid transparent;
}

.color-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: rgba(var(--v-theme-surface), 1);
}

.color-option.selected {
  border-color: rgba(var(--v-theme-primary), 0.5);
  background: rgba(var(--v-theme-primary), 0.05);
  transform: translateY(-1px);
}

.color-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.color-option:hover .color-circle {
  transform: scale(1.1);
}

.color-name {
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  color: rgb(var(--v-theme-darkText));
}

.color-option.selected .color-name {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>