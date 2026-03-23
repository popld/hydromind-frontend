const routes = [
  {
    path: '/login',
    name: '登录',
    layout: false,
    component: '@/modules/auth/login',
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: '工作台',
    icon: 'dashboard',
    access: 'canDashboard',
    component: '@/modules/dashboard',
  },
  {
    path: '/knowledge',
    name: '知识中心',
    icon: 'book',
    routes: [
      {
        path: '/knowledge/qa',
        name: '知识问答',
        access: 'canKnowledgeQa',
        component: '@/modules/knowledge/qa',
      },
      {
        path: '/knowledge/base',
        name: '知识库管理',
        access: 'canKnowledgeBase',
        component: '@/modules/knowledge/base',
      },
      {
        path: '/knowledge/document',
        name: '文档管理',
        access: 'canKnowledgeDocument',
        component: '@/modules/knowledge/document',
      },
    ],
  },
  {
    path: '/system',
    name: '系统管理',
    icon: 'setting',
    routes: [
      {
        path: '/system/user',
        name: '用户管理',
        access: 'canSystemUser',
        component: '@/modules/system/user',
      },
      {
        path: '/system/dept',
        name: '部门管理',
        access: 'canSystemDept',
        component: '@/modules/system/dept',
      },
      {
        path: '/system/post',
        name: '岗位管理',
        access: 'canSystemPost',
        component: '@/modules/system/post',
      },
      {
        path: '/system/role',
        name: '角色管理',
        access: 'canSystemRole',
        component: '@/modules/system/role',
      },
      {
        path: '/system/menu',
        name: '菜单管理',
        access: 'canSystemMenu',
        component: '@/modules/system/menu',
      },
      {
        path: '/system/logs/login',
        name: '登录日志',
        access: 'canSystemLogLogin',
        component: '@/modules/system/logs/login',
      },
      {
        path: '/system/logs/operation',
        name: '操作日志',
        access: 'canSystemLogOperation',
        component: '@/modules/system/logs/operation',
      },
      {
        path: '/system/setting',
        name: '系统设置',
        access: 'canSystemSetting',
        component: '@/modules/system/setting',
      },
    ],
  },
  {
    path: '*',
    layout: false,
    component: '@/modules/not-found',
  },
];

export default routes;
