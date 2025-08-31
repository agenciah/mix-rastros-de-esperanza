import { useState } from 'react';

/**
 * @fileoverview Hook universal para manejar el estado y la lógica de formularios de hallazgos.
 * Proporciona funciones para actualizar los campos y manejar arrays de datos dinámicos.
 */
export const useFormHallazgos = (initialState) => {
    const [formData, setFormData] = useState(initialState);

    // Maneja cambios en campos de nivel superior (nombre, fecha, etc.)
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // Maneja cambios en campos anidados (e.g., ubicacion_hallazgo)
    const handleNestedChange = (name, value) => {
        setFormData(prev => {
            const [parent, child] = name.split('.');
            if (parent && child) {
                return {
                    ...prev,
                    [parent]: {
                        ...prev[parent],
                        [child]: value,
                    },
                };
            }
            return prev;
        });
    };

    // Maneja cambios en arrays de objetos (e.g., caracteristicas, vestimenta)
    const handleArrayChange = (arrayName, index, fieldName, value) => {
        setFormData(prev => {
            const updatedArray = [...prev[arrayName]];
            updatedArray[index][fieldName] = value;
            return {
                ...prev,
                [arrayName]: updatedArray,
            };
        });
    };

    // Agrega un nuevo objeto a un array (e.g., una nueva prenda)
    const addArrayItem = (arrayName, newItem) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: [...prev[arrayName], newItem],
        }));
    };

    // Elimina un objeto de un array
    const removeArrayItem = (arrayName, index) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: prev[arrayName].filter((_, i) => i !== index),
        }));
    };

    // Restablece el formulario a su estado inicial
    const resetForm = () => {
        setFormData(initialState);
    };

    return {
        formData,
        setFormData,
        handleChange,
        handleNestedChange,
        handleArrayChange,
        addArrayItem,
        removeArrayItem,
        resetForm,
    };
};