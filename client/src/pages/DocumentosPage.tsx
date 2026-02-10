import React from 'react';
import { FileText } from 'lucide-react';

const DocumentosPage: React.FC = () => {
  return (
    <div className="p-8">
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
          <h1 className="text-2xl font-bold text-white mb-2">Gestão de Documentos</h1>
          <p className="text-zinc-400">Esta funcionalidade será implementada em breve.</p>
        </div>
      </div>
    </div>
  );
};

export default DocumentosPage;
