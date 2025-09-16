// RUTA: frontend/src/components/ImageUploader.jsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { FileImage, CheckCircle } from 'lucide-react';

// Ahora recibe 'onFileSelect' en lugar de 'onUploadComplete'
const ImageUploader = ({ onFileSelect }) => {
    const [fileName, setFileName] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // Límite de 5MB
                toast.error("El archivo es demasiado grande. Máximo 5MB.");
                return;
            }
            setFileName(file.name);
            onFileSelect(file); // Le pasamos el objeto File completo al formulario padre
        }
    };

    return (
        <div className="border p-4 rounded-lg space-y-4">
            <div className="flex items-center gap-4">
                <FileImage className="text-gray-500" />
                <Input type="file" onChange={handleFileChange} accept="image/*" />
            </div>
            {fileName && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <p>Archivo seleccionado: <strong>{fileName}</strong></p>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;