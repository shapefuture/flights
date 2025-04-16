import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Bookmark, Clock, Trash2 } from 'lucide-react';

interface SavedSearchesProps {
  searches: string[];
  onSelect: (search: string) => void;
  onDelete: (search: string) => void;
}

export function SavedSearches({ searches, onSelect, onDelete }: SavedSearchesProps) {
  if (searches.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg bg-gray-50/50">
        <Bookmark className="h-10 w-10 text-gray-400 mx-auto mb-2" />
        <h3 className="text-lg font-medium text-gray-500">No saved searches</h3>
        <p className="text-sm text-gray-400">
          Save your searches to quickly run them again later
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-700">Your Saved Searches</h3>
        <p className="text-sm text-gray-500">{searches.length} {searches.length === 1 ? 'search' : 'searches'} saved</p>
      </div>
      
      <div className="grid gap-3">
        {searches.map((search, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center text-gray-500 mb-1 text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Saved search #{index + 1}
                  </div>
                  <p className="text-sm font-medium truncate mb-1">{search}</p>
                </div>
                <div className="flex space-x-1 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                    onClick={() => onDelete(search)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-8"
                    onClick={() => onSelect(search)}
                  >
                    Run Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}