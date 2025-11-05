import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { machinesAPI, VNCMachine } from '../api/machines';
import MachineCard from '../components/MachineCard';
import MachineModal from '../components/MachineModal';
import VNCViewer from '../components/VNCViewer';
import './Dashboard.css';

interface VNCTab {
  id: string;
  machine: VNCMachine;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [machines, setMachines] = useState<VNCMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'main' | 'my'>('main');
  const [vncTabs, setVncTabs] = useState<VNCTab[]>([]);
  const [activeVncTab, setActiveVncTab] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<VNCMachine | undefined>();

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      setLoading(true);
      const data = await machinesAPI.getAll();
      setMachines(data);
    } catch (error) {
      console.error('Error loading machines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMachine = (machine: VNCMachine) => {
    const tabId = `vnc-${machine.id}-${Date.now()}`;
    const newTab: VNCTab = { id: tabId, machine };
    setVncTabs((prev) => [...prev, newTab]);
    setActiveVncTab(tabId);
  };

  const handleCloseVncTab = (tabId: string) => {
    setVncTabs((prev) => prev.filter((tab) => tab.id !== tabId));
    if (activeVncTab === tabId) {
      const remainingTabs = vncTabs.filter((tab) => tab.id !== tabId);
      setActiveVncTab(remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1].id : null);
    }
  };

  const handleEditMachine = (machine: VNCMachine) => {
    setEditingMachine(machine);
    setIsModalOpen(true);
  };

  const handleDeleteMachine = async (machine: VNCMachine) => {
    if (window.confirm(`Czy na pewno chcesz usunąć maszynę "${machine.name}"?`)) {
      try {
        await machinesAPI.delete(machine.id);
        await loadMachines();
      } catch (error) {
        console.error('Error deleting machine:', error);
        alert('Błąd podczas usuwania maszyny');
      }
    }
  };

  const handleSaveMachine = async (data: any) => {
    try {
      if (editingMachine) {
        await machinesAPI.update(editingMachine.id, data);
      } else {
        await machinesAPI.create(data);
      }
      await loadMachines();
      setIsModalOpen(false);
      setEditingMachine(undefined);
    } catch (error) {
      throw error;
    }
  };

  const canEditMachine = (machine: VNCMachine) => {
    return user?.is_admin || machine.owner_id === user?.id;
  };

  const mainMachines = machines.filter((m) => m.is_shared);
  const myMachines = machines.filter((m) => !m.is_shared && m.owner_id === user?.id);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>VNC Manager</h1>
          <div className="header-actions">
            <span className="user-info">Witaj, {user?.username}</span>
            {user?.is_admin && (
              <button className="btn-admin" onClick={() => navigate('/admin')}>
                Panel Administratora
              </button>
            )}
            <button className="btn-logout" onClick={logout}>
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      {vncTabs.length > 0 ? (
        <div className="vnc-tabs-container">
          <div className="vnc-tabs-header">
            {vncTabs.map((tab) => (
              <button
                key={tab.id}
                className={`vnc-tab ${activeVncTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveVncTab(tab.id)}
              >
                {tab.machine.name}
                <button
                  className="vnc-tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseVncTab(tab.id);
                  }}
                >
                  ✕
                </button>
              </button>
            ))}
          </div>
          <div className="vnc-tabs-content">
            {vncTabs.map((tab) => (
              <div
                key={tab.id}
                className={`vnc-tab-panel ${activeVncTab === tab.id ? 'active' : ''}`}
              >
                <VNCViewer
                  url={tab.machine.url}
                  machineName={tab.machine.name}
                  onClose={() => handleCloseVncTab(tab.id)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="dashboard-content">
          <div className="dashboard-tabs">
            <button
              className={`tab-button ${activeTab === 'main' ? 'active' : ''}`}
              onClick={() => setActiveTab('main')}
            >
              Główne ({mainMachines.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'my' ? 'active' : ''}`}
              onClick={() => setActiveTab('my')}
            >
              Moje maszyny ({myMachines.length})
            </button>
          </div>

          <div className="machines-section">
            <div className="section-header">
              <h2>
                {activeTab === 'main' ? 'Maszyny współdzielone' : 'Moje maszyny'}
              </h2>
              <button className="btn-add" onClick={() => setIsModalOpen(true)}>
                + Dodaj maszynę
              </button>
            </div>

            <div className="machines-grid">
              {(activeTab === 'main' ? mainMachines : myMachines).map((machine) => (
                <MachineCard
                  key={machine.id}
                  machine={machine}
                  onOpen={handleOpenMachine}
                  onEdit={handleEditMachine}
                  onDelete={handleDeleteMachine}
                  canEdit={canEditMachine(machine)}
                />
              ))}
              {(activeTab === 'main' ? mainMachines : myMachines).length === 0 && (
                <div className="empty-state">
                  <p>Brak maszyn do wyświetlenia</p>
                  <button className="btn-add" onClick={() => setIsModalOpen(true)}>
                    Dodaj pierwszą maszynę
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <MachineModal
        machine={editingMachine}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMachine(undefined);
        }}
        onSave={handleSaveMachine}
        isAdmin={user?.is_admin}
      />
    </div>
  );
};

export default Dashboard;

