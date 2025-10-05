import Header from "../components/Header";
import Background from "../components/Background";
import HeroSection from "../components/HeroSection";
import SideSvgs from "../components/SideSvgs";
import FeaturesSection from "../components/FeaturesSection";

function HomePage() {
  return (
    <>
      <Header />
      <Background>
        <HeroSection />
        <SideSvgs />
      </Background>
      <FeaturesSection />
    </>
  );
}

export default HomePage;
