export interface TimerItem {
  id: string;
  name: string;
  duration: number; // in seconds
  order: number;
  isPause?: boolean; // true if this is a pause/break timer
}

export interface Message {
  id: string;
  text: string;
  createdAt: number;
}

export interface AgendaState {
  items: TimerItem[];
  currentItemId: string | null;
  currentTimeLeft: number;
  isRunning: boolean;
  message: string | null;
}
