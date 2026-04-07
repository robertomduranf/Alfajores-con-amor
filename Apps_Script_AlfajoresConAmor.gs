// ============================================================
//  APPS SCRIPT — Alfajores con Amor Control System v2
//  Hojas: Recibos, Productos, Clientes, GastosFijos,
//         Config, Usuarios, Deudores, Puntos
// ============================================================

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(name) {
  var ss = getSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function doPost(e) {
  var result = { status: 'error', msg: 'Accion desconocida' };
  try {
    var payload = JSON.parse(e.postData.contents);
    var accion  = payload.accion;
    var data    = payload.data;
    if (accion === 'ping')            result = { status: 'ok', msg: 'Conexion exitosa' };
    if (accion === 'getAll')          result = accionGetAll();
    if (accion === 'saveReceipt')     result = accionSaveReceipt(data);
    if (accion === 'saveCliente')     result = accionSaveClientes(data);
    if (accion === 'saveProducto')    result = accionSaveProductos(data);
    if (accion === 'deleteProducto')  result = accionDeleteProducto(data);
    if (accion === 'saveGastosFijos') result = accionSaveGastosFijos(data);
    if (accion === 'saveConfig')      result = accionSaveConfig(data);
    if (accion === 'saveDeudor')      result = accionSaveDeudores(data);
    if (accion === 'pagarDeudor')     result = accionPagarDeudor(data);
    if (accion === 'savePuntos')      result = accionSavePuntos(data);
  } catch (err) {
    result = { status: 'error', msg: err.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', msg: 'API activa v2' })).setMimeType(ContentService.MimeType.JSON);
}

function accionGetAll() {
  return {
    status: 'ok',
    recibos:     sheetToArray('Recibos'),
    productos:   sheetToArray('Productos'),
    clientes:    sheetToArray('Clientes'),
    gastosFijos: sheetToArray('GastosFijos'),
    deudores:    sheetToArray('Deudores'),
    puntos:      sheetToArray('Puntos'),
    config:      sheetToObject('Config'),
    usuarios:    sheetToArray('Usuarios')
  };
}

function accionSaveReceipt(rec) {
  var sh = getSheet('Recibos');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['id','tipo','fecha','descripcion','cantidad','valor','total','cliente','tel','responsable','recibo','notas','pago','fechaCobro','ts']);
    sh.getRange(1,1,1,15).setFontWeight('bold'); sh.setFrozenRows(1);
  }
  sh.appendRow([rec.id,rec.tipo,rec.fecha,rec.descripcion,rec.cantidad,rec.valor,rec.total,
    rec.cliente||'',rec.tel||'',rec.responsable,rec.recibo,rec.notas||'',
    rec.pago||'contado',rec.fechaCobro||'',rec.ts]);
  return { status: 'ok' };
}

function accionSaveClientes(clientes) {
  var sh = getSheet('Clientes');
  sh.clearContents();
  sh.appendRow(['id','nombre','tel','email','ciudad','notas']);
  sh.getRange(1,1,1,6).setFontWeight('bold');
  clientes.forEach(function(c){ sh.appendRow([c.id,c.nombre,c.tel||'',c.email||'',c.ciudad||'',c.notas||'']); });
  return { status: 'ok' };
}

function accionSaveProductos(productos) {
  var sh = getSheet('Productos');
  sh.clearContents();
  sh.appendRow(['id','nombre','precio','costo','categoria','descripcion']);
  sh.getRange(1,1,1,6).setFontWeight('bold');
  productos.forEach(function(p){ sh.appendRow([p.id,p.nombre,p.precio,p.costo||0,p.categoria||'',p.descripcion||'']); });
  return { status: 'ok' };
}

function accionDeleteProducto(data) {
  var sh = getSheet('Productos');
  var values = sh.getDataRange().getValues();
  for (var i = values.length-1; i >= 1; i--) {
    if (String(values[i][0]) === String(data.id)) { sh.deleteRow(i+1); break; }
  }
  return { status: 'ok' };
}

function accionSaveGastosFijos(gastosFijos) {
  var sh = getSheet('GastosFijos');
  sh.clearContents();
  sh.appendRow(['anio','concepto','valor']);
  sh.getRange(1,1,1,3).setFontWeight('bold');
  Object.keys(gastosFijos).forEach(function(anio) {
    var gf = gastosFijos[anio];
    if (Array.isArray(gf)) gf.forEach(function(g){ sh.appendRow([anio,g.concepto||'',g.valor||0]); });
  });
  return { status: 'ok' };
}

function accionSaveDeudores(deudores) {
  var sh = getSheet('Deudores');
  sh.clearContents();
  sh.appendRow(['id','reciboId','clienteNombre','tel','valor','fechaCobro','estado','ts']);
  sh.getRange(1,1,1,8).setFontWeight('bold');
  if (Array.isArray(deudores)) {
    deudores.forEach(function(d){
      sh.appendRow([d.id,d.reciboId||'',d.clienteNombre,d.tel||'',d.valor,d.fechaCobro,d.estado,d.ts]);
    });
  }
  return { status: 'ok' };
}

function accionPagarDeudor(data) {
  var sh = getSheet('Deudores');
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(data.id)) { sh.getRange(i+1,7).setValue('pagado'); break; }
  }
  return { status: 'ok' };
}

function accionSavePuntos(puntos) {
  var sh = getSheet('Puntos');
  sh.clearContents();
  sh.appendRow(['clienteKey','nombre','total','historial']);
  sh.getRange(1,1,1,4).setFontWeight('bold');
  Object.keys(puntos).forEach(function(key){
    var p = puntos[key];
    sh.appendRow([key,p.nombre,p.total,JSON.stringify(p.historial||[])]);
  });
  return { status: 'ok' };
}

function accionSaveConfig(config) {
  var sh = getSheet('Config');
  sh.clearContents();
  sh.appendRow(['clave','valor']);
  sh.getRange(1,1,1,2).setFontWeight('bold');
  var keys = ['gasUrl','waPrefijo','waMsgTemplate','waMsgCobro','waMsgPuntos',
              'waMsgPostventa','ptosPorMil','ptosReferido','ptosUmbral',
              'descuentoPct','bonoDias','consec1','consec2'];
  keys.forEach(function(k){ if (config[k] !== undefined) sh.appendRow([k, config[k]]); });
  if (config.postventaEnviados) sh.appendRow(['postventaEnviados', JSON.stringify(config.postventaEnviados)]);
  var su = getSheet('Usuarios');
  su.clearContents();
  su.appendRow(['id','nombre','username','password','rol']);
  su.getRange(1,1,1,5).setFontWeight('bold');
  if (config.usuarios && Array.isArray(config.usuarios)) {
    config.usuarios.forEach(function(u){ su.appendRow([u.id,u.nombre,u.username,u.password,u.rol]); });
  }
  return { status: 'ok' };
}

function setupHojas() {
  var hojas = {
    'Recibos':    ['id','tipo','fecha','descripcion','cantidad','valor','total','cliente','tel','responsable','recibo','notas','pago','fechaCobro','ts'],
    'Productos':  ['id','nombre','precio','costo','categoria','descripcion'],
    'Clientes':   ['id','nombre','tel','email','ciudad','notas'],
    'GastosFijos':['anio','concepto','valor'],
    'Deudores':   ['id','reciboId','clienteNombre','tel','valor','fechaCobro','estado','ts'],
    'Puntos':     ['clienteKey','nombre','total','historial'],
    'Config':     ['clave','valor'],
    'Usuarios':   ['id','nombre','username','password','rol']
  };
  Object.keys(hojas).forEach(function(nombre) {
    var sh = getSheet(nombre);
    if (sh.getLastRow() === 0) {
      sh.appendRow(hojas[nombre]);
      sh.getRange(1,1,1,hojas[nombre].length).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });
  var cfg = getSheet('Config');
  if (cfg.getLastRow() <= 1) {
    cfg.appendRow(['waPrefijo','57']);
    cfg.appendRow(['waMsgTemplate','Hola {nombre}, gracias por tu compra en Alfajores con Amor!']);
    cfg.appendRow(['waMsgCobro','Hola {nombre}, te recordamos que manana {fecha} acordamos el pago de ${valor}.']);
    cfg.appendRow(['waMsgPuntos','Hola {nombre}, tienes {puntos} Puntos Dulces! Ganaste {descuento}% de descuento hasta {fecha}.']);
    cfg.appendRow(['waMsgPostventa','Hola {nombre}, que tal te parecieron los Alfajores? Tu opinion es muy importante para nosotros!']);
    cfg.appendRow(['ptosPorMil',1]); cfg.appendRow(['ptosReferido',50]);
    cfg.appendRow(['ptosUmbral',100]); cfg.appendRow(['descuentoPct',10]);
    cfg.appendRow(['bonoDias',30]); cfg.appendRow(['consec1',1]); cfg.appendRow(['consec2',1]);
  }
  var usu = getSheet('Usuarios');
  if (usu.getLastRow() <= 1) {
    usu.appendRow(['u1','Katherine','Katherine','1818','admin']);
    usu.appendRow(['u2','Roberto','Roberto','1313','admin']);
  }
  SpreadsheetApp.getUi().alert('Hojas creadas correctamente!');
}

function sheetToArray(name) {
  var sh = getSheet(name);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  return values.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h,i){ obj[h] = row[i]; });
    return obj;
  });
}

function sheetToObject(name) {
  var sh = getSheet(name);
  var values = sh.getDataRange().getValues();
  var obj = {};
  values.slice(1).forEach(function(row){ if(row[0]) obj[row[0]] = row[1]; });
  return obj;
}
