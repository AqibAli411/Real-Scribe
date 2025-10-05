import ChatSection from "../components/ChatSection";
import ModeHeader from "../components/ModeHeader";
import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Manager from "../features/DrawingCanvas/Manager.jsx";

function DashBoard() {
  const [mode, setMode] = useState("canvas"); // 'canvas' or 'text'
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { roomId } = useParams(); // URL me /room/123 ho to id = "123"

  const [searchParams] = useSearchParams();
  const name = searchParams.get("name");
  const id = searchParams.get("id");
  //name and id here have

  return (
    <section className="mx-auto flex w-full flex-col p-2 shadow-xs">
      <ModeHeader
        onSetMode={setMode}
        mode={mode}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        roomId={roomId}
        name={name}
      />
      <div className="flex h-[550px] justify-between">
        <ChatSection roomId={roomId} currentUser ={{name,id}}/>
        <Manager
          isDarkMode={isDarkMode}
          roomId={roomId}
          id={id}
          name={name}
          mode={mode}
        />
      </div>
    </section>
  );
}

export default DashBoard;
