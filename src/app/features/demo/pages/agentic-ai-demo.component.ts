import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TaskStoreService } from '../../../core/services/task-store.service';
import { initializeWebMCPPolyfill } from '@mcp-b/webmcp-polyfill';

@Component({
  selector: 'app-agentic-ai-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agentic-ai-demo.component.html',
  styleUrl: './agentic-ai-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgenticAiDemoComponent implements OnInit, OnDestroy {
  private readonly store = inject(TaskStoreService);

  readonly consoleLogs = signal<string[]>(['Agentic console UI initialised.']);
  readonly registeredTools = signal<any[]>([]);

  // Simulation states
  readonly isAgentRunning = signal(false);
  readonly inputPrompt = signal('');

  ngOnInit() {
    // 1. Initialize WebMCP Polyfill
    try {
      initializeWebMCPPolyfill();
      this.addLog('WebMCP Polyfill initialized successfully.');
    } catch (err) {
      this.addLog(`Polyfill init warning: ${err}`);
    }

    // 2. Register tools with the browser's modelContext
    this.registerAgentTools();
  }

  ngOnDestroy() {
    this.addLog('De-registering tools.');
  }

  private addLog(msg: string) {
    this.consoleLogs.update((current) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...current]);
  }

  private registerAgentTools() {
    const tools = [
      {
        name: 'get_tasks_list',
        description: 'Retrieve all current tasks in the task manager, including titles, descriptions, and statuses.',
        inputSchema: { type: 'object', properties: {} },
        execute: async () => {
          this.addLog('Agent tool executed: get_tasks_list');
          const tasks = this.store.tasks();
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(tasks, null, 2)
            }]
          };
        }
      },
      {
        name: 'add_new_task',
        description: 'Create a new task in the task manager.',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'The title of the task' },
            description: { type: 'string', description: 'Detailed description of the task' }
          },
          required: ['title']
        },
        execute: async (args: any) => {
          this.addLog(`Agent tool executed: add_new_task - "${args.title}"`);
          if (!args.title) {
            throw new Error('Title parameter is required');
          }
          await firstValueFrom(this.store.createTask({
            title: args.title.trim(),
            description: args.description || 'Created by WebMCP Agent',
            status: 'pending'
          }));
          return {
            content: [{
              type: 'text',
              text: `Successfully added task: "${args.title}"`
            }]
          };
        }
      },
      {
        name: 'remove_task',
        description: 'Delete a task from the list using its task ID.',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'The unique ID of the task to delete' }
          },
          required: ['taskId']
        },
        execute: async (args: any) => {
          this.addLog(`Agent tool executed: remove_task - ID: ${args.taskId}`);
          await firstValueFrom(this.store.deleteTask(args.taskId));
          return {
            content: [{
              type: 'text',
              text: `Successfully deleted task with ID: ${args.taskId}`
            }]
          };
        }
      }
    ];

    // Register each tool in the navigator.modelContext if available
    const modelContext = (navigator as any).modelContext;
    if (modelContext && typeof modelContext.registerTool === 'function') {
      for (const tool of tools) {
        try {
          modelContext.registerTool({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            execute: tool.execute
          });
          this.addLog(`Successfully registered tool with browser modelContext: "${tool.name}"`);
        } catch (e) {
          this.addLog(`Failed to register tool "${tool.name}": ${e}`);
        }
      }
    } else {
      this.addLog('navigator.modelContext not natively available. Exposing simulated fallback tools.');
    }

    this.registeredTools.set(tools);
  }

  // Simulate an agent processing a natural language command using our WebMCP tools
  async runSimulatedAgent(promptText: string) {
    if (!promptText.trim()) return;

    this.isAgentRunning.set(true);
    this.addLog(`User Command: "${promptText}"`);
    this.addLog('Simulated Agent: Parsing command intent...');

    await new Promise(r => setTimeout(r, 800));

    const lower = promptText.toLowerCase();
    
    try {
      if (lower.includes('list') || lower.includes('show') || lower.includes('get')) {
        this.addLog('Simulated Agent: Selecting tool "get_tasks_list"');
        await new Promise(r => setTimeout(r, 400));
        const tool = this.registeredTools().find(t => t.name === 'get_tasks_list');
        const res = await tool.execute();
        this.addLog(`Simulated Agent Response:\n${res.content[0].text}`);
      } 
      else if (lower.includes('add') || lower.includes('create') || lower.includes('new')) {
        // Extract title
        let title = 'Agent Task';
        const match = promptText.match(/(?:add|create|new)\s+(?:task\s+)?(?:to\s+)?([^.]+)/i);
        if (match && match[1]) {
          title = match[1].trim();
        }
        
        this.addLog(`Simulated Agent: Selecting tool "add_new_task" with args: { title: "${title}" }`);
        await new Promise(r => setTimeout(r, 400));
        const tool = this.registeredTools().find(t => t.name === 'add_new_task');
        const res = await tool.execute({ title, description: 'Created by WebMCP Simulated Agent' });
        this.addLog(`Simulated Agent Response: ${res.content[0].text}`);
      } 
      else if (lower.includes('delete') || lower.includes('remove')) {
        const tasks = this.store.tasks();
        if (tasks.length === 0) {
          this.addLog('Simulated Agent: No tasks available to delete.');
        } else {
          const taskToDelete = tasks[0]; // Delete the first task for simplicity in simulation
          this.addLog(`Simulated Agent: Selecting tool "remove_task" with args: { taskId: "${taskToDelete.id}" }`);
          await new Promise(r => setTimeout(r, 400));
          const tool = this.registeredTools().find(t => t.name === 'remove_task');
          const res = await tool.execute({ taskId: taskToDelete.id });
          this.addLog(`Simulated Agent Response: ${res.content[0].text}`);
        }
      } 
      else {
        this.addLog('Simulated Agent: Unable to map intent to any registered tool. Try saying "create task Buy Milk" or "list tasks".');
      }
    } catch (err: any) {
      this.addLog(`Simulated Agent Error: ${err.message || err}`);
    } finally {
      this.isAgentRunning.set(false);
      this.inputPrompt.set('');
    }
  }

  onPromptChange(event: Event) {
    this.inputPrompt.set((event.target as HTMLInputElement).value);
  }

  clearLogs() {
    this.consoleLogs.set(['Console logs cleared.']);
  }
}
