export interface menu {
  header?: string;
  title?: string;
  icon?: string;
  to?: string;
  divider?: boolean;
  chip?: string;
  chipColor?: string;
  chipVariant?: string;
  chipIcon?: string;
  children?: menu[];
  disabled?: boolean;
  type?: string;
  subCaption?: string;
}

const sidebarItem: menu[] = [
  { header: 'Dashboard' },
  {
    title: 'Dashboard',
    icon: 'custom-home',
    to: '/'
  },
  { header: 'Estudos' },
  {
    title: 'Disciplinas',
    icon: 'custom-book',
    to: '/subjects'
  },
  {
    title: 'Tarefas',
    icon: 'custom-check',
    to: '/tasks'
  },
  {
    title: 'Sessão de Estudo',
    icon: 'custom-play',
    to: '/study-session'
  },
  { header: 'Configurações' },
  {
    title: 'Planos de Estudo',
    icon: 'custom-calendar',
    to: '/study-plans',
    children: [
      {
        title: 'Meus Planos',
        to: '/study-plans'
      },
      {
        title: 'Criar Plano',
        to: '/study-plans/create'
      }
    ]
  },
  {
    title: 'Relatórios',
    icon: 'custom-chart',
    to: '/reports',
    type: 'external'
  }
];

export default sidebarItem;
