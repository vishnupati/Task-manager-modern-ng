import { HttpClient, httpResource } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { map } from 'rxjs';

import { TASKS_API_URL } from '../config/api.config';
import { mapTaskDtoToModel } from '../mappers/task.mapper';
import { CreateTaskDto, CreateTaskResponseDto, UpdateTaskDto, TaskDto } from '../models/task.dto';
import { Task } from '../models/task.model';

@Service()
export class TaskApiService {
    private readonly http = inject(HttpClient);

    /**
     * Tasks of the signed-in user. Re-fetches whenever `userId` changes and stays idle (empty)
     * while it is null, so one user's tasks are never shown in another user's session.
     */
    getTasks(userId: () => string | null) {
        return httpResource<Task[]>(() => (userId() ? {
            url: TASKS_API_URL,
            withCredentials: true
        } : undefined), {
            defaultValue: [],
            parse: (tasks: unknown) => (tasks as TaskDto[]).map(mapTaskDtoToModel)
        });
    }

    getTask(taskId: string | (() => string | null)) {
        const idFn = typeof taskId === 'function' ? taskId : () => taskId;
        return httpResource<Task | null>(() => {
            const id = idFn();
            if (!id) return undefined;
            return {
                url: `${TASKS_API_URL}/${id}`,
                withCredentials: true
            };
        }, {
            parse: (task: unknown) => mapTaskDtoToModel(task as TaskDto)
        });
    }

    createTask(payload: CreateTaskDto) {
        return this.http.post<CreateTaskResponseDto>(TASKS_API_URL, payload, { withCredentials: true });
    }

    // The response body is not used: depending on the backend it is the task (200) or only an acknowledgement (202).
    updateTask(taskId: string, payload: UpdateTaskDto) {
        return this.http.patch<unknown>(`${TASKS_API_URL}/${taskId}`, payload, { withCredentials: true }).pipe(map(() => void 0));
    }

    deleteTask(taskId: string) {
        return this.http.delete<unknown>(`${TASKS_API_URL}/${taskId}`, { withCredentials: true }).pipe(map(() => void 0));
    }
}
