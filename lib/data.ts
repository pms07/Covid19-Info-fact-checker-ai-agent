import type { Agent, News } from "@/lib/types"

export const initialAgents: Agent[] = [
  {
    id: "agent-1",
    age: 65,
    gender: "Male",
    attitude: 0,
    income: "Middle",
    education: "High School",
    traits: "cautious, traditional",
  },
  {
    id: "agent-2",
    age: 32,
    gender: "Female",
    attitude: 1,
    income: "High",
    education: "Master's",
    traits: "analytical, health-conscious",
  },
  {
    id: "agent-3",
    age: 45,
    gender: "Male",
    attitude: -1,
    income: "Middle",
    education: "Bachelor's",
    traits: "skeptical, independent",
  },
]

export const initialNews: News[] = [
  {
    id: "news-1",
    title: "New Study Shows Vaccine Effectiveness at 95%",
    truthfulness: "True",
    sentiment: "Pro-vaccine",
    content:
      "A peer-reviewed study published in a leading medical journal has demonstrated that the new vaccine is 95% effective at preventing severe illness.",
    source: "Medical Journal",
  },
  {
    id: "news-2",
    title: "Government Mandates Vaccines for All Citizens",
    truthfulness: "Fake",
    sentiment: "Fear-based",
    content:
      "The government has announced plans to make vaccines mandatory for all citizens, with penalties for non-compliance.",
    source: "Social Media",
  },
  {
    id: "news-3",
    title: "Vaccine Side Effects Reported in 0.01% of Recipients",
    truthfulness: "True",
    sentiment: "Neutral",
    content:
      "Health authorities have reported that serious side effects from the vaccine occur in approximately 0.01% of recipients, which is lower than many common medications.",
    source: "Health Department",
  },
]
