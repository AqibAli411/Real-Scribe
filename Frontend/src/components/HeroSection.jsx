import Heading from "./Heading";
import { Link } from "react-router-dom";

function HeroSection() {
  return (
    <section className="flex flex-col items-start justify-center gap-2 p-6 text-stone-950 sm:p-8 lg:p-12">
      <Heading />
      <div className="text-stone-700">
        <p className="text-sm sm:text-base">
          Real-time co-editing that turns solo drafts into team masterpieces.
        </p>
      </div>
      <div className="mt-4 flex w-full flex-col gap-3 sm:mt-6 sm:w-auto sm:flex-row">
        <Link
          to="room"
          className="flex transform items-center justify-center rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-stone-100 transition-all duration-100 hover:-translate-y-[0.5px] hover:scale-101 hover:bg-blue-600 sm:px-6 sm:py-3 sm:text-base"
        >
          Join Room
        </Link>
        <Link
          to="room"
          className="gradient-border flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-100 hover:-translate-y-[0.5px] hover:scale-101 hover:bg-blue-600 sm:px-6 sm:py-3 sm:text-base"
        >
          Create Room
        </Link>
      </div>
    </section>
  );
}

export default HeroSection;
