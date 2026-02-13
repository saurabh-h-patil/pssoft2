import { Routes, Route } from "react-router-dom";
import Dashboard from "./PerformanceDashboard (1).jsx";
import PCSoftAnalytics from "./Pcsoftanalytics.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/analytics" element={<PCSoftAnalytics />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
