export interface Snippet {
  _id: string;
  title: string;
  code: string;
  programmingLanguage: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string | Date;
  folder: string | null;
}

export interface SnippetValidation {
  title: { isValid: boolean; message?: string };
  code: { isValid: boolean; message?: string };
  description: { isValid: boolean; message?: string };
}

export type SortOption = 'newest' | 'oldest' | 'title';

export interface Notification {
  message: string;
  type: 'success' | 'error';
}

export interface EditorOptions {
  minimap: { enabled: boolean };
  fontSize: number;
  lineNumbers: 'on' | 'off';
  roundedSelection: boolean;
  scrollBeyondLastLine: boolean;
  readOnly: boolean;
  automaticLayout: boolean;
  scrollbar: {
    vertical: 'visible' | 'hidden';
    horizontal: 'visible' | 'hidden';
    useShadows: boolean;
    verticalScrollbarSize: number;
    horizontalScrollbarSize: number;
  };
  renderWhitespace: 'none' | 'all';
  wordWrap: 'on' | 'off';
  folding: boolean;
  contextmenu: boolean;
  mouseWheelZoom: boolean;
  smoothScrolling: boolean;
  quickSuggestions: boolean;
  suggestOnTriggerCharacters: boolean;
  acceptSuggestionOnEnter: 'on' | 'off';
  tabCompletion: 'on' | 'off';
  wordBasedSuggestions: 'on' | 'off';
  parameterHints: {
    enabled: boolean;
  };
} 