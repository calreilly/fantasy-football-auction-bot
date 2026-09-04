import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8001/api/bills/today');
        setBills(response.data.bills || []);
      } catch (err) {
        console.error("Dashboard err", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  return (
    <div className="dashboard animate-fade-in">
      <h1>Legislative Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Welcome back to PolicyWatch. Here are the recently introduced bills.</p>
      
      {loading ? (
        <div style={{ marginTop: '2rem' }}>Loading bills...</div>
      ) : (
        <div className="dashboard-grid">
          {bills.map(bill => (
            <div key={bill.id} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem'}}>{bill.id}</div>
              <h3>{bill.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1rem' }}>Introduced: {bill.introduced_date}</p>
              <div style={{ marginTop: '1rem', display: 'inline-block', padding: '0.3rem 0.8rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600}}>
                {bill.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
