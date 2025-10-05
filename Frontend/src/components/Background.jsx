function Background({ children }) {
  return (
    <div className="relative mx-auto mb-8 h-auto w-[95%] max-w-full sm:mb-12 sm:h-96 sm:max-w-330 lg:mb-15 lg:h-135">
      <div className="dotted-background h-full w-full items-center justify-center rounded-2xl sm:rounded-3xl lg:rounded-4xl">
        <div className="flex h-full w-full flex-col items-center justify-between p-4 sm:flex-row sm:p-0">
          {children}
        </div>
      </div>
    </div>
  );
}
export default Background;
