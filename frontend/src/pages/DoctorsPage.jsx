import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import API from '../api';
import { Spinner, EmptyState, StatusBadge } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function DoctorsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [treatmentType, setTreatmentType] = useState(searchParams.get('treatment_type') || '');
  const [specialty, setSpecialty] = useState(searchParams.get('specialty') || '');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (treatmentType) params.treatment_type = treatmentType;
      if (specialty) params.specialty = specialty;
      const res = await API.get('/doctors', { params });
      setDoctors(res.data.data.doctors || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  const treatmentColors = { Allopathic: 'var(--primary)', Homeopathic: 'var(--success)', Herbal: 'var(--secondary)' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Navbar */}
      <nav style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container flex items-center justify-between" style={{ height: 64 }}>
          <Link to="/" className="flex items-center gap-12" style={{ color: 'inherit' }}>
            <span style={{ fontSize: 22 }}>🏥</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Doctor Hub</span>
          </Link>
          {user ? (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>Dashboard</button>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Login</Link>
          )}
        </div>
      </nav>

      <div className="container" style={{ padding: '32px 24px' }}>
        {/* Search Filters */}
        <div className="card mb-24">
          <form onSubmit={handleSearch}>
            <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
              <input className="form-input" placeholder="Search by disease, doctor name, specialty..."
                value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 2, minWidth: 200 }} />
              <select className="form-select" value={treatmentType} onChange={e => setTreatmentType(e.target.value)} style={{ minWidth: 160 }}>
                <option value="">All Treatment Types</option>
                <option>Allopathic</option>
                <option>Homeopathic</option>
                <option>Herbal</option>
              </select>
              <input className="form-input" placeholder="Specialty..."
                value={specialty} onChange={e => setSpecialty(e.target.value)} style={{ minWidth: 160 }} />
              <button type="submit" className="btn btn-primary">🔍 Search</button>
            </div>
          </form>

          {/* Quick filters */}
          <div className="flex gap-8 mt-16" style={{ flexWrap: 'wrap' }}>
            {['Heart Disease', 'Diabetes', 'Allergies', 'Joint Pain', 'Digestive Issues', 'Skin Diseases', 'Fever', 'Stress'].map(d => (
              <button key={d} className="btn btn-secondary btn-sm"
                onClick={() => { setSearch(d); }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-16">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>
            {loading ? 'Searching...' : `${doctors.length} Doctor${doctors.length !== 1 ? 's' : ''} Found`}
          </h2>
          <div className="flex gap-8">
            {['Allopathic', 'Homeopathic', 'Herbal'].map(t => (
              <button key={t} onClick={() => setTreatmentType(treatmentType === t ? '' : t)}
                className={`badge ${treatmentType === t ? 'badge-primary' : 'badge-muted'}`}
                style={{ cursor: 'pointer', fontSize: 13 }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Cards Grid */}
        {loading ? (
          <div className="text-center" style={{ padding: 60 }}><Spinner size="lg" /></div>
        ) : doctors.length === 0 ? (
          <EmptyState icon="🔍" title="No Doctors Found"
            description="Try different search terms or clear filters"
            action={<button className="btn btn-primary" onClick={() => { setSearch(''); setTreatmentType(''); setSpecialty(''); fetchDoctors(); }}>Clear Filters</button>}
          />
        ) : (
          <div className="grid-3" style={{ gap: 20 }}>
            {doctors.map(doc => (
              <DoctorCard key={doc.id} doctor={doc} onBook={() => navigate(user ? `/book/${doc.id}` : '/login')} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DoctorCard({ doctor, onBook }) {
  const color = { Allopathic: 'var(--primary)', Homeopathic: 'var(--success)', Herbal: 'var(--secondary)' }[doctor.treatment_type] || 'var(--primary)';
  const initials = doctor.users?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR';

  return (
    <div className="doctor-card">
      <div className="flex gap-16 items-center mb-16">
        <div className="doctor-avatar" style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}>{initials}</div>
        <div className="doctor-info">
          <div className="doctor-name">{doctor.users?.full_name || 'Dr. Unknown'}</div>
          <div className="doctor-specialty">{doctor.specialty}</div>
          <span className="badge" style={{ background: `${color}22`, color, marginTop: 4, fontSize: 11 }}>
            {doctor.treatment_type}
          </span>
        </div>
      </div>

      {doctor.clinics && (
        <div className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
          🏥 {doctor.clinics.name}, {doctor.clinics.city}
        </div>
      )}

      <div className="flex gap-12 mb-12" style={{ flexWrap: 'wrap' }}>
        <span className="text-sm">⭐ {doctor.experience_years} yrs exp</span>
        <span className="text-sm">💳 PKR {doctor.consultation_fee?.toLocaleString()}</span>
      </div>

      {doctor.diseases_treated?.length > 0 && (
        <div className="flex gap-4 mb-16" style={{ flexWrap: 'wrap' }}>
          {doctor.diseases_treated.slice(0, 3).map(d => (
            <span key={d} className="badge badge-muted" style={{ fontSize: 11 }}>{d}</span>
          ))}
          {doctor.diseases_treated.length > 3 && <span className="badge badge-muted" style={{ fontSize: 11 }}>+{doctor.diseases_treated.length - 3}</span>}
        </div>
      )}

      <div className="flex gap-8">
        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={onBook}>Book Appointment</button>
      </div>
    </div>
  );
}
