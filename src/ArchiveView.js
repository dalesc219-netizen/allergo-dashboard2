import React from 'react';
import { Calendar, Loader2 } from 'lucide-react';

const ArchiveView = ({ historyData, role, openEditModal, isLoading }) => {
  if (isLoading) {
    return (
      <div className="view-pane" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15, color: 'var(--text-secondary)' }}>
          <Loader2 size={32} style={{ animation: 'spin 2s linear infinite' }} />
          <span>Загрузка архива...</span>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="view-pane">
      {historyData.length === 0 ? (
        <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh' }}>
          <Calendar size={48} style={{ color: 'var(--text-secondary)', marginBottom: 15, opacity: 0.5 }} />
          <h3 style={{ marginBottom: 10, fontSize: 18, color: 'var(--text-main)' }}>Нет данных</h3>
          <p style={{ fontSize: 14 }}>Здесь будет история прошлых замеров</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15, paddingBottom: 20 }}>
          {historyData.map(item => (
            <div 
              key={item.date} 
              className="card" 
              style={{ padding: '15px', marginBottom: 0, cursor: role === 'admin' ? 'pointer' : 'default' }} 
              onClick={() => role === 'admin' && openEditModal(item)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center', borderBottom: '0.5px solid var(--glass-border)', paddingBottom: 10 }}>
                <strong style={{ fontSize: 16 }}>{item.date.split('-').reverse().join('.')}</strong>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Σ {Number(item.alder||0) + Number(item.hazel||0) + Number(item.birch||0) + Number(item.oak||0)} ед/м³</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                <div>Ольха: <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{item.alder}</span></div>
                <div>Орешник: <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{item.hazel}</span></div>
                <div>Береза: <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{item.birch}</span></div>
                <div>Дуб: <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{item.oak}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchiveView;