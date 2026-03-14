import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Diagram from './neurallm_issue49';
import NeuralLamArchitecture from './neural_lam_architecture';

// A simple home page to list all your diagrams
function Home() {
  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>My Diagrams Project</h1>
      <p>Welcome! Here are the different sites/diagrams hosted in this repository:</p>

      <ul style={{ fontSize: '18px', lineHeight: '1.6' }}>
        <li>
          <Link to="/neurallm" style={{ color: '#0366d6', textDecoration: 'none', fontWeight: 'bold' }}>
            NeuralLM Architecture Redesign
          </Link>
        </li>
        <li>
          <Link to="/neural-lam-architecture" style={{ color: '#0366d6', textDecoration: 'none', fontWeight: 'bold' }}>
            Neural-LAM Architecture Refactor (Before/After)
          </Link>
        </li>
        {/* Add more links here later! */}
      </ul>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        {/* Optional: Add a global navigation bar here if you want it on every page */}

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/neurallm" element={<Diagram />} />
          <Route path="/neural-lam-architecture" element={<NeuralLamArchitecture />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
