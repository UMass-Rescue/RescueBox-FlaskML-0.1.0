import { Button } from '@shadcn/button';
import { useEffect, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@shadcn/tooltip';
import { Link } from 'react-router-dom';
import { Job, MLModel } from 'src/shared/models';
import LinearProgressWithLabelValue from '../ui/progressWithValue';
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

  return <LinearProgressWithLabelValue value={progress} />;
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
