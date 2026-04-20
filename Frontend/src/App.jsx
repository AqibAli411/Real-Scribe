import { lazy, Suspense } from "react";
import AppLayout from "./pages/AppLayout";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RoomLayout from "./pages/RoomLayout";

const HomePage = lazy(() => import("./pages/HomePage"));
const RoomPage = lazy(() => import("./pages/RoomPage"));
const DashBoard = lazy(() => import("./pages/DashBoard"));

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-neutral-500">
      Loading...
    </div>
  );
}

function withSuspense(Component) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: withSuspense(HomePage),
      },
      {
        path: "/room",
        element: <RoomLayout />,
        children: [
          {
            index: true,
            element: withSuspense(RoomPage),
          },
          {
            path: ":roomId",
            element: withSuspense(DashBoard),
          },
        ],
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
