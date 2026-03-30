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
  getStepPicName?: (stepNumber: number, roleCode?: string) => string;
}

export function ProgressIndicator({
  currentStep,
  histories = [],
  compact = false,
  isLs = false,
  stepConfigs = [],
  getStepPicName,
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
      <div className="space-y-2">
        {/* LS/Non-LS Indicator */}
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded",
            isLs 
              ? "bg-blue-100 text-blue-700 border border-blue-300" 
              : "bg-purple-100 text-purple-700 border border-purple-300"
          )}>
            {isLs ? 'LS' : 'Non-LS'} - {totalApplicableSteps} Steps
          </span>
        </div>
        
        <div className="flex items-start gap-0.5 overflow-x-auto">
          {Array.from({ length: maxStepNumber }, (_, i) => i + 1).map((step) => {
            const history = getStepHistory(step);
            const skipped = isStepSkipped(step);
            const completed = isStepCompleted(step);
            const isCurrent = isCurrentStep(step);
            const config = getStepConfig(step);
            const picLabel = skipped
              ? '-'
              : getStepPicName
              ? getStepPicName(step, config?.requiredEmployeeRole)
              : history?.processorName || '-';

            return (
              <div key={step} className="w-[56px] flex flex-col items-center text-center">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium relative',
                    skipped
                      ? 'bg-gray-100 text-gray-400 opacity-30'
                      : completed
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? isLs
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                        : 'bg-purple-600 text-white ring-2 ring-purple-300'
                      : 'bg-gray-200 text-gray-500',
                    config?.isParallel && 'rounded-sm' // Square for parallel steps
                  )}
                  title={skipped ? 'Tidak berlaku' : config?.stepName}
                >
                  {skipped ? '−' : completed ? <Check className="w-3 h-3" /> : step}
                  {config?.isParallel && !skipped && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full border border-white" title="Paralel" />
                  )}
                </div>
                <p
                  className={cn(
                    'mt-1 text-[8px] leading-tight line-clamp-2 min-h-[18px]',
                    skipped ? 'text-gray-300' : 'text-slate-600'
                  )}
                  title={picLabel}
                >
                  {picLabel}
                </p>
              </div>
            );
          })}
          {currentStep > maxStepNumber && (
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center",
              "bg-green-500 text-white"
            )}>
              <Check className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    );
  }

  const parallelInfo = getCurrentParallelInfo();
  const currentConfig = getStepConfig(currentStep);

  return (
    <div className="space-y-3">
      {/* Header with LS/Non-LS indicator */}
      <div className="flex items-center justify-between">
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold",
          isLs 
            ? "bg-blue-50 text-blue-700 border-2 border-blue-200" 
            : "bg-purple-50 text-purple-700 border-2 border-purple-200"
        )}>
          <span>{isLs ? 'Langsung (LS)' : 'Non-LS'}</span>
          <span className="text-xs opacity-70">• {totalApplicableSteps} steps</span>
        </div>
        {parallelInfo && (
          <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
            Paralel: {parallelInfo.completedCount}/{parallelInfo.total}
          </div>
        )}
      </div>

  <div className="flex items-start gap-0.5 overflow-x-auto pb-4 pl-2 pt-1">
        {Array.from({ length: maxStepNumber }, (_, i) => i + 1).map((step) => {
          const history = getStepHistory(step);
          const config = getStepConfig(step);
          const skipped = isStepSkipped(step);
          const completed = isStepCompleted(step);
          const isCurrent = isCurrentStep(step);
          const picLabel = skipped
            ? '-'
            : getStepPicName
            ? getStepPicName(step, config?.requiredEmployeeRole)
            : history?.processorName || '-';

          return (
            <div key={step} className="flex items-start">
              <div className="w-[72px] flex flex-col items-center text-center">
                <div
                  className={cn(
                    'w-10 h-10 flex items-center justify-center text-sm font-medium relative group z-0',
                    skipped
                      ? 'bg-gray-100 text-gray-400 opacity-40 rounded-full'
                      : completed
                      ? 'bg-green-500 text-white rounded-full'
                      : isCurrent
                      ? isLs
                        ? 'bg-blue-600 text-white ring-4 ring-blue-200 rounded-full shadow-lg'
                        : 'bg-purple-600 text-white ring-4 ring-purple-200 rounded-full shadow-lg'
                      : 'bg-gray-200 text-gray-600 rounded-full',
                    config?.isParallel && !skipped && 'rounded-lg' // Rounded square for parallel
                  )}
                >
                  {skipped ? '−' : completed ? <Check className="w-5 h-5" /> : step}
                  {config?.isParallel && !skipped && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white shadow" title="Step Paralel" />
                  )}
                  {(history || skipped || config) && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-50 pointer-events-none">
                      <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-xs">
                        <p className="font-medium whitespace-nowrap">
                          Step {step}
                        </p>
                        {config?.isParallel && <p className="text-amber-300 text-xs">Paralel</p>}
                        {skipped ? (
                          <p className="text-slate-300 whitespace-nowrap mt-1">
                            Dilewati ({isLs ? 'Non-LS Only' : 'LS Only'})
                          </p>
                        ) : (
                          <>
                            <p className="whitespace-nowrap mt-1">{picLabel}</p>
                            {history && (
                              <p className="text-slate-300 whitespace-nowrap text-xs">
                                {new Date(history.processedAt).toLocaleString('id-ID')}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <p
                  className={cn(
                    'mt-2 text-[9px] leading-tight px-1 min-h-[24px] line-clamp-2',
                    skipped ? 'text-gray-400' : 'text-slate-600',
                    isCurrent && !skipped && 'font-semibold text-slate-800'
                  )}
                  title={picLabel}
                >
                  {picLabel}
                </p>
              </div>
              {step < maxStepNumber && (
                <div
                  className={cn(
                    'w-2 h-1 mt-[18px]',
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
          : `Step ${currentStep} dari ${maxStepNumber} - ${currentConfig ? (EMPLOYEE_ROLES[currentConfig.requiredEmployeeRole] || currentConfig.stepName) : ''}`
        }
      </p>
    </div>
  );
}
