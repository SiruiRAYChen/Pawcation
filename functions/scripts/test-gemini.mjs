import { generateTravelItinerary } from "../lib/services/geminiService.js";

const run = async () => {
  const result = await generateTravelItinerary({
    origin: "Boston, Massachusetts",
    destination: "New York, New York",
    startDate: "2026-02-04",
    endDate: "2026-02-07",
    petInfo: {
      name: "Curry",
      breed: "Husky",
      age: "adult",
      size: "large",
      personality: ["calm", "friendly"],
      health: "healthy",
    },
    numAdults: 2,
    numChildren: 0,
    budget: 2550,
  });

  if (result?.error) {
    console.error("Gemini error:", result.error);
    process.exit(1);
  }

  const memo = result?.packing_memo || [];
  console.log("packing_memo length:", memo.length);
  console.log("packing_memo:", memo);
};

run().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
