import { useState, useEffect } from 'react';
import { Users, Share2, Plus, X, Trash2, Globe, Lock } from 'lucide-react';
import { Portfolio, SharedUser, PortfolioActivity } from '../types';
import { collaborationService } from '../services/collaboration';
import { authService } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

export function CollaborationPanel() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activities, setActivities] = useState<PortfolioActivity[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [userPortfolios, userActivities] = await Promise.all([
        collaborationService.getUserPortfolios(),
        collaborationService.getUserActivities(20)
      ]);
      setPortfolios(userPortfolios);
      setActivities(userActivities);
    } catch (error) {
      console.error('Failed to load collaboration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async (name: string, description: string) => {
    if (!user) return;

    try {
      await collaborationService.createPortfolio(name, description, user.id);
      await loadData();
      setShowCreateModal(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this portfolio?')) return;

    try {
      await collaborationService.deletePortfolio(portfolioId);
      await loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleTogglePublic = async (portfolio: Portfolio) => {
    if (!user) return;

    try {
      await collaborationService.updatePortfolio(
        portfolio.id,
        user.id,
        { isPublic: !portfolio.isPublic }
      );
      await loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="collaboration-panel" style={{ padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Collaboration
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage and share portfolios with other users
          </p>
        </div>

        {/* Action Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} />
            Create Portfolio
          </button>
        </div>

        {/* Portfolios Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {portfolios.map(portfolio => (
            <div
              key={portfolio.id}
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1.5rem',
                position: 'relative'
              }}
            >
              {/* Portfolio Header */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {portfolio.name}
                  </h3>
                  <div title={portfolio.isPublic ? 'Public' : 'Private'}>
                    {portfolio.isPublic ? (
                      <Globe size={18} style={{ color: '#00ff88' }} />
                    ) : (
                      <Lock size={18} style={{ color: 'var(--text-secondary)' }} />
                    )}
                  </div>
                </div>
                {portfolio.description && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {portfolio.description}
                  </p>
                )}
              </div>

              {/* Portfolio Stats */}
              <div style={{ marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Investments:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {portfolio.investmentCount ?? portfolio.investments.length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Shared with:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {portfolio.sharedWith.length} {portfolio.sharedWith.length === 1 ? 'user' : 'users'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Owner:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {portfolio.ownerId === user?.id ? 'You' : 'Shared'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                {portfolio.ownerId === user?.id && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedPortfolio(portfolio);
                        setShowShareModal(true);
                      }}
                      className="btn-small"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <Share2 size={14} />
                      Share
                    </button>
                    <button
                      onClick={() => handleTogglePublic(portfolio)}
                      className="btn-small"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      {portfolio.isPublic ? <Lock size={14} /> : <Globe size={14} />}
                      {portfolio.isPublic ? 'Make Private' : 'Make Public'}
                    </button>
                    <button
                      onClick={() => handleDeletePortfolio(portfolio.id)}
                      className="btn-small"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#ff3366',
                        border: '1px solid #ff3366'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {portfolios.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
              <Users size={48} style={{ color: 'var(--text-secondary)', margin: '0 auto 1rem' }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Portfolios Yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Create your first portfolio to start collaborating
              </p>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Recent Activity
          </h3>
          <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            {activities.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No activity yet
              </div>
            ) : (
              activities.map(activity => (
                <div
                  key={activity.id}
                  style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: '0.25rem' }}>
                      {activity.description}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      by {activity.userName}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Portfolio Modal */}
      {showCreateModal && (
        <CreatePortfolioModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreatePortfolio}
        />
      )}

      {/* Share Portfolio Modal */}
      {showShareModal && selectedPortfolio && user && (
        <SharePortfolioModal
          portfolio={selectedPortfolio}
          currentUserId={user.id}
          onClose={() => {
            setShowShareModal(false);
            setSelectedPortfolio(null);
          }}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}

// Create Portfolio Modal Component
function CreatePortfolioModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), description.trim());
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--card-bg)',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          Create New Portfolio
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
              Portfolio Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Investment Portfolio"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)',
                resize: 'vertical'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Portfolio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Share Portfolio Modal Component
function SharePortfolioModal({ portfolio, currentUserId, onClose, onUpdate }: {
  portfolio: Portfolio;
  currentUserId: string;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPermission, setSelectedPermission] = useState<'view' | 'edit' | 'admin'>('view');
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;

    try {
      setSearching(true);
      const results = await authService.searchUsers(searchQuery);
      setSearchResults(results.filter(u => u.id !== currentUserId));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleShare = async (userId: string, userName: string, email: string) => {
    try {
      const sharedUser: SharedUser = {
        userId,
        email,
        name: userName,
        permission: selectedPermission,
        addedAt: new Date().toISOString()
      };
      await collaborationService.sharePortfolio(portfolio.id, sharedUser);
      onUpdate();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!window.confirm('Remove this user\'s access?')) return;

    try {
      await collaborationService.removeSharedUser(portfolio.id, userId);
      onUpdate();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--card-bg)',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          Share "{portfolio.name}"
        </h3>

        {/* Search Users */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search users by email or name..."
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
            />
            <button onClick={handleSearch} className="btn btn-primary" disabled={searching}>
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Permission Selector */}
          <select
            value={selectedPermission}
            onChange={(e) => setSelectedPermission(e.target.value as any)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="view">View Only</option>
            <option value="edit">Can Edit</option>
            <option value="admin">Admin</option>
          </select>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div style={{ marginTop: '1rem', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              {searchResults.map(user => (
                <div
                  key={user.id}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                  </div>
                  <button
                    onClick={() => handleShare(user.id, user.name, user.email)}
                    className="btn-small btn-primary"
                    disabled={portfolio.sharedWith.some(u => u.userId === user.id)}
                  >
                    {portfolio.sharedWith.some(u => u.userId === user.id) ? 'Already Shared' : 'Share'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Shared Users */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Shared With</h4>
          {portfolio.sharedWith.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
              Not shared with anyone yet
            </p>
          ) : (
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              {portfolio.sharedWith.map(sharedUser => (
                <div
                  key={sharedUser.userId}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{sharedUser.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {sharedUser.email} • {sharedUser.permission}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveUser(sharedUser.userId)}
                    style={{
                      padding: '0.5rem',
                      border: 'none',
                      background: 'none',
                      color: '#ff3366',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
