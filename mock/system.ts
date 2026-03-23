import { deptTree, loginLogs, menuTree, operationLogs, posts, roles, systemSettings, users } from '../src/mock-data/system';
import type { DeptTreeItem, MenuItem } from '../src/types/system';
import { buildPageResult, buildResponse, keywordFilter } from './_utils';

function nowText() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function findTreeNode<T extends { id: string; children?: T[] }>(tree: T[], id: string): T | undefined {
  for (const item of tree) {
    if (item.id === id) {
      return item;
    }
    if (item.children?.length) {
      const matched = findTreeNode(item.children, id);
      if (matched) {
        return matched;
      }
    }
  }
  return undefined;
}

function updateTreeNode<T extends { id: string; children?: T[] }>(tree: T[], id: string, updater: (node: T) => void): boolean {
  for (const item of tree) {
    if (item.id === id) {
      updater(item);
      return true;
    }
    if (item.children?.length && updateTreeNode(item.children, id, updater)) {
      return true;
    }
  }
  return false;
}

function removeTreeNode<T extends { id: string; children?: T[] }>(tree: T[], id: string): boolean {
  const index = tree.findIndex((item) => item.id === id);
  if (index >= 0) {
    tree.splice(index, 1);
    return true;
  }
  return tree.some((item) => item.children?.length ? removeTreeNode(item.children, id) : false);
}

function appendDeptNode(node: DeptTreeItem) {
  if (!node.parentId) {
    deptTree.push(node);
    return;
  }
  const parent = findTreeNode(deptTree, node.parentId);
  if (!parent) {
    deptTree.push(node);
    return;
  }
  parent.children = parent.children ?? [];
  parent.children.push(node);
}

function appendMenuNode(node: MenuItem) {
  if (!node.parentId) {
    menuTree.push(node);
    return;
  }
  const parent = findTreeNode(menuTree, node.parentId);
  if (!parent) {
    menuTree.push(node);
    return;
  }
  parent.children = parent.children ?? [];
  parent.children.push(node);
}

export default {
  'GET /api/v1/system/users': (req: any, res: any) => {
    const { pageNum = 1, pageSize = 10, keyword } = req.query || {};
    const filtered = keywordFilter(users, keyword, ['username', 'nickname', 'deptName']);
    res.send(buildResponse(buildPageResult(filtered, Number(pageNum), Number(pageSize))));
  },
  'POST /api/v1/system/users': (req: any, res: any) => {
    const payload = req.body || {};
    const item = {
      id: `u-${Date.now()}`,
      username: payload.username,
      nickname: payload.nickname,
      deptName: payload.deptName,
      postNames: payload.postNames || [],
      roleNames: payload.roleNames || [],
      status: payload.status || 'enabled',
      createdAt: nowText(),
    };
    users.unshift(item);
    res.send(buildResponse(item));
  },
  'PUT /api/v1/system/users/:id': (req: any, res: any) => {
    const item = users.find((record) => record.id === req.params.id);
    Object.assign(item || {}, req.body || {});
    res.send(buildResponse(item));
  },
  'DELETE /api/v1/system/users/:id': (req: any, res: any) => {
    const index = users.findIndex((record) => record.id === req.params.id);
    if (index >= 0) {
      users.splice(index, 1);
    }
    res.send(buildResponse(true));
  },
  'GET /api/v1/system/depts/tree': (_req: any, res: any) => {
    res.send(buildResponse(deptTree));
  },
  'POST /api/v1/system/depts': (req: any, res: any) => {
    const item = {
      id: `dept-${Date.now()}`,
      name: req.body?.name,
      parentId: req.body?.parentId,
    };
    appendDeptNode(item);
    res.send(buildResponse(item));
  },
  'PUT /api/v1/system/depts/:id': (req: any, res: any) => {
    let updated: DeptTreeItem | undefined;
    updateTreeNode(deptTree, req.params.id, (node) => {
      node.name = req.body?.name ?? node.name;
      updated = node;
    });
    res.send(buildResponse(updated));
  },
  'DELETE /api/v1/system/depts/:id': (req: any, res: any) => {
    removeTreeNode(deptTree, req.params.id);
    res.send(buildResponse(true));
  },
  'GET /api/v1/system/posts': (req: any, res: any) => {
    const { pageNum = 1, pageSize = 10, keyword } = req.query || {};
    const filtered = keywordFilter(posts, keyword, ['name', 'code']);
    res.send(buildResponse(buildPageResult(filtered, Number(pageNum), Number(pageSize))));
  },
  'POST /api/v1/system/posts': (req: any, res: any) => {
    const item = { id: `post-${Date.now()}`, ...req.body };
    posts.unshift(item);
    res.send(buildResponse(item));
  },
  'PUT /api/v1/system/posts/:id': (req: any, res: any) => {
    const item = posts.find((record) => record.id === req.params.id);
    Object.assign(item || {}, req.body || {});
    res.send(buildResponse(item));
  },
  'DELETE /api/v1/system/posts/:id': (req: any, res: any) => {
    const index = posts.findIndex((record) => record.id === req.params.id);
    if (index >= 0) {
      posts.splice(index, 1);
    }
    res.send(buildResponse(true));
  },
  'GET /api/v1/system/roles': (req: any, res: any) => {
    const { pageNum = 1, pageSize = 10, keyword } = req.query || {};
    const filtered = keywordFilter(roles, keyword, ['name', 'code']);
    res.send(buildResponse(buildPageResult(filtered, Number(pageNum), Number(pageSize))));
  },
  'POST /api/v1/system/roles': (req: any, res: any) => {
    const item = { id: `role-${Date.now()}`, ...req.body };
    roles.unshift(item);
    res.send(buildResponse(item));
  },
  'PUT /api/v1/system/roles/:id': (req: any, res: any) => {
    const item = roles.find((record) => record.id === req.params.id);
    Object.assign(item || {}, req.body || {});
    res.send(buildResponse(item));
  },
  'DELETE /api/v1/system/roles/:id': (req: any, res: any) => {
    const index = roles.findIndex((record) => record.id === req.params.id);
    if (index >= 0) {
      roles.splice(index, 1);
    }
    res.send(buildResponse(true));
  },
  'GET /api/v1/system/menus/tree': (_req: any, res: any) => {
    res.send(buildResponse(menuTree));
  },
  'POST /api/v1/system/menus': (req: any, res: any) => {
    const item = { id: `menu-${Date.now()}`, ...req.body };
    appendMenuNode(item);
    res.send(buildResponse(item));
  },
  'PUT /api/v1/system/menus/:id': (req: any, res: any) => {
    let updated: MenuItem | undefined;
    updateTreeNode(menuTree, req.params.id, (node) => {
      Object.assign(node, req.body || {});
      updated = node;
    });
    res.send(buildResponse(updated));
  },
  'DELETE /api/v1/system/menus/:id': (req: any, res: any) => {
    removeTreeNode(menuTree, req.params.id);
    res.send(buildResponse(true));
  },
  'GET /api/v1/system/logs/login': (req: any, res: any) => {
    const { pageNum = 1, pageSize = 10, keyword } = req.query || {};
    const filtered = keywordFilter(loginLogs, keyword, ['username', 'ip', 'browser']);
    res.send(buildResponse(buildPageResult(filtered, Number(pageNum), Number(pageSize))));
  },
  'GET /api/v1/system/logs/operation': (req: any, res: any) => {
    const { pageNum = 1, pageSize = 10, keyword } = req.query || {};
    const filtered = keywordFilter(operationLogs, keyword, ['operator', 'action', 'target']);
    res.send(buildResponse(buildPageResult(filtered, Number(pageNum), Number(pageSize))));
  },
  'GET /api/v1/system/settings': (_req: any, res: any) => {
    res.send(buildResponse(systemSettings));
  },
  'PUT /api/v1/system/settings': (req: any, res: any) => {
    Object.assign(systemSettings, req.body || {});
    res.send(buildResponse(systemSettings));
  },
};
