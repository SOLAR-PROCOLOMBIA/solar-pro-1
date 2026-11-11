import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calculateArraySizing, calculateStringLayout, calculateBatteryNominalEnergy, calculateInverterBatteryCurrent, calculatePvChargeCurrent, calculateConductorRun, calculateValidatedConductorRun, calculateAdiabaticSection, evaluateProtectionCandidate, evaluateAcBreakerCoordination, calculateAcCumulativeVoltageDrop, calculateAcDesignCurrent, calculatePvReverseCurrent, evaluateGpvFuse, validatePvEquipmentGroundingConductor, mergeProjectDefaults, buildElectricalCircuitModel, buildElectricalBOMRows, resolveMpptCircuitDistance, buildExternalProtectionRows, validateNumericInputs, resolveEngineeringState, validateAmpacityReference, evaluateProductCompatibility, calculateBudgetTotals, buildEngineeringStateModel, ENGINEERING_STATES } from "./engineering.js";
import { CATALOG_DATA_STATES, TECHNICAL_SCHEMAS, createEmptyTechnicalSheet, validateTechnicalSheet, getTechnicalSheetStatus, prepareCatalogProduct, technicalCategoryFor, getFutureComparisonInputs, findDuplicateCatalogIds, panelCatalog, inverterCatalog, controllerCatalog, getInverterSelectionValues, evaluateInverterBatteryLimits, evaluateInverterMpptCurrentLimits, getControllerSelectionValues, evaluateControllerCompatibility, findExactCommercialControllerMatch, findExactCommercialInverterMatch, getPanelSelectionValues, correctPanelVoltageAtTemperature, evaluatePanelStringVoltageLimits, findExactCommercialPanelMatch } from "./catalog.js";

test("battery capacity uses DoD and inverter efficiency, not PV performance ratio", () => {
  const result = calculateBatteryNominalEnergy({
    dailyKwh: 10, autonomyDays: 1, depthOfDischargePercent: 80, inverterEfficiencyPercent: 95, batteryDischargeEfficiencyPercent: 96
  });
  assert.ok(Math.abs(result - 13.7061403509) < 1e-8);
});

test("grid connected system does not size a battery", () => {
  assert.equal(calculateBatteryNominalEnergy({
    dailyKwh: 10, autonomyDays: 2, depthOfDischargePercent: 80, inverterEfficiencyPercent: 95, gridOnly: true
  }), 0);
});

test("battery discharge current accounts for inverter efficiency", () => {
  const result = calculateInverterBatteryCurrent({ inverterPowerW: 5000, batteryVoltageV: 48, inverterEfficiencyPercent: 95 });
  assert.ok(Math.abs(result - 109.649122807) < 1e-8);
});

test("invalid efficiency and depth of discharge are rejected", () => {
  for (const invalid of [0, -1, 100.01, NaN]) {
    assert.equal(calculateBatteryNominalEnergy({
      dailyKwh: 10, autonomyDays: 1, depthOfDischargePercent: 80,
      inverterEfficiencyPercent: invalid, batteryDischargeEfficiencyPercent: 96
    }), null);
    assert.equal(calculateInverterBatteryCurrent({
      inverterPowerW: 5000, batteryVoltageV: 48, inverterEfficiencyPercent: invalid
    }), null);
    assert.equal(calculateBatteryNominalEnergy({
      dailyKwh: 10, autonomyDays: 1, depthOfDischargePercent: invalid,
      inverterEfficiencyPercent: 95, batteryDischargeEfficiencyPercent: 96
    }), null);
  }
});

test("PV charge path efficiency replaces the former fixed 0.95 factor", () => {
  assert.equal(calculatePvChargeCurrent({ installedWp: 5000, batteryVoltageV: 50, chargePathEfficiencyPercent: 95 }), 95);
  assert.equal(calculatePvChargeCurrent({ installedWp: 5000, batteryVoltageV: 50, chargePathEfficiencyPercent: 0 }), null);
});

test("old projects inherit blank pending values when new manufacturer data is absent", () => {
  const initial = { inverterEfficiency: "", batteryDischargeEfficiency: "", pvChargePathEfficiency: "" };
  const oldProject = { monthlyKwh: 300, inverterW: 5000 };
  const loaded = mergeProjectDefaults(initial, oldProject);
  assert.equal(loaded.inverterEfficiency, "");
  assert.equal(loaded.batteryDischargeEfficiency, "");
  assert.equal(loaded.monthlyKwh, 300);
});

test("specified solar demand produces five LONGi 580 W modules and 2.90 kWp", () => {
  const result = calculateArraySizing({
    monthlyKwh: 300, peakSunHours: 5.27, performanceRatioPercent: 80,
    panelWatts: 580
  });
  assert.equal(result.dailyKwh, 10);
  assert.equal(result.automaticPanelCount, 5);
  assert.equal(result.panelCount, 5);
  assert.equal(result.installedWp, 2900);
});

test("manual module count persists through project save/open merge and recalculation", () => {
  const defaults = { manualPanelCountEnabled: false, manualPanelCount: "", panelW: 580 };
  const projectBeforeSave = { ...defaults, manualPanelCountEnabled: true, manualPanelCount: "5", monthlyKwh: 300 };
  const persistedProject = JSON.parse(JSON.stringify(projectBeforeSave));
  const reopenedProject = mergeProjectDefaults(defaults, persistedProject);
  const recalculated = calculateArraySizing({
    monthlyKwh: reopenedProject.monthlyKwh, peakSunHours: 5.27,
    performanceRatioPercent: 80, panelWatts: reopenedProject.panelW,
    manualEnabled: reopenedProject.manualPanelCountEnabled,
    manualCount: reopenedProject.manualPanelCount
  });
  assert.equal(reopenedProject.manualPanelCount, "5");
  assert.equal(recalculated.panelCount, 5);
  assert.equal(recalculated.installedWp, 2900);
  const afterRecalculation = calculateArraySizing({
    monthlyKwh: 600, peakSunHours: 5.27, performanceRatioPercent: 80,
    panelWatts: reopenedProject.panelW, manualEnabled: reopenedProject.manualPanelCountEnabled,
    manualCount: reopenedProject.manualPanelCount
  });
  assert.equal(afterRecalculation.automaticPanelCount, 9);
  assert.equal(afterRecalculation.panelCount, 5);
});

test("manual module count must be a positive integer", () => {
  for (const invalid of ["", "0", "4.5", "-2"]) {
    const result = calculateArraySizing({
      monthlyKwh: 300, peakSunHours: 5.27, performanceRatioPercent: 80,
      panelWatts: 580, manualEnabled: true, manualCount: invalid
    });
    assert.equal(result.panelCount, null);
    assert.equal(result.manualCountValid, false);
  }
});

test("string layout balances complete equal-length strings across MPPT and rejects leftover modules", () => {
  assert.deepEqual(calculateStringLayout({ panelCount: 12, modulesPerString: 3, mpptCount: 2, maxStringsPerMppt: 2 }).distribution, [2, 2]);
  assert.equal(calculateStringLayout({ panelCount: 5, modulesPerString: 2, mpptCount: 2, maxStringsPerMppt: 2 }).countDivisible, false);
  assert.equal(calculateStringLayout({ panelCount: 8, modulesPerString: 2, mpptCount: 2, maxStringsPerMppt: 1 }).capacityOk, false);
});

test("DC string conductor uses its own current, copper temperature correction, and commercial section", () => {
  const result = calculateConductorRun({ currentA: 12, voltageV: 400, distanceOneWayM: 20, dropPercent: 2, material: "Cobre", ambientTemperatureC: 40, phaseSystem: "dc" });
  const rho40 = 0.0175 * (1 + 0.00393 * 20);
  assert.ok(Math.abs(result.calculatedAreaMm2 - 2 * rho40 * 20 * 12 / 8) < 1e-10);
  assert.equal(result.commercialSectionMm2, 1.5);
  assert.ok(result.voltageDropPercent < 2);
  assert.equal(result.ampacityPass, null);
});

test("single-phase and three-phase voltage drop use distinct loop factors", () => {
  const common = { currentA: 10, voltageV: 230, distanceOneWayM: 30, dropPercent: 3, ambientTemperatureC: 20, material: "Cobre", powerFactor: 0.9 };
  const single = calculateConductorRun({ ...common, phaseSystem: "single-phase" });
  const three = calculateConductorRun({ ...common, phaseSystem: "three-phase" });
  assert.ok(Math.abs(three.calculatedAreaMm2 / single.calculatedAreaMm2 - Math.sqrt(3) / 2) < 1e-12);
});

test("ampacity correction rejects invalid factors and marks insufficient corrected ampacity", () => {
  const result = calculateConductorRun({ currentA: 20, voltageV: 230, distanceOneWayM: 10, dropPercent: 3, ambientTemperatureC: 25, installationMethod: "Tubería", baseAmpacityA: 30, temperatureFactor: 0.8, groupingFactor: 0.75 });
  assert.equal(result.correctedAmpacityA, 18);
  assert.equal(result.ampacityPass, false);
  const invalid = calculateConductorRun({ currentA: 20, voltageV: 230, distanceOneWayM: 10, dropPercent: 3, ambientTemperatureC: 25, installationMethod: "Tubería", baseAmpacityA: 30, temperatureFactor: 1.2, groupingFactor: 0.75 });
  assert.equal(invalid.correctedAmpacityA, null);
  assert.equal(invalid.correctedAmpacityA, null);
  assert.ok(invalid.status.includes("VALIDACIÓN PENDIENTE"));
});

test("invalid or absent conductor inputs stay pending instead of receiving a computational minimum", () => {
  assert.equal(calculateConductorRun({ currentA: 10, voltageV: 48, distanceOneWayM: "", dropPercent: 2, ambientTemperatureC: 30 }).calculatedAreaMm2, null);
  assert.equal(calculateConductorRun({ currentA: 10, voltageV: 48, distanceOneWayM: 10, dropPercent: 2, ambientTemperatureC: "" }).calculatedAreaMm2, null);
});

test("PE adiabatic area requires Icc, clearing time, and material factor", () => {
  const result = calculateAdiabaticSection({ faultCurrentA: 1000, clearingTimeSeconds: 0.2, kFactor: 115, material: "Cobre", insulation: "PVC", initialTemperatureC: 70, finalTemperatureC: 160, kSource: "Ficha/tabla del conductor" });
  assert.ok(Math.abs(result.areaMm2 - (1000 * Math.sqrt(0.2) / 115)) < 1e-12);
  assert.equal(result.commercialSectionMm2, 4);
  assert.equal(calculateAdiabaticSection({ faultCurrentA: 1000, clearingTimeSeconds: "", kFactor: 115 }).areaMm2, null);
});

test("AC inverter current is consistent and prefers declared maximum output current", () => {
  assert.equal(calculateAcDesignCurrent({ ratedAcPowerW: 4600, ratedAcVoltageV: 230, powerFactor: 1, phaseSystem: "single-phase" }).currentA, 20);
  assert.equal(calculateAcDesignCurrent({ ratedAcPowerW: 4600, ratedAcVoltageV: 230, maximumOutputCurrentA: 23, phaseSystem: "single-phase" }).currentA, 23);
  assert.equal(calculateAcDesignCurrent({ ratedAcPowerW: 4600, ratedAcVoltageV: 230, powerFactor: 0, phaseSystem: "single-phase" }).currentA, null);
});

test("AC voltage drop is distinguished per tramo and cumulatively against 3 percent", () => {
  const pass = calculateAcCumulativeVoltageDrop({ runs: [{ voltageDropV: 1.5 }, { voltageDropV: 2 }], nominalVoltageV: 230, limitPercent: 3 });
  assert.ok(Math.abs(pass.cumulativeDropPercent - (3.5 / 230 * 100)) < 1e-12);
  assert.equal(pass.passes, true);
  assert.equal(calculateAcCumulativeVoltageDrop({ runs: [{ voltageDropV: 4 }, { voltageDropV: 4 }], nominalVoltageV: 230 }).passes, false);
  assert.equal(calculateAcCumulativeVoltageDrop({ runs: [{ voltageDropV: null }], nominalVoltageV: 230 }).passes, null);
});

test("PV reverse current uses parallel strings on each MPPT and gPV data from specific ratings", () => {
  assert.equal(calculatePvReverseCurrent({ moduleIscA: 10, parallelStringsOnMppt: 3 }).reverseCurrentA, 20);
  assert.equal(evaluateGpvFuse({ moduleIscA: 10, parallelStringsOnMppt: 1 }).status, "VALIDACIÓN PENDIENTE");
  const result = evaluateGpvFuse({ moduleIscA: 10, parallelStringsOnMppt: 3, moduleMaxReverseCurrentA: 15, moduleMaxSeriesFuseA: 25, gpvRatingsA: [15, 20], selectedGpvRatingA: 15, conductorAmpacityA: 20 });
  assert.equal(result.reverseCurrentA, 20);
  assert.equal(result.candidateRatingA, 15);
  assert.equal(result.status, "VALIDACIÓN PENDIENTE");
  assert.equal(evaluateGpvFuse({ moduleIscA: 10, parallelStringsOnMppt: 3, moduleMaxReverseCurrentA: 30, moduleMaxSeriesFuseA: 25, gpvRatingsA: [15], conductorAmpacityA: 20 }).candidateRatingA, null);
  assert.equal(evaluateGpvFuse({ moduleIscA: 10, parallelStringsOnMppt: 3, moduleMaxReverseCurrentA: 15, moduleMaxSeriesFuseA: 25, gpvRatingsA: [15], selectedGpvRatingA: 20, conductorAmpacityA: 20 }).candidateRatingA, null);
});

test("AC breaker coordination rejects nominal rating above corrected ampacity and stays pending for missing data", () => {
  const common = { designCurrentA: 20, conductorAmpacityA: 30, faultCurrentKA: 5, deviceBreakingCapacityKA: 10, voltageRatingV: 240, requiredVoltageV: 240, poles: 2, requiredPoles: 2, tripCurve: "C" };
  assert.equal(evaluateAcBreakerCoordination({ ...common, breakerNominalCurrentA: 25 }).valid, true);
  const oversized = evaluateAcBreakerCoordination({ ...common, breakerNominalCurrentA: 32 });
  assert.equal(oversized.valid, false);
  assert.ok(oversized.status.includes("ampacidad corregida"));
  assert.equal(evaluateAcBreakerCoordination({ ...common, breakerNominalCurrentA: "", tripCurve: "" }).status, "VALIDACIÓN PENDIENTE");
});

test("PV equipment PE uses copper and Table 250-122 selection is separate from adiabatic check", () => {
  assert.equal(validatePvEquipmentGroundingConductor({ material: "Aluminio", tableSectionMm2: 16 }).valid, false);
  assert.equal(validatePvEquipmentGroundingConductor({ material: "Cobre", tableSectionMm2: "" }).valid, null);
  assert.equal(validatePvEquipmentGroundingConductor({ material: "Cobre", tableSectionMm2: 6 }).sectionMm2, 6);
  assert.equal(calculateAdiabaticSection({ faultCurrentA: 1000, clearingTimeSeconds: 0.2, kFactor: 115, material: "Cobre", insulation: "PVC", initialTemperatureC: 70, finalTemperatureC: 160 }).areaMm2, null);
});

test("protective device coordination remains pending without manufacturer and fault data", () => {
  const result = evaluateProtectionCandidate({ designCurrentA: 20, conductorAmpacityA: 25, faultCurrentKA: "", deviceBreakingCapacityKA: "", voltageRatingV: "", requiredVoltageV: 230, poles: "", requiredPoles: 2 });
  assert.equal(result.valid, false);
  assert.ok(result.pending.some(item => item.includes("poder de corte")));
  const invalid = evaluateProtectionCandidate({ designCurrentA: 30, conductorAmpacityA: 25, faultCurrentKA: 10, deviceBreakingCapacityKA: 6, voltageRatingV: 230, requiredVoltageV: 230, poles: 2, requiredPoles: 2 });
  assert.equal(invalid.status, "NO CUMPLE: corriente supera ampacidad corregida; poder de corte inferior a Icc");
});

const testRun = section => ({ calculatedAreaMm2: section - 0.2, commercialSectionMm2: section, correctedAmpacityA: null, voltageDropV: 1, voltageDropPercent: 0.5, ampacityPass: null, status: "PREDIMENSIONAMIENTO; AMPACIDAD PENDIENTE", pending: ["ampacidad pendiente"] });

test("single MPPT collector is a distinct circuit and BOM quantity is length per conductor times conductor count", () => {
  const model = buildElectricalCircuitModel({ architecture: "ON-GRID", totalPvCurrentA: 18, totalPvShortCircuitCurrentA: 20, circuits: [
    { id: "MPPT-1-COLECTOR", type: "mppt-collector", mpptId: "MPPT-1", strings: 2, label: "colector MPPT-1", lengthM: 20, conductorCount: 2, material: "Cobre", designCurrentA: 25, run: testRun(6) }
  ] });
  const [row] = buildElectricalBOMRows(model);
  assert.equal(model.circuits[0].designCurrentA, 25);
  assert.equal(model.generator.currentA, 18);
  assert.equal(row.qty, 40);
  assert.equal(row.sectionMm2, 6);
  assert.match(row.note, /MPPT-1-COLECTOR/);
});

test("multiple MPPT collectors keep individual current, route, section and BOM lengths", () => {
  const model = buildElectricalCircuitModel({ circuits: [
    { id: "MPPT-1-COLECTOR", type: "mppt-collector", mpptId: "MPPT-1", strings: 2, label: "MPPT-1", lengthM: 12, conductorCount: 2, material: "Cobre", designCurrentA: 25, run: testRun(6) },
    { id: "MPPT-2-COLECTOR", type: "mppt-collector", mpptId: "MPPT-2", strings: 1, label: "MPPT-2", lengthM: 31, conductorCount: 2, material: "Cobre", designCurrentA: 12.5, run: testRun(4) }
  ] });
  const rows = buildElectricalBOMRows(model);
  assert.deepEqual(model.circuits.map(c => [c.designCurrentA, c.lengthM, c.sectionMm2]), [[25, 12, 6], [12.5, 31, 4]]);
  assert.deepEqual(rows.map(row => row.qty), [24, 62]);
  assert.deepEqual(rows.map(row => row.sectionMm2), [6, 4]);
});

test("architectures filter only circuits that do not apply and preserve their AC paths", () => {
  const circuits = [
    { id: "AC-OUT", type: "ac", lengthM: 10, conductorCount: 2, designCurrentA: 10 },
    { id: "AC-GRID", type: "ac-grid", lengthM: 15, conductorCount: 2, designCurrentA: 10 },
    { id: "BAT", type: "battery", lengthM: 2, conductorCount: 2, designCurrentA: 50 }
  ];
  const onGrid = buildElectricalCircuitModel({ architecture: "ON-GRID", circuits });
  const offGrid = buildElectricalCircuitModel({ architecture: "OFF-GRID", circuits });
  const hybrid = buildElectricalCircuitModel({ architecture: "HÍBRIDO", circuits });
  assert.deepEqual(onGrid.circuits.map(c => c.id), ["AC-OUT", "AC-GRID"]);
  assert.deepEqual(offGrid.circuits.map(c => c.id), ["AC-OUT", "BAT"]);
  assert.deepEqual(hybrid.circuits.map(c => c.id), ["AC-OUT", "AC-GRID", "BAT"]);
});

test("BOM rows preserve circuit sections into budget line calculations and omit missing routes", () => {
  const model = buildElectricalCircuitModel({ circuits: [
    { id: "AC-1", type: "ac", label: "salida", lengthM: 8, conductorCount: 2, material: "Cobre", designCurrentA: 10, run: testRun(2.5) },
    { id: "NO-DIST", type: "ac-grid", label: "sin longitud", lengthM: "", conductorCount: 2, material: "Cobre", designCurrentA: 10, run: {} }
  ] });
  const bomRows = buildElectricalBOMRows(model);
  const budgetRows = bomRows.map(row => ({ ...row, lineTotal: 1000 * row.qty }));
  assert.equal(bomRows.length, 1);
  assert.equal(budgetRows[0].qty, 16);
  assert.equal(budgetRows[0].sectionMm2, 2.5);
  assert.equal(budgetRows[0].lineTotal, 16000);
  assert.match(budgetRows[0].note, /2.5 mm²/);
});

test("BOM, diagram and report can consume identical circuit identifiers and sections", () => {
  const model = buildElectricalCircuitModel({ circuits: [
    { id: "MPPT-2-COLECTOR", type: "mppt-collector", label: "MPPT-2", lengthM: 22, conductorCount: 2, material: "Cobre", designCurrentA: 12, run: testRun(4) }
  ] });
  const [scheduleRow] = model.circuits;
  const [bomRow] = buildElectricalBOMRows(model);
  const reportRow = model.circuits.find(circuit => circuit.id === bomRow.id);
  assert.equal(scheduleRow.sectionMm2, 4);
  assert.equal(reportRow.sectionMm2, bomRow.sectionMm2);
  assert.equal(scheduleRow.id, reportRow.id);
});

test("PE, earth and bonding have independent lengths and BOM rows", () => {
  const model = buildElectricalCircuitModel({ circuits: [
    { id: "PE", type: "pe", label: "PE", lengthM: 10, conductorCount: 1, material: "Cobre", sectionMm2: 6 },
    { id: "EARTH", type: "grounding", label: "tierra", lengthM: 25, conductorCount: 1, material: "Cobre", sectionMm2: null },
    { id: "BOND", type: "bonding", label: "equipotencial", lengthM: 7, conductorCount: 1, material: "Cobre", sectionMm2: null }
  ] });
  assert.deepEqual(buildElectricalBOMRows(model).map(row => [row.id, row.qty]), [["PE", 10], ["EARTH", 25], ["BOND", 7]]);
});

test("integrated or unknown protections are not duplicated in the BOM; explicit external requirements are included", () => {
  const statuses = { dcDisconnect: "Integrado en inversor", dcSpd: "Por verificar", acBreaker: "Protección externa requerida", acSpd: "Por verificar", battery: "Protección externa requerida" };
  assert.deepEqual(buildExternalProtectionRows(statuses, "ON-GRID").map(row => row.name), ["Interruptor termomagnético AC"]);
  assert.deepEqual(buildExternalProtectionRows(statuses, "HÍBRIDO").map(row => row.name), ["Protección DC de batería", "Interruptor termomagnético AC"]);
  assert.deepEqual(buildExternalProtectionRows({}, "OFF-GRID"), []);
});

test("old project without per-MPPT routes loads legacy route as pending confirmation", () => {
  const defaults = { mpptCircuits: [], dcDistance: "18" };
  const oldProject = mergeProjectDefaults(defaults, { dcDistance: "18", mpptCount: "2" });
  assert.deepEqual(resolveMpptCircuitDistance(undefined, oldProject.dcDistance), { distanceM: 18, source: "legacy-shared" });
  assert.deepEqual(resolveMpptCircuitDistance({ distanceM: "27" }, oldProject.dcDistance), { distanceM: 27, source: "mppt" });
  assert.deepEqual(resolveMpptCircuitDistance({ distanceM: "" }, oldProject.dcDistance), { distanceM: null, source: "pending" });
  assert.deepEqual(resolveMpptCircuitDistance(undefined, ""), { distanceM: null, source: "pending" });
  assert.deepEqual(oldProject.mpptCircuits, []);
});

test("numeric project validation rejects NaN, infinities, negatives, zero voltage, invalid percentages and fractional counts", () => {
  const result = validateNumericInputs({
    monthlyKwh: Infinity, peakSunHours: NaN, panelW: -580, acVoltage: 0,
    powerFactor: 1.01, efficiency: 101, dcDistance: -3, mpptCount: 1.5,
    breakerPoles: -Infinity, gpvFuseRatingsA: "15,NaN"
  });
  assert.equal(result.valid, false);
  for (const key of ["monthlyKwh", "peakSunHours", "panelW", "acVoltage", "powerFactor", "efficiency", "dcDistance", "mpptCount", "breakerPoles", "gpvFuseRatingsA"]) assert.ok(result.invalidKeys.includes(key), key);
  assert.equal(result.status, ENGINEERING_STATES.INVALID);
  assert.ok(result.invalid.every(item => item.message));
});

test("zero/negative values are rejected only for inputs that require positive quantities while valid cold temperatures are accepted", () => {
  const result = validateNumericInputs({ monthlyKwh: 0, peakSunHours: 5, powerFactor: 0.95, acVoltage: 230, minimumTemperature: -15, maximumCellTemperature: 70, ambientTemperatureC: -5, vocTempCoefficient: -0.3 });
  assert.equal(result.invalid.length, 0);
  const zeroVoltage = validateNumericInputs({ acVoltage: 0 });
  assert.equal(zeroVoltage.invalidKeys.includes("acVoltage"), true);
  const reversedTemperature = validateNumericInputs({ minimumTemperature: 20, maximumCellTemperature: 10 });
  assert.ok(reversedTemperature.invalidKeys.includes("maximumCellTemperature"));
});

test("validation states resolve in severity order and never promote pending checks to valid", () => {
  assert.equal(resolveEngineeringState(), ENGINEERING_STATES.VALID);
  assert.equal(resolveEngineeringState({ pending: ["missing datasheet"] }), ENGINEERING_STATES.PENDING);
  assert.equal(resolveEngineeringState({ failures: ["over limit"], pending: ["other"] }), ENGINEERING_STATES.FAIL);
  assert.equal(resolveEngineeringState({ invalid: ["NaN"], failures: ["over limit"] }), ENGINEERING_STATES.INVALID);
});

test("ampacity requires exact candidate section, material, insulation, rating, method and correction source", () => {
  const source = { baseAmpacityA: 24, referenceSectionMm2: 4, selectedSectionMm2: 4, referenceMaterial: "Cobre", material: "Cobre", insulation: "THWN-2", temperatureRatingC: 90, installationMethod: "Tubería", loadedConductors: 2, ambientTemperatureC: 35, temperatureFactor: 0.94, groupingFactor: 0.8, source: "Tabla/ficha trazable" };
  const result = validateAmpacityReference(source);
  assert.equal(result.valid, true);
  assert.ok(Math.abs(result.correctedAmpacityA - 18.048) < 1e-12);
  assert.equal(validateAmpacityReference({ ...source, referenceSectionMm2: 6 }).status, ENGINEERING_STATES.PENDING);
  assert.equal(validateAmpacityReference({ ...source, referenceMaterial: "Aluminio" }).status, ENGINEERING_STATES.PENDING);
  assert.equal(validateAmpacityReference({ ...source, temperatureFactor: 1.2 }).status, ENGINEERING_STATES.INVALID);
  assert.equal(validateAmpacityReference({ ...source, source: "" }).status, ENGINEERING_STATES.PENDING);
});

test("validated conductor distinguishes candidate sections and requires all ampacity metadata", () => {
  const common = { currentA: 10, voltageV: 230, distanceOneWayM: 20, dropPercent: 3, material: "Cobre", ambientTemperatureC: 30, phaseSystem: "single-phase", powerFactor: 0.95, installationMethod: "Tubería", baseAmpacityA: 24, baseAmpacitySectionMm2: 2.5, baseAmpacityMaterial: "Cobre", insulation: "THWN-2", temperatureRatingC: 90, loadedConductors: 2, ampacitySource: "Ficha de conductor", temperatureFactor: 0.94, groupingFactor: 0.8 };
  const preliminary = calculateValidatedConductorRun({ ...common, baseAmpacityA: "", baseAmpacitySectionMm2: "" });
  const exactReference = { ...common, baseAmpacitySectionMm2: preliminary.sectionByVoltageDropMm2 };
  const candidate = calculateValidatedConductorRun(exactReference);
  assert.equal(candidate.sectionByVoltageDropMm2, candidate.commercialSectionMm2);
  assert.equal(candidate.ampacityPass, true);
  assert.equal(candidate.status, ENGINEERING_STATES.PENDING);
  assert.equal(candidate.selectedSectionMm2, null);
  const mismatched = calculateValidatedConductorRun({ ...exactReference, baseAmpacitySectionMm2: 6 });
  assert.equal(mismatched.correctedAmpacityA, null);
  assert.equal(mismatched.ampacityReferenceStatus, ENGINEERING_STATES.PENDING);
  const highCurrentPreliminary = calculateValidatedConductorRun({ ...exactReference, currentA: 80, baseAmpacityA: "", baseAmpacitySectionMm2: "" });
  const tooSmall = calculateValidatedConductorRun({ ...exactReference, currentA: 80, baseAmpacitySectionMm2: highCurrentPreliminary.sectionByVoltageDropMm2 });
  assert.equal(tooSmall.status, ENGINEERING_STATES.FAIL);
  assert.equal(calculateValidatedConductorRun({ ...common, voltageV: Infinity }).status, ENGINEERING_STATES.INVALID);
  assert.equal(calculateValidatedConductorRun({ ...common, currentA: 0 }).status, ENGINEERING_STATES.INVALID);
});

test("products without structured datasheets remain pending; complete matching specifications and certification can validate", () => {
  assert.equal(evaluateProductCompatibility({ category: "Inversores" }, { architecture: "ON-GRID" }).status, ENGINEERING_STATES.PENDING);
  const product = { electricalSpecs: { architecture: "ON-GRID", voltageV: 230, currentA: 20, poles: 2, breakingCapacityKA: 10, tripCurve: "C", mpptMinV: 120, mpptMaxV: 500, batteryChemistry: "LFP", bmsProtocol: "CAN", certifications: ["RETIE" ] } };
  const requirements = { architecture: "ON-GRID", voltageV: { min: 220, max: 240 }, currentA: { min: 16 }, poles: 2, breakingCapacityKA: { min: 6 }, tripCurve: "C", certifications: ["RETIE"] };
  assert.equal(evaluateProductCompatibility(product, requirements).status, ENGINEERING_STATES.VALID);
  assert.equal(evaluateProductCompatibility(product, { ...requirements, currentA: { min: 25 } }).status, ENGINEERING_STATES.FAIL);
  assert.equal(evaluateProductCompatibility({ electricalSpecs: { ...product.electricalSpecs, certifications: [] } }, requirements).status, ENGINEERING_STATES.PENDING);
});

test("budget totals expose missing prices as pending, apply tax to known base and reject invalid amounts", () => {
  const pending = calculateBudgetTotals([
    { qty: 2, numeric: 500, lineTotal: 1000 },
    { qty: 1, numeric: null, lineTotal: null }
  ], { transport: 200, labor: 300, other: 0, tax: 10 });
  assert.equal(pending.status, ENGINEERING_STATES.PENDING);
  assert.equal(pending.complete, false);
  assert.equal(pending.unpricedCount, 1);
  assert.equal(pending.knownSubtotal, 1000);
  assert.equal(pending.tax, 150);
  assert.equal(pending.total, 1650);
  assert.equal(calculateBudgetTotals([{ qty: 1, numeric: 100, lineTotal: 100 }], {}, [ENGINEERING_STATES.PENDING]).status, ENGINEERING_STATES.PENDING);
  assert.equal(calculateBudgetTotals([{ qty: 1, numeric: 100, lineTotal: 100 }], {}, [ENGINEERING_STATES.FAIL]).status, ENGINEERING_STATES.FAIL);
  assert.equal(calculateBudgetTotals([{ qty: 1, numeric: 100, lineTotal: 100 }], {}, [ENGINEERING_STATES.INVALID]).status, ENGINEERING_STATES.INVALID);
  assert.equal(calculateBudgetTotals([{ qty: 1, numeric: -10, lineTotal: null }], {}).status, ENGINEERING_STATES.INVALID);
  assert.equal(calculateBudgetTotals([], { tax: 101 }).status, ENGINEERING_STATES.INVALID);
  assert.equal(calculateBudgetTotals([], { transport: Infinity }).status, ENGINEERING_STATES.INVALID);
});

test("legacy local and cloud-shaped projects preserve fields and invalid values remain visible to validation", () => {
  const defaults = { monthlyKwh: 300, inverterEfficiency: "", mpptCircuits: [], systemType: "HÍBRIDO" };
  const legacyLocal = mergeProjectDefaults(defaults, { monthlyKwh: 250, oldCustomField: "keep" });
  const legacyCloud = mergeProjectDefaults(defaults, { monthlyKwh: -2, inverterEfficiency: "", cloudMetadata: { id: 7 } });
  assert.equal(legacyLocal.monthlyKwh, 250);
  assert.equal(legacyLocal.oldCustomField, "keep");
  assert.equal(validateNumericInputs(legacyLocal).invalid.length, 0);
  assert.ok(validateNumericInputs(legacyCloud).invalidKeys.includes("monthlyKwh"));
  assert.deepEqual(legacyCloud.cloudMetadata, { id: 7 });
});

test("engineering domain statuses remain pending for unverified circuits in every architecture", () => {
  for (const architecture of ["ON-GRID", "OFF-GRID", "HÍBRIDO"]) {
    const model = buildElectricalCircuitModel({ architecture, circuits: [{ id: "MPPT-1", type: "mppt-collector", lengthM: 10, conductorCount: 2, sectionMm2: 6, designCurrentA: 12, run: { pending: ["ampacity source pending"], status: ENGINEERING_STATES.PENDING } }] });
    const states = buildEngineeringStateModel({ data: { systemType: architecture }, numericValidation: validateNumericInputs({}), circuitModel: model });
    assert.equal(model.circuits[0].status, ENGINEERING_STATES.PENDING);
    assert.equal(states.conductors, ENGINEERING_STATES.PENDING);
    assert.equal(states.diagram, ENGINEERING_STATES.PENDING);
    assert.equal(states.report, ENGINEERING_STATES.PENDING);
  }
});

test("technical catalog schemas define explicit units for all four photovoltaic product families", () => {
  assert.deepEqual(Object.keys(TECHNICAL_SCHEMAS).sort(), ["battery", "controller", "inverter", "panel-solar"]);
  assert.equal(TECHNICAL_SCHEMAS["panel-solar"].pmaxW.unit, "W");
  assert.equal(TECHNICAL_SCHEMAS["panel-solar"].vocTempCoefficientPercentPerC.unit, "%/°C");
  assert.equal(TECHNICAL_SCHEMAS.inverter.maximumPvPowerW.unit, "W");
  assert.equal(TECHNICAL_SCHEMAS.controller.maximumChargeCurrentA.unit, "A");
  assert.equal(TECHNICAL_SCHEMAS.battery.nominalEnergyWh.unit, "Wh");
  assert.equal(TECHNICAL_SCHEMAS.battery.capacityAh.unit, "Ah");
});

test("complete sourced technical sheets are structurally ready but do not claim product compatibility", () => {
  const requiredFields = {
    "panel-solar": { pmaxW: 580, vocV: 51, vmpV: 43, iscA: 14, impA: 13, manufacturer: "Maker", exactModel: "Exact model", exactReference: "SKU" },
    inverter: { ratedAcPowerW: 5000, maximumPvPowerW: 6500, maximumDcVoltageV: 600, mpptVoltageMinV: 120, mpptVoltageMaxV: 500, startupVoltageV: 100, mpptCount: 2, inputsPerMppt: 2, maximumInputCurrentPerMpptA: 20, maximumShortCircuitCurrentPerMpptA: 30, outputVoltageV: 230, outputPhases: 1, frequencyHz: 60, manufacturer: "Maker", exactModel: "Exact model", exactReference: "SKU" },
    controller: { technology: "MPPT", nominalBatteryVoltageV: 48, maximumPvInputVoltageV: 250, mpptOperatingVoltageMinV: 60, mpptOperatingVoltageMaxV: 230, maximumInputCurrentA: 30, maximumChargeCurrentA: 80, maximumPvPowerW: 5000, manufacturer: "Maker", exactModel: "Exact model", exactReference: "SKU" },
    battery: { technology: "LFP", nominalVoltageV: 51.2, capacityAh: 100, nominalEnergyWh: 5120, maximumDepthOfDischargePercent: 80, maximumChargeCurrentA: 50, maximumDischargeCurrentA: 100, integratedBms: true, manufacturer: "Maker", exactModel: "Exact model", exactReference: "SKU" }
  };
  for (const [category, values] of Object.entries(requiredFields)) {
    const sheet = createEmptyTechnicalSheet(category);
    for (const [key, value] of Object.entries(values)) sheet.fields[key] = { value, unit: TECHNICAL_SCHEMAS[category][key].unit, source: { manufacturer: "Maker", documentUrl: "https://manufacturer.example/datasheet.pdf", page: 2, reviewDate: "2026-11-10", exactVariant: "Exact model" } };
    assert.equal(validateTechnicalSheet(sheet).status, CATALOG_DATA_STATES.STRUCTURED, category);
    assert.notEqual(validateTechnicalSheet(sheet).status, "COMPATIBLE COMPROBADO");
  }
});

test("technical sheets report missing data and reject nonfinite, zero, wrong-unit and unsourced values", () => {
  const empty = createEmptyTechnicalSheet("panel-solar");
  assert.equal(validateTechnicalSheet(empty).status, CATALOG_DATA_STATES.INSUFFICIENT);
  assert.ok(validateTechnicalSheet(empty).missing.includes("vocV"));
  const setCell = (sheet, key, value, unit = TECHNICAL_SCHEMAS["panel-solar"][key].unit, source = { manufacturer: "Maker", documentUrl: "https://maker.example/ds.pdf", reviewDate: "2026-11-10", exactVariant: "Exact" }) => { sheet.fields[key] = { value, unit, source }; };
  const invalid = createEmptyTechnicalSheet("panel-solar");
  setCell(invalid, "vocV", Infinity);
  setCell(invalid, "vmpV", 0);
  setCell(invalid, "iscA", "12.4");
  setCell(invalid, "impA", 10, "V");
  setCell(invalid, "pmaxW", 500, undefined, null);
  assert.equal(validateTechnicalSheet(invalid).status, CATALOG_DATA_STATES.INVALID);
  assert.ok(validateTechnicalSheet(invalid).invalid.length >= 5);
});

test("panel fiche status distinguishes verified complete source data from incomplete manufacturer sheets", () => {
  const sheet = createEmptyTechnicalSheet("panel-solar");
  for (const [key, definition] of Object.entries(TECHNICAL_SCHEMAS["panel-solar"])) {
    const numericUnits = ["W", "V", "A", "%", "%/°C", "°C", "mm", "kg", "años"];
    const value = definition.unit === "URL" ? "https://manufacturer.example/module.pdf"
      : definition.unit === "texto" ? "Manufacturer value"
      : numericUnits.includes(definition.unit) ? (definition.unit === "%" ? 22 : definition.min != null ? definition.min + 1 : 0)
      : null;
    sheet.fields[key] = { value, unit: definition.unit, source: { manufacturer: "Maker", documentUrl: "https://manufacturer.example/module.pdf", reviewDate: "2026-11-10", exactVariant: "Exact module" } };
  }
  sheet.source = { manufacturer: "Maker", documentUrl: "https://manufacturer.example/module.pdf", reviewDate: "2026-11-10", exactVariant: "Exact module", verificationStatus: "VERIFIED_EXACT_VARIANT" };
  assert.equal(getTechnicalSheetStatus(sheet), CATALOG_DATA_STATES.VERIFIED);
  sheet.fields.vmpTempCoefficientPercentPerC.value = null;
  assert.equal(getTechnicalSheetStatus(sheet), CATALOG_DATA_STATES.INCOMPLETE);
});

test("legacy catalog adaptation preserves commercial data and never parses free-text specs", () => {
  const legacy = { id: "legacy-panel", category: "Paneles solares", brand: "Brand", model: "Model-1", description: "Legacy", specs: ["580 Wp", "Voc 51 V"], price: 123, tax: 0.19, image: "https://shop.example/image.png", source: "https://shop.example/item" };
  const adapted = prepareCatalogProduct(legacy);
  assert.equal(adapted.price, legacy.price);
  assert.equal(adapted.image, legacy.image);
  assert.deepEqual(adapted.specs, legacy.specs);
  assert.equal(adapted.technicalSheet.fields.pmaxW.value, null);
  assert.equal(adapted.technicalDataStatus, CATALOG_DATA_STATES.INSUFFICIENT);
  assert.equal(technicalCategoryFor("BaterÃƒÂ­as"), "battery");
  assert.equal(technicalCategoryFor("Controladores MPPT"), "controller");
});

test("catalog ID audit and future comparison interfaces are deterministic", () => {
  assert.deepEqual(findDuplicateCatalogIds([{ id: "a" }, { id: "b" }, { id: "a" }, {}]), ["a"]);
  assert.deepEqual(getFutureComparisonInputs("panel-solar"), ["generatorArray", "stringLayout", "temperatureLimits"]);
  assert.deepEqual(getFutureComparisonInputs("unknown"), []);
});

test("all 227 embedded legacy commercial catalog records remain present with unique IDs", () => {
  const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  const catalogMatch = appSource.match(/const commercialCatalogLegacy\s*=\s*\[([\s\S]*?)\n\];/);
  assert.ok(catalogMatch, "legacy catalog declaration should remain in App.jsx");
  const ids = [...catalogMatch[1].matchAll(/[\"']?id[\"']?\s*:\s*\"([^\"]+)\"/g)].map(match => match[1]);
  assert.equal(ids.length, 227);
  assert.deepEqual(findDuplicateCatalogIds(ids.map(id => ({ id }))), []);
});

test("the four legacy panel selections now use exact manufacturer-sourced sheets and retain their original electrical values", () => {
  assert.deepEqual(panelCatalog.map(panel => panel.id), ["longi580", "ja595", "trina630", "canadian635"]);
  const expected = {
    longi580: [580, 51.41, 43.22, 14.22, 13.42, 22.5],
    ja595: [595, 52.58, 44.64, 13.99, 13.33, 23.0],
    trina630: [630, 50.3, 42.0, 15.94, 15.01, 23.3],
    canadian635: [635, 49.4, 41.9, 16.22, 15.18, 23.5]
  };
  for (const panel of panelCatalog) {
    assert.deepEqual([panel.watts, panel.voc, panel.vmp, panel.isc, panel.imp, panel.efficiency], expected[panel.id]);
    assert.match(panel.technicalSheet.source.documentUrl, /^https:\/\//);
    assert.equal(panel.technicalSheet.source.verificationStatus, "VERIFIED_EXACT_VARIANT");
    assert.equal(panel.technicalSheet.source.exactVariant.length > 0, true);
    assert.equal(validateTechnicalSheet(panel.technicalSheet).invalid.length, 0);
    assert.equal(panel.technicalDataStatus, CATALOG_DATA_STATES.INCOMPLETE);
    assert.equal(panel.technicalSheet.fields.vmpTempCoefficientPercentPerC.value, null);
  }
  const canadian = panelCatalog.find(panel => panel.id === "canadian635");
  assert.match(canadian.technicalSheet.source.verificationNote, /conflicto/i);
  assert.match(canadian.technicalSheet.fields.vocV.source.documentUrl, /canadiansolar\.com/);
  assert.deepEqual(findDuplicateCatalogIds(panelCatalog), []);
});

test("panel selection copies the structured datasheet values and keeps unknown coefficients null", () => {
  const panel = panelCatalog.find(item => item.id === "longi580");
  const selected = getPanelSelectionValues(panel);
  assert.equal(selected.panelCatalogId, "longi580");
  assert.equal(selected.panelW, 580);
  assert.equal(selected.panelVoc, 51.41);
  assert.equal(selected.panelVmp, 43.22);
  assert.equal(selected.panelIsc, 14.22);
  assert.equal(selected.panelImp, 13.42);
  assert.equal(selected.vocTempCoefficient, -0.23);
  assert.equal(selected.vmpTempCoefficient, "");
  assert.equal(selected.panelMaxSeriesFuse, 30);
  assert.equal(selected.panelMaximumSystemVoltage, 1500);
});

test("panel temperature correction preserves the STC linear formula and leaves missing Vmp coefficient pending", () => {
  const coldVoc = correctPanelVoltageAtTemperature({ nominalVoltageV: 51.41, coefficientPercentPerC: -0.23, temperatureC: -10 });
  assert.ok(Math.abs(coldVoc - 51.41 * (1 + (-0.23 / 100) * (-10 - 25))) < 1e-10);
  assert.equal(correctPanelVoltageAtTemperature({ nominalVoltageV: 43.22, coefficientPercentPerC: null, temperatureC: 70 }), null);
  assert.equal(correctPanelVoltageAtTemperature({ nominalVoltageV: Infinity, coefficientPercentPerC: -0.23, temperatureC: -10 }), null);
});

test("panel string voltage checks compare corrected Voc/Vmp with inverter and module limits, or remain pending", () => {
  const inputs = { stringVocColdV: 480, stringVocHotV: 430, stringVmpColdV: 420, stringVmpHotV: 350, moduleMaximumSystemVoltageV: 1000, maximumDcVoltageV: 600, mpptMinVoltageV: 300, mpptMaxVoltageV: 500, startupVoltageV: 250 };
  assert.deepEqual(evaluatePanelStringVoltageLimits(inputs), { maximumDcVoltage: true, moduleSystemVoltage: true, mpptRange: true, startup: true });
  assert.equal(evaluatePanelStringVoltageLimits({ ...inputs, maximumDcVoltageV: 450 }).maximumDcVoltage, false);
  assert.equal(evaluatePanelStringVoltageLimits({ ...inputs, mpptMinVoltageV: 360 }).mpptRange, false);
  assert.equal(evaluatePanelStringVoltageLimits({ ...inputs, moduleMaximumSystemVoltageV: null }).moduleSystemVoltage, null);
  assert.equal(evaluatePanelStringVoltageLimits({ ...inputs, stringVmpColdV: null }).mpptRange, null);
});

test("panel catalog identity matching is exact and never links a merely similar commercial model", () => {
  const panel = panelCatalog.find(item => item.id === "canadian635");
  assert.equal(findExactCommercialPanelMatch(panel, [{ brand: "Canadian Solar", model: "CS6.2-66TM-630", id: "other-power-bin" }]), null);
  assert.equal(findExactCommercialPanelMatch(panel, [{ brand: "Canadian Solar", model: "CS6.2-66TM-635", id: "exact-reference" }]).id, "exact-reference");
});

test("legacy project merge keeps manual panel data and defaults the new catalog ID safely", () => {
  const oldProject = mergeProjectDefaults({ panelCatalogId: "", panelW: "", panelVoc: "" }, { panelW: 580, panelModel: "Old saved module", customProjectField: "keep" });
  assert.equal(oldProject.panelCatalogId, "");
  assert.equal(oldProject.panelW, 580);
  assert.equal(oldProject.panelModel, "Old saved module");
  assert.equal(oldProject.customProjectField, "keep");
});

test("the two commercial inverter references use only exact official manufacturer variants and retain missing values", () => {
  assert.deepEqual(inverterCatalog.map(item=>item.id), ["deye6k", "deye50kw-solartex"]);
  const hybrid=inverterCatalog[0], grid=inverterCatalog[1];
  assert.equal(hybrid.model,"SUN-6K-SG01LP1-US");
  assert.equal(grid.model,"SUN-50K-G04P3-EU-AM4-LV");
  for (const item of inverterCatalog) {
    assert.equal(item.technicalSheet.source.verificationStatus,"VERIFIED_EXACT_VARIANT");
    assert.equal(item.technicalSheet.source.exactVariant,item.model);
    assert.match(item.technicalSheet.source.documentUrl,/^https:\/\/www\.deyeinverter\.com\//);
    assert.equal(validateTechnicalSheet(item.technicalSheet).invalid.length,0);
    assert.equal(item.technicalDataStatus,CATALOG_DATA_STATES.INCOMPLETE);
  }
  assert.equal(hybrid.technicalSheet.fields.maximumOutputCurrentA.value,27.5);
  assert.deepEqual(hybrid.technicalSheet.fields.maximumOperatingCurrentByMpptA.value,[26,13]);
  assert.equal(hybrid.technicalSheet.fields.outputVoltageV.value,null);
  assert.equal(grid.technicalSheet.fields.maximumOutputCurrentA.value,null);
  assert.match(grid.technicalSheet.fields.maximumOutputCurrentOptions.value,/131\.3 A.*125\.4 A/);
  assert.equal(grid.technicalSheet.fields.batteryType.value,null);
});

test("commercial inverter match is exact and the selected sheet leaves unavailable scalar limits empty", () => {
  const inverter=inverterCatalog[0];
  assert.equal(findExactCommercialInverterMatch(inverter,[{brand:"Deye",model:"SUN-5K-SG01LP1-US"}]),null);
  assert.equal(findExactCommercialInverterMatch(inverter,[{brand:"Deye",model:inverter.model,id:"deye6k"}]).id,"deye6k");
  const selected=getInverterSelectionValues(inverter);
  assert.equal(selected.selectedInverterCatalogId,"deye6k");
  assert.equal(selected.inverterW,6000);
  assert.equal(selected.inverterMaxPvPower,7800);
  assert.equal(selected.inverterMaxInputCurrent,"");
  assert.equal(selected.inverterMaxAcCurrentA,27.5);
  assert.equal(selected.inverterEfficiency,96.5);
  assert.equal(selected.inverterInputsPerMppt,"");
  assert.equal(selected.inverterSurgeW,12000);
  assert.equal(selected.inverterSurgeDurationSec,10);
  const gridSelected=getInverterSelectionValues(inverterCatalog[1]);
  assert.equal(gridSelected.inverterInputsPerMppt,"");
  assert.equal(gridSelected.modulesPerMppt,4);
});

test("selected inverter battery limits are checked separately and missing source limits stay pending", () => {
  const inverter=inverterCatalog.find(item=>item.id==="deye6k");
  assert.equal(evaluateInverterBatteryLimits({inverter,batteryVoltageV:48,chargeCurrentA:null,dischargeCurrentA:100}).status,"VALIDACION PENDIENTE");
  assert.equal(evaluateInverterBatteryLimits({inverter,batteryVoltageV:70,chargeCurrentA:50,dischargeCurrentA:100}).status,"NO CUMPLE");
  assert.equal(evaluateInverterBatteryLimits({inverter,batteryVoltageV:48,chargeCurrentA:50,dischargeCurrentA:100}).status,"CUMPLE");
  assert.equal(evaluateInverterBatteryLimits({inverter,batteryVoltageV:Infinity,chargeCurrentA:50,dischargeCurrentA:100}).status,"INVALIDO");
});

test("catalog inverter current ratings are compared against each assigned MPPT independently", () => {
  const inverter=inverterCatalog.find(item=>item.id==="deye6k");
  const passed=evaluateInverterMpptCurrentLimits({inverter,stringsPerMppt:[1,1],moduleImpA:12,moduleIscA:20});
  assert.deepEqual(passed.checks.map(item=>item.status),["CUMPLE","CUMPLE","CUMPLE","CUMPLE"]);
  const failed=evaluateInverterMpptCurrentLimits({inverter,stringsPerMppt:[2,1],moduleImpA:14,moduleIscA:23});
  assert.equal(failed.status,"NO CUMPLE");
  assert.deepEqual(failed.checks.map(item=>item.status),["NO CUMPLE","NO CUMPLE","NO CUMPLE","NO CUMPLE"]);
  const unknown=evaluateInverterMpptCurrentLimits({inverter,stringsPerMppt:[1,1,1],moduleImpA:12,moduleIscA:20});
  assert.equal(unknown.status,"VALIDACION PENDIENTE");
});

test("inverter schema includes electrical, battery, environmental, overload and protection evidence fields", () => {
  const schema=TECHNICAL_SCHEMAS.inverter;
  for (const key of ["ratedAcPowerW","apparentPowerVA","maximumOutputCurrentA","maximumOutputCurrentOptions","powerFactorRange","overloadDurationSeconds","outputShortCircuitCurrentA","maximumPvPowerW","maximumDcVoltageV","nominalDcVoltageV","mpptVoltageMinV","mpptVoltageMaxV","startupVoltageV","stringsPerMppt","maximumOperatingCurrentByMpptA","maximumShortCircuitCurrentByMpptA","weightedEfficiencyPercent","operatingTemperatureMinC","operatingTemperatureMaxC","ingressProtection","coolingMethod","maximumAltitudeM","batteryType","batteryVoltageMinV","batteryVoltageMaxV","maximumChargeCurrentA","maximumDischargeCurrentA","maximumChargePowerW","maximumDischargePowerW","bmsCommunication","integratedProtections"]) assert.ok(schema[key],key);
  const oldProject=mergeProjectDefaults({selectedInverterCatalogId:"",inverterW:"",inverterMaxDcVoltage:""},{inverterW:5000,customProjectField:"keep"});
  assert.equal(oldProject.selectedInverterCatalogId,"");
  assert.equal(oldProject.inverterW,5000);
  assert.equal(oldProject.customProjectField,"keep");
});

test("the PC18-8025F controller sheet is exact, manufacturer-sourced, structured by battery voltage and incomplete where data is absent", () => {
  assert.equal(controllerCatalog.length,1);
  const controller=controllerCatalog[0],fields=controller.technicalSheet.fields;
  assert.equal(controller.id,"must80");
  assert.equal(controller.model,"PC18-8025F");
  assert.equal(controller.technicalDataStatus,CATALOG_DATA_STATES.INCOMPLETE);
  assert.equal(controller.technicalSheet.source.verificationStatus,"VERIFIED_EXACT_VARIANT");
  assert.equal(controller.technicalSheet.source.exactVariant,"PC18-8025F (80 A)");
  assert.match(controller.technicalSheet.source.verificationNote,/official-source discrepancy/i);
  assert.match(controller.technicalSheet.source.companionUrl,/PC-PC1800F-145V\.pdf/);
  assert.equal(validateTechnicalSheet(controller.technicalSheet).invalid.length,0);
  assert.deepEqual(fields.supportedBatteryVoltagesV.value,[12,24,36,48]);
  assert.deepEqual(fields.maximumPvInputVoltageByBatteryVoltageV.value,{12:100,24:245,36:245,48:245});
  assert.deepEqual(fields.mpptVoltageRangeByBatteryVoltageV.value,{12:[15,95],24:[30,230],36:[45,230],48:[60,230]});
  assert.deepEqual(fields.maximumPvPowerByBatteryVoltageW.value,{12:1250,24:2500,36:3750,48:5000});
  assert.equal(fields.maximumChargeCurrentA.value,80);
  assert.equal(fields.maximumChargePowerW.value,null);
  assert.equal(fields.maximumInputCurrentA.value,null);
  assert.equal(fields.maximumShortCircuitCurrentA.value,null);
  assert.equal(fields.minimumStartupVoltageV.value,null);
  assert.equal(fields.numberOfInputs.value,null);
  assert.equal(fields.bmsCommunication.value,null);
  assert.equal(fields.maximumUnits.value,null);
  assert.equal(fields.protectionOverCurrent.value,null);
});

test("controller catalog matches exact models only and does not attach the PC18-8025F fiche to the 100 A reference", () => {
  const exact=controllerCatalog[0];
  assert.equal(findExactCommercialControllerMatch(exact,[{id:"other",brand:"MUST",model:"PC18-10025F"}]),null);
  assert.equal(findExactCommercialControllerMatch(exact,[{id:"must80",brand:"MUST",model:"PC18-8025F"}]).id,"must80");
  const selected=getControllerSelectionValues(exact);
  assert.equal(selected.selectedControllerCatalogId,"must80");
  assert.equal(selected.controllerMode,"Controlador externo");
  assert.equal(selected.controllerMaxChargeCurrent,80);
  assert.equal(selected.controllerMaxPvVoltage,"");
  assert.equal(selected.controllerMaxPvPower,"");
  const appSource=readFileSync(new URL("./App.jsx",import.meta.url),"utf8");
  assert.equal((appSource.match(/category":"Controladores MPPT"|category:"Controladores MPPT"/g)||[]).length,9);
  assert.match(appSource,/model:"PC1800F MPPT 100 A"/);
  const genericPwm=prepareCatalogProduct({id:"generic-pwm",category:"Controladores MPPT",brand:"Genérico",model:"Controlador PWM"});
  assert.equal(genericPwm.technicalSheet.fields.technology.value,null);
  assert.equal(genericPwm.technicalDataStatus,CATALOG_DATA_STATES.INSUFFICIENT);
});

test("external controller compatibility checks voltage, MPPT, bank-dependent power and charge current, leaving absent ratings pending", () => {
  const controller=controllerCatalog[0];
  const base={batteryVoltageV:48,stringVocColdV:120,stringVocHotV:110,stringVmpHotV:70,stringVmpColdV:120,installedWp:4000,inputCurrentA:15,inputShortCircuitCurrentA:20,inputShortCircuitCurrentCorrected:false,stringCount:2,chargeCurrentA:50,chargePowerW:2400,batteryChemistry:"Plomo-ácido AGM"};
  const review=evaluateControllerCompatibility({controller,design:base});
  const state=name=>review.checks.find(item=>item.name===name)?.status;
  assert.equal(state("Tensión nominal admitida"),"CUMPLE");
  assert.equal(state("Voc fría vs tensión FV máxima"),"CUMPLE");
  assert.equal(state("Ventana MPPT por temperatura"),"CUMPLE");
  assert.equal(state("Potencia FV a tensión de banco"),"CUMPLE");
  assert.equal(state("Corriente de carga de batería"),"CUMPLE");
  assert.equal(state("Corriente Isc corregida máxima de entrada FV"),"VALIDACION PENDIENTE");
  assert.equal(state("Cantidad de entradas FV"),"VALIDACION PENDIENTE");
  assert.equal(state("Potencia máxima de carga"),"VALIDACION PENDIENTE");
  assert.equal(state("Tipo de batería admitido"),"CUMPLE");
  assert.equal(review.status,"VALIDACION PENDIENTE");
  const conflict=evaluateControllerCompatibility({controller,design:{...base,stringVocColdV:200,stringVmpColdV:210}});
  assert.equal(conflict.checks.find(item=>item.name==="Voc fría vs tensión FV máxima").status,"VALIDACION PENDIENTE");
  assert.equal(conflict.checks.find(item=>item.name==="Ventana MPPT por temperatura").status,"VALIDACION PENDIENTE");
  assert.equal(evaluateControllerCompatibility({controller,design:{...base,batteryVoltageV:60}}).status,"NO CUMPLE");
  assert.equal(evaluateControllerCompatibility({controller,design:{...base,stringVocColdV:Infinity}}).status,"INVALIDO");
  const under12=evaluateControllerCompatibility({controller,design:{...base,batteryVoltageV:12,stringVocColdV:90,stringVocHotV:80,stringVmpHotV:80,stringVmpColdV:90,installedWp:1400}});
  assert.equal(under12.checks.find(item=>item.name==="Potencia FV a tensión de banco").status,"NO CUMPLE");
  const lithium=evaluateControllerCompatibility({controller,design:{...base,batteryChemistry:"Litio (LiFePO4)"}});
  assert.equal(lithium.checks.find(item=>item.name==="BMS/protocolo de batería de litio").status,"VALIDACION PENDIENTE");
  assert.equal(evaluateControllerCompatibility({controller:{technicalSheet:createEmptyTechnicalSheet("controller")},design:base}).status,"VALIDACION PENDIENTE");
});

test("controller voltage tables reject malformed MPPT windows and old projects keep their new ID default safely", () => {
  const sheet=createEmptyTechnicalSheet("controller");
  sheet.fields.mpptVoltageRangeByBatteryVoltageV={value:{48:[230,60]},unit:"tabla",source:{manufacturer:"MUST",documentUrl:"https://mustsolar.example/spec",reviewDate:"2026-11-10",exactVariant:"PC18-8025F"}};
  assert.equal(validateTechnicalSheet(sheet).status,CATALOG_DATA_STATES.INVALID);
  const oldProject=mergeProjectDefaults({selectedControllerCatalogId:"",controllerMode:"Integrado en inversor"},{controllerMaxChargeCurrent:55,customField:"preserved"});
  assert.equal(oldProject.selectedControllerCatalogId,"");
  assert.equal(oldProject.controllerMaxChargeCurrent,55);
  assert.equal(oldProject.customField,"preserved");
});
