import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { VmConsolePageContent } from './VmConsolePageContent';

function ConsolePageFallback() {
  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-6">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" aria-hidden />
    </div>
  );
}

export default function VmConsoleStandalonePage() {
  return (
    <Suspense fallback={<ConsolePageFallback />}>
      <VmConsolePageContent />
    </Suspense>
  );
}
