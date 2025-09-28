import { RouteObject } from 'react-router-dom';
import OrbatMapperModule from './index';

const orbatMapperRoutes: RouteObject[] = [
  {
    path: '/dashboard/orbat-mapper/*',
    element: <OrbatMapperModule />,
  },
];

export default orbatMapperRoutes;