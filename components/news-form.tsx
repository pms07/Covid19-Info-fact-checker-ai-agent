'use client';

import { useForm } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { News } from '@/lib/types';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  truthfulness: z.string().min(1, 'Truthfulness is required'),
  sentiment: z.string().min(1, 'Sentiment is required'),
  content: z.string().optional(),
  source: z.string().optional(),
});

interface NewsFormProps {
  news?: News;
  onSubmit: (news: News) => void;
  onCancel: () => void;
}

export function NewsForm({ news, onSubmit, onCancel }: NewsFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: news
      ? {
          title: news.title,
          truthfulness: news.truthfulness,
          sentiment: news.sentiment,
          content: news.content || '',
          source: news.source || '',
        }
      : {
          title: '',
          truthfulness: '',
          sentiment: '',
          content: '',
          source: '',
        },
  });

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      id: news?.id || '',
      title: values.title,
      truthfulness: values.truthfulness,
      sentiment: values.sentiment,
      content: values.content || undefined,
      source: values.source || undefined,
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
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>News Title *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='truthfulness'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Truthfulness *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select truthfulness' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='True'>True</SelectItem>
                  <SelectItem value='Fake'>Fake</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='sentiment'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sentiment *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select sentiment' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='Pro-vaccine'>Pro-vaccine</SelectItem>
                  <SelectItem value='Anti-vaccine'>Anti-vaccine</SelectItem>
                  <SelectItem value='Fear-based'>Fear-based</SelectItem>
                  <SelectItem value='Neutral'>Neutral</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='content'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder='Enter news content here...'
                  className='min-h-[100px]'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='source'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source</FormLabel>
              <FormControl>
                <Input {...field} placeholder='e.g., CDC, News Website, etc.' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex justify-end space-x-2 pt-4'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='submit'>{news ? 'Update' : 'Add'} News</Button>
        </div>
      </form>
    </Form>
  );
}
