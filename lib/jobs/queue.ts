/**
 * Abstração leve de fila (PRD 4 e 6.9). Envio assíncrono com retry e
 * idempotência. Implementação inicial em memória para desenvolvimento;
 * substituir por QStash/Inngest em produção.
 */

export interface JobPayload<T = unknown> {
  name: string;
  data: T;
  idempotencia?: string;
  agendarPara?: Date;
}

export interface QueueDriver {
  publish<T>(job: JobPayload<T>): Promise<{ id: string }>;
}

class MemoryQueue implements QueueDriver {
  async publish<T>(job: JobPayload<T>) {
    console.log(
      `[queue:memory] Job "${job.name}" enfileirado (dev only).`,
      { data: job.data, idempotencia: job.idempotencia },
    );
    return { id: `mem_${Date.now()}_${Math.random().toString(36).slice(2)}` };
  }
}

let driver: QueueDriver | null = null;

export function getQueue(): QueueDriver {
  if (!driver) driver = new MemoryQueue();
  return driver;
}
