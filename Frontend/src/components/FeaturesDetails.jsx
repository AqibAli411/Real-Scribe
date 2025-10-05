import { Users, Lightbulb, TrendingUp, Paintbrush, Edit3 } from "lucide-react";

export default function Details() {
  return (
    <div className="min-h-screen bg-white px-4 py-20">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-20 text-center">
          <h1 className="mb-8 text-4xl leading-[1.1] font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Everything You Need for
            <br />
            <span className="text-blue-500">Creative Collaboration</span>
          </h1>
          <p className="mx-auto max-w-3xl text-base leading-relaxed font-normal text-neutral-500 sm:text-lg">
            Transform your ideas into reality with our comprehensive suite of
            collaboration tools.
            <br />
            Draw, write, and create together in real-time.
          </p>
        </div>

        {/* Continuous Grid Container */}
        <div className="mx-auto max-w-6xl overflow-hidden bg-white">
          {/* Top Row */}
          <div className="grid grid-cols-1 border-b border-gray-200 md:grid-cols-3">
            {/* Top Left */}
            <div className="group relative border-b border-gray-200 from-gray-100 to-transparent/90 p-8 transition-all duration-300 hover:bg-gradient-to-t sm:p-12 md:border-r md:border-b-0">
              {/* Dotted background overlay on hover */}
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-1000 group-hover:opacity-100"
                style={{
                  backgroundImage: `radial-gradient(circle, #d1d5db 1.15px, transparent 1px)`,
                  backgroundSize: "15px 15px",
                  backgroundPosition: "0 0",
                  maskImage: `radial-gradient(circle at 50% 0%,black 20%,transparent 60%)`,
                }}
              ></div>

              <div className="relative z-10 flex h-full flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 transition-transform duration-300">
                  <Paintbrush
                    className="h-8 w-8 text-white"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="mb-4 text-xl leading-tight font-semibold text-gray-900">
                  Drawing Tools
                </h3>
                <p className="text-sm leading-relaxed font-normal text-gray-500">
                  Professional drawing tools with brushes, and colors. Create
                  stunning visual content with precision and ease.
                </p>
              </div>
            </div>

            {/* Top Center */}
            <div className="group relative border-b border-gray-200 from-gray-100 to-transparent/90 p-8 transition-all duration-300 hover:bg-gradient-to-t sm:p-12 md:border-r md:border-b-0">
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                style={{
                  backgroundImage: `radial-gradient(circle, #d1d5db 1.15px, transparent 1px)`,
                  backgroundSize: "15px 15px",
                  backgroundPosition: "0 0",
                  maskImage: `radial-gradient(circle at 50% 0%,black 20%,transparent 60%)`,
                }}
              ></div>

              <div className="relative z-10 flex h-full flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 transition-transform duration-700">
                  <Users className="h-8 w-8 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="mb-4 text-xl leading-tight font-semibold text-gray-900">
                  Real-time Collaboration
                </h3>
                <p className="text-sm leading-relaxed font-normal text-gray-500">
                  Work together seamlessly with your team. See changes instantly
                  as multiple users edit and draw simultaneously on the same
                  canvas
                </p>
              </div>
            </div>

            {/* Top Right */}
            <div className="group relative from-gray-100 to-transparent/90 p-8 transition-all duration-300 hover:bg-gradient-to-t sm:p-12">
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  backgroundImage: `radial-gradient(circle, #d1d5db 1.15px, transparent 1px)`,
                  backgroundSize: "15px 15px",
                  backgroundPosition: "0 0",
                  maskImage: `radial-gradient(circle at 50% 0%,black 20%,transparent 60%)`,
                }}
              ></div>

              <div className="relative z-10 flex h-full flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 transition-transform duration-300">
                  <Edit3 className="h-8 w-8 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="mb-4 text-xl leading-tight font-semibold text-gray-900">
                  Rich Text Editor
                </h3>
                <p className="text-sm leading-relaxed font-normal text-gray-500">
                  Powerful text editing capabilities with formatting, styling,
                  and collaborative editing features for comprehensive
                  documentation.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Bottom Left */}
            <div className="group relative border-b border-gray-200 from-gray-100 to-transparent/90 p-8 transition-all duration-300 hover:bg-gradient-to-t sm:p-12 md:border-r md:border-b-0">
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  backgroundImage: `radial-gradient(circle, #d1d5db 1.15px, transparent 1px)`,
                  backgroundSize: "15px 15px",
                  backgroundPosition: "0 0",
                  maskImage: `radial-gradient(circle at 50% 0%,black 20%,transparent 60%)`,
                }}
              ></div>

              <div className="relative z-10 flex h-full flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 transition-transform duration-300">
                  <Lightbulb className="h-8 w-8 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="mb-4 text-xl leading-tight font-semibold text-gray-900">
                  AI Creative Insights
                </h3>
                <p className="text-sm leading-relaxed font-normal text-gray-500">
                  Analyzes creative elements like images, videos, and text to
                  boost engagement
                </p>
              </div>
            </div>

            {/* Bottom Right */}
            <div className="group relative from-gray-100/90 to-transparent/90 p-8 transition-all duration-300 hover:bg-gradient-to-t sm:p-12">
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  backgroundImage: `radial-gradient(circle, #d1d5db 1.15px, transparent 1px)`,
                  backgroundSize: "15px 15px",
                  backgroundPosition: "0 0",
                  maskImage: `radial-gradient(circle at 50% 0%,black 20%,transparent 60%)`,
                }}
              ></div>

              <div className="relative z-10 flex h-full flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 transition-transform duration-300">
                  <TrendingUp
                    className="h-8 w-8 text-white"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="mb-4 text-xl leading-tight font-semibold text-gray-900">
                  AI Performance Prediction
                </h3>
                <p className="text-sm leading-relaxed font-normal text-gray-500">
                  Predicts campaign outcomes using historical data and market
                  trends
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
