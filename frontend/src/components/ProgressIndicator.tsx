'use client';

import { cn } from '@/lib/utils';
import { EMPLOYEE_ROLES } from '@/lib/constants';
import { Check } from 'lucide-react';

interface StepConfig {
  stepNumber: number;
  stepName: string;
  requiredEmployeeRole: string;
  isLsOnly: boolean;
  isNonLsOnly: boolean;
  isParallel: boolean;
  parallelGroup: string | null;
}

interface ProgressIndicatorProps {
  currentStep: number;
  histories?: Array<{
    stepNumber: number;
    processorName: string;
    processedAt: string;
  }>;
  compact?: boolean;
  isLs?: boolean;
  stepConfigs?: StepConfig[];
}

export function ProgressIndicator({
  currentStep,
  histories = [],
  compact = false,
  isLs = false,
  stepConfigs = [],
}: ProgressIndicatorProps) {
  // Get applicable steps based on LS/Non-LS
  const applicableSteps = stepConfigs.filter(step => {
    if (isLs) return !step.isNonLsOnly;
    return !step.isLsOnly;
  });

  // All step numbers from config
  const allStepNumbers = stepConfigs.map(s => s.stepNumber);
  const maxStepNumber = allStepNumbers.length > 0 ? Math.max(...allStepNumbers) : 15;
  
  // Applicable step numbers
  const applicableStepNumbers = applicableSteps.map(s => s.stepNumber);
  const totalApplicableSteps = applicableSteps.length;

  // Get parallel steps
  const parallelGroups = [...new Set(stepConfigs.filter(s => s.isParallel && s.parallelGroup).map(s => s.parallelGroup))];
  const getParallelStepNumbers = (group: string | null) => {
    if (!group) return [];
    return stepConfigs.filter(s => s.parallelGroup === group).map(s => s.stepNumber);
  };

  const getStepHistory = (step: number) =>
    histories.find((h) => h.stepNumber === step);

  const getStepConfig = (step: number) =>
    stepConfigs.find((s) => s.stepNumber === step);

  // Check if step is in a parallel group
  const isParallelStep = (step: number) => {
    const config = getStepConfig(step);
    return config?.isParallel && config?.parallelGroup;
  };

  // Check if parallel step is completed
  const isParallelStepCompleted = (step: number) => {
    if (!isParallelStep(step)) return false;
    return histories.some(h => h.stepNumber === step);
  };

  // Determine if a step should show as completed
  const isStepCompleted = (step: number) => {
    const config = getStepConfig(step);
    
    // For parallel steps
    if (config?.isParallel && config?.parallelGroup) {
      return isParallelStepCompleted(step);
    }
    
    return histories.some(h => h.stepNumber === step);
  };

  // Check if step is skipped (not applicable for this ticket type)
  const isStepSkipped = (step: number) => {
    return !applicableStepNumbers.includes(step);
  };

  // Check if step is current
  const isCurrentStep = (step: number) => {
    const config = getStepConfig(step);
    
    // For parallel steps, check if in same group as current
    if (config?.isParallel && config?.parallelGroup) {
      const parallelSteps = getParallelStepNumbers(config.parallelGroup);
      const currentConfig = getStepConfig(currentStep);
      if (currentConfig?.parallelGroup === config.parallelGroup) {
        return !isParallelStepCompleted(step);
      }
    }
    
    return step === currentStep;
  };

  // Get current parallel group info
  const getCurrentParallelInfo = () => {
    const currentConfig = getStepConfig(currentStep);
    if (currentConfig?.isParallel && currentConfig?.parallelGroup) {
      const parallelSteps = getParallelStepNumbers(currentConfig.parallelGroup);
      const completedCount = parallelSteps.filter(s => histories.some(h => h.stepNumber === s)).length;
      return { parallelSteps, completedCount, total: parallelSteps.length };
    }
    return null;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: maxStepNumber }, (_, i) => i + 1).map((step) => {
          const skipped = isStepSkipped(step);
          const completed = isStepCompleted(step);
          const isCurrent = isCurrentStep(step);

          return (
            <div
              key={step}
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                skipped
                  ? 'bg-gray-100 text-gray-400 line-through'
                  : completed
                  ? 'bg-green-500 text-white'
                  : isCurrent
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              )}
            >
              {skipped ? '-' : completed ? <Check className="w-3 h-3" /> : step}
            </div>
          );
        })}
        {currentStep > maxStepNumber && (
          <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
            <Check className="w-3 h-3" />
          </div>
        )}
      </div>
    );
  }

  const parallelInfo = getCurrentParallelInfo();
  const currentConfig = getStepConfig(currentStep);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 overflow-x-auto pb-4 pl-2 pt-1">
        {Array.from({ length: maxStepNumber }, (_, i) => i + 1).map((step) => {
          const history = getStepHistory(step);
          const config = getStepConfig(step);
          const skipped = isStepSkipped(step);
          const completed = isStepCompleted(step);
          const isCurrent = isCurrentStep(step);

          return (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium relative group z-0',
                  skipped
                    ? 'bg-gray-100 text-gray-400'
                    : completed
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                    : 'bg-gray-200 text-gray-500'
                )}
              >
                {skipped ? '-' : completed ? <Check className="w-4 h-4" /> : step}
                {(history || skipped || config) && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-50 pointer-events-none">
                    <div className="bg-slate-800 text-white text-xs rounded px-3 py-2 shadow-lg max-w-xs">
                      <p className="font-medium whitespace-nowrap">
                        {config ? (EMPLOYEE_ROLES[config.requiredEmployeeRole] || config.stepName) : `Step ${step}`}
                      </p>
                      {skipped ? (
                        <p className="text-slate-300 whitespace-nowrap">Dilewati ({isLs ? 'Non-LS Only' : 'LS Only'})</p>
                      ) : history ? (
                        <>
                          <p className="whitespace-nowrap">{history.processorName}</p>
                          <p className="text-slate-300 whitespace-nowrap">
                            {new Date(history.processedAt).toLocaleString('id-ID')}
                          </p>
                        </>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
              {step < maxStepNumber && (
                <div
                  className={cn(
                    'w-4 h-1',
                    skipped || isStepSkipped(step + 1)
                      ? 'bg-gray-100'
                      : completed
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-sm text-gray-600">
        {currentStep > maxStepNumber 
          ? 'Selesai' 
          : parallelInfo
          ? `Step ${parallelInfo.parallelSteps.join(', ')} (Paralel) - ${parallelInfo.completedCount}/${parallelInfo.total} selesai`
          : `Step ${currentStep} dari ${totalApplicableSteps} - ${currentConfig ? (EMPLOYEE_ROLES[currentConfig.requiredEmployeeRole] || currentConfig.stepName) : ''}`
        }
      </p>
    </div>
  );
}
