'use client';

import { useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { Trash2, MoreHorizontal, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { NewsForm } from '@/components/news-form';
import type { News } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NewsPanelProps {
  news: News[];
  onAddNews: (news: News) => void;
  onUpdateNews: (news: News) => void;
  onDeleteNews: (newsId: string) => void;
  onReorderNews: (reorderedNews: News[]) => void;
}

export function NewsPanel({
  news,
  onAddNews,
  onUpdateNews,
  onDeleteNews,
  onReorderNews,
}: NewsPanelProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [viewingNews, setViewingNews] = useState<News | null>(null);
  const [filters, setFilters] = useState({
    truthfulness: {
      True: true,
      Fake: true,
      Neutral: true,
    } as Record<string, boolean>,
    sentiment: {
      'Pro-vaccine': true,
      'Anti-vaccine': true,
      'Fear-based': true,
      Neutral: true,
    } as Record<string, boolean>,
  });

  const handleOpenEdit = (newsItem: News) => {
    setEditingNews(newsItem);
  };

  const handleCloseEdit = () => {
    setEditingNews(null);
  };

  const handleOpenView = (newsItem: News) => {
    setViewingNews(newsItem);
  };

  const handleCloseView = () => {
    setViewingNews(null);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(news);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorderNews(items);
  };

  const getTruthfulnessBadgeColor = (truthfulness: string) => {
    switch (truthfulness) {
      case 'True':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'Fake':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getSentimentBadgeColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Pro-vaccine':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'Anti-vaccine':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'Fear-based':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'Neutral':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const filteredNews = news.filter(
    (item) =>
      filters.truthfulness[item.truthfulness] &&
      filters.sentiment[item.sentiment]
  );

  return (
    <div className='flex flex-col h-full'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-semibold'>News</h2>
        <div className='flex gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='icon'>
                <Filter className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56'>
              <div className='px-2 py-1.5 text-sm font-semibold'>
                Truthfulness
              </div>
              {Object.entries(filters.truthfulness).map(([key, value]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={value}
                  onCheckedChange={(checked) => {
                    setFilters((prev) => ({
                      ...prev,
                      truthfulness: {
                        ...prev.truthfulness,
                        [key]: checked,
                      },
                    }));
                  }}
                >
                  {key}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <div className='px-2 py-1.5 text-sm font-semibold'>Sentiment</div>
              {Object.entries(filters.sentiment).map(([key, value]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={value}
                  onCheckedChange={(checked) => {
                    setFilters((prev) => ({
                      ...prev,
                      sentiment: {
                        ...prev.sentiment,
                        [key]: checked,
                      },
                    }));
                  }}
                >
                  {key}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setIsAddOpen(true)}>+ Add News</Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId='news-list'>
          {(provided) => (
            <div
              className='flex-1 overflow-auto space-y-4'
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {filteredNews.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <Card className='cursor-pointer hover:shadow-md transition-shadow'>
                        <CardContent className='p-4 relative'>
                          <div className='flex justify-between items-start'>
                            <h3
                              className='font-bold text-lg mb-2 pr-8'
                              onClick={() => handleOpenView(item)}
                            >
                              {item.title}
                            </h3>
                            <div className='flex space-x-1'>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                                onClick={() => handleOpenEdit(item)}
                              >
                                <MoreHorizontal className='h-4 w-4' />
                                <span className='sr-only'>Edit</span>
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                                onClick={() => onDeleteNews(item.id)}
                              >
                                <Trash2 className='h-4 w-4' />
                                <span className='sr-only'>Delete</span>
                              </Button>
                            </div>
                          </div>

                          <div className='flex flex-wrap gap-2 mt-2'>
                            <Badge
                              variant='outline'
                              className={cn(
                                getTruthfulnessBadgeColor(item.truthfulness)
                              )}
                            >
                              {item.truthfulness}
                            </Badge>
                            <Badge
                              variant='outline'
                              className={cn(
                                getSentimentBadgeColor(item.sentiment)
                              )}
                            >
                              {item.sentiment}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {filteredNews.length === 0 && (
                <div className='text-center py-8 text-muted-foreground'>
                  {news.length === 0
                    ? 'No news added yet. Click "Add News" to create one.'
                    : 'No news matches the current filters.'}
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add News Sheet */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent className='sm:max-w-md w-full'>
          <SheetHeader>
            <SheetTitle>Add News</SheetTitle>
          </SheetHeader>
          <NewsForm
            onSubmit={(newsItem) => {
              onAddNews(newsItem);
              setIsAddOpen(false);
            }}
            onCancel={() => setIsAddOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Edit News Sheet */}
      <Sheet
        open={!!editingNews}
        onOpenChange={(open) => !open && handleCloseEdit()}
      >
        <SheetContent className='sm:max-w-md w-full'>
          <SheetHeader>
            <SheetTitle>Edit News</SheetTitle>
          </SheetHeader>
          {editingNews && (
            <NewsForm
              news={editingNews}
              onSubmit={(newsItem) => {
                onUpdateNews(newsItem);
                handleCloseEdit();
              }}
              onCancel={handleCloseEdit}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* View News Sheet */}
      <Sheet
        open={!!viewingNews}
        onOpenChange={(open) => !open && handleCloseView()}
      >
        <SheetContent className='sm:max-w-md w-full'>
          <SheetHeader>
            <SheetTitle>{viewingNews?.title}</SheetTitle>
          </SheetHeader>
          {viewingNews && (
            <div className='mt-6 space-y-4'>
              <div className='flex flex-wrap gap-2'>
                <Badge
                  variant='outline'
                  className={cn(
                    getTruthfulnessBadgeColor(viewingNews.truthfulness)
                  )}
                >
                  {viewingNews.truthfulness}
                </Badge>
                <Badge
                  variant='outline'
                  className={cn(getSentimentBadgeColor(viewingNews.sentiment))}
                >
                  {viewingNews.sentiment}
                </Badge>
              </div>

              <div className='space-y-2'>
                <h4 className='font-medium'>Content:</h4>
                <p className='text-sm'>
                  {viewingNews.content || 'No content provided.'}
                </p>
              </div>

              {viewingNews.source && (
                <div className='space-y-1'>
                  <h4 className='font-medium'>Source:</h4>
                  <p className='text-sm'>{viewingNews.source}</p>
                </div>
              )}

              <div className='pt-4'>
                <Button onClick={handleCloseView} className='w-full'>
                  Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
