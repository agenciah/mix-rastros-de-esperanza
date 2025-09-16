// RUTA: backend/utils/matchingHelpers.js
// Contiene funciones puras de JavaScript para la lógica de comparación.

export function checkGeneralDataMatch(ficha, hallazgo) {
    let score = 0;
    let criteria = [];
    if (ficha.genero && hallazgo.genero && ficha.genero === hallazgo.genero) {
        score += 200;
        criteria.push('Género');
    }
    if (ficha.edad_estimada && hallazgo.edad_estimada) {
        const ageDiff = Math.abs(ficha.edad_estimada - hallazgo.edad_estimada);
        if (ageDiff <= 3) {
            score += 150 - (ageDiff * 25);
            criteria.push(`Edad (dif. ${ageDiff})`);
        }
    }
    if (ficha.estatura && hallazgo.estatura) {
        const estaturaDiff = Math.abs(ficha.estatura - hallazgo.estatura);
        if (estaturaDiff <= 5) { score += 100; criteria.push('Estatura'); }
    }
    if (ficha.peso && hallazgo.peso) {
        const pesoDiff = Math.abs(ficha.peso - hallazgo.peso);
        if (pesoDiff <= 5) { score += 100; criteria.push('Peso'); }
    }
    if (ficha.complexion && hallazgo.complexion && ficha.complexion.toLowerCase() === hallazgo.complexion.toLowerCase()) {
        score += 50;
        criteria.push('Complexión');
    }
    return { score, criteria };
}

export function checkLocationMatch(ubicacionFicha, ubicacionHallazgo) {
    let score = 0;
    let criteria = [];
    if (ubicacionFicha?.estado && ubicacionHallazgo?.estado && ubicacionFicha.estado === ubicacionHallazgo.estado) {
        score += 50;
        criteria.push('Estado');
        if (ubicacionFicha?.municipio && ubicacionHallazgo?.municipio && ubicacionFicha.municipio === ubicacionHallazgo.municipio) {
            score += 100;
            criteria.push('Municipio');
        }
    }
    return { score, criteria };
}

export function checkRasgosMatch(rasgosFicha, caracteristicasHallazgo) {
    let score = 0;
    let criteria = [];
    if (!rasgosFicha?.length || !caracteristicasHallazgo?.length) return { score, criteria };
    
    for (const rasgo of rasgosFicha) {
        if (caracteristicasHallazgo.some(c => c.descripcion.toLowerCase().includes(rasgo.descripcion_detalle.toLowerCase()))) {
            score += 50;
            criteria.push(`Rasgo: ${rasgo.descripcion_detalle}`);
        }
    }
    return { score, criteria };
}

export function checkVestimentaMatch(vestimentaFicha, vestimentaHallazgo) {
    let score = 0;
    let criteria = [];
    if (!vestimentaFicha?.length || !vestimentaHallazgo?.length) return { score, criteria };

    for (const prendaFicha of vestimentaFicha) {
        const matchedPrenda = vestimentaHallazgo.find(prendaHallazgo => 
            prendaHallazgo.id_prenda === prendaFicha.id_prenda &&
            (prendaFicha.color && prendaHallazgo.color && prendaHallazgo.color.toLowerCase() === prendaFicha.color.toLowerCase())
        );
        if (matchedPrenda) {
            score += 30;
            criteria.push(`Vestimenta: ${prendaFicha.color}`);
        }
    }
    return { score, criteria };
}

export function checkNameMatch(ficha, hallazgo) {
    let score = 0;
    let criteria = [];
    if (!ficha.nombre || !ficha.apellido_paterno || !hallazgo.nombre || !hallazgo.apellido_paterno) {
        return { score, criteria };
    }
    
    const fichaNombre = `${ficha.nombre} ${ficha.apellido_paterno}`.toLowerCase().trim();
    const hallazgoNombre = `${hallazgo.nombre} ${hallazgo.apellido_paterno}`.toLowerCase().trim();
    
    if (fichaNombre === hallazgoNombre) {
        score += 500;
        criteria.push('Nombre Exacto');
    } else if (ficha.nombre.toLowerCase() === hallazgo.nombre.toLowerCase()) {
        score += 100;
        criteria.push('Primer Nombre');
    }
    return { score, criteria };
}