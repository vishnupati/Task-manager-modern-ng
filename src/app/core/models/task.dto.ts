import { TaskStatus } from './task-status.type';

export interface TaskDto {
    _id: string;
    title: string;
    description?: string | null;
    status?: TaskStatus | string | null;
    createdAt?: string | null;
}

export interface CreateTaskDto {
    title: string;
    description?: string;
}

export interface UpdateTaskDto {
    title?: string;
    description?: string;
    status?: TaskStatus;
}
