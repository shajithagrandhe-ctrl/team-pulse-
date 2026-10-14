import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SimpleProtectedRoute from "./components/SimpleProtectedRoute";
import SimpleAppLayout from "./components/SimpleAppLayout";
import { AuthProvider } from "./contexts/AuthContext";
import RealtimeProvider from "./realtime/RealTimeListener";
import Dashboard from "./pages/Dashboard";
import VentureLocations from "./pages/VentureLocations";
import VenturesList from "./pages/VenturesList";
import PlotGrid from "./pages/PlotGrid";
import BackendThreeLogins from "./pages/BackendThreeLogins";
import CustomerLiveTracking from "./pages/CustomerLiveTracking";
import TrackCustomers from "./pages/TrackCustomers";
import TotalData from "./pages/TotalDataForm";
import NewVenture from "./pages/NewVenture";
import ReportsPage from "./pages/ReportsPage";
import Admin from "./pages/Admin";
import EmployeeAccess from "./pages/EmployeeAccess";
import LayoutEditorPage from "./pages/LayoutEditorPage";
import Payment from "./payment/page";
import PlotAvailable from "./plot-available/page";
import SoldOut from "./sold-out/page";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RealtimeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/backend-auth" element={<BackendThreeLogins />} />
              <Route path="/auth" element={<BackendThreeLogins />} />
              <Route path="/sold-out" element={<SoldOut />} />
              <Route element={<SimpleProtectedRoute><SimpleAppLayout /></SimpleProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/ventures" element={<VentureLocations />} />
                <Route path="/ventures/:locationId" element={<VenturesList />} />
                <Route path="/ventures/:locationId/:ventureId" element={<PlotGrid />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/track-customers" element={<TrackCustomers />} />
                <Route path="/live-tracking" element={<CustomerLiveTracking />} />
                <Route path="/total-data" element={<TotalData />} />
                <Route path="/new-venture" element={<NewVenture />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/employee-access" element={<EmployeeAccess />} />
                <Route path="/layout-editor" element={<LayoutEditorPage />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/plot-available" element={<PlotAvailable />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RealtimeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
