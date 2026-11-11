/**
 * Normalized catalog sheet and data-quality helpers.
 * This module does not infer/verify specifications from legacy display text.
 */
export const CATALOG_DATA_STATES = Object.freeze({
  INSUFFICIENT: "SIN INFORMACIÓN TÉCNICA SUFICIENTE",
  INCOMPLETE: "FICHA TÉCNICA INCOMPLETA",
  VERIFIED: "FICHA TÉCNICA VERIFICADA",
  STRUCTURED: "FICHA TÉCNICA ESTRUCTURADA CON FUENTES",
  INVALID: "INVALIDO"
});

const field = (unit, { min = null, max = null, integer = false, enumValues = null, exclusiveMin = min === 0 } = {}) => ({ unit, min, max, integer, enumValues, exclusiveMin });

export const TECHNICAL_SCHEMAS = Object.freeze({
  "panel-solar": Object.freeze({
    pmaxW: field("W", { min: 0 }), vocV: field("V", { min: 0 }), vmpV: field("V", { min: 0 }), iscA: field("A", { min: 0 }), impA: field("A", { min: 0 }), efficiencyPercent: field("%", { min: 0, max: 100 }),
    vocTempCoefficientPercentPerC: field("%/°C"), vmpTempCoefficientPercentPerC: field("%/°C"), pmaxTempCoefficientPercentPerC: field("%/°C"), operatingTemperatureMinC: field("°C"), operatingTemperatureMaxC: field("°C"),
    maximumSeriesFuseA: field("A", { min: 0 }), maximumSystemVoltageV: field("V", { min: 0 }), technology: field("texto"), dimensionsLengthMm: field("mm", { min: 0 }), dimensionsWidthMm: field("mm", { min: 0 }), dimensionsHeightMm: field("mm", { min: 0 }), weightKg: field("kg", { min: 0 }), warrantyYears: field("años", { min: 0 }), warrantyConditions: field("texto"), datasheetPdfUrl: field("URL"), manufacturer: field("texto"), exactModel: field("texto"), exactReference: field("texto")
  }),
  inverter: Object.freeze({
    ratedAcPowerW: field("W", { min: 0 }), apparentPowerVA: field("VA", { min: 0 }), maximumPowerW: field("W", { min: 0 }), maximumOutputCurrentA: field("A", { min: 0 }), maximumOutputCurrentOptions: field("texto"), outputVoltageRange: field("texto"), powerFactorRange: field("texto"), overloadDurationSeconds: field("s", { min: 0 }), outputShortCircuitCurrentA: field("A", { min: 0 }), maximumPvPowerW: field("W", { min: 0 }), maximumDcVoltageV: field("V", { min: 0 }), nominalDcVoltageV: field("V", { min: 0 }), mpptVoltageMinV: field("V", { min: 0 }), mpptVoltageMaxV: field("V", { min: 0 }), startupVoltageV: field("V", { min: 0 }), mpptCount: field("MPPT", { min: 1, integer: true }), inputsPerMppt: field("entradas/MPPT", { min: 1, integer: true }), stringsPerMppt: field("lista"), maximumOperatingCurrentByMpptA: field("lista"), maximumShortCircuitCurrentByMpptA: field("lista"), maximumInputCurrentPerMpptA: field("A", { min: 0 }), maximumInputCurrentPerInputA: field("A", { min: 0 }), maximumShortCircuitCurrentPerMpptA: field("A", { min: 0 }), maximumShortCircuitCurrentPerInputA: field("A", { min: 0 }), outputVoltageV: field("V", { min: 0 }), outputPhases: field("fases", { min: 1, integer: true }), frequencyHz: field("Hz", { min: 0 }), efficiencyPercent: field("%", { min: 0, max: 100 }), weightedEfficiencyPercent: field("%", { min: 0, max: 100 }), operatingTemperatureMinC: field("°C"), operatingTemperatureMaxC: field("°C"), ingressProtection: field("texto"), coolingMethod: field("texto"), maximumAltitudeM: field("m", { min: 0 }), overloadCapacityPercent: field("%", { min: 0 }), startingPowerW: field("W", { min: 0 }), batteryCompatibility: field("texto"), batteryType: field("texto"), batteryVoltageMinV: field("V", { min: 0 }), batteryVoltageMaxV: field("V", { min: 0 }), maximumChargeCurrentA: field("A", { min: 0 }), maximumDischargeCurrentA: field("A", { min: 0 }), maximumChargePowerW: field("W", { min: 0 }), maximumDischargePowerW: field("W", { min: 0 }), bmsCommunication: field("texto"), batteryInputs: field("cantidad", { min: 1, integer: true }), integratedProtections: field("lista"), datasheetPdfUrl: field("URL"), manufacturer: field("texto"), exactModel: field("texto"), exactReference: field("texto")
  }),
  controller: Object.freeze({
    technology: field("texto", { enumValues: ["MPPT", "PWM"] }), maximumUnits: field("cantidad", { min: 1, integer: true }), nominalBatteryVoltageV: field("V", { min: 0 }), supportedBatteryVoltagesV: field("lista"), voltageDetectionMode: field("texto"), maximumPvInputVoltageV: field("V", { min: 0 }), maximumPvInputVoltageByBatteryVoltageV: field("tabla"), maximumPvInputVoltageAlternativesByBatteryVoltageV: field("tabla"), mpptOperatingVoltageMinV: field("V", { min: 0 }), mpptOperatingVoltageMaxV: field("V", { min: 0 }), mpptVoltageRangeByBatteryVoltageV: field("tabla"), mpptVoltageRangeAlternativesByBatteryVoltageV: field("tabla"), minimumStartupVoltageV: field("V", { min: 0 }), nominalPvOperatingVoltageV: field("V", { min: 0 }), maximumInputCurrentA: field("A", { min: 0 }), maximumShortCircuitCurrentA: field("A", { min: 0 }), maximumPvPowerW: field("W", { min: 0 }), maximumPvPowerByBatteryVoltageW: field("tabla"), numberOfInputs: field("cantidad", { min: 1, integer: true }), maximumInputCurrentPerInputA: field("A", { min: 0 }), maximumShortCircuitCurrentPerInputA: field("A", { min: 0 }), maximumChargeCurrentA: field("A", { min: 0 }), maximumChargeCurrentCondition: field("texto"), maximumChargePowerW: field("W", { min: 0 }), configurableChargeCurrentRangeA: field("texto"), chargingParametersConfigurable: field("boolean"), chargingSetPointsV: field("tabla"), temperatureCompensationCoefficient: field("texto"), efficiencyPercent: field("%", { min: 0, max: 100 }), mpptEfficiencyPercent: field("%", { min: 0, max: 100 }), compatibleBatteryTypes: field("lista"), lithiumCompatible: field("boolean"), leadAcidCompatible: field("boolean"), gelCompatible: field("boolean"), bmsCommunication: field("texto"), communicationProtocols: field("lista"), communicationInterfaces: field("lista"), compatibleInverterModels: field("lista"), batteryTemperatureSensor: field("boolean"), parallelChargingSupported: field("boolean"), protectionReversePolarity: field("boolean"), protectionShortCircuit: field("boolean"), protectionOverTemperature: field("boolean"), protectionOverVoltage: field("boolean"), protectionOverCurrent: field("boolean"), integratedProtections: field("lista"), operatingTemperatureMinC: field("°C"), operatingTemperatureMaxC: field("°C"), ingressProtection: field("texto"), coolingMethod: field("texto"), maximumAltitudeM: field("m", { min: 0 }), datasheetPdfUrl: field("URL"), manualUrl: field("URL"), manufacturer: field("texto"), exactModel: field("texto"), exactReference: field("texto")
  }),
  battery: Object.freeze({
    technology: field("texto"), nominalVoltageV: field("V", { min: 0 }), capacityAh: field("Ah", { min: 0 }), nominalEnergyWh: field("Wh", { min: 0 }), maximumDepthOfDischargePercent: field("%", { min: 0, max: 100 }), maximumChargeCurrentA: field("A", { min: 0 }), maximumDischargeCurrentA: field("A", { min: 0 }), peakCurrentA: field("A", { min: 0 }), peakDurationSeconds: field("s", { min: 0 }), integratedBms: field("boolean"), operatingVoltageMinV: field("V", { min: 0 }), operatingVoltageMaxV: field("V", { min: 0 }), seriesConnectionsAllowed: field("cantidad", { min: 1, integer: true }), parallelConnectionsAllowed: field("cantidad", { min: 1, integer: true }), communicationProtocols: field("lista"), compatibleInverters: field("lista"), cycleLife: field("ciclos", { min: 0 }), warrantyConditions: field("texto"), datasheetPdfUrl: field("URL"), manufacturer: field("texto"), exactModel: field("texto"), exactReference: field("texto")
  })
});

const CATEGORY_ALIASES = [
  ["panel-solar", /panel|módulo|modulo/i],
  ["inverter", /inversor/i],
  ["controller", /controlador/i],
  ["battery", /bater/i]
];

export function technicalCategoryFor(productOrCategory) {
  const category = typeof productOrCategory === "string" ? productOrCategory : productOrCategory?.category;
  const text = String(category || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return CATEGORY_ALIASES.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}

export function createEmptyTechnicalSheet(category) {
  const schema = TECHNICAL_SCHEMAS[category];
  if (!schema) return null;
  const fields = Object.fromEntries(Object.entries(schema).map(([key, definition]) => [key, { value: null, unit: definition.unit, source: null }]));
  return { schemaVersion: 1, category, source: null, fields };
}

function isPositiveNumericTable(value) {
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  if (Array.isArray(value)) return value.length > 0 && value.every(isPositiveNumericTable);
  if (value && typeof value === "object") return Object.keys(value).length > 0 && Object.values(value).every(isPositiveNumericTable);
  return false;
}

const REQUIRED_FOR_FUTURE_COMPARISON = Object.freeze({
  "panel-solar": ["pmaxW", "vocV", "vmpV", "iscA", "impA", "manufacturer", "exactModel", "exactReference"],
  inverter: ["ratedAcPowerW", "maximumPvPowerW", "maximumDcVoltageV", "mpptVoltageMinV", "mpptVoltageMaxV", "startupVoltageV", "mpptCount", "inputsPerMppt", "maximumInputCurrentPerMpptA", "maximumShortCircuitCurrentPerMpptA", "outputVoltageV", "outputPhases", "frequencyHz", "manufacturer", "exactModel", "exactReference"],
  controller: ["technology", "nominalBatteryVoltageV", "maximumPvInputVoltageV", "mpptOperatingVoltageMinV", "mpptOperatingVoltageMaxV", "maximumInputCurrentA", "maximumChargeCurrentA", "maximumPvPowerW", "manufacturer", "exactModel", "exactReference"],
  battery: ["technology", "nominalVoltageV", "capacityAh", "nominalEnergyWh", "maximumDepthOfDischargePercent", "maximumChargeCurrentA", "maximumDischargeCurrentA", "integratedBms", "manufacturer", "exactModel", "exactReference"]
});

export function validateTechnicalSheet(sheet) {
  const schema = TECHNICAL_SCHEMAS[sheet?.category];
  if (!schema || !sheet?.fields || typeof sheet.fields !== "object") return { status: CATALOG_DATA_STATES.INSUFFICIENT, missing: ["technical sheet schema"], invalid: [] };
  const missing = [], invalid = [];
  for (const [key, definition] of Object.entries(schema)) {
    const cell = sheet.fields[key];
    if (!cell || cell.value == null || cell.value === "") { missing.push(key); continue; }
    if (cell.unit !== definition.unit) { invalid.push({ key, reason: `unit must be ${definition.unit}` }); continue; }
    const value = cell.value;
    const numeric = ["W", "VA", "V", "A", "%", "%/°C", "°C", "mm", "kg", "m", "años", "MPPT", "entradas/MPPT", "fases", "Hz", "Ah", "Wh", "s", "cantidad", "ciclos"].includes(definition.unit);
    if (numeric && (typeof value !== "number" || !Number.isFinite(value) || (definition.min != null && (definition.exclusiveMin ? value <= definition.min : value < definition.min)) || (definition.max != null && value > definition.max) || (definition.integer && !Number.isInteger(value)))) invalid.push({ key, reason: "physically invalid or incorrectly typed numeric value" });
    else if (["texto", "URL"].includes(definition.unit) && (typeof value !== "string" || !value.trim())) invalid.push({ key, reason: "expected non-empty text" });
    else if (definition.unit === "URL" && !isHttpUrl(value)) invalid.push({ key, reason: "expected an HTTP(S) URL" });
    else if (definition.unit === "boolean" && typeof value !== "boolean") invalid.push({ key, reason: "expected boolean" });
    else if (definition.unit === "lista" && !Array.isArray(value)) invalid.push({ key, reason: "expected list" });
    else if (definition.unit === "tabla" && (!value || typeof value !== "object" || Array.isArray(value) || Object.values(value).some(entry => !isPositiveNumericTable(entry)))) invalid.push({ key, reason: "expected finite positive numeric table" });
    else if (definition.unit === "lista" && Array.isArray(value) && value.some(item => typeof item === "number" ? !Number.isFinite(item) || item <= 0 : typeof item !== "string" || !item.trim())) invalid.push({ key, reason: "list items must be finite positive numbers or non-empty text" });
    else if (["stringsPerMppt", "maximumOperatingCurrentByMpptA", "maximumShortCircuitCurrentByMpptA"].includes(key) && value.some(item => typeof item !== "number" || !Number.isFinite(item) || item <= 0 || (key === "stringsPerMppt" && !Number.isInteger(item)))) invalid.push({ key, reason: "expected list of finite positive values" });
    if (definition.enumValues && !definition.enumValues.includes(value)) invalid.push({ key, reason: "value outside allowed enumeration" });
    if (!cell.source || typeof cell.source !== "object" || !cell.source.manufacturer || !isHttpUrl(cell.source.documentUrl) || !cell.source.reviewDate || Number.isNaN(Date.parse(cell.source.reviewDate)) || !cell.source.exactVariant) invalid.push({ key, reason: "manufacturer, document URL, review date and exact variant are required for non-null technical data" });
  }
  for (const [minKey, maxKey] of [["operatingTemperatureMinC", "operatingTemperatureMaxC"], ["mpptVoltageMinV", "mpptVoltageMaxV"], ["mpptOperatingVoltageMinV", "mpptOperatingVoltageMaxV"], ["operatingVoltageMinV", "operatingVoltageMaxV"]]) {
    const min = sheet.fields[minKey]?.value, max = sheet.fields[maxKey]?.value;
    if (Number.isFinite(min) && Number.isFinite(max) && max < min) invalid.push({ key: maxKey, reason: `${maxKey} cannot be below ${minKey}` });
  }
  if(sheet.category==="controller") for(const [bank,range] of Object.entries(sheet.fields.mpptVoltageRangeByBatteryVoltageV?.value||{})) if(!Array.isArray(range)||range.length!==2||range[1]<range[0]) invalid.push({key:"mpptVoltageRangeByBatteryVoltageV",reason:`invalid MPPT range at ${bank} V bank`});
  const required = REQUIRED_FOR_FUTURE_COMPARISON[sheet.category] || [];
  const missingRequired = required.filter(key => sheet.fields[key]?.value == null || sheet.fields[key]?.value === "");
  const status = invalid.length ? CATALOG_DATA_STATES.INVALID : missingRequired.length ? CATALOG_DATA_STATES.INSUFFICIENT : CATALOG_DATA_STATES.STRUCTURED;
  return { status, missing: [...new Set([...missing, ...missingRequired])], invalid };
}

export function getTechnicalSheetStatus(sheet) {
  const assessment = validateTechnicalSheet(sheet);
  if (assessment.status === CATALOG_DATA_STATES.INVALID) return CATALOG_DATA_STATES.INVALID;
  const source = sheet?.source;
  if (!source || source.verificationStatus !== "VERIFIED_EXACT_VARIANT" || !source.manufacturer || !isHttpUrl(source.documentUrl) || !source.reviewDate || !source.exactVariant) return CATALOG_DATA_STATES.INSUFFICIENT;
  const hasSourcedTechnicalValue = Object.entries(sheet?.fields || {}).some(([key, cell]) => !["manufacturer", "exactModel", "exactReference", "datasheetPdfUrl"].includes(key) && cell?.value != null && cell?.value !== "");
  if (!hasSourcedTechnicalValue) return CATALOG_DATA_STATES.INSUFFICIENT;
  return assessment.status === CATALOG_DATA_STATES.INSUFFICIENT || assessment.missing.length || source.verificationNote ? CATALOG_DATA_STATES.INCOMPLETE : CATALOG_DATA_STATES.VERIFIED;
}

function isHttpUrl(value) {
  try { return ["http:", "https:"].includes(new URL(value).protocol); }
  catch { return false; }
}

/** Adds an empty, unit-bearing sheet while preserving every legacy commercial field verbatim. */
export function prepareCatalogProduct(product) {
  const category = technicalCategoryFor(product);
  const technicalSheet = createEmptyTechnicalSheet(category);
  const assessment = validateTechnicalSheet(technicalSheet);
  return {
    ...product,
    reference: product.reference ?? product.model ?? null,
    currency: product.currency ?? "COP",
    supplier: product.supplier ?? product.sourceName ?? null,
    commercialUrl: product.commercialUrl ?? product.source ?? null,
    technicalSheet,
    technicalDataStatus: getTechnicalSheetStatus(technicalSheet),
    technicalDataMissing: assessment.missing
  };
}

const panelSource = (manufacturer, documentUrl, documentTitle, revision, exactVariant, reviewDate = "2026-11-10", page = null, companionUrl = null) => ({
  manufacturer, documentUrl, documentTitle, page, revision, exactVariant, reviewDate,
  verificationStatus: "VERIFIED_EXACT_VARIANT",
  ...(companionUrl ? { companionUrl } : {})
});

function createSourcedPanel({ id, brand, model, exactModel, exactReference, technology, documentUrl, documentTitle, revision, values, companionUrl = null, fieldSources = {}, verificationNote = null }) {
  const source = { ...panelSource(brand, documentUrl, documentTitle, revision, exactReference, "2026-11-10", null, companionUrl), ...(verificationNote ? { verificationNote } : {}) };
  const sheet = createEmptyTechnicalSheet("panel-solar");
  sheet.source = source;
  for (const [key, value] of Object.entries({ ...values, manufacturer: brand, exactModel, exactReference, technology, datasheetPdfUrl: documentUrl })) {
    if (value == null || !sheet.fields[key]) continue;
    sheet.fields[key] = { value, unit: TECHNICAL_SCHEMAS["panel-solar"][key].unit, source: { ...source, ...(fieldSources[key] || {}) } };
  }
  const value = key => sheet.fields[key].value;
  return {
    id, brand, model, technology, source: documentUrl, sourceName: documentTitle,
    technicalSheet: sheet, technicalDataStatus: getTechnicalSheetStatus(sheet),
    watts: value("pmaxW"), voc: value("vocV"), vmp: value("vmpV"), isc: value("iscA"), imp: value("impA"), efficiency: value("efficiencyPercent")
  };
}

/** Manufacturer-sourced module records replacing the former duplicate inline panel list. */
export const panelCatalog = Object.freeze([
  createSourcedPanel({
    id: "longi580", brand: "LONGi", model: "LR5-72HGD-580M", exactModel: "LR5-72HGD-580M", exactReference: "LR5-72HGD-580M",
    technology: "Hi-MO 7, bifacial", documentUrl: "https://static.longi.com/L_Gi_LE_PM_T_PMD_059_F139_LR_5_72_HGD_560_590_M_V1_30_30_and_15_V19_3_EN_8fdcd1a7f4.pdf",
    documentTitle: "LONGi Hi-MO 7 LR5-72HGD 560–590M datasheet", revision: "V19.3 EN · 2024-07-22",
    values: { pmaxW: 580, vocV: 51.41, vmpV: 43.22, iscA: 14.22, impA: 13.42, efficiencyPercent: 22.5, vocTempCoefficientPercentPerC: -0.23, vmpTempCoefficientPercentPerC: null, pmaxTempCoefficientPercentPerC: -0.28, operatingTemperatureMinC: -40, operatingTemperatureMaxC: 85, maximumSeriesFuseA: 30, maximumSystemVoltageV: 1500, dimensionsLengthMm: 2278, dimensionsWidthMm: 1134, dimensionsHeightMm: 30, weightKg: 31.8, warrantyYears: 12, warrantyConditions: "12-year materials/workmanship; 30-year extra linear power output warranty" }
  }),
  createSourcedPanel({
    id: "ja595", brand: "JA Solar", model: "JAM72D40-595/GB", exactModel: "JAM72D40-595/GB", exactReference: "JAM72D40-595/GB",
    technology: "N-type bifacial", documentUrl: "https://www.jasolar.com/uploadfile/fujian/2024/0430/744e5be79d01284.pdf",
    documentTitle: "JA Solar JAM72D40-570–595/GB datasheet", revision: "Global-EN-20240428A",
    values: { pmaxW: 595, vocV: 52.58, vmpV: 44.64, iscA: 13.99, impA: 13.33, efficiencyPercent: 23, vocTempCoefficientPercentPerC: -0.25, vmpTempCoefficientPercentPerC: null, pmaxTempCoefficientPercentPerC: -0.29, operatingTemperatureMinC: -40, operatingTemperatureMaxC: 85, maximumSeriesFuseA: 30, maximumSystemVoltageV: 1500, dimensionsLengthMm: 2278, dimensionsWidthMm: 1134, dimensionsHeightMm: 30, weightKg: 31.8, warrantyYears: 12, warrantyConditions: "12-year product warranty; 30-year linear power output warranty" }
  }),
  createSourcedPanel({
    id: "trina630", brand: "Trina Solar", model: "TSM-NE19R-630", exactModel: "TSM-NE19R", exactReference: "TSM-NE19R 630 W bin (existing UI alias: TSM-NE19R-630)",
    technology: "N-type i-TOPCon", documentUrl: "https://static.trinasolar.com/sites/default/files/DT-M-0093%20APAC%20EN%20D%20Datasheet_Vertex_NE19R_600-630%202025_B_web.pdf",
    documentTitle: "Trina Solar TSM-NE19R 600–630 W datasheet", revision: "TSM_EN_2024_B",
    companionUrl: "https://www.trinasolar.com/es/NE19R.70/",
    values: { pmaxW: 630, vocV: 50.3, vmpV: 42, iscA: 15.94, impA: 15.01, efficiencyPercent: 23.3, vocTempCoefficientPercentPerC: -0.24, vmpTempCoefficientPercentPerC: null, pmaxTempCoefficientPercentPerC: -0.29, operatingTemperatureMinC: -40, operatingTemperatureMaxC: 85, maximumSeriesFuseA: 30, maximumSystemVoltageV: 1500, dimensionsLengthMm: 2382, dimensionsWidthMm: 1134, dimensionsHeightMm: 30, weightKg: 27.9, warrantyYears: 12, warrantyConditions: "12-year product warranty; 25-year power guarantee (datasheet warranty chart)" }
  }),
  createSourcedPanel({
    id: "canadian635", brand: "Canadian Solar", model: "CS6.2-66TM-635", exactModel: "CS6.2-66TM-635", exactReference: "CS6.2-66TM-635",
    technology: "TOPHiKu6, TOPCon", documentUrl: "https://static.csisolar.com/wp-content/uploads/sites/2/2025/04/28190508/CS-Datasheet-TOPHiKu6_CS6.2-66TM_v1.1C1_AUfinal.pdf",
    documentTitle: "CSI Solar TOPHiKu6 CS6.2-66TM datasheet", revision: "V1.1C1_AU · 2024-12",
    companionUrl: "https://www.canadiansolar.com/na/wp-content/uploads/sites/3/2026/01/CSA.pdf",
    verificationNote: "Conflicto pendiente: Voc/Vmp/Isc/Imp heredados coinciden con la tabla del certificado CSA oficial; la ficha PDF V1.1C1 publicada para la familia CS6.2-66TM muestra valores diferentes para el bin 635 W. Mantener diseño pendiente hasta confirmar revisión/mercado exactos con Canadian Solar.",
    fieldSources: Object.fromEntries(["pmaxW", "vocV", "vmpV", "iscA", "impA"].map(key => [key, {
      documentUrl: "https://www.canadiansolar.com/na/wp-content/uploads/sites/3/2026/01/CSA.pdf",
      documentTitle: "Canadian Solar CSA Group certificate 80039108, Project 802742",
      revision: "Certificate 80039108 / Project 802742; reviewed 2026-11-10"
    }])),
    values: { pmaxW: 635, vocV: 49.4, vmpV: 41.9, iscA: 16.22, impA: 15.18, efficiencyPercent: 23.5, vocTempCoefficientPercentPerC: -0.25, vmpTempCoefficientPercentPerC: null, pmaxTempCoefficientPercentPerC: -0.29, operatingTemperatureMinC: -40, operatingTemperatureMaxC: 85, maximumSeriesFuseA: 30, maximumSystemVoltageV: 1500, dimensionsLengthMm: 2382, dimensionsWidthMm: 1134, dimensionsHeightMm: 30, weightKg: 28.1, warrantyYears: 12, warrantyConditions: "12-year enhanced product warranty; 30-year linear power performance warranty" }
  })
]);

const inverterSource = (model, documentUrl, documentTitle, page) => ({
  manufacturer: "Deye", documentUrl, documentTitle, page, revision: "Edición oficial consultada 2026-11-10",
  reviewDate: "2026-11-10", exactVariant: model, verificationStatus: "VERIFIED_EXACT_VARIANT"
});

function createSourcedInverter({ id, model, documentUrl, documentTitle, page, values }) {
  const source = inverterSource(model, documentUrl, documentTitle, page);
  const sheet = createEmptyTechnicalSheet("inverter");
  sheet.source = source;
  for (const [key, value] of Object.entries({ ...values, datasheetPdfUrl: documentUrl, manufacturer: "Deye", exactModel: model, exactReference: model })) {
    if (value == null || !sheet.fields[key]) continue;
    sheet.fields[key] = { value, unit: TECHNICAL_SCHEMAS.inverter[key].unit, source: { ...source } };
  }
  return { id, brand: "Deye", model, technicalSheet: sheet, technicalDataStatus: getTechnicalSheetStatus(sheet) };
}

/** Exact manufacturer-source matches only; commercial price and imagery remain in App.jsx. */
export const inverterCatalog = Object.freeze([
  createSourcedInverter({
    id: "deye6k", model: "SUN-6K-SG01LP1-US",
    documentUrl: "https://www.deyeinverter.com/deyeinverter/2026/04/25/BDatasheetSUN-5-8K-SG01LP1-US20260424en.pdf",
    documentTitle: "Deye Split Phase Hybrid Inverter SUN-5/6/7.6/8K-SG01LP1-US datasheet",
    page: 2,
    values: { ratedAcPowerW: 6000, apparentPowerVA: 6600, maximumPvPowerW: 7800, maximumDcVoltageV: 500, nominalDcVoltageV: 370, mpptVoltageMinV: 150, mpptVoltageMaxV: 425, startupVoltageV: 125, mpptCount: 2, inputsPerMppt: null, stringsPerMppt: [2, 1], maximumOperatingCurrentByMpptA: [26, 13], maximumShortCircuitCurrentByMpptA: [44, 22], maximumOutputCurrentA: 27.5, outputVoltageRange: "120/240 V; 208 V, split-phase 2L+N+PE", maximumPowerW: 12000, overloadDurationSeconds: 10, startingPowerW: 12000, outputPhases: 1, frequencyHz: 60, powerFactorRange: "0.8 leading to 0.8 lagging", efficiencyPercent: 97.6, weightedEfficiencyPercent: 96.5, ingressProtection: "IP65", batteryCompatibility: "Plomo-ácido o ion-litio; estrategia Li-ion auto-adaptativa a BMS", batteryType: "Lead-acid or Lithium-ion", batteryVoltageMinV: 40, batteryVoltageMaxV: 60, maximumChargeCurrentA: 135, maximumDischargeCurrentA: 135, batteryInputs: 1, integratedProtections: ["DC reverse polarity", "AC output overcurrent", "thermal", "AC output overvoltage", "AC short circuit", "DC component monitoring", "anti-islanding", "DC switch", "insulation impedance", "residual current", "Type II DC/AC SPD", "AFCI optional"] }
  }),
  createSourcedInverter({
    id: "deye50kw-solartex", model: "SUN-50K-G04P3-EU-AM4-LV",
    documentUrl: "https://www.deyeinverter.com/deyeinverter/2026/02/27/%E3%80%90B%E3%80%91Manual_SUN-33-50K-G04P3-EU-AM4-LV_20260227_en.pdf",
    documentTitle: "Deye Grid-connected PV Inverter SUN-33-50K-G04P3-EU-AM4-LV user manual",
    page: 61,
    values: { ratedAcPowerW: 50000, apparentPowerVA: 50000, maximumPvPowerW: 75000, maximumDcVoltageV: 800, nominalDcVoltageV: 500, mpptVoltageMinV: 200, mpptVoltageMaxV: 700, startupVoltageV: 250, mpptCount: 4, inputsPerMppt: null, stringsPerMppt: [4, 4, 4, 4], maximumOperatingCurrentByMpptA: [40, 40, 40, 40], maximumShortCircuitCurrentByMpptA: [60, 60, 60, 60], maximumInputCurrentPerMpptA: 40, maximumShortCircuitCurrentPerMpptA: 60, maximumOutputCurrentA: null, maximumOutputCurrentOptions: "131.3 A at 127/220 V; 125.4 A at 133/230 V", outputVoltageRange: "127/220 V and 133/230 V", outputPhases: 3, frequencyHz: 60, powerFactorRange: "0.8 leading to 0.8 lagging", efficiencyPercent: 98.7, weightedEfficiencyPercent: 98.1, operatingTemperatureMinC: -25, operatingTemperatureMaxC: 60, maximumAltitudeM: 4000, integratedProtections: ["DC reverse polarity", "AC output overcurrent", "AC output overvoltage", "AC short circuit", "thermal", "insulation impedance", "DC component monitoring", "anti-islanding", "residual current", "DC switch", "Type II DC/AC SPD", "AFCI optional"] }
  })
]);

export function findExactCommercialInverterMatch(inverter, products = []) {
  if (!inverter?.brand || !inverter?.model) return null;
  const normalize = value => String(value).trim().toLowerCase().replace(/\s+/g, " ");
  return products.find(product => normalize(product.brand) === normalize(inverter.brand) && normalize(product.model) === normalize(inverter.model)) ?? null;
}

export function getInverterSelectionValues(inverter) {
  const fields = inverter?.technicalSheet?.fields;
  if (!fields) return null;
  const value = key => fields[key]?.value ?? "";
  const stringsPerMppt=fields.stringsPerMppt?.value;
  return {
    selectedInverterCatalogId: inverter.id,
    inverterW: value("ratedAcPowerW"), inverterMaxPvPower: value("maximumPvPowerW"), inverterMaxDcVoltage: value("maximumDcVoltageV"),
    mpptMinVoltage: value("mpptVoltageMinV"), mpptMaxVoltage: value("mpptVoltageMaxV"), inverterStartVoltage: value("startupVoltageV"),
    mpptCount: value("mpptCount"), inverterInputsPerMppt: value("inputsPerMppt"), modulesPerMppt: Array.isArray(stringsPerMppt)&&stringsPerMppt.length?Math.max(...stringsPerMppt):"",
    inverterMaxInputCurrent: value("maximumInputCurrentPerMpptA"), inverterMaxIsc: value("maximumShortCircuitCurrentPerMpptA"), inverterMaxAcCurrentA: value("maximumOutputCurrentA"),
    inverterMaxInputCurrentPerInput: value("maximumInputCurrentPerInputA"), inverterMaxIscPerInput: value("maximumShortCircuitCurrentPerInputA"),
    inverterSurgeW: value("maximumPowerW"), inverterSurgeDurationSec: value("overloadDurationSeconds"),
    inverterAcVoltage: value("outputVoltageV"), inverterType: inverter.id === "deye6k" ? "HÍBRIDO" : "ON-GRID",
    inverterEfficiency: value("weightedEfficiencyPercent")
  };
}

export function evaluateInverterBatteryLimits({ inverter, batteryVoltageV, chargeCurrentA, dischargeCurrentA } = {}) {
  const fields=inverter?.technicalSheet?.fields;
  if (!fields) return { status:"VALIDACION PENDIENTE", checks:[] };
  const checks=[];
  const compare=(name, actual, limit, comparator="max")=>{
    const supplied=actual!==undefined&&actual!==null&&actual!=="";
    if (supplied && (!Number.isFinite(Number(actual)) || Number(actual)<=0)) { checks.push({name,status:"INVALIDO"}); return; }
    if (!supplied || limit==null || limit==="") { checks.push({name,status:"VALIDACION PENDIENTE"}); return; }
    checks.push({name,status:comparator==="min"?Number(actual)>=Number(limit)?"CUMPLE":"NO CUMPLE":Number(actual)<=Number(limit)?"CUMPLE":"NO CUMPLE"});
  };
  const minV=fields.batteryVoltageMinV?.value,maxV=fields.batteryVoltageMaxV?.value;
  if (batteryVoltageV!==undefined&&batteryVoltageV!==null&&batteryVoltageV!==""&&(!Number.isFinite(Number(batteryVoltageV))||Number(batteryVoltageV)<=0)) checks.push({name:"Tension del banco",status:"INVALIDO"});
  else if (batteryVoltageV==null||batteryVoltageV===""||minV==null||maxV==null) checks.push({name:"Tension del banco",status:"VALIDACION PENDIENTE"});
  else checks.push({name:"Tension del banco",status:Number(batteryVoltageV)>=minV&&Number(batteryVoltageV)<=maxV?"CUMPLE":"NO CUMPLE"});
  compare("Corriente maxima de carga del inversor",chargeCurrentA,fields.maximumChargeCurrentA?.value);
  compare("Corriente maxima de descarga del inversor",dischargeCurrentA,fields.maximumDischargeCurrentA?.value);
  const status=checks.some(item=>item.status==="INVALIDO")?"INVALIDO":checks.some(item=>item.status==="NO CUMPLE")?"NO CUMPLE":checks.some(item=>item.status==="VALIDACION PENDIENTE")?"VALIDACION PENDIENTE":"CUMPLE";
  return {status,checks};
}

export function evaluateInverterMpptCurrentLimits({ inverter, stringsPerMppt, moduleImpA, moduleIscA } = {}) {
  const fields=inverter?.technicalSheet?.fields;
  if (!fields || !Array.isArray(stringsPerMppt)) return {status:"VALIDACION PENDIENTE",checks:[]};
  const checks=[];
  const operating=fields.maximumOperatingCurrentByMpptA?.value;
  const shortCircuit=fields.maximumShortCircuitCurrentByMpptA?.value;
  stringsPerMppt.forEach((count,index)=>{
    if (!Number.isInteger(count)||count<0||!Number.isFinite(Number(moduleImpA))||Number(moduleImpA)<=0||!Number.isFinite(Number(moduleIscA))||Number(moduleIscA)<=0) {
      checks.push({mppt:index+1,kind:"Corriente",status:"INVALIDO"}); return;
    }
    for (const [kind,limits,moduleCurrent] of [["Imp",operating,Number(moduleImpA)],["Isc",shortCircuit,Number(moduleIscA)]]) {
      const limit=Array.isArray(limits)?limits[index]:null;
      checks.push({mppt:index+1,kind,status:count===0?"VALIDACION PENDIENTE":limit==null?"VALIDACION PENDIENTE":count*moduleCurrent<=limit?"CUMPLE":"NO CUMPLE",calculatedA:count*moduleCurrent,limitA:limit??null});
    }
  });
  const status=checks.some(item=>item.status==="INVALIDO")?"INVALIDO":checks.some(item=>item.status==="NO CUMPLE")?"NO CUMPLE":checks.some(item=>item.status==="VALIDACION PENDIENTE")?"VALIDACION PENDIENTE":"CUMPLE";
  return {status,checks};
}

const controllerSource={manufacturer:"MUST",documentUrl:"https://www.mustsolar.com/product/pc1800f-series-60-80-100a/",documentTitle:"MUST PC1800F Series (60/80/100A) official product specifications",page:null,revision:"Manufacturer product page reviewed 2026-11-10",reviewDate:"2026-11-10",exactVariant:"PC18-8025F (80 A)",verificationStatus:"VERIFIED_EXACT_VARIANT",companionUrl:"https://www.mustsolar.cn/wp-content/uploads/2015/03/PC-PC1800F-145V.pdf",verificationNote:"Official-source discrepancy: the current mustsolar.com page states 245 V maximum / MPPT up to 230 V for PC18-8025F, while the official mustsolar.cn PC1800F-145V PDF lists the same model codes with 145 V maximum / MPPT up to 130 V. Confirm hardware revision/nameplate before relying on the conflicting voltage values."};
const controllerFields={
  technology:"MPPT", maximumUnits:null, nominalBatteryVoltageV:null, supportedBatteryVoltagesV:[12,24,36,48], voltageDetectionMode:"12/24/48 V auto-detection; 36 V setting",
  maximumPvInputVoltageV:245, maximumPvInputVoltageByBatteryVoltageV:{12:100,24:245,36:245,48:245}, maximumPvInputVoltageAlternativesByBatteryVoltageV:{12:[100,100],24:[245,145],36:[245,145],48:[245,145]},
  mpptOperatingVoltageMinV:null, mpptOperatingVoltageMaxV:null, mpptVoltageRangeByBatteryVoltageV:{12:[15,95],24:[30,230],36:[45,230],48:[60,230]}, mpptVoltageRangeAlternativesByBatteryVoltageV:{12:[[15,95],[15,95]],24:[[30,230],[30,130]],36:[[45,230],[45,130]],48:[[60,230],[60,130]]},
  minimumStartupVoltageV:null, nominalPvOperatingVoltageV:null, maximumInputCurrentA:null, maximumShortCircuitCurrentA:null, maximumPvPowerW:null,
  maximumPvPowerByBatteryVoltageW:{12:1250,24:2500,36:3750,48:5000}, numberOfInputs:null, maximumInputCurrentPerInputA:null, maximumShortCircuitCurrentPerInputA:null,
  maximumChargeCurrentA:80, maximumChargeCurrentCondition:"80 A continuous at 40 °C ambient", maximumChargePowerW:null, configurableChargeCurrentRangeA:null, chargingParametersConfigurable:true,
  chargingSetPointsV:{12:{floodedAbsorption:14.2,floodedFloat:13.7,agmAbsorption:14.4,agmFloat:13.7,overcharge:15.5,recovery:14.5,batteryDefect:10},24:{floodedAbsorption:28.4,floodedFloat:27.4,agmAbsorption:28.8,agmFloat:27.4,overcharge:30,recovery:29.5,batteryDefect:17},36:{floodedAbsorption:42.6,floodedFloat:41.1,agmAbsorption:43.2,agmFloat:41.1,overcharge:45,recovery:44.5,batteryDefect:25.5},48:{floodedAbsorption:56.8,floodedFloat:54.8,agmAbsorption:57.6,agmFloat:54.8,overcharge:60,recovery:59,batteryDefect:34}},
  temperatureCompensationCoefficient:"-5 mV/°C/cell (25°C reference)", efficiencyPercent:98, mpptEfficiencyPercent:99,
  compatibleBatteryTypes:["Lithium-ion","Gel","Lead-acid"], lithiumCompatible:true, leadAcidCompatible:true, gelCompatible:true, bmsCommunication:null, communicationProtocols:null, communicationInterfaces:["RS485","USB"], compatibleInverterModels:null,
  batteryTemperatureSensor:true, parallelChargingSupported:true, protectionReversePolarity:true, protectionShortCircuit:true, protectionOverTemperature:true, protectionOverVoltage:true, protectionOverCurrent:null,
  integratedProtections:["PV array short circuit","PV reverse polarity","battery reverse polarity","overcharging","output short circuit","solar high-voltage disconnect/reconnect","battery high-voltage disconnect/reconnect","high-temperature disconnect/reconnect"],
  operatingTemperatureMinC:-10, operatingTemperatureMaxC:55, ingressProtection:"IP20", coolingMethod:"Fan cooling", maximumAltitudeM:3000,
  datasheetPdfUrl:controllerSource.documentUrl, manualUrl:null, manufacturer:"MUST", exactModel:"PC18-8025F", exactReference:"PC18-8025F"
};

function createSourcedController() {
  const technicalSheet=createEmptyTechnicalSheet("controller"); technicalSheet.source={...controllerSource};
  for(const [key,value] of Object.entries(controllerFields)) if(value!=null) technicalSheet.fields[key]={value,unit:TECHNICAL_SCHEMAS.controller[key].unit,source:{...controllerSource}};
  return {id:"must80",brand:"MUST",model:"PC18-8025F",technology:"MPPT",technicalSheet,technicalDataStatus:getTechnicalSheetStatus(technicalSheet)};
}

/** Only an exact commercial model with official manufacturer-source data is listed here. */
export const controllerCatalog=Object.freeze([createSourcedController()]);

export function findExactCommercialControllerMatch(controller, products=[]) {
  if(!controller?.brand||!controller?.model)return null;
  const normalize=value=>String(value).trim().toLowerCase().replace(/\s+/g," ");
  return products.find(product=>normalize(product.brand)===normalize(controller.brand)&&normalize(product.model)===normalize(controller.model))??null;
}

export function getControllerSelectionValues(controller) {
  if(!controller?.technicalSheet?.fields)return null;
  const value=key=>controller.technicalSheet.fields[key]?.value??"";
  return {selectedControllerCatalogId:controller.id,controllerMode:"Controlador externo",controllerMaxPvVoltage:"",controllerMpptMinVoltage:"",controllerMpptMaxVoltage:"",controllerMaxPvPower:"",controllerMaxChargeCurrent:value("maximumChargeCurrentA")};
}

export function evaluateControllerCompatibility({controller,design={}}={}) {
  const fields=controller?.technicalSheet?.fields;
  if(!fields)return {status:"VALIDACION PENDIENTE",checks:[]};
  const checks=[]; const add=(name,status,detail="")=>checks.push({name,status,detail});
  const numeric=(key)=>fields[key]?.value;
  const bank=design.batteryVoltageV;
  if(bank!==undefined&&bank!==null&&bank!==""&&(!Number.isFinite(Number(bank))||Number(bank)<=0)) add("Tensión del banco","INVALIDO");
  const bankKey=Number.isFinite(Number(bank))&&Number(bank)>0?String(Number(bank)):null;
  const bankList=numeric("supportedBatteryVoltagesV");
  if(!bankKey||!Array.isArray(bankList))add("Tensión nominal admitida","VALIDACION PENDIENTE");
  else if(!bankList.includes(Number(bankKey)))add("Tensión nominal admitida","NO CUMPLE");
  else add("Tensión nominal admitida","CUMPLE");
  const maxPvVoltage=numeric("maximumPvInputVoltageByBatteryVoltageV")?.[bankKey];
  const compare=(name,actual,limit,rule)=>{
    if(actual!==undefined&&actual!==null&&actual!==""&&(!Number.isFinite(Number(actual))||Number(actual)<=0)){add(name,"INVALIDO");return;}
    if(actual==null||actual===""||limit==null){add(name,"VALIDACION PENDIENTE");return;}
    add(name,rule(Number(actual),Number(limit))?"CUMPLE":"NO CUMPLE",`${actual} vs ${limit}`);
  };
  const compareAlternatives=(name,actual,limits,rule)=>{
    if(actual!==undefined&&actual!==null&&actual!==""&&(!Number.isFinite(Number(actual))||Number(actual)<=0)){add(name,"INVALIDO");return;}
    if(actual==null||actual===""||!Array.isArray(limits)||!limits.length){add(name,"VALIDACION PENDIENTE");return;}
    const outcomes=limits.map(limit=>rule(Number(actual),Number(limit)));
    if(outcomes.every(Boolean))add(name,"CUMPLE",`${actual} pasa todos los valores publicados`);
    else if(outcomes.every(value=>!value))add(name,"NO CUMPLE",`${actual} falla todos los valores publicados`);
    else add(name,"VALIDACION PENDIENTE","Las fuentes oficiales discrepan; confirmar revisión/placa del equipo.");
  };
  const maxVoltageAlternatives=numeric("maximumPvInputVoltageAlternativesByBatteryVoltageV")?.[bankKey];
  compareAlternatives("Voc fría vs tensión FV máxima",design.stringVocColdV,maxVoltageAlternatives|| (maxPvVoltage==null?null:[maxPvVoltage]),(a,b)=>a<=b);
  compare("Tensión de arranque del controlador",design.stringVocHotV,numeric("minimumStartupVoltageV"),(a,b)=>a>=b);
  compare("Tensión de arranque del controlador",design.stringVocHotV,numeric("minimumStartupVoltageV"),(a,b)=>a>=b);
  const mpptRange=numeric("mpptVoltageRangeByBatteryVoltageV")?.[bankKey];
  if(design.stringVmpHotV!==undefined&&design.stringVmpHotV!=null&&(!Number.isFinite(Number(design.stringVmpHotV))||Number(design.stringVmpHotV)<=0))add("Vmp caliente vs ventana MPPT","INVALIDO");
  else if(design.stringVmpColdV!==undefined&&design.stringVmpColdV!=null&&(!Number.isFinite(Number(design.stringVmpColdV))||Number(design.stringVmpColdV)<=0))add("Vmp fría vs ventana MPPT","INVALIDO");
  else if(design.stringVmpHotV==null||design.stringVmpColdV==null)add("Ventana MPPT por temperatura","VALIDACION PENDIENTE");
  else {
    const ranges=numeric("mpptVoltageRangeAlternativesByBatteryVoltageV")?.[bankKey] || (Array.isArray(mpptRange)?[mpptRange]:null);
    if(!Array.isArray(ranges)||!ranges.length)add("Ventana MPPT por temperatura","VALIDACION PENDIENTE");
    else {
      const outcomes=ranges.map(range=>Number(design.stringVmpHotV)>=range[0]&&Number(design.stringVmpColdV)<=range[1]);
      if(outcomes.every(Boolean))add("Ventana MPPT por temperatura","CUMPLE",`Vmp caliente/fría ${design.stringVmpHotV}/${design.stringVmpColdV} V; cumple todos los rangos publicados`);
      else if(outcomes.every(value=>!value))add("Ventana MPPT por temperatura","NO CUMPLE",`Vmp caliente/fría ${design.stringVmpHotV}/${design.stringVmpColdV} V; incumple todos los rangos publicados`);
      else add("Ventana MPPT por temperatura","VALIDACION PENDIENTE","Las fuentes oficiales discrepan; confirmar revisión/placa del equipo.");
    }
  }
  compare("Potencia FV a tensión de banco",design.installedWp,numeric("maximumPvPowerByBatteryVoltageW")?.[bankKey],(a,b)=>a<=b);
  compare("Corriente de operación de entrada FV",design.inputCurrentA,numeric("maximumInputCurrentA"),(a,b)=>a<=b);
  compare("Corriente Isc corregida máxima de entrada FV",design.inputShortCircuitCurrentCorrected===true?design.inputShortCircuitCurrentA:null,numeric("maximumShortCircuitCurrentA"),(a,b)=>a<=b);
  compare("Cantidad de entradas FV",design.stringCount,numeric("numberOfInputs"),(a,b)=>a<=b);
  compare("Corriente de carga de batería",design.chargeCurrentA,numeric("maximumChargeCurrentA"),(a,b)=>a<=b);
  compare("Potencia máxima de carga",design.chargePowerW,numeric("maximumChargePowerW"),(a,b)=>a<=b);
  const chemistry=String(design.batteryChemistry||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const lithium=/lithium|litio|lifepo|lfp/.test(chemistry),lead=/plomo|lead|agm|flood/.test(chemistry),gel=/gel/.test(chemistry);
  const compatible=lithium?numeric("lithiumCompatible"):lead?numeric("leadAcidCompatible"):gel?numeric("gelCompatible"):null;
  if(!chemistry||/especificar|select|^$/.test(chemistry))add("Tipo de batería admitido","VALIDACION PENDIENTE");
  else if(compatible==null)add("Tipo de batería admitido","VALIDACION PENDIENTE");
  else add("Tipo de batería admitido",compatible?"CUMPLE":"NO CUMPLE");
  if(lithium)add("BMS/protocolo de batería de litio",numeric("bmsCommunication")?"VALIDACION PENDIENTE":"VALIDACION PENDIENTE","El fabricante declara carga de ion-litio pero no identifica protocolo BMS para esta referencia.");
  else if(!chemistry)add("BMS/protocolo de batería","VALIDACION PENDIENTE");
  if(design.inverterModel)add("Compatibilidad específica con inversor",Array.isArray(numeric("compatibleInverterModels"))?"CUMPLE":"VALIDACION PENDIENTE","No se aportó una lista oficial de modelos de inversor compatibles.");
  if(Number(design.controllerUnits)>1)add("Paralelo de controladores",numeric("parallelChargingSupported")===true?"VALIDACION PENDIENTE":"NO CUMPLE","Se declara carga en paralelo, pero no el número máximo de unidades.");
  const status=checks.some(item=>item.status==="INVALIDO")?"INVALIDO":checks.some(item=>item.status==="NO CUMPLE")?"NO CUMPLE":checks.some(item=>item.status==="VALIDACION PENDIENTE")?"VALIDACION PENDIENTE":"CUMPLE";
  return {status,checks};
}

export function getPanelSelectionValues(panel) {
  const fields = panel?.technicalSheet?.fields;
  if (!fields) return null;
  const value = key => fields[key]?.value ?? "";
  return {
    panelCatalogId: panel.id,
    panelBrand: value("manufacturer"), panelModel: panel.model,
    panelW: value("pmaxW"), panelVoc: value("vocV"), panelVmp: value("vmpV"), panelIsc: value("iscA"), panelImp: value("impA"), panelMaxSeriesFuse: value("maximumSeriesFuseA"),
    vocTempCoefficient: value("vocTempCoefficientPercentPerC"), vmpTempCoefficient: value("vmpTempCoefficientPercentPerC"), panelPmaxTempCoefficient: value("pmaxTempCoefficientPercentPerC"),
    panelMaximumSystemVoltage: value("maximumSystemVoltageV"), panelTechnicalSource: panel.source, panelTechnicalStatus: panel.technicalDataStatus
  };
}

export function correctPanelVoltageAtTemperature({ nominalVoltageV, coefficientPercentPerC, temperatureC, referenceTemperatureC = 25 }) {
  const voltage = Number(nominalVoltageV), coefficient = Number(coefficientPercentPerC), temperature = Number(temperatureC);
  if (nominalVoltageV == null || nominalVoltageV === "" || coefficientPercentPerC == null || coefficientPercentPerC === "" || temperatureC == null || temperatureC === "" || !Number.isFinite(voltage) || voltage <= 0 || !Number.isFinite(coefficient) || !Number.isFinite(temperature) || !Number.isFinite(referenceTemperatureC)) return null;
  // Same linear STC correction used by the existing engine: V(T)=V25[1+β(T−25)].
  return voltage * Math.max(0, 1 + coefficient / 100 * (temperature - referenceTemperatureC));
}

export function evaluatePanelStringVoltageLimits({ stringVocColdV, stringVocHotV, stringVmpColdV, stringVmpHotV, moduleMaximumSystemVoltageV, maximumDcVoltageV, mpptMinVoltageV, mpptMaxVoltageV, startupVoltageV }) {
  const finitePositive = value => Number.isFinite(Number(value)) && Number(value) > 0;
  return {
    maximumDcVoltage: finitePositive(stringVocColdV) && finitePositive(maximumDcVoltageV) ? Number(stringVocColdV) <= Number(maximumDcVoltageV) : null,
    moduleSystemVoltage: finitePositive(stringVocColdV) && finitePositive(moduleMaximumSystemVoltageV) ? Number(stringVocColdV) <= Number(moduleMaximumSystemVoltageV) : null,
    mpptRange: finitePositive(stringVmpColdV) && finitePositive(stringVmpHotV) && finitePositive(mpptMinVoltageV) && finitePositive(mpptMaxVoltageV) ? Number(stringVmpHotV) >= Number(mpptMinVoltageV) && Number(stringVmpColdV) <= Number(mpptMaxVoltageV) : null,
    startup: finitePositive(stringVocHotV) && finitePositive(startupVoltageV) ? Number(stringVocHotV) >= Number(startupVoltageV) : null
  };
}

export function findExactCommercialPanelMatch(panel, products = []) {
  if (!panel?.brand || !panel?.model) return null;
  const normalize = value => String(value).trim().toLowerCase().replace(/\s+/g, " ");
  return products.find(product => normalize(product.brand) === normalize(panel.brand) && normalize(product.model) === normalize(panel.model)) ?? null;
}

/** Stable interface for later category-specific comparisons; no recommendation is made in this stage. */
export function getFutureComparisonInputs(category) {
  const groups = {
    "panel-solar": ["generatorArray", "stringLayout", "temperatureLimits"],
    inverter: ["architecture", "stringsAndMppts", "simultaneousDemand", "startingDemand", "batteryBank"],
    controller: ["generatorArray", "batteryBank"],
    battery: ["batteryVoltage", "requiredCapacity", "chargeAndDischargeCurrents", "bmsAndInverterCompatibility"]
  };
  return groups[category] ? [...groups[category]] : [];
}

export function findDuplicateCatalogIds(products = []) {
  const seen = new Set(), duplicates = new Set();
  for (const product of products) {
    if (!product?.id) continue;
    if (seen.has(product.id)) duplicates.add(product.id);
    seen.add(product.id);
  }
  return [...duplicates];
}
