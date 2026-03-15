import { lazy, Suspense } from "react";
import { Routes, Route, useParams } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminPanel from "./pages/AdminPanel";
import { LoadingProvider } from "./context/LoadingProvider";
import { PortfolioProvider } from "./context/PortfolioContext";

const CharacterModel = lazy(() => import("./components/Character"));
const MainContainer = lazy(() => import("./components/MainContainer"));

// ---------------------------------------------------------------------------
// Subdomain / custom-domain detection
// ---------------------------------------------------------------------------
const MAIN_DOMAIN = import.meta.env.VITE_MAIN_DOMAIN || "localhost";

/**
 * Returns:
 *  - a slug string  → if we're on <slug>.dotdevz.com
 *  - '__host__'     → if we're on an unrecognised custom domain
 *  - null           → if we're on the main domain / localhost
 */
function detectSubdomain(): string | null {
  const hostname = window.location.hostname;
  if (
    hostname === MAIN_DOMAIN ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  ) {
    return null;
  }
  if (hostname.endsWith("." + MAIN_DOMAIN)) {
    return hostname.slice(0, -(MAIN_DOMAIN.length + 1));
  }
  // Custom domain
  return "__host__";
}

// ---------------------------------------------------------------------------
// Portfolio page components
// ---------------------------------------------------------------------------
interface PortfolioPageProps {
  slug?: string;
}

const PortfolioPage = ({ slug }: PortfolioPageProps) => (
  <PortfolioProvider slug={slug}>
    <LoadingProvider>
      <Suspense>
        <MainContainer>
          <Suspense>
            <CharacterModel />
          </Suspense>
        </MainContainer>
      </Suspense>
    </LoadingProvider>
  </PortfolioProvider>
);

/** Route handler for /p/:slug */
const PublicPortfolioRoute = () => {
  const { slug } = useParams<{ slug: string }>();
  return <PortfolioPage slug={slug} />;
};

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const App = () => {
  const subdomain = detectSubdomain();

  // If the visitor is on a subdomain or custom domain, render the matching
  // portfolio directly without going through the router.
  if (subdomain) {
    return <PortfolioPage slug={subdomain} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Default portfolio (the first / only user – legacy route) */}
      <Route path="/portfolio" element={<PortfolioPage />} />
      {/* Per-user shareable portfolio link: /p/johndoe */}
      <Route path="/p/:slug" element={<PublicPortfolioRoute />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  );
};

export default App;
