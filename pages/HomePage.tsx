import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DUMMY_PROBLEMS } from '../constants';
import Button from '../components/Button';
import Card from '../components/Card';
import Pill from '../components/Pill';
import { Problem } from '../types';
import { useAuth } from '../hooks/useAuth';
import { getLatest3Problems } from '../services/geminiService';
import SkeletonLoader from '../components/SkeletonLoader';

const ProblemCard: React.FC<{ problem: Problem; isAuthenticated: boolean }> = ({ problem, isAuthenticated }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Logged-in users have numeric IDs in routes, guests use the full string ID for dummy data
    const pathId = isAuthenticated ? problem.id.substring(2) : problem.id;
    navigate(`/playground/${pathId}`);
  };

  return (
    <Card
      className="p-16 transition-transform hover:-translate-y-8"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-8">
        <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">{problem.title}</h3>
        <Pill type="difficulty" value={problem.difficulty} />
      </div>
      <div className="flex flex-wrap gap-8">
        {problem.tags.map(tag => <Pill key={tag} type="tag" value={tag} />)}
      </div>
    </Card>
  );
};

const RecentProblemsSkeleton: React.FC = () => (
  <div className="space-y-16">
    <SkeletonLoader className="h-[88px] w-full" />
    <SkeletonLoader className="h-[88px] w-full" />
    <SkeletonLoader className="h-[88px] w-full" />
  </div>
);

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [recentProblems, setRecentProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProblems = async () => {
      setIsLoading(true);
      setError(null);
      if (isAuthenticated && token) {
        try {
          const problems = await getLatest3Problems(token);
          setRecentProblems(problems);
        } catch (err) {
          setError("Failed to load your recent problems.");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setRecentProblems(DUMMY_PROBLEMS.slice(0, 3));
        setIsLoading(false);
      }
    };

    fetchProblems();
  }, [isAuthenticated, token]);

  const renderRecentProblems = () => {
    if (isLoading) {
      return <RecentProblemsSkeleton />;
    }

    if (isAuthenticated && !error && recentProblems.length === 0) {
      return (
        <Card className="p-16 text-center">
          <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-8">No problems yet!</h3>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-16">Generate your first coding challenge in the playground.</p>
          <Button size="sm" onClick={() => navigate('/playground')}>Generate Problem</Button>
        </Card>
      );
    }

    const problemsToShow = (isAuthenticated && !error) ? recentProblems : DUMMY_PROBLEMS.slice(0, 3);

    return (
      <>
        {error && (
          <div className="p-16 mb-16 text-center text-sm text-light-danger dark:text-dark-danger bg-red-100/50 dark:bg-red-900/20 rounded-md border border-light-danger/20 dark:border-dark-danger/20">
            <p>{error}</p>
            <p className="text-xs mt-4 opacity-80">Showing sample problems instead.</p>
          </div>
        )}
        {problemsToShow.map(p => <ProblemCard key={p.id} problem={p} isAuthenticated={isAuthenticated && !error} />)}
      </>
    )
  };

  return (
    <div className="max-w-[1440px] mx-auto px-24 py-48">
      <div className="grid md:grid-cols-2 gap-48 items-center">
        <div className="space-y-24">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary">
            Generate algorithm problems tailored to you.
          </h1>
          <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary">
            AlgoForge uses AI to create unique coding challenges, helping you master data structures and algorithms for your next technical interview.
          </p>
          <div className="flex items-center gap-16">
            <Button size="md" onClick={() => navigate('/playground')}>Generate Problem</Button>
            <Button variant="secondary" size="md" onClick={() => navigate('/playground')}>Explore Playground</Button>
          </div>
        </div>
        <div className="space-y-16">
          <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">Recent Problems</h2>
          {renderRecentProblems()}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
