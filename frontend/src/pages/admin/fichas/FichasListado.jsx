// 📁 src/components/admin/fichas/FichasListado.jsx

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FichasListado({ fichas, loading, error, onSelectFicha }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Cargando fichas...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-red-600">
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Listado de Fichas</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {fichas.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Apellido Paterno</TableHead>
                <TableHead>Fecha Desaparición</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fichas.map((ficha) => (
                <TableRow
                  key={ficha.id_ficha}
                  onClick={() => onSelectFicha(ficha.id_ficha)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{ficha.nombre}</TableCell>
                  <TableCell>{ficha.apellido_paterno}</TableCell>
                  <TableCell>{ficha.fecha_desaparicion}</TableCell>
                  <TableCell>{ficha.estado_ficha}</TableCell>
                  <TableCell>
                    {ficha.nombre_usuario || ficha.email_usuario}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-500 py-6">
            No se encontraron fichas que coincidan con la búsqueda.
          </p>
        )}
      </CardContent>
    </Card>
  );
}