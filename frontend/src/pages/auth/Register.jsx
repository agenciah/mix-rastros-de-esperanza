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
import { Controller } from "react-hook-form";


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
  estado_republica: z.string().min(1, { message: "Selecciona un estado" }),
  acepto_terminos: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar los términos y condiciones" }),
  }),
});

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [esAnual, setEsAnual] = useState(false);
  const estadosRepublica = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima",
  "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo",
  "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca",
  "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
  "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz",
  "Yucatán", "Zacatecas"
];

  const {
    register,
    handleSubmit,
    formState: { errors },
    control, // Asegúrate de importar 'control' aquí
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      acepto_terminos: false,
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const payload = {
        nombre: data.nombre,
        email: data.email.trim().toLowerCase(),
        password: data.password,
        telefono: data.telefono,
        estado_republica: data.estado_republica, // 👈 nuevo
        plan: planSeleccionado ? planSeleccionado.id : "trial",
        esAnual,
        acepto_terminos: data.acepto_terminos,
      };
      console.log("Payload enviado al backend:", payload);
      await api.post("/api/auth/register", payload);

      toast.success(
        "Registro exitoso. Revisa tu correo para confirmar tu cuenta. Luego completa tus datos fiscales para facturar tus tickets desde Configuración."
      );
      localStorage.removeItem("planSeleccionado");
      localStorage.setItem("correoRegistrado", data.email);
      navigate("/correo-enviado");
    } catch (err) {
      toast.error(err.response?.data?.error || "No se pudo registrar. Intenta con otro correo");
      console.error("Error en registro:", err.response || err.message);
      console.error("Detalles del error:", err.response?.data);
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
            <Label>Estado de la República</Label>
            <select
              {...register("estado_republica")}
              className="w-full border rounded px-2 py-2"
            >
              <option value="">-- Selecciona un estado --</option>
              {estadosRepublica.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
            {errors.estado_republica && (
              <p className="text-red-500 text-xs mt-1">{errors.estado_republica.message}</p>
            )}
          </div>


          <div>
            <Label>Contraseña</Label>
            <Input type="password" {...register("password")} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          
          {/* Se añade la casilla de verificación para los términos y condiciones */}
          <div className="flex items-center space-x-2">
        <Controller
          name="acepto_terminos"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="acepto_terminos"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
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