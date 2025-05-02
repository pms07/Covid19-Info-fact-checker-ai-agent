import type { AIGeneratedProfile } from "@/lib/types"

// This is a mock implementation of AI generation
// In a real application, this would call an AI service
export async function generateAgentProfile(age: number, gender: string): Promise<AIGeneratedProfile> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Generate random profile based on age and gender
  let income: string
  let education: string
  let attitude: number
  let traits: string

  // Income based on age
  if (age < 25) {
    income = "Low"
  } else if (age < 50) {
    income = "Middle"
  } else {
    income = Math.random() > 0.5 ? "Middle" : "High"
  }

  // Education based on age
  if (age < 22) {
    education = "High School"
  } else if (age < 26) {
    education = "Bachelor's"
  } else if (age < 35) {
    education = Math.random() > 0.7 ? "Master's" : "Bachelor's"
  } else {
    const rand = Math.random()
    if (rand < 0.5) {
      education = "Bachelor's"
    } else if (rand < 0.8) {
      education = "Master's"
    } else {
      education = "PhD"
    }
  }

  // Attitude - slightly randomized but with some patterns
  const rand = Math.random()
  if (age > 65) {
    // Older people slightly more hesitant
    attitude = rand < 0.4 ? -1 : rand < 0.7 ? 0 : 1
  } else if (age < 30) {
    // Younger people slightly more accepting
    attitude = rand < 0.3 ? -1 : rand < 0.6 ? 0 : 1
  } else {
    // Middle-aged more evenly distributed
    attitude = rand < 0.33 ? -1 : rand < 0.66 ? 0 : 1
  }

  // Traits - generate some random personality traits
  const traitPool = [
    "analytical",
    "cautious",
    "trusting",
    "skeptical",
    "scientific",
    "traditional",
    "progressive",
    "health-conscious",
    "independent",
    "community-oriented",
    "risk-averse",
    "open-minded",
  ]

  // Select 2-3 random traits
  const numTraits = Math.floor(Math.random() * 2) + 2
  const selectedTraits = []

  for (let i = 0; i < numTraits; i++) {
    const randomIndex = Math.floor(Math.random() * traitPool.length)
    selectedTraits.push(traitPool[randomIndex])
    traitPool.splice(randomIndex, 1)
  }

  traits = selectedTraits.join(", ")

  return { income, education, attitude, traits }
}
