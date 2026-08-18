'use client';

import { useState, useEffect } from 'react';

interface TestBatch {
  id: number;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  jobPosition?: { name: string } | null;
}

interface TeamMember {
  id: number;
  name: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  license?: string | null;
  role: string;
  status: string;
  assignedTestIds?: string | null;
  createdAt: string;
}

export default function TeamManagementPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [availableTests, setAvailableTests] = useState<TestBatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: 'tester',
    status: 'active',
    license: '',
    password: '',
    assignedTestIds: [] as number[],
  });

  const [formError, setFormError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/team');
      if (res.ok) {
        const data = await res.json();
        setTeam(data.users || []);
        setAvailableTests(data.tests || []);
      }
    } catch (e) {
      console.error('Failed to fetch team data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      role: 'tester',
      status: 'active',
      license: '',
      password: '',
      assignedTestIds: [],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: TeamMember) => {
    setEditingMember(member);
    let parsedAssigned: number[] = [];
    if (member.assignedTestIds) {
      try {
        parsedAssigned = JSON.parse(member.assignedTestIds);
      } catch (e) {}
    }

    setFormData({
      name: member.name || '',
      role: member.role || 'admin',
      status: member.status || 'active',
      license: member.license || '',
      password: '', // Blank unless changed
      assignedTestIds: parsedAssigned,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleToggleBatchCheck = (testId: number) => {
    setFormData((prev) => {
      const exists = prev.assignedTestIds.includes(testId);
      const updated = exists
        ? prev.assignedTestIds.filter((id) => id !== testId)
        : [...prev.assignedTestIds, testId];
      return { ...prev, assignedTestIds: updated };
    });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Nama Lengkap wajib diisi.');
      return;
    }

    if (!editingMember && !formData.password.trim()) {
      setFormError('Password wajib diisi untuk anggota tim baru.');
      return;
    }

    setSubmitting(true);
    try {
      const url = '/api/superadmin/team';
      const method = editingMember ? 'PUT' : 'POST';
      const bodyPayload = editingMember
        ? { id: editingMember.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchTeamData();
      } else {
        setFormError(data.error || 'Terjadi kesalahan saat menyimpan data.');
      }
    } catch (e: any) {
      setFormError('Terjadi kesalahan koneksi server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: TeamMember) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    const actionName = newStatus === 'active' ? 'mengaktifkan' : 'menonaktifkan';

    if (!confirm(`Yakin ingin ${actionName} akun ${member.name}?`)) return;

    try {
      const res = await fetch('/api/superadmin/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: member.id,
          name: member.name,
          username: member.username,
          role: member.role,
          status: newStatus,
        }),
      });
      if (res.ok) fetchTeamData();
    } catch (e) {
      console.error('Failed to toggle status:', e);
    }
  };

  const handleDeleteMember = async (member: TeamMember) => {
    if (!confirm(`Hapus permanen anggota tim "${member.name}"? Data yang terhapus tidak dapat dikembalikan.`)) return;

    try {
      const res = await fetch(`/api/superadmin/team?id=${member.id}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchTeamData();
    } catch (e) {
      console.error('Failed to delete member:', e);
    }
  };

  // Filtered members
  const filteredTeam = team.filter((m) => {
    const matchesSearch =
      (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.license || '').toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === 'ALL'
        ? true
        : roleFilter === 'superadmin'
        ? m.role === 'superadmin'
        : roleFilter === 'psikolog'
        ? m.role === 'psikolog'
        : m.role === 'tester';

    return matchesSearch && matchesRole;
  });

  // Metrics
  const totalPersonnel = team.length;
  const psikologCount = team.filter((m) => m.role === 'psikolog').length;
  const testerCount = team.filter((m) => m.role === 'tester').length;
  const superAdminCount = team.filter((m) => m.role === 'superadmin').length;

  const getRoleBadge = (role: string) => {
    if (role === 'superadmin') {
      return (
        <span style={{ background: '#E6F4EA', color: '#137333', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 700, display: 'inline-block' }}>
          Super Administrator
        </span>
      );
    }
    if (role === 'psikolog') {
      return (
        <span style={{ background: '#F3E8FF', color: '#6B21A8', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 700, display: 'inline-block' }}>
          Psikolog Assessor
        </span>
      );
    }
    return (
      <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 700, display: 'inline-block' }}>
        Tester
      </span>
    );
  };

  const renderAssignedBatches = (member: TeamMember) => {
    if (member.role === 'superadmin') {
      return <span style={{ color: '#047857', fontWeight: 600, fontSize: '12px' }}>🌐 Semua Batch (Akses Penuh)</span>;
    }
    if (!member.assignedTestIds) {
      return <span style={{ color: '#94A3B8', fontSize: '12px', fontStyle: 'italic' }}>Belum ditugaskan ke Batch</span>;
    }

    try {
      const ids: number[] = JSON.parse(member.assignedTestIds);
      if (!Array.isArray(ids) || ids.length === 0) {
        return <span style={{ color: '#94A3B8', fontSize: '12px', fontStyle: 'italic' }}>Belum ditugaskan ke Batch</span>;
      }

      const assignedTitles = availableTests
        .filter((t) => ids.includes(t.id))
        .map((t) => t.title);

      if (assignedTitles.length === 0) {
        return <span style={{ color: '#64748B', fontSize: '12px' }}>Batch #{ids.join(', #')}</span>;
      }

      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
          {assignedTitles.map((t, idx) => (
            <span key={idx} style={{ background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: '1px solid #E2E8F0' }}>
              📌 {t}
            </span>
          ))}
        </div>
      );
    } catch (e) {
      return <span style={{ color: '#94A3B8', fontSize: '12px' }}>{member.assignedTestIds}</span>;
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1.5px solid #CBD5E1',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontWeight: 500,
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1.5px solid #CBD5E1',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: '1.5rem', background: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER TITLE & BUTTON */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: 0, marginBottom: '0.25rem' }}>
            Pengelolaan Tim Psikotes & Penugasan Batch
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
            Kelola akun personel tim, hak akses peran, serta penugasan Batch / Sesi Ujian untuk Tester.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          style={{
            background: '#0D9488',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>+</span> Tambah Anggota Tim
        </button>
      </div>

      {/* METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* TOTAL TIM */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            TOTAL TIM
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A' }}>
            {totalPersonnel} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#475569' }}>Personel</span>
          </div>
        </div>

        {/* PSIKOLOG ASSESSOR */}
        <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#7E22CE', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            PSIKOLOG ASSESSOR
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6B21A8' }}>
            {psikologCount} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#7E22CE' }}>Personel</span>
          </div>
        </div>

        {/* TESTER */}
        <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#0369A1', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            TESTER
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284C7' }}>
            {testerCount} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0369A1' }}>Personel</span>
          </div>
        </div>

        {/* SUPER ADMINISTRATOR */}
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#15803D', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            SUPER ADMINISTRATOR
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16A34A' }}>
            {superAdminCount} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#15803D' }}>Personel</span>
          </div>
        </div>

      </div>

      {/* MAIN CONTAINER */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        
        {/* SEARCH & ROLE FILTER BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '14px' }}>🔍</span>
            <input
              type="text"
              placeholder="Cari nama, SIPP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
              }}
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1.5px solid #CBD5E1',
              fontSize: '14px',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="ALL" style={{ color: '#0F172A', background: '#FFFFFF' }}>Semua Peran (Role)</option>
            <option value="superadmin" style={{ color: '#0F172A', background: '#FFFFFF' }}>Super Administrator</option>
            <option value="psikolog" style={{ color: '#0F172A', background: '#FFFFFF' }}>Psikolog Assessor</option>
            <option value="tester" style={{ color: '#0F172A', background: '#FFFFFF' }}>Tester</option>
          </select>
        </div>

        {/* TABLE */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  NAMA PERSONEL & LISENSI
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  PERAN / ROLE
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  PENUGASAN BATCH (SESI)
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  STATUS AKUN
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
                  AKSI (CRUD)
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                    Memuat data tim...
                  </td>
                </tr>
              ) : filteredTeam.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                    Tidak ada anggota tim yang sesuai dengan kriteria.
                  </td>
                </tr>
              ) : (
                filteredTeam.map((member) => (
                  <tr key={member.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    
                    {/* NAMA & LISENSI */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '14px' }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        {member.license || (member.role === 'superadmin' ? 'Super Administrator / System Architect' : 'Admin Tester Operasional')}
                      </div>
                    </td>

                    {/* PERAN / ROLE */}
                    <td style={{ padding: '16px' }}>
                      {getRoleBadge(member.role)}
                    </td>

                    {/* PENUGASAN BATCH */}
                    <td style={{ padding: '16px' }}>
                      {renderAssignedBatches(member)}
                    </td>

                    {/* STATUS AKUN */}
                    <td style={{ padding: '16px' }}>
                      {member.status === 'inactive' ? (
                        <span style={{ background: '#F1F5F9', color: '#64748B', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                          • Nonaktif
                        </span>
                      ) : (
                        <span style={{ background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                          • Aktif
                        </span>
                      )}
                    </td>

                    {/* AKSI */}
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(member)}
                          style={{
                            background: '#F1F5F9',
                            color: '#334155',
                            border: '1px solid #CBD5E1',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>

                        {/* Toggle Status Button */}
                        <button
                          onClick={() => handleToggleStatus(member)}
                          style={{
                            background: '#F1F5F9',
                            color: member.status === 'active' ? '#D97706' : '#166534',
                            border: '1px solid #CBD5E1',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {member.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteMember(member)}
                          style={{
                            background: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FCA5A5',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL DIALOG (ADD / EDIT) */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                {editingMember ? 'Edit Anggota Tim Psikotes' : 'Tambah Anggota Tim Psikotes'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748B', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} autoComplete="off">
              {/* Dummy hidden inputs to prevent browser autofill on real form inputs */}
              <input type="text" name="prevent_autofill_username" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
              <input type="password" name="prevent_autofill_password" style={{ display: 'none' }} tabIndex={-1} autoComplete="new-password" />

              {/* Nama Lengkap */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dra. Ani Suryani, M.Psi"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyle}
                  required
                  autoComplete="off"
                  name="team_member_fullname"
                />
              </div>

              {/* Role & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                    Peran / Hak Akses (Role)
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="tester" style={{ color: '#0F172A', background: '#FFFFFF' }}>Tester</option>
                    <option value="psikolog" style={{ color: '#0F172A', background: '#FFFFFF' }}>Psikolog Assessor</option>
                    <option value="superadmin" style={{ color: '#0F172A', background: '#FFFFFF' }}>Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                    Status Akun
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="active" style={{ color: '#0F172A', background: '#FFFFFF' }}>Aktif</option>
                    <option value="inactive" style={{ color: '#0F172A', background: '#FFFFFF' }}>Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* PENUGASAN BATCH (SESI UJIAN) */}
              {formData.role !== 'superadmin' && (
                <div style={{ marginBottom: '1.25rem', background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                    🎯 Penugasan Batch (Sesi Ujian)
                  </label>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 10px 0' }}>
                    Pilih Batch / Sesi Ujian mana saja yang dapat diakses dan dilihat oleh {formData.role === 'psikolog' ? 'Psikolog' : 'Tester'} ini.
                  </p>

                  {availableTests.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                      Belum ada Batch / Sesi Ujian yang dibuat di menu Penjadwalan.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                      {availableTests.map((t) => {
                        const isChecked = formData.assignedTestIds.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 12px',
                              background: isChecked ? '#EFF6FF' : '#FFFFFF',
                              border: isChecked ? '1.5px solid #3B82F6' : '1px solid #CBD5E1',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: isChecked ? 700 : 500,
                              color: isChecked ? '#1E40AF' : '#334155',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleBatchCheck(t.id)}
                              style={{ width: '16px', height: '16px', accentColor: '#0D9488', cursor: 'pointer' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div>{t.title}</div>
                              {t.jobPosition?.name && (
                                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 400 }}>
                                  Jabatan: {t.jobPosition.name}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Lisensi SIPP */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Lisensi SIPP / Spesialisasi / Catatan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 554-12/SIPP-HIPSI/2022 (Klinis & Industri)"
                  value={formData.license}
                  onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                  style={inputStyle}
                  autoComplete="off"
                  name="team_member_license"
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Password Akun
                </label>
                <input
                  type="password"
                  placeholder={editingMember ? 'Kosongkan jika tidak diubah' : 'Masukkan password baru'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={inputStyle}
                  autoComplete="new-password"
                  name="team_member_password"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  background: '#0D9488',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)',
                }}
              >
                {submitting ? 'Menyimpan...' : 'Simpan Data Personel Tim'}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
