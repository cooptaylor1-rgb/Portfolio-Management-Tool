/**
 * Collaborate Page
 * 
 * Share portfolios and collaborate with team members
 */

import { useState } from 'react';
import { Users, Share2, Link2, UserPlus, MessageSquare, Clock, Check, X, Eye, Edit2, Shield } from 'lucide-react';
import './pages.css';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  avatar: string;
  status: 'online' | 'offline';
  lastActive?: string;
}

interface SharedPortfolio {
  id: string;
  name: string;
  owner: string;
  members: TeamMember[];
  lastModified: Date;
  permission: 'view' | 'edit';
}

interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: Date;
}

const TEAM_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Alex Chen', email: 'alex@company.com', role: 'owner', avatar: 'AC', status: 'online' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'editor', avatar: 'SJ', status: 'online' },
  { id: '3', name: 'Mike Williams', email: 'mike@company.com', role: 'viewer', avatar: 'MW', status: 'offline', lastActive: '2 hours ago' },
  { id: '4', name: 'Emily Brown', email: 'emily@company.com', role: 'viewer', avatar: 'EB', status: 'offline', lastActive: '1 day ago' },
];

const SHARED_PORTFOLIOS: SharedPortfolio[] = [
  {
    id: '1',
    name: 'Growth Portfolio',
    owner: 'Alex Chen',
    members: TEAM_MEMBERS.slice(0, 3),
    lastModified: new Date('2024-02-23'),
    permission: 'edit',
  },
  {
    id: '2',
    name: 'Income Strategy',
    owner: 'Sarah Johnson',
    members: TEAM_MEMBERS.slice(1, 4),
    lastModified: new Date('2024-02-22'),
    permission: 'view',
  },
];

const RECENT_ACTIVITY: Activity[] = [
  { id: '1', user: 'Sarah Johnson', action: 'added', target: 'NVDA to Growth Portfolio', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
  { id: '2', user: 'Alex Chen', action: 'updated', target: 'position size for AAPL', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  { id: '3', user: 'Mike Williams', action: 'commented on', target: 'MSFT analysis', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5) },
  { id: '4', user: 'Emily Brown', action: 'viewed', target: 'Income Strategy', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
];

export default function CollaboratePage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [shareLink, setShareLink] = useState('');

  const handleGenerateLink = () => {
    setShareLink(`https://portfolio.app/share/${Math.random().toString(36).slice(2, 10)}`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
  };

  const formatTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Collaboration</h1>
          <p className="page__subtitle">Share portfolios and work together with your team</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowInviteModal(true)}>
          <UserPlus size={16} />
          Invite Member
        </button>
      </div>

      <div className="collab-layout">
        {/* Team Members */}
        <section className="card">
          <div className="card__header">
            <h3 className="card__title">
              <Users size={18} />
              Team Members
            </h3>
          </div>
          <div className="card__body">
            <div className="team-list">
              {TEAM_MEMBERS.map(member => (
                <div key={member.id} className="team-member">
                  <div className="member-avatar">
                    <span className={`avatar ${member.status}`}>{member.avatar}</span>
                    <span className={`status-dot ${member.status}`} />
                  </div>
                  <div className="member-info">
                    <span className="member-name">{member.name}</span>
                    <span className="member-email">{member.email}</span>
                  </div>
                  <div className="member-role">
                    <span className={`role-badge role-${member.role}`}>
                      {member.role === 'owner' && <Shield size={12} />}
                      {member.role === 'editor' && <Edit2 size={12} />}
                      {member.role === 'viewer' && <Eye size={12} />}
                      {member.role}
                    </span>
                  </div>
                  {member.status === 'offline' && member.lastActive && (
                    <span className="last-active">{member.lastActive}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Shared Portfolios */}
        <section className="card">
          <div className="card__header">
            <h3 className="card__title">
              <Share2 size={18} />
              Shared Portfolios
            </h3>
          </div>
          <div className="card__body">
            <div className="shared-list">
              {SHARED_PORTFOLIOS.map(portfolio => (
                <div key={portfolio.id} className="shared-portfolio">
                  <div className="portfolio-info">
                    <h4>{portfolio.name}</h4>
                    <span className="portfolio-owner">by {portfolio.owner}</span>
                  </div>
                  <div className="portfolio-members">
                    {portfolio.members.slice(0, 3).map((m, i) => (
                      <span key={m.id} className="member-chip" style={{ zIndex: 3 - i }}>
                        {m.avatar}
                      </span>
                    ))}
                    {portfolio.members.length > 3 && (
                      <span className="member-chip more">+{portfolio.members.length - 3}</span>
                    )}
                  </div>
                  <div className="portfolio-permission">
                    <span className={`permission-badge ${portfolio.permission}`}>
                      {portfolio.permission === 'edit' ? <Edit2 size={12} /> : <Eye size={12} />}
                      {portfolio.permission}
                    </span>
                  </div>
                  <span className="portfolio-modified">
                    {portfolio.lastModified.toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="card">
          <div className="card__header">
            <h3 className="card__title">
              <Clock size={18} />
              Recent Activity
            </h3>
          </div>
          <div className="card__body">
            <div className="activity-list">
              {RECENT_ACTIVITY.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-content">
                    <strong>{activity.user}</strong> {activity.action} <span className="activity-target">{activity.target}</span>
                  </div>
                  <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Share Link Generator */}
        <section className="card">
          <div className="card__header">
            <h3 className="card__title">
              <Link2 size={18} />
              Share Link
            </h3>
          </div>
          <div className="card__body">
            <p className="share-description">Generate a shareable link to your portfolio</p>
            <div className="share-link-box">
              {shareLink ? (
                <>
                  <input type="text" value={shareLink} readOnly className="share-link-input" />
                  <button className="btn btn--secondary" onClick={handleCopyLink}>
                    Copy
                  </button>
                </>
              ) : (
                <button className="btn btn--primary" onClick={handleGenerateLink}>
                  Generate Link
                </button>
              )}
            </div>
            {shareLink && (
              <div className="link-options">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  Require sign-in to view
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Allow editing
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Expire after 7 days
                </label>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Invite Team Member</h3>
              <button className="btn btn--icon" onClick={() => setShowInviteModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as 'editor' | 'viewer')}>
                  <option value="viewer">Viewer - Can view portfolios</option>
                  <option value="editor">Editor - Can view and edit portfolios</option>
                </select>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setShowInviteModal(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={() => { setShowInviteModal(false); setInviteEmail(''); }}>
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
