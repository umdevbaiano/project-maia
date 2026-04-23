import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { FileText, Download, Printer, X, Eye } from 'lucide-react';

interface LegalDocumentViewerProps {
    content: string;
    title: string;
    onClose: () => void;
    onDownload?: () => void;
}

const LegalDocumentViewer: React.FC<LegalDocumentViewerProps> = ({ content, title, onClose, onDownload }) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-5xl h-full flex flex-col glass-premium overflow-hidden rounded-[2.5rem] border-white/20 shadow-2xl"
            >
                {/* Header Toolbar */}
                <div className="flex items-center justify-between px-8 py-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-500">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Preview em Alta Definição</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onDownload}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all flex items-center gap-2 text-xs font-bold"
                        >
                            <Download className="w-4 h-4" /> Exportar PDF
                        </button>
                        <button 
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
                            onClick={() => window.print()}
                        >
                            <Printer className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-2" />
                        <button 
                            onClick={onClose}
                            className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Page Viewer */}
                <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-zinc-900/50 flex flex-col items-center custom-scrollbar">
                    {/* The "Paper" Container */}
                    <motion.div 
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-full max-w-[210mm] min-h-[297mm] bg-white text-gray-900 p-[20mm] md:p-[30mm] shadow-2xl rounded-sm prose prose-maia"
                    >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                        </ReactMarkdown>
                    </motion.div>

                    <div className="py-12 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 border border-blue-600/20">
                            <Eye className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Fim do Documento</span>
                        </div>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase">Gerado com Inteligência Jurídica Maia</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default LegalDocumentViewer;
