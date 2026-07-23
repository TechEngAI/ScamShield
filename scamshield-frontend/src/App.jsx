import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/layout/Navbar";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import BulkCheckPage from "./pages/BulkCheckPage";
import CheckScamPage from "./pages/CheckScamPage";
import DashboardPage from "./pages/DashboardPage";
import DeveloperPage from "./pages/DeveloperPage";
import ExtensionMockupPage from "./pages/ExtensionMockupPage";
import HistoryPage from "./pages/HistoryPage";
import LandingPage from "./pages/LandingPage";
import LiveFeedPage from "./pages/LiveFeedPage";
import LoginPage from "./pages/LoginPage";
import PublicApiDocsPage from "./pages/PublicApiDocsPage";
import RegisterPage from "./pages/RegisterPage";
import ReportPage from "./pages/ReportPage";
import UssdSimulatorPage from "./pages/UssdSimulatorPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        {/* Public routes — no auth needed */}
        <Route path="/feed" element={<LiveFeedPage />} />
        <Route path="/report/:id" element={<ReportPage />} />
        <Route path="/ussd" element={<UssdSimulatorPage />} />
        <Route path="/extension" element={<ExtensionMockupPage />} />
        <Route path="/api-docs" element={<PublicApiDocsPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/check" element={<CheckScamPage />} />
          <Route path="/bulk" element={<BulkCheckPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/developer" element={<DeveloperPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          className: "text-sm font-semibold",
          duration: 3500,
        }}
      />
    </>
  );
}

export default App;
