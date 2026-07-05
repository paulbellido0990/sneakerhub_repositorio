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
# 📋 ESQUEMAS DE VALIDACIÓN (PYDANTIC)
# =============================================================================
class StockUpdate(BaseModel):
    talla: str
    nuevo_stock: int

class ProductoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio_base: float
    porcentaje_descuento: Optional[int] = 0
    precio_final: Optional[float] = None
    marca_id: int
    categoria_id: int
    tallas_iniciales: List[StockUpdate]  # Para inicializar stock al crear

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
    """
    Endpoint de libre acceso para clientes y administrador. 
    Realiza filtros dinámicos concurrentes sobre la base de datos de zapatillas.
    """
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
    admin: dict = Depends(verificar_admin) # 🔐 GUARDIÁN ACTIVADO
):
    """
    Inserta una nueva zapatilla en el motor relacional. Requiere token de Administrador.
    """
    try:
        # Calcular precio final dinámico si hay descuento
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

        # Crear una variante de color por defecto para albergar las tallas
        nueva_variante = VarianteColor(producto_id=nuevo_prod.id, color_nombre="Estándar")
        db.add(nueva_variante)
        db.commit()
        db.refresh(nueva_variante)

        # Inicializar el inventario de tallas enviado
        for item in payload.tallas_iniciales:
            stock_talla = TallaStock(
                variante_color_id=nueva_variante.id,
                talla=item.talla,
                stock=item.nuevo_stock
            )
            db.add(stock_talla)
        
        db.commit()
        return {"status": "Éxito", "producto_id": nuevo_prod.id, "mensaje": "Zapatilla e inventario inicializados."}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error en la persistencia del producto: {str(e)}")

# =============================================================================
# 🛡️ 3. ENDPOINT PROTEGIDO: ACTUALIZAR STOCK DE UNA TALLA
# =============================================================================
@router.post("/{id}/stock", summary="Modificar inventario físico de una variante")
def editar_stock(
    id: int, 
    payload: StockUpdate, 
    db: Session = Depends(get_db), 
    admin: dict = Depends(verificar_admin) # 🔐 GUARDIÁN ACTIVADO
):
    """
    Modifica directamente las unidades físicas disponibles en la tabla 'tallas_stock'.
    """
    variante = db.query(VarianteColor).filter(VarianteColor.producto_id == id).first()
    if not variante:
        raise HTTPException(status_code=404, detail="No se encontró una variante de color para este producto.")

    registro_stock = db.query(TallaStock).filter(
        TallaStock.variante_color_id == variante.id,
        TallaStock.talla == payload.talla
    ).first()

    if not registro_stock:
        # Si la talla no existía en la matriz, se crea el registro en caliente
        registro_stock = TallaStock(
            variante_color_id=variante.id,
            talla=payload.talla,
            stock=payload.nuevo_stock
        )
        db.add(registro_stock)
    else:
        registro_stock.stock = payload.nuevo_stock

    db.commit()
    return {"status": "Éxito", "mensaje": f"Stock de la talla {payload.talla} actualizado a {payload.nuevo_stock} unidades."}

# =============================================================================
# 🛡️ 4. ENDPOINT PROTEGIDO: ARCHIVAR / OCULTAR PRODUCTO (Borrado Lógico)
# =============================================================================
@router.delete("/{id}", summary="Ocultar zapatilla del feed público")
def ocultar_producto(
    id: int, 
    db: Session = Depends(get_db), 
    admin: dict = Depends(verificar_admin) # 🔐 GUARDIÁN ACTIVADO
):
    """
    Cambia el estado del calzado a 'INACTIVO' para que desaparezca del flujo del cliente.
    """
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
    admin: dict = Depends(verificar_admin) # 🔐 GUARDIÁN ACTIVADO
):
    """
    Devuelve un producto archivado al estado 'ACTIVO' para reincorporarlo a la vitrina.
    """
    producto = db.query(Producto).filter(Producto.id == id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="El modelo especificado no existe.")

    producto.estado = "ACTIVO"
    db.commit()
    return {"status": "Éxito", "mensaje": "El producto vuelve a estar visible para los clientes."}