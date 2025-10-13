import { Problem, Difficulty, Example, TestCase, BackendProblem } from "../types";
// import { BACKEND_URL } from '../config';
const BACKEND_URL = process.env.BACKEND_URL;
import { cppTemplate, jsTemplate } from "../constants";

export const transformBackendProblem = (backendProblem: BackendProblem): Problem => {
  const example: Example = {
    input: backendProblem.example_tc_input,
    output: backendProblem.example_tc_output,
  };

  const testcases: TestCase[] = [
    {
      id: "t1",
      input: backendProblem.example_tc_input,
      expected: backendProblem.example_tc_output,
    },
  ];

  const difficulty = (Object.values(Difficulty) as string[]).includes(backendProblem.difficultyLevel)
    ? (backendProblem.difficultyLevel as Difficulty)
    : Difficulty.Medium;

  return {
    id: `p_${backendProblem.id}`,
    title: backendProblem.title,
    difficulty: difficulty,
    tags: backendProblem.tags || [],
    timeLimit: "1s",
    memoryLimit: "256MB",
    description: backendProblem.problemStatement,
    examples: [example],
    testcases: testcases,
    templates: {
      cpp: cppTemplate,
      js: jsTemplate,
    },
    isSolved: backendProblem.isSolved,
    createdAt: backendProblem.createdAt,
  };
};

export const generateProblem = async (token: string): Promise<Problem> => {
  if (!token) {
    throw new Error("Authentication token is required to generate a problem.");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/generate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) {
        // Ignore if response is not JSON
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const backendProblem = data.problem;

    if (!backendProblem || !backendProblem.id || !backendProblem.title || !backendProblem.problemStatement) {
      throw new Error("Invalid response structure from the server.");
    }

    return transformBackendProblem(backendProblem);
  } catch (error) {
    console.error("Error generating problem from backend:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred while generating a new problem.");
  }
};

export const getAllProblems = async (token: string): Promise<Problem[]> => {
  if (!token) {
    throw new Error("Authentication token is required to view problems.");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/problem/allproblems`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.problems || !Array.isArray(data.problems)) {
      throw new Error("Invalid response structure from the server for all problems.");
    }

    return data.problems.map(transformBackendProblem);
  } catch (error) {
    console.error("Error fetching all problems:", error);
    throw error;
  }
};

export const getLatestProblem = async (token: string): Promise<Problem | null> => {
  if (!token) {
    throw new Error("Authentication token is required.");
  }

  try {
    const response = await fetch(`${BACKEND_URL}/problem/getlatestproblem`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      return null; // No problem found for user, which is a valid case.
    }

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.problem) {
      return null;
    }

    return transformBackendProblem(data.problem);
  } catch (error) {
    console.error("Error fetching latest problem:", error);
    throw error;
  }
};

export const getLatest3Problems = async (token: string): Promise<Problem[]> => {
  if (!token) {
    return [];
  }

  try {
    const response = await fetch(`${BACKEND_URL}/problem/getlatest3`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.problems || !Array.isArray(data.problems)) {
      throw new Error("Invalid response structure from the server for latest 3 problems.");
    }

    return data.problems.map(transformBackendProblem);
  } catch (error) {
    console.error("Error fetching latest 3 problems:", error);
    throw error;
  }
};

export const deleteProblem = async (problemId: number, token: string): Promise<void> => {
  if (!token) {
    throw new Error("Authentication is required.");
  }

  const response = await fetch(`${BACKEND_URL}/problem/deleteproblem`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: problemId }),
  });

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorMsg;
    } catch (e) {
      errorMsg = `${errorMsg}: ${response.statusText}`;
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  if (!data.isSuccess) {
    throw new Error(data.message || "The server reported an error but provided no message.");
  }
};
