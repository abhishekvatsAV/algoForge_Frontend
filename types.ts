

export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  id: string;
  input: string;
  expected: string;
}

export interface BackendProblem {
  id: number;
  createdById: number;
  isSolved: boolean;
  title: string;
  problemStatement: string;
  example_tc_input: string;
  example_tc_output: string;
  hidden_input: string;
  expected_output: string;
  difficultyLevel: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  timeLimit: string;
  memoryLimit: string;
  description: string;
  examples: Example[];
  testcases: TestCase[];
  templates: {
    cpp: string;
    js: string;
  };
  isSolved: boolean;
  createdAt?: string;
}

export type Language = 'cpp' | 'js';
