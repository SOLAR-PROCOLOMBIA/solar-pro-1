import React, { useEffect, useMemo, useState } from "react";
import { calculateArraySizing, calculateStringLayout, calculateBatteryNominalEnergy, calculateInverterBatteryCurrent, calculatePvChargeCurrent, calculateConductorRun, calculateValidatedConductorRun, calculateAdiabaticSection, evaluateAcBreakerCoordination, calculateAcCumulativeVoltageDrop, calculateAcDesignCurrent, evaluateGpvFuse, validatePvEquipmentGroundingConductor, isValidPercent, mergeProjectDefaults, buildElectricalCircuitModel, buildElectricalBOMRows, buildExternalProtectionRows, resolveMpptCircuitDistance, validateNumericInputs, buildEngineeringStateModel, evaluateProductCompatibility, calculateBudgetTotals, ENGINEERING_STATES } from "./engineering.js";
import {
  Sun, Zap, BatteryCharging, Cable, ShieldCheck, FileText,
  LayoutDashboard, Save, Printer, Trash2, Menu, X,
  ChevronRight, Activity, CircleDollarSign, PanelsTopLeft,
  Network, CheckCircle2, AlertTriangle, Search, Plus,
  GitCompareArrows, Download, Store, ShoppingCart, Filter, ExternalLink
} from "lucide-react";
import "./App.css";
import { supabase } from "./supabase";
import { prepareCatalogProduct, panelCatalog, inverterCatalog, controllerCatalog, getInverterSelectionValues, evaluateInverterBatteryLimits, evaluateInverterMpptCurrentLimits, getControllerSelectionValues, evaluateControllerCompatibility, findExactCommercialControllerMatch, findExactCommercialInverterMatch, getPanelSelectionValues, correctPanelVoltageAtTemperature, evaluatePanelStringVoltageLimits, CATALOG_DATA_STATES } from "./catalog";
import {
  iniciarSesion,
  registrarUsuario,
  cerrarSesion,
  consultarPerfil
} from "./auth";

// CATÃƒÂLOGO INICIAL: referencias con datos tÃƒÂ©cnicos de fichas de fabricante.
// Antes de diseÃƒÂ±ar una instalaciÃƒÂ³n real, verificar la revisiÃƒÂ³n de cada ficha.
// CatÃƒÂ¡logo comercial inicial. Precios observados en comercios colombianos;
// pueden variar por IVA, ciudad, transporte, inventario y fecha de cotizaciÃƒÂ³n.
const commercialCatalogLegacy = [
  {id:"osda450",category:"Paneles solares",brand:"OSDA Solar",model:"ODA450-36-MH",description:"MÃƒÂ³dulo monocristalino de 450 W",specs:["450 Wp","Voc 49,30 V","Vmp 41,5 V","Isc 11,60 A","Imp 10,85 A"],price:984200,tax:0.19,priceNote:"Precio publicado antes de IVA",image:"https://www.neosolar.com.br/media/catalog/product/p/a/painel_solar_osda_450wp_frente.jpg",imageAlt:"Panel solar monocristalino OSDA 450 W",source:"https://tecnoelectric.co/producto/panel-solar-monocristalino-osda-oda450-36-mh-450-w/",sourceName:"TecnoElectric Ã‚Â· ficha y precio",updated:"Consulta 9 nov 2026",imageVerified:true},
  {id:"deye6k",category:"Inversores",brand:"Deye",model:"SUN-6K-SG01LP1-US",description:"Inversor hÃƒÂ­brido de fase dividida",specs:["6.000 W AC","Banco 48 V nominal","MÃƒÂ¡x. PV 7.800 W","Voc mÃƒÂ¡x. 500 V","2 MPPT Ã‚Â· 120/240 V"],price:10570000,tax:0.19,priceNote:"Precio publicado antes de IVA",image:"https://celtecgroup.com/cdn/shop/files/SUN-6K-SG01LP1-US-1_5c46d496-a718-4a2a-a521-197bca8cf8a9.png?v=1743712837&width=1100",imageAlt:"Inversor hÃƒÂ­brido Deye SUN 6 kW",source:"https://tecnoelectric.co/producto/inversor-hibrido-deye-sun-6k-sg01lp1-us-6-kw-de-fase-dividida/",sourceName:"TecnoElectric Ã‚Â· ficha y precio",updated:"Consulta 9 nov 2026",imageVerified:true},
  {id:"must80",category:"Controladores MPPT",brand:"MUST",model:"PC18-8025F",description:"Controlador solar MPPT de 80 A",specs:["12/24/36/48 V","80 A de carga","Entrada PV para banco 48 V: 60Ã¢â‚¬â€œ230 V","Potencia PV mÃƒÂ¡x. a 48 V: 5.000 W"],price:767200,tax:0.19,priceNote:"Precio publicado antes de IVA",image:"https://solervenezuela.com/cdn/shop/files/PC1800F-100-1-1-1.jpg?v=1773760052",imageAlt:"Controlador de carga solar MUST MPPT",source:"https://tecnoelectric.co/producto/controlador-de-carga-solar-mppt-pc18-8025f-80-a/",sourceName:"TecnoElectric Ã‚Â· ficha y precio",updated:"Consulta 9 nov 2026",imageVerified:true},
  {id:"mustbattery12",category:"BaterÃƒÂ­as",brand:"MUST",model:"LP15-12200",description:"BaterÃƒÂ­a LiFePOÃ¢â€šâ€ž con BMS integrado",specs:["12,8 V nominales","200 Ah","2,56 kWh nominales","BMS integrado"],price:1911000,tax:0.19,priceNote:"Precio publicado antes de IVA",image:"https://brain.com.ua/static/images/prod_img/1/2/U0985812_1738646659.jpg",imageAlt:"BaterÃƒÂ­a MUST LiFePO4 LP15 12,8 V 200 Ah",source:"https://tecnoelectric.co/producto/bateria-de-litio-lifepo4-must-lp15-12200-12-8-v-200-ah/",sourceName:"TecnoElectric Ã‚Â· ficha y precio",updated:"Consulta 9 nov 2026",compatNote:"No equivale a una baterÃƒÂ­a de 48 V. No conectarla en serie sin autorizaciÃƒÂ³n expresa del fabricante y verificaciÃƒÂ³n del BMS.",imageVerified:true},
  {id:"suntreebreaker",category:"Protecciones DC",brand:"SUNTREE",model:"SL7N-63 Ã‚Â· 800 V DC",description:"Interruptor termomagnÃƒÂ©tico DC fotovoltaico de dos polos. La corriente se selecciona entre las variantes disponibles del proveedor.",specs:["Hasta 800 V DC segÃƒÂºn ficha del proveedor","Variantes publicadas: 16, 20, 25 y 32 A","Dos polos Ã‚Â· montaje en riel DIN","CertificaciÃƒÂ³n RETIE indicada por el vendedor"],price:76855,tax:0,priceNote:"Precio publicado; confirmar amperaje y disponibilidad",image:"https://cdnx.jumpseller.com/suneo-energy-sas/image/62570570/thumb/719/719?1744834227=",imageAlt:"Breaker DC SUNTREE SL7N-63 de dos polos",source:"https://suneoenergy.com.co/breaker-dc-suntree-800v-dc-retie",sourceName:"Suneo Energy Ã‚Â· producto",updated:"Consulta web 9 nov 2026",imageVerified:true},
  {id:"rail-aluminum",category:"Estructuras",brand:"Sistema de montaje",model:"Riel de aluminio fotovoltaico",description:"Riel para fijaciÃƒÂ³n de mÃƒÂ³dulos en cubierta",specs:["Perfil de aluminio anodizado","Longitud y anclajes dependen del techo","Verificar cargas de viento y estructura"],price:null,tax:0,priceNote:"Precio bajo cotizaciÃƒÂ³n",image:"https://tropika.cl/cdn/shop/files/Captura_de_pantalla_2026-05-19_a_la_s_8.06.14_p.m..png?v=1779235596&width=1204",imageAlt:"Riel de aluminio para estructura solar",source:"https://tropika.cl/collections/estructura-paneles-solares",sourceName:"Referencia visual de riel",updated:"Precio por cotizar"},
  {id:"pv-cable",category:"Cableado y conectores",brand:"Cable fotovoltaico",model:"Cable solar 4 mmÃ‚Â² con MC4",description:"Cableado de conexiÃƒÂ³n para campo fotovoltaico",specs:["SecciÃƒÂ³n ilustrativa: 4 mmÃ‚Â²","Seleccionar tensiÃƒÂ³n, temperatura y longitud","Verificar certificaciÃƒÂ³n y compatibilidad MC4"],price:null,tax:0,priceNote:"Precio bajo cotizaciÃƒÂ³n",image:"https://toprik.com/images/detailed/64/Solar-Cable-4-mm%C2%B2-with-MC4-Connectors-5m.jpg",imageAlt:"Cable solar con conectores MC4",source:"https://www.colombiasuministros.com/energia-solar",sourceName:"Accesorios solares Ã‚Â· referencia comercial",updated:"Precio por cotizar"},
  {"id":"gen-mÃƒÂ³dulo-monocristalino-perc-1","category":"Paneles solares","brand":"GenÃƒÂ©rico / por especificar","model":"MÃƒÂ³dulo monocristalino PERC","description":"MÃƒÂ³dulo monocristalino PERC. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-mÃƒÂ³dulo-monocristalino-topcon-n-type-2","category":"Paneles solares","brand":"GenÃƒÂ©rico / por especificar","model":"MÃƒÂ³dulo monocristalino TOPCon N-type","description":"MÃƒÂ³dulo monocristalino TOPCon N-type. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-mÃƒÂ³dulo-bifacial-vidrio-vidrio-3","category":"Paneles solares","brand":"GenÃƒÂ©rico / por especificar","model":"MÃƒÂ³dulo bifacial vidrio-vidrio","description":"MÃƒÂ³dulo bifacial vidrio-vidrio. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-mÃƒÂ³dulo-half-cell-4","category":"Paneles solares","brand":"GenÃƒÂ©rico / por especificar","model":"MÃƒÂ³dulo half-cell","description":"MÃƒÂ³dulo half-cell. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-mÃƒÂ³dulo-flexible-5","category":"Paneles solares","brand":"GenÃƒÂ©rico / por especificar","model":"MÃƒÂ³dulo flexible","description":"MÃƒÂ³dulo flexible. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-mÃƒÂ³dulo-de-pelÃƒÂ­cula-delgada-6","category":"Paneles solares","brand":"GenÃƒÂ©rico / por especificar","model":"MÃƒÂ³dulo de pelÃƒÂ­cula delgada","description":"MÃƒÂ³dulo de pelÃƒÂ­cula delgada. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-mÃƒÂ³dulo-de-alta-potencia-utility-scale-7","category":"Paneles solares","brand":"GenÃƒÂ©rico / por especificar","model":"MÃƒÂ³dulo de alta potencia utility-scale","description":"MÃƒÂ³dulo de alta potencia utility-scale. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-conector-de-derivaciÃƒÂ³n-para-panel-8","category":"Paneles solares","brand":"GenÃƒÂ©rico / por especificar","model":"Conector de derivaciÃƒÂ³n para panel","description":"Conector de derivaciÃƒÂ³n para panel. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-cable-de-salida-de-mÃƒÂ³dulo-9","category":"Paneles solares","brand":"GenÃƒÂ©rico / por especificar","model":"Cable de salida de mÃƒÂ³dulo","description":"Cable de salida de mÃƒÂ³dulo. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-caja-de-conexiones-de-mÃƒÂ³dulo-10","category":"Paneles solares","brand":"GenÃƒÂ©rico / por especificar","model":"Caja de conexiones de mÃƒÂ³dulo","description":"Caja de conexiones de mÃƒÂ³dulo. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-diodo-bypass-de-repuesto-11","category":"Paneles solares","brand":"GenÃƒÂ©rico / por especificar","model":"Diodo bypass de repuesto","description":"Diodo bypass de repuesto. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-inversor-string-on-grid-monofÃƒÂ¡sico-1","category":"Inversores","brand":"GenÃƒÂ©rico / por especificar","model":"Inversor string ON-GRID monofÃƒÂ¡sico","description":"Inversor string ON-GRID monofÃƒÂ¡sico. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-inversor-string-on-grid-trifÃƒÂ¡sico-2","category":"Inversores","brand":"GenÃƒÂ©rico / por especificar","model":"Inversor string ON-GRID trifÃƒÂ¡sico","description":"Inversor string ON-GRID trifÃƒÂ¡sico. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-inversor-hÃƒÂ­brido-monofÃƒÂ¡sico-3","category":"Inversores","brand":"GenÃƒÂ©rico / por especificar","model":"Inversor hÃƒÂ­brido monofÃƒÂ¡sico","description":"Inversor hÃƒÂ­brido monofÃƒÂ¡sico. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-inversor-hÃƒÂ­brido-trifÃƒÂ¡sico-4","category":"Inversores","brand":"GenÃƒÂ©rico / por especificar","model":"Inversor hÃƒÂ­brido trifÃƒÂ¡sico","description":"Inversor hÃƒÂ­brido trifÃƒÂ¡sico. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-inversor-off-grid-de-onda-senoidal-pura-5","category":"Inversores","brand":"GenÃƒÂ©rico / por especificar","model":"Inversor OFF-GRID de onda senoidal pura","description":"Inversor OFF-GRID de onda senoidal pura. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-microinversor-6","category":"Inversores","brand":"GenÃƒÂ©rico / por especificar","model":"Microinversor","description":"Microinversor. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-optimizador-de-potencia-7","category":"Inversores","brand":"GenÃƒÂ©rico / por especificar","model":"Optimizador de potencia","description":"Optimizador de potencia. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-gateway-de-monitoreo-8","category":"Inversores","brand":"GenÃƒÂ©rico / por especificar","model":"Gateway de monitoreo","description":"Gateway de monitoreo. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-datalogger-wi-fi-9","category":"Inversores","brand":"GenÃƒÂ©rico / por especificar","model":"Datalogger Wi-Fi","description":"Datalogger Wi-Fi. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-medidor-inteligente-smart-meter-10","category":"Inversores","brand":"GenÃƒÂ©rico / por especificar","model":"Medidor inteligente / smart meter","description":"Medidor inteligente / smart meter. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-transformador-de-corriente-ct-11","category":"Inversores","brand":"GenÃƒÂ©rico / por especificar","model":"Transformador de corriente CT","description":"Transformador de corriente CT. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-mÃƒÂ³dulo-de-comunicaciÃƒÂ³n-rs485-12","category":"Inversores","brand":"GenÃƒÂ©rico / por especificar","model":"MÃƒÂ³dulo de comunicaciÃƒÂ³n RS485","description":"MÃƒÂ³dulo de comunicaciÃƒÂ³n RS485. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-controlador-mppt-12-24-v-1","category":"Controladores MPPT","brand":"GenÃƒÂ©rico / por especificar","model":"Controlador MPPT 12/24 V","description":"Controlador MPPT 12/24 V. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-controlador-mppt-48-v-2","category":"Controladores MPPT","brand":"GenÃƒÂ©rico / por especificar","model":"Controlador MPPT 48 V","description":"Controlador MPPT 48 V. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-controlador-mppt-de-alta-tensiÃƒÂ³n-3","category":"Controladores MPPT","brand":"GenÃƒÂ©rico / por especificar","model":"Controlador MPPT de alta tensiÃƒÂ³n","description":"Controlador MPPT de alta tensiÃƒÂ³n. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-controlador-pwm-4","category":"Controladores MPPT","brand":"GenÃƒÂ©rico / por especificar","model":"Controlador PWM","description":"Controlador PWM. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-pantalla-remota-de-controlador-5","category":"Controladores MPPT","brand":"GenÃƒÂ©rico / por especificar","model":"Pantalla remota de controlador","description":"Pantalla remota de controlador. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-sensor-de-temperatura-de-baterÃƒÂ­a-6","category":"Controladores MPPT","brand":"GenÃƒÂ©rico / por especificar","model":"Sensor de temperatura de baterÃƒÂ­a","description":"Sensor de temperatura de baterÃƒÂ­a. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-cable-de-comunicaciÃƒÂ³n-del-controlador-7","category":"Controladores MPPT","brand":"GenÃƒÂ©rico / por especificar","model":"Cable de comunicaciÃƒÂ³n del controlador","description":"Cable de comunicaciÃƒÂ³n del controlador. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-baterÃƒÂ­a-lifepo4-mural-1","category":"BaterÃƒÂ­as","brand":"GenÃƒÂ©rico / por especificar","model":"BaterÃƒÂ­a LiFePO4 mural","description":"BaterÃƒÂ­a LiFePO4 mural. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-baterÃƒÂ­a-lifepo4-rack-2","category":"BaterÃƒÂ­as","brand":"GenÃƒÂ©rico / por especificar","model":"BaterÃƒÂ­a LiFePO4 rack","description":"BaterÃƒÂ­a LiFePO4 rack. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-baterÃƒÂ­a-agm-3","category":"BaterÃƒÂ­as","brand":"GenÃƒÂ©rico / por especificar","model":"BaterÃƒÂ­a AGM","description":"BaterÃƒÂ­a AGM. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-baterÃƒÂ­a-gel-4","category":"BaterÃƒÂ­as","brand":"GenÃƒÂ©rico / por especificar","model":"BaterÃƒÂ­a GEL","description":"BaterÃƒÂ­a GEL. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-baterÃƒÂ­a-opzs-estacionaria-5","category":"BaterÃƒÂ­as","brand":"GenÃƒÂ©rico / por especificar","model":"BaterÃƒÂ­a OPzS estacionaria","description":"BaterÃƒÂ­a OPzS estacionaria. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-baterÃƒÂ­a-opzv-estacionaria-6","category":"BaterÃƒÂ­as","brand":"GenÃƒÂ©rico / por especificar","model":"BaterÃƒÂ­a OPzV estacionaria","description":"BaterÃƒÂ­a OPzV estacionaria. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-mÃƒÂ³dulo-de-baterÃƒÂ­a-de-alto-voltaje-7","category":"BaterÃƒÂ­as","brand":"GenÃƒÂ©rico / por especificar","model":"MÃƒÂ³dulo de baterÃƒÂ­a de alto voltaje","description":"MÃƒÂ³dulo de baterÃƒÂ­a de alto voltaje. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-gabinete-para-banco-de-baterÃƒÂ­as-8","category":"BaterÃƒÂ­as","brand":"GenÃƒÂ©rico / por especificar","model":"Gabinete para banco de baterÃƒÂ­as","description":"Gabinete para banco de baterÃƒÂ­as. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-bms-maestro-9","category":"BaterÃƒÂ­as","brand":"GenÃƒÂ©rico / por especificar","model":"BMS maestro","description":"BMS maestro. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-bms-esclavo-10","category":"BaterÃƒÂ­as","brand":"GenÃƒÂ©rico / por especificar","model":"BMS esclavo","description":"BMS esclavo. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-cable-de-interconexiÃƒÂ³n-de-baterÃƒÂ­as-11","category":"BaterÃƒÂ­as","brand":"GenÃƒÂ©rico / por especificar","model":"Cable de interconexiÃƒÂ³n de baterÃƒÂ­as","description":"Cable de interconexiÃƒÂ³n de baterÃƒÂ­as. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-barra-colectora-para-baterÃƒÂ­as-12","category":"BaterÃƒÂ­as","brand":"GenÃƒÂ©rico / por especificar","model":"Barra colectora para baterÃƒÂ­as","description":"Barra colectora para baterÃƒÂ­as. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-fusible-principal-de-baterÃƒÂ­a-13","category":"BaterÃƒÂ­as","brand":"GenÃƒÂ©rico / por especificar","model":"Fusible principal de baterÃƒÂ­a","description":"Fusible principal de baterÃƒÂ­a. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-fusible-gpv-1","category":"Protecciones DC","brand":"GenÃƒÂ©rico / por especificar","model":"Fusible gPV","description":"Fusible gPV. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-portafusible-gpv-2","category":"Protecciones DC","brand":"GenÃƒÂ©rico / por especificar","model":"Portafusible gPV","description":"Portafusible gPV. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-interruptor-termomagnÃƒÂ©tico-dc-3","category":"Protecciones DC","brand":"GenÃƒÂ©rico / por especificar","model":"Interruptor termomagnÃƒÂ©tico DC","description":"Interruptor termomagnÃƒÂ©tico DC. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-seccionador-dc-bajo-carga-4","category":"Protecciones DC","brand":"GenÃƒÂ©rico / por especificar","model":"Seccionador DC bajo carga","description":"Seccionador DC bajo carga. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-dps-tipo-2-dc-5","category":"Protecciones DC","brand":"GenÃƒÂ©rico / por especificar","model":"DPS tipo 2 DC","description":"DPS tipo 2 DC. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-dps-tipo-1-2-dc-6","category":"Protecciones DC","brand":"GenÃƒÂ©rico / por especificar","model":"DPS tipo 1+2 DC","description":"DPS tipo 1+2 DC. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-caja-combinadora-dc-7","category":"Protecciones DC","brand":"GenÃƒÂ©rico / por especificar","model":"Caja combinadora DC","description":"Caja combinadora DC. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-interruptor-de-baterÃƒÂ­a-8","category":"Protecciones DC","brand":"GenÃƒÂ©rico / por especificar","model":"Interruptor de baterÃƒÂ­a","description":"Interruptor de baterÃƒÂ­a. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-caja-de-protecciÃƒÂ³n-de-baterÃƒÂ­a-9","category":"Protecciones DC","brand":"GenÃƒÂ©rico / por especificar","model":"Caja de protecciÃƒÂ³n de baterÃƒÂ­a","description":"Caja de protecciÃƒÂ³n de baterÃƒÂ­a. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-conector-mc4-con-fusible-10","category":"Protecciones DC","brand":"GenÃƒÂ©rico / por especificar","model":"Conector MC4 con fusible","description":"Conector MC4 con fusible. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-diodo-de-bloqueo-11","category":"Protecciones DC","brand":"GenÃƒÂ©rico / por especificar","model":"Diodo de bloqueo","description":"Diodo de bloqueo. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-bornera-de-distribuciÃƒÂ³n-dc-12","category":"Protecciones DC","brand":"GenÃƒÂ©rico / por especificar","model":"Bornera de distribuciÃƒÂ³n DC","description":"Bornera de distribuciÃƒÂ³n DC. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-interruptor-termomagnÃƒÂ©tico-ac-1","category":"Protecciones AC","brand":"GenÃƒÂ©rico / por especificar","model":"Interruptor termomagnÃƒÂ©tico AC","description":"Interruptor termomagnÃƒÂ©tico AC. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-interruptor-diferencial-rcd-2","category":"Protecciones AC","brand":"GenÃƒÂ©rico / por especificar","model":"Interruptor diferencial RCD","description":"Interruptor diferencial RCD. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-interruptor-diferencial-tipo-a-3","category":"Protecciones AC","brand":"GenÃƒÂ©rico / por especificar","model":"Interruptor diferencial tipo A","description":"Interruptor diferencial tipo A. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-interruptor-diferencial-tipo-b-4","category":"Protecciones AC","brand":"GenÃƒÂ©rico / por especificar","model":"Interruptor diferencial tipo B","description":"Interruptor diferencial tipo B. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-dps-tipo-2-ac-5","category":"Protecciones AC","brand":"GenÃƒÂ©rico / por especificar","model":"DPS tipo 2 AC","description":"DPS tipo 2 AC. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-dps-tipo-1-2-ac-6","category":"Protecciones AC","brand":"GenÃƒÂ©rico / por especificar","model":"DPS tipo 1+2 AC","description":"DPS tipo 1+2 AC. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-seccionador-ac-7","category":"Protecciones AC","brand":"GenÃƒÂ©rico / por especificar","model":"Seccionador AC","description":"Seccionador AC. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-interruptor-en-caja-moldeada-mccb-8","category":"Protecciones AC","brand":"GenÃƒÂ©rico / por especificar","model":"Interruptor en caja moldeada MCCB","description":"Interruptor en caja moldeada MCCB. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-tablero-de-distribuciÃƒÂ³n-ac-9","category":"Protecciones AC","brand":"GenÃƒÂ©rico / por especificar","model":"Tablero de distribuciÃƒÂ³n AC","description":"Tablero de distribuciÃƒÂ³n AC. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-gabinete-para-protecciones-ac-10","category":"Protecciones AC","brand":"GenÃƒÂ©rico / por especificar","model":"Gabinete para protecciones AC","description":"Gabinete para protecciones AC. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-relÃƒÂ©-de-protecciÃƒÂ³n-de-red-11","category":"Protecciones AC","brand":"GenÃƒÂ©rico / por especificar","model":"RelÃƒÂ© de protecciÃƒÂ³n de red","description":"RelÃƒÂ© de protecciÃƒÂ³n de red. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-protecciÃƒÂ³n-anti-isla-externa-12","category":"Protecciones AC","brand":"GenÃƒÂ©rico / por especificar","model":"ProtecciÃƒÂ³n anti-isla externa","description":"ProtecciÃƒÂ³n anti-isla externa. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-riel-de-aluminio-anodizado-1","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Riel de aluminio anodizado","description":"Riel de aluminio anodizado. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-perfil-estructural-de-aluminio-2","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Perfil estructural de aluminio","description":"Perfil estructural de aluminio. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-perfil-de-acero-galvanizado-3","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Perfil de acero galvanizado","description":"Perfil de acero galvanizado. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-soporte-triangular-para-cubierta-4","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Soporte triangular para cubierta","description":"Soporte triangular para cubierta. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-estructura-coplanar-para-teja-metÃƒÂ¡lica-5","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Estructura coplanar para teja metÃƒÂ¡lica","description":"Estructura coplanar para teja metÃƒÂ¡lica. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-estructura-para-teja-de-barro-6","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Estructura para teja de barro","description":"Estructura para teja de barro. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-estructura-para-cubierta-plana-7","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Estructura para cubierta plana","description":"Estructura para cubierta plana. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-estructura-lastrada-8","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Estructura lastrada","description":"Estructura lastrada. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-estructura-hincada-para-suelo-9","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Estructura hincada para suelo","description":"Estructura hincada para suelo. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-estructura-con-micropilotes-10","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Estructura con micropilotes","description":"Estructura con micropilotes. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-estructura-tipo-marquesina-solar-11","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Estructura tipo marquesina solar","description":"Estructura tipo marquesina solar. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-estructura-tipo-carport-12","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Estructura tipo carport","description":"Estructura tipo carport. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-torre-soporte-para-paneles-13","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Torre soporte para paneles","description":"Torre soporte para paneles. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-poste-galvanizado-14","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Poste galvanizado","description":"Poste galvanizado. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-viga-transversal-15","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Viga transversal","description":"Viga transversal. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-empalme-de-riel-16","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Empalme de riel","description":"Empalme de riel. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-uniÃƒÂ³n-de-perfil-17","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"UniÃƒÂ³n de perfil","description":"UniÃƒÂ³n de perfil. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-base-de-soporte-18","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Base de soporte","description":"Base de soporte. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-pata-regulable-19","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Pata regulable","description":"Pata regulable. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-abrazadera-de-estructura-20","category":"Estructuras","brand":"GenÃƒÂ©rico / por especificar","model":"Abrazadera de estructura","description":"Abrazadera de estructura. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-grapa-intermedia-de-mÃƒÂ³dulo-1","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Grapa intermedia de mÃƒÂ³dulo","description":"Grapa intermedia de mÃƒÂ³dulo. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-grapa-terminal-de-mÃƒÂ³dulo-2","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Grapa terminal de mÃƒÂ³dulo","description":"Grapa terminal de mÃƒÂ³dulo. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-grapa-de-puesta-a-tierra-3","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Grapa de puesta a tierra","description":"Grapa de puesta a tierra. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-tornillo-autoperforante-inoxidable-4","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Tornillo autoperforante inoxidable","description":"Tornillo autoperforante inoxidable. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-tornillo-cabeza-hexagonal-5","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Tornillo cabeza hexagonal","description":"Tornillo cabeza hexagonal. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-perno-hexagonal-inoxidable-6","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Perno hexagonal inoxidable","description":"Perno hexagonal inoxidable. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-perno-tipo-t-para-riel-7","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Perno tipo T para riel","description":"Perno tipo T para riel. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-tuerca-hexagonal-8","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Tuerca hexagonal","description":"Tuerca hexagonal. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-tuerca-de-canal-tuerca-deslizante-9","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Tuerca de canal / tuerca deslizante","description":"Tuerca de canal / tuerca deslizante. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-arandela-plana-10","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Arandela plana","description":"Arandela plana. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-arandela-de-presiÃƒÂ³n-11","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Arandela de presiÃƒÂ³n","description":"Arandela de presiÃƒÂ³n. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-arandela-grower-12","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Arandela grower","description":"Arandela grower. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-arandela-de-sellado-epdm-13","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Arandela de sellado EPDM","description":"Arandela de sellado EPDM. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-anclaje-expansivo-14","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Anclaje expansivo","description":"Anclaje expansivo. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-anclaje-quÃƒÂ­mico-15","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Anclaje quÃƒÂ­mico","description":"Anclaje quÃƒÂ­mico. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-espÃƒÂ¡rrago-roscado-16","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"EspÃƒÂ¡rrago roscado","description":"EspÃƒÂ¡rrago roscado. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-abrazadera-omega-17","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Abrazadera omega","description":"Abrazadera omega. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-abrazadera-tipo-u-18","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Abrazadera tipo U","description":"Abrazadera tipo U. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-remache-estructural-19","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Remache estructural","description":"Remache estructural. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-tapÃƒÂ³n-terminal-de-riel-20","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"TapÃƒÂ³n terminal de riel","description":"TapÃƒÂ³n terminal de riel. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-tapa-de-perfil-21","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Tapa de perfil","description":"Tapa de perfil. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-sello-impermeable-para-cubierta-22","category":"Fijaciones y tornillerÃƒÂ­a","brand":"GenÃƒÂ©rico / por especificar","model":"Sello impermeable para cubierta","description":"Sello impermeable para cubierta. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-cable-fotovoltaico-4-mmÃ‚Â²-1","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Cable fotovoltaico 4 mmÃ‚Â²","description":"Cable fotovoltaico 4 mmÃ‚Â². Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-cable-fotovoltaico-6-mmÃ‚Â²-2","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Cable fotovoltaico 6 mmÃ‚Â²","description":"Cable fotovoltaico 6 mmÃ‚Â². Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-cable-fotovoltaico-10-mmÃ‚Â²-3","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Cable fotovoltaico 10 mmÃ‚Â²","description":"Cable fotovoltaico 10 mmÃ‚Â². Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-cable-de-cobre-thhn-thwn-2-4","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Cable de cobre THHN/THWN-2","description":"Cable de cobre THHN/THWN-2. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-cable-flexible-de-baterÃƒÂ­a-5","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Cable flexible de baterÃƒÂ­a","description":"Cable flexible de baterÃƒÂ­a. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-cable-de-puesta-a-tierra-6","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Cable de puesta a tierra","description":"Cable de puesta a tierra. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-conector-mc4-macho-7","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Conector MC4 macho","description":"Conector MC4 macho. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-conector-mc4-hembra-8","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Conector MC4 hembra","description":"Conector MC4 hembra. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-conector-mc4-tipo-y-9","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Conector MC4 tipo Y","description":"Conector MC4 tipo Y. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-conector-mc4-tipo-t-10","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Conector MC4 tipo T","description":"Conector MC4 tipo T. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-terminal-de-compresiÃƒÂ³n-de-cobre-11","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Terminal de compresiÃƒÂ³n de cobre","description":"Terminal de compresiÃƒÂ³n de cobre. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-terminal-bimetÃƒÂ¡lico-12","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Terminal bimetÃƒÂ¡lico","description":"Terminal bimetÃƒÂ¡lico. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-terminal-ojal-13","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Terminal ojal","description":"Terminal ojal. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-empalme-recto-para-cable-14","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Empalme recto para cable","description":"Empalme recto para cable. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-prensaestopa-ip68-15","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Prensaestopa IP68","description":"Prensaestopa IP68. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-caja-de-paso-estanca-16","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Caja de paso estanca","description":"Caja de paso estanca. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-bornera-de-conexiÃƒÂ³n-17","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Bornera de conexiÃƒÂ³n","description":"Bornera de conexiÃƒÂ³n. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-marcador-de-cable-18","category":"Cableado y conectores","brand":"GenÃƒÂ©rico / por especificar","model":"Marcador de cable","description":"Marcador de cable. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-tuberÃƒÂ­a-emt-1","category":"Canalizaciones y gabinetes","brand":"GenÃƒÂ©rico / por especificar","model":"TuberÃƒÂ­a EMT","description":"TuberÃƒÂ­a EMT. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-tuberÃƒÂ­a-pvc-conduit-2","category":"Canalizaciones y gabinetes","brand":"GenÃƒÂ©rico / por especificar","model":"TuberÃƒÂ­a PVC conduit","description":"TuberÃƒÂ­a PVC conduit. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-tuberÃƒÂ­a-corrugada-uv-3","category":"Canalizaciones y gabinetes","brand":"GenÃƒÂ©rico / por especificar","model":"TuberÃƒÂ­a corrugada UV","description":"TuberÃƒÂ­a corrugada UV. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-canaleta-portacables-4","category":"Canalizaciones y gabinetes","brand":"GenÃƒÂ©rico / por especificar","model":"Canaleta portacables","description":"Canaleta portacables. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-bandeja-portacables-5","category":"Canalizaciones y gabinetes","brand":"GenÃƒÂ©rico / por especificar","model":"Bandeja portacables","description":"Bandeja portacables. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-curva-conduit-6","category":"Canalizaciones y gabinetes","brand":"GenÃƒÂ©rico / por especificar","model":"Curva conduit","description":"Curva conduit. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-uniÃƒÂ³n-conduit-7","category":"Canalizaciones y gabinetes","brand":"GenÃƒÂ©rico / por especificar","model":"UniÃƒÂ³n conduit","description":"UniÃƒÂ³n conduit. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-conector-conduit-8","category":"Canalizaciones y gabinetes","brand":"GenÃƒÂ©rico / por especificar","model":"Conector conduit","description":"Conector conduit. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-caja-de-paso-ip65-9","category":"Canalizaciones y gabinetes","brand":"GenÃƒÂ©rico / por especificar","model":"Caja de paso IP65","description":"Caja de paso IP65. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-gabinete-metÃƒÂ¡lico-ip65-10","category":"Canalizaciones y gabinetes","brand":"GenÃƒÂ©rico / por especificar","model":"Gabinete metÃƒÂ¡lico IP65","description":"Gabinete metÃƒÂ¡lico IP65. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-gabinete-plÃƒÂ¡stico-ip65-11","category":"Canalizaciones y gabinetes","brand":"GenÃƒÂ©rico / por especificar","model":"Gabinete plÃƒÂ¡stico IP65","description":"Gabinete plÃƒÂ¡stico IP65. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-prensaestopa-para-gabinete-12","category":"Canalizaciones y gabinetes","brand":"GenÃƒÂ©rico / por especificar","model":"Prensaestopa para gabinete","description":"Prensaestopa para gabinete. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-abrazadera-de-tuberÃƒÂ­a-13","category":"Canalizaciones y gabinetes","brand":"GenÃƒÂ©rico / por especificar","model":"Abrazadera de tuberÃƒÂ­a","description":"Abrazadera de tuberÃƒÂ­a. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-soporte-de-bandeja-14","category":"Canalizaciones y gabinetes","brand":"GenÃƒÂ©rico / por especificar","model":"Soporte de bandeja","description":"Soporte de bandeja. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-malla-portacables-15","category":"Canalizaciones y gabinetes","brand":"GenÃƒÂ©rico / por especificar","model":"Malla portacables","description":"Malla portacables. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-varilla-copperweld-1","category":"Puesta a tierra","brand":"GenÃƒÂ©rico / por especificar","model":"Varilla copperweld","description":"Varilla copperweld. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-cable-de-cobre-desnudo-2","category":"Puesta a tierra","brand":"GenÃƒÂ©rico / por especificar","model":"Cable de cobre desnudo","description":"Cable de cobre desnudo. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-cable-verde-amarillo-de-protecciÃƒÂ³n-3","category":"Puesta a tierra","brand":"GenÃƒÂ©rico / por especificar","model":"Cable verde/amarillo de protecciÃƒÂ³n","description":"Cable verde/amarillo de protecciÃƒÂ³n. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-barra-equipotencial-4","category":"Puesta a tierra","brand":"GenÃƒÂ©rico / por especificar","model":"Barra equipotencial","description":"Barra equipotencial. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-barra-de-tierra-para-tablero-5","category":"Puesta a tierra","brand":"GenÃƒÂ©rico / por especificar","model":"Barra de tierra para tablero","description":"Barra de tierra para tablero. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-conector-tipo-acorn-6","category":"Puesta a tierra","brand":"GenÃƒÂ©rico / por especificar","model":"Conector tipo acorn","description":"Conector tipo acorn. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-conector-de-compresiÃƒÂ³n-7","category":"Puesta a tierra","brand":"GenÃƒÂ©rico / por especificar","model":"Conector de compresiÃƒÂ³n","description":"Conector de compresiÃƒÂ³n. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-molde-de-soldadura-exotÃƒÂ©rmica-8","category":"Puesta a tierra","brand":"GenÃƒÂ©rico / por especificar","model":"Molde de soldadura exotÃƒÂ©rmica","description":"Molde de soldadura exotÃƒÂ©rmica. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-carga-de-soldadura-exotÃƒÂ©rmica-9","category":"Puesta a tierra","brand":"GenÃƒÂ©rico / por especificar","model":"Carga de soldadura exotÃƒÂ©rmica","description":"Carga de soldadura exotÃƒÂ©rmica. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-caja-de-inspecciÃƒÂ³n-de-tierra-10","category":"Puesta a tierra","brand":"GenÃƒÂ©rico / por especificar","model":"Caja de inspecciÃƒÂ³n de tierra","description":"Caja de inspecciÃƒÂ³n de tierra. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-puente-equipotencial-11","category":"Puesta a tierra","brand":"GenÃƒÂ©rico / por especificar","model":"Puente equipotencial","description":"Puente equipotencial. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-abrazadera-de-puesta-a-tierra-12","category":"Puesta a tierra","brand":"GenÃƒÂ©rico / por especificar","model":"Abrazadera de puesta a tierra","description":"Abrazadera de puesta a tierra. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-medidor-bidireccional-1","category":"Monitoreo y comunicaciones","brand":"GenÃƒÂ©rico / por especificar","model":"Medidor bidireccional","description":"Medidor bidireccional. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-analizador-de-redes-2","category":"Monitoreo y comunicaciones","brand":"GenÃƒÂ©rico / por especificar","model":"Analizador de redes","description":"Analizador de redes. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-datalogger-ethernet-3","category":"Monitoreo y comunicaciones","brand":"GenÃƒÂ©rico / por especificar","model":"Datalogger Ethernet","description":"Datalogger Ethernet. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-datalogger-wi-fi-4","category":"Monitoreo y comunicaciones","brand":"GenÃƒÂ©rico / por especificar","model":"Datalogger Wi-Fi","description":"Datalogger Wi-Fi. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-mÃƒÂ³dulo-4g-de-monitoreo-5","category":"Monitoreo y comunicaciones","brand":"GenÃƒÂ©rico / por especificar","model":"MÃƒÂ³dulo 4G de monitoreo","description":"MÃƒÂ³dulo 4G de monitoreo. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-cable-rs485-apantallado-6","category":"Monitoreo y comunicaciones","brand":"GenÃƒÂ©rico / por especificar","model":"Cable RS485 apantallado","description":"Cable RS485 apantallado. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-cable-ethernet-industrial-7","category":"Monitoreo y comunicaciones","brand":"GenÃƒÂ©rico / por especificar","model":"Cable Ethernet industrial","description":"Cable Ethernet industrial. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-convertidor-rs485-a-ethernet-8","category":"Monitoreo y comunicaciones","brand":"GenÃƒÂ©rico / por especificar","model":"Convertidor RS485 a Ethernet","description":"Convertidor RS485 a Ethernet. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-antena-de-comunicaciÃƒÂ³n-9","category":"Monitoreo y comunicaciones","brand":"GenÃƒÂ©rico / por especificar","model":"Antena de comunicaciÃƒÂ³n","description":"Antena de comunicaciÃƒÂ³n. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-sensor-de-irradiancia-10","category":"Monitoreo y comunicaciones","brand":"GenÃƒÂ©rico / por especificar","model":"Sensor de irradiancia","description":"Sensor de irradiancia. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-sensor-de-temperatura-de-mÃƒÂ³dulo-11","category":"Monitoreo y comunicaciones","brand":"GenÃƒÂ©rico / por especificar","model":"Sensor de temperatura de mÃƒÂ³dulo","description":"Sensor de temperatura de mÃƒÂ³dulo. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-estaciÃƒÂ³n-meteorolÃƒÂ³gica-12","category":"Monitoreo y comunicaciones","brand":"GenÃƒÂ©rico / por especificar","model":"EstaciÃƒÂ³n meteorolÃƒÂ³gica","description":"EstaciÃƒÂ³n meteorolÃƒÂ³gica. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-pinza-amperimÃƒÂ©trica-dc-ac-1","category":"Herramientas y mediciÃƒÂ³n","brand":"GenÃƒÂ©rico / por especificar","model":"Pinza amperimÃƒÂ©trica DC/AC","description":"Pinza amperimÃƒÂ©trica DC/AC. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-multÃƒÂ­metro-trms-2","category":"Herramientas y mediciÃƒÂ³n","brand":"GenÃƒÂ©rico / por especificar","model":"MultÃƒÂ­metro TRMS","description":"MultÃƒÂ­metro TRMS. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-megÃƒÂ³hmetro-medidor-de-aislamiento-3","category":"Herramientas y mediciÃƒÂ³n","brand":"GenÃƒÂ©rico / por especificar","model":"MegÃƒÂ³hmetro / medidor de aislamiento","description":"MegÃƒÂ³hmetro / medidor de aislamiento. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-trazador-de-curva-i-v-4","category":"Herramientas y mediciÃƒÂ³n","brand":"GenÃƒÂ©rico / por especificar","model":"Trazador de curva I-V","description":"Trazador de curva I-V. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-medidor-de-irradiancia-5","category":"Herramientas y mediciÃƒÂ³n","brand":"GenÃƒÂ©rico / por especificar","model":"Medidor de irradiancia","description":"Medidor de irradiancia. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-probador-de-continuidad-de-tierra-6","category":"Herramientas y mediciÃƒÂ³n","brand":"GenÃƒÂ©rico / por especificar","model":"Probador de continuidad de tierra","description":"Probador de continuidad de tierra. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-crimpadora-mc4-7","category":"Herramientas y mediciÃƒÂ³n","brand":"GenÃƒÂ©rico / por especificar","model":"Crimpadora MC4","description":"Crimpadora MC4. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-llave-de-montaje-mc4-8","category":"Herramientas y mediciÃƒÂ³n","brand":"GenÃƒÂ©rico / por especificar","model":"Llave de montaje MC4","description":"Llave de montaje MC4. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-pelacables-9","category":"Herramientas y mediciÃƒÂ³n","brand":"GenÃƒÂ©rico / por especificar","model":"Pelacables","description":"Pelacables. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-cortacables-10","category":"Herramientas y mediciÃƒÂ³n","brand":"GenÃƒÂ©rico / por especificar","model":"Cortacables","description":"Cortacables. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-prensa-terminal-hidrÃƒÂ¡ulica-11","category":"Herramientas y mediciÃƒÂ³n","brand":"GenÃƒÂ©rico / por especificar","model":"Prensa terminal hidrÃƒÂ¡ulica","description":"Prensa terminal hidrÃƒÂ¡ulica. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-torquÃƒÂ­metro-12","category":"Herramientas y mediciÃƒÂ³n","brand":"GenÃƒÂ©rico / por especificar","model":"TorquÃƒÂ­metro","description":"TorquÃƒÂ­metro. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-llave-dinamomÃƒÂ©trica-aislada-13","category":"Herramientas y mediciÃƒÂ³n","brand":"GenÃƒÂ©rico / por especificar","model":"Llave dinamomÃƒÂ©trica aislada","description":"Llave dinamomÃƒÂ©trica aislada. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-cÃƒÂ¡mara-termogrÃƒÂ¡fica-14","category":"Herramientas y mediciÃƒÂ³n","brand":"GenÃƒÂ©rico / por especificar","model":"CÃƒÂ¡mara termogrÃƒÂ¡fica","description":"CÃƒÂ¡mara termogrÃƒÂ¡fica. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-arnÃƒÂ©s-de-cuerpo-completo-1","category":"Seguridad y trabajo en altura","brand":"GenÃƒÂ©rico / por especificar","model":"ArnÃƒÂ©s de cuerpo completo","description":"ArnÃƒÂ©s de cuerpo completo. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-lÃƒÂ­nea-de-vida-vertical-2","category":"Seguridad y trabajo en altura","brand":"GenÃƒÂ©rico / por especificar","model":"LÃƒÂ­nea de vida vertical","description":"LÃƒÂ­nea de vida vertical. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-lÃƒÂ­nea-de-vida-horizontal-3","category":"Seguridad y trabajo en altura","brand":"GenÃƒÂ©rico / por especificar","model":"LÃƒÂ­nea de vida horizontal","description":"LÃƒÂ­nea de vida horizontal. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-eslinga-con-absorbedor-4","category":"Seguridad y trabajo en altura","brand":"GenÃƒÂ©rico / por especificar","model":"Eslinga con absorbedor","description":"Eslinga con absorbedor. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-mosquetÃƒÂ³n-certificado-5","category":"Seguridad y trabajo en altura","brand":"GenÃƒÂ©rico / por especificar","model":"MosquetÃƒÂ³n certificado","description":"MosquetÃƒÂ³n certificado. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-casco-con-barbuquejo-6","category":"Seguridad y trabajo en altura","brand":"GenÃƒÂ©rico / por especificar","model":"Casco con barbuquejo","description":"Casco con barbuquejo. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-guantes-dielÃƒÂ©ctricos-7","category":"Seguridad y trabajo en altura","brand":"GenÃƒÂ©rico / por especificar","model":"Guantes dielÃƒÂ©ctricos","description":"Guantes dielÃƒÂ©ctricos. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-guantes-anticorte-8","category":"Seguridad y trabajo en altura","brand":"GenÃƒÂ©rico / por especificar","model":"Guantes anticorte","description":"Guantes anticorte. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-gafas-de-seguridad-9","category":"Seguridad y trabajo en altura","brand":"GenÃƒÂ©rico / por especificar","model":"Gafas de seguridad","description":"Gafas de seguridad. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-calzado-dielÃƒÂ©ctrico-10","category":"Seguridad y trabajo en altura","brand":"GenÃƒÂ©rico / por especificar","model":"Calzado dielÃƒÂ©ctrico","description":"Calzado dielÃƒÂ©ctrico. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-seÃƒÂ±alizaciÃƒÂ³n-de-riesgo-elÃƒÂ©ctrico-11","category":"Seguridad y trabajo en altura","brand":"GenÃƒÂ©rico / por especificar","model":"SeÃƒÂ±alizaciÃƒÂ³n de riesgo elÃƒÂ©ctrico","description":"SeÃƒÂ±alizaciÃƒÂ³n de riesgo elÃƒÂ©ctrico. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-kit-de-rescate-en-alturas-12","category":"Seguridad y trabajo en altura","brand":"GenÃƒÂ©rico / por especificar","model":"Kit de rescate en alturas","description":"Kit de rescate en alturas. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-cepillo-de-limpieza-de-mÃƒÂ³dulos-1","category":"Mantenimiento y limpieza","brand":"GenÃƒÂ©rico / por especificar","model":"Cepillo de limpieza de mÃƒÂ³dulos","description":"Cepillo de limpieza de mÃƒÂ³dulos. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-kit-de-limpieza-de-paneles-2","category":"Mantenimiento y limpieza","brand":"GenÃƒÂ©rico / por especificar","model":"Kit de limpieza de paneles","description":"Kit de limpieza de paneles. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-pÃƒÂ©rtiga-telescÃƒÂ³pica-3","category":"Mantenimiento y limpieza","brand":"GenÃƒÂ©rico / por especificar","model":"PÃƒÂ©rtiga telescÃƒÂ³pica","description":"PÃƒÂ©rtiga telescÃƒÂ³pica. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-jalador-de-agua-4","category":"Mantenimiento y limpieza","brand":"GenÃƒÂ©rico / por especificar","model":"Jalador de agua","description":"Jalador de agua. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-agua-desmineralizada-5","category":"Mantenimiento y limpieza","brand":"GenÃƒÂ©rico / por especificar","model":"Agua desmineralizada","description":"Agua desmineralizada. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-termÃƒÂ³metro-infrarrojo-6","category":"Mantenimiento y limpieza","brand":"GenÃƒÂ©rico / por especificar","model":"TermÃƒÂ³metro infrarrojo","description":"TermÃƒÂ³metro infrarrojo. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-cÃƒÂ¡mara-termogrÃƒÂ¡fica-de-inspecciÃƒÂ³n-7","category":"Mantenimiento y limpieza","brand":"GenÃƒÂ©rico / por especificar","model":"CÃƒÂ¡mara termogrÃƒÂ¡fica de inspecciÃƒÂ³n","description":"CÃƒÂ¡mara termogrÃƒÂ¡fica de inspecciÃƒÂ³n. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-repuesto-de-ventilador-de-inversor-8","category":"Mantenimiento y limpieza","brand":"GenÃƒÂ©rico / por especificar","model":"Repuesto de ventilador de inversor","description":"Repuesto de ventilador de inversor. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-filtro-de-ventilaciÃƒÂ³n-de-inversor-9","category":"Mantenimiento y limpieza","brand":"GenÃƒÂ©rico / por especificar","model":"Filtro de ventilaciÃƒÂ³n de inversor","description":"Filtro de ventilaciÃƒÂ³n de inversor. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-kit-de-mantenimiento-de-conectores-10","category":"Mantenimiento y limpieza","brand":"GenÃƒÂ©rico / por especificar","model":"Kit de mantenimiento de conectores","description":"Kit de mantenimiento de conectores. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-bomba-solar-sumergible-1","category":"Bombeo y aplicaciones especiales","brand":"GenÃƒÂ©rico / por especificar","model":"Bomba solar sumergible","description":"Bomba solar sumergible. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-bomba-solar-de-superficie-2","category":"Bombeo y aplicaciones especiales","brand":"GenÃƒÂ©rico / por especificar","model":"Bomba solar de superficie","description":"Bomba solar de superficie. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-controlador-de-bomba-solar-3","category":"Bombeo y aplicaciones especiales","brand":"GenÃƒÂ©rico / por especificar","model":"Controlador de bomba solar","description":"Controlador de bomba solar. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-variador-de-frecuencia-solar-4","category":"Bombeo y aplicaciones especiales","brand":"GenÃƒÂ©rico / por especificar","model":"Variador de frecuencia solar","description":"Variador de frecuencia solar. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-sensor-de-nivel-de-pozo-5","category":"Bombeo y aplicaciones especiales","brand":"GenÃƒÂ©rico / por especificar","model":"Sensor de nivel de pozo","description":"Sensor de nivel de pozo. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-flotador-elÃƒÂ©ctrico-6","category":"Bombeo y aplicaciones especiales","brand":"GenÃƒÂ©rico / por especificar","model":"Flotador elÃƒÂ©ctrico","description":"Flotador elÃƒÂ©ctrico. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-tanque-de-almacenamiento-de-agua-7","category":"Bombeo y aplicaciones especiales","brand":"GenÃƒÂ©rico / por especificar","model":"Tanque de almacenamiento de agua","description":"Tanque de almacenamiento de agua. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-estructura-para-bombeo-solar-8","category":"Bombeo y aplicaciones especiales","brand":"GenÃƒÂ©rico / por especificar","model":"Estructura para bombeo solar","description":"Estructura para bombeo solar. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-kit-solar-para-cerca-elÃƒÂ©ctrica-9","category":"Bombeo y aplicaciones especiales","brand":"GenÃƒÂ©rico / por especificar","model":"Kit solar para cerca elÃƒÂ©ctrica","description":"Kit solar para cerca elÃƒÂ©ctrica. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-kit-solar-para-iluminaciÃƒÂ³n-10","category":"Bombeo y aplicaciones especiales","brand":"GenÃƒÂ©rico / por especificar","model":"Kit solar para iluminaciÃƒÂ³n","description":"Kit solar para iluminaciÃƒÂ³n. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-luminaria-solar-led-11","category":"Bombeo y aplicaciones especiales","brand":"GenÃƒÂ©rico / por especificar","model":"Luminaria solar LED","description":"Luminaria solar LED. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  {"id":"gen-poste-para-luminaria-solar-12","category":"Bombeo y aplicaciones especiales","brand":"GenÃƒÂ©rico / por especificar","model":"Poste para luminaria solar","description":"Poste para luminaria solar. Selecciona fabricante y referencia comercial segÃƒÂºn el diseÃƒÂ±o y las condiciones de instalaciÃƒÂ³n.","specs":["Referencia genÃƒÂ©rica; no constituye una ficha tÃƒÂ©cnica","Definir dimensiones, material y capacidad segÃƒÂºn el proyecto","Verificar certificaciÃƒÂ³n, compatibilidad y condiciones del fabricante"],"price":null,"tax":0,"priceNote":"Precio por cotizar" ,"image":null ,"imageAlt":"FotografÃƒÂ­a real pendiente de verificar","source":null,"sourceName":"Sin proveedor asignado","updated":"Referencia de catÃƒÂ¡logo genÃƒÂ©rico","compatNote":"Completar fabricante, modelo y ficha tÃƒÂ©cnica antes de validar compatibilidad o comprar."},
  // Referencias adicionales con fotografÃƒÂ­a del producto publicada por Solartex Colombia.
  {id:"ae630-solartex",category:"Paneles solares",brand:"AE Solar",model:"Panel bifacial N-Type 630 W",description:"Panel monocristalino bifacial tipo N comercializado por Solartex Colombia.",specs:["630 Wp","Bifacial tipo N","Referencia publicada en tienda colombiana"],price:626600,tax:0,priceNote:"Precio publicado; confirmar vigencia",image:"https://cdn.solartex.co/products/d7baedc7-6ec0-4028-9f95-4a61e3e5842c/panel-solar-monocristalino-bifacial-tipo-n-630w-ae-solar-1788051868564.webp",imageAlt:"Panel solar AE Solar bifacial N-Type 630 W",imageVerified:true,source:"https://solartex.co/tienda/paneles-solares",sourceName:"Solartex Colombia Ã‚Â· producto",updated:"Consulta web 9 nov 2026"},
  {id:"deye50kw-solartex",category:"Inversores",brand:"Deye",model:"SUN-50K-G04P3-EU-AM4-LV",description:"Inversor solar on-grid trifÃƒÂ¡sico de 50 kW comercializado por Solartex Colombia.",specs:["50 kW","TrifÃƒÂ¡sico","ON-GRID"],price:17834700,tax:0,priceNote:"Precio publicado exento de IVA; confirmar vigencia",image:"https://cdn.solartex.co/products/04439f70-4776-4e20-8b01-20e40bb4efd7/inversor-on-grid-50kw-trifa-sico-sun-50k-g04p3-eu-am4-lv-deye-1789784406337.webp",imageAlt:"Inversor Deye SUN-50K-G04P3-EU-AM4-LV",imageVerified:true,source:"https://solartex.co/tienda/inversores",sourceName:"Solartex Colombia Ã‚Â· producto",updated:"Consulta web 9 nov 2026"},
  {id:"must100-solartex",category:"Controladores MPPT",brand:"MUST",model:"PC1800F MPPT 100 A",description:"Controlador solar MPPT de 100 A comercializado por Solartex Colombia.",specs:["100 A","MPPT","Serie PC1800F"],price:1078700,tax:0,priceNote:"Precio publicado exento de IVA; confirmar vigencia",image:"https://cdn.solartex.co/products/906a83fe-47f9-4fc1-9c45-6f57b5960264/controlador-solar-mppt-100a-pc1800f-must-2-1786808321476.webp",imageAlt:"Controlador solar MUST PC1800F MPPT 100 A",imageVerified:true,source:"https://solartex.co/tienda/controladores",sourceName:"Solartex Colombia Ã‚Â· producto",updated:"Consulta web 9 nov 2026"},
  {id:"felicity500-solartex",category:"BaterÃƒÂ­as",brand:"Felicity Solar",model:"FLA48500 51,2 V 500 Ah",description:"BaterÃƒÂ­a solar de litio comercializada por Solartex Colombia.",specs:["51,2 V nominales","500 Ah","LiFePO4 segÃƒÂºn referencia comercial"],price:16875000,tax:0.19,priceNote:"Precio publicado antes de IVA; confirmar vigencia",image:"https://cdn.solartex.co/products/18774815-4cdc-4f91-a793-f75fef5de285/batera-a-de-litio-51-2v-500ah-fla48500-felicity-1789131579374.webp",imageAlt:"BaterÃƒÂ­a de litio Felicity Solar FLA48500 51,2 V 500 Ah",imageVerified:true,source:"https://solartex.co/tienda/baterias",sourceName:"Solartex Colombia Ã‚Â· producto",updated:"Consulta web 9 nov 2026"},
  {id:"leaderbreaker32-solartex",category:"Protecciones DC",brand:"Leader",model:"LDM7 1P 250 VDC 32 A",description:"Breaker termomagnÃƒÂ©tico DC para sistemas fotovoltaicos.",specs:["1 polo","250 VDC","32 A"],price:22200,tax:0.19,priceNote:"Precio publicado antes de IVA; confirmar vigencia",image:"https://cdn.solartex.co/products/2f8d4655-070b-4d48-8958-d8bdbf5b5502/breaker-termomagna-tico-dc-1p-250vdc-32a-leader-ldm7-1786143088108.webp",imageAlt:"Breaker DC Leader LDM7 1P 250 VDC 32 A",imageVerified:true,source:"https://solartex.co/tienda/accesorios-solares/protecciones-dc",sourceName:"Solartex Colombia Ã‚Â· producto",updated:"Consulta web 9 nov 2026"},
  {id:"moredayfuse15-solartex",category:"Protecciones DC",brand:"Moreday",model:"Fusible fotovoltaico 10x38 15 A 1000 V DC",description:"Fusible gPV fotovoltaico para portafusible compatible.",specs:["Formato 10Ãƒâ€”38 mm","15 A","1000 V DC"],price:16300,tax:0.19,priceNote:"Precio publicado antes de IVA; confirmar vigencia",image:"https://cdn.solartex.co/products/3d168613-04fa-4ba0-aa7e-5befc286f079/fusible-fotovoltaico-10x38-15a-1000v-dc-moreday-1786149663411.webp",imageAlt:"Fusible fotovoltaico Moreday 10x38 15 A 1000 V DC",imageVerified:true,source:"https://solartex.co/tienda/accesorios-solares/protecciones-dc",sourceName:"Solartex Colombia Ã‚Â· producto",updated:"Consulta web 9 nov 2026"},
];

// AdaptaciÃ³n no destructiva: conserva los 227 registros y aÃ±ade una ficha vacÃ­a
// con unidades explÃ­citas. No se extraen ni verifican valores desde `specs`.
const commercialCatalog = commercialCatalogLegacy.map(product=>{
  const prepared=prepareCatalogProduct(product);
  const exactInverter=inverterCatalog.find(item=>item.brand===product.brand&&item.model===product.model);
  const exactController=controllerCatalog.find(item=>item.id===product.id&&item.brand===product.brand&&item.model===product.model);
  const exactTechnical=exactInverter||exactController;
  return exactTechnical?{...prepared,technicalSheet:exactTechnical.technicalSheet,technicalDataStatus:exactTechnical.technicalDataStatus}:prepared;
});

// Filtrado por arquitectura: muestra por defecto solo familias adecuadas al tipo de sistema.
// Es un filtro de aplicaciÃƒÂ³n; la compatibilidad final siempre se valida con la ficha tÃƒÂ©cnica exacta.
function catalogSystemFit(item, systemType) {
  const raw = `${item.category || ""} ${item.model || ""} ${item.description || ""} ${(item.specs || []).join(" ")}`;
  const t = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const category = (item.category || "").toLowerCase();

  const shared = [
    "paneles solares", "protecciones dc", "protecciones ac", "estructuras",
    "cableado y conectores", "fijaciones y tornilleria", "canalizaciones y gabinetes",
    "puesta a tierra", "herramientas y medicion", "seguridad y trabajo en altura",
    "mantenimiento y limpieza"
  ];
  if (shared.includes(category)) return { show: true, reason: "Componente comÃƒÂºn a esta arquitectura" };

  if (category === "baterias") {
    return { show: systemType !== "ON-GRID", reason: systemType === "ON-GRID" ? "El sistema ON-GRID convencional no requiere banco de baterÃƒÂ­as" : "Almacenamiento requerido o previsto" };
  }

  if (category === "controladores mppt") {
    return { show: systemType !== "ON-GRID", reason: systemType === "ON-GRID" ? "El MPPT normalmente estÃƒÂ¡ integrado en el inversor de red" : "RegulaciÃƒÂ³n de carga para banco de baterÃƒÂ­as; verificar si el inversor ya integra MPPT" };
  }

  if (category === "inversores") {
    const micro = /microinversor|microinverter/.test(t);
    const onGrid = /on.?grid|grid.?tie|conexion a red|interconexion|string on.?grid/.test(t);
    const offGrid = /off.?grid|aislado|inversor cargador|onda senoidal pura/.test(t);
    const hybrid = /hibrid/.test(t);
    const accessory = /gateway|datalogger|smart meter|medidor inteligente|transformador de corriente|modulo de comunicacion|optimizador/.test(t);

    if (accessory) return { show: true, reason: "Accesorio de monitoreo o acondicionamiento; confirmar protocolo y marca compatible" };
    if (systemType === "ON-GRID") return { show: onGrid || micro, reason: "Equipo de conexiÃƒÂ³n a red o microinversor" };
    if (systemType === "OFF-GRID") return { show: offGrid, reason: "Equipo para operaciÃƒÂ³n aislada; confirmar capacidad de arranque y salida AC" };
    return { show: hybrid, reason: "Inversor hÃƒÂ­brido con gestiÃƒÂ³n de red y almacenamiento" };
  }

  if (category === "monitoreo y comunicaciones") {
    return { show: true, reason: "Monitoreo; verificar protocolo y compatibilidad con el inversor" };
  }

  if (category === "bombeo y aplicaciones especiales") {
    const pump = /bomba|bombeo|variador/.test(t);
    return { show: pump ? systemType !== "ON-GRID" : true, reason: "AplicaciÃƒÂ³n especial; revisar arquitectura y controlador requerido" };
  }

  // Familias no reconocidas quedan visibles para no ocultar material que pudiera ser necesario.
  return { show: true, reason: "Revisar aplicaciÃƒÂ³n especÃƒÂ­fica" };
}

function productCompatibilityRequirements(item, data) {
  const category = String(item.category || "").toLowerCase();
  if (category === "inversores") return { architecture: data.systemType, acVoltageV: Number.isFinite(n(data.acVoltage)) ? { min: n(data.acVoltage), max: n(data.acVoltage) } : null, powerW: Number.isFinite(n(data.inverterW)) && n(data.inverterW) > 0 ? { min: n(data.inverterW) } : null, mpptCount: Number.isInteger(Number(data.mpptCount)) && Number(data.mpptCount) > 0 ? { min: Number(data.mpptCount) } : null };
  if (category === "baterÃƒÂ­as") return { nominalVoltageV: Number.isFinite(n(data.batteryVoltage)) && n(data.batteryVoltage) > 0 ? { min: n(data.batteryVoltage), max: n(data.batteryVoltage) } : null, chemistry: data.batteryChemistry && data.batteryChemistry !== "Por especificar" ? data.batteryChemistry : null, bmsProtocol: data.bmsProtocol || null };
  if (category === "paneles solares") return { powerW: Number.isFinite(n(data.panelW)) && n(data.panelW) > 0 ? { min: n(data.panelW), max: n(data.panelW) } : null, vocV: Number.isFinite(n(data.panelVoc)) && n(data.panelVoc) > 0 ? { min: n(data.panelVoc), max: n(data.panelVoc) } : null, vmpV: Number.isFinite(n(data.panelVmp)) && n(data.panelVmp) > 0 ? { min: n(data.panelVmp), max: n(data.panelVmp) } : null, iscA: Number.isFinite(n(data.panelIsc)) && n(data.panelIsc) > 0 ? { min: n(data.panelIsc), max: n(data.panelIsc) } : null, impA: Number.isFinite(n(data.panelImp)) && n(data.panelImp) > 0 ? { min: n(data.panelImp), max: n(data.panelImp) } : null };
  if (category.includes("protecciones")) return { voltageV: Number.isFinite(n(data.acVoltage)) && n(data.acVoltage) > 0 ? { min: n(data.acVoltage) } : null, poles: Number.isInteger(Number(data.breakerPoles)) && Number(data.breakerPoles) > 0 ? Number(data.breakerPoles) : null, breakingCapacityKA: Number.isFinite(n(data.breakerBreakingCapacityKA)) && n(data.breakerBreakingCapacityKA) > 0 ? { min: n(data.availableFaultCurrentKA) } : null, tripCurve: data.breakerTripCurve || null };
  return {};
}

const HSP_MONTHS = [
  ["JAN", "Enero"], ["FEB", "Febrero"], ["MAR", "Marzo"],
  ["APR", "Abril"], ["MAY", "Mayo"], ["JUN", "Junio"],
  ["JUL", "Julio"], ["AUG", "Agosto"], ["SEP", "Septiembre"],
  ["OCT", "Octubre"], ["NOV", "Noviembre"], ["DEC", "Diciembre"]
];

const initial = {
  projectName:"Mi proyecto solar", client:"", location:"",
  systemType:"HÃƒÂBRIDO", monthlyKwh:300, consumptionMode:"reference", appliances:[], peakSunHours:4.5,
  panelW:"", panelBrand:"Personalizado", panelModel:"Panel por especificar", panelCatalogId:"",
  manualPanelCountEnabled:false, manualPanelCount:"", modulesPerString:"",
  panelVoc:"", panelVmp:"", panelIsc:"", panelImp:"", panelMaxSeriesFuse:"",
  inverterW:"", inverterSurgeW:"", inverterSurgeDurationSec:"", simultaneousDemandW:"", startingDemandW:"", startingDemandDurationSec:"",
  inverterMaxDcVoltage:"", mpptMinVoltage:"", inverterStartVoltage:"",
  mpptMaxVoltage:"", inverterMaxInputCurrent:"", inverterMaxIsc:"",
  inverterMaxPvPower:"", inverterMaxInputCurrentPerInput:"", inverterMaxIscPerInput:"", inverterInputsPerMppt:"",
  inverterType:"HÃƒÂBRIDO", inverterAcVoltage:220,
  mpptCount:"", modulesPerMppt:"", vocTempCoefficient:"", vmpTempCoefficient:"",
  minimumTemperature:"", maximumCellTemperature:"", batteryVoltage:48, batteryUnitVoltage:"", batteryAhUnit:"", batterySeriesAllowed:"No verificado",
  batteryChemistry:"Por especificar", autonomyDays:1, dod:"", batteryDischargeEfficiency:"",
  batteryMaxDischargeCurrent:"", batteryMaxChargeCurrent:"",
  bmsMaxDischargeCurrent:"", bmsMaxChargeCurrent:"",
  controllerMode:"Integrado en inversor", selectedControllerCatalogId:"", controllerMaxPvVoltage:"",
  controllerMpptMinVoltage:"", controllerMpptMaxVoltage:"",
  controllerMaxChargeCurrent:"", controllerMaxPvPower:"",
  efficiency:85, inverterEfficiency:"", pvChargePathEfficiency:"", dcVoltage:48, acVoltage:220, acPhases:"MonofÃƒÂ¡sico",
  powerFactor:0.95, conductorMaterial:"Cobre", conductorInsulation:"", conductorTemperatureRatingC:"", conductorLoadedCount:"", ampacitySource:"", stringAmpacitySectionMm2:"", collectorAmpacitySectionMm2:"", batteryAmpacitySectionMm2:"", acAmpacitySectionMm2:"", acConnectionAmpacitySectionMm2:"", dcDistance:"", mpptCircuits:[], stringDistance:"", batteryDistance:"", groundingDistance:"",
  integratedProtectionStatus:{dcDisconnect:"Por verificar",dcSpd:"Por verificar",acBreaker:"Por verificar",acSpd:"Por verificar",battery:"Por verificar"}, groundingKitRequired:false,
  acDistance:"", acConnectionDistance:"", peDistance:"", bondingDistance:"", ambientTemperatureC:"", dcDrop:2, acDrop:3,
  stringAmpacityA:"", collectorAmpacityA:"", batteryAmpacityA:"", acAmpacityA:"", acConnectionAmpacityA:"",
  conductorTemperatureFactor:"", conductorGroupingFactor:"", peFaultCurrentA:"", faultClearingTimeSeconds:"", adiabaticK:"",
  conductorInstallationMethod:"Por definir",
  groundingFaultCurrentA:"", groundingClearingTimeSeconds:"", groundingAdiabaticK:"", bondingFaultCurrentA:"", bondingClearingTimeSeconds:"", bondingAdiabaticK:"",
  availableFaultCurrentKA:"", breakerBreakingCapacityKA:"", breakerVoltageRatingV:"", breakerPoles:"", breakerNominalCurrentA:"", breakerTripCurve:"", inverterMaxAcCurrentA:"", acNeutralSwitched:"Por verificar", earthResistanceOhms:"", earthSoilResistivityOhmM:"", groundingSystem:"Por especificar",
  panelMaxReverseCurrentA:"", gpvFuseRatingsA:"", gpvSelectedFuseRatingA:"", peTableSectionMm2:"", adiabaticMaterial:"", adiabaticInsulation:"", adiabaticInitialTemperatureC:"", adiabaticFinalTemperatureC:"", adiabaticKSource:"",
  energyPrice:900, panelPrice:650000, inverterPrice:4800000,
  batteryPrice:5200000, protectionPrice:850000,
  structurePrice:180000, extraCost:500000
};

const navItems = [
  ["Consumo y recurso solar",Activity],
  ["Generador fotovoltaico",Sun],
  ["CatÃƒÂ¡logo comercial",Store],
  ["Inversor y baterÃƒÂ­as",BatteryCharging],
  ["Conductores y protecciones",ShieldCheck],
  ["Diagrama unifilar",Network],
  ["Presupuesto",CircleDollarSign],
  ["Informe tÃƒÂ©cnico",FileText],
  ["Resumen",LayoutDashboard]
];

const money = value => Number.isFinite(Number(value)) ? new Intl.NumberFormat("es-CO",{
  style:"currency",currency:"COP",maximumFractionDigits:0
}).format(Number(value)) : "INVALIDO";

const num = value => Number.isFinite(Number(value)) ? new Intl.NumberFormat("es-CO",{
  maximumFractionDigits:2
}).format(Number(value)) : "INVALIDO";
const displayEngineeringValue = value => value == null ? "InvÃƒÂ¡lido" : num(value);

const n = value => value == null || value === "" ? 0 : Number.isFinite(Number(value)) ? Number(value) : Number.NaN;


// Motor de predimensionamiento. Sus resultados son estimaciones de ingenierÃƒÂ­a;
// no sustituyen ampacidad, cortocircuito, coordinaciÃƒÂ³n ni revisiÃƒÂ³n normativa.
const COPPER_RESISTIVITY = 0.0175; // ohmÃ‚Â·mmÃ‚Â²/m, valor aproximado a 20 Ã‚Â°C (usado solo en legado/resumen)
const STANDARD_SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];
const nextStandardSection = area => STANDARD_SECTIONS.find(section => section >= area) || null;

function calculateEngineering(data) {
  const numericValidation = validateNumericInputs(data);
  const numericValue = key => numericValidation.invalidKeys.includes(key) ? Number.NaN : n(data[key]);
  const applianceInputsInvalid = data.consumptionMode === "appliances" && numericValidation.invalid.some(item => item.key === "appliances" || item.key.startsWith("appliances."));
  const monthlyKwh = applianceInputsInvalid ? Number.NaN : numericValue("monthlyKwh");
  const daily = monthlyKwh / 30;
  const hsp = numericValue("peakSunHours");
  const panelW = numericValue("panelW");
  const panelVoc = numericValue("panelVoc");
  const panelVmp = numericValue("panelVmp");
  const panelImp = numericValue("panelImp");
  const panelIsc = numericValue("panelIsc");
  const validPanel = panelW > 0 && panelVoc > 0 && panelVmp > 0 && panelImp > 0 && panelIsc > 0;
  const arraySizing = calculateArraySizing({
    monthlyKwh, peakSunHours: hsp, performanceRatioPercent: numericValue("efficiency"),
    panelWatts: panelW, manualEnabled: data.manualPanelCountEnabled === true,
    manualCount: data.manualPanelCount
  });
  const requiredWp = arraySizing.requiredWp ?? 0;
  const requiredPanelCount = arraySizing.automaticPanelCount ?? 0;
  const panelCount = arraySizing.panelCount ?? 0;
  const installedWp = arraySizing.installedWp ?? 0;

  // CorrecciÃƒÂ³n tÃƒÂ©rmica lineal respecto a STC (25 Ã‚Â°C). Se utilizan los
  // coeficientes de ficha del mÃƒÂ³dulo; si no se conocen, los resultados son estimativos.
  const vocCoefficientValid = Number.isFinite(Number(data.vocTempCoefficient)) && data.vocTempCoefficient !== "";
  const vmpCoefficientValid = Number.isFinite(Number(data.vmpTempCoefficient)) && data.vmpTempCoefficient !== "";
  const temperatureInputsValid = data.minimumTemperature !== "" && data.minimumTemperature != null && data.maximumCellTemperature !== "" && data.maximumCellTemperature != null && Number.isFinite(Number(data.minimumTemperature)) && Number.isFinite(Number(data.maximumCellTemperature));
  const vocCoefficient = vocCoefficientValid ? Number(data.vocTempCoefficient) / 100 : null;
  const vmpCoefficient = vmpCoefficientValid ? Number(data.vmpTempCoefficient) / 100 : null;
  const minTemperature = n(data.minimumTemperature);
  const maxCellTemperature = n(data.maximumCellTemperature);
  const coldVocPerModule = validPanel && vocCoefficientValid && temperatureInputsValid ? correctPanelVoltageAtTemperature({ nominalVoltageV: panelVoc, coefficientPercentPerC: data.vocTempCoefficient, temperatureC: minTemperature }) : null;
  const hotVocPerModule = validPanel && vocCoefficientValid && temperatureInputsValid ? correctPanelVoltageAtTemperature({ nominalVoltageV: panelVoc, coefficientPercentPerC: data.vocTempCoefficient, temperatureC: maxCellTemperature }) : null;
  const coldVmpPerModule = validPanel && vmpCoefficientValid && temperatureInputsValid ? correctPanelVoltageAtTemperature({ nominalVoltageV: panelVmp, coefficientPercentPerC: data.vmpTempCoefficient, temperatureC: minTemperature }) : null;
  const hotVmpPerModule = validPanel && vmpCoefficientValid && temperatureInputsValid ? correctPanelVoltageAtTemperature({ nominalVoltageV: panelVmp, coefficientPercentPerC: data.vmpTempCoefficient, temperatureC: maxCellTemperature }) : null;
  const maxDcVoltage = Math.max(0, n(data.inverterMaxDcVoltage));
  const mpptMin = Math.max(0, n(data.mpptMinVoltage));
  const mpptMax = Math.max(0, n(data.mpptMaxVoltage));
  // La longitud serie se configura explÃƒÂ­citamente; el motor valida que no sobren mÃƒÂ³dulos.
  const modulesPerString = Number(data.modulesPerString) || 0;
  const stringLayout = calculateStringLayout({
    panelCount, modulesPerString, mpptCount: Number(data.mpptCount),
    maxStringsPerMppt: Number(data.modulesPerMppt)
  });
  const stringVoltageVmp = modulesPerString * panelVmp;
  const stringVoltageVocHot = hotVocPerModule == null ? null : modulesPerString * hotVocPerModule;
  const stringVoltageVmpCold = coldVmpPerModule == null ? null : modulesPerString * coldVmpPerModule;
  const stringVoltageVmpHot = hotVmpPerModule == null ? null : modulesPerString * hotVmpPerModule;
  const stringVoltageVocCold = coldVocPerModule == null ? null : modulesPerString * coldVocPerModule;
  const panelVoltageLimits = evaluatePanelStringVoltageLimits({
    stringVocColdV: stringVoltageVocCold, stringVocHotV: stringVoltageVocHot,
    stringVmpColdV: stringVoltageVmpCold, stringVmpHotV: stringVoltageVmpHot,
    moduleMaximumSystemVoltageV: n(data.panelMaximumSystemVoltage),
    maximumDcVoltageV: n(data.inverterMaxDcVoltage), mpptMinVoltageV: n(data.mpptMinVoltage),
    mpptMaxVoltageV: n(data.mpptMaxVoltage), startupVoltageV: n(data.inverterStartVoltage)
  });

  // Todos los strings tienen la misma cantidad de mÃƒÂ³dulos en serie.
  const strings = stringLayout.strings ?? 0;

  // DistribuciÃƒÂ³n equilibrada de strings entre MPPT; la corriente se evalÃƒÂºa
  // usando el MPPT mÃƒÂ¡s cargado, no una cantidad teÃƒÂ³rica fija.
  const mpptCount = Math.max(0, Math.floor(n(data.mpptCount)));
  const maxStringsPerMppt = Math.max(0, Math.floor(n(data.modulesPerMppt)));
  const totalStringCapacity = mpptCount * maxStringsPerMppt;
  const mpptDistribution = stringLayout.distribution;
  const maxStringsOnOneMppt = mpptDistribution.length ? Math.max(...mpptDistribution) : 0;
  const inputCurrent = strings * panelImp;
  const inputShortCircuitCurrent = strings * panelIsc;
  const currentPerMppt = maxStringsOnOneMppt * panelImp;
  const shortCircuitCurrentPerMppt = maxStringsOnOneMppt * panelIsc;
  const currentPerInput = strings > 0 ? panelImp : 0;
  const shortCircuitCurrentPerInput = strings > 0 ? panelIsc : 0;
  const dcVoltageOperating = stringVoltageVmp;

  // Banco: las baterÃƒÂ­as en serie suman tensiÃƒÂ³n; las ramas en paralelo suman Ah.
  const isGridOnly = data.systemType === "ON-GRID";
  const batteryVoltage = numericValue("batteryVoltage");
  const batteryUnitVoltage = Math.max(0, n(data.batteryUnitVoltage));
  const batteryUnitAh = Math.max(0, n(data.batteryAhUnit));
  const batteryKwh = calculateBatteryNominalEnergy({
    dailyKwh: daily, autonomyDays: n(data.autonomyDays),
    depthOfDischargePercent: n(data.dod),
    inverterEfficiencyPercent: n(data.inverterEfficiency), gridOnly: isGridOnly,
    batteryDischargeEfficiencyPercent: n(data.batteryDischargeEfficiency)
  });
  const batteryAh = isGridOnly ? 0 : batteryKwh == null || !Number.isFinite(batteryVoltage) || batteryVoltage <= 0 ? null : batteryKwh * 1000 / batteryVoltage;
  const rawBatterySeriesRatio = batteryUnitVoltage > 0 ? batteryVoltage / batteryUnitVoltage : 0;
  const batterySeriesCount = !isGridOnly && rawBatterySeriesRatio > 0
    ? (Math.abs(rawBatterySeriesRatio - 1) <= 0.10 ? 1 : Math.round(rawBatterySeriesRatio)) : 0;
  // Se admite una diferencia nominal de hasta 10 % para baterÃƒÂ­as de clase 48 V
  // (p. ej., 51,2 V LiFePO4); la ventana real del inversor debe verificarse.
  const batteryVoltageRatioValid = batterySeriesCount > 0 &&
    Math.abs(batterySeriesCount * batteryUnitVoltage - batteryVoltage) <= 0.10 * batteryVoltage;
  const batteryParallelCount = !isGridOnly && batteryAh != null && batteryUnitAh > 0
    ? Math.ceil(batteryAh / batteryUnitAh) : 0;
  const batteryUnits = isGridOnly ? 0 : batterySeriesCount * batteryParallelCount;
  const batteryInstalledAh = batteryParallelCount * batteryUnitAh;

  const acVoltage = numericValue("acVoltage");
  const powerFactor = numericValue("powerFactor");
  const inverterW = numericValue("inverterW");
  const isThreePhase = data.acPhases === "TrifÃƒÂ¡sico";
  const acCurrentResult = calculateAcDesignCurrent({ ratedAcPowerW: inverterW, ratedAcVoltageV: acVoltage, phaseSystem: isThreePhase ? "three-phase" : "single-phase", powerFactor, maximumOutputCurrentA: data.inverterMaxAcCurrentA });
  const acCurrent = acCurrentResult.currentA ?? 0;
  const dcCurrent = inputCurrent;
  const dcDropVolts = Math.max(0.01, dcVoltageOperating * n(data.dcDrop) / 100);
  const acDropVolts = Math.max(0.01, acVoltage * n(data.acDrop) / 100);
  const commonRun = { material: data.conductorMaterial, baseAmpacityMaterial: data.conductorMaterial, insulation: data.conductorInsulation, temperatureRatingC: data.conductorTemperatureRatingC, loadedConductors: data.conductorLoadedCount, ampacitySource: data.ampacitySource, ambientTemperatureC: data.ambientTemperatureC, installationMethod: data.conductorInstallationMethod, temperatureFactor: data.conductorTemperatureFactor, groupingFactor: data.conductorGroupingFactor };
  const phaseSystem = isThreePhase ? "three-phase" : "single-phase";
  const stringConductor = calculateValidatedConductorRun({ ...commonRun, currentA: panelIsc * 1.25, voltageV: dcVoltageOperating, distanceOneWayM: data.stringDistance, dropPercent: data.dcDrop, phaseSystem: "dc", baseAmpacityA: data.stringAmpacityA, baseAmpacitySectionMm2: data.stringAmpacitySectionMm2, faultCurrentA: data.peFaultCurrentA, clearingTimeSeconds: data.faultClearingTimeSeconds, adiabaticK: data.adiabaticK });
  const mpptCollectorRuns = Array.isArray(data.mpptCircuits) ? mpptDistribution.map((stringCount, index) => {
    const saved = Array.isArray(data.mpptCircuits) ? data.mpptCircuits.find(item => item?.mpptId === `MPPT-${index + 1}`) : null;
    const route = resolveMpptCircuitDistance(saved, data.dcDistance);
    const distance = route.distanceM;
    const run = calculateValidatedConductorRun({ ...commonRun, currentA: stringCount * panelIsc * 1.25, voltageV: dcVoltageOperating, distanceOneWayM: distance, dropPercent: data.dcDrop, phaseSystem: "dc", baseAmpacityA: saved?.ampacityA || data.collectorAmpacityA, baseAmpacitySectionMm2: saved?.ampacitySectionMm2 || data.collectorAmpacitySectionMm2, faultCurrentA: data.peFaultCurrentA, clearingTimeSeconds: data.faultClearingTimeSeconds, adiabaticK: data.adiabaticK });
    return { mpptId: `MPPT-${index + 1}`, strings: stringCount, designCurrentA: stringCount > 0 ? stringCount * panelIsc * 1.25 : null, distanceM: distance, routeSource: route.source, run };
  }) : [];
  const collectorConductor = mpptCollectorRuns.find(item => item.strings > 0)?.run || calculateValidatedConductorRun({});
  const batteryCurrent = isGridOnly ? 0 : calculateInverterBatteryCurrent({ inverterPowerW: inverterW, batteryVoltageV: batteryVoltage, inverterEfficiencyPercent: data.inverterEfficiency });
  const batteryConductor = !isGridOnly && batteryCurrent != null ? calculateValidatedConductorRun({ ...commonRun, currentA: batteryCurrent, voltageV: batteryVoltage, distanceOneWayM: data.batteryDistance, dropPercent: data.batteryDrop || data.dcDrop, phaseSystem: "dc", baseAmpacityA: data.batteryAmpacityA, baseAmpacitySectionMm2: data.batteryAmpacitySectionMm2, faultCurrentA: data.peFaultCurrentA, clearingTimeSeconds: data.faultClearingTimeSeconds, adiabaticK: data.adiabaticK }) : null;
  const acConductor = calculateValidatedConductorRun({ ...commonRun, currentA: acCurrent, voltageV: acVoltage, distanceOneWayM: data.acDistance, dropPercent: data.acDrop, phaseSystem, powerFactor, baseAmpacityA: data.acAmpacityA, baseAmpacitySectionMm2: data.acAmpacitySectionMm2, faultCurrentA: data.peFaultCurrentA, clearingTimeSeconds: data.faultClearingTimeSeconds, adiabaticK: data.adiabaticK });
  const connectionConductor = data.systemType === "OFF-GRID" ? null : calculateValidatedConductorRun({ ...commonRun, currentA: acCurrent, voltageV: acVoltage, distanceOneWayM: data.acConnectionDistance, dropPercent: data.acConnectionDrop || data.acDrop, phaseSystem, powerFactor, baseAmpacityA: data.acConnectionAmpacityA, baseAmpacitySectionMm2: data.acConnectionAmpacitySectionMm2, faultCurrentA: data.peFaultCurrentA, clearingTimeSeconds: data.faultClearingTimeSeconds, adiabaticK: data.adiabaticK });
  const acCumulativeDrop = data.systemType === "OFF-GRID" ? null : calculateAcCumulativeVoltageDrop({ runs: [acConductor, connectionConductor], nominalVoltageV: acVoltage, limitPercent: 3 });
  const peAdiabatic = calculateAdiabaticSection({ faultCurrentA: data.peFaultCurrentA, clearingTimeSeconds: data.faultClearingTimeSeconds, kFactor: data.adiabaticK, material: data.adiabaticMaterial, insulation: data.adiabaticInsulation, initialTemperatureC: data.adiabaticInitialTemperatureC, finalTemperatureC: data.adiabaticFinalTemperatureC, kSource: data.adiabaticKSource });
  const peConductor = validatePvEquipmentGroundingConductor({ material: "Cobre", tableSectionMm2: data.peTableSectionMm2 });
  const groundingConductor = calculateAdiabaticSection({ faultCurrentA: data.groundingFaultCurrentA, clearingTimeSeconds: data.groundingClearingTimeSeconds, kFactor: data.groundingAdiabaticK });
  const bondingConductor = calculateAdiabaticSection({ faultCurrentA: data.bondingFaultCurrentA, clearingTimeSeconds: data.bondingClearingTimeSeconds, kFactor: data.bondingAdiabaticK });
  const activeAcConductors = isThreePhase ? 4 : 2;
  const electricalCircuitModel = buildElectricalCircuitModel({
    architecture: data.systemType,
    totalPvCurrentA: inputCurrent, totalPvShortCircuitCurrentA: inputShortCircuitCurrent,
    circuits: [
      { id: "STRINGS-FV", type: "string", label: "FV individual por strings", from: "MÃ³dulos FV", to: "Entradas MPPT", strings, lengthM: data.stringDistance, conductorCount: strings * 2, material: data.conductorMaterial, designCurrentA: panelIsc * 1.25, run: stringConductor, protection: "gPV segÃºn topologÃ­a y ficha; validaciÃ³n pendiente" },
      ...mpptCollectorRuns.map(item => ({ id: `${item.mpptId}-COLECTOR`, type: "mppt-collector", label: `Colector DC ${item.mpptId}`, mpptId: item.mpptId, strings: item.strings, from: `Salidas ${item.mpptId}`, to: "Entrada DC del inversor", lengthM: item.distanceM, conductorCount: item.strings > 0 ? 2 : 0, material: data.conductorMaterial, designCurrentA: item.designCurrentA, run: item.run, pending: item.routeSource === "legacy-shared" ? ["Recorrido heredado compartido; confirmar y definir ruta propia del MPPT."] : [], protection: "ProtecciÃ³n/seccionamiento segÃºn ficha; VALIDACIÃ“N PENDIENTE" })),
      { id: "AC-INV-TABLERO", type: "ac", label: "AC inversor a tablero", from: "Salida AC del inversor", to: "Tablero FV", lengthM: data.acDistance, conductorCount: activeAcConductors, material: data.conductorMaterial, designCurrentA: acCurrent, run: acConductor, protection: "Interruptor AC; coordinaciÃ³n pendiente" },
      ...(data.systemType !== "OFF-GRID" ? [{ id: "AC-TABLERO-RED", type: "ac-grid", label: "AC tablero a conexiÃ³n", from: "Tablero FV", to: "Punto de conexiÃ³n", lengthM: data.acConnectionDistance, conductorCount: activeAcConductors, material: data.conductorMaterial, designCurrentA: acCurrent, run: connectionConductor, protection: "ProtecciÃ³n de conexiÃ³n a red; VALIDACIÃ“N PENDIENTE" }] : []),
      ...(data.systemType !== "ON-GRID" ? [{ id: "BATERIA-INV", type: "battery", label: "BaterÃ­a a inversor", from: "Banco de baterÃ­as", to: "Terminal DC del inversor", lengthM: data.batteryDistance, conductorCount: 2, material: data.conductorMaterial, designCurrentA: batteryCurrent, run: batteryConductor, protection: "ProtecciÃ³n segÃºn BMS/Icc/ficha; pendiente" }] : []),
      { id: "PE-FV", type: "pe", label: "PE de equipos FV", from: "Marcos/equipos FV", to: "Barra PE", lengthM: data.peDistance, conductorCount: 1, material: "Cobre", designCurrentA: null, sectionMm2: peConductor.sectionMm2, pending: peConductor.valid === false ? [peConductor.status] : [peConductor.status], protection: "SecciÃ³n tabular/adiabÃ¡tica por verificar" },
      { id: "TIERRA-ELECTRODO", type: "grounding", label: "Puesta a tierra a electrodo", from: "Barra de tierra", to: "Electrodo/sistema de tierra", lengthM: data.groundingDistance, conductorCount: 1, material: data.conductorMaterial, designCurrentA: null, sectionMm2: groundingConductor.commercialSectionMm2, pending: [groundingConductor.status], protection: "DiseÃ±o del sistema de tierra pendiente" },
      { id: "EQUIPOTENCIALIDAD", type: "bonding", label: "UniÃ³n equipotencial", from: "Estructuras/masas", to: "Barra equipotencial", lengthM: data.bondingDistance, conductorCount: 1, material: data.conductorMaterial, designCurrentA: null, sectionMm2: bondingConductor.commercialSectionMm2, pending: [bondingConductor.status], protection: "Continuidad/secciÃ³n por verificar" }
    ]
  });
  const dcArea = collectorConductor.calculatedAreaMm2 || 0;
  const acArea = acConductor.calculatedAreaMm2 || 0;
  const dcStandardSection = collectorConductor.commercialSectionMm2;
  const acStandardSection = acConductor.commercialSectionMm2;

  const warnings = [];
  numericValidation.invalid.forEach(item => warnings.push(item.message));
  if (Object.values(data.integratedProtectionStatus || {}).some(status => status === "Por verificar")) warnings.push("Protecciones integradas del inversor por verificar en ficha; el BOM no cuantifica dispositivos en estado desconocido para evitar duplicaciÃ³n.");
  if (data.systemType !== "OFF-GRID" && acCumulativeDrop?.passes === false) warnings.push("La caÃ­da AC acumulada desde inversor hasta punto de conexiÃ³n excede el 3 % indicado en RETIE 2026 3.17.21(d).");
  if (data.systemType !== "OFF-GRID" && acCumulativeDrop?.passes == null) warnings.push("CaÃ­da AC acumulada pendiente: ingresa recorridos, tensiones y parÃ¡metros de ambos tramos AC.");
  if (data.systemType !== "OFF-GRID" && acCurrentResult.source !== "mÃ¡xima continua declarada por ficha") warnings.push(acCurrentResult.validation);
  if (!arraySizing.validEnergyInputs) warnings.push("Completa consumo, HSP, PR y potencia del mÃƒÂ³dulo con valores vÃƒÂ¡lidos.");
  if (!validPanel) warnings.push("Completa potencia, Voc, Vmp, Isc e Imp vÃƒÂ¡lidos del mÃƒÂ³dulo.");
  if (data.manualPanelCountEnabled && !arraySizing.manualCountValid) warnings.push("La cantidad manual debe ser un entero mayor que cero.");
  if (panelCount > 0 && !stringLayout.validSeries) warnings.push("Configura un nÃƒÂºmero entero de mÃƒÂ³dulos por string segÃƒÂºn las fichas del mÃƒÂ³dulo y del inversor.");
  if (panelCount > 0 && stringLayout.validSeries && !stringLayout.countDivisible) warnings.push("La cantidad seleccionada no se puede dividir en strings completos; cambia la cantidad o los mÃƒÂ³dulos por string.");
  if (strings > 0 && !stringLayout.validMppts) warnings.push("Configura la cantidad real de MPPT del inversor.");
  if (strings > totalStringCapacity) warnings.push(`Se requieren ${strings} strings, pero la capacidad declarada es ${totalStringCapacity}.`);
  if (maxStringsOnOneMppt > maxStringsPerMppt) warnings.push("La distribuciÃƒÂ³n supera la cantidad mÃƒÂ¡xima de strings configurada por MPPT.");
  if (stringVoltageVmpHot != null && stringVoltageVmpCold != null && (stringVoltageVmpHot < mpptMin || stringVoltageVmpCold > mpptMax)) warnings.push("La tensiÃƒÂ³n Vmp corregida por temperatura queda fuera de la ventana MPPT en alguna condiciÃƒÂ³n.");
  if (stringVoltageVocCold != null && stringVoltageVocCold > maxDcVoltage) warnings.push("La tensiÃƒÂ³n Voc corregida por temperatura supera la tensiÃƒÂ³n DC mÃƒÂ¡xima del inversor.");
  if (currentPerMppt > n(data.inverterMaxInputCurrent)) warnings.push("La corriente de operaciÃƒÂ³n del MPPT mÃƒÂ¡s cargado supera el lÃƒÂ­mite configurado.");
  if (shortCircuitCurrentPerMppt > n(data.inverterMaxIsc)) warnings.push("La Isc del MPPT mÃƒÂ¡s cargado supera el lÃƒÂ­mite configurado.");
  if (!dcStandardSection && dcArea > 0) warnings.push("La secciÃƒÂ³n DC calculada supera la tabla incluida; requiere selecciÃƒÂ³n especializada.");
  if (!acStandardSection && acArea > 0) warnings.push("La secciÃƒÂ³n AC calculada supera la tabla incluida; requiere selecciÃƒÂ³n especializada.");
  if ([stringConductor, collectorConductor, batteryConductor, acConductor, connectionConductor].some(run => run?.ampacityPass === false)) warnings.push("ConfiguraciÃ³n de conductor invÃ¡lida: algÃºn tramo tiene ampacidad corregida inferior a la corriente de diseÃ±o. No aprobar hasta redimensionar y coordinar protecciÃ³n.");

  const compatibility = [];
  const addCheck = (name, ok, detail, suggestion, status) => compatibility.push({
    name, ok: ok === true, status: status || (ok === true ? "ok" : ok === false ? "error" : "warning"), detail, suggestion
  });
  const selectedPanel = panelCatalog.find(panel => panel.id === data.panelCatalogId) || null;
  const selectedControllerRecord = controllerCatalog.find(controller => controller.id === data.selectedControllerCatalogId) || null;
  const selectedInverterRecord = inverterCatalog.find(inverter => inverter.id === data.selectedInverterCatalogId) || null;
  const panelTechnicalStatus = selectedPanel?.technicalDataStatus || CATALOG_DATA_STATES.INSUFFICIENT;
  addCheck("Ficha tÃ©cnica del mÃ³dulo", selectedPanel && panelTechnicalStatus === CATALOG_DATA_STATES.VERIFIED ? true : null,
    selectedPanel ? `${selectedPanel.brand} ${selectedPanel.model}: ${panelTechnicalStatus}.` : "MÃ³dulo ingresado manualmente o cargado desde un proyecto anterior sin referencia catalogada.",
    "Usa una ficha oficial de la variante exacta y completa los coeficientes o lÃ­mites que el documento no declara.", selectedPanel && panelTechnicalStatus === CATALOG_DATA_STATES.VERIFIED ? "ok" : "warning");
  const simultaneousDemand = Number(data.simultaneousDemandW);
  const startingDemand = Number(data.startingDemandW);
  const inverterSurge = Number(data.inverterSurgeW);
  const startingDemandDuration = Number(data.startingDemandDurationSec);
  const inverterSurgeDuration = Number(data.inverterSurgeDurationSec);
  addCheck("Potencia continua vs demanda simultÃƒÂ¡nea", Number.isFinite(simultaneousDemand) && simultaneousDemand > 0 ? inverterW >= simultaneousDemand : null,
    `Demanda simultÃƒÂ¡nea ingresada: ${Number.isFinite(simultaneousDemand) && simultaneousDemand > 0 ? `${num(simultaneousDemand)} W` : "pendiente"}; potencia continua configurada: ${num(inverterW)} W.`,
    "Ingresa la carga AC simultÃƒÂ¡nea de diseÃƒÂ±o y contrÃƒÂ¡stala con la potencia continua de ficha tÃƒÂ©cnica.", Number.isFinite(simultaneousDemand) && simultaneousDemand > 0 ? undefined : "warning");
  addCheck("Potencia de arranque", Number.isFinite(startingDemand) && startingDemand > 0 && Number.isFinite(inverterSurge) && inverterSurge > 0
    ? inverterSurge >= startingDemand : null,
    `Demanda de arranque: ${Number.isFinite(startingDemand) && startingDemand > 0 ? `${num(startingDemand)} W` : "pendiente"}; sobrecarga del inversor: ${Number.isFinite(inverterSurge) && inverterSurge > 0 ? `${num(inverterSurge)} W` : "pendiente"}.`,
    "Ingresa demanda de arranque, potencia pico y duraciÃƒÂ³n permitida desde las fichas de cargas e inversor.", Number.isFinite(startingDemand) && startingDemand > 0 && Number.isFinite(inverterSurge) && inverterSurge > 0 ? undefined : "warning");
  addCheck("DuraciÃƒÂ³n de la sobrecarga", Number.isFinite(startingDemandDuration) && startingDemandDuration > 0 && Number.isFinite(inverterSurgeDuration) && inverterSurgeDuration > 0
    ? inverterSurgeDuration >= startingDemandDuration : null,
    `DuraciÃƒÂ³n requerida: ${Number.isFinite(startingDemandDuration) && startingDemandDuration > 0 ? `${num(startingDemandDuration)} s` : "pendiente"}; duraciÃƒÂ³n admisible: ${Number.isFinite(inverterSurgeDuration) && inverterSurgeDuration > 0 ? `${num(inverterSurgeDuration)} s` : "pendiente"}.`,
    "Compara las duraciones de arranque de la carga y de sobrecarga del inversor.", Number.isFinite(startingDemandDuration) && startingDemandDuration > 0 && Number.isFinite(inverterSurgeDuration) && inverterSurgeDuration > 0 ? undefined : "warning");
  const inverterEfficiencyProvided = data.inverterEfficiency !== "" && data.inverterEfficiency != null;
  const inverterEfficiencyValid = inverterEfficiencyProvided && isValidPercent(Number(data.inverterEfficiency));
  addCheck("Eficiencia del inversor", inverterEfficiencyValid,
    `Valor ingresado: ${inverterEfficiencyProvided ? `${data.inverterEfficiency} %` : "pendiente de ficha"}; rango aceptado: > 0 y Ã¢â€°Â¤ 100 %.`,
    "Ingresa una eficiencia del inversor vÃƒÂ¡lida, basada en la ficha tÃƒÂ©cnica.", inverterEfficiencyValid ? undefined : inverterEfficiencyProvided ? "error" : "warning");
  addCheck("Potencia FV mÃƒÂ¡xima del inversor", n(data.inverterMaxPvPower) > 0 ? installedWp <= n(data.inverterMaxPvPower) : null,
    `Campo FV instalado: ${num(installedWp)} Wp; mÃƒÂ¡ximo declarado: ${num(data.inverterMaxPvPower)} W.`,
    `Selecciona un inversor que admita al menos ${num(installedWp)} Wp, respetando el lÃƒÂ­mite por MPPT y el sobredimensionamiento permitido.`,
    n(data.inverterMaxPvPower) > 0 ? undefined : "warning");
  const architectureMatches = (data.systemType === "ON-GRID" && ["ON-GRID", "HÃƒÂBRIDO"].includes(data.inverterType)) ||
    (data.systemType === "OFF-GRID" && ["OFF-GRID", "HÃƒÂBRIDO"].includes(data.inverterType)) ||
    (data.systemType === "HÃƒÂBRIDO" && data.inverterType === "HÃƒÂBRIDO");
  addCheck("Arquitectura del inversor y del sistema", architectureMatches,
    `Sistema seleccionado: ${data.systemType}; arquitectura declarada: ${data.inverterType}.`,
    `Verifica que el modelo admita el modo de operaciÃƒÂ³n requerido, respaldo, anti-isla, conexiÃƒÂ³n a red y baterÃƒÂ­as cuando correspondan.`);
  addCheck("Tensión DC máxima en frío", panelVoltageLimits.maximumDcVoltage,
    `Voc corregida en frÃƒÂ­o: ${stringVoltageVocCold == null ? "pendiente por coeficiente tÃƒÂ©rmico/ficha" : `${num(stringVoltageVocCold)} V`}; lÃƒÂ­mite DC: ${maxDcVoltage > 0 ? `${num(maxDcVoltage)} V` : "pendiente de ficha del inversor"}.`,
    "Completa coeficiente Voc, temperatura mÃƒÂ­nima de diseÃƒÂ±o y tensiÃƒÂ³n DC mÃƒÂ¡xima del inversor con fichas verificadas.",
    stringVoltageVocCold > 0 && maxDcVoltage > 0 ? undefined : "warning");
  addCheck("Tensión máxima admisible del módulo", panelVoltageLimits.moduleSystemVoltage,
    `Voc de string en frío: ${stringVoltageVocCold == null ? "pendiente por coeficiente térmico/ficha" : `${num(stringVoltageVocCold)} V`}; máximo del sistema del módulo: ${n(data.panelMaximumSystemVoltage) > 0 ? `${num(data.panelMaximumSystemVoltage)} V` : "pendiente de ficha"}.`,
    "Verifica que la tensión máxima del sistema del módulo admita la Voc fría del string.", stringVoltageVocCold > 0 && n(data.panelMaximumSystemVoltage) > 0 ? undefined : "warning");
  addCheck("Ventana MPPT considerando temperatura", panelVoltageLimits.mpptRange,
    `Vmp del string: ${stringVoltageVmpHot == null ? "caliente pendiente" : `${num(stringVoltageVmpHot)} V en caliente`} y ${stringVoltageVmpCold == null ? "frÃƒÂ­o pendiente" : `${num(stringVoltageVmpCold)} V en frÃƒÂ­o`}; ventana MPPT: ${mpptMin > 0 && mpptMax > 0 ? `${num(mpptMin)}Ã¢â‚¬â€œ${num(mpptMax)} V` : "pendiente de ficha"}.`,
    "Completa coeficiente Vmp, temperaturas y rango MPPT de ficha; confirma tambiÃƒÂ©n tensiÃƒÂ³n de arranque.",
    stringVoltageVmpHot > 0 && stringVoltageVmpCold > 0 && mpptMin > 0 && mpptMax > 0 ? undefined : "warning");
  addCheck("Tensión de arranque", panelVoltageLimits.startup,
    `Voc del string en cÃƒÂ©lula caliente: ${stringVoltageVocHot == null ? "pendiente por coeficiente tÃƒÂ©rmico/ficha" : `${num(stringVoltageVocHot)} V`}; tensiÃƒÂ³n de arranque declarada: ${n(data.inverterStartVoltage) > 0 ? `${num(data.inverterStartVoltage)} V` : "pendiente de ficha"}.`,
    "Completa la tensiÃƒÂ³n de arranque segÃƒÂºn la definiciÃƒÂ³n del fabricante y verifica el criterio de inicio que indique su manual.", n(data.inverterStartVoltage) > 0 && stringVoltageVmp > 0 ? undefined : "warning");
  addCheck("Corriente de operaciÃƒÂ³n por MPPT", n(data.inverterMaxInputCurrent) > 0 ? currentPerMppt <= n(data.inverterMaxInputCurrent) : null,
    `MPPT mÃƒÂ¡s cargado: ${num(maxStringsOnOneMppt)} strings Ãƒâ€” ${num(panelImp)} A = ${num(currentPerMppt)} A; lÃƒÂ­mite: ${num(data.inverterMaxInputCurrent)} A.`,
    `Selecciona un MPPT que admita al menos ${num(currentPerMppt)} A en operaciÃƒÂ³n y verifica el lÃƒÂ­mite por conector/entrada.`,
    n(data.inverterMaxInputCurrent) > 0 ? undefined : "warning");
  addCheck("Corriente de cortocircuito por MPPT", n(data.inverterMaxIsc) > 0 ? shortCircuitCurrentPerMppt <= n(data.inverterMaxIsc) : null,
    `MPPT mÃƒÂ¡s cargado: ${num(maxStringsOnOneMppt)} strings Ãƒâ€” ${num(panelIsc)} A = ${num(shortCircuitCurrentPerMppt)} A; mÃƒÂ¡ximo declarado: ${num(data.inverterMaxIsc)} A.`,
    `El lÃƒÂ­mite de Isc del MPPT debe admitir esta corriente y los factores adicionales que exijan fabricante y norma.`,
    n(data.inverterMaxIsc) > 0 ? undefined : "warning");
  if (selectedInverterRecord) {
    const sourceLimits=evaluateInverterMpptCurrentLimits({inverter:selectedInverterRecord,stringsPerMppt:mpptDistribution,moduleImpA:panelImp,moduleIscA:panelIsc});
    for (const check of sourceLimits.checks) addCheck(`${selectedInverterRecord.model} · MPPT ${check.mppt} ${check.kind}`,
      check.status==="CUMPLE"?true:check.status==="NO CUMPLE"?false:null,
      `${check.status}: ${check.calculatedA==null?"corriente pendiente":`${num(check.calculatedA)} A`} frente a ${check.limitA==null?"límite no publicado por MPPT":`${num(check.limitA)} A`}.`,
      "Rebalancea strings entre MPPT o selecciona un equipo con límites adecuados según la ficha exacta.",check.status==="NO CUMPLE"?"error":check.status==="CUMPLE"?"ok":"warning");
  }
  addCheck("Corriente Imp por entrada", n(data.inverterMaxInputCurrentPerInput) > 0 && strings > 0 ? currentPerInput <= n(data.inverterMaxInputCurrentPerInput) : null,
    `Una entrada con un string: ${strings > 0 ? `${num(currentPerInput)} A Imp` : "pendiente de string"}; mÃƒÂ¡ximo por entrada: ${n(data.inverterMaxInputCurrentPerInput) > 0 ? `${num(data.inverterMaxInputCurrentPerInput)} A` : "pendiente de ficha"}.`,
    "Confirma la corriente de operaciÃƒÂ³n mÃƒÂ¡xima por entrada fÃƒÂ­sica del inversor.", n(data.inverterMaxInputCurrentPerInput) > 0 && strings > 0 ? undefined : "warning");
  addCheck("Corriente Isc por entrada", n(data.inverterMaxIscPerInput) > 0 && strings > 0 ? shortCircuitCurrentPerInput <= n(data.inverterMaxIscPerInput) : null,
    `Una entrada con un string: ${strings > 0 ? `${num(shortCircuitCurrentPerInput)} A Isc` : "pendiente de string"}; mÃƒÂ¡ximo por entrada: ${n(data.inverterMaxIscPerInput) > 0 ? `${num(data.inverterMaxIscPerInput)} A` : "pendiente de ficha"}.`,
    "Confirma la corriente de cortocircuito mÃƒÂ¡xima por entrada fÃƒÂ­sica del inversor.", n(data.inverterMaxIscPerInput) > 0 && strings > 0 ? undefined : "warning");
  addCheck("DistribuciÃƒÂ³n de strings entre MPPT", strings > 0 && mpptCount > 0 && maxStringsPerMppt > 0
    ? strings <= totalStringCapacity && maxStringsOnOneMppt <= maxStringsPerMppt : null,
    `DistribuciÃƒÂ³n calculada: ${mpptDistribution.map((count, i) => `MPPT ${i + 1}: ${count}`).join(" Ã‚Â· ") || "Sin distribuciÃƒÂ³n"}; capacidad mÃƒÂ¡xima: ${totalStringCapacity} strings.`,
    `Aumenta MPPT o capacidad de strings por MPPT, o reduce el generador. No conectes strings en paralelo sin revisar lÃƒÂ­mites individuales.`,
    strings > 0 && mpptCount > 0 && maxStringsPerMppt > 0 ? undefined : "warning");
  addCheck("Cantidad manual de mÃƒÂ³dulos", arraySizing.manualCountValid,
    `Modo manual: ${data.manualPanelCountEnabled ? "activo" : "inactivo"}; cantidad ingresada: ${data.manualPanelCount || "pendiente"}; cantidad automÃƒÂ¡tica energÃƒÂ©tica: ${requiredPanelCount}.`,
    "Ingresa un entero positivo; la cantidad manual se conserva en los datos del proyecto.", arraySizing.manualCountValid ? undefined : "error");
  const modulesPerStringConfigured = data.modulesPerString !== "" && data.modulesPerString != null;
  addCheck("MÃƒÂ³dulos en serie por string", modulesPerStringConfigured ? stringLayout.validSeries : null,
    `Valor ingresado: ${data.modulesPerString || "pendiente"}; debe ser un entero positivo.`,
    "Ingresa un entero positivo de mÃƒÂ³dulos en serie para poder distribuir la matriz.", modulesPerStringConfigured ? (stringLayout.validSeries ? undefined : "error") : "warning");
  const stringCountValid = panelCount === 0 ? true : modulesPerString > 0 ? stringLayout.countDivisible : null;
  addCheck("MÃƒÂ³dulos distribuidos en strings completos", stringCountValid,
    `MÃƒÂ³dulos seleccionados: ${panelCount}; mÃƒÂ³dulos/string: ${modulesPerString || "pendiente"}; strings completos: ${strings || "pendiente"}.`,
    "Selecciona mÃƒÂ³dulos por string que dividan exactamente la cantidad total. No se deja un mÃƒÂ³dulo sobrante.", stringCountValid === null ? "warning" : undefined);
  addCheck("Capacidad de strings por MPPT", strings > 0 && stringLayout.capacityValid ? stringLayout.capacityOk : null,
    `DistribuciÃƒÂ³n: ${mpptDistribution.map((count, i) => `MPPT ${i + 1}: ${count}`).join(" Ã‚Â· ") || "pendiente"}; capacidad declarada: ${stringLayout.capacityValid ? `${num(data.modulesPerMppt)} strings por MPPT` : "pendiente"}.`,
    "Ingresa la cantidad mÃƒÂ¡xima de strings/entradas por MPPT de la ficha del inversor.", strings > 0 && stringLayout.capacityValid ? undefined : "warning");

  const mpptCountProvided = data.mpptCount !== "" && data.mpptCount != null;
  const mpptCountValid = Number.isInteger(Number(data.mpptCount)) && Number(data.mpptCount) > 0;
  addCheck("Cantidad de MPPT", mpptCountProvided ? mpptCountValid : null,
    `Cantidad ingresada: ${mpptCountProvided ? data.mpptCount : "pendiente de ficha"}; debe ser un entero positivo.`,
    "Ingresa el nÃƒÂºmero de seguidores MPPT independientes de la ficha del inversor.", mpptCountProvided && !mpptCountValid ? "error" : "warning");
  const stringsPerMpptProvided = data.modulesPerMppt !== "" && data.modulesPerMppt != null;
  addCheck("LÃƒÂ­mite de strings por MPPT", stringsPerMpptProvided ? stringLayout.capacityValid : null,
    `Capacidad ingresada: ${stringsPerMpptProvided ? data.modulesPerMppt : "pendiente de ficha"}; debe ser un entero positivo.`,
    "Ingresa la cantidad mÃƒÂ¡xima de strings conectables a cada MPPT segÃƒÂºn la ficha.", stringsPerMpptProvided && !stringLayout.capacityValid ? "error" : "warning");
  const inputsPerMppt = Number(data.inverterInputsPerMppt);
  const inputsPerMpptProvided = data.inverterInputsPerMppt !== "" && data.inverterInputsPerMppt != null;
  const inputsPerMpptValid = Number.isInteger(inputsPerMppt) && inputsPerMppt > 0;
  const inputCapacityOk = strings > 0 && mpptDistribution.length > 0 && inputsPerMpptValid
    ? mpptDistribution.every(count => count <= inputsPerMppt) : null;
  addCheck("Strings asignados a entradas fÃƒÂ­sicas", inputCapacityOk,
    `Entradas fÃƒÂ­sicas por MPPT: ${inputsPerMpptValid ? inputsPerMppt : "pendiente de ficha"}; asignaciÃƒÂ³n de strings: ${mpptDistribution.map((count, i) => `MPPT ${i + 1}: ${count}`).join(" Ã‚Â· ") || "pendiente"}.`,
    "Cada string debe tener una entrada fÃƒÂ­sica disponible. Ingresa el nÃƒÂºmero de entradas por MPPT de la ficha.", inputCapacityOk === false || (inputsPerMpptProvided && !inputsPerMpptValid) ? "error" : "warning");

  if (!isGridOnly) {
    const dodProvided = data.dod !== "" && data.dod != null;
    const dodValid = dodProvided && isValidPercent(Number(data.dod));
    const batteryDischargeEfficiencyProvided = data.batteryDischargeEfficiency !== "" && data.batteryDischargeEfficiency != null;
    const batteryDischargeEfficiencyValid = batteryDischargeEfficiencyProvided && isValidPercent(Number(data.batteryDischargeEfficiency));
    addCheck("Profundidad de descarga", dodValid,
      `Valor ingresado: ${data.dod} %; rango aceptado: > 0 y Ã¢â€°Â¤ 100 %.`,
      "Ingresa una profundidad de descarga vÃƒÂ¡lida segÃƒÂºn la quÃƒÂ­mica y la ficha de la baterÃƒÂ­a.", dodValid ? undefined : dodProvided ? "error" : "warning");
    addCheck("Eficiencia de descarga de baterÃƒÂ­a", batteryDischargeEfficiencyValid,
      `Valor ingresado: ${batteryDischargeEfficiencyProvided ? `${data.batteryDischargeEfficiency} %` : "pendiente de ficha"}; rango aceptado: > 0 y Ã¢â€°Â¤ 100 %.`,
      "Ingresa la eficiencia de descarga de la baterÃƒÂ­a indicada por su fabricante.", batteryDischargeEfficiencyValid ? undefined : batteryDischargeEfficiencyProvided ? "error" : "warning");
    addCheck("TensiÃƒÂ³n nominal del banco", batteryVoltage > 0 && n(data.dcVoltage) > 0 ? Math.abs(batteryVoltage - n(data.dcVoltage)) <= 0.10 * n(data.dcVoltage) : null,
      `Banco: ${num(batteryVoltage)} V; tensiÃƒÂ³n DC de referencia: ${num(data.dcVoltage)} V.`,
      `Confirma que la ventana de tensiÃƒÂ³n DC del inversor/cargador admita la tensiÃƒÂ³n real de carga y descarga del banco; la clase nominal no basta por sÃƒÂ­ sola.`, batteryVoltage > 0 && n(data.dcVoltage) > 0 ? undefined : "warning");
    addCheck("ConfiguraciÃƒÂ³n serie/paralelo de baterÃƒÂ­as", batteryVoltageRatioValid && batterySeriesCount > 0 && batteryUnitAh > 0 ?
      (batterySeriesCount === 1 || data.batterySeriesAllowed === "SÃƒÂ­") : null,
      `Cada baterÃƒÂ­a: ${num(batteryUnitVoltage)} V / ${num(batteryUnitAh)} Ah. ConfiguraciÃƒÂ³n calculada: ${batterySeriesCount} en serie Ãƒâ€” ${batteryParallelCount} ramas en paralelo (${batteryUnits} unidades).`,
      batterySeriesCount > 1 ? "Confirma expresamente en la ficha del fabricante que el modelo y su BMS permiten conectar esa cantidad de unidades en serie." : "Verifica que la tensiÃƒÂ³n nominal de cada baterÃƒÂ­a corresponda a la tensiÃƒÂ³n del banco y que el fabricante permita la configuraciÃƒÂ³n.",
      batteryVoltageRatioValid && batterySeriesCount > 0 && batteryUnitAh > 0 ? undefined : "warning");
    const inverterBatteryCurrent = calculateInverterBatteryCurrent({
      inverterPowerW: inverterW, batteryVoltageV: batteryVoltage,
      inverterEfficiencyPercent: n(data.inverterEfficiency)
    });
    const pvChargeCurrent = calculatePvChargeCurrent({
      installedWp, batteryVoltageV: batteryVoltage,
      chargePathEfficiencyPercent: n(data.pvChargePathEfficiency)
    });
    if (selectedInverterRecord) {
      const inverterBatteryChecks = evaluateInverterBatteryLimits({inverter:selectedInverterRecord,batteryVoltageV:batteryVoltage,chargeCurrentA:pvChargeCurrent,dischargeCurrentA:inverterBatteryCurrent});
      for (const check of inverterBatteryChecks.checks) addCheck(`Inversor seleccionado · ${check.name}`,check.status==="CUMPLE"?true:check.status==="NO CUMPLE"?false:null,
        `Resultado del cotejo con ficha oficial ${selectedInverterRecord.model}: ${check.status}.`,
        "Contrasta tension y corrientes continuas con las especificaciones de bateria/BMS y del inversor.",check.status==="NO CUMPLE"?"error":check.status==="CUMPLE"?"ok":"warning");
    }
    const batteryDischargeLimitPerUnit = Math.min(n(data.batteryMaxDischargeCurrent), n(data.bmsMaxDischargeCurrent));
    const batteryChargeLimitPerUnit = Math.min(n(data.batteryMaxChargeCurrent), n(data.bmsMaxChargeCurrent));
    const batteryDischargeLimit = batteryDischargeLimitPerUnit * batteryParallelCount;
    const batteryChargeLimit = batteryChargeLimitPerUnit * batteryParallelCount;
    addCheck("Corriente continua de descarga baterÃƒÂ­a/BMS", batteryDischargeLimit > 0 ? inverterBatteryCurrent <= batteryDischargeLimit : null,
      `Corriente DC estimada a potencia nominal: ${num(inverterBatteryCurrent)} A; lÃƒÂ­mite por unidad: ${num(batteryDischargeLimitPerUnit)} A Ãƒâ€” ${batteryParallelCount} ramas = ${num(batteryDischargeLimit)} A.`,
      `El banco y BMS deben admitir al menos ${num(inverterBatteryCurrent)} A continuos, ademÃƒÂ¡s de los picos de arranque.`, batteryDischargeLimit > 0 ? undefined : "warning");
  const chargePathEfficiencyProvided = data.pvChargePathEfficiency !== "" && data.pvChargePathEfficiency != null;
  const chargePathEfficiencyValid = chargePathEfficiencyProvided && isValidPercent(Number(data.pvChargePathEfficiency));
    addCheck("Corriente de carga baterÃƒÂ­a/BMS", batteryChargeLimit > 0 && pvChargeCurrent != null ? pvChargeCurrent <= batteryChargeLimit : null,
      `Corriente FV aproximada hacia el banco: ${pvChargeCurrent == null ? "no calculable" : `${num(pvChargeCurrent)} A`}; eficiencia del trayecto FV/controlador: ${chargePathEfficiencyProvided ? `${data.pvChargePathEfficiency} %` : "pendiente"}; lÃƒÂ­mite: ${batteryChargeLimit > 0 ? `${num(batteryChargeLimit)} A` : "pendiente de ficha"}.`,
      `Limita la carga al menor valor permitido por inversor/controlador, baterÃƒÂ­a y BMS.`, !chargePathEfficiencyValid ? chargePathEfficiencyProvided ? "error" : "warning" : batteryChargeLimit > 0 ? undefined : "warning");
    if (!chargePathEfficiencyValid) compatibility[compatibility.length - 1].suggestion = "Ingresa una eficiencia del trayecto FV/controlador vÃƒÂ¡lida desde la ficha tÃƒÂ©cnica.";
    addCheck("Capacidad energÃƒÂ©tica del banco", batteryAh > 0 && batteryUnitAh > 0 ? batteryInstalledAh >= batteryAh : null,
      `Capacidad requerida: ${batteryAh == null ? "no calculable: revisa DoD y eficiencias" : `${num(batteryAh)} Ah`}; capacidad instalada: ${num(batteryInstalledAh)} Ah en ${batteryParallelCount} ramas paralelas.`,
      `Aumenta las ramas en paralelo o la capacidad por unidad hasta alcanzar al menos ${num(batteryAh)} Ah, respetando lÃƒÂ­mites del fabricante.`,
      batteryAh == null ? (dodProvided && batteryDischargeEfficiencyProvided && inverterEfficiencyProvided ? "error" : "warning") : batteryAh > 0 && batteryUnitAh > 0 ? undefined : "warning");
  }
  if (data.controllerMode === "Controlador externo" && data.systemType !== "ON-GRID") {
    const controllerPvPower = installedWp;
    const controllerVoltageOk = stringVoltageVocCold > 0 && n(data.controllerMaxPvVoltage) > 0
      ? stringVoltageVocCold <= n(data.controllerMaxPvVoltage) : null;
    const controllerMpptOk = stringVoltageVmpHot > 0 && stringVoltageVmpCold > 0 && n(data.controllerMpptMinVoltage) > 0 && n(data.controllerMpptMaxVoltage) > 0
      ? stringVoltageVmpHot >= n(data.controllerMpptMinVoltage) && stringVoltageVmpCold <= n(data.controllerMpptMaxVoltage) : null;
    const controllerCurrent = calculatePvChargeCurrent({
      installedWp: controllerPvPower, batteryVoltageV: batteryVoltage,
      chargePathEfficiencyPercent: Number(data.pvChargePathEfficiency)
    });
    if (selectedControllerRecord) {
      const controllerReview=evaluateControllerCompatibility({controller:selectedControllerRecord,design:{
        batteryVoltageV:batteryVoltage,stringVocColdV:stringVoltageVocCold,stringVocHotV:stringVoltageVocHot,
        stringVmpHotV:stringVoltageVmpHot,stringVmpColdV:stringVoltageVmpCold,installedWp,
        inputCurrentA:strings>0?inputCurrent:null,inputShortCircuitCurrentA:strings>0?inputShortCircuitCurrent:null,inputShortCircuitCurrentCorrected:false,
        stringCount:strings>0?strings:null,chargeCurrentA:controllerCurrent,
        chargePowerW:controllerCurrent==null?null:controllerCurrent*batteryVoltage,
        batteryChemistry:data.batteryChemistry,inverterModel:selectedInverterRecord?.model||null,controllerUnits:1
      }});
      for(const check of controllerReview.checks)addCheck(`${selectedControllerRecord.model} · ${check.name}`,check.status==="CUMPLE"?true:check.status==="NO CUMPLE"?false:null,
        `${check.status}${check.detail?` · ${check.detail}`:""}.`,"Revisa la ficha exacta, el banco, la distribución FV y los límites por entrada antes de operar.",check.status==="CUMPLE"?"ok":check.status==="NO CUMPLE"?"error":check.status==="INVALIDO"?"error":"warning");
    } else {    addCheck("TensiÃƒÂ³n mÃƒÂ¡xima de entrada del controlador", controllerVoltageOk,
      `Voc frÃƒÂ­a del string: ${num(stringVoltageVocCold)} V; mÃƒÂ¡ximo controlador: ${num(data.controllerMaxPvVoltage)} V.`,
      `El controlador debe admitir una Voc mÃƒÂ¡xima superior a ${num(stringVoltageVocCold)} V, con margen de temperatura.`, controllerVoltageOk === null ? "warning" : undefined);
    addCheck("Ventana MPPT del controlador", controllerMpptOk,
      `Vmp caliente/frÃƒÂ­o del string: ${num(stringVoltageVmpHot)} / ${num(stringVoltageVmpCold)} V; ventana: ${num(data.controllerMpptMinVoltage)}Ã¢â‚¬â€œ${num(data.controllerMpptMaxVoltage)} V.`,
      `La ventana MPPT debe cubrir el rango de Vmp corregido por temperatura.`, controllerMpptOk === null ? "warning" : undefined);
    addCheck("Potencia FV admisible del controlador", n(data.controllerMaxPvPower) > 0 ? controllerPvPower <= n(data.controllerMaxPvPower) : null,
      `Potencia FV instalada: ${num(controllerPvPower)} W; mÃƒÂ¡ximo declarado: ${num(data.controllerMaxPvPower)} W.`,
      `Selecciona un controlador que admita al menos ${num(controllerPvPower)} W a la tensiÃƒÂ³n del banco.`, n(data.controllerMaxPvPower) > 0 ? undefined : "warning");
    addCheck("Corriente mÃƒÂ¡xima de carga del controlador", n(data.controllerMaxChargeCurrent) > 0 && controllerCurrent != null ? controllerCurrent <= n(data.controllerMaxChargeCurrent) : null,
      `Corriente de carga aproximada: ${controllerCurrent == null ? "pendiente por eficiencia del trayecto FV/controlador" : `${num(controllerCurrent)} A`}; lÃƒÂ­mite controlador: ${num(data.controllerMaxChargeCurrent)} A.`,
      `Selecciona un controlador con corriente de carga suficiente o limita la potencia FV segÃƒÂºn fabricante.`, n(data.controllerMaxChargeCurrent) > 0 ? undefined : "warning");
    }
  }
  const compatibilityIssues = compatibility.filter(item => item.status !== "ok");
  const compatibilityErrors = compatibility.filter(item => item.status === "error");
  const compatibilityWarnings = compatibility.filter(item => item.status === "warning");
  const panelCost = panelCount * n(data.panelPrice);
  const total = panelCost + n(data.inverterPrice) + batteryUnits * n(data.batteryPrice) +
    n(data.protectionPrice) + panelCount * n(data.structurePrice) + n(data.extraCost);
  const annualSavings = monthlyKwh * n(data.energyPrice) * 12;
  const engineeringStates = buildEngineeringStateModel({ data, numericValidation, circuitModel: electricalCircuitModel, compatibility });
  return {
    daily, requiredKw: requiredWp / 1000, requiredWp, requiredPanelCount,
    panelCount, installedWp,
    manualPanelCountEnabled: data.manualPanelCountEnabled === true,
    manualPanelCount: data.manualPanelCount, automaticPanelCount: arraySizing.automaticPanelCount,
    batteryKwh, batteryAh,
    batteryUnits, batterySeriesCount, batteryParallelCount, batteryInstalledAh,
    batteryVoltageRatioValid, strings, modulesPerString, coldVoc: coldVocPerModule,
    stringVoltageVmp, stringVoltageVmpHot, stringVoltageVmpCold, stringVoltageVocCold, stringVoltageVocHot,
    inputCurrent, inputShortCircuitCurrent, currentPerInput, shortCircuitCurrentPerInput, currentPerMppt, shortCircuitCurrentPerMppt,
    totalStringCapacity, mpptDistribution, maxStringsOnOneMppt, dcVoltageOperating,
    panelCost, total, annualSavings, dcCurrent, dcArea, dcStandardSection,
    mpptCollectorRuns, electricalCircuitModel, circuits: electricalCircuitModel.circuits,
    acCurrent, acCurrentResult, acArea, acStandardSection, stringConductor, collectorConductor, batteryCurrent, batteryConductor, acConductor, connectionConductor, acCumulativeDrop, peConductor, peAdiabatic, groundingConductor, bondingConductor, compatibility, compatibilityIssues,
    compatibilityErrors, compatibilityWarnings, warnings, numericValidation, states: engineeringStates
  };
}

// IMPORTANTE: los campos numÃƒÂ©ricos conservan el texto mientras se escribe.
// AsÃƒÂ­ se puede borrar el contenido sin que aparezca automÃƒÂ¡ticamente un cero.
function Field({label,value,onChange,unit="",min=0,max,step="any",type="number"}) {
  const parsed = value == null || value === "" ? null : Number(value);
  const allowNegative = String(label).toLowerCase().includes("ambiente");
  const fieldInvalid = type === "number" && parsed != null && (!Number.isFinite(parsed) || (min != null && parsed < Number(min) && !allowNegative) || (max != null && parsed > Number(max)) || (String(step) === "1" && !Number.isInteger(parsed)));
  return <label className="field">
    <span>{label}</span>
    <div className="input-wrap">
      <input
        type={type}
        min={allowNegative?undefined:min}
        max={max}
        step={step}
        value={value ?? ""}
        aria-invalid={fieldInvalid}
        title={fieldInvalid ? `${label}: valor numÃ©rico invÃ¡lido.` : undefined}
        onChange={e=>onChange(e.target.value)}
      />
      {unit && <small>{unit}</small>}
    </div>
    {fieldInvalid&&<small role="alert" style={{color:"#b42318"}}>INVALIDO: usa un nÃºmero finito dentro del rango del campo.</small>}
  </label>;
}

function SelectField({label,value,onChange,options}) {
  return <label className="field">
    <span>{label}</span>
    <select value={value} onChange={e=>onChange(e.target.value)}>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  </label>;
}

function Metric({label,value,detail,icon:Icon}) {
  return <div className="metric">
    <div className="metric-top"><span>{label}</span><Icon size={18}/></div>
    <strong>{value}</strong><small>{detail}</small>
  </div>;
}

function SectionTitle({eyebrow,title,description}) {
  return <div className="section-title">
    <div><span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2><p>{description}</p>
    </div>
  </div>;
}

// Exportador DXF R12: convierte geometrÃƒÂ­a SVG bÃƒÂ¡sica a entidades CAD editables.
// Las entidades exportadas son lÃƒÂ­neas, rectÃƒÂ¡ngulos, cÃƒÂ­rculos, polilÃƒÂ­neas y textos.
function exportTechnicalDXF() {
  const svg = document.querySelector(".technical-svg");
  if (!svg) { alert("No se encontrÃƒÂ³ el plano SVG para exportar."); return; }
  const view = svg.viewBox.baseVal;
  const H = view.height || 1050;
  const entities = [];
  const pair = (code, value) => `${code}\n${value}\n`;
  const layer = el => {
    const color = (el.getAttribute("stroke") || getComputedStyle(el).stroke || "#000").toLowerCase();
    if (color.includes("#b887") || color.includes("rgb(184")) return "DC_SOLAR";
    if (color.includes("#263f") || color.includes("rgb(38")) return "AC_GENERAL";
    if (color.includes("#c")) return "PROTECCIONES";
    return "SIMBOLOGIA";
  };
  const xy = (x,y) => [Number(x)||0, H-(Number(y)||0)];
  const line = (x1,y1,x2,y2,L) => entities.push(pair(0,"LINE")+pair(8,L)+pair(10,x1)+pair(20,y1)+pair(30,0)+pair(11,x2)+pair(21,y2)+pair(31,0));
  const walk = node => {
    [...node.children].forEach(el => {
      const tag=el.tagName?.toLowerCase(), L=layer(el);
      if(tag==="line") { const a=xy(el.getAttribute("x1"),el.getAttribute("y1")),b=xy(el.getAttribute("x2"),el.getAttribute("y2")); line(...a,...b,L); }
      else if(tag==="rect") { const x=+el.getAttribute("x"),y=+el.getAttribute("y"),w=+el.getAttribute("width"),h=+el.getAttribute("height"); const pts=[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]].map(p=>xy(...p)); for(let i=0;i<4;i++) line(...pts[i],...pts[i+1],L); }
      else if(tag==="circle") { const [cx,cy]=xy(el.getAttribute("cx"),el.getAttribute("cy")); entities.push(pair(0,"CIRCLE")+pair(8,L)+pair(10,cx)+pair(20,cy)+pair(30,0)+pair(40,el.getAttribute("r"))); }
      else if(tag==="text") { const [x,y]=xy(el.getAttribute("x"),el.getAttribute("y")); const t=el.textContent?.trim(); if(t) entities.push(pair(0,"TEXT")+pair(8,"ROTULOS")+pair(10,x)+pair(20,y)+pair(30,0)+pair(40,Math.max(7,+(el.getAttribute("font-size")||12)*.72))+pair(1,t.replace(/[\r\n]/g," "))+pair(7,"STANDARD")); }
      else if(tag==="path") {
        // Trazos lineales M/L/H/V/Z; curvas se omiten para no falsear geometrÃƒÂ­a.
        const d=el.getAttribute("d")||"";
        if(/[CcQqSsTtAa]/.test(d)) return;
        const tokens=d.match(/[MLHVZmlhvz]|-?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)||[]; let i=0,x=0,y=0,sx=0,sy=0,cmd="",pts=[];
        while(i<tokens.length){ if(/[MLHVZmlhvz]/.test(tokens[i])) cmd=tokens[i++]; if(cmd.toUpperCase()==="Z"){ if(pts.length>1) for(let j=0;j<pts.length-1;j++) line(...pts[j],...pts[j+1],L); if(pts.length>2) line(...pts[pts.length-1],...pts[0],L); pts=[]; cmd=""; continue; }
          let nx=x,ny=y; if(cmd.toUpperCase()==="H"){nx=+tokens[i++]; if(cmd==="h")nx+=x;} else if(cmd.toUpperCase()==="V"){ny=+tokens[i++]; if(cmd==="v")ny+=y;} else if(cmd.toUpperCase()==="M"||cmd.toUpperCase()==="L"){nx=+tokens[i++];ny=+tokens[i++];if(cmd===cmd.toLowerCase()){nx+=x;ny+=y;}} else break;
          x=nx;y=ny;if(cmd.toUpperCase()==="M"){sx=x;sy=y;cmd=cmd==="m"?"l":"L";}pts.push(xy(x,y));
        } if(pts.length>1) for(let j=0;j<pts.length-1;j++) line(...pts[j],...pts[j+1],L);
      }
      if(tag!=="defs"&&tag!=="pattern"&&tag!=="marker") walk(el);
    });
  };
  walk(svg);
  const layers=["0","DC_SOLAR","AC_GENERAL","PROTECCIONES","SIMBOLOGIA","ROTULOS"];
  let dxf=""+pair(0,"SECTION")+pair(2,"HEADER")+pair(9,"$ACADVER")+pair(1,"AC1009")+pair(0,"ENDSEC")+pair(0,"SECTION")+pair(2,"TABLES")+pair(0,"TABLE")+pair(2,"LAYER")+pair(70,layers.length);
  layers.forEach((name,i)=>{dxf+=pair(0,"LAYER")+pair(2,name)+pair(70,0)+pair(62,i===1?1:i===2?5:i===3?3:7)+pair(6,"CONTINUOUS")});
  dxf+=pair(0,"ENDTAB")+pair(0,"ENDSEC")+pair(0,"SECTION")+pair(2,"ENTITIES")+entities.join("")+pair(0,"ENDSEC")+pair(0,"EOF");
  const blob=new Blob([dxf],{type:"application/dxf"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="SOLAR_PRO_plano_unifilar.dxf"; a.click(); URL.revokeObjectURL(url);
}

// PDF tÃƒÂ©cnico: la primera pÃƒÂ¡gina utiliza el MISMO SVG del diagrama que alimenta
// la exportaciÃƒÂ³n DXF. AsÃƒÂ­ el plano se ve directamente en el PDF, sin AutoCAD.
function printTechnicalPlan() {
  const diagram = document.querySelector(".electrical-sheet");
  const svg = diagram?.querySelector("svg.technical-svg");
  const schedule = document.querySelector(".solar-schedule-sheet");
  if (!svg) { alert("No se encontrÃƒÂ³ el dibujo del diagrama unifilar."); return; }

  const popup = window.open("", "_blank", "width=1200,height=850");
  if (!popup) { alert("El navegador bloqueÃƒÂ³ la ventana del PDF. Permite las ventanas emergentes para SOLAR PRO e intÃƒÂ©ntalo de nuevo."); return; }

  // Serializa el SVG real; no crea una imagen distinta ni una pÃƒÂ¡gina de portada vacÃƒÂ­a.
  const svgMarkup = svg.outerHTML
    .replace(/<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg"')
    .replace(/\sclass="technical-svg"/, ' class="technical-svg"');
  const scheduleMarkup = schedule ? schedule.cloneNode(true).outerHTML : "";
  let css = "";
  Array.from(document.styleSheets).forEach(sheet => {
    try { Array.from(sheet.cssRules).forEach(rule => { css += rule.cssText + "\n"; }); }
    catch (_) { /* se omiten hojas externas protegidas por el navegador */ }
  });

  popup.document.open();
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>SOLAR PRO - Plano unifilar</title><style>${css}
    @page { size:A3 landscape; margin:7mm; }
    * { box-sizing:border-box!important; }
    body * { visibility:visible!important; }
    html,body { margin:0!important; padding:0!important; background:#fff!important; color:#172b3d!important; }
    body { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }
    .pdf-plan-page { width:100%!important; height:283mm!important; margin:0!important; padding:0!important; display:flex!important; align-items:center!important; justify-content:center!important; overflow:hidden!important; break-after:page!important; page-break-after:always!important; }
    .pdf-plan-page svg.technical-svg { display:block!important; width:100%!important; height:100%!important; max-width:100%!important; max-height:100%!important; min-width:0!important; object-fit:contain!important; background:#fff!important; }
    .pdf-schedule-page { position:static!important; left:auto!important; top:auto!important; width:100%!important; min-height:0!important; margin:0!important; padding:3mm!important; border:1px solid #9aa8b4!important; box-shadow:none!important; overflow:visible!important; break-before:page!important; page-break-before:always!important; }
    .pdf-schedule-page .cad-export-actions,.pdf-schedule-page button { display:none!important; }
    @media screen { body { padding:16px!important; background:#e8edf2!important; } .pdf-plan-page,.pdf-schedule-page { width:400mm!important; margin:0 auto 16px!important; background:#fff!important; } }
  </style></head><body>
    <main class="pdf-plan-page">${svgMarkup}</main>
    ${scheduleMarkup ? `<main class="pdf-schedule-page">${scheduleMarkup}</main>` : ""}
    <script>window.onload=()=>{setTimeout(()=>window.print(),500)};<\/script>
  </body></html>`);
  popup.document.close();
}

// SÃƒÂ­mbolos grÃƒÂ¡ficos esquemÃƒÂ¡ticos para el diagrama.
// La simbologÃƒÂ­a y selecciÃƒÂ³n definitiva deben validarse con la norma aplicable.

function ElectricalDiagram({ data, calc }) {
  const onGrid = data.systemType === "ON-GRID";
  const offGrid = data.systemType === "OFF-GRID";
  const hybrid = data.systemType === "HÃƒÂBRIDO";

  const totalStrings = Math.max(0, calc.strings || 0);
  const visibleStrings = Math.min(totalStrings, 8);

  const strings = Array.from({ length: visibleStrings }, (_, i) => ({
    id: i + 1,
    panels:
      Math.floor(calc.panelCount / totalStrings) +
      (i < calc.panelCount % totalStrings ? 1 : 0)
  }));

  const line = {
    stroke: "#263f55",
    strokeWidth: 2.5,
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  return (
    <div className="electrical-sheet technical-plan">
      <div className="technical-header">
        <div>
          <span className="eyebrow">SOLAR PRO Ã‚Â· DISEÃƒâ€˜O FOTOVOLTAICO</span>
          <h2>DIAGRAMA UNIFILAR DEL SISTEMA SOLAR FOTOVOLTAICO</h2>
          <p>{data.projectName} Ã‚Â· {data.location || "UbicaciÃƒÂ³n no especificada"}</p>
        </div>
        <div className="technical-stamp">
          <b>{data.systemType}</b>
          <span>PLANO ELÃƒâ€°CTRICO</span>
          <span>VERSIÃƒâ€œN PRELIMINAR</span>
        </div>
      </div>

      <div className="cad-export-actions no-print">
        <button className="primary" type="button" onClick={printTechnicalPlan}><Printer size={16}/> PDF Ã‚Â· Ver / guardar</button>
        <button className="secondary" type="button" onClick={exportTechnicalDXF}><Download size={16}/> AutoCAD Ã‚Â· Exportar DXF</button>
        <span>PDF para visualizar e imprimir; DXF para editar en AutoCAD.</span>
      </div>
      <div className="diagram-scroll">
        <svg
          className="technical-svg"
          viewBox="0 0 1600 1050"
          role="img"
          aria-label={`Diagrama unifilar tÃƒÂ©cnico de sistema solar ${data.systemType}`}
        >
          <defs>
            <pattern id="gridPlan" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0H0V20" fill="none" stroke="#e8edf1" strokeWidth="0.7" />
            </pattern>
            <marker id="arrowDC" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto">
              <path d="M0 0L8 4L0 8Z" fill="#b88724" />
            </marker>
            <marker id="arrowAC" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto">
              <path d="M0 0L8 4L0 8Z" fill="#263f55" />
            </marker>
          </defs>

          {/* Marco del plano */}
          <rect x="12" y="12" width="1576" height="1026" fill="#fff" stroke="#263f55" strokeWidth="2" />
          <rect x="25" y="25" width="1550" height="1000" fill="url(#gridPlan)" stroke="#9aa8b4" strokeWidth="1" />

          {/* Encabezado */}
          <text x="55" y="75" fontSize="24" fontWeight="bold" fill="#20364c">
            SISTEMA SOLAR FOTOVOLTAICO
          </text>
          <text x="55" y="105" fontSize="15" fill="#52677a">
            ESQUEMA GENERAL DE GENERACIÃƒâ€œN, CONVERSIÃƒâ€œN Y DISTRIBUCIÃƒâ€œN ELÃƒâ€°CTRICA
          </text>
          <text x="1540" y="70" textAnchor="end" fontSize="17" fontWeight="bold" fill="#20364c">
            {data.systemType}
          </text>
          <line x1="50" y1="125" x2="1550" y2="125" stroke="#263f55" strokeWidth="2" />

          {/* CAMPO FOTOVOLTAICO */}
          <rect x="50" y="155" width="500" height="625" rx="4" fill="#fff" stroke="#547b91" strokeWidth="2" strokeDasharray="9 5" />
          <rect x="50" y="155" width="500" height="48" fill="#eaf2f7" />
          <text x="70" y="185" fontSize="18" fontWeight="bold" fill="#20364c">
            01 Ã‚Â· CAMPO GENERADOR FOTOVOLTAICO
          </text>

          <text x="75" y="225" fontSize="13" fill="#52677a">
            MÃƒÂ³dulo: {data.panelBrand} {data.panelModel}
          </text>
          <text x="75" y="246" fontSize="13" fill="#52677a">
            {num(data.panelW)} Wp Ã‚Â· Voc {num(data.panelVoc)} V Ã‚Â· Isc {num(data.panelIsc)} A
          </text>

          {strings.map((s, i) => {
            const y = 285 + i * 57;
            return (
              <g key={s.id}>
                <rect x="75" y={y - 22} width="420" height="43" rx="3" fill="#f8fbfd" stroke="#9aabb8" />
                <text x="87" y={y + 4} fontSize="12" fontWeight="bold" fill="#20364c">
                  S{s.id}
                </text>

                
                {Array.from({ length: Math.min(8, Math.max(1, s.panels)) }, (_, j) => (
                  <g key={j}>
                    {/* Marco exterior de aluminio */}
                    <rect
                      x={125 + j * 36}
                      y={y - 17}
                      width="30"
                      height="34"
                      rx="2"
                      fill="#263f55"
                      stroke="#9aa8b4"
                      strokeWidth="1.5"
                    />

                    {/* Superficie de vidrio */}
                    <rect
                      x={128 + j * 36}
                      y={y - 14}
                      width="24"
                      height="28"
                      fill="#174c70"
                      stroke="#8eb6ce"
                      strokeWidth="0.8"
                    />

                    {/* Celdas fotovoltaicas */}
                    <g
                      stroke="#8eb6ce"
                      strokeWidth="0.6"
                      fill="#27658b"
                    >
                      <rect x={129 + j * 36} y={y - 12} width="10" height="8" />
                      <rect x={141 + j * 36} y={y - 12} width="9" height="8" />
                      <rect x={129 + j * 36} y={y - 2} width="10" height="8" />
                      <rect x={141 + j * 36} y={y - 2} width="9" height="8" />
                    </g>

                    {/* LÃƒÂ­neas colectoras */}
                    <path
                      d={`M${140 + j * 36} ${y - 14}V${y + 14}`}
                      stroke="#c3dce9"
                      strokeWidth="0.7"
                    />

                    {/* Reflejo del vidrio */}
                    <path
                      d={`M${130 + j * 36} ${y - 11}L${138 + j * 36} ${y - 11}`}
                      stroke="#ffffff"
                      strokeWidth="0.8"
                      opacity="0.7"
                    />
                  </g>
                ))}


                <text x="455" y={y + 4} fontSize="11" textAnchor="end" fill="#52677a">
                  {s.panels} mÃƒÂ³dulos
                </text>

                <path d={`M495 ${y}H570`} stroke="#b88724" strokeWidth="2" fill="none" />
              </g>
            );
          })}

          <text x="75" y="735" fontSize="13" fontWeight="bold" fill="#20364c">
            TOTAL: {calc.panelCount} MÃƒâ€œDULOS FOTOVOLTAICOS
          </text>
          <text x="75" y="757" fontSize="13" fill="#52677a">
            Potencia instalada: {num(calc.installedWp)} Wp Ã‚Â· {num(calc.installedWp / 1000)} kWp
          </text>

          
          {/* COLECTOR DC Y CAJA COMBINADORA CON PROTECCIONES */}
          <path
            d={`M570 285V${285 + (visibleStrings - 1) * 57}`}
            stroke="#b88724" strokeWidth="3" fill="none"
          />

          <path
            d={`M570 ${285 + ((visibleStrings - 1) * 57) / 2}H590V462H625`}
            stroke="#b88724" strokeWidth="3" fill="none"
            markerEnd="url(#arrowDC)"
          />

          {/* Gabinete de caja combinadora */}
          <rect
            x="625" y="390" width="155" height="145" rx="5"
            fill="#fff8e8" stroke="#b88724" strokeWidth="2.5"
          />

          <rect
            x="633" y="397" width="139" height="23" rx="3"
            fill="#8b6b27"
          />

          <text x="702" y="413" textAnchor="middle"
            fontSize="12" fontWeight="bold" fill="#ffffff">
            02 Ã‚Â· CAJA DC
          </text>

          <text x="702" y="438" textAnchor="middle"
            fontSize="11" fontWeight="bold" fill="#20364c">
            COMBINADORA
          </text>

          {/* Barra de conexiÃƒÂ³n positiva */}
          <path d="M645 451H758"
            stroke="#b88724" strokeWidth="2.5" />

          {/* Fusible 1 */}
          <g stroke="#263f55" strokeWidth="1.7">
            <path d="M651 451V464" fill="none" />
            <rect x="642" y="464" width="18" height="25"
              rx="2" fill="#ffffff" />
            <path d="M646 483L656 470" fill="none" />
            <path d="M651 489V500" fill="none" />
          </g>

          {/* Fusible 2 */}
          <g stroke="#263f55" strokeWidth="1.7">
            <path d="M681 451V464" fill="none" />
            <rect x="672" y="464" width="18" height="25"
              rx="2" fill="#ffffff" />
            <path d="M676 483L686 470" fill="none" />
            <path d="M681 489V500" fill="none" />
          </g>

          {/* DPS - protecciÃƒÂ³n contra sobretensiones */}
          <g stroke="#315a78" strokeWidth="1.8" fill="none">
            <path d="M733 451V460" />
            <rect x="719" y="460" width="28" height="36"
              rx="3" fill="#e5eef5" />
            <path d="M725 467H741 M725 474H741" />
            <path d="M733 496V510" />
            <path d="M733 510H758" />
          </g>

          <text x="651" y="512" textAnchor="middle"
            fontSize="9" fill="#20364c">F1</text>

          <text x="681" y="512" textAnchor="middle"
            fontSize="9" fill="#20364c">F2</text>

          <text x="733" y="512" textAnchor="middle"
            fontSize="9" fontWeight="bold" fill="#315a78">DPS</text>

          <text x="702" y="528" textAnchor="middle"
            fontSize="9" fill="#52677a">
            FUSIBLES Y SOBRETENSIÃƒâ€œN
          </text>


          
          {/* SECCIONADOR DC - INTERRUPTOR DE CORTE */}
          <path d="M780 462H825" {...line} />

          {/* Gabinete */}
          <rect
            x="825" y="425" width="115" height="75" rx="5"
            fill="#e8edf1" stroke="#263f55" strokeWidth="2.5"
          />

          <text x="882" y="445" textAnchor="middle"
            fontSize="11" fontWeight="bold" fill="#20364c">
            03 Ã‚Â· CORTE DC
          </text>

          {/* Contactos elÃƒÂ©ctricos */}
          <g stroke="#263f55" strokeWidth="2.5" fill="none">
            <path d="M842 472H858" />
            <path d="M858 472L883 452" />
            <path d="M883 472H922" />
            <circle cx="858" cy="472" r="3" fill="#263f55" />
            <circle cx="883" cy="472" r="3" fill="#263f55" />
          </g>

          {/* Palanca de accionamiento */}
          <rect
            x="870" y="450" width="10" height="22" rx="2"
            fill="#b88724" stroke="#795d24"
          />

          <text x="882" y="490" textAnchor="middle"
            fontSize="10" fontWeight="bold" fill="#52677a">
            SECCIONADOR
          </text>


          
          {/* INVERSOR - REPRESENTACIÃƒâ€œN GRÃƒÂFICA */}
          <path d="M940 462H985" {...line} markerEnd="url(#arrowDC)" />

          {/* Gabinete del inversor */}
          <rect
            x="985" y="365" width="205" height="195" rx="9"
            fill="#e8edf1" stroke="#263f55" strokeWidth="3"
          />

          {/* Tapa superior */}
          <rect
            x="993" y="373" width="189" height="28" rx="5"
            fill="#344d5d"
          />

          <text x="1087" y="392" textAnchor="middle"
            fontSize="14" fontWeight="bold" fill="#ffffff">
            04 Ã‚Â· INVERSOR
          </text>

          {/* Pantalla digital */}
          <rect
            x="1025" y="415" width="125" height="55" rx="5"
            fill="#172d3c" stroke="#70899a" strokeWidth="2"
          />

          <text x="1087" y="435" textAnchor="middle"
            fontSize="10" fill="#8ee6b0">
            {data.systemType}
          </text>

          <text x="1087" y="456" textAnchor="middle"
            fontSize="17" fontWeight="bold" fill="#ffffff">
            {num(data.inverterW)} W
          </text>

          {/* Indicadores luminosos */}
          <circle cx="1035" cy="486" r="5" fill="#36a66a" />
          <circle cx="1055" cy="486" r="5" fill="#d7a52b" />
          <circle cx="1075" cy="486" r="5" fill="#36a66a" />

          <text x="1100" y="490" fontSize="10" fill="#344d5d">
            ESTADO
          </text>

          {/* Rejillas de ventilaciÃƒÂ³n */}
          <g stroke="#81919c" strokeWidth="2">
            <path d="M1015 510H1155" />
            <path d="M1015 517H1155" />
            <path d="M1015 524H1155" />
          </g>

          {/* Conexiones inferiores */}
          <g fill="#263f55" stroke="#ffffff" strokeWidth="1">
            <circle cx="1030" cy="545" r="6" />
            <circle cx="1055" cy="545" r="6" />
            <circle cx="1120" cy="545" r="6" />
            <circle cx="1145" cy="545" r="6" />
          </g>

          <text x="1042" y="535" textAnchor="middle"
            fontSize="9" fill="#344d5d">
            DC
          </text>

          <text x="1132" y="535" textAnchor="middle"
            fontSize="9" fill="#344d5d">
            AC
          </text>

          <text x="1087" y="557" textAnchor="middle"
            fontSize="9" fill="#52677a">
            ConversiÃƒÂ³n DC / AC
          </text>


          
          {/* SALIDA AC Y PROTECCIONES */}
          <path d="M1190 462H1230" {...line} markerEnd="url(#arrowAC)" />

          {/* Gabinete de protecciones AC */}
          <rect
            x="1230" y="395" width="125" height="135" rx="5"
            fill="#e8edf1" stroke="#263f55" strokeWidth="2.5"
          />

          <rect
            x="1237" y="402" width="111" height="23" rx="2"
            fill="#344d5d"
          />

          <text x="1292" y="418"
            textAnchor="middle" fontSize="11"
            fontWeight="bold" fill="#ffffff">
            05 Ã‚Â· PROTECCIÃƒâ€œN AC
          </text>

          {/* Interruptor termomagnÃƒÂ©tico */}
          <rect x="1245" y="437" width="28" height="42"
            rx="2" fill="#ffffff" stroke="#263f55" strokeWidth="1.5" />
          <path d="M1251 469L1267 447"
            stroke="#263f55" strokeWidth="3" />
          <circle cx="1259" cy="444" r="2" fill="#263f55" />

          <text x="1259" y="491"
            textAnchor="middle" fontSize="8" fill="#20364c">
            QF
          </text>

          {/* ProtecciÃƒÂ³n diferencial */}
          <rect x="1280" y="437" width="28" height="42"
            rx="2" fill="#ffffff" stroke="#263f55" strokeWidth="1.5" />
          <path d="M1286 448H1302M1286 456H1302"
            stroke="#263f55" strokeWidth="1.5" />
          <circle cx="1294" cy="468" r="3" fill="#2563eb" />

          <text x="1294" y="491"
            textAnchor="middle" fontSize="8" fill="#20364c">
            ID
          </text>

          {/* DPS AC */}
          <rect x="1315" y="437" width="28" height="42"
            rx="2" fill="#ffffff" stroke="#263f55" strokeWidth="1.5" />
          <path d="M1329 442V451L1323 458L1335 458L1329 466V473"
            fill="none" stroke="#d97706" strokeWidth="2" />

          <text x="1329" y="491"
            textAnchor="middle" fontSize="8" fill="#20364c">
            DPS
          </text>

          <text x="1292" y="515"
            textAnchor="middle" fontSize="9" fill="#52677a">
            QF Ã‚Â· ID Ã‚Â· DPS
          </text>


          
          {/* TABLERO DE DISTRIBUCIÃƒâ€œN - REPRESENTACIÃƒâ€œN GRÃƒÂFICA */}
          <path d="M1355 462H1400" {...line} markerEnd="url(#arrowAC)" />

          {/* Gabinete del tablero */}
          <rect
            x="1400" y="385" width="135" height="155" rx="5"
            fill="#e8edf1" stroke="#263f55" strokeWidth="3"
          />

          {/* Puerta superior */}
          <rect
            x="1407" y="392" width="121" height="24" rx="3"
            fill="#344d5d"
          />

          <text x="1467" y="409" textAnchor="middle"
            fontSize="11" fontWeight="bold" fill="#ffffff">
            06 Ã‚Â· TABLERO
          </text>

          {/* Riel de interruptores */}
          <rect
            x="1413" y="426" width="109" height="76" rx="3"
            fill="#d4dde3" stroke="#8a9ba7"
          />

          {/* Interruptor automÃƒÂ¡tico 1 */}
          <g>
            <rect x="1420" y="433" width="27" height="58" rx="2"
              fill="#ffffff" stroke="#344d5d" strokeWidth="1.5" />
            <rect x="1426" y="441" width="15" height="24" rx="2"
              fill="#344d5d" />
            <path d="M1433 445V460" stroke="#ffffff" strokeWidth="2" />
            <text x="1433" y="483" textAnchor="middle"
              fontSize="8" fill="#20364c">Q1</text>
          </g>

          {/* Interruptor automÃƒÂ¡tico 2 */}
          <g>
            <rect x="1453" y="433" width="27" height="58" rx="2"
              fill="#ffffff" stroke="#344d5d" strokeWidth="1.5" />
            <rect x="1459" y="441" width="15" height="24" rx="2"
              fill="#344d5d" />
            <path d="M1466 445V460" stroke="#ffffff" strokeWidth="2" />
            <text x="1466" y="483" textAnchor="middle"
              fontSize="8" fill="#20364c">Q2</text>
          </g>

          {/* Interruptor automÃƒÂ¡tico 3 */}
          <g>
            <rect x="1486" y="433" width="27" height="58" rx="2"
              fill="#ffffff" stroke="#344d5d" strokeWidth="1.5" />
            <rect x="1492" y="441" width="15" height="24" rx="2"
              fill="#344d5d" />
            <path d="M1499 445V460" stroke="#ffffff" strokeWidth="2" />
            <text x="1499" y="483" textAnchor="middle"
              fontSize="8" fill="#20364c">Q3</text>
          </g>

          {/* Datos elÃƒÂ©ctricos */}
          <text x="1467" y="518" textAnchor="middle"
            fontSize="11" fontWeight="bold" fill="#20364c">
            {num(data.acVoltage)} V AC
          </text>

          <text x="1467" y="531" textAnchor="middle"
            fontSize="9" fill="#52677a">
            DISTRIBUCIÃƒâ€œN
          </text>


          
          {/* CARGAS - CIRCUITOS DE CONSUMO AC */}

          {/* AlimentaciÃƒÂ³n desde tablero */}
          <path d="M1467 540V575" {...line} markerEnd="url(#arrowAC)" />

          {/* Gabinete de cargas */}
          <rect
            x="1380" y="575" width="175" height="145" rx="5"
            fill="#e8edf1" stroke="#263f55" strokeWidth="2.5"
          />

          <rect
            x="1387" y="582" width="161" height="23" rx="3"
            fill="#344d5d"
          />

          <text x="1467" y="598"
            textAnchor="middle" fontSize="11"
            fontWeight="bold" fill="#ffffff">
            07 Ã‚Â· CIRCUITOS DE CARGA
          </text>

          {/* Circuito 1 - IluminaciÃƒÂ³n */}
          <path d="M1395 625H1420" {...line} />
          <circle cx="1432" cy="625" r="10"
            fill="#fff8d6" stroke="#b88724" strokeWidth="2" />
          <path d="M1425 618L1439 632M1439 618L1425 632"
            stroke="#b88724" strokeWidth="1.5" />
          <text x="1450" y="629"
            fontSize="10" fill="#20364c">
            IluminaciÃƒÂ³n
          </text>

          {/* Circuito 2 - Tomacorrientes */}
          <path d="M1395 662H1420" {...line} />
          <rect x="1422" y="652" width="20" height="20"
            rx="3" fill="#ffffff" stroke="#263f55" strokeWidth="1.5" />
          <circle cx="1428" cy="659" r="1.8" fill="#263f55" />
          <circle cx="1436" cy="659" r="1.8" fill="#263f55" />
          <text x="1450" y="666"
            fontSize="10" fill="#20364c">
            Tomas
          </text>

          {/* Circuito 3 - Equipos */}
          <path d="M1395 699H1420" {...line} />
          <rect x="1422" y="689" width="20" height="20"
            rx="2" fill="#ffffff" stroke="#263f55" strokeWidth="1.5" />
          <path d="M1427 704V694H1437V704Z"
            fill="none" stroke="#263f55" strokeWidth="1.2" />
          <text x="1450" y="703"
            fontSize="10" fill="#20364c">
            Equipos
          </text>


          
          {/* RED ELÃƒâ€°CTRICA Y MEDIDOR BIDIRECCIONAL */}
          {!offGrid && (
            <g>
              {/* ConexiÃƒÂ³n de red al medidor */}
              <path
                d="M1467 385V265H1395"
                {...line}
                markerEnd="url(#arrowAC)"
              />

              
              {/* OPERADOR DE RED - POSTE Y TRANSFORMADOR */}

              <rect
                x="1245" y="215" width="150" height="100" rx="4"
                fill="#fff8e8" stroke="#b88724" strokeWidth="2"
              />

              <text x="1320" y="232"
                textAnchor="middle" fontSize="11"
                fontWeight="bold" fill="#20364c">
                OPERADOR DE RED
              </text>

              {/* Poste elÃƒÂ©ctrico */}
              <path d="M1270 245V290"
                stroke="#795548" strokeWidth="5" />

              {/* Cruceta */}
              <path d="M1257 252H1283"
                stroke="#795548" strokeWidth="3" />

              {/* Aisladores */}
              <path d="M1260 247V252M1270 247V252M1280 247V252"
                stroke="#263f55" strokeWidth="2" />

              {/* Conductores elÃƒÂ©ctricos */}
              <path d="M1252 245H1288M1252 255H1288"
                stroke="#b88724" strokeWidth="1.5" />

              {/* Transformador */}
              <rect x="1295" y="244" width="30" height="28"
                rx="5" fill="#d5dde4"
                stroke="#344d5d" strokeWidth="1.5" />

              <path d="M1301 249Q1310 255 1301 261Q1310 267 1319 261"
                fill="none" stroke="#344d5d" strokeWidth="1.5" />

              {/* Salida hacia instalaciÃƒÂ³n */}
              <path d="M1325 258H1380"
                stroke="#b88724" strokeWidth="2"
                fill="none" />

              <text x="1320" y="299"
                textAnchor="middle" fontSize="8"
                fill="#52677a">
                RED DE DISTRIBUCIÃƒâ€œN
              </text>


              {/* ConexiÃƒÂ³n al medidor */}
              <path
                d="M1245 265H1205"
                {...line}
                markerEnd="url(#arrowAC)"
              />

              {/* Gabinete del medidor */}
              <rect
                x="1080" y="215" width="125" height="105" rx="6"
                fill="#e8edf1" stroke="#344d5d" strokeWidth="2.5"
              />

              <rect
                x="1090" y="225" width="105" height="22" rx="3"
                fill="#344d5d"
              />

              <text x="1142" y="240" textAnchor="middle"
                fontSize="10" fontWeight="bold" fill="#ffffff">
                MEDIDOR
              </text>

              {/* Pantalla digital */}
              <rect
                x="1103" y="256" width="79" height="30" rx="3"
                fill="#172d3c" stroke="#71899a"
              />

              <text x="1142" y="269" textAnchor="middle"
                fontSize="8" fill="#8ee6b0">
                kWh
              </text>

              <text x="1142" y="280" textAnchor="middle"
                fontSize="10" fontWeight="bold" fill="#ffffff">
                00000
              </text>

              
              {/* FLUJO BIDIRECCIONAL DE ENERGÃƒÂA */}

              {/* ImportaciÃƒÂ³n: energÃƒÂ­a de la red hacia la instalaciÃƒÂ³n */}
              <path
                d="M1185 290H1148"
                stroke="#b88724"
                strokeWidth="2.5"
                fill="none"
                markerEnd="url(#arrowAC)"
              />

              <text
                x="1165"
                y="281"
                textAnchor="middle"
                fontSize="8"
                fontWeight="bold"
                fill="#8b6b27"
              >
                IMPORTA
              </text>

              {/* ExportaciÃƒÂ³n: energÃƒÂ­a de la instalaciÃƒÂ³n hacia la red */}
              <path
                d="M1100 305H1137"
                stroke="#315a78"
                strokeWidth="2.5"
                fill="none"
                markerEnd="url(#arrowAC)"
              />

              <text
                x="1120"
                y="318"
                textAnchor="middle"
                fontSize="8"
                fontWeight="bold"
                fill="#315a78"
              >
                EXPORTA
              </text>

                          </g>
          )}



          
          {/* BANCO DE BATERÃƒÂAS - REPRESENTACIÃƒâ€œN GRÃƒÂFICA */}
          {!onGrid && (
            <g>
              {/* ConexiÃƒÂ³n DC hacia el banco */}
              <path
                d="M1087 560V675H1055"
                {...line}
                markerEnd="url(#arrowDC)"
              />

              {/* Gabinete de baterÃƒÂ­as */}
              <rect
                x="790"
                y="645"
                width="265"
                height="145"
                rx="7"
                fill="#edf3f5"
                stroke="#344d5d"
                strokeWidth="3"
              />

              <rect
                x="800"
                y="655"
                width="245"
                height="25"
                rx="3"
                fill="#344d5d"
              />

              <text
                x="922"
                y="673"
                textAnchor="middle"
                fontSize="13"
                fontWeight="bold"
                fill="#ffffff"
              >
                07 Ã‚Â· BANCO DE BATERÃƒÂAS
              </text>

              {/* MÃƒÂ³dulo de baterÃƒÂ­a 1 */}
              {Array.from({ length: 4 }, (_, i) => (
                <g key={i}>
                  <rect
                    x={810 + i * 57}
                    y="690"
                    width="48"
                    height="65"
                    rx="4"
                    fill="#ffffff"
                    stroke="#4c8060"
                    strokeWidth="2"
                  />

                  {/* Bornes positivo y negativo */}
                  <rect
                    x={820 + i * 57}
                    y="685"
                    width="9"
                    height="6"
                    fill="#b88724"
                  />
                  <rect
                    x={839 + i * 57}
                    y="685"
                    width="9"
                    height="6"
                    fill="#263f55"
                  />

                  <text
                    x={824 + i * 57}
                    y="703"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#b88724"
                  >
                    +
                  </text>
                  <text
                    x={843 + i * 57}
                    y="703"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#263f55"
                  >
                    -
                  </text>

                  {/* Indicador de carga */}
                  <rect
                    x={821 + i * 57}
                    y="710"
                    width="26"
                    height="5"
                    rx="2"
                    fill="#4c8060"
                  />

                  {/* Ranuras del mÃƒÂ³dulo */}
                  <path
                    d={`M${820 + i * 57} 725H848`}
                    stroke="#9aa8b4"
                    strokeWidth="2"
                  />
                  <path
                    d={`M${820 + i * 57} 732H848`}
                    stroke="#9aa8b4"
                    strokeWidth="2"
                  />

                  <text
                    x={834 + i * 57}
                    y="748"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#344d5d"
                  >
                    B{i + 1}
                  </text>
                </g>
              ))}

              {/* Datos del banco */}
              <text
                x="922"
                y="775"
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill="#20364c"
              >
                {num(data.batteryVoltage)} V Ã‚Â· {displayEngineeringValue(calc.batteryKwh)} kWh estimados
              </text>
            </g>
          )}


          
          {/* PUESTA A TIERRA - CONDUCTOR DE PROTECCIÃƒâ€œN PE */}

          {/* Conductor de protecciÃƒÂ³n */}
          <path
            d="M702 535V820H1087V560"
            stroke="#4c8060"
            strokeWidth="3"
            strokeDasharray="7 5"
            fill="none"
          />

          {/* DerivaciÃƒÂ³n de puesta a tierra */}
          <path
            d="M702 820V850"
            stroke="#4c8060"
            strokeWidth="3"
            fill="none"
          />

          {/* SÃƒÂ­mbolo normalizado de tierra */}
          <g stroke="#4c8060" strokeWidth="2.5" fill="none">
            <path d="M685 850H719" />
            <path d="M690 858H714" />
            <path d="M696 866H708" />
          </g>

          {/* IdentificaciÃƒÂ³n del conductor */}
          <text x="730" y="845"
            fontSize="12" fontWeight="bold" fill="#4c8060">
            PE Ã‚Â· CONDUCTOR DE PROTECCIÃƒâ€œN
          </text>

          <text x="730" y="862"
            fontSize="10" fill="#52677a">
            SISTEMA DE PUESTA A TIERRA
          </text>


          {/* DATOS TÃƒâ€°CNICOS */}
          <rect x="55" y="810" width="480" height="155" rx="3" fill="#fff" stroke="#9aa8b4" />
          <text x="75" y="840" fontSize="15" fontWeight="bold" fill="#20364c">
            DATOS GENERALES DEL GENERADOR
          </text>
          <line x1="75" y1="850" x2="515" y2="850" stroke="#9aa8b4" />
          <text x="75" y="875" fontSize="12" fill="#52677a">Cantidad de mÃƒÂ³dulos: {calc.panelCount}</text>
          <text x="75" y="897" fontSize="12" fill="#52677a">Strings calculados: {totalStrings}</text>
          <text x="75" y="919" fontSize="12" fill="#52677a">Potencia total: {num(calc.installedWp)} Wp</text>
          <text x="300" y="875" fontSize="12" fill="#52677a">TensiÃƒÂ³n Voc mÃƒÂ³dulo: {num(data.panelVoc)} V</text>
          <text x="300" y="897" fontSize="12" fill="#52677a">Corriente Isc mÃƒÂ³dulo: {num(data.panelIsc)} A</text>
          <text x="300" y="919" fontSize="12" fill="#52677a">Inversor: {num(data.inverterW)} W</text>
          {totalStrings > visibleStrings && (
            <text x="75" y="946" fontSize="11" fill="#a15b20">
              Nota: se representan {visibleStrings} de {totalStrings} strings para facilitar la lectura.
            </text>
          )}

          {/* CONVENCIONES */}
          <rect x="565" y="885" width="475" height="80" rx="3" fill="#fff" stroke="#9aa8b4" />
          <text x="585" y="908" fontSize="13" fontWeight="bold" fill="#20364c">CONVENCIONES</text>
          <path d="M585 930H635" stroke="#b88724" strokeWidth="3" />
          <text x="645" y="934" fontSize="11" fill="#52677a">Circuito DC</text>
          <path d="M755 930H805" stroke="#263f55" strokeWidth="3" />
          <text x="815" y="934" fontSize="11" fill="#52677a">Circuito AC</text>
          <path d="M920 930H960" stroke="#4c8060" strokeWidth="2" strokeDasharray="6 4" />
          <text x="970" y="934" fontSize="11" fill="#52677a">Tierra PE</text>

          {/* NOTAS */}
          <rect x="1070" y="810" width="465" height="155" rx="3" fill="#fff" stroke="#9aa8b4" />
          <text x="1090" y="840" fontSize="14" fontWeight="bold" fill="#20364c">NOTAS TÃƒâ€°CNICAS</text>
          <text x="1090" y="865" fontSize="11" fill="#52677a">1. Verificar fichas tÃƒÂ©cnicas y lÃƒÂ­mites elÃƒÂ©ctricos de los equipos.</text>
          <text x="1090" y="886" fontSize="11" fill="#52677a">2. Dimensionar strings segÃƒÂºn Voc corregido por temperatura.</text>
          <text x="1090" y="907" fontSize="11" fill="#52677a">3. Coordinar protecciones, conductores y puesta a tierra.</text>
          <text x="1090" y="928" fontSize="11" fill="#52677a">4. Validar conexiÃƒÂ³n, mediciÃƒÂ³n y requisitos del operador de red.</text>
          <text x="1090" y="949" fontSize="11" fontWeight="bold" fill="#a15b20">
            * Elementos sujetos al diseÃƒÂ±o elÃƒÂ©ctrico definitivo.
          </text>

          {/* CAJETÃƒÂN */}
          <rect x="55" y="980" width="1480" height="35" fill="#eaf2f7" stroke="#263f55" />
          <line x1="850" y1="980" x2="850" y2="1015" stroke="#263f55" />
          <line x1="1120" y1="980" x2="1120" y2="1015" stroke="#263f55" />
          <line x1="1320" y1="980" x2="1320" y2="1015" stroke="#263f55" />
          <text x="70" y="1003" fontSize="12" fontWeight="bold" fill="#20364c">
            PROYECTO: {data.projectName}
          </text>
          <text x="865" y="1003" fontSize="11" fill="#20364c">
            UBICACIÃƒâ€œN: {data.location || "Por definir"}
          </text>
          <text x="1135" y="1003" fontSize="11" fill="#20364c">
            ESCALA: ESQUEMÃƒÂTICA
          </text>
          <text x="1335" y="1003" fontSize="11" fontWeight="bold" fill="#20364c">
            PLANO: 01 / 01
          </text>
        </svg>
      </div>

      <p className="hint">
        Diagrama conceptual de presentaciÃƒÂ³n tÃƒÂ©cnica. La cantidad de strings mostrada es una distribuciÃƒÂ³n grÃƒÂ¡fica preliminar; su configuraciÃƒÂ³n real debe calcularse con los lÃƒÂ­mites de tensiÃƒÂ³n, corriente, temperatura y MPPT del inversor. Los elementos marcados con asterisco deben definirse segÃƒÂºn el diseÃƒÂ±o. No constituye un plano constructivo ni certifica cumplimiento RETIE.
      </p>
    </div>
  );
}
function AuthScreen({
  authMode,
  setAuthMode,
  authName,
  setAuthName,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authError,
  authMessage,
  handleAuth
}) {
  return (
    <div className="app-shell" style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "#ffffff",
        padding: "32px",
        borderRadius: "16px",
        boxShadow: "0 10px 35px rgba(0,0,0,0.12)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "25px" }}>
          <h1 style={{ color: "#e69b18", marginBottom: "5px" }}>
            Ã¢Ëœâ‚¬ SOLAR PRO
          </h1>
          <p>DiseÃƒÂ±o y gestiÃƒÂ³n de proyectos solares</p>
        </div>

        <h2 style={{ textAlign: "center" }}>
          {authMode === "login" ? "Iniciar sesiÃƒÂ³n" : "Crear cuenta"}
        </h2>

        {authMode === "register" && (
          <input
            placeholder="Nombre completo"
            value={authName}
            onChange={(e) => setAuthName(e.target.value)}
            style={authInputStyle}
          />
        )}

        <input
          type="email"
          placeholder="Correo electrÃƒÂ³nico"
          value={authEmail}
          onChange={(e) => setAuthEmail(e.target.value)}
          style={authInputStyle}
        />

        <input
          type="password"
          placeholder="ContraseÃƒÂ±a"
          value={authPassword}
          onChange={(e) => setAuthPassword(e.target.value)}
          style={authInputStyle}
        />

        {authError && (
          <p style={{ color: "#c62828" }}>{authError}</p>
        )}

        {authMessage && (
          <p style={{ color: "#237a42" }}>{authMessage}</p>
        )}

        <button
          onClick={handleAuth}
          style={{
            width: "100%",
            padding: "13px",
            background: "#e69b18",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            marginTop: "12px"
          }}
        >
          {authMode === "login" ? "Ingresar" : "Solicitar registro"}
        </button>

        <p style={{ textAlign: "center", marginTop: "20px" }}>
          {authMode === "login"
            ? "Ã‚Â¿No tienes una cuenta?"
            : "Ã‚Â¿Ya tienes una cuenta?"}
        </p>

        <button
          onClick={() => setAuthMode(
            authMode === "login" ? "register" : "login"
          )}
          style={{
            width: "100%",
            padding: "10px",
            background: "transparent",
            color: "#2563a6",
            border: "1px solid #2563a6",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          {authMode === "login"
            ? "Registrarme"
            : "Volver a iniciar sesiÃƒÂ³n"}
        </button>
      </div>
    </div>
  );
}

const authInputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "12px",
  border: "1px solid #d5dce5",
  borderRadius: "8px",
  boxSizing: "border-box"
};

function buildProjectBOM(data, calc) {
  const rows = [];
  const add = (name, qty, unit, note, price = null) => {
    if (qty > 0) rows.push({ name, qty: Math.ceil(qty * 100) / 100, unit, note, price });
  };
  const panels = Math.max(0, Number(calc.panelCount) || 0);
  const strings = Math.max(0, Number(calc.strings) || 0);
  const stringRun = Math.max(0, Number(data.stringDistance) || 0);
  add(`MÃƒÂ³dulo FV ${data.panelBrand || ""} ${data.panelModel || ""} (${data.panelW} Wp)`, panels, "unidad", "Cantidad calculada; confirmar modelo y ficha tÃƒÂ©cnica.", Number(data.panelPrice) || null);
  add("Inversor segÃƒÂºn arquitectura y potencia calculada", 1, "unidad", "Seleccionar referencia compatible con tensiÃƒÂ³n, MPPT, corriente y red AC.", Number(data.inverterPrice) || null);
  if (data.systemType !== "ON-GRID") {
    add(`BaterÃƒÂ­a ${data.batteryChemistry} ${data.batteryVoltage} V`, calc.batteryUnits, "unidad", "Cantidad preliminar; verificar energÃƒÂ­a ÃƒÂºtil, DoD, corriente, BMS y conexiÃƒÂ³n permitida.", Number(data.batteryPrice) || null);
  }
  if (data.systemType !== "ON-GRID" && data.controllerMode === "Controlador externo") {
    add("Controlador MPPT externo (solo si no estÃƒÂ¡ integrado en el inversor)", 1, "unidad", "Verificar si el inversor/cargador ya incorpora MPPT; evitar duplicar equipos.", null);
  }
  buildElectricalBOMRows(calc.electricalCircuitModel).forEach(circuitRow => rows.push(circuitRow));
  add("Conectores fotovoltaicos compatibles (pares)", strings, "par", "Verificar fabricante, modelo y compatibilidad cruzada; no mezclar conectores incompatibles.");
  buildExternalProtectionRows(data.integratedProtectionStatus, data.systemType).forEach(row => rows.push(row));
  if (data.systemType !== "OFF-GRID") add("ProtecciÃ³n AC del punto de conexiÃ³n", 1, "unidad", "ON-GRID/HÃBRIDO conectado; seleccionar conforme red y requisitos del operador.");
  add("Tablero/caja de protecciones", 1, "unidad", "Dimensionar por nÃƒÂºmero de circuitos, protecciones y grado IP.");
  if (data.groundingKitRequired === true) add("Sistema de puesta a tierra y equipotencializaciÃƒÂ³n", 1, "lote", "Paquete adicional confirmado de barra/electrodos/accesorios; no incluye los conductores individuales del BOM.");
  add("Kit de estructura y fijaciÃƒÂ³n para mÃƒÂ³dulos", panels, "kit por mÃƒÂ³dulo", "Cantidad conceptual; calcular rieles, apoyos, grapas y anclajes con geometrÃƒÂ­a del techo/suelo y cargas de viento.");
  add("Grapas intermedias", Math.max(0, (panels-1)*2), "unidad referencial", "Ajustar por filas, orientaciÃƒÂ³n, zonas de borde y manual del sistema de montaje.");
  add("Grapas terminales", 4, "unidad referencial", "Supuesto de una fila; recalcular segÃƒÂºn nÃƒÂºmero de filas y fabricante.");
  add("TornillerÃƒÂ­a, tuercas y arandelas inoxidables", panels*4, "juego referencial", "Cantidad preliminar; depende del sistema de soporte y anclaje.");
  add("CanalizaciÃƒÂ³n, tuberÃƒÂ­a y accesorios", (calc.electricalCircuitModel?.circuits || []).reduce((sum, circuit) => sum + (circuit.lengthM || 0), 0), "m referencial", "Suma de recorridos con longitud registrada; revisar ocupaciÃƒÂ³n, mÃƒÂ©todo y ambiente.");
  add("Etiquetas, seÃƒÂ±alizaciÃƒÂ³n y marcaciÃƒÂ³n", 1, "lote", "IdentificaciÃƒÂ³n de circuitos, riesgos, desconexiÃƒÂ³n y advertencias reglamentarias.");
  add("Consumibles, terminales y prensaestopas", 1, "lote", "Completar segÃƒÂºn calibre, envolventes y mÃƒÂ©todo de conexiÃƒÂ³n.");
  return rows;
}


function ProductIllustration({ item }) {
  const text = `${item.category || ""} ${item.model || ""} ${item.description || ""}`.toLowerCase();
  let kind = "generic";
  if (/cable|conductor/.test(text)) kind = /positivo|positive|rojo|\+/.test(text) ? "cable-red" : /negativo|negative|negro|-/.test(text) ? "cable-black" : "cable";
  else if (/mppt|controlador/.test(text)) kind = "mppt";
  else if (/panel|modulo|mÃƒÂ³dulo/.test(text)) kind = "panel";
  else if (/inversor|microinversor/.test(text)) kind = "inverter";
  else if (/bateria|baterÃƒÂ­a|lifepo|gel|agm/.test(text)) kind = "battery";
  else if (/tornillo|perno|tuerca|arandela|anclaje/.test(text)) kind = "bolt";
  else if (/riel|perfil|estructura|soporte|torre|marquesina/.test(text)) kind = "rail";
  else if (/mc4|conector|terminal/.test(text)) kind = "connector";
  else if (/fusible|breaker|interruptor|termomagnetico|termomagnÃƒÂ©tico/.test(text)) kind = "breaker";
  else if (/dps|sobretension|sobretensiÃƒÂ³n/.test(text)) kind = "spd";
  else if (/tierra|varilla|copperweld/.test(text)) kind = "ground";
  else if (/tuberia|tuberÃƒÂ­a|canaleta|conduit/.test(text)) kind = "conduit";
  const cableColor = kind === "cable-red" ? "#dc2626" : kind === "cable-black" ? "#20242b" : "#2563eb";
  return <div role="img" aria-label={`IlustraciÃƒÂ³n referencial: ${item.model} - ${item.description}`} style={{height:190,background:"linear-gradient(145deg,#f7fafc,#e8eef5)",display:"flex",alignItems:"center",justifyContent:"center",padding:12,position:"relative",overflow:"hidden"}}>
    <svg viewBox="0 0 300 170" width="100%" height="100%" aria-hidden="true">
      <ellipse cx="150" cy="148" rx="92" ry="10" fill="#cbd5e1" opacity=".55"/>
      {kind==="panel" && <g transform="translate(52 30) skewY(-8)"><rect x="0" y="0" width="196" height="105" rx="5" fill="#173c67" stroke="#64748b" strokeWidth="5"/>{Array.from({length:6},(_,i)=><path key={i} d={`M${i*32.5} 0v105`} stroke="#8db7d8" strokeWidth="1.5"/>)}{Array.from({length:3},(_,i)=><path key={i} d={`M0 ${i*35}h196`} stroke="#8db7d8" strokeWidth="1.5"/>)}<path d="M0 105h196" stroke="#64748b" strokeWidth="5"/></g>}
      {kind==="inverter" && <g><rect x="91" y="14" width="118" height="125" rx="12" fill="#f8fafc" stroke="#64748b" strokeWidth="4"/><rect x="112" y="34" width="76" height="28" rx="4" fill="#173c67"/><path d="M122 49h20m8 0h24" stroke="#86efac" strokeWidth="3"/><circle cx="150" cy="88" r="6" fill="#16a34a"/><path d="M116 112h68" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round"/></g>}
      {kind==="mppt" && <g><rect x="82" y="18" width="136" height="120" rx="10" fill="#334155" stroke="#0f172a" strokeWidth="3"/><rect x="105" y="34" width="90" height="35" rx="4" fill="#bde4ef"/><text x="150" y="56" textAnchor="middle" fontSize="15" fill="#164e63" fontWeight="bold">MPPT</text><circle cx="110" cy="92" r="5" fill="#22c55e"/><circle cx="130" cy="92" r="5" fill="#eab308"/><path d="M160 91h35M160 104h35" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round"/><path d="M102 138v8m96-8v8" stroke="#475569" strokeWidth="5"/></g>}
      {kind==="battery" && <g><rect x="87" y="30" width="126" height="104" rx="9" fill="#e2e8f0" stroke="#64748b" strokeWidth="4"/><rect x="104" y="18" width="28" height="12" rx="3" fill="#64748b"/><rect x="168" y="18" width="28" height="12" rx="3" fill="#dc2626"/><rect x="111" y="53" width="78" height="32" rx="4" fill="#d1fae5"/><text x="150" y="74" textAnchor="middle" fontSize="14" fill="#166534" fontWeight="bold">LiFePOÃ¢â€šâ€ž</text><path d="M115 105h70" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round"/></g>}
      {kind.startsWith("cable") && <g><path d="M48 87 C85 15 190 15 248 83" fill="none" stroke={cableColor} strokeWidth="19" strokeLinecap="round"/><path d="M48 87 C85 15 190 15 248 83" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="4" strokeLinecap="round"/><rect x="37" y="75" width="27" height="24" rx="5" fill="#64748b"/><rect x="235" y="71" width="28" height="24" rx="5" fill="#64748b"/><text x="150" y="137" textAnchor="middle" fontSize="13" fill="#334155" fontWeight="bold">{kind==="cable-red"?"POSITIVO (+)":kind==="cable-black"?"NEGATIVO (Ã¢Ë†â€™)":"CABLE ELÃƒâ€°CTRICO"}</text></g>}
      {kind==="bolt" && <g transform="translate(105 30)"><path d="M20 0h50l14 18-14 18H20L6 18z" fill="#94a3b8" stroke="#475569" strokeWidth="3"/><rect x="37" y="34" width="18" height="85" rx="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="2"/>{Array.from({length:7},(_,i)=><path key={i} d={`M37 ${48+i*10}l18 -7`} stroke="#64748b" strokeWidth="2"/> )}</g>}
      {kind==="rail" && <g transform="translate(30 45)"><path d="M0 40h240v28H0z" fill="#94a3b8" stroke="#475569" strokeWidth="3"/><path d="M18 40v-22h28v22m150 0v-22h28v22" fill="none" stroke="#64748b" strokeWidth="7"/><path d="M0 68h240" stroke="#475569" strokeWidth="3"/></g>}
      {kind==="connector" && <g><path d="M65 77h58v-20h54v20h58v24h-58v20h-54v-20H65z" fill="#e2e8f0" stroke="#64748b" strokeWidth="4"/><rect x="126" y="58" width="48" height="60" rx="8" fill="#f8fafc" stroke="#475569" strokeWidth="3"/><path d="M65 89h-22m214 0h-22" stroke="#334155" strokeWidth="8" strokeLinecap="round"/></g>}
      {kind==="breaker" && <g><rect x="104" y="18" width="92" height="124" rx="8" fill="#f8fafc" stroke="#475569" strokeWidth="4"/><rect x="126" y="37" width="48" height="42" rx="5" fill="#cbd5e1"/><path d="M150 46v28" stroke="#334155" strokeWidth="8" strokeLinecap="round"/><circle cx="150" cy="111" r="6" fill="#16a34a"/></g>}
      {kind==="spd" && <g><rect x="112" y="22" width="76" height="120" rx="7" fill="#f8fafc" stroke="#475569" strokeWidth="4"/><path d="M150 43l-17 37h15l-7 28 27-43h-16l8-22z" fill="#eab308" stroke="#a16207" strokeWidth="2"/></g>}
      {kind==="ground" && <g><path d="M150 20v110" stroke="#b87932" strokeWidth="12"/><path d="M118 130h64m-54 10h44" stroke="#64748b" strokeWidth="4"/><path d="M150 20l-22 17m22-17l22 17" stroke="#b87932" strokeWidth="5"/></g>}
      {kind==="conduit" && <g><path d="M55 110 C55 40 245 40 245 110" fill="none" stroke="#94a3b8" strokeWidth="20"/><path d="M55 110 C55 40 245 40 245 110" fill="none" stroke="#e2e8f0" strokeWidth="7"/></g>}
      {kind==="generic" && <g><rect x="78" y="30" width="144" height="105" rx="10" fill="#e2e8f0" stroke="#64748b" strokeWidth="3"/><path d="M105 58h90m-90 18h65m-65 18h78" stroke="#94a3b8" strokeWidth="7" strokeLinecap="round"/><circle cx="196" cy="112" r="7" fill="#16a34a"/></g>}
    </svg>
    <span style={{position:"absolute",bottom:8,left:10,fontSize:10,color:"#475569",background:"rgba(255,255,255,.8)",padding:"3px 6px",borderRadius:5}}>IlustraciÃƒÂ³n del tipo de producto</span>
  </div>;
}

function SolarProtectionSchedule({ data, calc }) {
  const mpptRows = (calc.mpptDistribution || []).map((count, index) => ({
    mppt: index + 1,
    strings: count,
    modules: count * calc.modulesPerString,
    vmp: calc.stringVoltageVmp,
    voc: calc.stringVoltageVocCold,
    imp: count * n(data.panelImp),
    isc: count * n(data.panelIsc)
  }));
  const sectionText = run => run?.commercialSectionMm2 ? `${run.commercialSectionMm2} mmÃ‚Â² candidata` : "VALIDACIÃƒâ€œN PENDIENTE";
  const sectionDC = sectionText(calc.collectorConductor);
  const sectionString = sectionText(calc.stringConductor);
  const sectionAC = sectionText(calc.acConductor);
  const breakerDesign = calc.acCurrent;
  const breakerCandidate = n(data.breakerNominalCurrentA) > 0 ? n(data.breakerNominalCurrentA) : null;
  const parallelStrings = Math.max(0, ...(calc.mpptDistribution || [0]));
  const fuseMax = n(data.panelMaxSeriesFuse);
  const systemName = data.systemType === "ON-GRID" ? "INTERCONECTADO A LA RED" : data.systemType === "OFF-GRID" ? "AISLADO" : "HÃƒÂBRIDO";
  const conductor = data.conductorMaterial || "Cobre";
  const legacyRows = [
    {id:"T1",from:"Cada string FV",to:"Caja / entrada de string",circuits:calc.strings,amps:n(data.panelIsc)*1.25,protection:calc.strings > 1 ? (fuseMax > 0 ? `Fusible gPV por string: lÃƒÂ­mite de mÃƒÂ³dulo ${num(fuseMax)} A; validar` : "gPV pendiente: falta lÃƒÂ­mite de fusible de mÃƒÂ³dulo") : "Evaluar por ficha y diseÃƒÂ±o; no se instala por defecto",wire:`2 Ãƒâ€” ${sectionString} ${conductor} Ã‚Â· tramo individual`,install:data.conductorInstallationMethod || "MÃƒÂ©todo pendiente",length:`${num(data.stringDistance)} m ida / string`,drop:calc.stringConductor?.voltageDropPercent == null ? "VALIDACIÃƒâ€œN PENDIENTE" : `${num(calc.stringConductor.voltageDropPercent)} %`,ampacity:calc.stringConductor?.correctedAmpacityA == null ? "VALIDACIÃƒâ€œN PENDIENTE" : `${num(calc.stringConductor.correctedAmpacityA)} A corregida`},
    {id:"T2",from:"Caja / colector DC",to:"Entrada DC del inversor",circuits:1,amps:calc.shortCircuitCurrentPerMppt*1.25,protection:"Seccionador FV DC + DPS DC: ficha / Icc pendientes",wire:`2 Ãƒâ€” ${sectionDC} ${conductor} Ã‚Â· colector MPPT`,install:data.conductorInstallationMethod || "MÃƒÂ©todo pendiente",length:`${num(data.dcDistance)} m ida`,drop:calc.collectorConductor?.voltageDropPercent == null ? "VALIDACIÃƒâ€œN PENDIENTE" : `${num(calc.collectorConductor.voltageDropPercent)} %`,ampacity:calc.collectorConductor?.correctedAmpacityA == null ? "VALIDACIÃƒâ€œN PENDIENTE" : `${num(calc.collectorConductor.correctedAmpacityA)} A corregida`},
    {id:"T3",from:"Salida AC del inversor",to:"Tablero FV / protecciones AC",circuits:1,amps:calc.acCurrent,protection:breakerCandidate ? `Interruptor ${breakerCandidate} A candidato; poder de corte pendiente` : "Interruptor por definir",wire:`Fases + N segÃºn esquema Â· ${sectionAC} ${conductor}`,install:data.conductorInstallationMethod || "MÃ©todo pendiente",length:`${num(data.acDistance)} m ida`,drop:calc.acConductor?.voltageDropPercent == null ? "VALIDACIÃ“N PENDIENTE" : `${num(calc.acConductor.voltageDropPercent)} % individual`,ampacity:calc.acConductor?.correctedAmpacityA == null ? "VALIDACIÃ“N PENDIENTE" : `${num(calc.acConductor.correctedAmpacityA)} A corregida`},
    ...(data.systemType !== "OFF-GRID" ? [{id:"T4",from:"Tablero FV",to:"Punto de conexiÃƒÂ³n a red",circuits:1,amps:calc.acCurrent,protection:"ProtecciÃƒÂ³n punto de conexiÃƒÂ³n / operador de red pendiente",wire:`Fases + N + PE Ã‚Â· ${sectionText(calc.connectionConductor)} ${conductor}`,install:data.conductorInstallationMethod || "MÃƒÂ©todo pendiente",length:`${num(data.acConnectionDistance)} m ida`,drop:calc.connectionConductor?.voltageDropPercent == null ? "VALIDACIÃƒâ€œN PENDIENTE" : `${num(calc.connectionConductor.voltageDropPercent)} % individual`,ampacity:calc.connectionConductor?.correctedAmpacityA == null ? "VALIDACIÃƒâ€œN PENDIENTE" : `${num(calc.connectionConductor.correctedAmpacityA)} A corregida`}] : []),
    ...(data.systemType !== "ON-GRID" ? [{id:"T5",from:"Banco de baterÃƒÂ­as",to:"Terminal DC del inversor",circuits:1,amps:calc.batteryCurrent,protection:"Fusible/interruptor DC segÃƒÂºn BMS, Icc y ficha de inversor",wire:`2 Ãƒâ€” ${sectionText(calc.batteryConductor)} ${conductor}`,install:data.conductorInstallationMethod || "MÃƒÂ©todo pendiente",length:`${num(data.batteryDistance)} m ida`,drop:calc.batteryConductor?.voltageDropPercent == null ? "VALIDACIÃƒâ€œN PENDIENTE" : `${num(calc.batteryConductor.voltageDropPercent)} %`,ampacity:calc.batteryConductor?.correctedAmpacityA == null ? "VALIDACIÃƒâ€œN PENDIENTE" : `${num(calc.batteryConductor.correctedAmpacityA)} A corregida`}] : []),
    {id:"T6",from:"Marcos y masas",to:"Barra PE / sistema de tierra",circuits:1,amps:null,protection:"PE, puesta a tierra y equipotencialidad diferenciados",wire:`PE ${calc.peConductor?.sectionMm2 || "VALIDACIÃ“N PENDIENTE"} mmÂ²; tierra ${calc.groundingConductor?.commercialSectionMm2 || "VALIDACIÃ“N PENDIENTE"} mmÂ²; uniÃ³n ${calc.bondingConductor?.commercialSectionMm2 || "VALIDACIÃ“N PENDIENTE"} mmÂ²`,install:"Verificar continuidad y terminales",length:`PE ${num(data.peDistance)} m Â· tierra/uniÃ³n ${num(data.bondingDistance)} m`,drop:"No aplica",ampacity:"VALIDACIÃ“N PENDIENTE"},
  ];
  const rows = (calc.electricalCircuitModel?.circuits || []).map(circuit => ({
    id: circuit.id, from: circuit.from, to: circuit.to, circuits: circuit.strings || 1,
    amps: circuit.designCurrentA, protection: circuit.protection,
    wire: `${circuit.conductorCount ?? "?"} conductor(es) Â· ${circuit.sectionMm2 == null ? "VALIDACIÃ“N PENDIENTE" : `${circuit.sectionMm2} mmÂ²`} ${circuit.material}`,
    install: data.conductorInstallationMethod || "MÃ©todo pendiente",
    length: circuit.lengthM == null ? "VALIDACIÃ“N PENDIENTE" : `${num(circuit.lengthM)} m ida${circuit.type === "string" ? " / string" : ""}`,
    drop: circuit.voltageDropPercent == null ? "VALIDACIÃ“N PENDIENTE" : `${num(circuit.voltageDropPercent)} % individual`,
    ampacity: circuit.correctedAmpacityA == null ? "VALIDACIÃ“N PENDIENTE" : `${num(circuit.correctedAmpacityA)} A corregida Â· ${circuit.status}`
  }));
  rows.push({id:"FV-TOTAL",from:"Generador FV",to:"Suma de strings/MPPT",circuits:calc.strings,amps:calc.electricalCircuitModel?.generator.currentA,protection:"No es un recorrido conductor; corriente total separada",wire:`Isc total ${calc.electricalCircuitModel?.generator.shortCircuitCurrentA == null ? "pendiente" : `${num(calc.electricalCircuitModel.generator.shortCircuitCurrentA)} A`}`,install:"â€”",length:"â€”",drop:"â€”",ampacity:"No aplica"});
  return <div className="solar-schedule-sheet">
    <div className="schedule-head">
      <div><span className="eyebrow">SOLAR PRO Ã‚Â· DOCUMENTACIÃƒâ€œN ELÃƒâ€°CTRICA</span><h2>CUADRO DE CONDUCTORES Y PROTECCIONES</h2><p>{data.projectName} Ã‚Â· {data.location || "UbicaciÃƒÂ³n por definir"} Ã‚Â· {systemName}</p></div>
      <div className="schedule-stamp"><b>PLANO 02</b><span>CUADROS TÃƒâ€°CNICOS</span><span>REVISIÃƒâ€œN PRELIMINAR</span></div>
    </div>
    <div className="schedule-columns">
      <section className="schedule-main">
        <h3>1. Cuadro de conductores y protecciones por tramo</h3>
        <div className="table-wrap schedule-table"><table><thead><tr><th>Tramo</th><th>Desde</th><th>Hasta</th><th>Circ.</th><th>I diseÃƒÂ±o (A)</th><th>ProtecciÃƒÂ³n / dispositivo</th><th>Conductor propuesto</th><th>CanalizaciÃƒÂ³n</th><th>L (m)</th><th>CaÃƒÂ­da</th><th>Ampacidad</th></tr></thead><tbody>
          {rows.map(r=><tr key={r.id}><td><b>{r.id}</b></td><td>{r.from}</td><td>{r.to}</td><td>{r.circuits}</td><td>{r.amps==null?"Ã¢â‚¬â€":num(r.amps)}</td><td>{r.protection}</td><td>{r.wire}</td><td>{r.install}</td><td>{r.length}</td><td>{r.drop}</td><td>{r.ampacity}</td></tr>)}
        </tbody></table></div>
        <h3>2. Arreglo fotovoltaico y distribuciÃƒÂ³n por MPPT</h3>
        <div className="table-wrap"><table><thead><tr><th>Inversor</th><th>MPPT</th><th>Strings asignados</th><th>MÃƒÂ³dulos/string</th><th>Potencia (kWp)</th><th>Voc frÃƒÂ­a (V)</th><th>Vmp (V)</th><th>Imp MPPT (A)</th><th>Isc MPPT (A)</th></tr></thead><tbody>
          {mpptRows.map(r=><tr key={r.mppt}><td>{data.inverterType || "Inversor"}</td><td>{r.mppt}</td><td>{r.strings}</td><td>{calc.modulesPerString}</td><td>{num(r.modules*n(data.panelW)/1000)}</td><td>{num(r.voc)}</td><td>{num(r.vmp)}</td><td>{num(r.imp)}</td><td>{num(r.isc)}</td></tr>)}
          {mpptRows.length===0&&<tr><td colSpan="9">Configura el nÃƒÂºmero de MPPT y los datos de los mÃƒÂ³dulos para generar el arreglo.</td></tr>}
        </tbody></table></div>
        <h3>3. Puesta a tierra y equipotencialidad</h3>
        <div className="bonding-box"><div className="bonding-list">{["Estructura y marcos FV","Caja DC y DPS DC","Inversor","Tablero FV y DPS AC","Tablero general / masas"].map((v,i)=><div key={v}><span>{v}</span><b>PE FV Â· Tabla 250-122: {calc.peConductor.sectionMm2 || "pendiente"} mmÂ²</b></div>)}</div><div className="bonding-bar"><b>BARRA DE EQUIPOTENCIALIDAD</b><span>ConexiÃƒÂ³n al sistema de puesta a tierra existente o diseÃƒÂ±ado</span></div></div>
      </section>
      <aside className="schedule-aside">
        <h3>Datos del sistema</h3>
        <dl>
          <dt>Potencia FV instalada</dt><dd>{num(calc.installedWp/1000)} kWp</dd>
          <dt>MÃƒÂ³dulos</dt><dd>{calc.panelCount} Ãƒâ€” {num(data.panelW)} Wp</dd>
          <dt>Strings</dt><dd>{calc.strings} Ã‚Â· {calc.modulesPerString} mÃƒÂ³dulos/string</dd>
          <dt>Inversor</dt><dd>{data.inverterType} Ã‚Â· {num(data.inverterW/1000)} kW</dd>
          <dt>Salida AC</dt><dd>{num(data.acVoltage)} V Ã‚Â· {data.acPhases}</dd><dt>CaÃ­da AC acumulada</dt><dd>{calc.acCumulativeDrop?.cumulativeDropPercent == null ? "VALIDACIÃ“N PENDIENTE" : `${num(calc.acCumulativeDrop.cumulativeDropPercent)} % / lÃ­mite 3 % Â· ${calc.acCumulativeDrop.status}`}</dd>
          <dt>Banco de baterÃƒÂ­as</dt><dd>{data.systemType==="ON-GRID"?"No aplica":`${num(data.batteryVoltage)} V Ã‚Â· ${calc.batteryUnits} unidades estimadas`}</dd>
          <dt>Conductor</dt><dd>{conductor}</dd>
          <dt>UbicaciÃƒÂ³n</dt><dd>{data.location || "Por definir"}</dd>
        </dl>
        <h3>Protecciones a coordinar</h3>
        <ul className="schedule-notes"><li>Fusibles gPV y portafusibles por string cuando el diseÃƒÂ±o y fabricante lo requieran.</li><li>Seccionador DC y DPS DC con tensiÃƒÂ³n Ucpv adecuada a Voc mÃƒÂ¡xima corregida.</li><li>Interruptor AC, DPS AC y seccionamiento segÃƒÂºn tensiÃƒÂ³n, fases y esquema de red.</li><li>ProtecciÃƒÂ³n de baterÃƒÂ­a segÃƒÂºn corriente mÃƒÂ¡xima, BMS, capacidad de interrupciÃƒÂ³n y manual del inversor.</li><li>Conductor PE, equipotencialidad y sistema de tierra segÃƒÂºn diseÃƒÂ±o y normativa vigente.</li></ul>
        <h3>Notas de ingenierÃƒÂ­a</h3>
        <ol className="schedule-notes"><li>Las secciones mostradas son predimensionamientos por caÃƒÂ­da de tensiÃƒÂ³n; no representan ampacidad aprobada.</li><li>Verificar temperatura, agrupamiento, mÃƒÂ©todo de instalaciÃƒÂ³n, aislamiento, cortocircuito y caÃƒÂ­da real.</li><li>Confirmar poder de corte, curvas, polos, coordinaciÃƒÂ³n y lÃƒÂ­mites de protecciÃƒÂ³n de cada fabricante.</li><li>Los tramos sin longitud o dato suficiente quedan expresamente pendientes; no se estiman como valores reales.</li><li>La configuraciÃƒÂ³n final debe revisarse frente a RETIE, NTC 2050 y requisitos del operador de red aplicables.</li></ol>
      </aside>
    </div>
    <div className="schedule-footer"><div><b>DESCRIPCIÃƒâ€œN DEL PROYECTO</b><span>{data.projectName} Ã‚Â· {data.client || "Cliente por definir"}</span></div><div><b>DISEÃƒâ€˜O</b><span>Generado por SOLAR PRO</span></div><div><b>REVISIÃƒâ€œN</b><span>Pendiente de profesional competente</span></div><div><b>PLANO</b><span>02 de 02</span></div></div>
    <p className="schedule-disclaimer">Documento de prediseÃƒÂ±o automÃƒÂ¡tico. No es un plano constructivo certificado ni sustituye memorias de cÃƒÂ¡lculo, fichas tÃƒÂ©cnicas, inspecciÃƒÂ³n del sitio o aprobaciÃƒÂ³n del profesional responsable.</p>
  </div>;
}

export default function App() {
    // CONTROL DE USUARIOS Y AUTORIZACIONES
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [adminView, setAdminView] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [data,setData] = useState(()=>{
    try {
      return mergeProjectDefaults(initial, JSON.parse(localStorage.getItem("solar-pro-project")||"{}"));
    } catch { return initial; }
  });
  const [active,setActive] = useState("Resumen");
  const [mobileOpen,setMobileOpen] = useState(false);
  // Localizador de recurso solar: resultados consultados, no valores precargados.
  const [hspSearch, setHspSearch] = useState("");
  const [hspOptions, setHspOptions] = useState([]);
  const [hspResult, setHspResult] = useState(null);
  const [hspMonth, setHspMonth] = useState("ANUAL");
  const [hspLoading, setHspLoading] = useState(false);
  const [hspError, setHspError] = useState("");
  const [saved,setSaved] = useState(false);
    // ADMINISTRACIÃƒâ€œN DE PROYECTOS EN LA NUBE
  const [proyectos, setProyectos] = useState([]);
  const CLAVE_PROYECTOS_LOCALES = "solar_pro_proyectos_locales";
  const obtenerProyectosLocales = () => {
  try {
    return JSON.parse(
      localStorage.getItem(CLAVE_PROYECTOS_LOCALES) || "[]"
    );
  } catch (error) {
    console.error("Error al leer proyectos locales:", error);
    return [];
  }
};

const guardarProyectoLocal = (nombre, datos, idActual) => {
  const proyectosLocales = obtenerProyectosLocales();

  const id = idActual || `local-${Date.now()}`;

  const proyecto = {
    id,
    nombre: nombre.trim(),
    datos,
    updated_at: new Date().toISOString(),
    user_id: session?.user?.id || null,
    pendienteSync: true
  };

  const indice = proyectosLocales.findIndex(
    item => item.id === id
  );

  if (indice >= 0) {
    proyectosLocales[indice] = proyecto;
  } else {
    proyectosLocales.push(proyecto);
  }

  localStorage.setItem(
    CLAVE_PROYECTOS_LOCALES,
    JSON.stringify(proyectosLocales)
  );

  return proyecto;
};
  const [nombreProyecto, setNombreProyecto] = useState("");
  const [proyectoActual, setProyectoActual] = useState(null);
  const [cargandoProyectos, setCargandoProyectos] = useState(false);
  const [mostrarProyectos, setMostrarProyectos] = useState(false);
  const [search,setSearch] = useState("");
  const [custom,setCustom] = useState(false);
  const [compare,setCompare] = useState([]);
  const [commercialSearch,setCommercialSearch] = useState("");
  const [commercialCategory,setCommercialCategory] = useState("Todos");
  const [commercialShowAll,setCommercialShowAll] = useState(false);
  const [quoteItems,setQuoteItems] = useState([]);
  const [budgetMode,setBudgetMode] = useState(()=>localStorage.getItem("solar-pro-budget-mode") || "commercial");
  const [budgetSelections,setBudgetSelections] = useState(()=>{try{return JSON.parse(localStorage.getItem("solar-pro-budget-selections")||"{}");}catch{return {};}});
  const [budgetManualPrices,setBudgetManualPrices] = useState(()=>{try{return JSON.parse(localStorage.getItem("solar-pro-budget-manual-prices")||"{}");}catch{return {};}});
  const [budgetExtra,setBudgetExtra] = useState(()=>{try{return JSON.parse(localStorage.getItem("solar-pro-budget-extra")||'{"transport":0,"labor":0,"other":0,"tax":0}');}catch{return {transport:0,labor:0,other:0,tax:0};}});
  useEffect(()=>{localStorage.setItem("solar-pro-budget-mode",budgetMode);},[budgetMode]);
  useEffect(()=>{localStorage.setItem("solar-pro-budget-selections",JSON.stringify(budgetSelections));},[budgetSelections]);
  useEffect(()=>{localStorage.setItem("solar-pro-budget-manual-prices",JSON.stringify(budgetManualPrices));},[budgetManualPrices]);
  useEffect(()=>{localStorage.setItem("solar-pro-budget-extra",JSON.stringify(budgetExtra));},[budgetExtra]);

  const inverterEditedFields = new Set(["inverterW","inverterSurgeW","inverterSurgeDurationSec","inverterEfficiency","inverterMaxDcVoltage","mpptMinVoltage","inverterStartVoltage","mpptMaxVoltage","inverterMaxInputCurrent","inverterMaxInputCurrentPerInput","inverterMaxIsc","inverterMaxIscPerInput","inverterMaxPvPower","inverterType","inverterAcVoltage","mpptCount","modulesPerMppt","inverterInputsPerMppt","inverterMaxAcCurrentA"]);
  const controllerEditedFields = new Set(["controllerMode","controllerMaxPvVoltage","controllerMpptMinVoltage","controllerMpptMaxVoltage","controllerMaxChargeCurrent","controllerMaxPvPower"]);
  const update = (key,value) => setData(old=>({...old,[key]:value,...(inverterEditedFields.has(key)?{selectedInverterCatalogId:""}:{}),...(controllerEditedFields.has(key)?{selectedControllerCatalogId:""}:{})}));
  const applianceDailyWh = (Array.isArray(data.appliances) ? data.appliances : []).reduce((total, item) =>
    total + Math.max(0, n(item?.watts)) * Math.max(0, n(item?.quantity)) * Math.max(0, n(item?.hours)), 0
  );
  const applianceDailyKwh = applianceDailyWh / 1000;
  const applianceMonthlyKwh = applianceDailyKwh * 30;
  const addAppliance = () => setData(old => ({
    ...old,
    appliances: [...(old.appliances || []), { id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, name:"", watts:100, quantity:1, hours:4 }]
  }));
  const updateAppliance = (id, key, value) => setData(old => ({
    ...old,
    appliances: (old.appliances || []).map(item => item.id === id ? {...item, [key]: value} : item)
  }));
  const removeAppliance = id => setData(old => ({
    ...old,
    appliances: (old.appliances || []).filter(item => item.id !== id)
  }));

  const consultarHSP = async (place) => {
    setHspLoading(true);
    setHspError("");
    setHspResult(null);
    try {
      const params = new URLSearchParams({
        parameters: "ALLSKY_SFC_SW_DWN",
        community: "RE",
        longitude: String(place.longitude),
        latitude: String(place.latitude),
        format: "JSON"
      });
      const response = await fetch(`https://power.larc.nasa.gov/api/temporal/climatology/point?${params.toString()}`);
      if (!response.ok) throw new Error(`NASA POWER respondiÃƒÂ³ con el estado ${response.status}.`);
      const payload = await response.json();
      const monthly = payload?.properties?.parameter?.ALLSKY_SFC_SW_DWN;
      if (!monthly) throw new Error("La fuente no devolviÃƒÂ³ la serie mensual de radiaciÃƒÂ³n para esta ubicaciÃƒÂ³n.");
      const values = HSP_MONTHS.map(([key, label]) => {
        const value = Number(monthly[key]);
        return { key, label, value: Number.isFinite(value) && value >= 0 ? value : null };
      });
      const valid = values.filter(item => item.value !== null);
      if (!valid.length) throw new Error("No hay datos mensuales vÃƒÂ¡lidos para esta ubicaciÃƒÂ³n.");
      const average = valid.reduce((sum, item) => sum + item.value, 0) / valid.length;
      const lowest = valid.reduce((a, b) => a.value <= b.value ? a : b);
      setHspResult({
        place,
        values,
        average,
        lowest,
        source: "NASA POWER Ã‚Â· ALLSKY_SFC_SW_DWN",
        retrievedAt: new Date().toLocaleString("es-CO")
      });
      setHspMonth("ANUAL");
    } catch (error) {
      setHspError(error.message || "No fue posible consultar el recurso solar.");
    } finally {
      setHspLoading(false);
    }
  };

  const buscarHSP = async () => {
    const query = hspSearch.trim();
    if (query.length < 2) {
      setHspError("Escribe al menos dos letras del municipio o departamento.");
      return;
    }
    setHspLoading(true);
    setHspError("");
    setHspOptions([]);
    setHspResult(null);
    try {
      const params = new URLSearchParams({ name: query, count: "10", language: "es", countryCode: "CO" });
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
      if (!response.ok) throw new Error(`El servicio de ubicaciÃƒÂ³n respondiÃƒÂ³ con el estado ${response.status}.`);
      const payload = await response.json();
      const results = (payload.results || []).filter(item => item.country_code === "CO");
      if (!results.length) throw new Error("No encontramos ese lugar en Colombia. Prueba con municipio y departamento.");
      const options = results.map(item => ({
        id: item.id,
        name: item.name,
        admin1: item.admin1 || "",
        admin2: item.admin2 || "",
        country: item.country || "Colombia",
        latitude: item.latitude,
        longitude: item.longitude,
        elevation: item.elevation
      }));
      setHspOptions(options);
      if (options.length === 1) {
        setHspOptions([]);
        await consultarHSP(options[0]);
      }
    } catch (error) {
      setHspError(error.message || "No fue posible localizar el municipio.");
    } finally {
      setHspLoading(false);
    }
  };

  const aplicarHSP = (period = hspMonth) => {
    if (!hspResult) return;
    const selected = period === "ANUAL"
      ? hspResult.average
      : hspResult.values.find(item => item.key === period)?.value;
    if (!Number.isFinite(selected) || selected <= 0) {
      setHspError("No hay un valor vÃƒÂ¡lido para el periodo seleccionado.");
      return;
    }
    update("peakSunHours", Number(selected.toFixed(2)));
    update("location", [hspResult.place.name, hspResult.place.admin1].filter(Boolean).join(", "));
    setHspMonth(period);
    setHspError("");
  };
    // REGISTRO E INICIO DE SESIÃƒâ€œN
  const handleAuth = async () => {
    setAuthError("");
    setAuthMessage("");

    try {
      if (authMode === "register") {
        if (!authName || !authEmail || !authPassword) {
          setAuthError("Completa todos los campos.");
          return;
        }

        const resultado = await registrarUsuario(
          authName,
          authEmail,
          authPassword
        );

        if (!resultado.session) {
          setAuthMessage(
            "Registro realizado. Revisa tu correo para confirmar la cuenta. DespuÃƒÂ©s podrÃƒÂ¡s iniciar sesiÃƒÂ³n."
          );
        } else {
          setAuthMessage(
            "Solicitud enviada. Tu acceso requiere autorizaciÃƒÂ³n del administrador."
          );
        }
      } else {
        if (!authEmail || !authPassword) {
          setAuthError("Escribe tu correo y contraseÃƒÂ±a.");
          return;
        }

        await iniciarSesion(authEmail, authPassword);
      }
    } catch (error) {
      setAuthError(error.message);
    }
  };
    // CONSULTAR USUARIOS REGISTRADOS
  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
    // BÃƒÅ¡SQUEDA Y FILTROS DE USUARIOS
  const [busquedaUsuarios, setBusquedaUsuarios] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const cargarUsuarios = async () => {
    setCargandoUsuarios(true);
    setAuthError("");

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsuarios(data || []);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setCargandoUsuarios(false);
    }
  };
    // CONSULTAR PROYECTOS GUARDADOS EN LA NUBE
  // CONSULTAR PROYECTOS EN LA NUBE Y EN EL DISPOSITIVO
const cargarProyectos = async () => {
  setCargandoProyectos(true);
  setAuthError("");

  try {
    const locales = obtenerProyectosLocales();

    if (!navigator.onLine) {
      setProyectos(locales);
      return;
    }

    const { data, error } = await supabase
      .from("proyectos")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const combinados = [...(data || [])];

    locales.forEach(local => {
      const indice = combinados.findIndex(
        nube => nube.id === local.id
      );

      if (indice >= 0) {
        combinados[indice] = local;
      } else {
        combinados.push(local);
      }
    });

    combinados.sort(
      (a, b) =>
        new Date(b.updated_at) - new Date(a.updated_at)
    );

    setProyectos(combinados);

  } catch (error) {
    const locales = obtenerProyectosLocales();
    setProyectos(locales);
    setAuthError(
      "No se pudo consultar la nube. Se muestran los proyectos locales."
    );
  } finally {
    setCargandoProyectos(false);
  }
};
    // GUARDAR PROYECTO EN LA NUBE
// GUARDAR PROYECTO EN LA NUBE O LOCALMENTE
const guardarProyectoNube = async (nombreAGuardar) => {
  if (!nombreAGuardar || !nombreAGuardar.trim()) {
    setAuthError("Escribe el nombre del proyecto.");
    return;
  }

  setCargandoProyectos(true);
  setAuthError("");

  const nombre = nombreAGuardar.trim();

  try {
    if (!navigator.onLine) {
      const proyectoLocal = guardarProyectoLocal(
        nombre,
        data,
        proyectoActual
      );

      setProyectoActual(proyectoLocal.id);
      setNombreProyecto(nombre);
      setSaved(true);
      setAuthMessage("Proyecto guardado en este dispositivo. Pendiente de sincronizaciÃƒÂ³n.");

      setProyectos(prev => [
        proyectoLocal,
        ...prev.filter(p => p.id !== proyectoLocal.id)
      ]);

      return;
    }

    let resultado;

    if (proyectoActual && !String(proyectoActual).startsWith("local-")) {
      resultado = await supabase
        .from("proyectos")
        .update({
          nombre,
          datos: data,
          updated_at: new Date().toISOString()
        })
        .eq("id", proyectoActual);
    } else {
      resultado = await supabase
        .from("proyectos")
        .insert({
          user_id: session.user.id,
          nombre,
          datos: data
        })
        .select()
        .single();
    }

    if (resultado.error) throw resultado.error;

    if (resultado.data?.id) {
      setProyectoActual(resultado.data.id);
    }

    const locales = obtenerProyectosLocales().filter(
      p => p.id !== proyectoActual
    );

    localStorage.setItem(
      CLAVE_PROYECTOS_LOCALES,
      JSON.stringify(locales)
    );

    setNombreProyecto(nombre);
    await cargarProyectos();

    setSaved(true);
    setAuthMessage("Proyecto guardado correctamente en la nube.");

  } catch (error) {
    const mensaje = error.message || "";

    if (
      !navigator.onLine ||
      /failed to fetch|network|internet|offline|err_internet_disconnected/i.test(mensaje)
    ) {
      try {
        const proyectoLocal = guardarProyectoLocal(
          nombre,
          data,
          proyectoActual
        );

        setProyectoActual(proyectoLocal.id);
        setNombreProyecto(nombre);
        setSaved(true);
        setAuthMessage("Proyecto guardado en este dispositivo. Pendiente de sincronizaciÃƒÂ³n.");

        setProyectos(prev => [
          proyectoLocal,
          ...prev.filter(p => p.id !== proyectoLocal.id)
        ]);

      } catch (errorLocal) {
        setAuthError("No se pudo guardar localmente: " + errorLocal.message);
      }
    } else {
      setAuthError(mensaje);
    }

  } finally {
    setCargandoProyectos(false);
  }
};
        // ABRIR UN PROYECTO GUARDADO
  const abrirProyecto = (proyecto) => {
    if (!proyecto) return;

    setData(mergeProjectDefaults(initial, proyecto.datos));

    setNombreProyecto(proyecto.nombre);
    setProyectoActual(proyecto.id);
    setSaved(true);
    setAuthError("");
    setAuthMessage(
      "Proyecto abierto correctamente."
    );

    setTimeout(() => setSaved(false), 2000);
  };
    // CREAR UN PROYECTO NUEVO
  const nuevoProyecto = () => {
    setData(initial);
    setNombreProyecto("");
    setProyectoActual(null);
    setSaved(false);
    setAuthError("");
    setAuthMessage("Puedes comenzar un proyecto nuevo.");
  };
    // ELIMINAR UN PROYECTO
  const eliminarProyecto = async (id) => {
    if (!window.confirm("Ã‚Â¿Deseas eliminar este proyecto?")) {
      return;
    }

    try {
      // Los proyectos con prefijo local- viven en el navegador y no existen en Supabase.
      if (String(id).startsWith("local-")) {
        const localesActualizados = obtenerProyectosLocales().filter(
          proyecto => proyecto.id !== id
        );

        localStorage.setItem(
          CLAVE_PROYECTOS_LOCALES,
          JSON.stringify(localesActualizados)
        );
        setProyectos(prev => prev.filter(proyecto => proyecto.id !== id));

        if (proyectoActual === id) {
          nuevoProyecto();
        }

        setAuthMessage("Proyecto local eliminado correctamente.");
        return;
      }

      const { error } = await supabase
        .from("proyectos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      if (proyectoActual === id) {
        nuevoProyecto();
      }

      await cargarProyectos();
      setAuthMessage("Proyecto eliminado correctamente.");

    } catch (error) {
      setAuthError(error.message || "No fue posible eliminar el proyecto.");
    }
  };
    // CARGAR PROYECTOS AL INICIAR SESIÃƒâ€œN
  useEffect(() => {
    if (profile?.id && profile?.estado === "aprobado") {
      cargarProyectos();
    }
  }, [profile?.id]);

     

  // APROBAR O RECHAZAR USUARIOS
  const actualizarAutorizacion = async (id, estado) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ estado })
        .eq("id", id);

      if (error) throw error;

      await cargarUsuarios();
    } catch (error) {
      setAuthError(error.message);
    }
  };
    // ACTUALIZAR NOMBRE DE USUARIO
  const actualizarNombreUsuario = async (id, nombre) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ nombre })
        .eq("id", id);

      if (error) throw error;

      await cargarUsuarios();

    } catch (error) {
      setAuthError(error.message);
    }
  };
    // CAMBIAR ROL DE USUARIO
  const actualizarRolUsuario = async (id, rol) => {
    try {
      if (id === profile.id) {
        setAuthError("No puedes cambiar tu propio rol.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ rol })
        .eq("id", id);

      if (error) throw error;

      await cargarUsuarios();

      setAuthError("");
    } catch (error) {
      setAuthError(error.message);
    }
  };
    // FILTRAR USUARIOS POR NOMBRE, CORREO Y ESTADO
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const texto = busquedaUsuarios.toLowerCase();

    const coincideBusqueda =
      (usuario.nombre || "").toLowerCase().includes(texto) ||
      (usuario.email || "").toLowerCase().includes(texto);

    const coincideEstado =
      filtroEstado === "todos" ||
      usuario.estado === filtroEstado;

    return coincideBusqueda && coincideEstado;
  });
    // VERIFICAR SESIÃƒâ€œN DEL USUARIO
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setAuthLoading(false);
      }
    }).catch((error) => {
      if (mounted) {
        setAuthError(error.message);
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) {
          setSession(session);

          if (!session) {
            setProfile(null);
          }
        }
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
    // CONSULTAR PERFIL Y ESTADO DE AUTORIZACIÃƒâ€œN
  useEffect(() => {
    let active = true;

    if (!session?.user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);

    consultarPerfil()
      .then((perfil) => {
        if (active) {
          setProfile(perfil);
        }
      })
      .catch((error) => {
        if (active) {
          setAuthError(error.message);
        }
      })
      .finally(() => {
        if (active) {
          setProfileLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  useEffect(()=>{
    localStorage.setItem("solar-pro-project",JSON.stringify(data));
  },[data]);

  const effectiveMonthlyKwh = data.consumptionMode === "appliances" ? applianceMonthlyKwh : n(data.monthlyKwh);
  const calc = useMemo(() => calculateEngineering({...data, monthlyKwh: effectiveMonthlyKwh}), [data, effectiveMonthlyKwh]);
  const activeStateKey = ({"Consumo y recurso solar":"consumption","Generador fotovoltaico":"generator","CatÃƒÆ’Ã‚Â¡logo comercial":"catalog","Inversor y baterÃƒÆ’Ã‚Â­as":"inverter","Conductores y protecciones":"conductors","Diagrama unifilar":"diagram","Presupuesto":"budget","Informe tÃƒÆ’Ã‚Â©cnico":"report","Resumen":"summary"})[active] || "summary";
  const activeEngineeringState = calc.states?.[activeStateKey] || ENGINEERING_STATES.PENDING;
  const selectedInverter = inverterCatalog.find(item=>item.id===data.selectedInverterCatalogId) || null;
  const selectedController = controllerCatalog.find(item=>item.id===data.selectedControllerCatalogId) || null;
    // CONTROLAR EL ACCESO A SOLAR PRO

  if (authLoading || profileLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column"
      }}>
        <h2>Ã¢Ëœâ‚¬ SOLAR PRO</h2>
        <p>Verificando usuario y autorizaciÃƒÂ³n...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <AuthScreen
        authMode={authMode}
        setAuthMode={setAuthMode}
        authName={authName}
        setAuthName={setAuthName}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authError={authError}
        authMessage={authMessage}
        handleAuth={handleAuth}
      />
    );
  }

  if (!profile || profile.estado !== "aprobado") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}>
        <div style={{
          maxWidth: "450px",
          textAlign: "center",
          background: "#ffffff",
          padding: "30px",
          borderRadius: "15px"
        }}>
          <h2>Ã¢Ëœâ‚¬ SOLAR PRO</h2>
          <h3>Solicitud de acceso pendiente</h3>
          <p>
            Tu cuenta fue registrada, pero todavÃƒÂ­a necesita
            la autorizaciÃƒÂ³n del administrador.
          </p>
          <p>
            Cuando tu solicitud sea aprobada podrÃƒÂ¡s ingresar
            a SOLAR PRO.
          </p>
          <button onClick={cerrarSesion}>
            Cerrar sesiÃƒÂ³n
          </button>
        </div>
      </div>
    );
  }
    // PANEL DE ADMINISTRACIÃƒâ€œN DE USUARIOS
  if (profile?.rol === "administrador" && adminView) {
    return (
      <div style={{
        minHeight: "100vh",
        padding: "30px",
        background: "#f1f5f9"
      }}>
        <h1>Ã¢Ëœâ‚¬ SOLAR PRO</h1>
        <h2>AdministraciÃƒÂ³n de usuarios</h2>
        <button
  onClick={() => setAdminView(false)}
  style={{
    background: "#e69b18",
    color: "white",
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    marginBottom: "20px"
  }}
>
  Ã¢Ëœâ‚¬ Ir al diseÃƒÂ±ador SOLAR PRO
</button>

        <p>
          Bienvenido, {profile.nombre || profile.email}
        </p>

        <button onClick={cargarUsuarios}>
          {cargandoUsuarios ? "Consultando..." : "Consultar solicitudes"}
        </button>

        {authError && (
          <p style={{ color: "red" }}>{authError}</p>
        )}
        <div style={{
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  margin: "20px 0"
}}>
  <input
    type="text"
    placeholder="Buscar por nombre o correo..."
    value={busquedaUsuarios}
    onChange={(e) => setBusquedaUsuarios(e.target.value)}
    style={{
      padding: "10px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      flex: "1",
      minWidth: "220px"
    }}
  />

  <select
    value={filtroEstado}
    onChange={(e) => setFiltroEstado(e.target.value)}
    style={{
      padding: "10px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px"
    }}
  >
    <option value="todos">Todos los estados</option>
    <option value="pendiente">Pendientes</option>
    <option value="aprobado">Aprobados</option>
    <option value="rechazado">Rechazados</option>
  </select>
</div>

        {usuariosFiltrados.map((usuario) => (
          <div
            key={usuario.id}
            style={{
              background: "white",
              padding: "18px",
              marginTop: "15px",
              borderRadius: "10px"
            }}
          >
            <h3>{usuario.nombre || "Sin nombre"}</h3>
            <p>{usuario.email}</p>
            <button
  onClick={() => {
    const nuevoNombre = window.prompt(
      "Escribe el nuevo nombre del usuario:",
      usuario.nombre || ""
    );

    if (nuevoNombre && nuevoNombre.trim()) {
      actualizarNombreUsuario(
        usuario.id,
        nuevoNombre.trim()
      );
    }
  }}
  style={{
    background: "#2563a6",
    color: "white",
    padding: "8px 14px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "10px"
  }}
>
  Editar nombre
</button>
            <p>Rol: {usuario.rol}</p>
            <p>Estado: {usuario.estado}</p>
            {usuario.estado === "aprobado" && usuario.id !== profile.id && (
  <div style={{ marginBottom: "12px" }}>
    <label style={{
      display: "block",
      fontWeight: "bold",
      marginBottom: "6px"
    }}>
      Cambiar rol:
    </label>

    <select
      value={usuario.rol}
      onChange={(e) =>
        actualizarRolUsuario(usuario.id, e.target.value)
      }
      style={{
        padding: "9px",
        border: "1px solid #cbd5e1",
        borderRadius: "7px"
      }}
    >
      <option value="usuario">Usuario</option>
      <option value="administrador">Administrador</option>
    </select>
  </div>
)}

            {usuario.estado === "pendiente" && (
              <>
                <button
                  onClick={() =>
                    actualizarAutorizacion(usuario.id, "aprobado")
                  }
                >
                  Aprobar
                </button>

                <button
                  onClick={() =>
                    actualizarAutorizacion(usuario.id, "rechazado")
                  }
                >
                  Rechazar
                </button>
              </>
            )}
          </div>
        ))}
        {usuariosFiltrados.length === 0 && (
  <p style={{
    textAlign: "center",
    color: "#64748b",
    padding: "20px"
  }}>
    No se encontraron usuarios con esos criterios.
  </p>
)}

        <button onClick={cerrarSesion} style={{ marginTop: "25px" }}>
          Cerrar sesiÃƒÂ³n
        </button>
      </div>
    );
  }

  const save = ()=>{
    localStorage.setItem("solar-pro-project",JSON.stringify(data));
    setSaved(true);
    window.setTimeout(()=>setSaved(false),2000);
  };
  const reset = ()=>{
    if(window.confirm("Ã‚Â¿Deseas restablecer los datos del proyecto?")) setData(initial);
  };
  // Exporta ÃƒÂºnicamente la secciÃƒÂ³n activa. La impresiÃƒÂ³n global ocultaba todo
  // el contenido porque las reglas del diagrama solo permiten imprimir .electrical-sheet.
  const print = ()=>{
    const source = document.querySelector('.page-content');
    if (!source) { alert('No se encontrÃƒÂ³ el contenido para exportar.'); return; }
    const popup = window.open('', '_blank', 'width=1100,height=850');
    if (!popup) { alert('El navegador bloqueÃƒÂ³ la ventana del PDF. Permite las ventanas emergentes para SOLAR PRO e intÃƒÂ©ntalo de nuevo.'); return; }
    const clone = source.cloneNode(true);
    clone.querySelectorAll('button').forEach(button=>button.remove());
    clone.querySelectorAll('input, select, textarea').forEach(control=>{
      const value = control.tagName === 'SELECT'
        ? (control.selectedOptions?.[0]?.textContent || '')
        : (control.value || '');
      const replacement = document.createElement('span');
      replacement.textContent = value;
      replacement.style.cssText = 'display:inline-block;padding:4px 6px;border:1px solid #cbd5df;border-radius:4px;min-width:45px;color:#172b3d;background:#fff;';
      control.replaceWith(replacement);
    });
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link=>link.outerHTML).join('\n');
    let printable = clone.outerHTML;
    let printCss = '';
    if (active === 'Presupuesto') {
      const table = clone.querySelector('.budget-table');
      const rows = table ? Array.from(table.querySelectorAll('tbody tr')).map(tr=>{
        const cells = Array.from(tr.children);
        const name = cells[0]?.innerHTML || '';
        const qty = cells[1]?.textContent || '';
        const unit = cells[2]?.textContent || '';
        const product = cells[3]?.innerText || '';
        const total = cells[4]?.textContent || '';
        return `<tr><td>${name}</td><td class="num">${qty}</td><td>${unit}</td><td>${product.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td><td class="money">${total}</td></tr>`;
      }).join('') : '';
      const today = new Date().toLocaleDateString('es-CO');
      const quoteNo = `SP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const client = data.client || 'Cliente por definir';
      const site = data.location || 'UbicaciÃƒÂ³n por confirmar';
      const project = data.projectName || 'Proyecto fotovoltaico';
      const system = data.systemType || 'Sistema fotovoltaico';
      const capacity = `${num(calc.installedWp/1000)} kWp`;
      const modules = `${calc.panelCount} mÃƒÂ³dulos de ${data.panelW} Wp`;
      const inverter = `${num(n(data.inverterW)/1000)} kW`;
      const battery = data.systemType === 'ON-GRID' ? 'No aplica' : `${calc.batteryUnits} unidades Ã‚Â· ${data.batteryVoltage} V Ã‚Â· ${data.batteryChemistry}`;
      const totalText = clone.querySelector('.budget-grand-total strong')?.textContent || '';
      const summary = clone.querySelector('.budget-summary')?.innerText || '';
      printable = `<main class="quote-document">
        <header class="quote-header"><div class="quote-brand"><div class="quote-logo">Ã¢Ëœâ‚¬</div><div><strong>SOLAR PRO</strong><small>DISEÃƒâ€˜O E INSTALACIÃƒâ€œN FOTOVOLTAICA</small></div></div><div class="quote-title"><span>COTIZACIÃƒâ€œN</span><b>${quoteNo}</b><small>Fecha de emisiÃƒÂ³n: ${today}</small></div></header>
        <section class="quote-intro"><div><span class="eyebrow">PROPUESTA COMERCIAL</span><h1>${project}</h1><p>Oferta preliminar para suministro e instalaciÃƒÂ³n de sistema solar fotovoltaico.</p></div><div class="quote-total-card"><small>INVERSIÃƒâ€œN ESTIMADA</small><strong>${totalText}</strong><span>COP Ã‚Â· Valores sujetos a confirmaciÃƒÂ³n</span></div></section>
        <section class="quote-parties"><div><small>PREPARADO PARA</small><strong>${client}</strong><span>${site}</span></div><div><small>PROYECTO</small><strong>${system}</strong><span>Validez sugerida: 15 dÃƒÂ­as calendario, confirmar antes de emitir</span></div></section>
        <section class="quote-section"><h2>01 Ã‚Â· Resumen de la soluciÃƒÂ³n</h2><div class="quote-specs"><div><small>Potencia FV</small><b>${capacity}</b></div><div><small>Generador</small><b>${modules}</b></div><div><small>Inversor</small><b>${inverter}</b></div><div><small>Almacenamiento</small><b>${battery}</b></div></div></section>
        <section class="quote-section"><h2>02 Ã‚Â· Desglose de materiales y equipos</h2><table class="quote-table"><thead><tr><th>DescripciÃƒÂ³n</th><th>Cant.</th><th>Unidad</th><th>Referencia / detalle</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody></table><p class="quote-note">Los componentes marcados Ã‚Â«Por cotizarÃ‚Â» no se incluyen en el total. Las cantidades de cableado, canalizaciÃƒÂ³n, estructura y protecciones son preliminares y requieren validaciÃƒÂ³n en sitio.</p></section>
        <section class="quote-financial"><div class="quote-terms"><h2>03 Ã‚Â· Alcance y condiciones</h2><ul><li>La oferta se basa en el predimensionamiento y los datos suministrados para el proyecto.</li><li>La selecciÃƒÂ³n final de equipos y protecciones queda sujeta a fichas tÃƒÂ©cnicas y verificaciÃƒÂ³n de compatibilidad.</li><li>Obras civiles, adecuaciones de cubierta, trÃƒÂ¡mites y derechos de conexiÃƒÂ³n solo se incluyen si aparecen cotizados expresamente.</li><li>Precios comerciales, impuestos, inventario y tiempos de entrega deben confirmarse con el proveedor antes de aceptar.</li></ul></div><div class="quote-totals"><h2>Resumen econÃƒÂ³mico</h2>${summary.split('\n').filter(line=>line.trim()).map(line=>`<p>${line.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`).join('')}<strong>TOTAL ESTIMADO <b>${totalText}</b></strong></div></section>
        <footer class="quote-footer"><div><b>ACEPTACIÃƒâ€œN DE LA PROPUESTA</b><p>Nombre: __________________________</p><p>Firma: ___________________________</p><p>Fecha: ___________________________</p></div><div><b>SOLAR PRO</b><p>Documento de cotizaciÃƒÂ³n preliminar generado desde SOLAR PRO.</p><small>La oferta no sustituye el diseÃƒÂ±o elÃƒÂ©ctrico definitivo ni la validaciÃƒÂ³n profesional del sistema.</small></div></footer>
      </main>`;
      printCss = `<style>
        @page{size:A4 portrait;margin:13mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#172b3d;background:#fff;font-size:10px;line-height:1.45}.quote-document{max-width:100%;margin:0 auto}.quote-header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #f2a900;padding-bottom:13px}.quote-brand{display:flex;align-items:center;gap:10px}.quote-logo{width:38px;height:38px;border-radius:10px;background:#f2a900;color:#102b45;display:grid;place-items:center;font-size:24px}.quote-brand strong{display:block;font-size:19px;letter-spacing:1px;color:#102b45}.quote-brand small,.quote-title small{display:block;color:#64748b;font-size:8px}.quote-title{text-align:right}.quote-title span,.eyebrow{display:block;color:#b77900;font-size:8px;font-weight:bold;letter-spacing:1.5px}.quote-title b{display:block;font-size:17px;color:#102b45}.quote-intro{display:flex;justify-content:space-between;gap:20px;align-items:center;padding:22px 0 16px}.quote-intro h1{font-size:21px;margin:5px 0;color:#102b45}.quote-intro p{margin:0;color:#64748b}.quote-total-card{background:#102f4d;color:#fff;padding:14px 17px;border-radius:9px;min-width:190px}.quote-total-card small,.quote-total-card span{display:block;font-size:8px;color:#d7e4ef}.quote-total-card strong{display:block;font-size:20px;margin:5px 0}.quote-parties{display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#f3f6fa;padding:13px;border-radius:8px}.quote-parties small,.quote-specs small{display:block;color:#64748b;font-size:8px;text-transform:uppercase;letter-spacing:.5px}.quote-parties strong,.quote-parties span{display:block;margin-top:3px}.quote-section{margin-top:17px}.quote-section h2,.quote-terms h2,.quote-totals h2{font-size:11px;color:#102f4d;border-bottom:1px solid #d8e1ea;padding-bottom:6px;margin:0 0 9px}.quote-specs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.quote-specs>div{border:1px solid #dbe4ed;border-radius:7px;padding:9px}.quote-specs b{display:block;margin-top:5px;font-size:11px}.quote-table{width:100%;border-collapse:collapse;font-size:8px}.quote-table th{background:#102f4d;color:#fff;text-align:left;padding:7px 6px}.quote-table td{border-bottom:1px solid #e1e7ee;padding:7px 6px;vertical-align:top}.quote-table td:nth-child(2),.quote-table td:nth-child(3){text-align:center;white-space:nowrap}.quote-table td:last-child{text-align:right;white-space:nowrap;font-weight:bold}.quote-table td:first-child{width:31%}.quote-note{font-size:8px;color:#64748b;background:#f6f8fa;padding:8px;border-left:3px solid #e3a008}.quote-financial{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;margin-top:16px}.quote-terms ul{padding-left:15px;margin:0}.quote-terms li{margin:0 0 5px}.quote-totals{background:#f3f6fa;border-radius:8px;padding:12px}.quote-totals p{font-size:8px;margin:4px 0}.quote-totals strong{display:flex;justify-content:space-between;border-top:2px solid #102f4d;padding-top:9px;margin-top:9px;color:#102f4d}.quote-footer{display:grid;grid-template-columns:1fr 1fr;gap:25px;border-top:1px solid #d8e1ea;margin-top:22px;padding-top:12px;font-size:8px}.quote-footer p{margin:6px 0}.quote-footer small{color:#64748b}.quote-table tr{break-inside:avoid}.quote-section{break-inside:auto}.quote-header,.quote-intro,.quote-parties,.quote-specs,.quote-financial,.quote-footer{break-inside:avoid}
      </style>`;
    }
    popup.document.open();
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>SOLAR PRO - ${String(active).replace(/[<>&"']/g,'')}</title>${stylesheets}${printCss}<style>
      @page { size:A4 landscape; margin:10mm; }
      * { box-sizing:border-box!important; }
      html,body { margin:0!important;padding:0!important;background:#fff!important;color:#172b3d!important; }
      body,body * { visibility:visible!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important; }
      .page-content { width:100%!important;max-width:none!important;margin:0!important;padding:0!important; }
      .page-content footer,.topbar,.sidebar,.primary,.secondary,.mobile-menu { display:none!important; }
      .panel { box-shadow:none!important;break-inside:avoid-page; }
      .table-wrap,.budget-table-wrap-fixed { overflow:visible!important; }
      .budget-table,.budget-table-fixed { width:100%!important;min-width:0!important;table-layout:auto!important;font-size:8px!important; }
      .budget-table th,.budget-table td { padding:5px 4px!important;font-size:8px!important;overflow-wrap:anywhere!important; }
      .budget-table td .hint { font-size:7px!important; }
      .budget-grand-total { break-inside:avoid!important; }
      @media screen { body { padding:16px!important;background:#e8edf2!important; } .page-content { max-width:1100px!important;margin:0 auto!important;background:#fff!important;padding:18px!important; } }
    </style></head><body>${printable}<script>window.onload=()=>setTimeout(()=>window.print(),400);<\/script></body></html>`);
    popup.document.close();
  };

  const selectPanel = panel=>{
    const selectedValues = getPanelSelectionValues(panel);
    if (!selectedValues) return;
    setData(old=>({...old,...selectedValues}));
    setCustom(false);
  };

  const selectInverter = inverter=>{
    const selectedValues = getInverterSelectionValues(inverter);
    if (!selectedValues) return;
    setData(old=>({...old,...selectedValues}));
  };

  const selectController = controller=>{
    const selectedValues=getControllerSelectionValues(controller);
    if(!selectedValues)return;
    setData(old=>({...old,...selectedValues}));
  };

  const updatePanelValue = (key,value)=>setData(old=>({...old,[key]:value,panelCatalogId:""}));

  const filtered = panelCatalog.filter(p=>
    `${p.brand} ${p.model} ${p.watts}`.toLowerCase().includes(search.toLowerCase())
  );

  const content = ()=>{
    switch(active) {
      case "Consumo y recurso solar":
        return <>
          <SectionTitle eyebrow="ETAPA 01" title="Consumo y recurso solar" description="Define la demanda energÃƒÂ©tica y las condiciones del lugar."/>
          <div className="panel"><h3>InformaciÃƒÂ³n del proyecto</h3><div className="form-grid">
            <Field label="Nombre del proyecto" type="text" value={data.projectName} onChange={v=>update("projectName",v)}/>
            <Field label="Cliente" type="text" value={data.client} onChange={v=>update("client",v)}/>
            <Field label="UbicaciÃƒÂ³n" type="text" value={data.location} onChange={v=>update("location",v)}/>
            <SelectField label="Tipo de sistema" value={data.systemType} onChange={v=>update("systemType",v)} options={["ON-GRID","OFF-GRID","HÃƒÂBRIDO"]}/>
          </div></div>
          <div className="panel">
            <h3><Sun size={18} style={{verticalAlign:"middle", marginRight:8}}/>Localizador de horas solar pico de Colombia</h3>
            <p className="hint">Busca un municipio colombiano. SOLAR PRO obtiene sus coordenadas y consulta la radiaciÃƒÂ³n solar mensual en NASA POWER. Los resultados son promedios climatolÃƒÂ³gicos del punto geogrÃƒÂ¡fico, no una mediciÃƒÂ³n en tiempo real del techo.</p>
            <div style={{display:"flex", gap:10, flexWrap:"wrap", alignItems:"end"}}>
              <label className="field" style={{flex:"1 1 280px"}}>
                <span>Municipio o departamento</span>
                <input value={hspSearch} onChange={e=>setHspSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") buscarHSP();}} placeholder="Ej. Valledupar, Cesar" />
              </label>
              <button className="primary" onClick={buscarHSP} disabled={hspLoading}>
                <Search size={16}/> {hspLoading ? "Consultando..." : "Buscar recurso solar"}
              </button>
            </div>
            {hspOptions.length > 0 && <div style={{marginTop:14}}>
              <b>Selecciona la ubicaciÃƒÂ³n correcta:</b>
              <div style={{display:"grid", gap:8, marginTop:8}}>
                {hspOptions.map(place=><button key={place.id} className="secondary" style={{textAlign:"left", justifyContent:"space-between"}} onClick={()=>{setHspOptions([]); consultarHSP(place);}}>
                  <span>{place.name}{place.admin1 ? `, ${place.admin1}` : ""}{place.admin2 ? ` Ã‚Â· ${place.admin2}` : ""}</span>
                  <small>{num(place.latitude)}, {num(place.longitude)}</small>
                </button>)}
              </div>
            </div>}
            {hspLoading && <p className="hint">Consultando coordenadas y radiaciÃƒÂ³n solar. Esto puede tardar unos segundos.</p>}
            {hspError && <div className="notice" style={{marginTop:12, color:"#9b2c2c"}}><AlertTriangle size={17}/>{hspError}</div>}
            {hspResult && <>
              <div className="result-grid" style={{marginTop:16}}>
                <Metric label="HSP promedio anual" value={`${num(hspResult.average)} h/dÃƒÂ­a`} detail="Promedio de los 12 valores mensuales" icon={Sun}/>
                <Metric label="Mes de menor recurso" value={hspResult.lowest.label} detail={`${num(hspResult.lowest.value)} h/dÃƒÂ­a Ã‚Â· referencia conservadora`} icon={Activity}/>
                <Metric label="Coordenadas" value={`${num(hspResult.place.latitude)}, ${num(hspResult.place.longitude)}`} detail={hspResult.place.name + (hspResult.place.admin1 ? `, ${hspResult.place.admin1}` : "")} icon={Network}/>
              </div>
              <div className="panel" style={{marginTop:14,padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                  <div>
                    <h3 style={{margin:"0 0 4px"}}>Mapa interactivo de la instalaciÃƒÂ³n</h3>
                    <p className="hint" style={{margin:0}}>UbicaciÃƒÂ³n geogrÃƒÂ¡fica consultada: {hspResult.place.name}{hspResult.place.admin1 ? `, ${hspResult.place.admin1}` : ""}, Colombia.</p>
                  </div>
                  <a className="secondary" href={`https://www.openstreetmap.org/?mlat=${hspResult.place.latitude}&mlon=${hspResult.place.longitude}#map=12/${hspResult.place.latitude}/${hspResult.place.longitude}`} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>Abrir mapa completo</a>
                </div>
                <div style={{marginTop:12,border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",height:340,background:"#edf2f7"}}>
                  <iframe
                    title={`Mapa de ubicaciÃƒÂ³n solar: ${hspResult.place.name}`}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${hspResult.place.longitude-0.08}%2C${hspResult.place.latitude-0.06}%2C${hspResult.place.longitude+0.08}%2C${hspResult.place.latitude+0.06}&layer=mapnik&marker=${hspResult.place.latitude}%2C${hspResult.place.longitude}`}
                    style={{width:"100%",height:"100%",border:0,display:"block"}}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <p className="hint" style={{margin:"8px 0 0"}}>El marcador representa las coordenadas del municipio seleccionado, no la ubicaciÃƒÂ³n exacta del techo. Confirma el punto de instalaciÃƒÂ³n antes de diseÃƒÂ±ar; el mapa es cartogrÃƒÂ¡fico y la radiaciÃƒÂ³n se consulta por separado en NASA POWER.</p>
              </div>
              <div className="table-wrap" style={{marginTop:14}}>
                <table><thead><tr><th>Mes</th><th>RadiaciÃƒÂ³n / HSP</th><th>Uso como HSP</th></tr></thead>
                  <tbody>{hspResult.values.map(item=><tr key={item.key}><td>{item.label}</td><td>{item.value === null ? "Sin dato" : `${num(item.value)} kWh/mÃ‚Â²/dÃƒÂ­a`}</td><td>{item.value === null ? "Ã¢â‚¬â€" : <button className="compare-button" onClick={()=>setHspMonth(item.key)}>{hspMonth===item.key?"Seleccionado":"Seleccionar mes"}</button>}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="form-grid" style={{marginTop:14}}>
                <label className="field"><span>HSP que se aplicarÃƒÂ¡ al cÃƒÂ¡lculo</span><select value={hspMonth} onChange={e=>setHspMonth(e.target.value)}><option value="ANUAL">Promedio anual</option>{HSP_MONTHS.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
                <div className="field"><span>Valor seleccionado</span><strong style={{padding:"12px 0"}}>{hspMonth === "ANUAL" ? `${num(hspResult.average)} h/dÃƒÂ­a (promedio anual)` : (()=>{const item=hspResult.values.find(x=>x.key===hspMonth); return item?.value===null || !item ? "Sin dato" : `${num(item.value)} h/dÃƒÂ­a (${item.label})`;})()}</strong></div>
              </div>
              <div className="notice" style={{marginTop:14, display:"block"}}>
                <b>RecomendaciÃƒÂ³n segÃƒÂºn el tipo de sistema: </b>
                {data.systemType === "ON-GRID" ?
                  "Para un sistema conectado a la red, se propone el promedio anual como referencia inicial de producciÃƒÂ³n energÃƒÂ©tica. Verifica tambiÃƒÂ©n el comportamiento mensual si buscas estimar autoconsumo y excedentes." :
                  data.systemType === "OFF-GRID" ?
                  `Para un sistema aislado, se propone como referencia conservadora el mes de menor recurso (${hspResult.lowest.label}: ${num(hspResult.lowest.value)} h/dÃƒÂ­a). El diseÃƒÂ±o final tambiÃƒÂ©n debe considerar autonomÃƒÂ­a, demanda crÃƒÂ­tica y respaldo.` :
                  `Para un sistema hÃƒÂ­brido, si buscas reducir la dependencia de la red, se propone el mes de menor recurso (${hspResult.lowest.label}: ${num(hspResult.lowest.value)} h/dÃƒÂ­a). Si la red cubrirÃƒÂ¡ dÃƒÂ©ficits, puedes usar el promedio anual como referencia energÃƒÂ©tica.`}
                <div style={{display:"flex", gap:10, flexWrap:"wrap", marginTop:10}}>
                  <button className="primary" onClick={()=>aplicarHSP(data.systemType === "ON-GRID" ? "ANUAL" : hspResult.lowest.key)}>
                    Aplicar HSP recomendado
                  </button>
                  <button className="secondary" onClick={()=>aplicarHSP("ANUAL")}>Aplicar promedio anual</button>
                  <button className="secondary" onClick={()=>aplicarHSP(hspResult.lowest.key)}>Aplicar mes mÃƒÂ­nimo</button>
                </div>
              </div>
              <div className="panel" style={{marginTop:14, padding:14}}>
                <h3 style={{marginTop:0}}>ComparaciÃƒÂ³n de criterios de diseÃƒÂ±o</h3>
                <p className="hint">Compara los valores climatolÃƒÂ³gicos antes de aplicarlos. La elecciÃƒÂ³n depende del objetivo energÃƒÂ©tico y del respaldo disponible; esta recomendaciÃƒÂ³n es una guÃƒÂ­a inicial, no sustituye la simulaciÃƒÂ³n ni el diseÃƒÂ±o profesional.</p>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Criterio</th><th>HSP</th><th>AplicaciÃƒÂ³n orientativa</th><th>AcciÃƒÂ³n</th></tr></thead>
                    <tbody>
                      <tr>
                        <td><b>Promedio anual</b></td>
                        <td>{num(hspResult.average)} h/dÃƒÂ­a</td>
                        <td>EstimaciÃƒÂ³n energÃƒÂ©tica anual; referencia inicial para ON-GRID.</td>
                        <td><button className="compare-button" onClick={()=>aplicarHSP("ANUAL")}>Usar promedio</button></td>
                      </tr>
                      <tr>
                        <td><b>Mes mÃƒÂ­nimo Ã‚Â· {hspResult.lowest.label}</b></td>
                        <td>{num(hspResult.lowest.value)} h/dÃƒÂ­a</td>
                        <td>Escenario conservador para revisar periodos de menor recurso, especialmente OFF-GRID.</td>
                        <td><button className="compare-button" onClick={()=>aplicarHSP(hspResult.lowest.key)}>Usar mes mÃƒÂ­nimo</button></td>
                      </tr>
                      <tr>
                        <td><b>Mes seleccionado</b></td>
                        <td>{hspMonth === "ANUAL" ? `${num(hspResult.average)} h/dÃƒÂ­a` : (()=>{const item=hspResult.values.find(x=>x.key===hspMonth); return item?.value == null ? "Sin dato" : `${num(item.value)} h/dÃƒÂ­a`;})()}</td>
                        <td>Permite dimensionar con un mes especÃƒÂ­fico elegido por el usuario.</td>
                        <td><button className="compare-button" onClick={()=>aplicarHSP()}>Aplicar selecciÃƒÂ³n</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="hint" style={{marginBottom:0}}>En sistemas hÃƒÂ­bridos, define si la red cubrirÃƒÂ¡ los dÃƒÂ©ficits: si existe respaldo suficiente, el promedio anual puede ser ÃƒÂºtil; si se busca reducir la dependencia de la red, analiza el mes crÃƒÂ­tico.</p>
              </div>
              <div style={{display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", marginTop:12}}>
                <button className="primary" onClick={()=>aplicarHSP()}>Aplicar HSP seleccionado al dimensionamiento</button>
              </div>
              <p className="hint" style={{marginTop:10}}>Fuente: {hspResult.source}. Consulta realizada: {hspResult.retrievedAt}. HSP se expresa como equivalente de irradiaciÃƒÂ³n diaria en kWh/mÃ‚Â²/dÃƒÂ­a. Para un diseÃƒÂ±o definitivo, revisar inclinaciÃƒÂ³n, orientaciÃƒÂ³n, sombras, temperatura, pÃƒÂ©rdidas y la fuente local disponible.</p>
            </>}
          </div>
          <div className="panel">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <div><h3 style={{marginBottom:4}}>Estudio de cargas Ã‚Â· Registro de electrodomÃƒÂ©sticos</h3>
                <p className="hint" style={{margin:0}}>Calcula la demanda a partir de los equipos o utiliza el consumo mensual de la factura.</p>
              </div>
              <label className="field" style={{minWidth:230}}><span>MÃƒÂ©todo de cÃƒÂ¡lculo</span>
                <select value={data.consumptionMode || "reference"} onChange={e=>update("consumptionMode",e.target.value)}>
                  <option value="reference">Consumo mensual de referencia</option>
                  <option value="appliances">Registro de electrodomÃƒÂ©sticos</option>
                </select>
              </label>
            </div>
            {data.consumptionMode === "appliances" && <>
              <div className="table-wrap" style={{marginTop:14}}>
                <table><thead><tr><th>ElectrodomÃƒÂ©stico / equipo</th><th>Potencia (W)</th><th>Cantidad</th><th>Horas/dÃƒÂ­a</th><th>Consumo (kWh/dÃƒÂ­a)</th><th></th></tr></thead>
                  <tbody>
                    {(Array.isArray(data.appliances) ? data.appliances : []).map(item => <tr key={item.id}>
                      <td><input aria-label="Nombre del equipo" value={item.name} onChange={e=>updateAppliance(item.id,"name",e.target.value)} placeholder="Ej. Nevera" /></td>
                      <td><input aria-label="Potencia en vatios" type="number" min="0" value={item.watts} onChange={e=>updateAppliance(item.id,"watts",e.target.value)} /></td>
                      <td><input aria-label="Cantidad" type="number" min="0" step="1" value={item.quantity} onChange={e=>updateAppliance(item.id,"quantity",e.target.value)} /></td>
                      <td><input aria-label="Horas de uso diario" type="number" min="0" max="24" step="0.5" value={item.hours} onChange={e=>updateAppliance(item.id,"hours",e.target.value)} /></td>
                      <td><b>{num((n(item.watts)*n(item.quantity)*n(item.hours))/1000)}</b></td>
                      <td><button type="button" className="secondary" onClick={()=>removeAppliance(item.id)} aria-label="Eliminar equipo">Eliminar</button></td>
                    </tr>)}
                    {(Array.isArray(data.appliances) ? data.appliances : []).length === 0 && <tr><td colSpan="6" style={{textAlign:"center",padding:20}}>TodavÃƒÂ­a no has agregado equipos.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginTop:12}}>
                <button type="button" className="primary" onClick={addAppliance}><Plus size={16}/> Agregar electrodomÃƒÂ©stico</button>
                <span className="hint">El cÃƒÂ¡lculo considera 30 dÃƒÂ­as por mes y no aplica factores de simultaneidad.</span>
              </div>
              <div className="result-grid" style={{marginTop:16}}>
                <Metric label="Consumo diario calculado" value={`${num(applianceDailyKwh)} kWh/dÃƒÂ­a`} detail="Suma de potencia Ãƒâ€” cantidad Ãƒâ€” horas" icon={Activity}/>
                <Metric label="Consumo mensual calculado" value={`${num(applianceMonthlyKwh)} kWh/mes`} detail="Consumo diario Ãƒâ€” 30 dÃƒÂ­as" icon={Zap}/>
                <Metric label="Equipos registrados" value={`${(data.appliances || []).length}`} detail="Elementos incluidos en el estudio" icon={PanelsTopLeft}/>
              </div>
            </>}
            <div className="form-grid" style={{marginTop:16}}>
              <Field label={data.consumptionMode === "appliances" ? "Consumo mensual de referencia (comparaciÃƒÂ³n)" : "Consumo mensual de referencia"} value={data.monthlyKwh} onChange={v=>update("monthlyKwh",v)} unit="kWh/mes"/>
              <Field label="Horas sol pico" value={data.peakSunHours} onChange={v=>update("peakSunHours",v)} unit="h/dÃƒÂ­a"/>
              <Field label="Rendimiento global del generador FV (PR)" value={data.efficiency} onChange={v=>update("efficiency",v)} unit="%" min="1" max="100"/>
              <Field label="Costo energÃƒÂ­a" value={data.energyPrice} onChange={v=>update("energyPrice",v)} unit="COP/kWh"/>
            </div>
            {data.consumptionMode === "appliances" && <div className="notice" style={{marginTop:12,display:"block"}}>
              <b>Consumo aplicado al dimensionamiento:</b> {num(applianceMonthlyKwh)} kWh/mes. El consumo de referencia de la factura ({num(data.monthlyKwh)} kWh/mes) se conserva para comparaciÃƒÂ³n y no se suma al cÃƒÂ¡lculo.
            </div>}
          </div>
        </>;

      case "Generador fotovoltaico":
        return <>
          <SectionTitle eyebrow="ETAPA 02" title="Generador fotovoltaico" description="Configura la potencia y cantidad de mÃƒÂ³dulos."/>
          <div className="panel"><h3>MÃƒÂ³dulo seleccionado</h3>
            <div className="catalog-search" style={{marginBottom:12}}><Search size={17}/><input aria-label="Buscar panel solar" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Buscar fabricante o modelo verificado..."/></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:10,marginBottom:16}}>
              {filtered.map(panel=>{
                const fields=panel.technicalSheet.fields;
                const value=key=>fields[key]?.value;
                const active=panel.id===data.panelCatalogId;
                return <article key={panel.id} style={{border:`1px solid ${active?"#16794b":"var(--border, #dbe3ec)"}`,borderRadius:10,padding:12,background:active?"#f0fdf4":"var(--surface, #fff)"}}>
                  <b>{panel.brand} · {panel.model}</b>
                  <div className="hint" style={{fontSize:11,marginTop:4}}>Referencia exacta en fuente: {value("exactReference")}</div>
                  <div className="hint" style={{marginTop:5}}>{num(value("pmaxW"))} W · Voc {num(value("vocV"))} V · Vmp {num(value("vmpV"))} V</div>
                  <div className="hint">Isc {num(value("iscA"))} A · Imp {num(value("impA"))} A · Eficiencia {num(value("efficiencyPercent"))}%</div>
                  <div style={{fontSize:11,color:"#92400e",marginTop:6}}>{panel.technicalDataStatus} · fuente oficial exacta revisada</div>
                  {panel.technicalSheet.source.verificationNote&&<div className="hint" style={{fontSize:11,marginTop:5}}>{panel.technicalSheet.source.verificationNote}</div>}
                  <div style={{display:"flex",gap:8,marginTop:9,flexWrap:"wrap"}}>
                    <button type="button" className={active?"secondary":"primary"} onClick={()=>selectPanel(panel)}>{active?"Módulo seleccionado":"Usar este módulo"}</button>
                    <a href={panel.source} target="_blank" rel="noreferrer" className="secondary" style={{textDecoration:"none"}}>Consultar ficha técnica</a>
                  </div>
                </article>;
              })}
            </div>
            <p><b>{data.panelBrand}</b> Ã‚Â· {data.panelModel}</p>
            <div className="form-grid">
              <Field label="Potencia del panel" value={data.panelW} onChange={v=>updatePanelValue("panelW",v)} unit="Wp"/>
              <Field label="Precio por panel" value={data.panelPrice} onChange={v=>update("panelPrice",v)} unit="COP"/>
              <Field label="Voc" value={data.panelVoc} onChange={v=>updatePanelValue("panelVoc",v)} unit="V"/>
              <Field label="Vmp" value={data.panelVmp} onChange={v=>updatePanelValue("panelVmp",v)} unit="V"/>
              <Field label="Isc" value={data.panelIsc} onChange={v=>updatePanelValue("panelIsc",v)} unit="A"/>
              <Field label="Imp" value={data.panelImp} onChange={v=>updatePanelValue("panelImp",v)} unit="A"/>
            </div>
            <div className="notice" style={{display:"block",marginTop:12}}>
              <b>Estado de ficha técnica:</b> {panelCatalog.find(panel=>panel.id===data.panelCatalogId)?.technicalDataStatus || CATALOG_DATA_STATES.INSUFFICIENT}.
              {panelCatalog.find(panel=>panel.id===data.panelCatalogId)?.source && <> <a href={panelCatalog.find(panel=>panel.id===data.panelCatalogId).source} target="_blank" rel="noreferrer">Abrir fuente oficial</a>.</>}
              {data.panelCatalogId && data.vmpTempCoefficient==="" && <span> El coeficiente térmico Vmp no se publica en esta ficha; la comprobación MPPT a temperaturas extremas permanece pendiente.</span>}
            </div>
            <p className="hint">Puedes cambiar estos datos manualmente o seleccionar una referencia en el catÃƒÂ¡logo.</p>
          </div>
          <div className="panel"><h3>Cantidad y configuraciÃƒÂ³n de strings</h3>
            <div className="form-grid">
              <label className="field"><span>Ajustar manualmente cantidad de mÃƒÂ³dulos</span><input type="checkbox" checked={data.manualPanelCountEnabled === true} onChange={event=>setData(old=>event.target.checked ? ({...old,manualPanelCountEnabled:true,manualPanelCount:String(calc.automaticPanelCount ?? calc.panelCount)}) : ({...old,manualPanelCountEnabled:false}))}/></label>
              {data.manualPanelCountEnabled === true && <Field label="Cantidad manual de mÃƒÂ³dulos" value={data.manualPanelCount} onChange={value=>update("manualPanelCount",value)} unit="mÃƒÂ³dulos" min="1" step="1"/>}
              <Field label="MÃƒÂ³dulos en serie por string" value={data.modulesPerString} onChange={value=>update("modulesPerString",value)} unit="mÃƒÂ³dulos/string" min="1" step="1"/>
            </div>
            <p className="hint">Cantidad automÃƒÂ¡tica por energÃƒÂ­a: {displayEngineeringValue(calc.automaticPanelCount)} mÃƒÂ³dulos. Cantidad seleccionada: {calc.panelCount}. El ajuste manual se guarda con el proyecto y se mantiene al cambiar de secciÃƒÂ³n. La distribuciÃƒÂ³n requiere strings completos y se marca pendiente hasta disponer de los lÃƒÂ­mites elÃƒÂ©ctricos de mÃƒÂ³dulo e inversor.</p>
          </div>
          <div className="result-grid">
            <Metric label="Paneles requeridos" value={`${calc.panelCount}`} detail={calc.manualPanelCountEnabled ? "Cantidad manual persistente" : "EstimaciÃƒÂ³n energÃƒÂ©tica automÃƒÂ¡tica"} icon={PanelsTopLeft}/>
            <Metric label="Potencia instalada" value={`${num(calc.installedWp/1000)} kWp`} detail="Potencia pico DC" icon={Sun}/>
            <Metric label="Strings calculados" value={`${calc.strings}`} detail={`${calc.modulesPerString} mÃƒÂ³dulos en serie`} icon={Network}/>
          </div>
        </>;

      case "CatÃƒÂ¡logo comercial": {
        const systemFilteredProducts = commercialCatalog.filter(item =>
          commercialShowAll || catalogSystemFit(item, data.systemType).show
        );
        const categories = ["Todos", ...new Set(systemFilteredProducts.map(item=>item.category))];
        const visibleProducts = systemFilteredProducts.filter(item =>
          item.image && item.imageVerified === true &&
          (commercialCategory === "Todos" || item.category === commercialCategory) &&
          `${item.brand} ${item.model} ${item.description} ${item.specs.join(" ")}`.toLowerCase().includes(commercialSearch.toLowerCase())
        );
        const selectedProducts = quoteItems.map(id=>commercialCatalog.find(item=>item.id===id)).filter(Boolean);
        const quoteTotal = selectedProducts.reduce((sum,item)=>sum+(item.price==null?0:item.price*(1+(item.tax||0))),0);
        return <>
          <SectionTitle eyebrow="CATÃƒÂLOGO COMERCIAL Ã‚Â· COLOMBIA" title="Equipos y materiales fotovoltaicos" description="Explora componentes comerciales con fotografÃƒÂ­a, referencia, especificaciones y precios publicados en pesos colombianos."/>
          <div className="panel" style={{display:"grid",gap:14}}>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <div className="catalog-search" style={{flex:"1 1 260px"}}><Search size={18}/><input value={commercialSearch} onChange={e=>setCommercialSearch(e.target.value)} placeholder="Buscar marca, modelo o componente..."/></div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}><Filter size={17}/><select value={commercialCategory} onChange={e=>setCommercialCategory(e.target.value)} style={{padding:"11px",borderRadius:9,border:"1px solid var(--border, #d7dee7)",background:"var(--surface, white)"}}>{categories.map(category=><option key={category}>{category}</option>)}</select></div>
            </div>
            <div style={{display:"flex",gap:12,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",padding:"12px 14px",border:"1px solid var(--border, #dbe3ec)",borderRadius:12,background:"var(--surface, #fff)"}}>
              <div>
                <b>CatÃƒÂ¡logo filtrado para: {data.systemType}</b>
                <div className="hint" style={{marginTop:3}}>{commercialShowAll ? `Vista completa: ${commercialCatalog.length} referencias de todas las arquitecturas.` : `${systemFilteredProducts.length} referencias y familias aplicables a esta arquitectura.`}</div>
              </div>
              <label style={{display:"flex",gap:8,alignItems:"center",fontSize:13,cursor:"pointer"}}>
                <input type="checkbox" checked={commercialShowAll} onChange={e=>{setCommercialShowAll(e.target.checked);setCommercialCategory("Todos");}}/>
                Mostrar todo el catÃƒÂ¡logo
              </label>
            </div>
            <div className="notice" style={{display:"block"}}><b>CatÃƒÂ¡logo de referencias con fotografÃƒÂ­a.</b> AquÃƒÂ­ solo aparecen productos con imagen asociada y referencia comercial identificada. Las familias genÃƒÂ©ricas o las imÃƒÂ¡genes sin verificar no se muestran como productos. Confirma con el proveedor la vigencia del precio, impuestos, inventario y variante antes de comprar.</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(245px,1fr))",gap:16}}>
              {visibleProducts.map(item=>{
                const finalPrice = item.price==null ? null : item.price*(1+(item.tax||0));
                const selected = quoteItems.includes(item.id);
                return <article key={item.id} style={{border:"1px solid var(--border, #dbe3ec)",borderRadius:14,overflow:"hidden",background:"var(--surface, #fff)",display:"flex",flexDirection:"column",minWidth:0}}>
                  <div style={{height:190,position:"relative",background:"#fff",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",borderBottom:"1px solid var(--border, #e5e7eb)"}}>
                    <img src={item.image} alt={item.imageAlt || `${item.brand} ${item.model}`} loading="lazy" referrerPolicy="no-referrer" style={{width:"100%",height:"100%",objectFit:"contain",background:"#fff",padding:8}} onError={e=>{const card=e.currentTarget.closest("article"); if(card) card.style.display="none";}}/>
                  </div>
                  <div style={{padding:14,display:"flex",flexDirection:"column",gap:8,flex:1}}>
                    <span className="eyebrow">{item.category} Ã‚Â· {item.brand}</span>
                    <span style={{display:"inline-flex",alignSelf:"flex-start",fontSize:11,padding:"4px 8px",borderRadius:20,background:"rgba(180,83,9,.10)",color:"#92400e"}}>{catalogSystemFit(item,data.systemType).reason} Â· Datos tÃ©cnicos: {item.technicalDataStatus}</span>
                    <h3 style={{fontSize:17,margin:0}}>{item.model}</h3>
                    <p style={{margin:0,minHeight:38}}>{item.description}</p>
                    <ul style={{margin:"2px 0 4px",paddingLeft:18,fontSize:13,color:"var(--muted, #64748b)"}}>{item.specs.map(spec=><li key={spec}>{spec}</li>)}</ul>
                    {item.price==null ? <b style={{fontSize:18}}>Precio por cotizar</b> : <div><b style={{fontSize:18}}>{money(finalPrice)}</b><div className="hint" style={{fontSize:12}}>{item.priceNote}: {money(item.price)}{item.tax>0?` + IVA Ã‚Â· ${money(finalPrice)} con IVA`:""}</div></div>}
                    {item.compatNote&&<div style={{background:"rgba(196,123,18,.10)",padding:9,borderRadius:8,fontSize:12}}><b>Nota de compatibilidad:</b> {item.compatNote}</div>}
                    <div className="hint" style={{fontSize:11}}>{item.updated}</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:"auto"}}>
                      <button className={selected?"secondary":"primary"} onClick={()=>setQuoteItems(old=>selected?old.filter(id=>id!==item.id):[...old,item.id])}>{selected?"Quitar de cotizaciÃƒÂ³n":"AÃƒÂ±adir a cotizaciÃƒÂ³n"}</button>
                      {item.source ? <a href={item.source} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12}}><ExternalLink size={14}/> {item.sourceName}</a> : <span className="hint" style={{fontSize:12}}>Referencia genÃƒÂ©rica Ã‚Â· proveedor pendiente</span>}
                    </div>
                  </div>
                </article>;
              })}
            </div>
            {visibleProducts.length===0&&<p className="hint">No hay referencias con fotografÃƒÂ­a verificada que coincidan con esta bÃƒÂºsqueda.</p>}
          </div>
          <div className="panel">
            <h3><ShoppingCart size={18}/> Mi selecciÃƒÂ³n para cotizar ({selectedProducts.length})</h3>
            {selectedProducts.length===0?<p className="hint">AÃƒÂ±ade productos del catÃƒÂ¡logo para preparar una lista y estimar el subtotal de los artÃƒÂ­culos con precio publicado.</p>:<>
              <div className="table-wrap"><table><thead><tr><th>Componente</th><th>Precio estimado COP</th><th></th></tr></thead><tbody>{selectedProducts.map(item=><tr key={item.id}><td>{item.brand} {item.model}</td><td>{item.price==null?"Por cotizar":money(item.price*(1+(item.tax||0)))}</td><td><button className="compare-button" onClick={()=>setQuoteItems(old=>old.filter(id=>id!==item.id))}>Quitar</button></td></tr>)}</tbody></table></div>
              <div className="key-row"><span>Subtotal de productos con precio conocido</span><b>{money(quoteTotal)}</b></div>
              <p className="hint">Los productos sin precio publicado no se incluyen en el subtotal. No incluye transporte, instalaciÃƒÂ³n ni ingenierÃƒÂ­a.</p>
            </>}
          </div>
          <div className="panel"><h3>CÃƒÂ³mo se conecta con el diseÃƒÂ±o</h3><p>El catÃƒÂ¡logo se filtra automÃƒÂ¡ticamente segÃƒÂºn el tipo de sistema seleccionado en el proyecto: ON-GRID, OFF-GRID o HÃƒÂBRIDO. Puedes activar Ã¢â‚¬Å“Mostrar todo el catÃƒÂ¡logoÃ¢â‚¬Â para explorar otras arquitecturas. El filtro indica la aplicaciÃƒÂ³n general del componente; no certifica compatibilidad entre modelos.</p><p>Antes de recomendar o aplicar un producto, SOLAR PRO debe contrastar la ficha tÃƒÂ©cnica exacta con tensiÃƒÂ³n, corriente, potencia, MPPT, quÃƒÂ­mica y comunicaciÃƒÂ³n BMS, configuraciÃƒÂ³n de strings, red AC y normativa. Una foto o coincidencia de voltaje no demuestra compatibilidad elÃƒÂ©ctrica.</p><p className="hint">Fuentes de mercado para ampliar y actualizar referencias: <a href="https://solartex.co/tienda/inversores" target="_blank" rel="noreferrer">Solartex</a> Ã‚Â· <a href="https://www.reikisolar.com.co/tienda/categoria/inversores" target="_blank" rel="noreferrer">Reiki Solar</a> Ã‚Â· <a href="https://www.copernicosas.com/catalogovirtual" target="_blank" rel="noreferrer">CopÃƒÂ©rnico</a> Ã‚Â· <a href="https://www.solar.com.co/productos/" target="_blank" rel="noreferrer">SOLAR.COM.CO</a> Ã‚Â· <a href="https://integracionsolar.co/fichas-tecnicas/" target="_blank" rel="noreferrer">Fichas tÃƒÂ©cnicas de IntegraciÃƒÂ³n Solar</a>. Las fotografÃƒÂ­as pueden ser ilustrativas y los precios deben confirmarse con el proveedor; no se actualizan automÃƒÂ¡ticamente desde estas pÃƒÂ¡ginas.</p></div>
        </>;
      }
      case "Inversor y baterÃƒÂ­as":
        return <>
          <SectionTitle eyebrow="ETAPA 03" title="Inversor y almacenamiento" description="Ajusta el inversor y el banco de baterÃƒÂ­as."/>
          <div className="panel"><h3>Inversor</h3>
            <p className="hint">Referencias con ficha enlazada a fabricante y coincidencia exacta de modelo. Elegir una referencia carga únicamente los límites publicados; campos ausentes quedan vacíos y pendientes. El precio comercial existente no se modifica.</p>
            <div className="result-grid">{inverterCatalog.map(item=>{const commercial=findExactCommercialInverterMatch(item,commercialCatalogLegacy);const f=item.technicalSheet.fields;return <article key={item.id} style={{border:"1px solid var(--border, #e5e7eb)",borderRadius:10,padding:12}}>
              <b>{item.brand} {item.model}</b>
              <p className="hint">AC: {f.ratedAcPowerW.value ?? "Pendiente"} W · {f.apparentPowerVA.value ?? "Pendiente"} VA · salida {f.outputVoltageRange.value ?? f.outputVoltageV.value ?? "Pendiente"} · corriente máxima {f.maximumOutputCurrentA.value ?? f.maximumOutputCurrentOptions.value ?? "Pendiente"} · {f.outputPhases.value ?? "Pendiente"} fases · {f.frequencyHz.value ?? "Pendiente"} Hz · FP {f.powerFactorRange.value ?? "Pendiente"}.</p>
              <p className="hint">FV: {f.maximumPvPowerW.value ?? "Pendiente"} W máx. · DC {f.maximumDcVoltageV.value ?? "Pendiente"} V máx. · MPPT {f.mpptVoltageMinV.value ?? "Pendiente"}–{f.mpptVoltageMaxV.value ?? "Pendiente"} V · arranque {f.startupVoltageV.value ?? "Pendiente"} V · {f.mpptCount.value ?? "Pendiente"} MPPT · strings/MPPT {(f.stringsPerMppt.value || []).join("/") || "Pendiente"} · Imp {(f.maximumOperatingCurrentByMpptA.value || []).join("/") || "Pendiente"} A · Isc {(f.maximumShortCircuitCurrentByMpptA.value || []).join("/") || "Pendiente"} A.</p>
              <p className="hint">Eficiencia máxima/ponderada: {f.efficiencyPercent.value ?? "Pendiente"}% / {f.weightedEfficiencyPercent.value ?? "Pendiente"}%. Batería: {f.batteryType.value ?? "No documentada / no aplicable"}; rango {f.batteryVoltageMinV.value ?? "Pendiente"}–{f.batteryVoltageMaxV.value ?? "Pendiente"} V; carga/descarga max. {f.maximumChargeCurrentA.value ?? "Pendiente"}/{f.maximumDischargeCurrentA.value ?? "Pendiente"} A. Protecciones declaradas: {(f.integratedProtections.value || []).join(", ") || "Pendiente"}. Ficha: {item.technicalDataStatus}.</p>
              <p className="hint">Precio comercial registrado: {commercial?.price == null ? "por cotizar" : money(commercial.price)}. Referencia técnica no equivale a compatibilidad confirmada.</p>
              <button className="compare-button" type="button" onClick={()=>selectInverter(item)}>{data.selectedInverterCatalogId===item.id?"Seleccionado":"Usar referencia"}</button>{" "}
              <a href={f.datasheetPdfUrl.value} target="_blank" rel="noreferrer">Ficha oficial</a>
              {data.selectedInverterCatalogId===item.id&&<p><b>Estado de compatibilidad: VALIDACIÓN PENDIENTE</b> · los parámetros ausentes y la adaptación a la arquitectura del proyecto requieren revisión.</p>}
            </article>})}</div>
            {selectedInverter&&<p className="hint">Ficha del modelo seleccionado identificada exactamente. Los parámetros de corriente por MPPT se conservan por MPPT en la ficha; el formulario escalar no los representa cuando los valores son diferentes, por lo que esas comprobaciones continúan pendientes.</p>}
            <div className="form-grid">
            <Field label="Potencia nominal" value={data.inverterW} onChange={v=>update("inverterW",v)} unit="W"/>
            <Field label="Demanda simultÃƒÂ¡nea de cargas" value={data.simultaneousDemandW} onChange={v=>update("simultaneousDemandW",v)} unit="W"/>
            <Field label="Demanda de arranque de cargas" value={data.startingDemandW} onChange={v=>update("startingDemandW",v)} unit="W"/>
            <Field label="DuraciÃƒÂ³n de demanda de arranque" value={data.startingDemandDurationSec} onChange={v=>update("startingDemandDurationSec",v)} unit="s"/>
            <Field label="Potencia pico de sobrecarga del inversor" value={data.inverterSurgeW} onChange={v=>update("inverterSurgeW",v)} unit="W"/>
            <Field label="DuraciÃƒÂ³n admitida de sobrecarga" value={data.inverterSurgeDurationSec} onChange={v=>update("inverterSurgeDurationSec",v)} unit="s"/>
            <Field label="Eficiencia DC-AC del inversor" value={data.inverterEfficiency} onChange={v=>update("inverterEfficiency",v)} unit="%" min="1" max="100"/>
            <Field label="TensiÃƒÂ³n DC mÃƒÂ¡xima" value={data.inverterMaxDcVoltage} onChange={v=>update("inverterMaxDcVoltage",v)} unit="V"/>
            <Field label="TensiÃƒÂ³n MPPT mÃƒÂ­nima" value={data.mpptMinVoltage} onChange={v=>update("mpptMinVoltage",v)} unit="V"/>
            <Field label="TensiÃƒÂ³n de arranque" value={data.inverterStartVoltage} onChange={v=>update("inverterStartVoltage",v)} unit="V"/>
            <Field label="TensiÃƒÂ³n MPPT mÃƒÂ¡xima" value={data.mpptMaxVoltage} onChange={v=>update("mpptMaxVoltage",v)} unit="V"/>
            <Field label="Corriente mÃƒÂ¡xima de entrada" value={data.inverterMaxInputCurrent} onChange={v=>update("inverterMaxInputCurrent",v)} unit="A"/>
            <Field label="Corriente mÃƒÂ¡xima Imp por entrada" value={data.inverterMaxInputCurrentPerInput} onChange={v=>update("inverterMaxInputCurrentPerInput",v)} unit="A"/>
            <Field label="Isc mÃƒÂ¡xima admitida" value={data.inverterMaxIsc} onChange={v=>update("inverterMaxIsc",v)} unit="A"/>
            <Field label="Isc mÃƒÂ¡xima por entrada" value={data.inverterMaxIscPerInput} onChange={v=>update("inverterMaxIscPerInput",v)} unit="A"/>
            <Field label="Potencia FV mÃƒÂ¡xima admitida" value={data.inverterMaxPvPower} onChange={v=>update("inverterMaxPvPower",v)} unit="W"/>
            <SelectField label="Arquitectura del inversor" value={data.inverterType} onChange={v=>update("inverterType",v)} options={["ON-GRID","OFF-GRID","HÃƒÂBRIDO"]}/>
            <Field label="TensiÃƒÂ³n AC nominal" value={data.inverterAcVoltage} onChange={v=>update("inverterAcVoltage",v)} unit="V"/>
            <Field label="Cantidad de MPPT" value={data.mpptCount} onChange={v=>update("mpptCount",v)} step="1"/>
            <Field label="Entradas/strings mÃƒÂ¡ximos por MPPT" value={data.modulesPerMppt} onChange={v=>update("modulesPerMppt",v)} step="1"/>
            <Field label="Coeficiente tÃƒÂ©rmico Voc" value={data.vocTempCoefficient} onChange={v=>updatePanelValue("vocTempCoefficient",v)} unit="%/Ã‚Â°C" min="-100"/>
            <Field label="Coeficiente tÃƒÂ©rmico Vmp" value={data.vmpTempCoefficient} onChange={v=>updatePanelValue("vmpTempCoefficient",v)} unit="%/Ã‚Â°C" min="-100"/>
            <Field label="Temperatura mÃƒÂ­nima de diseÃƒÂ±o" value={data.minimumTemperature} onChange={v=>update("minimumTemperature",v)} unit="Ã‚Â°C" min="-100"/>
            <Field label="Temperatura mÃƒÂ¡xima de cÃƒÂ©lula" value={data.maximumCellTemperature} onChange={v=>update("maximumCellTemperature",v)} unit="Ã‚Â°C" min="-100"/>
            <Field label="Entradas fÃƒÂ­sicas por MPPT" value={data.inverterInputsPerMppt} onChange={v=>update("inverterInputsPerMppt",v)} step="1"/>
            <Field label="Precio inversor" value={data.inverterPrice} onChange={v=>update("inverterPrice",v)} unit="COP"/>
          </div><p className="hint">No se recomienda potencia AC con una relaciÃƒÂ³n fija. Ingresa demanda simultÃƒÂ¡nea, demanda de arranque y potencias continuas/pico desde las fichas de cargas e inversor. Los lÃƒÂ­mites elÃƒÂ©ctricos no informados quedan pendientes y bloquean la validaciÃƒÂ³n de strings.</p></div>
          <div className="panel">
            <h3><ShieldCheck size={17}/> Compatibilidad del sistema</h3>
            <p className="hint">SOLAR PRO compara la configuraciÃƒÂ³n ingresada. Si un lÃƒÂ­mite elÃƒÂ©ctrico conocido falla, el sistema queda marcado incompatible; si falta una ficha o un dato tÃƒÂ©rmico, la comprobaciÃƒÂ³n queda pendiente. No se completa con valores asumidos.</p>
            <div className="result-grid">
              <Metric label="Compatibles" value={`${calc.compatibility.filter(x=>x.status==="ok").length}`} detail="Pruebas que cumplen" icon={CheckCircle2}/>
              <Metric label="Incompatibles" value={`${calc.compatibilityErrors.length}`} detail="LÃƒÂ­mites incumplidos" icon={AlertTriangle}/>
              <Metric label="Por verificar" value={`${calc.compatibilityWarnings.length}`} detail="Faltan datos de ficha tÃƒÂ©cnica" icon={Activity}/>
            </div>
            {calc.compatibility.map((item,index)=><div key={index} style={{padding:"12px 0",borderBottom:"1px solid var(--border, #e5e7eb)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                {item.status==="ok"?<CheckCircle2 size={17} color="#16834a"/>:item.status==="error"?<X size={17} color="#c62828"/>:<AlertTriangle size={17} color="#c47b12"/>}
                <b>{item.name}</b>
                <span className="hint">{item.status==="ok"?"Compatible segÃƒÂºn los datos ingresados":item.status==="error"?"Incompatible: supera o incumple un lÃƒÂ­mite":"No verificado: faltan datos"}</span>
              </div>
              <p>{item.detail}</p>
              {item.status!=="ok"&&<div style={{background:item.status==="error"?"rgba(198,40,40,.08)":"rgba(196,123,18,.09)",padding:10,borderRadius:8}}><b>{item.status==="error"?"CorrecciÃƒÂ³n recomendada:":"Dato que falta / recomendaciÃƒÂ³n:"}</b> {item.suggestion}</div>}
            </div>)}
            {calc.compatibilityErrors.length===0&&calc.compatibilityWarnings.length===0&&<p className="hint">No se detectan incompatibilidades en los parÃƒÂ¡metros evaluados. AÃƒÂºn se requiere verificar fichas tÃƒÂ©cnicas, protecciones, comunicaciÃƒÂ³n BMS y normativa aplicable.</p>}
            <p className="hint">Una advertencia no significa que el equipo sea compatible: indica que falta informaciÃƒÂ³n. Los resultados son una revisiÃƒÂ³n preliminar y no sustituyen la validaciÃƒÂ³n del fabricante ni del profesional responsable.</p>
          </div>
          <div className="panel"><h3>Controlador de carga</h3>
            <p className="hint">La ficha del MUST PC18-8025F es del controlador externo independiente. Los inversores híbridos con MPPT integrado se validan desde la ficha del inversor y no se agregan como un segundo controlador.</p>
            {data.systemType==="ON-GRID"&&<p className="hint">En arquitectura ON-GRID no se requiere aquí un controlador externo de batería; se conserva el estado integrado/pendiente del MPPT propio del inversor.</p>}
            {data.controllerMode==="Controlador externo"&&data.systemType!=="ON-GRID"&&<div className="result-grid">{controllerCatalog.map(item=>{const commercial=findExactCommercialControllerMatch(item,commercialCatalogLegacy);const f=item.technicalSheet.fields;return <article key={item.id} style={{border:"1px solid var(--border, #e5e7eb)",borderRadius:10,padding:12}}>
              <b>{item.brand} {item.model} · {f.technology.value}</b><p className="hint">PV absoluto {f.maximumPvInputVoltageV.value} V; MPPT por banco {Object.entries(f.mpptVoltageRangeByBatteryVoltageV.value).map(([v,range])=>`${v} V: ${range[0]}–${range[1]} V`).join(" · ")}; máxima entrada FV / Isc: pendiente de ficha.</p>
              <p className="hint">Potencia FV por banco {Object.entries(f.maximumPvPowerByBatteryVoltageW.value).map(([v,w])=>`${v} V: ${w} W`).join(" · ")}; batería {f.supportedBatteryVoltagesV.value.join("/")} V · carga máxima {f.maximumChargeCurrentA.value} A ({f.maximumChargeCurrentCondition.value}) · tipos {(f.compatibleBatteryTypes.value||[]).join(", ")} · BMS/protocolo: pendiente.</p>
              <p className="hint">Protecciones: {(f.integratedProtections.value||[]).join(", ")}. {f.ingressProtection.value}, {f.coolingMethod.value}, {f.operatingTemperatureMinC.value} a {f.operatingTemperatureMaxC.value} °C, altitud máx. {f.maximumAltitudeM.value} m. Ficha {item.technicalDataStatus}; datos incompletos mantienen validación pendiente. Precio registrado: {commercial?.price==null?"por cotizar":money(commercial.price)}.</p>
              <p className="hint"><b>Conflicto de documentos oficiales:</b> la página actual MUST informa 245 V / MPPT hasta 230 V, mientras un PDF MUST de la serie que incluye los mismos códigos PC18-8025F declara 145 V / MPPT hasta 130 V. Los cotejos afectados quedan VALIDACIÓN PENDIENTE hasta confirmar revisión y placa del controlador.</p>
              <button className="compare-button" type="button" onClick={()=>selectController(item)}>{data.selectedControllerCatalogId===item.id?"Seleccionado":"Usar este controlador"}</button>{" "}<a href={f.datasheetPdfUrl.value} target="_blank" rel="noreferrer">Especificaciones oficiales MUST</a>
              {data.selectedControllerCatalogId===item.id&&<p><b>Estado general: VALIDACIÓN PENDIENTE</b> · se revisan banco, tensión FV, MPPT, potencia, corrientes, batería/BMS y entradas.</p>}
            </article>})}</div>}
            {data.controllerMode==="Integrado en inversor"&&<p className="hint">No se incorpora un equipo externo ni se duplican sus protecciones. Si se seleccionó un inversor Deye, sus MPPT integrados se cotejan en la ficha de inversor. Para otros inversores, completa límites desde su ficha oficial.</p>}
            <p className="hint">La referencia MUST de 100 A no indica su variante exacta de 145/245 V y queda sin ficha asociada. Los controladores MPPT/PWM genéricos y los accesorios de pantalla, sensor y cable permanecen como referencias comerciales sin compatibilidad eléctrica comprobada.</p>
            <div className="form-grid">
            <SelectField label="Tipo de controlador" value={data.controllerMode} onChange={v=>update("controllerMode",v)} options={["Integrado en inversor","Controlador externo"]}/>
            {data.controllerMode==="Controlador externo"&&<>
              <Field label="TensiÃƒÂ³n PV mÃƒÂ¡xima" value={data.controllerMaxPvVoltage} onChange={v=>update("controllerMaxPvVoltage",v)} unit="V"/>
              <Field label="MPPT mÃƒÂ­nimo" value={data.controllerMpptMinVoltage} onChange={v=>update("controllerMpptMinVoltage",v)} unit="V"/>
              <Field label="MPPT mÃƒÂ¡ximo" value={data.controllerMpptMaxVoltage} onChange={v=>update("controllerMpptMaxVoltage",v)} unit="V"/>
              <Field label="Corriente mÃƒÂ¡xima de carga" value={data.controllerMaxChargeCurrent} onChange={v=>update("controllerMaxChargeCurrent",v)} unit="A"/>
              <Field label="Potencia FV mÃƒÂ¡xima" value={data.controllerMaxPvPower} onChange={v=>update("controllerMaxPvPower",v)} unit="W"/>
            </>}
          </div><p className="hint">Si el inversor ya incorpora MPPT, selecciona Ã¢â‚¬Å“Integrado en inversorÃ¢â‚¬Â para evitar contar dos controladores. Confirma siempre si la ficha del inversor admite el campo FV calculado y si la ventana real de tensiÃƒÂ³n de baterÃƒÂ­a es compatible.</p></div>
          <div className="panel"><h3>Banco de baterÃƒÂ­as</h3><div className="form-grid">
            <Field label="TensiÃƒÂ³n nominal de clase del banco" value={data.batteryVoltage} onChange={v=>update("batteryVoltage",v)} unit="V"/>
            <Field label="TensiÃƒÂ³n nominal por unidad" value={data.batteryUnitVoltage} onChange={v=>update("batteryUnitVoltage",v)} unit="V"/>
            <Field label="Capacidad por baterÃƒÂ­a" value={data.batteryAhUnit} onChange={v=>update("batteryAhUnit",v)} unit="Ah"/>
            <SelectField label="TecnologÃƒÂ­a de baterÃƒÂ­a" value={data.batteryChemistry} onChange={v=>update("batteryChemistry",v)} options={["Litio (LiFePO4)","Plomo-ÃƒÂ¡cido AGM", "Plomo-ÃƒÂ¡cido GEL", "Plomo-ÃƒÂ¡cido inundada"]}/>
            <SelectField label="Ã‚Â¿El fabricante permite conexiÃƒÂ³n en serie?" value={data.batterySeriesAllowed} onChange={v=>update("batterySeriesAllowed",v)} options={["No verificado","SÃƒÂ­","No"]}/>
            <Field label="DÃƒÂ­as de autonomÃƒÂ­a" value={data.autonomyDays} onChange={v=>update("autonomyDays",v)}/>
            <Field label="Profundidad de descarga (DoD)" value={data.dod} onChange={v=>update("dod",v)} unit="%" min="1" max="100"/>
            <Field label="Eficiencia de descarga de baterÃƒÂ­a" value={data.batteryDischargeEfficiency} onChange={v=>update("batteryDischargeEfficiency",v)} unit="%" min="1" max="100"/>
            <Field label="Eficiencia del trayecto FV/controlador al banco" value={data.pvChargePathEfficiency} onChange={v=>update("pvChargePathEfficiency",v)} unit="%" min="1" max="100"/>
            <Field label="Descarga mÃƒÂ¡xima por baterÃƒÂ­a" value={data.batteryMaxDischargeCurrent} onChange={v=>update("batteryMaxDischargeCurrent",v)} unit="A"/>
            <Field label="Descarga mÃƒÂ¡xima BMS por baterÃƒÂ­a" value={data.bmsMaxDischargeCurrent} onChange={v=>update("bmsMaxDischargeCurrent",v)} unit="A"/>
            <Field label="Carga mÃƒÂ¡xima por baterÃƒÂ­a" value={data.batteryMaxChargeCurrent} onChange={v=>update("batteryMaxChargeCurrent",v)} unit="A"/>
            <Field label="Carga mÃƒÂ¡xima BMS por baterÃƒÂ­a" value={data.bmsMaxChargeCurrent} onChange={v=>update("bmsMaxChargeCurrent",v)} unit="A"/>
            <Field label="Precio unidad baterÃƒÂ­a" value={data.batteryPrice} onChange={v=>update("batteryPrice",v)} unit="COP"/>
          </div></div>
          <div className="result-grid">
            <Metric label="Capacidad estimada" value={`${displayEngineeringValue(calc.batteryKwh)} kWh`} detail="EnergÃƒÂ­a nominal aproximada" icon={BatteryCharging}/>
            <Metric label="Capacidad equivalente" value={`${displayEngineeringValue(calc.batteryAh)} Ah`} detail={`${calc.batterySeriesCount}S Ãƒâ€” ${calc.batteryParallelCount}P Ã‚Â· banco ${data.batteryVoltage} V`} icon={Zap}/>
          </div>
        </>;

      case "Conductores y protecciones": {
        const acBreakerDesignCurrent = calc.acCurrent;
        const acBreakerCandidate = n(data.breakerNominalCurrentA) > 0 ? n(data.breakerNominalCurrentA) : null;
        const pvFuseLimit = n(data.panelMaxSeriesFuse);
        const acCorrectedAmpacity = data.acAmpacityA && n(data.conductorTemperatureFactor)>0 && n(data.conductorTemperatureFactor)<=1 && n(data.conductorGroupingFactor)>0 && n(data.conductorGroupingFactor)<=1 ? n(data.acAmpacityA)*n(data.conductorTemperatureFactor)*n(data.conductorGroupingFactor) : null;
        const acProtectionReview = evaluateAcBreakerCoordination({ designCurrentA: acBreakerDesignCurrent, breakerNominalCurrentA: data.breakerNominalCurrentA, conductorAmpacityA: acCorrectedAmpacity, faultCurrentKA: data.availableFaultCurrentKA, deviceBreakingCapacityKA: data.breakerBreakingCapacityKA, voltageRatingV: data.breakerVoltageRatingV, requiredVoltageV: data.acVoltage, poles: data.breakerPoles, requiredPoles: data.acNeutralSwitched === "SÃ­" ? (data.acPhases === "TrifÃƒÂ¡sico" ? 4 : 2) : data.acNeutralSwitched === "No" ? (data.acPhases === "TrifÃƒÂ¡sico" ? 3 : 1) : null, tripCurve: data.breakerTripCurve });
        const parallelStringsByMppt = calc.mpptDistribution;
        const pvFuseReviews = parallelStringsByMppt.map((parallel, index) => ({ index, parallel, ...evaluateGpvFuse({ moduleIscA: data.panelIsc, parallelStringsOnMppt: parallel, moduleMaxReverseCurrentA: data.panelMaxReverseCurrentA, moduleMaxSeriesFuseA: data.panelMaxSeriesFuse, gpvRatingsA: String(data.gpvFuseRatingsA || "").split(",").map(value=>Number(value.trim())), selectedGpvRatingA: data.gpvSelectedFuseRatingA, conductorAmpacityA: data.stringAmpacityA ? n(data.stringAmpacityA)*n(data.conductorTemperatureFactor)*n(data.conductorGroupingFactor) : null }) })).filter(item=>item.parallel > 0);
        const pvFuseStatus = pvFuseReviews.length ? pvFuseReviews.map(item=>`MPPT ${item.index+1} (${item.parallel} strings): backfeed ${item.reverseCurrentA == null ? "pendiente" : `${num(item.reverseCurrentA)} A`}; ${item.candidateRatingA ? `gPV ${num(item.candidateRatingA)} A ingresado; ` : ""}${item.status}`).join(" Â· ") : "VALIDACIÃ“N PENDIENTE: distribuciÃ³n de strings por MPPT.";
        return <>
          <SectionTitle eyebrow="ETAPA 04" title="Conductores y protecciones" description="EstimaciÃƒÂ³n preliminar de conductores y guÃƒÂ­a de preselecciÃƒÂ³n de protecciones."/>
          <div className="panel"><h3>ParÃƒÂ¡metros elÃƒÂ©ctricos y distancias</h3><div className="form-grid">
            <Field label="Corriente mÃ¡xima AC continua del inversor (ficha)" value={data.inverterMaxAcCurrentA} onChange={v=>update("inverterMaxAcCurrentA",v)} unit="A"/>
            <Field label="TensiÃƒÂ³n AC" value={data.acVoltage} onChange={v=>update("acVoltage",v)} unit="V"/>
            <SelectField label="Sistema AC" value={data.acPhases} onChange={v=>update("acPhases",v)} options={["MonofÃƒÂ¡sico","TrifÃƒÂ¡sico"]}/>
            <Field label="Factor de potencia" value={data.powerFactor} onChange={v=>update("powerFactor",v)} min="0.1" step="0.01"/>
            <SelectField label="Material conductor" value={data.conductorMaterial} onChange={v=>update("conductorMaterial",v)} options={["Cobre","Aluminio"]}/>
            <Field label="Temperatura ambiente de diseÃƒÂ±o" value={data.ambientTemperatureC} onChange={v=>update("ambientTemperatureC",v)} unit="Ã‚Â°C"/>
            <Field label="Factor de correcciÃƒÂ³n por temperatura (tabla aplicable)" value={data.conductorTemperatureFactor} onChange={v=>update("conductorTemperatureFactor",v)} min="0.01" max="1" step="0.01"/>
            <Field label="Factor de agrupamiento (tabla aplicable)" value={data.conductorGroupingFactor} onChange={v=>update("conductorGroupingFactor",v)} min="0.01" max="1" step="0.01"/>
            <Field label="TensiÃƒÂ³n DC de cÃƒÂ¡lculo (referencia)" value={data.dcVoltage} onChange={v=>update("dcVoltage",v)} unit="V"/>
            <Field label="Recorrido individual de string (ida)" value={data.stringDistance} onChange={v=>update("stringDistance",v)} unit="m"/>
            <Field label="Recorrido colector DC (ida)" value={data.dcDistance} onChange={v=>update("dcDistance",v)} unit="m"/>
            {(calc.mpptCollectorRuns || []).map(mppt => {
              const saved = (data.mpptCircuits || []).find(item => item?.mpptId === mppt.mpptId);
              return <React.Fragment key={mppt.mpptId}>
                <Field label={`${mppt.mpptId}: recorrido colector independiente (ida)`} value={saved?.distanceM ?? data.dcDistance ?? ""} onChange={value=>update("mpptCircuits", [...(data.mpptCircuits || []).filter(item=>item?.mpptId!==mppt.mpptId), {mpptId:mppt.mpptId,distanceM:value,ampacityA:saved?.ampacityA ?? ""}])} unit="m"/>
                <Field label={`${mppt.mpptId}: ampacidad de referencia segÃºn ficha/tabla`} value={saved?.ampacityA ?? ""} onChange={value=>update("mpptCircuits", [...(data.mpptCircuits || []).filter(item=>item?.mpptId!==mppt.mpptId), {mpptId:mppt.mpptId,distanceM:saved?.distanceM ?? data.dcDistance ?? "",ampacityA:value,ampacitySectionMm2:saved?.ampacitySectionMm2 ?? ""}])} unit="A"/>
                <Field label={`${mppt.mpptId}: secciÃ³n asociada a ampacidad`} value={saved?.ampacitySectionMm2 ?? ""} onChange={value=>update("mpptCircuits", [...(data.mpptCircuits || []).filter(item=>item?.mpptId!==mppt.mpptId), {mpptId:mppt.mpptId,distanceM:saved?.distanceM ?? data.dcDistance ?? "",ampacityA:saved?.ampacityA ?? "",ampacitySectionMm2:value}])} unit="mmÂ²"/>
              </React.Fragment>;
            })}
            {data.systemType !== "ON-GRID" && <Field label="Recorrido baterÃƒÂ­a-inversor (ida)" value={data.batteryDistance} onChange={v=>update("batteryDistance",v)} unit="m"/>}
            {data.systemType !== "OFF-GRID" && <Field label="Recorrido tablero-punto de conexiÃƒÂ³n (ida)" value={data.acConnectionDistance} onChange={v=>update("acConnectionDistance",v)} unit="m"/>}
            <Field label="Recorrido AC inversor-tablero (ida)" value={data.acDistance} onChange={v=>update("acDistance",v)} unit="m"/>
            <SelectField label="MÃƒÂ©todo de instalaciÃƒÂ³n" value={data.conductorInstallationMethod || "Por definir"} onChange={v=>update("conductorInstallationMethod",v)} options={["Por definir","TuberÃƒÂ­a","Bandeja","Aire libre","Enterrado"]}/>
            <Field label="Aislamiento del conductor (ficha)" value={data.conductorInsulation} onChange={v=>update("conductorInsulation",v)} type="text"/>
            <Field label="Temperatura nominal del aislamiento" value={data.conductorTemperatureRatingC} onChange={v=>update("conductorTemperatureRatingC",v)} unit="Â°C"/>
            <Field label="Conductores cargados considerados" value={data.conductorLoadedCount} onChange={v=>update("conductorLoadedCount",v)} step="1"/>
            <Field label="Fuente de ampacidad (tabla/ficha)" value={data.ampacitySource} onChange={v=>update("ampacitySource",v)} type="text"/>
            <Field label="CaÃƒÂ­da admisible DC" value={data.dcDrop} onChange={v=>update("dcDrop",v)} unit="%"/>
            <Field label="CaÃƒÂ­da admisible AC" value={data.acDrop} onChange={v=>update("acDrop",v)} unit="%"/>
            <Field label="Ampacidad de referencia string segÃƒÂºn secciÃƒÂ³n y tabla/ficha" value={data.stringAmpacityA} onChange={v=>update("stringAmpacityA",v)} unit="A"/>
            <Field label="SecciÃ³n exacta asociada a ampacidad string" value={data.stringAmpacitySectionMm2} onChange={v=>update("stringAmpacitySectionMm2",v)} unit="mmÂ²"/>
            <Field label="Ampacidad colector segÃƒÂºn secciÃƒÂ³n y tabla/ficha" value={data.collectorAmpacityA} onChange={v=>update("collectorAmpacityA",v)} unit="A"/>
            <Field label="SecciÃ³n exacta asociada a ampacidad colector" value={data.collectorAmpacitySectionMm2} onChange={v=>update("collectorAmpacitySectionMm2",v)} unit="mmÂ²"/>
            <Field label="Ampacidad AC inversor-tablero segÃƒÂºn tabla/ficha" value={data.acAmpacityA} onChange={v=>update("acAmpacityA",v)} unit="A"/>
            <Field label="SecciÃ³n exacta asociada a ampacidad AC inversor-tablero" value={data.acAmpacitySectionMm2} onChange={v=>update("acAmpacitySectionMm2",v)} unit="mmÂ²"/>
            {data.systemType !== "OFF-GRID" && <><Field label="Ampacidad AC tablero-conexiÃƒÂ³n segÃƒÂºn tabla/ficha" value={data.acConnectionAmpacityA} onChange={v=>update("acConnectionAmpacityA",v)} unit="A"/><Field label="SecciÃ³n exacta asociada a ampacidad AC de conexiÃ³n" value={data.acConnectionAmpacitySectionMm2} onChange={v=>update("acConnectionAmpacitySectionMm2",v)} unit="mmÂ²"/></>}
            {data.systemType !== "ON-GRID" && <><Field label="Ampacidad baterÃƒÂ­a-inversor segÃƒÂºn tabla/ficha" value={data.batteryAmpacityA} onChange={v=>update("batteryAmpacityA",v)} unit="A"/><Field label="SecciÃ³n exacta asociada a ampacidad de baterÃ­a" value={data.batteryAmpacitySectionMm2} onChange={v=>update("batteryAmpacitySectionMm2",v)} unit="mmÂ²"/></>}
            <Field label="Corriente de falla disponible (Icc)" value={data.peFaultCurrentA} onChange={v=>update("peFaultCurrentA",v)} unit="A"/>
            <Field label="Tiempo de despeje de protecciÃƒÂ³n" value={data.faultClearingTimeSeconds} onChange={v=>update("faultClearingTimeSeconds",v)} unit="s"/>
            <Field label="Material para cÃ¡lculo adiabÃ¡tico" value={data.adiabaticMaterial} onChange={v=>update("adiabaticMaterial",v)} placeholder="Cobre"/>
            <Field label="Aislamiento para cÃ¡lculo adiabÃ¡tico" value={data.adiabaticInsulation} onChange={v=>update("adiabaticInsulation",v)}/>
            <Field label="Temperatura inicial del conductor (k)" value={data.adiabaticInitialTemperatureC} onChange={v=>update("adiabaticInitialTemperatureC",v)} unit="Â°C"/>
            <Field label="Temperatura final admisible (k)" value={data.adiabaticFinalTemperatureC} onChange={v=>update("adiabaticFinalTemperatureC",v)} unit="Â°C"/>
            <Field label="Factor k adiabÃƒÂ¡tico de conductor/aislamiento" value={data.adiabaticK} onChange={v=>update("adiabaticK",v)}/>
            <Field label="Icc disponible en punto de protecciÃƒÂ³n" value={data.availableFaultCurrentKA} onChange={v=>update("availableFaultCurrentKA",v)} unit="kA"/>
            <Field label="Poder de corte declarado del interruptor" value={data.breakerBreakingCapacityKA} onChange={v=>update("breakerBreakingCapacityKA",v)} unit="kA"/>
            <Field label="Calibre nominal del interruptor AC (ficha)" value={data.breakerNominalCurrentA} onChange={v=>update("breakerNominalCurrentA",v)} unit="A"/>
            <Field label="Curva/caracterÃ­stica del interruptor (ficha)" value={data.breakerTripCurve} onChange={v=>update("breakerTripCurve",v)}/>
            <Field label="TensiÃƒÂ³n nominal del interruptor candidato" value={data.breakerVoltageRatingV} onChange={v=>update("breakerVoltageRatingV",v)} unit="V"/>
            <Field label="Polos del interruptor candidato" value={data.breakerPoles} onChange={v=>update("breakerPoles",v)}/>
            <SelectField label="ConmutaciÃ³n del neutro segÃºn esquema" value={data.acNeutralSwitched} onChange={v=>update("acNeutralSwitched",v)} options={["Por verificar","SÃ­","No"]}/>
            <Field label="Recorrido PE" value={data.peDistance} onChange={v=>update("peDistance",v)} unit="m"/>
            <Field label="Recorrido conductor puesta a tierra" value={data.groundingDistance} onChange={v=>update("groundingDistance",v)} unit="m"/>
            <Field label="Recorrido equipotencial" value={data.bondingDistance} onChange={v=>update("bondingDistance",v)} unit="m"/>
            <SelectField label="Seccionamiento DC externo segÃºn ficha" value={data.integratedProtectionStatus?.dcDisconnect || "Por verificar"} onChange={v=>update("integratedProtectionStatus",{...(data.integratedProtectionStatus||{}),dcDisconnect:v})} options={["Por verificar","Integrado en inversor","ProtecciÃ³n externa requerida"]}/>
            <SelectField label="DPS DC externo segÃºn ficha" value={data.integratedProtectionStatus?.dcSpd || "Por verificar"} onChange={v=>update("integratedProtectionStatus",{...(data.integratedProtectionStatus||{}),dcSpd:v})} options={["Por verificar","Integrado en inversor","ProtecciÃ³n externa requerida"]}/>
            <SelectField label="Interruptor AC externo segÃºn ficha" value={data.integratedProtectionStatus?.acBreaker || "Por verificar"} onChange={v=>update("integratedProtectionStatus",{...(data.integratedProtectionStatus||{}),acBreaker:v})} options={["Por verificar","Integrado en inversor","ProtecciÃ³n externa requerida"]}/>
            <SelectField label="DPS AC externo segÃºn ficha" value={data.integratedProtectionStatus?.acSpd || "Por verificar"} onChange={v=>update("integratedProtectionStatus",{...(data.integratedProtectionStatus||{}),acSpd:v})} options={["Por verificar","Integrado en inversor","ProtecciÃ³n externa requerida"]}/>
            {data.systemType !== "ON-GRID" && <SelectField label="ProtecciÃ³n de baterÃ­a externa segÃºn ficha" value={data.integratedProtectionStatus?.battery || "Por verificar"} onChange={v=>update("integratedProtectionStatus",{...(data.integratedProtectionStatus||{}),battery:v})} options={["Por verificar","Integrada en inversor/BMS","ProtecciÃ³n externa requerida"]}/>}
            <SelectField label="Kit de puesta a tierra/equipotencialidad adicional cotizado" value={data.groundingKitRequired ? "SÃ­" : "No"} onChange={v=>update("groundingKitRequired",v==="SÃ­")} options={["No","SÃ­"]}/>
            <Field label="Icc del conductor de puesta a tierra" value={data.groundingFaultCurrentA} onChange={v=>update("groundingFaultCurrentA",v)} unit="A"/>
            <Field label="Tiempo de despeje de puesta a tierra" value={data.groundingClearingTimeSeconds} onChange={v=>update("groundingClearingTimeSeconds",v)} unit="s"/>
            <Field label="k para conductor de puesta a tierra" value={data.groundingAdiabaticK} onChange={v=>update("groundingAdiabaticK",v)}/>
            <Field label="Corriente de falla de uniÃ³n equipotencial" value={data.bondingFaultCurrentA} onChange={v=>update("bondingFaultCurrentA",v)} unit="A"/>
            <Field label="Tiempo de despeje uniÃ³n equipotencial" value={data.bondingClearingTimeSeconds} onChange={v=>update("bondingClearingTimeSeconds",v)} unit="s"/>
            <Field label="k para uniÃ³n equipotencial" value={data.bondingAdiabaticK} onChange={v=>update("bondingAdiabaticK",v)}/>
            <SelectField label="Esquema de puesta a tierra" value={data.groundingSystem} onChange={v=>update("groundingSystem",v)} options={["Por especificar","TT","TN-S","TN-C-S","IT"]}/>
            <Field label="Resistencia medida de puesta a tierra" value={data.earthResistanceOhms} onChange={v=>update("earthResistanceOhms",v)} unit="ÃŽÂ©"/>
            <Field label="Resistividad del suelo medida" value={data.earthSoilResistivityOhmM} onChange={v=>update("earthSoilResistivityOhmM",v)} unit="ÃŽÂ©Ã‚Â·m"/>
            <Field label="Fusible mÃƒÂ¡ximo en serie del mÃƒÂ³dulo (ficha tÃƒÂ©cnica)" value={data.panelMaxSeriesFuse} onChange={v=>updatePanelValue("panelMaxSeriesFuse",v)} unit="A"/>
            <Field label="Corriente inversa mÃ¡xima del mÃ³dulo (ficha)" value={data.panelMaxReverseCurrentA} onChange={v=>update("panelMaxReverseCurrentA",v)} unit="A"/>
            <Field label="Calibres gPV disponibles segÃºn ficha (separados por coma)" value={data.gpvFuseRatingsA} onChange={v=>update("gpvFuseRatingsA",v)}/>
            <Field label="Calibre gPV seleccionado segÃºn ficha" value={data.gpvSelectedFuseRatingA} onChange={v=>update("gpvSelectedFuseRatingA",v)} unit="A"/>
            <Field label="SecciÃ³n PE FV segÃºn Tabla 250-122" value={data.peTableSectionMm2} onChange={v=>update("peTableSectionMm2",v)} unit="mmÂ²"/>
            <Field label="Fuente documentada del factor k adiabÃ¡tico" value={data.adiabaticKSource} onChange={v=>update("adiabaticKSource",v)}/>
            <Field label="Costo protecciones" value={data.protectionPrice} onChange={v=>update("protectionPrice",v)} unit="COP"/>
          </div></div>
          <div className="table-wrap"><table><thead><tr><th>Tramo separado</th><th>I diseÃƒÂ±o</th><th>SecciÃƒÂ³n calculada / comercial candidata</th><th>CaÃƒÂ­da</th><th>Ampacidad corregida</th><th>Estado</th></tr></thead><tbody>
            {[["Cada string FV",n(data.panelIsc)*1.25,data.stringDistance,calc.stringConductor],...calc.mpptCollectorRuns.map(mppt=>[mppt.mpptId+" colector DC",mppt.designCurrentA,mppt.distanceM,mppt.run]),["Salida AC inversor-tablero",calc.acCurrent,data.acDistance,calc.acConductor],...(calc.connectionConductor ? [["AC tablero-punto de conexiÃƒÂ³n",calc.acCurrent,data.acConnectionDistance,calc.connectionConductor]] : []),...(calc.batteryConductor ? [["BaterÃƒÂ­a-inversor",calc.batteryCurrent,data.batteryDistance,calc.batteryConductor]] : [])].map(([name,current,length,run])=><tr key={name}><td>{name}</td><td>{num(current)} A</td><td>{run?.calculatedAreaMm2 == null ? "VALIDACIÃƒâ€œN PENDIENTE: falta recorrido/voltaje" : `${num(run.calculatedAreaMm2)} mmÃ‚Â² / ${run.commercialSectionMm2 || "fuera de tabla"} mmÃ‚Â²`}</td><td>{run?.voltageDropPercent == null ? "Pendiente" : `${num(run.voltageDropPercent)} % individual Ã‚Â· ${num(length)} m ida`}</td><td>{run?.correctedAmpacityA == null ? "VALIDACIÃƒâ€œN PENDIENTE" : `${num(run.correctedAmpacityA)} A Ã‚Â· ${run.ampacityPass ? "cumple corriente ingresada" : "NO CUMPLE"}`}</td><td>{run?.status || "VALIDACIÃƒâ€œN PENDIENTE"}</td></tr>)}</tbody></table></div>
          {data.systemType !== "OFF-GRID" && <p><b>CaÃ­da AC acumulada inversorâ€“conexiÃ³n:</b> {calc.acCumulativeDrop.cumulativeDropPercent == null ? "VALIDACIÃ“N PENDIENTE: faltan datos de ambos tramos" : `${num(calc.acCumulativeDrop.cumulativeDropPercent)} % (${num(calc.acCumulativeDrop.cumulativeDropV)} V) Â· lÃ­mite 3 % Â· ${calc.acCumulativeDrop.status}`}. La tabla anterior informa cada tramo individualmente.</p>}
          <div className="panel"><h3>GuÃƒÂ­a de preselecciÃƒÂ³n de protecciones</h3>
            <p className="hint">Los valores siguientes son candidatos de predimensionamiento, no una selecciÃƒÂ³n final. Deben coordinarse con la corriente admisible del conductor, las curvas de disparo, la capacidad de interrupciÃƒÂ³n, las instrucciones del inversor y la normativa aplicable.</p>
            <div className="table-wrap"><table><thead><tr><th>Elemento</th><th>Resultado preliminar</th><th>QuÃƒÂ© debe verificarse antes de comprar</th></tr></thead><tbody>
              <tr><td>ProtecciÃƒÂ³n principal del generador FV / seccionador DC</td><td>VALIDACIÃƒâ€œN PENDIENTE Ã‚Â· Voc frÃƒÂ­a {num(calc.stringVoltageVocCold)} V; Isc MPPT mÃƒÂ¡x. {num(calc.shortCircuitCurrentPerMppt)} A</td><td>TensiÃƒÂ³n DC, corriente, polos, categorÃƒÂ­a FV, Icc, configuraciÃƒÂ³n flotante/puesta a tierra y manual del inversor.</td></tr>
              {pvFuseReviews.some(item=>item.parallel > 1 || item.requiresProtection) && <tr><td>Fusible gPV por string paralela y MPPT</td><td>{pvFuseStatus}</td><td>Corriente inversa por MPPT, lÃ­mite inverso y fusible mÃ¡ximo de mÃ³dulo, calibres gPV y tensiÃ³n/capacidad de corte de ficha.</td></tr>}
              <tr><td>DPS DC FV</td><td>Ucpv/Up y tipo: VALIDACIÃƒâ€œN PENDIENTE; Voc frÃƒÂ­a {num(calc.stringVoltageVocCold)} V</td><td>RETIE vigente, evaluaciÃƒÂ³n de riesgo, protecciÃƒÂ³n externa contra rayo, esquema de puesta a tierra y coordinaciÃƒÂ³n.</td></tr>
              {data.systemType !== "ON-GRID" && <tr><td>Fusible/interruptor de baterÃƒÂ­a</td><td>I baterÃƒÂ­a estimada {displayEngineeringValue(calc.batteryCurrent)} A; calibre y corte pendientes</td><td>Corriente de falla de baterÃƒÂ­a, BMS, protecciÃƒÂ³n indicada por fabricante, ampacidad y capacidad interruptiva.</td></tr>}
              <tr><td>Interruptor termomagnÃ©tico AC de salida</td><td>{acBreakerCandidate ? `${acBreakerCandidate} A nominal ingresado` : "No calculable"} Â· I diseÃ±o preliminar ${num(acBreakerDesignCurrent)} A Â· ${acProtectionReview.status}</td><td>{acProtectionReview.pending.join("; ") || "RevisiÃ³n profesional pendiente."}</td></tr>
              <tr><td>DPS AC y barraje de distribuciÃ³n</td><td>DPS/embarrado: VALIDACIÃ“N PENDIENTE Â· salida {num(data.acVoltage)} V Â· {data.acPhases}</td><td>Uc/Up, tipo, polos, corriente nominal, cortocircuito del tablero, coordinaciÃ³n y envolvente.</td></tr>
              {data.systemType !== "OFF-GRID" && <tr><td>ProtecciÃ³n del punto de conexiÃ³n a red</td><td>Por definir segÃºn esquema de red y operador</td><td>Esquema TT/TN/IT, protecciÃ³n de interfaz/anti-isla integrada, coordinaciÃ³n y requisitos del operador.</td></tr>}
              <tr><td>PE FV, uniÃ³n equipotencial y tierra</td><td>PE por Tabla 250-122: {calc.peConductor.sectionMm2 ? `${num(calc.peConductor.sectionMm2)} mmÂ² Â· ${calc.peConductor.status}` : calc.peConductor.status}; adiabÃ¡tico independiente: {calc.peAdiabatic.areaMm2 ? `${num(calc.peAdiabatic.areaMm2)} mmÂ²` : calc.peAdiabatic.status}; tierra medida {data.earthResistanceOhms || "pendiente"} Î©</td><td>Tabla segÃºn OCPD; cÃ¡lculo adiabÃ¡tico exige datos de k, material/aislamiento, temperaturas, Icc y despeje. No declara cumplimiento.</td></tr>
            </tbody></table></div>
            <p><b>Corriente AC de cÃ¡lculo:</b> {num(calc.acCurrent)} A Â· {calc.acCurrentResult.source}. {calc.acCurrentResult.validation}. Es la misma corriente de conductor y protecciÃ³n; no se aplica 1,25 automÃ¡ticamente. Isc FV Ã— 1,25 se conserva solo como hipÃ³tesis preliminar, pendiente de verificar con NTC 2050 690.8 y ficha.</p>
          </div>
          <div className="panel"><h3>Comprobaciones preliminares del generador</h3>
            <p>MÃƒÂ³dulos por string: <b>{calc.modulesPerString}</b> Ã‚Â· Strings calculados: <b>{calc.strings}</b> Ã‚Â· MÃƒÂ³dulos instalados: <b>{calc.panelCount}</b></p>
            <p>Vmp string caliente/frÃƒÂ­o: <b>{num(calc.stringVoltageVmpHot)} / {num(calc.stringVoltageVmpCold)} V</b> Ã‚Â· Voc frÃƒÂ­a: <b>{num(calc.stringVoltageVocCold)} V</b></p>
            <p>DistribuciÃƒÂ³n: <b>{calc.mpptDistribution.map((count, i)=>`MPPT ${i+1}: ${count}`).join(" Ã‚Â· ") || "Sin MPPT"}</b></p>
            <p>Corriente total del campo: <b>{num(calc.inputCurrent)} A</b> Ã‚Â· Corriente mÃƒÂ¡xima por MPPT: <b>{num(calc.currentPerMppt)} A</b> Ã‚Â· Capacidad declarada: <b>{calc.totalStringCapacity} strings</b></p>
            {calc.warnings.length > 0 ? <ul>{calc.warnings.map((warning,index)=><li key={index}>{warning}</li>)}</ul> : <p>Sin alertas en las comprobaciones preliminares configuradas.</p>}
          </div>
          <div className="notice"><AlertTriangle size={18}/> Predimensionamiento resistivo: corriente continua usa ÃŽâ€V = 2ÃÂ(T)LI/S; AC monofÃƒÂ¡sica usa 2ÃÂ(T)LIÃ‚Â·FP/S y trifÃƒÂ¡sica Ã¢Ë†Å¡3ÃÂ(T)LIÃ‚Â·FP/S. La resistividad varÃƒÂ­a linealmente con temperatura desde 20 Ã‚Â°C. No se modela reactancia, armÃƒÂ³nicos ni condiciones detalladas de instalaciÃƒÂ³n. SecciÃƒÂ³n comercial significa candidata por caÃƒÂ­da de tensiÃƒÂ³n, no ampacidad aprobada. Corriente de diseÃƒÂ±o 1,25Ãƒâ€”Isc es una hipÃƒÂ³tesis preliminar y requiere confirmar el RETIE vigente (ResoluciÃƒÂ³n 40284 de 2026), NTC 2050 y datos del circuito. Capacidad de cortocircuito del PE usa S=IÃ¢Ë†Å¡t/k solo si se ingresan los tres datos. Fusibles, interruptores, DPS, polos, barrajes, cortocircuito, electrodos y recomendaciones de catÃƒÂ¡logo quedan VALIDACIÃƒâ€œN PENDIENTE hasta disponer de fichas y esquema real. No es diseÃƒÂ±o certificado.</div>
        </>;
      }

      case "Diagrama unifilar":
        return <>
          <SectionTitle eyebrow="ETAPA 05" title="Diagrama unifilar" description="RepresentaciÃƒÂ³n grÃƒÂ¡fica preliminar segÃƒÂºn la configuraciÃƒÂ³n del proyecto."/>
          <div className="panel"><SelectField label="ConfiguraciÃƒÂ³n del sistema" value={data.systemType} onChange={v=>update("systemType",v)} options={["ON-GRID","OFF-GRID","HÃƒÂBRIDO"]}/></div>
          <ElectricalDiagram data={data} calc={calc}/>
          <SolarProtectionSchedule data={data} calc={calc}/>
          <div className="panel"><h3>Cuadro de equipos y especificaciones para el plano</h3>
            <div className="table-wrap"><table><thead><tr><th>Componente</th><th>EspecificaciÃƒÂ³n del proyecto</th><th>Estado de selecciÃƒÂ³n</th></tr></thead><tbody>
              <tr><td>MÃƒÂ³dulos fotovoltaicos</td><td>{data.panelBrand} {data.panelModel} Ã‚Â· {num(data.panelW)} Wp Ã‚Â· {calc.modulesPerString} mÃƒÂ³dulos/string Ã‚Â· {calc.strings} strings Ã‚Â· {num(calc.installedWp)} Wp</td><td>Datos de mÃƒÂ³dulo ingresados; verificar ficha tÃƒÂ©cnica exacta.</td></tr>
              <tr><td>Inversor</td><td>{data.inverterType} Ã‚Â· {num(data.inverterW)} W Ã‚Â· {num(data.inverterAcVoltage)} V AC Ã‚Â· {num(data.inverterMaxDcVoltage)} V DC mÃƒÂ¡x. Ã‚Â· {num(data.mpptCount)} MPPT</td><td>Verificar corriente por MPPT, potencia FV admisible, red y ficha del modelo.</td></tr>
              <tr><td>Banco de baterÃƒÂ­as</td><td>{data.systemType === "ON-GRID" ? "No aplica a sistema ON-GRID convencional" : `${data.batteryChemistry} Ã‚Â· ${num(data.batteryVoltage)} V Ã‚Â· ${displayEngineeringValue(calc.batteryAh)} Ah requeridos Ã‚Â· ${calc.batterySeriesCount}S Ãƒâ€” ${calc.batteryParallelCount}P`}</td><td>{data.systemType === "ON-GRID" ? "No aplica" : calc.batteryVoltageRatioValid ? "TensiÃƒÂ³n nominal aproximada; validar ventana y BMS" : "Revisar configuraciÃƒÂ³n y tensiÃƒÂ³n"}</td></tr>
              {(calc.mpptCollectorRuns||[]).map(mppt=><tr key={mppt.mpptId}><td>{mppt.mpptId} colector DC</td><td>{mppt.designCurrentA==null?"Corriente pendiente":`${num(mppt.designCurrentA)} A`} Â· {mppt.run.commercialSectionMm2??"VALIDACIÃ“N PENDIENTE"} mmÂ² Â· {mppt.distanceM??"longitud pendiente"} m</td><td>Corriente, recorrido y secciÃ³n del mismo MPPT; ampacidad y ficha pendientes.</td></tr>)}
              <tr><td>Conductores AC</td><td>{calc.acStandardSection ? `${calc.acStandardSection} mmÃ‚Â² ${data.conductorMaterial}` : "SecciÃƒÂ³n por determinar"} Ã‚Â· {num(calc.acCurrent)} A Ã‚Â· {data.acPhases} Ã‚Â· {num(data.acVoltage)} V</td><td>Solo por caÃƒÂ­da de tensiÃƒÂ³n; coordinar con protecciÃƒÂ³n y mÃƒÂ©todo de instalaciÃƒÂ³n.</td></tr>
              <tr><td>Protecciones DC/AC</td><td>Seccionador FV, DPS DC, protecciÃƒÂ³n AC, DPS AC y puesta a tierra</td><td>Referencias y calibres pendientes de validar con fichas y diseÃƒÂ±o final.</td></tr>
            </tbody></table></div>
          </div>
          <div className="notice"><AlertTriangle size={18}/> Este diagrama es una base conceptual. No constituye por sÃƒÂ­ solo un plano constructivo ni certifica cumplimiento RETIE. Requiere revisiÃƒÂ³n y validaciÃƒÂ³n por profesional competente.</div>
          <button className="primary no-print" onClick={printTechnicalPlan}><Printer size={17}/> PDF Ã‚Â· Ver / guardar</button>
        </>;

      case "Presupuesto": {
        const bomRows = buildProjectBOM(data, calc);
        // CategorÃƒÂ­as estrictas por material. Nunca usar "Todos" en el BOM:
        // evita ofrecer inversores como cables o breakers DC como protecciones AC.
        const categoryForRow = (row) => {
          const t = row.name.toLowerCase();
          if (/mÃƒÂ³dulo fv|panel/.test(t)) return ["Paneles solares"];
          if (/inversor/.test(t)) return ["Inversores"];
          if (/baterÃƒÂ­a/.test(t)) return ["BaterÃƒÂ­as"];
          if (/controlador/.test(t)) return ["Controladores MPPT"];
          if (/cable fv/.test(t)) return ["Cable FV"];
          if (/cable ac/.test(t)) return ["Cable AC"];
          if (/conector/.test(t)) return ["Conectores FV"];
          if (/seccionador dc|protecciÃƒÂ³n.*dc/.test(t)) return ["Protecciones DC"];
          if (/dps dc/.test(t)) return ["DPS DC"];
          if (/interruptor.*ac/.test(t)) return ["Protecciones AC"];
          if (/dps ac/.test(t)) return ["DPS AC"];
          if (/tablero|caja de protecciones/.test(t)) return ["Tableros elÃƒÂ©ctricos"];
          if (/puesta a tierra|equipotencial/.test(t)) return ["Puesta a tierra"];
          if (/estructura|grapa|tornillerÃƒÂ­a/.test(t)) return ["Estructuras"];
          if (/canalizaciÃƒÂ³n|tuberÃƒÂ­a/.test(t)) return ["CanalizaciÃƒÂ³n"];
          if (/etiqueta|seÃƒÂ±alizaciÃƒÂ³n|marcaciÃƒÂ³n/.test(t)) return ["SeÃƒÂ±alizaciÃƒÂ³n"];
          if (/consumible|terminal|prensaestopa/.test(t)) return ["Accesorios elÃƒÂ©ctricos"];
          return [];
        };
        const allowedCategoriesForRow = (row) => categoryForRow(row);
        const productForRow = (row) => {
          const item = commercialCatalog.find(product=>product.id===budgetSelections[row.name]);
          return item && allowedCategoriesForRow(row).includes(item.category) ? item : null;
        };
        const lineValues = bomRows.map(row=>{
          const selected = productForRow(row);
          const commercialUnit = selected?.price==null ? null : selected.price*(1+(selected.tax||0));
          const manual = budgetManualPrices[row.name];
          // Mantener row.unit como unidad de medida (m, unidad, par, kit, lote).
          // El precio unitario se guarda en unitPrice para no sobrescribir la unidad.
          const unitPrice = budgetMode==="commercial" ? commercialUnit : (manual==null || manual==="" ? (row.price ?? "") : manual);
          const numeric = unitPrice==="" || unitPrice==null ? null : Number(unitPrice);
          const lineTotal=Number.isFinite(numeric)&&numeric>=0&&Number.isFinite(row.qty)&&row.qty>=0?numeric*row.qty:null;
          return {...row,selected,unitPrice,numeric,lineTotal};
        });
        const budgetValidationChecks = [
          ...(calc.electricalCircuitModel?.circuits || []).map(circuit=>circuit.status),
          calc.states?.protections, calc.states?.grounding,
          ...(calc.numericValidation?.invalid || []).map(()=>ENGINEERING_STATES.INVALID),
          ...lineValues.filter(row=>row.selected).map(row=>evaluateProductCompatibility(row.selected,productCompatibilityRequirements(row.selected,data)))
        ];
        const budgetTotals = calculateBudgetTotals(lineValues,budgetExtra,budgetValidationChecks);
        const {knownSubtotal,transport,labor,other,tax:taxValue,total:grandTotal} = budgetTotals;
        const taxRate = budgetTotals.taxPercent/100;
        const displayedTotal = budgetTotals.status===ENGINEERING_STATES.INVALID ? "INVALIDO" : budgetTotals.complete ? money(grandTotal) : `${budgetTotals.status} Â· ${budgetTotals.unpricedCount} partida(s) sin precio Â· ${budgetTotals.pendingCount} validaciÃ³n(es) pendiente(s)`;
        const updateExtra = (key,value)=>setBudgetExtra(old=>({...old,[key]:value}));
        return <>
          <SectionTitle eyebrow="ETAPA 05 Ã‚Â· PRESUPUESTO INTELIGENTE" title="Presupuesto y materiales" description="Genera una cotizaciÃƒÂ³n desde el dimensionamiento, selecciona referencias comerciales o introduce tus propios precios."/>
          <div className="panel">
            <h3>Resumen del dimensionamiento</h3>
            <div className="metrics-grid">
              <Metric label="MÃƒÂ³dulos" value={calc.panelCount} detail={`${num(calc.installedWp/1000)} kWp instalados`} icon={PanelsTopLeft}/>
              <Metric label="Strings" value={calc.strings} detail={`${calc.modulesPerString} mÃƒÂ³dulos por string`} icon={Network}/>
              <Metric label="Inversor" value={`${num(n(data.inverterW)/1000)} kW`} detail={data.systemType} icon={Zap}/>
              <Metric label="BaterÃƒÂ­as" value={calc.batteryUnits} detail={data.systemType==="ON-GRID"?"No aplica a ON-GRID convencional":`${data.batteryVoltage} V Ã‚Â· ${data.batteryChemistry}`} icon={BatteryCharging}/>
            </div>
          </div>
          <div className="panel">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:14,flexWrap:"wrap"}}>
              <div><h3 style={{marginBottom:4}}>Modalidad de precios</h3><p className="hint" style={{margin:0}}>Puedes cambiar de modalidad en cualquier momento. Las cantidades se mantienen segÃƒÂºn el diseÃƒÂ±o.</p></div>
              <div className="budget-mode-switch" role="group" aria-label="Modalidad de presupuesto">
                <button type="button" className={budgetMode==="commercial"?"active":""} onClick={()=>setBudgetMode("commercial")}><Store size={15}/> Productos comerciales</button>
                <button type="button" className={budgetMode==="editable"?"active":""} onClick={()=>setBudgetMode("editable")}><FileText size={15}/> Precios editables</button>
              </div>
            </div>
            {budgetMode==="commercial" ? <div className="notice" style={{marginTop:14}}><Store size={17}/> Selecciona referencias del catÃƒÂ¡logo comercial existente. Se muestran precios publicados como referencia; confirma precio, IVA, inventario y disponibilidad directamente con el proveedor. La existencia no se consulta en tiempo real.</div> : <div className="notice" style={{marginTop:14}}><FileText size={17}/> Introduce los precios unitarios acordados con tus proveedores. Los campos vacÃƒÂ­os quedan pendientes y no se suman al total.</div>}
          </div>
          <div className="panel">
            <h3><ShoppingCart size={18}/> Lista de materiales calculada (BOM)</h3>
            <p className="hint">Las cantidades son preliminares. Cableado, canalizaciÃƒÂ³n, estructura y protecciones requieren validaciÃƒÂ³n con trazado real, fichas tÃƒÂ©cnicas y diseÃƒÂ±o constructivo.</p>
            <style>{`
              .budget-table-wrap-fixed { width:100%; max-width:100%; overflow-x:auto; }
              .budget-table-wrap-fixed .budget-table-fixed { width:100% !important; min-width:850px; table-layout:fixed !important; border-collapse:collapse; }
              .budget-table-wrap-fixed .budget-table-fixed col:nth-child(1) { width:36%; }
              .budget-table-wrap-fixed .budget-table-fixed col:nth-child(2) { width:8%; }
              .budget-table-wrap-fixed .budget-table-fixed col:nth-child(3) { width:13%; }
              .budget-table-wrap-fixed .budget-table-fixed col:nth-child(4) { width:27%; }
              .budget-table-wrap-fixed .budget-table-fixed col:nth-child(5) { width:16%; }
              .budget-table-wrap-fixed .budget-table-fixed th,
              .budget-table-wrap-fixed .budget-table-fixed td { box-sizing:border-box; padding:12px 10px; vertical-align:top; }
              .budget-table-wrap-fixed .budget-table-fixed th { white-space:normal; text-align:left; }
              .budget-table-wrap-fixed .budget-table-fixed th:nth-child(2),
              .budget-table-wrap-fixed .budget-table-fixed th:nth-child(3),
              .budget-table-wrap-fixed .budget-table-fixed td:nth-child(2),
              .budget-table-wrap-fixed .budget-table-fixed td:nth-child(3) { text-align:center !important; }
              .budget-table-wrap-fixed .budget-table-fixed td:nth-child(1) { overflow-wrap:anywhere; }
              .budget-table-wrap-fixed .budget-table-fixed td:nth-child(4) { min-width:0 !important; }
              .budget-table-wrap-fixed .budget-table-fixed td:nth-child(4) select,
              .budget-table-wrap-fixed .budget-table-fixed td:nth-child(4) input { width:100% !important; min-width:0 !important; max-width:100%; box-sizing:border-box; }
              .budget-table-wrap-fixed .budget-table-fixed td:nth-child(5) { white-space:nowrap; }
              @media (max-width:900px) { .budget-table-wrap-fixed .budget-table-fixed { min-width:850px; } }
            `}</style>
            <div className="table-wrap budget-table-wrap-fixed"><table className="budget-table budget-table-fixed"><colgroup><col/><col/><col/><col/><col/></colgroup><thead><tr><th>Material / componente</th><th>Cantidad</th><th>Unidad de medida</th><th>Producto / precio unitario</th><th>Subtotal</th></tr></thead>
              <tbody>{lineValues.map((row,i)=>{
                const allowedCategories = allowedCategoriesForRow(row);
                const options = commercialCatalog.filter(item=>item.imageVerified===true && allowedCategories.includes(item.category));
                return <tr key={`${row.name}-${i}`}>
                  <td><b>{row.name}</b><div className="hint">{row.note}</div></td>
                  <td style={{textAlign:"center",fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{Number(row.qty).toLocaleString("es-CO",{maximumFractionDigits:2})}</td>
                  <td style={{textAlign:"center",whiteSpace:"nowrap"}}>{row.unit}</td>
                  <td style={{minWidth:230}}>
                    {budgetMode==="commercial" ? <>
                      <select aria-label={`Producto comercial para ${row.name}`} value={budgetSelections[row.name]||""} onChange={e=>setBudgetSelections(old=>({...old,[row.name]:e.target.value}))} style={{width:"100%",padding:8,border:"1px solid var(--border)",borderRadius:8,background:"var(--surface,white)"}}>
                        <option value="">{row.selected?"Selecciona otra referencia":"Seleccionar producto comercial"}</option>
                        {options.map(item=><option key={item.id} value={item.id}>{item.brand} Ã‚Â· {item.model}{item.price==null?" Ã‚Â· por cotizar":` Ã‚Â· ${money(item.price*(1+(item.tax||0)))}`}</option>)}
                      </select>
                      {options.length===0&&<div className="hint" style={{marginTop:5}}>No hay una referencia comercial verificada en esta categorÃƒÂ­a. No se mostrarÃƒÂ¡n productos de otras familias. Puedes introducir el precio y la referencia en Ã‚Â«Precios editablesÃ‚Â».</div>}
                      {row.selected&&<div className="hint" style={{marginTop:5}}>{row.selected.priceNote||"Precio publicado"} Ã‚Â· {row.selected.updated||"Fecha no informada"}{row.selected.source&&<> Ã‚Â· <a href={row.selected.source} target="_blank" rel="noreferrer">Proveedor</a></>}</div>}
                      {!row.selected&&<div className="hint" style={{marginTop:5}}>Sin referencia seleccionada. Puedes consultar el catÃƒÂ¡logo o cambiar a precios editables.</div>}
                    </> : <div style={{display:"flex",alignItems:"center",gap:6}}><span>$</span><input type="number" min="0" step="100" placeholder="Precio unitario COP" value={budgetManualPrices[row.name]??(row.price??"")} onChange={e=>setBudgetManualPrices(old=>({...old,[row.name]:e.target.value}))} style={{width:"100%",minWidth:130,padding:8,border:"1px solid var(--border)",borderRadius:8}}/></div>}
                    {budgetMode==="commercial"&&row.selected?.price==null&&<small className="hint">Precio por cotizar con proveedor</small>}
                  </td>
                  <td>{row.numeric!=null&&(!Number.isFinite(Number(row.numeric))||Number(row.numeric)<0)?"INVALIDO":row.lineTotal==null?"Por cotizar":money(row.lineTotal)}</td>
                </tr>;
              })}</tbody>
            </table></div>
            <div className="hint" style={{marginTop:10}}>Cada material muestra ÃƒÂºnicamente productos de su familia tÃƒÂ©cnica. Si no hay una referencia comercial verificada, el selector queda vacÃƒÂ­o en lugar de ofrecer productos incorrectos. La selecciÃƒÂ³n comercial no certifica por sÃƒÂ­ sola la compatibilidad elÃƒÂ©ctrica.</div>
          </div>
          <div className="panel">
            <h3>Costos adicionales</h3>
            <div className="form-grid">
              <Field label="Transporte" value={budgetExtra.transport} onChange={v=>updateExtra("transport",v)} unit="COP"/>
              <Field label="Mano de obra e instalaciÃƒÂ³n" value={budgetExtra.labor} onChange={v=>updateExtra("labor",v)} unit="COP"/>
              <Field label="Otros costos" value={budgetExtra.other} onChange={v=>updateExtra("other",v)} unit="COP"/>
              <Field label="Impuestos adicionales (%)" value={budgetExtra.tax} onChange={v=>updateExtra("tax",v)} unit="%"/>
            </div>
          </div>
          <div className="panel budget-summary">
            <h3>Resumen econÃƒÂ³mico</h3>
            <div className="key-row"><span>Subtotal de materiales con precio conocido</span><b>{money(knownSubtotal)}</b></div>
            <div className="key-row"><span>Transporte</span><b>{money(transport)}</b></div>
            <div className="key-row"><span>Mano de obra e instalaciÃƒÂ³n</span><b>{money(labor)}</b></div>
            <div className="key-row"><span>Otros costos</span><b>{money(other)}</b></div>
            <div className="key-row"><span>Impuestos adicionales ({num(taxRate*100)}%)</span><b>{money(taxValue)}</b></div>
            <div className="key-row"><span>Estado del presupuesto</span><b>{budgetTotals.status}</b></div>
            <div className="budget-grand-total"><span>{budgetTotals.complete?"TOTAL ESTIMADO Â· BOM":"SUBTOTAL CONOCIDO Â· TOTAL INCOMPLETO"}</span><strong>{displayedTotal}</strong></div>
            <p className="hint">Los componentes sin precio quedan Ã‚Â«Por cotizarÃ‚Â» y no se incluyen en el total. Los precios comerciales pueden estar sujetos a IVA segÃƒÂºn la ficha del proveedor; evita duplicar impuestos al ingresar valores manuales.</p>
            <button className="primary" onClick={print}><Printer size={17}/> Imprimir / Guardar presupuesto PDF</button>
          </div>
        </>;
      }

      case "Informe tÃƒÂ©cnico":
        return <>
          <SectionTitle eyebrow="ETAPA 07" title="Informe tÃƒÂ©cnico" description="Resumen para imprimir o guardar como PDF."/>
          <div className="report panel">
            <div className="report-head"><div className="brand-mark"><Sun/></div><div><h2>SOLAR PRO</h2><p>Informe preliminar de dimensionamiento fotovoltaico</p></div></div>
            <h3>{data.projectName}</h3>
            <p><b>Cliente:</b> {data.client||"No especificado"} Ã‚Â· <b>UbicaciÃƒÂ³n:</b> {data.location||"No especificada"}</p>
            <p><b>Sistema:</b> {data.systemType} Ã‚Â· <b>Consumo:</b> {num(effectiveMonthlyKwh)} kWh/mes</p>
            <p><b>Panel:</b> {data.panelBrand} {data.panelModel} Ã‚Â· {data.panelW} Wp</p>
            <p><b>ParÃƒÂ¡metros:</b> Voc {data.panelVoc} V Ã‚Â· Vmp {data.panelVmp} V Ã‚Â· Isc {data.panelIsc} A Ã‚Â· Imp {data.panelImp} A</p>
            <p><b>Strings:</b> {calc.strings} strings de {calc.modulesPerString} mÃƒÂ³dulos Ã‚Â· Vmp string {num(calc.stringVoltageVmp)} V Ã‚Â· Voc frÃƒÂ­o {num(calc.stringVoltageVocCold)} V</p>
            <p><b>Banco:</b> {data.batteryChemistry} Ã‚Â· {num(data.batteryVoltage)} V Ã‚Â· {displayEngineeringValue(calc.batteryAh)} Ah requeridos Ã‚Â· configuraciÃƒÂ³n {calc.batterySeriesCount}S Ãƒâ€” {calc.batteryParallelCount}P ({calc.batteryUnits} unidades estimadas)</p>
            <p><b>Comprobaciones:</b> {calc.warnings.length ? calc.warnings.join("; ") : "Sin alertas preliminares en los lÃƒÂ­mites introducidos."}</p>
            <div className="report-grid">
              <div><small>Generador FV</small><strong>{calc.panelCount} paneles / {num(calc.installedWp/1000)} kWp</strong></div>
              <div><small>Inversor</small><strong>{num(n(data.inverterW)/1000)} kW</strong></div>
              <div><small>Almacenamiento</small><strong>{displayEngineeringValue(calc.batteryKwh)} kWh</strong></div>
              <div><small>EstimaciÃ³n simplificada (no presupuesto BOM)</small><strong>{money(calc.total)}</strong></div>
            </div>
            <h3>Circuitos elÃ©ctricos del modelo comÃºn (BOM / unifilar / informe)</h3>
            <div className="table-wrap"><table><thead><tr><th>ID / circuito</th><th>Recorrido</th><th>Corriente diseÃ±o</th><th>SecciÃ³n</th><th>Material</th><th>Ampacidad corregida</th><th>CaÃ­da individual</th><th>ProtecciÃ³n / validaciÃ³n</th></tr></thead><tbody>
              {(calc.electricalCircuitModel?.circuits || []).map(circuit=><tr key={circuit.id}><td>{circuit.id} Â· {circuit.label}</td><td>{circuit.lengthM == null ? "VALIDACIÃ“N PENDIENTE" : `${num(circuit.lengthM)} m por conductor`}</td><td>{circuit.designCurrentA == null ? "â€”" : `${num(circuit.designCurrentA)} A`}</td><td>CaÃ­da: {circuit.sectionByVoltageDropMm2 == null ? "pendiente" : `${circuit.sectionByVoltageDropMm2} mmÂ²`} Â· ampacidad: {circuit.sectionByAmpacityMm2 == null ? "pendiente" : `${circuit.sectionByAmpacityMm2} mmÂ²`} Â· protecciÃ³n: {circuit.sectionByProtectionMm2 == null ? "pendiente" : `${circuit.sectionByProtectionMm2} mmÂ²`} Â· final: {circuit.selectedSectionMm2 == null ? "pendiente" : `${circuit.selectedSectionMm2} mmÂ²`}</td><td>{circuit.material}</td><td>{circuit.correctedAmpacityA == null ? "VALIDACIÃ“N PENDIENTE" : `${num(circuit.correctedAmpacityA)} A`}</td><td>{circuit.voltageDropPercent == null ? "VALIDACIÃ“N PENDIENTE / no aplica" : `${num(circuit.voltageDropPercent)} %`}</td><td>{circuit.protection} Â· {circuit.status}{circuit.pending.length ? ` Â· ${circuit.pending.join("; ")}` : ""}</td></tr>)}
              <tr><td>FV-TOTAL Â· Generador FV</td><td>â€”</td><td>{calc.electricalCircuitModel?.generator.currentA == null ? "â€”" : `${num(calc.electricalCircuitModel.generator.currentA)} A total`}</td><td>â€”</td><td>â€”</td><td>â€”</td><td>â€”</td><td>Corriente agregada; no representa un conductor</td></tr>
            </tbody></table></div>
            <h3>Estados de validaciÃ³n integral</h3>
            <div className="table-wrap"><table><thead><tr><th>Ãrea</th><th>Estado</th></tr></thead><tbody>{Object.entries(calc.states || {}).map(([area,state])=><tr key={area}><td>{area}</td><td>{state}</td></tr>)}</tbody></table></div>
            <h3>Observaciones</h3>
            <p><b>Advertencias y datos pendientes:</b> {calc.warnings.length ? calc.warnings.join("; ") : "Sin advertencias preliminares en los parÃ¡metros ingresados."}</p>
            <p>Predimensionamiento preliminar. Antes de ejecutar la instalaciÃƒÂ³n se deben validar recurso solar, fichas tÃƒÂ©cnicas, diseÃƒÂ±o elÃƒÂ©ctrico, protecciones, estructura, normativa vigente y requisitos del operador de red.</p>
            <p className="signature">Elaborado con SOLAR PRO Ã‚Â· {new Date().toLocaleDateString("es-CO")}</p>
          </div>
          <button className="primary" onClick={print}><Printer size={17}/> Imprimir / Guardar PDF</button>
        </>;

      case "Resumen":
      default:
        return <>
          <SectionTitle eyebrow="CIERRE DEL DISEÃƒâ€˜O" title="Resumen integral del proyecto" description="Consolida los resultados de todas las etapas de diseÃƒÂ±o, excepto el catÃƒÂ¡logo comercial."/>
          <div className="welcome"><div><span className="eyebrow">PROYECTO ACTIVO</span><h2>{data.projectName}</h2><p>{data.client || "Cliente por definir"} Ã‚Â· {data.location || "UbicaciÃƒÂ³n no especificada"} Ã‚Â· Sistema {data.systemType}</p></div><div className="sun-orb"><Sun size={42}/></div></div>
          <div className="result-grid">
            <Metric label="Consumo diario" value={`${num(calc.daily)} kWh`} detail={`${num(effectiveMonthlyKwh)} kWh/mes`} icon={Activity}/>
            <Metric label="Generador fotovoltaico" value={`${num(calc.installedWp/1000)} kWp`} detail={`${calc.panelCount} paneles de ${num(data.panelW)} Wp`} icon={Sun}/>
            <Metric label="Almacenamiento requerido" value={data.systemType === "ON-GRID" ? "No aplica" : `${displayEngineeringValue(calc.batteryKwh)} kWh`} detail={data.systemType === "ON-GRID" ? "Sistema conectado a red" : `${num(data.autonomyDays)} dÃƒÂ­a(s) de autonomÃƒÂ­a`} icon={BatteryCharging}/>
            <Metric label="EstimaciÃ³n simplificada" value={money(calc.total)} detail="Base parcial; consulta el total del presupuesto BOM" icon={CircleDollarSign}/>
          </div>
          <div className="panel">
            <h3>01 Ã‚Â· InformaciÃƒÂ³n del proyecto y recurso solar</h3>
            <div className="key-row"><span>Nombre del proyecto</span><b>{data.projectName || "No especificado"}</b></div>
            <div className="key-row"><span>Cliente</span><b>{data.client || "No especificado"}</b></div>
            <div className="key-row"><span>UbicaciÃƒÂ³n</span><b>{data.location || "No especificada"}</b></div>
            <div className="key-row"><span>Tipo de sistema</span><b>{data.systemType}</b></div>
            <div className="key-row"><span>Consumo mensual / diario</span><b>{num(effectiveMonthlyKwh)} kWh/mes Ã‚Â· {num(calc.daily)} kWh/dÃƒÂ­a</b></div>
            <div className="key-row"><span>Horas solar pico</span><b>{num(data.peakSunHours)} h/dÃƒÂ­a</b></div>
            <div className="key-row"><span>Rendimiento global FV (PR)</span><b>{num(data.efficiency)} %</b></div>
            <div className="key-row"><span>Costo de energÃƒÂ­a</span><b>{money(data.energyPrice)} / kWh</b></div>
          </div>
          <div className="panel">
            <h3>02 Ã‚Â· Generador fotovoltaico</h3>
            <div className="key-row"><span>MÃƒÂ³dulo seleccionado</span><b>{data.panelBrand} Ã‚Â· {data.panelModel}</b></div>
            <div className="key-row"><span>Potencia unitaria</span><b>{num(data.panelW)} Wp</b></div>
            <div className="key-row"><span>Paneles requeridos por energÃƒÂ­a</span><b>{calc.requiredPanelCount}</b></div>
            <div className="key-row"><span>Paneles fÃƒÂ­sicos configurados</span><b>{calc.panelCount}</b></div>
            <div className="key-row"><span>ConfiguraciÃƒÂ³n de strings</span><b>{calc.strings} string(s) Ã‚Â· {calc.modulesPerString} mÃƒÂ³dulos en serie</b></div>
            <div className="key-row"><span>Potencia instalada</span><b>{num(calc.installedWp)} Wp ({num(calc.installedWp/1000)} kWp)</b></div>
            <div className="key-row"><span>ParÃƒÂ¡metros elÃƒÂ©ctricos del mÃƒÂ³dulo</span><b>Voc {num(data.panelVoc)} V Ã‚Â· Vmp {num(data.panelVmp)} V Ã‚Â· Isc {num(data.panelIsc)} A Ã‚Â· Imp {num(data.panelImp)} A</b></div>
          </div>
          <div className="panel">
            <h3>03 Ã‚Â· Inversor, controlador y baterÃƒÂ­as</h3>
            <div className="key-row"><span>Inversor</span><b>{data.inverterType} Ã‚Â· {num(data.inverterW)} W Ã‚Â· {num(data.inverterAcVoltage)} V AC</b></div>
            <div className="key-row"><span>Ventana MPPT / tensiÃƒÂ³n DC mÃƒÂ¡xima</span><b>{num(data.mpptMinVoltage)}Ã¢â‚¬â€œ{num(data.mpptMaxVoltage)} V Ã‚Â· {num(data.inverterMaxDcVoltage)} V DC</b></div>
            <div className="key-row"><span>MPPT / capacidad de strings declarada</span><b>{num(data.mpptCount)} MPPT Ã‚Â· {num(data.modulesPerMppt)} string(s) por MPPT</b></div>
            <div className="key-row"><span>Controlador de carga</span><b>{data.controllerMode}</b></div>
            <div className="key-row"><span>Banco de baterÃƒÂ­as</span><b>{data.systemType === "ON-GRID" ? "No aplica" : `${data.batteryChemistry} Ã‚Â· ${num(data.batteryVoltage)} V Ã‚Â· ${displayEngineeringValue(calc.batteryAh)} Ah requeridos`}</b></div>
            <div className="key-row"><span>ConfiguraciÃƒÂ³n estimada del banco</span><b>{data.systemType === "ON-GRID" ? "No aplica" : `${calc.batterySeriesCount}S Ãƒâ€” ${calc.batteryParallelCount}P Ã‚Â· ${calc.batteryUnits} unidad(es)`}</b></div>
            <div className="key-row"><span>Capacidad instalada estimada</span><b>{data.systemType === "ON-GRID" ? "No aplica" : `${num(calc.batteryInstalledAh)} Ah Ã‚Â· ${num(calc.batteryInstalledAh * data.batteryVoltage / 1000)} kWh nominales aprox.`}</b></div>
          </div>
          <div className="panel">
            <h3>04 Ã‚Â· Conductores y protecciones</h3>
            {(calc.electricalCircuitModel?.circuits || []).map(circuit=><div className="key-row" key={circuit.id}><span>{circuit.id} Â· {circuit.label}</span><b>{circuit.designCurrentA == null ? "Corriente pendiente" : `${num(circuit.designCurrentA)} A`} Â· {circuit.sectionMm2 == null ? "secciÃ³n VALIDACIÃ“N PENDIENTE" : `${circuit.sectionMm2} mmÂ²`} Â· {circuit.lengthM == null ? "longitud pendiente" : `${num(circuit.lengthM)} m/conductor`} Â· {circuit.status}</b></div>)}
            <div className="key-row"><span>CaÃƒÂ­da admisible DC / AC</span><b>{num(data.dcDrop)} % / {num(data.acDrop)} %</b></div>
            <div className="key-row"><span>Red AC</span><b>{num(data.acVoltage)} V Ã‚Â· {data.acPhases} Ã‚Â· FP {num(data.powerFactor)}</b></div>
            <p className="hint">Los calibres son predimensionamientos por caÃƒÂ­da de tensiÃƒÂ³n. Deben validarse ampacidad, temperatura, agrupamiento, mÃƒÂ©todo de instalaciÃƒÂ³n, cortocircuito y coordinaciÃƒÂ³n de protecciones.</p>
          </div>
          <div className="panel">
            <h3>05 Ã‚Â· Diagrama unifilar y verificaciones</h3>
            <p>El diagrama unifilar y el cuadro de conductores/protecciones se generan en la secciÃƒÂ³n correspondiente para la arquitectura {data.systemType}.</p>
            <div className="result-grid">
              <Metric label="Compatibilidades correctas" value={calc.compatibility.filter(x=>x.status==="ok").length} detail="SegÃƒÂºn datos ingresados" icon={CheckCircle2}/>
              <Metric label="Incompatibilidades" value={calc.compatibilityErrors.length} detail="Requieren correcciÃƒÂ³n" icon={AlertTriangle}/>
              <Metric label="Datos por verificar" value={calc.compatibilityWarnings.length} detail="Faltan fichas o parÃƒÂ¡metros" icon={Activity}/>
            </div>
            {calc.compatibilityIssues.map((item,index)=><div key={index} className="key-row"><span>{item.name}</span><b>{item.status === "error" ? "Incompatible" : "Por verificar"} Ã‚Â· {item.detail}</b></div>)}
            {calc.warnings.map((warning,index)=><p className="hint" key={index}>Ã¢â‚¬Â¢ {warning}</p>)}
            {!calc.compatibilityIssues.length && !calc.warnings.length && <p className="hint">No se detectan alertas en las comprobaciones preliminares configuradas.</p>}
          </div>
          <div className="panel">
            <h3>06 Ã‚Â· Presupuesto e inversiÃƒÂ³n</h3>
            <div className="key-row"><span>Paneles</span><b>{money(calc.panelCost)}</b></div>
            <div className="key-row"><span>Inversor</span><b>{money(data.inverterPrice)}</b></div>
            <div className="key-row"><span>BaterÃƒÂ­as estimadas</span><b>{money(calc.batteryUnits * n(data.batteryPrice))}</b></div>
            <div className="key-row"><span>Protecciones y otros costos</span><b>{money(n(data.protectionPrice) + n(data.extraCost) + calc.panelCount * n(data.structurePrice))}</b></div>
            <div className="budget-grand-total"><span>ESTIMACIÃ“N SIMPLIFICADA Â· NO ES TOTAL BOM</span><strong>{money(calc.total)}</strong></div>
            <p className="hint">Esta estimaciÃ³n suma un subconjunto de costos ingresados. El total comercial del proyecto se calcula por separado desde cantidades del BOM, precios elegidos y adicionales en Presupuesto.</p>
          </div>
          <div className="panel">
            <h3>07 Ã‚Â· Informe y alcance tÃƒÂ©cnico</h3>
            <p>Este resumen consolida la informaciÃƒÂ³n del proyecto, recurso solar, generador, inversor, almacenamiento, conductores, protecciones, diagrama y presupuesto. Los valores son de predimensionamiento y no constituyen un diseÃƒÂ±o constructivo certificado.</p>
            <p className="hint">Antes de construir, validar las fichas tÃƒÂ©cnicas exactas, condiciones del sitio, protecciones, puesta a tierra, coordinaciÃƒÂ³n, RETIE vigente, NTC 2050 y requisitos del operador de red con un profesional competente.</p>
          </div>
          <div className="panel">
            <h3>Acciones del resumen</h3>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button className="primary" onClick={print}><Printer size={17}/> Imprimir / Guardar resumen en PDF</button>
              <button className="secondary" onClick={save}><Save size={17}/> Guardar proyecto</button>
            </div>
          </div>
          <div className="notice"><CheckCircle2 size={18}/> Resumen actualizado automÃƒÂ¡ticamente con los datos de las demÃƒÂ¡s secciones. El catÃƒÂ¡logo comercial se mantiene independiente.</div>
        </>;

    }
  };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen?"open":""}`}>
      <div className="logo"><div className="logo-icon"><Sun/></div><div><b>SOLAR <em>PRO</em></b><small>DISEÃƒâ€˜O FOTOVOLTAICO</small></div><button className="close-menu" onClick={()=>setMobileOpen(false)}><X/></button></div>
      <div className="side-label">ESPACIO DE TRABAJO</div>
      <nav>{navItems.map(([label,Icon])=><button key={label} className={active===label?"nav-item active":"nav-item"} onClick={()=>{setActive(label);setMobileOpen(false)}}><Icon size={18}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="status-dot"></div><span>Motor de cÃƒÂ¡lculo local</span><small>VersiÃƒÂ³n 2.0</small></div>
    </aside>
    {mobileOpen&&<div className="scrim" onClick={()=>setMobileOpen(false)}></div>}
    <main className="main-area">
      <header className="topbar">
        <button className="mobile-menu" onClick={()=>setMobileOpen(true)}><Menu/></button>
        <div className="breadcrumb">SOLAR PRO <ChevronRight size={14}/><b>{active}</b></div>
        <div className="top-actions">
          <button
  className="secondary"
  onClick={() => {
    setMostrarProyectos(true);
    cargarProyectos();
  }}
>
  <FileText size={16} />
  Mis proyectos
</button>
  <span style={{fontSize:"13px", color:"#64748b"}}>
    {profile?.nombre || profile?.email}
  </span>

  <button className="secondary" onClick={reset}>
    <Trash2 size={16}/> Restablecer
  </button>

  <button
  className="primary"
  onClick={async () => {
    const nombre = window.prompt(
      "Escribe el nombre del proyecto:",
      nombreProyecto
    );

    if (nombre === null) return;

    await guardarProyectoNube(nombre);
  }}
  disabled={cargandoProyectos}
>
  <Save size={16}/>
  {cargandoProyectos ? "Guardando..." : "Guardar proyecto"}
</button>
  {profile?.rol === "administrador" && (
  <button
    className="secondary"
    onClick={() => setAdminView(true)}
  >
    <ShieldCheck size={16} />
    AdministraciÃƒÂ³n
  </button>
)}

  <button
    className="secondary"
    onClick={async () => {
      try {
        await cerrarSesion();
      } catch (error) {
        setAuthError(error.message);
      }
    }}
  >
    Cerrar sesiÃƒÂ³n
  </button>
</div>
      </header>
      <div className="notice" role="status" aria-live="polite" style={{margin:"12px 24px",borderColor:activeEngineeringState===ENGINEERING_STATES.INVALID?"#d92d20":activeEngineeringState===ENGINEERING_STATES.FAIL?"#b42318":"#d0d5dd",background:activeEngineeringState===ENGINEERING_STATES.INVALID?"#fef3f2":undefined}}>
        <AlertTriangle size={18}/><span><b>Estado de {active}:</b> {activeEngineeringState}. {calc.numericValidation?.invalid?.length ? calc.numericValidation.invalid.map(item=>item.message).join(" ") : "Los datos ausentes y validaciones de ficha se mantienen como pendientes."}</span>
      </div>
      {mostrarProyectos && (
  <div style={{
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px"
  }}>
    <div style={{
      background: "white",
      width: "100%",
      maxWidth: "750px",
      maxHeight: "85vh",
      overflowY: "auto",
      borderRadius: "14px",
      padding: "25px"
    }}>

      <h2>Mis proyectos solares</h2>

      <button
  className="primary"
  onClick={() => {
    nuevoProyecto();
    setMostrarProyectos(false);
  }}
>
  + Crear proyecto nuevo
</button>

      <button
        className="secondary"
        onClick={cargarProyectos}
        style={{ marginLeft: "10px" }}
      >
        Actualizar lista
      </button>

      <button
        className="secondary"
        onClick={() => setMostrarProyectos(false)}
        style={{ float: "right" }}
      >
        Cerrar
      </button>

      <hr />

      {cargandoProyectos && <p>Consultando proyectos...</p>}

      {proyectos.map((proyecto) => (
        <div
          key={proyecto.id}
          style={{
            border: "1px solid #dbe3ec",
            borderRadius: "9px",
            padding: "15px",
            marginTop: "12px"
          }}
        >
          <h3>{proyecto.nombre}</h3>

          <button
            className="primary"
            onClick={() => {
              abrirProyecto(proyecto);
              setMostrarProyectos(false);
            }}
          >
            Abrir
          </button>

          <button
            className="secondary"
            onClick={() => eliminarProyecto(proyecto.id)}
            style={{ marginLeft: "10px" }}
          >
            Eliminar
          </button>
        </div>
      ))}

      {!cargandoProyectos && proyectos.length === 0 && (
        <p>AÃƒÂºn no tienes proyectos guardados.</p>
      )}

    </div>
  </div>
)}
     <div className="page-content">

  {authMessage && (
    <div style={{
      background: "#e8f5e9",
      color: "#237a42",
      padding: "12px 16px",
      borderRadius: "8px",
      marginBottom: "15px",
      fontWeight: "600"
    }}>
      {authMessage}
    </div>
  )}

  {authError && (
    <div style={{
      background: "#ffebee",
      color: "#c62828",
      padding: "12px 16px",
      borderRadius: "8px",
      marginBottom: "15px"
    }}>
      {authError}
    </div>
  )}

  {content()}

  <footer>
    Ã‚Â© {new Date().getFullYear()} SOLAR PRO Ã‚Â· Predimensionamiento.
    ValidaciÃƒÂ³n profesional obligatoria antes de construir.
  </footer>

</div>
    </main>
  </div>;
}
