import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import SevasPage from "./pages/SevasPage";
import DarshanPage from "./pages/DarshanPage";
import DonationsPage from "./pages/DonationsPage";
import NewsEventsPage from "./pages/NewsEventsPage";
import NewsDetailPage from "./pages/NewsDetailPage";
import EventDetailPage from "./pages/EventDetailPage";
import ContactPage from "./pages/ContactPage";
import NotFoundPage from "./pages/NotFoundPage";

import { getTempleInfo } from "./services/templeService";
import type { TempleInfo } from "./types";

/** Automatically scrolls window to top on route navigation */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  const [templeInfo, setTempleInfo] = useState<TempleInfo | null>(null);

  useEffect(() => {
    getTempleInfo().then(setTempleInfo);
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Header templeName={templeInfo?.name || "Sri Kedareshwara Ashramam"} />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/sevas" element={<SevasPage />} />
          <Route path="/darshan" element={<DarshanPage />} />
          <Route path="/donations" element={<DonationsPage />} />
          <Route path="/news" element={<NewsEventsPage />} />
          <Route path="/events" element={<NewsEventsPage />} />
          <Route path="/news/:id" element={<NewsDetailPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer templeInfo={templeInfo} />
    </BrowserRouter>
  );
}
