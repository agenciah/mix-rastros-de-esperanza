// RUTA: frontend/hooks/hallazgos/useFormHallazgos.js

import { useState, useEffect, useCallback } from 'react';
import { initialHallazgoFormState } from '@/lib/initialFormState';
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from 'sonner';

const uploadImage = (file, onProgress) => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, `hallazgos_images/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed',
            (snapshot) => onProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            (error) => {
                console.error("Firebase upload error:", error);
                reject(new Error("Error al subir la imagen."));
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
};

// ✅ CORRECCIÓN 1: El parámetro se llama 'initialData' por convención
export const useFormHallazgos = (initialData = initialHallazgoFormState) => {
    const [formData, setFormData] = useState(initialData);
    const [imageFile, setImageFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        // Usa 'initialData', no 'initialState'
        setFormData(initialData || initialHallazgoFormState);
    }, [initialData]);
    
    // --- MANEJADORES DE ESTADO (COMPLETOS Y CORRECTOS) ---

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleNestedChange = useCallback((path, value) => {
        const [parent, child] = path.split('.');
        setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    }, []);

    const handleArrayChange = useCallback((arrayName, index, fieldName, value) => {
        setFormData(prev => {
            if (!prev || !Array.isArray(prev[arrayName])) return prev;
            const newArray = [...prev[arrayName]];
            newArray[index] = { ...newArray[index], [fieldName]: value };
            return { ...prev, [arrayName]: newArray };
        });
    }, []);
    
    const addArrayItem = useCallback((arrayName, newItem) => {
        setFormData(prev => ({ ...prev, [arrayName]: [...(prev[arrayName] || []), newItem] }));
    }, []);

    const removeArrayItem = useCallback((arrayName, index) => {
        setFormData(prev => ({ ...prev, [arrayName]: (prev[arrayName] || []).filter((_, i) => i !== index) }));
    }, []);

    // --- LÓGICA DE ENVÍO Y RESET ---

    const handleSubmit = async (submitAction) => {
        if (!formData) {
            toast.error("No hay datos en el formulario para guardar.");
            return null;
        }
        setIsSubmitting(true);
        let imageUrl = formData.foto_hallazgo || null; 

        try {
            if (imageFile) {
                toast.info("Subiendo imagen...");
                imageUrl = await uploadImage(imageFile, setUploadProgress);
                toast.success("Imagen subida.");
            }
            
            const payload = { ...formData, foto_hallazgo: imageUrl };
            const response = await submitAction(payload);
            return response.data;
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Ocurrió un error.";
            toast.error(errorMsg);
            console.error("❌ Error en handleSubmit de Hallazgo:", err);
            return null;
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    // ✅ CORRECCIÓN 2: La función reset debe usar el estado inicial correcto
    const resetForm = useCallback(() => {
        setFormData(initialHallazgoFormState);
    }, []);

    return {
        formData,
        setFormData,
        handleChange,
        handleNestedChange,
        handleArrayChange,
        addArrayItem,
        removeArrayItem,
        resetForm, // <-- Exportamos la función de reset
        setImageFile,
        handleSubmit,
        isSubmitting,
        uploadProgress
    };
};