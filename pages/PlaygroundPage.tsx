import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Problem, Language } from '../types';
import { DUMMY_PROBLEMS } from '../constants';
import { generateProblem, getLatestProblem, getAllProblems } from '../services/geminiService';
import Card from '../components/Card';
import Pill from '../components/Pill';
import Button from '../components/Button';
import { ProblemSkeleton } from '../components/SkeletonLoader';
import { useAuth } from '../hooks/useAuth';
// import { BACKEND_URL } from '../config';
const BACKEND_URL = process.env.BACKEND_URL;

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
);

const PlaygroundPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, isAuthenticated, openLoginModal } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGeneratePrompt, setShowGeneratePrompt] = useState(false);
  const [language, setLanguage] = useState<Language>('cpp');
  const [code, setCode] = useState('');

  // Console state
  const [customInput, setCustomInput] = useState('');
  const [runOutput, setRunOutput] = useState('Click "Run" to see the output for your custom input here.');
  const [submissionResult, setSubmissionResult] = useState<{ status: 'Accepted' | 'Error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeConsoleView, setActiveConsoleView] = useState<'run' | 'submit'>('run');

  // Resizable panel state
  const containerRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(420);
  const [editorPanelHeight, setEditorPanelHeight] = useState(400);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const lastEditorHeight = useRef(editorPanelHeight);

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
    } catch (error) {
      console.error(error);
      setError("Failed to generate problem. Using a default problem.");
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
        // Guest mode: Use dummy data
        const foundProblem = DUMMY_PROBLEMS.find(p => p.id === id) || DUMMY_PROBLEMS[0];
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
          const foundProblem = allProblems.find(p => p.id === `p_${numericId}`);

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
          // No ID in URL, fetch the latest problem for the user
          const latestProblem = await getLatestProblem(token);
          if (latestProblem) {
            setProblem(latestProblem);
            navigate(`/playground/${latestProblem.id.substring(2)}`, { replace: true });
          } else {
            // No problems exist for this user, prompt to generate one
            setShowGeneratePrompt(true);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load problem.");
        setProblem(DUMMY_PROBLEMS[0]); // Fallback
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

  // --- Resizing Logic ---
  const handleHorizontalMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingHorizontal || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - rect.left;
    const minWidth = 360;
    const maxWidth = rect.width - 300; // Min width for right panel
    setLeftPanelWidth(Math.max(minWidth, Math.min(newWidth, maxWidth)));
  }, [isDraggingHorizontal]);

  const handleVerticalMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingVertical || !rightColumnRef.current) return;
    const rect = rightColumnRef.current.getBoundingClientRect();
    const newHeight = e.clientY - rect.top;
    const minHeight = 100; // Min height for editor
    const maxHeight = rect.height - 100; // Min height for console
    const finalHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
    setEditorPanelHeight(finalHeight);
    setIsConsoleOpen(true); // Dragging always opens the console
    lastEditorHeight.current = finalHeight;
  }, [isDraggingVertical]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingHorizontal(false);
    setIsDraggingVertical(false);
  }, []);

  useEffect(() => {
    if (isDraggingHorizontal) {
      document.addEventListener('mousemove', handleHorizontalMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else if (isDraggingVertical) {
      document.addEventListener('mousemove', handleVerticalMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleHorizontalMouseMove);
      document.removeEventListener('mousemove', handleVerticalMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHorizontal, isDraggingVertical, handleHorizontalMouseMove, handleVerticalMouseMove, handleMouseUp]);

  const toggleConsole = () => {
    const isCurrentlyOpen = isConsoleOpen;
    setIsConsoleOpen(!isCurrentlyOpen);
    if (isCurrentlyOpen) {
      lastEditorHeight.current = editorPanelHeight;
      if (rightColumnRef.current) {
        const containerHeight = rightColumnRef.current.offsetHeight;
        setEditorPanelHeight(containerHeight - 48);
      }
    } else {
      setEditorPanelHeight(lastEditorHeight.current < 100 ? 400 : lastEditorHeight.current);
    }
  };

  const handleRunCode = async () => {
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: code,
          input: customInput,
          language: language,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error ? `Error: ${result.error}\nDetails: ${result.details || 'No additional details.'}` : `HTTP Error: ${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
      }

      if (result.success) {
        setRunOutput(result.output);
      } else {
        const errorMsg = `Error: ${result.error}\nDetails: ${result.details || 'No additional details.'}`;
        setRunOutput(errorMsg);
      }
    } catch (error) {
      console.error('Failed to run code:', error);
      setRunOutput(`An error occurred while running the code.\nPlease check the browser console for more details.\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: code,
          language: language,
          problemId: problemId
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmissionResult({
          status: 'Accepted',
          message: 'Congratulations! Your solution was accepted.'
        });
        if (result.isSolved) {
          setProblem(p => p ? { ...p, isSolved: true } : null);
        }
      } else {
        setSubmissionResult({
          status: 'Error',
          message: result.error || 'Submission failed. Please try again.'
        });
      }

    } catch (error) {
      console.error('Failed to submit code:', error);
      setSubmissionResult({
        status: 'Error',
        message: `An error occurred while submitting. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const GenerateProblemModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-light-surface dark:bg-dark-surface rounded-md shadow-soft dark:shadow-soft-dark p-32 text-center animate-scale-in">
        <h2 className="text-xl font-bold mb-16">Welcome to the Playground!</h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-24 max-w-sm">
          It looks like you don't have any generated problems yet.
          Let's create one for you.
        </p>
        <Button onClick={handleGenerateProblem}>Generate Your First Problem</Button>
      </div>
    </div>
  );

  return (
    <>
      {showGeneratePrompt && <GenerateProblemModal />}
      <div ref={containerRef} className="h-[calc(100vh-64px)] flex p-16">
        <div style={{ width: `${leftPanelWidth}px` }} className="flex-shrink-0 h-full">
          <Card className="flex flex-col h-full overflow-y-auto">
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
                  <div className="flex justify-between items-start mb-8">
                    <h1 className="text-xl font-bold">{problem.title}</h1>
                    <Pill type="difficulty" value={problem.difficulty} />
                  </div>
                  <div className="flex flex-wrap gap-8">
                    {problem.tags.map(tag => <Pill key={tag} type="tag" value={tag} />)}
                  </div>
                </div>
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary space-x-16">
                  <span>Time: {problem.timeLimit}</span>
                  <span>Memory: {problem.memoryLimit}</span>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-light-text-secondary dark:text-dark-text-secondary">
                  <p>{problem.description}</p>
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
                      </button> to track your progress.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-16">
                  <Button onClick={handleGenerateProblem}>Generate New</Button>
                  <div className="relative inline-block" title={!isAuthenticated ? "Log in to save your code" : "Save code"}>
                    <Button variant="secondary" disabled={!isAuthenticated}>Save</Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div
          className="w-8 flex-shrink-0 cursor-col-resize flex items-center justify-center group"
          onMouseDown={() => setIsDraggingHorizontal(true)}
        >
          <div className="w-1 h-32 bg-light-border dark:bg-dark-border rounded-full group-hover:bg-light-accent dark:group-hover:bg-dark-accent transition-colors" />
        </div>

        <div ref={rightColumnRef} className="flex-1 flex flex-col h-full">
          <div style={{ height: `${editorPanelHeight}px` }} className="min-h-[100px]">
            <Card className="flex-grow flex flex-col h-full">
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
              <div className="flex-grow flex font-mono text-sm bg-[#1e1e1e] p-8 overflow-hidden">
                <div className="text-right text-gray-500 pr-16 select-none pt-2 overflow-y-auto">
                  {code.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-grow bg-transparent text-gray-300 resize-none outline-none focus:outline-none leading-relaxed pt-2"
                  spellCheck="false"
                  aria-label="Code editor"
                />
              </div>
            </Card>
          </div>

          <div
            className="h-8 flex-shrink-0 cursor-row-resize flex items-center justify-center group"
            onMouseDown={() => setIsDraggingVertical(true)}
          >
            <div className="h-1 w-32 bg-light-border dark:bg-dark-border rounded-full group-hover:bg-light-accent dark:group-hover:bg-dark-accent transition-colors" />
          </div>

          <div className="flex-1 min-h-[100px]">
            <Card className="flex flex-col h-full">
              <div className="flex items-center justify-between p-8 border-b border-light-border dark:border-dark-border flex-shrink-0">
                <h3 className="text-sm font-semibold">Console</h3>
                <button
                  onClick={toggleConsole}
                  className="p-4 rounded-md hover:bg-light-surface-2 dark:hover:bg-dark-surface-2"
                  aria-label={isConsoleOpen ? 'Collapse console' : 'Expand console'}
                  aria-expanded={isConsoleOpen}
                >
                  <ChevronDownIcon className={`w-16 h-16 text-light-text-secondary dark:text-dark-text-secondary transition-transform duration-200 ${isConsoleOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>
              </div>
              <div className="flex-grow flex flex-col overflow-y-auto">
                {activeConsoleView === 'run' ? (
                  <>
                    <div className="flex flex-col p-16 border-b border-light-border dark:border-dark-border" style={{ minHeight: '120px', height: '45%' }}>
                      <h4 className="text-xs font-semibold mb-8 text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Test Against Custom Input</h4>
                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        className="w-full h-full bg-light-surface dark:bg-dark-surface font-mono text-sm resize-none outline-none focus:outline-none leading-relaxed text-light-text-primary dark:text-dark-text-primary"
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
                        <pre className="font-mono text-sm whitespace-pre-wrap text-light-text-secondary dark:text-dark-text-secondary">
                          {runOutput}
                        </pre>
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
                      <div className={`p-16 rounded-md ${submissionResult.status === 'Accepted' ? 'bg-green-100 dark:bg-green-900/50 border border-green-200 dark:border-green-800' : 'bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800'}`}>
                        <h3 className={`text-lg font-bold ${submissionResult.status === 'Accepted' ? 'text-light-success dark:text-dark-success' : 'text-light-danger dark:text-dark-danger'}`}>
                          {submissionResult.status === 'Accepted' ? 'Accepted' : 'Submission Failed'}
                        </h3>
                        <p className="mt-8 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                          {submissionResult.message}
                        </p>
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
          </div>
        </div>
      </div>
    </>
  );
};

export default PlaygroundPage;
