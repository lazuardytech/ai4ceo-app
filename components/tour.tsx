import { useNextStep } from 'nextstepjs';
import { Button } from './ui/button';

export const YourComponent = () => {
  const { startNextStep } = useNextStep();

  return (
    <Button variant='outline' onClick={() => startNextStep('first-time')}>
      Start Tour
    </Button>
  );
};
