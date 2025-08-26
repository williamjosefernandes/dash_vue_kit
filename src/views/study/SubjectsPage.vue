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

const dialog = ref(false);
const editMode = ref(false);
const currentSubject = ref({
  id: '',
  name: '',
  description: '',
  color: 'primary',
  totalHours: 0,
  studiedHours: 0
});

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
  if (editMode.value) {
    studyStore.updateSubject(currentSubject.value.id, currentSubject.value);
  } else {
    studyStore.addSubject(currentSubject.value);
  }
  dialog.value = false;
};

const deleteSubject = (id: string) => {
  if (confirm('Tem certeza que deseja excluir esta disciplina? Todas as tarefas e sessões relacionadas também serão excluídas.')) {
    studyStore.deleteSubject(id);
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
      <v-btn color="primary" @click="openDialog()" prepend-icon="mdi-plus">
        Nova Disciplina
      </v-btn>
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
                  <v-list-item @click="deleteSubject(subject.id)" class="text-error">
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
      <v-btn color="primary" @click="openDialog()" prepend-icon="mdi-plus">
        Adicionar Primeira Disciplina
      </v-btn>
    </div>
  </UiParentCard>

  <!-- Dialog para Adicionar/Editar Disciplina -->
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title>
        {{ editMode ? 'Editar Disciplina' : 'Nova Disciplina' }}
      </v-card-title>
      
      <v-card-text>
        <v-form>
          <v-text-field
            v-model="currentSubject.name"
            label="Nome da Disciplina"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-4"
          />
          
          <v-textarea
            v-model="currentSubject.description"
            label="Descrição"
            variant="outlined"
            rows="3"
            class="mb-4"
          />
          
          <v-text-field
            v-model.number="currentSubject.totalHours"
            label="Total de Horas Planejadas"
            type="number"
            :rules="[rules.required, rules.minHours]"
            variant="outlined"
            class="mb-4"
          />
          
          <div class="mb-4">
            <v-label class="mb-2">Cor da Disciplina</v-label>
            <v-chip-group v-model="currentSubject.color" mandatory>
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
        <v-btn color="primary" @click="saveSubject">
          {{ editMode ? 'Salvar' : 'Adicionar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>