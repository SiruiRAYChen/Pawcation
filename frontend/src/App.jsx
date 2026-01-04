import React from 'react';
import TripPlanner from './TripPlanner';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-blue-600">Pawcation</h1>
          <p className="text-xl text-gray-600 mt-2">Plan the perfect trip with your furry friend!</p>
        </header>
        <main>
          <TripPlanner />
        </main>
      </div>
    </div>
  );
}

export default App;
