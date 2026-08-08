'use client';

import { useState, useEffect } from 'react';

interface ClientCompany {
  id: number;
  name: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  totalBatches?: number;
  createdAt: string;
}

export default function ClientsManagementPage() {
  const [clients, setClients] = useState<ClientCompany[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<ClientCompany | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    status: 'active',
  });

  const [formError, setFormError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch clients:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      status: 'active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: ClientCompany) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      username: client.username || '',
      email: client.email || '',
      phone: client.phone || '',
      password: '', // Blank unless changed
      status: client.status || 'active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.username.trim()) {
      setFormError('Nama Perusahaan dan Username Login wajib diisi.');
      return;
    }

    if (!editingClient && !formData.password.trim()) {
      setFormError('Password wajib diisi untuk akun Klien baru.');
      return;
    }

    setSubmitting(true);
    try {
      const url = '/api/superadmin/clients';
      const method = editingClient ? 'PUT' : 'POST';
      const bodyPayload = editingClient
        ? { id: editingClient.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchClients();
      } else {
        setFormError(data.error || 'Terjadi kesalahan saat menyimpan data klien.');
      }
    } catch (e: any) {
      setFormError('Terjadi kesalahan koneksi server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (client: ClientCompany) => {
    const newStatus = client.status === 'active' ? 'inactive' : 'active';
    const actionName = newStatus === 'active' ? 'mengaktifkan' : 'menonaktifkan';

    if (!confirm(`Yakin ingin ${actionName} akun Klien "${client.name}"?`)) return;

    try {
      const res = await fetch('/api/superadmin/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: client.id,
          name: client.name,
          username: client.username,
          status: newStatus,
        }),
      });
      if (res.ok) fetchClients();
    } catch (e) {
      console.error('Failed to toggle status:', e);
    }
  };

  const handleDeleteClient = async (client: ClientCompany) => {
    if (!confirm(`Hapus permanen akun Klien "${client.name}"? Data yang terhapus tidak dapat dikembalikan.`)) return;

    try {
      const res = await fetch(`/api/superadmin/clients?id=${client.id}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchClients();
    } catch (e) {
      console.error('Failed to delete client:', e);
    }
  };

  // Filtered clients
  const filteredClients = clients.filter((c) => {
    return (
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'active').length;
  const totalBatchesCount = clients.reduce((acc, c) => acc + (c.totalBatches || 0), 0);

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
            Daftar Klien Perusahaan (B2B HRD Portal)
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
            Kelola akun portal rekrutmen perusahaan mitra yang dapat mengakses laporan kandidat secara mandiri.
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
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>+</span> Tambah Klien Perusahaan
        </button>
      </div>

      {/* METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* TOTAL KLIEN */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            TOTAL PERUSAHAAN MITRA
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A' }}>
            {totalClients} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748B' }}>Perusahaan</span>
          </div>
        </div>

        {/* KLIEN AKTIF */}
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#15803D', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            AKUN KLIEN AKTIF
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16A34A' }}>
            {activeClients} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#15803D' }}>Aktif</span>
          </div>
        </div>

        {/* TOTAL BATCH */}
        <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#0369A1', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            TOTAL BATCH KLIEN
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284C7' }}>
            {totalBatchesCount} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0369A1' }}>Sesi Ujian</span>
          </div>
        </div>

      </div>

      {/* MAIN CONTAINER */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
        
        {/* SEARCH BAR */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ position: 'relative', width: '360px', maxWidth: '100%' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '14px' }}>🔍</span>
            <input
              type="text"
              placeholder="Cari nama perusahaan, username, email..."
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
        </div>

        {/* TABLE */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                  NAMA PERUSAHAAN KLIEN
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                  USERNAME LOGIN
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                  EMAIL & KONTAK
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                  TOTAL BATCH
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                  STATUS AKUN
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>
                  AKSI (CRUD)
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                    Memuat data klien perusahaan...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                    Belum ada data perusahaan klien yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    
                    {/* NAMA PERUSAHAAN */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '14px' }}>
                        🏢 {client.name}
                      </div>
                    </td>

                    {/* USERNAME LOGIN */}
                    <td style={{ padding: '16px' }}>
                      <code style={{ background: '#F1F5F9', padding: '4px 8px', borderRadius: '6px', fontSize: '13px', color: '#0F172A', fontWeight: 700 }}>
                        {client.username}
                      </code>
                    </td>

                    {/* EMAIL & KONTAK */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                        {client.email || `${client.username}@klien.id`}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                        {client.phone || '08123456789'}
                      </div>
                    </td>

                    {/* TOTAL BATCH */}
                    <td style={{ padding: '16px' }}>
                      <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                        {client.totalBatches || 0} Sesi Batch
                      </span>
                    </td>

                    {/* STATUS AKUN */}
                    <td style={{ padding: '16px' }}>
                      {client.status === 'inactive' ? (
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
                          onClick={() => handleOpenEditModal(client)}
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
                          onClick={() => handleToggleStatus(client)}
                          style={{
                            background: '#F1F5F9',
                            color: client.status === 'active' ? '#D97706' : '#166534',
                            border: '1px solid #CBD5E1',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {client.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteClient(client)}
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

      {/* MODAL DIALOG (ADD / EDIT KLIEN) */}
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
              maxWidth: '500px',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                {editingClient ? 'Edit Klien Perusahaan' : 'Tambah Klien Perusahaan'}
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

            <form onSubmit={handleSubmitForm}>
              
              {/* Nama Perusahaan */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Nama Perusahaan / Instansi Klien *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PT Bank Mandiri (Persero) Tbk"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              {/* Username Login */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Username Login Portal Klien *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: hrd_mandiri"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              {/* Email & Telepon */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                    Email HRD / Kontak
                  </label>
                  <input
                    type="email"
                    placeholder="hrd@mandiri.co.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Status & Password */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
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

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                    Password Akun
                  </label>
                  <input
                    type="password"
                    placeholder={editingClient ? 'Kosongkan jika tetap' : 'Password login'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={inputStyle}
                  />
                </div>
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
                {submitting ? 'Menyimpan...' : 'Simpan Data Klien Perusahaan'}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
