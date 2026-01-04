import { createRouter, createWebHistory, type RouteRecordRaw, type NavigationGuardNext, type RouteLocationNormalized } from "vue-router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import {
  CHART_EDIT_MODE_ROUTE,
  CONTROL_SYMBOLS_ROUTE,
  GRID_EDIT_ROUTE,
  MAP_EDIT_MODE_ROUTE,
  NEW_SCENARIO_ROUTE,
  ORBAT_CHART_ROUTE,
  STORY_MODE_ROUTE,
  TACTICAL_GRAPHICS_ROUTE,
  TACTICAL_SYMBOL_DEFINITION_ROUTE,
  SIMPLE_TACTICAL_MAP_ROUTE,
} from "@/router/names";

declare module "vue-router" {
  interface RouteMeta {
    // is optional
    helpUrl?: string;
    requiresAuth?: boolean;
  }
}

/**
 * Route guard برای چک کردن احراز هویت
 */
function requireAuth(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  NProgress.start();
  
  // چک کردن وجود token
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    // چک کردن اینکه آیا در حالت integration هستیم
    const urlParams = new URLSearchParams(window.location.search);
    const isIntegrationMode = urlParams.get('integration') === 'react';
    
    if (isIntegrationMode) {
      // اگر در حالت integration هستیم، به parent window پیام می‌دهیم
      const parentOrigin = (() => {
        const raw = (import.meta as any).env?.VITE_PARENT_ORIGIN as string | undefined;
        return raw && raw.trim().length > 0 ? raw : 'http://127.0.0.1:3000';
      })();
      
      console.warn('[Router] No authentication token found in integration mode, requesting auth from parent');
      
      // درخواست احراز هویت از parent window
      if (window.parent && window.parent !== window) {
        try {
          window.parent.postMessage({
            type: 'ORBAT_AUTH_REQUIRED',
            origin: 'vue',
            timestamp: Date.now(),
            redirectUrl: window.location.href
          }, parentOrigin);
        } catch (e) {
          console.error('[Router] Failed to send auth request to parent:', e);
        }
      }
      
      // Redirect به صفحه login در React app
      const loginUrl = `${parentOrigin}/auth/login?redirect=${encodeURIComponent(window.location.href)}`;
      console.log('[Router] Redirecting to login:', loginUrl);
      window.location.href = loginUrl;
      return;
    } else {
      // اگر در حالت عادی هستیم، به صفحه login در React app redirect می‌کنیم
      console.warn('[Router] No authentication token found, redirecting to login');
      const parentOrigin = 'http://127.0.0.1:3000';
      const loginUrl = `${parentOrigin}/auth/login?redirect=${encodeURIComponent(window.location.href)}`;
      window.location.href = loginUrl;
      return;
    }
  }
  
  // اگر token وجود دارد، ادامه می‌دهیم
  next();
}

const ScenarioEditorWrapper = () =>
  import("../modules/scenarioeditor/ScenarioEditorWrapper.vue");
const NewScenarioView = () => import("../modules/scenarioeditor/NewScenarioView.vue");
const StoryModeView = () => import("../modules/storymode/StoryModeWrapper.vue");
const OrbatChartView = () => import("../modules/charteditor/OrbatChartViewWrapper.vue");
const ComponentsTestView = () => import("../views/ComponentsTestView.vue");
const GeoTestView = () => import("../views/GeoTestView.vue");
const GridTestView = () => import("@/modules/grid/GridTestView.vue");
const TanstackGridTestView = () => import("@/modules/grid/TanstackGridTestView.vue");
const GridEditView = () => import("@/modules/scenarioeditor/GridEditView.vue");
const ChartEditView = () => import("@/modules/scenarioeditor/ChartEditView.vue");
const ScenarioEditorMap = () => import("@/modules/scenarioeditor/ScenarioEditorMap.vue").catch(err => {
  console.error('Failed to load ScenarioEditorMap:', err);
  return import("@/views/ErrorFallback.vue"); // Fallback component
});
const SymbolDesignerPage = () => import("../modules/tactical-symbol-designer/SymbolDesignerPage.vue");
const TacticalSymbolDefinitionPage = () => import("../modules/tactical-symbols/TacticalSymbolDefinitionView.vue");
const ControlSymbolsLab = () => import("../views/ControlSymbolsLab.vue");
const SimpleTacticalMapView = () => import("../views/SimpleTacticalMapView.vue");
const routes = [
  {
    path: "/newscenario",
    name: NEW_SCENARIO_ROUTE,
    component: NewScenarioView,
    meta: { requiresAuth: true },
    beforeEnter: requireAuth,
  },
  {
    path: "/scenario/:scenarioId",
    props: true,
    component: ScenarioEditorWrapper,
    meta: { requiresAuth: true },
    beforeEnter: requireAuth,
    children: [
      {
        path: "",
        name: MAP_EDIT_MODE_ROUTE,
        component: ScenarioEditorMap,
        meta: { helpUrl: "https://docs.orbat-mapper.app/guide/map-edit-mode" },
      },
      {
        path: "grid-edit",
        name: GRID_EDIT_ROUTE,
        component: GridEditView,
        meta: { helpUrl: "https://docs.orbat-mapper.app/guide/grid-edit-mode" },
      },
      {
        path: "chart-edit",
        name: CHART_EDIT_MODE_ROUTE,
        component: ChartEditView,
        meta: { helpUrl: "https://docs.orbat-mapper.app/guide/chart-edit-mode" },
      },
    ],
  },
  {
    path: "/storymode",
    name: STORY_MODE_ROUTE,
    component: StoryModeView,
    beforeEnter: (to, from) => {
      NProgress.start();
    },
  },
  {
    path: "/chart",
    name: ORBAT_CHART_ROUTE,
    component: OrbatChartView,
    beforeEnter: (to, from) => {
      NProgress.start();
    },
  },
  {
    path: "/testcomponents",
    component: ComponentsTestView,
  },
  {
    path: "/testgeo",
    component: GeoTestView,
  },
  {
    path: "/testgrid",
    component: GridTestView,
  },
  {
    path: "/testgrid2",
    component: TanstackGridTestView,
  },
  {
    path: "/symbol-designer",
    name: "symbol-designer",
    component: SymbolDesignerPage,
    beforeEnter: (to, from) => {
      NProgress.start();
    },
  },
  {
    path: "/tactical-symbols",
    name: TACTICAL_SYMBOL_DEFINITION_ROUTE,
    component: TacticalSymbolDefinitionPage,
    beforeEnter: (to, from) => {
      NProgress.start();
    },
  },
  {
    path: "/simple-tactical-map",
    name: SIMPLE_TACTICAL_MAP_ROUTE,
    component: SimpleTacticalMapView,
    beforeEnter: (to, from) => {
      NProgress.start();
    },
  },
  {
    path: "/",
    redirect: { name: NEW_SCENARIO_ROUTE },
  },
] as RouteRecordRaw[];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

router.afterEach((to, from) => {
  // Complete the animation of the route progress bar.
  NProgress.done();
});

