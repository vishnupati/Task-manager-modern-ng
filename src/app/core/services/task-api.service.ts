import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';

import { TASKS_API_URL } from '../config/api.config';
import { mapTaskDtoToModel } from '../mappers/task.mapper';
import { CreateTaskDto, UpdateTaskDto, TaskDto } from '../models/task.dto';
import { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskApiService {
    private readonly http = inject(HttpClient);

    getTasks() {
        return this.http.get<TaskDto[]>(TASKS_API_URL, { withCredentials: true }).pipe(map((tasks) => tasks.map(mapTaskDtoToModel)));
    }

    getTask(taskId: string) {
        return this.http.get<TaskDto>(`${TASKS_API_URL}/${taskId}`, { withCredentials: true }).pipe(map(mapTaskDtoToModel));
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
