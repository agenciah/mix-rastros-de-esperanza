// RUTA: frontend/hooks/useFichaForm.js

import { useState, useEffect, useCallback } from 'react';
import { initialFichaFormState } from '@/lib/initialFormState';
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from 'sonner';

const uploadImage = (file, onProgress) => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, `fichas_images/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed',
            (snapshot) => onProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            (error) => {
                console.error("Firebase upload error:", error);
                reject(new Error("Error al subir la imagen. Revisa los permisos de Storage en Firebase."));
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
};

export const useFichaForm = (initialData = initialFichaFormState) => {
    const [formData, setFormData] = useState(initialData);
    const [imageFile, setImageFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        setFormData(initialData || initialFichaFormState);
    }, [initialData]);
    
    // --- MANEJADORES DE ESTADO COMPLETOS ---
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => (prev ? { ...prev, [name]: value } : null));
    }, []);

    const handleNestedChange = useCallback((path, value) => {
        const [parent, child] = path.split('.');
        setFormData(prev => (prev ? { ...prev, [parent]: { ...prev[parent], [child]: value } } : null));
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

    // ✅ LA VERSIÓN CORRECTA DE handleSubmit QUE SÍ ACEPTA UN ARGUMENTO
    const handleSubmit = async (submitAction) => {
        if (!formData) {
            toast.error("No hay datos en el formulario para guardar.");
            return null;
        }
        setIsSubmitting(true);
        toast.info("Guardando ficha...");
        let imageUrl = formData.foto_perfil || null; 

        try {
            if (imageFile) {
                toast.info("Subiendo imagen...");
                imageUrl = await uploadImage(imageFile, setUploadProgress);
                toast.success("Imagen subida.");
            }
            
            const payload = { ...formData, foto_perfil: imageUrl };
            
            // Llama a la función que le pasaron (ej. createFicha)
            const response = await submitAction(payload);

            toast.success(response.data.message || "Operación exitosa.");
            return response.data;

        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Ocurrió un error.";
            toast.error(errorMsg);
            console.error("❌ Error en handleSubmit de Ficha:", err);
            return null;
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };
    
    return {
        formData, setFormData, isSubmitting, uploadProgress, setImageFile,
        handleChange, handleNestedChange, handleArrayChange, addArrayItem, removeArrayItem,
        handleSubmit,
    };
};