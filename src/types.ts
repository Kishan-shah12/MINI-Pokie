import { ReactNode, ComponentType } from "react";

export type PokieCategory = "all" | "tools" | "games" | "ai" | "favorites";
export type AppCategory = "tools" | "games" | "ai";

export interface PokieApp {
  id: string;
  title: string;
  shortDesc?: string;
  description: string;
  category: "tools" | "games" | "ai";
  subcategory?: string;
  icon?: string;
  iconName?: string;
  tags: string[];
  badge?: "Popular" | "New" | "AI-Powered" | "Classic" | "Featured" | "Offline" | "Essential" | "Hot" | "Secure" | "AI Powered";
  featured?: boolean;
  accentColor?: string;
  component: ComponentType<any>;
}

export interface UserPreferences {
  favorites: string[];
  recentApps: string[];
  theme: "light" | "dark" | "system";
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizSet {
  topic: string;
  difficulty?: string;
  questions: QuizQuestion[];
}
