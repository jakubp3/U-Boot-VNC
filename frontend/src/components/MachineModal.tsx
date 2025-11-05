import React, { useState, useEffect } from 'react';
import { VNCMachineCreate, VNCMachineUpdate, VNCMachine } from '../api/machines';
import './MachineModal.css';

interface MachineModalProps {
  machine?: VNCMachine;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VNCMachineCreate | VNCMachineUpdate) => Promise<void>;
  isAdmin?: boolean;
}

const MachineModal: React.FC<MachineModalProps> = ({
  machine,
  isOpen,
  onClose,
  onSave,
  isAdmin = false,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (machine) {
      setName(machine.name);
      setUrl(machine.url);
      setDescription(machine.description || '');
      setIsShared(machine.is_shared);
    } else {
      setName('');
      setUrl('');
      setDescription('');
      setIsShared(false);
    }
    setError('');
  }, [machine, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !url.trim()) {
      setError('Nazwa i URL są wymagane');
      return;
    }

    try {
      if (machine) {
        await onSave({ name, url, description: description || undefined });
      } else {
        await onSave({
          name,
          url,
          description: description || undefined,
          is_shared: isAdmin ? isShared : false,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Błąd zapisu');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{machine ? 'Edytuj maszynę' : 'Dodaj maszynę'}</h2>
          <button className="btn-close-modal" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nazwa *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="np. Serwer produkcyjny"
            />
          </div>
          <div className="form-group">
            <label>URL/IP *</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="ws://192.168.1.100:6080 lub http://example.com/noVNC"
            />
          </div>
          <div className="form-group">
            <label>Opis</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Opcjonalny opis maszyny"
            />
          </div>
          {isAdmin && !machine && (
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                />
                <span>Współdzielona (widoczna dla wszystkich użytkowników)</span>
              </label>
            </div>
          )}
          {error && <div className="error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className="btn-save">
              {machine ? 'Zapisz' : 'Dodaj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MachineModal;

