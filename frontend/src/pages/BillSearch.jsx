import { useState } from 'react';
import axios from 'axios';

export default function BillSearch() {
  const [query, setQuery] = useState('');
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8001/api/bills/search?q=${encodeURIComponent(query)}`);
      setBills(response.data.bills || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bill-search animate-fade-in">
      <h1>Search Bills</h1>
      
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginTop: '2rem', maxWidth: '600px' }}>
        <input 
          type="text" 
          placeholder="e.g. AI Regulation, TikTok, Budget..." 
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="dashboard-grid" style={{ marginTop: '3rem' }}>
        {searched && !loading && bills.length === 0 && (
          <p style={{ color: 'var(--text-secondary)' }}>No bills found for your search.</p>
        )}
        {bills.map(bill => (
          <div key={bill.id} className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem'}}>{bill.id}</div>
            <h3>{bill.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1rem' }}>Introduced: {bill.introduced_date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
