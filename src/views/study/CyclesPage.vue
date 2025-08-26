<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStudyStore } from '@/stores/study';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';
import type { CycleSubject, StudyCycle } from '@/types/study';

const studyStore = useStudyStore();
const page = ref({ title: 'Ciclos de Estudo' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Ciclos de Estudo', disabled: true, href: '#' }
]);

// Estados dos dialogs
const addSubjectDialog = ref(false);
const editSubjectDialog = ref(false);
const notesDialog = ref(false);
const editCycleDialog = ref(false);
const deleteCycleDialog = ref(false);
const currentSubject = ref<CycleSubject | null>(null);
const subjectNotes = ref('');
const cycleToDelete = ref<StudyCycle | null>(null);

// Estados da interface
const currentView = ref<'kanban' | 'list'>('kanban');
const selectedCycleId = ref<string>('');

// Form para novo subject
const newSubjectForm = ref({
  subjectId: '',
  estimatedMinutes: 25,
  priority: 'medium' as 'low' | 'medium' | 'high'
});

// Form para editar ciclo
const editCycleForm = ref({
  id: '',
  name: '',
  description: '',
  examDate: '',
  weeklyGoal: 40,
  dailyGoal: 6,
  status: 'active' as 'active' | 'paused' | 'completed'
});

// Timer display
const timerDisplay = ref('00:00');
let timerInterval: number | null = null;

// Computed properties
const activeCycle = computed(() => studyStore.getActiveCycle);
const allCycles = computed(() => studyStore.studyCycles);
const daysUntilExam = computed(() => studyStore.getDaysUntilExam);
const weeklyProgress = computed(() => studyStore.getWeeklyProgress);
const weeklyHours = computed(() => studyStore.getStudyStats.weeklyHours);

const completedCycles = computed(() => 
  studyStore.studyCycles.filter(cycle => cycle.status === 'completed')
);

const upcomingCycles = computed(() => 
  studyStore.studyCycles.filter(cycle => cycle.status === 'draft' || cycle.status === 'paused')
);

const toStudySubjects = computed(() => studyStore.getCycleSubjectsByStatus('to_study'));
const studyingSubjects = computed(() => studyStore.getCycleSubjectsByStatus('studying'));
const completedSubjects = computed(() => studyStore.getCycleSubjectsByStatus('completed'));

const currentStudyingSubject = computed(() => {
  return studyingSubjects.value.length > 0 ? studyingSubjects.value[0] : null;
});

const selectedCycle = computed(() => {
  if (selectedCycleId.value) {
    return studyStore.studyCycles.find(c => c.id === selectedCycleId.value);
  }
  return activeCycle.value;
});

// Methods
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'success';
    default: return 'primary';
  }
};

const getPriorityIcon = (priority:
)