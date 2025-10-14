export const SYMBOL_DESIGNER_ROUTE_NAME = 'symbol-designer';

export const getSymbolDesignerRoute = () => ({
  path: '/symbol-designer',
  name: SYMBOL_DESIGNER_ROUTE_NAME,
  component: () => import('./pages/SymbolDesignerPage.vue'),
});

export * from './store/symbolDesignerStore';


