'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface StepConfig {
  id: number;
  stepNumber: number;
  stepName: string;
  requiredEmployeeRole: string;
  description: string | null;
  isLsOnly: boolean;
  isNonLsOnly: boolean;
  isParallel: boolean;
  parallelGroup: string | null;
}

export function useStepConfig() {
  const [steps, setSteps] = useState<StepConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/steps')
      .then((res) => setSteps(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Get steps applicable for LS or Non-LS
  const getApplicableSteps = (isLs: boolean) => {
    return steps.filter(step => {
      if (isLs) return !step.isNonLsOnly;
      return !step.isLsOnly;
    });
  };

  // Get max step number for LS or Non-LS
  const getMaxStep = (isLs: boolean) => {
    const applicable = getApplicableSteps(isLs);
    return applicable.length > 0 ? Math.max(...applicable.map(s => s.stepNumber)) : 15;
  };

  // Get total step count for LS or Non-LS
  const getTotalSteps = (isLs: boolean) => {
    return getApplicableSteps(isLs).length;
  };

  // Get parallel steps for a group
  const getParallelSteps = (parallelGroup: string) => {
    return steps.filter(s => s.isParallel && s.parallelGroup === parallelGroup);
  };

  // Get step config by step number
  const getStepByNumber = (stepNumber: number) => {
    return steps.find(s => s.stepNumber === stepNumber);
  };

  return {
    steps,
    loading,
    getApplicableSteps,
    getMaxStep,
    getTotalSteps,
    getParallelSteps,
    getStepByNumber,
  };
}
