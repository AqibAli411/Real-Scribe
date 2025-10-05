import Footer from "./Footer";
import Details from "./FeaturesDetails";

const FeaturesSection = () => {
  return (
    <>
      <section className="py-10">
        <div className="mx-auto max-w-[1366px] px-4 sm:px-6 lg:px-8">
          {/* Placeholder for Dashboard Image */}
          <div className="relative flex items-end justify-center overflow-hidden rounded-4xl border-b-3 border-neutral-50 pt-5 shadow-[0_35px_35px_rgba(0,0,0,0.04)] sm:pt-10 md:pt-15 lg:pt-20">
            <div className="absolute inset-0 overflow-hidden rounded-4xl bg-gradient-to-b from-blue-400/95 to-blue-500">
              <div className="grid h-full w-full -translate-10 -rotate-35 grid-cols-6 grid-rows-10 sm:-translate-20 md:-translate-45 lg:-translate-55">
                <div className="col-span-2 row-span-4 bg-gradient-to-r from-blue-300/60 to-blue-400/10"></div>
                <div className="col-span-3 col-start-4 row-span-4 row-start-6 bg-gradient-to-l from-blue-300/85 to-transparent"></div>
              </div>
              <div className="grid h-full w-full translate-x-90 -translate-y-65 -rotate-37 grid-cols-6 grid-rows-10">
                <div className="col-span-3 col-start-4 row-span-3 row-start-1 bg-blue-400/70"></div>
              </div>
            </div>

            <div className="relative z-50 mx-auto max-w-[85%]">
              <img
                src="/features.png"
                className="-mb-5 rounded-xl border border-neutral-100 shadow-xs"
              />
            </div>
          </div>

          <div className="mt-5 p-10">
            <Details />
          </div>
        </div>
        {/* Header */}
      </section>
      <Footer />
    </>
  );
};

export default FeaturesSection;
