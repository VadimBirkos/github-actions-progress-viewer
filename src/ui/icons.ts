import { JobState, StepState } from '../types';

export function jobIcon(job: JobState): { icon: string; cls: string } {
  if (job.status === 'in_progress')                        return { icon: '●', cls: 'ghash-running' };
  if (job.status === 'queued' || job.status === 'waiting') return { icon: '○', cls: 'ghash-queued' };
  if (job.status === 'completed') {
    switch (job.conclusion) {
      case 'success':   return { icon: '✓', cls: 'ghash-success' };
      case 'failure':   return { icon: '✗', cls: 'ghash-failure' };
      case 'cancelled': return { icon: '⊘', cls: 'ghash-cancelled' };
      case 'skipped':   return { icon: '−', cls: 'ghash-skipped' };
      default:          return { icon: '✓', cls: 'ghash-success' };
    }
  }
  return { icon: '○', cls: 'ghash-queued' };
}

export function stepIcon(step: StepState): { icon: string; cls: string } {
  if (step.status === 'in_progress')                         return { icon: '●', cls: 'ghash-running' };
  if (step.status === 'queued' || step.status === 'pending') return { icon: '○', cls: 'ghash-queued' };
  if (step.status === 'completed') {
    switch (step.conclusion) {
      case 'success':   return { icon: '✓', cls: 'ghash-success' };
      case 'failure':   return { icon: '✗', cls: 'ghash-failure' };
      case 'cancelled': return { icon: '⊘', cls: 'ghash-cancelled' };
      case 'skipped':   return { icon: '−', cls: 'ghash-skipped' };
      case 'neutral':   return { icon: '●', cls: 'ghash-queued' };
      default:          return { icon: '✓', cls: 'ghash-success' };
    }
  }
  return { icon: '○', cls: 'ghash-queued' };
}
