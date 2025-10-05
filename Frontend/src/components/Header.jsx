import Links from "./Links";
import Logo from "./Logo";

function Header() {
  return (
    <header className="p-10">
      <div className="fixed top-0 right-0 left-0 z-99 mx-auto flex max-w-340 items-center justify-between bg-white/80 p-4 backdrop-blur-lg">
        <Logo />

        <Links />
      </div>
    </header>
  );
}

export default Header;
