import { useState } from 'react';
import Signup from './Signup';
import TripPlanner from './TripPlanner';

function App() {
  const [view, setView] = useState('signup'); // Default to signup for the new feature

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-blue-600">Pawcation</h1>
          <p className="text-xl text-gray-600 mt-2">Plan the perfect trip with your furry friend!</p>
          
          <div className="mt-6 flex justify-center space-x-4">
            <button 
                onClick={() => setView('signup')}
                className={`px-4 py-2 rounded-full ${view === 'signup' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
            >
                Pet Profile
            </button>
            <button 
                onClick={() => setView('planner')}
                className={`px-4 py-2 rounded-full ${view === 'planner' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
            >
                Trip Planner
            </button>
          </div>
        </header>
        <main>
          {view === 'signup' ? <Signup /> : <TripPlanner />}
        </main>
      </div>
    </div>
  );
}

export default App;
