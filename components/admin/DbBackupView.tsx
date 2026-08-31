'use client';

import React, { useState } from 'react';
import { Database, Download, RefreshCw, CheckCircle2, AlertTriangle, Clock, Server } from 'lucide-react';

const BACKUP_FILES = [
  { id: 'b001', filename: 'cch_backup_2026-08-31_18-00.json', size: '4.2 MB', type: 'AUTO', createdAt: '2026-08-31 18:00', status: 'ok' },
  { id: 'b002', filename: 'cch_backup_2026-08-31_12-00.json', size: '4.1 MB', type: 'AUTO', createdAt: '2026-08-31 12:00', status: 'ok' },
  { id: 'b003', filename: 'cch_backup_2026-08-30_manual.json', size: '3.9 MB', type: 'MANUAL', createdAt: '2026-08-30 15:30', status: 'ok' },
  { id: 'b004', filename: 'cch_export_spots_2026-08-29.json', size: '1.2 MB', type: 'EXPORT', createdAt: '2026-08-29 11:20', status: 'ok' },
];

const AUDIT_LOGS = [
  { id: 'a001', time: '18:05', action: 'SPOT_CREATED', user: 'Praew (Editor)', target: 'Doi Inthanon Sunrise Point', status: 'success' },
  { id: 'a002', time: '17:58', action: 'EVENT_APPROVED', user: 'Arm (Moderator)', target: 'งานวิ่ง Charity Run', status: 'success' },
  { id: 'a003', time: '17:30', action: 'USER_ROLE_CHANGED', user: 'Siam (Super Admin)', target: 'Nook → Organizer', status: 'success' },
  { id: 'a004', time: '16:45', action: 'SCRAPER_RUN', user: 'System', target: 'EventPop — 12 found, 2 duplicates', status: 'success' },
  { id: 'a005', time: '16:00', action: 'SPOT_DELETED', user: 'Praew (Editor)', target: 'Old Test Spot', status: 'warning' },
  { id: 'a006', time: '15:30', action: 'BACKUP_CREATED', user: 'System', target: 'AUTO backup — 4.1 MB', status: 'success' },
];

const TYPE_STYLES: Record<string, string> = {
  AUTO:   'bg-[#EBF3ED] text-[#2D5A3C] border-[#4A7C59]/20',
  MANUAL: 'bg-sky-50 text-[#2B527A] border-sky-200',
  EXPORT: 'bg-amber-50 text-amber-700 border-amber-200',
};

const ACTION_STYLES: Record<string, string> = {
  SPOT_CREATED:      'text-[#4A7C59] bg-[#EBF3ED]',
  EVENT_APPROVED:    'text-[#4A7C59] bg-[#EBF3ED]',
  USER_ROLE_CHANGED: 'text-[#2B527A] bg-sky-50',
  SCRAPER_RUN:       'text-slate-600 bg-slate-100',
  SPOT_DELETED:      'text-amber-700 bg-amber-50',
  BACKUP_CREATED:    'text-slate-600 bg-slate-100',
};

export function DbBackupView() {
  const [downloaded, setDownloaded] = useState<Record<string, boolean>>({});

  const handleDownload = (id: string) => {
    setDownloaded((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setDownloaded((prev) => ({ ...prev, [id]: false })), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database size={17} className="text-slate-600" />
            <h1 className="text-xl font-bold text-slate-800">Backup & Audit Logs</h1>
          </div>
          <p className="text-slate-500 text-sm">จัดการ Backup ฐานข้อมูล ดูบันทึกการทำงานของระบบ</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors">
          <Database size={13} />
          สร้าง Backup ตอนนี้
        </button>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Database Status', value: 'Healthy', icon: <CheckCircle2 size={14} className="text-[#4A7C59]" />, style: 'bg-[#EBF3ED] border-[#4A7C59]/15 text-[#4A7C59]' },
          { label: 'Last Auto Backup', value: '6h ago', icon: <Clock size={14} className="text-[#2B527A]" />, style: 'bg-sky-50 border-sky-100 text-[#2B527A]' },
          { label: 'Storage Used', value: '13.4 MB', icon: <Server size={14} className="text-slate-500" />, style: 'bg-slate-50 border-slate-200 text-slate-700' },
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-4 flex items-center gap-3 ${s.style}`}>
            {s.icon}
            <div>
              <p className="text-slate-500 text-xs">{s.label}</p>
              <p className="font-bold text-sm">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Backup Files */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Backup Files</h2>
        <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-xs">
          {BACKUP_FILES.map((file, i) => (
            <div
              key={file.id}
              className={`flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors ${
                i < BACKUP_FILES.length - 1 ? 'border-b border-slate-50' : ''
              }`}
            >
              <Database size={14} className="text-slate-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-slate-700 text-sm font-medium truncate font-mono">{file.filename}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_STYLES[file.type]}`}>
                    {file.type}
                  </span>
                  <p className="text-slate-400 text-xs">{file.size} · {file.createdAt}</p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(file.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors shrink-0 ${
                  downloaded[file.id]
                    ? 'bg-[#EBF3ED] text-[#4A7C59] border-[#4A7C59]/20'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {downloaded[file.id] ? <CheckCircle2 size={11} /> : <Download size={11} />}
                {downloaded[file.id] ? 'Downloaded' : 'Download'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Audit Trail — Today</h2>
          <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#4A7C59] transition-colors">
            <RefreshCw size={11} />
            Refresh
          </button>
        </div>
        <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-xs">
          {AUDIT_LOGS.map((log, i) => (
            <div
              key={log.id}
              className={`flex items-start gap-4 px-5 py-3 hover:bg-slate-50 transition-colors ${
                i < AUDIT_LOGS.length - 1 ? 'border-b border-slate-50' : ''
              }`}
            >
              <span className="text-slate-400 text-xs font-mono shrink-0 mt-0.5 w-10">{log.time}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${ACTION_STYLES[log.action] || 'bg-slate-100 text-slate-500'}`}>
                {log.action.replace(/_/g, ' ')}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-600 text-xs truncate">{log.target}</p>
                <p className="text-slate-400 text-[11px]">โดย {log.user}</p>
              </div>
              <div className="shrink-0">
                {log.status === 'success' ? (
                  <CheckCircle2 size={13} className="text-[#4A7C59]" />
                ) : (
                  <AlertTriangle size={13} className="text-amber-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
