import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  const { data: biroResponse } = useQuery({
    queryKey: ['biro-list'],
    queryFn: () => api.list('biro'),
  });

  const { data: skorResponse } = useQuery({
    queryKey: ['skor-dokumen'],
    queryFn: () => api.list('skor', { limit: 50 }),
  });

  const { data: dokumenResponse } = useQuery({
    queryKey: ['dokumen-renja'],
    queryFn: () => api.list('dokumen', { limit: 100 }),
  });

  const biroList = Array.isArray(biroResponse?.data) ? biroResponse.data : [];
  const skorData = Array.isArray(skorResponse?.data) ? skorResponse.data : [];
  const dokumenData = Array.isArray(dokumenResponse?.data) ? dokumenResponse.data : [];

  const totalDokumen = dokumenData.length;
  const sudahDiperiksa = skorData.filter(s => s.status_final && s.status_final !== 'draft').length;
  const perluRevisi = skorData.filter(s => s.status_final === 'perlu_revisi').length;
  const layakKirim = skorData.filter(s => s.status_final === 'layak_kirim' || s.status_final === 'sudah_dikirim').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Ringkasan status pra-verifikasi dokumen Renja Setda</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Dokumen" value={totalDokumen} icon={FileText} color="primary" />
        <StatCard title="Sudah Diperiksa" value={sudahDiperiksa} icon={CheckCircle} color="success" />
        <StatCard title="Perlu Revisi" value={perluRevisi} icon={AlertTriangle} color="warning" />
        <StatCard title="Layak Kirim" value={layakKirim} icon={Clock} color="accent" />
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Daftar Biro</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {biroList.map(biro => (
            <div key={biro.id} className="p-3 bg-muted/30 rounded-lg">
              <p className="font-medium text-sm">{biro.nama_biro}</p>
              <p className="text-xs text-muted-foreground">{biro.kode_biro}</p>
            </div>
          ))}
        </div>
        {biroList.length === 0 && (
          <p className="text-muted-foreground text-sm">Belum ada data biro</p>
        )}
      </div>
    </div>
  );
}
