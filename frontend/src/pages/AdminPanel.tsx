import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, User } from '../api/users';
import { machinesAPI, VNCMachine } from '../api/machines';
import MachineModal from '../components/MachineModal';
import './AdminPanel.css';

const AdminPanel: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [machines, setMachines] = useState<VNCMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'machines'>('users');
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<VNCMachine | undefined>();
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [showUserEditModal, setShowUserEditModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, machinesData] = await Promise.all([
        usersAPI.getAll(),
        machinesAPI.getAdminMachines(),
      ]);
      setUsers(usersData);
      setMachines(machinesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (userData: User) => {
    setEditingUser(userData);
    setShowUserEditModal(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
      try {
        await usersAPI.delete(userId);
        await loadData();
      } catch (error: any) {
        alert(error.response?.data?.detail || 'Błąd podczas usuwania użytkownika');
      }
    }
  };

  const handleSaveUser = async (data: any) => {
    if (!editingUser) return;
    try {
      await usersAPI.update(editingUser.id, data);
      await loadData();
      setShowUserEditModal(false);
      setEditingUser(undefined);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Błąd podczas zapisywania użytkownika');
    }
  };

  const handleEditMachine = (machine: VNCMachine) => {
    setEditingMachine(machine);
    setIsMachineModalOpen(true);
  };

  const handleDeleteMachine = async (machineId: number) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę maszynę?')) {
      try {
        await machinesAPI.delete(machineId);
        await loadData();
      } catch (error) {
        console.error('Error deleting machine:', error);
      }
    }
  };

  const handleSaveMachine = async (data: any) => {
    try {
      if (editingMachine) {
        await machinesAPI.update(editingMachine.id, data);
      } else {
        await machinesAPI.create({ ...data, is_shared: true });
      }
      await loadData();
      setIsMachineModalOpen(false);
      setEditingMachine(undefined);
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="loading">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div className="header-content">
          <h1>Panel Administratora</h1>
          <div className="header-actions">
            <button className="btn-back" onClick={() => navigate('/dashboard')}>
              ← Powrót do Dashboard
            </button>
            <button className="btn-logout" onClick={logout}>
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Użytkownicy ({users.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'machines' ? 'active' : ''}`}
            onClick={() => setActiveTab('machines')}
          >
            Maszyny współdzielone ({machines.length})
          </button>
        </div>

        {activeTab === 'users' ? (
          <div className="admin-section">
            <div className="section-header">
              <h2>Zarządzanie użytkownikami</h2>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nazwa użytkownika</th>
                    <th>Email</th>
                    <th>Pełne imię</th>
                    <th>Administrator</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.full_name || '-'}</td>
                      <td>{u.is_admin ? 'Tak' : 'Nie'}</td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => handleEditUser(u)}
                        >
                          Edytuj
                        </button>
                        {u.id !== user?.id && (
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            Usuń
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="admin-section">
            <div className="section-header">
              <h2>Zarządzanie maszynami współdzielonymi</h2>
              <button
                className="btn-add"
                onClick={() => setIsMachineModalOpen(true)}
              >
                + Dodaj maszynę
              </button>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nazwa</th>
                    <th>URL</th>
                    <th>Opis</th>
                    <th>Właściciel</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {machines.map((machine) => (
                    <tr key={machine.id}>
                      <td>{machine.id}</td>
                      <td>{machine.name}</td>
                      <td className="url-cell">{machine.url}</td>
                      <td>{machine.description || '-'}</td>
                      <td>{machine.owner_id}</td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => handleEditMachine(machine)}
                        >
                          Edytuj
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteMachine(machine.id)}
                        >
                          Usuń
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <MachineModal
        machine={editingMachine}
        isOpen={isMachineModalOpen}
        onClose={() => {
          setIsMachineModalOpen(false);
          setEditingMachine(undefined);
        }}
        onSave={handleSaveMachine}
        isAdmin={true}
      />

      {showUserEditModal && editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => {
            setShowUserEditModal(false);
            setEditingUser(undefined);
          }}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
};

interface UserEditModalProps {
  user: User;
  onClose: () => void;
  onSave: (data: any) => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, onClose, onSave }) => {
  const [email, setEmail] = useState(user.email);
  const [fullName, setFullName] = useState(user.full_name || '');
  const [isAdmin, setIsAdmin] = useState(user.is_admin);
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      email,
      full_name: fullName,
      is_admin: isAdmin,
    };
    if (password) {
      data.password = password;
    }
    onSave(data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edytuj użytkownika: {user.username}</h2>
          <button className="btn-close-modal" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Pełne imię</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Hasło (pozostaw puste, aby nie zmieniać)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
              <span>Administrator</span>
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className="btn-save">
              Zapisz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;

