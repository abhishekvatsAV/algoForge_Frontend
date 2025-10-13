import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Problem, Difficulty } from '../types';
import Button from '../components/Button';
import Pill from '../components/Pill';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import { useAuth } from '../hooks/useAuth';
import { getAllProblems, deleteProblem } from '../services/geminiService';
import SkeletonLoader from '../components/SkeletonLoader';
import { DUMMY_PROBLEMS } from '../constants';

const AdminPage: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'All'>('All');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedProblems, setSelectedProblems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchProblems = async () => {
      setIsLoading(true);
      setError(null);
      if (!isAuthenticated || !token) {
        setProblems(DUMMY_PROBLEMS);
        setIsLoading(false);
        return;
      }
      try {
        const fetchedProblems = await getAllProblems(token);
        setProblems(fetchedProblems);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch problems.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProblems();
  }, [token, isAuthenticated]);

  const filteredProblems = useMemo(() => {
    return problems.filter(problem => {
      if (searchTerm && !problem.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (selectedDifficulty !== 'All' && problem.difficulty !== selectedDifficulty) {
        return false;
      }
      const searchTags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
      if (searchTags.length > 0 && !searchTags.every(t => problem.tags.some(pt => pt.toLowerCase().includes(t)))) {
        return false;
      }
      return true;
    });
  }, [problems, searchTerm, selectedDifficulty, tagsInput]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProblems(new Set(filteredProblems.map(p => p.id)));
    } else {
      setSelectedProblems(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelection = new Set(selectedProblems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedProblems(newSelection);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDifficulty('All');
    setTagsInput('');
    setSelectedProblems(new Set());
  }

  const handleExportCSV = () => {
    const problemsToExport = selectedProblems.size > 0
      ? problems.filter(p => selectedProblems.has(p.id))
      : filteredProblems;

    if (problemsToExport.length === 0) {
      alert("No problems to export.");
      return;
    }

    const headers = ['id', 'title', 'isSolved', 'difficulty', 'tags', 'timeLimit', 'memoryLimit'];

    const formatCsvCell = (value: any): string => {
      const strValue = String(value);
      if (strValue.includes(',') || strValue.includes('\n') || strValue.includes('"')) {
        const escapedValue = strValue.replace(/"/g, '""');
        return `"${escapedValue}"`;
      }
      return strValue;
    };

    const headerRow = headers.join(',');

    const dataRows = problemsToExport.map(problem =>
      headers.map(header => {
        let cellValue;
        if (header === 'tags') {
          cellValue = (problem as any).tags.join('; ');
        } else {
          cellValue = problem[header as keyof Problem];
        }
        return formatCsvCell(cellValue);
      }).join(',')
    );

    const csvContent = [headerRow, ...dataRows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `algoforge-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteOne = async (id: string, title: string) => {
    try {
      if (!isAuthenticated || !token) {
        alert("Please log in to delete problems.");
        return;
      }

      if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
        return; // User cancelled the action
      }

      const numericId = parseInt(id.substring(2), 10);
      if (isNaN(numericId)) {
        throw new Error(`Invalid problem ID format: ${id}`);
      }

      await deleteProblem(numericId, token);

      alert(`Successfully deleted "${title}".`);
      setProblems(prev => prev.filter(p => p.id !== id));
      setSelectedProblems(prev => {
        const newSelection = new Set(prev);
        newSelection.delete(id);
        return newSelection;
      });

    } catch (error) {
      console.error("Deletion failed:", error);
      alert(`Could not delete problem: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      if (!isAuthenticated || !token) {
        alert("Please log in to delete problems.");
        return;
      }

      const problemsToDelete = Array.from(selectedProblems);
      if (problemsToDelete.length === 0) {
        alert("No problems selected to delete.");
        return;
      }

      if (!window.confirm(`Are you sure you want to delete ${problemsToDelete.length} selected problem(s)? This action is permanent.`)) {
        return;
      }

      const failedDeletions: string[] = [];
      const successfullyDeletedIds: string[] = [];

      for (const id of problemsToDelete) {
        const problem = problems.find(p => p.id === id);
        const title = problem ? problem.title : `ID ${id}`;

        try {
          const numericId = parseInt(id.substring(2), 10);
          if (isNaN(numericId)) throw new Error("Invalid ID format");
          await deleteProblem(numericId, token);
          successfullyDeletedIds.push(id);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          console.error(`Failed to delete problem ${title}:`, message);
          failedDeletions.push(`- ${title} (Reason: ${message})`);
        }
      }

      if (successfullyDeletedIds.length > 0) {
        setProblems(prev => prev.filter(p => !successfullyDeletedIds.includes(p.id)));
      }

      setSelectedProblems(new Set());

      let reportMessage = `Successfully deleted ${successfullyDeletedIds.length} problem(s).`;
      if (failedDeletions.length > 0) {
        reportMessage += `\n\nFailed to delete ${failedDeletions.length} problem(s):\n${failedDeletions.join('\n')}`;
      }
      alert(reportMessage);
    } catch (error) {
      console.error("Bulk deletion process failed:", error);
      alert(`An unexpected error occurred during the delete process: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-24 py-32">
      <h1 className="text-2xl font-bold mb-16">Admin Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-24">
        {/* Filters Sidebar */}
        <aside className="p-16 bg-light-surface dark:bg-dark-surface rounded-md border border-light-border dark:border-dark-border self-start">
          <div className="flex justify-between items-center mb-16">
            <h2 className="text-lg font-semibold">Filters</h2>
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>Clear</Button>
          </div>
          <div className="space-y-16">
            <div>
              <label className="text-sm font-medium">Search</label>
              <input
                type="text"
                placeholder="Search by title..."
                className="w-full mt-8 p-8 border border-light-border dark:border-dark-border rounded-md bg-light-surface-2 dark:bg-dark-surface-2 focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Difficulty</label>
              <select
                className="w-full mt-8 p-8 border border-light-border dark:border-dark-border rounded-md bg-light-surface-2 dark:bg-dark-surface-2 focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent outline-none"
                value={selectedDifficulty}
                onChange={e => setSelectedDifficulty(e.target.value as Difficulty | 'All')}
              >
                <option value="All">All</option>
                <option value={Difficulty.Easy}>Easy</option>
                <option value={Difficulty.Medium}>Medium</option>
                <option value={Difficulty.Hard}>Hard</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Tags</label>
              <input
                type="text"
                placeholder="e.g., array, dp"
                className="w-full mt-8 p-8 border border-light-border dark:border-dark-border rounded-md bg-light-surface-2 dark:bg-dark-surface-2 focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent outline-none"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
              />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main>
          <div className="flex justify-between items-center mb-16">
            <div className="flex gap-8">
              <Button size="sm" variant="secondary" disabled={selectedProblems.size === 0 || !isAuthenticated} onClick={handleDeleteSelected}>Delete Selected</Button>
              <Button size="sm" variant="secondary" onClick={handleExportCSV} disabled={filteredProblems.length === 0}>Export CSV</Button>
            </div>
          </div>

          <div className="overflow-x-auto bg-light-surface dark:bg-dark-surface rounded-md border border-light-border dark:border-dark-border">
            {isLoading ? (
              <div className="p-16 space-y-8">
                <SkeletonLoader className="h-48 w-full" />
                <SkeletonLoader className="h-32 w-full" />
                <SkeletonLoader className="h-32 w-full" />
                <SkeletonLoader className="h-32 w-full" />
              </div>
            ) : error ? (
              <div className="p-32 text-center text-light-danger dark:text-dark-danger">{error}</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-light-surface-2 dark:bg-dark-surface-2">
                  <tr>
                    <th className="p-16 w-16">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={filteredProblems.length > 0 && selectedProblems.size === filteredProblems.length}
                        disabled={filteredProblems.length === 0}
                      />
                    </th>
                    <th className="p-16 font-semibold text-light-text-secondary dark:text-dark-text-secondary">Title</th>
                    <th className="p-16 font-semibold text-light-text-secondary dark:text-dark-text-secondary">Status</th>
                    <th className="p-16 font-semibold text-light-text-secondary dark:text-dark-text-secondary">Difficulty</th>
                    <th className="p-16 font-semibold text-light-text-secondary dark:text-dark-text-secondary">Tags</th>
                    <th className="p-16 font-semibold text-light-text-secondary dark:text-dark-text-secondary">Created</th>
                    <th className="p-16 font-semibold text-light-text-secondary dark:text-dark-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProblems.length > 0 ? (
                    filteredProblems.map(problem => (
                      <tr key={problem.id} className="border-b border-light-border dark:border-dark-border last:border-b-0">
                        <td className="p-16">
                          <input type="checkbox" checked={selectedProblems.has(problem.id)} onChange={() => handleSelectOne(problem.id)} />
                        </td>
                        <td className="p-16 font-medium text-light-text-primary dark:text-dark-text-primary">
                          <Link to={`/playground/${isAuthenticated ? problem.id.substring(2) : problem.id}`} className="hover:text-light-accent dark:hover:text-dark-accent hover:underline transition-colors">
                            {problem.title}
                          </Link>
                        </td>
                        <td className="p-16">
                          {problem.isSolved && <CheckCircleIcon className="w-24 h-24 text-light-success dark:text-dark-success" />}
                        </td>
                        <td className="p-16"><Pill type="difficulty" value={problem.difficulty} /></td>
                        <td className="p-16">
                          <div className="flex flex-wrap gap-8 max-w-[200px]">
                            {problem.tags.map(tag => <Pill key={tag} type="tag" value={tag} />)}
                          </div>
                        </td>
                        <td className="p-16 text-light-text-secondary dark:text-dark-text-secondary">
                          {problem.createdAt ? new Date(problem.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-16">
                          <div className="flex gap-8">
                            <Button size="sm" variant="ghost" className="text-light-danger dark:text-dark-danger" onClick={() => handleDeleteOne(problem.id, problem.title)} disabled={!isAuthenticated}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center p-32 text-light-text-secondary dark:text-dark-text-secondary">
                        No problems found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-16 text-sm">
            <p className="text-light-text-secondary dark:text-dark-text-secondary">{selectedProblems.size} of {filteredProblems.length} items selected.</p>
            <div className="flex gap-8">
              <Button size="sm" variant="secondary" disabled>Previous</Button>
              <Button size="sm" variant="secondary" disabled>Next</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPage;