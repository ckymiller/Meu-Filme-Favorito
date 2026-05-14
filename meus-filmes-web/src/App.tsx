import { Route, Routes } from "react-router-dom";

import { Layout } from "./components/Layout";
import { AddPage } from "./pages/AddPage";
import { HomePage } from "./pages/HomePage";
import { MovieDetailPage } from "./pages/MovieDetailPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage status="want" />} />
        <Route path="/watched" element={<HomePage status="watched" />} />
        <Route path="/abandoned" element={<HomePage status="abandoned" />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/movie/:id" element={<MovieDetailPage />} />
      <Route path="/add" element={<AddPage />} />
    </Routes>
  );
}
