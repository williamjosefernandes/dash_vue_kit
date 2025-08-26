<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';
import type { Topic, Subtopic } from '@/types/study';

const router = useRouter();
const studyStore = useStudyStore();

const page = ref({ title: 'Nova Disciplina' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Disciplinas', disabled: false, href: '/main/subjects' },
  { title: 'Nova Disciplina', disabled: true, href: '#' }
]);

const form = ref();
const valid = ref(false);
const loading = ref(false);

const subjectData = ref({
  name: '',
  description: '',
  color: 'primary',
  totalHours: 0,
  studiedHours: 0,
  topics: [] as Topic[]
});

const colors = [
  { name: 'Azul', value: 'primary', color: '#4680FF' },
  { name: 'Verde', value: 'success', color: '#2ca87f' },
  { name: 'Laranja', value: 'warning', color: '#e58a00' },
  { name: 'Vermelho', value: 'error', color: '#dc2626' },
  { name: 'Roxo', value: 'secondary', color: '#5B6B79' },
  { name: 'Ciano', value: 'info', color: '#3ec9d6' }
];

const rules = {
  required: (v: string) => !!v || 'Campo obrigatório',
  minHours: (v: number) => v >= 0 || 'Horas devem ser positivas'
};

// Dialog para adicionar/editar tópico
const topicDialog = ref(false);
const editingTopic = ref(false);
const currentTopic = ref({
  id: '',
  name: '',
  description: '',
  estimatedHours: 0,
  studiedHours: 0,
  completed: false,
  subtopics: [] as Subtopic[],
  order: 0
});

// Dialog para adicionar/editar subtópico
const subtopicDialog = ref(false);
const editingSubtopic = ref(false);
const currentSubtopic = ref({
  id: '',
  name: '',
  description: '',
  estimatedHours: 0,
  studiedHours: 0,
  completed: false,
  order: 0
});
const currentTopicIndex = ref(-1);

const totalEstimatedHours = computed(() => {
  return subjectData.value.topics.reduce((total, topic) => {
    const topicHours = topic.estimatedHours + topic.subtopics.reduce((subTotal, subtopic) => subTotal + subtopic.estimatedHours, 0);
    return total + topicHours;
  }, 0);
});

const openTopicDialog = (topic?: Topic, index?: number) => {
  if (topic && typeof index === 'number') {
    editingTopic.value = true;
    currentTopic.value = { ...topic };
  } else {
    editingTopic.value = false;
    currentTopic.value = {
      id: '',
      name: '',
      description: '',
      estimatedHours: 0,
      studiedHours: 0,
      completed: false,
      subtopics: [],
      order: subjectData.value.topics.length
    };
  }
  topicDialog.value = true;
};

const saveTopic = () => {
  if (editingTopic.value) {
    const index = subjectData.value.topics.findIndex(t => t.id === currentTopic.value.id);
    if (index !== -1) {
      subjectData.value.topics[index] = { ...currentTopic.value };
    }
  } else {
    const newTopic: Topic = {
      ...currentTopic.value,
      id: Date.now().toString()
    };
    subjectData.value.topics.push(newTopic);
  }
  topicDialog.value = false;
  updateTotalHours();
};

const deleteTopic = (index: number) => {
  if (confirm('Tem certeza que deseja excluir este tópico e todos os seus subtópicos?')) {
    subjectData.value.topics.splice(index, 1);
    updateTotalHours();
  }
};

const openSubtopicDialog = (topicIndex: number, subtopic?: Subtopic, subtopicIndex?: number) => {
  currentTopicIndex.value = topicIndex;
  
  if (subtopic && typeof subtopicIndex === 'number') {
    editingSubtopic.value = true;
    currentSubtopic.value = { ...subtopic };
  } else {
    editingSubtopic.value = false;
    currentSubtopic.value = {
      id: '',
      name: '',
      description: '',
      estimatedHours: 0,
      studiedHours: 0,
      completed: false,
      order: subjectData.value.topics[topicIndex].subtopics.length
    };
  }
  subtopicDialog.value = true;
};

const saveSubtopic = () => {
  const topic = subjectData.value.topics[currentTopicIndex.value];
  
  if (editingSubtopic.value) {
    const index = topic.subtopics.findIndex(s => s.id === currentSubtopic.value.id);
    if (index !== -1) {
      topic.subtopics[index] = { ...currentSubtopic.value };
    }
  } else {
    const newSubtopic: Subtopic = {
      ...currentSubtopic.value,
      id: Date.now().toString()
    };
    topic.subtopics.push(newSubtopic);
  }
  subtopicDialog.value = false;
  updateTotalHours();
};

const deleteSubtopic = (topicIndex: number, subtopicIndex: number) => {
  if (confirm('Tem certeza que deseja excluir este subtópico?')) {
    subjectData.value.topics[topicIndex].subtopics.splice(subtopicIndex, 1);
    updateTotalHours();
  }
};

const updateTotalHours = () => {
  subjectData.value.totalHours = totalEstimatedHours.value;
};

const moveTopicUp = (index: number) => {
  if (index > 0) {
    const topics = [...subjectData.value.topics];
    [topics[index], topics[index - 1]] = [topics[index - 1], topics[index]];
    topics[index].order = index;
    topics[index - 1].order = index - 1;
    subjectData.value.topics = topics;
  }
};

const moveTopicDown = (index: number) => {
  if (index < subjectData.value.topics.length - 1) {
    const topics = [...subjectData.value.topics];
    [topics[index], topics[index + 1]] = [topics[index + 1], topics[index]];
    topics[index].order = index;
    topics[index + 1].order = index + 1;
    subjectData.value.topics = topics;
  }
};

const saveSubject = async () => {
  if (!form.value.validate()) return;
  
  loading.value = true;
  
  try {
    studyStore.addSubject(subjectData.value);
    
    // Simular delay para melhor UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    router.push('/main/subjects');
  } catch (error) {
    console.error('Erro ao salvar disciplina:', error);
  } finally {
    loading.value = false;
  }
};

const cancel = () => {
  router.push('/main/subjects');
};

onMounted(() => {
  studyStore.loadFromLocalStorage();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  
  <v-form ref="form" v-model="valid" @submit.prevent="saveSubject">
    <v-row>
      <!-- Formulário Principal -->
      <v-col cols="12" lg="8">
        <UiParentCard title="Informações da Disciplina">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="subjectData.name"
                label="Nome da Disciplina *"
                :rules="[rules.required]"
                variant="outlined"
                placeholder="Ex: Matemática"
                prepend-inner-icon="mdi-book-outline"
              />
            </v-col>
            
            <v-col cols="12">
              <v-textarea
                v-model="subjectData.description"
                label="Descrição"
                variant="outlined"
                rows="4"
                placeholder="Descreva o conteúdo e objetivos da disciplina..."
                prepend-inner-icon="mdi-text"
              />
            </v-col>
            
            <v-col cols="12">
              <div class="mb-4">
                <v-label class="mb-2">Cor da Disciplina</v-label>
                <v-chip-group v-model="subjectData.color" mandatory>
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
            </v-col>
          </v-row>
        </UiParentCard>

        <!-- Tópicos e Subtópicos -->
        <UiParentCard title="Estrutura de Conteúdo" class="mt-6">
          <template v-slot:action>
            <v-btn color="primary" @click="openTopicDialog()" prepend-icon="mdi-plus">
              Adicionar Tópico
            </v-btn>
          </template>

          <div v-if="subjectData.topics.length > 0">
            <v-expansion-panels variant="accordion" multiple>
              <v-expansion-panel
                v-for="(topic, topicIndex) in subjectData.topics"
                :key="topic.id"
                :value="topicIndex"
              >
                <v-expansion-panel-title>
                  <div class="d-flex align-center justify-space-between w-100">
                    <div class="d-flex align-center">
                      <v-avatar :color="subjectData.color" size="24" class="me-3">
                        <span class="text-caption">{{ topicIndex + 1 }}</span>
                      </v-avatar>
                      <div>
                        <h6 class="text-h6 mb-0">{{ topic.name }}</h6>
                        <p class="text-caption mb-0">
                          {{ topic.estimatedHours }}h • {{ topic.subtopics.length }} subtópicos
                        </p>
                      </div>
                    </div>
                    
                    <div class="d-flex align-center" @click.stop>
                      <v-btn
                        icon
                        size="small"
                        variant="text"
                        @click="moveTopicUp(topicIndex)"
                        :disabled="topicIndex === 0"
                      >
                        <SvgSprite name="custom-chevron-up" style="width: 16px; height: 16px" />
                      </v-btn>
                      
                      <v-btn
                        icon
                        size="small"
                        variant="text"
                        @click="moveTopicDown(topicIndex)"
                        :disabled="topicIndex === subjectData.topics.length - 1"
                      >
                        <SvgSprite name="custom-chevron-down" style="width: 16px; height: 16px" />
                      </v-btn>
                      
                      <v-menu>
                        <template v-slot:activator="{ props }">
                          <v-btn icon size="small" variant="text" v-bind="props">
                            <SvgSprite name="custom-more" style="width: 16px; height: 16px" />
                          </v-btn>
                        </template>
                        <v-list>
                          <v-list-item @click="openTopicDialog(topic, topicIndex)">
                            <template v-slot:prepend>
                              <SvgSprite name="custom-edit" style="width: 16px; height: 16px" />
                            </template>
                            <v-list-item-title>Editar</v-list-item-title>
                          </v-list-item>
                          <v-list-item @click="deleteTopic(topicIndex)" class="text-error">
                            <template v-slot:prepend>
                              <SvgSprite name="custom-trash" style="width: 16px; height: 16px" />
                            </template>
                            <v-list-item-title>Excluir</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </div>
                  </div>
                </v-expansion-panel-title>
                
                <v-expansion-panel-text>
                  <div class="mb-4">
                    <p v-if="topic.description" class="text-body-2 mb-3">{{ topic.description }}</p>
                    
                    <div class="d-flex justify-space-between align-center mb-3">
                      <h6 class="text-h6">Subtópicos</h6>
                      <v-btn
                        size="small"
                        color="primary"
                        variant="tonal"
                        @click="openSubtopicDialog(topicIndex)"
                        prepend-icon="mdi-plus"
                      >
                        Adicionar Subtópico
                      </v-btn>
                    </div>
                    
                    <div v-if="topic.subtopics.length > 0">
                      <v-card
                        v-for="(subtopic, subtopicIndex) in topic.subtopics"
                        :key="subtopic.id"
                        variant="outlined"
                        class="mb-2"
                      >
                        <v-card-text class="py-3">
                          <div class="d-flex align-center justify-space-between">
                            <div class="d-flex align-center">
                              <v-avatar color="grey-lighten-2" size="20" class="me-3">
                                <span class="text-caption">{{ subtopicIndex + 1 }}</span>
                              </v-avatar>
                              <div>
                                <h6 class="text-subtitle-2 mb-0">{{ subtopic.name }}</h6>
                                <p class="text-caption mb-0">{{ subtopic.estimatedHours }}h estimadas</p>
                              </div>
                            </div>
                            
                            <v-menu>
                              <template v-slot:activator="{ props }">
                                <v-btn icon size="small" variant="text" v-bind="props">
                                  <SvgSprite name="custom-more" style="width: 14px; height: 14px" />
                                </v-btn>
                              </template>
                              <v-list>
                                <v-list-item @click="openSubtopicDialog(topicIndex, subtopic, subtopicIndex)">
                                  <template v-slot:prepend>
                                    <SvgSprite name="custom-edit" style="width: 14px; height: 14px" />
                                  </template>
                                  <v-list-item-title>Editar</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="deleteSubtopic(topicIndex, subtopicIndex)" class="text-error">
                                  <template v-slot:prepend>
                                    <SvgSprite name="custom-trash" style="width: 14px; height: 14px" />
                                  </template>
                                  <v-list-item-title>Excluir</v-list-item-title>
                                </v-list-item>
                              </v-list>
                            </v-menu>
                          </div>
                          
                          <p v-if="subtopic.description" class="text-caption text-lightText mt-2 mb-0">
                            {{ subtopic.description }}
                          </p>
                        </v-card-text>
                      </v-card>
                    </div>
                    
                    <div v-else class="text-center py-4">
                      <p class="text-caption text-lightText mb-2">Nenhum subtópico adicionado</p>
                      <v-btn
                        size="small"
                        variant="outlined"
                        @click="openSubtopicDialog(topicIndex)"
                      >
                        Adicionar Primeiro Subtópico
                      </v-btn>
                    </div>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
          
          <div v-else class="text-center py-8">
            <SvgSprite name="custom-book" style="width: 48px; height: 48px; opacity: 0.3" />
            <p class="text-subtitle-1 mt-4 mb-2">Nenhum tópico adicionado</p>
            <p class="text-caption text-lightText mb-4">
              Organize o conteúdo da disciplina em tópicos e subtópicos
            </p>
            <v-btn color="primary" @click="openTopicDialog()" prepend-icon="mdi-plus">
              Adicionar Primeiro Tópico
            </v-btn>
          </div>
        </UiParentCard>
      </v-col>

      <!-- Sidebar com Resumo -->
      <v-col cols="12" lg="4">
        <!-- Preview da Disciplina -->
        <UiParentCard title="Preview da Disciplina">
          <v-card variant="outlined" :color="subjectData.color" class="pa-4">
            <div class="d-flex align-center mb-3">
              <v-avatar :color="subjectData.color" size="40" class="me-3">
                <SvgSprite name="custom-book" style="width: 20px; height: 20px" />
              </v-avatar>
              <div>
                <h6 class="text-h6 mb-0">{{ subjectData.name || 'Nome da Disciplina' }}</h6>
                <p class="text-caption mb-0">{{ totalEstimatedHours }}h estimadas</p>
              </div>
            </div>
            
            <p class="text-caption text-lightText mb-3">
              {{ subjectData.description || 'Descrição da disciplina...' }}
            </p>
            
            <div class="text-caption">
              <div class="d-flex align-center mb-1">
                <SvgSprite name="custom-list" style="width: 12px; height: 12px" class="me-2" />
                {{ subjectData.topics.length }} tópico(s)
              </div>
              <div class="d-flex align-center">
                <SvgSprite name="custom-clock" style="width: 12px; height: 12px" class="me-2" />
                {{ totalEstimatedHours }} horas estimadas
              </div>
            </div>
          </v-card>
        </UiParentCard>

        <!-- Estatísticas -->
        <UiParentCard title="Estatísticas" class="mt-6">
          <v-row>
            <v-col cols="6">
              <div class="text-center">
                <h3 class="text-h3 text-primary">{{ subjectData.topics.length }}</h3>
                <p class="text-caption mb-0">Tópicos</p>
              </div>
            </v-col>
            <v-col cols="6">
              <div class="text-center">
                <h3 class="text-h3 text-success">
                  {{ subjectData.topics.reduce((total, topic) => total + topic.subtopics.length, 0) }}
                </h3>
                <p class="text-caption mb-0">Subtópicos</p>
              </div>
            </v-col>
          </v-row>
          
          <v-divider class="my-3" />
          
          <div class="text-center">
            <h4 class="text-h4 text-warning">{{ totalEstimatedHours }}h</h4>
            <p class="text-caption mb-0">Total Estimado</p>
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
              :disabled="!valid"
              prepend-icon="mdi-content-save"
            >
              Criar Disciplina
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-form>

  <!-- Dialog para Tópico -->
  <v-dialog v-model="topicDialog" max-width="600px">
    <v-card>
      <v-card-title>
        {{ editingTopic ? 'Editar Tópico' : 'Novo Tópico' }}
      </v-card-title>
      
      <v-card-text>
        <v-form>
          <v-text-field
            v-model="currentTopic.name"
            label="Nome do Tópico *"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-4"
            placeholder="Ex: Álgebra Linear"
          />
          
          <v-textarea
            v-model="currentTopic.description"
            label="Descrição"
            variant="outlined"
            rows="3"
            class="mb-4"
            placeholder="Descreva o conteúdo deste tópico..."
          />
          
          <v-text-field
            v-model.number="currentTopic.estimatedHours"
            label="Horas Estimadas *"
            type="number"
            :rules="[rules.required, rules.minHours]"
            variant="outlined"
            min="0"
            step="0.5"
            placeholder="0"
          />
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="topicDialog = false">Cancelar</v-btn>
        <v-btn 
          color="primary" 
          @click="saveTopic"
          :disabled="!currentTopic.name"
        >
          {{ editingTopic ? 'Salvar' : 'Adicionar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog para Subtópico -->
  <v-dialog v-model="subtopicDialog" max-width="500px">
    <v-card>
      <v-card-title>
        {{ editingSubtopic ? 'Editar Subtópico' : 'Novo Subtópico' }}
      </v-card-title>
      
      <v-card-text>
        <v-form>
          <v-text-field
            v-model="currentSubtopic.name"
            label="Nome do Subtópico *"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-4"
            placeholder="Ex: Sistemas Lineares"
          />
          
          <v-textarea
            v-model="currentSubtopic.description"
            label="Descrição"
            variant="outlined"
            rows="2"
            class="mb-4"
            placeholder="Descreva este subtópico..."
          />
          
          <v-text-field
            v-model.number="currentSubtopic.estimatedHours"
            label="Horas Estimadas *"
            type="number"
            :rules="[rules.required, rules.minHours]"
            variant="outlined"
            min="0"
            step="0.5"
            placeholder="0"
          />
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="subtopicDialog = false">Cancelar</v-btn>
        <v-btn 
          color="primary" 
          @click="saveSubtopic"
          :disabled="!currentSubtopic.name"
        >
          {{ editingSubtopic ? 'Salvar' : 'Adicionar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.v-expansion-panel-title {
  padding: 16px !important;
}

.v-expansion-panel-text {
  padding: 0 16px 16px !important;
}

.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-1px);
}
</style>