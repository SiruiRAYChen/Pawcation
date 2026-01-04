import axios from 'axios';
import { useState } from 'react';

const Signup = () => {
  const [step, setStep] = useState(1);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    rabies_vaccinated: false,
    separation_anxiety_level: 'Low',
    flight_comfort_level: 'Medium',
    daily_exercise_need: 'Medium',
    environment_preference: 'House with Yard',
    personality_archetype: ''
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleAnalyze = async () => {
    if (!image) {
      alert("Please upload an image first.");
      return;
    }

    setAnalyzing(true);
    const uploadData = new FormData();
    uploadData.append('file', image);

    try {
      const response = await axios.post('http://localhost:8000/api/analyze-pet-image', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Merge response data with current form data
      setFormData(prev => ({
        ...prev,
        ...response.data
      }));
      
      setStep(2); // Move to next step
    } catch (error) {
      console.error("Error analyzing image:", error);
      alert("Failed to analyze image. Please try again or skip analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      await axios.post('http://localhost:8000/api/signup', formData);
      setMessage('Profile created successfully! Welcome to Pawcation.');
    } catch (error) {
      console.error("Error signing up:", error);
      setMessage('Failed to create profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Pet Profile Sign Up 🐶</h2>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: step === 1 ? '50%' : '100%' }}></div>
      </div>

      {step === 1 && (
        <div className="text-center py-10">
          <h3 className="text-xl font-semibold mb-4">Let's meet your furry friend!</h3>
          <p className="text-gray-600 mb-8">Upload a photo and we'll use AI to help fill in the details.</p>
          
          <div className="mb-8 flex justify-center">
            {preview ? (
                <img src={preview} alt="Pet Preview" className="w-48 h-48 object-cover rounded-full border-4 border-blue-100 shadow-lg" />
            ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border-4 border-dashed border-gray-300">
                    <span className="text-4xl">📷</span>
                </div>
            )}
          </div>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="pet-image-upload"
          />
          
          <div className="space-y-4">
            <label 
                htmlFor="pet-image-upload"
                className="inline-block cursor-pointer bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-medium shadow-sm"
            >
                {preview ? 'Change Photo' : 'Select Photo'}
            </label>
            
            {image && (
                <div>
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-md transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {analyzing ? 'Analyzing with Gemini...' : 'Analyze & Continue ✨'}
                    </button>
                </div>
            )}
            
            <div className="mt-4">
                <button 
                    onClick={() => setStep(2)} 
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                    Skip analysis and enter manually
                </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Basic Info */}
            <div className="col-span-2">
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Basic Information</h4>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Pet Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                placeholder="e.g. Buddy"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Breed</label>
              <input
                type="text"
                name="breed"
                value={formData.breed}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-blue-50"
                placeholder="Auto-detected"
              />
            </div>

            <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Age</label>
                <input
                    type="text"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g. 2 years"
                />
            </div>
            <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Weight</label>
                <input
                    type="text"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g. 15 kg"
                />
            </div>

            {/* Personality & Needs */}
            <div className="col-span-2 mt-4">
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Personality & Needs</h4>
            </div>

            <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Personality Archetype</label>
                <input
                    type="text"
                    name="personality_archetype"
                    value={formData.personality_archetype}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g. The Guardian"
                />
            </div>

            <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Environment Preference</label>
                <select
                    name="environment_preference"
                    value={formData.environment_preference}
                    onChange={handleInputChange}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                    <option>Apartment</option>
                    <option>House with Yard</option>
                    <option>Farm</option>
                </select>
            </div>

            <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Daily Exercise Need</label>
                <select
                    name="daily_exercise_need"
                    value={formData.daily_exercise_need}
                    onChange={handleInputChange}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                </select>
            </div>

            <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Separation Anxiety</label>
                <select
                    name="separation_anxiety_level"
                    value={formData.separation_anxiety_level}
                    onChange={handleInputChange}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                </select>
            </div>

            <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Flight Comfort</label>
                <select
                    name="flight_comfort_level"
                    value={formData.flight_comfort_level}
                    onChange={handleInputChange}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                </select>
            </div>

            <div className="flex items-center mt-6">
                <input
                    id="rabies_vaccinated"
                    type="checkbox"
                    name="rabies_vaccinated"
                    checked={formData.rabies_vaccinated}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="rabies_vaccinated" className="ml-2 text-sm font-medium text-gray-900">
                    Rabies Vaccinated?
                </label>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
                Back
            </button>
            <button
                type="submit"
                disabled={submitting}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
            >
                {submitting ? 'Creating Profile...' : 'Complete Profile'}
            </button>
          </div>

          {message && (
            <p className={`mt-4 text-center text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
            </p>
          )}
        </form>
      )}
    </div>
  );
};

export default Signup;
