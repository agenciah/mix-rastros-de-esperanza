// RUTA: frontend/hooks/useHallazgosForm.js

import { useState, useEffect, useCallback } from 'react';
import { initialHallazgoFormState } from '@/lib/initialFormState';
import { storage } from "@/lib/firebase"; // Ajusta la ruta a tu config de Firebase
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from 'sonner';

/**
 * Hook de Formularios para Hallazgos.
 * Maneja el estado del formulario, la subida de imágenes y la lógica de envío.
 */
export const useHallazgosForm = (initialData = null) => {
     const [formData, setFormData] = useState(initialData); 
    const [imageFile, setImageFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Efecto para popular el formulario con datos iniciales (para edición)
    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData(initialHallazgoFormState);
        }
    }, [initialData]);
    
    // --- MANEJADORES DE ESTADO (HANDLERS) ---
    // Estos son los manejadores universales que ya tenías, están perfectos.

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleNestedChange = useCallback((path, value) => {
        const [parent, child] = path.split('.');
        setFormData(prev => ({
            ...prev,
            [parent]: { ...prev[parent], [child]: value }
        }));
    }, []);

    const handleArrayChange = useCallback((arrayName, index, fieldName, value) => {
        setFormData(prev => {
            const newArray = [...prev[arrayName]];
            newArray[index] = { ...newArray[index], [fieldName]: value };
            return { ...prev, [arrayName]: newArray };
        });
    }, []);
    
    const addArrayItem = useCallback((arrayName, newItem) => {
        setFormData(prev => ({ ...prev, [arrayName]: [...prev[arrayName], newItem] }));
    }, []);

    const removeArrayItem = useCallback((arrayName, index) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: prev[arrayName].filter((_, i) => i !== index)
        }));
    }, []);


    /**
     * Proceso de envío del formulario.
     * @param {function} submitAction - La función a ejecutar (ej. createHallazgo o actualizarHallazgo).
     * @returns {Promise<object|null>} - La respuesta de la API o null si hay error.
     */
    const handleSubmit = async (submitAction) => {
        setIsSubmitting(true);
        toast.info("Guardando hallazgo...");
        let imageUrl = formData.foto_hallazgo || null; 

        try {
            // 1. Subir la imagen si hay una nueva
            if (imageFile) {
                toast.info("Subiendo imagen...");
                imageUrl = await uploadImage(imageFile, setUploadProgress);
                toast.success("Imagen subida.");
            }

            // 2. Preparar los datos finales a enviar
            const payload = { ...formData, foto_hallazgo: imageUrl };
            
            // 3. Ejecutar la acción (crear o actualizar)
            const response = await submitAction(payload);

            toast.success("¡Hallazgo guardado con éxito!");
            return response; // Devolvemos la respuesta para que el componente pueda redirigir

        } catch (err) {
            console.error("❌ Error en el proceso de guardado:", err);
            toast.error(err.message || "Ocurrió un error al guardar.");
            return null;
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    return {
        formData,
        setFormData, // Exponemos setFormData por si se necesita un cambio manual
        handleChange,
        handleNestedChange,
        handleArrayChange,
        addArrayItem,
        removeArrayItem,
        handleSubmit,
        uploadProgress,
        isSubmitting,
        setImageFile,
    };
};


// --- FUNCIÓN HELPER PARA LA SUBIDA DE IMAGEN ---
// La sacamos del hook para que sea más limpia y reutilizable

const uploadImage = (file, onProgress) => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
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