<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';

const studyStore = useStudyStore();
const page = ref({ title: 'Tarefas' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Tarefas', disabled: true, href: '#' }
]);

const dialog = ref(false);
const editMode = ref(false);
const currentTask = ref({
  id: '',
  subjectId: '',
  title: '',
  description: '',
  dueDate: new Date().toISOString().split('T')[0],
  priority: 'medium' as 'low' | 'medium' | 'high',
  completed: false
});

const filter = ref('all'); // all, pending, completed
const sortBy = ref('dueDate'); // dueDate, priority, subject

const filteredTasks = computed(() => {
  let tasks = studyStore.tasks;
  
  // Filtrar por status
  if (filter.value === 'pending') {
    tasks = tasks.filter(task => !task.completed);
  } else if (filter.value === 'completed') {
    tasks = tasks.filter(task => task.completed);
  }
  
  // Ordenar
  return tasks.sort((a, b) => {
    if (sortBy.value === 'dueDate') {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (sortBy.value === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    } else if (sortBy.value === 'subject') {
      const subjectA = studyStore.getSubjectById(a.subjectId)?.name || '';
      const subjectB = studyStore.getSubjectById(b.subjectId)?.name || '';
      return subjectA.localeCompare(subjectB);
    }
    return 0;
  });
});

const rules = {
  required: (v: string) => !!v || 'Campo obrigatório'
};

const openDialog = (task?: any) => {
  if (task) {
    editMode.value = true;
    currentTask.value = { 
      ...task,
      dueDate: new Date(task.dueDate).toISOString().split('T')[0]
    };
  } else {
    editMode.value = false;
    currentTask.value = {
      id: '',
      subjectId: '',
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
      completed: false
    };
  }
  dialog.value = true;
};

const saveTask = () => {
  const taskData = {
    ...currentTask.value,
    dueDate: new Date(currentTask.value.dueDate)
  };
  
  if (editMode.value) {
    studyStore.updateTask(currentTask.value.id, taskData);
  } else {
    studyStore.addTask(taskData);
  }
  dialog.value = false;
};

const deleteTask = (id: string) => {
  if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
    studyStore.deleteTask(id);
  }
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

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'high': return 'Alta';
    case 'medium': return 'Média';
    case 'low': return 'Baixa';
    default: return priority;
  }
};

const isOverdue = (dueDate: Date) => {
  return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
};
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  
  <UiParentCard title="Minhas Tarefas">
    <template v-slot:action>
      <v-btn color="primary" @click="openDialog()" prepend-icon="mdi-plus">
        Nova Tarefa
      </v-btn>
    </template>

    <!-- Filtros e Ordenação -->
    <div class="d-flex flex-wrap gap-4 mb-6">
      <v-chip-group v-model="filter" mandatory>
        <v-chip value="all">Todas</v-chip>
        <v-chip value="pending">Pendentes</v-chip>
        <v-chip value="completed">Concluídas</v-chip>
      </v-chip-group>
      
      <v-select
        v-model="sortBy"
        :items="[
          { title: 'Data de Vencimento', value: 'dueDate' },
          { title: 'Prioridade', value: 'priority' },
          { title: 'Disciplina', value: 'subject' }
        ]"
        label="Ordenar por"
        variant="outlined"
        density="compact"
        style="max-width: 200px"
      />
    </div>

    <!-- Lista de Tarefas -->
    <div v-if="filteredTasks.length > 0">
      <v-card
        v-for="task in filteredTasks"
        :key="task.id"
        class="mb-3"
        :class="{ 'opacity-60': task.completed }"
      >
        <v-card-text>
          <div class="d-flex align-start">
            <v-checkbox
              :model-value="task.completed"
              @update:model-value="studyStore.toggleTaskComplete(task.id)"
              color="primary"
              hide-details
              class="me-3"
            />
            
            <div class="flex-grow-1">
              <div class="d-flex align-center justify-space-between mb-2">
                <h6 class="text-h6" :class="{ 'text-decoration-line-through': task.completed }">
                  {{ task.title }}
                </h6>
                
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn icon size="small" variant="text" v-bind="props">
                      <SvgSprite name="custom-more" style="width: 16px; height: 16px" />
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item @click="openDialog(task)">
                      <template v-slot:prepend>
                        <SvgSprite name="custom-edit" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Editar</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="deleteTask(task.id)" class="text-error">
                      <template v-slot:prepend>
                        <SvgSprite name="custom-trash" style="width: 16px; height: 16px" />
                      </template>
                      <v-list-item-title>Excluir</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
              
              <p v-if="task.description" class="text-body-2 text-lightText mb-2">
                {{ task.description }}
              </p>
              
              <div class="d-flex align-center flex-wrap gap-2">
                <v-chip 
                  size="small" 
                  :color="getSubjectColor(task.subjectId)" 
                  variant="tonal"
                >
                  {{ getSubjectName(task.subjectId) }}
                </v-chip>
                
                <v-chip 
                  size="small" 
                  :color="getPriorityColor(task.priority)" 
                  variant="tonal"
                >
                  {{ getPriorityText(task.priority) }}
                </v-chip>
                
                <v-chip 
                  size="small" 
                  :color="isOverdue(task.dueDate) && !task.completed ? 'error' : 'default'"
                  variant="tonal"
                >
                  <SvgSprite name="custom-calendar" style="width: 12px; height: 12px" class="me-1" />
                  {{ new Date(task.dueDate).toLocaleDateString() }}
                </v-chip>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
    
    <div v-else class="text-center py-12">
      <SvgSprite name="custom-check" style="width: 64px; height: 64px; opacity: 0.3" />
      <h5 class="text-h5 mt-4 mb-2">
        {{ filter === 'completed' ? 'Nenhuma tarefa concluída' : 
           filter === 'pending' ? 'Nenhuma tarefa pendente' : 
           'Nenhuma tarefa cadastrada' }}
      </h5>
      <p class="text-subtitle-1 text-lightText mb-4">
        {{ filter === 'all' ? 'Comece adicionando suas tarefas para organizar seus estudos' : 
           'Altere o filtro para ver outras tarefas' }}
      </p>
      <v-btn v-if="filter === 'all'" color="primary" @click="openDialog()" prepend-icon="mdi-plus">
        Adicionar Primeira Tarefa
      </v-btn>
    </div>
  </UiParentCard>

  <!-- Dialog para Adicionar/Editar Tarefa -->
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title>
        {{ editMode ? 'Editar Tarefa' : 'Nova Tarefa' }}
      </v-card-title>
      
      <v-card-text>
        <v-form>
          <v-select
            v-model="currentTask.subjectId"
            :items="studyStore.subjects"
            item-title="name"
            item-value="id"
            label="Disciplina"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-4"
          />
          
          <v-text-field
            v-model="currentTask.title"
            label="Título da Tarefa"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-4"
          />
          
          <v-textarea
            v-model="currentTask.description"
            label="Descrição"
            variant="outlined"
            rows="3"
            class="mb-4"
          />
          
          <v-text-field
            v-model="currentTask.dueDate"
            label="Data de Vencimento"
            type="date"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-4"
          />
          
          <div class="mb-4">
            <v-label class="mb-2">Prioridade</v-label>
            <v-chip-group v-model="currentTask.priority" mandatory>
              <v-chip value="low" color="success" variant="tonal">Baixa</v-chip>
              <v-chip value="medium" color="warning" variant="tonal">Média</v-chip>
              <v-chip value="high" color="error" variant="tonal">Alta</v-chip>
            </v-chip-group>
          </div>
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="dialog = false">Cancelar</v-btn>
        <v-btn color="primary" @click="saveTask">
          {{ editMode ? 'Salvar' : 'Adicionar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>