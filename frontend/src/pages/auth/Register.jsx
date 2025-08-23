import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "@/lib/axios";
import LegalLayout from "@/layouts/LegalLayouts";
import { Checkbox } from "@/components/ui/checkbox"; // Importa el componente Checkbox
import { Label } from "@/components/ui/label"; // Importa el componente Label

// Se actualiza el esquema de validación para incluir la casilla de términos y condiciones
const schema = z.object({
  nombre: z.string().min(2, { message: "Mínimo 2 caracteres" }),
  email: z.string().email({ message: "Correo inválido" }),
  password: z.string().min(6, { message: "Mínimo 6 caracteres" }),
  telefono: z
    .string()
    .min(10, { message: "Número inválido, mínimo 10 dígitos" })
    .max(15, { message: "Número demasiado largo" })
    .regex(/^\+?\d+$/, "Formato inválido, solo números y opcional + al inicio"),
  // Se añade la validación para la casilla de aceptación de términos
  acepto_terminos: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar los términos y condiciones" }),
  }),
});

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [esAnual, setEsAnual] = useState(false);

  useEffect(() => {
    const planGuardado = localStorage.getItem("planSeleccionado");
    if (planGuardado) {
      try {
        const parsed = JSON.parse(planGuardado);
        setPlanSeleccionado(parsed);
        setEsAnual(parsed.esAnual || false);
      } catch {
        console.warn("⚠️ Error al parsear planSeleccionado");
        setPlanSeleccionado(null);
        setEsAnual(false);
      }
    } else {
      console.warn("⚠️ No hay planSeleccionado en localStorage");
      navigate("/seleccionar-plan");
    }
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    // Se establece el valor por defecto para la casilla de términos y condiciones
    defaultValues: {
      acepto_terminos: false,
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const payload = {
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        telefono: data.telefono,
        plan: planSeleccionado ? [planSeleccionado.id] : ['trial'],
        esAnual,
        // Se añade la aceptación de términos al payload que se envía al backend
        acepto_terminos: data.acepto_terminos,
      };
      console.log("Payload enviado al backend:", payload);
      await api.post("/auth/register", payload);

      toast.success(
        "Registro exitoso. Revisa tu correo para confirmar tu cuenta. Luego completa tus datos fiscales para facturar tus tickets desde Configuración."
      );
      localStorage.removeItem("planSeleccionado");
      localStorage.setItem("correoRegistrado", data.email);
      navigate("/correo-enviado");
    } catch (err) {
      toast.error(err.response?.data?.error || "No se pudo registrar. Intenta con otro correo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <LegalLayout>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-muted p-6 rounded-md max-w-sm w-full space-y-4 shadow"
        >
          <h1 className="text-xl font-bold text-center">Crear cuenta</h1>

          {planSeleccionado ? (
            <div className="mb-4 p-3 bg-blue-50 rounded text-blue-700 border border-blue-200">
              <p className="font-semibold mb-1">
                Plan seleccionado ({esAnual ? "anual" : "mensual"}):
              </p>
              <p className="text-lg font-semibold">{planSeleccionado.nombre}</p>
              <p className="text-sm text-gray-700">
                ${esAnual ? planSeleccionado.precio * 11 : planSeleccionado.precio}{" "}
                {esAnual ? " / año" : " / mes"}
              </p>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-yellow-50 rounded text-yellow-700 border border-yellow-200 text-center text-sm">
              No has seleccionado ningún plan aún.{" "}
              <Link to="/seleccionar-plan" className="underline text-yellow-900 font-semibold">
                Elige uno aquí
              </Link>
            </div>
          )}

          <div>
            <Label>Nombre</Label>
            <Input {...register("nombre")} />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
          </div>

          <div>
            <Label>Correo electrónico</Label>
            <Input type="email" {...register("email")} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Label>Número de teléfono (WhatsApp)</Label>
            <Input type="tel" placeholder="+5211234567890" {...register("telefono")} />
            {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono.message}</p>}
          </div>

          <div>
            <Label>Contraseña</Label>
            <Input type="password" {...register("password")} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          
          {/* Se añade la casilla de verificación para los términos y condiciones */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="acepto_terminos"
              {...register("acepto_terminos")}
            />
            <Label
              htmlFor="acepto_terminos"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Acepto los{" "}
              <Link to="/terminos-y-condiciones" className="underline text-blue-600 hover:text-blue-800">
                términos y condiciones
              </Link>
            </Label>
          </div>
          {errors.acepto_terminos && <p className="text-red-500 text-xs mt-1">{errors.acepto_terminos.message}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando..." : "Crear cuenta"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
        </form>
      </LegalLayout>
    </div>
  );
};

export default Register;