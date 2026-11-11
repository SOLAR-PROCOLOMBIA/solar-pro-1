/** Fórmulas de predimensionamiento energético desacopladas de React. */
export function calculateBatteryNominalEnergy({ dailyKwh, autonomyDays, depthOfDischargePercent, inverterEfficiencyPercent, batteryDischargeEfficiencyPercent, gridOnly = false }) {
  if (gridOnly) return 0;
  const daily = Number(dailyKwh), autonomy = Number(autonomyDays);
  if (!Number.isFinite(daily) || daily < 0 || !Number.isFinite(autonomy) || autonomy < 0) return null;
  const dodPercent = Number(depthOfDischargePercent);
  const inverterPercent = Number(inverterEfficiencyPercent);
  const batteryDischargePercent = Number(batteryDischargeEfficiencyPercent);
  if (!isValidPercent(dodPercent) || !isValidPercent(inverterPercent) || !isValidPercent(batteryDischargePercent)) return null;
  const dod = dodPercent / 100;
  const inverterEfficiency = inverterPercent / 100;
  const batteryDischargeEfficiency = batteryDischargePercent / 100;
  const requiredAcEnergy = daily * autonomy;
  // Energía nominal DC = energía AC requerida / (DoD × eficiencia de descarga × eficiencia DC→AC).
  return requiredAcEnergy / (dod * batteryDischargeEfficiency * inverterEfficiency);
}

export function calculateInverterBatteryCurrent({ inverterPowerW, batteryVoltageV, inverterEfficiencyPercent }) {
  const power = Number(inverterPowerW), voltage = Number(batteryVoltageV);
  const efficiencyPercent = Number(inverterEfficiencyPercent);
  if (!Number.isFinite(power) || power <= 0 || !Number.isFinite(voltage) || voltage <= 0 || !isValidPercent(efficiencyPercent)) return null;
  const inverterEfficiency = efficiencyPercent / 100;
  return power / (voltage * inverterEfficiency);
}

export function calculatePvChargeCurrent({ installedWp, batteryVoltageV, chargePathEfficiencyPercent }) {
  const watts = Number(installedWp), voltage = Number(batteryVoltageV);
  const efficiencyPercent = Number(chargePathEfficiencyPercent);
  if (!Number.isFinite(watts) || watts < 0 || !Number.isFinite(voltage) || voltage <= 0 || !isValidPercent(efficiencyPercent)) return null;
  const availableDcPowerW = watts * efficiencyPercent / 100;
  return availableDcPowerW / voltage;
}

export function isValidPercent(value) {
  return Number.isFinite(value) && value > 0 && value <= 100;
}

export function mergeProjectDefaults(defaults, savedProject) {
  return { ...defaults, ...(savedProject && typeof savedProject === "object" ? savedProject : {}) };
}

export const ENGINEERING_STATES = Object.freeze({ VALID: "VÁLIDO", FAIL: "NO CUMPLE", PENDING: "VALIDACIÓN PENDIENTE", INVALID: "INVALIDO" });

const NUMERIC_RULES = {
  monthlyKwh: ["Consumo mensual", 0, Infinity, true], peakSunHours: ["HSP", 0, Infinity, false], efficiency: ["Rendimiento global FV", 0, 100, false],
  panelW: ["Potencia del módulo", 0, Infinity, false], panelVoc: ["Voc del módulo", 0, Infinity, false], panelVmp: ["Vmp del módulo", 0, Infinity, false], panelImp: ["Imp del módulo", 0, Infinity, false], panelIsc: ["Isc del módulo", 0, Infinity, false],
  inverterW: ["Potencia del inversor", 0, Infinity, false], inverterAcVoltage: ["Tensión AC del inversor", 0, Infinity, false], acVoltage: ["Tensión AC", 0, Infinity, false], dcVoltage: ["Tensión DC", 0, Infinity, false], batteryVoltage: ["Tensión de batería", 0, Infinity, false],
  powerFactor: ["Factor de potencia", 0, 1, false], inverterEfficiency: ["Eficiencia del inversor", 0, 100, false], batteryDischargeEfficiency: ["Eficiencia de descarga", 0, 100, false], pvChargePathEfficiency: ["Eficiencia de carga FV", 0, 100, false], dod: ["Profundidad de descarga", 0, 100, false],
  dcDrop: ["Caída DC admisible", 0, 100, false], acDrop: ["Caída AC admisible", 0, 100, false],
  manualPanelCount: ["Cantidad manual de módulos", 0, Infinity, false, true], modulesPerString: ["Módulos en serie", 0, Infinity, false, true], mpptCount: ["Cantidad de MPPT", 0, Infinity, false, true], modulesPerMppt: ["Strings por MPPT", 0, Infinity, false, true], inverterInputsPerMppt: ["Entradas por MPPT", 0, Infinity, false, true], breakerPoles: ["Polos del interruptor", 0, Infinity, false, true],
  stringDistance: ["Recorrido de string", 0, Infinity, false], dcDistance: ["Recorrido colector heredado", 0, Infinity, false], batteryDistance: ["Recorrido de batería", 0, Infinity, false], groundingDistance: ["Recorrido de tierra", 0, Infinity, false], acDistance: ["Recorrido AC", 0, Infinity, false], acConnectionDistance: ["Recorrido AC de conexión", 0, Infinity, false], peDistance: ["Recorrido PE", 0, Infinity, false], bondingDistance: ["Recorrido equipotencial", 0, Infinity, false],
  energyPrice: ["Precio de energía", 0, Infinity, true], panelPrice: ["Precio del panel", 0, Infinity, true], inverterPrice: ["Precio del inversor", 0, Infinity, true], batteryPrice: ["Precio de batería", 0, Infinity, true], protectionPrice: ["Costo de protecciones", 0, Infinity, true], structurePrice: ["Costo de estructura", 0, Infinity, true], extraCost: ["Costo adicional", 0, Infinity, true]
};

const OPTIONAL_POSITIVE_NUMERIC_KEYS = [
  "inverterSurgeW","inverterSurgeDurationSec","simultaneousDemandW","startingDemandW","startingDemandDurationSec","inverterMaxDcVoltage","mpptMinVoltage","mpptMaxVoltage","inverterStartVoltage","inverterMaxInputCurrent","inverterMaxIsc","inverterMaxPvPower","inverterMaxInputCurrentPerInput","inverterMaxIscPerInput","batteryUnitVoltage","batteryAhUnit","autonomyDays","batteryMaxDischargeCurrent","batteryMaxChargeCurrent","bmsMaxDischargeCurrent","bmsMaxChargeCurrent","controllerMaxPvVoltage","controllerMpptMinVoltage","controllerMpptMaxVoltage","controllerMaxChargeCurrent","controllerMaxPvPower","inverterMaxAcCurrentA","stringAmpacityA","collectorAmpacityA","batteryAmpacityA","acAmpacityA","acConnectionAmpacityA","stringAmpacitySectionMm2","collectorAmpacitySectionMm2","batteryAmpacitySectionMm2","acAmpacitySectionMm2","acConnectionAmpacitySectionMm2","conductorTemperatureRatingC","conductorLoadedCount","conductorTemperatureFactor","conductorGroupingFactor","peFaultCurrentA","faultClearingTimeSeconds","adiabaticK","groundingFaultCurrentA","groundingClearingTimeSeconds","groundingAdiabaticK","bondingFaultCurrentA","bondingClearingTimeSeconds","bondingAdiabaticK","availableFaultCurrentKA","breakerBreakingCapacityKA","breakerVoltageRatingV","breakerNominalCurrentA","earthResistanceOhms","earthSoilResistivityOhmM","panelMaxSeriesFuse","panelMaxReverseCurrentA","gpvSelectedFuseRatingA","peTableSectionMm2"
];

/** Valida también los objetos rehidratados desde localStorage/Supabase; vacíos quedan pendientes. */
export function validateNumericInputs(data = {}) {
  const invalid = [], pending = [], values = {};
  const check = (key, label, min, max, allowZero = false, integer = false) => {
    const raw = data[key];
    if (raw == null || raw === "") { pending.push({ key, label }); return; }
    const value = Number(raw); values[key] = value;
    if (!Number.isFinite(value) || (allowZero ? value < min : value <= min) || value > max || (integer && !Number.isInteger(value))) {
      invalid.push({ key, label, value: String(raw), message: `${label}: ingresa un número finito ${integer ? "entero " : ""}${allowZero ? `≥ ${min}` : `> ${min}`}${Number.isFinite(max) ? ` y ≤ ${max}` : ""}.` });
    }
  };
  for (const [key, [label, min, max, allowZero, integer = false]] of Object.entries(NUMERIC_RULES)) check(key, label, min, max, allowZero, integer);
  for (const key of OPTIONAL_POSITIVE_NUMERIC_KEYS) if (data[key] != null && data[key] !== "") check(key, key, 0, Infinity);
  for (const key of ["conductorTemperatureFactor", "conductorGroupingFactor"]) if (data[key] != null && data[key] !== "" && Number(data[key]) > 1) invalid.push({ key, label: key, value: String(data[key]), message: `${key} debe estar entre 0 y 1.` });
  if (data.conductorLoadedCount != null && data.conductorLoadedCount !== "" && !Number.isInteger(Number(data.conductorLoadedCount))) invalid.push({ key: "conductorLoadedCount", label: "Conductores cargados", value: String(data.conductorLoadedCount), message: "El número de conductores cargados debe ser entero." });
  for (const key of ["batteryDrop", "acConnectionDrop"]) if (data[key] != null && data[key] !== "") check(key, key, 0, 100);
  for (const key of ["ambientTemperatureC","minimumTemperature","maximumCellTemperature","vocTempCoefficient","vmpTempCoefficient","adiabaticInitialTemperatureC","adiabaticFinalTemperatureC"]) if (data[key] != null && data[key] !== "") check(key, key, -Infinity, Infinity, true);
  for (const key of ["adiabaticInitialTemperatureC", "adiabaticFinalTemperatureC"]) if (data[key] != null && data[key] !== "" && Number(data[key]) < 0) invalid.push({ key, label: key, value: String(data[key]), message: `${key} no puede ser negativa.` });
  if (data.mpptCircuits != null && !Array.isArray(data.mpptCircuits)) invalid.push({ key: "mpptCircuits", label: "Recorridos MPPT", message: "Los datos de circuito MPPT deben ser una lista válida." });
  if (data.appliances != null && !Array.isArray(data.appliances)) invalid.push({ key: "appliances", label: "Registro de electrodomésticos", message: "El registro de cargas debe ser una lista válida." });
  if (data.manualPanelCountEnabled === true && !(Number.isInteger(Number(data.manualPanelCount)) && Number(data.manualPanelCount) > 0)) invalid.push({ key: "manualPanelCount", label: "Cantidad manual de módulos", message: "La cantidad manual debe ser un entero positivo." });
  if (data.minimumTemperature !== "" && data.minimumTemperature != null && data.maximumCellTemperature !== "" && data.maximumCellTemperature != null && Number.isFinite(Number(data.minimumTemperature)) && Number.isFinite(Number(data.maximumCellTemperature)) && Number(data.maximumCellTemperature) < Number(data.minimumTemperature)) invalid.push({ key: "maximumCellTemperature", label: "Rango de temperatura", message: "La temperatura máxima de célula no puede ser menor que la temperatura mínima de diseño." });
  if (data.gpvFuseRatingsA != null && data.gpvFuseRatingsA !== "") {
    const ratings = String(data.gpvFuseRatingsA).split(",").map(value => Number(value.trim()));
    if (!ratings.length || ratings.some(value => !Number.isFinite(value) || value <= 0)) invalid.push({ key: "gpvFuseRatingsA", label: "Calibres gPV", message: "Cada calibre gPV debe ser un número finito positivo separado por coma." });
  }
  for (const [index, circuit] of (Array.isArray(data.mpptCircuits) ? data.mpptCircuits : []).entries()) for (const field of ["distanceM", "ampacityA", "ampacitySectionMm2"]) {
    const raw = circuit?.[field];
    if (raw == null || raw === "") continue;
    const value = Number(raw), key = `mpptCircuits.${index}.${field}`;
    if (!Number.isFinite(value) || value <= 0) invalid.push({ key, label: `${circuit.mpptId || `MPPT-${index+1}`} ${field}`, value: String(raw), message: `${field} debe ser un número finito positivo.` });
  }
  for (const [index, appliance] of (Array.isArray(data.appliances) ? data.appliances : []).entries()) for (const field of ["watts", "quantity", "hours"]) {
    const raw = appliance?.[field];
    if (raw == null || raw === "") continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || (field === "quantity" && (!Number.isInteger(value) || value < 1))) invalid.push({ key: `appliances.${index}.${field}`, label: `Carga ${index+1} · ${field}`, value: String(raw), message: `${field} de carga debe ser finito y no negativo${field === "quantity" ? " e entero positivo" : ""}.` });
  }
  return { valid: invalid.length === 0, invalid, pending, values, invalidKeys: invalid.map(item => item.key), status: invalid.length ? ENGINEERING_STATES.INVALID : ENGINEERING_STATES.PENDING };
}

export function resolveEngineeringState({ invalid = [], failures = [], pending = [] } = {}) {
  if (invalid.length) return ENGINEERING_STATES.INVALID;
  if (failures.length) return ENGINEERING_STATES.FAIL;
  if (pending.length) return ENGINEERING_STATES.PENDING;
  return ENGINEERING_STATES.VALID;
}

/** Un dato de ampacidad solo aplica a la seccion/material exactos y a condiciones documentadas. */
export function validateAmpacityReference({ baseAmpacityA, referenceSectionMm2, selectedSectionMm2, referenceMaterial, material, insulation, temperatureRatingC, installationMethod, loadedConductors, ambientTemperatureC, temperatureFactor, groupingFactor, source }) {
  const required = { baseAmpacityA, referenceSectionMm2, selectedSectionMm2, referenceMaterial, material, insulation, temperatureRatingC, installationMethod, loadedConductors, ambientTemperatureC, temperatureFactor, groupingFactor, source };
  const missing = Object.entries(required).filter(([, value]) => value == null || (typeof value === "string" && (!value.trim() || value === "Por definir"))).map(([key]) => key);
  const numeric = [baseAmpacityA, referenceSectionMm2, selectedSectionMm2, temperatureRatingC, loadedConductors, ambientTemperatureC, temperatureFactor, groupingFactor].filter(value => value != null && value !== "").map(Number);
  if (numeric.some(value => !Number.isFinite(value)) || (baseAmpacityA != null && Number(baseAmpacityA) <= 0) || (referenceSectionMm2 != null && Number(referenceSectionMm2) <= 0) || (temperatureRatingC != null && Number(temperatureRatingC) <= 0) || (loadedConductors != null && (!Number.isInteger(Number(loadedConductors)) || Number(loadedConductors) <= 0))) return { valid: false, status: ENGINEERING_STATES.INVALID, correctedAmpacityA: null, missing: [], message: "Metadatos/ampacidad contienen valores numéricos inválidos." };
  if (missing.length) return { valid: null, status: ENGINEERING_STATES.PENDING, correctedAmpacityA: null, missing, message: "Falta la fuente o condición de referencia de ampacidad." };
  if (Number(referenceSectionMm2) !== Number(selectedSectionMm2) || referenceMaterial !== material) return { valid: null, status: ENGINEERING_STATES.PENDING, correctedAmpacityA: null, missing: ["coincidencia exacta de sección/material"], message: "La ampacidad no corresponde a la sección comercial y material seleccionados." };
  if (!(Number(temperatureFactor) > 0 && Number(temperatureFactor) <= 1 && Number(groupingFactor) > 0 && Number(groupingFactor) <= 1)) return { valid: false, status: ENGINEERING_STATES.INVALID, correctedAmpacityA: null, missing: [], message: "Factores de corrección deben estar en (0, 1]." };
  return { valid: true, status: ENGINEERING_STATES.VALID, correctedAmpacityA: Number(baseAmpacityA) * Number(temperatureFactor) * Number(groupingFactor), missing: [], insulation, temperatureRatingC: Number(temperatureRatingC), installationMethod, loadedConductors: Number(loadedConductors), ambientTemperatureC: Number(ambientTemperatureC), source };
}

export function evaluateProductCompatibility(product, requirements = {}) {
  const specs = product?.electricalSpecs;
  const keys = Object.keys(requirements).filter(key => requirements[key] != null && requirements[key] !== "");
  if (!specs || !keys.length || keys.some(key => specs[key] == null || specs[key] === "")) return { status: ENGINEERING_STATES.PENDING, verified: false, missing: keys.filter(key => specs?.[key] == null || specs?.[key] === "") };
  if (!Array.isArray(requirements.certifications) || requirements.certifications.length === 0) return { status: ENGINEERING_STATES.PENDING, verified: false, missing: ["applicable certification criteria"] };
  if (requirements.certifications?.length && (!Array.isArray(specs.certifications) || specs.certifications.length === 0)) return { status: ENGINEERING_STATES.PENDING, verified: false, missing: ["certifications"] };
  const failed = keys.filter(key => {
    const actual = specs[key], required = requirements[key];
    if (Array.isArray(required)) return key === "certifications" ? !required.every(value => Array.isArray(actual) && actual.includes(value)) : !required.includes(actual);
    if (required && typeof required === "object" && ("min" in required || "max" in required)) return typeof actual !== "number" || !Number.isFinite(actual) || (required.min != null && actual < required.min) || (required.max != null && actual > required.max);
    if (typeof required === "number") return typeof actual !== "number" || !Number.isFinite(actual) || actual < required;
    return actual !== required;
  });
  const certificationsMissing = !Array.isArray(specs.certifications) || specs.certifications.length === 0;
  if (failed.length) return { status: ENGINEERING_STATES.FAIL, verified: false, failed, missing: certificationsMissing ? ["certifications"] : [] };
  if (certificationsMissing) return { status: ENGINEERING_STATES.PENDING, verified: false, missing: ["certifications"] };
  return { status: ENGINEERING_STATES.VALID, verified: true, missing: [], failed: [] };
}

export function calculateBudgetTotals(lineValues = [], extras = {}, validationChecks = []) {
  const invalid = lineValues.filter(row => !Number.isFinite(Number(row.qty)) || Number(row.qty) < 0 || (row.numeric != null && row.numeric !== "" && (!Number.isFinite(Number(row.numeric)) || Number(row.numeric) < 0)));
  const unpricedItems = lineValues.filter(row => row.numeric == null || row.numeric === "");
  const knownSubtotal = lineValues.reduce((sum, row) => sum + (Number.isFinite(Number(row.lineTotal)) ? Number(row.lineTotal) : 0), 0);
  const extraValues = [extras.transport, extras.labor, extras.other, extras.tax].map(value => value == null || value === "" ? 0 : Number(value));
  if (extraValues.some(value => !Number.isFinite(value) || value < 0) || extraValues[3] > 100) invalid.push({ name: "Costos adicionales" });
  const [transport, labor, other, taxPercent] = extraValues;
  const taxableBase = knownSubtotal + transport + labor + other;
  const tax = taxableBase * taxPercent / 100;
  const total = taxableBase + tax;
  const checks = validationChecks.map(check => typeof check === "string" ? check : check?.status).filter(Boolean);
  const hasInvalidCheck = checks.includes(ENGINEERING_STATES.INVALID);
  const hasFailCheck = checks.includes(ENGINEERING_STATES.FAIL) || checks.some(status => String(status).startsWith("NO CUMPLE"));
  const hasPendingCheck = checks.includes(ENGINEERING_STATES.PENDING);
  const status = invalid.length || hasInvalidCheck ? ENGINEERING_STATES.INVALID : hasFailCheck ? ENGINEERING_STATES.FAIL : unpricedItems.length || hasPendingCheck ? ENGINEERING_STATES.PENDING : ENGINEERING_STATES.VALID;
  const pendingCount = unpricedItems.length + checks.filter(check => check === ENGINEERING_STATES.PENDING).length;
  return { status, invalid, unpricedCount: unpricedItems.length, pendingCount, knownSubtotal, transport, labor, other, taxPercent, tax, total, complete: status === ENGINEERING_STATES.VALID };
}

export function buildEngineeringStateModel({ data = {}, numericValidation = validateNumericInputs(data), circuitModel = null, budgetStatus = ENGINEERING_STATES.PENDING, compatibility = [] } = {}) {
  const invalidKeys = new Set(numericValidation.invalid.map(item => item.key));
  const hasInvalid = keys => keys.some(key => invalidKeys.has(key) || [...invalidKeys].some(invalid => invalid.startsWith(`${key}.`)));
  const missing = keys => keys.some(key => data[key] == null || data[key] === "");
  const domain = (keys, pending = false, failures = []) => resolveEngineeringState({ invalid: hasInvalid(keys) ? ["numeric input"] : [], failures, pending: pending || missing(keys) ? ["required technical data"] : [] });
  const circuitList = circuitModel?.circuits || [];
  const circuitInvalid = circuitList.some(circuit => circuit.status === ENGINEERING_STATES.INVALID);
  const circuitFailure = circuitList.some(circuit => circuit.status.startsWith("NO CUMPLE"));
  const circuitPending = circuitList.some(circuit => circuit.status === ENGINEERING_STATES.PENDING);
  const states = {
    consumption: data.consumptionMode === "appliances" && numericValidation.invalid.some(item => item.key === "appliances" || item.key.startsWith("appliances.")) ? ENGINEERING_STATES.INVALID : domain(["monthlyKwh", "peakSunHours", "efficiency"]),
    generator: domain(["monthlyKwh", "peakSunHours", "efficiency", "panelW"]),
    stringsMppt: domain(["panelVoc", "panelVmp", "panelIsc", "panelImp", "modulesPerString", "mpptCount", "modulesPerMppt"], data.mpptCount === "" || data.modulesPerString === ""),
    inverter: domain(["inverterW", "inverterAcVoltage", "acVoltage", "powerFactor"], compatibility.some(item => item.status === "warning"), compatibility.some(item => item.status === "error")),
    catalog: ENGINEERING_STATES.PENDING,
    batteries: data.systemType === "ON-GRID" ? ENGINEERING_STATES.VALID : domain(["batteryVoltage", "dod", "batteryDischargeEfficiency", "inverterEfficiency"]),
    conductors: hasInvalid(["stringDistance", "dcDistance", "acDistance", "acConnectionDistance", "batteryDistance", "peDistance", "groundingDistance", "bondingDistance"]) || circuitInvalid ? ENGINEERING_STATES.INVALID : circuitFailure ? ENGINEERING_STATES.FAIL : circuitPending || circuitList.length === 0 ? ENGINEERING_STATES.PENDING : ENGINEERING_STATES.PENDING,
    protections: hasInvalid(["availableFaultCurrentKA", "breakerBreakingCapacityKA", "breakerVoltageRatingV", "breakerNominalCurrentA", "breakerPoles", "inverterMaxAcCurrentA", "panelMaxSeriesFuse", "gpvSelectedFuseRatingA"]) ? ENGINEERING_STATES.INVALID : compatibility.some(item => item.status === "error") ? ENGINEERING_STATES.FAIL : ENGINEERING_STATES.PENDING,
    grounding: hasInvalid(["peDistance", "groundingDistance", "bondingDistance", "peFaultCurrentA", "faultClearingTimeSeconds", "adiabaticK", "groundingFaultCurrentA", "groundingClearingTimeSeconds", "groundingAdiabaticK", "bondingFaultCurrentA", "bondingClearingTimeSeconds", "bondingAdiabaticK", "earthResistanceOhms", "earthSoilResistivityOhmM"]) ? ENGINEERING_STATES.INVALID : ENGINEERING_STATES.PENDING,
    bom: circuitInvalid ? ENGINEERING_STATES.INVALID : circuitFailure ? ENGINEERING_STATES.FAIL : circuitPending ? ENGINEERING_STATES.PENDING : ENGINEERING_STATES.PENDING,
    budget: budgetStatus,
    diagram: circuitInvalid ? ENGINEERING_STATES.INVALID : circuitFailure ? ENGINEERING_STATES.FAIL : ENGINEERING_STATES.PENDING,
    summary: resolveEngineeringState({ invalid: numericValidation.invalid, failures: compatibility.filter(item => item.status === "error"), pending: ["cross-domain review"] }),
    report: resolveEngineeringState({ invalid: numericValidation.invalid, failures: compatibility.filter(item => item.status === "error"), pending: ["professional/ficha review"] })
  };
  states.project = resolveEngineeringState({ invalid: Object.values(states).includes(ENGINEERING_STATES.INVALID) ? ["invalid domain"] : [], failures: Object.values(states).includes(ENGINEERING_STATES.FAIL) ? ["failed domain"] : [], pending: Object.values(states).includes(ENGINEERING_STATES.PENDING) ? ["pending domain"] : [] });
  return states;
}

/** Normaliza circuitos eléctricos para que BOM, unifilar e informe lean la misma fuente. */
export function buildElectricalCircuitModel({ circuits = [], architecture = "HÍBRIDO", totalPvCurrentA = null, totalPvShortCircuitCurrentA = null } = {}) {
  const included = circuits.filter(circuit => circuit && circuit.applies !== false &&
    !(architecture === "ON-GRID" && circuit.type === "battery") &&
    !(architecture === "OFF-GRID" && circuit.type === "ac-grid")).map(circuit => {
    const run = circuit.run || {};
    const length = Number(circuit.lengthM);
    const conductors = Number(circuit.conductorCount);
    const designCurrent = Number(circuit.designCurrentA);
    const section = run.commercialSectionMm2 ?? circuit.sectionMm2 ?? null;
    const pending = [...(run.pending || []), ...(circuit.pending || [])];
    if (!(Number.isFinite(length) && length > 0)) pending.push("Longitud de recorrido pendiente.");
    return {
      id: String(circuit.id || "Circuito"), type: circuit.type || "conductor", label: circuit.label || circuit.id || "Circuito",
      from: circuit.from || "", to: circuit.to || "", mpptId: circuit.mpptId || null,
      strings: Number(circuit.strings) || 0, lengthM: Number.isFinite(length) && length > 0 ? length : null,
      conductorCount: Number.isFinite(conductors) && conductors > 0 ? conductors : null,
      material: circuit.material || "Por definir", designCurrentA: Number.isFinite(designCurrent) && designCurrent > 0 ? designCurrent : null,
      calculatedAreaMm2: run.calculatedAreaMm2 ?? null, sectionMm2: section,
      sectionByVoltageDropMm2: run.sectionByVoltageDropMm2 ?? run.commercialSectionMm2 ?? null,
      sectionByAmpacityMm2: run.sectionByAmpacityMm2 ?? null,
      sectionByProtectionMm2: run.sectionByProtectionMm2 ?? null,
      selectedSectionMm2: run.selectedSectionMm2 ?? null,
      correctedAmpacityA: run.correctedAmpacityA ?? null, voltageDropV: run.voltageDropV ?? null,
      voltageDropPercent: run.voltageDropPercent ?? null, protection: circuit.protection || "VALIDACIÓN PENDIENTE",
      status: run.ampacityPass === false ? "NO CUMPLE AMPACIDAD" : pending.length || !section ? "VALIDACIÓN PENDIENTE" : "PREDIMENSIONAMIENTO",
      pending: [...new Set(pending)], invalid: run.invalid || [], applies: true
    };
  });
  return {
    architecture, circuits: included.map(circuit => ({ ...circuit, status: circuit.invalid.length ? ENGINEERING_STATES.INVALID : circuit.status.startsWith("NO CUMPLE") ? ENGINEERING_STATES.FAIL : ENGINEERING_STATES.PENDING })),
    generator: { id: "FV-TOTAL", label: "Generador FV total", currentA: Number.isFinite(Number(totalPvCurrentA)) ? Number(totalPvCurrentA) : null, shortCircuitCurrentA: Number.isFinite(Number(totalPvShortCircuitCurrentA)) ? Number(totalPvShortCircuitCurrentA) : null, conductor: false }
  };
}

/** Convierte exclusivamente circuitos con longitud conocida en renglones de cable BOM. */
export function buildElectricalBOMRows(circuitModel) {
  return (circuitModel?.circuits || []).filter(circuit => circuit.lengthM != null && circuit.conductorCount > 0)
    .map(circuit => {
      const prefix = circuit.type === "string" || circuit.type === "mppt-collector" ? "Cable FV" : ["ac", "ac-grid"].includes(circuit.type) ? "Cable AC" : circuit.type === "battery" ? "Cable de batería" : "Conductor";
      return {
      id: circuit.id, type: circuit.type, name: `${prefix} ${circuit.label}`, qty: Math.ceil(circuit.lengthM * circuit.conductorCount * 100) / 100,
      unit: "m", sectionMm2: circuit.sectionMm2, material: circuit.material, note: `${circuit.id} · ${circuit.conductorCount} conductor(es) × ${circuit.lengthM} m por recorrido · sección candidata por caída ${circuit.sectionByVoltageDropMm2 == null ? "pendiente" : `${circuit.sectionByVoltageDropMm2} mm²`} · por ampacidad ${circuit.sectionByAmpacityMm2 ?? "pendiente"} · por protección ${circuit.sectionByProtectionMm2 ?? "pendiente"} · selección final pendiente · ${circuit.material} · ${circuit.status}`
      };
    });
}

/** Reutiliza el recorrido DC compartido solo como compatibilidad de proyectos antiguos. */
export function resolveMpptCircuitDistance(savedCircuit, legacyDistance) {
  if (savedCircuit) {
    const saved = Number(savedCircuit.distanceM);
    if (savedCircuit.distanceM != null && savedCircuit.distanceM !== "" && Number.isFinite(saved) && saved > 0) return { distanceM: saved, source: "mppt" };
    return { distanceM: null, source: "pending" };
  }
  const legacy = Number(legacyDistance);
  if (Number.isFinite(legacy) && legacy > 0) return { distanceM: legacy, source: "legacy-shared" };
  return { distanceM: null, source: "pending" };
}

/** Solo crea partidas de protección cuando se confirma que hacen falta externamente. */
export function buildExternalProtectionRows(statuses = {}, architecture = "HÍBRIDO") {
  const candidates = [
    ["dcDisconnect", "Protección/seccionador DC FV"], ["dcSpd", "DPS DC fotovoltaico"],
    ...(architecture !== "ON-GRID" ? [["battery", "Protección DC de batería"]] : []),
    ["acBreaker", "Interruptor termomagnético AC"], ["acSpd", "DPS AC lado de salida"]
  ];
  return candidates.filter(([key]) => statuses[key] === "Protección externa requerida").map(([, name]) => ({ name, qty: 1, unit: "unidad", note: "Requerimiento externo confirmado; especificación, coordinación y ficha técnica pendientes.", price: null }));
}

const COMMERCIAL_SECTIONS_MM2 = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];
const MATERIALS = {
  Cobre: { rho20: 0.0175, alpha: 0.00393 },
  Aluminio: { rho20: 0.0282, alpha: 0.00403 }
};

/** Predimensiona sección por caída resistiva; omite reactancia y efectos AC complejos. */
export function calculateConductorRun({ currentA, voltageV, distanceOneWayM, dropPercent, material = "Cobre", ambientTemperatureC = 20, phaseSystem = "dc", powerFactor = 1, installationMethod, baseAmpacityA, temperatureFactor, groupingFactor, faultCurrentA, clearingTimeSeconds, adiabaticK }) {
  const current = Number(currentA), voltage = Number(voltageV), distance = Number(distanceOneWayM), drop = Number(dropPercent);
  const conductor = MATERIALS[material];
  const temp = Number(ambientTemperatureC);
  const result = { status: "VALIDACIÓN PENDIENTE", calculatedAreaMm2: null, commercialSectionMm2: null, voltageDropV: null, voltageDropPercent: null, correctedAmpacityA: null, ampacityPass: null, adiabaticAreaMm2: null, adiabaticSectionMm2: null, pending: [] };
  if (!(current > 0 && voltage > 0 && distance > 0 && drop > 0 && drop <= 100 && conductor && ambientTemperatureC !== "" && ambientTemperatureC != null && Number.isFinite(temp))) {
    result.pending.push("Corriente, tensión, recorrido, caída, material o temperatura inválidos/no informados.");
    return result;
  }
  const rho = conductor.rho20 * (1 + conductor.alpha * (temp - 20));
  if (!(rho > 0)) { result.pending.push("Temperatura fuera del dominio del modelo resistivo."); return result; }
  const pf = Number(powerFactor);
  if (!(pf > 0 && pf <= 1)) { result.pending.push("Factor de potencia fuera del rango (0,1]."); return result; }
  const multiplier = phaseSystem === "three-phase" ? Math.sqrt(3) : 2;
  const pfFactor = phaseSystem === "dc" ? 1 : pf;
  const deltaV = voltage * drop / 100;
  const area = multiplier * rho * distance * current * pfFactor / deltaV;
  result.calculatedAreaMm2 = area;
  result.commercialSectionMm2 = COMMERCIAL_SECTIONS_MM2.find(section => section >= area) ?? null;
  const checkArea = result.commercialSectionMm2 || area;
  result.voltageDropV = multiplier * rho * distance * current * pfFactor / checkArea;
  result.voltageDropPercent = result.voltageDropV / voltage * 100;
  const base = Number(baseAmpacityA), tf = Number(temperatureFactor), gf = Number(groupingFactor);
  const installationKnown = typeof installationMethod === "string" && installationMethod !== "" && installationMethod !== "Por definir";
  if (base > 0 && tf > 0 && tf <= 1 && gf > 0 && gf <= 1 && installationKnown) {
    result.correctedAmpacityA = base * tf * gf;
    result.ampacityPass = result.correctedAmpacityA >= current;
    if (!result.ampacityPass) result.pending.push("La ampacidad corregida ingresada es menor que la corriente de diseño; aumentar sección y coordinar protección.");
  } else result.pending.push("Ampacidad base correspondiente a sección y método, método de instalación y factores de temperatura/agrupamiento requieren tabla/ficha técnica.");
  const fault = Number(faultCurrentA), time = Number(clearingTimeSeconds), k = Number(adiabaticK);
  if (fault > 0 && time > 0 && k > 0) {
    result.adiabaticAreaMm2 = fault * Math.sqrt(time) / k;
    result.adiabaticSectionMm2 = COMMERCIAL_SECTIONS_MM2.find(section => section >= result.adiabaticAreaMm2) ?? null;
  } else result.pending.push("Verificación adiabática de cortocircuito pendiente: faltan Icc, tiempo de despeje y k del conductor/aislamiento.");
  result.status = result.ampacityPass === false ? "NO CUMPLE AMPACIDAD INGRESADA" : "PREDIMENSIONAMIENTO POR CAÍDA; VALIDACIÓN PENDIENTE";
  return result;
}

/** Entrada estricta usada por la interfaz: distingue inválidos, pendiente y ampacidad trazable. */
export function calculateValidatedConductorRun(args = {}) {
  const required = ["currentA", "voltageV", "distanceOneWayM", "dropPercent"];
  const invalid = required.filter(key => args[key] != null && args[key] !== "" && (!Number.isFinite(Number(args[key])) || Number(args[key]) < 0));
  if (args.powerFactor != null && args.powerFactor !== "" && (!Number.isFinite(Number(args.powerFactor)) || Number(args.powerFactor) <= 0 || Number(args.powerFactor) > 1)) invalid.push("powerFactor");
  for (const key of ["currentA", "voltageV", "distanceOneWayM", "dropPercent"]) if (args[key] != null && args[key] !== "" && Number(args[key]) === 0) invalid.push(key);
  if (Number.isFinite(Number(args.dropPercent)) && Number(args.dropPercent) > 100) invalid.push("dropPercent");
  if (invalid.length) return { status: ENGINEERING_STATES.INVALID, calculatedAreaMm2: null, commercialSectionMm2: null, sectionByVoltageDropMm2: null, sectionByAmpacityMm2: null, sectionByProtectionMm2: null, selectedSectionMm2: null, voltageDropV: null, voltageDropPercent: null, correctedAmpacityA: null, ampacityPass: null, pending: [], invalid: invalid.map(key => `${key} inválido: debe ser finito y estar en rango.`) };
  if (required.some(key => args[key] == null || args[key] === "") || args.ambientTemperatureC == null || args.ambientTemperatureC === "" || !Number.isFinite(Number(args.ambientTemperatureC)) || !args.material) return { status: ENGINEERING_STATES.PENDING, calculatedAreaMm2: null, commercialSectionMm2: null, sectionByVoltageDropMm2: null, sectionByAmpacityMm2: null, sectionByProtectionMm2: null, selectedSectionMm2: null, voltageDropV: null, voltageDropPercent: null, correctedAmpacityA: null, ampacityPass: null, pending: ["Entradas requeridas incompletas."], invalid: [] };
  const run = calculateConductorRun(args);
  run.sectionByVoltageDropMm2 = run.commercialSectionMm2;
  run.sectionByAmpacityMm2 = null;
  run.sectionByProtectionMm2 = null;
  run.selectedSectionMm2 = null;
  const ampacity = validateAmpacityReference({ baseAmpacityA: args.baseAmpacityA, referenceSectionMm2: args.baseAmpacitySectionMm2, selectedSectionMm2: run.commercialSectionMm2, referenceMaterial: args.baseAmpacityMaterial, material: args.material, insulation: args.insulation, temperatureRatingC: args.temperatureRatingC, installationMethod: args.installationMethod, loadedConductors: args.loadedConductors, ambientTemperatureC: args.ambientTemperatureC, temperatureFactor: args.temperatureFactor, groupingFactor: args.groupingFactor, source: args.ampacitySource });
  run.ampacityReferenceStatus = ampacity.status;
  if (ampacity.status === ENGINEERING_STATES.INVALID) {
    run.status = ENGINEERING_STATES.INVALID;
    run.invalid = [...(run.invalid || []), ampacity.message];
    run.correctedAmpacityA = null;
    return run;
  }
  if (ampacity.valid) {
    run.correctedAmpacityA = ampacity.correctedAmpacityA;
    run.sectionByAmpacityMm2 = Number(args.baseAmpacitySectionMm2);
    run.ampacityPass = run.correctedAmpacityA >= Number(args.currentA);
    if (!run.ampacityPass) run.status = ENGINEERING_STATES.FAIL;
  } else {
    run.correctedAmpacityA = null;
    run.ampacityPass = null;
    run.pending.push(ampacity.message);
  }
  if (run.status !== ENGINEERING_STATES.FAIL && run.status !== ENGINEERING_STATES.INVALID) run.status = ENGINEERING_STATES.PENDING;
  return run;
}

/** Selección solo de clase comercial preferida; la protección queda pendiente sin Icc y datos de coordinación. */
export function evaluateProtectionCandidate({ designCurrentA, conductorAmpacityA, faultCurrentKA, deviceBreakingCapacityKA, voltageRatingV, requiredVoltageV, poles, requiredPoles }) {
  const current = Number(designCurrentA), ampacity = Number(conductorAmpacityA);
  const providedValues = [designCurrentA, conductorAmpacityA, faultCurrentKA, deviceBreakingCapacityKA, voltageRatingV, requiredVoltageV, poles, requiredPoles].filter(value => value != null && value !== "");
  if (providedValues.some(value => !Number.isFinite(Number(value)) || Number(value) < 0) || [designCurrentA, conductorAmpacityA, faultCurrentKA, deviceBreakingCapacityKA, voltageRatingV, requiredVoltageV, poles, requiredPoles].some(value => value != null && value !== "" && Number(value) === 0)) return { valid: false, status: ENGINEERING_STATES.INVALID, pending: ["Protección contiene entradas no finitas, no positivas o negativas."] };
  const pending = [];
  const invalid = [];
  if (!(current > 0)) pending.push("corriente de diseño");
  if (!(ampacity > 0)) pending.push("ampacidad corregida del conductor");
  else if (current > ampacity) invalid.push("corriente supera ampacidad corregida");
  const fault = Number(faultCurrentKA), breaking = Number(deviceBreakingCapacityKA);
  if (!(fault > 0 && breaking > 0)) pending.push("Icc disponible y poder de corte de ficha");
  else if (breaking < fault) invalid.push("poder de corte inferior a Icc");
  if (!(Number(voltageRatingV) >= Number(requiredVoltageV) && Number(requiredVoltageV) > 0)) pending.push("tensión/categoría de empleo de ficha");
  if (!(Number(poles) > 0 && Number(poles) === Number(requiredPoles))) pending.push("número de polos y esquema de puesta a tierra");
  return { valid: pending.length === 0 && invalid.length === 0, status: invalid.length ? `NO CUMPLE: ${invalid.join("; ")}` : pending.length ? "VALIDACIÓN PENDIENTE" : "Candidato coordinado con datos ingresados", pending: [...invalid, ...pending] };
}

/** Revisión adiabática aislada para PE; no depende de una falsa caída de tensión. */
export function calculateAdiabaticSection({ faultCurrentA, clearingTimeSeconds, kFactor, material, insulation, initialTemperatureC, finalTemperatureC, kSource }) {
  const current = Number(faultCurrentA), time = Number(clearingTimeSeconds), k = Number(kFactor);
  const initial = Number(initialTemperatureC), final = Number(finalTemperatureC);
  if (!(current > 0 && time > 0 && k > 0 && material === "Cobre" && typeof insulation === "string" && insulation.trim() && Number.isFinite(initial) && Number.isFinite(final) && final > initial && typeof kSource === "string" && kSource.trim())) return { areaMm2: null, commercialSectionMm2: null, status: "VALIDACIÓN PENDIENTE: material, aislamiento, temperaturas y fuente de k requeridos" };
  const areaMm2 = current * Math.sqrt(time) / k;
  return { areaMm2, commercialSectionMm2: COMMERCIAL_SECTIONS_MM2.find(section => section >= areaMm2) ?? null, status: "Cálculo adiabático preliminar; cotejar con sección normativa por tabla" };
}

/** Dimensiona el número energético y conserva el valor elegido por el usuario. */
/** Suma caídas AC en serie entre inversor y punto de conexión; RETIE 2026 3.17.21(d): límite 3 %. */
export function calculateAcCumulativeVoltageDrop({ runs, nominalVoltageV, limitPercent = 3 }) {
  const voltage = Number(nominalVoltageV), limit = Number(limitPercent);
  if ((nominalVoltageV != null && nominalVoltageV !== "" && !Number.isFinite(voltage)) || (limitPercent != null && !Number.isFinite(limit))) return { individualDropsV: [], cumulativeDropV: null, cumulativeDropPercent: null, limitPercent: null, passes: null, status: "INVALIDO" };
  const validRuns = Array.isArray(runs) && runs.length > 0 && runs.every(run => run?.voltageDropV != null && run.voltageDropV !== "" && Number.isFinite(Number(run.voltageDropV)) && Number(run.voltageDropV) >= 0);
  if (!(voltage > 0 && limit > 0 && limit <= 100 && validRuns)) return { individualDropsV: [], cumulativeDropV: null, cumulativeDropPercent: null, limitPercent: limit, passes: null, status: "VALIDACIÓN PENDIENTE" };
  const individualDropsV = runs.map(run => Number(run.voltageDropV));
  const cumulativeDropV = individualDropsV.reduce((sum, value) => sum + value, 0);
  const cumulativeDropPercent = cumulativeDropV / voltage * 100;
  return { individualDropsV, cumulativeDropV, cumulativeDropPercent, limitPercent: limit, passes: cumulativeDropPercent <= limit, status: cumulativeDropPercent <= limit ? "Dentro del límite acumulado configurado" : "NO CUMPLE caída acumulada" };
}

/** Retroalimentación preliminar desde las otras strings paralelas en el MPPT: (Npar-1) × Isc. */
export function calculatePvReverseCurrent({ moduleIscA, parallelStringsOnMppt }) {
  const isc = Number(moduleIscA), strings = Number(parallelStringsOnMppt);
  if (!(isc > 0 && Number.isInteger(strings) && strings > 0)) return { reverseCurrentA: null, status: "VALIDACIÓN PENDIENTE" };
  return { reverseCurrentA: Math.max(0, strings - 1) * isc, status: "Estimación preliminar; confirmar topología y fichas" };
}

/** Corriente AC de salida; usa Imax de ficha si se aporta, si no devuelve una estimación nominal marcada. */
export function calculateAcDesignCurrent({ ratedAcPowerW, ratedAcVoltageV, phaseSystem, powerFactor = 1, maximumOutputCurrentA }) {
  const maximum = Number(maximumOutputCurrentA);
  if (maximumOutputCurrentA != null && maximumOutputCurrentA !== "" && !Number.isFinite(maximum)) return { currentA: null, source: "", validation: "INVALIDO: corriente máxima AC de ficha inválida" };
  if (maximum > 0 && Number.isFinite(maximum)) return { currentA: maximum, source: "máxima continua declarada por ficha", validation: "Verificar modo y tensión de operación de ficha" };
  const power = Number(ratedAcPowerW), voltage = Number(ratedAcVoltageV), pf = Number(powerFactor);
  if (!(power > 0 && voltage > 0 && pf > 0 && pf <= 1 && ["single-phase", "three-phase"].includes(phaseSystem))) return { currentA: null, source: "", validation: "VALIDACIÓN PENDIENTE: potencia/tensión/fases/FP" };
  const denominator = phaseSystem === "three-phase" ? Math.sqrt(3) * voltage * pf : voltage * pf;
  return { currentA: power / denominator, source: "estimación desde P nominal / tensión / FP", validation: "VALIDACIÓN PENDIENTE: confirmar corriente máxima continua en ficha del inversor" };
}

/** Usa únicamente ratings gPV declarados por ficha/producto; nunca calibres AC genéricos. */
export function evaluateGpvFuse({ moduleIscA, parallelStringsOnMppt, moduleMaxReverseCurrentA, moduleMaxSeriesFuseA, gpvRatingsA = [], selectedGpvRatingA, conductorAmpacityA }) {
  const reverse = calculatePvReverseCurrent({ moduleIscA, parallelStringsOnMppt });
  const isc = Number(moduleIscA), reverseLimit = Number(moduleMaxReverseCurrentA), seriesFuseLimit = Number(moduleMaxSeriesFuseA), conductor = Number(conductorAmpacityA);
  const ratings = Array.isArray(gpvRatingsA) ? gpvRatingsA.map(Number).filter(value => value > 0 && Number.isFinite(value)) : [];
  const selected = Number(selectedGpvRatingA), pending = [], invalid = [];
  if (reverse.reverseCurrentA == null) pending.push("Isc y strings paralelos por MPPT");
  if (!(reverseLimit > 0)) pending.push("corriente inversa soportable del módulo según ficha");
  if (!(seriesFuseLimit > 0)) pending.push("máximo fusible serie del módulo según ficha");
  if (!ratings.length) pending.push("ratings gPV de ficha/producto y tensión nominal DC");
  const requiresProtection = reverse.reverseCurrentA != null && reverseLimit > 0 && reverse.reverseCurrentA > reverseLimit;
  if (requiresProtection) pending.push("la corriente inversa estimada supera el límite del módulo; OCPD/diodo y coordinación requeridos");
  let candidateRatingA = null;
  if (requiresProtection) {
    if (!(selected > 0)) pending.push("calibre gPV seleccionado desde ficha/producto");
    else {
      if (!ratings.includes(selected)) invalid.push("el calibre seleccionado no está en la lista gPV de ficha/producto");
      if (seriesFuseLimit > 0 && selected > seriesFuseLimit) invalid.push("calibre gPV supera el máximo fusible serie del módulo");
      if (conductor > 0 && selected > conductor) invalid.push("calibre gPV supera la ampacidad corregida del conductor");
      if (ratings.includes(selected) && !(seriesFuseLimit > 0 && selected > seriesFuseLimit) && !(conductor > 0 && selected > conductor)) candidateRatingA = selected;
    }
    pending.push("validar tensión DC, corriente interruptiva y curva/tiempo de fusión del gPV con ficha");
  }
  if (reverse.reverseCurrentA != null && reverseLimit > 0 && !requiresProtection) pending.push("confirmar la protección de sobrecorriente adicional que aplique por NTC 2050 y fabricante");
  return { reverseCurrentA: reverse.reverseCurrentA, requiresProtection, candidateRatingA, valid: false, status: invalid.length ? `NO CUMPLE: ${invalid.join("; ")}` : pending.length ? "VALIDACIÓN PENDIENTE" : "VALIDACIÓN PENDIENTE", pending: [...invalid, ...pending] };
}

/** Protección AC: además de criterios existentes, comprueba In ≥ Id e In ≤ ampacidad corregida. */
export function evaluateAcBreakerCoordination({ designCurrentA, breakerNominalCurrentA, conductorAmpacityA, faultCurrentKA, deviceBreakingCapacityKA, voltageRatingV, requiredVoltageV, poles, requiredPoles, tripCurve }) {
  const base = evaluateProtectionCandidate({ designCurrentA, conductorAmpacityA, faultCurrentKA, deviceBreakingCapacityKA, voltageRatingV, requiredVoltageV, poles, requiredPoles });
  const current = Number(designCurrentA), nominal = Number(breakerNominalCurrentA), ampacity = Number(conductorAmpacityA);
  const pending = [...base.pending], invalid = [];
  if (!(nominal > 0)) pending.push("calibre nominal real del interruptor (ficha)");
  else {
    if (current > nominal) invalid.push("corriente de diseño supera calibre nominal del interruptor");
    if (ampacity > 0 && nominal > ampacity) invalid.push("calibre nominal excede ampacidad corregida del conductor");
  }
  if (!(typeof tripCurve === "string" && tripCurve.trim())) pending.push("curva/característica según ficha y coordinación");
  const failures = [...base.pending.filter(item => item.startsWith("corriente supera") || item.startsWith("poder de corte inferior")), ...invalid];
  const uniquePending = pending.filter((item, index) => pending.indexOf(item) === index);
  return { valid: base.valid && uniquePending.length === 0 && failures.length === 0, status: failures.length ? `NO CUMPLE: ${failures.join("; ")}` : uniquePending.length ? "VALIDACIÓN PENDIENTE" : "Coordinación preliminar; verificar RETIE y ficha", pending: [...failures, ...uniquePending] };
}

/** El PE FV debe ser cobre (RETIE 3.17.21(h)); la sección proviene de NTC 2050 690.45/Tabla 250-122. */
export function validatePvEquipmentGroundingConductor({ material, tableSectionMm2 }) {
  const section = Number(tableSectionMm2);
  if (material !== "Cobre") return { sectionMm2: null, valid: false, status: "NO CUMPLE: RETIE 3.17.21(h) requiere cobre para PE de equipos FV" };
  if (!(section > 0)) return { sectionMm2: null, valid: null, status: "VALIDACIÓN PENDIENTE: NTC 2050 2.ª actualización 690.45 / Tabla 250-122 según OCPD" };
  return { sectionMm2: section, valid: null, status: "Sección ingresada tras consultar Tabla 250-122; cotejar NTC 690.45 y diseño" };
}

export function calculateArraySizing({ monthlyKwh, peakSunHours, performanceRatioPercent, panelWatts, manualEnabled = false, manualCount }) {
  const monthly = Number(monthlyKwh);
  const hsp = Number(peakSunHours);
  const pr = Number(performanceRatioPercent);
  const watts = Number(panelWatts);
  const validEnergyInputs = Number.isFinite(monthly) && monthly >= 0 &&
    Number.isFinite(hsp) && hsp > 0 && isValidPercent(pr) && Number.isFinite(watts) && watts > 0;
  const dailyKwh = validEnergyInputs ? monthly / 30 : null;
  const requiredWp = validEnergyInputs ? dailyKwh * 1000 / (hsp * pr / 100) : null;
  const automaticPanelCount = validEnergyInputs ? Math.ceil(requiredWp / watts) : null;
  const manual = Number(manualCount);
  const manualCountValid = Number.isInteger(manual) && manual > 0;
  const panelCount = manualEnabled ? (manualCountValid ? manual : null) : automaticPanelCount;
  return {
    dailyKwh, requiredWp, automaticPanelCount,
    panelCount,
    installedWp: panelCount == null ? null : panelCount * watts,
    validEnergyInputs,
    manualCountValid: !manualEnabled || manualCountValid
  };
}

/**
 * Asigna strings completos entre MPPT. Un string siempre tiene igual cantidad
 * de módulos en serie; no se acepta dejar módulos sin conectar.
 */
export function calculateStringLayout({ panelCount, modulesPerString, mpptCount, maxStringsPerMppt }) {
  const count = Number(panelCount);
  const series = Number(modulesPerString);
  const mppts = Number(mpptCount);
  const capacity = Number(maxStringsPerMppt);
  const validCount = Number.isInteger(count) && count > 0;
  const validSeries = Number.isInteger(series) && series > 0;
  const validMppts = Number.isInteger(mppts) && mppts > 0;
  const strings = validCount && validSeries && count % series === 0 ? count / series : null;
  const distribution = strings != null && validMppts
    ? Array.from({ length: mppts }, (_, index) => Math.floor(strings / mppts) + (index < strings % mppts ? 1 : 0))
    : [];
  const capacityValid = Number.isInteger(capacity) && capacity > 0;
  const capacityOk = strings != null && validMppts && capacityValid && distribution.every(value => value <= capacity);
  return {
    strings, distribution,
    modulesPerString: validSeries ? series : null,
    validCount, validSeries, validMppts, capacityValid, capacityOk,
    countDivisible: strings != null
  };
}
