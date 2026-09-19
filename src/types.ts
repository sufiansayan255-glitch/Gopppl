export interface SentimentData {
  positive: number;
  neutral: number;
  critical: number;
  inquiries: number;
  explanation: string;
}

export interface DemandItem {
  demand: string;
  category: string;
  urgency: 'high' | 'medium' | 'low' | string;
}

export interface ActionItem {
  task: string;
  priority: 'high' | 'medium' | 'low' | string;
  target?: string;
}

export interface QuoteItem {
  speaker?: string;
  quote: string;
  context?: string;
}

export interface TopicTimelinePoint {
  segment: string;
  [topicKey: string]: string | number;
}

export interface CommonTopic {
  key: string;
  label: string;
  color: string;
  totalMentions: number;
}

export interface SummaryReport {
  executiveSummary: string; // Exactly 3 crisp sentences
  sentiment: SentimentData;
  sentimentToneLabel: string;
  topicTimeline?: TopicTimelinePoint[]; // 📈 TOPIC FREQUENCY OVER CONVERSATION LENGTH
  commonTopics?: CommonTopic[];
  topDemands: DemandItem[]; // 🔥 TOP DEMANDS & REQUESTS
  actionableNextSteps: {
    highPriority: ActionItem[];
    lowPriority: ActionItem[];
  };
  topUserQuotes: QuoteItem[]; // 💬 TOP USER QUOTES
  totalItemsAnalyzed: number;
  isHeuristic?: boolean;
  notice?: string;
  timestamp?: string;
}

export type SummaryMode = 'smart' | 'detailed' | 'bullet' | 'actions';
export type AppLanguage = 'ur' | 'en' | 'roman_ur';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
