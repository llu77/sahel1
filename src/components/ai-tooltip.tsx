"use client";

import { useState } from 'react';
import { Info, LoaderCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { generateTooltip, type TooltipInput } from '@/ai/flows/reasoning-based-tooltips';

interface AITooltipProps {
  field: string;
  requestType: string;
}

export function AITooltip({ field, requestType }: AITooltipProps) {
  const [tooltipText, setTooltipText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && !tooltipText && !isLoading && requestType) {
      setIsLoading(true);
      try {
        const input: TooltipInput = { field, requestType };
        const result = await generateTooltip(input);
        setTooltipText(result.tooltipText);
      } catch (error) {
        console.error('Failed to generate tooltip:', error);
        setTooltipText('لا يمكن تحميل الإرشادات. يرجى المحاولة مرة أخرى.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button type="button" className="mr-1.5 text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-full">
          <Info className="h-4 w-4" />
          <span className="sr-only">عرض معلومات لـ {field}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm font-body" side="top" align="center">
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
            <span>جاري إنشاء الإرشادات...</span>
          </div>
        ) : (
          <p>{tooltipText}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
