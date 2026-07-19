import os
import sys
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    # 1. Importamos la base de datos
    from app.database import SessionLocal, Base, engine
    
    # 2. Importamos los modelos de zapatillas (registra productos, variantes y tallas)
    from app.models.product import VarianteColor, TallaStock
    
    # 3. Importamos de forma segura las tablas restantes (usuarios y pedidos)
    try:
        import app.models.user
    except Exception as e:
        print(f"⚠️ Aviso al cargar modelos de usuario: {e}")
    
    try:
        import app.models.order
    except Exception as e:
        print(f"⚠️ Aviso al cargar modelos de orden: {e}")
    
    print("✅ Conexión con los modelos de SneakerHub establecida con éxito.")

    # 🛑 GUARDIÁN DE SEGURIDAD: Este script borra TODAS las tablas de la base de
    # datos activa. Si el DATABASE_URL apunta a Aiven (producción), se exige una
    # confirmación explícita mediante la variable de entorno CONFIRM_WIPE_AIVEN=si
    # para evitar un borrado accidental de datos reales de clientes.
    if "aivencloud" in str(engine.url) and os.getenv("CONFIRM_WIPE_AIVEN") != "si":
        print("🛑 BLOQUEADO: El DATABASE_URL activo apunta a Aiven (producción).")
        print("   Este script borraría TODAS las tablas de la base de datos real.")
        print("   Si estás absolutamente seguro de que quieres continuar, vuelve a")
        print("   ejecutar con la variable de entorno CONFIRM_WIPE_AIVEN=si")
        sys.exit(1)

    # 4. 🩹 PARCHE DE SEGURIDAD: Deduplicación de índices en memoria de SQLAlchemy
    print("🩹 Analizando y deduplicando índices en los metadatos de SQLAlchemy...")
    for table_name, table in Base.metadata.tables.items():
        seen_index_names = set()
        indexes_to_remove = []
        
        # Identificar índices duplicados por nombre
        for index in table.indexes:
            if index.name in seen_index_names:
                indexes_to_remove.append(index)
            else:
                seen_index_names.add(index.name)
        
        # Remover físicamente los duplicados de la lista en memoria de SQLAlchemy
        for index in indexes_to_remove:
            print(f"  🧹 Removiendo índice duplicado en memoria: '{index.name}' de la tabla '{table_name}'")
            table.indexes.remove(index)
            
    # 5. Operación Tabula Rasa (Limpieza absoluta con SQL Puro - 100% Efectivo)
    print("🧹 Iniciando limpieza profunda de residuos en la nube de Aiven...")
    with engine.connect() as connection:
        # Desactivar restricciones de claves foráneas temporalmente para evitar bloqueos
        connection.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        
        # Obtener todas las tablas existentes en la base de datos de Aiven
        result = connection.execute(text("SHOW TABLES;"))
        tables = [row[0] for row in result]
        
        # Eliminar cada tabla físicamente sin importar sus dependencias
        for table in tables:
            print(f"  🗑️ Eliminando tabla física: {table}")
            connection.execute(text(f"DROP TABLE IF EXISTS `{table}`;"))
        
        # Reactivar restricciones de integridad
        connection.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        connection.commit()
        
    print("✨ ¡Base de datos de Aiven completamente vaciada y limpia!")
    
    # 6. Sincronizamos las tablas físicas limpias desde cero
    print("🛠️ Sincronizando estructura de tablas limpia en la base de datos...")
    Base.metadata.create_all(bind=engine)
    print("✅ Estructura de tablas e integridad relacional creadas desde cero con éxito.")
    
except Exception as e:
    print(f"❌ Error durante la inicialización de base de datos: {e}")
    sys.exit(1)

def migrar_matriz_tallas():
    db = SessionLocal()
    tallas_nuevas = ["35", "36", "37"]
    registros_creados = 0

    try:
        variantes = db.query(VarianteColor).all()
        print(f"🔍 Analizando matriz de inventario para {len(variantes)} variantes en MySQL...")

        for variante in variantes:
            for talla in tallas_nuevas:
                existe = db.query(TallaStock).filter(
                    TallaStock.variante_color_id == variante.id,
                    TallaStock.talla == talla
                ).first()

                if not existe:
                    nuevo_registro = TallaStock(
                        variante_color_id=variante.id,
                        talla=talla,
                        stock=0
                    )
                    db.add(nuevo_registro)
                    registros_creados += 1

        if registros_creados > 0:
            db.commit()
            print(f"\n🚀 ¡MIGRACIÓN COMPLETADA CON ÉXITO!")
            print(f"📊 Se inyectaron {registros_creados} nuevos nodos de tallas (35, 36, 37) con stock inicial de 0 unidades.")
        else:
            print("\n✨ Matriz de inventario analizada. No se requirieron cambios de homologación adicionales.")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error crítico durante la actualización en MySQL: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    migrar_matriz_tallas()