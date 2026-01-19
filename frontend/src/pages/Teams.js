import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Building2 } from 'lucide-react';
import { teamsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { usersAPI } from '../services/api';

const Teams = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [teams, setTeams] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager_id: '',
  });

  useEffect(() => {
    loadTeams();
    loadManagers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await teamsAPI.getTeams();
      setTeams(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      addToast('Failed to load teams', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadManagers = async () => {
    try {
      const data = await usersAPI.getUsers();
      const managerUsers = Array.isArray(data) ? data : data.results || [];
      setManagers(managerUsers.filter(u => u.role === 'manager'));
    } catch (error) {
      console.error('Failed to load managers:', error);
    }
  };

  const handleCreate = () => {
    setEditingTeam(null);
    setFormData({ name: '', description: '', manager_id: '' });
    setShowModal(true);
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || '',
      manager_id: team.manager?.id || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      await teamsAPI.deleteTeam(id);
      addToast('Team deleted successfully', 'success');
      loadTeams();
    } catch (error) {
      addToast('Failed to delete team', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        await teamsAPI.updateTeam(editingTeam.id, formData);
        addToast('Team updated successfully', 'success');
      } else {
        await teamsAPI.createTeam(formData);
        addToast('Team created successfully', 'success');
      }
      setShowModal(false);
      loadTeams();
    } catch (error) {
      addToast(error.response?.data?.detail || 'Operation failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Teams</h1>
          <p className="text-slate-600 mt-1">Manage departments and teams</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <Button onClick={handleCreate} variant="primary">
            <Plus className="mr-2 h-4 w-4" />
            Add Team
          </Button>
        )}
      </div>

      {teams.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No teams found"
          description="Create your first team to get started"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} hover>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary-100 rounded-lg">
                      <Building2 className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{team.name}</h3>
                      {team.manager && (
                        <p className="text-sm text-slate-500">
                          {team.manager.first_name} {team.manager.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {team.description && (
                  <p className="text-sm text-slate-600 mb-4">{team.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                  <Users className="h-4 w-4" />
                  <span>{team.member_count || 0} members</span>
                </div>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <div className="flex gap-2 pt-4 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(team)}
                      className="flex-1"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(team.id)}
                      className="flex-1"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTeam ? 'Edit Team' : 'Add Team'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Team Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
          />
          <Select
            label="Manager"
            value={formData.manager_id}
            onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
          >
            <option value="">No Manager</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.first_name} {manager.last_name} ({manager.email})
              </option>
            ))}
          </Select>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {editingTeam ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Teams;

