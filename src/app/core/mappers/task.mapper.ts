import { CreateTaskDto, CreateTaskResponseDto, TaskDto, UpdateTaskDto } from '../models/task.dto';
import { Task, TaskFormValue } from '../models/task.model';
import { TaskStatus, isTaskStatus } from '../models/task-status.type';

const asString = (value: unknown, fallback = ''): string => {
    return typeof value === 'string' ? value : fallback;
};

const asStatus = (value: unknown): TaskStatus => {
    return isTaskStatus(value) ? value : 'pending';
};

const asDate = (value: unknown): Date => {
    if (typeof value === 'string') {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    }

    return new Date();
};

export const mapTaskDtoToModel = (dto: TaskDto): Task => {
    return {
        id: asString(dto._id),
        title: asString(dto.title),
        description: asString(dto.description),
        status: asStatus(dto.status),
        createdAt: asDate(dto.createdAt)
    };
};

export const mapCreateTaskFormToDto = (formValue: TaskFormValue): CreateTaskDto => {
    return {
        title: formValue.title.trim(),
        description: formValue.description.trim() || undefined
    };
};

/**
 * The backend either returns the persisted task (201) or only acknowledges the write (202).
 * For an acknowledgement the task is built from what was submitted; `null` when no id was
 * returned, because such a task cannot be addressed until the list is re-fetched.
 */
export const mapCreateTaskResponseToModel = (response: CreateTaskResponseDto, request: CreateTaskDto): Task | null => {
    if ('_id' in response) {
        return mapTaskDtoToModel(response);
    }

    if (!response.id) {
        return null;
    }

    return {
        id: response.id,
        title: request.title,
        description: request.description ?? '',
        status: 'pending',
        createdAt: new Date()
    };
};

export const mapUpdateTaskFormToDto = (formValue: Partial<TaskFormValue>): UpdateTaskDto => {
    const payload: UpdateTaskDto = {};

    if (typeof formValue.title === 'string') {
        payload.title = formValue.title.trim();
    }

    if (typeof formValue.description === 'string') {
        payload.description = formValue.description.trim();
    }

    if (isTaskStatus(formValue.status)) {
        payload.status = formValue.status;
    }

    return payload;
};
