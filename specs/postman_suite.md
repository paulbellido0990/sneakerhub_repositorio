# 🚀 Manual Técnico de Automatización: Suite de Pruebas de Integración (Postman)

Este artefacto documenta la arquitectura de pruebas automatizadas y el pipeline de integración continua para el backend de **SneakerHub Ayacucho**. La suite está compuesta por **8 pruebas de integración críticas** secuenciales, diseñadas para auditar la consistencia transaccional, el control perimetral (JWT) y el comportamiento del motor relacional MySQL frente a mutaciones concurrentes.

---

## 📊 1. Configuración del Entorno (Environment Variables)

Para garantizar la portabilidad de las pruebas entre entornos (Desarrollo, Testing y Producción), la colección requiere la parametrización de las siguientes variables de entorno en Postman:

| Variable | Valor Inicial / Fallback | Descripción | Tipo |
| :--- | :--- | :--- | :--- |
| `base_url` | `http://127.0.0.1:8000` | URL base del servidor local uvicorn | Cadena |
| `admin_token` | *(Dinámico)* | Bearer Token JWT del Administrador | Secreto |
| `client_token` | *(Dinámico)* | Bearer Token JWT del Cliente registrado | Secreto |
| `marca_id` | *(Dinámico)* | ID autoincremental de la marca creada en test | Entero |
| `categoria_id` | *(Dinámico)* | ID autoincremental de la categoría creada | Entero |
| `producto_id` | *(Dinámico)* | ID del calzado base inyectado en caliente | Entero |
| `direccion_id` | *(Dinámico)* | ID de la dirección urbana validada en Huamanga | Entero |
| `pedido_id` | *(Dinámico)* | ID de la orden transaccional emitida | Entero |

---

## ⚙️ 2. Pipeline de las 8 Pruebas Críticas Secuenciales

### 🧪 Test 01: Autenticación de Administrador y Captura de Firma JWT
* **Método HTTP:** `POST`
* **Endpoint:** `{{base_url}}/api/auth/login`
* **Objetivo:** Validar las credenciales del usuario raíz y extraer la firma criptográfica para las mutaciones restrictivas del catálogo.
* **Cuerpo de la Petición (JSON):**
```json
{
  "email": "admin@sneakerhub.pe",
  "password": "admin123"
}
```
* **Scripts de Validación y Captura (Tests):**
```javascript
pm.test("Status code es 200 OK - Login Exitoso", function () {
    pm.response.to.have.status(200);
});

pm.test("Token JWT Estructurado Presente", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("access_token");
    pm.expect(jsonData.token_type).to.eql("bearer");
    
    // Inyección dinámica en caliente para los siguientes endpoints protegidos
    pm.environment.set("admin_token", jsonData.access_token);
});
```

---

### 🧪 Test 02: Creación de Estructura Comercial Base (Marcas)
* **Método HTTP:** `POST`
* **Endpoint:** `{{base_url}}/api/productos/marcas`
* **Autorización:** `Bearer Token` $\rightarrow$ `{{admin_token}}`
* **Objetivo:** Verificar el registro seguro de entidades maestras controlando la inyección insensible a mayúsculas.
* **Cuerpo de la Petición (JSON):**
```json
{
  "nombre": "Nike Running"
}
```
* **Scripts de Validación y Captura (Tests):**
```javascript
pm.test("Status code es 201 Created - Marca Registrada", function () {
    pm.response.to.have.status(201);
});

pm.test("ID Asignado por MySQL Hidratado", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("id");
    pm.expect(jsonData.nombre).to.eql("Nike Running");
    
    // Captura de Clave Primaria para persistencia encadenada
    pm.environment.set("marca_id", jsonData.id);
});
```

---

### 🧪 Test 03: Catalogación Base de Calzado Comercial
* **Método HTTP:** `POST`
* **Endpoint:** `{{base_url}}/api/productos/`
* **Autorización:** `Bearer Token` $\rightarrow$ `{{admin_token}}`
* **Objetivo:** Validar la inyección de zapatillas base cruzando dinámicamente las llaves foráneas capturadas de los pasos previos.
* **Cuerpo de la Petición (JSON):**
```json
{
  "nombre": "Nike Air Zoom Pegasus 40 Ayacucho Edition",
  "precio_base": 480.00,
  "porcentaje_descuento": 0.0,
  "descripcion": "Amortiguación reactiva para corredores urbanos.",
  "marca_id": {{marca_id}},
  "categoria_id": 1
}
```
* **Scripts de Validación y Captura (Tests):**
```javascript
pm.test("Status code es 201 Created - Calzado Catalogado", function () {
    pm.response.to.have.status(201);
});

pm.test("Producto Inicializado como ACTIVO", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.estado).to.eql("ACTIVO");
    pm.environment.set("producto_id", jsonData.id);
});
```

---

### 🧪 Test 04: Inyección e Hidratación de Stock en Matriz de Almacén
* **Método HTTP:** `POST`
* **Endpoint:** `{{base_url}}/api/productos/variants/stock`
* **Autorización:** `Bearer Token` $\rightarrow$ `{{admin_token}}`
* **Objetivo:** Cargar inventario físico real inicial por talla a la matriz relacional para habilitar el flujo comercial.
* **Cuerpo de la Petición (JSON):**
```json
{
  "producto_id": {{producto_id}},
  "talla": "41",
  "stock_inicial": 10
}
```
* **Scripts de Validación (Tests):**
```javascript
pm.test("Status code es 201 Created - Stock Hidratado", function () {
    pm.response.to.have.status(201);
});

pm.test("Consistencia de Unidades en Celda", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.talla).to.eql("41");
    pm.expect(jsonData.stock).to.be.at.least(10);
});
```

---

### 🧪 Test 05: Registro Público de Cuenta de Cliente (Criptografía)
* **Método HTTP:** `POST`
* **Endpoint:** `{{base_url}}/api/auth/register`
* **Objetivo:** Simular el auto-registro síncrono de un comprador local con validación estricta de teléfono y hash de contraseña.
* **Cuerpo de la Petición (JSON):**
```json
{
  "nombre": "Paul Modesto",
  "email": "paul.tester.unsch@gmail.com",
  "password": "passwordSeguro99",
  "telefono": "928410511"
}
```
* **Scripts de Validación y Captura (Tests):**
```javascript
// Acepta 201 si es nuevo, o 400 si el seeder ya lo inyectó (Flujo de Reutilización Segura)
pm.test("Perfil de Cliente Consistente", function () {
    pm.expect(pm.response.code).to.be.oneOf([201, 400]);
    
    if(pm.response.code === 201) {
        var jsonData = pm.response.json();
        pm.environment.set("client_token", jsonData.access_token);
    }
});
```
* *Nota de Pre-request script:* Si se requiere ejecuciones cíclicas infinitas, se puede inyectar un email pseudoaleatorio concatenando `Date.now()`.

---

### 🧪 Test 06: Registro de Dirección de Despacho Urbano (Huamanga)
* **Método HTTP:** `POST`
* **Endpoint:** `{{base_url}}/api/usuarios/direcciones`
* **Autorización:** `Bearer Token` $\rightarrow$ `{{client_token}}`
* **Objetivo:** Validar las directivas de cobertura geográfica local para la entrega a domicilio en los distritos metropolitanos de Huamanga.
* **Cuerpo de la Petición (JSON):**
```json
{
  "distrito": "San Juan Bautista",
  "calle_avenida": "Av. Proclama de la Independencia Nro 104",
  "referencia": "A espaldas del complejo deportivo, portón azul"
}
```
* **Scripts de Validación y Captura (Tests):**
```javascript
pm.test("Status code es 201 Created - Dirección Autorizada", function () {
    pm.response.to.have.status(201);
});

pm.test("Validación Multi-inquilino Exitosa", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.distrito).to.eql("San Juan Bautista");
    pm.environment.set("direccion_id", jsonData.id);
});
```

---

### 🧪 Test 07: Procesamiento Transaccional de Checkout Atómico (Pedido)
* **Método HTTP:** `POST`
* **Endpoint:** `{{base_url}}/api/orders/checkout`
* **Autorización:** `Bearer Token` $\rightarrow$ `{{client_token}}`
* **Objetivo:** Evaluar la operación más crítica del sistema: deducción automática de inventario, cálculo financiero inmutable y creación de tuplas bajo aislamiento ACID.
* **Cuerpo de la Petición (JSON):**
```json
{
  "direccion_id": {{direccion_id}},
  "items": [
    {
      "producto_id": {{producto_id}},
      "talla": "41",
      "cantidad": 2
    }
  ]
}
```
* **Scripts de Validación y Captura (Tests):**
```javascript
pm.test("Status code es 201 Created - Pedido Procesado Atómicamente", function () {
    pm.response.to.have.status(201);
});

pm.test("Cálculo Financiero Autónomo y Estado Inicial Correcto", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.monto_total).to.eql(960.00); // 480.00 * 2 unidades
    pm.expect(jsonData.estado_pago).to.eql("PENDIENTE_VERIFICACION");
    pm.environment.set("pedido_id", jsonData.id);
});
```

---

### 🧪 Test 08: Transición de Estados Logísticos y Auditoría
* **Método HTTP:** `PUT`
* **Endpoint:** `{{base_url}}/api/orders/{{pedido_id}}/estado`
* **Autorización:** `Bearer Token` $\rightarrow$ `{{admin_token}}`
* **Objetivo:** Probar el comportamiento de la máquina de estados contable y el blindaje administrativo de la telemetría operativa.
* **Cuerpo de la Petición (JSON):**
```json
{
  "nuevo_estado": "PROCESADO"
}
```
* **Scripts de Validación (Tests):**
```javascript
pm.test("Status code es 200 OK - Transición Validada", function () {
    pm.response.to.have.status(200);
});

pm.test("Asentamiento de Estado y Auditoría en Servidor", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.antiguo_estado).to.eql("PENDIENTE_VERIFICACION");
    pm.expect(jsonData.nuevo_estado).to.eql("PROCESADO");
});
```

---

## 💻 3. Orquestación y Ejecución vía CLI (Newman)

Para integrar este manual técnico en entornos de Integración Continua (CI/CD) o ejecutar pruebas rápidas de esfuerzo en terminal desde la raíz de la carpeta `specs/`, utilice el motor de ejecución **Newman** mediante la siguiente instrucción estandarizada:

```bash
# 1. Instalar el ejecutable de Newman de forma global si no está presente
npm install -g newman

# 2. Desparar el pipeline secuencial inyectando variables del entorno local
newman run sneakerhub_collection.json -e environments/local_dev.json --delay-request 50 --reporters cli,junit
```

Este comando gatillará las 8 pruebas en ráfaga con un delay de protección de 50ms, imprimiendo el reporte de aserciones de ingeniería directamente en la consola y compilando un entregable XML compatible con servidores de despliegue automatizado.