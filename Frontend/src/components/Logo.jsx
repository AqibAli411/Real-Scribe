import { Link } from "react-router-dom";

function Logo() {
  return (
    <Link
      to="/"
      className="flex cursor-pointer items-center justify-center gap-2"
    >
      <div className="h-10 w-10 rounded-xl bg-blue-500 p-1">
        <img src="/icon.svg" alt="RealScribe" />
      </div>
      <div className="font-semibold">RealScribe</div>
    </Link>
  );
}

export default Logo;