# 🏗️ Arquitectura General del Sistema y Persistencia Relacional Avanzada

El ecosistema de software de **SneakerHub Ayacucho** está estructurado bajo un enfoque de desarrollo full-stack desacoplado. El núcleo del sistema consta de un backend API RESTful asíncrono de alto rendimiento impulsado por **FastAPI** y un cliente web SPA moderno desarrollado en **React** y optimizado mediante **Vite**.

---

## 🗂️ 1. Patrón de Diseño y Estructura Real de Módulos (Full-Stack)

De acuerdo con el árbol de directorios del espacio de trabajo, el proyecto se divide en tres componentes independientes de alto nivel: la documentación técnica corporativa (`specs/`), el motor de servicios relacionales (`backend/`) y la interfaz de usuario de vitrina comercial (`frontend/`).

```text
sneakerhub/
├── backend/                       # Componente del Servidor de Servicios API
│   ├── app/                       # Núcleo ejecutable de la aplicación FastAPI
│   │   ├── core/                  # Módulos centrales de configuración y seguridad perimetral
│   │   │   ├── config.py          # Gestión de variables de entorno y constantes del sistema
│   │   │   └── security.py        # Algoritmos de hash criptográfico y firmas JWT
│   │   ├── models/                # Modelos ORM Declarativos de SQLAlchemy (Esquema MySQL)
│   │   │   ├── __init__.py        # Inicializador y registro de metadatos de persistencia
│   │   │   ├── order.py           # Estructuras relacionales de transacciones y pedidos
│   │   │   ├── product.py         # Fichas técnicas base de marcas, categorías y calzado
│   │   │   ├── user.py            # Gestión de cuentas de clientes y administradores
│   │   │   └── variant.py         # Sub-tablas relacionales de colores, fotos y stock físico
│   │   ├── routers/               # Capa de Controladores / Exposición de Endpoints REST
│   │   │   ├── __init__.py
│   │   │   ├── auth.py            # Autenticación, registro perimetral y manejo de sesiones
│   │   │   ├── orders.py          # Procesamiento de carritos y checkout transaccional
│   │   │   ├── products.py        # Gestión CRUD y consultas elásticas de vitrina
│   │   │   └── reports.py         # Telemetría de bajo stock y reportes de auditoría
│   │   ├── schemas/               # Esquemas de validación estructural de datos (Pydantic)
│   │   │   ├── __init__.py
│   │   │   ├── product.py         # Payloads de entrada y salida para calzado comercial
│   │   │   └── variant.py         # Estructuras estrictas para variantes cromáticas y tallas
│   │   ├── database.py            # Configuración del motor de persistencia y pool de conexiones
│   │   └── main.py                # Punto de entrada de la aplicación y middlewares globales
│   ├── tests/                     # Suite de pruebas unitarias mediadas por Pytest
│   ├── requirements.txt           # Manifiesto oficial de dependencias de Python
│   └── seed_tallas.py             # Script independiente para la hidratación base de stock en la BD
│
├── frontend/                      # Componente de Interfaz de Usuario Web (SPA)
│   ├── public/                    # Archivos estáticos globales e imágenes multimedia del catálogo
│   ├── src/                       # Código fuente de la interfaz reactiva
│   │   ├── assets/                # Recursos locales (estilos, logotipos regionales)
│   │   ├── components/            # Componentes modulares reutilizables de UI
│   │   ├── api.js                 # Cliente HTTP de comunicación asíncrona con el backend
│   │   ├── App.jsx                # Componente raíz y enrutamiento del cliente web
│   │   ├── main.jsx               # Punto de montaje del árbol DOM de React
│   │   └── index.css              # Directivas globales de inyección de estilos
│   ├── .oxlintrc.json             # Reglas de optimización y análisis estático con Oxlint
│   ├── tailwind.config.js         # Configuraciones del motor de diseño CSS utilitario
│   └── vite.config.js             # Orquestador de empaquetado y compilación en caliente
│
└── specs/                         # Artefactos de Ingeniería y Especificación Técnica (Specs)
```

---

## 🛡️ 2. Control de Middleware Perimetral y Reglas CORS

Para neutralizar las restricciones de seguridad del navegador impuestas por la política de mismo origen (*Same-Origin Policy*), el archivo central `backend/app/main.py` integra de forma explícita el componente `CORSMiddleware`. Esto habilita la intercomunicación segura con el ecosistema de desarrollo y producción del Frontend administrado por Vite.

### Especificaciones de Control de Acceso:
* **Orígenes de Confianza Autorizados:** `http://localhost:5173` y `http://127.0.0.1:5173` (Puertos locales por defecto asignados por el servidor de Vite).
* **Métodos HTTP Permitidos:** `["*"]` (Habilita de manera irrestricta operaciones de lectura y mutación mediante `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`).
* **Cabeceras Soportadas:** `["*"]` (Habilita la transferencia de metadatos personalizados y tokens de cabecera indispensables como `Authorization: Bearer <JWT>`).
* **Flujo de Credenciales:** Configurado en verdadero (`allow_credentials=True`), permitiendo el intercambio seguro de firmas digitales en peticiones asíncronas originadas desde `api.js`.

---

## 🔐 3. Arquitectura de Seguridad y Flujo de Sesión (JWT)

El control de accesos y la protección de endpoints críticos operan de forma descentralizada mediante tokens web JSON (**JWT**), aislando la lógica criptográfica en `backend/app/core/security.py`. El ciclo de vida de una solicitud protegida sigue el siguiente flujo lógico:

1. **Extracción:** El framework intercepta la petición entrante en los controladores (`routers/`) a través del esquema `OAuth2PasswordBearer`, buscando la cabecera `Authorization`.
2. **Descodificación:** Utilizando la librería `python-jose`, el sistema intenta desencriptar la cadena criptográfica utilizando el algoritmo **HS256** y la firma simétrica privada `SECRET_KEY` inyectada desde `core/config.py`.
3. **Validación de Roles:** Una vez descodificado el payload, el sistema extrae las claims (`sub` para correo electrónico y `rol` para jerarquía). El guardián restrictivo de dependencias `verificar_admin` ejecuta una validación booleana estricta:

$$ \text{Acceso Concedido} \iff \text{Token Válido} \land (\text{rol} \equiv \text{"admin"}) $$

Cualquier firma alterada, token expirado o desviación en el rol jerárquico del payload aborta la operación inmediatamente emitiendo un código de estado `HTTP 401 Unauthorized` o `HTTP 403 Forbidden`.

---

## 📊 4. Capa de Persistencia y Ciclo de Sesiones del ORM

La base de datos opera sobre el motor transaccional **InnoDB** de MySQL, el cual garantiza el cumplimiento absoluto de las propiedades **ACID** (Atomicidad, Consistencia, Aislamiento y Durabilidad). La administración se centraliza en `backend/app/database.py`.

### Configuración del Pool de Conexiones:
Para maximizar el rendimiento y optimizar la memoria del servidor frente a accesos concurrentes de usuarios en la plataforma, SQLAlchemy gestiona un pool elástico de hilos de conexión activa:
* `pool_size=10`: Mantiene un mínimo de 10 conexiones persistentes abiertas en memoria y listas para su reutilización inmediata.
* `max_overflow=20`: Permite abrir hasta 20 conexiones adicionales en momentos de alta demanda transaccional (ej. campañas de descuento o checkout masivo de pedidos).

### Inyección de Dependencias y Ciclo del Generador (`get_db`):
El ciclo de vida de cada consulta SQL se administra de forma atómica mediante el patrón de inyección de dependencias de FastAPI utilizando un generador con la instrucción `yield`:

```python
def get_db():
    db = SessionLocal()
    try:
        yield db  # Provee la conexión activa al controlador que la solicita
    finally:
        db.close()  # Libera y retorna la conexión al pool de forma obligatoria
```
Este diseño garantiza que, ante cualquier fallo crítico o excepción imprevista en las rutas, la conexión a MySQL se cierre de forma segura, evitando fugas de memoria o bloqueos de tablas en la base de datos.

---

## 🗺️ 5. Modelo Entidad-Relación e Integridad Estructural

La persistencia se fundamenta en un acoplamiento profundo de integridad de base de datos relacional definido en los modelos declarativos de `app/models/`. Ningún elemento puede existir de forma huérfana en el sistema, lo que se protege mediante restricciones estructurales de claves foráneas (`FOREIGN KEY`) y políticas estrictas de nulidad (`NOT NULL`):

```text
  [Marca] (id) <──────┐
                      │ (Relación Relacional 1:N)
[Categoría] (id) <────┼─── [Producto] (id) <─── (1:N) ─── [VarianteColor] (id) <─── (1:N) ─── [TallaStock] (id)
```

* **Producto (`product.py`)**: Almacena la ficha técnica comercial base (`nombre`, `precio_base`, `porcentaje_descuento`, `descripcion`, `estado`). Mantiene relaciones restrictivas rígidas hacia las entidades maestras de `Marca` y `Categoria`.
* **VarianteColor y TallaStock (`variant.py`)**: Sub-tablas que particionan el calzado por atributos cromáticos específicos, controlan la galería de enlaces de imágenes multimedia y administran la matriz de existencias físicas disponibles en almacén agrupadas por tallas.

---

## 🏎️ 6. Mitigación del Problema N+1 mediante Carga Profunda Eager (`joinedload`)

En las bases de datos relacionales mediadas por un ORM, un error clásico de rendimiento es el problema de **Consultas $N+1$**. Esto ocurre cuando el sistema realiza una consulta inicial para traer los productos (1 consulta) y luego, de forma perezosa (*Lazy Loading*), ejecuta una consulta adicional por cada producto individual para traer sus colecciones hijas de imágenes o tallas ($N$ consultas), colapsando el canal de comunicación con MySQL.

### Solución Algorítmica Implementada:
El endpoint analítico de búsqueda de vitrina pública (`GET /api/productos/buscar`) anula este comportamiento ineficiente. En su lugar, inyecta operaciones de **Carga Profunda Eager (`joinedload`)** encadenadas en la misma consulta:

```python
query = db.query(Producto).options(
    joinedload(Producto.marca),
    joinedload(Producto.categoria),
    joinedload(Producto.variantes_color).joinedload(VarianteColor.tallares_stock),
    joinedload(Producto.variantes_color).joinedload(VarianteColor.imagenes)
)
```

### Impacto en la Complejidad Temporal:
Este enfoque instruye a SQLAlchemy a construir una única sentencia SQL compleja utilizando cláusulas `LEFT OUTER JOIN`. 

* **Complejidad Sin Optimización (Lazy):** $O(N)$ consultas individuales hacia la base de datos.
* **Complejidad Con Optimización (Eager):** $O(1)$ una única consulta atómica y consolidada.

El motor de MySQL procesa e indexa todo el árbol relacional en un solo viaje, devolviendo una respuesta JSON íntegra, estructurada y optimizada para el renderizado instantáneo en los componentes del cliente frontend.