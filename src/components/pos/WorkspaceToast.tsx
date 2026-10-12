import { CheckCircle2, FileText } from 'lucide-react';
export function WorkspaceToastView({ type, text }: { type: 'success' | 'info'; text: string }) {
  return <div role="status" className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2.5 text-white text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-150 ${type === 'success' ? 'bg-[#10b981]' : 'bg-[#0B1F3A]'}`}>
    {type === 'success' ? <CheckCircle2 className="w-4 h-4 text-white" /> : <FileText className="w-4 h-4 text-amber-400" />}
    <span>{text}</span>
  </div>;
}
