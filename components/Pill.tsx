
import React from 'react';
import { Difficulty } from '../types';
import { DIFFICULTY_COLORS } from '../constants';

interface PillProps {
    type: 'difficulty' | 'tag';
    value: Difficulty | string;
}

const Pill: React.FC<PillProps> = ({ type, value }) => {
    const baseClasses = 'text-xs font-medium px-8 py-2 rounded-full inline-block';
    let specificClasses = '';

    if (type === 'difficulty') {
        specificClasses = DIFFICULTY_COLORS[value as Difficulty] || 'bg-light-muted text-white';
    } else {
        specificClasses = 'bg-light-surface-2 dark:bg-dark-surface-2 text-light-text-secondary dark:text-dark-text-secondary';
    }

    return (
        <span className={`${baseClasses} ${specificClasses}`}>
            {value}
        </span>
    );
};

export default Pill;
