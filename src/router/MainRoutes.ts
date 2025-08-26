const MainRoutes = {
  path: '/main',
  meta: {
    requiresAuth: true
  },
  redirect: '/main',
  component: () => import('@/layouts/dashboard/DashboardLayout.vue'),
  children: [
    {
      name: 'Dashboard',
      path: '/main',
      component: () => import('@/views/study/DashboardPage.vue')
    },
    {
      name: 'Subjects',
      path: '/main/subjects',
      component: () => import('@/views/study/SubjectsPage.vue')
    },
    {
      name: 'NewSubject',
      path: '/main/subjects/new',
      component: () => import('@/views/study/NewSubjectPage.vue')
    },
    {
      name: 'Plans',
      path: '/main/plans',
      component: () => import('@/views/study/PlansPage.vue')
    },
    {
      name: 'NewPlan',
      path: '/main/plans/new',
      component: () => import('@/views/study/NewPlanPage.vue')
    },
    {
      name: 'Tasks',
      path: '/main/tasks',
      component: () => import('@/views/study/TasksPage.vue')
    },
    {
      name: 'StudySession',
      path: '/main/study-session',
      component: () => import('@/views/study/StudySessionPage.vue')
    },
    {
      name: 'StarterPage',
      path: '/main/starter',
      component: () => import('@/views/StarterPage.vue')
    }
  ]
};

export default MainRoutes;