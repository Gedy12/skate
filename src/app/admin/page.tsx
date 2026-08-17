"use client";
import React, { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { secondaryAuth } from '@/lib/secondaryFirebase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    yesterdaysRevenue: 0,
    todaysRevenue: 0,
    totalSkates: 16,
    activeSkates: 0,
    availableSkates: 16,
  });

  const [weeklyData, setWeeklyData] = useState<{ day: string; value: number }[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);

  // Trainer creation state
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerPassword, setTrainerPassword] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [trainerConfirm, setTrainerConfirm] = useState('');
  const [createMsg, setCreateMsg] = useState('');

  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trainerPassword !== trainerConfirm) {
      setCreateMsg('Passwords do not match.');
      return;
    }
    setCreateMsg('Creating...');
    try {
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, trainerEmail, trainerPassword);
      const newUid = userCred.user.uid;
      
      await setDoc(doc(db, 'users', newUid), {
        email: trainerEmail,
        name: trainerName,
        role: 'trainer',
        createdAt: Date.now()
      });
      
      await signOut(secondaryAuth);
      
      setCreateMsg('Trainer account created successfully!');
      setTrainerEmail('');
      setTrainerName('');
      setTrainerPassword('');
      setTrainerConfirm('');
    } catch (err: any) {
      setCreateMsg('Error: ' + err.message);
    }
  };

  const handleDeleteTrainer = async (trainerId: string, trainerName: string) => {
    if (!confirm(`Are you sure you want to delete ${trainerName || 'this trainer'}? This will immediately revoke their access.`)) return;
    try {
      await deleteDoc(doc(db, 'users', trainerId));
    } catch (err: any) {
      alert('Failed to delete trainer: ' + err.message);
    }
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'trainers'>('dashboard');

  useEffect(() => {
    // Listen to skates
    const skatesUnsub = onSnapshot(collection(db, 'skates'), (snapshot) => {
      let active = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'active') {
          active++;
        }
      });
      
      // Total skates is fixed at 16. 
      // Skates that haven't been synced to Firebase yet are implicitly available.
      const total = 16;
      const available = total - active;
      
      setStats(prev => ({ ...prev, activeSkates: active, availableSkates: available, totalSkates: total }));
    });

    // Listen to sessions
    const sessionsUnsub = onSnapshot(collection(db, 'sessions'), (snapshot) => {
      let totalRev = 0;
      let todayRev = 0;
      let yesterdayRev = 0;
      
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfYesterday = startOfDay - 24 * 60 * 60 * 1000;

      // Prepare weekly data buckets
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const last7Days: { day: string; value: number; timestamp: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        last7Days.push({ day: weekDays[d.getDay()], value: 0, timestamp: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() });
      }

      const sessionsList: any[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        sessionsList.push(data);
        
        if (data.status === 'completed') {
          totalRev += data.price || 0;
          
          if (data.completedAt >= startOfDay) {
            todayRev += data.price || 0;
          } else if (data.completedAt >= startOfYesterday && data.completedAt < startOfDay) {
            yesterdayRev += data.price || 0;
          }
          
          // Add to weekly chart data
          const completedDate = new Date(data.completedAt);
          const completedStartOfDay = new Date(completedDate.getFullYear(), completedDate.getMonth(), completedDate.getDate()).getTime();
          const dayBucket = last7Days.find(d => d.timestamp === completedStartOfDay);
          if (dayBucket) {
            dayBucket.value += data.price || 0;
          }
        }
      });
      
      sessionsList.sort((a, b) => b.createdAt - a.createdAt);
      setRecentSessions(sessionsList.slice(0, 5));
      setWeeklyData(last7Days.map(d => ({ day: d.day, value: d.value })));

      setStats(prev => ({
        ...prev,
        totalRevenue: totalRev,
        todaysRevenue: todayRev,
        yesterdaysRevenue: yesterdayRev
      }));
    });

    // Listen to trainers
    const q = query(collection(db, 'users'), where('role', '==', 'trainer'));
    const trainersUnsub = onSnapshot(q, (snapshot) => {
      const trainersList: any[] = [];
      snapshot.forEach(doc => {
        trainersList.push({ id: doc.id, ...doc.data() });
      });
      setTrainers(trainersList);
    });

    return () => {
      skatesUnsub();
      sessionsUnsub();
      trainersUnsub();
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic chart rendering
  const renderChart = () => {
    // Find max value for the Y-axis scale, default to 1000 if empty or all 0
    let maxVal = Math.max(...weeklyData.map(d => d.value), 0);
    if (maxVal === 0) maxVal = 1000;
    
    // Round max to nearest 100 for nice scale
    const scaleMax = Math.ceil(maxVal / 100) * 100;
    
    return (
      <div className="mt-4 pt-3 border-top position-relative" style={{ height: '200px' }}>
        <div className="d-flex flex-column justify-content-between h-100 text-muted small" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px' }}>
          <span>{scaleMax.toLocaleString()} ETB</span>
          <span>{Math.round(scaleMax * 0.75).toLocaleString()} ETB</span>
          <span>{Math.round(scaleMax * 0.5).toLocaleString()} ETB</span>
          <span>{Math.round(scaleMax * 0.25).toLocaleString()} ETB</span>
          <span>0 ETB</span>
        </div>
        <div className="h-100" style={{ marginLeft: '70px', position: 'relative' }}>
          {/* Horizontal grid lines */}
          {[0, 25, 50, 75, 100].map(pct => (
            <div key={pct} style={{ position: 'absolute', top: `${pct}%`, left: 0, right: 0, borderTop: '1px dashed #e2e8f0' }}></div>
          ))}
          {/* Fake chart line */}
          <div style={{ position: 'absolute', bottom: '0', left: 0, right: 0, height: '2px', backgroundColor: '#3b82f6', top: '100%' }}></div>
          
          {/* Points */}
          {weeklyData.map((d, i) => {
            const pctHeight = (d.value / scaleMax) * 100;
            return (
              <div key={d.day + i} style={{ position: 'absolute', bottom: '-25px', left: `${(i / 6) * 100}%`, transform: 'translateX(-50%)', textAlign: 'center' }}>
                <div 
                  style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: d.value > 0 ? '#3b82f6' : 'white', 
                    border: '2px solid #3b82f6', 
                    margin: '0 auto', 
                    position: 'absolute', 
                    bottom: `calc(${pctHeight}% + 25px)`, // Positioning point based on value
                    left: '50%', 
                    transform: 'translate(-50%, 50%)',
                    zIndex: 2
                  }}
                  title={`${d.value} ETB`}
                ></div>
                <span className="text-muted small">{d.day}</span>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-4 pt-3">
          <span className="badge bg-light text-primary border border-primary"><i className="bi bi-dash fw-bold"></i> Revenue (ETB)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="d-flex min-vh-100 position-relative" style={{ backgroundColor: 'var(--background)' }}>
      {/* Mobile Header (Hamburger) */}
      <div className="d-md-none position-fixed top-0 start-0 end-0 bg-white shadow-sm p-3 d-flex justify-content-between align-items-center" style={{ zIndex: 1040 }}>
        <div className="d-flex align-items-center gap-2">
          <div className="bg-dark rounded overflow-hidden d-flex justify-content-center align-items-center" style={{ width: '28px', height: '28px' }}>
            <img src="/icon.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h5 className="fw-bold m-0 text-dark" style={{ letterSpacing: '0.5px' }}>LEEQAA SKATE HOUSE</h5>
        </div>
        <button className="btn btn-light border-0" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <i className="bi bi-list fs-2"></i>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`flex-column text-white position-fixed top-0 bottom-0 left-0 transition-transform ${isMobileMenuOpen ? 'd-flex' : 'd-none d-md-flex'}`} style={{ width: '260px', backgroundColor: 'var(--admin-sidebar)', zIndex: 1050 }}>
        <div className="p-4 d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-white rounded overflow-hidden d-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px' }}>
              <img src="/icon.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h5 className="fw-bold m-0" style={{ letterSpacing: '0.5px' }}>LEEQAA SKATE HOUSE</h5>
          </div>
          <button className="btn btn-link text-white d-md-none p-0" onClick={() => setIsMobileMenuOpen(false)}>
            <i className="bi bi-x-lg fs-4"></i>
          </button>
        </div>
        
        <div className="px-3 flex-grow-1">
          <div className={`admin-sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}>
            <i className="bi bi-house-door-fill"></i>
            <span className="fw-bold">Dashboard</span>
          </div>
          <div className={`admin-sidebar-item ${activeTab === 'trainers' ? 'active' : ''}`} onClick={() => { setActiveTab('trainers'); setIsMobileMenuOpen(false); }}>
            <i className="bi bi-people-fill"></i>
            <span className="fw-bold">Trainers</span>
          </div>
        </div>
        
        <div className="p-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="d-flex align-items-center gap-3 mb-3 p-2 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: '36px', height: '36px' }}>SA</div>
            <div>
              <div className="fw-bold fs-6 lh-1 mb-1">Super Admin</div>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>superadmin@skate.com</div>
              <div className="d-flex align-items-center gap-1 mt-1">
                <div className="bg-success rounded-circle" style={{ width: '6px', height: '6px' }}></div>
                <span className="text-muted" style={{ fontSize: '0.65rem' }}>Online</span>
              </div>
            </div>
          </div>
          <div className="admin-sidebar-item" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            <span className="fw-bold">Logout</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow-1 pt-5 pt-md-0 admin-main-content">
        <div className="p-4 p-md-5 w-100" style={{ maxWidth: '1600px' }}>
          {activeTab === 'dashboard' && (
            <>
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4 pb-2">
                <div>
                  <h2 className="fw-bold mb-1" style={{ color: 'var(--text-main)' }}>Welcome back, Super Admin! 👋</h2>
                  <p className="text-muted m-0">Here's what's happening with your skate house today.</p>
                </div>
                <div className="d-none d-sm-block">
                  <button className="btn btn-white border shadow-sm rounded bg-white text-muted d-flex align-items-center gap-2 px-3 py-2">
                    <i className="bi bi-calendar3"></i>
                    <span className="fw-bold small">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <i className="bi bi-chevron-down ms-2" style={{ fontSize: '0.7rem' }}></i>
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-5 g-3 mb-4">
                <div className="col">
                  <div className="modern-card p-3 h-100 d-flex flex-column justify-content-center">
                    <div className="d-flex gap-3 align-items-center">
                      <div className="admin-icon-box admin-bg-blue"><i className="bi bi-wallet-fill fs-2"></i></div>
                      <div>
                        <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.5px' }}>TOTAL REVENUE</h6>
                        <h3 className="fw-bold m-0 lh-1 text-primary">{stats.totalRevenue.toLocaleString()} <span className="fs-6 text-muted">ETB</span></h3>
                      </div>
                    </div>
                    <div className="mt-3 text-start">
                      <span className="text-primary fw-bold" style={{ fontSize: '0.75rem' }}>All time</span>
                    </div>
                  </div>
                </div>
                
                <div className="col">
                  <div className="modern-card p-3 h-100 d-flex flex-column justify-content-center">
                    <div className="d-flex gap-3 align-items-center">
                      <div className="admin-icon-box" style={{ backgroundColor: 'rgba(108, 117, 125, 0.1)', color: '#6c757d' }}><i className="bi bi-calendar2-x-fill fs-2"></i></div>
                      <div>
                        <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.5px' }}>YESTERDAY</h6>
                        <h3 className="fw-bold m-0 lh-1 text-secondary">{stats.yesterdaysRevenue.toLocaleString()} <span className="fs-6 text-muted">ETB</span></h3>
                      </div>
                    </div>
                    <div className="mt-3 text-start">
                      <span className="text-muted fw-bold" style={{ fontSize: '0.75rem' }}>Previous day total</span>
                    </div>
                  </div>
                </div>
                
                <div className="col">
                  <div className="modern-card p-3 h-100 d-flex flex-column justify-content-center">
                    <div className="d-flex gap-3 align-items-center">
                      <div className="admin-icon-box admin-bg-green"><i className="bi bi-calendar2-check-fill fs-2"></i></div>
                      <div>
                        <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.5px' }}>TODAY'S REVENUE</h6>
                        <h3 className="fw-bold m-0 lh-1 text-success">{stats.todaysRevenue.toLocaleString()} <span className="fs-6 text-muted">ETB</span></h3>
                      </div>
                    </div>
                    <div className="mt-3 text-start">
                      <span className={`fw-bold ${stats.todaysRevenue >= stats.yesterdaysRevenue ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.75rem' }}>
                        {stats.yesterdaysRevenue > 0 ? (
                          stats.todaysRevenue >= stats.yesterdaysRevenue 
                            ? `↑ +${Math.round(((stats.todaysRevenue - stats.yesterdaysRevenue) / stats.yesterdaysRevenue) * 100)}% from yesterday`
                            : `↓ ${Math.round(((stats.todaysRevenue - stats.yesterdaysRevenue) / stats.yesterdaysRevenue) * 100)}% from yesterday`
                        ) : 'No data yesterday'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="col">
                  <div className="modern-card p-3 h-100 d-flex flex-column justify-content-center">
                    <div className="d-flex gap-3 align-items-center">
                      <div className="admin-icon-box admin-bg-orange"><i className="bi bi-play-fill fs-1"></i></div>
                      <div>
                        <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.5px' }}>ACTIVE SKATES</h6>
                        <h3 className="fw-bold m-0 lh-1">{stats.activeSkates}</h3>
                      </div>
                    </div>
                    <div className="mt-3 text-start">
                      <span className="text-warning fw-bold" style={{ fontSize: '0.75rem' }}>Currently in use</span>
                    </div>
                  </div>
                </div>
                
                <div className="col">
                  <div className="modern-card p-3 h-100 d-flex flex-column justify-content-center">
                    <div className="d-flex gap-3 align-items-center">
                      <div className="admin-icon-box admin-bg-green"><i className="bi bi-check-circle-fill fs-2"></i></div>
                      <div>
                        <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.5px' }}>AVAILABLE</h6>
                        <h3 className="fw-bold m-0 lh-1">{stats.availableSkates}</h3>
                      </div>
                    </div>
                    <div className="mt-3 text-start">
                      <span className="text-success fw-bold" style={{ fontSize: '0.75rem' }}>Ready to use</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-4">
                <div className="col-12 col-xl-6">
                  {/* Recent Sessions */}
                  <div className="modern-card mb-4 h-100">
                    <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-clock-history text-primary fs-5"></i>
                        <h6 className="fw-bold m-0">Recent Sessions</h6>
                      </div>
                      <button className="btn btn-sm btn-light border text-primary fw-bold bg-white">View all</button>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-borderless m-0 align-middle">
                        <thead className="border-bottom text-muted small">
                          <tr>
                            <th className="ps-4 fw-bold py-3">Skate</th>
                            <th className="fw-bold py-3">Start Time</th>
                            <th className="fw-bold py-3">Duration</th>
                            <th className="fw-bold py-3">Price</th>
                            <th className="fw-bold py-3 pe-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentSessions.map((session, idx) => (
                            <tr key={session.id} className={idx !== recentSessions.length - 1 ? 'border-bottom' : ''}>
                              <td className="ps-4 fw-bold text-dark py-3">#{session.skateNumber}</td>
                              <td className="text-muted py-3">{new Date(session.startTime).toLocaleTimeString()}</td>
                              <td className="text-muted py-3">{session.durationMinutes} min</td>
                              <td className="text-muted py-3">{session.price} ETB</td>
                              <td className="pe-4 py-3">
                                <span className={`badge rounded-pill px-3 py-2 fw-bold ${
                                  session.status === 'completed' ? 'bg-success' : 
                                  session.status === 'active' ? 'bg-primary' : 
                                  session.status === 'paused' ? 'bg-warning text-dark' : 'bg-danger'
                                }`}>
                                  {session.status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {recentSessions.length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center py-5 text-muted">No sessions found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-xl-6">
                  {/* Revenue Chart */}
                  <div className="modern-card p-4 h-100">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-graph-up text-primary fs-5"></i>
                        <h6 className="fw-bold m-0">Revenue Overview</h6>
                      </div>
                      <select className="form-select form-select-sm w-auto bg-light border-0 shadow-sm fw-bold text-muted">
                        <option>This Week</option>
                      </select>
                    </div>
                    {renderChart()}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'trainers' && (
            <div className="row g-4 justify-content-center">
              <div className="col-12 col-xl-5">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-2">
                  <div>
                    <h2 className="fw-bold mb-1" style={{ color: 'var(--text-main)' }}>Trainers</h2>
                    <p className="text-muted m-0">Manage trainer accounts.</p>
                  </div>
                </div>
                {/* Create Trainer Form */}
                <div className="modern-card p-4 h-100">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', boxShadow: '0 4px 10px rgba(13,110,253,0.3)' }}>
                      <i className="bi bi-person-plus-fill fs-5"></i>
                    </div>
                    <h5 className="fw-bold m-0">Create Trainer Account</h5>
                  </div>
                  
                  {createMsg && (
                    <div className={`alert py-2 px-3 small fw-bold ${createMsg.includes('success') ? 'alert-success' : 'alert-danger'}`}>
                      {createMsg}
                    </div>
                  )}
                  
                  <form onSubmit={handleCreateTrainer}>
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-dark">Trainer Name (Optional)</label>
                      <input 
                        type="text" 
                        className="form-control form-control-lg bg-light border-0" 
                        placeholder="e.g. Alex Trainer"
                        value={trainerName}
                        onChange={e => setTrainerName(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-dark">Trainer Email</label>
                      <input 
                        type="email" 
                        className="form-control form-control-lg border-0" 
                        style={{ backgroundColor: 'var(--active-blue-light)' }}
                        placeholder="bini@gmail.com"
                        value={trainerEmail}
                        onChange={e => setTrainerEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-dark">Password</label>
                      <input 
                        type="password" 
                        className="form-control form-control-lg bg-light border-0" 
                        placeholder="••••••••"
                        value={trainerPassword}
                        onChange={e => setTrainerPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-bold small text-dark">Confirm Password</label>
                      <input 
                        type="password" 
                        className="form-control form-control-lg bg-light border-0" 
                        placeholder="••••••••"
                        value={trainerConfirm}
                        onChange={e => setTrainerConfirm(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold d-flex align-items-center justify-content-center gap-2 py-3" style={{ backgroundColor: 'var(--admin-accent-blue)', border: 'none', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>
                      <i className="bi bi-person-plus-fill"></i> Create Account
                    </button>
                  </form>
                </div>
              </div>

              <div className="col-12 col-xl-7 pt-xl-5 mt-xl-4">
                {/* Active Trainers List */}
                <div className="modern-card mt-xl-2">
                  <div className="p-4 border-bottom d-flex align-items-center gap-2">
                    <i className="bi bi-people-fill text-primary fs-5"></i>
                    <h6 className="fw-bold m-0">Active Trainers</h6>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-borderless m-0 align-middle">
                      <thead className="border-bottom text-muted small">
                        <tr>
                          <th className="ps-4 fw-bold py-3">Name</th>
                          <th className="fw-bold py-3">Email</th>
                          <th className="fw-bold py-3 pe-4 text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trainers.map((trainer, idx) => (
                          <tr key={trainer.id} className={idx !== trainers.length - 1 ? 'border-bottom' : ''}>
                            <td className="ps-4 py-3">
                              <div className="fw-bold text-dark">{trainer.name || 'Unnamed Trainer'}</div>
                            </td>
                            <td className="text-muted py-3">{trainer.email}</td>
                            <td className="pe-4 py-3 text-end">
                              <button 
                                className="btn btn-sm btn-outline-danger rounded-pill fw-bold"
                                onClick={() => handleDeleteTrainer(trainer.id, trainer.name || trainer.email)}
                              >
                                <i className="bi bi-trash3-fill"></i> Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                        {trainers.length === 0 && (
                          <tr>
                            <td colSpan={3} className="text-center py-5 text-muted">No trainers found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-5 pt-3 border-top text-muted small gap-2">
            <div>© {new Date().getFullYear()} Skate House. All rights reserved.</div>
            <div className="d-flex align-items-center gap-2">
              System Status: <span className="text-success d-flex align-items-center gap-1"><i className="bi bi-circle-fill" style={{ fontSize: '0.4rem' }}></i> All Systems Operational</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
