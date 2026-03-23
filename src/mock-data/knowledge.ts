import type { ConversationMessage, ConversationSummary, KnowledgeBaseItem, KnowledgeDocumentItem } from '@/types/knowledge';

export const knowledgeBases: KnowledgeBaseItem[] = [
  { id: 'kb-1', name: '企业制度库', description: '制度、流程、规范文档集合', ownerUsername: 'admin', documentCount: 128, status: 'enabled', updatedAt: '2026-03-23 09:00' },
  { id: 'kb-2', name: '项目交付库', description: '项目交付与实施案例', ownerUsername: 'zhangsan', documentCount: 76, status: 'enabled', updatedAt: '2026-03-22 16:10' },
  { id: 'kb-3', name: '产品资料库', description: '产品说明、FAQ、业务介绍', ownerUsername: 'lisi', documentCount: 59, status: 'disabled', updatedAt: '2026-03-20 11:30' },
];

export const knowledgeDocuments: KnowledgeDocumentItem[] = [
  { id: 'doc-1', title: '员工请假管理制度', baseId: 'kb-1', baseName: '企业制度库', ownerUsername: 'admin', status: 'indexed', updatedAt: '2026-03-23 08:30' },
  { id: 'doc-2', title: '采购审批流程说明', baseId: 'kb-1', baseName: '企业制度库', ownerUsername: 'admin', status: 'indexed', updatedAt: '2026-03-22 15:20' },
  { id: 'doc-3', title: '交付项目复盘模板', baseId: 'kb-2', baseName: '项目交付库', ownerUsername: 'zhangsan', status: 'draft', updatedAt: '2026-03-21 10:15' },
  { id: 'doc-4', title: '产品标准问答集', baseId: 'kb-3', baseName: '产品资料库', ownerUsername: 'lisi', status: 'indexed', updatedAt: '2026-03-20 14:00' },
];

export const conversations: ConversationSummary[] = [
  { id: 'conv-1', title: '请假审批流程', updatedAt: '2026-03-23 09:15' },
  { id: 'conv-2', title: '项目复盘模板怎么用', updatedAt: '2026-03-22 17:00' },
];

export const conversationMessages: Record<string, ConversationMessage[]> = {
  'conv-1': [
    {
      id: 'msg-1',
      role: 'user',
      content: '员工请假审批流程是什么？',
      createdAt: '2026-03-23 09:12',
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: '员工请假流程通常分为提交申请、直属上级审批、HR 备案三个步骤。对于 3 天以上请假，还需要部门负责人复核。',
      createdAt: '2026-03-23 09:13',
      references: [
        {
          id: 'ref-1',
          title: '员工请假管理制度',
          sourceType: 'document',
          snippet: '请假申请由申请人提交，直属上级审批后生效，超过 3 天需部门负责人追加审核。',
        },
      ],
    },
  ],
  'conv-2': [
    {
      id: 'msg-3',
      role: 'user',
      content: '项目复盘模板主要包含哪些内容？',
      createdAt: '2026-03-22 16:55',
    },
    {
      id: 'msg-4',
      role: 'assistant',
      content: '建议至少覆盖项目目标、交付结果、关键偏差、风险问题、改进建议五部分。',
      createdAt: '2026-03-22 16:57',
      references: [
        {
          id: 'ref-2',
          title: '交付项目复盘模板',
          sourceType: 'document',
          snippet: '复盘需沉淀目标、范围、成果、偏差、原因、改进项及后续行动。',
        },
      ],
    },
  ],
};
