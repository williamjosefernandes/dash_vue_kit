const PublicRoutes = {
  path: '/',
  component: () => import('@/layouts/blank/BlankLayout.vue'),
  meta: {
    requiresAuth: false
  },
  children: [
    {
      name: 'Login',
      path: '/',
      component: () => import('@/views/authentication/LoginPage.vue')
    },
    {
      name: 'Login1',
      path: '/login1',
      component: () => import('@/views/authentication/auth1/LoginPage1.vue')
    },
    {
      name: 'Register',
      path: '/register1',
      component: () => import('@/views/authentication/auth1/RegisterPage1.vue')
    },
    {
      name: 'Forgot Password',
      path: '/forgot-pwd1',
      component: () => import('@/views/authentication/auth1/ForgotPwd1.vue')
    },
    {
      name: 'Check Mail',
      path: '/check-mail1',
      component: () => import('@/views/authentication/auth1/CheckMail1.vue')
    },
    {
      name: 'Reset Password',
      path: '/reset-pwd1',
      component: () => import('@/views/authentication/auth1/ResetPwd1.vue')
    },
    {
      name: 'Code Verification',
      path: '/code-verify1',
      component: () => import('@/views/authentication/auth1/CodeVerification1.vue')
    },
    {
      name: 'Coming Soon 1',
      path: '/comingsoon1',
      component: () => import('@/views/pages/maintenance/comingsoon/Comingsoon1.vue')
    },
    {
      name: 'Coming Soon 2',
      path: '/comingsoon2',
      component: () => import('@/views/pages/maintenance/comingsoon/Comingsoon2.vue')
    },
    {
      name: 'Under Construction 1',
      path: '/construction1',
      component: () => import('@/views/pages/underconstruction/UnderConstruction1.vue')
    },
    {
      name: 'Under Construction 2',
      path: '/construction2',
      component: () => import('@/views/pages/underconstruction/UnderConstruction2.vue')
    },
    {
      name: 'Error 404',
      path: '/error',
      component: () => import('@/views/pages/maintenance/error/Error404Page.vue')
    }
  ]
};

export default PublicRoutes;