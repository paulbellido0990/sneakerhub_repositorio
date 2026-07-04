from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.product import Producto, VarianteColor, TallaStock, ImagenProducto

router = APIRouter(
    prefix="/api/productos",
    tags=["Productos"]
)

# =============================================================================
# SCHEMAS DE VALIDACIÓN (PYDANTIC)
# =============================================================================

class ProductCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio_base: float
    porcentaje_descuento: int = 0
    marca_id: int
    categoria_id: int

class ImagenCreate(BaseModel):
    url_imagen: str
    es_principal: bool = False

class TallaStockCreate(BaseModel):
    talla: str
    stock: int

class VarianteCreate(BaseModel):
    color_id: int
    imagenes: List[ImagenCreate]
    tallas_stock: List[TallaStockCreate]

class TallaStockUpdate(BaseModel):
    talla: str
    stock: int


# =============================================================================
# ENDPOINTS DEL MOTOR DE INVENTARIO
# =============================================================================

@router.get("/buscar", summary="Buscar y Filtrar Catálogo de Productos por Estado")
def buscar_productos(q: Optional[str] = None, talla: Optional[str] = None, estado: Optional[str] = "ACTIVO", db: Session = Depends(get_db)):
    """
    Retorna el catálogo público o archivado filtrando por Producto.estado ('ACTIVO' o 'INACTIVO').
    """
    # ESCUDO PERIMETRAL: Filtramos dinámicamente según lo solicitado por el administrador
    query = db.query(Producto).filter(Producto.estado == estado)

    if q:
        query = query.filter(Producto.nombre.ilike(f"%{q}%"))

    if talla:
        query = query.join(Producto.variantes_color)\
                     .join(VarianteColor.tallares_stock)\
                     .filter(TallaStock.talla == talla, TallaStock.stock > 0)

    productos = query.options(
        joinedload(Producto.marca),
        joinedload(Producto.categoria),
        joinedload(Producto.variantes_color).joinedload(VarianteColor.imagenes),
        joinedload(Producto.variantes_color).joinedload(VarianteColor.tallares_stock)
    ).all()

    return productos


@router.post("/", status_code=status.HTTP_201_CREATED, summary="Crear Cascarón Base de un Producto")
def crear_producto(payload: ProductCreate, db: Session = Depends(get_db)):
    try:
        nuevo_producto = Producto(
            nombre=payload.nombre,
            descripcion=payload.descripcion,
            precio_base=payload.precio_base,
            porcentaje_descuento=payload.porcentaje_descuento,
            marca_id=payload.marca_id,
            categoria_id=payload.categoria_id,
            estado="ACTIVO"  
        )
        db.add(nuevo_producto)
        db.commit()
        db.refresh(nuevo_producto)
        return {"status": "Éxito", "producto_id": nuevo_producto.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear el producto base: {str(e)}")


@router.post("/{producto_id}/variantes", status_code=status.HTTP_201_CREATED, summary="Inyectar Inventario y Fotos en Cascada")
def crear_variante_producto(producto_id: int, payload: VarianteCreate, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto base no encontrado.")

    try:
        nueva_variante = VarianteColor(producto_id=producto_id, color_id=payload.color_id)
        db.add(nueva_variante)
        db.commit()
        db.refresh(nueva_variante)

        for img in payload.imagenes:
            nueva_img = ImagenProducto(variante_color_id=nueva_variante.id, url_imagen=img.url_imagen, es_principal=img.es_principal)
            db.add(nueva_img)

        for t_stock in payload.tallas_stock:
            nuevo_stock = TallaStock(variante_color_id=nueva_variante.id, talla=t_stock.talla, stock=t_stock.stock)
            db.add(nuevo_stock)

        db.commit()
        return {"status": "Éxito", "mensaje": "Variantes, imágenes y stock sincronizados en cascada."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Fallo en cascada relacional: {str(e)}")


@router.put("/{producto_id}/stock", summary="Actualizar Inventario por Tallas (Bulk Update)")
def actualizar_stock_producto(producto_id: int, payload: List[TallaStockUpdate], db: Session = Depends(get_db)):
    variante = db.query(VarianteColor).filter(VarianteColor.producto_id == producto_id).first()
    if not variante:
        raise HTTPException(status_code=404, detail="Este calzado no cuenta con una variante de inventario inicializada.")

    try:
        for item in payload:
            registro_talla = db.query(TallaStock).filter(TallaStock.variante_color_id == variante.id, TallaStock.talla == item.talla).first()
            if registro_talla:
                registro_talla.stock = item.stock
            else:
                nuevo_stock = TallaStock(variante_color_id=variante.id, talla=item.talla, stock=item.stock)
                db.add(nuevo_stock)

        db.commit()
        return {"status": "Éxito", "mensaje": "Inventario actualizado correctamente en MySQL."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Fallo en la actualización de inventario: {str(e)}")


@router.delete("/{producto_id}", summary="Desactivar Producto (Borrado Lógico)")
def desactivar_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="El calzado especificado no existe.")

    try:
        producto.estado = "INACTIVO"
        db.commit()
        return {"status": "Éxito", "mensaje": f"El producto '{producto.nombre}' ha sido ocultado del catálogo."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"No se pudo desactivar el producto: {str(e)}")


@router.post("/{producto_id}/activar", summary="Reactivar Producto (Deshacer Borrado Lógico)")
def activar_producto(producto_id: int, db: Session = Depends(get_db)):
    """
    Cambia de forma segura el estado de un calzado de nuevo a 'ACTIVO' para restaurarlo en el catálogo.
    """
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="El calzado especificado no existe.")

    try:
        producto.estado = "ACTIVO"
        db.commit()
        return {"status": "Éxito", "mensaje": f"El producto '{producto.nombre}' vuelve a estar activo en el catálogo."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"No se pudo reactivar el producto: {str(e)}")