import { useState } from 'react';

export default function SplitStemTestPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const uploadAndSplit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const res = await fetch('/api/split-stem', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) setResult(data);
      else setError(data.error || 'Error');
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Test Audio Stem Split (Splitter.ai)</h2>
      <form onSubmit={uploadAndSplit}>
        <input
          type="file"
          accept="audio/*"
          onChange={e => setFile(e.target.files[0])}
          required
        />
        <button type="submit" disabled={!file || loading} style={{ marginLeft: 8 }}>
          {loading ? 'Processing...' : 'Split Stems'}
        </button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 20 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 20 }}>
          <h4>Result:</h4>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre>
          {result.files && Object.entries(result.files).map(([stem, url]) => (
            <div key={stem}>
              <a href={url} target="_blank" rel="noopener noreferrer">Download {stem}</a>
            </div>
          ))}
        </div>
      )}
      <p style={{ marginTop: 50, color: '#888', fontSize: 14 }}>
        Powered by <a href="https://splitter.ai" target="_blank">Splitter.ai</a> (free tier, for testing only)
      </p>
    </div>
  );
}