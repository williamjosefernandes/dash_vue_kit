const MainRoutes = {
  path: '/main',
  meta: {
    requiresAuth: true
  },
  redirect: '/main/dashboard',
  component: () => import('@/layouts/dashboard/DashboardLayout.vue'),
  children: [
    {
      name: 'Dashboard',
      path: '/',
      component: () => import('@/views/study/DashboardPage.vue')
    },
    {
      name: 'Subjects',
      path: '/subjects',
      component: () => import('@/views/study/SubjectsPage.vue')
    },
    {
      name: 'Tasks',
      path: '/tasks',
      component: () => import('@/views/study/TasksPage.vue')
    },
    {
      name: 'StudySession',
      path: '/study-session',
      component: () => import('@/views/study/StudySessionPage.vue')
    }
  ]
};

export default MainRoutes;
