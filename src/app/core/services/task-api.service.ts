import { HttpClient, httpResource } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { map } from 'rxjs';

import { TASKS_API_URL } from '../config/api.config';
import { mapTaskDtoToModel } from '../mappers/task.mapper';
import { CreateTaskDto, UpdateTaskDto, TaskDto } from '../models/task.dto';
import { Task } from '../models/task.model';

@Service()
export class TaskApiService {
    private readonly http = inject(HttpClient);

    getTasks() {
        return httpResource<Task[]>(() => ({
            url: TASKS_API_URL,
            withCredentials: true
        }), {
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
        return this.http.post<TaskDto>(TASKS_API_URL, payload, { withCredentials: true }).pipe(map(mapTaskDtoToModel));
    }

    updateTask(taskId: string, payload: UpdateTaskDto) {
        return this.http.patch<TaskDto>(`${TASKS_API_URL}/${taskId}`, payload, { withCredentials: true }).pipe(map(mapTaskDtoToModel));
    }

    deleteTask(taskId: string) {
        return this.http.delete<void>(`${TASKS_API_URL}/${taskId}`, { withCredentials: true });
    }
}
