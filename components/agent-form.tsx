'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Agent } from '@/lib/types';
import { generateAgentProfile } from '@/lib/ai-utils';

const formSchema = z.object({
  age: z.coerce
    .number()
    .min(1, 'Age must be at least 1')
    .max(120, 'Age must be less than 120'),
  gender: z.string().min(1, 'Gender is required'),
  attitude: z.coerce.number().min(-1).max(1),
  income: z.string().optional(),
  education: z.string().optional(),
  traits: z.string().optional(),
});

interface AgentFormProps {
  agent?: Agent;
  onSubmit: (agent: Agent) => void;
  onCancel: () => void;
}

export function AgentForm({ agent, onSubmit, onCancel }: AgentFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: agent
      ? {
          age: agent.age,
          gender: agent.gender,
          attitude: agent.attitude,
          income: agent.income || '',
          education: agent.education || '',
          traits: agent.traits || '',
        }
      : {
          age: undefined,
          gender: '',
          attitude: 0,
          income: '',
          education: '',
          traits: '',
        },
  });

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    try {
      const age = form.getValues('age');
      const gender = form.getValues('gender');

      if (!age || !gender) {
        form.setError('age', { message: 'Age is required for AI generation' });
        form.setError('gender', {
          message: 'Gender is required for AI generation',
        });
        return;
      }

      const profile = await generateAgentProfile(age, gender);

      form.setValue('income', profile.income);
      form.setValue('education', profile.education);
      form.setValue('attitude', profile.attitude);
      form.setValue('traits', profile.traits);
    } catch (error) {
      console.error('Error generating profile:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      id: agent?.id || '',
      age: values.age,
      gender: values.gender,
      attitude: values.attitude,
      income: values.income || undefined,
      education: values.education || undefined,
      traits: values.traits || undefined,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className='space-y-6 mt-6'
      >
        <FormField
          control={form.control}
          name='age'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age *</FormLabel>
              <FormControl>
                <Input type='number' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='gender'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select gender' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='Male'>Male</SelectItem>
                  <SelectItem value='Female'>Female</SelectItem>
                  <SelectItem value='Non-binary'>Non-binary</SelectItem>
                  <SelectItem value='Other'>Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='attitude'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Vaccine Attitude *</FormLabel>
              <Select
                onValueChange={(value) =>
                  field.onChange(Number.parseInt(value))
                }
                defaultValue={field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select attitude'>
                      {field.value === -1 && '😠 Resistant'}
                      {field.value === 0 && '😐 Neutral'}
                      {field.value === 1 && '🙂 Likely'}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='-1'>😠 Resistant</SelectItem>
                  <SelectItem value='0'>😐 Neutral</SelectItem>
                  <SelectItem value='1'>🙂 Likely</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='income'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Income Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select income level' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='Low'>Low</SelectItem>
                  <SelectItem value='Middle'>Middle</SelectItem>
                  <SelectItem value='High'>High</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='education'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Education</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select education level' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='High School'>High School</SelectItem>
                  <SelectItem value="Bachelor's">Bachelor's</SelectItem>
                  <SelectItem value="Master's">Master's</SelectItem>
                  <SelectItem value='PhD'>PhD</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='traits'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Personality Traits</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder='e.g., cautious, analytical, trusting'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type='button'
          variant='outline'
          onClick={handleGenerateWithAI}
          disabled={isGenerating}
          className='w-full'
        >
          {isGenerating ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Generating...
            </>
          ) : (
            'Generate with AI'
          )}
        </Button>

        <div className='flex justify-end space-x-2 pt-4'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='submit'>{agent ? 'Update' : 'Add'} Agent</Button>
        </div>
      </form>
    </Form>
  );
}
