import { Search, SlidersHorizontal } from "lucide-react";

interface EmailSearchProps {
  value: string;
  onChange: (value: string) => void;
}

const EmailSearch = ({ value, onChange }: EmailSearchProps) => (
  <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
    <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
      <Search size={16} className="text-muted-foreground" />
      <input
        type="text"
        placeholder="Search all inboxes..."
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
    <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
      <SlidersHorizontal size={16} />
    </button>
  </div>
);

export default EmailSearch;
