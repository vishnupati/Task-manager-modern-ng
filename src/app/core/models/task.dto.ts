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
    /** Client-generated idempotency key, so a retried create cannot produce a duplicate task. */
    clientTaskId?: string;
}

/**
 * Body of a write the backend accepted for asynchronous processing (HTTP 202) instead of
 * returning the persisted task. `id` is only present when the backend assigns it up front.
 */
export interface TaskWriteAckDto {
    id?: string;
    message?: string;
}

export type CreateTaskResponseDto = TaskDto | TaskWriteAckDto;

export interface UpdateTaskDto {
    title?: string;
    description?: string;
    status?: TaskStatus;
}
