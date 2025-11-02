import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import EvacuationPage from './pages/EvacuationPage';
import './App.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/evacuation" element={<EvacuationPage />} />
      </Routes>
    </Router>
  );
}
