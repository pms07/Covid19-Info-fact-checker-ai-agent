'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { AgentForm } from '@/components/agent-form';
import type { Agent, SimulationResult } from '@/lib/types';
import { getAttitudeEmoji } from '@/lib/utils';

interface AgentsPanelProps {
  agents: Agent[];
  onAddAgent: (agent: Agent) => void;
  onUpdateAgent: (agent: Agent) => void;
  onDeleteAgent: (agentId: string) => void;
  simulationResults: SimulationResult[] | null;
}

export function AgentsPanel({
  agents,
  onAddAgent,
  onUpdateAgent,
  onDeleteAgent,
  simulationResults,
}: AgentsPanelProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const handleOpenEdit = (agent: Agent) => {
    setEditingAgent(agent);
  };

  const handleCloseEdit = () => {
    setEditingAgent(null);
  };

  const getSimulationResult = (agentId: string) => {
    if (!simulationResults) return null;
    return simulationResults.find((result) => result.agentId === agentId);
  };

  return (
    <div className='flex flex-col h-full'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-semibold'>Agents</h2>
        <Button onClick={() => setIsAddOpen(true)}>+ Add Agent</Button>
      </div>

      <div className='flex-1 overflow-auto space-y-4'>
        {agents.map((agent) => {
          const result = getSimulationResult(agent.id);

          return (
            <Card
              key={agent.id}
              className='cursor-pointer hover:shadow-md transition-shadow'
              onClick={() => handleOpenEdit(agent)}
            >
              <CardContent className='p-4 relative'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute top-2 right-2 h-8 w-8'
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAgent(agent.id);
                  }}
                >
                  <Trash2 className='h-4 w-4' />
                  <span className='sr-only'>Delete</span>
                </Button>

                <div className='flex items-center mb-2'>
                  <span className='text-3xl mr-2'>
                    {getAttitudeEmoji(agent.attitude)}
                  </span>
                  {result && (
                    <div className='flex items-center'>
                      <span className='mx-1'>→</span>
                      <span className='text-3xl'>
                        {getAttitudeEmoji(result.newAttitude)}
                      </span>
                      <span className='ml-1'>
                        {result.newAttitude > agent.attitude
                          ? '↑'
                          : result.newAttitude < agent.attitude
                          ? '↓'
                          : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className='space-y-1 mt-3'>
                  <p>
                    <span className='font-medium'>Age:</span> {agent.age}
                  </p>
                  <p>
                    <span className='font-medium'>Gender:</span> {agent.gender}
                  </p>
                  {agent.income && (
                    <p>
                      <span className='font-medium'>Income:</span>{' '}
                      {agent.income}
                    </p>
                  )}
                  {agent.education && (
                    <p>
                      <span className='font-medium'>Education:</span>{' '}
                      {agent.education}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {agents.length === 0 && (
          <div className='text-center py-8 text-muted-foreground'>
            No agents added yet. Click "Add Agent" to create one.
          </div>
        )}
      </div>

      {/* Add Agent Sheet */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent side='left' className='sm:max-w-md w-full'>
          <SheetHeader>
            <SheetTitle>Add New Agent</SheetTitle>
          </SheetHeader>
          <AgentForm
            onSubmit={(agent) => {
              onAddAgent(agent);
              setIsAddOpen(false);
            }}
            onCancel={() => setIsAddOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Edit Agent Sheet */}
      <Sheet
        open={!!editingAgent}
        onOpenChange={(open) => !open && handleCloseEdit()}
      >
        <SheetContent side='left' className='sm:max-w-md w-full'>
          <SheetHeader>
            <SheetTitle>Edit Agent</SheetTitle>
          </SheetHeader>
          {editingAgent && (
            <AgentForm
              agent={editingAgent}
              onSubmit={(agent) => {
                onUpdateAgent(agent);
                handleCloseEdit();
              }}
              onCancel={handleCloseEdit}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
