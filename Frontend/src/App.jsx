import AppLayout from "./pages/AppLayout";
import HomePage from "./pages/HomePage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DashBoard from "./pages/DashBoard";
import RoomPage from "./pages/RoomPage";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/room",
        element: <RoomPage />,
      },
      {
        path: "/room/:roomId",
        element: <DashBoard />,
      },
    ],
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
