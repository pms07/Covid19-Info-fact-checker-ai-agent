"use client"

import { useMemo } from "react"
import { Chart, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts"
import type { Agent, SimulationResult } from "@/lib/types"
import { getAttitudeEmoji } from "@/lib/utils"

interface AttitudeChartProps {
  agents: Agent[]
  simulationResults: SimulationResult[]
}

export function AttitudeChart({ agents, simulationResults }: AttitudeChartProps) {
  // Transform data for line chart
  const chartData = useMemo(() => {
    // Create data points for before and after
    return [
      {
        name: "Before",
        ...agents.reduce(
          (acc, agent) => {
            acc[`agent${agent.id.split("-")[1]}`] = agent.attitude
            return acc
          },
          {} as Record<string, number>,
        ),
      },
      {
        name: "After",
        ...agents.reduce(
          (acc, agent) => {
            const result = simulationResults.find((r) => r.agentId === agent.id)
            acc[`agent${agent.id.split("-")[1]}`] = result ? result.newAttitude : agent.attitude
            return acc
          },
          {} as Record<string, number>,
        ),
      },
    ]
  }, [agents, simulationResults])

  // Create agent metadata for tooltips and legends
  const agentMeta = useMemo(() => {
    return agents.map((agent) => {
      const result = simulationResults.find((r) => r.agentId === agent.id)
      return {
        id: agent.id,
        key: `agent${agent.id.split("-")[1]}`,
        name: `Agent ${agent.id.split("-")[1]}`,
        age: agent.age,
        gender: agent.gender,
        beforeAttitude: agent.attitude,
        afterAttitude: result ? result.newAttitude : agent.attitude,
        beforeEmoji: getAttitudeEmoji(agent.attitude),
        afterEmoji: result ? getAttitudeEmoji(result.newAttitude) : getAttitudeEmoji(agent.attitude),
      }
    })
  }, [agents, simulationResults])

  // Generate a color for each agent
  const getAgentColor = (index: number) => {
    const colors = [
      "#3b82f6", // blue-500
      "#ef4444", // red-500
      "#22c55e", // green-500
      "#f59e0b", // amber-500
      "#8b5cf6", // violet-500
      "#ec4899", // pink-500
      "#06b6d4", // cyan-500
    ]
    return colors[index % colors.length]
  }

  return (
    <ChartContainer className="h-[300px]">
      <Chart>
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Legend:</h4>
          <div className="flex flex-wrap gap-3">
            {agentMeta.map((agent, index) => (
              <div key={agent.id} className="flex items-center text-sm">
                <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: getAgentColor(index) }} />
                <span>
                  {agent.name}: {agent.beforeEmoji} → {agent.afterEmoji}
                </span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" />
            <YAxis
              domain={[-1, 1]}
              ticks={[-1, 0, 1]}
              tickFormatter={(value) => {
                switch (value) {
                  case -1:
                    return "😠"
                  case 0:
                    return "😐"
                  case 1:
                    return "🙂"
                  default:
                    return ""
                }
              }}
              tick={{ fontSize: 16 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="p-2"
                  content={({ payload, label }) => {
                    if (!payload?.length) return null

                    return (
                      <div className="space-y-1">
                        <p className="font-medium">{label}</p>
                        <div className="space-y-1 mt-1">
                          {payload.map((entry, index) => {
                            const agent = agentMeta.find((a) => a.key === entry.dataKey)
                            if (!agent) return null

                            return (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span>{agent.name}:</span>
                                <span>{entry.value === -1 ? "😠" : entry.value === 0 ? "😐" : "🙂"}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  }}
                />
              }
            />
            {agentMeta.map((agent, index) => (
              <Line
                key={agent.id}
                type="monotone"
                dataKey={agent.key}
                stroke={getAgentColor(index)}
                strokeWidth={2}
                dot={{ r: 6 }}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Chart>
    </ChartContainer>
  )
}
