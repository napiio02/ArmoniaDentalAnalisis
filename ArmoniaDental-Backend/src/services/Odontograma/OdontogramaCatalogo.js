export const PIEZAS_POR_DENTADURA = {
  permanente: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
    31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48],
  temporal: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65, 71, 72, 73, 74, 75, 81, 82, 83, 84, 85],
};

export const AREAS_DENTALES = ["V", "L", "M", "D", "O"];

export const ACCIONES_ODONTOGRAMA = [
  { codigo: "caries_cavitada", nombre: "Caries cavitada", grupo: "Hallazgos", color: "#dc2626", abreviatura: "CAR", tipo_render: "shape" },
  { codigo: "fractura_coronal", nombre: "Fractura coronal", grupo: "Hallazgos", color: "#dc2626", abreviatura: "FRC", tipo_render: "shape" },
  { codigo: "ausente", nombre: "Pieza ausente", grupo: "Hallazgos", color: "#111827", abreviatura: "AUS", tipo_render: "whole", grupo_exclusivo: "estado_estructural" },
  { codigo: "resto_radicular", nombre: "Resto radicular", grupo: "Hallazgos", color: "#dc2626", abreviatura: "RR", tipo_render: "whole", grupo_exclusivo: "estado_estructural" },
  { codigo: "indicada_exodoncia", nombre: "Indicada para exodoncia", grupo: "Hallazgos", color: "#dc2626", abreviatura: "EXO", tipo_render: "whole", grupo_exclusivo: "estado_estructural" },
  { codigo: "giroversion", nombre: "Giroversión", grupo: "Hallazgos", color: "#2563eb", abreviatura: "GIR", tipo_render: "label" },
  { codigo: "fusion", nombre: "Fusión", grupo: "Hallazgos", color: "#2563eb", abreviatura: "FUS", tipo_render: "label" },
  { codigo: "resina", nombre: "Resina", grupo: "Restauraciones y tratamientos", color: "#16a34a", abreviatura: "RES", tipo_render: "faces" },
  { codigo: "amalgama", nombre: "Amalgama", grupo: "Restauraciones y tratamientos", color: "#2563eb", abreviatura: "AMA", tipo_render: "faces" },
  { codigo: "material_temporal", nombre: "Material temporal", grupo: "Restauraciones y tratamientos", color: "#dc2626", abreviatura: "TEMP", tipo_render: "faces" },
  { codigo: "sellante", nombre: "Sellante", grupo: "Restauraciones y tratamientos", color: "#16a34a", abreviatura: "S", tipo_render: "whole" },
  { codigo: "incrustacion", nombre: "Incrustación", grupo: "Restauraciones y tratamientos", color: "#2563eb", abreviatura: "INC", tipo_render: "faces" },
  { codigo: "endodoncia", nombre: "Endodoncia", grupo: "Restauraciones y tratamientos", color: "#2563eb", abreviatura: "ENDO", tipo_render: "whole" },
  { codigo: "implante", nombre: "Implante", grupo: "Restauraciones y tratamientos", color: "#111827", abreviatura: "IMP", tipo_render: "whole", grupo_exclusivo: "estado_estructural" },
  { codigo: "brackets", nombre: "Ortodoncia fija", grupo: "Restauraciones y tratamientos", color: "#111827", abreviatura: "ORTO", tipo_render: "label" },
  { codigo: "corona_metal_porcelana", nombre: "Corona metal porcelana", grupo: "Coronas", color: "#2563eb", abreviatura: "CMP", tipo_render: "whole", grupo_exclusivo: "coronas" },
  { codigo: "corona_libre_metal", nombre: "Corona libre de metal", grupo: "Coronas", color: "#2563eb", abreviatura: "CLM", tipo_render: "whole", grupo_exclusivo: "coronas" },
  { codigo: "corona_acero_cromado", nombre: "Corona de acero cromado", grupo: "Coronas", color: "#2563eb", abreviatura: "CAC", tipo_render: "whole", grupo_exclusivo: "coronas" },
];
