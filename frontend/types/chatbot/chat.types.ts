export interface Message {
  id: number | string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sql_query?: string;
  //data?: any[];
  visualization_type?: string;
  visualization?: string;
  source?: 'database' | 'web' | 'error';
  search_results?: Array<{
    title: string;
    snippet: string;
    url: string;
  }>;
  columns?: Array<{
    key: string;
    label: string;
    type: string;
  }>;
  row_count?: number;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
}

export interface ConversationResponse {
  success: boolean;
  conversation_id?: string;
  answer?: string;
  sql_query?: string;
  //data?: any[];
  //columns?: any[];
  row_count?: number;
  visualization_type?: string;
  visualization?: string;
  source?: 'database' | 'web' | 'error';
  search_results?: Array<{
    title: string;
    snippet: string;
    url: string;
  }>;
  timestamp?: string;
  error?: string;
}