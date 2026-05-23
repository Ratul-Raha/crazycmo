'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Tag, Checkbox, List, Table, Modal, Input, Select, DatePicker, Progress, Empty, Spin, Space, Badge, Popconfirm, message, Tooltip, Calendar, Typography, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, ClockCircleOutlined, UserOutlined, MailOutlined, PhoneOutlined, GlobalOutlined, SendOutlined, SearchOutlined, CalendarOutlined, EllipsisOutlined, UserAddOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text, Title } = Typography;

const MONO = { fontFamily: "'Space Mono', monospace" };

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// ---- Reusable API hook ---- //
function useResource(workspaceId, resource) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/${resource}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {}
    setLoading(false);
  }, [workspaceId, resource]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const create = async (data) => {
    const res = await fetch(`/api/workspace/${workspaceId}/${resource}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const d = await res.json();
      setItems(prev => [d.item, ...prev]);
      message.success('Created');
      return d.item;
    }
    message.error('Failed to create');
    return null;
  };

  const update = async (id, data) => {
    const res = await fetch(`/api/workspace/${workspaceId}/${resource}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const d = await res.json();
      setItems(prev => prev.map(i => i.id === id ? d.item : i));
      return d.item;
    }
    message.error('Failed to update');
    return null;
  };

  const remove = async (id) => {
    const res = await fetch(`/api/workspace/${workspaceId}/${resource}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== id));
      message.success('Deleted');
    } else message.error('Failed to delete');
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/${resource}/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const d = await res.json();
        if (d.items?.length) {
          setItems(prev => [...d.items, ...prev]);
          message.success(`Generated ${d.count} items`);
        }
      } else {
        const d = await res.json().catch(() => ({}));
        message.error(d.rateLimited ? 'AI rate limit reached. Wait a few minutes and try again.' : (d.error || 'Generation failed'));
      }
    } catch { message.error('Generation failed'); }
    setGenerating(false);
  };

  return { items, loading, generating, fetchItems, create, update, remove, generate };
}

// ---- Priority Tag ---- //
function PriorityTag({ priority }) {
  const colors = { P1: '#00b894', P2: '#f59e0b', P3: '#8b5cf6' };
  return <Tag color={colors[priority] || 'default'} style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 600 }}>{priority}</Tag>;
}

function StageTag({ stage }) {
  const colors = { new: 'blue', contacted: 'orange', qualified: 'green', proposal: 'purple', lost: 'red' };
  return <Tag color={colors[stage] || 'default'}>{stage}</Tag>;
}

function StatusTag({ status }) {
  const colors = { planned: 'default', in_progress: 'processing', done: 'success', draft: 'default', published: 'success', pending: 'default' };
  return <Tag color={colors[status] || 'default'}>{status}</Tag>;
}

// ---- Circular Progress ---- //
function CircularProgress({ percent, size = 80 }) {
  const r = (size - 8) / 2;
  const c = r * 2 * Math.PI;
  const offset = c - (Math.min(percent, 100) / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f0f2f6" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#00b894" strokeWidth={6}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

// ==================== OVERVIEW ==================== //

function OverviewView({ workspace }) {
  const tasks = useResource(workspace.id, 'tasks');
  const calendar = useResource(workspace.id, 'calendar');
  const leads = useResource(workspace.id, 'leads');

  const taskCount = tasks.items.length;
  const doneTasks = tasks.items.filter(t => t.status === 'done').length;
  const calCount = calendar.items.length;
  const leadCount = leads.items.length;
  const readiness = Math.min(100, Math.round((doneTasks / Math.max(taskCount, 1)) * 50 + (taskCount > 0 ? 25 : 0) + (leadCount > 0 ? 25 : 0)));

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>{greeting()}, <Text style={{ color: '#00b894' }}>{workspace.serviceName}</Text></Title>
        <Text type="secondary">Your marketing workspace overview</Text>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}><Card size="small"><Stat value={taskCount} label="Tasks" sub={`${doneTasks} done`} done={taskCount > 0} color="#00b894" /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Stat value={calCount} label="Calendar" sub="Entries" done={calCount > 0} color="#3b82f6" /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Stat value={leadCount} label="Leads" sub="Prospects" done={leadCount > 0} color="#8b5cf6" /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Stat value={leads.items.filter(l => l.stage === 'qualified').length} label="Qualified" sub="Ready to pitch" done={false} color="#f59e0b" /></Card></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card style={{ textAlign: 'center', padding: '24px 16px' }}>
            <CircularProgress percent={readiness} size={96} />
            <div style={{ marginTop: 12, fontSize: 13, color: '#7c8291' }}>Workspace Readiness</div>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="Quick Actions" size="small">
            <Space wrap>
              <Button icon={<ReloadOutlined />} loading={tasks.generating} onClick={tasks.generate}>Generate Tasks</Button>
              <Button icon={<ReloadOutlined />} loading={leads.generating} onClick={leads.generate}>Generate Leads</Button>
              <Button icon={<ReloadOutlined />} loading={calendar.generating} onClick={calendar.generate}>Build Calendar</Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {taskCount > 0 && (
        <Card title={`Tasks (${doneTasks}/${taskCount})`} style={{ marginTop: 16 }} size="small" extra={
          <Button size="small" icon={<ReloadOutlined />} loading={tasks.generating} onClick={tasks.generate}>Regenerate</Button>
        }>
          <TaskListView workspaceId={workspace.id} hook={tasks} compact />
        </Card>
      )}

      {calCount > 0 && (
        <Card title={`Upcoming Calendar (${calCount} entries)`} style={{ marginTop: 16 }} size="small" extra={
          <Button size="small" icon={<ReloadOutlined />} loading={calendar.generating} onClick={calendar.generate}>Regenerate</Button>
        }>
          <CalendarListView hook={calendar} compact />
        </Card>
      )}
    </div>
  );
}

function Stat({ value, label, sub, done, color }) {
  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "'Space Mono', monospace", color: done ? color : '#b0b6c4' }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1d23' }}>{label}</div>
      <div style={{ fontSize: 11, color: '#7c8291' }}>{sub}</div>
    </div>
  );
}

// ==================== TASKS ==================== //

function TaskListView({ workspaceId, hook, compact }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', priority: 'P3', category: 'General' });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', priority: 'P3', category: 'General' });
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditing(task);
    setForm({ title: task.title, priority: task.priority, category: task.category || 'General', description: task.description || '' });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) return;
    if (editing) await hook.update(editing.id, form);
    else await hook.create(form);
    setModalOpen(false);
  };

  const toggleStatus = async (task) => {
    await hook.update(task.id, { status: task.status === 'done' ? 'pending' : 'done' });
  };

  return (
    <Spin spinning={hook.loading}>
      {!compact && (
        <div style={{ marginBottom: 12 }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Task</Button>
            <Button icon={<ReloadOutlined />} loading={hook.generating} onClick={hook.generate}>Generate from AI</Button>
          </Space>
          <Progress percent={Math.round((hook.items.filter(t => t.status === 'done').length / Math.max(hook.items.length, 1)) * 100)} size="small" style={{ marginTop: 8 }} />
        </div>
      )}

      <List
        dataSource={hook.items}
        locale={{ emptyText: <Empty description="No tasks yet. Generate or add one." /> }}
        renderItem={task => (
          <List.Item
            style={{ padding: '6px 0', borderBottom: '1px solid #f0f2f6' }}
            actions={
              compact ? [
                <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(task)} />,
              ] : [
                <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(task)} />,
                <Popconfirm title="Delete task?" onConfirm={() => hook.remove(task.id)}>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>,
              ]
            }
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1 }}>
              <Checkbox checked={task.status === 'done'} onChange={() => toggleStatus(task)} style={{ marginTop: 3 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <PriorityTag priority={task.priority} />
                  <Text style={{ fontSize: 10, color: '#7c8291' }}>{task.category}</Text>
                </div>
                <Text style={{
                  fontSize: 13,
                  textDecoration: task.status === 'done' ? 'line-through' : 'none',
                  color: task.status === 'done' ? '#b0b6c4' : '#1a1d23',
                }}>
                  {task.title}
                </Text>
                {task.description && <div style={{ fontSize: 11, color: '#7c8291', marginTop: 2 }}>{task.description}</div>}
              </div>
            </div>
          </List.Item>
        )}
      />

      <Modal
        title={editing ? 'Edit Task' : 'Add Task'}
        open={modalOpen}
        onOk={save}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Save' : 'Add'}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input placeholder="Task title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Input.TextArea placeholder="Description (optional)" rows={2} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <Space>
            <Select value={form.priority} onChange={v => setForm(p => ({ ...p, priority: v }))} style={{ width: 100 }}>
              <Select.Option value="P1">P1 - High</Select.Option>
              <Select.Option value="P2">P2 - Medium</Select.Option>
              <Select.Option value="P3">P3 - Low</Select.Option>
            </Select>
            <Input placeholder="Category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ width: 150 }} />
          </Space>
        </Space>
      </Modal>
    </Spin>
  );
}

// ==================== CALENDAR ==================== //

function CalendarListView({ hook, compact }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', date: new Date().toISOString(), entryType: 'content_creation', channel: 'LinkedIn', description: '', status: 'planned', metadata: null });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', date: new Date().toISOString(), entryType: 'content_creation', channel: 'LinkedIn', description: '', status: 'planned', metadata: null });
    setModalOpen(true);
  };

  const openEdit = (entry) => {
    setEditing(entry);
    setForm({ title: entry.title, date: entry.date, entryType: entry.entryType, channel: entry.channel, description: entry.description || '', status: entry.status, metadata: entry.metadata });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) return;
    if (editing) await hook.update(editing.id, form);
    else await hook.create(form);
    setModalOpen(false);
  };

  const groupByDate = (items) => {
    const groups = {};
    items.forEach(item => {
      const d = new Date(item.date).toLocaleDateString();
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    });
    return Object.entries(groups).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  };

  const grouped = groupByDate(hook.items);

  const entryIcons = {
    content_creation: <EditOutlined />, publication: <SendOutlined />, cold_outreach: <MailOutlined />,
    campaign: <ClockCircleOutlined />, optimization: <CheckCircleOutlined />, social_media: <GlobalOutlined />,
    research: <SearchOutlined />, event: <CalendarOutlined />, others: <EllipsisOutlined />,
    lead_followup: <PhoneOutlined />, lead_generation: <UserAddOutlined />,
  };

  return (
    <Spin spinning={hook.loading}>
      {!compact && (
        <div style={{ marginBottom: 12 }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Entry</Button>
            <Button icon={<ReloadOutlined />} loading={hook.generating} onClick={hook.generate}>Generate Calendar</Button>
          </Space>
        </div>
      )}

      {compact ? (
        <List
          dataSource={hook.items.slice(0, 5)}
          locale={{ emptyText: <Empty description="No entries" />}}
          renderItem={entry => (
            <List.Item style={{ padding: '6px 0' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                <Badge status={entry.status === 'done' ? 'success' : 'processing'} />
                <div style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13 }}>{entry.title}</Text>
                  <div style={{ fontSize: 11, color: '#7c8291' }}>{new Date(entry.date).toLocaleDateString()} · {entry.channel || entry.entryType}</div>
                </div>
              </div>
            </List.Item>
          )}
        />
      ) : (
        <List
          locale={{ emptyText: <Empty description="No calendar entries" />}}
          dataSource={grouped}
          renderItem={([date, entries]) => (
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ fontSize: 12, color: '#7c8291' }}>{date}</Text>
              {entries.map(entry => (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, marginTop: 4, background: '#f8f9fb', border: '1px solid #e2e5eb' }}>
                  {entryIcons[entry.entryType] || <CheckCircleOutlined />}
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13 }}>{entry.title}</Text>
                    <div style={{ fontSize: 11, color: '#7c8291' }}>
                      <StatusTag status={entry.status} /> {entry.channel && <>· {entry.channel}</>} · {entry.entryType}
                    </div>
                  </div>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(entry)} />
                  <Popconfirm title="Delete?" onConfirm={() => hook.remove(entry.id)}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              ))}
            </div>
          )}
        />
      )}

      <Modal title={editing ? 'Edit Entry' : 'Add Entry'} open={modalOpen} onOk={save} onCancel={() => setModalOpen(false)} okText={editing ? 'Save' : 'Add'}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input placeholder="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Input.TextArea placeholder="Description" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <Space>
            <Select value={form.entryType} onChange={v => setForm(p => ({ ...p, entryType: v }))} style={{ width: 160 }}>
              <Select.Option value="content_creation">Content Creation</Select.Option>
              <Select.Option value="publication">Publication</Select.Option>
              <Select.Option value="cold_outreach">Cold Outreach</Select.Option>
              <Select.Option value="campaign">Campaign</Select.Option>
              <Select.Option value="optimization">Optimization</Select.Option>
              <Select.Option value="social_media">Social Media</Select.Option>
              <Select.Option value="research">Research</Select.Option>
              <Select.Option value="event">Event</Select.Option>
              <Select.Option value="lead_followup">Lead Follow-up</Select.Option>
              <Select.Option value="lead_generation">Lead Generation</Select.Option>
              <Select.Option value="others">Others</Select.Option>
            </Select>
            <Select value={form.channel} onChange={v => setForm(p => ({ ...p, channel: v }))} style={{ width: 130 }}>
              <Select.Option value="LinkedIn">LinkedIn</Select.Option>
              <Select.Option value="Facebook">Facebook</Select.Option>
              <Select.Option value="Blog">Blog</Select.Option>
              <Select.Option value="Email">Email</Select.Option>
              <Select.Option value="WhatsApp">WhatsApp</Select.Option>
            </Select>
          </Space>
          <DatePicker
            value={form.date ? dayjs(form.date) : null}
            onChange={(d) => setForm(p => ({ ...p, date: d?.toISOString() || new Date().toISOString() }))}
            style={{ width: '100%' }}
          />
          <Select value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} style={{ width: 140 }}>
            <Select.Option value="planned">Planned</Select.Option>
            <Select.Option value="in_progress">In Progress</Select.Option>
            <Select.Option value="done">Done</Select.Option>
          </Select>
          <Input.TextArea
            placeholder='Metadata (JSON) e.g. {"format":"blog","wordCount":1500}'
            rows={2}
            value={form.metadata ? JSON.stringify(form.metadata, null, 2) : ''}
            onChange={e => {
              try { setForm(p => ({ ...p, metadata: JSON.parse(e.target.value) })); }
              catch { setForm(p => ({ ...p, metadata: e.target.value })); }
            }}
            style={{ fontFamily: "'Space Mono', monospace", fontSize: 12 }}
          />
        </Space>
      </Modal>
    </Spin>
  );
}

// ==================== LEADS ==================== //

function LeadsView({ workspace }) {
  const hook = useResource(workspace.id, 'leads');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', industry: '', stage: 'new', source: 'cold_outreach', notes: '', linkedinUrl: '' });

  const [liSearching, setLiSearching] = useState(false);
  const [liResults, setLiResults] = useState([]);
  const [liModalOpen, setLiModalOpen] = useState(false);
  const [selectedLiKeys, setSelectedLiKeys] = useState([]);

  const openCreate = () => {
    setEditing(null);
    setForm({ companyName: '', contactName: '', email: '', phone: '', industry: '', stage: 'new', source: 'cold_outreach', notes: '', linkedinUrl: '' });
    setModalOpen(true);
  };

  const openEdit = (lead) => {
    setEditing(lead);
    setForm({
      companyName: lead.companyName, contactName: lead.contactName || '', email: lead.email || '',
      phone: lead.phone || '', industry: lead.industry || '', stage: lead.stage,
      source: lead.source || '', notes: lead.notes || '', linkedinUrl: lead.linkedinUrl || '',
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.companyName.trim()) return;
    if (editing) await hook.update(editing.id, form);
    else await hook.create(form);
    setModalOpen(false);
  };

  const searchLinkedIn = async () => {
    setLiSearching(true);
    setLiResults([]);
    setLiModalOpen(true);
    try {
      const res = await fetch(`/api/workspace/${workspace.id}/leads/search-linkedin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const d = await res.json();
        setLiResults(d.leads || []);
        if (!d.leads?.length) message.info('No LinkedIn results found. Try a different ICP.');
      } else {
        const d = await res.json().catch(() => ({}));
        message.error(d.error || 'LinkedIn search failed');
        setLiModalOpen(false);
      }
    } catch {
      message.error('LinkedIn search failed');
      setLiModalOpen(false);
    }
    setLiSearching(false);
  };

  const importSelected = async () => {
    const toImport = liResults.filter((_, i) => selectedLiKeys.includes(i));
    let imported = 0;
    for (const lead of toImport) {
      const item = await hook.create(lead);
      if (item) imported++;
    }
    if (imported > 0) message.success(`Imported ${imported} leads`);
    setLiModalOpen(false);
    setSelectedLiKeys([]);
  };

  const columns = [
    { title: 'Company', dataIndex: 'companyName', key: 'company', render: (n, r) => <><Text strong style={{ fontSize: 13 }}>{n}</Text>{r.contactName && <div style={{ fontSize: 11, color: '#7c8291' }}>{r.contactName}</div>}</> },
    { title: 'Contact', dataIndex: 'contactName', key: 'contact', render: (n, r) => n ? <Space size={4}><UserOutlined style={{ fontSize: 11 }} /><Text style={{ fontSize: 12 }}>{n}</Text></Space> : '-' },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (e) => e ? <Space size={4}><MailOutlined style={{ fontSize: 11 }} /><Text style={{ fontSize: 12 }}>{e}</Text></Space> : '-', responsive: ['md'] },
    { title: 'Industry', dataIndex: 'industry', key: 'industry', render: (v) => v || '-', responsive: ['lg'] },
    { title: 'LinkedIn', dataIndex: 'linkedinUrl', key: 'linkedin', render: (u) => u ? <a href={u} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#0a66c2' }}>Profile ↗</a> : '-', responsive: ['md'] },
    { title: 'Stage', dataIndex: 'stage', key: 'stage', render: (s) => <StageTag stage={s} /> },
    { title: 'Source', dataIndex: 'source', key: 'source', render: (s) => <Tag style={{ fontSize: 10 }}>{s || 'unknown'}</Tag>, responsive: ['lg'] },
    {
      title: '', key: 'actions', width: 80,
      render: (_, r) => (
        <Space>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} /></Tooltip>
          <Popconfirm title="Delete?" onConfirm={() => hook.remove(r.id)}>
            <Tooltip title="Delete"><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={hook.loading}>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Lead</Button>
          <Button icon={<GlobalOutlined />} loading={liSearching} onClick={searchLinkedIn} style={{ borderColor: '#0a66c2', color: '#0a66c2' }}>Search LinkedIn</Button>
          <Button icon={<ReloadOutlined />} loading={hook.generating} onClick={hook.generate}>Generate from ICP</Button>
        </Space>
        <div style={{ marginTop: 8 }}>
          <Progress percent={Math.round((hook.items.filter(l => l.stage === 'qualified' || l.stage === 'proposal').length / Math.max(hook.items.length, 1)) * 100)} size="small" />
        </div>
      </div>

      <Table
        dataSource={hook.items}
        columns={columns}
        rowKey="id"
        pagination={hook.items.length > 20 ? { pageSize: 20, size: 'small' } : false}
        locale={{ emptyText: <Empty description="No leads yet. Search LinkedIn or add manually." /> }}
        size="small"
      />

      {/* LinkedIn search results modal */}
      <Modal
        title={<span><GlobalOutlined style={{ color: '#0a66c2', marginRight: 8 }} />LinkedIn Search Results</span>}
        open={liModalOpen}
        onCancel={() => { setLiModalOpen(false); setSelectedLiKeys([]); }}
        footer={[
          <Button key="close" onClick={() => { setLiModalOpen(false); setSelectedLiKeys([]); }}>Cancel</Button>,
          <Button key="import" type="primary" disabled={selectedLiKeys.length === 0} loading={liSearching} onClick={importSelected}>
            Import {selectedLiKeys.length > 0 ? `(${selectedLiKeys.length})` : ''} Selected
          </Button>,
        ]}
        width={700}
      >
        {liSearching ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin tip="Searching LinkedIn..." /></div>
        ) : (
          <Table
            dataSource={liResults.map((r, i) => ({ ...r, _key: i }))}
            columns={[
              { title: 'Name', dataIndex: 'contactName', key: 'name', render: (n, r) => <><Text strong>{n || 'Unknown'}</Text><div style={{ fontSize: 11, color: '#7c8291' }}>{r.companyName}</div></> },
              { title: 'LinkedIn', dataIndex: 'linkedinUrl', key: 'url', render: (u) => u ? <a href={u} target="_blank" rel="noopener noreferrer" style={{ color: '#0a66c2', fontSize: 12 }}>View ↗</a> : '-', width: 80 },
              { title: 'Notes', dataIndex: 'notes', key: 'notes', ellipsis: true, render: (v) => <Text style={{ fontSize: 12, color: '#7c8291' }}>{v || ''}</Text>, responsive: ['md'] },
            ]}
            rowKey="_key"
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedLiKeys,
              onChange: setSelectedLiKeys,
            }}
            pagination={liResults.length > 15 ? { pageSize: 15, size: 'small' } : false}
            size="small"
            locale={{ emptyText: <Empty description="No matches found on LinkedIn" /> }}
          />
        )}
      </Modal>

      <Modal title={editing ? 'Edit Lead' : 'Add Lead'} open={modalOpen} onOk={save} onCancel={() => setModalOpen(false)} okText={editing ? 'Save' : 'Add'} width={540}>
        <div style={{ padding: '4px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1d23', marginBottom: 6 }}>Company Name <span style={{ color: '#ef4444' }}>*</span></div>
            <Input size="middle" placeholder="e.g. Acme Garments Ltd" value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} />
          </div>
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1d23', marginBottom: 6 }}>Contact Name</div>
              <Input size="middle" placeholder="Full name" value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} />
            </Col>
            <Col span={12}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1d23', marginBottom: 6 }}>Industry</div>
              <Input size="middle" placeholder="e.g. Garment, Tech" value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} />
            </Col>
          </Row>
          <div style={{ height: 16 }} />
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1d23', marginBottom: 6 }}>Email</div>
              <Input size="middle" placeholder="email@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </Col>
            <Col span={12}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1d23', marginBottom: 6 }}>Phone</div>
              <Input size="middle" placeholder="+880-XXXXXXXXX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </Col>
          </Row>
          <div style={{ height: 16 }} />
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1d23', marginBottom: 6 }}>LinkedIn Profile</div>
            <Input size="middle" placeholder="https://linkedin.com/in/username" value={form.linkedinUrl} onChange={e => setForm(p => ({ ...p, linkedinUrl: e.target.value }))} />
          </div>
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1d23', marginBottom: 6 }}>Stage</div>
              <Select size="middle" value={form.stage} onChange={v => setForm(p => ({ ...p, stage: v }))} style={{ width: '100%' }}>
                <Select.Option value="new">New</Select.Option>
                <Select.Option value="contacted">Contacted</Select.Option>
                <Select.Option value="qualified">Qualified</Select.Option>
                <Select.Option value="proposal">Proposal</Select.Option>
                <Select.Option value="lost">Lost</Select.Option>
              </Select>
            </Col>
            <Col span={12}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1d23', marginBottom: 6 }}>Source</div>
              <Input size="middle" placeholder="linkedin, referral, website" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} />
            </Col>
          </Row>
          <div style={{ height: 16 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1d23', marginBottom: 6 }}>Notes</div>
            <TextArea rows={3} placeholder="Additional context about this lead..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </Spin>
  );
}

// ==================== OTHER VIEWS ==================== //

function WorkspaceStrategyView({ workspace, outputs }) {
  const o = outputs || {};
  return (
    <div>
      {[
        { label: 'ICP & Targeting', text: o.icp, color: '#3b82f6' },
        { label: 'Positioning & Messaging', text: o.positioning, color: '#8b5cf6' },
        { label: 'Competitor Analysis', text: o.competitors, color: '#f59e0b' },
        { label: 'Content Strategy', text: o.contentStrategy, color: '#e84393' },
      ].map(s => (
        <Card key={s.label} title={s.label} size="small" style={{ marginBottom: 12, borderTop: `3px solid ${s.color}` }}>
          {s.text?.length > 50 ? (
            <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto', color: '#1a1d23' }}>{s.text}</div>
          ) : (
            <Empty description="Not generated yet" />
          )}
        </Card>
      ))}
    </div>
  );
}

function PlansView({ workspace }) {
  const calendar = useResource(workspace.id, 'calendar');
  return <CalendarListView hook={calendar} />;
}

function ContentsView({ workspace, outputs }) {
  const contents = useResource(workspace.id, 'contents');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', contentType: 'blog_post', platform: 'Blog', body: '', status: 'draft' });

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', render: (t) => <Text strong style={{ fontSize: 13 }}>{t}</Text> },
    { title: 'Type', dataIndex: 'contentType', key: 'type', render: (t) => <Tag style={{ fontFamily: "'Space Mono', monospace", fontSize: 10 }}>{t}</Tag>, responsive: ['md'] },
    { title: 'Platform', dataIndex: 'platform', key: 'platform', render: (p) => p || '-', responsive: ['lg'] },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <StatusTag status={s} /> },
    {
      title: '', key: 'actions', width: 60,
      render: (_, r) => <Popconfirm title="Delete?" onConfirm={() => contents.remove(r.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Popconfirm>,
    },
  ];

  return (
    <Spin spinning={contents.loading}>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setForm({ title: '', contentType: 'blog_post', platform: 'Blog', body: '', status: 'draft' }); setModalOpen(true); }}>Add Content</Button>
          <Button icon={<ReloadOutlined />} loading={contents.generating} onClick={contents.generate}>Generate from AI</Button>
        </Space>
      </div>

      {outputs?.contentStrategy?.length > 50 && (
        <Card title="Content Strategy Reference" size="small" style={{ marginBottom: 16, borderTop: '3px solid #e84393' }}>
          <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', color: '#1a1d23' }}>{outputs.contentStrategy}</div>
        </Card>
      )}

      <Table dataSource={contents.items} columns={columns} rowKey="id" pagination={false} size="small"
        locale={{ emptyText: <Empty description="No content. Generate or add manually." /> }}
      />

      <Modal title="Add Content" open={modalOpen} onOk={async () => { if (form.title.trim()) { await contents.create(form); setModalOpen(false); } }} onCancel={() => setModalOpen(false)}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input placeholder="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Space>
            <Select value={form.contentType} onChange={v => setForm(p => ({ ...p, contentType: v }))} style={{ width: 140 }}>
              <Select.Option value="blog_post">Blog Post</Select.Option>
              <Select.Option value="case_study">Case Study</Select.Option>
              <Select.Option value="social_post">Social Post</Select.Option>
              <Select.Option value="email">Email</Select.Option>
              <Select.Option value="video">Video</Select.Option>
            </Select>
            <Select value={form.platform} onChange={v => setForm(p => ({ ...p, platform: v }))} style={{ width: 130 }}>
              <Select.Option value="LinkedIn">LinkedIn</Select.Option>
              <Select.Option value="Facebook">Facebook</Select.Option>
              <Select.Option value="Blog">Blog</Select.Option>
              <Select.Option value="Newsletter">Newsletter</Select.Option>
            </Select>
          </Space>
          <TextArea placeholder="Body / outline" rows={4} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} />
        </Space>
      </Modal>
    </Spin>
  );
}

function LeadsViewExport({ workspace }) {
  return <LeadsView workspace={workspace} />;
}

function OutreachView({ workspace }) {
  const outputs = workspace.outputs || {};
  return (
    <Card title="Outreach Templates" size="small" style={{ borderTop: '3px solid #8b5cf6' }}>
      {outputs.outreach?.length > 50 ? (
        <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: '#1a1d23' }}>{outputs.outreach}</div>
      ) : (
        <Empty description="Not generated yet" />
      )}
    </Card>
  );
}

function BatchView() {
  return (
    <Card>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Text type="secondary">Batch automation coming soon</Text>
      </div>
    </Card>
  );
}

function HistoryView() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = getToken();
      try {
        const res = await fetch('/api/history', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setHistory(data.rows || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spin style={{ display: 'block', textAlign: 'center', padding: 40 }} />;

  return (
    <List
      dataSource={history}
      locale={{ emptyText: <Empty description="No history" /> }}
      renderItem={row => (
        <List.Item style={{ padding: '12px 0' }}>
          <div style={{ flex: 1 }}>
            <Space style={{ marginBottom: 6 }}>
              <Tag color="green" style={{ fontFamily: "'Space Mono', monospace", fontSize: 10 }}>{row.module}</Tag>
              <Text style={{ fontSize: 11, color: '#7c8291' }}>{row.service}</Text>
              <Text style={{ fontSize: 11, color: '#b0b6c4' }}>{new Date(row.createdAt).toLocaleString()}</Text>
            </Space>
            <div style={{ fontSize: 13, color: '#1a1d23', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}>{row.output}</div>
          </div>
        </List.Item>
      )}
    />
  );
}

function SettingsView({ workspace, onUpdate }) {
  const [form, setForm] = useState({
    name: workspace.name || '',
    serviceName: workspace.serviceName || '',
    serviceType: workspace.serviceType || 'service',
    website: workspace.website || '',
    description: workspace.description || '',
    location: workspace.location || '',
    targetMarkets: Array.isArray(workspace.targetMarkets) ? [...workspace.targetMarkets] : [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: workspace.name || '',
      serviceName: workspace.serviceName || '',
      serviceType: workspace.serviceType || 'service',
      website: workspace.website || '',
      description: workspace.description || '',
      location: workspace.location || '',
      targetMarkets: Array.isArray(workspace.targetMarkets) ? [...workspace.targetMarkets] : [],
    });
  }, [workspace.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ id: workspace.id, ...form }),
      });
      if (res.ok) {
        message.success('Settings saved');
        if (onUpdate) onUpdate();
      } else {
        const d = await res.json().catch(() => ({}));
        message.error(d.error || 'Failed to save');
      }
    } catch { message.error('Failed to save'); }
    setSaving(false);
  };

  const addMarket = () => setForm(p => ({ ...p, targetMarkets: [...p.targetMarkets, ''] }));
  const removeMarket = (i) => setForm(p => ({ ...p, targetMarkets: p.targetMarkets.filter((_, idx) => idx !== i) }));
  const updateMarket = (i, v) => setForm(p => {
    const m = [...p.targetMarkets];
    m[i] = v;
    return { ...p, targetMarkets: m };
  });

  const inputBase = {
    width: '100%', background: '#f8f9fa', border: '1px solid #e2e6ed',
    borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#1a1d23',
    outline: 'none', fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <Spin spinning={saving}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card title="Product / Service" size="small" style={{ borderTop: '3px solid var(--accent)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</div>
                  <input value={form.serviceName} onChange={e => setForm(p => ({ ...p, serviceName: e.target.value }))} style={inputBase} placeholder="e.g. Marconi AI" />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</div>
                  <select value={form.serviceType} onChange={e => setForm(p => ({ ...p, serviceType: e.target.value }))} style={{ ...inputBase, cursor: 'pointer' }}>
                    <option value="service">Service</option>
                    <option value="product">Product</option>
                    <option value="saas">SaaS</option>
                    <option value="consulting">Consulting</option>
                  </select>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</div>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  style={{ ...inputBase, minHeight: 100, resize: 'vertical', lineHeight: 1.6 }}
                  placeholder="Detailed description of your product/service — features, pricing, target audience, tech stack..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Website</div>
                  <input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} style={inputBase} placeholder="https://example.com" />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</div>
                  <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} style={inputBase} placeholder="e.g. Dhaka, Bangladesh" />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Target Markets" size="small" style={{ borderTop: '3px solid #8b5cf6' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {form.targetMarkets.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={m} onChange={e => updateMarket(i, e.target.value)} style={{ ...inputBase, flex: 1 }} placeholder="e.g. US healthcare startups" />
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeMarket(i)} />
                </div>
              ))}
              <Button type="dashed" icon={<PlusOutlined />} onClick={addMarket} style={{ width: '100%' }}>Add Target Market</Button>
            </Space>
          </Card>

          <Button type="primary" size="large" onClick={handleSave} loading={saving}
            style={{ alignSelf: 'flex-start', padding: '8px 32px', fontWeight: 600 }}>
            Save Settings
          </Button>
        </div>
      </Spin>
    </div>
  );
}

export { OverviewView, WorkspaceStrategyView, PlansView, ContentsView, LeadsViewExport as LeadsView, OutreachView, BatchView, HistoryView, SettingsView };
