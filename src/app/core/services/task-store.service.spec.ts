import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { TASKS_API_URL } from '../config/api.config';
import { AuthUser } from '../models/auth-user.model';
import { TaskDto } from '../models/task.dto';
import { TaskStoreService } from './task-store.service';
import { UserAuthService } from './user-auth.service';

const user = (id: string): AuthUser => ({ id, name: 'Test User', email: `${id}@example.com`, provider: 'local' });

const taskDto = (id: string, status = 'pending'): TaskDto => ({
    _id: id,
    title: `Task ${id}`,
    description: '',
    status,
    createdAt: '2026-01-01T00:00:00.000Z'
});

const serverError = { status: 500, statusText: 'Server Error' };

describe('TaskStoreService', () => {
    let store: TaskStoreService;
    let http: HttpTestingController;
    let currentUser: ReturnType<typeof signal<AuthUser | null>>;

    const settle = () => TestBed.inject(ApplicationRef).whenStable();

    const loadList = async (tasks: TaskDto[]) => {
        TestBed.tick();
        http.expectOne({ method: 'GET', url: TASKS_API_URL }).flush(tasks);
        await settle();
    };

    beforeEach(() => {
        currentUser = signal<AuthUser | null>(user('u1'));

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: UserAuthService, useValue: { user: currentUser } }
            ]
        });

        store = TestBed.inject(TaskStoreService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('applies updates optimistically and keeps syncing after one fails', async () => {
        await loadList([ taskDto('t1'), taskDto('t2') ]);

        store.queueTaskUpdate('t1', { status: 'completed' });
        expect(store.tasks().find((task) => task.id === 't1')?.status).toBe('completed');

        http.expectOne({ method: 'PATCH', url: `${TASKS_API_URL}/t1` }).flush(null, serverError);
        expect(store.tasks().find((task) => task.id === 't1')?.status).toBe('pending');

        // Before the fix, the failed request terminated the queue and this update was never sent.
        store.queueTaskUpdate('t2', { status: 'completed' });
        const request = http.expectOne({ method: 'PATCH', url: `${TASKS_API_URL}/t2` });
        expect(request.request.body).toEqual({ status: 'completed' });
        request.flush({ message: 'Task update request queued' }, { status: 202, statusText: 'Accepted' });

        expect(store.tasks().find((task) => task.id === 't2')?.status).toBe('completed');
    });

    it('does not roll back a field that a later edit already changed', async () => {
        await loadList([ taskDto('t1') ]);

        store.queueTaskUpdate('t1', { title: 'First' });
        store.queueTaskUpdate('t1', { title: 'Second' });

        http.expectOne({ method: 'PATCH', url: `${TASKS_API_URL}/t1` }).flush(null, serverError);
        http.expectOne({ method: 'PATCH', url: `${TASKS_API_URL}/t1` }).flush({});

        expect(store.tasks()[0].title).toBe('Second');
    });

    it('shows a task accepted with 202 using the submitted values and the returned id', async () => {
        await loadList([ taskDto('t1') ]);

        const created = firstValueFrom(store.createTask({ title: '  Write tests  ', description: '', status: 'pending' }));
        const request = http.expectOne({ method: 'POST', url: TASKS_API_URL });
        expect(request.request.body.title).toBe('Write tests');
        expect(typeof request.request.body.clientTaskId).toBe('string');
        request.flush({ id: 'new-id', status: 'queued' }, { status: 202, statusText: 'Accepted' });

        expect((await created)?.id).toBe('new-id');
        expect(store.tasks().map((task) => task.id)).toEqual([ 'new-id', 't1' ]);
        expect(store.tasks()[0]).toMatchObject({ title: 'Write tests', description: '', status: 'pending' });
        expect(store.isSaving()).toBe(false);
    });

    it('uses the persisted task when the backend returns it', async () => {
        await loadList([]);

        const created = firstValueFrom(store.createTask({ title: 'Task t9', description: '', status: 'pending' }));
        http.expectOne({ method: 'POST', url: TASKS_API_URL }).flush(taskDto('t9'), { status: 201, statusText: 'Created' });

        expect((await created)?.id).toBe('t9');
        expect(store.tasks().map((task) => task.id)).toEqual([ 't9' ]);
    });

    it('re-fetches the list instead of showing a blank task when the acknowledgement has no id', async () => {
        await loadList([]);

        const created = firstValueFrom(store.createTask({ title: 'Queued', description: '', status: 'pending' }));
        http.expectOne({ method: 'POST', url: TASKS_API_URL }).flush({ message: 'Task creation request queued' }, { status: 202, statusText: 'Accepted' });

        expect(await created).toBeNull();
        expect(store.tasks()).toEqual([]);

        TestBed.tick();
        http.expectOne({ method: 'GET', url: TASKS_API_URL }).flush([ taskDto('t1') ]);
        await settle();
        expect(store.tasks().map((task) => task.id)).toEqual([ 't1' ]);
    });

    it('removes a task immediately and restores it in place when the delete fails', async () => {
        await loadList([ taskDto('t1'), taskDto('t2'), taskDto('t3') ]);

        const deleted = firstValueFrom(store.deleteTask('t2'));
        expect(store.tasks().map((task) => task.id)).toEqual([ 't1', 't3' ]);

        http.expectOne({ method: 'DELETE', url: `${TASKS_API_URL}/t2` }).flush(null, serverError);

        await expect(deleted).rejects.toBeTruthy();
        expect(store.tasks().map((task) => task.id)).toEqual([ 't1', 't2', 't3' ]);
    });

    it('exposes an empty list instead of throwing when loading fails', async () => {
        TestBed.tick();
        http.expectOne({ method: 'GET', url: TASKS_API_URL }).flush({ message: 'boom' }, serverError);
        await settle();

        expect(store.tasksResource.status()).toBe('error');
        expect(store.tasks()).toEqual([]);
        expect(store.stats()).toEqual({ total: 0, completed: 0, pending: 0 });
    });

    it('drops the previous user\'s tasks and loads the new user\'s on account switch', async () => {
        await loadList([ taskDto('t1') ]);

        currentUser.set(null);
        TestBed.tick();
        http.expectNone(TASKS_API_URL);
        expect(store.tasks()).toEqual([]);

        currentUser.set(user('u2'));
        await loadList([ taskDto('u2-task') ]);
        expect(store.tasks().map((task) => task.id)).toEqual([ 'u2-task' ]);
    });
});
