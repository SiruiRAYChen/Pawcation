import axios from 'axios';
import { useState } from 'react';

const Signup = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [breed, setBreed] = useState('');
  const [vaccinationStatus, setVaccinationStatus] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

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
    const formData = new FormData();
    formData.append('file', image);

    try {
      const response = await axios.post('http://localhost:8000/api/analyze-pet-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setBreed(response.data.breed);
    } catch (error) {
      console.error("Error analyzing image:", error);
      alert("Failed to analyze image.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      await axios.post('http://localhost:8000/api/signup', {
        name,
        age,
        weight,
        breed,
        vaccination_status: vaccinationStatus,
      });
      setMessage('Profile created successfully! Welcome to Pawcation.');
      // Reset form or redirect
    } catch (error) {
      console.error("Error signing up:", error);
      setMessage('Failed to create profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Pet Profile Sign Up 🐶</h2>
      
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
            {preview ? (
                <img src={preview} alt="Pet Preview" className="w-32 h-32 object-cover rounded-full border-4 border-blue-100" />
            ) : (
                <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 border-4 border-gray-100">
                    <span>No Image</span>
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
        <label 
            htmlFor="pet-image-upload"
            className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-full hover:bg-blue-100 transition text-sm font-semibold"
        >
            Upload Pet Photo
        </label>

        {image && (
            <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="block mx-auto mt-3 text-sm text-purple-600 hover:text-purple-800 underline"
            >
                {analyzing ? 'Analyzing...' : 'Analyze Breed with Gemini ✨'}
            </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Pet Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Age</label>
                <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g. 3 years"
                />
            </div>
            <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Weight</label>
                <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g. 15 kg"
                />
            </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Breed</label>
          <input
            type="text"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-50"
            placeholder="Auto-detected or enter manually"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Vaccination Status</label>
          <input
            type="text"
            value={vaccinationStatus}
            onChange={(e) => setVaccinationStatus(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="e.g. Up to date"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {submitting ? 'Creating Profile...' : 'Create Profile'}
        </button>

        {message && (
            <p className={`mt-4 text-center text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
            </p>
        )}
      </form>
    </div>
  );
};

export default Signup;
