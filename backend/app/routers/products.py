from fastapi import APIRouter, Depends, HTTPException, status
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

# =============================================================================
# 📋 ESQUEMAS DE VALIDACIÓN PYDANTIC
# =============================================================================
class ProductoCreate(BaseModel):
    nombre: str
    precio_base: float
    porcentaje_descuento: Optional[float] = 0.0
    descripcion: Optional[str] = None
    marca_id: Optional[int] = None
    categoria_id: Optional[int] = None


# =============================================================================
# 🔍 ENDPOINT: BUSCAR Y FILTRAR CATÁLOGO (ACTUALIZADO CON MAPEO MULTIMEDIA)
# =============================================================================
@router.get("/buscar", summary="Buscar productos con filtros de texto, talla y estado")
def buscar_productos(
    q: Optional[str] = None,
    talla: Optional[str] = None,
    estado: str = "ACTIVO",
    db: Session = Depends(get_db)
):
    """
    Realiza una consulta elástica sobre MySQL inyectando cargas profundas (joinedload)
    para traer las marcas, categorías, variantes, stock e imágenes en un solo viaje.
    """
    try:
        query = db.query(Producto).options(
            joinedload(Producto.marca),
            joinedload(Producto.categoria),
            joinedload(Producto.variantes_color).joinedload(VarianteColor.tallares_stock),
            # 🌟 SOLUCIÓN A LAS FOTOS: Trae la relación inversa de imágenes asociadas
            joinedload(Producto.variantes_color).joinedload(VarianteColor.imagenes) 
        ).filter(Producto.estado == estado.upper())

        if q:
            query = query.filter(Producto.nombre.like(f"%{q}%"))

        if talla:
            # Si se filtra por talla, cruzamos la matriz mapeando stock existente
            query = query.join(Producto.variantes_color)\
                         .join(VarianteColor.tallares_stock)\
                         .filter(TallaStock.talla == talla, TallaStock.stock > 0)

        return query.all()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fallo en el motor analítico de búsqueda: {str(e)}"
        )


# =============================================================================
# ➕ ENDPOINT: REGISTRAR NUEVA ZAPATILLA (ADMIN)
# =============================================================================
@router.post("/", status_code=status.HTTP_201_CREATED, summary="Añadir calzado al catálogo")
def crear_producto(
    payload: ProductoCreate, 
    db: Session = Depends(get_db),
    admin_actual = Depends(verificar_admin)
):
    try:
        nuevo_producto = Producto(
            nombre=payload.nombre,
            precio_base=payload.precio_base,
            porcentaje_descuento=payload.porcentaje_descuento,
            descripcion=payload.descripcion,
            marca_id=payload.marca_id,
            categoria_id=payload.categoria_id,
            estado="ACTIVO"
        )
        db.add(nuevo_producto)
        db.commit()
        db.refresh(nuevo_producto)
        return nuevo_producto
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo asentar el producto en MySQL: {str(e)}"
        )


# =============================================================================
# ✏️ ENDPOINT PROTEGIDO (HU-15): ACTUALIZACIÓN COMPLETA DE PRODUCTO (ADMIN)
# =============================================================================
@router.put("/{producto_id}", summary="Modificar ficha técnica y precios de un calzado")
def actualizar_producto(
    producto_id: int,
    payload: ProductoCreate,
    db: Session = Depends(get_db),
    admin_actual = Depends(verificar_admin)
):
    """
    Busca de forma atómica el ID del calzado seleccionado y sobreescribe sus
    atributos comerciales, forzando la sincronización inmediata en MySQL.
    """
    try:
        producto = db.query(Producto).filter(Producto.id == producto_id).first()
        
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"El calzado con ID #{producto_id} no se encuentra registrado en el sistema."
            )

        # Mutación de atributos mapeados
        producto.nombre = payload.nombre
        producto.precio_base = payload.precio_base
        producto.porcentaje_descuento = payload.porcentaje_descuento
        producto.descripcion = payload.descripcion
        producto.marca_id = payload.marca_id
        producto.categoria_id = payload.categoria_id

        db.commit()
        db.refresh(producto)
        
        return {
            "status": "Éxito",
            "producto_id": producto.id,
            "mensaje": "Ficha técnica del calzado actualizada correctamente en la base de datos."
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fallo crítico en el motor transaccional al editar producto: {str(e)}"
        )


# =============================================================================
# 🗄️ ENDPOINT: OCULTAR/ARCHIVAR PRODUCTO (SOFT DELETE)
# =============================================================================
@router.delete("/{producto_id}", summary="Cambiar estado de zapatilla a INACTIVO")
def ocultar_producto(
    producto_id: int, 
    db: Session = Depends(get_db),
    admin_actual = Depends(verificar_admin)
):
    try:
        producto = db.query(Producto).filter(Producto.id == producto_id).first()
        if not producto:
            raise HTTPException(status_code=404, detail="Calzado no encontrado.")
        
        producto.estado = "INACTIVO"
        db.commit()
        return {"status": "Éxito", "mensaje": "Zapatilla retirada de la vitrina pública con éxito."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# 👀 ENDPOINT: ACTIVAR/DESARCHIVAR PRODUCTO
# =============================================================================
@router.post("/{producto_id}/activar", summary="Cambiar estado de zapatilla a ACTIVO")
def activar_producto(
    producto_id: int, 
    db: Session = Depends(get_db),
    admin_actual = Depends(verificar_admin)
):
    try:
        producto = db.query(Producto).filter(Producto.id == producto_id).first()
        if not producto:
            raise HTTPException(status_code=404, detail="Calzado no encontrado.")
        
        producto.estado = "ACTIVO"
        db.commit()
        return {"status": "Éxito", "mensaje": "Zapatilla activada y desplegada nuevamente en la vitrina."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))