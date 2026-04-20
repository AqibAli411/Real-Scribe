import { Outlet } from "react-router-dom";
import { WebSocketProvider } from "../context/useWebSocketContext";

function RoomLayout() {
  return (
    <WebSocketProvider>
      <Outlet />
    </WebSocketProvider>
  );
}

export default RoomLayout;
