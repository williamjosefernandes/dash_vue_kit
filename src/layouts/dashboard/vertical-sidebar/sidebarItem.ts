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
    to: '/main'
  },
  { header: 'Estudos' },
  {
    title: 'Disciplinas',
    icon: 'custom-book',
    to: '/main/subjects'
  },
  {
    title: 'Tarefas',
    icon: 'custom-check',
    to: '/main/tasks'
  },
  {
    title: 'Sessão de Estudo',
    icon: 'custom-play',
    to: '/main/study-session'
  },
  { divider: true },
  { header: 'Outros' },
  {
    title: 'Página Exemplo',
    icon: 'custom-sample',
    to: '/main/starter'
  }
];

export default sidebarItem;