import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import "./index.css"
import App from "./App.jsx"
import DashboardPage from "./pages/DashboardPage.jsx"
import TrackerPage from "./pages/TrackerPage.jsx"
import AnalyticsPage from "./pages/AnalyticsPage.jsx"
import BiohacksPage from "./pages/BiohacksPage.jsx"

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "tracker", element: <TrackerPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "biohacks", element: <BiohacksPage /> },
    ],
  },
])

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
