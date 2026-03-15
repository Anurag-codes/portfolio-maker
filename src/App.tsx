import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminPanel from "./pages/AdminPanel";
import { LoadingProvider } from "./context/LoadingProvider";
import { PortfolioProvider } from "./context/PortfolioContext";

const CharacterModel = lazy(() => import("./components/Character"));
const MainContainer = lazy(() => import("./components/MainContainer"));

const Portfolio = () => (
  <PortfolioProvider>
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

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  );
};

export default App;
