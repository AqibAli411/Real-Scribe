import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

function Links() {
  const navigate = useNavigate();
  const [quickCode, setQuickCode] = useState("");
  const normalizedCode = useMemo(
    () => quickCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6),
    [quickCode],
  );
  const canQuickJoin = normalizedCode.length === 6;

  const handleQuickJoin = (e) => {
    e.preventDefault();
    if (!canQuickJoin) return;
    navigate(`/room?mode=join&room=${normalizedCode}`);
  };

  return (
    <ul className="flex items-center justify-center gap-3 sm:gap-4">
      <li className="hidden md:block">
        <form
          onSubmit={handleQuickJoin}
          className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-2 py-1 shadow-xs"
        >
          <input
            value={quickCode}
            onChange={(e) => setQuickCode(e.target.value)}
            placeholder="Room code"
            maxLength={6}
            className="w-24 bg-transparent px-2 py-1 text-center font-mono text-xs tracking-widest text-neutral-700 uppercase outline-none placeholder:text-neutral-400"
          />
          <button
            type="submit"
            disabled={!canQuickJoin}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-neutral-900 text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            title="Quick join"
          >
            <ArrowUpRight size={14} />
          </button>
        </form>
      </li>
      <NavLink
        to="/room"
        className="flex transform items-center justify-center rounded-xl bg-blue-500 px-4 py-2 font-medium text-stone-100 transition-all duration-100 hover:-translate-y-[0.5px] hover:scale-101 hover:bg-blue-600"
      >
        Join Room
      </NavLink>
    </ul>
  );
}

export default Links;
