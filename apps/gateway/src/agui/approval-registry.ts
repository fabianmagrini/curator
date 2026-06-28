import { Injectable } from '@nestjs/common';
import type { ApprovalResolution, RingChangeProposal } from '@curator/agents';

interface Pending {
  proposal: RingChangeProposal;
  resolve: (resolution: ApprovalResolution) => void;
  reject: (error: Error) => void;
}

/**
 * Holds agent runs that are blocked on a human approval (ADR-0004). The agent
 * run awaits `wait(...)`; a human decision routed through the controller calls
 * `resolve(...)`, which unblocks the run. In-memory for now (single instance).
 */
@Injectable()
export class ApprovalRegistry {
  private readonly pending = new Map<string, Pending>();

  /** Register a pending approval and return a promise that settles on decision. */
  wait(approvalId: string, proposal: RingChangeProposal): Promise<ApprovalResolution> {
    return new Promise<ApprovalResolution>((resolve, reject) => {
      this.pending.set(approvalId, { proposal, resolve, reject });
    });
  }

  /** Resolve a pending approval. Returns the proposal, or null if unknown. */
  resolve(approvalId: string, resolution: ApprovalResolution): RingChangeProposal | null {
    const entry = this.pending.get(approvalId);
    if (!entry) return null;
    this.pending.delete(approvalId);
    entry.resolve(resolution);
    return entry.proposal;
  }

  /** Abandon a pending approval (e.g. the client disconnected). */
  cancel(approvalId: string): void {
    const entry = this.pending.get(approvalId);
    if (!entry) return;
    this.pending.delete(approvalId);
    entry.reject(new Error('approval cancelled'));
  }

  isPending(approvalId: string): boolean {
    return this.pending.has(approvalId);
  }
}
