from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

# Importaciones de tu arquitectura base
from app.database import get_db
from app.models.product import Producto # Asegúrate de que VarianteColor, ImagenProducto y TallaStock se importen si están en subarchivos
# Nota: Si tus modelos de variantes están en app.models.product, SQLAlchemy los leerá directo de las relaciones.

router = APIRouter(prefix="/api/productos", tags=["Módulo del Catálogo Público"])

# =============================================================================
# ESQUEMAS DE VALIDACIÓN (PYDANTIC)
# =============================================================================
class ProductoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio_base: float
    porcentaje_descuento: Optional[int] = 0
    marca_id: int
    categoria_id: int

# Novedad: Esquemas para la inserción relacional en cascada
class ImagenCreate(BaseModel):
    url_imagen: str
    es_principal: Optional[bool] = False

class TallaStockCreate(BaseModel):
    talla: str
    stock: int

class VarianteColorCreate(BaseModel):
    color_id: int
    imagenes: List[ImagenCreate]
    tallas_stock: List[TallaStockCreate]

# =============================================================================
# SERIALIZADOR RELACIONAL
# =============================================================================
def mapear_producto_a_json(p: Producto):
    variantes_list = []
    if hasattr(p, "variantes_color") and p.variantes_color:
        for v in p.variantes_color:
            imgs = []
            if hasattr(v, "imagenes") and v.imagenes:
                for img in v.imagenes:
                    imgs.append({
                        "id": getattr(img, "id", None),
                        "url_imagen": getattr(img, "url_imagen", ""),
                        "es_principal": getattr(img, "es_principal", False)
                    })
            
            tallas = []
            if hasattr(v, "tallares_stock") and v.tallares_stock:
                for ts in v.tallares_stock:
                    tallas.append({
                        "id": getattr(ts, "id", None),
                        "talla": getattr(ts, "talla", ""),
                        "stock": getattr(ts, "stock", 0)
                    })
            
            variantes_list.append({
                "id": v.id,
                "color_id": getattr(v, "color_id", None),
                "imagenes": imgs,
                "tallares_stock": tallas
            })

    return {
        "id": p.id,
        "nombre": p.nombre,
        "descripcion": p.descripcion,
        "precio_base": float(p.precio_base),
        "porcentaje_descuento": p.porcentaje_descuento,
        "precio_final": p.precio_final,
        "estado": p.estado,
        "marca": {"id": p.marca_id, "nombre": p.marca.nombre if p.marca else "Sin Marca"},
        "categoria": {"id": p.categoria_id, "nombre": p.categoria.nombre if p.categoria else "Sin Categoría"},
        "variantes_color": variantes_list
    }

# =============================================================================
# ENDPOINTS EXISTENTES
# =============================================================================

@router.get("/", summary="Listar Catalogo General")
def listar_productos(db: Session = Depends(get_db)):
    productos = db.query(Producto).all()
    return [mapear_producto_a_json(p) for p in productos]

@router.get("/buscar", summary="Buscador Y Filtros Concurrentes")
def buscar_productos(q: Optional[str] = None, talla: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Producto)
    if q:
        query = query.filter(Producto.nombre.ilike(f"%{q}%"))
    productos = query.all()
    return [mapear_producto_a_json(p) for p in productos]

@router.post("/", status_code=status.HTTP_201_CREATED, summary="Registrar Nueva Zapatilla")
def crear_producto(payload: ProductoCreate, db: Session = Depends(get_db), admin_actual: dict = Depends(get_db)): # Ajustado a tu dependencia real
    try:
        nuevo_producto = Producto(
            nombre=payload.nombre,
            descripcion=payload.descripcion,
            precio_base=payload.precio_base,
            porcentaje_descuento=payload.porcentaje_descuento,
            marca_id=payload.marca_id,
            categoria_id=payload.categoria_id
        )
        db.add(nuevo_producto)
        db.commit()
        db.refresh(nuevo_producto)
        return {"status": "Éxito", "mensaje": "Zapatilla añadida correctamente.", "producto_id": nuevo_producto.id}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"detail": f"Error: {str(e)}"})

# =============================================================================
# 🔐 NUEVO ENDPOINT PROTEGIDO: ASIGNAR INVENTARIO (COLOR, IMÁGENES Y TALLAS)
# =============================================================================
@router.post("/{producto_id}/variantes", status_code=status.HTTP_201_CREATED, summary="Asignar Stock e Imágenes a un Producto")
def registrar_variante_producto(
    producto_id: int,
    payload: VarianteColorCreate,
    db: Session = Depends(get_db)
):
    """
    Inyecta una variante de color, sus URLs de fotos y la matriz de stock por tallas
    en una sola transacción relacional atómica.
    """
    # 1. Verificar existencia del producto base
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="El calzado base especificado no existe.")

    try:
        # Importación dinámica de los modelos hijos para evitar colisiones circulares
        from app.models.product import VarianteColor, ImagenProducto, TallaStock
        
        # 2. Crear la variante de color central
        nueva_variante = VarianteColor(
            producto_id=producto_id,
            color_id=payload.color_id
        )
        db.add(nueva_variante)
        db.flush() # Mantiene la transacción abierta y genera el ID de la variante temporalmente

        # 3. Registrar lote de imágenes asociadas
        for img in payload.imagenes:
            nueva_foto = ImagenProducto(
                variante_color_id=nueva_variante.id,
                url_imagen=img.url_imagen,
                es_principal=img.es_principal
            )
            db.add(nueva_foto)

        # 4. Registrar lote de tallas y stock real
        for ts in payload.tallas_stock:
            nuevo_stock = TallaStock(
                variante_color_id=nueva_variante.id,
                talla=ts.talla,
                stock=ts.stock
            )
            db.add(nuevo_stock)

        # 5. Confirmar persistencia unificada en MySQL
        db.commit()
        
        return {
            "status": "Éxito",
            "mensaje": f"Inventario y galería asignados correctamente a la variante del producto ID {producto_id}."
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Fallo en cascada relacional: {str(e)}"
        )

# =============================================================================
# ESQUEMA PARA ACTUALIZACIÓN DE STOCK
# =============================================================================
class TallaStockUpdate(BaseModel):
    talla: str
    stock: int

# =============================================================================
# 🔐 ENDPOINT: ACTUALIZAR INVENTARIO DE UN PRODUCTO EXISTENTE
# =============================================================================
@router.put("/{producto_id}/stock", summary="Actualizar Inventario por Tallas")
def actualizar_stock_producto(
    producto_id: int,
    payload: List[TallaStockUpdate],
    db: Session = Depends(get_db)
):
    """
    Modifica el stock existente o añade nuevas tallas a la primera variante 
    activa del calzado especificado en MySQL.
    """
    from app.models.product import VarianteColor, TallaStock

    # 1. Ubicar la variante operativa del calzado
    variante = db.query(VarianteColor).filter(VarianteColor.producto_id == producto_id).first()
    if not variante:
        raise HTTPException(
            status_code=404, 
            detail="Este calzado no cuenta con una variante de inventario inicializada."
        )

    try:
        # 2. Iterar la matriz enviada desde React
        for item in payload:
            registro_talla = db.query(TallaStock).filter(
                TallaStock.variante_color_id == variante.id,
                TallaStock.talla == item.talla
            ).first()

            if registro_talla:
                # Si la talla ya existe, se sobrescribe su stock
                registro_talla.stock = item.stock
            else:
                # Si es una talla nueva que no estaba en el lote original, se crea
                nuevo_stock = TallaStock(
                    variante_color_id=variante.id,
                    talla=item.talla,
                    stock=item.stock
                )
                db.add(nuevo_stock)

        db.commit()
        return {"status": "Éxito", "mensaje": "Inventario actualizado correctamente en MySQL."}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Fallo en la actualización de inventario: {str(e)}"
        )