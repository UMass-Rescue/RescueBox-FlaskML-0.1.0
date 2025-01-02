import * as React from 'react';
import { useState } from 'react';
import { useDeploy } from '../lib/hooks';
import { Button } from '../components/ui/button';
import {
  DyProgressBar,
  DynamicProgressBar,
} from '../components/custom_ui/customButtons';
import LoadingIcon from '../components/icons/LoadingIcon';
import LogsIcon from '../components/icons/LogsIcon';
import LoadingScreen from '../components/LoadingScreen';

function Deploy() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentStep, setCurrentStep] = useState(1);

  // ... logic to update currentStep
  const {
    data: progress,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useDeploy();
  if (error) return <div>Error: {error.message}</div>;
  if (!progress) return <LoadingScreen />;

  const handleRefresh = async (): Promise<void> => {
    // await window.logging.clearLogs();
    await mutate();
  };
  setCurrentStep(progress);
  return (
    <div>
      <div className="flex flex-row items-center gap-3 font-bold">
        <LogsIcon className="fill-white" />
        Deploy Logs
        {isLoading && <LoadingIcon className="text-blue-500" />}
        {isValidating && <LoadingIcon className="text-blue-500" />}
      </div>
      <Button onClick={handleRefresh}>Deploy Fetch</Button>
      <DyProgressBar totalSteps={5} currentStep={currentStep} />
    </div>
  );
}

export default Deploy;

export function FileUpload() {
  const [progress, setProgress] = useState(0);
  const total = 1000; // Example: File size in KB

  const handleDeploy = () => {
    // Simulate file upload
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 1;
      setProgress(currentProgress);

      if (currentProgress >= total) {
        clearInterval(interval);
      }
    }, 100);
  };

  return (
    <div>
      <Button onClick={handleDeploy}>Upload File</Button>
      <DynamicProgressBar total={total} progress={progress} />
    </div>
  );
}
