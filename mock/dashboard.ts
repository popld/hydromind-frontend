import { dashboardOverview } from '../src/mock-data/dashboard';
import { buildResponse } from './_utils';

export default {
  'GET /api/v1/dashboard/overview': (_req: any, res: any) => {
    res.send(buildResponse(dashboardOverview));
  },
};
