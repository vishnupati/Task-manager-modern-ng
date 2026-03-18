export type TaskStatus = 'pending' | 'completed';

export const isTaskStatus = (value: unknown): value is TaskStatus => {
    return value === 'pending' || value === 'completed';
};
