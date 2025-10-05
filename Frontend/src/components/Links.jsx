import { NavLink } from "react-router-dom";
import Link from "./Link";

function Links() {
  return (
    <>
        <ul className="hidden md:flex items-center justify-center gap-8">
          {["Features", "Solutions", "Resources"].map((item, i) => (
            <Link key={i} className="underline-animation">
              {item}
            </Link>
          ))}
        </ul>
      <ul className="flex items-center justify-center gap-6">
        <Link className="underline-animation">About</Link>
        <NavLink
          to="/room"
          className="flex transform items-center justify-center rounded-xl bg-blue-500 px-4 py-2 font-medium text-stone-100 transition-all duration-100 hover:-translate-y-[0.5px] hover:scale-101 hover:bg-blue-600"
        >
          Join Room
        </NavLink>
      </ul>
    </>
  );
}

export default Links;
