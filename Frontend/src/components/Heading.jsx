function Heading() {
  return (
    <div className="relative mb-3 inline-block">
      <h1 className="max-w-[630px] text-2xl md:text-4xl lg:text-6xl  leading-[1.1] font-semibold text-gray-900">
        Build Together All
        With{" "}
        <span className="relative">
          <span>RealScribe</span>
          <svg
            viewBox="0 0 187 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute bottom-[-3px] left-1 w-full max-w-[280px]"
          >
            <path
              d="M2 7C2 6.85498 63 2.81649 90 1.97674C161 1.137 185.5 4.91586 185.5 4.51586"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </h1>
    </div>
  );
}

export default Heading;
