import LandingPageClient from '../components/LandingPageClient';
import Features from '../components/Features'; 

export default function Home() {
  return (
    <main>
      <LandingPageClient />
      
      {/* 
         COMMANDER NOTE: 
         This ID 'features' acts as the landing beacon for the 
         scroll function in LandingPageClient.tsx 
      */}
      <div id="features">
        <Features /> 
      </div>
    </main>
  );
}