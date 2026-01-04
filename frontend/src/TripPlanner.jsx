import React, { useState } from 'react';
import axios from 'axios';

const TripPlanner = () => {
  const [destination, setDestination] = useState('');
  const [petDetails, setPetDetails] = useState('');
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGeneratePlan = async () => {
    setLoading(true);
    setError('');
    setPlan('');

    try {
      const response = await axios.post('http://localhost:8000/api/plan-trip', {
        destination,
        pet_details: petDetails,
      });
      setPlan(response.data.plan);
    } catch (err) {
      console.error("Error generating plan:", err);
      setError('Failed to generate plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Pawcation Trip Planner 🐾</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="destination">
          Destination
        </label>
        <input
          id="destination"
          type="text"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="e.g., Paris, France"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="petDetails">
          Pet Details
        </label>
        <textarea
          id="petDetails"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="e.g., Golden Retriever, 3 years old, loves swimming"
          rows="3"
          value={petDetails}
          onChange={(e) => setPetDetails(e.target.value)}
        />
      </div>

      <button
        onClick={handleGeneratePlan}
        disabled={loading}
        className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Generating Plan...' : 'Generate Plan'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {plan && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="text-lg font-semibold mb-2 text-green-800">Your Itinerary:</h3>
          <div className="whitespace-pre-wrap text-gray-700">
            {plan}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripPlanner;
