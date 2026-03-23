import { mockCurrentUser } from '../src/mock-data/auth';
import { buildResponse } from './_utils';

export default {
  'POST /api/v1/auth/login': (req: any, res: any) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      res.statusCode = 400;
      res.send({ code: 400, success: false, message: '用户名和密码不能为空', data: null, traceId: `mock-${Date.now()}` });
      return;
    }
    res.send(buildResponse({ accessToken: 'mock-token-admin', expiresIn: 7200 }));
  },
  'POST /api/v1/auth/logout': (_req: any, res: any) => {
    res.send(buildResponse(true));
  },
  'GET /api/v1/auth/current-user': (_req: any, res: any) => {
    res.send(buildResponse(mockCurrentUser));
  },
};
