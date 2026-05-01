import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { IJsonModel, Layout, Model, TabNode } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import 'flexlayout-react/style/dark.css';
import { Problem, Language } from '../types';
import { DUMMY_PROBLEMS } from '../constants';
import { generateProblem, getLatestProblem, getAllProblems } from '../services/geminiService';
import Card from '../components/Card';
import Pill from '../components/Pill';
import Button from '../components/Button';
import { ProblemSkeleton } from '../components/SkeletonLoader';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

const BACKEND_URL = process.env.BACKEND_URL;

const PlaygroundPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, isAuthenticated, openLoginModal } = useAuth();
  const { theme } = useTheme();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGeneratePrompt, setShowGeneratePrompt] = useState(false);
  const [language, setLanguage] = useState<Language>('cpp');
  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [runOutput, setRunOutput] = useState('Click "Run" to see the output for your custom input here.');
  const [submissionResult, setSubmissionResult] = useState<{ status: 'Accepted' | 'Error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeConsoleView, setActiveConsoleView] = useState<'run' | 'submit'>('run');
  const layoutRef = useRef<Model | null>(null);

  if (!layoutRef.current) {
    const layoutConfig: IJsonModel = {
      global: {
        tabEnableClose: false,
        tabSetEnableMaximize: true,
      },
      layout: {
        type: 'row',
        weight: 100,
        children: [
          {
            type: 'tabset',
            weight: 38,
            children: [{ type: 'tab', name: 'Problem', component: 'problem' }],
          },
          {
            type: 'row',
            weight: 62,
            children: [
              {
                type: 'tabset',
                weight: 62,
                children: [{ type: 'tab', name: 'Code Editor', component: 'editor' }],
              },
              {
                type: 'tabset',
                weight: 38,
                children: [{ type: 'tab', name: 'Console', component: 'console' }],
              },
            ],
          },
        ],
      },
    };

    layoutRef.current = Model.fromJson(layoutConfig);
  }

  const handleGenerateProblem = useCallback(async () => {
    if (!isAuthenticated || !token) {
      openLoginModal();
      return;
    }
    setShowGeneratePrompt(false);
    setIsLoading(true);
    setProblem(null);
    setError(null);
    try {
      const newProblem = await generateProblem(token);
      setProblem(newProblem);
      navigate(`/playground/${newProblem.id.substring(2)}`, { replace: true });
    } catch (requestError) {
      console.error(requestError);
      setError('Failed to generate problem. Using a default problem.');
      setProblem(DUMMY_PROBLEMS[0]);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, isAuthenticated, openLoginModal, token]);

  useEffect(() => {
    const loadProblem = async () => {
      setIsLoading(true);
      setError(null);

      if (!isAuthenticated || !token) {
        const foundProblem = DUMMY_PROBLEMS.find((p) => p.id === id) || DUMMY_PROBLEMS[0];
        setProblem(foundProblem);
        if (id !== foundProblem.id) {
          navigate(`/playground/${foundProblem.id}`, { replace: true });
        }
        setIsLoading(false);
        return;
      }

      try {
        if (id) {
          const numericId = parseInt(id, 10);
          const allProblems = await getAllProblems(token);
          const foundProblem = allProblems.find((p) => p.id === `p_${numericId}`);

          if (foundProblem) {
            setProblem(foundProblem);
          } else {
            setError(`Problem with ID ${id} not found. Loading your latest problem instead.`);
            const latestProblem = await getLatestProblem(token);
            if (latestProblem) {
              setProblem(latestProblem);
              navigate(`/playground/${latestProblem.id.substring(2)}`, { replace: true });
            } else {
              setShowGeneratePrompt(true);
            }
          }
        } else {
          const latestProblem = await getLatestProblem(token);
          if (latestProblem) {
            setProblem(latestProblem);
            navigate(`/playground/${latestProblem.id.substring(2)}`, { replace: true });
          } else {
            setShowGeneratePrompt(true);
          }
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Failed to load problem.');
        setProblem(DUMMY_PROBLEMS[0]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProblem();
  }, [id, isAuthenticated, token, navigate]);

  useEffect(() => {
    if (problem) {
      setCode(problem.templates[language]);
      if (problem.examples && problem.examples.length > 0) {
        setCustomInput(problem.examples[0].input);
      } else {
        setCustomInput('');
      }
    }
  }, [problem, language]);

  const handleRunCode = useCallback(async () => {
    if (isProcessing) return;
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    setActiveConsoleView('run');
    setIsProcessing(true);
    setRunOutput('');

    try {
      const response = await fetch(`${BACKEND_URL}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code,
          input: customInput,
          language,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error
          ? `Error: ${result.error}\nDetails: ${result.details || 'No additional details.'}`
          : `HTTP Error: ${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
      }

      if (result.success) {
        setRunOutput(result.output);
      } else {
        const errorMsg = `Error: ${result.error}\nDetails: ${result.details || 'No additional details.'}`;
        setRunOutput(errorMsg);
      }
    } catch (requestError) {
      console.error('Failed to run code:', requestError);
      setRunOutput(
        `An error occurred while running the code.\nPlease check the browser console for more details.\nError: ${
          requestError instanceof Error ? requestError.message : 'Unknown error'
        }`
      );
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, isAuthenticated, openLoginModal, token, code, customInput, language]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const runShortcut = (event.ctrlKey || event.metaKey) && event.key === 'Enter';
      if (!runShortcut) return;
      event.preventDefault();
      handleRunCode();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRunCode]);

  const handleSubmitCode = async () => {
    if (isProcessing || !problem) return;
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    setActiveConsoleView('submit');
    setIsProcessing(true);
    setSubmissionResult(null);

    try {
      const problemId = problem.id.startsWith('p_') ? problem.id.substring(2) : problem.id;

      const response = await fetch(`${BACKEND_URL}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code,
          language,
          problemId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmissionResult({
          status: 'Accepted',
          message: 'Congratulations! Your solution was accepted.',
        });
        if (result.isSolved) {
          setProblem((previous) => (previous ? { ...previous, isSolved: true } : null));
        }
      } else {
        setSubmissionResult({
          status: 'Error',
          message: result.error || 'Submission failed. Please try again.',
        });
      }
    } catch (requestError) {
      console.error('Failed to submit code:', requestError);
      setSubmissionResult({
        status: 'Error',
        message: `An error occurred while submitting. Error: ${
          requestError instanceof Error ? requestError.message : 'Unknown error'
        }`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const editorLanguage = language === 'cpp' ? 'cpp' : 'javascript';

  const problemPanel = (
    <Card className="h-full overflow-y-auto">
      {isLoading && <ProblemSkeleton />}
      {!isLoading && error && (
        <div className="p-24 text-center text-light-danger dark:text-dark-danger">
          <h2 className="font-bold mb-8">Error</h2>
          <p>{error}</p>
        </div>
      )}
      {!isLoading && !error && problem && (
        <div className="p-24 space-y-24">
          <div>
            <div className="flex justify-between items-start mb-8 gap-16">
              <h1 className="text-xl font-bold">{problem.title}</h1>
              <Pill type="difficulty" value={problem.difficulty} />
            </div>
            <div className="flex flex-wrap gap-8">
              {problem.tags.map((tag) => <Pill key={tag} type="tag" value={tag} />)}
            </div>
          </div>
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary space-x-16">
            <span>Time: {problem.timeLimit}</span>
            <span>Memory: {problem.memoryLimit}</span>
          </div>
          <div className="text-sm leading-7 whitespace-pre-wrap text-light-text-secondary dark:text-dark-text-secondary">
            {problem.description}
          </div>

          {problem.examples.map((ex, i) => (
            <div key={i}>
              <h3 className="font-semibold mb-8 text-light-text-primary dark:text-dark-text-primary">Example {i + 1}:</h3>
              <div className="p-16 bg-light-surface-2 dark:bg-dark-surface-2 rounded-md font-mono text-xs space-y-8">
                <div>
                  <strong className="font-semibold block mb-4">Input:</strong>
                  <pre className="p-8 bg-light-bg dark:bg-dark-bg rounded-md whitespace-pre-wrap">{ex.input}</pre>
                </div>
                <div>
                  <strong className="font-semibold block mb-4">Output:</strong>
                  <pre className="p-8 bg-light-bg dark:bg-dark-bg rounded-md whitespace-pre-wrap">{ex.output}</pre>
                </div>
                {ex.explanation && (
                  <div>
                    <strong className="font-semibold block mb-4">Explanation:</strong>
                    <p className="whitespace-normal font-sans">{ex.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {!isAuthenticated && (
            <div className="!mt-32 p-16 bg-light-surface-2 dark:bg-dark-surface-2 rounded-md text-center text-sm">
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                <button onClick={openLoginModal} className="text-light-accent dark:text-dark-accent font-semibold hover:underline">
                  Log in
                </button>{' '}
                to track your progress.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-16">
            <Button onClick={handleGenerateProblem}>Generate New</Button>
            <div className="relative inline-block" title={!isAuthenticated ? 'Log in to save your code' : 'Save code'}>
              <Button variant="secondary" disabled={!isAuthenticated}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );

  const editorPanel = (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between p-8 border-b border-light-border dark:border-dark-border flex-shrink-0">
        <div className="flex items-center gap-8">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent rounded-md text-sm p-8 focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent"
            aria-label="Select language"
          >
            <option value="js">JavaScript</option>
            <option value="cpp">C++</option>
          </select>
          <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary hidden md:inline">
            Ctrl/Cmd + Enter to run
          </span>
        </div>
        <div className="flex items-center gap-8">
          <Button variant="secondary" size="sm" aria-label="Run code (Ctrl+Enter)" onClick={handleRunCode} disabled={isProcessing}>
            {isProcessing && activeConsoleView === 'run' ? 'Running...' : 'Run'}
          </Button>
          <Button size="sm" aria-label="Submit solution" onClick={handleSubmitCode} disabled={isProcessing}>
            {isProcessing && activeConsoleView === 'submit' ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          language={editorLanguage}
          value={code}
          onChange={(value) => setCode(value ?? '')}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            automaticLayout: true,
            tabSize: 2,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 14, bottom: 14 },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            tabCompletion: 'on',
          }}
        />
      </div>
    </Card>
  );

  const consolePanel = (
    <Card className="h-full flex flex-col">
      <div className="flex items-center justify-between p-8 border-b border-light-border dark:border-dark-border">
        <h3 className="text-sm font-semibold">Console</h3>
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveConsoleView('run')}
            className={`px-12 py-4 text-xs rounded-md border ${
              activeConsoleView === 'run'
                ? 'border-light-accent text-light-accent dark:border-dark-accent dark:text-dark-accent'
                : 'border-light-border text-light-text-secondary dark:border-dark-border dark:text-dark-text-secondary'
            }`}
          >
            Run
          </button>
          <button
            onClick={() => setActiveConsoleView('submit')}
            className={`px-12 py-4 text-xs rounded-md border ${
              activeConsoleView === 'submit'
                ? 'border-light-accent text-light-accent dark:border-dark-accent dark:text-dark-accent'
                : 'border-light-border text-light-text-secondary dark:border-dark-border dark:text-dark-text-secondary'
            }`}
          >
            Submit
          </button>
        </div>
      </div>
      <div className="flex-grow flex flex-col overflow-y-auto">
        {activeConsoleView === 'run' ? (
          <>
            <div className="flex flex-col p-16 border-b border-light-border dark:border-dark-border min-h-[120px]">
              <h4 className="text-xs font-semibold mb-8 text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                Custom Input
              </h4>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="w-full h-full bg-light-surface dark:bg-dark-surface font-mono text-sm resize-none outline-none focus:outline-none leading-relaxed text-light-text-primary dark:text-dark-text-primary rounded-md p-8"
                spellCheck="false"
                placeholder="Enter your test cases here..."
              />
            </div>
            <div className="flex-grow flex flex-col p-16 overflow-y-auto">
              <h4 className="text-xs font-semibold mb-8 text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Output</h4>
              {isProcessing ? (
                <div className="flex items-center gap-8 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-light-accent dark:border-dark-accent"></div>
                  <span>Running...</span>
                </div>
              ) : (
                <pre className="font-mono text-sm whitespace-pre-wrap text-light-text-secondary dark:text-dark-text-secondary">{runOutput}</pre>
              )}
            </div>
          </>
        ) : (
          <div className="p-16">
            {isProcessing ? (
              <div className="flex items-center gap-8 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-light-accent dark:border-dark-accent"></div>
                <span>Submitting against hidden test cases...</span>
              </div>
            ) : submissionResult ? (
              <div
                className={`p-16 rounded-md ${
                  submissionResult.status === 'Accepted'
                    ? 'bg-green-100 dark:bg-green-900/50 border border-green-200 dark:border-green-800'
                    : 'bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800'
                }`}
              >
                <h3
                  className={`text-lg font-bold ${
                    submissionResult.status === 'Accepted' ? 'text-light-success dark:text-dark-success' : 'text-light-danger dark:text-dark-danger'
                  }`}
                >
                  {submissionResult.status === 'Accepted' ? 'Accepted' : 'Submission Failed'}
                </h3>
                <p className="mt-8 text-sm text-light-text-secondary dark:text-dark-text-secondary">{submissionResult.message}</p>
              </div>
            ) : (
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Submit your code to see the results against hidden test cases.
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  const layoutFactory = useCallback(
    (node: TabNode) => {
      const component = node.getComponent();
      if (component === 'problem') return problemPanel;
      if (component === 'editor') return editorPanel;
      if (component === 'console') return consolePanel;
      return <div />;
    },
    [problemPanel, editorPanel, consolePanel]
  );

  const layoutThemeClass = useMemo(
    () => (theme === 'dark' ? 'flexlayout__theme_dark' : 'flexlayout__theme_light'),
    [theme]
  );

  const GenerateProblemModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-light-surface dark:bg-dark-surface rounded-md shadow-soft dark:shadow-soft-dark p-32 text-center animate-scale-in">
        <h2 className="text-xl font-bold mb-16">Welcome to the Playground!</h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-24 max-w-sm">
          It looks like you don't have any generated problems yet. Let's create one for you.
        </p>
        <Button onClick={handleGenerateProblem}>Generate Your First Problem</Button>
      </div>
    </div>
  );

  return (
    <>
      {showGeneratePrompt && <GenerateProblemModal />}
      <div className="h-[calc(100vh-64px)] p-16">
        <Layout model={layoutRef.current} factory={layoutFactory} className={layoutThemeClass} />
      </div>
    </>
  );
};

export default PlaygroundPage;
