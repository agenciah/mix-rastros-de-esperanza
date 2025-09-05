// 📁 src/components/admin/fichas/FichaFormulario.jsx

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

// Importamos el hook que nos diste al inicio
import useCatalogos from "@/hooks/useCatalogos";

export default function FichaFormulario({ ficha, onSave, onCancel, onDelete }) {
  const [fichaLocal, setFichaLocal] = useState(ficha);
  const { tiposLugar, partesCuerpo, prendas, loading: catalogosLoading } = useCatalogos();

  useEffect(() => {
    setFichaLocal(ficha);
  }, [ficha]);

  if (catalogosLoading) {
    return <p className="text-center">Cargando catálogos...</p>;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Si el campo pertenece a la ubicación, lo actualizamos dentro de su objeto
    if (fichaLocal.ubicacion_desaparicion && fichaLocal.ubicacion_desaparicion.hasOwnProperty(name)) {
      setFichaLocal({
        ...fichaLocal,
        ubicacion_desaparicion: {
          ...fichaLocal.ubicacion_desaparicion,
          [name]: value,
        },
      });
    } else {
      setFichaLocal({ ...fichaLocal, [name]: value });
    }
  };

  const handleRasgoChange = (index, e) => {
    const { name, value } = e.target;
    const newRasgos = [...fichaLocal.rasgos_fisicos];
    newRasgos[index] = { ...newRasgos[index], [name]: value };
    setFichaLocal({ ...fichaLocal, rasgos_fisicos: newRasgos });
  };

  const handleAddRasgo = () => {
    setFichaLocal({
      ...fichaLocal,
      rasgos_fisicos: [
        ...fichaLocal.rasgos_fisicos,
        { id_parte_cuerpo: "", tipo_rasgo: "", descripcion_detalle: "" },
      ],
    });
  };

  const handleRemoveRasgo = (index) => {
    const newRasgos = fichaLocal.rasgos_fisicos.filter((_, i) => i !== index);
    setFichaLocal({ ...fichaLocal, rasgos_fisicos: newRasgos });
  };

  const handleVestimentaChange = (index, e) => {
    const { name, value } = e.target;
    const newVestimenta = [...fichaLocal.vestimenta];
    newVestimenta[index] = { ...newVestimenta[index], [name]: value };
    setFichaLocal({ ...fichaLocal, vestimenta: newVestimenta });
  };

  const handleAddVestimenta = () => {
    setFichaLocal({
      ...fichaLocal,
      vestimenta: [
        ...fichaLocal.vestimenta,
        { id_prenda: "", color: "", marca: "", caracteristica_especial: "" },
      ],
    });
  };

  const handleRemoveVestimenta = (index) => {
    const newVestimenta = fichaLocal.vestimenta.filter((_, i) => i !== index);
    setFichaLocal({ ...fichaLocal, vestimenta: newVestimenta });
  };

  const handleSave = () => {
    onSave(fichaLocal);
  };

  const handleDelete = () => {
    onDelete(fichaLocal.id_ficha);
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Detalles de la Ficha</CardTitle>
        <CardDescription>
          Revisa y edita la información de la ficha de desaparición.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Datos del Creador */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Datos del Creador</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre de Usuario</Label>
              <Input
                value={ficha.nombre_usuario}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Correo del Usuario</Label>
              <Input
                value={ficha.email_usuario}
                disabled
              />
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Datos Personales */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Datos Personales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                value={fichaLocal.nombre}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="segundo_nombre">Segundo Nombre</Label>
              <Input
                id="segundo_nombre"
                name="segundo_nombre"
                value={fichaLocal.segundo_nombre}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido_paterno">Apellido Paterno</Label>
              <Input
                id="apellido_paterno"
                name="apellido_paterno"
                value={fichaLocal.apellido_paterno}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido_materno">Apellido Materno</Label>
              <Input
                id="apellido_materno"
                name="apellido_materno"
                value={fichaLocal.apellido_materno}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fecha_desaparicion">Fecha de Desaparición</Label>
            <Input
              id="fecha_desaparicion"
              name="fecha_desaparicion"
              type="date"
              value={fichaLocal.fecha_desaparicion}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="foto_perfil">URL de la Foto</Label>
            <Input
              id="foto_perfil"
              name="foto_perfil"
              value={fichaLocal.foto_perfil}
              onChange={handleChange}
            />
          </div>
        </div>

        <Separator className="my-4" />

        {/* Estatus y Ubicación */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Estatus y Ubicación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estado_ficha">Estado de la Ficha</Label>
              <Select
                name="estado_ficha"
                onValueChange={(value) => setFichaLocal({ ...fichaLocal, estado_ficha: value })}
                value={fichaLocal.estado_ficha}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="encontrada">Encontrada</SelectItem>
                  <SelectItem value="descartada">Descartada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado_pago">Estado de Pago</Label>
              <Select
                name="estado_pago"
                onValueChange={(value) => setFichaLocal({ ...fichaLocal, estado_pago: value })}
                value={fichaLocal.estado_pago}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el estado de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fecha_registro_encontrado">Fecha de Registro Encontrado</Label>
            <Input
              id="fecha_registro_encontrado"
              name="fecha_registro_encontrado"
              type="date"
              value={fichaLocal.fecha_registro_encontrado}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ubicacion_desaparicion.estado">Estado de Desaparición</Label>
            <Input
              id="ubicacion_desaparicion.estado"
              name="estado"
              value={fichaLocal.ubicacion_desaparicion?.estado || ""}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ubicacion_desaparicion.municipio">Municipio de Desaparición</Label>
            <Input
              id="ubicacion_desaparicion.municipio"
              name="municipio"
              value={fichaLocal.ubicacion_desaparicion?.municipio || ""}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="id_tipo_lugar_desaparicion">Tipo de Lugar</Label>
            <Select
              name="id_tipo_lugar_desaparicion"
              onValueChange={(value) => setFichaLocal({ ...fichaLocal, id_tipo_lugar_desaparicion: parseInt(value) })}
              value={fichaLocal.id_tipo_lugar_desaparicion?.toString() || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo de lugar" />
              </SelectTrigger>
              <SelectContent>
                {tiposLugar.map((tipo) => (
                  <SelectItem key={tipo.id_tipo_lugar} value={tipo.id_tipo_lugar.toString()}>
                    {tipo.nombre_tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Rasgos Físicos */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Rasgos Físicos</h2>
            <Button onClick={handleAddRasgo} type="button">
              Agregar Rasgo
            </Button>
          </div>
          {fichaLocal.rasgos_fisicos.map((rasgo, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-md">
              <div className="space-y-2">
                <Label>Parte del Cuerpo</Label>
                <Select
                  name="id_parte_cuerpo"
                  onValueChange={(value) =>
                    handleRasgoChange(index, { target: { name: "id_parte_cuerpo", value: parseInt(value) } })
                  }
                  value={rasgo.id_parte_cuerpo?.toString() || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una parte" />
                  </SelectTrigger>
                  <SelectContent>
                    {partesCuerpo.map((parte) => (
                      <SelectItem key={parte.id} value={parte.id.toString()}>
                        {parte.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Rasgo</Label>
                <Input
                  name="tipo_rasgo"
                  value={rasgo.tipo_rasgo}
                  onChange={(e) => handleRasgoChange(index, e)}
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción Detallada</Label>
                <Textarea
                  name="descripcion_detalle"
                  value={rasgo.descripcion_detalle}
                  onChange={(e) => handleRasgoChange(index, e)}
                />
              </div>
              <div className="col-span-3 text-right">
                <Button variant="destructive" size="sm" onClick={() => handleRemoveRasgo(index)}>
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Vestimenta */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Vestimenta</h2>
            <Button onClick={handleAddVestimenta} type="button">
              Agregar Prenda
            </Button>
          </div>
          {fichaLocal.vestimenta.map((prenda, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded-md">
              <div className="space-y-2">
                <Label>Prenda</Label>
                <Select
                  name="id_prenda"
                  onValueChange={(value) =>
                    handleVestimentaChange(index, { target: { name: "id_prenda", value: parseInt(value) } })
                  }
                  value={prenda.id_prenda?.toString() || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una prenda" />
                  </SelectTrigger>
                  <SelectContent>
                    {prendas.map((p) => (
                      <SelectItem key={p.id_prenda} value={p.id_prenda.toString()}>
                        {p.tipo_prenda}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  name="color"
                  value={prenda.color}
                  onChange={(e) => handleVestimentaChange(index, e)}
                />
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input
                  name="marca"
                  value={prenda.marca}
                  onChange={(e) => handleVestimentaChange(index, e)}
                />
              </div>
              <div className="space-y-2">
                <Label>Característica Especial</Label>
                <Textarea
                  name="caracteristica_especial"
                  value={prenda.caracteristica_especial}
                  onChange={(e) => handleVestimentaChange(index, e)}
                />
              </div>
              <div className="col-span-4 text-right">
                <Button variant="destructive" size="sm" onClick={() => handleRemoveVestimenta(index)}>
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          Eliminar
        </Button>
        <Button onClick={handleSave}>
          Guardar Cambios
        </Button>
      </CardFooter>
    </Card>
  );
}