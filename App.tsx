import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AssessmentFlow from './components/assessment/AssessmentFlow';
import ResultsPage from './pages/ResultsPage';
import MethodologyPage from './pages/MethodologyPage';
import ScrollToTop from './components/shared/ScrollToTop';

// Helper to scroll top on route change
const ScrollHandler = () => {
    return <ScrollToTop />;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/methodology" element={<MethodologyPage />} />
        <Route path="/assessment" element={<AssessmentFlow />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
