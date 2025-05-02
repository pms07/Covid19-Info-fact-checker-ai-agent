import type { Agent, News, SimulationResult } from "@/lib/types"

// This is a simplified simulation model
export function simulateResponses(
  agents: Agent[],
  news: News[],
): {
  results: SimulationResult[]
  summary: string
} {
  const results: SimulationResult[] = []

  // Process each agent's response to the news
  for (const agent of agents) {
    let attitudeChange = 0
    let reasoning = ""

    // Calculate the influence of each news item
    for (const item of news) {
      let itemInfluence = 0

      // Truthfulness factor
      if (item.truthfulness === "True") {
        itemInfluence += 0.2
      } else {
        // Fake news has different effects based on education
        if (agent.education === "PhD" || agent.education === "Master's") {
          itemInfluence -= 0.1 // More educated people are less influenced by fake news
        } else {
          itemInfluence += 0.1 // Less educated people might be more influenced
        }
      }

      // Sentiment factor
      if (item.sentiment === "Pro-vaccine") {
        itemInfluence += 0.2
      } else if (item.sentiment === "Anti-vaccine") {
        itemInfluence -= 0.2
      } else if (item.sentiment === "Fear-based") {
        // Fear affects different age groups differently
        if (agent.age > 60) {
          itemInfluence -= 0.3 // Older people more affected by fear
        } else {
          itemInfluence -= 0.1
        }
      }

      // Personality traits factor (simplified)
      if (agent.traits) {
        if (agent.traits.includes("analytical") || agent.traits.includes("scientific")) {
          if (item.truthfulness === "True") {
            itemInfluence *= 1.5 // Analytical people more influenced by true information
          } else {
            itemInfluence *= 0.5 // Less influenced by fake information
          }
        }

        if (agent.traits.includes("skeptical")) {
          itemInfluence *= 0.7 // Skeptical people less influenced in general
        }

        if (agent.traits.includes("trusting")) {
          itemInfluence *= 1.3 // Trusting people more influenced in general
        }
      }

      attitudeChange += itemInfluence

      // Add to reasoning
      reasoning += `${item.title}: ${itemInfluence > 0 ? "Positive" : itemInfluence < 0 ? "Negative" : "Neutral"} influence. `
    }

    // Normalize attitude change
    attitudeChange = Math.max(-1, Math.min(1, attitudeChange))

    // Calculate new attitude (bounded between -1 and 1)
    let newAttitude = agent.attitude + attitudeChange
    newAttitude = Math.max(-1, Math.min(1, newAttitude))

    // Round to nearest integer (-1, 0, 1)
    newAttitude = Math.round(newAttitude)

    results.push({
      agentId: agent.id,
      newAttitude,
      reasoning,
    })
  }

  // Generate summary
  const positiveChanges = results.filter((r) => {
    const agent = agents.find((a) => a.id === r.agentId)
    return agent && r.newAttitude > agent.attitude
  }).length

  const negativeChanges = results.filter((r) => {
    const agent = agents.find((a) => a.id === r.agentId)
    return agent && r.newAttitude < agent.attitude
  }).length

  const noChanges = results.filter((r) => {
    const agent = agents.find((a) => a.id === r.agentId)
    return agent && r.newAttitude === agent.attitude
  }).length

  let summary = `Simulation complete. ${positiveChanges} agents became more positive toward vaccination, ${negativeChanges} became more negative, and ${noChanges} remained unchanged. `

  if (positiveChanges > negativeChanges) {
    summary += "Overall, the news exposure had a positive effect on vaccine attitudes."
  } else if (negativeChanges > positiveChanges) {
    summary += "Overall, the news exposure had a negative effect on vaccine attitudes."
  } else {
    summary += "Overall, the news exposure had a mixed or neutral effect on vaccine attitudes."
  }

  return { results, summary }
}
