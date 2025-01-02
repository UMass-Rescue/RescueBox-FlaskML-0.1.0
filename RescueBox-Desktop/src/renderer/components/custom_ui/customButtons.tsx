import { Button } from '@shadcn/button';
import { useEffect, useState } from 'react';
import { Progress } from '@shadcn/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@shadcn/tooltip';
import { Link } from 'react-router-dom';
import { Job, MLModel } from 'src/shared/models';
import CancelIcon from '../icons/CancelIcon';
import DeleteIcon from '../icons/DeleteIcon';

export function DyProgressBar({
  totalSteps,
  currentStep,
}: {
  totalSteps: number;
  currentStep: number;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculatedProgress = (currentStep / totalSteps) * 100;
    setProgress(calculatedProgress);
  }, [currentStep, totalSteps]);

  return <Progress value={progress} />;
}

interface DynamicProgressBarProps {
  total: number;
  progress: number;
}

export function DynamicProgressBar({
  total,
  progress,
}: DynamicProgressBarProps) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const percentage = (progress / total) * 100;
    setValue(percentage);
  }, [progress, total]);

  return <Progress value={value} className="w-full" />;
}

export function SimpleProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress === 100) {
          clearInterval(interval);
          return 100;
        }
        return prevProgress + 10;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <Progress value={progress} />
    </div>
  );
}

export function ProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress update
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prevProgress + 10;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <Progress value={progress} />
    </div>
  );
}

export function ViewButton({ job }: { job: Job }) {
  return (
    <Link to={`/jobs/${job.uid}/details`} className="">
      <Button
        variant="outline"
        className="px-8 hover:-translate-y-0.5 transition-all rounded-lg"
      >
        View
      </Button>
    </Link>
  );
}

export function JobRedButton({
  job,
  variant,
  handleClick,
}: {
  job: Job;
  variant: 'cancel' | 'delete';
  handleClick: (job: Job) => void;
}) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="px-4 bg-red-600 mr-2 hover:-translate-y-0.5 transition-all"
            onClick={() => handleClick(job)}
          >
            {variant === 'cancel' ? <CancelIcon /> : <DeleteIcon />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{variant === 'cancel' ? 'Cancel' : 'Delete'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ModelRedButton({
  model,
  handleClick,
}: {
  model: MLModel;
  handleClick: (model: MLModel) => void;
}) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="px-4 bg-red-600 mr-2 hover:-translate-y-0.5 transition-all"
            onClick={() => handleClick(model)}
          >
            <DeleteIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Delete</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
