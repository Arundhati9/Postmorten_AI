import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [url, setUrl] = useState('');
  const [report, setReport] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/analyze', { url });
      setReport(response.data.report);
    } catch (error) {
      setReport('Error: ' + error.message);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">PostMortem AI</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="form-control mb-3"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube URL"
          required
        />
        <button type="submit" className="btn btn-primary">Analyze</button>
      </form>
      {report && (
        <div className="bg-light p-4 mt-4 rounded">
          <h4>AI Report:</h4>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{report}</pre>
        </div>
      )}
    </div>
  );
}

export default App;