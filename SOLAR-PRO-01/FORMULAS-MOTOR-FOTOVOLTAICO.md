# Etapa 1 revisada — energía, eficiencias y validación

## Rendimiento del generador FV (PR)

`Wp requerido = (consumo diario AC × 1000) / (HSP × PR)`.

PR representa el rendimiento global del generador fotovoltaico y sus pérdidas de producción. No es la eficiencia del inversor ni la de la batería.

## Batería e inversor

Se mantienen magnitudes separadas, todas editables en porcentaje y con rango válido `> 0 y ≤ 100`:

- **Eficiencia DC→AC del inversor**: conversión entre el bus/batería DC y la salida AC.
- **Eficiencia de descarga de batería**: pérdidas de energía internas de la batería en descarga.
- **Profundidad de descarga (DoD)**: fracción de capacidad nominal utilizable.
- **Eficiencia del trayecto FV/controlador al banco**: pérdidas de conversión del controlador en la estimación de corriente de carga; reemplaza el factor fijo 0,95. El 95 % inicial es un supuesto editable cuando no se dispone del dato del fabricante, no una constante universal.

Fórmulas:

- `kWh nominales = (kWh AC/día × días de autonomía) / (DoD × eficiencia de descarga de batería × eficiencia DC→AC del inversor)`.
- `Ah requeridos = kWh nominales × 1000 / V nominal del banco`.
- `I batería a potencia AC nominal = P inversor / (V banco × eficiencia DC→AC del inversor)`.
- `I carga FV estimada = Wp instalados × eficiencia del trayecto FV/controlador / V nominal del banco`.

Valores vacíos, no numéricos, cero, negativos o superiores a 100 % se rechazan para los cálculos afectados (resultado no calculable y comprobación de compatibilidad con error); no se sustituyen por mínimos artificiales. Los campos HTML también declaran límites, pero la validación del motor es la autoridad.

El cálculo de corriente de carga estima corriente eléctrica en terminales; por ello usa pérdidas del trayecto de conversión, no eficiencia electroquímica de carga de batería. La eficiencia de descarga sí se incluye en la energía nominal necesaria. Esta etapa no incorpora eficiencia electroquímica de carga en el balance de energía diario del generador; para calcularla se requiere una futura ampliación del modelo con una fracción explícita de energía que atraviesa la batería.

Los resultados siguen siendo predimensionamientos. No incluyen tasa C, temperatura, envejecimiento, eficiencia de ciclo, simultaneidad de cargas ni picos de arranque.

## Compatibilidad de proyectos guardados

Los datos locales y los proyectos abiertos desde la nube se combinan con los valores iniciales antes de usarse. En proyectos antiguos que no contienen campos eléctricos de fabricante, estos quedan vacíos y las comprobaciones aparecen pendientes; los campos guardados existentes conservan prioridad. No se introduce un rendimiento genérico como si fuera dato de ficha.

## Cantidad de módulos y strings

- `consumo diario = consumo mensual / 30`.
- `Wp requeridos = consumo diario × 1000 / (HSP × PR/100)`.
- `cantidad automática = techo(Wp requeridos / Wp del módulo)`.
- Con ajuste manual activado, la cantidad seleccionada es el entero positivo guardado en `manualPanelCount`; no se vuelve a derivar al cambiar de pantalla o recalcular. Potencia instalada y cantidades del presupuesto/BOM, resumen, informe y diagrama usan esa misma cantidad.
- `cantidad de strings = módulos seleccionados / módulos en serie por string`. Solo se acepta un cociente entero: ningún módulo queda fuera ni se crea un string de longitud distinta.
- Los strings completos se reparten de forma equilibrada entre los MPPT configurados. Se compara la capacidad de strings por MPPT, la cantidad física de entradas y la suma de Imp/Isc en el MPPT más cargado. La comprobación por entrada supone un string por entrada; cualquier paralelización externa requiere un esquema de fabricante y no se admite implícitamente.
- Para tensión: `Voc fría = módulos/string × Voc STC × [1 + βVoc × (T mínima − 25 °C)]`; `Vmp fría/caliente = módulos/string × Vmp STC × [1 + βVmp × (T célula − 25 °C)]`. Se compara Voc fría con el máximo DC absoluto; se comprueba Vmp caliente/fría contra el rango MPPT. El chequeo de arranque usa Voc a la temperatura máxima de célula contra el umbral ingresado y debe confirmarse con la definición de arranque de la ficha del inversor.
- Por entrada física se evalúa un string: corriente de operación Imp y cortocircuito Isc. Por MPPT se suman las corrientes de todos sus strings. Se requieren límites máximos de ficha separados por entrada y MPPT.

No se fija una relación potencia FV/AC para elegir inversor. La potencia continua se compara con la demanda AC simultánea ingresada y la sobrecarga con potencia/duración de arranque ingresadas. La energía mensual no permite inferir demanda simultánea ni arranque; se deben medir o tomar de las cargas.

Cuando falte βVoc/βVmp, temperaturas de diseño o límites de tensión/corriente/entrada del inversor, la validación queda como pendiente. Un límite conocido que se excede o una distribución con módulos sobrantes marca la configuración como incompatible. Los datos preexistentes guardados en proyectos se conservan; el usuario debe contrastar límites históricos con la ficha técnica antes de aprobar el diseño.

## Etapa: conductores, protecciones y puesta a tierra (predimensionamiento)

Los tramos se calculan independientemente: cada string FV, colector DC por MPPT, batería–inversor, salida AC inversor–tablero, tablero–punto de conexión, PE y unión equipotencial. No se usa la sección del colector para representar el cable de string. Longitudes vacías no se sustituyen por distancias supuestas. BOM usa recorridos separados y filtra el cable de batería (solo OFF-GRID/HÍBRIDO) y punto de red (solo ON-GRID/HÍBRIDO).

### Caída resistiva y ampacidad

- Resistividad estimada por temperatura: `ρ(T)=ρ20[1+α(T−20 °C)]`, con ρ20 aproximada 0,0175 Ω·mm²/m y α=0,00393/°C para cobre; ρ20 aproximada 0,0282 Ω·mm²/m y α=0,00403/°C para aluminio. Son parámetros físicos de referencia y no datos de cable comercial.
- CC y AC monofásica: `S=2ρ(T)LI·F/ΔV`; para CC `F=1`, y para AC se usa el factor de potencia informado (`F=FP`). AC trifásica: `S=√3ρ(T)LI·FP/ΔV`. Son aproximaciones resistivas: no incorporan reactancia, armónicos, desequilibrio ni impedancias de conexiones. La sección comercial es el siguiente valor de la tabla interna que no sea menor que S, y se etiqueta candidata por caída.
- Caída indicada: `ΔV=V×porcentaje admisible/100`. Los recorridos son de ida y la fórmula incluye ida y retorno en los factores 2 (o √3 para el modelo trifásico). La caída informada se recalcula sobre la sección comercial candidata; el área calculada sin redondear fija el límite solicitado.
- Ampacidad corregida: `I_z=I_tabla×F_temperatura×F_agrupamiento`. Solo se calcula cuando se declara método de instalación y se ingresa ampacidad de referencia correspondiente a esa sección, método y factores válidos (0<F≤1). Como aislamiento, número de conductores cargados y tablas aplicables requieren detalle normativo/ficha, el resultado no declara cumplimiento cuando esos datos faltan. Si la ampacidad ingresada no alcanza la corriente de diseño, el tramo se marca NO CUMPLE y se agrega advertencia al proyecto.
- Corriente inicial de strings/colector y corriente AC usan 1,25 como hipótesis preliminar marcada en pantalla, no como certificación normativa. Confirmar el factor y las reglas de ampacidad/protección con RETIE vigente, NTC 2050 aplicable y el esquema real.

### Cortocircuito, protecciones y tierra

- PE ante falla: `S=Icc×√t/k`, solo si se ingresan corriente de falla, tiempo total de despeje y factor k correspondiente al material/aislamiento/temperaturas. Es un control adiabático preliminar, no reemplaza mínimos ni verificaciones exigidos por norma.
- La protección se deja pendiente si faltan corriente de falla, capacidad interruptiva del equipo, tensión/categoría DC o AC, coordinación con ampacidad del conductor, polos y esquema de puesta a tierra. El calibre nominal candidato por sí solo no es recomendación final.
- Fusible gPV por string se muestra cuando hay strings paralelos; su selección queda condicionada a Isc, corriente inversa posible, fusible máximo serie del módulo, conductor, tensión Voc fría y ficha del portafusible. Con un solo string no se instala automáticamente solo por existir el string.
- DPS DC/AC: Ucpv/Uc, Up, tipo y coordinación no se inventan. Dependen de tensión de diseño, riesgo de rayo, protección externa, esquema de tierra y fichas. Interruptores/seccionadores, poder de corte, número de polos, barraje y punto de conexión quedan por validar con fabricante y operador de red.
- El conductor de unión equipotencial y PE se consignan como funciones separadas; el sistema de electrodos no se calcula sin resistividad de suelo, configuración, objetivo de diseño y medición. No se fija un valor universal de resistencia de tierra.
- Los renglones por arquitectura excluyen batería en ON-GRID convencional y el tramo a red en OFF-GRID. Las funciones FV DC permanecen según configuración del generador; confirmar requerimientos de desconexión/protección de la topología real.

### Alcance regulatorio

La página oficial del Ministerio de Minas y Energía identifica el RETIE vigente como Resolución 40284 de 23 de junio de 2026 ([RETIE oficial](https://www.minenergia.gov.co/es/misional/energia-electrica-2/reglamentos-tecnicos/reglamento-t%C3%A9cnico-de-instalaciones-el%C3%A9ctricas-retie/)). La aplicación indica prediseño y no declara conformidad: cada criterio obligatorio, remisión normativa, edición de NTC, condiciones del operador de red y ficha deben verificarse por profesional competente contra el texto consolidado vigente. Donde eso no pueda concluirse con la información disponible se muestra **VALIDACIÓN PENDIENTE**.

## Corrección crítica de conductores y protecciones (RETIE 2026)

Este apartado reemplaza cualquier criterio previo incompatible en la sección de predimensionamiento de conductores/protecciones. Son resultados preliminares y no certifican una instalación.

### Corriente de diseño AC

- Se usa una sola corriente AC para conductor, interruptor y presentación: `Iac = Imax,continua` de ficha cuando se proporciona. Si falta, el sistema estima `Pnom / (V × FP)` en monofásico o `Pnom / (√3 × V × FP)` en trifásico y muestra **VALIDACIÓN PENDIENTE** para confirmar la máxima continua, modo de operación, tensión y FP de placa/ficha.
- No se aplica automáticamente `1,25 × Iac`: la Resolución 40284, artículo 3.17.21(d), exige cumplir ampacidad y caída, pero no fundamenta un multiplicador universal para todo conductor AC de salida. La corriente de string y colector FV conserva `1,25 × Isc` como hipótesis preliminar heredada, no como declaración de cumplimiento; debe cotejarse con la aplicación pertinente de NTC 2050 690.8 y datos del circuito.
- Ampacidad corregida presentada: `Iz = Ibase × Ftemperatura × Fagrupamiento`, solo con valores de tabla/ficha del conductor correspondientes a sección, método, aislamiento y conductores cargados.

### Caída individual y acumulada AC

- Caída por tramo y sección preliminar conservan el modelo resistivo: monofásico `ΔV = 2ρ(T)LI·FP/S`; trifásico equilibrado `ΔV = √3ρ(T)LI·FP/S`. L es el recorrido de ida. No se modela reactancia, armónicos ni desequilibrio.
- Para ON-GRID e HÍBRIDO se suman las caídas de salida inversor–tablero y tablero–punto de conexión: `ΔVacumulada = Σ ΔVtramo`; porcentaje `100 × ΔVacumulada / Vac nominal`. Cada caída individual se muestra por separado. No se asigna a cada tramo el límite completo.
- El límite acumulado se fija en 3 % conforme RETIE Resolución 40284 de 2026, Libro 3, artículo 3.17.21(d), que mide entre dos puntos cualesquiera desde salida del inversor al punto de conexión e incorpora el criterio de ampacidad; remite a NTC 2050 segunda actualización, 705-12(A),(B). El cálculo resistivo de la aplicación no reemplaza el método completo de norma ni la revisión de todos los puntos/conexiones.

### Corriente inversa y fusible gPV

- Para cada MPPT se usa el número de strings paralelos de `mpptDistribution`, no el total del campo: estimación de retroalimentación desde las otras ramas `Irev = max(0, Nparalelo,MPPT − 1) × Isc,módulo`.
- Es una aproximación para ramas equivalentes; la corriente de falla real depende de topología, irradiancia, diodos, electrónica del inversor y otras fuentes. RETIE 3.17.23(m) exige que la corriente inversa no exceda la soportabilidad del módulo; si la excede, requiere limitarla con diodo de bloqueo u OCPD. Se necesitan corriente inversa máxima y máximo fusible serie de la ficha exacta del módulo.
- No se toma un rating de breaker AC como fusible ni se calcula un calibre automáticamente con una regla no verificada. El diseñador ingresa los ratings y el calibre elegido desde la ficha del fusible gPV específico. Se contrasta que el rating elegido esté entre los ratings de ficha y no exceda el máximo fusible serie del módulo ni la ampacidad corregida del conductor. Si la corriente inversa estimada supera la soportabilidad del módulo, se informa la necesidad de limitarla, pero el fusible no se declara coordinado sin tensión DC, corriente de falla, capacidad interruptiva y curva/tiempo de fusión de ficha. Si faltan datos, estado VALIDACIÓN PENDIENTE.

### Coordinación del interruptor AC

- La revisión comprueba `Idiseño ≤ In ≤ Iz corregida`, además de `Icu/Icn ≥ Icc`, tensión nominal/empleo y número de polos contra el esquema. Curva/característica también debe informarse y cotejarse con fabricante/coordinación.
- Sin calibre nominal instalado, ampacidad, Icc, poder de corte, tensión, polos o característica de disparo, estado **VALIDACIÓN PENDIENTE**. Si `In > Iz` o el interruptor no alcanza corriente de diseño, **NO CUMPLE**; no se declara coordinado. Se necesita ficha del interruptor y corriente de cortocircuito disponible en el punto.

### PE fotovoltaico: tabla y adiabático separados

- RETIE 2026, Libro 3, 3.17.21(h), exige conductor de puesta a tierra de equipos FV de cobre, dimensionado según NTC 2050 segunda actualización, 690.45. El criterio de baja tensión de RETIE 3.12.2.3(a) remite a Tabla 250-122. La aplicación ya no selecciona PE automáticamente por aluminio ni usa el valor adiabático como sustituto de la selección tabular: el tamaño debe provenir de la tabla según OCPD, validado por profesional y aplicación normativa.
- Control adiabático independiente: `S = Icc × √t / k`, con Icc RMS en A, t en s y k con unidades compatibles (`A·√s/mm²`). Solo calcula área si se declaran conductor de cobre, aislamiento, temperatura inicial, temperatura final mayor que la inicial y fuente trazable del k. k depende de material, aislamiento y límites térmicos; sin trazabilidad el estado queda pendiente. Debe revisarse que Icc, despeje, rango de aplicación y unidades concuerden con la ecuación adoptada. La sección comercial adiabática es solo comparación matemática y no determina PE por RETIE/NTC.
- La unión equipotencial, el conductor al electrodo y el sistema de puesta a tierra requieren verificaciones propias; este parche no afirma conformidad de esos elementos.

### Referencias y límites

- Resolución 40284 del 23 de junio de 2026, Libro 3, artículos 3.12.2.3(a), 3.17.21(d),(h), 3.17.23(m). Texto oficial: https://minenergia.gov.co/documents/15921/Libro-3-Resolucion-40284-23-06-2026.pdf
- Página oficial de RETIE vigente y documentos: https://www.minenergia.gov.co/es/misional/energia-electrica-2/reglamentos-tecnicos/reglamento-t%C3%A9cnico-de-instalaciones-el%C3%A9ctricas-retie/
- Referencias NTC 2050 segunda actualización 705-12(A),(B), 690.45 y Tabla 250-122 según remisión del RETIE. La aplicación no reproduce tablas normativas ni datos de fabricante que no se han suministrado. Sigue pendiente la validación de normas técnicas, fichas, esquema real, características de instalación y revisión por profesional competente. Ningún resultado equivale a certificación RETIE.
## Integracion de circuitos, BOM, diagrama e informe

### Circuito colector individual por MPPT

- El modelo mantiene un registro por recorrido con identificador `MPPT-n-COLECTOR`, strings asignados, corriente de diseno, longitud propia, material, seccion candidata, ampacidad corregida, caida individual y estado. No se reutiliza el MPPT mas cargado para los demas.
- Por MPPT: `I diseno = N strings del MPPT x Isc del modulo x 1.25`. El factor 1.25 conserva la hipotesis preliminar anterior para circuitos FV; se debe validar su aplicacion con RETIE/NTC y ficha tecnica.
- La corriente total del generador se presenta aparte como `I total = N strings total x Imp`; no se asigna a un conductor colector. La seccion de cada MPPT usa su propia corriente y longitud en `S = 2 rho(T) L I / DeltaV`.
- Cable positivo y negativo se cuantifican como `longitud por conductor x 2`. Cada MPPT genera un renglon de BOM cuando hay recorrido y strings. Longitud vacia no crea una cantidad.
- `mpptCircuits` guarda recorrido y ampacidad por MPPT. Proyectos anteriores siguen cargando: `dcDistance` se usa como ruta heredada compartida mientras el usuario no ingrese rutas individuales, con estado por confirmar y sin sobrescribir datos existentes.

### Modelo comun de circuitos y cantidades

- `buildElectricalCircuitModel()` normaliza strings FV, cada colector MPPT, salida AC inversor-tablero, tramo tablero-red cuando aplica, bateria-inversor cuando aplica, PE, puesta a tierra y equipotencialidad. ON-GRID excluye bateria; OFF-GRID excluye el tramo a red; HIBRIDO conserva ambos.
- El BOM deriva sus cables del modelo: `cantidad (m) = longitud real por conductor x cantidad de conductores`. Las rutas y secciones se mantienen separadas. Sin longitud no se inventa cantidad; sin tabla/ficha la seccion o ampacidad queda pendiente.
- Presupuesto utiliza directamente las cantidades del BOM. Los renglones y notas llevan el identificador de circuito y su seccion.
- El lote de puesta a tierra/equipotencialidad solo se agrega cuando se confirma un kit adicional; la descripcion excluye los conductores individuales. Asi se evitan duplicados.
- Las protecciones integradas o no verificadas no se cuantifican automaticamente como dispositivos externos. Solo se agrega una proteccion cuando se declara expresamente requerida externamente. `Integrado` evita duplicarla y `Por verificar` deja advertencia y requiere ficha; el campo no certifica la existencia o las caracteristicas del equipo.
- Controlador MPPT externo se incluye solo si se selecciona expresamente y la arquitectura no es ON-GRID.
- Diagrama e informe leen los mismos circuitos e identificadores que el BOM. La corriente agregada del generador tiene fila separada sin seccion de conductor.
- `calc.total` se identifica como estimacion simplificada y no equivale al total comercial del BOM. El presupuesto se calcula desde cantidades BOM, precios elegidos y adicionales ingresados.

La integracion proporciona coherencia y trazabilidad de cantidades. No confirma compatibilidad electrica, coordinacion de protecciones, datos de fabricante ni cumplimiento RETIE; se requiere validar rutas, fichas, tablas y diseno por profesional competente.

## Etapa de validacion integral de datos y resultados

### Estados comunes

El motor usa cuatro estados de flujo: `VALIDO`, `NO CUMPLE`, `VALIDACION PENDIENTE` e `INVALIDO`. Se resuelven en este orden de prioridad: dato invalido; incumplimiento comprobado; verificacion/ficha faltante; valido para los criterios implementados. Un estado valido se limita a la comprobacion de software indicada y no significa diseno certificado ni conformidad RETIE.

La interfaz valida el estado activo y presenta los errores numericos devueltos por el motor. La misma validacion corre sobre datos recibidos al cargar un proyecto local o desde Supabase; no borra ni reescribe propiedades antiguas. Campos vacios que son opcionales para proyectos viejos quedan pendientes. Al activar una opcion que exige un valor (por ejemplo cantidad manual), el valor ausente o invalido se rechaza.

### Validacion numerica

- Cada campo numerico de ingenieria se valida por finitud antes de usarse: `Number.isFinite(valor)`. `NaN`, `Infinity`, `-Infinity`, negativos no permitidos, cero en magnitudes que requieren valor positivo, porcentajes fuera de rango y cantidades no enteras generan `INVALIDO` y mensaje asociado al campo.
- Se aceptan valores negativos solo en variables que fisicamente pueden ser negativas, como temperatura ambiente/minima y coeficientes termicos con signo. Se comprueba ademas que la temperatura maxima de celula no sea menor que la minima.
- Consumo puede ser cero; HSP, tensiones nominales, corrientes de diseno, recorridos ingresados, potencia de modulo/inversor y eficiencias requeridas deben ser positivos. Factor de potencia esta en `(0,1]`; eficiencias/DoD en `(0,100]`; factores de correccion de ampacidad en `(0,1]`; porcentajes de caida/impuestos se restringen a `[0,100]` cuando se ingresan.
- No se corrigen silenciosamente valores no finitos a cero. El helper numerico conserva `NaN` como invalido para que el calculo afectado no produzca un resultado calculable.

### Ampacidad y seccion

La correccion de ampacidad sigue `Iz = Ibase x Ftemperatura x Fagrupamiento`, pero ahora solo se calcula si el registro incluye y verifica:

1. ampacidad de referencia positiva y fuente identificable (tabla/ficha);
2. coincidencia exacta entre seccion comercial de referencia y seccion candidata calculada por caida;
3. coincidencia exacta de material;
4. tipo de aislamiento, temperatura nominal, metodo de instalacion y numero entero de conductores cargados;
5. temperatura ambiente y factores de correccion finitos en `(0,1]`.

Si la seccion o material no coincide, no se aplica esa ampacidad y la comprobacion queda `VALIDACION PENDIENTE`. Si la ampacidad corregida de la seccion exacta no alcanza la corriente de diseno, queda `NO CUMPLE`. La aplicacion distingue area calculada, seccion candidata por caida, seccion asociada a ampacidad, seccion por proteccion y seleccion final. La seccion por proteccion y seleccion final quedan pendientes mientras no exista criterio/ficha suficiente; elegir un calibre comercial no cambia automaticamente el estado a valido.

El motor no incorpora tablas de ampacidad normativas. La fuente, configuracion de conductores, correcciones y coordinacion deben ser aportadas desde la tabla aplicable o ficha exacta. Los resultados automaticos son preliminares.

### Catalogo comercial

La coincidencia de familia/arquitectura que ofrece `catalogSystemFit()` solo filtra referencias potencialmente pertinentes. El distintivo muestra compatibilidad electrica pendiente. `evaluateProductCompatibility()` solo puede devolver `VALIDO` si el producto cuenta con campos estructurados que cubren todos los requisitos de proyecto, pasan las comparaciones y aportan certificaciones declaradas para contraste. Fichas ausentes quedan pendientes; limites que fallan devuelven `NO CUMPLE`. Las referencias existentes no reciben valores ni certificaciones inferidos desde su descripcion o fotografia.

### Presupuesto y costos

- Las cantidades de productos/cables siguen proviniendo del BOM. Una referencia comercial o precio manual se aplica a la cantidad de esa partida; no altera su cantidad de diseno.
- Las partidas sin precio conservan estado pendiente y no se presentan como materiales gratuitos. El presupuesto muestra subtotal conocido y marca el total como incompleto mientras exista cualquier partida sin precio.
- El impuesto adicional porcentual se calcula sobre los materiales con precio conocido mas transporte, mano de obra y otros costos ingresados: `impuesto = base conocida x tasa adicional / 100`. La tasa debe ser finita y estar entre 0 y 100 %. El usuario debe evitar volver a aplicar como impuesto adicional un impuesto que el proveedor ya incluyo en el precio.
- Valores de precio/cantidad/impuesto negativos, no finitos o fuera de rango dan estado `INVALIDO`. El subtotal conocido no debe interpretarse como costo total si faltan referencias o precios.

### Alcance de la validacion

ON-GRID excluye bateria; OFF-GRID excluye el tramo AC de conexion a red; HIBRIDO contempla ambos. Los nueve modulos, la autenticacion, roles, credenciales y configuracion de Supabase se preservan. La compatibilidad de proyectos se implementa mediante defaults no destructivos; las propiedades desconocidas guardadas permanecen intactas.

Las pruebas automatizadas verifican reglas de programa, normalizacion de datos y formulas implementadas. No sustituyen inspeccion de sitio, fichas tecnicas, tablas normativas, calculo de cortocircuito, coordinacion/proteccion, revision del operador de red ni validacion de profesional competente. Un estado `VALIDO` indica solamente que los datos aportados superaron los chequeos de software asociados; no certifica instalacion ni cumplimiento RETIE.

### Fichas e integracion de controladores MPPT (Etapa 4)

#### Inventario comercial revisado

La categoria `Controladores MPPT` contiene nueve registros: el MUST PC18-8025F de 80 A; la referencia comercial `PC1800F MPPT 100 A`, que no identifica si es PC18-10015F, PC18-10025F ni variante exacta; tres conceptos genericos MPPT (12/24 V, 48 V y alta tension); un concepto generico PWM; y tres accesorios (pantalla remota, sensor de temperatura de bateria y cable de comunicacion). Solo el PC18-8025F tiene coincidencia exacta de ID, fabricante y modelo contra una ficha oficial. La referencia 100 A no recibe automaticamente una ficha PC18-10025F. Los accesorios se mantienen como accesorios; un inversor hibrido o su MPPT integrado no se convierte en un controlador externo.

#### Fuente oficial y datos estructurados

Ficha: [MUST PC1800F Series (60/80/100 A), pagina de especificaciones del fabricante](https://www.mustsolar.com/product/pc1800f-series-60-80-100a/), consultada el 2026-11-10. La tabla identifica PC18-8025F como variante 80 A; la fuente es una pagina de especificaciones del fabricante y no un manual. El campo de manual oficial separado queda `null` porque no se verifico un enlace de manual del fabricante para esta referencia. Tambien se encontro un PDF en el dominio oficial [MUST PC1800F-145V](https://www.mustsolar.cn/wp-content/uploads/2015/03/PC-PC1800F-145V.pdf), cuya tabla enumera los mismos codigos PC18-6025F/8025F/10025F pero da 145 V maximos y MPPT hasta 130 V para 24/36/48 V. Esto contradice la pagina actual `mustsolar.com`, que da 245 V maximos y MPPT hasta 230 V para esos bancos. La ficha se deja incompleta y la aplicacion compara frente a ambas publicaciones: solo muestra `CUMPLE` o `NO CUMPLE` si las dos llevan al mismo resultado; si difieren, conserva `VALIDACION PENDIENTE` hasta confirmar revision y placa del equipo.

Datos transcritos con unidades y procedencia por campo: tecnologia MPPT; bancos nominales 12/24/36/48 V (36 V configurado); para dichos bancos, maxima tension FV 100/245/245/245 V; ventanas MPPT 15-95/30-230/45-230/60-230 V; potencia FV maxima 1250/2500/3750/5000 W; corriente maxima de carga 80 A continua a 40 °C ambiente; eficiencia de conversion maxima 98% y eficiencia MPPT 99%; carga de baterias lithium-ion, gel y plomo-acido; carga configurable y etapas publicadas; sensor de temperatura BTS; interfaces RS485 y USB; carga en paralelo; protecciones FV/cortocircuito, polaridad inversa FV/bateria, sobrecarga, cortocircuito de salida, desconexion/reconexion por alta tension y alta temperatura; IP20, ventilacion forzada, operacion -10 a 55 °C y altitud hasta 3000 m.

Quedan `null`: corriente maxima PV de operacion, Isc maxima PV, limite de corriente por entrada, cantidad de conectores/entradas, tension de arranque, tension nominal de operacion FV, potencia maxima de carga hacia bateria, intervalo configurable de corriente de carga, numero maximo de controladores en paralelo, protocolo BMS de litio, modelos de inversor compatibles y proteccion de sobrecorriente cuando la pagina no la define como tal. La fuente informa paralelo, pero no una cantidad maxima, por eso no se extrapola un limite.

#### Comprobaciones del motor y supuestos

La evaluacion del controlador seleccionado se aplica solo si `controllerMode` es externo y la arquitectura no es ON-GRID. Se cotejan estados independientes, incluyendo:

- `Voc_string(fria) = N_serie x Voc_STC x [1 + betaVoc x (Tmin - 25 °C)]`, comparada con el maximo FV del controlador asociado al banco nominal seleccionado. El maximo global de 245 V no reemplaza el limite de 100 V cuando el banco es 12 V. Para los bancos afectados por la discrepancia oficial de 145/245 V, si una cifra cumple y la otra no, el resultado queda `VALIDACION PENDIENTE`.
- `Vmp_string(T) = N_serie x Vmp_STC x [1 + betaVmp x (T - 25 °C)]`, con ambos extremos comparados frente a la ventana MPPT correspondiente al banco. Si falta `betaVmp` de la ficha exacta del modulo o una temperatura de diseno, el chequeo queda `VALIDACION PENDIENTE`. Para los bancos afectados por la discrepancia oficial de ventanas 30-130/30-230, 45-130/45-230 y 60-130/60-230 V, una conclusion distinta entre publicaciones tambien queda pendiente.
- `P_FV = N_modulos x Pmax_modulo`, comparada con el limite de potencia por tension de banco publicado para PC18-8025F.
- Corriente FV de operacion estimada a partir de la suma de `Imp` por strings para un controlador externo; se mantiene pendiente frente al limite de entrada porque MUST no publica aqui el maximo PV de operacion.
- La verificacion de Isc requiere corriente corregida/datos de diseño y el limite Isc del controlador. Ambos faltan para esta referencia y el Isc del panel no se sustituye silenciosamente por su Isc STC: queda `VALIDACION PENDIENTE`.
- La estimacion existente de carga FV se mantiene `I_carga ~= P_FV x eta_trayecto / V_banco`; se compara con 80 A solo cuando la eficiencia del trayecto esta ingresada validamente. La potencia maxima de carga no publicada queda pendiente.
- Tension nominal del banco se coteja contra 12/24/36/48 V. La compatibilidad declarada con litio no prueba compatibilidad con BMS: mientras MUST no especifique protocolo/modelo compatible, BMS queda pendiente. Para un inversor seleccionado, la compatibilidad especifica controlador-inversor tambien queda pendiente si no hay una lista del fabricante.

Las comprobaciones generan `CUMPLE`, `NO CUMPLE`, `VALIDACION PENDIENTE` o `INVALIDO` por requisito; el estado general se resuelve por el caso mas restrictivo. La ficha continua incompleta aunque varios resultados individuales cumplan. Cuando se elige MPPT integrado en el inversor, no se agrega un segundo controlador ni se duplica BOM/protecciones; las entradas MPPT se cotejan en la ficha del inversor. La ficha de MUST declara bateria de ion-litio, pero no identifica protocolo BMS, de modo que no se afirma compatibilidad BMS.

### Fichas e integracion de inversores (Etapa 3)

Las referencias comerciales se asocian a fichas tecnicas unicamente si coinciden fabricante y modelo exactos. La fuente oficial queda registrada en cada campo poblado (fabricante, URL, documento, pagina cuando se identifico, variante exacta y fecha de revision). Los datos ausentes se mantienen `null`; una serie con varias tensiones/corrientes se almacena como rango/alternativas o por MPPT, nunca se aplana a un escalar que pueda ser aplicado a todas las entradas.

Fuentes revisadas el 2026-11-10:

| Referencia exacta | Fuente de fabricante | Datos relevantes transcritos | Limites mantenidos pendientes |
|---|---|---|---|
| Deye SUN-6K-SG01LP1-US | [Datasheet Deye SUN-5/6/7.6/8K-SG01LP1-US](https://www.deyeinverter.com/deyeinverter/2026/04/25/BDatasheetSUN-5-8K-SG01LP1-US20260424en.pdf), pp. 1-2 | 6 kW AC, 6.6 kVA, 7.8 kW FV max, Voc max 500 V, MPPT 150-425 V, startup 125 V, 2 MPPT y strings 2+1, corrientes de operacion por MPPT 26+13 A, Isc admisible 44+22 A, salida 27.5 A max, bateria 40-60 V y 135 A carga/descarga, eficiencia max 97.6% y Euro 96.5%, pico aislado 2x/10 s, tipo II DC/AC y protecciones integradas listadas por fabricante. | Tension nominal exacta dependiente de configuracion (la tabla publica 120/240 y 208 V); maximo de strings por entrada fisica no se reduce a un valor; salida de cortocircuito; protocolo/BMS admitidos por referencia; temperatura, altitud, enfriamiento y otros datos no ubicados en esa ficha. |
| Deye SUN-50K-G04P3-EU-AM4-LV | [Manual oficial Deye SUN-33-50K-G04P3-EU-AM4-LV](https://www.deyeinverter.com/deyeinverter/2026/02/27/%E3%80%90B%E3%80%91Manual_SUN-33-50K-G04P3-EU-AM4-LV_20260227_en.pdf), seccion de especificaciones (p. 61 del documento) | 50 kW AC, 50 kVA, maximo FV 75 kW, max DC 800 V, MPPT 200-700 V, arranque 250 V, 4 MPPT, hasta 4 strings/MPPT, corrientes 40 A y Isc 60 A por MPPT, salida 127/220 o 133/230 V, 50/60 Hz, FP 0.8 adelantado-atrasado, eficiencia max 98.7%, europea 98.1%, operacion -25 a 60 °C, altitud hasta 4000 m, SPD tipo II DC/AC y protecciones integradas listadas. El número de strings por MPPT no se toma como número de conectores físicos: ese límite queda pendiente en el campo correspondiente del proyecto. | Corriente AC maxima se publica para dos alternativas de tension y queda como texto con alternativas (131.3 A a 127/220 V y 125.4 A a 133/230 V), no como escalar. Salida de cortocircuito, sobrecarga y duracion, bateria/BMS no aplicable al equipo de string y capacidad de refrigeracion detallada. |

Los valores de la tabla describen lo publicado para el modelo exacto o la columna exacta de una familia que incluye esa variante. No constituyen validacion de compatibilidad, certificacion del producto en Colombia ni cumplimiento RETIE. Las fichas completas del fabricante pueden incluir especificaciones adicionales; se deben agregar a nivel de campo con evidencia antes de evaluar esos limites.

Al seleccionar un modelo del catalogo, SOLAR PRO guarda su ID estable en el proyecto y carga solo campos escalares publicados que el modelo de datos puede representar sin ambiguedad. La potencia FV, Voc, MPPT, corrientes cuando son uniformes, arquitectura, eficiencia ponderada y campos compatibles alimentan los limites preexistentes del motor. Ademas, cuando la ficha publica corrientes por MPPT, se comparan por separado: `Imp_MPPT,j = strings_MPPT,j x Imp_modulo` e `Isc_MPPT,j = strings_MPPT,j x Isc_modulo`; cada resultado se coteja con el limite de esa entrada de la matriz de ficha correspondiente. No se reemplaza esa matriz por la corriente del MPPT mas cargado ni por la corriente total del generador. Corrientes distintas por MPPT y tensiones/corrientes AC alternativas quedan mostradas en la ficha, pero no se fuerzan en controles escalares. Por tanto la ficha tecnica queda `FICHA TECNICA INCOMPLETA` y la compatibilidad se mantiene `VALIDACION PENDIENTE` hasta completar datos del modelo/proyecto. Al editar manualmente un limite del inversor se elimina el ID seleccionado para evitar afirmar que los campos manuales siguen siendo los de la ficha.

La comprobacion de software existente compara, donde los datos se pueden representar, demanda AC con potencia nominal/pico y duracion, potencia instalada con potencia FV maxima, Voc corregido por frio con maximo DC, Vmp corregido con ventana MPPT, arranque con el umbral declarado, corrientes de Imp/Isc por MPPT/entrada y banco de bateria con limites declarados. No se derivan valores no publicados ni se elige automaticamente el producto mas barato. Cuando falta un campo para una comprobacion, el resultado asociado permanece `VALIDACION PENDIENTE`.
