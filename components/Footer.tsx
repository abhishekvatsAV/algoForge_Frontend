
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
      <div className="max-w-[1440px] mx-auto px-24 py-32 text-light-text-secondary dark:text-dark-text-secondary text-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-24">
            <div>
                <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-16">Keyboard Shortcuts</h3>
                <ul className="space-y-8 font-mono text-xs">
                    <li><kbd className="px-8 py-2 rounded-md bg-light-surface-2 dark:bg-dark-surface-2">Ctrl/Cmd + Enter</kbd> - Run Code</li>
                    <li><kbd className="px-8 py-2 rounded-md bg-light-surface-2 dark:bg-dark-surface-2">Ctrl/Cmd + Shift + Enter</kbd> - Submit</li>
                    <li><kbd className="px-8 py-2 rounded-md bg-light-surface-2 dark:bg-dark-surface-2">Ctrl + `</kbd> - Toggle Console</li>
                </ul>
            </div>
            <div>
                <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-16">Links</h3>
                <ul className="space-y-8">
                    <li><a href="#" className="hover:text-light-accent dark:hover:text-dark-accent">Docs</a></li>
                    <li><a href="#" className="hover:text-light-accent dark:hover:text-dark-accent">About</a></li>
                    <li><a href="#" className="hover:text-light-accent dark:hover:text-dark-accent">Feedback</a></li>
                </ul>
            </div>
            <div>
                 <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-16">Legal</h3>
                <ul className="space-y-8">
                    <li><a href="#" className="hover:text-light-accent dark:hover:text-dark-accent">Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-light-accent dark:hover:text-dark-accent">Terms of Service</a></li>
                </ul>
            </div>
        </div>
        <div className="mt-32 pt-16 border-t border-light-border dark:border-dark-border text-center text-xs">
            <p>&copy; {new Date().getFullYear()} AlgoForge. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
