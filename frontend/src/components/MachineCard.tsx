import React, { useState } from 'react';
import { VNCMachine } from '../api/machines';
import './MachineCard.css';

interface MachineCardProps {
  machine: VNCMachine;
  onOpen: (machine: VNCMachine) => void;
  onEdit: (machine: VNCMachine) => void;
  onDelete: (machine: VNCMachine) => void;
  canEdit: boolean;
}

const MachineCard: React.FC<MachineCardProps> = ({
  machine,
  onOpen,
  onEdit,
  onDelete,
  canEdit,
}) => {
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // Try to create a preview URL - this is a simplified approach
  // In production, you might need a backend service to generate thumbnails
  const previewUrl = machine.url.includes('noVNC') 
    ? `${machine.url}?view_only=true&scale=0.1`
    : null;

  return (
    <div className="machine-card">
      <div className="machine-preview" onClick={() => onOpen(machine)}>
        {previewUrl && !previewError ? (
          <iframe
            src={previewUrl}
            onLoad={() => setPreviewLoaded(true)}
            onError={() => setPreviewError(true)}
            style={{ display: previewLoaded ? 'block' : 'none' }}
            className="preview-frame"
            title={`Preview ${machine.name}`}
          />
        ) : (
          <div className="preview-placeholder">
            <div className="preview-icon">🖥️</div>
            <span>VNC</span>
          </div>
        )}
      </div>
      <div className="machine-info">
        <h3>{machine.name}</h3>
        {machine.description && <p className="machine-description">{machine.description}</p>}
        <div className="machine-meta">
          {machine.is_shared && (
            <span className="badge badge-shared">Współdzielone</span>
          )}
        </div>
      </div>
      <div className="machine-actions">
        <button className="btn-action btn-open" onClick={() => onOpen(machine)}>
          Otwórz
        </button>
        {canEdit && (
          <>
            <button className="btn-action btn-edit" onClick={() => onEdit(machine)}>
              Edytuj
            </button>
            <button className="btn-action btn-delete" onClick={() => onDelete(machine)}>
              Usuń
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MachineCard;

