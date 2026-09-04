import { useState } from 'react';
import axios from 'axios';
import MarkdownIt from 'markdown-it';
import PipelineViz from '../components/PipelineViz';
import TrustScore from '../components/TrustScore';
import './BriefGenerator.css'; // We will include inline styles or index.css handles it.

const mdParser = new MarkdownIt();

export default function BriefGenerator() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState(null);
  const [trace, setTrace] = useState([]);
  const [score, setScore] = useState(0);

  const handleGenerate = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setTrace([]);
    setBrief(null);
    
    try {
      const response = await axios.post('http://127.0.0.1:8001/api/agent/generate-brief', { query });
      
      const data = response.data;
      setBrief(data.brief);
      setTrace(data.pipeline_trace);
      setScore(data.trust_score);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate brief');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brief-generator animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <div className="input-section glass-panel" style={{ padding: '3rem', textAlign: 'center', background: 'rgba(25,25,35,0.4)', backgroundImage: 'linear-gradient(to bottom, rgba(99,102,241,0.05), transparent)' }}>
        <h1>Policy Brief Generator</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '2rem' }}>Define a policy query and let our agentic LangGraph workflow construct a comprehensive brief.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Provide a summary of the latest AI regulations and state bills related to content safety."
            rows="3"
            style={{ fontSize: '1.1rem', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid var(--accent-primary)' }}
          />
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary"
            style={{ padding: '1rem 3rem', fontSize: '1.1rem', width: '100%', maxWidth: '300px' }}
          >
            {loading ? 'Synthesizing...' : 'Generate Brief'}
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', margin: '3rem 0', color: 'var(--accent-primary)'}}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', fontWeight: 600 }}>Agents are thinking...</p>
        </div>
      )}

      {brief && (
        <div className="results-section" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
          <div className="brief-content glass-panel" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
              <h2 style={{ margin: 0 }}>Executive Policy Brief</h2>
              <TrustScore score={score} />
            </div>
            <div 
              className="markdown-body" 
              style={{ lineHeight: 1.8, color: 'var(--text-primary)' }}
              dangerouslySetInnerHTML={{ __html: mdParser.render(brief) }} 
            />
          </div>

          <div className="pipeline-section glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Agent Trace</h3>
            <PipelineViz trace={trace} />
          </div>
        </div>
      )}
    </div>
  );
}
