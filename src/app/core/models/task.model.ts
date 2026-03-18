import { TaskStatus } from './task-status.type';

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    createdAt: Date;
}

export interface TaskFormValue {
    title: string;
    description: string;
    status: TaskStatus;
}
