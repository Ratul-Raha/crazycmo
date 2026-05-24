'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Card, Tag, Checkbox, List, Table, Modal, Input, Select, DatePicker, Progress, Empty, Spin, Space, Badge, Popconfirm, message, Tooltip, Calendar, Typography, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, ClockCircleOutlined, UserOutlined, MailOutlined, PhoneOutlined, GlobalOutlined, SendOutlined, SearchOutlined, CalendarOutlined, EllipsisOutlined, UserAddOutlined, FireOutlined, AlertOutlined, RiseOutlined, FileTextOutlined } from '@ant-design/icons';

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

function Stat({ value, label, sub, done, color }) {
  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 600, color: done ? color : '#b0b6c4' }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1d23' }}>{label}</div>
      <div style={{ fontSize: 11, color: '#7c8291' }}>{sub}</div>
    </div>
  );
}

function MiniStat({ value, label, color }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || '#1a1d23' }}>{value}</div>
      <div style={{ fontSize: 10, color: '#7c8291', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function OverviewView({ workspace }) {
  const tasks = useResource(workspace.id, 'tasks');
  const calendar = useResource(workspace.id, 'calendar');
  const leads = useResource(workspace.id, 'leads');
  const contents = useResource(workspace.id, 'contents');

  const now = new Date();

  // ---- Task stats ---- //
  const taskTotal = tasks.items.length;
  const taskDone = tasks.items.filter(t => t.status === 'done').length;
  const taskInProgress = tasks.items.filter(t => t.status === 'in_progress').length;
  const taskPending = taskTotal - taskDone - taskInProgress;
  const taskP1 = tasks.items.filter(t => t.priority === 'P1' && t.status !== 'done').length;
  const overdueTasks = tasks.items.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done');

  // ---- Calendar stats ---- //
  const calTotal = calendar.items.length;
  const todayStr = now.toLocaleDateString();
  const calToday = calendar.items.filter(e => new Date(e.date).toLocaleDateString() === todayStr);
  const upcomingCal = calendar.items.filter(e => new Date(e.date) > now && e.status !== 'done');
  const calDone = calendar.items.filter(e => e.status === 'done').length;

  // ---- Lead stats ---- //
  const leadTotal = leads.items.length;
  const leadQualified = leads.items.filter(l => l.stage === 'qualified' || l.stage === 'proposal').length;
  const leadNew = leads.items.filter(l => l.stage === 'new').length;
  const leadContacted = leads.items.filter(l => l.stage === 'contacted').length;

  // ---- Content stats ---- //
  const contentTotal = contents.items.length;
  const contentPublished = contents.items.filter(c => c.status === 'published').length;

  // ---- Calendar breakdown by entry type ---- //
  const allEntryTypes = ['content_creation', 'publication', 'cold_outreach', 'campaign', 'optimization', 'social_media', 'research', 'event', 'lead_followup', 'lead_generation', 'others'];
  const typeCounts = {};
  allEntryTypes.forEach(t => { typeCounts[t] = 0; });
  calendar.items.forEach(e => {
    if (typeCounts[e.entryType] !== undefined) typeCounts[e.entryType]++;
  });
  const maxTypeCount = Math.max(...Object.values(typeCounts), 1);

  const typeColors = {
    content_creation: '#3b82f6', publication: '#00b894', cold_outreach: '#e84393',
    campaign: '#f59e0b', optimization: '#8b5cf6', social_media: '#0ea5e9',
    research: '#6366f1', event: '#14b8a6', lead_followup: '#f97316',
    lead_generation: '#22c55e', others: '#94a3b8',
  };

  const typeLabels = {
    content_creation: 'Content', publication: 'Publish', cold_outreach: 'Outreach',
    campaign: 'Campaign', optimization: 'Optimize', social_media: 'Social',
    research: 'Research', event: 'Event', lead_followup: 'Follow-up',
    lead_generation: 'Lead Gen', others: 'Others',
  };

  // ---- Lead pipeline ---- //
  const pipelineStages = ['new', 'contacted', 'qualified', 'proposal', 'lost'];
  const pipelineCounts = {};
  pipelineStages.forEach(s => { pipelineCounts[s] = leads.items.filter(l => l.stage === s).length; });

  // ---- Readiness score ---- //
  const readiness = Math.min(100, Math.round(
    (taskDone / Math.max(taskTotal, 1)) * 30 +
    (calDone / Math.max(calTotal, 1)) * 20 +
    (leadQualified / Math.max(leadTotal, 1)) * 25 +
    (contentPublished / Math.max(contentTotal, 1)) * 15 +
    (taskTotal > 0 ? 10 : 0)
  ));

  const greeting = () => {
    const h = now.getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  return (
    <div>
      {/* ---- Greeting ---- */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{greeting()}, <Text style={{ color: '#00b894' }}>{workspace.serviceName}</Text></Title>
          <Text type="secondary">Here's what's on your plate today</Text>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#7c8291' }}>Workspace Readiness</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
            <div style={{ width: 120, background: '#f0f2f6', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{ width: `${readiness}%`, background: readiness > 60 ? '#00b894' : readiness > 30 ? '#f59e0b' : '#ef4444', height: '100%', borderRadius: 4, transition: 'width 0.5s ease' }} />
            </div>
            <Text style={{ fontSize: 16, fontWeight: 700, color: readiness > 60 ? '#00b894' : readiness > 30 ? '#f59e0b' : '#ef4444' }}>{readiness}%</Text>
          </div>
        </div>
      </div>

      {/* ---- KPI Row ---- */}
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={4}><Card size="small" style={{ textAlign: 'center' }}><MiniStat value={taskTotal} label={`${taskDone} done · ${taskInProgress} active`} color="#00b894" /><Text style={{ fontSize: 10, color: taskP1 > 0 ? '#ef4444' : '#7c8291' }}>{taskP1 > 0 ? `${taskP1} urgent` : 'No urgent tasks'}</Text></Card></Col>
        <Col xs={12} sm={4}><Card size="small" style={{ textAlign: 'center' }}><MiniStat value={calToday.length || upcomingCal.length} label={calToday.length ? 'today' : 'upcoming'} color="#3b82f6" /><Text style={{ fontSize: 10, color: '#7c8291' }}>{calDone}/${calTotal} done</Text></Card></Col>
        <Col xs={12} sm={4}><Card size="small" style={{ textAlign: 'center' }}><MiniStat value={leadTotal} label={`${leadQualified} qualified`} color="#8b5cf6" /><Text style={{ fontSize: 10, color: '#7c8291' }}>{leadNew} new · {leadContacted} contacted</Text></Card></Col>
        <Col xs={12} sm={4}><Card size="small" style={{ textAlign: 'center' }}><MiniStat value={contentTotal} label={`${contentPublished} published`} color="#e84393" /><Text style={{ fontSize: 10, color: '#7c8291' }}>Content pieces</Text></Card></Col>
        <Col xs={12} sm={4}><Card size="small" style={{ textAlign: 'center' }}><MiniStat value={overdueTasks.length + upcomingCal.filter(e => new Date(e.date) < now).length} label="overdue" color="#ef4444" /><Text style={{ fontSize: 10, color: '#7c8291' }}>needs attention</Text></Card></Col>
        <Col xs={12} sm={4}><Card size="small" style={{ textAlign: 'center' }}><MiniStat value={upcomingCal.filter(e => new Date(e.date) > now).length} label="upcoming entries" color="#14b8a6" /><Text style={{ fontSize: 10, color: '#7c8291' }}>in calendar</Text></Card></Col>
      </Row>

      {/* ---- On Your Plate Today ---- */}
      {(taskP1 > 0 || calToday.length > 0 || overdueTasks.length > 0 || leadNew > 0) && (
        <Card title={<span><FireOutlined style={{ color: '#ef4444', marginRight: 6 }} />On Your Plate Today</span>} size="small" style={{ marginBottom: 16, borderLeft: '3px solid #ef4444' }}>
          <Row gutter={[12, 12]}>
            {taskP1 > 0 && (
              <Col xs={24} sm={12} md={6}>
                <div style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: 6, border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>Urgent Tasks ({taskP1})</div>
                  {tasks.items.filter(t => t.priority === 'P1' && t.status !== 'done').slice(0, 3).map(t => (
                    <div key={t.id} style={{ fontSize: 12, color: '#1a1d23', padding: '2px 0' }}>• {t.title}</div>
                  ))}
                </div>
              </Col>
            )}
            {calToday.length > 0 && (
              <Col xs={24} sm={12} md={6}>
                <div style={{ padding: '8px 12px', background: '#eff6ff', borderRadius: 6, border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', marginBottom: 4 }}>Today's Schedule ({calToday.length})</div>
                  {calToday.map(e => (
                    <div key={e.id} style={{ fontSize: 12, color: '#1a1d23', padding: '2px 0' }}>• {e.title}</div>
                  ))}
                </div>
              </Col>
            )}
            {overdueTasks.length > 0 && (
              <Col xs={24} sm={12} md={6}>
                <div style={{ padding: '8px 12px', background: '#fff7ed', borderRadius: 6, border: '1px solid #fed7aa' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#f97316', marginBottom: 4 }}>Overdue Tasks ({overdueTasks.length})</div>
                  {overdueTasks.slice(0, 3).map(t => (
                    <div key={t.id} style={{ fontSize: 12, color: '#1a1d23', padding: '2px 0' }}>• {t.title} <Text style={{ fontSize: 10, color: '#ef4444' }}>({new Date(t.dueDate).toLocaleDateString()})</Text></div>
                  ))}
                </div>
              </Col>
            )}
            {leadNew > 0 && (
              <Col xs={24} sm={12} md={6}>
                <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#22c55e', marginBottom: 4 }}>New Leads ({leadNew})</div>
                  {leads.items.filter(l => l.stage === 'new').slice(0, 3).map(l => (
                    <div key={l.id} style={{ fontSize: 12, color: '#1a1d23', padding: '2px 0' }}>• {l.companyName}</div>
                  ))}
                </div>
              </Col>
            )}
          </Row>
        </Card>
      )}

      {/* ---- Breakdown: Calendar by Type + Lead Pipeline ---- */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card title="Calendar by Entry Type" size="small">
            {allEntryTypes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {allEntryTypes.map(type => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, fontSize: 11, color: '#7c8291', textAlign: 'right' }}>{typeLabels[type] || type}</div>
                    <div style={{ flex: 1, background: '#f0f2f6', borderRadius: 4, height: 16, overflow: 'hidden' }}>
                      <div style={{ width: `${(typeCounts[type] / maxTypeCount) * 100}%`, background: typeColors[type] || '#94a3b8', height: '100%', borderRadius: 4, transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ fontSize: 11, color: typeCounts[type] > 0 ? '#1a1d23' : '#c0c4cc', width: 24, fontWeight: 600 }}>{typeCounts[type]}</div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="No entries yet" />
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Lead Pipeline" size="small">
            {leadTotal > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pipelineStages.map(stage => {
                  const c = pipelineCounts[stage] || 0;
                  const maxCount = Math.max(...pipelineStages.map(s => pipelineCounts[s] || 0), 1);
                  const stageColors = { new: '#3b82f6', contacted: '#f59e0b', qualified: '#22c55e', proposal: '#8b5cf6', lost: '#ef4444' };
                  return (
                    <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 70, fontSize: 11, color: '#7c8291', textAlign: 'right', textTransform: 'capitalize' }}>{stage}</div>
                      <div style={{ flex: 1, background: '#f0f2f6', borderRadius: 4, height: 16, overflow: 'hidden' }}>
                        <div style={{ width: `${(c / maxCount) * 100}%`, background: stageColors[stage], height: '100%', borderRadius: 4, transition: 'width 0.5s ease' }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#1a1d23', width: 24, fontWeight: 600 }}>{c}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty description="No leads yet" />
            )}
          </Card>
        </Col>
      </Row>

      {/* ---- Strategy Status + This Week ---- */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title={<span><RiseOutlined style={{ marginRight: 6 }} />Strategy Status</span>} size="small">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { key: 'icp', label: 'ICP & Targeting' },
                { key: 'positioning', label: 'Positioning & Messaging' },
                { key: 'competitors', label: 'Competitor Analysis' },
                { key: 'contentStrategy', label: 'Content Strategy' },
                { key: 'tasks', label: 'Task Plan' },
                { key: 'outreach', label: 'Outreach Templates' },
                { key: 'calendar', label: 'Marketing Calendar' },
              ].map(m => {
                const done = workspace.outputs?.[m.key]?.length > 50;
                return (
                  <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: done ? '#00b894' : '#e2e5eb', flexShrink: 0 }} />
                    <Text style={{ fontSize: 12, color: done ? '#1a1d23' : '#b0b6c4', flex: 1 }}>{m.label}</Text>
                    {done ? <Text style={{ fontSize: 10, color: '#00b894' }}>Ready</Text> : <Text style={{ fontSize: 10, color: '#b0b6c4' }}>Pending</Text>}
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          {taskTotal > 0 && (
            <Card title={`Recent Tasks (${taskDone}/${taskTotal})`} size="small" extra={
              <Progress percent={Math.round((taskDone / Math.max(taskTotal, 1)) * 100)} size="small" style={{ width: 80 }} />
            }>
              <TaskListView workspaceId={workspace.id} hook={tasks} compact />
            </Card>
          )}
        </Col>

        <Col xs={24} md={8}>
          {calTotal > 0 && (
            <Card title={`Upcoming Calendar (${calTotal})`} size="small">
              <CalendarListView hook={calendar} compact />
            </Card>
          )}
        </Col>
      </Row>
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

const LEAD_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'lost'];
const LEAD_SOURCES = ['linkedin', 'referral', 'website', 'cold_outreach', 'event', 'social_media', 'advertisement', 'inbound', 'partner', 'other'];

function LeadsView({ workspace }) {
  const hook = useResource(workspace.id, 'leads');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', industry: '', stage: 'new', source: 'cold_outreach', notes: '', linkedinUrl: '', sourceUrl: '' });

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({});

  const openCreate = () => {
    setEditing(null);
    setForm({ companyName: '', contactName: '', email: '', phone: '', industry: '', stage: 'new', source: 'cold_outreach', notes: '', linkedinUrl: '', sourceUrl: '' });
    setModalOpen(true);
  };

  const openEdit = (lead) => {
    setEditing(lead);
    setForm({
      companyName: lead.companyName, contactName: lead.contactName || '', email: lead.email || '',
      phone: lead.phone || '', industry: lead.industry || '', stage: lead.stage,
      source: lead.source || '', notes: lead.notes || '', linkedinUrl: lead.linkedinUrl || '', sourceUrl: lead.sourceUrl || '',
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.companyName.trim()) return;
    if (editing) await hook.update(editing.id, form);
    else await hook.create(form);
    setModalOpen(false);
  };

  const deleteSelected = async () => {
    let deleted = 0;
    for (const id of selectedRowKeys) {
      await hook.remove(id);
      deleted++;
    }
    if (deleted > 0) message.success(`Deleted ${deleted} leads`);
    setSelectedRowKeys([]);
  };

  const filtered = useMemo(() => {
    let items = hook.items;
    if (searchText) {
      const q = searchText.toLowerCase();
      items = items.filter(l =>
        l.companyName?.toLowerCase().includes(q) ||
        l.contactName?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.industry?.toLowerCase().includes(q)
      );
    }
    if (filters.stage?.length) items = items.filter(l => filters.stage.includes(l.stage));
    if (filters.source?.length) items = items.filter(l => filters.source.includes(l.source));
    return items;
  }, [hook.items, searchText, filters]);

  const columns = useMemo(() => [
    {
      title: 'Company', dataIndex: 'companyName', key: 'company', sorter: (a, b) => (a.companyName || '').localeCompare(b.companyName || ''),
      render: (n, r) => <><Text strong style={{ fontSize: 13 }}>{n}</Text>{r.contactName && <div style={{ fontSize: 11, color: '#7c8291' }}>{r.contactName}</div>}</>,
    },
    {
      title: 'Contact', dataIndex: 'contactName', key: 'contact', sorter: (a, b) => (a.contactName || '').localeCompare(b.contactName || ''),
      render: (n, r) => n ? <Space size={4}><UserOutlined style={{ fontSize: 11 }} /><Text style={{ fontSize: 12 }}>{n}</Text></Space> : '-', responsive: ['md'],
    },
    {
      title: 'Email', dataIndex: 'email', key: 'email', sorter: (a, b) => (a.email || '').localeCompare(b.email || ''),
      render: (e) => e ? <Space size={4}><MailOutlined style={{ fontSize: 11 }} /><Text style={{ fontSize: 12 }}>{e}</Text></Space> : '-', responsive: ['md'],
    },
    {
      title: 'Industry', dataIndex: 'industry', key: 'industry', sorter: (a, b) => (a.industry || '').localeCompare(b.industry || ''),
      render: (v) => v || '-', responsive: ['lg'],
    },
    {
      title: 'LinkedIn', dataIndex: 'linkedinUrl', key: 'linkedin',
      render: (u) => u ? <a href={u} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#0a66c2' }}>Profile ↗</a> : '-', responsive: ['md'],
    },
    {
      title: 'Source URL', dataIndex: 'sourceUrl', key: 'sourceUrl',
      render: (u) => u ? <a href={u} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#8b5cf6' }}>Source ↗</a> : '-', responsive: ['xl'],
    },
    {
      title: 'Stage', dataIndex: 'stage', key: 'stage', sorter: (a, b) => (a.stage || '').localeCompare(b.stage || ''),
      filters: LEAD_STAGES.map(s => ({ text: s.charAt(0).toUpperCase() + s.slice(1), value: s })),
      filteredValue: filters.stage || null,
      render: (s) => <StageTag stage={s} />,
    },
    {
      title: 'Source', dataIndex: 'source', key: 'source',
      filters: LEAD_SOURCES.map(s => ({ text: s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: s })),
      filteredValue: filters.source || null,
      render: (s) => <Tag style={{ fontSize: 10 }}>{s || 'unknown'}</Tag>, responsive: ['lg'],
    },
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
  ], [filters]);

  const onChange = (pagination, tableFilters) => {
    setFilters({ stage: tableFilters.stage || null, source: tableFilters.source || null });
  };

  return (
    <Spin spinning={hook.loading}>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Lead</Button>
          <Button icon={<GlobalOutlined />} loading={hook.generating} onClick={hook.generate}>Generate from ICP</Button>
          {selectedRowKeys.length > 0 && (
            <Popconfirm title={`Delete ${selectedRowKeys.length} leads?`} onConfirm={deleteSelected}>
              <Button danger icon={<DeleteOutlined />}>Delete Selected ({selectedRowKeys.length})</Button>
            </Popconfirm>
          )}
          <Input
            placeholder="Search leads..."
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            style={{ width: 220 }}
          />
        </Space>
        <div style={{ marginTop: 8 }}>
          <Progress percent={Math.round((filtered.filter(l => l.stage === 'qualified' || l.stage === 'proposal').length / Math.max(filtered.length, 1)) * 100)} size="small" />
        </div>
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        onChange={onChange}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        pagination={filtered.length > 20 ? { pageSize: 20, size: 'small', showTotal: (t) => `${t} leads` } : false}
        locale={{ emptyText: <Empty description="No leads yet. Generate from ICP or add manually." /> }}
        size="small"
      />

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
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1d23', marginBottom: 6 }}>Source URL</div>
            <Input size="middle" placeholder="https:// ... where this lead was found" value={form.sourceUrl} onChange={e => setForm(p => ({ ...p, sourceUrl: e.target.value }))} />
          </div>
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1d23', marginBottom: 6 }}>Stage</div>
              <Select size="middle" value={form.stage} onChange={v => setForm(p => ({ ...p, stage: v }))} style={{ width: '100%' }}>
                {LEAD_STAGES.map(s => <Select.Option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</Select.Option>)}
              </Select>
            </Col>
            <Col span={12}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1d23', marginBottom: 6 }}>Source</div>
              <Select size="middle" value={form.source} onChange={v => setForm(p => ({ ...p, source: v }))} style={{ width: '100%' }}>
                {LEAD_SOURCES.map(s => <Select.Option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Select.Option>)}
              </Select>
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
  const [viewItem, setViewItem] = useState(null);

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', render: (t, r) => <a onClick={() => setViewItem(r)} style={{ fontSize: 13, fontWeight: 600, color: '#1a1d23', cursor: 'pointer' }}>{t}</a> },
    { title: 'Type', dataIndex: 'contentType', key: 'type', render: (t) => <Tag style={{ fontFamily: "'Space Mono', monospace", fontSize: 10 }}>{t}</Tag>, responsive: ['md'] },
    { title: 'Platform', dataIndex: 'platform', key: 'platform', render: (p) => p || '-', responsive: ['lg'] },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <StatusTag status={s} /> },
    {
      title: '', key: 'actions', width: 80,
      render: (_, r) => (
        <Space>
          <Button type="text" size="small" icon={<SearchOutlined />} onClick={() => setViewItem(r)} />
          <Popconfirm title="Delete?" onConfirm={() => contents.remove(r.id)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
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

      {/* View Content Modal */}
      <Modal
        title={viewItem?.title || 'View Content'}
        open={!!viewItem}
        onCancel={() => setViewItem(null)}
        footer={<Button onClick={() => setViewItem(null)}>Close</Button>}
        width={640}
      >
        {viewItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <Text style={{ fontSize: 11, fontWeight: 600, color: '#7c8291', textTransform: 'uppercase', letterSpacing: 0.5 }}>Type</Text>
              <div><Tag style={{ fontFamily: "'Space Mono', monospace", fontSize: 11 }}>{viewItem.contentType}</Tag></div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <Text style={{ fontSize: 11, fontWeight: 600, color: '#7c8291', textTransform: 'uppercase', letterSpacing: 0.5 }}>Platform</Text>
                <div style={{ fontSize: 13, color: '#1a1d23' }}>{viewItem.platform || '-'}</div>
              </div>
              <div>
                <Text style={{ fontSize: 11, fontWeight: 600, color: '#7c8291', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</Text>
                <div><StatusTag status={viewItem.status} /></div>
              </div>
              {viewItem.scheduledAt && (
                <div>
                  <Text style={{ fontSize: 11, fontWeight: 600, color: '#7c8291', textTransform: 'uppercase', letterSpacing: 0.5 }}>Scheduled</Text>
                  <div style={{ fontSize: 13, color: '#1a1d23' }}>{new Date(viewItem.scheduledAt).toLocaleDateString()}</div>
                </div>
              )}
            </div>
            {viewItem.body && (
              <div>
                <Text style={{ fontSize: 11, fontWeight: 600, color: '#7c8291', textTransform: 'uppercase', letterSpacing: 0.5 }}>Body</Text>
                <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: '#1a1d23', marginTop: 4, padding: 12, background: '#f8f9fb', borderRadius: 6, maxHeight: 400, overflow: 'auto' }}>{viewItem.body}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

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
  const reach = outputs.outreach || '';
  const [copyLabel, setCopyLabel] = useState(null);

  const parseTemplates = (text) => {
    const sections = [];
    const lines = text.split('\n');
    let current = null;
    for (const line of lines) {
      const headerMatch = line.match(/^(\d+\.\s*)?([A-Z][A-Z\s\-–—]+|[A-Z][A-Za-z\s]+(?:EMAIL|MESSAGE|REQUEST|FOLLOW-UP))/);
      if (headerMatch && line.trim().length < 60) {
        if (current) sections.push(current);
        current = { header: line.trim(), body: [] };
      } else if (current) {
        current.body.push(line);
      }
    }
    if (current) sections.push(current);
    if (sections.length === 0 && text.trim()) {
      sections.push({ header: 'Outreach Templates', body: text.split('\n') });
    }
    return sections;
  };

  const templates = parseTemplates(reach);

  const getEmailHtml = (text) => {
    const clean = text.replace(/\n{3,}/g, '\n\n').trim();
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.7;color:#1a1d23;margin:0;padding:0;background:#f4f4f5"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)"><tr><td style="padding:24px 32px;font-size:13px;line-height:1.7;color:#1a1d23;white-space:pre-wrap">${clean.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')}</td></tr></table></td></tr></table></body></html>`;
  };

  const copyHtml = (text) => {
    const html = getEmailHtml(text);
    navigator.clipboard.writeText(html).then(() => {
      setCopyLabel(true);
      setTimeout(() => setCopyLabel(null), 2000);
    }).catch(() => {
      navigator.clipboard.writeText(text).then(() => {
        setCopyLabel(false);
        setTimeout(() => setCopyLabel(null), 2000);
      });
    });
  };

  const typeIcons = {
    'COLD EMAIL': <MailOutlined />,
    'FOLLOW-UP EMAIL': <MailOutlined />,
    'BREAK-UP EMAIL': <MailOutlined />,
    'LINKEDIN': <GlobalOutlined />,
    'WHATSAPP': <PhoneOutlined />,
  };

  const typeColors = {
    'COLD EMAIL': '#8b5cf6',
    'FOLLOW-UP EMAIL': '#f59e0b',
    'BREAK-UP EMAIL': '#ef4444',
    'LINKEDIN': '#0a66c2',
    'WHATSAPP': '#25d366',
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={5} style={{ margin: 0 }}>Outreach Templates</Title>
      </div>

      {reach.length > 50 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {templates.map((t, i) => {
            const bodyText = t.body.join('\n').trim();
            const firstLine = bodyText.split('\n')[0] || '';
            const subjectMatch = firstLine.match(/subject:\s*(.+)/i);
            const subject = subjectMatch ? subjectMatch[1] : '';
            const bodyContent = subjectMatch ? bodyText.split('\n').slice(1).join('\n').trim() : bodyText;
            const typeKey = Object.keys(typeIcons).find(k => t.header.toUpperCase().includes(k)) || '';
            const icon = typeIcons[typeKey] || <MailOutlined />;
            const color = typeColors[typeKey] || '#8b5cf6';

            return (
              <Card
                key={i}
                size="small"
                style={{ borderTop: `3px solid ${color}`, borderRadius: 8 }}
                extra={
                  <Space>
                    <Button size="small" type="text" icon={copyLabel === true ? <CheckCircleOutlined style={{ color: '#00b894' }} /> : <SendOutlined />} onClick={() => copyHtml(bodyText)}>
                      {copyLabel === true ? 'Copied!' : 'Copy HTML'}
                    </Button>
                  </Space>
                }
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color, flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 14, color: '#1a1d23' }}>{t.header}</Text>
                    {!bodyContent && bodyText.length > 0 ? (
                      <div style={{ marginTop: 8, padding: 16, background: '#f8f9fb', borderRadius: 8, border: '1px solid #e2e5eb', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: '#1a1d23' }}>{bodyText}</div>
                    ) : (
                      <>
                        {subject && (
                          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, fontWeight: 600, color: '#7c8291', textTransform: 'uppercase', letterSpacing: 0.5 }}>Subject</Text>
                            <div style={{ background: '#f0f2f6', padding: '4px 10px', borderRadius: 4, fontSize: 12, color: '#1a1d23', fontFamily: "'Space Mono', monospace" }}>{subject}</div>
                          </div>
                        )}
                        <div style={{ marginTop: 8, background: '#fff', borderRadius: 8, border: '1px solid #e2e5eb', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                          <div style={{ padding: '12px 16px', background: '#f8f9fb', borderBottom: '1px solid #e2e5eb', display: 'flex', gap: 16, fontSize: 11, color: '#7c8291' }}>
                            <span><strong>From:</strong> {workspace.serviceName} <span style={{ color: '#b0b6c4' }}>&lt;hello@{workspace.website?.replace('https://','').replace('http://','').split('/')[0] || 'company.com'}&gt;</span></span>
                          </div>
                          <div style={{ padding: '20px 24px', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: '#1a1d23', maxHeight: 400, overflow: 'auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>{bodyContent || bodyText}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card size="small" style={{ borderTop: '3px solid #8b5cf6' }}>
          <Empty description="No outreach templates generated yet. Run Workspace Generation first." />
        </Card>
      )}
    </div>
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

const STAGE_GOALS = {
  'pre-launch': ['Build anticipation', 'Validate demand', 'Grow waitlist'],
  'just-launched': ['Acquire first users', 'Get first paying customers', 'Build brand awareness'],
  established: ['Scale user base', 'Increase revenue', 'Expand to new markets'],
  pivoting: ['Re-introduce brand', 'Enter new segment', 'Win back users'],
};

const SETTINGS_CHANNELS = ['LinkedIn', 'Twitter/X', 'Email', 'Blog/SEO', 'Community', 'Partnerships', 'Content Marketing'];

function SettingsView({ workspace, onUpdate }) {
  const [form, setForm] = useState({
    name: workspace.name || '',
    serviceName: workspace.serviceName || '',
    serviceType: workspace.serviceType || 'service',
    website: workspace.website || '',
    description: workspace.description || '',
    location: workspace.location || '',
    targetMarkets: Array.isArray(workspace.targetMarkets) ? [...workspace.targetMarkets] : [],
    stage: workspace.stage || '',
    primaryGoal: workspace.primaryGoal || '',
    channels: Array.isArray(workspace.channels) ? [...workspace.channels] : [],
    targetRegion: workspace.targetRegion || '',
    targetCountry: workspace.targetCountry || '',
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
      stage: workspace.stage || '',
      primaryGoal: workspace.primaryGoal || '',
      channels: Array.isArray(workspace.channels) ? [...workspace.channels] : [],
      targetRegion: workspace.targetRegion || '',
      targetCountry: workspace.targetCountry || '',
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

  const toggleChannel = (ch) => {
    setForm(p => ({
      ...p,
      channels: p.channels.includes(ch) ? p.channels.filter(c => c !== ch) : [...p.channels, ch],
    }));
  };

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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Region</div>
                  <input value={form.targetRegion} onChange={e => setForm(p => ({ ...p, targetRegion: e.target.value }))} style={inputBase} placeholder="e.g. South Asia, Middle East" />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Country</div>
                  <input value={form.targetCountry} onChange={e => setForm(p => ({ ...p, targetCountry: e.target.value }))} style={inputBase} placeholder="e.g. Bangladesh, UAE" />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Marketing Goals" size="small" style={{ borderTop: '3px solid #f59e0b' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product Stage</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { value: 'pre-launch', label: 'Pre-launch' },
                    { value: 'just-launched', label: 'Just launched' },
                    { value: 'established', label: 'Established' },
                    { value: 'pivoting', label: 'Pivoting / Re-launching' },
                  ].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, stage: opt.value, primaryGoal: p.stage !== opt.value ? '' : p.primaryGoal }))}
                      style={{
                        padding: '6px 14px', borderRadius: 6, border: '1px solid',
                        borderColor: form.stage === opt.value ? '#f59e0b' : '#e2e6ed',
                        background: form.stage === opt.value ? 'rgba(245,158,11,0.08)' : '#fff',
                        color: form.stage === opt.value ? '#92400e' : '#6b7280',
                        fontSize: 12, cursor: 'pointer',
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {form.stage && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Primary Goal</div>
                  <select value={form.primaryGoal} onChange={e => setForm(p => ({ ...p, primaryGoal: e.target.value }))} style={{ ...inputBase, cursor: 'pointer' }}>
                    <option value="">Select a goal...</option>
                    {(STAGE_GOALS[form.stage] || []).map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Focus Channels</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SETTINGS_CHANNELS.map(ch => (
                    <button key={ch} type="button" onClick={() => toggleChannel(ch)}
                      style={{
                        padding: '5px 12px', borderRadius: 20, border: '1px solid',
                        borderColor: form.channels.includes(ch) ? '#f59e0b' : '#e2e6ed',
                        background: form.channels.includes(ch) ? '#f59e0b' : '#fff',
                        color: form.channels.includes(ch) ? '#fff' : '#6b7280',
                        fontSize: 11, cursor: 'pointer',
                      }}>
                      {ch}
                    </button>
                  ))}
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
