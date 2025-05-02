'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Agent, SimulationResult } from '@/lib/types';
import { AttitudeChart } from '@/components/attitude-chart';

interface AnalysisPanelProps {
  agents: Agent[];
  onSimulate: () => void;
  simulationResults: SimulationResult[] | null;
  simulationSummary: string | null;
}

export function AnalysisPanel({
  agents,
  onSimulate,
  simulationResults,
  simulationSummary,
}: AnalysisPanelProps) {
  const hasResults = !!simulationResults && simulationResults.length > 0;

  return (
    <div className='flex flex-col h-full'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-semibold'>Analysis</h2>
      </div>

      <div className='flex-1 overflow-auto space-y-4'>
        <Button
          onClick={onSimulate}
          size='lg'
          className='w-full'
          disabled={agents.length === 0}
        >
          Simulate
        </Button>

        {!hasResults && (
          <div className='text-center py-8 text-muted-foreground'>
            Click "Simulate" to run the simulation and see results.
          </div>
        )}

        {hasResults && (
          <>
            <Card>
              <CardContent className='p-4'>
                <h3 className='font-medium mb-2'>Simulation Summary</h3>
                <p className='text-sm'>{simulationSummary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-4'>
                <h3 className='font-medium mb-4'>Attitude Changes Graph</h3>
                <AttitudeChart
                  agents={agents}
                  simulationResults={simulationResults}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
