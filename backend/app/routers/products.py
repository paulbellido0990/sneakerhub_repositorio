from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models.product import Producto, VarianteColor, TallaStock, Marca, Categoria
from app.routers.auth import verificar_admin

router = APIRouter(
    prefix="/api/productos",
    tags=["Productos"]
)

# Esquema base para la creación de productos
class ProductoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio_base: float
    porcentaje_descuento: Optional[int] = 0
    precio_final: Optional[float] = None
    marca_id: int
    categoria_id: int
    tallas_iniciales: List[dict]

# =============================================================================
# 🌐 1. ENDPOINT PÚBLICO: BUSCAR / LISTAR FILTRADO
# =============================================================================
@router.get("/buscar", summary="Catálogo público filtrado por concurrencia")
def buscar_productos(
    q: Optional[str] = None,
    talla: Optional[str] = None,
    estado: Optional[str] = "ACTIVO",
    db: Session = Depends(get_db)
):
    query = db.query(Producto).options(
        joinedload(Producto.marca),
        joinedload(Producto.categoria),
        joinedload(Producto.variantes_color).joinedload(VarianteColor.imagenes),
        joinedload(Producto.variantes_color).joinedload(VarianteColor.tallares_stock)
    ).filter(Producto.estado == estado)

    if q:
        query = query.filter(Producto.nombre.ilike(f"%{q}%"))

    if talla:
        query = query.join(Producto.variantes_color) \
                     .join(VarianteColor.tallares_stock) \
                     .filter(TallaStock.talla == talla, TallaStock.stock > 0)

    return query.all()

# =============================================================================
# 🛡️ 2. ENDPOINT PROTEGIDO: CREAR NUEVA ZAPATILLA
# =============================================================================
@router.post("/", status_code=status.HTTP_201_CREATED, summary="Registrar zapatilla en el catálogo")
def crear_producto(
    payload: ProductoCreate, 
    db: Session = Depends(get_db), 
    admin: dict = Depends(verificar_admin)
):
    try:
        p_final = payload.precio_final or (payload.precio_base * (1 - (payload.porcentaje_descuento / 100)))

        nuevo_prod = Producto(
            nombre=payload.nombre,
            descripcion=payload.descripcion,
            precio_base=payload.precio_base,
            porcentaje_descuento=payload.porcentaje_descuento,
            precio_final=round(p_final, 2),
            marca_id=payload.marca_id,
            categoria_id=payload.categoria_id,
            estado="ACTIVO"
        )
        db.add(nuevo_prod)
        db.commit()
        db.refresh(nuevo_prod)

        nueva_variante = VarianteColor(producto_id=nuevo_prod.id, color_nombre="Estándar")
        db.add(nueva_variante)
        db.commit()
        db.refresh(nueva_variante)

        for item in payload.tallas_iniciales:
            talla_val = item.get("talla") or item.get("size")
            stock_val = item.get("nuevo_stock") or item.get("stock") or item.get("cantidad") or 0
            stock_talla = TallaStock(
                variante_color_id=nueva_variante.id,
                talla=str(talla_val),
                stock=int(stock_val)
            )
            db.add(stock_talla)
        
        db.commit()
        return {"status": "Éxito", "producto_id": nuevo_prod.id, "mensaje": "Zapatilla e inventario inicializados."}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error en la persistencia del producto: {str(e)}")

# =============================================================================
# 🛡️ 3. ENDPOINT PROTEGIDO: ACTUALIZAR STOCK (PROCESAMIENTO ITERATIVO DE ARRAYS)
# =============================================================================
@router.put("/{id}/stock")
@router.post("/{id}/stock")
async def editar_stock(
    id: int, 
    request: Request, 
    db: Session = Depends(get_db), 
    admin: dict = Depends(verificar_admin)
):
    """
    Recibe el payload crudo del cliente. Si es un elemento único o un array 
    de modificaciones de tallas, los unifica en un bucle iterable para guardarlos.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error formativo: El cuerpo enviado no es un JSON válido o está vacío."
        )

    # 🌟 ARQUITECTURA ELÁSTICA: Si es un dict único lo volvemos lista, si ya es una lista la dejamos pasar
    items_a_procesar = payload if isinstance(payload, list) else [payload]

    variante = db.query(VarianteColor).filter(VarianteColor.producto_id == id).first()
    if not variante:
        raise HTTPException(status_code=404, detail="No se encontró una variante de color para este producto.")

    registros_actualizados = 0

    # Procesamos de forma secuencial cada bloque de actualización del array
    for item in items_a_procesar:
        talla = item.get("talla") or item.get("size") or item.get("talla_id")
        
        cantidad_final = None
        for llave in ["nuevo_stock", "stock", "cantidad", "nuevoStock", "value"]:
            if llave in item and item[llave] is not None:
                cantidad_final = item[llave]
                break

        # Si viene un nodo vacío o incompleto en el array, lo saltamos de forma segura
        if not talla or cantidad_final is None:
            continue

        try:
            talla_str = str(talla)
            cantidad_int = int(cantidad_final)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error de tipado: Las unidades de stock o la talla no pudieron convertirse a valores válidos."
            )

        if cantidad_int < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inconsistencia: El volumen físico de existencias no puede ser un valor negativo."
            )

        # Buscamos el registro específico de la talla para el producto en MySQL
        registro_stock = db.query(TallaStock).filter(
            TallaStock.variante_color_id == variante.id,
            TallaStock.talla == talla_str
        ).first()

        if not registro_stock:
            # Creación en caliente si la talla no existía previamente en el catálogo
            registro_stock = TallaStock(
                variante_color_id=variante.id,
                talla=talla_str,
                stock=cantidad_int
            )
            db.add(registro_stock)
        else:
            # Modificación de las existencias físicas
            registro_stock.stock = cantidad_int
        
        registros_actualizados += 1

    # Confirmamos la transacción completa de forma segura
    db.commit()
    
    return {
        "status": "Éxito", 
        "mensaje": f"Se procesaron con éxito {registros_actualizados} modificaciones de inventario."
    }

# =============================================================================
# 🛡️ 4. ENDPOINT PROTEGIDO: ARCHIVAR / OCULTAR PRODUCTO (Borrado Lógico)
# =============================================================================
@router.delete("/{id}", summary="Ocultar zapatilla del feed público")
def ocultar_producto(
    id: int, 
    db: Session = Depends(get_db), 
    admin: dict = Depends(verificar_admin)
):
    producto = db.query(Producto).filter(Producto.id == id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="El modelo especificado no existe.")

    producto.estado = "INACTIVO"
    db.commit()
    return {"status": "Éxito", "mensaje": "El producto ha sido archivado y ocultado del catálogo."}

# =============================================================================
# 🛡️ 5. ENDPOINT PROTEGIDO: REACTIVAR PRODUCTO
# =============================================================================
@router.post("/{id}/activar", summary="Restaurar zapatilla al feed público")
def activar_producto(
    id: int, 
    db: Session = Depends(get_db), 
    admin: dict = Depends(verificar_admin)
):
    producto = db.query(Producto).filter(Producto.id == id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="El modelo especificado no existe.")

    producto.estado = "ACTIVO"
    db.commit()
    return {"status": "Éxito", "mensaje": "El producto vuelve a estar visible para los clientes."}