'use client';

import { useState } from 'react';
import { AgentsPanel } from '@/components/agents-panel';
import { NewsPanel } from '@/components/news-panel';
import { AnalysisPanel } from '@/components/analysis-panel';
import type { Agent, News, SimulationResult } from '@/lib/types';
import { initialAgents, initialNews } from '@/lib/data';
import { simulateResponses } from '@/lib/simulation';

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [news, setNews] = useState<News[]>(initialNews);
  const [simulationResults, setSimulationResults] = useState<
    SimulationResult[] | null
  >(null);
  const [simulationSummary, setSimulationSummary] = useState<string | null>(
    null
  );

  const handleAddAgent = (agent: Agent) => {
    setAgents([...agents, { ...agent, id: `agent-${Date.now()}` }]);
  };

  const handleUpdateAgent = (updatedAgent: Agent) => {
    setAgents(
      agents.map((agent) =>
        agent.id === updatedAgent.id ? updatedAgent : agent
      )
    );
  };

  const handleDeleteAgent = (agentId: string) => {
    setAgents(agents.filter((agent) => agent.id !== agentId));
  };

  const handleAddNews = (newsItem: News) => {
    setNews([...news, { ...newsItem, id: `news-${Date.now()}` }]);
  };

  const handleUpdateNews = (updatedNews: News) => {
    setNews(
      news.map((item) => (item.id === updatedNews.id ? updatedNews : item))
    );
  };

  const handleDeleteNews = (newsId: string) => {
    setNews(news.filter((item) => item.id !== newsId));
  };

  const handleReorderNews = (reorderedNews: News[]) => {
    setNews(reorderedNews);
  };

  const runSimulation = () => {
    const { results, summary } = simulateResponses(agents, news);
    setSimulationResults(results);
    setSimulationSummary(summary);
  };

  return (
    <div className='container mx-auto p-4'>
      <header className='mb-6'>
        <h1 className='text-3xl font-bold text-center'>
          Vaccine Hesitancy Simulation Lab
        </h1>
      </header>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <AgentsPanel
          agents={agents}
          onAddAgent={handleAddAgent}
          onUpdateAgent={handleUpdateAgent}
          onDeleteAgent={handleDeleteAgent}
          simulationResults={simulationResults}
        />

        <NewsPanel
          news={news}
          onAddNews={handleAddNews}
          onUpdateNews={handleUpdateNews}
          onDeleteNews={handleDeleteNews}
          onReorderNews={handleReorderNews}
        />

        <AnalysisPanel
          agents={agents}
          onSimulate={runSimulation}
          simulationResults={simulationResults}
          simulationSummary={simulationSummary}
        />
      </div>
    </div>
  );
}
