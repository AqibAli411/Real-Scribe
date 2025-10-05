import { Outlet } from "react-router-dom";
import { WebSocketProvider } from "../context/useWebSocketContext";
function AppLayout() {
  return (
    <WebSocketProvider>
      <Outlet />
    </WebSocketProvider>
  );
}

export default AppLayout;
