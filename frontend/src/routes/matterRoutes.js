import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import MattersPage from "../pages/matters/MattersPage";
import CreateMatterPage from "../pages/matters/CreateMatterPage";
import EditMatterPage from "../pages/matters/EditMatterPage";
import MatterDetailPage from "../pages/matters/MatterDetailPage";

const MatterRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MattersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <CreateMatterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/:id"
        element={
          <ProtectedRoute>
            <MatterDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/:id/edit"
        element={
          <ProtectedRoute>
            <EditMatterPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/matters" replace />} />
    </Routes>
  );
};

export default MatterRoutes;
