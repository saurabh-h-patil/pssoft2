import { Routes, Route } from "react-router-dom";
import Dashboard from "./PerformanceDashboard (1).jsx";
import PCSoftAnalytics from "./Pcsoftanalytics.jsx";
import QueryBuilder from "./QueryBuilder.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<QueryBuilder />} />
      <Route path="/analytics" element={<PCSoftAnalytics />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/datasource" element={<QueryBuilder />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
