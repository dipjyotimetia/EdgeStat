export interface StepResult {
  status: 'created' | 'skipped';
  id?: string;
}

export interface DeployResult extends StepResult {
  url?: string;
}
