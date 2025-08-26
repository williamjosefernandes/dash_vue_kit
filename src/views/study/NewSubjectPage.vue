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

// Dialog para importar estrutura
const importDialog = ref(false);
const importText = ref('');
const importPreview = ref<{ topics: Topic[] }>({ topics: [] });
const showPreview = ref(false);

// Exemplo de estrutura para ajudar o usuário
const exampleStructure = `1 Compreensão e interpretação de textos de gêneros variados. 2 Reconhecimento de tipos e gêneros textuais. 3 Domínio da ortografia oficial. 4 Domínio dos mecanismos de coesão textual. 4.1 Emprego de elementos de referenciação, substituição e repetição, de conectores e de outros elementos de sequenciação textual. 4.2 Emprego de tempos e modos verbais. 5 Domínio da estrutura morfossintática do período. 5.1 Emprego das classes de palavras. 5.2 Relações de coordenação entre orações e entre termos da oração. 5.3 Relações de subordinação entre orações e entre termos da oração. 5.4 Emprego dos sinais de pontuação. 5.5 Concordância verbal e nominal. 5.6 Regência verbal e nominal. 5.7 Emprego do sinal indicativo de crase. 5.8 Colocação dos pronomes átonos. 6 Reescrita de frases e parágrafos do texto. 6.1 Significação das palavras. 6.2 Substituição de palavras ou de trechos de texto`;
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

// Função para parsear a estrutura importada
const parseImportedStructure = (text: string) => {
  const topics: Topic[] = [];
  const lines = text.split(/(?=\d+\s)/).filter(line => line.trim());
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;
    
    // Regex para capturar número do tópico e conteúdo
    const topicMatch = trimmedLine.match(/^(\d+)\s+(.+?)(?=\s+\d+\.\d+|\s+\d+\s|$)/);
    if (topicMatch) {
      const [, topicNumber, topicContent] = topicMatch;
      
      // Criar o tópico principal
      const topic: Topic = {
        id: Date.now().toString() + topicNumber,
        name: `${topicNumber}. ${topicContent.trim()}`,
        description: '',
        estimatedHours: 2, // Valor padrão
        studiedHours: 0,
        completed: false,
        subtopics: [],
        order: parseInt(topicNumber) - 1
      };
      
      // Buscar subtópicos relacionados
      const subtopicRegex = new RegExp(`${topicNumber}\\.(\\d+)\\s+([^\\d]+?)(?=\\s+\\d+\\.\\d+|\\s+\\d+\\s|$)`, 'g');
      let subtopicMatch;
      
      while ((subtopicMatch = subtopicRegex.exec(trimmedLine)) !== null) {
        const [, subtopicNumber, subtopicContent] = subtopicMatch;
        
        const subtopic: Subtopic = {
          id: Date.now().toString() + topicNumber + subtopicNumber,
          name: `${topicNumber}.${subtopicNumber}. ${subtopicContent.trim()}`,
          description: '',
          estimatedHours: 1, // Valor padrão
          studiedHours: 0,
          completed: false,
          order: parseInt(subtopicNumber) - 1
        };
        
        topic.subtopics.push(subtopic);
      }
      
      topics.push(topic);
    }
  });
  
  return topics;
};

// Função para gerar preview da importação
const generateImportPreview = () => {
  if (!importText.value.trim()) {
    showPreview.value = false;
    return;
  }
  
  try {
    const parsedTopics = parseImportedStructure(importText.value);
    importPreview.value = { topics: parsedTopics };
    showPreview.value = true;
  } catch (error) {
    console.error('Erro ao parsear estrutura:', error);
    showPreview.value = false;
  }
};

// Função para confirmar importação
const confirmImport = () => {
  if (importPreview.value.topics.length > 0) {
    // Adicionar tópicos importados aos existentes
    subjectData.value.topics.push(...importPreview.value.topics);
    updateTotalHours();
    
    // Limpar e fechar dialog
    importText.value = '';
    importPreview.value = { topics: [] };
    showPreview.value = false;
    importDialog.value = false;
  }
};

// Função para usar exemplo
const useExample = () => {
  importText.value = exampleStructure;
  generateImportPreview();
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
        <!-- Informações Básicas -->
        <UiParentCard>
          <template v-slot:title>
            <div class="d-flex align-center">
              <v-avatar :color="subjectData.color" size="32" class="me-3">
                <SvgSprite name="custom-book" style="width: 16px; height: 16px" />
              </v-avatar>
              <span>Informações da Disciplina</span>
            </div>
          </template>

          <v-row>
            <v-col cols="12">
              <div class="input-group mb-6">
                <v-label class="input-label mb-3">
                  <div class="d-flex align-center">
                    <span class="text-h6 font-weight-medium">Nome da Disciplina</span>
                    <v-chip size="x-small" color="error" variant="tonal" class="ml-2">Obrigatório</v-chip>
                  </div>
                </v-label>
                <v-text-field
                  v-model="subjectData.name"
                  :rules="[rules.required]"
                  variant="outlined"
                  placeholder="Ex: Matemática Avançada, Física Quântica, História do Brasil..."
                  density="comfortable"
                  class="subject-name-input"
                  hide-details="auto"
                />
                <div class="input-helper mt-2">
                  <small class="text-caption text-lightText">
                    <SvgSprite name="custom-info" style="width: 12px; height: 12px" class="me-1" />
                    Escolha um nome claro e específico para sua disciplina
                  </small>
                </div>
              </div>
            </v-col>
            
            <v-col cols="12">
              <div class="input-group mb-6">
                <v-label class="input-label mb-3">
                  <div class="d-flex align-center">
                    <span class="text-h6 font-weight-medium">Descrição da Disciplina</span>
                    <v-chip size="x-small" color="success" variant="tonal" class="ml-2">Opcional</v-chip>
                  </div>
                </v-label>
                <v-textarea
                  v-model="subjectData.description"
                  variant="outlined"
                  rows="4"
                  placeholder="Descreva os objetivos, conteúdo programático e metodologia de estudo desta disciplina. Ex: Estudo completo de cálculo diferencial e integral, com foco em aplicações práticas..."
                  density="comfortable"
                  class="subject-description-input"
                  hide-details="auto"
                  counter="500"
                  maxlength="500"
                />
                <div class="input-helper mt-2">
                  <div class="d-flex justify-space-between align-center">
                    <small class="text-caption text-lightText">
                      <SvgSprite name="custom-info" style="width: 12px; height: 12px" class="me-1" />
                      Uma boa descrição ajuda a manter o foco nos objetivos de estudo
                    </small>
                    <small class="text-caption text-lightText">
                      {{ subjectData.description.length }}/500 caracteres
                    </small>
                  </div>
                </div>
              </div>
            </v-col>
            
            <v-col cols="12">
              <div class="input-group">
                <v-label class="input-label mb-3">
                  <div class="d-flex align-center">
                    <span class="text-h6 font-weight-medium">Cor da Disciplina</span>
                  </div>
                </v-label>
                <div class="input-helper mb-3">
                  <small class="text-caption text-lightText">
                    <SvgSprite name="custom-info" style="width: 12px; height: 12px" class="me-1" />
                    Escolha uma cor para identificar visualmente esta disciplina no sistema
                  </small>
                </div>
              </div>
              <div class="color-selection-container">
                <div class="color-grid">
                  <div
                    v-for="color in colors"
                    :key="color.value"
                    class="color-option"
                    :class="{ 'selected': subjectData.color === color.value }"
                    @click="subjectData.color = color.value"
                  >
                    <div class="color-circle" :style="{ backgroundColor: color.color }">
                      <v-icon 
                        v-if="subjectData.color === color.value"
                        icon="mdi-check"
                        color="white"
                        size="20"
                      />
                    </div>
                    <span class="color-name">{{ color.name }}</span>
                  </div>
                </div>
                
                <!-- Preview da Cor Selecionada -->
                <div class="color-preview-section mt-4">
                  <div class="color-preview-card" :style="{ borderColor: colors.find(c => c.value === subjectData.color)?.color }">
                    <div class="d-flex align-center">
                      <div 
                        class="preview-circle me-3" 
                        :style="{ backgroundColor: colors.find(c => c.value === subjectData.color)?.color }"
                      ></div>
                      <div>
                        <h6 class="text-h6 mb-1">Cor Selecionada</h6>
                        <p class="text-caption text-lightText mb-0">
                          {{ colors.find(c => c.value === subjectData.color)?.name }} - 
                          {{ colors.find(c => c.value === subjectData.color)?.color }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>
        </UiParentCard>

        <!-- Estrutura de Conteúdo -->
        <UiParentCard class="mt-6">
          <template v-slot:title>
            <div class="d-flex align-center">
              <v-avatar color="info" size="32" class="me-3">
                <SvgSprite name="custom-list" style="width: 16px; height: 16px" />
              </v-avatar>
              <span>Estrutura de Conteúdo</span>
            </div>
          </template>
          
          <template v-slot:action>
            <div class="d-flex gap-2">
              <v-btn 
                color="secondary" 
                @click="importDialog = true" 
                prepend-icon="mdi-import"
                variant="outlined"
                rounded="lg"
              >
                Importar Estrutura
              </v-btn>
              <v-btn 
                color="primary" 
                @click="openTopicDialog()" 
                prepend-icon="mdi-plus"
                variant="flat"
                rounded="lg"
              >
                Adicionar Tópico
              </v-btn>
            </div>
          </template>

          <div v-if="subjectData.topics.length > 0" class="topics-container">
            <v-expansion-panels variant="accordion" multiple class="topic-panels">
              <v-expansion-panel
                v-for="(topic, topicIndex) in subjectData.topics"
                :key="topic.id"
                :value="topicIndex"
                class="topic-panel"
              >
                <v-expansion-panel-title class="topic-header">
                  <div class="d-flex align-center justify-space-between w-100">
                    <div class="d-flex align-center">
                      <v-avatar :color="subjectData.color" size="32" class="me-3 topic-number">
                        <span class="text-subtitle-2 font-weight-bold">{{ topicIndex + 1 }}</span>
                      </v-avatar>
                      <div>
                        <h6 class="text-h6 mb-1">{{ topic.name }}</h6>
                        <div class="d-flex align-center gap-2">
                          <v-chip size="x-small" color="info" variant="tonal">
                            {{ topic.estimatedHours }}h
                          </v-chip>
                          <v-chip size="x-small" color="success" variant="tonal">
                            {{ topic.subtopics.length }} subtópicos
                          </v-chip>
                        </div>
                      </div>
                    </div>
                    
                    <div class="d-flex align-center topic-actions" @click.stop>
                      <v-tooltip text="Mover para cima">
                        <template v-slot:activator="{ props }">
                          <v-btn
                            v-bind="props"
                            icon
                            size="small"
                            variant="text"
                            @click="moveTopicUp(topicIndex)"
                            :disabled="topicIndex === 0"
                          >
                            <SvgSprite name="custom-chevron-up" style="width: 16px; height: 16px" />
                          </v-btn>
                        </template>
                      </v-tooltip>
                      
                      <v-tooltip text="Mover para baixo">
                        <template v-slot:activator="{ props }">
                          <v-btn
                            v-bind="props"
                            icon
                            size="small"
                            variant="text"
                            @click="moveTopicDown(topicIndex)"
                            :disabled="topicIndex === subjectData.topics.length - 1"
                          >
                            <SvgSprite name="custom-chevron-down" style="width: 16px; height: 16px" />
                          </v-btn>
                        </template>
                      </v-tooltip>
                      
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
                
                <v-expansion-panel-text class="topic-content">
                  <div class="pa-2">
                    <p v-if="topic.description" class="text-body-2 text-lightText mb-4">
                      {{ topic.description }}
                    </p>
                    
                    <div class="d-flex justify-space-between align-center mb-4">
                      <h6 class="text-h6 d-flex align-center">
                        <SvgSprite name="custom-list" style="width: 18px; height: 18px" class="me-2" />
                        Subtópicos
                      </h6>
                      <v-btn
                        size="small"
                        color="primary"
                        variant="tonal"
                        @click="openSubtopicDialog(topicIndex)"
                        prepend-icon="mdi-plus"
                        rounded="lg"
                      >
                        Adicionar Subtópico
                      </v-btn>
                    </div>
                    
                    <div v-if="topic.subtopics.length > 0" class="subtopics-grid">
                      <v-card
                        v-for="(subtopic, subtopicIndex) in topic.subtopics"
                        :key="subtopic.id"
                        variant="outlined"
                        class="subtopic-card"
                        hover
                      >
                        <v-card-text class="pa-4">
                          <div class="d-flex align-center justify-space-between mb-2">
                            <div class="d-flex align-center">
                              <v-avatar color="grey-lighten-1" size="24" class="me-3">
                                <span class="text-caption font-weight-bold">{{ subtopicIndex + 1 }}</span>
                              </v-avatar>
                              <div>
                                <h6 class="text-subtitle-2 mb-0">{{ subtopic.name }}</h6>
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
                          
                          <div class="d-flex align-center justify-space-between">
                            <p v-if="subtopic.description" class="text-caption text-lightText mb-0">
                              {{ subtopic.description }}
                            </p>
                            <v-chip size="x-small" color="warning" variant="tonal">
                              {{ subtopic.estimatedHours }}h
                            </v-chip>
                          </div>
                        </v-card-text>
                      </v-card>
                    </div>
                    
                    <div v-else class="empty-subtopics">
                      <div class="text-center py-6">
                        <SvgSprite name="custom-list" style="width: 32px; height: 32px; opacity: 0.3" />
                        <p class="text-subtitle-2 mt-3 mb-2">Nenhum subtópico adicionado</p>
                        <p class="text-caption text-lightText mb-3">
                          Organize o conteúdo deste tópico em subtópicos menores
                        </p>
                        <v-btn
                          size="small"
                          variant="outlined"
                          @click="openSubtopicDialog(topicIndex)"
                          prepend-icon="mdi-plus"
                        >
                          Adicionar Primeiro Subtópico
                        </v-btn>
                      </div>
                    </div>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
          
          <div v-else class="empty-topics">
            <div class="text-center py-12">
              <v-avatar color="grey-lighten-2" size="80" class="mb-4">
                <SvgSprite name="custom-book" style="width: 40px; height: 40px; opacity: 0.5" />
              </v-avatar>
              <h5 class="text-h5 mb-2">Nenhum tópico adicionado</h5>
              <p class="text-subtitle-1 text-lightText mb-6">
                Organize o conteúdo da disciplina em tópicos e subtópicos para facilitar o estudo
              </p>
              <v-btn 
                color="primary" 
                @click="openTopicDialog()" 
                prepend-icon="mdi-plus"
                size="large"
                variant="flat"
                rounded="lg"
              >
                Adicionar Primeiro Tópico
              </v-btn>
            </div>
          </div>
        </UiParentCard>
      </v-col>

      <!-- Sidebar com Preview e Estatísticas -->
      <v-col cols="12" lg="4">
        <!-- Preview da Disciplina -->
        <UiParentCard>
          <template v-slot:title>
            <div class="d-flex align-center">
              <v-avatar color="success" size="32" class="me-3">
                <SvgSprite name="custom-eye" style="width: 16px; height: 16px" />
              </v-avatar>
              <span>Preview da Disciplina</span>
            </div>
          </template>

          <v-card variant="outlined" :color="subjectData.color" class="preview-card">
            <v-card-text class="pa-6">
              <div class="d-flex align-center mb-4">
                <v-avatar :color="subjectData.color" size="48" class="me-4">
                  <SvgSprite name="custom-book" style="width: 24px; height: 24px" />
                </v-avatar>
                <div>
                  <h6 class="text-h6 mb-1">{{ subjectData.name || 'Nome da Disciplina' }}</h6>
                  <v-chip size="small" :color="subjectData.color" variant="tonal">
                    {{ totalEstimatedHours }}h estimadas
                  </v-chip>
                </div>
              </div>
              
              <p class="text-body-2 text-lightText mb-4">
                {{ subjectData.description || 'Descrição da disciplina aparecerá aqui...' }}
              </p>
              
              <div class="stats-grid">
                <div class="stat-item">
                  <SvgSprite name="custom-list" style="width: 16px; height: 16px" class="me-2" />
                  <span class="text-body-2">{{ subjectData.topics.length }} tópico(s)</span>
                </div>
                <div class="stat-item">
                  <SvgSprite name="custom-clock" style="width: 16px; height: 16px" class="me-2" />
                  <span class="text-body-2">{{ totalEstimatedHours }} horas</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </UiParentCard>

        <!-- Estatísticas Detalhadas -->
        <UiParentCard class="mt-6">
          <template v-slot:title>
            <div class="d-flex align-center">
              <v-avatar color="warning" size="32" class="me-3">
                <SvgSprite name="custom-chart" style="width: 16px; height: 16px" />
              </v-avatar>
              <span>Estatísticas</span>
            </div>
          </template>

          <div class="stats-container">
            <v-row>
              <v-col cols="6">
                <div class="stat-card">
                  <h3 class="text-h3 text-primary mb-1">{{ subjectData.topics.length }}</h3>
                  <p class="text-caption mb-0">Tópicos</p>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="stat-card">
                  <h3 class="text-h3 text-success mb-1">
                    {{ subjectData.topics.reduce((total, topic) => total + topic.subtopics.length, 0) }}
                  </h3>
                  <p class="text-caption mb-0">Subtópicos</p>
                </div>
              </v-col>
            </v-row>
            
            <v-divider class="my-4" />
            
            <div class="text-center">
              <h2 class="text-h2 text-warning mb-2">{{ totalEstimatedHours }}h</h2>
              <p class="text-subtitle-2 text-lightText mb-0">Total Estimado</p>
            </div>

            <v-alert 
              v-if="totalEstimatedHours > 0" 
              type="info" 
              variant="tonal" 
              class="mt-4"
              density="compact"
            >
              <div class="text-caption">
                <strong>Dica:</strong> Considere dividir em sessões de 2-3 horas para melhor aproveitamento.
              </div>
            </v-alert>
          </div>
        </UiParentCard>
      </v-col>
    </v-row>

    <!-- Ações Fixas -->
    <v-card variant="outlined" class="mt-6 action-bar">
      <v-card-text class="pa-4">
        <div class="d-flex justify-space-between align-center">
          <div class="d-flex align-center">
            <v-icon icon="mdi-information-outline" class="me-2 text-info" />
            <span class="text-body-2 text-lightText">
              {{ subjectData.topics.length }} tópicos • {{ totalEstimatedHours }}h estimadas
            </span>
          </div>
          
          <div class="d-flex gap-3">
            <v-btn
              @click="cancel"
              variant="outlined"
              :disabled="loading"
              size="large"
            >
              Cancelar
            </v-btn>
            
            <v-btn
              type="submit"
              color="primary"
              :loading="loading"
              :disabled="!valid"
              prepend-icon="mdi-content-save"
              size="large"
              variant="flat"
            >
              Criar Disciplina
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-form>

  <!-- Dialog para Tópico -->
  <v-dialog v-model="topicDialog" max-width="600px" persistent>
    <v-card class="dialog-card">
      <v-card-title class="dialog-header">
        <div class="d-flex align-center">
          <v-avatar :color="subjectData.color" size="32" class="me-3">
            <SvgSprite name="custom-book" style="width: 16px; height: 16px" />
          </v-avatar>
          <span>{{ editingTopic ? 'Editar Tópico' : 'Novo Tópico' }}</span>
        </div>
      </v-card-title>
      
      <v-card-text class="pa-6">
        <v-form>
          <v-text-field
            v-model="currentTopic.name"
            label="Nome do Tópico"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-4"
            placeholder="Ex: Álgebra Linear"
            prepend-inner-icon="mdi-book-outline"
            density="comfortable"
          />
          
          <v-textarea
            v-model="currentTopic.description"
            label="Descrição"
            variant="outlined"
            rows="3"
            class="mb-4"
            placeholder="Descreva o conteúdo deste tópico..."
            prepend-inner-icon="mdi-text"
            density="comfortable"
          />
          
          <v-text-field
            v-model.number="currentTopic.estimatedHours"
            label="Horas Estimadas"
            type="number"
            :rules="[rules.required, rules.minHours]"
            variant="outlined"
            min="0"
            step="0.5"
            placeholder="0"
            prepend-inner-icon="mdi-clock-outline"
            density="comfortable"
          />
        </v-form>
      </v-card-text>
      
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn @click="topicDialog = false" variant="outlined">
          Cancelar
        </v-btn>
        <v-btn 
          color="primary" 
          @click="saveTopic"
          :disabled="!currentTopic.name"
          variant="flat"
        >
          {{ editingTopic ? 'Salvar' : 'Adicionar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog para Subtópico -->
  <v-dialog v-model="subtopicDialog" max-width="500px" persistent>
    <v-card class="dialog-card">
      <v-card-title class="dialog-header">
        <div class="d-flex align-center">
          <v-avatar color="grey-lighten-1" size="32" class="me-3">
            <SvgSprite name="custom-list" style="width: 16px; height: 16px" />
          </v-avatar>
          <span>{{ editingSubtopic ? 'Editar Subtópico' : 'Novo Subtópico' }}</span>
        </div>
      </v-card-title>
      
      <v-card-text class="pa-6">
        <v-form>
          <v-text-field
            v-model="currentSubtopic.name"
            label="Nome do Subtópico"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-4"
            placeholder="Ex: Sistemas Lineares"
            prepend-inner-icon="mdi-format-list-bulleted"
            density="comfortable"
          />
          
          <v-textarea
            v-model="currentSubtopic.description"
            label="Descrição"
            variant="outlined"
            rows="2"
            class="mb-4"
            placeholder="Descreva este subtópico..."
            prepend-inner-icon="mdi-text"
            density="comfortable"
          />
          
          <v-text-field
            v-model.number="currentSubtopic.estimatedHours"
            label="Horas Estimadas"
            type="number"
            :rules="[rules.required, rules.minHours]"
            variant="outlined"
            min="0"
            step="0.5"
            placeholder="0"
            prepend-inner-icon="mdi-clock-outline"
            density="comfortable"
          />
        </v-form>
      </v-card-text>
      
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn @click="subtopicDialog = false" variant="outlined">
          Cancelar
        </v-btn>
        <v-btn 
          color="primary" 
          @click="saveSubtopic"
          :disabled="!currentSubtopic.name"
          variant="flat"
        >
          {{ editingSubtopic ? 'Salvar' : 'Adicionar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog para Importar Estrutura -->
  <v-dialog v-model="importDialog" max-width="800px" persistent>
    <v-card class="dialog-card">
      <v-card-title class="dialog-header">
        <div class="d-flex align-center">
          <v-avatar color="secondary" size="32" class="me-3">
            <SvgSprite name="custom-import" style="width: 16px; height: 16px" />
          </v-avatar>
          <span>Importar Estrutura de Tópicos</span>
        </div>
      </v-card-title>
      
      <v-card-text class="pa-6">
        <div class="mb-4">
          <div class="d-flex justify-space-between align-center mb-3">
            <h6 class="text-h6">Cole sua estrutura de conteúdo:</h6>
            <v-btn 
              size="small" 
              color="info" 
              variant="tonal" 
              @click="useExample"
              prepend-icon="mdi-lightbulb"
            >
              Usar Exemplo
            </v-btn>
          </div>
          
          <v-textarea
            v-model="importText"
            label="Estrutura de Conteúdo"
            variant="outlined"
            rows="8"
            placeholder="Cole aqui sua estrutura no formato: 1 Tópico Principal. 1.1 Subtópico. 1.2 Outro Subtópico. 2 Segundo Tópico..."
            @input="generateImportPreview"
            class="mb-4"
          />
          
          <v-alert type="info" variant="tonal" density="compact">
            <div class="text-caption">
              <strong>Formato esperado:</strong><br>
              • Tópicos: número + espaço + título (ex: "1 Introdução")<br>
              • Subtópicos: número.subnúmero + espaço + título (ex: "1.1 Conceitos básicos")<br>
              • Separe diferentes tópicos naturalmente no texto
            </div>
          </v-alert>
        </div>
        
        <!-- Preview da Importação -->
        <div v-if="showPreview && importPreview.topics.length > 0" class="mt-6">
          <h6 class="text-h6 mb-3 d-flex align-center">
            <SvgSprite name="custom-eye" style="width: 18px; height: 18px" class="me-2" />
            Preview da Importação ({{ importPreview.topics.length }} tópicos)
          </h6>
          
          <v-card variant="outlined" class="preview-container" max-height="300" style="overflow-y: auto;">
            <v-card-text class="pa-4">
              <div v-for="(topic, index) in importPreview.topics" :key="topic.id" class="mb-4">
                <div class="d-flex align-center mb-2">
                  <v-avatar :color="subjectData.color" size="24" class="me-3">
                    <span class="text-caption font-weight-bold">{{ index + 1 }}</span>
                  </v-avatar>
                  <div>
                    <h6 class="text-subtitle-2 mb-0">{{ topic.name }}</h6>
                    <v-chip size="x-small" color="info" variant="tonal" class="mt-1">
                      {{ topic.estimatedHours }}h • {{ topic.subtopics.length }} subtópicos
                    </v-chip>
                  </div>
                </div>
                
                <div v-if="topic.subtopics.length > 0" class="ml-8">
                  <div 
                    v-for="(subtopic, subIndex) in topic.subtopics" 
                    :key="subtopic.id"
                    class="d-flex align-center mb-1"
                  >
                    <v-avatar color="grey-lighten-1" size="16" class="me-2">
                      <span style="font-size: 10px;">{{ subIndex + 1 }}</span>
                    </v-avatar>
                    <span class="text-caption">{{ subtopic.name }}</span>
                    <v-chip size="x-small" color="warning" variant="tonal" class="ml-2">
                      {{ subtopic.estimatedHours }}h
                    </v-chip>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
          
          <v-alert type="success" variant="tonal" class="mt-3" density="compact">
            <div class="text-caption">
              <strong>Pronto para importar!</strong> 
              {{ importPreview.topics.reduce((total, topic) => total + topic.estimatedHours + topic.subtopics.reduce((subTotal, sub) => subTotal + sub.estimatedHours, 0), 0) }}h 
              estimadas no total.
            </div>
          </v-alert>
        </div>
        
        <div v-else-if="showPreview && importPreview.topics.length === 0" class="mt-6">
          <v-alert type="warning" variant="tonal">
            <div class="text-caption">
              <strong>Nenhum tópico encontrado.</strong><br>
              Verifique se o formato está correto ou use o exemplo fornecido.
            </div>
          </v-alert>
        </div>
      </v-card-text>
      
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn @click="importDialog = false; importText = ''; showPreview = false;" variant="outlined">
          Cancelar
        </v-btn>
        <v-btn 
          color="primary" 
          @click="confirmImport"
          :disabled="!showPreview || importPreview.topics.length === 0"
          variant="flat"
          prepend-icon="mdi-import"
        >
          Importar {{ importPreview.topics.length }} Tópicos
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Layout e Containers */
.topics-container {
  margin-top: 1rem;
}

/* Input Groups Styling */
.input-group {
  position: relative;
}

.input-label {
  display: block;
  margin-bottom: 0.75rem;
}

.input-helper {
  padding-left: 0.5rem;
}

.subject-name-input {
  .v-field {
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }
  
  .v-field--focused {
    box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.15);
    transform: translateY(-1px);
  }
  
  .v-field__input {
    font-size: 1.1rem;
    font-weight: 500;
    padding-left: 1.5rem;
  }
}

.subject-description-input {
  .v-field {
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }
  
  .v-field--focused {
    box-shadow: 0 4px 16px rgba(var(--v-theme-info), 0.15);
    transform: translateY(-1px);
  }
  
  .v-field__input {
    font-size: 1rem;
    line-height: 1.6;
    padding-left: 1.5rem;
  }
}

.topic-panels {
  border-radius: 12px;
  overflow: hidden;
}

.topic-panel {
  border: 1px solid rgba(var(--v-theme-borderLight), 0.8);
  margin-bottom: 1rem;
  border-radius: 12px !important;
  overflow: hidden;
}

.topic-header {
  padding: 20px !important;
  background: rgba(var(--v-theme-containerBg), 0.5);
}

.topic-content {
  padding: 0 !important;
}

.topic-number {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.topic-actions {
  opacity: 0.7;
  transition: opacity 0.2s;
}

.topic-panel:hover .topic-actions {
  opacity: 1;
}

/* Subtópicos */
.subtopics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.subtopic-card {
  transition: all 0.3s ease;
  border-radius: 12px;
}

.subtopic-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Estados Vazios */
.empty-topics,
.empty-subtopics {
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 12px;
  border: 2px dashed rgba(var(--v-theme-borderLight), 0.5);
}

/* Preview e Estatísticas */
.preview-card {
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(var(--v-theme-surface), 0.9), rgba(var(--v-theme-containerBg), 0.5));
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 8px;
}

.stats-container {
  padding: 1rem;
}

.stat-card {
  text-align: center;
  padding: 1rem;
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 12px;
}

/* Botões de Cor */
.color-selection-container {
  padding: 1.5rem;
  background: rgba(var(--v-theme-containerBg), 0.3);
  border-radius: 16px;
  border: 2px solid rgba(var(--v-theme-borderLight), 0.3);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.color-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(var(--v-theme-surface), 0.8);
  border: 2px solid transparent;
}

.color-option:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  background: rgba(var(--v-theme-surface), 1);
}

.color-option.selected {
  border-color: rgba(var(--v-theme-primary), 0.5);
  background: rgba(var(--v-theme-primary), 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(var(--v-theme-primary), 0.2);
}

.color-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative;
}

.color-option:hover .color-circle {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.color-option.selected .color-circle {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.color-name {
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  color: rgb(var(--v-theme-darkText));
  transition: color 0.3s ease;
}

.color-option.selected .color-name {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.color-preview-section {
  border-top: 1px solid rgba(var(--v-theme-borderLight), 0.5);
  padding-top: 1rem;
}

.color-preview-card {
  padding: 1rem;
  background: rgba(var(--v-theme-surface), 0.8);
  border-radius: 12px;
  border: 2px solid;
  transition: all 0.3s ease;
}

.preview-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Barra de Ações */
.action-bar {
  position: sticky;
  bottom: 1rem;
  z-index: 10;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  background: rgba(var(--v-theme-surface), 0.95);
}

/* Dialogs */
.dialog-card {
  border-radius: 16px;
}

.dialog-header {
  background: rgba(var(--v-theme-containerBg), 0.5);
  padding: 1.5rem !important;
}

/* Responsividade */
@media (max-width: 960px) {
  .subtopics-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .color-btn {
    min-width: 100px;
  }
}

/* Animações */
.v-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-expansion-panel {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Melhorias visuais */
.v-expansion-panel-title {
  border-radius: 12px 12px 0 0;
}

.v-expansion-panel-text {
  background: rgba(var(--v-theme-surface), 0.5);
}
</style>