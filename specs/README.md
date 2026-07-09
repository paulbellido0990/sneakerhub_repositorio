# 📋 Directorio Oficial de Especificaciones Técnicas (Specs) - SneakerHub Ayacucho

Este directorio constituye el núcleo de gobernanza técnica, diseño arquitectónico y aseguramiento de la calidad (QA) para el ecosistema full-stack de **SneakerHub Ayacucho**. 

Los artefactos contenidos en este repositorio han sido estructurados bajo los lineamientos de la escuela profesional de **Ingeniería de Sistemas de la Universidad Nacional de San Cristóbal de Huamanga (UNSCH)**, garantizando el rigor formal en la gestión de transacciones concurrentes, seguridad perimetral descentralizada y optimización del rendimiento en entornos de red locales.

---

## 🗂️ 1. Mapa de Documentación y Artefactos de Ingeniería

| Documento | Módulo Técnico | Descripción | Estándar Aplicado |
| :--- | :--- | :--- | :--- |
| [🏗️ `arquitectura_general.md`](./arquitectura_general.md) | **Infraestructura & Datos** | Detalle de la arquitectura modular Controller-Service-Repository, políticas CORS elásticas, pool de conexiones y mitigación explícita del problema de consultas N+1 en MySQL. | SQLAlchemy v2.0 & InnoDB |
| [📋 `historias_de_usuario.md`](./historias_de_usuario.md) | **Lógica de Negocio** | Catálogo técnico de las 15 Historias de Usuario troncales del sistema distribuidas en 3 módulos cohesivos, incluyendo contratos de datos y lógica algorítmica de controladores. | Pydantic v2.6 & FastAPI |
| [🚀 `postman_suite.md`](./postman_suite.md) | **Aseguramiento de Calidad** | Manual de automatización del pipeline de pruebas funcionales y de integración compuesto por 8 tests secuenciales con inyección dinámica de variables. | Postman API & Newman CLI |

---

## 🛠️ 2. Stack Tecnológico de Referencia

* **Capa de Datos:** MySQL Server 8.0 (Motor transaccional transacciones ACID InnoDB).
* **Capa del Servidor (Backend):** FastAPI 0.110 (Asíncrono, tipado estricto) + SQLAlchemy ORM.
* **Capa del Cliente (Frontend):** React SPA (Vite + Tailwind CSS) + Oxlint (Análisis estático).
* **Subsistema de Seguridad:** Cifrado criptográfico con Bcrypt + Firmas simétricas JWT (HS256).

---

## 🚀 3. Pipeline de Despliegue del Entorno de Desarrollo

Para levantar y auditar localmente los dos componentes principales del espacio de trabajo en la provincia de Huamanga, ejecute de forma secuencial las siguientes instrucciones en su terminal:

### 📥 Paso A: Inicialización y Despliegue del Backend
```bash
# 1. Posicionarse en el directorio del servidor
cd backend

# 2. Instanciar el entorno virtual aislado (venv)
python -m venv venv

# 3. Activar el entorno virtual
# En Windows:
.\venv\Scripts\activate
# En Linux/macOS:
source venv/bin/activate

# 4. Instalar el manifiesto oficial de dependencias
pip install -r requirements.txt

# 5. Hidratar la base de datos con la matriz de stock inicial por tallas
python seed_tallas.py

# 6. Ejecutar el servidor en caliente con recarga automática
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 💻 Paso B: Inicialización y Despliegue del Frontend
```bash
# 1. Abrir una nueva terminal y posicionarse en el cliente web
cd frontend

# 2. Instalar los paquetes modulares de Node de forma limpia
npm install

# 3. Lanzar el servidor de desarrollo en caliente mediado por Vite
npm run dev
```
> 💡 *Nota de Red:* El cliente frontend se levantará por defecto en `http://localhost:5173`, el cual ya se encuentra autorizado en las reglas de middleware perimetral CORS del archivo `main.py` del servidor.

---

## 🧪 4. Ejecución del Pipeline de Pruebas Automáticas

Una vez que el backend se encuentre en ejecución activa en el puerto `8000`, puede lanzar la suite completa de control de calidad desde la raíz de este directorio utilizando Newman:

```bash
# Instalar el motor de pruebas vía CLI
npm install -g newman

# Ejecutar las 8 pruebas críticas secuenciales con delay preventivo
newman run specs/sneakerhub_collection.json --delay-request 50
```

---
*SneakerHub Ayacucho © 2026 - Documentación Técnica de Software de Alto Rendimiento.*