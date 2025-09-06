// src/pages/dashboard/fichas/FichaFormLayout.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from 'lucide-react';
import useFichaForm from "@/hooks/useFichaForm";

import RasgosFisicosForm from "./RasgosFisicosForm";
import VestimentaForm from "./VestimentaForm";
import DatosPrincipalesForm from "./DatosPrincipalesForm";

export default function FichaFormLayout() {
    // --- INICIO: Lógica de Verificación de Límite de Fichas ---
    const [activeFichasCount, setActiveFichasCount] = useState(0);
    const [loadingCheck, setLoadingCheck] = useState(true);
    const planLimit = 1; // Límite para el plan de donación básico. Puedes cambiarlo a 2 o 3 si lo deseas.

    useEffect(() => {
        const checkFichaLimit = async () => {
            try {
                const response = await api.get('/api/fichas/user-stats');
                setActiveFichasCount(response.data.data.activeFichasCount);
            } catch (error) {
                console.error("Error al verificar el límite de fichas:", error);
                // En caso de error, asumimos que puede continuar para no bloquear al usuario.
            } finally {
                setLoadingCheck(false);
            }
        };
        checkFichaLimit();
    }, []);
    // --- FIN: Lógica de Verificación ---

    // El hook del formulario se mantiene igual
    const form = useFichaForm();
    const {
        datosPrincipales, setDatosPrincipales,
        rasgosFisicos, setRasgosFisicos,
        vestimenta, setVestimenta,
        loading: isSubmitting, // Renombramos 'loading' para evitar conflictos
        error,
        handleSubmit,
    } = form;

    // 1. Renderizado condicional: Muestra un spinner mientras se verifica el límite
    if (loadingCheck) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2">Verificando tu cuenta...</span>
            </div>
        );
    }

    // 2. Renderizado condicional: Muestra el mensaje de límite alcanzado
    if (activeFichasCount >= planLimit) {
        return (
            <div className="max-w-lg mx-auto p-6">
                <Card className="text-center">
                    <CardHeader>
                        <CardTitle className="flex justify-center items-center">
                            <AlertCircle className="mr-2 text-yellow-500" />
                            Límite de Fichas Alcanzado
                        </CardTitle>
                        <CardDescription>
                            Tu plan de donación actual te permite mantener {planLimit} ficha de búsqueda activa.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-sm text-gray-700">
                            Para registrar una nueva ficha, puedes desactivar una existente o considerar actualizar tu nivel de donación para apoyar la plataforma y activar más búsquedas.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button asChild>
                                <Link to="/dashboard/configuracion">
                                    Ver Opciones de Donación
                                </Link>
                            </Button>
                             <Button asChild variant="outline">
                                <Link to="/dashboard/fichas">
                                    Gestionar mis Fichas
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 3. Si todo está en orden, muestra el formulario de creación
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>Registro de Ficha</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <section>
                        <h2 className="text-lg font-semibold mb-2">Datos Principales</h2>
                        <DatosPrincipalesForm
                            datos={datosPrincipales}
                            setDatos={setDatosPrincipales}
                        />
                    </section>
                    <Separator />
                    <section>
                        <h2 className="text-lg font-semibold mb-2">Rasgos Físicos</h2>
                        <RasgosFisicosForm
                            rasgos={rasgosFisicos}
                            setRasgos={setRasgosFisicos}
                        />
                    </section>
                    <Separator />
                    <section>
                        <h2 className="text-lg font-semibold mb-2">Vestimenta</h2>
                        <VestimentaForm
                            vestimenta={vestimenta}
                            setVestimenta={setVestimenta}
                        />
                    </section>
                    <div className="pt-4">
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : "Crear Ficha"}
                        </Button>
                        {error && <p className="text-red-500 mt-2">{error}</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}