import { useState } from "react";
import { Search, SlidersHorizontal, X, Paperclip } from "lucide-react";
import { providers, type EmailProvider } from "@/data/mockEmails";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface SearchFilters {
  provider: EmailProvider | 'all';
  hasAttachment: boolean | null;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

interface EmailSearchProps {
  value: string;
  onChange: (value: string) => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

const defaultFilters: SearchFilters = {
  provider: 'all',
  hasAttachment: null,
  dateFrom: undefined,
  dateTo: undefined,
};

const EmailSearch = ({ value, onChange, filters, onFiltersChange }: EmailSearchProps) => {
  const [open, setOpen] = useState(false);

  const activeFilterCount = [
    filters.provider !== 'all',
    filters.hasAttachment !== null,
    filters.dateFrom != null,
    filters.dateTo != null,
  ].filter(Boolean).length;

  const connectedProviders = providers.filter(p => p.connected);

  return (
    <div className="border-b border-border">
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <Search size={16} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search all inboxes..."
            value={value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {value && (
            <button onClick={() => onChange('')} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <SlidersHorizontal size={16} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold">Filters</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => onFiltersChange(defaultFilters)}
              >
                Clear all
              </Button>
            </div>

            {/* Provider filter */}
            <div className="p-3 border-b border-border">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Provider</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onFiltersChange({ ...filters, provider: 'all' })}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition-colors",
                    filters.provider === 'all'
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  All
                </button>
                {connectedProviders.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onFiltersChange({ ...filters, provider: p.id })}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border transition-colors",
                      filters.provider === p.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    {p.icon} {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Attachment filter */}
            <div className="p-3 border-b border-border">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Attachments</label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="attachment-filter"
                  checked={filters.hasAttachment === true}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ ...filters, hasAttachment: checked ? true : null })
                  }
                />
                <label htmlFor="attachment-filter" className="text-sm flex items-center gap-1.5 cursor-pointer">
                  <Paperclip size={13} className="text-muted-foreground" />
                  Has attachment
                </label>
              </div>
            </div>

            {/* Date range */}
            <div className="p-3">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Date range</label>
              <div className="flex gap-2 mb-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-8 justify-start font-normal">
                      {filters.dateFrom ? format(filters.dateFrom, "MMM d") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(d) => onFiltersChange({ ...filters, dateFrom: d })}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-8 justify-start font-normal">
                      {filters.dateTo ? format(filters.dateTo, "MMM d") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(d) => onFiltersChange({ ...filters, dateTo: d })}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {(filters.dateFrom || filters.dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => onFiltersChange({ ...filters, dateFrom: undefined, dateTo: undefined })}
                >
                  Clear dates
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {filters.provider !== 'all' && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary rounded-full px-2 py-0.5">
              {providers.find(p => p.id === filters.provider)?.name}
              <button onClick={() => onFiltersChange({ ...filters, provider: 'all' })}><X size={10} /></button>
            </span>
          )}
          {filters.hasAttachment && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary rounded-full px-2 py-0.5">
              Has attachment
              <button onClick={() => onFiltersChange({ ...filters, hasAttachment: null })}><X size={10} /></button>
            </span>
          )}
          {filters.dateFrom && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary rounded-full px-2 py-0.5">
              From {format(filters.dateFrom, "MMM d")}
              <button onClick={() => onFiltersChange({ ...filters, dateFrom: undefined })}><X size={10} /></button>
            </span>
          )}
          {filters.dateTo && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary rounded-full px-2 py-0.5">
              To {format(filters.dateTo, "MMM d")}
              <button onClick={() => onFiltersChange({ ...filters, dateTo: undefined })}><X size={10} /></button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export { defaultFilters };
export default EmailSearch;
