const CATEGORIES = {
  'Ropa, Zapatos y Joyería': {
    'Ropa': {
      'Mujer': ['Vestidos','Blusas y camisas','Camisetas y tops','Pantalones','Jeans','Faldas','Shorts','Chaquetas y abrigos','Sudaderas','Ropa deportiva','Ropa interior','Pijamas','Trajes de baño','Maternidad'],
      'Hombre': ['Camisetas','Camisas','Polos','Pantalones','Jeans','Shorts','Chaquetas y abrigos','Sudaderas','Ropa deportiva','Ropa interior','Pijamas','Trajes de baño','Trajes y sacos'],
      'Niño': ['Camisetas','Camisas','Pantalones','Jeans','Shorts','Sudaderas','Chaquetas','Pijamas','Ropa deportiva','Trajes de baño'],
      'Niña': ['Camisetas','Camisas','Vestidos','Pantalones','Jeans','Faldas','Shorts','Sudaderas','Chaquetas','Pijamas','Ropa deportiva','Trajes de baño'],
      'Bebés': ['Bodies','Conjuntos','Pijamas','Vestidos','Pantalones','Chaquetas','Ropa para recién nacido'],
      'Unisex': ['Camisetas','Sudaderas','Chaquetas','Ropa deportiva']
    },
    'Zapatos': {
      'Mujer': ['Tenis','Casuales','Formales','Sandalias','Tacones','Botas y botines','Flats y bailarinas','Mocasines','Zapatillas deportivas','Zapatos de trabajo','Escolares'],
      'Hombre': ['Tenis','Casuales','Formales','Sandalias','Botas y botines','Mocasines','Zapatillas deportivas','Zapatos de trabajo','Escolares'],
      'Niño': ['Tenis','Casuales','Sandalias','Botas y botines','Zapatillas deportivas','Escolares','Primeros pasos'],
      'Niña': ['Tenis','Casuales','Sandalias','Botas y botines','Flats y bailarinas','Zapatillas deportivas','Escolares','Primeros pasos'],
      'Unisex': ['Tenis','Casuales','Sandalias','Botas y botines','Zapatillas deportivas','Zapatos de trabajo','Escolares']
    },
    'Joyería': {
      'Anillos': ['Moda','Compromiso','Boda','Graduación','Sellos','Ajustables'],
      'Collares': ['Cadenas','Dijes','Gargantillas','Religiosos','Personalizados'],
      'Pulseras': ['Cadenas','Brazaletes','Charm','Tobilleras','Personalizadas'],
      'Aretes': ['Stud','Argollas','Colgantes','Ear cuffs','Piercing'],
      'Relojes': ['Hombre','Mujer','Unisex','Smartwatch'],
      'Accesorios de joyería': ['Estuches','Organizadores','Limpiadores']
    },
    'Accesorios de moda': {
      'Bolsos y carteras': ['Bolsos','Mochilas','Carteras','Monederos','Riñoneras'],
      'Accesorios': ['Cinturones','Gorras y sombreros','Lentes de sol','Bufandas','Corbatas','Guantes','Accesorios para cabello']
    }
  },
  'Electrónica': {
    'Celulares y accesorios': {
      'Celulares': ['Smartphones','Teléfonos básicos','Reacondicionados'],
      'Accesorios para celular': ['Fundas','Protectores de pantalla','Cargadores','Cables','Power banks','Soportes','Audífonos Bluetooth','Accesorios MagSafe']
    },
    'Computación': {
      'Computadoras': ['Laptops','PC de escritorio','Mini PC','All in One'],
      'Componentes': ['Procesadores','Tarjetas gráficas','Placas madre','Memoria RAM','Almacenamiento SSD/HDD','Fuentes de poder','Gabinetes','Refrigeración'],
      'Periféricos': ['Monitores','Teclados','Mouse','Webcams','Micrófonos','Impresoras','Escáneres','UPS y reguladores'],
      'Redes': ['Routers','Switches','Adaptadores Wi-Fi','Repetidores','Cables de red']
    },
    'TV y entretenimiento': {
      'Televisores': ['Smart TV','LED/QLED/OLED','Proyectores'],
      'Streaming': ['TV Box','Chromecast y similares','Antenas','Controles remotos']
    },
    'Audio': {
      'Audio personal': ['Audífonos','Auriculares TWS','Headsets'],
      'Audio para hogar': ['Bocinas','Soundbars','Teatro en casa','Subwoofers'],
      'Audio profesional': ['Monitores de estudio','Interfaces de audio','Mezcladoras','Micrófonos','Controladores DJ']
    },
    'Gaming': {
      'Consolas': ['PlayStation','Xbox','Nintendo','Consolas retro'],
      'Accesorios gaming': ['Controles','Volantes','Headsets','Sillas gaming','Teclados gaming','Mouse gaming'],
      'Videojuegos': ['Juegos físicos','Accesorios y almacenamiento']
    },
    'Cámaras y fotografía': {
      'Cámaras': ['Réflex/DSLR','Mirrorless','Compactas','Acción','Instantáneas'],
      'Accesorios': ['Lentes','Trípodes','Flashes','Baterías','Memorias','Estuches']
    },
    'Hogar inteligente': ['Cámaras de seguridad','Timbres inteligentes','Interruptores inteligentes','Focos inteligentes','Sensores','Asistentes de voz']
  },
  'Hogar y Cocina': {
    'Cocina': {
      'Utensilios': ['Ollas y sartenes','Cuchillos','Tablas','Utensilios de cocina','Recipientes'],
      'Vajilla': ['Platos','Vasos y tazas','Cubiertos','Cristalería'],
      'Electrodomésticos pequeños': ['Cafeteras','Licuadoras','Batidoras','Freidoras de aire','Microondas','Tostadores','Arroceras']
    },
    'Muebles': {
      'Sala': ['Sofás','Sillones','Mesas de centro','Muebles para TV'],
      'Dormitorio': ['Camas','Colchones','Mesas de noche','Cómodas','Armarios'],
      'Comedor': ['Mesas','Sillas','Juegos de comedor'],
      'Oficina en casa': ['Escritorios','Sillas','Estanterías']
    },
    'Decoración': ['Cuadros y arte','Espejos','Relojes de pared','Velas','Alfombras','Cortinas','Cojines','Plantas artificiales'],
    'Baño': ['Toallas','Cortinas de baño','Organizadores','Accesorios de baño'],
    'Organización y limpieza': ['Organizadores','Cajas','Percheros','Escobas y trapeadores','Artículos de limpieza'],
    'Jardín y exterior': ['Muebles de jardín','Macetas','Herramientas de jardín','Iluminación exterior','Parrillas']
  },
  'Belleza y Cuidado Personal': {
    'Maquillaje': ['Rostro','Ojos','Labios','Uñas','Brochas y accesorios'],
    'Cuidado de la piel': ['Limpiadores','Hidratantes','Sérums','Protector solar','Mascarillas','Cuidado corporal'],
    'Cabello': ['Shampoo y acondicionador','Tratamientos','Tintes','Secadoras','Planchas','Rizadores','Máquinas de cortar cabello'],
    'Fragancias': ['Perfumes para mujer','Perfumes para hombre','Unisex','Body mist','Sets de regalo'],
    'Cuidado personal': ['Higiene oral','Desodorantes','Afeitado','Depilación','Manicure y pedicure']
  },
  'Salud y Bienestar': {
    'Cuidado y monitoreo': ['Termómetros','Oxímetros','Tensiómetros','Básculas','Nebulizadores'],
    'Movilidad y soporte': ['Rodilleras','Fajas y soportes','Muletas','Bastones','Sillas de ruedas'],
    'Bienestar': ['Masajeadores','Compresas térmicas','Accesorios de relajación','Organizadores de medicamentos'],
    'Primeros auxilios': ['Botiquines','Vendas y gasas','Curitas','Antisépticos de venta libre']
  },
  'Bebés y Maternidad': {
    'Alimentación': ['Biberones','Vajilla para bebé','Esterilizadores','Extractores de leche','Baberos'],
    'Pañales y cuidado': ['Pañales','Toallitas','Cambiadores','Cremas y cuidado'],
    'Paseo y viaje': ['Coches','Sillas para auto','Portabebés','Bolsos maternales'],
    'Dormitorio': ['Cunas','Colchones','Ropa de cama','Monitores para bebé'],
    'Lactancia y maternidad': ['Almohadas de lactancia','Ropa de maternidad','Accesorios de lactancia']
  },
  'Deportes y Aire Libre': {
    'Fitness': ['Pesas y mancuernas','Bandas de resistencia','Bancos','Caminadoras','Bicicletas estáticas','Yoga y pilates'],
    'Fútbol': ['Balones','Zapatos','Uniformes','Guantes de portero','Accesorios'],
    'Ciclismo': ['Bicicletas','Cascos','Luces','Repuestos','Accesorios'],
    'Running': ['Calzado','Ropa','Accesorios','Hidratación'],
    'Camping y senderismo': ['Tiendas de campaña','Mochilas','Sleeping bags','Linternas','Utensilios'],
    'Natación': ['Trajes de baño','Gafas','Gorros','Accesorios'],
    'Otros deportes': ['Baloncesto','Béisbol','Voleibol','Tenis','Artes marciales']
  },
  'Juguetes y Juegos': {
    'Juguetes': ['Muñecas','Figuras de acción','Vehículos','Construcción y bloques','Peluches','Juguetes educativos','Juguetes para exterior'],
    'Juegos': ['Juegos de mesa','Cartas','Rompecabezas','Juegos de estrategia'],
    'Coleccionables': ['Figuras','Cartas coleccionables','Modelos y miniaturas']
  },
  'Automotriz y Motocicletas': {
    'Automóvil': {
      'Accesorios interiores': ['Fundas','Tapetes','Organizadores','Soportes para celular'],
      'Accesorios exteriores': ['Cubiertas','Luces','Emblemas','Accesorios decorativos'],
      'Repuestos': ['Filtros','Frenos','Suspensión','Eléctrico','Motor'],
      'Cuidado del auto': ['Lavado','Ceras','Pulido','Aspiradoras','Herramientas de detailing']
    },
    'Motocicletas': {
      'Accesorios': ['Cascos','Guantes','Chaquetas','Intercomunicadores','Maleteros'],
      'Repuestos': ['Frenos','Cadenas','Filtros','Luces','Eléctrico']
    },
    'Llantas y ruedas': ['Llantas para auto','Llantas para moto','Rines','Accesorios para ruedas']
  },
  'Herramientas y Ferretería': {
    'Herramientas eléctricas': ['Taladros','Rotomartillos','Sierras','Esmeriles','Lijadoras','Atornilladores'],
    'Herramientas manuales': ['Destornilladores','Llaves','Alicates','Martillos','Juegos de herramientas'],
    'Medición': ['Cintas métricas','Niveles','Multímetros','Medidores láser'],
    'Ferretería': ['Tornillos y fijaciones','Cerraduras','Bisagras','Cadenas','Adhesivos y selladores'],
    'Electricidad': ['Cables','Tomacorrientes','Interruptores','Extensiones','Protección eléctrica'],
    'Plomería': ['Grifos','Tuberías y conexiones','Herramientas de plomería','Accesorios']
  },
  'Mascotas': {
    'Perros': ['Alimento','Collares y correas','Camas','Juguetes','Higiene','Transportadoras','Ropa'],
    'Gatos': ['Alimento','Arena','Areneros','Rascadores','Camas','Juguetes','Transportadoras'],
    'Aves': ['Alimento','Jaulas','Accesorios'],
    'Peces y acuarios': ['Alimento','Acuarios','Filtros','Iluminación','Decoración'],
    'Otras mascotas': ['Roedores','Reptiles','Accesorios generales']
  },
  'Oficina, Papelería y Arte': {
    'Papelería': ['Cuadernos','Agendas','Papel','Carpetas','Sobres','Notas adhesivas'],
    'Escritura': ['Bolígrafos','Lápices','Marcadores','Resaltadores'],
    'Oficina': ['Calculadoras','Archivadores','Organizadores','Trituradoras','Etiquetadoras'],
    'Arte y manualidades': ['Pinturas','Pinceles','Lienzos','Dibujo','Corte y pegado','Material para manualidades']
  },
  'Alimentos y Bebidas': {
    'Despensa': ['Arroz y granos','Pastas','Harinas','Cereales','Enlatados','Salsas y condimentos'],
    'Snacks y dulces': ['Chips y boquitas','Galletas','Chocolates','Dulces','Frutos secos'],
    'Bebidas sin alcohol': ['Café','Té','Jugos','Bebidas energéticas','Bebidas instantáneas'],
    'Productos locales': ['Artesanales','Típicos salvadoreños','Salsas y conservas','Café de origen']
  },
  'Artesanías y Productos Locales': {
    'Artesanías': ['Cerámica','Madera','Textiles','Cuero','Bisutería artesanal','Decoración artesanal'],
    'Personalizados': ['Tazas','Camisetas','Llaveros','Regalos','Grabados'],
    'Productos de emprendedores': ['Alimentos artesanales','Cuidado personal artesanal','Decoración','Accesorios']
  },
  'Libros y Entretenimiento': {
    'Libros': ['Ficción','No ficción','Infantil','Educativos','Académicos','Religiosos'],
    'Música': ['Vinilos','CD','Instrumentos musicales','Accesorios musicales'],
    'Películas y coleccionables': ['DVD/Blu-ray','Figuras','Posters','Merchandising']
  },
  'Viajes y Equipaje': {
    'Equipaje': ['Maletas','Mochilas de viaje','Bolsos de mano','Organizadores'],
    'Accesorios de viaje': ['Almohadas','Adaptadores','Candados','Básculas para equipaje','Portadocumentos']
  }
};

let step=0;
const panes=[...document.querySelectorAll('.pane')],steps=[];
const rows=document.getElementById('variantRows');
const catPrincipal=document.getElementById('catPrincipal');
const categoryLevels=document.getElementById('categoryLevels');
const ruta=document.getElementById('ruta');
let selectedCategoryPath=[];

const FASHION_CATEGORY='Ropa, Zapatos y Joyería';
const CATEGORY_ATTRIBUTE_PROFILES={
 shoes:{title:'Detalles del calzado',fields:[
  {id:'upper_material',label:'Material exterior',ph:'Ej. gamuza / cuero / textil'},
  {id:'sole_material',label:'Material de suela',ph:'Ej. caucho'},
  {id:'closure',label:'Tipo de cierre',type:'select',opts:['Cordones','Velcro','Slip-on','Hebilla','Cremallera','Otro']},
  {id:'fit',label:'Ajuste',type:'select',opts:['Estándar','Estrecho','Amplio','Otro']},
  {id:'use',label:'Uso / estilo',ph:'Ej. casual, running, fútbol'},
  {id:'care',label:'Cuidados',ph:'Ej. limpiar con paño húmedo',wide:true}
 ]},
 clothing:{title:'Detalles de la prenda',fields:[
  {id:'material',label:'Material / composición',ph:'Ej. 100% algodón'},
  {id:'fit',label:'Corte / ajuste',type:'select',opts:['Slim','Regular','Relaxed','Oversize','Otro']},
  {id:'sleeve',label:'Manga / largo',ph:'Ej. manga corta / largo completo'},
  {id:'fabric',label:'Tipo de tejido',ph:'Ej. denim, punto, fleece'},
  {id:'care',label:'Cuidados de lavado',ph:'Ej. lavar a 30 °C',wide:true}
 ]},
 jewelry:{title:'Detalles de joyería',fields:[
  {id:'material',label:'Material',ph:'Ej. plata 925 / acero / oro 14K'},
  {id:'finish',label:'Acabado',ph:'Ej. pulido / mate / chapado'},
  {id:'stone',label:'Piedra / gema',ph:'Ej. zirconia / diamante / sin piedra'},
  {id:'measure',label:'Medida adicional',ph:'Ej. diámetro / largo de cadena'},
  {id:'weight',label:'Peso aproximado',ph:'Ej. 4.5 g'},
  {id:'care',label:'Cuidados',ph:'Indicaciones de conservación',wide:true}
 ]},
 fashion:{title:'Detalles de moda',fields:[
  {id:'material',label:'Material principal',ph:'Ej. cuero, algodón'},
  {id:'estilo',label:'Estilo / acabado',ph:'Ej. casual, deportivo'},
  {id:'cuidados',label:'Cuidados',ph:'Indicaciones de conservación',wide:true}
 ]},
 phones:{title:'Especificaciones del celular',fields:[
  {id:'ram',label:'Memoria RAM',type:'select',opts:['2 GB','3 GB','4 GB','6 GB','8 GB','12 GB','16 GB','24 GB','Otra']},
  {id:'storage',label:'Almacenamiento',type:'select',opts:['32 GB','64 GB','128 GB','256 GB','512 GB','1 TB','Otro']},
  {id:'screen',label:'Pantalla',ph:'Ej. 6.7” AMOLED 120 Hz'},
  {id:'battery',label:'Batería',type:'numberSuffix',suffix:'mAh',ph:'Ej. 5000',min:'1',step:'1'},
  {id:'sim',label:'SIM',type:'select',opts:['Single SIM','Dual SIM','eSIM','SIM + eSIM']},
  {id:'network',label:'Red',type:'checks',opts:['3G','4G/LTE','5G','Wi‑Fi','Bluetooth','NFC']},
  {id:'android_version',label:'Versión de Android',type:'numberPrefix',prefix:'Android',ph:'Ej. 16',min:'1',step:'0.1'},
  {id:'camera',label:'Cámara trasera',ph:'Ej. 50MP + 2MP + 200MP'},
  {id:'front_camera',label:'Cámara frontal',ph:'Ej. 32MP o 32MP + 2MP'},
  {id:'charger',label:'Incluye cargador',type:'select',opts:['Sí','No']}
 ]},
 computers:{title:'Especificaciones de computación',fields:[
  {id:'processor',label:'Procesador',ph:'Ej. Ryzen 7 8700G / Core i7'},
  {id:'ram',label:'RAM',ph:'Ej. 16 GB DDR5'},
  {id:'storage',label:'Almacenamiento',ph:'Ej. 1 TB SSD NVMe'},
  {id:'graphics',label:'Gráficos / GPU',ph:'Ej. RTX 4070 12 GB'},
  {id:'screen',label:'Pantalla',ph:'Ej. 15.6” 144 Hz'},
  {id:'os',label:'Sistema operativo',ph:'Ej. Windows 11'},
  {id:'ports',label:'Puertos / conectividad',ph:'Ej. USB-C, HDMI, Wi‑Fi 6',wide:true}
 ]},
 components:{title:'Especificaciones del componente',fields:[
  {id:'compatibility',label:'Compatibilidad / socket',ph:'Ej. AM5, LGA1700, PCIe 4.0'},
  {id:'capacity',label:'Capacidad / memoria',ph:'Ej. 32 GB / 2 TB / 16 GB VRAM'},
  {id:'speed',label:'Velocidad / frecuencia',ph:'Ej. 6000 MT/s / 5.2 GHz'},
  {id:'power',label:'Potencia / consumo',ph:'Ej. 750 W / 220 W'},
  {id:'formfactor',label:'Formato',ph:'Ej. ATX, M.2 2280'},
  {id:'compatibility_notes',label:'Compatibilidad adicional',ph:'Modelos o requisitos compatibles',wide:true}
 ]},
 tv:{title:'Especificaciones de TV / pantalla',fields:[
  {id:'size',label:'Tamaño',ph:'Ej. 55 pulgadas'},
  {id:'resolution',label:'Resolución',type:'select',opts:['HD','Full HD','2K/QHD','4K UHD','8K','Otra']},
  {id:'panel',label:'Tecnología',type:'select',opts:['LED','QLED','OLED','Mini LED','LCD','Proyector','Otra']},
  {id:'refresh',label:'Frecuencia',ph:'Ej. 60 Hz / 120 Hz / 165 Hz'},
  {id:'smart',label:'Sistema Smart',ph:'Ej. Google TV, webOS, Tizen'},
  {id:'connectivity',label:'Conectividad',ph:'Ej. HDMI 2.1, Wi‑Fi, Bluetooth',wide:true}
 ]},
 audio:{title:'Especificaciones de audio',fields:[
  {id:'audio_type',label:'Tipo / configuración',ph:'Ej. TWS, 2.1, monitor activo'},
  {id:'power',label:'Potencia',ph:'Ej. 100 W RMS'},
  {id:'connectivity',label:'Conectividad',ph:'Ej. Bluetooth 5.3, XLR, USB-C'},
  {id:'battery',label:'Autonomía',ph:'Ej. 30 horas'},
  {id:'frequency',label:'Respuesta de frecuencia',ph:'Ej. 45 Hz – 20 kHz'},
  {id:'included',label:'Accesorios incluidos',ph:'Ej. cable, estuche, adaptador',wide:true}
 ]},
 cameras:{title:'Especificaciones de cámara',fields:[
  {id:'megapixels',label:'Resolución',ph:'Ej. 24.2 MP'},
  {id:'sensor',label:'Sensor',ph:'Ej. APS-C / Full Frame'},
  {id:'lens',label:'Lente / montura',ph:'Ej. RF / E-mount / 18-55 mm'},
  {id:'video',label:'Video',ph:'Ej. 4K 60 fps'},
  {id:'stabilization',label:'Estabilización',ph:'Ej. IBIS / óptica'},
  {id:'included',label:'Incluye',ph:'Ej. batería, cargador, lente',wide:true}
 ]},
 furniture:{title:'Medidas y materiales',fields:[
  {id:'material',label:'Material',ph:'Ej. madera, metal, MDF'},
  {id:'width',label:'Ancho',ph:'Ej. 120 cm'},
  {id:'height',label:'Alto',ph:'Ej. 75 cm'},
  {id:'depth',label:'Profundidad / largo',ph:'Ej. 60 cm'},
  {id:'weight_capacity',label:'Capacidad / peso soportado',ph:'Ej. 120 kg'},
  {id:'assembly',label:'Requiere armado',type:'select',opts:['Sí','No','Parcial']}
 ]},
 appliances:{title:'Especificaciones del electrodoméstico',fields:[
  {id:'capacity',label:'Capacidad',ph:'Ej. 5 L / 20 L'},
  {id:'power',label:'Potencia',ph:'Ej. 1500 W'},
  {id:'voltage',label:'Voltaje',ph:'Ej. 110–120 V'},
  {id:'dimensions',label:'Dimensiones',ph:'Ej. 30 × 25 × 35 cm'},
  {id:'functions',label:'Funciones principales',ph:'Ej. 8 programas, temporizador',wide:true}
 ]},
 beauty:{title:'Detalles de belleza y cuidado',fields:[
  {id:'presentation',label:'Presentación / contenido',ph:'Ej. 50 ml / 200 g'},
  {id:'skin_hair',label:'Tipo de piel / cabello',ph:'Ej. piel grasa / cabello seco'},
  {id:'finish',label:'Acabado / tono',ph:'Ej. mate / tono 220'},
  {id:'ingredients',label:'Ingredientes o componentes destacados',ph:'Ej. ácido hialurónico, vitamina C',wide:true},
  {id:'usage',label:'Modo de uso',ph:'Indicaciones principales',wide:true}
 ]},
 fragrance:{title:'Detalles de fragancia',fields:[
  {id:'volume',label:'Contenido',type:'select',opts:['30 ml','50 ml','75 ml','100 ml','125 ml','150 ml','200 ml','Otro']},
  {id:'concentration',label:'Concentración',type:'select',opts:['Parfum','Eau de Parfum','Eau de Toilette','Eau de Cologne','Body Mist','Otra']},
  {id:'family',label:'Familia olfativa',ph:'Ej. amaderada, floral, cítrica'},
  {id:'notes',label:'Notas principales',ph:'Ej. bergamota, vainilla, cedro',wide:true}
 ]},
 health:{title:'Especificaciones de salud y bienestar',fields:[
  {id:'use',label:'Uso / función',ph:'Ej. medición de presión'},
  {id:'range',label:'Rango / capacidad',ph:'Ej. 0–300 mmHg'},
  {id:'power',label:'Alimentación',ph:'Ej. 2 pilas AAA / USB'},
  {id:'included',label:'Contenido del paquete',ph:'Ej. equipo, estuche, manual',wide:true}
 ]},
 baby:{title:'Detalles para bebé y maternidad',fields:[
  {id:'age',label:'Edad recomendada',ph:'Ej. 0–6 meses'},
  {id:'material',label:'Material',ph:'Ej. silicona grado alimenticio'},
  {id:'capacity',label:'Capacidad / medida',ph:'Ej. 240 ml'},
  {id:'safety',label:'Seguridad / certificación',ph:'Ej. libre de BPA'},
  {id:'care',label:'Limpieza / cuidados',ph:'Ej. apto para lavavajillas',wide:true}
 ]},
 sports:{title:'Especificaciones deportivas',fields:[
  {id:'sport',label:'Disciplina / uso',ph:'Ej. running, fútbol, gimnasio'},
  {id:'material',label:'Material',ph:'Ej. poliéster, caucho'},
  {id:'size_measure',label:'Medida / capacidad',ph:'Ej. talla 5 / 20 kg'},
  {id:'level',label:'Nivel recomendado',type:'select',opts:['Principiante','Intermedio','Avanzado','Profesional','Todos']},
  {id:'features',label:'Características',ph:'Ej. resistente al agua, antideslizante',wide:true}
 ]},
 automotive:{title:'Compatibilidad automotriz',fields:[
  {id:'vehicle_type',label:'Tipo de vehículo',type:'select',opts:['Automóvil','SUV','Pickup','Motocicleta','Universal','Otro']},
  {id:'brand_compat',label:'Marca compatible',ph:'Ej. Toyota'},
  {id:'model_compat',label:'Modelo compatible',ph:'Ej. Corolla'},
  {id:'year_range',label:'Años compatibles',ph:'Ej. 2018–2024'},
  {id:'part_number',label:'Número de parte',ph:'Ej. OEM / referencia'},
  {id:'spec',label:'Medida / especificación',ph:'Ej. 205/55 R16',wide:true}
 ]},
 tools:{title:'Especificaciones de herramienta',fields:[
  {id:'power_source',label:'Alimentación',type:'select',opts:['Manual','Eléctrica con cable','Batería','Neumática','Gasolina','Otra']},
  {id:'power',label:'Potencia / voltaje',ph:'Ej. 20 V / 800 W'},
  {id:'measure',label:'Medida / capacidad',ph:'Ej. 1/2”, 13 mm'},
  {id:'material',label:'Material',ph:'Ej. acero Cr-V'},
  {id:'included',label:'Accesorios incluidos',ph:'Ej. batería, brocas, maletín',wide:true}
 ]},
 pets:{title:'Detalles para mascotas',fields:[
  {id:'pet',label:'Mascota',ph:'Ej. perro, gato, ave'},
  {id:'size_pet',label:'Tamaño / etapa',ph:'Ej. pequeño / adulto'},
  {id:'weight_volume',label:'Peso / contenido',ph:'Ej. 2 kg / 500 ml'},
  {id:'material_flavor',label:'Material / sabor',ph:'Según el producto'},
  {id:'usage',label:'Uso / indicaciones',ph:'Detalles relevantes',wide:true}
 ]},
 office:{title:'Detalles de oficina, papelería o arte',fields:[
  {id:'format',label:'Formato / tamaño',ph:'Ej. A4 / carta / 30 × 40 cm'},
  {id:'quantity',label:'Cantidad',ph:'Ej. paquete de 100'},
  {id:'material',label:'Material / gramaje',ph:'Ej. 75 g/m²'},
  {id:'color_type',label:'Color / tipo',ph:'Ej. azul / punta fina'},
  {id:'details',label:'Características',ph:'Detalles adicionales',wide:true}
 ]},
 food:{title:'Información del alimento o bebida',fields:[
  {id:'net_content',label:'Contenido neto',ph:'Ej. 500 g / 1 L'},
  {id:'flavor',label:'Sabor / variedad',ph:'Ej. chocolate'},
  {id:'expiry',label:'Vencimiento / vida útil',ph:'Ej. 12 meses'},
  {id:'origin',label:'Origen',ph:'Ej. El Salvador'},
  {id:'ingredients',label:'Ingredientes / alérgenos',ph:'Información relevante',wide:true},
  {id:'storage',label:'Conservación',ph:'Ej. lugar fresco y seco',wide:true}
 ]},
 crafts:{title:'Detalles de artesanía / producto local',fields:[
  {id:'material',label:'Material',ph:'Ej. barro, madera, cuero'},
  {id:'technique',label:'Técnica',ph:'Ej. hecho a mano, bordado'},
  {id:'dimensions',label:'Dimensiones',ph:'Ej. 20 × 15 cm'},
  {id:'origin',label:'Lugar de origen',ph:'Ej. Ilobasco, El Salvador'},
  {id:'personalizable',label:'Personalizable',type:'select',opts:['Sí','No']}
 ]},
 books:{title:'Datos editoriales / entretenimiento',fields:[
  {id:'author',label:'Autor / artista',ph:'Nombre'},
  {id:'publisher',label:'Editorial / sello',ph:'Ej. Planeta'},
  {id:'language',label:'Idioma',ph:'Ej. Español'},
  {id:'format',label:'Formato',ph:'Ej. tapa blanda / vinilo'},
  {id:'isbn',label:'ISBN / código',ph:'Si aplica'},
  {id:'edition',label:'Edición / año',ph:'Ej. 2ª edición, 2025'}
 ]},
 travel:{title:'Especificaciones de equipaje',fields:[
  {id:'dimensions',label:'Dimensiones',ph:'Ej. 55 × 40 × 20 cm'},
  {id:'capacity',label:'Capacidad',ph:'Ej. 40 L'},
  {id:'material',label:'Material',ph:'Ej. ABS / poliéster'},
  {id:'weight',label:'Peso',ph:'Ej. 2.8 kg'},
  {id:'features',label:'Características',ph:'Ej. ruedas 360°, candado TSA',wide:true}
 ]},
 phone_cases:{title:'Compatibilidad y características de la funda',fields:[
  {id:'compatible_brand',label:'Marca de teléfono compatible',ph:'Ej. Samsung / Apple / Xiaomi'},
  {id:'compatible_model',label:'Modelo de teléfono compatible',ph:'Ej. Galaxy S26 Ultra / iPhone 18 Pro'},
  {id:'case_type',label:'Tipo de funda',type:'select',opts:['Silicona','Rígida','Híbrida','Bumper','Tipo libro','Con tarjetero','Transparente','Antigolpes','Impermeable','Otra']},
  {id:'material',label:'Material',ph:'Ej. TPU + policarbonato'},
  {id:'magsafe',label:'MagSafe / carga inalámbrica',type:'select',opts:['Compatible con MagSafe','Compatible con carga inalámbrica','No compatible','No aplica']},
  {id:'protection',label:'Nivel de protección',type:'select',opts:['Básica','Bordes reforzados','Antigolpes','Protección 360°','Otra']},
  {id:'camera_protection',label:'Protección de cámara',type:'select',opts:['Sí','No','Borde elevado']},
  {id:'finish',label:'Acabado / diseño',ph:'Ej. mate, transparente, estampado',wide:true}
 ]},
 screen_protectors:{title:'Compatibilidad del protector de pantalla',fields:[
  {id:'compatible_brand',label:'Marca compatible',ph:'Ej. Samsung'},
  {id:'compatible_model',label:'Modelo compatible',ph:'Ej. Galaxy S26 Ultra'},
  {id:'material',label:'Material',type:'select',opts:['Vidrio templado','Hidrogel','PET','Cerámico','Privacidad','Otro']},
  {id:'coverage',label:'Cobertura',type:'select',opts:['Pantalla completa','Plana','Curva / 3D','Solo área visible']},
  {id:'hardness',label:'Dureza',ph:'Ej. 9H'},
  {id:'features',label:'Características',ph:'Ej. antihuellas, anti reflejo, privacidad',wide:true}
 ]},
 chargers:{title:'Especificaciones del cargador',fields:[
  {id:'charger_type',label:'Tipo',type:'select',opts:['Pared','Inalámbrico','Vehículo','GaN','Estación de carga','Otro']},
  {id:'power',label:'Potencia máxima',ph:'Ej. 65 W'},
  {id:'ports',label:'Puertos',ph:'Ej. 2× USB-C + 1× USB-A'},
  {id:'protocols',label:'Protocolos de carga',ph:'Ej. USB-PD, PPS, Quick Charge'},
  {id:'input',label:'Entrada',ph:'Ej. 100–240 V'},
  {id:'included_cable',label:'Incluye cable',type:'select',opts:['Sí','No']},
  {id:'compatibility',label:'Compatibilidad',ph:'Ej. Android, iPhone, laptop USB-C',wide:true}
 ]},
 cables:{title:'Especificaciones del cable',fields:[
  {id:'connector_a',label:'Conector A',ph:'Ej. USB-C'}, {id:'connector_b',label:'Conector B',ph:'Ej. USB-C / Lightning'},
  {id:'length',label:'Longitud',ph:'Ej. 1 m'}, {id:'max_power',label:'Potencia soportada',ph:'Ej. 100 W'},
  {id:'data_speed',label:'Velocidad de datos',ph:'Ej. 10 Gbps'}, {id:'material',label:'Recubrimiento',ph:'Ej. nylon trenzado'},
  {id:'compatibility',label:'Compatibilidad',ph:'Modelos / dispositivos compatibles',wide:true}
 ]},
 powerbanks:{title:'Especificaciones del power bank',fields:[
  {id:'capacity',label:'Capacidad',type:'numberSuffix',suffix:'mAh',ph:'Ej. 20000',min:'1',step:'1'},
  {id:'power',label:'Potencia de salida',ph:'Ej. 65 W'}, {id:'ports',label:'Puertos',ph:'Ej. USB-C + 2 USB-A'},
  {id:'fast_charge',label:'Carga rápida',ph:'Ej. PD 3.0 / QC 4+'}, {id:'wireless',label:'Carga inalámbrica',type:'select',opts:['Sí','No','MagSafe/Qi2']},
  {id:'display',label:'Indicador / pantalla',ph:'Ej. porcentaje digital'}
 ]},
 phone_mounts:{title:'Características del soporte',fields:[
  {id:'mount_type',label:'Tipo de montaje',type:'select',opts:['Escritorio','Vehículo - rejilla','Vehículo - parabrisas','Tablero','Motocicleta','Trípode','Otro']},
  {id:'device_range',label:'Tamaño compatible',ph:'Ej. 4.7–7.0 pulgadas'}, {id:'rotation',label:'Rotación',ph:'Ej. 360°'},
  {id:'magnetic',label:'Sujeción',type:'select',opts:['Magnética','Pinza','MagSafe','Ventosa','Adhesiva','Otra']},
  {id:'material',label:'Material',ph:'Ej. aluminio + ABS'}
 ]},
 smart_home:{title:'Especificaciones de hogar inteligente',fields:[
  {id:'connection',label:'Conectividad',type:'checks',opts:['Wi‑Fi 2.4 GHz','Wi‑Fi 5 GHz','Bluetooth','Zigbee','Thread','Matter']},
  {id:'ecosystem',label:'Ecosistema / app',ph:'Ej. Tuya, Smart Life, Google Home, Alexa'},
  {id:'power',label:'Alimentación',ph:'Ej. 110 V / batería'}, {id:'installation',label:'Instalación',ph:'Ej. empotrado, adhesivo, exterior'},
  {id:'rating',label:'Protección',ph:'Ej. IP65'}, {id:'features',label:'Funciones',ph:'Ej. temporizador, escenas, detección',wide:true}
 ]},
 monitors:{title:'Especificaciones del monitor',fields:[
  {id:'size',label:'Tamaño',ph:'Ej. 27 pulgadas'}, {id:'resolution',label:'Resolución',ph:'Ej. 2560 × 1440 QHD'},
  {id:'panel',label:'Panel',type:'select',opts:['IPS','VA','TN','OLED','Mini LED','Otro']}, {id:'refresh',label:'Frecuencia',ph:'Ej. 180 Hz'},
  {id:'response',label:'Tiempo de respuesta',ph:'Ej. 1 ms'}, {id:'sync',label:'Sincronización',ph:'Ej. FreeSync / G-SYNC Compatible'},
  {id:'ports',label:'Puertos',ph:'Ej. 2 HDMI, DisplayPort, USB-C',wide:true}
 ]},
 keyboards:{title:'Especificaciones del teclado',fields:[
  {id:'layout',label:'Distribución',ph:'Ej. Español Latino / US'}, {id:'format',label:'Formato',type:'select',opts:['100%','TKL','75%','65%','60%','Otro']},
  {id:'switch',label:'Tipo / switches',ph:'Ej. mecánico Red / membrana'}, {id:'connection',label:'Conexión',type:'checks',opts:['USB','2.4 GHz','Bluetooth']},
  {id:'backlight',label:'Iluminación',ph:'Ej. RGB por tecla'}, {id:'features',label:'Funciones',ph:'Ej. hot-swap, macros, multimedia',wide:true}
 ]},
 mice:{title:'Especificaciones del mouse',fields:[
  {id:'sensor',label:'Sensor',ph:'Ej. óptico Focus Pro'}, {id:'dpi',label:'DPI máximo',ph:'Ej. 30000 DPI'},
  {id:'connection',label:'Conexión',type:'checks',opts:['USB','2.4 GHz','Bluetooth']}, {id:'buttons',label:'Botones',ph:'Ej. 6 programables'},
  {id:'weight',label:'Peso',ph:'Ej. 59 g'}, {id:'hand',label:'Ergonomía',type:'select',opts:['Diestro','Zurdo','Ambidiestro']},
  {id:'battery',label:'Autonomía',ph:'Ej. 90 horas'}
 ]},
 printers:{title:'Especificaciones de impresora',fields:[
  {id:'technology',label:'Tecnología',type:'select',opts:['Inyección de tinta','Láser','Térmica','Sublimación','Otra']},
  {id:'color',label:'Impresión',type:'select',opts:['Color','Monocromática']}, {id:'functions',label:'Funciones',type:'checks',opts:['Impresión','Escáner','Copiadora','Fax','Dúplex']},
  {id:'paper',label:'Tamaño de papel',ph:'Ej. A4 / Carta / Legal'}, {id:'connectivity',label:'Conectividad',ph:'Ej. Wi‑Fi, Ethernet, USB'},
  {id:'speed',label:'Velocidad',ph:'Ej. 30 ppm'}
 ]},
 networking:{title:'Especificaciones de red',fields:[
  {id:'wifi',label:'Estándar Wi‑Fi',ph:'Ej. Wi‑Fi 6 / 802.11ax'}, {id:'speed',label:'Velocidad',ph:'Ej. AX3000 / 2.5 Gbps'},
  {id:'bands',label:'Bandas',ph:'Ej. 2.4 + 5 GHz'}, {id:'ports',label:'Puertos',ph:'Ej. 4× Gigabit LAN'},
  {id:'coverage',label:'Cobertura',ph:'Ej. hasta 200 m²'}, {id:'features',label:'Funciones',ph:'Ej. Mesh, VPN, QoS',wide:true}
 ]},
 gaming:{title:'Especificaciones gaming',fields:[
  {id:'platform',label:'Plataforma / compatibilidad',ph:'Ej. PS5, Xbox Series, PC, Switch'}, {id:'connection',label:'Conectividad',ph:'Ej. USB-C, Bluetooth, 2.4 GHz'},
  {id:'edition',label:'Edición / versión',ph:'Ej. estándar, digital, edición especial'}, {id:'storage',label:'Almacenamiento',ph:'Ej. 1 TB'},
  {id:'included',label:'Incluye',ph:'Ej. control, cables, base',wide:true}
 ]},
 camera_accessories:{title:'Compatibilidad de accesorio fotográfico',fields:[
  {id:'accessory_type',label:'Tipo de accesorio',ph:'Ej. lente, trípode, flash, batería'}, {id:'mount',label:'Montura / compatibilidad',ph:'Ej. Sony E, Canon RF'},
  {id:'measure',label:'Medida / especificación',ph:'Ej. 67 mm / 24–70 mm'}, {id:'material',label:'Material',ph:'Ej. aluminio'},
  {id:'included',label:'Incluye',ph:'Ej. tapas, estuche, adaptador',wide:true}
 ]},
 watches:{title:'Especificaciones del reloj',fields:[
  {id:'movement',label:'Movimiento',type:'select',opts:['Cuarzo','Automático','Mecánico','Digital','Smartwatch','Otro']},
  {id:'case_size',label:'Tamaño de caja',ph:'Ej. 42 mm'}, {id:'strap',label:'Material de correa',ph:'Ej. acero / silicona / cuero'},
  {id:'water',label:'Resistencia al agua',ph:'Ej. 5 ATM / IP68'}, {id:'glass',label:'Cristal',ph:'Ej. zafiro / mineral'},
  {id:'features',label:'Funciones',ph:'Ej. GPS, llamadas, NFC, cronógrafo',wide:true}
 ]},
 bags:{title:'Detalles del bolso o accesorio',fields:[
  {id:'material',label:'Material',ph:'Ej. cuero sintético / nylon'}, {id:'dimensions',label:'Dimensiones',ph:'Ej. 30 × 22 × 12 cm'},
  {id:'capacity',label:'Capacidad',ph:'Ej. 18 L'}, {id:'compartments',label:'Compartimentos',ph:'Ej. 3 + bolsillo para laptop'},
  {id:'closure',label:'Cierre',ph:'Ej. cremallera'}, {id:'features',label:'Características',ph:'Ej. impermeable, correa ajustable',wide:true}
 ]},
 kitchenware:{title:'Detalles de cocina y vajilla',fields:[
  {id:'material',label:'Material',ph:'Ej. acero inoxidable / vidrio'}, {id:'capacity',label:'Capacidad / tamaño',ph:'Ej. 2.5 L / 28 cm'},
  {id:'pieces',label:'Número de piezas',ph:'Ej. set de 6'}, {id:'compatibility',label:'Compatibilidad',ph:'Ej. inducción, horno, lavavajillas'},
  {id:'care',label:'Cuidados',ph:'Ej. apto para lavavajillas',wide:true}
 ]},
 decor:{title:'Detalles de decoración',fields:[
  {id:'material',label:'Material',ph:'Ej. madera / vidrio / textil'}, {id:'dimensions',label:'Dimensiones',ph:'Ej. 60 × 90 cm'},
  {id:'style',label:'Estilo',ph:'Ej. moderno / rústico / minimalista'}, {id:'installation',label:'Instalación',ph:'Ej. pared / mesa / piso'},
  {id:'care',label:'Cuidados',ph:'Indicaciones de limpieza',wide:true}
 ]},
 bedding:{title:'Detalles textiles para hogar',fields:[
  {id:'material',label:'Material',ph:'Ej. algodón 100%'}, {id:'size',label:'Tamaño / medida',ph:'Ej. Queen / 150 × 200 cm'},
  {id:'thread_count',label:'Tejido / hilos',ph:'Ej. 300 hilos'}, {id:'pieces',label:'Contenido del set',ph:'Ej. 1 sábana + 2 fundas'},
  {id:'care',label:'Lavado y cuidados',ph:'Ej. lavable a máquina',wide:true}
 ]},
 cosmetics:{title:'Especificaciones de maquillaje',fields:[
  {id:'product_type',label:'Tipo de producto',ph:'Ej. base, labial, máscara'}, {id:'tone',label:'Tono / número',ph:'Ej. 220 Natural Beige'},
  {id:'finish',label:'Acabado',ph:'Ej. mate / satinado / luminoso'}, {id:'content',label:'Contenido',ph:'Ej. 30 ml / 4 g'},
  {id:'skin_type',label:'Tipo de piel',ph:'Ej. todo tipo / grasa'}, {id:'features',label:'Características',ph:'Ej. waterproof, larga duración',wide:true}
 ]},
 hair_tools:{title:'Especificaciones del equipo para cabello',fields:[
  {id:'power',label:'Potencia',ph:'Ej. 1800 W'}, {id:'temperature',label:'Temperatura',ph:'Ej. 80–230 °C'},
  {id:'technology',label:'Tecnología',ph:'Ej. iónica / cerámica / titanio'}, {id:'voltage',label:'Voltaje',ph:'Ej. 110 V / dual voltage'},
  {id:'included',label:'Accesorios',ph:'Ej. boquillas, difusor, guante',wide:true}
 ]},
 toys:{title:'Detalles del juguete o juego',fields:[
  {id:'age',label:'Edad recomendada',ph:'Ej. 6+ años'}, {id:'material',label:'Material',ph:'Ej. ABS / madera'},
  {id:'players',label:'Jugadores',ph:'Ej. 2–4'}, {id:'pieces',label:'Piezas / contenido',ph:'Ej. 120 piezas'},
  {id:'power',label:'Alimentación',ph:'Ej. 3 pilas AA / no requiere'}, {id:'safety',label:'Seguridad / advertencias',ph:'Información relevante',wide:true}
 ]},
 tires:{title:'Especificaciones de llanta / rueda',fields:[
  {id:'width',label:'Ancho',ph:'Ej. 205'}, {id:'profile',label:'Perfil',ph:'Ej. 55'}, {id:'rim',label:'Rin',ph:'Ej. R16'},
  {id:'load',label:'Índice de carga',ph:'Ej. 91'}, {id:'speed',label:'Índice de velocidad',ph:'Ej. V'},
  {id:'season',label:'Uso',ph:'Ej. todo clima / carretera'}, {id:'vehicle',label:'Vehículos compatibles',ph:'Ej. sedán / SUV',wide:true}
 ]},
 pet_food:{title:'Información del alimento para mascota',fields:[
  {id:'pet',label:'Mascota',ph:'Ej. perro / gato'}, {id:'stage',label:'Etapa',ph:'Ej. cachorro / adulto / senior'},
  {id:'breed_size',label:'Tamaño de raza',ph:'Ej. pequeña / mediana / grande'}, {id:'weight',label:'Contenido',ph:'Ej. 2 kg'},
  {id:'flavor',label:'Sabor / proteína',ph:'Ej. pollo y arroz'}, {id:'ingredients',label:'Ingredientes / beneficios',ph:'Información nutricional destacada',wide:true}
 ]},
 instruments:{title:'Especificaciones del instrumento musical',fields:[
  {id:'instrument',label:'Tipo de instrumento',ph:'Ej. guitarra eléctrica / teclado'}, {id:'material',label:'Material / construcción',ph:'Ej. caoba / arce'},
  {id:'size',label:'Tamaño / escala',ph:'Ej. 4/4 / 61 teclas'}, {id:'electronics',label:'Electrónica / conexión',ph:'Ej. pastillas HSS / MIDI USB'},
  {id:'included',label:'Incluye',ph:'Ej. funda, cable, correa',wide:true}
 ]},
 generic:{title:'Características del producto',fields:[
  {id:'material',label:'Material / composición',ph:'Según el producto'},
  {id:'dimensions',label:'Medidas / dimensiones',ph:'Ej. 20 × 15 × 10 cm'},
  {id:'capacity',label:'Capacidad / presentación',ph:'Si aplica'},
  {id:'features',label:'Características principales',ph:'Información técnica o funcional',wide:true}
 ]}
};

// Fase 21: perfiles específicos por subcategoría final.
// Evita que el nombre de la categoría raíz ("Ropa, Zapatos y Joyería")
// provoque falsos positivos como cargar calzado dentro de Vestidos.
Object.assign(CATEGORY_ATTRIBUTE_PROFILES, {
 dresses:{title:'Detalles del vestido',fields:[
  {id:'material',label:'Material / composición',ph:'Ej. 95% poliéster, 5% elastano'},
  {id:'dress_style',label:'Tipo de vestido',type:'select',opts:['Casual','Fiesta','Cóctel','Formal','Maxi','Midi','Mini','Bodycon','Camisero','Otro']},
  {id:'length',label:'Largo',type:'select',opts:['Mini','A la rodilla','Midi','Maxi','Otro']},
  {id:'sleeve',label:'Tipo de manga',type:'select',opts:['Sin mangas','Corta','3/4','Larga','Tirantes','Otro']},
  {id:'neckline',label:'Escote / cuello',ph:'Ej. V, redondo, halter, palabra de honor'},
  {id:'fit',label:'Corte / ajuste',type:'select',opts:['Entallado','Regular','Holgado','Oversize','Otro']},
  {id:'occasion',label:'Ocasión / estilo',ph:'Ej. casual, oficina, boda, noche'},
  {id:'care',label:'Cuidados de lavado',ph:'Ej. lavado delicado, no usar secadora',wide:true}
 ]},
 tops:{title:'Detalles de blusa, camisa o camiseta',fields:[
  {id:'material',label:'Material / composición',ph:'Ej. algodón, viscosa, poliéster'},
  {id:'garment_type',label:'Tipo de prenda',ph:'Ej. blusa, camisa, camiseta, top, polo'},
  {id:'fit',label:'Corte / ajuste',type:'select',opts:['Slim','Regular','Relaxed','Oversize','Crop','Otro']},
  {id:'sleeve',label:'Manga',type:'select',opts:['Sin mangas','Corta','3/4','Larga','Otro']},
  {id:'neckline',label:'Cuello / escote',ph:'Ej. redondo, V, camisero, polo'},
  {id:'closure',label:'Cierre',type:'select',opts:['Sin cierre','Botones','Cremallera','Broches','Otro']},
  {id:'care',label:'Cuidados de lavado',ph:'Indicaciones de lavado',wide:true}
 ]},
 bottoms:{title:'Detalles del pantalón, jean o short',fields:[
  {id:'material',label:'Material / composición',ph:'Ej. denim 98% algodón + 2% elastano'},
  {id:'rise',label:'Tiro',type:'select',opts:['Bajo','Medio','Alto','No aplica']},
  {id:'fit',label:'Corte',type:'select',opts:['Skinny','Slim','Recto','Mom','Bootcut','Wide leg','Cargo','Jogger','Regular','Otro']},
  {id:'length',label:'Largo',ph:'Ej. largo completo, cropped, 7/8'},
  {id:'closure',label:'Cierre',type:'select',opts:['Botón + cremallera','Cremallera','Cordón','Elástico','Otro']},
  {id:'pockets',label:'Bolsillos',ph:'Ej. 5 bolsillos / bolsillos cargo'},
  {id:'care',label:'Cuidados de lavado',ph:'Indicaciones de lavado',wide:true}
 ]},
 skirts:{title:'Detalles de falda',fields:[
  {id:'material',label:'Material / composición',ph:'Ej. denim, algodón, poliéster'},
  {id:'skirt_style',label:'Tipo',type:'select',opts:['Lápiz','Plisada','A-line','Circular','Denim','Cargo','Otro']},
  {id:'length',label:'Largo',type:'select',opts:['Mini','A la rodilla','Midi','Maxi','Otro']},
  {id:'rise',label:'Tiro',type:'select',opts:['Bajo','Medio','Alto']},
  {id:'closure',label:'Cierre',type:'select',opts:['Cremallera','Botones','Elástico','Cordón','Otro']},
  {id:'care',label:'Cuidados',ph:'Indicaciones de lavado',wide:true}
 ]},
 outerwear:{title:'Detalles de chaqueta, abrigo o sudadera',fields:[
  {id:'material',label:'Material exterior',ph:'Ej. algodón, poliéster, cuero'},
  {id:'lining',label:'Forro / aislamiento',ph:'Ej. polar, acolchado, sin forro'},
  {id:'closure',label:'Tipo de cierre',type:'select',opts:['Cremallera','Botones','Broches','Sin cierre','Otro']},
  {id:'hood',label:'Capucha',type:'select',opts:['Sí fija','Sí desmontable','No']},
  {id:'weather',label:'Protección climática',ph:'Ej. impermeable, cortaviento, térmica'},
  {id:'fit',label:'Corte / ajuste',type:'select',opts:['Slim','Regular','Relaxed','Oversize','Otro']},
  {id:'care',label:'Cuidados',ph:'Indicaciones de lavado',wide:true}
 ]},
 activewear:{title:'Detalles de ropa deportiva',fields:[
  {id:'material',label:'Material / composición',ph:'Ej. poliéster + elastano'},
  {id:'activity',label:'Actividad',ph:'Ej. gym, running, fútbol, yoga'},
  {id:'fit',label:'Ajuste',type:'select',opts:['Compresión','Slim','Regular','Holgado','Otro']},
  {id:'technology',label:'Tecnología / tejido',ph:'Ej. dry-fit, transpirable, secado rápido'},
  {id:'reflective',label:'Elementos reflectivos',type:'select',opts:['Sí','No']},
  {id:'care',label:'Cuidados',ph:'Indicaciones de lavado',wide:true}
 ]},
 underwear:{title:'Detalles de ropa interior',fields:[
  {id:'material',label:'Material / composición',ph:'Ej. algodón + elastano'},
  {id:'type',label:'Tipo',ph:'Ej. bóxer, brief, brasier, panty'},
  {id:'support',label:'Soporte / copa',ph:'Ej. copa B, sin aro, soporte medio'},
  {id:'waist',label:'Cintura / tiro',ph:'Ej. media, alta'},
  {id:'pack',label:'Unidades por paquete',ph:'Ej. 3 unidades'},
  {id:'care',label:'Cuidados',ph:'Indicaciones de lavado',wide:true}
 ]},
 sleepwear:{title:'Detalles de pijama',fields:[
  {id:'material',label:'Material / composición',ph:'Ej. algodón, satén, polar'},
  {id:'set',label:'Presentación',type:'select',opts:['Una pieza','2 piezas','3 piezas o más','Otro']},
  {id:'season',label:'Temporada',type:'select',opts:['Ligero / verano','Todo el año','Térmico / invierno']},
  {id:'sleeve',label:'Manga',ph:'Ej. corta, larga, sin mangas'},
  {id:'bottom',label:'Parte inferior',ph:'Ej. short, pantalón, camisón'},
  {id:'care',label:'Cuidados',ph:'Indicaciones de lavado',wide:true}
 ]},
 swimwear:{title:'Detalles de traje de baño',fields:[
  {id:'material',label:'Material / composición',ph:'Ej. nylon + elastano'},
  {id:'type',label:'Tipo',ph:'Ej. bikini, entero, short de baño'},
  {id:'support',label:'Soporte / copa',ph:'Ej. copa removible, con aro, no aplica'},
  {id:'uv',label:'Protección UV',ph:'Ej. UPF 50+'},
  {id:'quick_dry',label:'Secado rápido',type:'select',opts:['Sí','No']},
  {id:'care',label:'Cuidados',ph:'Indicaciones después de uso',wide:true}
 ]},
 maternity_clothing:{title:'Detalles de ropa de maternidad',fields:[
  {id:'material',label:'Material / composición',ph:'Ej. algodón + elastano'},
  {id:'stage',label:'Etapa recomendada',type:'select',opts:['Embarazo','Lactancia','Embarazo y lactancia','Postparto']},
  {id:'adjustment',label:'Sistema de ajuste',ph:'Ej. cintura elástica, panel abdominal'},
  {id:'nursing',label:'Acceso para lactancia',type:'select',opts:['Sí','No','No aplica']},
  {id:'fit',label:'Corte / ajuste',ph:'Ej. adaptable, regular, holgado'},
  {id:'care',label:'Cuidados',ph:'Indicaciones de lavado',wide:true}
 ]},
 baby_clothes:{title:'Detalles de ropa para bebé',fields:[
  {id:'material',label:'Material / composición',ph:'Ej. 100% algodón'},
  {id:'age_range',label:'Rango de edad',ph:'Ej. 0–3 meses'},
  {id:'closure',label:'Cierre',type:'select',opts:['Broches','Cremallera','Botones','Sin cierre','Otro']},
  {id:'pieces',label:'Número de piezas',ph:'Ej. conjunto de 3 piezas'},
  {id:'season',label:'Temporada',ph:'Ej. fresco, térmico, todo el año'},
  {id:'care',label:'Cuidados',ph:'Indicaciones de lavado',wide:true}
 ]},
 rings:{title:'Detalles del anillo',fields:[
  {id:'material',label:'Material',ph:'Ej. plata 925, acero, oro 14K'},
  {id:'finish',label:'Acabado',ph:'Ej. pulido, mate, chapado'},
  {id:'stone',label:'Piedra / gema',ph:'Ej. zirconia, diamante, sin piedra'},
  {id:'stone_shape',label:'Corte / forma de piedra',ph:'Ej. redondo, princesa, ovalado'},
  {id:'band_width',label:'Ancho del aro',ph:'Ej. 4 mm'},
  {id:'adjustable',label:'Ajustable',type:'select',opts:['Sí','No']},
  {id:'care',label:'Cuidados',ph:'Conservación y limpieza',wide:true}
 ]},
 necklaces:{title:'Detalles del collar o cadena',fields:[
  {id:'material',label:'Material',ph:'Ej. plata 925, acero, oro'},
  {id:'length',label:'Largo de cadena',ph:'Ej. 45 cm'},
  {id:'chain_type',label:'Tipo de cadena',ph:'Ej. cubana, figaro, veneciana'},
  {id:'pendant',label:'Dije / colgante',ph:'Ej. cruz, corazón, sin dije'},
  {id:'closure',label:'Broche',ph:'Ej. langosta, resorte'},
  {id:'care',label:'Cuidados',ph:'Conservación y limpieza',wide:true}
 ]},
 bracelets:{title:'Detalles de pulsera',fields:[
  {id:'material',label:'Material',ph:'Ej. plata, acero, cuero'},
  {id:'length',label:'Largo / circunferencia',ph:'Ej. 18 cm'},
  {id:'type',label:'Tipo',ph:'Ej. cadena, brazalete, charms'},
  {id:'closure',label:'Cierre',ph:'Ej. langosta, imán, ajustable'},
  {id:'charms',label:'Incluye charms',type:'select',opts:['Sí','No','No aplica']},
  {id:'care',label:'Cuidados',ph:'Conservación y limpieza',wide:true}
 ]},
 earrings:{title:'Detalles de aretes',fields:[
  {id:'material',label:'Material',ph:'Ej. plata, acero, oro'},
  {id:'type',label:'Tipo',type:'select',opts:['Stud','Argolla','Colgante','Ear cuff','Piercing','Otro']},
  {id:'closure',label:'Tipo de cierre',ph:'Ej. mariposa, rosca, presión'},
  {id:'dimensions',label:'Medida',ph:'Ej. 12 mm / 3 cm'},
  {id:'stone',label:'Piedra / decoración',ph:'Ej. zirconia, perla, sin piedra'},
  {id:'care',label:'Cuidados',ph:'Conservación y limpieza',wide:true}
 ]},
 fashion_accessories:{title:'Detalles del accesorio de moda',fields:[
  {id:'material',label:'Material',ph:'Ej. cuero, poliéster, metal'},
  {id:'dimensions',label:'Medidas',ph:'Ej. 20 × 10 cm'},
  {id:'style',label:'Estilo / diseño',ph:'Ej. casual, formal, deportivo'},
  {id:'closure',label:'Cierre / ajuste',ph:'Ej. hebilla, broche, elástico'},
  {id:'care',label:'Cuidados',ph:'Indicaciones de conservación',wide:true}
 ]},
 streaming_device:{title:'Especificaciones del dispositivo de streaming',fields:[
  {id:'resolution',label:'Resolución máxima',ph:'Ej. 4K HDR'},
  {id:'os',label:'Sistema / plataforma',ph:'Ej. Google TV, Fire OS'},
  {id:'connectivity',label:'Conectividad',ph:'Ej. Wi‑Fi 6, Bluetooth 5.2'},
  {id:'ports',label:'Puertos',ph:'Ej. HDMI, USB-C'},
  {id:'voice',label:'Control por voz',type:'select',opts:['Sí','No']},
  {id:'included',label:'Incluye',ph:'Ej. control remoto, cable, adaptador',wide:true}
 ]},
 skincare:{title:'Detalles de cuidado de la piel',fields:[
  {id:'product_type',label:'Tipo de producto',ph:'Ej. sérum, crema, limpiador'},
  {id:'content',label:'Contenido',ph:'Ej. 50 ml'},
  {id:'skin_type',label:'Tipo de piel',ph:'Ej. grasa, seca, mixta, sensible'},
  {id:'active_ingredients',label:'Ingredientes activos',ph:'Ej. niacinamida 10%, ácido hialurónico'},
  {id:'spf',label:'FPS / SPF',ph:'Ej. SPF 50+ / no aplica'},
  {id:'usage',label:'Modo de uso',ph:'Frecuencia y aplicación',wide:true}
 ]},
 haircare:{title:'Detalles de cuidado del cabello',fields:[
  {id:'product_type',label:'Tipo de producto',ph:'Ej. shampoo, acondicionador, mascarilla'},
  {id:'content',label:'Contenido',ph:'Ej. 400 ml'},
  {id:'hair_type',label:'Tipo de cabello',ph:'Ej. seco, graso, rizado, teñido'},
  {id:'benefit',label:'Beneficio principal',ph:'Ej. reparación, hidratación, anticaspa'},
  {id:'ingredients',label:'Ingredientes destacados',ph:'Ej. keratina, argán, biotina'},
  {id:'usage',label:'Modo de uso',ph:'Indicaciones principales',wide:true}
 ]},
 personal_care:{title:'Detalles de cuidado personal',fields:[
  {id:'product_type',label:'Tipo de producto',ph:'Ej. desodorante, afeitadora, cepillo dental'},
  {id:'content',label:'Contenido / piezas',ph:'Ej. 150 ml / 3 unidades'},
  {id:'use_for',label:'Uso recomendado',ph:'Ej. piel sensible, higiene diaria'},
  {id:'features',label:'Características',ph:'Ej. recargable, resistente al agua, sin alcohol',wide:true}
 ]},
 garden:{title:'Detalles de jardín y exterior',fields:[
  {id:'material',label:'Material',ph:'Ej. acero, plástico, madera'},
  {id:'dimensions',label:'Dimensiones',ph:'Ej. 60 × 40 × 80 cm'},
  {id:'outdoor_rating',label:'Uso exterior',type:'select',opts:['Sí','No','Parcial / bajo techo']},
  {id:'weatherproof',label:'Resistencia al clima',ph:'Ej. UV, lluvia, corrosión'},
  {id:'assembly',label:'Requiere armado',type:'select',opts:['Sí','No','Parcial']},
  {id:'features',label:'Características',ph:'Detalles adicionales',wide:true}
 ]},
 cleaning:{title:'Detalles de organización y limpieza',fields:[
  {id:'material',label:'Material',ph:'Ej. plástico, microfibra, acero'},
  {id:'capacity',label:'Capacidad / tamaño',ph:'Ej. 20 L / 45 cm'},
  {id:'use',label:'Uso',ph:'Ej. baño, cocina, ropa, pisos'},
  {id:'pieces',label:'Cantidad / piezas',ph:'Ej. set de 3'},
  {id:'features',label:'Características',ph:'Ej. plegable, con ruedas, lavable',wide:true}
 ]},
 musical_media:{title:'Datos de música / formato',fields:[
  {id:'artist',label:'Artista',ph:'Nombre del artista'},
  {id:'title',label:'Álbum / título',ph:'Nombre del álbum'},
  {id:'format',label:'Formato',type:'select',opts:['Vinilo','CD','Cassette','Otro']},
  {id:'edition',label:'Edición',ph:'Ej. estándar, deluxe, limitada'},
  {id:'year',label:'Año',ph:'Ej. 2026'},
  {id:'condition_notes',label:'Detalles de edición / contenido',ph:'Ej. doble LP, remasterizado',wide:true}
 ]},
 movies_media:{title:'Datos de película / coleccionable',fields:[
  {id:'title',label:'Título',ph:'Nombre de la película / colección'},
  {id:'format',label:'Formato',type:'select',opts:['DVD','Blu-ray','4K UHD Blu-ray','Figura','Poster','Merchandising','Otro']},
  {id:'edition',label:'Edición',ph:'Ej. steelbook, coleccionista, estándar'},
  {id:'language',label:'Idioma / audio',ph:'Ej. español, inglés'},
  {id:'region',label:'Región',ph:'Ej. Región A / libre'},
  {id:'details',label:'Contenido / detalles',ph:'Ej. discos, extras, accesorios incluidos',wide:true}
 ]}
});

let categoryAttributeValues={};
function categoryProfileKey(){
 const seg=selectedCategoryPath.map(x=>String(x||'').trim().toLowerCase());
 const root=seg[0]||'', s1=seg[1]||'', s2=seg[2]||'', leaf=seg[seg.length-1]||'';
 const has=(v)=>seg.includes(v);
 const leafHas=(rx)=>rx.test(leaf);

 // MODA: decidir usando los segmentos internos, nunca el nombre de la raíz.
 if(root==='ropa, zapatos y joyería'){
   if(s1==='ropa'){
     if(leaf==='vestidos') return 'dresses';
     if(/blusas y camisas|camisetas y tops|camisetas|camisas|polos|bodies/.test(leaf)) return 'tops';
     if(/pantalones|jeans|shorts/.test(leaf)) return 'bottoms';
     if(leaf==='faldas') return 'skirts';
     if(/chaquetas|abrigos|sudaderas/.test(leaf)) return 'outerwear';
     if(leaf==='ropa deportiva') return 'activewear';
     if(leaf==='ropa interior') return 'underwear';
     if(leaf==='pijamas') return 'sleepwear';
     if(leaf==='trajes de baño') return 'swimwear';
     if(leaf==='maternidad') return 'maternity_clothing';
     if(/ropa para recién nacido|conjuntos/.test(leaf) || s2==='bebés') return 'baby_clothes';
     if(/trajes y sacos/.test(leaf)) return 'outerwear';
     return 'clothing';
   }
   if(s1==='zapatos') return 'shoes';
   if(s1==='joyería'){
     if(s2==='anillos') return 'rings';
     if(s2==='collares') return 'necklaces';
     if(s2==='pulseras') return 'bracelets';
     if(s2==='aretes') return 'earrings';
     if(s2==='relojes') return 'watches';
     return 'jewelry';
   }
   if(s1==='accesorios de moda'){
     if(s2==='bolsos y carteras') return 'bags';
     return 'fashion_accessories';
   }
   return 'fashion';
 }

 // ELECTRÓNICA
 if(root==='electrónica'){
   if(s1==='celulares y accesorios'){
     if(s2==='celulares') return 'phones';
     if(leaf==='fundas') return 'phone_cases';
     if(leaf==='protectores de pantalla') return 'screen_protectors';
     if(leaf==='cargadores') return 'chargers';
     if(leaf==='cables') return 'cables';
     if(leaf==='power banks') return 'powerbanks';
     if(leaf==='soportes') return 'phone_mounts';
     if(/audífonos bluetooth/.test(leaf)) return 'audio';
     if(/accesorios magsafe/.test(leaf)) return 'phone_cases';
   }
   if(s1==='computación'){
     if(s2==='computadoras') return 'computers';
     if(s2==='componentes') return 'components';
     if(s2==='periféricos'){
       if(leaf==='monitores') return 'monitors';
       if(/teclados/.test(leaf)) return 'keyboards';
       if(leaf==='mouse') return 'mice';
       if(/impresoras|escáneres/.test(leaf)) return 'printers';
       if(/webcams|micrófonos/.test(leaf)) return leaf==='micrófonos'?'audio':'cameras';
       if(/ups y reguladores/.test(leaf)) return 'components';
     }
     if(s2==='redes') return 'networking';
   }
   if(s1==='tv y entretenimiento'){
     if(s2==='televisores') return 'tv';
     if(s2==='streaming') return 'streaming_device';
   }
   if(s1==='audio') return 'audio';
   if(s1==='gaming'){
     if(/teclados gaming/.test(leaf)) return 'keyboards';
     if(/mouse gaming/.test(leaf)) return 'mice';
     if(/headsets/.test(leaf)) return 'audio';
     return 'gaming';
   }
   if(s1==='cámaras y fotografía') return s2==='accesorios'?'camera_accessories':'cameras';
   if(s1==='hogar inteligente') return 'smart_home';
 }

 // HOGAR Y COCINA
 if(root==='hogar y cocina'){
   if(s1==='cocina'){
     if(s2==='electrodomésticos pequeños') return 'appliances';
     return 'kitchenware';
   }
   if(s1==='muebles') return 'furniture';
   if(s1==='decoración') return 'decor';
   if(s1==='baño') return leaf==='toallas'?'bedding':'decor';
   if(s1==='organización y limpieza') return 'cleaning';
   if(s1==='jardín y exterior') return 'garden';
 }

 // BELLEZA
 if(root==='belleza y cuidado personal'){
   if(s1==='fragancias') return 'fragrance';
   if(s1==='maquillaje') return 'cosmetics';
   if(s1==='cuidado de la piel') return 'skincare';
   if(s1==='cabello') return /secadoras|planchas|rizadores|máquinas de cortar cabello/.test(leaf)?'hair_tools':'haircare';
   if(s1==='cuidado personal') return 'personal_care';
 }

 if(root==='salud y bienestar') return 'health';
 if(root==='bebés y maternidad') return 'baby';
 if(root==='deportes y aire libre') return 'sports';
 if(root==='juguetes y juegos') return 'toys';
 if(root==='automotriz y motocicletas') return s1==='llantas y ruedas'?'tires':'automotive';
 if(root==='herramientas y ferretería') return 'tools';
 if(root==='mascotas') return (leaf==='alimento')?'pet_food':'pets';
 if(root==='oficina, papelería y arte') return 'office';
 if(root==='alimentos y bebidas') return 'food';
 if(root==='artesanías y productos locales') return 'crafts';
 if(root==='libros y entretenimiento'){
   if(s1==='libros') return 'books';
   if(s1==='música') return leaf==='instrumentos musicales'||leaf==='accesorios musicales'?'instruments':'musical_media';
   if(s1==='películas y coleccionables') return 'movies_media';
 }
 if(root==='viajes y equipaje') return 'travel';

 return 'generic';
}
function attrKey(id){return selectedCategoryPath.join('|')+'::'+id}
function categorySignature(path=selectedCategoryPath){return (path||[]).join('||')}
let renderedStep2CategorySignature='';
let renderedStep2AttributeProfile='';
let renderedStep2SizeProfile='';
function invalidateStep2CategoryUI(){
  renderedStep2CategorySignature='';
  renderedStep2AttributeProfile='';
  renderedStep2SizeProfile='';
  const panel=document.getElementById('categoryAttributesPanel');
  if(panel)panel.innerHTML='';
}
function renderCategoryAttributes(){
 const box=document.getElementById('categoryAttributesPanel');if(!box)return;
 if(!categoryIsComplete()){box.innerHTML='';return}
 const key=categoryProfileKey(),profile=CATEGORY_ATTRIBUTE_PROFILES[key]||CATEGORY_ATTRIBUTE_PROFILES.generic;
 renderedStep2CategorySignature=categorySignature();
 renderedStep2AttributeProfile=key;
 const fields=profile.fields.filter(f=>!['care','cuidados'].includes(f.id)).map(f=>{
  const k=attrKey(f.id),val=categoryAttributeValues[k]??'';
  let control='';
  if(f.type==='select')control=`<select data-attr-id="${f.id}"><option value="">Seleccionar...</option>${f.opts.map(o=>`<option ${val===o?'selected':''}>${escHtml(o)}</option>`).join('')}</select>`;
  else if(f.type==='checks'){const arr=Array.isArray(val)?val:[];control=`<div class="attribute-checks">${f.opts.map(o=>`<label class="attribute-check"><input type="checkbox" data-attr-check="${f.id}" value="${escHtml(o)}" ${arr.includes(o)?'checked':''}><span>${escHtml(o)}</span></label>`).join('')}</div>`}
  else if(f.type==='numberSuffix')control=`<div class="attribute-unit-input"><input type="number" data-attr-id="${f.id}" value="${escHtml(val)}" placeholder="${escHtml(f.ph||'')}" min="${f.min||''}" step="${f.step||'1'}"><span>${escHtml(f.suffix)}</span></div>`;
  else if(f.type==='numberPrefix')control=`<div class="attribute-unit-input prefix"><span>${escHtml(f.prefix)}</span><input type="number" data-attr-id="${f.id}" value="${escHtml(val)}" placeholder="${escHtml(f.ph||'')}" min="${f.min||''}" step="${f.step||'1'}"></div>`;
  else control=`<input data-attr-id="${f.id}" value="${escHtml(val)}" placeholder="${escHtml(f.ph||'')}">`;
  return `<div class="attribute-field ${f.wide?'wide':''}"><label>${escHtml(f.label)}</label>${control}</div>`
 }).join('');
 box.innerHTML=`<section class="attribute-card"><div class="attribute-card-head"><div><h3>${escHtml(profile.title)}</h3><p>Campos adaptados automáticamente a ${escHtml(selectedCategoryPath[selectedCategoryPath.length-1]||'la categoría')}.</p></div><span class="attribute-badge">Dinámico por categoría</span></div><div class="attribute-grid">${fields}</div></section>`;
 box.querySelectorAll('[data-attr-id]').forEach(el=>el.addEventListener('input',()=>categoryAttributeValues[attrKey(el.dataset.attrId)]=el.value));
 box.querySelectorAll('[data-attr-check]').forEach(el=>el.addEventListener('change',()=>{const id=el.dataset.attrCheck;categoryAttributeValues[attrKey(id)]=[...box.querySelectorAll(`[data-attr-check="${id}"]:checked`)].map(x=>x.value)}));
}
function currentAttributeSummary(){
 const profile=CATEGORY_ATTRIBUTE_PROFILES[categoryProfileKey()]||CATEGORY_ATTRIBUTE_PROFILES.generic;
 return profile.fields.filter(f=>!['care','cuidados'].includes(f.id)).map(f=>{const v=categoryAttributeValues[attrKey(f.id)];if(v===undefined||v===''||(Array.isArray(v)&&!v.length))return null;let shown=Array.isArray(v)?v.join(', '):v;if(f.type==='numberSuffix')shown=`${shown} ${f.suffix}`;if(f.type==='numberPrefix')shown=`${f.prefix} ${shown}`;return {label:f.label,value:shown}}).filter(Boolean)
}
function isFashionCategory(){return selectedCategoryPath[0]===FASHION_CATEGORY}
function updateCategoryDependentFields(){
 const fashion=isFashionCategory();
 const audienceField=document.getElementById('audienceField');
 if(audienceField)audienceField.classList.add('hidden');
 syncAudienceFromCategoryPath();
 syncSizeSystemOptions();
 const desc=document.getElementById('presentationDesc');
 const tip=document.getElementById('presentationTip');
 if(desc)desc.textContent=fashion
   ?(categoryUsesSizes()
      ?'Agrega cada color del mismo modelo. Las tallas cambian automáticamente según la subcategoría seleccionada y cada combinación puede tener precio y stock independientes.'
      :'Agrega cada color o presentación visual. Esta subcategoría no utiliza un tallaje estándar, por lo que el precio y stock se manejan por presentación.')
   :'Agrega las presentaciones visuales del producto y sus fotografías. Los atributos específicos de esta categoría se configurarán según el tipo de producto.';
 if(tip)tip.innerHTML=fashion
   ?(categoryUsesSizes()
      ?'<b>El tallaje es dinámico por subcategoría.</b> Zapatos usan sistemas de calzado; ropa usa tallas de prendas; anillos usan tallas de anillo; bebés usan meses/estatura, etc.'
      :'<b>Esta subcategoría no necesita tallas.</b> Puedes administrar directamente precio y stock de cada presentación visual.')
   :'<b>Las fotografías pertenecen a cada presentación visual.</b> Puedes subir de 0 a 5 fotos. Los atributos técnicos de arriba cambian automáticamente según la categoría final.';
 const tools=document.querySelector('.variant-tools');
 if(tools){
   tools.classList.toggle('non-fashion',!fashion);
   const checklist=tools.querySelector('.presentation-checklist');
   if(checklist){
     const usesSizes=fashion&&categoryUsesSizes();
     const labels=usesSizes
       ?[fashion?'Color / presentación':'Presentación','Hasta 5 imágenes','Tallas','Precio','Stock']
       :[fashion?'Color / presentación':'Presentación','Hasta 5 imágenes','Precio','Stock'];
     checklist.innerHTML=labels.map(x=>`<span class="presentation-check"><span class="presentation-check-dot">✓</span>${escHtml(x)}</span>`).join('');
   }
 }
 const add=document.getElementById('addVariant');if(add)add.textContent=fashion?'+ Agregar color':'+ Agregar presentación';
 renderCategoryAttributes();
}

function isNodeObject(v){return v && typeof v==='object' && !Array.isArray(v)}
function getNodeByPath(path){let node=CATEGORIES;for(const key of path){if(Array.isArray(node))return null;node=node?.[key]}return node}
function optionNames(node){return Array.isArray(node)?node:isNodeObject(node)?Object.keys(node):[]}
function levelLabel(level,node){
  if(level===1)return 'Subcategoría';
  if(level===2)return 'Tipo / sección';
  if(level===3)return 'Categoría final';
  return `Categoría nivel ${level+1}`;
}
function updateRoute(){
  ruta.textContent=selectedCategoryPath.length?selectedCategoryPath.join(' → '):'Ninguna categoría seleccionada';
  updateCategoryDependentFields();
  updateInformationFlow();
}
function sameCategoryPath(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i]);}

// Fase 27: flujo jerárquico único. Cada nivel solo conserva lo que está por encima.
let configuredCategoryPath=null;
let categoryChangeModalPromise=null;
function ensureCategoryChangeModal(){
  let modal=document.getElementById('categoryChangeWarningModal');
  if(modal)return modal;
  const style=document.createElement('style');
  style.textContent=`.category-change-modal{position:fixed;inset:0;z-index:2000;display:none}.category-change-modal.open{display:block}.category-change-backdrop{position:absolute;inset:0;background:rgba(15,23,42,.48);backdrop-filter:blur(2px)}.category-change-panel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(480px,calc(100vw - 30px));background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 28px 80px rgba(15,23,42,.25);overflow:hidden}.category-change-head{display:flex;gap:12px;align-items:flex-start;padding:20px 20px 10px}.category-change-icon{width:38px;height:38px;flex:0 0 38px;border-radius:11px;background:#fff7ed;color:#ea580c;display:grid;place-items:center;font-size:20px;font-weight:900}.category-change-head h3{margin:0 0 5px;font-size:18px;color:#172033}.category-change-head p{margin:0;color:#64748b;font-size:12px;line-height:1.5}.category-change-route{margin:8px 20px 0;padding:10px 12px;border:1px solid #e8edf3;border-radius:10px;background:#f8fafc;color:#475569;font-size:11px;line-height:1.45}.category-change-note{margin:10px 20px 0;color:#7c2d12;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:10px 12px;font-size:11px;line-height:1.45}.category-change-actions{display:flex;justify-content:flex-end;gap:8px;padding:18px 20px 20px}.category-change-actions button{border:0;border-radius:9px;padding:10px 14px;font-size:12px;font-weight:800;cursor:pointer}.category-change-cancel{background:#f1f5f9;color:#334155}.category-change-confirm{background:#dc2626;color:#fff}.category-change-modal-open{overflow:hidden}`;
  document.head.appendChild(style);
  modal=document.createElement('div');modal.id='categoryChangeWarningModal';modal.className='category-change-modal';
  modal.innerHTML=`<div class="category-change-backdrop" data-category-change-cancel></div><section class="category-change-panel" role="dialog" aria-modal="true"><div class="category-change-head"><div class="category-change-icon">!</div><div><h3>¿Cambiar clasificación?</h3><p>Ya tienes información dependiente de esta selección.</p></div></div><div class="category-change-route" id="categoryChangeCurrentRoute"></div><div class="category-change-note" id="categoryChangeNote">Al confirmar se restablecerán todos los campos que dependen del nivel que estás cambiando. Los niveles anteriores se conservarán.</div><div class="category-change-actions"><button type="button" class="category-change-cancel" data-category-change-cancel>Cancelar</button><button type="button" class="category-change-confirm" data-category-change-confirm>Sí, cambiar</button></div></section>`;
  document.body.appendChild(modal);return modal;
}
function askCategoryChangeCallback(levelLabelText='categoría', onConfirm, onCancel){
  const modal=ensureCategoryChangeModal();
  modal.querySelector('#categoryChangeCurrentRoute').innerHTML=`<strong>Selección actual:</strong><br>${escHtml(selectedCategoryPath.join(' → ')||'Sin categoría')}`;
  modal.querySelector('#categoryChangeNote').textContent=`Vas a cambiar ${levelLabelText}. Se borrarán los campos y configuraciones que dependan de esta selección, pero se conservarán los niveles anteriores.`;
  const cancelButtons=[...modal.querySelectorAll('[data-category-change-cancel]')];
  const confirmButton=modal.querySelector('[data-category-change-confirm]');
  const finish=accepted=>{
    modal.classList.remove('open');document.body.classList.remove('category-change-modal-open');
    cancelButtons.forEach(x=>x.onclick=null);confirmButton.onclick=null;document.removeEventListener('keydown',onKey);
    accepted?onConfirm?.():onCancel?.();
  };
  const onKey=e=>{if(e.key==='Escape')finish(false)};
  cancelButtons.forEach(x=>x.onclick=()=>finish(false));confirmButton.onclick=()=>finish(true);document.addEventListener('keydown',onKey);
  modal.classList.add('open');document.body.classList.add('category-change-modal-open');
}
function clearCategorySpecificData(){
  categoryAttributeValues={};
  variantColors=[{id:uid(),color:'',audiences:{},files:[],existingImages:[]}];
  sizeSystem='US';configuredCategoryPath=null;invalidateStep2CategoryUI();closeSizeModal?.();closePriceStockModal?.();renderVariantBuilder();
}
function resetGeneralFieldsAfterClassification(){
  ['marca','modelo','garantia','descripcion'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});const sg=document.getElementById('sinGarantia');if(sg)sg.checked=false;
  const c=document.getElementById('condicion');if(c)c.value='';
  clearCategorySpecificData();
}
function commitClassification(nextPath){
  selectedCategoryPath=[...nextPath];
  resetGeneralFieldsAfterClassification();
  configuredCategoryPath=null;
  invalidateStep2CategoryUI();
  renderCategoryLevels();
}
function requestClassificationChange(level,requestedValue,label){
  const snapshot=[...selectedCategoryPath];
  const oldValue=snapshot[level]||'';
  const next=snapshot.slice(0,level);
  if(requestedValue)next.push(requestedValue);
  if(oldValue===requestedValue){renderCategoryLevels();return;}
  // Si existe un valor anterior, NO alteramos selectedCategoryPath mientras la advertencia está abierta.
  if(oldValue){
    renderCategoryLevels(); // devuelve visualmente el select a la selección confirmada
    askCategoryChangeCallback(label,()=>commitClassification(next),()=>renderCategoryLevels());
  }else{
    commitClassification(next);
  }
}
function renderCategoryLevels(){
  if(catPrincipal)catPrincipal.value=selectedCategoryPath[0]||'';
  categoryLevels.innerHTML='';
  if(!selectedCategoryPath.length){
    categoryLevels.innerHTML='<div class="category-empty">Selecciona primero una categoría principal.</div>';
    updateRoute();return;
  }
  let path=[selectedCategoryPath[0]],node=CATEGORIES[selectedCategoryPath[0]],level=1;
  while(node){
    const options=optionNames(node);if(!options.length)break;
    const wrap=document.createElement('div');wrap.className='category-level-wrap';
    const lab=document.createElement('small');lab.textContent=levelLabel(level,node);wrap.appendChild(lab);
    const select=document.createElement('select');select.dataset.level=String(level);
    select.innerHTML='<option value="">Seleccionar...</option>'+options.map(x=>`<option value="${escHtml(x)}">${escHtml(x)}</option>`).join('');
    const current=selectedCategoryPath[level]||'';select.value=current;
    const eventLevel=level;
    select.onchange=e=>{
      const requestedValue=e.currentTarget.value;
      requestClassificationChange(eventLevel,requestedValue,levelLabel(eventLevel,getNodeByPath(selectedCategoryPath.slice(0,eventLevel))));
    };
    wrap.appendChild(select);categoryLevels.appendChild(wrap);
    if(!current)break;
    path.push(current);node=getNodeByPath(path);level++;
  }
  updateRoute();
}
catPrincipal.innerHTML='<option value="">Seleccionar categoría...</option>'+Object.keys(CATEGORIES).map(x=>`<option value="${escHtml(x)}">${escHtml(x)}</option>`).join('');
catPrincipal.onchange=e=>{
  const requestedValue=e.currentTarget.value;
  const oldValue=selectedCategoryPath[0]||'';
  const next=requestedValue?[requestedValue]:[];
  if(oldValue===requestedValue){renderCategoryLevels();return;}
  if(oldValue){
    catPrincipal.value=oldValue;
    askCategoryChangeCallback('Categoría principal',()=>commitClassification(next),()=>renderCategoryLevels());
  }else commitClassification(next);
};
function categoryIsComplete(){if(!selectedCategoryPath.length)return false;return optionNames(getNodeByPath(selectedCategoryPath)).length===0;}

// Campos generales progresivos: cada campo habilita únicamente al siguiente.
function isModelOptional(){return selectedCategoryPath[0]==='Artesanías y Productos Locales';}
function updateInformationFlow(){
  const n=document.getElementById('nombre'),brand=document.getElementById('marca'),model=document.getElementById('modelo'),condition=document.getElementById('condicion'),warranty=document.getElementById('garantia'),noWarranty=document.getElementById('sinGarantia'),desc=document.getElementById('descripcion'),info=document.getElementById('modelOptionalInfo'),help=document.getElementById('modelHelp');
  catPrincipal.disabled=!n.value.trim();
  const complete=categoryIsComplete();brand.disabled=!complete;
  model.disabled=!complete||!brand.value.trim();
  const optional=isModelOptional();if(info)info.classList.toggle('hidden',!optional);if(help)help.textContent=optional?'Opcional para esta categoría. Úsalo solo si el artículo tiene modelo, colección o referencia.':'';
  const modelOk=optional||model.value.trim();condition.disabled=!complete||!brand.value.trim()||!modelOk;
  const warrantyStageDisabled=condition.disabled||!condition.value;
  if(noWarranty)noWarranty.disabled=warrantyStageDisabled;
  warranty.disabled=warrantyStageDisabled||!!noWarranty?.checked;
  document.querySelector('.warranty-days')?.classList.toggle('is-disabled',warranty.disabled);
  const warrantyOk=!warrantyStageDisabled&&(!!noWarranty?.checked||/^\d+$/.test(warranty.value.trim()));
  desc.disabled=!warrantyOk;
  [n,catPrincipal,brand,model,condition,warranty,desc].forEach(el=>el?.classList.remove('flow-ready'));
  if(n.value.trim())catPrincipal.classList.add('flow-ready');if(complete)brand.classList.add('flow-ready');if(brand.value.trim())model.classList.add('flow-ready');if(modelOk&&!condition.disabled)condition.classList.add('flow-ready');if(condition.value&&!warrantyStageDisabled)warranty.classList.add('flow-ready');if(warrantyOk&&!desc.disabled)desc.classList.add('flow-ready');
}
function showFlowToast(text){const old=document.querySelector('.flow-toast');old?.remove();const t=document.createElement('div');t.className='flow-toast';t.textContent=text;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
function validateInformationStep(){
  const checks=[['nombre','Completa el título del producto.'],['marca','Completa la marca.'],['condicion','Selecciona la condición.'],['garantia','Completa la garantía.'],['descripcion','Completa la descripción.']];
  if(!document.getElementById('nombre').value.trim())return checks[0];
  if(!categoryIsComplete())return ['catPrincipal','Completa toda la clasificación del producto antes de continuar.'];
  if(!document.getElementById('marca').value.trim())return checks[1];
  if(!isModelOptional()&&!document.getElementById('modelo').value.trim())return ['modelo','Completa Modelo / estilo.'];
  if(!document.getElementById('condicion').value)return ['condicion','Selecciona la condición.'];
  const noWarranty=document.getElementById('sinGarantia')?.checked;const warrantyValue=document.getElementById('garantia').value.trim();
  if(!noWarranty&&!/^\d+$/.test(warrantyValue))return ['garantia','Ingresa los días de garantía usando solo números enteros o marca Sin garantía.'];
  if(!document.getElementById('descripcion').value.trim())return ['descripcion','Completa la descripción.'];
  return null;
}
['nombre','marca','modelo','condicion','descripcion'].forEach(id=>{const el=document.getElementById(id);el?.addEventListener(id==='condicion'?'change':'input',()=>{el.classList.remove('flow-invalid');updateInformationFlow()})});
const warrantyInput=document.getElementById('garantia'),noWarrantyInput=document.getElementById('sinGarantia');
warrantyInput?.addEventListener('input',()=>{warrantyInput.value=warrantyInput.value.replace(/\D/g,'').slice(0,4);warrantyInput.classList.remove('flow-invalid');updateInformationFlow()});
noWarrantyInput?.addEventListener('change',()=>{if(noWarrantyInput.checked){warrantyInput.value='';warrantyInput.classList.remove('flow-invalid')}updateInformationFlow()});
document.getElementById('modelOptionalInfo')?.addEventListener('click',()=>alert('Modelo / estilo opcional\n\nEste campo no es obligatorio para esta categoría. Si tu producto posee un modelo, colección o referencia específica, puedes indicarlo.\n\nEjemplo: Nailon.'));

// Validación numérica reutilizable: evita letras, negativos y decimales donde no corresponden.
function sanitizeIntegerValue(value,maxLen=9){return String(value??'').replace(/\D/g,'').slice(0,maxLen)}
function sanitizeMoneyValue(value){let v=String(value??'').replace(/[^0-9.]/g,'');const parts=v.split('.');if(parts.length>1)v=parts.shift()+'.'+parts.join('').slice(0,2);return v.slice(0,12)}
document.addEventListener('input',e=>{const el=e.target;if(!(el instanceof HTMLInputElement))return;
  if(el.matches('.generic-stock,.modal-size-stock,#modalBulkStock'))el.value=sanitizeIntegerValue(el.value);
  if(el.matches('.generic-price,.modal-size-price,#modalBulkPrice'))el.value=sanitizeMoneyValue(el.value);
  if(el.matches('[data-attr-id][type="number"]')){const step=el.getAttribute('step')||'1';el.value=step==='1'?sanitizeIntegerValue(el.value):sanitizeMoneyValue(el.value)}
});
const AUDIENCE_LABELS={hombre:'Hombre',mujer:'Mujer',nino:'Niño',nina:'Niña',unisex:'Unisex',general:'General'};

// Tallaje dinámico por subcategoría final. No reutilizar tallas de calzado para toda Moda.
const SHOE_SIZE_SETS={
 US:{hombre:['3','3.5','4','4.5','5','5.5','6','6.5','7','7.5','8','8.5','9','9.5','10','10.5','11','11.5','12','13','14','15'],mujer:['4','4.5','5','5.5','6','6.5','7','7.5','8','8.5','9','9.5','10','10.5','11','11.5','12','13'],nino:['1','1.5','2','2.5','3','3.5','4','4.5','5','5.5','6','6.5','7'],nina:['1','1.5','2','2.5','3','3.5','4','4.5','5','5.5','6','6.5','7']},
 EU:{hombre:['38','39','40','41','42','43','44','45','46','47','48'],mujer:['35','36','37','38','39','40','41','42','43','44'],nino:['28','29','30','31','32','33','34','35','36','37','38'],nina:['28','29','30','31','32','33','34','35','36','37','38']},
 UK:{hombre:['3','3.5','4','4.5','5','5.5','6','6.5','7','7.5','8','8.5','9','9.5','10','10.5','11','12','13','14'],mujer:['2','2.5','3','3.5','4','4.5','5','5.5','6','6.5','7','7.5','8','8.5','9','9.5','10'],nino:['10','10.5','11','11.5','12','12.5','13','13.5','1','1.5','2','2.5','3','3.5','4','4.5','5'],nina:['10','10.5','11','11.5','12','12.5','13','13.5','1','1.5','2','2.5','3','3.5','4','4.5','5']},
 CM:{hombre:['24 cm','24.5 cm','25 cm','25.5 cm','26 cm','26.5 cm','27 cm','27.5 cm','28 cm','28.5 cm','29 cm','29.5 cm','30 cm','30.5 cm','31 cm','32 cm'],mujer:['21 cm','21.5 cm','22 cm','22.5 cm','23 cm','23.5 cm','24 cm','24.5 cm','25 cm','25.5 cm','26 cm','26.5 cm','27 cm','27.5 cm','28 cm'],nino:['17 cm','17.5 cm','18 cm','18.5 cm','19 cm','19.5 cm','20 cm','20.5 cm','21 cm','21.5 cm','22 cm','22.5 cm','23 cm','23.5 cm','24 cm'],nina:['17 cm','17.5 cm','18 cm','18.5 cm','19 cm','19.5 cm','20 cm','20.5 cm','21 cm','21.5 cm','22 cm','22.5 cm','23 cm','23.5 cm','24 cm']}
};
const SIZE_PROFILES={
 shoes:{label:'Sistema de tallas de calzado',mode:'audience',systems:{US:'US',EU:'EU',UK:'UK',CM:'CM'}},
 clothing:{label:'Tallaje de ropa',mode:'audience',systems:{INT:'Internacional',US_APP:'US',EU_APP:'EU'}},
 bottoms:{label:'Tallaje de pantalón',mode:'audience',systems:{INT:'Internacional',WAIST_IN:'Cintura (pulgadas)',EU_BOTTOM:'EU'}},
 kids_clothing:{label:'Tallaje infantil',mode:'audience',systems:{AGE:'Edad',KIDS_NUM:'Numérico'}},
 baby_clothing:{label:'Tallaje de bebé',mode:'general',systems:{MONTHS:'Meses',HEIGHT:'Estatura (cm)'}},
 rings:{label:'Sistema de talla de anillo',mode:'general',systems:{US_RING:'US',EU_RING:'EU / circunferencia',RING_MM:'Diámetro (mm)'}},
 necklaces:{label:'Largo del collar',mode:'general',systems:{NECK_CM:'Longitud (cm)'}},
 bracelets:{label:'Largo de pulsera',mode:'general',systems:{BRACELET_CM:'Longitud (cm)'}},
 watches:{label:'Tamaño de correa / muñeca',mode:'general',systems:{WRIST_CM:'Muñeca (cm)',STRAP:'Correa'}},
 belts:{label:'Talla de cinturón',mode:'general',systems:{BELT_CM:'Cintura (cm)',BELT_IN:'Cintura (pulgadas)',INT:'Internacional'}},
 gloves:{label:'Talla de guantes',mode:'general',systems:{INT:'Internacional',HAND_CM:'Contorno de mano (cm)'}},
 hats:{label:'Talla de gorra / sombrero',mode:'general',systems:{HEAD_CM:'Contorno de cabeza (cm)',INT:'Internacional'}},
 none:{label:'',mode:'none',systems:{}}
};

const STATIC_SIZE_VALUES={
 INT:{hombre:['XS','S','M','L','XL','2XL','3XL','4XL','5XL'],mujer:['XXS','XS','S','M','L','XL','2XL','3XL','4XL'],nino:['XS','S','M','L','XL'],nina:['XS','S','M','L','XL'],general:['XS','S','M','L','XL','2XL','3XL']},
 US_APP:{hombre:['34','36','38','40','42','44','46','48','50','52','54'],mujer:['0','2','4','6','8','10','12','14','16','18','20','22'],nino:['4','5','6','7','8','10','12','14','16'],nina:['4','5','6','7','8','10','12','14','16']},
 EU_APP:{hombre:['44','46','48','50','52','54','56','58','60','62'],mujer:['32','34','36','38','40','42','44','46','48','50','52'],nino:['104','110','116','122','128','134','140','146','152','158','164'],nina:['104','110','116','122','128','134','140','146','152','158','164']},
 WAIST_IN:{hombre:['28','29','30','31','32','33','34','35','36','38','40','42','44','46','48','50'],mujer:['24','25','26','27','28','29','30','31','32','33','34','36','38','40','42','44'],nino:['20','21','22','23','24','25','26','27','28','29','30'],nina:['20','21','22','23','24','25','26','27','28','29','30']},
 EU_BOTTOM:{hombre:['42','44','46','48','50','52','54','56','58','60','62','64'],mujer:['32','34','36','38','40','42','44','46','48','50','52','54'],nino:['104','110','116','122','128','134','140','146','152','158','164'],nina:['104','110','116','122','128','134','140','146','152','158','164']},
 AGE:{hombre:['2 años','3 años','4 años','5 años','6 años','7 años','8 años','10 años','12 años','14 años','16 años'],mujer:['2 años','3 años','4 años','5 años','6 años','7 años','8 años','10 años','12 años','14 años','16 años'],nino:['2 años','3 años','4 años','5 años','6 años','7 años','8 años','10 años','12 años','14 años','16 años'],nina:['2 años','3 años','4 años','5 años','6 años','7 años','8 años','10 años','12 años','14 años','16 años']},
 KIDS_NUM:{hombre:['2','3','4','5','6','7','8','10','12','14','16'],mujer:['2','3','4','5','6','7','8','10','12','14','16'],nino:['2','3','4','5','6','7','8','10','12','14','16'],nina:['2','3','4','5','6','7','8','10','12','14','16']},
 MONTHS:{general:['Prematuro','Recién nacido','0-3 meses','3-6 meses','6-9 meses','9-12 meses','12-18 meses','18-24 meses','2T','3T']},
 HEIGHT:{general:['50 cm','56 cm','62 cm','68 cm','74 cm','80 cm','86 cm','92 cm','98 cm']},
 US_RING:{general:['3','3.5','4','4.5','5','5.5','6','6.5','7','7.5','8','8.5','9','9.5','10','10.5','11','11.5','12','12.5','13','13.5','14']},
 EU_RING:{general:['44','46','48','50','52','54','56','58','60','62','64','66','68','70']},
 RING_MM:{general:['14.0 mm','14.6 mm','15.3 mm','15.9 mm','16.5 mm','17.2 mm','17.8 mm','18.4 mm','19.1 mm','19.7 mm','20.3 mm','21.0 mm','21.6 mm','22.2 mm']},
 NECK_CM:{general:['35 cm','40 cm','45 cm','50 cm','55 cm','60 cm','65 cm','70 cm','75 cm','80 cm','90 cm']},
 BRACELET_CM:{general:['14 cm','15 cm','16 cm','17 cm','18 cm','19 cm','20 cm','21 cm','22 cm','23 cm','24 cm','25 cm','26 cm','28 cm','30 cm']},
 WRIST_CM:{general:['14 cm','15 cm','16 cm','17 cm','18 cm','19 cm','20 cm','21 cm','22 cm','23 cm','24 cm']},
 STRAP:{general:['XS','S','S/M','M','M/L','L','XL']},
 BELT_CM:{general:['70 cm','75 cm','80 cm','85 cm','90 cm','95 cm','100 cm','105 cm','110 cm','115 cm','120 cm','125 cm','130 cm','135 cm','140 cm']},
 BELT_IN:{general:['28','30','32','34','36','38','40','42','44','46','48','50','52','54','56']},
 HAND_CM:{general:['15 cm','16 cm','17 cm','18 cm','19 cm','20 cm','21 cm','22 cm','23 cm','24 cm','25 cm']},
 HEAD_CM:{general:['52 cm','53 cm','54 cm','55 cm','56 cm','57 cm','58 cm','59 cm','60 cm','61 cm','62 cm','63 cm','64 cm']}
};
let sizeSystem='US';

function fashionSizeProfileKey(){
  if(!isFashionCategory())return 'none';
  const s1=selectedCategoryPath[1]||'',s2=selectedCategoryPath[2]||'',leaf=selectedCategoryPath[selectedCategoryPath.length-1]||'';
  if(s1==='Zapatos')return 'shoes';
  if(s1==='Ropa'){
    if(s2==='Bebés')return 'baby_clothing';
    if(s2==='Niño'||s2==='Niña')return 'kids_clothing';
    if(['Pantalones','Jeans','Shorts'].includes(leaf))return 'bottoms';
    return 'clothing';
  }
  if(s1==='Joyería'){
    if(s2==='Anillos')return 'rings';
    if(s2==='Collares')return 'necklaces';
    if(s2==='Pulseras')return 'bracelets';
    if(s2==='Relojes')return 'watches';
    return 'none';
  }
  if(s1==='Accesorios de moda'){
    if(leaf==='Cinturones')return 'belts';
    if(leaf==='Guantes')return 'gloves';
    if(leaf==='Gorras y sombreros')return 'hats';
    return 'none';
  }
  return 'none';
}
function currentSizeProfile(){return SIZE_PROFILES[fashionSizeProfileKey()]||SIZE_PROFILES.none}
function categoryUsesSizes(){return currentSizeProfile().mode!=='none'}
function sizeAudienceKeys(){return currentSizeProfile().mode==='general'?['general']:selectedAudienceKeys()}
function sizesFor(system,audience){
  if(fashionSizeProfileKey()==='shoes')return SHOE_SIZE_SETS[system]?.[audience]||SHOE_SIZE_SETS[system]?.hombre||[];
  return STATIC_SIZE_VALUES[system]?.[audience]||STATIC_SIZE_VALUES[system]?.general||[];
}
function syncSizeSystemOptions(resetData=false){
  const select=document.getElementById('sizeSystem'),box=document.querySelector('.size-system-box'),profile=currentSizeProfile();
  if(!select||!box)return;
  const profileKey=fashionSizeProfileKey();
  const profileChanged=renderedStep2SizeProfile!==profileKey;
  renderedStep2SizeProfile=profileKey;
  box.classList.toggle('hidden',!categoryUsesSizes());
  if(!categoryUsesSizes())return;
  const previous=sizeSystem;
  select.innerHTML=Object.entries(profile.systems).map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  if(!profileChanged && profile.systems[previous])sizeSystem=previous;else sizeSystem=Object.keys(profile.systems)[0];
  select.value=sizeSystem;
  const label=box.querySelector('label');if(label)label.textContent=profile.label;
  if(resetData&&previous!==sizeSystem)variantColors.forEach(v=>v.audiences={});
}

const MAX_COLOR_IMAGES=5;
let variantColors=[{id:uid(),color:'',audiences:{},files:[],existingImages:[]}];
function uid(){return crypto.randomUUID?.()||String(Date.now()+Math.random())}
function escHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function audienceInputs(){return Object.fromEntries([...document.querySelectorAll('[name="audience"]')].map(x=>[x.value,x]))}
function syncAdultUnisex(){}
function categoryAudienceKey(){
  if(!isFashionCategory())return null;
  const section=selectedCategoryPath[1],raw=selectedCategoryPath[2]||'';
  if(!['Ropa','Zapatos'].includes(section))return null;
  const v=raw.toLowerCase();
  if(v==='hombre')return 'hombre';if(v==='mujer')return 'mujer';if(v==='niño'||v==='niños')return 'nino';if(v==='niña'||v==='niñas')return 'nina';if(v==='bebés')return 'general';if(v==='unisex')return 'unisex';return null;
}
function syncAudienceFromCategoryPath(){
  const key=categoryAudienceKey(),a=audienceInputs();Object.values(a).forEach(x=>x.checked=false);
  if(key==='unisex'){if(a.hombre)a.hombre.checked=true;if(a.mujer)a.mujer.checked=true;if(a.unisex)a.unisex.checked=true}else if(key&&a[key])a[key].checked=true;
}
function selectedAudienceKeys(){
  const key=categoryAudienceKey();if(key==='unisex')return ['hombre','mujer'];if(key==='general')return ['general'];return key?[key]:[];
}
function selectedAudience(){
  const key=categoryAudienceKey();const labels={hombre:'Hombre',mujer:'Mujer',nino:'Niño',nina:'Niña',general:'Bebé',unisex:'Unisex'};return key?[labels[key]||key]:[];
}
function colorCss(name){const n=(name||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');const map=[['negro','#111827'],['blanco','#f8fafc'],['verde','#22c55e'],['azul','#2563eb'],['rojo','#ef4444'],['amarillo','#eab308'],['naranja','#f97316'],['morado','#7c3aed'],['violeta','#8b5cf6'],['rosa','#ec4899'],['gris','#94a3b8'],['cafe','#92400e'],['beige','#d6c3a5']];const f=map.find(([k])=>n.includes(k));return f?f[1]:'#cbd5e1'}
function ensureAudienceData(v,key){if(!v.audiences[key])v.audiences[key]={sizes:{}};return v.audiences[key]}
function ensureSizeModal(){
 let modal=document.getElementById('sizePickerModal');
 if(modal)return modal;
 modal=document.createElement('div');
 modal.id='sizePickerModal';
 modal.className='size-modal';
 modal.innerHTML=`<div class="size-modal-backdrop" data-close-size-modal></div><section class="size-modal-panel" role="dialog" aria-modal="true" aria-labelledby="sizeModalTitle"><div class="size-modal-head"><div><small id="sizeModalEyebrow">Seleccionar tallas</small><h3 id="sizeModalTitle">Tallas disponibles</h3></div><button type="button" class="size-modal-close" data-close-size-modal>×</button></div><div id="sizeModalChoices" class="size-modal-choices"></div><div class="custom-size-box"><div class="custom-size-head"><div><strong>¿No aparece la talla?</strong><small>Escribe exactamente la talla que muestra la etiqueta del producto.</small></div><button type="button" class="custom-size-toggle" id="customSizeToggle">+ Otra talla</button></div><div class="custom-size-editor" id="customSizeEditor"><input type="text" id="customSizeInput" maxlength="40" autocomplete="off" placeholder="Ej. 42 2/3, 8.5, M 7 / W 8.5"><button type="button" id="customSizeAdd">Agregar</button><small class="custom-size-help" id="customSizeHelp"></small></div><div class="custom-size-selected" id="customSizeSelected"></div></div><div class="size-modal-foot"><span id="sizeModalCount">0 seleccionadas</span><button type="button" class="btn primary" id="sizeModalDone">Listo</button></div></section>`;
 document.body.appendChild(modal);
 modal.querySelectorAll('[data-close-size-modal]').forEach(x=>x.onclick=closeSizeModal);
 modal.querySelector('#sizeModalDone').onclick=closeSizeModal;
 modal.querySelector('#customSizeToggle').onclick=()=>{
   const editor=modal.querySelector('#customSizeEditor');
   editor.classList.toggle('open');
   if(editor.classList.contains('open'))modal.querySelector('#customSizeInput').focus();
 };
 modal.querySelector('#customSizeInput').addEventListener('keydown',e=>{
   if(e.key==='Enter'){e.preventDefault();modal.querySelector('#customSizeAdd').click()}
 });
 return modal;
}
let activeSizePicker=null;
function openSizeModal(vindex,audience){
 const modal=ensureSizeModal(),v=variantColors[vindex],a=ensureAudienceData(v,audience),sizes=sizesFor(sizeSystem,audience);
 activeSizePicker={vindex,audience};
 const systemLabel=currentSizeProfile().systems[sizeSystem]||sizeSystem;
 modal.querySelector('#sizeModalEyebrow').textContent=`${AUDIENCE_LABELS[audience]||'General'} · ${systemLabel}`;
 modal.querySelector('#sizeModalTitle').textContent='Seleccionar tallas disponibles';
 const choices=modal.querySelector('#sizeModalChoices');
 const updateCount=()=>{const n=Object.keys(a.sizes).length;modal.querySelector('#sizeModalCount').textContent=`${n} talla${n===1?'':'s'} seleccionada${n===1?'':'s'}`};
 const customSelected=()=>Object.keys(a.sizes).filter(sz=>!sizes.includes(sz));
 const renderCustomSelected=()=>{
   const box=modal.querySelector('#customSizeSelected'),items=customSelected();
   box.innerHTML=items.length?`<small>Tallas personalizadas agregadas</small><div class="custom-size-chip-list">${items.map(sz=>`<span class="custom-size-chip">${escHtml(sz)}<button type="button" data-custom-size="${escHtml(sz)}" title="Quitar talla">×</button></span>`).join('')}</div>`:'';
   box.querySelectorAll('[data-custom-size]').forEach(btn=>btn.onclick=()=>{delete a.sizes[btn.dataset.customSize];renderCustomSelected();updateCount()});
 };
 choices.innerHTML=sizes.map(sz=>`<button type="button" class="size-modal-choice ${a.sizes[sz]?'selected':''}" data-size="${escHtml(sz)}">${escHtml(sz)}</button>`).join('');
 choices.querySelectorAll('.size-modal-choice').forEach(btn=>btn.onclick=()=>{
   const sz=btn.dataset.size;
   if(a.sizes[sz]){delete a.sizes[sz];btn.classList.remove('selected')}
   else{a.sizes[sz]={price:'',stock:''};btn.classList.add('selected')}
   updateCount();
 });
 const input=modal.querySelector('#customSizeInput'),help=modal.querySelector('#customSizeHelp');
 input.value='';help.textContent='';modal.querySelector('#customSizeEditor').classList.remove('open');
 modal.querySelector('#customSizeAdd').onclick=()=>{
   const raw=input.value.trim().replace(/\s+/g,' ');
   help.textContent='';
   if(!raw){help.textContent='Escribe la talla que aparece en el producto.';input.focus();return}
   if(a.sizes[raw]){help.textContent='Esa talla ya está seleccionada.';input.focus();return}
   a.sizes[raw]={price:'',stock:''};
   input.value='';
   renderCustomSelected();
   updateCount();
   input.focus();
 };
 renderCustomSelected();
 updateCount();
 modal.classList.add('open');document.body.classList.add('size-modal-open');
}
function closeSizeModal(){const modal=document.getElementById('sizePickerModal');if(!modal)return;modal.classList.remove('open');document.body.classList.remove('size-modal-open');if(activeSizePicker){activeSizePicker=null;renderVariantBuilder()}}
function productImageUrl(v){if(!v)return '';const x=String(v);if(/^(https?:|data:|blob:)/i.test(x))return x;return `http://localhost:3000${x.startsWith('/')?'':'/'}${x}`}
function variantImageItems(v){return [...(v.existingImages||[]).map(x=>({src:productImageUrl(x.ruta_imagen),existing:true})),...(v.files||[]).map(x=>({src:URL.createObjectURL(x),existing:false}))]}
function renderVariantBuilder(){
 const rows=document.getElementById('variantRows'); if(!rows)return; const audienceKeys=sizeAudienceKeys();
 rows.innerHTML=variantColors.map((v,idx)=>{
  const files=v.files||[],existing=v.existingImages||[],totalImages=existing.length+files.length,remaining=MAX_COLOR_IMAGES-totalImages;
  const gallery=totalImages?[...existing.map((im,i)=>`<div class="image-thumb"><img src="${escHtml(productImageUrl(im.ruta_imagen))}"><span class="image-index">${i+1}</span><button type="button" class="image-remove presentation-existing-image-remove" data-vindex="${idx}" data-image-index="${i}">×</button></div>`),...files.map((f,i)=>`<div class="image-thumb"><img src="${URL.createObjectURL(f)}"><span class="image-index">${existing.length+i+1}</span><button type="button" class="image-remove presentation-image-remove" data-vindex="${idx}" data-image-index="${i}">×</button></div>`)].join(''):'<div class="image-empty">Agrega al menos 1 fotografía para continuar.</div>';
  const blocks=(!isFashionCategory()||!categoryUsesSizes())?`<div class="generic-presentation-fields"><label>Precio de esta presentación ($)<input class="generic-price" data-vindex="${idx}" type="number" min="0" step=".01" value="${escHtml(v.price??'')}" placeholder="0.00"></label><label>Stock disponible<input class="generic-stock" data-vindex="${idx}" type="number" min="0" step="1" value="${escHtml(v.stock??'')}" placeholder="0"></label></div>`:audienceKeys.length?audienceKeys.map(key=>{
    const a=ensureAudienceData(v,key),selected=Object.keys(a.sizes);
    const selectedChips=selected.length?selected.map(sz=>`<span class="selected-size-chip">${escHtml(sz)}</span>`).join(''):'<span class="selected-size-none">Ninguna talla seleccionada</span>';
    const prices=selected.map(sz=>Number(a.sizes[sz].price)).filter(n=>Number.isFinite(n)&&n>0), stocks=selected.map(sz=>Number(a.sizes[sz].stock)||0), totalStock=stocks.reduce((n,x)=>n+x,0);
    const priceSummary=!selected.length?'—':!prices.length?'Sin precio':(Math.min(...prices)===Math.max(...prices)?'$'+Math.min(...prices).toFixed(2):'$'+Math.min(...prices).toFixed(2)+' – $'+Math.max(...prices).toFixed(2));
    const systemLabel=currentSizeProfile().systems[sizeSystem]||sizeSystem;
    return `<div class="audience-block compact"><div class="audience-title compact-title"><div><strong>${AUDIENCE_LABELS[key]||'General'} · ${systemLabel}</strong><span class="audience-size-count">${selected.length} seleccionada${selected.length===1?'':'s'}</span></div><div class="audience-actions"><button type="button" class="select-sizes-btn" data-vindex="${idx}" data-audience="${key}">Tallas</button></div></div><div class="selected-size-strip">${selectedChips}</div>${selected.length?`<div class="price-stock-summary"><div><small>Precio</small><strong>${priceSummary}</strong></div><div><small>Stock total</small><strong>${totalStock} u.</strong></div><button type="button" class="toggle-price-stock" data-vindex="${idx}" data-audience="${key}">Editar precio y stock</button></div>`:''}</div>`
  }).join(''):'<div class="audience-empty">Regresa a Información y selecciona al menos un público (Hombre, Mujer, Niño, Niña o Unisex) para mostrar sus tallas.</div>';
  return `<section class="variant-color-editor"><div class="variant-color-head"><div><small>${isFashionCategory()?'Color':'Presentación'} ${idx+1}</small><input class="variant-color-name" data-vindex="${idx}" value="${escHtml(v.color)}" placeholder="${isFashionCategory()?'Ej. Verde':'Ej. Presentación principal'}"></div>${variantColors.length>1?`<button type="button" class="remove-color" data-vindex="${idx}" title="Eliminar presentación">×</button>`:''}</div><div class="presentation-body"><div class="presentation-photo-tools"><div><strong>Fotografías de ${escHtml(v.color||'este color')}</strong><br><small>${totalImages}/5 imágenes · mínimo 1</small></div><label class="file-button">${totalImages?'Agregar más':'Agregar imágenes'}<input class="presentation-file-input" data-vindex="${idx}" type="file" multiple accept="image/*" ${remaining===0?'disabled':''}></label></div><div class="presentation-gallery">${gallery}</div>${blocks}</div></section>`;
 }).join(''); bindVariantEvents();
}
function bindVariantEvents(){const rows=document.getElementById('variantRows');
 rows.querySelectorAll('.variant-color-name').forEach(x=>x.oninput=()=>{variantColors[+x.dataset.vindex].color=x.value});
 rows.querySelectorAll('.remove-color').forEach(x=>x.onclick=()=>{variantColors.splice(+x.dataset.vindex,1);renderVariantBuilder()});
 rows.querySelectorAll('.select-sizes-btn').forEach(x=>x.onclick=()=>openSizeModal(+x.dataset.vindex,x.dataset.audience));
 rows.querySelectorAll('.toggle-price-stock').forEach(b=>b.onclick=()=>openPriceStockModal(+b.dataset.vindex,b.dataset.audience));
 rows.querySelectorAll('.presentation-file-input').forEach(inp=>inp.onchange=e=>{const v=variantColors[+inp.dataset.vindex],incoming=[...e.target.files],room=MAX_COLOR_IMAGES-(v.files.length+(v.existingImages||[]).length);v.files.push(...incoming.slice(0,room));if(incoming.length>room)alert(`Máximo ${MAX_COLOR_IMAGES} imágenes por color.`);renderVariantBuilder()});
 rows.querySelectorAll('.presentation-image-remove').forEach(b=>b.onclick=()=>{variantColors[+b.dataset.vindex].files.splice(+b.dataset.imageIndex,1);renderVariantBuilder()});
 rows.querySelectorAll('.presentation-existing-image-remove').forEach(b=>b.onclick=()=>{variantColors[+b.dataset.vindex].existingImages.splice(+b.dataset.imageIndex,1);renderVariantBuilder()});
 rows.querySelectorAll('.generic-price').forEach(x=>x.oninput=()=>variantColors[+x.dataset.vindex].price=x.value);
 rows.querySelectorAll('.generic-stock').forEach(x=>x.oninput=()=>variantColors[+x.dataset.vindex].stock=x.value);
}

let priceStockEditing=null;
function openPriceStockModal(idx,key){
 const v=variantColors[idx],a=v&&ensureAudienceData(v,key),modal=document.getElementById('priceStockModal');if(!v||!a||!modal)return;
 const sizes=Object.keys(a.sizes||{});if(!sizes.length)return;
 priceStockEditing={idx,key,draft:{}};
 sizes.forEach(sz=>{const d=a.sizes[sz]||{};priceStockEditing.draft[sz]={price:d.price??'',stock:d.stock??''}});
 const systemLabel=currentSizeProfile().systems[sizeSystem]||sizeSystem;
 document.getElementById('priceStockModalMeta').textContent=`${v.color||'Color'} · ${AUDIENCE_LABELS[key]||'General'} · ${systemLabel}`;
 document.getElementById('priceStockModalTitle').textContent='Editar precio y stock';
 document.getElementById('modalBulkPrice').value='';document.getElementById('modalBulkStock').value='';
 renderPriceStockModalRows();modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('price-stock-modal-open');
}
function renderPriceStockModalRows(){
 const box=document.getElementById('modalPriceStockList');if(!box||!priceStockEditing)return;
 box.innerHTML=Object.entries(priceStockEditing.draft).map(([sz,d])=>`<div class="modal-price-stock-row"><strong>Talla ${escHtml(sz)}</strong><label>Precio ($)<input class="modal-size-price" data-size="${escHtml(sz)}" type="number" min="0" step=".01" value="${escHtml(d.price||'')}"></label><label>Stock<input class="modal-size-stock" data-size="${escHtml(sz)}" type="number" min="0" step="1" value="${escHtml(d.stock||'')}"></label></div>`).join('');
 box.querySelectorAll('.modal-size-price').forEach(x=>x.oninput=()=>{if(priceStockEditing?.draft[x.dataset.size])priceStockEditing.draft[x.dataset.size].price=x.value});
 box.querySelectorAll('.modal-size-stock').forEach(x=>x.oninput=()=>{if(priceStockEditing?.draft[x.dataset.size])priceStockEditing.draft[x.dataset.size].stock=x.value});
}
function closePriceStockModal(){const modal=document.getElementById('priceStockModal');if(!modal)return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('price-stock-modal-open');priceStockEditing=null;}
document.querySelectorAll('[data-price-stock-close]').forEach(b=>b.addEventListener('click',closePriceStockModal));
document.getElementById('modalApplyPrice')?.addEventListener('click',()=>{if(!priceStockEditing)return;const val=document.getElementById('modalBulkPrice').value;if(val==='')return;Object.values(priceStockEditing.draft).forEach(d=>d.price=val);renderPriceStockModalRows();});
document.getElementById('modalApplyStock')?.addEventListener('click',()=>{if(!priceStockEditing)return;const val=document.getElementById('modalBulkStock').value;if(val==='')return;Object.values(priceStockEditing.draft).forEach(d=>d.stock=val);renderPriceStockModalRows();});
document.getElementById('modalSavePriceStock')?.addEventListener('click',()=>{if(!priceStockEditing)return;const {idx,key,draft}=priceStockEditing,v=variantColors[idx];if(!v)return closePriceStockModal();const target=ensureAudienceData(v,key).sizes;Object.entries(draft).forEach(([sz,d])=>{if(target[sz]){target[sz].price=d.price;target[sz].stock=d.stock}});closePriceStockModal();renderVariantBuilder();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('priceStockModal')?.classList.contains('open'))closePriceStockModal();});

document.getElementById('addVariant').onclick=()=>{variantColors.push({id:uid(),color:'',audiences:{},files:[],existingImages:[]});renderVariantBuilder()};
document.getElementById('sizeSystem').addEventListener('change',e=>{sizeSystem=e.target.value;variantColors.forEach(v=>v.audiences={});renderVariantBuilder()});

function review(){
 const fashion=isFashionCategory(), usesSizes=fashion&&categoryUsesSizes();
 const warrantyNo=document.getElementById('sinGarantia')?.checked;
 const warrantyDays=document.getElementById('garantia')?.value?.trim();
 const warrantyText=warrantyNo?'Sin garantía':(warrantyDays?`${warrantyDays} días`:'—');
 let totalStock=0, prices=[], combinations=0;
 variantColors.forEach(v=>{
   if(usesSizes){
     sizeAudienceKeys().forEach(key=>{const a=v.audiences?.[key];if(!a)return;Object.values(a.sizes||{}).forEach(d=>{combinations++;totalStock+=Number(d.stock)||0;if(d.price!==''&&d.price!=null&&!Number.isNaN(Number(d.price)))prices.push(Number(d.price))})});
   }else{
     totalStock+=Number(v.stock)||0;
     if(v.price!==''&&v.price!=null&&!Number.isNaN(Number(v.price)))prices.push(Number(v.price));
   }
 });
 const priceText=!prices.length?'—':(Math.min(...prices)===Math.max(...prices)?`$${prices[0].toFixed(2)}`:`$${Math.min(...prices).toFixed(2)} – $${Math.max(...prices).toFixed(2)}`);
 const leaf=(selectedCategoryPath[selectedCategoryPath.length-1]||'').toString().toLowerCase();
 let presentationLabel='Presentaciones';
 if(/zapato|tenis|bota|sandalia|ropa|vestido|camisa|pantal|joyer|anillo|collar|pulsera|reloj/.test(categorySignature().toLowerCase())) presentationLabel='Colores / presentaciones';
 else if(/perfume|fragancia/.test(leaf)) presentationLabel='Presentaciones / tamaños';
 else if(/alimento|bebida/.test(categorySignature().toLowerCase())) presentationLabel='Presentaciones';
 const summary=[
   ['Producto',nombre.value||'Sin nombre'],['Categoría',ruta.textContent||'—'],['Marca / modelo',[marca.value,modelo.value].filter(Boolean).join(' · ')||'—'],['Garantía',warrantyText]
 ];
 if(fashion){const aud=selectedAudience();if(aud.length)summary.push(['Público',aud.join(', ')]);}
 if(usesSizes)summary.push(['Sistema de tallas',currentSizeProfile().systems[sizeSystem]||sizeSystem],['Combinaciones',String(combinations)]);
 summary.push([presentationLabel,String(variantColors.length)],['Precio',priceText],['Stock total',String(totalStock)],['Estado','Borrador de publicación']);
 const general=document.getElementById('reviewGeneralSummary');
 if(general)general.innerHTML=summary.map(([k,v])=>`<dt>${escHtml(k)}</dt><dd>${escHtml(v)}</dd>`).join('');
 const firstVariant=variantColors.find(v=>variantImageItems(v).length),first=firstVariant?variantImageItems(firstVariant)[0]:null;reviewMainPreview.innerHTML=first?`<img class="review-main-image" src="${first.src}">`:'📦';
 const oldAttr=document.getElementById('reviewAttributeSummary');if(oldAttr)oldAttr.remove();const attrs=currentAttributeSummary();if(attrs.length){const el=document.createElement('div');el.id='reviewAttributeSummary';el.className='review-attributes';el.innerHTML=`<h4>Atributos del producto</h4><div class="review-attribute-grid">${attrs.map(a=>`<div class="review-attribute-item"><small>${escHtml(a.label)}</small><strong>${escHtml(a.value)}</strong></div>`).join('')}</div>`;document.querySelector('.review')?.insertAdjacentElement('afterend',el)}
 renderUniversalReview();
 const box=document.getElementById('reviewVariants');box.innerHTML=variantColors.map(v=>{let cardStock=0,rows='';if(usesSizes){sizeAudienceKeys().forEach(key=>{const a=v.audiences[key];if(!a)return;Object.entries(a.sizes||{}).forEach(([sz,d])=>{const stock=Number(d.stock)||0;cardStock+=stock;rows+=`<tr><td class="audience-cell">${AUDIENCE_LABELS[key]}</td><td><strong>${escHtml(sz)}</strong></td><td class="price">${d.price!==''?'$'+Number(d.price).toFixed(2):'—'}</td><td class="${stock>0?'stock-ok':'stock-zero'}">${stock>0?stock+' disponibles':'Agotado'}</td></tr>`})})}else{cardStock=Number(v.stock)||0;rows=`<tr><td class="audience-cell">Presentación</td><td><strong>${escHtml(v.color||'General')}</strong></td><td class="price">${v.price!==''&&v.price!=null?'$'+Number(v.price).toFixed(2):'—'}</td><td class="${cardStock>0?'stock-ok':'stock-zero'}">${cardStock>0?cardStock+' disponibles':'Agotado'}</td></tr>`};const imageItems=variantImageItems(v),first=imageItems[0],thumbs=imageItems.map(im=>`<div class="review-thumb"><img src="${im.src}"></div>`).join('');return `<section class="review-color-card"><div class="review-color-head"><div class="review-color-name"><span class="color-swatch" style="background:${colorCss(v.color)}"></span><strong>${escHtml(v.color||'Sin nombre')}</strong></div><span class="review-color-meta">Stock total ${cardStock} · ${imageItems.length}/5 fotos</span></div><div class="review-color-body"><div><div class="review-color-photo">${first?`<img src="${first.src}">`:'Sin fotografía para esta presentación'}</div>${thumbs?`<div class="review-thumbs">${thumbs}</div>`:''}</div><div><table class="review-size-table"><thead><tr>${usesSizes?'<th>Público</th><th>Talla</th>':'<th>Tipo</th><th>Presentación</th>'}<th>Precio</th><th>Disponibilidad</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Sin variantes configuradas</td></tr>'}</tbody></table></div></div></section>`}).join('')||'<div class="review-no-variants">No hay presentaciones agregadas.</div>';
}
function rebuildStep2ForCurrentCategory(){
  // La categoría seleccionada es la única fuente de verdad del Paso 2.
  // Si cambió, se descarta cualquier UI renderizada con el perfil anterior.
  const sig=categorySignature();
  const attrProfile=categoryProfileKey();
  const sizeProfile=fashionSizeProfileKey();
  if(renderedStep2CategorySignature!==sig || renderedStep2AttributeProfile!==attrProfile || renderedStep2SizeProfile!==sizeProfile){
    invalidateStep2CategoryUI();
  }
  updateCategoryDependentFields();
  renderCategoryAttributes();
  renderVariantBuilder();
}
// Fase 41: validación obligatoria del Paso 2 antes de entrar a Revisión.
let step2ValidationTarget=null;
function ensureStep2ValidationModal(){
  let modal=document.getElementById('step2ValidationModal');
  if(modal)return modal;
  modal=document.createElement('div');
  modal.id='step2ValidationModal';
  modal.className='step2-validation-modal';
  modal.setAttribute('aria-hidden','true');
  modal.innerHTML=`<div class="step2-validation-backdrop"></div>
  <section class="step2-validation-panel" role="dialog" aria-modal="true" aria-labelledby="step2ValidationTitle">
    <div class="step2-validation-icon">!</div>
    <div class="step2-validation-copy">
      <small>Información incompleta</small>
      <h3 id="step2ValidationTitle">Completa la presentación antes de continuar</h3>
      <p id="step2ValidationMessage">Faltan datos obligatorios.</p>
      <ul id="step2ValidationList"></ul>
    </div>
    <div class="step2-validation-actions">
      <button type="button" class="btn secondary" id="step2ValidationClose">Entendido</button>
      <button type="button" class="btn primary" id="step2ValidationGo">Ir a completar</button>
    </div>
  </section>`;
  document.body.appendChild(modal);
  const close=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('step2-validation-open')};
  modal.querySelector('#step2ValidationClose').onclick=close;
  modal.querySelector('.step2-validation-backdrop').onclick=close;
  modal.querySelector('#step2ValidationGo').onclick=()=>{
    const target=step2ValidationTarget;
    close();
    if(!target)return;
    const card=document.querySelectorAll('.variant-color-editor')[target.idx];
    card?.classList.add('validation-attention');
    card?.scrollIntoView({behavior:'smooth',block:'center'});
    setTimeout(()=>card?.classList.remove('validation-attention'),2200);
    if(target.type==='sizes'){
      setTimeout(()=>openSizeModal(target.idx,target.key),350);
    }else if(target.type==='priceStock'){
      setTimeout(()=>openPriceStockModal(target.idx,target.key),350);
    }else if(target.type==='field'){
      setTimeout(()=>document.querySelector(target.selector)?.focus(),350);
    }else if(target.type==='images'){
      setTimeout(()=>card?.querySelector('.presentation-file-input')?.closest('.file-button')?.classList.add('validation-button-attention'),350);
    }
  };
  return modal;
}
function showStep2ValidationModal(issues,target){
  const modal=ensureStep2ValidationModal();
  step2ValidationTarget=target||null;
  const list=modal.querySelector('#step2ValidationList');
  const visible=issues.slice(0,6);
  list.innerHTML=visible.map(x=>`<li>${escHtml(x)}</li>`).join('')+(issues.length>6?`<li>Y ${issues.length-6} dato${issues.length-6===1?'':'s'} más por completar.</li>`:'');
  modal.querySelector('#step2ValidationMessage').textContent=issues.length===1?'Hay 1 dato obligatorio pendiente.':'Hay '+issues.length+' datos obligatorios pendientes.';
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('step2-validation-open');
}
function validateStep2BeforeReview(){
  const issues=[];
  let firstTarget=null;
  const add=(msg,target)=>{issues.push(msg);if(!firstTarget)firstTarget=target};
  if(!variantColors.length){add('Agrega al menos una presentación del producto.',{type:'field',selector:'#addVariant'});return {ok:false,issues,firstTarget}}
  const usesSizes=isFashionCategory()&&categoryUsesSizes();
  const audienceKeys=usesSizes?sizeAudienceKeys():[];
  variantColors.forEach((v,idx)=>{
    const label=(isFashionCategory()?'Color':'Presentación')+' '+(idx+1);
    if(!String(v.color||'').trim()) add(`${label}: escribe el nombre del ${isFashionCategory()?'color':'presentación'}.`,{type:'field',idx,selector:`.variant-color-name[data-vindex="${idx}"]`});
    if(!variantImageItems(v).length) add(`${label}: agrega al menos 1 fotografía.`,{type:'images',idx});
    if(usesSizes){
      if(!audienceKeys.length){add(`${label}: selecciona el público/tipo correspondiente desde Información.`,{type:'field',idx,selector:'.select-sizes-btn'});return}
      audienceKeys.forEach(key=>{
        const a=ensureAudienceData(v,key),sizes=Object.keys(a.sizes||{}),audLabel=AUDIENCE_LABELS[key]||'General';
        if(!sizes.length){add(`${label} · ${audLabel}: selecciona al menos 1 talla.`,{type:'sizes',idx,key});return}
        sizes.forEach(sz=>{
          const d=a.sizes[sz]||{},price=String(d.price??'').trim(),stock=String(d.stock??'').trim();
          if(price==='' || !Number.isFinite(Number(price)) || Number(price)<=0) add(`${label} · ${audLabel} · talla ${sz}: define un precio mayor a $0.`,{type:'priceStock',idx,key});
          if(stock==='' || !/^\d+$/.test(stock) || Number(stock)<0) add(`${label} · ${audLabel} · talla ${sz}: define el stock (puede ser 0).`,{type:'priceStock',idx,key});
        });
      });
    }else{
      const price=String(v.price??'').trim(),stock=String(v.stock??'').trim();
      if(price==='' || !Number.isFinite(Number(price)) || Number(price)<=0) add(`${label}: define un precio mayor a $0.`,{type:'field',idx,selector:`.generic-price[data-vindex="${idx}"]`});
      if(stock==='' || !/^\d+$/.test(stock) || Number(stock)<0) add(`${label}: define el stock (puede ser 0).`,{type:'field',idx,selector:`.generic-stock[data-vindex="${idx}"]`});
    }
  });
  return {ok:issues.length===0,issues,firstTarget};
}

function updateGlobalProgress(){
  const labels=['Información','Presentaciones','Revisión'];
  const percentages=[33,67,100];
  const label=document.getElementById('globalProgressLabel');
  const percent=document.getElementById('globalProgressPercent');
  const bar=document.getElementById('globalProgressBar');
  if(label) label.textContent=`Paso ${step+1} de 3 · ${labels[step]}`;
  if(percent) percent.textContent=`${percentages[step]}%`;
  if(bar) bar.style.width=`${percentages[step]}%`;
}
function show(){panes.forEach((p,i)=>p.classList.toggle('active',i===step));steps.forEach((s,i)=>{s.classList.toggle('active',i===step);s.classList.toggle('done',i<step)});prev.classList.remove('hidden');prev.textContent=step===0?'← Panel':'← Anterior';next.classList.toggle('hidden',step===2);publish.classList.toggle('hidden',step!==2);updateGlobalProgress();if(step===1){rebuildStep2ForCurrentCategory()}if(step===2)review()}

// Fase 48: cada cambio completo de paso empieza desde la parte superior.
// No se usa dentro de las validaciones "Ir a completar", porque esas sí deben
// conservar el desplazamiento dirigido al campo/presentación con problema.
function scrollWizardToTop(){
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      window.scrollTo({top:0,left:0,behavior:'auto'});
      document.documentElement.scrollTop=0;
      document.body.scrollTop=0;
    });
  });
}

next.onclick=async()=>{
  if(step===0){
    const error=validateInformationStep();
    if(error){const el=document.getElementById(error[0]);el?.classList.add('flow-invalid');el?.focus();showFlowToast(error[1]);return}
    if(!Array.isArray(configuredCategoryPath)||!sameCategoryPath(configuredCategoryPath,selectedCategoryPath)){
      clearCategorySpecificData(); // Solo una clasificación NUEVA crea un Paso 2 limpio.
      configuredCategoryPath=[...selectedCategoryPath];
    }
    rebuildStep2ForCurrentCategory();
  }
  if(step===1){
    const check=validateStep2BeforeReview();
    if(!check.ok){showStep2ValidationModal(check.issues,check.firstTarget);return}
  }
  if(step<2){step++;show();scrollWizardToTop()}
};prev.onclick=()=>{if(step>0){step--;show();scrollWizardToTop()}else{leavePublication('panel-vendedor.html')}};
const wizardBack=document.getElementById('wizardBack');
function updateWizardBack(){if(!wizardBack)return;wizardBack.textContent=step>0?'← Anterior':'← Panel';}
if(wizardBack)wizardBack.onclick=()=>{if(step>0){step--;show();updateWizardBack();scrollWizardToTop();}else{leavePublication('panel-vendedor.html');}};
const originalShow=show;
show=function(){originalShow();updateWizardBack();};
updateWizardBack();
// Fase 36: proteger la publicación al usar Atrás/Adelante del navegador o salir de la página.
let publicationDirty=false;
let allowBrowserExit=false;
const EXIT_WARNING='¿Salir de la publicación?\n\nLa información que has ingresado en este producto se eliminará si sales de esta página.\n\n¿Deseas continuar?';

function markPublicationDirty(ev){
  const target=ev.target;
  if(!target) return;
  if(target.closest?.('.card') || target.closest?.('#stickyFormActions')) publicationDirty=true;
}
document.addEventListener('input',markPublicationDirty,true);
document.addEventListener('change',markPublicationDirty,true);

function leavePublication(url){
  if(publicationDirty && !window.confirm(EXIT_WARNING)) return;
  allowBrowserExit=true;
  location.href=url;
}

// Creamos una entrada centinela en el historial. Así el primer clic en Atrás
// permanece en esta misma página y podemos mostrar nuestra advertencia personalizada.
try{
  history.replaceState({tiendaproPublicationBase:true},'',location.href);
  history.pushState({tiendaproPublicationGuard:true},'',location.href);
}catch(_e){}

// Fase 37: advertencia flotante personalizada para el botón Atrás del navegador.
let browserExitModalOpen=false;
function ensureBrowserExitModal(){
  let modal=document.getElementById('browserExitWarningModal');
  if(modal) return modal;
  modal=document.createElement('div');
  modal.id='browserExitWarningModal';
  modal.className='browser-exit-modal';
  modal.setAttribute('aria-hidden','true');
  modal.innerHTML=`
    <div class="browser-exit-backdrop"></div>
    <div class="browser-exit-panel" role="dialog" aria-modal="true" aria-labelledby="browserExitTitle">
      <div class="browser-exit-icon">!</div>
      <div class="browser-exit-copy">
        <h3 id="browserExitTitle">¿Salir de la publicación?</h3>
        <p>Si regresas usando el navegador, se perderá la información que has ingresado para este producto.</p>
        <div class="browser-exit-note">Esta advertencia se muestra sin importar si estás en Información, Presentaciones o Revisión.</div>
      </div>
      <div class="browser-exit-actions">
        <button type="button" class="browser-exit-cancel">Cancelar</button>
        <button type="button" class="browser-exit-confirm">Salir y perder cambios</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  return modal;
}
function askBrowserExit(){
  return new Promise(resolve=>{
    if(browserExitModalOpen){resolve(false);return;}
    browserExitModalOpen=true;
    const modal=ensureBrowserExitModal();
    const cancel=modal.querySelector('.browser-exit-cancel');
    const confirmBtn=modal.querySelector('.browser-exit-confirm');
    const backdrop=modal.querySelector('.browser-exit-backdrop');
    const finish=(value)=>{
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
      document.body.classList.remove('browser-exit-modal-open');
      browserExitModalOpen=false;
      document.removeEventListener('keydown',onKey);
      resolve(value);
    };
    const onKey=(ev)=>{if(ev.key==='Escape'){ev.preventDefault();finish(false);}};
    cancel.onclick=()=>finish(false);
    confirmBtn.onclick=()=>finish(true);
    backdrop.onclick=()=>finish(false);
    document.addEventListener('keydown',onKey);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('browser-exit-modal-open');
    setTimeout(()=>cancel.focus(),0);
  });
}

window.addEventListener('popstate',async()=>{
  if(allowBrowserExit) return;
  // Siempre protegemos el formulario completo, sin importar el paso actual.
  // Restauramos primero el centinela para que la página no abandone el formulario
  // mientras el vendedor decide en la ventana flotante.
  history.pushState({tiendaproPublicationGuard:true},'',location.href);
  const leave=await askBrowserExit();
  if(leave){
    allowBrowserExit=true;
    // Se requieren dos retrocesos: uno elimina el centinela restaurado y el otro
    // abandona la página hacia la entrada anterior real del navegador.
    history.go(-2);
  }
});

// Respaldo para recargar, cerrar pestaña o navegaciones que no generan popstate.
window.addEventListener('beforeunload',(ev)=>{
  if(!publicationDirty || allowBrowserExit) return;
  ev.preventDefault();
  ev.returnValue='';
});


// Fase 39: sesión temporal de varios productos con edición antes de finalizar.
let sessionProducts=[];
let editingProductIndex=null;
const databaseEditId=Number(new URLSearchParams(location.search).get('edit')||0);
let databaseEditLoaded=false;

function clonePlain(value){
  if(Array.isArray(value))return value.map(clonePlain);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,clonePlain(v)]));
  return value;
}
function cloneVariantsForSession(list){
  return (list||[]).map(v=>({
    ...v,
    files:[...(v.files||[])],
    existingImages:clonePlain(v.existingImages||[]),
    audiences:Object.fromEntries(Object.entries(v.audiences||{}).map(([key,a])=>[key,{...a,sizes:clonePlain(a.sizes||{})}]))
  }));
}
function completionTotalsForVariants(list){
  const prices=[],stocks=[];
  (list||[]).forEach(v=>{
    const hasAudienceSizes=Object.values(v.audiences||{}).some(a=>Object.keys(a.sizes||{}).length);
    if(!hasAudienceSizes){
      const p=Number(v.price);if(Number.isFinite(p)&&p>0)prices.push(p);
      stocks.push(Number(v.stock)||0);return;
    }
    Object.values(v.audiences||{}).forEach(a=>Object.values(a.sizes||{}).forEach(d=>{
      const p=Number(d.price);if(Number.isFinite(p)&&p>0)prices.push(p);
      stocks.push(Number(d.stock)||0);
    }));
  });
  const totalStock=stocks.reduce((a,b)=>a+b,0);
  let price='Sin precio';
  if(prices.length){const min=Math.min(...prices),max=Math.max(...prices);price=min===max?`$${min.toFixed(2)}`:`$${min.toFixed(2)} – $${max.toFixed(2)}`}
  return {price,totalStock};
}
// Fase 46 · Cuidados/advertencias universales + detalles adicionales
const CARE_CATALOG=[
 ['no_sumergir','Agua y humedad','💧','No sumergir','No sumerja el producto en agua.'],
 ['mantener_seco','Agua y humedad','☂️','Mantener seco','Proteja el producto del agua y la humedad.'],
 ['no_resistente_agua','Agua y humedad','🚫💧','No resistente al agua','El producto no está diseñado para resistir agua.'],
 ['no_resistente_polvo','Agua y humedad','🌫️','No resistente al polvo','Evite la exposición excesiva al polvo y partículas.'],
 ['secar_inmediatamente','Agua y humedad','🧻','Secar inmediatamente','Seque cualquier humedad o derrame de inmediato.'],
 ['evitar_golpes','Manipulación','📦','Evitar golpes','Manipule con cuidado y evite golpes o caídas.'],
 ['fragil','Manipulación','🍷','Frágil','Producto frágil; manipule con especial cuidado.'],
 ['no_dejar_caer','Manipulación','⬇️','No dejar caer','Evite dejar caer el producto.'],
 ['este_lado_arriba','Manipulación','⬆️','Este lado arriba','Mantenga el producto en la orientación indicada.'],
 ['no_apilar','Manipulación','🚫📚','No apilar','No coloque otros objetos encima.'],
 ['evitar_sol','Temperatura','☀️','Evitar luz solar directa','No exponga el producto directamente al sol.'],
 ['evitar_calor','Temperatura','🔥','Evitar altas temperaturas','Mantenga alejado de fuentes de calor.'],
 ['evitar_frio_extremo','Temperatura','❄️','Evitar frío extremo','No exponga el producto a temperaturas extremadamente bajas.'],
 ['lugar_fresco','Almacenamiento','🌡️','Conservar en lugar fresco','Almacene en un lugar fresco y ventilado.'],
 ['lugar_seco','Almacenamiento','🏠','Conservar en lugar seco','Almacene en un lugar seco y protegido de humedad.'],
 ['refrigerar','Alimentos','🧊','Mantener refrigerado','Conserve el producto refrigerado.'],
 ['refrigerar_despues_abrir','Alimentos','🥶','Refrigerar después de abrir','Una vez abierto, conserve refrigerado.'],
 ['congelado','Alimentos','❄️','Mantener congelado','Conserve el producto congelado.'],
 ['consumir_despues_abrir','Alimentos','⏱️','Consumir pronto después de abrir','Respete el periodo de consumo indicado tras abrir.'],
 ['revisar_vencimiento','Alimentos','📅','Revisar fecha de vencimiento','No consumir después de la fecha de vencimiento.'],
 ['no_ingerir','Seguridad','🚫🥄','No ingerir','Este producto no debe ingerirse.'],
 ['fuera_ninos','Seguridad','👶','Mantener fuera del alcance de niños','Guarde el producto fuera del alcance de los niños.'],
 ['alejar_fuego','Seguridad','🚫🔥','Mantener alejado del fuego','No acerque el producto a llamas o fuentes de ignición.'],
 ['inflamable','Seguridad','🔥','Inflamable','Mantenga alejado de chispas, llamas y calor.'],
 ['no_perforar','Seguridad','🚫📌','No perforar','No perfore ni dañe el recipiente o producto.'],
 ['desconectar_limpiar','Seguridad','🔌','Desconectar antes de limpiar','Desconecte de la energía antes de limpiar o dar mantenimiento.'],
 ['solo_interior','Uso','🏠','Solo uso interior','Diseñado para utilizarse únicamente en interiores.'],
 ['solo_exterior','Uso','🌳','Uso exterior','Diseñado para uso en exteriores según sus especificaciones.'],
 ['leer_manual','Uso','📖','Leer instrucciones','Consulte las instrucciones antes de usar el producto.'],
 ['no_exceder_peso','Uso','⚖️','No exceder peso máximo','No supere la capacidad máxima indicada por el fabricante.'],
 ['lavar_frio','Lavado','🧺','Lavar en frío','Lave con agua fría.'],
 ['lavar_mano','Lavado','🖐️','Lavar a mano','Lave el producto únicamente a mano.'],
 ['ciclo_delicado','Lavado','🌀','Ciclo delicado','Use un ciclo de lavado delicado.'],
 ['no_cloro','Lavado','△','No usar blanqueador','No utilice cloro ni blanqueadores.'],
 ['no_secadora','Lavado','🚫♨️','No usar secadora','No seque el producto en secadora.'],
 ['secadora_baja','Lavado','♨️','Secadora a baja temperatura','Use secadora únicamente a baja temperatura.'],
 ['no_lavado_seco','Lavado','🚫◯','No lavar en seco','No utilice procesos de lavado en seco.'],
 ['plancha_baja','Lavado','♨','Planchar a baja temperatura','Planche únicamente a baja temperatura.'],
 ['no_planchar','Lavado','🚫♨','No planchar','No aplique plancha al producto.'],
 ['secar_sombra','Lavado','🌥️','Secar a la sombra','Seque el producto protegido del sol directo.'],
 ['reciclar','Medio ambiente','♻️','Reciclar','Deposite el material en el sistema de reciclaje correspondiente.'],
 ['basura_correspondiente','Medio ambiente','🗑️','Desechar responsablemente','Deposite el envase o producto en el recipiente de residuos correspondiente.'],
 ['no_tirar_ambiente','Medio ambiente','🚯','No arrojar al ambiente','No abandone el producto o envase en calles, ríos o espacios naturales.'],
 ['bateria_reciclaje','Medio ambiente','🔋','Desechar batería correctamente','Lleve baterías o equipos electrónicos a un punto de recolección autorizado.']
].map(([codigo,categoria,icono,nombre,descripcion])=>({codigo,categoria,icono,nombre,descripcion}));
function careSvg(code){
 const common='viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
 const wrap=x=>`<svg class="care-symbol" ${common}>${x}</svg>`;
 if(/no_cloro/.test(code))return wrap('<path d="M24 8 8 38h32L24 8Z"/><path d="m10 36 28-24M14 12l24 24"/>');
 if(/lavar_mano/.test(code))return wrap('<path d="M7 18h34l-3 21H10L7 18Z"/><path d="M7 18c5 4 9-4 14 0s9-4 14 0 6 0 6 0"/><path d="m19 24 2-9c.5-2 3-2 3 0v7l2-11c.5-2 3-2 3 0l-1 12 3-9c.6-2 3-1 3 1l-2 11"/>');
 if(/lavar_frio|ciclo_delicado/.test(code))return wrap('<path d="M7 17h34l-3 22H10L7 17Z"/><path d="M7 17c5 4 9-4 14 0s9-4 14 0 6 0 6 0"/><path d="M13 43h22"/>');
 if(/no_secadora/.test(code))return wrap('<rect x="9" y="9" width="30" height="30"/><circle cx="24" cy="24" r="10"/><path d="m8 8 32 32"/>');
 if(/secadora_baja/.test(code))return wrap('<rect x="9" y="9" width="30" height="30"/><circle cx="24" cy="24" r="10"/><circle cx="24" cy="24" r="1.8" fill="currentColor" stroke="none"/>');
 if(/no_planchar/.test(code))return wrap('<path d="M9 32h30l-5-14H18c-5 0-8 4-9 14Z"/><path d="M22 18v-5h9"/><path d="m8 8 32 32"/>');
 if(/plancha_baja/.test(code))return wrap('<path d="M9 32h30l-5-14H18c-5 0-8 4-9 14Z"/><path d="M22 18v-5h9"/><circle cx="25" cy="26" r="1.7" fill="currentColor" stroke="none"/>');
 if(/no_lavado_seco/.test(code))return wrap('<circle cx="24" cy="24" r="15"/><path d="m10 10 28 28"/>');
 if(/reciclar|bateria_reciclaje|basura|ambiente/.test(code))return wrap('<path d="m22 7 5 7-4 2M27 14h7l5 9M39 23l-8 1 1-4M32 35H17l-3-6M14 29l-4 7-4-7M10 29l7-12h7"/>');
 if(/agua|sumergir|seco|polvo|secar/.test(code))return wrap('<path d="M24 6S13 20 13 29a11 11 0 0 0 22 0C35 20 24 6 24 6Z"/><path d="m8 8 32 32"/>');
 if(/calor|fuego|inflamable|sol/.test(code))return wrap('<path d="M26 5c2 8-5 9-2 16 2-4 7-5 8-10 7 8 9 15 5 23-3 6-9 9-15 8-8-1-13-8-11-16 2-7 8-10 15-21Z"/>');
 if(/frio|refriger|congel/.test(code))return wrap('<path d="M24 6v36M8 15l32 18M40 15 8 33M18 9l6 5 6-5M18 39l6-5 6 5"/>');
 if(/ninos/.test(code))return wrap('<circle cx="24" cy="17" r="7"/><path d="M12 40c1-10 6-15 12-15s11 5 12 15"/><path d="m8 8 32 32"/>');
 if(/ingerir|vencimiento|consumir/.test(code))return wrap('<path d="M13 9h22v30H13z"/><path d="M18 15h12M18 22h12M18 29h7"/><path d="M32 31l7 7M39 31l-7 7"/>');
 if(/golpes|fragil|caer|arriba|apilar|perforar/.test(code))return wrap('<path d="M9 14 24 6l15 8v20l-15 8-15-8V14Z"/><path d="m9 14 15 8 15-8M24 22v20"/>');
 if(/interior|exterior|lugar/.test(code))return wrap('<path d="m7 23 17-15 17 15"/><path d="M11 20v20h26V20M20 40V28h8v12"/>');
 if(/leer_manual/.test(code))return wrap('<path d="M7 10c7-2 12 0 17 4v27c-5-4-10-6-17-4V10ZM41 10c-7-2-12 0-17 4v27c5-4 10-6 17-4V10Z"/>');
 if(/peso/.test(code))return wrap('<path d="M10 40h28l-3-24H13l-3 24Z"/><path d="M19 16a5 5 0 0 1 10 0"/>');
 if(/desconectar/.test(code))return wrap('<path d="M18 8v13M30 8v13M14 21h20v5c0 6-4 10-10 10s-10-4-10-10v-5ZM24 36v7"/>');
 return wrap('<path d="M24 5 44 41H4L24 5Z"/><path d="M24 17v12M24 35h.01"/>');
}
let selectedCareCodes=[];
let customCare=[];
let customDetails=[];
let careDraft=[];
let careCategory='Todos';
function careByCode(code){return CARE_CATALOG.find(x=>x.codigo===code)}
function renderSelectedCare(){const box=document.getElementById('selectedCareList');if(!box)return;const rows=selectedCareCodes.map(careByCode).filter(Boolean);box.innerHTML=rows.length?rows.map(x=>`<span class="care-chip"><span class="care-icon">${careSvg(x.codigo)}</span><span>${escHtml(x.nombre)}</span></span>`).join(''):'<span class="empty-care">Aún no has seleccionado cuidados o advertencias.</span>'}
function renderCustomDetails(){const box=document.getElementById('customDetailsList');if(!box)return;box.innerHTML=customDetails.map((d,i)=>`<div class="custom-detail-row"><input data-detail-title="${i}" maxlength="80" placeholder="Título, ej. Material del empaque" value="${escHtml(d.titulo||'')}"><input data-detail-text="${i}" maxlength="500" placeholder="Escribe el detalle del producto" value="${escHtml(d.detalle||'')}"><button type="button" data-remove-detail="${i}" title="Eliminar">×</button></div>`).join('');box.querySelectorAll('[data-detail-title]').forEach(el=>el.oninput=()=>customDetails[Number(el.dataset.detailTitle)].titulo=el.value);box.querySelectorAll('[data-detail-text]').forEach(el=>el.oninput=()=>customDetails[Number(el.dataset.detailText)].detalle=el.value);box.querySelectorAll('[data-remove-detail]').forEach(el=>el.onclick=()=>{customDetails.splice(Number(el.dataset.removeDetail),1);renderCustomDetails()})}
function renderCareCatalog(){const cats=['Todos',...new Set(CARE_CATALOG.map(x=>x.categoria))];const catBox=document.getElementById('careCategories');if(catBox)catBox.innerHTML=cats.map(c=>`<button type="button" class="care-category ${c===careCategory?'on':''}" data-care-cat="${escHtml(c)}">${escHtml(c)}</button>`).join('');catBox?.querySelectorAll('[data-care-cat]').forEach(b=>b.onclick=()=>{careCategory=b.dataset.careCat;renderCareCatalog()});const q=(document.getElementById('careSearch')?.value||'').trim().toLowerCase();const rows=CARE_CATALOG.filter(x=>(careCategory==='Todos'||x.categoria===careCategory)&&(!q||`${x.nombre} ${x.descripcion} ${x.categoria}`.toLowerCase().includes(q)));const grid=document.getElementById('careCatalogGrid');if(grid)grid.innerHTML=rows.map(x=>`<label class="care-option ${careDraft.includes(x.codigo)?'selected':''}"><span class="care-option-icon">${careSvg(x.codigo)}</span><span><strong>${escHtml(x.nombre)}</strong><small>${escHtml(x.descripcion)}</small></span><input type="checkbox" data-care-code="${x.codigo}" ${careDraft.includes(x.codigo)?'checked':''}></label>`).join('');grid?.querySelectorAll('[data-care-code]').forEach(el=>el.onchange=()=>{const code=el.dataset.careCode;if(el.checked&&!careDraft.includes(code))careDraft.push(code);if(!el.checked)careDraft=careDraft.filter(x=>x!==code);renderCareCatalog();updateCareCount()});updateCareCount()}
function updateCareCount(){const el=document.getElementById('careSelectedCount');if(el)el.textContent=`${careDraft.length + customCare.length} seleccionado${careDraft.length + customCare.length===1?'':'s'}`}
function openCareModal(){careDraft=[...selectedCareCodes];careCategory='Todos';const search=document.getElementById('careSearch');if(search)search.value='';document.getElementById('careCatalogModal')?.classList.add('open');document.body.style.overflow='hidden';renderCareCatalog()}
function closeCareModal(){document.getElementById('careCatalogModal')?.classList.remove('open');document.body.style.overflow=''}
document.getElementById('openCareCatalog')?.addEventListener('click',openCareModal);document.querySelectorAll('[data-close-care]').forEach(x=>x.addEventListener('click',closeCareModal));document.getElementById('careSearch')?.addEventListener('input',renderCareCatalog);document.getElementById('applyCareSelection')?.addEventListener('click',()=>{selectedCareCodes=[...careDraft];renderSelectedCare();closeCareModal();publicationDirty=true});document.getElementById('addCustomCare')?.addEventListener('click',()=>{const el=document.getElementById('customCareText');const text=(el?.value||'').trim();if(!text)return;if(!customCare.includes(text))customCare.push(text);if(el)el.value='';renderCustomCare();updateCareCount();publicationDirty=true});
function renderCustomCare(){const box=document.getElementById('customCareList');if(!box)return;box.innerHTML=customCare.map((x,i)=>`<span class="care-chip custom-care-chip"><span class="care-icon">${careSvg('custom')}</span><span>${escHtml(x)}</span><button type="button" data-remove-custom-care="${i}">×</button></span>`).join('');box.querySelectorAll('[data-remove-custom-care]').forEach(b=>b.onclick=()=>{customCare.splice(Number(b.dataset.removeCustomCare),1);renderCustomCare();updateCareCount()})}

document.getElementById('addCustomDetail')?.addEventListener('click',()=>{customDetails.push({titulo:'',detalle:''});renderCustomDetails();publicationDirty=true});
function renderUniversalReview(){document.getElementById('reviewUniversalInfo')?.remove();const cares=selectedCareCodes.map(careByCode).filter(Boolean),customCares=customCare.filter(Boolean),details=customDetails.filter(d=>d.titulo.trim()||d.detalle.trim());if(!cares.length&&!customCares.length&&!details.length)return;const el=document.createElement('div');el.id='reviewUniversalInfo';el.className='review-universal';el.innerHTML=`${cares.length?`<h4>Cuidados y advertencias</h4><div class="review-care-grid">${cares.map(x=>`<div class="review-care-item"><span>${careSvg(x.codigo)}</span><div><strong>${escHtml(x.nombre)}</strong><small>${escHtml(x.descripcion)}</small></div></div>`).join('')}</div>`:''}${customCares.length?`<div class="review-care-grid">${customCares.map(x=>`<div class="review-care-item"><span>${careSvg('custom')}</span><div><strong>Cuidado adicional</strong><small>${escHtml(x)}</small></div></div>`).join('')}</div>`:''}${details.length?`<h4 style="margin-top:${cares.length?'16':'0'}px">Detalles adicionales</h4><div class="review-detail-list">${details.map(d=>`<div class="review-detail-item"><b>${escHtml(d.titulo||'Detalle')}:</b>${escHtml(d.detalle)}</div>`).join('')}</div>`:''}`;document.getElementById('reviewVariants')?.insertAdjacentElement('beforebegin',el)}

function currentProductSnapshot(){
  const variants=cloneVariantsForSession(variantColors);
  const totals=completionTotalsForVariants(variants);
  return {
    nombre:document.getElementById('nombre').value.trim(),
    marca:document.getElementById('marca').value.trim(),
    modelo:document.getElementById('modelo').value.trim(),
    condicion:document.getElementById('condicion').value,
    garantia:document.getElementById('sinGarantia')?.checked?'Sin garantía':`${document.getElementById('garantia').value.trim()} días`,
    garantiaDias:document.getElementById('sinGarantia')?.checked?null:Number(document.getElementById('garantia').value||0),
    sinGarantia:!!document.getElementById('sinGarantia')?.checked,
    descripcion:document.getElementById('descripcion').value.trim(),
    categoryPath:[...selectedCategoryPath],
    categoryAttributes:clonePlain(categoryAttributeValues),
    cuidados:[...selectedCareCodes],
    cuidadosPersonalizados:[...customCare],
    detallesAdicionales:clonePlain(customDetails.filter(d=>d.titulo.trim()||d.detalle.trim())),
    sizeSystem,
    variants,
    totals
  };
}
function resetWizardForNewProduct(){
  editingProductIndex=null;
  ['nombre','marca','modelo','garantia','descripcion'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
  const noWarranty=document.getElementById('sinGarantia');if(noWarranty)noWarranty.checked=false;
  const condition=document.getElementById('condicion');if(condition)condition.value='';
  selectedCategoryPath=[];
  configuredCategoryPath=null;
  categoryAttributeValues={};
  selectedCareCodes=[];customCare=[];customDetails=[];renderSelectedCare();renderCustomCare();renderCustomDetails();
  sizeSystem='US';
  variantColors=[{id:uid(),color:'',audiences:{},files:[],existingImages:[]}];
  invalidateStep2CategoryUI();
  renderCategoryLevels();
  updateInformationFlow();
  renderVariantBuilder();
  const screen=document.getElementById('completionScreen'),card=document.querySelector('main.wrap > .card'),actions=document.getElementById('stickyFormActions');
  screen?.classList.remove('active');card?.classList.remove('hidden');actions?.classList.remove('hidden');
  step=0;show();publicationDirty=sessionProducts.length>0;
  window.scrollTo({top:0,behavior:'smooth'});
}
function restoreProductForEditing(index){
  const item=sessionProducts[index];if(!item)return;
  editingProductIndex=index;
  document.getElementById('nombre').value=item.nombre||'';
  document.getElementById('marca').value=item.marca||'';
  document.getElementById('modelo').value=item.modelo||'';
  document.getElementById('condicion').value=item.condicion||'';
  const noWarranty=document.getElementById('sinGarantia');if(noWarranty)noWarranty.checked=!!item.sinGarantia;
  document.getElementById('garantia').value=item.sinGarantia?'':String(item.garantiaDias ?? (String(item.garantia||'').match(/\d+/)?.[0] || ''));
  document.getElementById('descripcion').value=item.descripcion||'';
  selectedCategoryPath=[...(item.categoryPath||[])];
  configuredCategoryPath=[...(item.categoryPath||[])];
  categoryAttributeValues=clonePlain(item.categoryAttributes||{});
  selectedCareCodes=[...(item.cuidados||[])];customCare=[...(item.cuidadosPersonalizados||[])];customDetails=clonePlain(item.detallesAdicionales||[]);renderSelectedCare();renderCustomCare();renderCustomDetails();
  sizeSystem=item.sizeSystem||'US';
  variantColors=cloneVariantsForSession(item.variants||[]);
  if(!variantColors.length)variantColors=[{id:uid(),color:'',audiences:{},files:[],existingImages:[]}];
  invalidateStep2CategoryUI();
  renderCategoryLevels();updateInformationFlow();renderVariantBuilder();
  const screen=document.getElementById('completionScreen'),card=document.querySelector('main.wrap > .card'),actions=document.getElementById('stickyFormActions');
  screen?.classList.remove('active');card?.classList.remove('hidden');actions?.classList.remove('hidden');
  step=0;show();publicationDirty=true;
  window.scrollTo({top:0,behavior:'smooth'});
  showFlowToast(`Editando: ${item.nombre||'producto'}`);
}
function renderProductSessionList(){
  const list=document.getElementById('productSessionList'),count=document.getElementById('sessionProductCount');if(!list)return;
  if(count)count.textContent=`${sessionProducts.length} producto${sessionProducts.length===1?'':'s'}`;
  if(!sessionProducts.length){list.innerHTML='<div class="product-session-empty">Aún no hay productos agregados en esta sesión.</div>';return;}
  list.innerHTML=sessionProducts.map((item,index)=>{
    const firstVariant=item.variants?.find(v=>variantImageItems(v).length);const first=firstVariant?variantImageItems(firstVariant)[0]:null;
    const img=first?`<img src="${first.src}" alt="${escHtml(item.nombre||'Producto')}">`:'📦';
    const brand=[item.marca,item.modelo].filter(Boolean).join(' · ')||'Sin marca/modelo';
    return `<article class="product-session-item"><div class="product-session-thumb">${img}</div><div class="product-session-main"><h3>${escHtml(item.nombre||'Producto')}</h3><div class="product-session-route">${escHtml((item.categoryPath||[]).join(' → ')||'Sin categoría')}</div><div class="product-session-meta"><span>${escHtml(brand)}</span><span>${item.variants?.length||0} presentación${item.variants?.length===1?'':'es'}</span><span>${escHtml(item.totals?.price||'Sin precio')}</span><span>${Number(item.totals?.totalStock)||0} u.</span></div></div><button type="button" class="product-session-edit" data-edit-product="${index}">Editar</button></article>`;
  }).join('');
  list.querySelectorAll('[data-edit-product]').forEach(btn=>btn.onclick=()=>restoreProductForEditing(Number(btn.dataset.editProduct)));
}
function showCompletionScreen(){
  const snapshot=currentProductSnapshot();
  if(editingProductIndex!==null && sessionProducts[editingProductIndex])sessionProducts[editingProductIndex]=snapshot;
  else sessionProducts.push(snapshot);
  editingProductIndex=null;
  const card=document.querySelector('main.wrap > .card'),actions=document.getElementById('stickyFormActions'),screen=document.getElementById('completionScreen');
  if(card)card.classList.add('hidden');if(actions)actions.classList.add('hidden');if(screen)screen.classList.add('active');
  renderProductSessionList();publicationDirty=true;
  window.scrollTo({top:0,behavior:'smooth'});
}
publish.onclick=()=>{if(databaseEditId){saveDatabaseEdit();return;}showCompletionScreen()};
const addAnotherProduct=document.getElementById('addAnotherProduct');if(addAnotherProduct)addAnotherProduct.onclick=resetWizardForNewProduct;
function showSellerSessionExpiredDialog(message){
  let overlay=document.getElementById('sellerSessionExpiredOverlay');
  if(!overlay){
    overlay=document.createElement('div');
    overlay.id='sellerSessionExpiredOverlay';
    overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.48);display:grid;place-items:center;padding:20px;backdrop-filter:blur(3px)';
    overlay.innerHTML=`
      <div style="width:min(520px,100%);background:#fff;border-radius:20px;border:1px solid #e2e8f0;box-shadow:0 24px 70px rgba(15,23,42,.22);padding:24px;color:#0f172a">
        <div style="width:44px;height:44px;border-radius:14px;background:#fff7ed;color:#ea580c;display:grid;place-items:center;font-size:22px;font-weight:900;margin-bottom:14px">!</div>
        <h3 style="margin:0 0 8px;font-size:20px">Tu sesión de vendedor venció</h3>
        <p id="sellerSessionExpiredText" style="margin:0;color:#64748b;line-height:1.55"></p>
        <div style="margin-top:14px;padding:12px 14px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;font-size:13px;line-height:1.5">
          El producto que acabas de preparar <strong>permanece en esta página</strong>. No cierres ni recargues esta pestaña. Inicia sesión en la pestaña nueva, vuelve aquí y presiona <strong>Finalizar</strong> otra vez.
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;flex-wrap:wrap">
          <button type="button" id="sellerSessionExpiredClose" style="border:1px solid #dbe3ee;background:#fff;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer">Cerrar</button>
          <button type="button" id="sellerSessionExpiredLogin" style="border:0;background:#2563eb;color:#fff;border-radius:10px;padding:10px 16px;font-weight:800;cursor:pointer">Renovar sesión</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#sellerSessionExpiredClose').onclick=()=>overlay.remove();
    overlay.querySelector('#sellerSessionExpiredLogin').onclick=()=>{
      window.open('login-vendedor.html?renovar=1','_blank','noopener');
    };
  }
  const txt=overlay.querySelector('#sellerSessionExpiredText');
  if(txt)txt.textContent=message+' Debes iniciar sesión nuevamente antes de guardar en MySQL.';
}

const finalizeProductSession=document.getElementById('finalizeProductSession');if(finalizeProductSession)finalizeProductSession.onclick=async()=>{
  if(!sessionProducts.length){showFlowToast('Agrega al menos un producto antes de finalizar.');return;}
  const token=localStorage.getItem('token');
  const user=(()=>{try{return JSON.parse(localStorage.getItem('usuario')||'null')}catch{return null}})();
  if(!token||localStorage.getItem('portalSesion')!=='tienda'||String(user?.rol||'').toLowerCase()!=='vendedor'){
    showFlowToast('Tu sesión de vendedor no es válida. Inicia sesión nuevamente.');return;
  }
  const btn=finalizeProductSession,original=btn.textContent;btn.disabled=true;btn.textContent='Guardando productos...';
  try{
    const form=new FormData();
    const plainProducts=sessionProducts.map((item,pi)=>({
      ...item,
      variants:(item.variants||[]).map((v,vi)=>{
        (v.files||[]).forEach(file=>form.append(`image_${pi}_${vi}`,file,file.name||`producto_${pi}_${vi}.jpg`));
        const copy={...v};delete copy.files;return copy;
      })
    }));
    form.append('payload',JSON.stringify({productos:plainProducts}));
    const response=await fetch('http://localhost:3000/api/productos/vendedor/lote',{
      method:'POST',headers:{Authorization:`Bearer ${token}`},body:form
    });
    const data=await response.json().catch(()=>({}));
    if(response.status===401){
      // NO vaciamos sessionProducts ni recargamos la página. Así se conservan incluso
      // los File seleccionados en memoria. El vendedor puede iniciar sesión en otra
      // pestaña y volver a intentar Finalizar con el token renovado de localStorage.
      showSellerSessionExpiredDialog(data.mensaje||'Tu sesión de vendedor expiró.');
      btn.disabled=false;btn.textContent=original;
      return;
    }
    if(!response.ok)throw new Error(data.mensaje||'No se pudieron guardar los productos');
    showFlowToast(data.mensaje||'Productos guardados correctamente');
    sessionProducts=[];
    allowWizardExit=true;allowBrowserExit=true;publicationDirty=false;
    setTimeout(()=>{window.location.href='catalogo-vendedor.html';},650);
  }catch(error){
    console.error(error);showFlowToast(error.message||'No se pudieron guardar los productos');
    btn.disabled=false;btn.textContent=original;
  }
};


async function loadDatabaseEdit(){
  if(!databaseEditId)return;
  const token=localStorage.getItem('token');
  try{
    const response=await fetch(`http://localhost:3000/api/productos/vendedor/${databaseEditId}/editar`,{headers:{Authorization:`Bearer ${token}`}});
    const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.mensaje||'No se pudo cargar el producto');
    const item=data.wizard||{};
    document.getElementById('formPageTitle').textContent='Editar producto';
    document.getElementById('formPageSubtitle').textContent='Modifica el producto con el mismo formulario completo usado para agregarlo.';
    document.getElementById('nombre').value=item.nombre||'';document.getElementById('marca').value=item.marca||'';document.getElementById('modelo').value=item.modelo||'';document.getElementById('condicion').value=item.condicion||'';
    const noWarranty=document.getElementById('sinGarantia');if(noWarranty)noWarranty.checked=!!item.sinGarantia;
    document.getElementById('garantia').value=item.sinGarantia?'':String(item.garantiaDias??'');document.getElementById('descripcion').value=item.descripcion||'';
    selectedCategoryPath=[...(item.categoryPath||[])];configuredCategoryPath=[...(item.categoryPath||[])];
    categoryAttributeValues={};for(const [k,v] of Object.entries(item.categoryAttributes||{}))categoryAttributeValues[selectedCategoryPath.join('|')+'::'+k]=clonePlain(v);
    selectedCareCodes=[...(item.cuidados||[])];customCare=[...(item.cuidadosPersonalizados||[])];customDetails=clonePlain(item.detallesAdicionales||[]);
    sizeSystem=item.sizeSystem||'US';variantColors=cloneVariantsForSession(item.variants||[]);if(!variantColors.length)variantColors=[{id:uid(),color:'',audiences:{},files:[],existingImages:[]}];
    variantColors.forEach(v=>{v.files=v.files||[];v.existingImages=v.existingImages||[];v.id=v.id||uid()});
    invalidateStep2CategoryUI();renderCategoryLevels();updateInformationFlow();renderSelectedCare();renderCustomCare();renderCustomDetails();renderVariantBuilder();
    const p=document.getElementById('publish');if(p)p.textContent='Guardar cambios';
    databaseEditLoaded=true;publicationDirty=false;step=0;show();
  }catch(error){console.error(error);showFlowToast(error.message||'No se pudo cargar el producto');}
}
async function saveDatabaseEdit(){
  if(!databaseEditId||!databaseEditLoaded)return;
  const token=localStorage.getItem('token'),btn=document.getElementById('publish'),original=btn.textContent;btn.disabled=true;btn.textContent='Guardando cambios...';
  try{
    const item=currentProductSnapshot(),form=new FormData();
    item.variants=(item.variants||[]).map((v,vi)=>{(v.files||[]).forEach(file=>form.append(`image_0_${vi}`,file,file.name||`producto_${vi}.jpg`));const copy={...v,existingImages:(v.existingImages||[]).map(x=>({id:x.id,ruta_imagen:x.ruta_imagen}))};delete copy.files;return copy;});
    form.append('payload',JSON.stringify(item));
    const response=await fetch(`http://localhost:3000/api/productos/vendedor/${databaseEditId}/editar`,{method:'PUT',headers:{Authorization:`Bearer ${token}`},body:form});
    const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.mensaje||'No se pudo guardar');
    publicationDirty=false;allowWizardExit=true;allowBrowserExit=true;showFlowToast(data.mensaje||'Producto actualizado correctamente');setTimeout(()=>location.href='catalogo-vendedor.html',700);
  }catch(error){console.error(error);showFlowToast(error.message||'No se pudo actualizar el producto');btn.disabled=false;btn.textContent=original;}
}

// Inicializar la interfaz solo después de declarar los perfiles de tallaje.
// Evita el error TDZ: Cannot access 'SIZE_PROFILES' before initialization.
renderCategoryLevels();
updateInformationFlow();
renderVariantBuilder();
renderSelectedCare();renderCustomCare();renderCustomDetails();
show();
if(databaseEditId)loadDatabaseEdit();
