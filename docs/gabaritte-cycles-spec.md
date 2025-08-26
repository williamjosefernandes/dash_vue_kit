# Especificação Técnica - Tela Ciclo de Estudos Gabaritte

## 1. Visão Geral

### 1.1 Objetivo
Criar uma interface Kanban gamificada para gestão de ciclos de estudo em concursos públicos, utilizando IA para personalização e elementos de motivação para engajamento do usuário.

### 1.2 Público-Alvo
Estudantes de concursos públicos que buscam organização, produtividade e acompanhamento de progresso nos estudos.

---

## 2. Paleta de Cores e Identidade Visual

### 2.1 Cores Primárias
```css
:root {
  --gabaritte-dark-blue: #003366;    /* Títulos principais */
  --gabaritte-medium-blue: #1E90FF;  /* Cartões e elementos interativos */
  --gabaritte-success: #28A745;      /* Sucessos e conclusões */
  --gabaritte-danger: #DC3545;       /* Alertas e urgências */
  --gabaritte-warning: #FFA500;      /* Avisos e atenção */
  --gabaritte-light-gray: #F5F5F5;   /* Fundos e áreas neutras */
}
```

### 2.2 Cores Secundárias
```css
:root {
  --gabaritte-blue-light: #E6F3FF;   /* Fundos de cartões */
  --gabaritte-blue-hover: #0066CC;   /* Estados hover */
  --gabaritte-success-light: #D4EDDA; /* Fundos de sucesso */
  --gabaritte-danger-light: #F8D7DA;  /* Fundos de alerta */
  --gabaritte-warning-light: #FFF3CD; /* Fundos de aviso */
  --gabaritte-gray-medium: #6C757D;   /* Textos secundários */
  --gabaritte-gray-dark: #343A40;     /* Textos principais */
}
```

---

## 3. Tipografia

### 3.1 Hierarquia Tipográfica
```css
/* Títulos Principais */
.gabaritte-h1 {
  font-family: 'Inter', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: var(--gabaritte-dark-blue);
  line-height: 1.2;
}

/* Títulos de Seção */
.gabaritte-h2 {
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gabaritte-dark-blue);
  line-height: 1.3;
}

/* Títulos de Cartão */
.gabaritte-h3 {
  font-family: 'Inter', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gabaritte-gray-dark);
  line-height: 1.4;
}

/* Texto Corpo */
.gabaritte-body {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--gabaritte-gray-dark);
  line-height: 1.5;
}

/* Texto Secundário */
.gabaritte-caption {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--gabaritte-gray-medium);
  line-height: 1.4;
}
```

---

## 4. Layout e Estrutura

### 4.1 Grid System
```css
.gabaritte-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
}

.gabaritte-kanban-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  min-height: calc(100vh - 200px);
}

@media (max-width: 1024px) {
  .gabaritte-kanban-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .gabaritte-kanban-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
```

### 4.2 Header Fixo
```html
<header class="gabaritte-header">
  <div class="gabaritte-header-content">
    <!-- Logo -->
    <div class="gabaritte-logo">
      <img src="/logo-gabaritte.svg" alt="Gabaritte" />
    </div>
    
    <!-- Controles Centrais -->
    <div class="gabaritte-header-controls">
      <button class="gabaritte-btn-primary">
        <icon name="play" />
        Iniciar Estudo
      </button>
      <button class="gabaritte-btn-secondary">
        <icon name="settings" />
        Configurar IA
      </button>
    </div>
    
    <!-- Avatar e Menu -->
    <div class="gabaritte-user-menu">
      <div class="gabaritte-user-stats">
        <span class="streak-counter">🔥 7 dias</span>
        <span class="xp-counter">⭐ 1.250 XP</span>
      </div>
      <avatar class="gabaritte-avatar" />
    </div>
  </div>
</header>
```

### 4.3 Subheader com Progresso
```html
<section class="gabaritte-subheader">
  <div class="gabaritte-contest-info">
    <h2 class="contest-name">Concurso PCDF - Escrivão</h2>
    <div class="contest-meta">
      <span class="days-remaining">📅 45 dias restantes</span>
      <span class="study-goal">🎯 Meta: 6h/dia</span>
    </div>
  </div>
  
  <div class="gabaritte-weekly-progress">
    <h3>Progresso Semanal</h3>
    <div class="progress-bar-container">
      <div class="progress-bar" style="width: 68%"></div>
      <span class="progress-text">24h / 35h</span>
    </div>
    <div class="weekly-days">
      <div class="day completed">S</div>
      <div class="day completed">T</div>
      <div class="day completed">Q</div>
      <div class="day current">Q</div>
      <div class="day">S</div>
      <div class="day">S</div>
      <div class="day">D</div>
    </div>
  </div>
</section>
```

---

## 5. Componentes Kanban

### 5.1 Estrutura das Colunas
```html
<div class="gabaritte-kanban-column" data-status="to-study">
  <header class="column-header">
    <h3 class="column-title">
      <icon name="book" />
      A Estudar
      <span class="item-count">12</span>
    </h3>
    <button class="add-item-btn">
      <icon name="plus" />
    </button>
  </header>
  
  <div class="column-content" data-droppable="true">
    <!-- Cartões de estudo aqui -->
  </div>
  
  <footer class="column-footer">
    <div class="column-stats">
      <span class="total-time">⏱️ 18h restantes</span>
    </div>
  </footer>
</div>
```

### 5.2 Especificação das 4 Colunas

#### Coluna 1: "A Estudar"
```css
.column-to-study {
  background: linear-gradient(135deg, #E6F3FF 0%, #F0F8FF 100%);
  border-top: 4px solid var(--gabaritte-medium-blue);
}

.column-to-study .column-title {
  color: var(--gabaritte-dark-blue);
}

.column-to-study .study-card {
  background: white;
  border-left: 4px solid var(--gabaritte-medium-blue);
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.1);
}
```

#### Coluna 2: "Em Estudo"
```css
.column-studying {
  background: linear-gradient(135deg, #FFF3CD 0%, #FFFBF0 100%);
  border-top: 4px solid var(--gabaritte-warning);
}

.column-studying .pomodoro-timer {
  position: sticky;
  top: 0;
  background: var(--gabaritte-warning);
  color: white;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  text-align: center;
  font-weight: 600;
}
```

#### Coluna 3: "Revisão"
```css
.column-review {
  background: linear-gradient(135deg, #F8D7DA 0%, #FDF2F2 100%);
  border-top: 4px solid var(--gabaritte-danger);
}

.column-review .study-card {
  background: white;
  border-left: 4px solid var(--gabaritte-danger);
  position: relative;
}

.column-review .study-card::before {
  content: "🔄";
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 1.2rem;
}
```

#### Coluna 4: "Concluído"
```css
.column-completed {
  background: linear-gradient(135deg, #D4EDDA 0%, #F0FFF0 100%);
  border-top: 4px solid var(--gabaritte-success);
}

.column-completed .study-card {
  background: white;
  border-left: 4px solid var(--gabaritte-success);
  opacity: 0.8;
}

.column-completed .study-card::after {
  content: "✅";
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 1.2rem;
}
```

---

## 6. Cartões de Estudo

### 6.1 Estrutura do Cartão
```html
<div class="gabaritte-study-card" draggable="true" data-priority="high">
  <header class="card-header">
    <h4 class="subject-name">Direito Constitucional</h4>
    <div class="card-badges">
      <span class="priority-badge high">Alta</span>
      <span class="weight-badge">Peso 4</span>
    </div>
  </header>
  
  <div class="card-content">
    <div class="topic-info">
      <p class="topic-title">Direitos Fundamentais - Teoria Geral</p>
      <div class="time-info">
        <span class="estimated-time">⏱️ 2h previsto</span>
        <span class="studied-time">📚 45min estudado</span>
      </div>
    </div>
    
    <div class="progress-section">
      <div class="progress-bar-mini">
        <div class="progress-fill" style="width: 37.5%"></div>
      </div>
      <span class="progress-text">37.5%</span>
    </div>
  </div>
  
  <footer class="card-footer">
    <div class="card-actions">
      <button class="action-btn primary">
        <icon name="play" />
        Estudar
      </button>
      <button class="action-btn secondary">
        <icon name="more" />
      </button>
    </div>
    
    <div class="ai-suggestion">
      <icon name="sparkles" />
      <span>IA sugere: Revisar em 2 dias</span>
    </div>
  </footer>
</div>
```

### 6.2 Estados Visuais dos Cartões

#### Estado Padrão
```css
.gabaritte-study-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: grab;
}

.gabaritte-study-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
```

#### Estado Arrastando
```css
.gabaritte-study-card.dragging {
  transform: rotate(5deg) scale(1.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  cursor: grabbing;
}
```

#### Estado Drop Zone Ativo
```css
.column-content.drop-active {
  background: rgba(30, 144, 255, 0.1);
  border: 2px dashed var(--gabaritte-medium-blue);
  border-radius: 8px;
}
```

### 6.3 Badges e Indicadores

#### Badge de Prioridade
```css
.priority-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-badge.high {
  background: var(--gabaritte-danger-light);
  color: var(--gabaritte-danger);
}

.priority-badge.medium {
  background: var(--gabaritte-warning-light);
  color: var(--gabaritte-warning);
}

.priority-badge.low {
  background: var(--gabaritte-success-light);
  color: var(--gabaritte-success);
}
```

#### Badge de Peso no Edital
```css
.weight-badge {
  background: var(--gabaritte-blue-light);
  color: var(--gabaritte-dark-blue);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}
```

---

## 7. Cronômetro Pomodoro

### 7.1 Interface do Timer
```html
<div class="gabaritte-pomodoro-timer">
  <div class="timer-display">
    <div class="time-circle">
      <svg class="progress-ring" width="80" height="80">
        <circle class="progress-ring-background" cx="40" cy="40" r="36"/>
        <circle class="progress-ring-progress" cx="40" cy="40" r="36"/>
      </svg>
      <div class="time-text">25:00</div>
    </div>
  </div>
  
  <div class="timer-controls">
    <button class="timer-btn play">
      <icon name="play" />
    </button>
    <button class="timer-btn pause">
      <icon name="pause" />
    </button>
    <button class="timer-btn reset">
      <icon name="refresh" />
    </button>
  </div>
  
  <div class="timer-info">
    <span class="session-count">Sessão 2/4</span>
    <span class="break-next">Pausa em 25min</span>
  </div>
</div>
```

### 7.2 Estados do Timer
```css
.gabaritte-pomodoro-timer.active {
  background: linear-gradient(135deg, #28A745, #20C997);
  animation: pulse 2s infinite;
}

.gabaritte-pomodoro-timer.paused {
  background: linear-gradient(135deg, #FFA500, #FFB347);
}

.gabaritte-pomodoro-timer.break {
  background: linear-gradient(135deg, #17A2B8, #20C997);
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
  100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
}
```

---

## 8. Gamificação e Feedback

### 8.1 Sistema de XP e Conquistas
```html
<div class="gabaritte-gamification">
  <div class="xp-gain-animation" data-xp="50">
    +50 XP
  </div>
  
  <div class="achievement-unlock">
    <div class="achievement-icon">🏆</div>
    <div class="achievement-text">
      <h4>Conquistou: Estudioso Dedicado</h4>
      <p>Estudou por 5 dias consecutivos!</p>
    </div>
  </div>
  
  <div class="streak-counter">
    <div class="streak-flame">🔥</div>
    <div class="streak-number">7</div>
    <div class="streak-text">dias seguidos</div>
  </div>
</div>
```

### 8.2 Animações de Feedback
```css
@keyframes xpGain {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  50% {
    transform: translateY(-20px) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translateY(-40px) scale(1);
    opacity: 0;
  }
}

@keyframes achievementSlide {
  0% {
    transform: translateX(100%);
    opacity: 0;
  }
  20% {
    transform: translateX(0);
    opacity: 1;
  }
  80% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}

.xp-gain-animation {
  animation: xpGain 2s ease-out forwards;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--gabaritte-success);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  z-index: 9999;
}
```

---

## 9. Interações e Comportamentos

### 9.1 Drag & Drop
```javascript
// Configuração do sistema drag & drop
const dragDropConfig = {
  dragStart: (card) => {
    card.classList.add('dragging');
    card.style.opacity = '0.8';
  },
  
  dragOver: (column) => {
    column.classList.add('drop-active');
    return false; // Permite drop
  },
  
  dragLeave: (column) => {
    column.classList.remove('drop-active');
  },
  
  drop: (card, targetColumn) => {
    // Lógica de movimentação entre colunas
    const sourceColumn = card.parentElement;
    const targetStatus = targetColumn.dataset.status;
    
    // Animação de movimento
    card.style.transform = 'scale(0.9)';
    setTimeout(() => {
      targetColumn.appendChild(card);
      card.style.transform = 'scale(1)';
      card.classList.remove('dragging');
      
      // Trigger gamification
      triggerXPGain(25);
      updateColumnStats();
    }, 200);
  }
};
```

### 9.2 Responsividade
```css
/* Desktop (1440px+) */
@media (min-width: 1440px) {
  .gabaritte-kanban-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 32px;
  }
  
  .gabaritte-study-card {
    padding: 20px;
  }
}

/* Tablet (768px - 1439px) */
@media (min-width: 768px) and (max-width: 1439px) {
  .gabaritte-kanban-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  .gabaritte-header-controls {
    display: none; /* Mover para menu hambúrguer */
  }
}

/* Mobile (até 767px) */
@media (max-width: 767px) {
  .gabaritte-kanban-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .gabaritte-study-card {
    padding: 12px;
  }
  
  .card-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  /* Navegação por tabs em mobile */
  .mobile-column-tabs {
    display: flex;
    background: white;
    border-bottom: 1px solid #E0E0E0;
    position: sticky;
    top: 60px;
    z-index: 100;
  }
  
  .mobile-tab {
    flex: 1;
    padding: 12px;
    text-align: center;
    border-bottom: 3px solid transparent;
    transition: all 0.3s ease;
  }
  
  .mobile-tab.active {
    border-bottom-color: var(--gabaritte-medium-blue);
    background: var(--gabaritte-blue-light);
  }
}
```

---

## 10. Estados de Loading e Erro

### 10.1 Loading States
```html
<!-- Loading de cartão -->
<div class="gabaritte-card-skeleton">
  <div class="skeleton-header">
    <div class="skeleton-title"></div>
    <div class="skeleton-badges">
      <div class="skeleton-badge"></div>
      <div class="skeleton-badge"></div>
    </div>
  </div>
  <div class="skeleton-content">
    <div class="skeleton-text"></div>
    <div class="skeleton-text short"></div>
    <div class="skeleton-progress"></div>
  </div>
</div>

<!-- Loading de coluna -->
<div class="gabaritte-column-skeleton">
  <div class="skeleton-column-header"></div>
  <div class="skeleton-cards">
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
  </div>
</div>
```

### 10.2 Estados de Erro
```html
<div class="gabaritte-error-state">
  <div class="error-icon">⚠️</div>
  <h3>Ops! Algo deu errado</h3>
  <p>Não foi possível carregar seus ciclos de estudo.</p>
  <button class="gabaritte-btn-primary">
    <icon name="refresh" />
    Tentar Novamente
  </button>
</div>

<div class="gabaritte-empty-state">
  <div class="empty-icon">📚</div>
  <h3>Nenhum ciclo de estudo encontrado</h3>
  <p>Que tal criar seu primeiro ciclo personalizado com IA?</p>
  <button class="gabaritte-btn-primary">
    <icon name="plus" />
    Criar Ciclo com IA
  </button>
</div>
```

---

## 11. Acessibilidade

### 11.1 ARIA Labels e Roles
```html
<div class="gabaritte-kanban-column" 
     role="region" 
     aria-label="Coluna A Estudar"
     aria-describedby="column-description-1">
  
  <div id="column-description-1" class="sr-only">
    Coluna contendo matérias que ainda não foram iniciadas
  </div>
  
  <div class="gabaritte-study-card" 
       role="button"
       tabindex="0"
       aria-label="Direito Constitucional - 2 horas previstas"
       aria-describedby="card-details-1">
    
    <div id="card-details-1" class="sr-only">
      Matéria de alta prioridade, peso 4 no edital, 45 minutos já estudados
    </div>
  </div>
</div>
```

### 11.2 Navegação por Teclado
```css
.gabaritte-study-card:focus {
  outline: 3px solid var(--gabaritte-medium-blue);
  outline-offset: 2px;
}

.gabaritte-study-card[aria-selected="true"] {
  background: var(--gabaritte-blue-light);
  border-color: var(--gabaritte-medium-blue);
}

/* Atalhos de teclado */
.keyboard-shortcuts {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.75rem;
}
```

---

## 12. Performance e Otimização

### 12.1 Lazy Loading
```javascript
// Lazy loading de cartões
const observerOptions = {
  root: null,
  rootMargin: '50px',
  threshold: 0.1
};

const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadCardContent(entry.target);
      cardObserver.unobserve(entry.target);
    }
  });
}, observerOptions);
```

### 12.2 Otimizações CSS
```css
/* Usar transform para animações (GPU) */
.gabaritte-study-card {
  will-change: transform;
  transform: translateZ(0); /* Force GPU layer */
}

/* Otimizar repaints */
.column-content {
  contain: layout style paint;
}

/* Reduzir complexidade de seletores */
.card-hover-effect {
  transition: transform 0.2s ease;
}
```

---

## 13. Integração com IA

### 13.1 Sugestões Inteligentes
```html
<div class="gabaritte-ai-suggestions">
  <div class="ai-header">
    <icon name="sparkles" />
    <span>Sugestões da IA</span>
  </div>
  
  <div class="suggestion-card">
    <div class="suggestion-type">Otimização de Tempo</div>
    <p>Baseado no seu histórico, você aprende Direito Penal melhor pela manhã. Que tal mover para "Em Estudo"?</p>
    <div class="suggestion-actions">
      <button class="accept-suggestion">Aceitar</button>
      <button class="dismiss-suggestion">Dispensar</button>
    </div>
  </div>
</div>
```

### 13.2 Personalização Automática
```javascript
// Sistema de personalização baseado em comportamento
const aiPersonalization = {
  analyzeStudyPattern: (userHistory) => {
    // Análise de padrões de estudo
    return {
      bestStudyTime: 'morning',
      preferredSubjects: ['constitutional-law', 'criminal-law'],
      averageSessionDuration: 45,
      retentionRate: 0.78
    };
  },
  
  suggestOptimalOrder: (subjects, userPattern) => {
    // Sugestão de ordem otimizada
    return subjects.sort((a, b) => {
      return calculateOptimalScore(a, userPattern) - calculateOptimalScore(b, userPattern);
    });
  }
};
```

---

## 14. Métricas e Analytics

### 14.1 Eventos de Tracking
```javascript
// Eventos para analytics
const trackingEvents = {
  cardMoved: (from, to, cardId) => {
    analytics.track('card_moved', {
      source_column: from,
      target_column: to,
      card_id: cardId,
      timestamp: Date.now()
    });
  },
  
  studySessionStarted: (subjectId, estimatedDuration) => {
    analytics.track('study_session_started', {
      subject_id: subjectId,
      estimated_duration: estimatedDuration,
      timestamp: Date.now()
    });
  },
  
  pomodoroCompleted: (sessionNumber, subjectId) => {
    analytics.track('pomodoro_completed', {
      session_number: sessionNumber,
      subject_id: subjectId,
      timestamp: Date.now()
    });
  }
};
```

---

## 15. Testes e Validação

### 15.1 Casos de Teste UX
```javascript
// Testes de usabilidade
const uxTestCases = [
  {
    name: 'Drag and Drop Functionality',
    steps: [
      'Usuário arrasta cartão de "A Estudar" para "Em Estudo"',
      'Verificar feedback visual durante arraste',
      'Confirmar que cartão foi movido corretamente',
      'Verificar atualização de estatísticas da coluna'
    ],
    expectedResult: 'Movimento fluido com feedback visual claro'
  },
  
  {
    name: 'Pomodoro Timer Integration',
    steps: [
      'Usuário inicia timer na coluna "Em Estudo"',
      'Verificar contagem regressiva',
      'Testar pausa e retomada',
      'Confirmar notificação ao final'
    ],
    expectedResult: 'Timer funcional com notificações apropriadas'
  }
];
```

### 15.2 Testes de Performance
```javascript
// Métricas de performance
const performanceMetrics = {
  targetMetrics: {
    firstContentfulPaint: '< 1.5s',
    largestContentfulPaint: '< 2.5s',
    cumulativeLayoutShift: '< 0.1',
    firstInputDelay: '< 100ms'
  },
  
  monitoringPoints: [
    'Initial page load',
    'Card drag operations',
    'Column filtering',
    'Timer updates'
  ]
};
```

---

## 16. Documentação para Desenvolvedores

### 16.1 Estrutura de Componentes
```
src/
├── components/
│   ├── Kanban/
│   │   ├── KanbanBoard.vue
│   │   ├── KanbanColumn.vue
│   │   ├── StudyCard.vue
│   │   └── PomodoroTimer.vue
│   ├── Gamification/
│   │   ├── XPGain.vue
│   │   ├── Achievement.vue
│   │   └── StreakCounter.vue
│   └── AI/
│       ├── AISuggestions.vue
│       └── PersonalizationPanel.vue
├── stores/
│   ├── cyclesStore.js
│   ├── gamificationStore.js
│   └── aiStore.js
└── styles/
    ├── gabaritte-theme.css
    ├── kanban.css
    └── animations.css
```

### 16.2 Props e APIs
```typescript
// StudyCard Component Props
interface StudyCardProps {
  id: string;
  subject: string;
  topic: string;
  estimatedTime: number;
  studiedTime: number;
  priority: 'high' | 'medium' | 'low';
  weight: number;
  status: 'to-study' | 'studying' | 'review' | 'completed';
  aiSuggestion?: string;
  onMove: (cardId: string, newStatus: string) => void;
  onStartStudy: (cardId: string) => void;
}

// KanbanColumn Component Props
interface KanbanColumnProps {
  title: string;
  status: string;
  cards: StudyCard[];
  allowDrop: boolean;
  showTimer?: boolean;
  onCardDrop: (cardId: string, columnStatus: string) => void;
  onAddCard: () => void;
}
```

---

## 17. Conclusão

Esta especificação técnica fornece uma base sólida para implementação da tela de Ciclo de Estudos do Gabaritte, incorporando:

- **Design System Consistente**: Paleta de cores, tipografia e componentes padronizados
- **UX Gamificada**: Elementos de motivação e feedback visual
- **Funcionalidade Kanban**: Sistema drag & drop intuitivo
- **Integração com IA**: Sugestões personalizadas e otimização automática
- **Responsividade Completa**: Adaptação para todos os dispositivos
- **Acessibilidade**: Conformidade com padrões WCAG
- **Performance Otimizada**: Carregamento rápido e interações fluidas

A implementação deve seguir esta especificação para garantir uma experiência de usuário excepcional e alinhada com os objetivos educacionais da plataforma Gabaritte.