import { createRouter, createWebHistory } from 'vue-router';
import MainRoutes from './MainRoutes';
import PublicRoutes from './PublicRoutes';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/pages/maintenance/error/Error404Page.vue')
    },
    PublicRoutes,
    MainRoutes
  ]
});

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  token: string;
}

interface AuthStore {
  user: User | null;
  returnUrl: string | null;
  login(email: string, password: string): Promise<void>;
  logout(): void;
}

router.beforeEach(async (to, from, next) => {
  const auth: AuthStore = useAuthStore();
  
  // Páginas públicas que não requerem autenticação
  const publicPages = [
    '/', 
    '/login1', 
    '/register1', 
    '/forgot-pwd1', 
    '/check-mail1', 
    '/reset-pwd1', 
    '/code-verify1',
    '/comingsoon1',
    '/comingsoon2', 
    '/construction1',
    '/construction2',
    '/error'
  ];
  
  const isPublicPage = publicPages.includes(to.path);
  const authRequired = !isPublicPage;

  // Usuário não logado tentando acessar página restrita
  if (authRequired && !auth.user) {
    auth.returnUrl = to.fullPath;
    next('/');
  } 
  // Usuário logado tentando acessar página de login
  else if (auth.user && (to.path === '/' || to.path === '/login1')) {
    next('/main');
  } 
  // Todos os outros cenários
  else {
    next();
  }
});

router.beforeEach(() => {
  const uiStore = useUIStore();
  uiStore.isLoading = true;
});

router.afterEach(() => {
  const uiStore = useUIStore();
  uiStore.isLoading = false;
});